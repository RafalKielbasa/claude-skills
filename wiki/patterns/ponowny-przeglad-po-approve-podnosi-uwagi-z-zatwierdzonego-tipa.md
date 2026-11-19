# ponowny-przeglad-po-approve-podnosi-uwagi-z-zatwierdzonego-tipa

- **Skill:** code-review-master
- **Typ:** porażka
- **Status:** otwarty

## Opis
Ponowny przebieg `pr <n>` na PR-ze, który użytkownik już zatwierdził, zgłasza jako Blocking kod
obecny na tipie z tamtego APPROVE (uwagi zakresu osi `issue-conformance`). Raport nie odróżnia
tego, co doszło po zatwierdzeniu, od tego, co użytkownik już przyjął. Bez ręcznego porównania
review przeczy wcześniejszemu review tej samej osoby.

## Przyczyna źródłowa
Tryb `pr` wyznacza zakres diffem trzykropkowym od bazy (`target.diffCommand`, merge-base z
`main`), a `crm plan` nie czyta wcześniejszych review PR-a. Ani agenci osi, ani weryfikator nie
dostają SHA ostatniego review, więc każdy hunk PR-a jest dla nich „nowy”. Po merge'u `main` do
gałęzi tip się zmienia, ale większość diffu jest identyczna z zatwierdzoną.

## Dowody
- 2026-11-18, sesja df9b60eb-ffa1-4f95-9570-f528900ec065 (id claude.ai niedostępny; saas app,
  PR #215, run `20261118-171748-sq9t`, tip `b573633`): `f-01` (stan 403 „Zapisz się do tej
  szkoły”) i `f-03` (typy przeniesione do `packages/types`) jako Blocking spoza #177. Oba były
  na `1373061`, na którym Rafał dał APPROVE 5892148117 z notą „the PR meets the acceptance
  criteria of #177”. Wykryte dopiero przez `git log 1373061..b573633` i
  `git cat-file -e 1373061:packages/types/src/leaderboard.types.ts`. W tym samym czasie
  prawdziwa regresja wniesiona po APPROVE (karta w karcie w `LeaderboadMessage`) nie wyszła
  z żadnej osi.
- 2026-11-19, sesja 9273a288-9ea2-4ef5-8c9a-2ddbe8af2dff (id claude.ai niedostępny; saas app,
  PR #213, run `20261119-123337-yj2y`, po REQUEST_CHANGES 5892255729): ten sam mechanizm po review
  **z prośbą o zmiany**, nie po APPROVE. Cztery osie nazwały plik `course-section-accordion.tsx`
  „poza zakresem #182”, a przeniesienie `LessonIcon` do `@/components/icons` zlecił komentarz
  4564173339 z poprzedniego review Rafała; weryfikator `issue-conformance` dał tej tezie 92.
  Wykryte dopiero przez odczyt komentarzy PR-a (`pulls/213/comments`). Wcześniej podobnie PR #217
  (pamięć projektu, 2026-11-19: „automat dał 2 Blocking zakresu sprzeczne z tamtym review”).
  Wniosek: osie i weryfikator powinny dostać nie tylko SHA ostatniego review, ale i jego komentarze
  — zmiana, o którą review prosiło, nie jest kodem z innego zadania.

## Rozwiązanie
W trybie `pr` `crm plan` czyta review PR-a (`gh pr view <n> --json reviews`). Gdy ostatnie review
użytkownika ma `commit.oid`, różny od tipu, plan zapisuje `target.lastReviewedOid` i komendę
`git diff <lastReviewedOid>..<head>` jako `{{SINCE_REVIEW_NOTE}}` dla osi i weryfikatora:
„Linia niezmieniona od ostatniego review jest już przyjęta; uwaga zakresu o niej dostaje 0, chyba
że łamie zdanie issue, którego tamto review nie sprawdzało”. Do czasu zmiany: przed `send`
porównaj każdą uwagę Blocking z tipem z ostatniego APPROVE (`git cat-file -e <oid>:<plik>`,
`git diff <oid>..<head> -- <plik>`).
