# scenariusz-screencastu-pisany-bez-otwarcia-produktu

- **Skill:** kurs-lekcja, live-gift
- **Typ:** porażka
- **Status:** otwarty

## Opis

Osiem z dwunastu uwag z próbnego klikania lekcji 2.1 prostowało interfejs, nie język: nazwa węzła
na liście, nazwa sekcji, wartość ustawiona domyślnie, pole, którego w trybie automatycznym w ogóle
nie widać, i nieistniejące ostrzeżenie, na którym stał cały akapit narracji.

## Przyczyna źródłowa

`/kurs-lekcja` pisze linie `[AKCJA: ...]` i narrację screencastu z dokumentacji i z artykułu, a nikt
w trakcie generowania nie otwiera produktu. Żadna z kontroli, przez które lekcja przechodzi, nie
patrzy na ekran: walidator sprawdza typografię, grywalizację i strukturę, `review-ai` ocenia język
i dydaktykę. Rozjazd z interfejsem jest więc niewykrywalny aż do nagrania — czyli po bramce treści,
gdy scenariusz jest już zatwierdzony i czasem wyrenderowany.

## Dowody

- 2026-09-11, sesja session_01YVYBimtiCfF3SS1QHH4Cvi: w M02L01 uwagi prostowały `"Gmail Tool"` zamiast
  akcji `"Get Many Messages"` z listy, `"Add Option"` zamiast sekcji `"Options"`, domyślnie wybrany
  Sonnet i domyślną akcję `Get Row(s)`, kategorię `"Action in an app"` w liście narzędzi. Najcięższy
  przypadek: akapit „Węzeł agenta świeci ostrzeżeniem, że brakuje mu narzędzia... masz na to twardy
  dowód w interfejsie" — ostrzeżenia nie ma wcale, zrzut ekranu pokazuje czysty węzeł. Drugi:
  „Rozwijam ten wpis i widzę parametry, z jakimi narzędzie poszło" — panel wejścia pokazuje ładunek
  wyzwalacza czatu, a n8n wypisuje nad wynikiem wprost, że żadne pole nie jest wypełniane przez model.

- 2026-09-18, sesja fe0e2a4e (id claude.ai niedostępny): drugi dowód, druga
  sesja, i pierwszy poza `kurs-lekcja` — narracja prezentu na live 21.09
  (`live-gift`). Cały segment „Czerwone trójkąty" opisywał zachowanie n8n,
  którego nie widziałem: ile trójkątów widać po imporcie i że wejście w klocek
  i wyjście z niego podstawia logowanie z konta. Prostował to Rafał, ze swojego
  ekranu: „W moim przypadku jest 3 nody z czerwonym trójkątem… wystarczy, że
  kliknę węzeł i z niego wyjdę. Wtedy kredensie się już podstawią". Tym samym
  trybem powstały nazwy pól węzła Gmail w workflow (`Search`, `Simplify`,
  `Execute Once`) — wypisane z pamięci o n8n i oznaczone w `prezent/README.md`
  jako do sprawdzenia przy pierwszym imporcie. Różnica wobec dowodu z M02L01:
  tu rozjazd wyszedł PRZED nagraniem, bo Rafał czytał narrację przed
  generowaniem lektora — ale wyszedł z jego pamięci o produkcie, nie z żadnej
  kontroli.

## Rozwiązanie

Przy generowaniu scenariusza demo oznaczać te linie `[AKCJA: ...]`, których nie da się potwierdzić
źródłem (zrzut ekranu, commit z repo produktu, dokumentacja opisująca konkretne pole), i wypisywać
je na bramce jako listę „do sprawdzenia przy próbnym klikaniu". Nazwę sekcji, nazwę węzła na liście
i wartość domyślną traktować jak twierdzenie wymagające źródła — tak samo, jak traktujemy
twierdzenia negatywne o narzędziu. Akapit narracji, który powołuje się na coś widocznego na ekranie
(„świeci ostrzeżeniem", „widzę parametry"), jest twierdzeniem o interfejsie, nie o mechanizmie.
