---
name: cp-intro-tomasz-pr212
description: "Onboarding CP-INTRO: dokument jest ticketem (bez issue na GitHubie); PR #212 Tomasza oceniany wg wersji z main, nie odświeżonej; review 5774860207"
metadata:
  node_type: memory
  type: project
  originSessionId: 697b7bfb-0bd6-46b7-a761-81427aabcf6e
  modified: 2026-11-06T09:34:27.193Z
---

2026-11-04: zadanie onboardingowe `CP-INTRO` nie ma issue i nie wymaga jego założenia. Sam
`docs/onboarding/CP-INTRO-course-reviews.md` jest ticketem, PR łączy się z nim tekstem (tak samo było w PR #113 Norberta).
PR nie zamyka issue, więc po review nie ma karty do przesunięcia.

PR #212 (autor `tomrud88`, gałąź `feat/tomasz/CP-INTRO-course-reviews`) dostał `REQUEST_CHANGES`, review 5774860207, na `4fd9184`:
3 uwagi blokujące w kodzie (rzut `as unknown as` na `ReviewModelDelegate`, `@Type` przepuszczający `true` i `"3"`, angielskie
„no ratings yet”), poprawki opisu PR-a i 4 sugestie. Branch i tak nie idzie do merge'a. Kolejny krok: `recheck` po poprawkach.

**Why:** Rafał: „Skoro niezacommitowałem nowej wersji zadania to oceniamy starą wersję”. Odświeżony dokument z DT-95 #842 czekał
wtedy niezacommitowany w jego drzewie roboczym, więc braki względem niego (dostęp gościa, relacja złożona, recenzje w seedzie) nie są
błędami autora.

**How to apply:**
- Praktykanta oceniam wg wersji dokumentu, którą miał na `main`, gdy zaczynał; sprawdzam to `git show origin/main:<ścieżka>`, nie w drzewie roboczym.
- `isReviewDuplicate` zostało sugestią mimo [[feedback-duplication-is-blocking]], bo stara wersja kazała wzorować się na `enrollments.service.ts`. To wyjątek zatwierdzony przez Rafała dla tego zadania (D2 A), nie zmiana reguły.
- Szablon PR-a mówi o GitHub issue, więc odświeżony CP-INTRO (Definition of done) mówi wprost, że dla tego zadania nie zakłada się issue.
- POST review przez `!` Rafała: [[code-review-master-config-2026-09-07]].

**Aktualizacja 2026-11-04:** odświeżony CP-INTRO zmergowany w #214 (`773d4bf`). Kolejne osoby oceniam wg tej wersji, a #212 nadal wg wersji z własnej gałęzi Tomasza.

**Aktualizacja 2026-11-06:** PR nietknięty ok. 37,5 h po review: head nadal `4fd9184`, 0 komentarzy `tomrud88`, 7/7 wątków otwartych, opis bez edycji; `recheck` nie ruszony. Status na Discordzie: [[intern-hours-in-discord-status]].
