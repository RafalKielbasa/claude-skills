---
name: ask-user-question-limity
description: "Limity okna AskUserQuestion w Claude Code 2.1.318 — podgląd ponad 2000 znaków w ogóle się nie wyświetla, widoczna wysokość to wiersze terminala − 26, układ z podglądem nie ma wiersza „Other”; prototyp moda gate-card z 2026-11-05."
metadata:
  node_type: memory
  type: reference
  originSessionId: 05cd1083-1752-4e44-808a-51df4eaeaca2
  modified: 2026-11-05T19:32:37.008Z
---

Sprawdzone 2026-11-05 w `claude.exe` 2.1.318 (bramka notatki `/spotkanie`, sesja `4e6952d2`):

- Podgląd opcji powyżej 2000 znaków jest wycofywany w całości; zamiast niego widać „(preview cannot be shown in full — compare the option labels and descriptions instead)”. Notatka 5412 znaków nie była widoczna wcale, mimo że pytanie twierdziło „Cała treść jest w podglądzie”.
- Kod liczy `Math.max(1, rows-26-…)`; zakładam, że to limit linii podglądu, bo zgadza się ze zrzutem (1 linia). Karta z 18 liniami wymaga ponad 44 wierszy terminala. Szerokość to kolumny − 34.
- Układ z podglądem nie ma wiersza „Other”: są notatka na opcji (`n`) i „Chat about this”. Bez podglądu „Other” wraca.
- `askUserQuestionTimeout` w `~/.claude/settings.json:118` miał `60s` (stąd „No response after 60s” przy czytaniu kart); od 2026-11-05 `10m` na słowo Rafała (dozwolone też `5m`, `never`).
- Pierwszy test panelu w terminalu (2026-11-05, karta 95 linii) jest niepewny: odpowiedzi „za niski, kółko nie przewija” mogły dotyczyć okna pytania, nie panelu; nie wiadomo jeszcze, czy panel się rysuje.

**Jak stosować:** całej notatki nie wkładaj do podglądu, tylko otwórz ją w edytorze i daj streszczenie (`docs/spotkania-kolejki.md`, „The gate”). Mod nie powiększy okna (`ui.render` na `AskUserQuestion`: do 12 wierszy nad pytaniem, bez Markdown w terminalu), ale może pokazać kartę w panelu.

Prototyp panelu: mod `gate-card` w `~/.claude/dev-mods/05cd1083-1752-4e44-808a-51df4eaeaca2/gate-card/`, działa tylko w tej sesji, dopóki nie zostanie zainstalowany jako wtyczka. Zob. [[karta-bramki-w-pytaniu]].
