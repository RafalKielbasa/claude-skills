# plik-z-ksztaltem-sekretu-w-katalogu-wypychanym-przez-backup

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Sonda albo fixture z ciągiem w kształcie sekretu (klucz AWS `AKIA…`, `sk_live_…`, `ghp_…`)
zapisana w `~/.claude` trafia przy najbliższej synchronizacji backupu do commita i na GitHuba
(`RafalKielbasa/claude-skills`). Push protection może wtedy zablokować cały backup, a zmyślony
klucz zostaje w historii publicznego albo prywatnego repo.

## Przyczyna źródłowa
`~/.claude` nie jest zwykłym katalogiem roboczym: zadanie backupu co ok. 30 minut commituje
i wypycha wszystko, co się zmieniło, także pliki tymczasowe i stany w połowie pracy. Reguła
„nie commituję” w tym repo nie chroni przed niczym, bo commit robi automat, nie sesja.

## Dowody
- 2026-11-12, sesja 70c314dd-32d0-4c65-ac33-357c06802095 (id claude.ai niedostępny): sonda
  Semgrepa (zadanie 0 planu `code-review-master-extra-finders-plan-1`) zapisana jako
  `~/.claude/skills/code-review-master/test/fixtures/semgrep-probe/leak.js` z trzema zmyślonymi
  kluczami. Usunięta kilka minut później, gdy `git remote -v` pokazał `claude-skills` na GitHubie;
  testy składają te linie z kawałków. Backup tego dnia commitował o 15:01, 15:23 i 15:54 — po
  usunięciu, więc sonda się nie wymknęła (sprawdzone `git log -p | grep` po fragmentach kluczy).
  Te same trzy commity wypchnęły za to częściowe stany kodu skilla w trakcie wykonania planu.

## Rozwiązanie
Sondy i pliki z danymi w kształcie sekretów twórz w scratchpadzie sesji, nigdy pod `~/.claude`.
W testach pod `~/.claude` buduj takie ciągi konkatenacją (`'AKIA' + '…'`), żeby literał nie
istniał w żadnym pliku. Zanim zaczniesz dłuższą pracę w `~/.claude`, zakładaj, że każdy stan
pośredni znajdzie się na GitHubie w ciągu pół godziny.
