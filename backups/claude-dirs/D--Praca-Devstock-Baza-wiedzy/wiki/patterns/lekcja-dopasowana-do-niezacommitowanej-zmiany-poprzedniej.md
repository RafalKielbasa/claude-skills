# lekcja-dopasowana-do-niezacommitowanej-zmiany-poprzedniej

- **Skill:** kurs-lekcja
- **Typ:** porażka
- **Status:** otwarty

## Opis
W trakcie pisania lekcji `git status` pokazał niezacommitowane zmiany autora
w lekcji poprzedniej. Nowa lekcja została do nich dopasowana i odwołuje się do
nich wprost („z poprzedniej lekcji"). Autor te zmiany potem wycofał, więc nowa
lekcja - już zacommitowana - powołuje się na krok, którego w poprzedniej lekcji
nie ma.

## Przyczyna źródłowa
Zmiana w drzewie roboczym to hipoteza, nie fakt: dopóki nie ma commita, autor
może ją wycofać, przepisać albo odłożyć. Skill `kurs-lekcja` każe w kroku 1
przeczytać artykuły wcześniejszych lekcji, ale nie mówi, którą wersję czytać -
z HEAD czy z dysku - ani co zrobić, gdy się różnią. Odruch „dopasuj się do
najświeższego stanu" jest w większości sytuacji dobry i dlatego nie budzi
podejrzeń, a rozjazd wychodzi dopiero wtedy, gdy ktoś czyta obie lekcje po
kolei.

## Dowody
- 2026-09-09, sesja session_01Kpavh9GSwwHtUcwJNUyRNm: pisanie lekcji 0.3 kursu
  agenty-ai. `git status --short` pokazał `M` na trzech plikach lekcji 0.2;
  `git diff` ujawnił dopisany krok 4 z polem `"Column to Match On"`. Lekcja 0.3
  została z tym zsynchronizowana w trzech miejscach (`artykul.md` krok 4,
  `scenariusz.md` segment 3, `konspekt-nagrania.md` krok 9), z frazą „kolumnę do
  dopasowania z poprzedniej lekcji", i zgłoszona Rafałowi w bramce. Po bramce
  `git status` był czysty, a `git show HEAD:…/lekcja-02…/artykul.md |
  grep -c "Column to Match On"` → `0`: zmiana 0.2 została wycofana, a lekcja 0.3
  z odwołaniem do niej wjechała do commita 3146333.

## Rozwiązanie
W kroku 1 skilla, przy czytaniu wcześniejszych lekcji, sprawdzić
`git status --short` na ich katalogach. Gdy któraś ma niezacommitowane zmiany:
budować treść na wersji z HEAD, a zmianę z drzewa potraktować jako hipotezę -
wolno się do niej dostosować, ale w bramce trzeba wymienić OSOBNYM punktem
każde miejsce nowej lekcji, które od niej zależy, i zapytać wprost, czy ta
zmiana zostaje. Bez tego pytania odwołanie „z poprzedniej lekcji" wjeżdża do
commita razem z resztą i nikt nie sprawdzi go ponownie.
