# review-przez-checkout-zabiera-drzewo-uzytkownika

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Review cudzego PR-a robione przez `git checkout` w tym samym drzewie roboczym,
w którym pracuje użytkownik, podmienia pliki pod trwającą sesją i rozjeżdża
artefakty generowane, których git nie śledzi. Efektem są zarówno instrukcje
czytane z niewłaściwej gałęzi, jak i błędy narzędzi opisujące stan `node_modules`,
a nie kod z PR-a.

## Przyczyna źródłowa
Gałąź jest własnością całego drzewa roboczego, nie zadania. Checkout zmienia
wszystko naraz: pliki instrukcji wczytane wcześniej do kontekstu, dokumenty
projektu i — pośrednio — artefakty wygenerowane z plików źródłowych, bo te leżą
poza gitem i nie przełączają się razem z gałęzią. Typecheck uruchomiony w tym
stanie porównuje nowy kod ze starym klientem i produkuje błędy, które wyglądają
dokładnie jak wady recenzowanego PR-a.

## Dowody
- 2026-09-04, sesja session_013eH7DXzW8DZjC16fy2ZCs4: przy review PR #165
  checkout gałęzi `feat/milosz-kulikjan/CP-38-…` podmienił `AGENTS.md` na starszą
  wersję (harness zgłosił „changed on disk since you last read it"), a klient
  Prisma w `node_modules` został przy schemacie gałęzi CP-89. `tsc --noEmit` dał
  dziewięć błędów w rodzaju „Property 'certificateUrl' does not exist in type
  'EnrollmentSelect'" — wszystkie o brakującej kolumnie, którą PR właśnie dodawał.
  Po `prisma generate` zostało zero błędów. Bez rozpoznania trafiłyby do review
  jako dziewięć nieistniejących wad. Powrót kosztował przywrócenie gałęzi
  użytkownika, usunięcie gałęzi roboczej i drugi `prisma generate`.
- 2026-10-05, `code-review-master pr 201` (z pamięci projektu saas app, notatka
  `code-review-master-config-2026-09-07`): tryb `pr` wymaga gałęzi PR-a w drzewie,
  klasyfikator auto mode zablokował `git checkout` („Irreversible Local
  Destruction”), więc Rafał przełączał gałąź sam, a plan zrobiony przed checkoutem
  został osierocony.
- 2026-10-12, sesja bbf04b0a-b00e-4022-825d-4502fd8b5ab5: `pr 202` zaplanowany na
  gałęzi CP-100 pokazał `size: 0` dla trzech nowych plików PR-a. `crm assemble`
  sprawdza dowody przez `readFileSync(join(repo, path))` (`bin/crm.mjs:223`), więc
  agenci i walidacja widzieliby kod CP-100. Rafał zrobił `gh pr checkout 202`
  w swoim drzewie, a przed końcem sesji drzewo stało już na `main` (`b533272`):
  gałąź użytkownika przełączana dwa razy na potrzeby jednego review.

## Rozwiązanie
Do przeglądu cudzej gałęzi nie przełączaj drzewa, w którym pracuje użytkownik.
Pliki czytaj bez checkoutu — `git fetch origin pull/<n>/head` i potem
`git show FETCH_HEAD:<ścieżka>` — a gdy potrzebny jest działający build (typecheck,
testy, lint), weź osobny `git worktree` albo katalog izolowany.

Jeżeli checkout jest jednak konieczny: przed uruchomieniem czegokolwiek odśwież
artefakty generowane ze źródeł, które gałąź zmienia (klient ORM, typy z API,
protobuf), a na koniec przywróć gałąź użytkownika i odśwież je ponownie pod nią.
Błąd narzędzia opisujący brak pola, które PR dodaje, traktuj jako podejrzenie
rozjazdu artefaktu, nie jako ustalenie do review.
