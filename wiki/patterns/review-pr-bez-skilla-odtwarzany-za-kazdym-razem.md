# review-pr-bez-skilla-odtwarzany-za-kazdym-razem

- **Skill:** ogólny (skill do review w budowie od 2026-09-04)
- **Typ:** porażka
- **Status:** otwarty

## Opis
Review PR-a nie jest pokryte żadnym skillem, więc procedura powstaje od zera
w każdej sesji: skąd wziąć listę kontrolną, co uruchomić, jak rozstrzygnąć
niejednoznaczną prośbę i jak opublikować wynik. Zakres i forma wychodzą różne
przy tej samej prośbie, a mechanika publikacji jest wyprowadzana na nowo.

## Przyczyna źródłowa
Skille pokrywają wytwarzanie (`writing-plans`, `github-tickets`,
`subagent-driven-development`), ale nie ocenianie cudzej pracy w repo.
`review-pracy-domowej` jawnie się wypisuje („NOT for reviewing your own repo's
diff, branch, or PR — that is /code-review"), a `/code-review` uruchamia
użytkownik, nie Claude. Między tymi dwoma zostaje luka, którą wypełnia
improwizacja: lista kontrolna leży w repo (`docs/review-guide.md`), reguła
o commitach i o GCP w `CLAUDE.md`, a sposób publikacji trzeba wyprowadzić
z API GitHuba przy każdej sesji od nowa.

## Dowody
- 2026-09-04, sesja session_013eH7DXzW8DZjC16fy2ZCs4: review PR #165 wymagało
  zrekonstruowania całej procedury w locie — odnalezienia `docs/review-guide.md`
  jako źródła kryteriów, samodzielnego wyboru zestawu sprawdzeń (typecheck,
  jest, eslint, prettier), a na końcu złożenia payloadu dla
  `POST /repos/{o}/{r}/pulls/{n}/reviews` z tablicą `comments`, bo `gh pr review`
  nie umie komentarzy przy liniach. Słowo „inline" w prośbie zostało odczytane
  jako „w tej sesji", a znaczyło „komentarze przy liniach na PR" — kosztowało to
  jedną turę i podwójne dostarczenie tej samej treści. Przy zmianie werdyktu
  (przeniesienie trzech ustaleń do Blocking) trzeba było doszukać, że ciała
  review nie da się zmienić przez `gh pr review`, tylko przez `PUT` na review
  i `PATCH` na pojedynczych komentarzach.

## Rozwiązanie
Do skilla review, budowanego od 2026-09-04, wnieść z tej sesji cztery rzeczy,
których brak kosztował czas:

1. Kryteria bierz z listy kontrolnej repo (`docs/review-guide.md`), nie
   z własnego zestawu; sekcje tej listy są też kubełkami werdyktu
   (Blocking / Suggestions / Nitpicks).
2. Zanim padnie pierwsze ustalenie, uruchom zestaw sprawdzeń i podaj liczby,
   nie słowo „przechodzą".
3. Rozstrzygnij jawnie, czy review ma zostać w sesji, czy trafić na PR —
   „inline" jest niejednoznaczne i domyślnie znaczy „komentarze przy liniach".
   Publikacja jest działaniem na zewnątrz i wymaga zgody.
4. Zapamiętaj mechanikę: komentarze przy liniach idą tylko przez
   `POST …/pulls/{n}/reviews` z tablicą `comments`; późniejsza korekta to `PUT`
   na review (ciało) i `PATCH` na `…/pulls/comments/{id}` (pojedynczy komentarz);
   po publikacji zweryfikuj, że każdy komentarz dostał pozycję w diffie, bo
   komentarz spoza diffu cicho przepada jako outdated.
