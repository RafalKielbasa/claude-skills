# sonda-p1b-z-reczna-zgoda-nie-sprawdza-regul-rdzenia

- **Skill:** kurs-nagrywanie
- **Typ:** porażka
- **Status:** otwarty

## Opis
Sonda P1b (`probe-ui --okno <dostawca> --zgoda`) przechodzi bez naruszeń, a pierwszy przebieg, w którym rdzeń
sam klika ekran zgody, zatrzymuje się na elemencie, który był już na zrzucie sondy. Element nie łamał zakresów
ani hostów, ale rdzeń nie miał dla niego reguły.

## Przyczyna źródłowa
W P1b zgodę klika Rafał, a sonda sprawdza tylko zakresy i hosty okna. Reguły, według których rdzeń sam zaznacza
pola i klika zgodę (`oauth.js`: wiersze uprawnień, „Zaznacz wszystko”, każde inne pole wyboru = stop), w sondzie
w ogóle się nie wykonują. Nowy zestaw zakresów może zmienić układ ekranu zgody (Gmail dokłada blok o dostępie
ograniczonym w czasie), a pierwszym sprawdzeniem tego układu wobec reguł rdzenia jest dopiero przebieg próbny.
Gdy krok zgody stoi w środku ujęcia, zatrzymanie kosztuje cały cykl przygotowania konta u Rafała.

## Dowody
- 2026-10-20/21, sesja 0f2e4f59-44c4-458e-a9ee-2d4d39543321 (id claude.ai niedostępny), lekcja agenty-ai 2.1:
  - P1b z zakresami Gmaila 20.10 przeszła z `"naruszenia":[]`. Na jej zrzucie `okno-1-013.png`
    (`sondy/probe-ui-n8n-2026-10-20T18-58-38-487Z`) widać już pole „Chcę przyznać aplikacji n8n.cloud stały
    dostęp do danych na moim koncie Google, które dziś udostępniam”.
  - Przebieg 3 (21.10) zatrzymał się w kroku 12 komunikatem „pole wyboru spoza wierszy uprawnień: „Chcę przyznać
    aplikacji n8n.cloud stały dostęp do danych na ”, „Zaznacz wszystko” - nic nie kliknięto.”
  - Poprawka rdzenia (`d6daae6c`) wyszła poza jedną linię. Przed kolejnym przebiegiem Rafał musiał drugi raz
    odebrać dostęp i połączyć ponownie Sheets.

## Rozwiązanie
Po każdej P1b z nowym zestawem zakresów przejrzyj zrzuty okna zgody (`okno-*.png`) wobec reguł zgody rdzenia
(`tools/nagrywanie/src/oauth.js`), jeszcze przed przebiegiem próbnym. Każde pole wyboru, przycisk albo blok
spoza wierszy uprawnień zapisz jako kandydata do poprawki rdzenia. Kandydat dostaje test na fixturze z tekstem
ze zrzutu. Wersja docelowa: P1b wypisuje w `raport.json`, co rdzeń zrobiłby z każdym polem wyboru ekranu zgody,
bez klikania.
