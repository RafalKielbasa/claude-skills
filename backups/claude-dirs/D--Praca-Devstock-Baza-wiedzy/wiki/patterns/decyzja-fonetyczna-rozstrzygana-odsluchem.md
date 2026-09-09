# decyzja-fonetyczna-rozstrzygana-odsluchem

- **Skill:** kurs-redakcja (krok 4, grupa B); dotyczy też kurs-lekcja i kurs-video
- **Typ:** sukces
- **Status:** otwarty

## Opis
Rafał zgłosił, że lektor czyta `"n osiem n"` jako „ny osiem en", a `JSON` jako
sylabizowane „dżejs-on". Zamiast wpisać poprawkę od razu, poszło sześć próbek
przez produkcyjny głos (obecny zapis, kandydat z cudzysłowem, kandydat bez) i
dopiero werdykt z odsłuchu trafił na listę wymowy. Harness do tego leżał
w repo od dawna i nigdy nie był uruchomiony.

## Przyczyna źródłowa
Z tekstu nie wynika, jak ElevenLabs przeczyta dany zapis: różnicę robi nie
tylko pisownia, ale i cudzysłów, bo zmienia frazowanie. Lista `wymowa.md` jest
napisana tak, jakby zapis był oczywisty, a żaden skill nie wspomina
o `tools/course-pipeline/experiments/wymowa-proba.mjs`, więc domyślną drogą
jest zgadywanie. Koszt pomyłki jest asymetryczny: próbka to ~800 znaków API,
a zła decyzja idzie w dziesiątki wystąpień i unieważnia gotowe rendery.

## Dowody
- 2026-09-09 (odsłuch późnym wieczorem 08.09), sesja
  session_01PrFurqNDm53ZdkCryE5kjm: Rafał — „n osiem n było przeczytane ny 8 en
  a powinno en 8 en, a JSON powinien być czytany dżejson". Katalog
  `experiments/wymowa-proba/` nie istniał, więc gotowy skrypt z dokładnie tymi
  dwoma przypadkami nigdy nie był uruchomiony. Sześć próbek, werdykt: „json 1
  i 2 super 0 zły akcent, n 8 n 1 wygrywa" — czyli wariant z cudzysłowem dla
  `n8n` i oba warianty dobre dla `dżejson`. Bez odsłuchu cudzysłów zostałby
  zgadnięty, a w grze było 57 wystąpień w siedmiu scenariuszach.

## Rozwiązanie
Nowa albo zmieniona decyzja fonetyczna nie wchodzi do `wymowa.md` z głowy.
Najpierw `node --env-file=.env experiments/wymowa-proba.mjs` (kandydaci: zapis
obecny, kandydat w cudzysłowie, kandydat bez cudzysłowu, każdy w zdaniu
z terminem dwa razy), potem odsłuch Rafała, potem wpis na listę — i dopiero
potem podmiana w scenariuszach. Wariant lokalny wzorca globalnego
`kalibracja-na-jednym-elemencie-przed-paczka`.
