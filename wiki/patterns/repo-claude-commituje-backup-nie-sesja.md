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
- 2026-11-18, sesja 51ae2c74-bb8c-4589-a22e-43752eafb286 (id claude.ai niedostępny; vault, zmiany
  `code-review-master` w `~/.claude`): backup zgarnął i wypchnął zmiany skilla trzy razy w trakcie
  pracy (`8b43bbe`, `90da2c2`, `20c08c8`), zanim Rafał je przejrzał; raporty podawały hash backupu
  i zakres diffu, a nie „czekają na review” — dzięki notatce w pamięci projektu zapisanej w tej
  sesji, nie dzięki tej stronie. Na „Add commit i push na RafalKielbasa/claude-skills” zrobiłem
  `f03445c` i push bez `Test-SecretContent` (cudzy `skills/github-tickets/references/self-check.md`
  poprawnie pominięty). Tę stronę przeczytałem dopiero w podsumowaniu; skan po fakcie 8/8 `clean`.
  Drugi raz ten sam przebieg: ręczny commit bez skanu, wyłapany po pushu.

## Rozwiązanie
Przed ręcznym commitem w `~/.claude` zaimportuj `hooks/lib/ClaudeBackup.psm1` i uruchom
`Test-SecretContent -Path <plik>` dla każdego pliku w commicie; wynik inny niż `$null` zatrzymuje
commit. W raporcie o zmianach w tym repo nie pisz, że czekają: napisz, że pierwsze zakończenie sesji
spoza huba i sond zgarnie je i wypchnie jako `backup: sync…`, więc własny opis wymaga commita przed
nim. Kiedy backup naprawdę ostatnio działał, sprawdź w `backups/sync.log`.
