# scenariusz-screencastu-pisany-bez-otwarcia-produktu

- **Skill:** kurs-lekcja
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

## Rozwiązanie

Przy generowaniu scenariusza demo oznaczać te linie `[AKCJA: ...]`, których nie da się potwierdzić
źródłem (zrzut ekranu, commit z repo produktu, dokumentacja opisująca konkretne pole), i wypisywać
je na bramce jako listę „do sprawdzenia przy próbnym klikaniu". Nazwę sekcji, nazwę węzła na liście
i wartość domyślną traktować jak twierdzenie wymagające źródła — tak samo, jak traktujemy
twierdzenia negatywne o narzędziu. Akapit narracji, który powołuje się na coś widocznego na ekranie
(„świeci ostrzeżeniem", „widzę parametry"), jest twierdzeniem o interfejsie, nie o mechanizmie.
