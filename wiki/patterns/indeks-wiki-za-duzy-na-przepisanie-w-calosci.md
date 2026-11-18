# indeks-wiki-za-duzy-na-przepisanie-w-calosci

- **Skill:** podsumuj-sesja-claude (także `evolve-skill`, Krok 5 punkt 4)
- **Typ:** porażka
- **Status:** otwarty

## Opis
`podsumuj-sesja-claude` (Krok 8) i `evolve-skill` (Krok 5) każą przepisać `index.md` w całości,
a globalny indeks ma 246 linii i około 71 tys. tokenów. Sesje aktualizują go więc punktowo,
a nic nie sprawdza zgodności z 232 stronami wzorców: strona
`diagnoza-api-bez-sprawdzenia-wartosci-ktora-dostal-proces` z 2026-10-22 nie miała wpisu
w indeksie przez prawie miesiąc.

## Przyczyna źródłowa
Reguła zakłada, że przepisanie całości jest sposobem na spójność indeksu. Przy tej wielkości
nie da się go wykonać w jednym kroku (`Read` oddaje do 25 tys. tokenów na odczyt), a wyjątek
z Kroku 8 (druga sesja w tym samym wiki) i tak kieruje do aktualizacji punktowej. Między regułą
niewykonywaną a aktualizacją punktową nie ma kroku, który policzyłby rozbieżności, więc
pominięty wpis nie zostawia żadnego śladu.

## Dowody
- 2026-11-18, sesja 51ae2c74-bb8c-4589-a22e-43752eafb286 (id claude.ai niedostępny; vault, zapisy
  `evolve-skill` po zmianie `code-review-master`): indeks zmieniony w dwóch liniach zamiast
  przepisany. Skrypt porównujący strony z indeksem (`check-wiki-index.mjs` w scratchpadzie
  sesji: każda strona ma wpis, każdy wpis ma stronę, status wpisu równy `**Status:**` strony)
  pokazał 232 strony, 231 wpisów i brak `diagnoza-api-…`; dopisany punktowo. Przy podsumowaniu
  tej samej sesji znów aktualizacja punktowa i to samo sprawdzenie.

## Rozwiązanie
„Nie przepisuj `index.md` w całości: zaktualizuj swoje linie punktowo, a potem uruchom
sprawdzenie zgodności indeksu ze stronami wzorców (obecność w obie strony, status równy linii
`**Status:**` strony) i popraw każdą rozbieżność w tej samej turze.” Skrypt sprawdzający
przenieść ze scratchpada do katalogu skilla `podsumuj-sesja-claude`, żeby oba skille wołały
ten sam. Powiązane: [[defekt-generowania-naprawiany-narzedziem-nie-regula]],
[[plik-zmieniony-miedzy-odczytem-a-edycja]].
