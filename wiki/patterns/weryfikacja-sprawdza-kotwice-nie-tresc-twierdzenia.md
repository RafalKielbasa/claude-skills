# weryfikacja-sprawdza-kotwice-nie-tresc-twierdzenia

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis

Krok weryfikacyjny napisany w planie sprawdza, czy **kotwica cytatu istnieje**, a nie czy cytowana
treść w tej kotwicy leży. Wypisuje `sprawdzone` i wygląda jak przejście, choć cytat może wskazywać
zupełnie inny akapit tego samego pliku albo po cichu gubić zdanie w środku.

## Przyczyna źródłowa

Kotwica jest łatwa do sprawdzenia jednym `grep`-em, treść wymaga porównania dwóch ciągów po
normalizacji. Pisząc plan, dobiera się kontrolę, którą da się zapisać w jednej linii shella, i ta
linia zaczyna uchodzić za weryfikację całego twierdzenia. Awaria jest cicha w obie strony: cytat
z przestawionym znacznikiem przechodzi, bo znacznik istnieje, a cytat z wyciętym zdaniem przechodzi,
bo nikt nie porównuje go ze źródłem.

## Dowody

- 2026-09-18, sesja (id niedostępny), repo Baza wiedzy: plan `2026-09-17-bartek-voice-profile`
  miał w Tasku 7 i Tasku 8 identyczną kontrolę — `grep` po wzorcu `slug, mm:ss`, potem sprawdzenie
  `grep -q "^\[$ts\]"` w pliku transkryptu. Przeszła na 96 cytatach w profilu i katalogu. Dopisany
  ad hoc test, który dodatkowo normalizuje cytat i sprawdza, czy zawiera się w akapicie o tym
  znaczniku, wypisał **3 niezgodności**: dwa cytaty wskazywały `n8n-4.2, 03:01`, a ich tekst leżał
  w `03:33`, a jeden w bloku R8 profilu gubił po cichu zdanie „Znalazłem URL odpowiedni." w środku
  cytowanego fragmentu. Wszystkie trzy były moje, wszystkie trzy przeszły przez kontrolę z planu.

## Rozwiązanie

Kontrola cytatu ma porównywać **treść**, nie obecność kotwicy. Minimalna forma: znormalizuj cytat
i akapit (małe litery, tylko znaki alfanumeryczne, pojedyncze spacje), potem sprawdź
`akapit.includes(cytat)`; elipsę `(...)` rozbij na części i sprawdź każdą osobno. Pisząc krok
weryfikacyjny w planie, zadaj sobie pytanie: „co dokładnie twierdzę i czy ta komenda to sprawdza,
czy tylko coś, co z tym koreluje?". Jeśli komenda sprawdza korelat, nazwij to w planie wprost, żeby
wykonawca wiedział, że musi dołożyć własną kontrolę.
