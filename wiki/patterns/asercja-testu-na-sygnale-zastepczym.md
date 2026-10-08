# asercja-testu-na-sygnale-zastepczym

- **Skill:** superpowers:writing-plans (ogólny: każdy skrypt kontrolny)
- **Typ:** porażka
- **Status:** otwarty

## Opis
Kontrola sprawdza sygnał zastępczy zamiast samego artefaktu: liczbę kart, obecność napisu,
globalny stan współdzielony z innymi albo identyfikator bez jego zakresu. Inne, poprawne
zachowanie produkuje ten sam sygnał, więc kontrola daje fałszywy FAIL (albo PASS), a czas idzie
na diagnozę testu zamiast skilla.

## Przyczyna źródłowa
Asercję pisze się z wyobrażenia przebiegu, nie z przejścia go krok po kroku: nie liczy się
karty, na którą pada odpowiedź „przerwij", nie zakłada, że nagłówek sekcji trafi też na kartę,
nie odróżnia „mój zapis" od „czyjś zapis" w stanie współdzielonym.

## Dowody
- 2026-10-08, sesja 8d719440 (id claude.ai niedostępny), repo Baza wiedzy, testy na sucho bramki
  `/daily`: pięć fałszywych FAIL w jednej sesji — (1) „15 kart", a `[sesja przerwana]` odpowiada
  na 16. kartę, która się drukuje; (2) „`## Statusy` nie ma w logu" jako dowód, że notatki nie
  pokazano, a karty ⚠ drukowały `## Statusy → Grzegorz` w polu MIEJSCE; (3) porządek osieroconych
  wpisów porównywany po gołym `entry_id`, choć poprawny `delete` dotyczył starej kategorii `dev`;
  (4) „ostatnie issue w repo bez zmian", a issues #561–#563 założył w tym czasie członek zespołu;
  (5) fixture „zamkniętego" spotkania bez znacznika `**Opublikowano:**`, który nowa reguła czyni
  warunkiem zamknięcia.

## Rozwiązanie
Asercję formułuj na artefakcie, który zmiana ma wytworzyć (tytuł notatki, para kategoria +
`entry_id`, obiekty utworzone przez własne konto), a liczniki wyprowadzaj, przechodząc skrypt
odpowiedzi linia po linii — łącznie z kartą, na którą pada przerwanie. Stan współdzielony
porównuj przed/po i zawężaj do własnego aktora. Fixture buduj z warunków reguły po zmianie,
nie sprzed niej.
