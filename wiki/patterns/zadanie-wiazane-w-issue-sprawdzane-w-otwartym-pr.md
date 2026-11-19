# zadanie-wiazane-w-issue-sprawdzane-w-otwartym-pr

- **Skill:** code-review-master
- **Typ:** porażka
- **Status:** otwarty

## Opis
Issue dzieli pracę z innym zadaniem („CP-96 zmienia wnętrze hooka… nie wchodzicie sobie
w drogę”), a osie oceniają PR tak, jakby tego zadania nie było. Jedna uwaga każe zrobić w PR-ze
to, co issue oddaje zadaniu wiązanemu. Prawdziwego ryzyka na styku dwóch otwartych PR-ów
żadna oś nie widzi.

## Przyczyna źródłowa
`crm plan` wkłada do `issueSection` treść issue, ale nie rozwija zadań, które ta treść nazywa
(„Wymaga CP-95”, „CP-96 (#175)”), ani ich otwartych PR-ów. Osie i weryfikator znają tylko diff
tego PR-a i stan `main`, więc kod, który zmieni sąsiedni PR, oceniają według dzisiejszego `main`.

## Dowody
- 2026-11-19, sesja 9273a288-9ea2-4ef5-8c9a-2ddbe8af2dff (id claude.ai niedostępny; saas app,
  PR #213, run `20261119-123337-yj2y`): f-06 (90, codex potwierdza) kazało przenieść
  `EditCourseForm` z `useCourse`/`useApiResource` na TanStack Query, choć #182 oddaje ten hook
  CP-96. Dopiero `gh pr diff 218` pokazał, że #218 przestawia `useCourse` na
  `queryKeys.creatorCourse(id)`, więc po merge'u obu PR-ów `invalidateAfterCreatorCourseUpdated`
  (`invalidation.ts:31-43`) nie unieważni klucza edytora przy `STALE_TIME` 60 s. f-06 odrzucone,
  zamiast niego wysłana nota Suggestion o kluczu dla PR-a, który wejdzie drugi.

## Rozwiązanie
W `crm plan` (tryb `pr`/`branch`): z treści issue wyciągnąć numery zadań wiązanych (`#N`,
`CP-NN` z tytułów issue) i dla każdego otwartego PR-a, który je zamyka, dopisać do
`issueSection` listę plików wspólnych z tym PR-em oraz jego diff w tych plikach. Do checklisty
`issue-conformance`: „Zmiana, którą issue oddaje innemu zadaniu, nie jest brakiem tego PR-a;
sprawdź za to, czy oba PR-y razem nie łamią kryterium”. Do czasu zmiany: w Kroku 4b/8 przy
issue nazywającym zadanie wiązane uruchom `gh pr list --search "<CP-NN>"` i przejrzyj wspólne pliki.
