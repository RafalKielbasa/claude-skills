# plik-zmieniony-miedzy-odczytem-a-edycja

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Między odczytem pliku a jego edycją mija długi czas wypełniony analizą i rundą
pytań do użytkownika. W tym oknie plik zmienia inny proces, a Claude planuje
edycję na nieaktualnych numerach linii.

## Przyczyna źródłowa
Odczyt na starcie sesji służy dwóm celom naraz: zrozumieniu treści i zebraniu
adresów do edycji. Pierwszy cel przeżywa upływ czasu, drugi nie. Bramka
zatwierdzenia projektu przez użytkownika wydłuża to okno o kilkadziesiąt minut,
a plik w katalogu współdzielonym z inną sesją Claude albo z Obsidianem nie jest
niczyją wyłączną własnością.

## Dowody
- 2026-09-03, sesja session_01APWRKsZej4SeoF4vvdibEC: `praca-z-claude.md`
  odczytany o 09:45 miał 89 044 bajty i 19 wpisów; o 10:24 miał 85 067 bajtów
  i 18 wpisów — druga sesja Claude skasowała cały wpis o WikiSkillu. Zmiana
  wyszła na jaw przypadkiem, przy porównaniu rozmiaru kopii z oryginałem, a nie
  przez świadome sprawdzenie. Numery linii do cięcia zebrano ponownie.

## Rozwiązanie
Przed edycją pliku, który odczytałeś wcześniej niż przed chwilą, potwierdź jego
stan — rozmiar, `mtime` albo sumę kontrolną — i dopiero wtedy zbieraj adresy do
zmiany. Gdy edycję wykonuje skrypt, wbuduj w niego asercję na stan wejściowy
(liczba linii, hash), żeby rozjazd zatrzymał zapis zamiast go wykonać.
