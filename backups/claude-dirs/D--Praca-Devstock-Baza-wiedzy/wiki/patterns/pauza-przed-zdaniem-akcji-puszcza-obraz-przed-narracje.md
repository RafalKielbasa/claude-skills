# pauza-przed-zdaniem-akcji-puszcza-obraz-przed-narracje

- **Skill:** kurs-montaz
- **Typ:** porażka
- **Status:** otwarty

## Opis
Pauza wstawiona w narrację, żeby zgasić ostrzeżenie o przyspieszeniu, stoi przed zdaniem wprowadzającym akcję.
W tej ciszy obraz gra dalej, więc akcja (wpisanie pytania, wysłanie, wykonanie workflowu) dzieje się, zanim lektor
o niej powie. `montaz sprawdz` jest czysty, a rozjazd widać dopiero w filmie.

## Przyczyna źródłowa
`pauzy` w EDL zatrzymują lektora, nie obraz. Krótki akapit z długą akcją (7:2: 3,4 s narracji na wpisanie pytania
i odpowiedź agenta) daje ostrzeżenie o przyspieszeniu. Najbliższy punkt „cięcie pauzy” wypada po zdaniu wstępnym
(„Pytam wprost.”), nie po zdaniu akcji. Żadna kotwica nie trzymała obrazu do zdania akcji. Kotwica kroku
`bez_narracji` automatu (krok 23, 2,53 s narracji) zmuszała całe wpisanie i czekanie do zmieszczenia się przed nią.
`sprawdz` mierzy tempo odcinków, a nie kolejność „zdanie → akcja”. Kontrola synchronizacji z kroku 5 skilla patrzy
tylko na zdania zakotwiczone.

## Dowody
- 2026-10-16, sesja a7fb8394-0358-4975-bc18-9da4d6298a8a (id claude.ai niedostępny): lekcja agenty-ai 1.2, akapit 7:2.
  - Ostrzeżenia 4,48× zgasiłem pauzą po „Pytam wprost.”, a `sprawdz` odpowiedział „OK: EDL gotowy do renderu”.
  - Rafał po obejrzeniu `final.mp4`: „Około. 8.02 występuje rozbieżność pomiędzy narracją a filmikiem. (…) workflow
    wykonuje się zanim padną słowa o wpisywaniu do czatu.”
  - Poprawka objęła całą klasę, nie tylko 7:2: kotwice wpisywania przeniesione na zdanie z pytaniem, pauzy po
    pytaniu, oczekiwanie w kroku 23 automatu. Klatki sprawdzone dla wszystkich trzech pytań czatu (6:4, 6:5, 7:2).
- 2026-10-20, sesja 541cf3f0-bb8c-449a-92fd-d69e74d140fc (id claude.ai niedostępny): lekcja agenty-ai 1.3, dowód,
  że reguła działa, gdy idzie się za krokiem 5 `/kurs-montaz` („Then check sync”).
  - Kotwice 5:4, 5:6, 6:2, 6:10 i 6:12 sprawdzone na 30 klatkach przed i po starcie zdania z kotwicą: żadna akcja
    nie pojawia się przed swoim zdaniem.
  - Pauza w 6:11 stoi w „cięciu pauzy” po zdaniu z wynikiem (`po: 3.2`, 1,5 s), nie przed nim.
  - W 6:7 błąd pojawia się ok. 1 s po „Klikam Execute step”, a lektor komentuje go dopiero w 6:8. Zostawione bez
    zmian jako skutek kliknięcia, a nie akcja wyprzedzająca zdanie.
  - Rafał zaakceptował montaż i `final.mp4` bez uwag o synchronizacji.

## Rozwiązanie
1. Zanim dodasz pauzę przeciw przyspieszeniu, zakotwicz początek akcji na zdaniu, które ją wprowadza:
   `kotwice: [[sekunda nagrania tuż przed akcją, start tego zdania]]`.
2. Pauzę stawiaj po zdaniu akcji, nigdy przed nim.
3. Po każdej zmianie `pauzy` w akapicie z akcją wyciągnij klatkę tuż przed startem zdania akcji i potwierdź, że akcja
   jeszcze się nie zaczęła. Rób to także dla akcji bez kotwicy.
4. Czysty `sprawdz` nie dowodzi synchronizacji.
