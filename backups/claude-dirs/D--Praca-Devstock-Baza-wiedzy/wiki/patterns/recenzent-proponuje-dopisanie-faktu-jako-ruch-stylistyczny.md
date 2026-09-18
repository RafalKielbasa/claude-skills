# recenzent-proponuje-dopisanie-faktu-jako-ruch-stylistyczny

- **Skill:** kurs-redakcja (punkt 7 checklisty `review-ai`)
- **Typ:** porażka
- **Status:** otwarty

## Opis

Punkt 7 checklisty `review-ai` („scenariusz vs profil wypowiedzi") zgłasza brak ruchu profilowego
i w liście poprawek proponuje **wymyślenie faktu**: anegdoty, cudzej wpadki, historii z życia.
Uwaga wygląda jak uwaga stylistyczna i jest sformułowana konkretnie, więc pierwsza reakcja idzie
w stronę wykonania jej, a nie odrzucenia.

## Przyczyna źródłowa

Rdzeń profilu miesza dwie klasy ruchów: **językowe** (rytm, powrót do myśli, marker tempa, tryb
wspólny) i **treściowe** (anegdota R8, dygresja R11). Dla recenzenta obie są równorzędnymi
pozycjami tej samej listy, bo prompt dostaje profil w całości i pyta „czy scenariusz realizuje te
ruchy". Zakaz dopisywania treści stoi w SKILL.md grupy B, czyli w promptcie **redaktora**, i nie
trafia do promptu recenzenta. Recenzent nie ma więc jak wiedzieć, że połowa listy jest dla redakcji
poza zasięgiem.

## Dowody

- 2026-09-18, sesja (id niedostępny), lekcja `modul-03-badacz-deep-research/lekcja-01-nawigacja-pliki`:
  po redakcji przez `/kurs-redakcja` punkt 7 dał werdykt DO POPRAWY z dwiema uwagami. Pierwsza (brak
  R12, tryb wspólny) była trafna i potwierdzona liczbami. Druga brzmiała: „Brak R11 (Dygresja
  z powrotem)… Bartek mógłby opowiedzieć anegdotę o kimś z branży (lub sobie), kto przez pomyłkę
  podpiął agentowi prywatne konto i AI zaczęło czytać jego pity czy paragony medyczne". To jest
  zmyślony fakt podany jako poprawka stylistyczna. Odrzucona na regule, nie na guście. Niezależnie
  agent grupy B sam oznaczył jedyne dopisane przez siebie zdanie w pierwszej osobie („Ja też się na
  tym potknąłem.") jako wymagające decyzji Rafała — czyli redaktor granicę widział, a recenzent nie.

## Rozwiązanie

W promptcie `review-ai` (`src/review-ai.js`, `PUNKT_PROFILU`) dopisać zdanie oddzielające obie klasy:
„Ruchy treściowe (anegdota, własna wpadka, dygresja z nowym faktem) zgłaszaj jako brak wyłącznie
wtedy, gdy materiał na nie już jest w scenariuszu; nie proponuj treści do wymyślenia — redakcja nie
ma prawa dopisywać faktów". Do czasu tej zmiany: każdą uwagę z punktu 7, która każe **dopisać
zdarzenie**, odrzucać z powołaniem na zakaz z grupy B i zapisywać odrzucenie w raporcie do bramki,
żeby nie wróciła przy następnej lekcji.
