# jednorazowe-zapoznanie-startuje-cala-nauke

- **Skill:** nauka-z-claude
- **Typ:** porażka
- **Status:** otwarty

## Opis
Prośba o przeprowadzenie przez treść świeżo dodanego dokumentu uruchomiła pełny
tryb `nauka-z-claude` z diagnozą, roadmapą i pytaniem sprawdzającym, zamiast
jednorazowego omówienia.

## Przyczyna źródłowa
Zwrot „przeprowadź mnie przez treść" jest niejednoznaczny między „ucz mnie tego
przez wiele sesji" (wyzwalacz skilla) a „opowiedz mi teraz, o czym to jest"
(zwykłe pytanie poza skillem). Claude wybrał pierwszą interpretację bez
potwierdzenia, mimo że opis skilla wprost wyklucza pytania jednorazowe bez
intencji nauki wieloseryjnej.

## Dowody
- 2026-09-02, sesja session_019Hub3mysiz4zztWAWESMQn: po dodaniu PDF-a
  z artykułem WikiSkill i prośbie „zapoznaj się z jego treścią a następnie mnie
  przez nią przeprowadź" Claude uruchomił `nauka-z-claude`, zapisał sekcję
  tematu z dziewięciokrokową roadmapą i zadał pytanie sprawdzające. Użytkownik
  odpisał „Nie będę się uczył teraz" i poprosił o wdrożenie czegoś z artykułu.

## Rozwiązanie
Gdy prośba o omówienie dotyczy świeżo dodanego dokumentu, bez wcześniejszej
deklaracji chęci nauki przez wiele sesji, dopytać jednym zdaniem o intencję
(nauka na dłużej czy jednorazowe streszczenie) przed uruchomieniem skilla.
