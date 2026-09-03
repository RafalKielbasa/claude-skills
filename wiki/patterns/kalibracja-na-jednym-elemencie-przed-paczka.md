# kalibracja-na-jednym-elemencie-przed-paczka

- **Skill:** ogólny
- **Typ:** sukces
- **Status:** otwarty

## Opis
Sukces: przy operacji powtarzalnej na wielu elementach najpierw powstaje jeden
element, ten najtrudniejszy, i idzie do oceny użytkownika. Dopiero po jego
zatwierdzeniu lecą pozostałe. Przy błędnej kalibracji poprawia się jeden
element, nie cała paczka.

## Przyczyna źródłowa
Nowa reguła albo nowy format brzmi jednoznacznie, dopóki nie zetknie się
z materiałem. Rozstrzygnięcia, których reguła nie przewiduje, pojawiają się
dopiero przy pisaniu, a użytkownik rozpoznaje trafność dopiero na konkrecie, nie
na opisie. Praca wykonana przed tym rozpoznaniem jest w całości narażona na
przepisanie, a koszt rośnie liniowo z liczbą elementów.

## Dowody
- 2026-09-03, sesja session_01APWRKsZej4SeoF4vvdibEC: przy dostosowywaniu
  piętnastu ticketów do nowej reguły głębokości najpierw powstał sam #168
  (18,5 KB, najmocniej łamiący regułę), pokazany w całości z listą tego, co
  wycięte i co zostało jako wyjątek. Użytkownik odpowiedział „Jest super, tnij”,
  po czym czternaście pozostałych poszło tym samym cięciem bez ani jednej
  poprawki kalibracyjnej. Ten sam ruch wyłapał wcześniej trzy graniczne miejsca
  (sekcja „gdzie podejrzeć konwencje”, długość weryfikacji ręcznej, kryterium
  o testach), które zostały nazwane wprost zamiast rozstrzygnięte po cichu.

## Rozwiązanie
Przy operacji powtarzalnej na wielu elementach wykonaj jeden i zatrzymaj się.
Wybierz element najtrudniejszy albo najbardziej skrajny, nie najprostszy: łatwy
przypadek nie ujawnia rozstrzygnięć, których reguła nie przewiduje. Pokaż wynik
w całości, wypisz osobno, co usunąłeś i co zostawiłeś wbrew regule, i poczekaj.
Zgoda na jednym elemencie jest zgodą na wzorzec cięcia, więc reszta idzie już bez
pytania.
