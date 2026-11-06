# repo-claude-commituje-backup-nie-sesja

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Traktuję `~/.claude` jak zwykłe repo z trybem „zmiany czekają na słowo Rafała”. Ręczny commit omija
skaner sekretów, którym backup bramkuje każdy swój commit. Zmiana zostawiona „do Twojej decyzji” też
nie czeka, bo backup zgarnia ją sam i wypycha pod ogólnym opisem.

## Przyczyna źródłowa
Model commitów tego repo stoi tylko w nagłówku `hooks/backup-claude.ps1:5-9`, którego sesja nie czyta.
Skrypt jest hookiem `SessionEnd`: pomija `/clear` i sesje z katalogów huba i sond (`backups/sync.log`,
wpisy `skip:`), a poza nimi robi `git add -A` (`:263`), commit `backup: sync .claude config…` (`:306`)
i push, z przerwą co najmniej 10 minut między synchronizacjami.
Nagłówek wymaga, żeby ręczny commit przepuścił pliki przez `Test-SecretContent`, ale nie wymusza tego
żaden hook gita ani `CLAUDE.md`, a globalna reguła mówi tylko „nie commituję” i „nie pushuję”.

## Dowody
- 2026-11-06, sesja 2e20e7fb-3051-4c0d-899a-41666a866e98 (id claude.ai niedostępny; repo `.claude`,
  status line): `e6a141c` zrobiony i wypchnięty na „commit i push na main” bez `Test-SecretContent`.
  Pierwsze wystąpienie tej nazwy w transkrypcie pochodzi z podsumowania sesji, dwie godziny po
  pushu. Skan po fakcie obu plików tego commita: `clean`, więc skutku nie było. Ten sam raport
  mówił o kolejnych zmianach „czekam na Twoje słowo”, choć pierwsze zakończenie sesji spoza huba i
  sond zgarnęłoby je z cudzymi plikami i wypchnęło. Mój raport napisał najpierw „dowolnej sesji”, co
  obalił `sync.log`: od 10:08 do 12:43 same `skip:`, a żadnego commita.

## Rozwiązanie
Przed ręcznym commitem w `~/.claude` zaimportuj `hooks/lib/ClaudeBackup.psm1` i uruchom
`Test-SecretContent -Path <plik>` dla każdego pliku w commicie; wynik inny niż `$null` zatrzymuje
commit. W raporcie o zmianach w tym repo nie pisz, że czekają: napisz, że pierwsze zakończenie sesji
spoza huba i sond zgarnie je i wypchnie jako `backup: sync…`, więc własny opis wymaga commita przed
nim. Kiedy backup naprawdę ostatnio działał, sprawdź w `backups/sync.log`.
