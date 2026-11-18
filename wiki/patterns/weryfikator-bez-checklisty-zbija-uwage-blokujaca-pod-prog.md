# weryfikator-bez-checklisty-zbija-uwage-blokujaca-pod-prog

- **Skill:** code-review-master
- **Typ:** porażka
- **Status:** zaadresowany (2026-11-18, code-review-master)

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

## Rozwiązanie
W Kroku 6 dołącz do promptu weryfikacji checklistę osi (ten sam `{{CHECKLIST}}` co w fali 1)
i dopisz w `prompts/verify.md`: „uwaga, która łamie pozycję checklisty oznaczoną blocking
i której dowód potwierdziłeś, dostaje co najmniej 75; wagi reguły nie oceniasz”. W Kroku 10
wypisz użytkownikowi uwagi odcięte przez próg (id, plik:linia, nota weryfikatora), zamiast samej
liczby `belowThreshold`.

Wprowadzone 2026-11-18: `{{CHECKLIST}}` i `{{ISSUE}}` w `prompts/verify.md`, a potwierdzone
złamanie pozycji checklisty albo zdania issue dostaje co najmniej 90 (75 nie przechodzi progu
85 dla blocking). Niezrobione: wypisanie uwag spod progu w Kroku 10.
