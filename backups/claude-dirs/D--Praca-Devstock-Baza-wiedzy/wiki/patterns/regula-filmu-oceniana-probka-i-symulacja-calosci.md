# regula-filmu-oceniana-probka-i-symulacja-calosci

- **Skill:** kurs-montaz (zmiana zasady montażu, spec i plan przed renderem)
- **Typ:** porażka
- **Status:** otwarty

## Opis
Zasada montażu oceniona jedną miarą zawodzi. Próbka trzech akapitów dostała „ok”, a pierwszy pełny film miał 27:31
i 536,6 s ciszy. Limity wybrane przeze mnie z symulowanych sekund dały próbkę, która „strasznie skacze”.

## Przyczyna źródłowa
Próbka pokazuje wybrane akapity i nie widzi sumy ani przypadków spoza wyboru: przytrzymania automatu
`wait_for: { sekundy }` (192 wpisy w `nagrywanie.yaml`) nie są w `oczekiwania` ani `elementy`, więc liczyły się jako
akcja. Symulacja widzi sumę, ale nie odczucie: 0,5 s między krokami to w liczbach zysk, a na ekranie skok. Render całej
lekcji trwa około godziny, więc błąd wykryty dopiero na filmie jest drogi.

## Dowody
- 2026-11-04, sesja 83cd4b89-dc72-4c37-aab9-f5b63095719c (kontynuacja 78788d89-0fb4-49f8-86e8-69106f4e6036; id claude.ai
  niedostępny), lekcja 3.2:
  - Rafał po filmie 27:31: „Przerwy pomiędzy klolejnymi akapitami są zbyt długir wychodzi to nienaturalnie”. Pomiar:
    362,0 s ciszy nad stojącym ekranem, 29 przerw od 8 s.
  - Moja rekomendacja z symulacji (stojący ekran 0,5 s, limity 3 s i 5 s). Rafał po próbce: „Fragment od drugi węzeł
    google drive do zasób file strasznie skacze”.
  - Moje szacunkowe „około 21:50” było optymistyczne: symulacja dała 22:43.
  - Zadziałało połączenie: symulacja skalibrowana na istniejącym filmie (27:39 przy realnym 27:31) i próbka z kolejnych
    akapitów. Rafał wybrał wariant z próbki, a film trafił w symulację: 22:39,8 przy prognozie około 22:40.

## Rozwiązanie
Przed pierwszym renderem całej lekcji z nową zasadą montażu:
1. Policz symulację na całej lekcji, bez renderu, i skalibruj ją na istniejącym filmie: długość, cisza, cisza nad stojącym
   ekranem (`freezedetect`), najdłuższa przerwa, najwyższe tempo.
2. Sprawdź, czy dane wejściowe obejmują wszystko, co stoi na ekranie, także przytrzymania automatu.
3. Pokaż próbkę na kolejnych akapitach z najgorszego miejsca symulacji, a przy limitach dwa warianty obok siebie. Limit
   odczuwalny wybiera człowiek na obrazie, nie agent z liczb.
4. Podawaj liczby z symulacji, nie szacunek z głowy.
