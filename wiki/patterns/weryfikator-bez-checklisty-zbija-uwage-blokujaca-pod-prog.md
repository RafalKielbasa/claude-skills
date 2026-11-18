# weryfikator-bez-checklisty-zbija-uwage-blokujaca-pod-prog

- **Skill:** code-review-master
- **Typ:** porażka
- **Status:** nawrót (2026-11-18)

## Opis
Agent weryfikacji (fala 2) potwierdza, że uwaga jest prawdziwa, ale daje jej pewność 50, bo ocenia
ją jako „sugestię projektową”. `crm score` odcina ją pod progiem i raport mówi „Brak uwag
przekraczających próg pewności”, choć uwaga łamie pozycję checklisty oznaczoną **blocking**.

## Przyczyna źródłowa
`prompts/verify.md` daje 75 za uwagę „named explicitly by the axis checklist”, ale Krok 6 wypełnia
tylko `{{FINDINGS}}`: weryfikator nie dostaje checklisty osi, więc nie może sprawdzić, czy reguła
jest w niej nazwana, i ocenia wagę własnym osądem. Odrzucone uwagi nie trafiają do `raport.md`
ani do artefaktu, więc bez ręcznego odczytu `scores.json` nikt ich nie widzi.

## Dowody
- 2026-11-12, sesja 35a425f6-9ecb-4c57-96c1-1edac5c3bd05 (id claude.ai niedostępny;
  code-busters-v2, PR #1749): `f-01` (sygnatury PNG/JPEG w `storeAsset.ts:9` jako druga kopia
  `ANONYMOUS_IMAGE_SIGNATURES` z `UserData.ts:30`) dostała 50 z notą „design suggestion rather
  than a defect, and the 'blocking' severity is overstated”, mimo że pozycja „No duplicated
  logic” osi code-quality mówi wprost, że druga implementacja blokuje merge także przy drobnej
  różnicy. `crm score` → `{"kept":0,"belowThreshold":2}`. Uwaga wyszła dopiero z własnego odczytu
  obu plików po przebiegu; Rafał na „Co proponujesz” przyjął poprawkę („ok”), commit `1b316a588`.
- 2026-11-18, sesja 51ae2c74-bb8c-4589-a22e-43752eafb286 (id claude.ai niedostępny; vault, przebieg
  kontrolny na `saas app`, PR #217): w runie `20261118-132541-6575` weryfikator bez treści issue dał
  uwagom osi `issue-conformance` 50 („Scope judgment depends on the issue text (not verified
  here)”), 25 (różnica z Figmą: „The Figma nodes … were not checked”) i 50; `crm score` odciął
  wszystkie trzy. Po dołączeniu checklisty i issue do fali 2 run `20261118-134455-ev71` na tym
  samym commicie dał tym samym uwagom 92, 90 i 90.
- 2026-11-18, sesja 140fbd7f-77b7-474d-927d-01ab988fa726 (id claude.ai niedostępny; saas app, PR #219,
  run `20261118-163858-xd38`, pierwszy prawdziwy przebieg po zmianie): weryfikator miał checklistę,
  issue i komendę diffu, potwierdził `f-02` (zapisy przez `prisma.enrollment.createMany` zamiast
  `POST /enroll`, wbrew zdaniu opisu issue #138 „student zapisuje się na kurs”) i dał 80 z notą
  „Not 90+ because the acceptance-criteria list does not name enrollment explicitly”. Sam rozróżnił
  opis issue i listę kryteriów, choć checklista `issue-conformance` mówi „every requirement in the
  issue's description”. `crm score` odciął uwagę; wróciła z listy `belowThreshold` w Kroku 10,
  Rafał wysłał ją jako Blocking (review 5961351717). Lista spod progu zadziałała jako siatka.

## Rozwiązanie
W Kroku 6 dołącz do promptu weryfikacji checklistę osi (ten sam `{{CHECKLIST}}` co w fali 1)
i dopisz w `prompts/verify.md`: „uwaga, która łamie pozycję checklisty oznaczoną blocking
i której dowód potwierdziłeś, dostaje co najmniej 75; wagi reguły nie oceniasz”. W Kroku 10
wypisz użytkownikowi uwagi odcięte przez próg (id, plik:linia, nota weryfikatora), zamiast samej
liczby `belowThreshold`.

Wprowadzone 2026-11-18: `{{CHECKLIST}}` i `{{ISSUE}}` w `prompts/verify.md`, a potwierdzone
złamanie pozycji checklisty albo zdania issue dostaje co najmniej 90 (75 nie przechodzi progu
85 dla blocking). Tego samego dnia, po „Zaopiekujmy rzeczy otwarte” Rafała: Krok 10 wypisuje
każdą uwagę spod progu (`belowThreshold` z wyniku `crm finish`: id, `file:lines`, waga, pewność,
nota weryfikatora).

Skutek uboczny reguły „co najmniej 90”, naprawiony tego samego dnia: w runie
`20261118-134455-ev71` weryfikator bez komendy diffu podniósł do 90 i 85 dwie uwagi o kodzie
sprzed PR-a (`f-05` `useState` w `lesson-content.tsx:33`, `f-11` brak `aria-current`
w `course-section-accordion.tsx:131`); odrzucił je dopiero codex. Nota weryfikatora przy `f-02`:
„not checked, since I have no diff”. Fala 2 dostaje teraz `{{DIFF_NOTE}}` tak jak fala 1,
a `prompts/verify.md` mówi, że problem starszy niż zmiana dostaje 0 bez względu na regułę,
na którą się powołuje. Niesprawdzone jeszcze na prawdziwym przebiegu.

Po nawrocie (PR #219) do dopisania w `prompts/verify.md`: „Zdanie z opisu issue jest wymaganiem
na równi z kryterium akceptacji; nie obniżasz oceny dlatego, że lista kryteriów go nie powtarza”.
Rozważyć próg deterministyczny: uwaga osi `needs: [issue]` z potwierdzonym dowodem nie spada pod
próg przez samą notę weryfikatora, tylko trafia do raportu z jego zastrzeżeniem.
