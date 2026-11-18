# agent-osi-zglasza-uwagi-bez-czytania-plikow

- **Skill:** code-review-master
- **Typ:** porażka
- **Status:** zaadresowany (2026-11-18, code-review-master)

## Opis
Agent osi (fala 1) zgłasza uwagi po samym `git diff` albo czyta tylko część plików swojej części,
a `crm collect` uznaje taką część za przejrzaną, bo ma uwagi. Jako nieprzejrzaną oznacza tylko
część bez uwag i bez żadnego przeczytanego pliku, więc pliki z `coverage.unread` nie trafiają do
raportu i pusty wynik dla nich czyta się jak czysty kod.

## Przyczyna źródłowa
`prompts/axis.md` każe czytać każdy plik w całości, ale nic tego nie wymusza. Diff daje agentowi
dość materiału na uwagę zakresową (hunk spoza issue) albo na pierwszą trafioną regułę, więc agent
kończy pracę bez lektury kontekstu. `crm collect` liczy listę `read`, ale wynik `unread` zostaje
w odpowiedzi CLI i nie idzie do `raport.md` ani do artefaktu.

## Dowody
- 2026-11-18, sesja 0aaba947-0230-4e7a-bac1-4c6ab7da27b3 (id claude.ai niedostępny; saas app, run
  `20261118-122231-zty1` na PR #217, przed zmianą): każdy agent osi wykonał jedno wywołanie Bash
  (sam `git diff` albo grep); agent `web-frontend` widział diff akordeonu i zwrócił `[]` przy
  kłódce bez warunku dostępu w `course-section-accordion.tsx:178` (pamięć projektu `saas app`,
  `code-review-master-blind-spots`).
- 2026-11-18, sesja 51ae2c74-bb8c-4589-a22e-43752eafb286 (id claude.ai niedostępny; vault, dwa
  przebiegi kontrolne PR #217 po wprowadzeniu `read`/`searches` i `crm collect`): w obu oś
  `issue-conformance` zgłosiła uwagi z `read: []` (w `20261118-134455-ev71` cztery uwagi 90–92);
  `correctness` przeczytał 5 i 3 z 10 plików. Jako nieprzejrzane wyszły tylko `secrets`
  (pierwszy przebieg) i `debug-leftovers` (drugi), obie bez uwag i bez pliku. Rafał odłożył
  „Regułę głębokości czytania (D3)” do danych z kolejnych przebiegów.
- 2026-11-18, sesja 140fbd7f-77b7-474d-927d-01ab988fa726 (id claude.ai niedostępny; saas app, PR #219,
  3 pliki): `issue-conformance` i `code-quality` przeczytały po 2 z 3 plików, bez `app.module.ts`;
  `issue-conformance` zgłosił mimo to uwagę na `app.module.ts:60` (sam grep). Osie pracowały po
  2–5 wywołań narzędzi i 7–17 s. `unread` wypisałem użytkownikowi ręcznie (Krok 4), raport go nie
  niesie. Obie uwagi o lukach w teście (zapis przez Prismę, brak ZSCORE) dał codex jako szukający,
  nie agenci osi.
- 2026-11-18, sesja df9b60eb-ffa1-4f95-9570-f528900ec065 (id claude.ai niedostępny; saas app, PR #215, run `20261118-171748-sq9t`, 13 plików): `issue-conformance` przeczytała 5 z 12 plików i zgłosiła `f-03` na
  `packages/types/src/index.ts`, który ma na liście `unread`. Agenci osi robili 1–3 wywołania
  narzędzi w 7–18 s. Regresji karty w karcie, widocznej w `leaderboard.tsx:84-86` i
  `leaderboard-message.tsx:14`, nie zgłosiła żadna z 10 części; znalazła ją sesja przez Figmę.
- 2026-11-18, sesja d98f9232-24f3-40c4-8594-9bb94f77e795 (id claude.ai niedostępny; saas app, PR #218, run `20261118-180016-2qtu`, 6 plików): `code-quality`
  przeczytała 1 z 6 plików (`use-course.ts`) i zgłosiła `f-06` na `invalidation.ts` z listy
  `unread`; pozostałe osie miały po 2–3 nieprzeczytane pliki przy 2–5 wywołaniach narzędzi
  w 11–20 s. `correctness` podał linię 58 dla `loading: query.isLoading,` (faktycznie 219)
  i `crm assemble` odrzucił uwagę. Jedynego Blocking (brak testu mutacji hooka wobec kryterium
  „Testy: każda mutacja unieważnia właściwe klucze”) nie zgłosiła żadna oś ani codex; znalazła
  go sesja, szukając testów konsumentów (`use-complete-lesson.test.tsx` jako precedens).

## Rozwiązanie
Hipoteza do decyzji „Reguła głębokości czytania (D3)”: `crm render` i `crm artifact` wypisują
`coverage.unread` każdej części jako pliki nieprzeczytane przez agenta osi, a część z uwagami,
ale bez przeczytanego pliku, jest oznaczona „przejrzana tylko diffem”. Osie, którym wystarcza
wyszukiwanie (`secrets`, `debug-leftovers`), zwalnia z tej reguły pole w configu osi, żeby nie
dawać fałszywego „Nie przejrzano”.
