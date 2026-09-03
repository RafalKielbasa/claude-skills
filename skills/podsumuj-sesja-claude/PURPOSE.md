# PURPOSE — podsumuj-sesja-claude

## Pochodzenie

Skill leży w `~/.claude/skills/`, poza żadnym repozytorium git, więc jego geneza nie ma bezpośredniego śladu w commitach, a data utworzenia jest nieustalona (`?`). Mechanizm markera `<!-- podsumuj-sesja-claude: <ścieżka> -->` z pierwotnego Kroku 1 był aktywnie używany co najmniej 2026-08-14 — wpis w `praca-z-claude.md` opisuje plik `CLAUDE.local.md` w projekcie saas app zawierający ten marker, z którego skill czytał ścieżkę briefu (`praca-z-claude.md`, wpis 2026-08-14). Dziennik z 2026-08-20 dokumentuje, że mechanizm markera już wtedy zawodził — plik z markerem zniknął z repo, ścieżkę briefu trzeba było odtworzyć ręcznie, a wpis odnotowuje rekomendację „warto marker przywrócić" (`praca-z-claude.md`, wpis 2026-08-20); to możliwe tło późniejszej decyzji o porzuceniu mechanizmu markera na rzecz stałej ścieżki, choć samo powiązanie przyczynowe nie jest w żadnym źródle potwierdzone wprost. Aktualna sekcja „Podsumowania sesji" w `C:\Users\rafal\.claude\CLAUDE.md` nadpisuje Krok 1 skilla: ścieżka dziennika jest ustalona na sztywno na `D:\Notatki\notatki\praca-z-claude.md`, a skill ma nie szukać markera — data wprowadzenia tej zmiany jest nieustalona (`?`). 2026-09-02 skill dostał nowy Krok 5 („Wiki Maintainer"), konsolidujący doświadczenie sesji we wzorce w `.claude/wiki/`, w ramach wdrożenia warstwy wiki opisanej w specu WikiSkill (`.claude/specs/2026-09-02-wikiskill-design.md`). Najstarszy zachowany wpis w `praca-z-claude.md` ma datę 2026-08-12, ale nie jest to wiarygodna dolna granica wieku skilla — sesja z 2026-09-03 dokumentuje ręczne przycięcie dziennika („111 linii martwej treści wycięte"), więc wcześniejsze wpisy mogły zostać usunięte (`praca-z-claude.md`, wpis 2026-09-03).

## Adresowane wzorce

- brak — skill sprzed wiki

## Historia ewolucji

- ? — utworzenie skilla: brief datowany na szczycie wspólnego pliku, ustalanie ścieżki przez marker (Krok 1 pierwotny), zbiórka twardego stanu z narzędzi (Krok 2), szablon wpisu (Krok 3), dopisywanie na górze pliku (Krok 4) — powód: nieustalony — wynik: wprowadzona ręcznie — źródło: ? (istnienie mechanizmu markera potwierdzone w `praca-z-claude.md`, wpisy 2026-08-14 i 2026-08-20)
- ? — nadpisanie Kroku 1 skilla: ścieżka dziennika w `C:\Users\rafal\.claude\CLAUDE.md` (sekcja „Podsumowania sesji") ustalona na sztywno na `D:\Notatki\notatki\praca-z-claude.md`, bez szukania markera `<!-- podsumuj-sesja-claude: … -->` — powód: nieustalony — wynik: wprowadzona ręcznie — źródło: `C:\Users\rafal\.claude\CLAUDE.md` (sekcja „Podsumowania sesji")
- 2026-09-02 — dodany Krok 5 (Wiki Maintainer) — powód: wdrożenie warstwy wiki z artykułu WikiSkill — wynik: wprowadzona ręcznie — źródło: `.claude/specs/2026-09-02-wikiskill-design.md`
- 2026-09-03 — Krok 4 doprecyzowany: „góra pliku" to miejsce pod nagłówkiem `# Praca z Claude — dziennik sesji`, a sekcje nad nim zostają nietknięte — powód: nad dziennikiem stanęła tabela pomysłów (`D:\Notatki\notatki\praca-z-claude.md`), a dotychczasowe brzmienie pozwalało wstawić wpis przed nią — wynik: wprowadzona ręcznie na prośbę użytkownika — źródło: sesja 2026-09-03 (`https://claude.ai/code/session_01TR43bKGaUWASqCrAsDE6GT`)
