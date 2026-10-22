# lokatory-zapasowe-dziedzicza-zalozenie-narracji

- **Skill:** kurs-nagrywanie
- **Typ:** porażka
- **Status:** otwarty

## Opis
Lokator elementu, który zna tylko narracja, ma kilka wariantów zapasowych. Wszystkie stoją na tym samym
założeniu o miejscu elementu na ekranie, wziętym z narracji. Gdy narracja się myli, przebieg zatrzymuje się na
wszystkich wariantach naraz. Zatrzymanie w kroku za zgodą OAuth kosztuje dodatkowo cykl przygotowania konta.

## Przyczyna źródłowa
Warianty zapasowe zmieniają selektor (`data-test-id`, klasa, tekst), ale nie założenie o miejscu elementu.
Chronią przed zmianą znaczników w produkcie, nie przed błędem treści. Produkt jest open source, a położenie
tekstu w UI wynika z właściwości, w której ten tekst siedzi (w n8n `hint` jest pod polem, `description` w dymku
przy etykiecie). Jedno sprawdzenie w kodzie przed przebiegiem rozstrzyga i lokator, i twierdzenie scenariusza.

## Dowody
- 2026-10-21/22, sesja 0f2e4f59-44c4-458e-a9ee-2d4d39543321 (id claude.ai niedostępny), lekcja agenty-ai 2.1,
  krok 15:
  - `toolDescriptionHint` miał trzy warianty: `parameter-input-hint`, `.n8n-input-hint` i `text=/Explain to the
    LLM/` w panelu węzła. Wszystkie szukały podpowiedzi „pod polem”, jak w narracji („Samo "en osiem en"
    podpowiada to pod tym polem”).
  - Przebieg 4 zatrzymał się komunikatem „Brak elementu „toolDescriptionHint”. Sprawdź interfejs usługi
    i lokatory.”
  - Kod n8n rozstrzygnął sprawę od razu: tekst jest `description` parametru `toolDescription`, pokazywanym przez
    `InputLabel.vue` w dymku znaku zapytania. Przebieg i tak zatrzymał się dopiero za zgodą Gmaila w kroku 12,
    więc następny wymaga od Rafała ponownego odebrania dostępu i połączenia Sheets.

## Rozwiązanie
Pisząc w `nagrywanie.yaml` lokator elementu bez sondy UI, sprawdź w kodzie produktu, jak ten element się
renderuje (właściwość, komponent, warunek widoczności). Zapisz to w komentarzu nad lokatorem. Gdy kod przeczy
narracji, zgłoś uwagę `scenariusz` przed przebiegiem, nie po nim. Pierwszeństwo mają kroki stojące za krokiem
zgody OAuth albo za innym krokiem drogim do powtórzenia.
