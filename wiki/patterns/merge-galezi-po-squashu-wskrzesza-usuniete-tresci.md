# merge-galezi-po-squashu-wskrzesza-usuniete-tresci

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Gałąź, której wcześniejsza część weszła już do `main` jako squash, mergowana później w całości
daje konflikty w części już wniesionej, a co gorsza — czyste auto-merge, które przywracają treści
usunięte na `main` po squashu albo dublują treści, które `main` przeniósł. Git nie zgłasza tu
niczego: plik nie ma konfliktu, a wynik jest regresją.

## Przyczyna źródłowa
Squash zrywa ancestry: baza merge'u to punkt rozgałęzienia sprzed squasha, więc dla gita
„`main` usunął sekcję" wygląda jak „`main` nie ruszał tego miejsca od bazy", a „gałąź dodała
sekcję" — jak zmiana do przyjęcia. Trójstronny merge stosuje zmianę gałęzi; sprawdzanie samych
konfliktów nie wystarcza.

## Dowody
- 2026-10-08, sesja claude.ai/code/session_01PEmJYYAK5hBJGhZ3cKxfgs: merge
  `feature/tor-stacjonarny` do `main` w repo Baza wiedzy; tor stacjonarny (26 commitów gałęzi) był
  już na `main` jako squash `1d2a8de1` (#32). 19 konfliktów (wszystkie: `main` ⊇ gałąź) plus dwa
  czyste auto-merge: `kursy/agenty-ai/wymowa.md` zdublował 16 wierszy, a `kursy/agenty-ai/zrodla.md`
  przywróciłby 94 linie źródeł lekcji 4.1, które `main` usunął w `255ad933`. Wyłapane przez
  `git diff --cached --name-status main` przefiltrowane do plików SPOZA zakresu tematu gałęzi
  (część spotkaniowa) — zostały dokładnie te dwa, oba przywrócone do wersji `main`.

## Rozwiązanie
Przed merge'em gałęzi starszej niż ostatni squash na `main`: `git cherry -v main <gałąź>` i
`git log main --grep`/PR, żeby ustalić, co już weszło. Po `git merge --no-commit` przejrzeć
`git diff --cached --name-status main` dla plików spoza tematu, który ma wnieść ten merge; każdy
taki plik porównać z historią `main` (`git log main -- <plik>`) i domyślnie przywrócić wersję
`main`, a rozbieżność wypisać użytkownikowi.
