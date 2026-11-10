# przekierowanie-github-ukrywa-nieaktualne-odwolanie-do-repo

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Konsumenci (workflowy n8n, dokumenty z konwencjami, lokalny `origin`) odwołują się do repo
GitHuba po starej nazwie. Po zmianie nazwy nic nie pada: git i API po cichu przekierowują na
repo przemianowane, więc konsument latami pisze i czyta w innym repo, niż zakłada jego autor.

## Przyczyna źródłowa
GitHub trzyma starą nazwę jako przekierowanie dla gita i REST API, dopóki nikt nie zajmie tej
nazwy. Nieaktualne odwołanie zachowuje się więc dokładnie jak aktualne — nie ma błędu, który
kazałby je poprawić. Odwrotnie przy zajęciu nazwy: wszyscy konsumenci przeskakują na nowe repo
w tej samej sekundzie, bez żadnej zmiany po ich stronie.

## Dowody
- 2026-10-05/07, sesja c653066f-3e46-4d11-8f8b-71a5c9d865a7 (lokalny UUID, link claude.ai
  niedostępny): `gh api repos/devstock-org/devstock-team` zwracało
  `devstock-org/devstock-team-knowledge-base`. Workflowy n8n `14`–`17`, `29`, `32` i
  `docs/ticket-conventions.md` miały wpisane `devstock-org/devstock-team`, więc issues z agenta
  zadań lądowały w repo bazy wiedzy (11 otwartych testowych duplikatów), a raport tygodniowy `29`
  czytał 19 issues zamiast 497 z repo z tablicą. Wyszło dopiero przy planowaniu scalenia repo,
  przez grep po eksportach. Po zmianie nazwy `core-team` → `devstock-team` te same odwołania
  zaczęły wskazywać scalone repo bez żadnej edycji.
- 2026-11-10, sesja 2755dabd-6161-454c-a435-d571c7e46f91 (id claude.ai niedostępny; PR-y DT-92/DT-93):
  `gh pr create --repo Devstock-Academy/code-busters-v2` założył PR w `kodozercy/code-busters`
  (#1742), a push przeszedł na stary adres `origin`. Rejestr repo w `CLAUDE.md` „Bazy wiedzy” i
  lokalny `origin` w `code-busters-v2` dalej mówią `Devstock-Academy/code-busters-v2`. Zauważone
  tylko dlatego, że `gh` zwrócił URL nowego repo; żadna komenda nie padła.
- 2026-11-10, sesja 66df8097-5d05-43de-91f6-b84bd9bfc361 (id claude.ai niedostępny; Baza wiedzy + code-busters-v2, DT-101 #852): `git push` na `origin` = `Devstock-Academy/code-busters-v2` odpowiedział, że repo
  przeniesiono do `kodozercy/code-busters`, a `gh pr create` dał `https://github.com/kodozercy/code-busters/pull/1744`.
  Rejestr repo w `CLAUDE.md` „Bazy wiedzy” i lokalny `origin` dalej na starej nazwie; zgłoszone Rafałowi, nic nie
  zmieniane.

## Rozwiązanie
Przy każdej zmianie nazwy albo przenosinach repo: `gh api repos/<owner>/<stara-nazwa> --jq
.full_name` i grep po wszystkich konsumentach (eksporty n8n, `.env`, dokumenty konwencji, CLI)
za starą nazwą — lista trafień idzie do raportu jako „wskazuje dziś na X". Przed zajęciem nazwy,
która jest przekierowaniem, wypisz konsumentów i powiedz, co każdy zacznie czytać lub pisać po
zmianie.
