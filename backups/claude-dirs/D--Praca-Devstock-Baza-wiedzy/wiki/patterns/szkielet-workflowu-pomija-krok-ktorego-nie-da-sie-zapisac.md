# szkielet-workflowu-pomija-krok-ktorego-nie-da-sie-zapisac

- **Skill:** live-demo
- **Typ:** porażka
- **Status:** zaadresowany (2026-09-18, live-demo)

## Opis
Ręcznie pisany szkielet workflowu n8n pomija węzeł, którego kształtu nie da się
wiarygodnie odtworzyć w JSON-ie, a pominięcie ląduje jako jeden z wielu wierszy
tabeli „do uzupełnienia ręcznie po imporcie". Plik wygląda na kompletny, więc
jest czytany jak kompletny: brakujący węzeł nikogo nie blokuje i nie pojawia się
w żadnym przebiegu testowym, dopóki nie zabraknie go na żywo.

## Przyczyna źródłowa
Szkielet powstaje z listy węzłów, a nie ze scenariusza, choć to scenariusz
decyduje, które węzły są nieopcjonalne — każdy moment, w którym prowadzący ma
coś pokazać albo kliknąć, jest wymaganiem twardym. Pominięcie zapisane prozą
w README konkuruje z ośmioma innymi pozycjami tej samej tabeli i nie ma
reprezentacji ani na kanwie, ani w wykonaniu, więc nie ma czego zauważyć.
Manifest tymczasem stoi na `draft`, co jest prawdą i niczego nie alarmuje.

## Dowody
- 2026-09-18, sesja 3aaf54dc (id claude.ai niedostępny): w szkielecie
  `live-events/2026-09-21-mail-z-zalacznikiem/workflows/scaffold/` nie było
  bramki „Pyta Cię na Telegramie", opisanej w README jako „nie da się jej
  wiarygodnie zapisać w JSON-ie, dodaj w UI". Rafał testował demo na żywym
  mailu i agent wysłał odpowiedź do kontrahenta **bez pytania o zgodę**, po czym
  napisał: „ogólnie workflow jest tak skonstruowany, że nie ma miejsca na bramkę
  na telegramie… nie ma stanu, w którym naciśnięcie przycisku powoduje
  wysłanie". Wyszło 3 dni przed transmisją, przy bloku 4 scenariusza
  (`runbook/scenariusz-live.md:119`) opartym na kliknięciu „✅ Wyślij" —
  bloki 3–5 to 30 z 60 minut anteny. Plan miał Task 6 Krok 2 i 3 niezaznaczone,
  `live.yaml` `demo: draft`, i żaden z tych sygnałów nie zadziałał jak blokada.
  Naprawa tego samego dnia: bramka jako Opcja 2 wewnątrz sub-workflowu
  (Telegram Send and Wait + IF `data.approved` + gałąź `not_approved`), kształt
  węzła spisany z kodu n8n, nie z pamięci.

## Rozwiązanie
Każdy `.json` pod `workflows/` — eksport, szkielet pisany przy realizacji planu,
wklejka — realizuje scenariusz w całości: każdy moment, w którym run of show
każe prowadzącemu coś pokazać albo kliknąć, ma w pliku swój węzeł pod nazwą,
której używa scenariusz. Węzeł, którego nie da się wiarygodnie zapisać, **nie
znika z pliku**: wchodzi jako wyłączony węzeł-atrapa pod nazwą ze scenariusza
i jako pierwsza, blokująca linia README tego katalogu. Tryb `approve` czyta
scenariusz i odrzuca plik, w którym brakuje węzła pod jakiś beat, cytując
`plik:linia`; `status.demo` zostaje `draft`, dopóki plik nie pokrywa scenariusza.
