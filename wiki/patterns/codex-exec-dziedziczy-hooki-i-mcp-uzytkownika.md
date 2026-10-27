# codex-exec-dziedziczy-hooki-i-mcp-uzytkownika

- **Skill:** ogólny (dotyczy reguły „Plany implementacyjne" w `~/.claude/CLAUDE.md` i skilla `hub`)
- **Typ:** porażka
- **Status:** otwarty

## Opis
`codex exec` uruchamiany przez Claude (review planu, konsultacja huba) to pełna sesja Codexa
z konfiguracją Rafała. Hook `SessionStart` `powtorki-check.ps1` dokleja przypomnienie o powtórkach
i pierwsza odpowiedź jest o powtórkach zamiast o pytaniu. Hook `SessionEnd` uruchamia
`backup-claude.ps1` (do 120 s) po każdym wywołaniu, a serwery MCP (Figma, n8n) startują i sypią
błędami do stderr.

## Przyczyna źródłowa
`codex exec` ładuje `~/.codex/hooks.json` i `[mcp_servers.*]` z `~/.codex/config.toml` tak samo
jak sesja interaktywna. `SessionStart` odpala przy nowym wątku; follow-up `codex exec resume` go nie
odpala, dlatego psuje się tylko pierwsza odpowiedź.

## Dowody
- 2026-10-16, sesja c51a0755-8b46-4b7b-bca0-4c9d99ee48bd (id claude.ai niedostępny; vault,
  akceptacja Planu 3 huba, krok 7): `answer-1.md` = „Masz 5 zaległych powtórek — robimy je teraz?";
  `powtorki-last-check.txt` dostał czas wywołania (04:55Z); `answer-1.err` z błędami `rmcp` dla
  Figmy i `localhost:5678`. Ten sam dzień, po poprawce: z `-c features.hooks=false
  -c features.plugins=false -c features.apps=false -c mcp_servers.n8n.enabled=false
  -c mcp_servers.node_repl.enabled=false` pierwsze wywołanie i follow-up odpowiedziały „ONE"/„TWO",
  zero linii `rmcp`, plik stanu hooka nietknięty; review Planu 4 przez Codexa z tymi flagami czyste.
  `-c mcp_servers."x".enabled=false` (nazwa w cudzysłowie) wywraca całe wywołanie:
  `Error loading config.toml: invalid transport`.
- 2026-10-26, sesja 2be43b78-0126-44ba-97e1-4c5eaa736bf3 (id claude.ai niedostępny; Baza wiedzy, review
  planów W2 i M2 migracji Kodożerców): komenda z przykładu w `~/.claude/CLAUDE.md`
  (`codex exec --sandbox read-only "…pliki…"`, bez flag z Rozwiązania) dała `hook: SessionStart Failed`,
  błędy `rmcp` dla Figmy i `localhost:5678`, a każde wywołanie PowerShella w sandboxie zawisło, także
  `cmd /c echo ok`; Codex odpowiedział „Nie mogę rzetelnie wykonać review … środowisko nie pozwoliło
  odczytać wskazanych plików”. Obejście: `cat plan spec inwentarz | codex exec --sandbox read-only
  "…dokumenty na standardowym wejściu, nie czytaj plików z dysku…"` — dwa takie wywołania dały
  pełne review (20 i 9 uwag). Nie sprawdzone, czy zawieszenie powłoki znika z flagami z Rozwiązania.

## Rozwiązanie
Każde `codex exec` (i `codex exec resume`) uruchamiane przez Claude dostaje
`-c features.hooks=false -c features.plugins=false -c features.apps=false` oraz
`-c mcp_servers.<nazwa>.enabled=false` dla każdej tabeli `[mcp_servers.<nazwa>]`
z `~/.codex/config.toml` (dziś `n8n` i `node_repl`). Nazwa idzie bez cudzysłowów: nazwę
w cudzysłowie zdejmij do gołego klucza, a gdy nie jest gołym kluczem, pomiń. Hub robi to od Planu 4
w kodzie; przykład komendy review w `~/.claude/CLAUDE.md` tych flag jeszcze nie ma. Review dokumentów
(plan, spec, inwentarz) podawaj Codexowi na standardowym wejściu (`cat … | codex exec … "dokumenty na
stdin, nie czytaj plików"`): nie zależy wtedy od powłoki w sandboxie, która potrafi zawisnąć.
