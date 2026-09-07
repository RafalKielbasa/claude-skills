# mutacja-przed-dispatchem-lapie-wlasne-bledy

- **Skill:** superpowers:subagent-driven-development
- **Typ:** sukces
- **Status:** otwarty

## Opis
Przed wysłaniem poprawki do implementera kontroler buduje ją na kopii roboczej, cofa
poprawkę (mutacja) i sprawdza, czy test pada dokładnie w przewidziany sposób. To złapało
błędy we własnym, dopiero co napisanym kodzie/teście kontrolera — nie w pracy subagenta —
zanim dispatch w ogóle wyszedł.

## Przyczyna źródłowa
Kod i test napisane w tej samej głowie, w tej samej chwili, dzielą te same błędne
założenia. Samo przeczytanie fixu jeszcze raz nie ujawnia błędu, bo czytający wraca do
tego samego rozumowania, które błąd wyprodukowało. Uruchomienie testu przeciwko realnie
zmutowanemu kodowi wymusza konfrontację z rzeczywistym zachowaniem, nie z zamiarem.

## Dowody
- 2026-09-03, sesja `session_0115YBg2ri1ajCfG8GNynEsZ`: test na rozjazd historii (Task 5)
  liczył `$ahead`/`$behind` symetrycznie (1 i 1) — zamiana kierunków zakresu dałaby ten
  sam wynik przez przypadek. Mutacja to ujawniła; fixture przerobiony na asymetryczny
  (2 vs 1), dopiero wtedy test faktycznie dyskryminował.
- 2026-09-03, ta sama sesja: test strażnika mergea (finalny przegląd) miał błędną
  arytmetykę — oczekiwał `$before + 2` commitów, rzeczywisty wynik to `$before + 1`,
  bo commit z gałęzi bocznej nigdy nie wchodzi do historii `main`. Wykryte przez
  faktyczne uruchomienie, nie przez przeliczenie na papierze.
- 2026-09-03, ta sama sesja: funkcja `Find-DuplicateSlug` (finalny przegląd) zwracała
  poprawnie pustą tablicę przy bezpośrednim przechwyceniu, ale test kontrolera opakowywał
  wywołanie w dodatkowe `@()`, co podwajało opakowanie pustego wyniku i dawało `count=1`
  zamiast `0`. Ustalone dopiero przez izolowaną sondę PowerShell, nie przez czytanie kodu
  funkcji (który był poprawny).
- 2026-09-03, ta sama sesja (Task 1, 3, 4, 6): analogiczne przypadki — test na regułę
  `.gitignore` (Task 1), pokrycie usuwania w lustrze (Task 3), granica chunku i blokada
  pliku w skanerze sekretów (Task 4), granica segmentu w remapie pamięci (Task 6) — każdy
  zweryfikowany mutacją przed dispatchem, każdy złapał realną lukę w pokryciu testowym
  napisanym przez kontrolera.
- 2026-09-04/05, sesja session_01WXmUJrXM5viDmNJuc3xjy6: prośba o sprawdzenie regresji przez podmianę argumentów `file` i `lines` w `blobLink` była zadana jako formalność — i test **nie padł**. Fixture `makeRepo` nie konfiguruje remote'a, więc `blobLink` zwracał `null` w pierwszej linii, zanim dotknął tych argumentów, a asercja `link === null` była spełniona dla dowolnej ich kolejności. Po dodaniu remote'a i asercji na dokładny URL podmiana daje widocznie inny wynik. Test bez mocy dyskryminującej napisał kontroler dwie wiadomości po tym, jak sam opisywał tę klasę defektu.
- 2026-09-07, sesja session_01JAgUNken6DG6aFPjDmKkAX: szosty dowod, tym razem po stronie re-reviewera, nie kontrolera. Scoped re-review poprawki Taska 4 odtworzylo aliasing w obie strony na kopii z cofnieta jedna linia (`structuredClone`): z poprawka `conflictsWith` zostaje `[]`, bez niej to samo wywolanie zostawia `['market-003']` na obiekcie wolajacego. Re-review fix wave zrobilo to samo z testem `pivot`, ktory implementer potwierdzil tylko jednostkowo — i pokazalo, ze pada rowniez end-to-end (`code: 2`, `rule: 'R07'`). W obu przypadkach mutacja byla jedynym dowodem, ze nowy test regresyjny w ogole potrafi pasc; implementer Taska 4 sam zglosil, ze jego pierwsza wersja tego testu przechodzila niezaleznie od poprawki.

## Rozwiązanie
Przy każdej poprawce, którą kontroler sam projektuje przed dispatchem: zbudować ją na
kopii roboczej, uruchomić test na poprawnym kodzie (oczekiwane: zielono), cofnąć fix
(mutacja) i uruchomić ponownie (oczekiwane: pada dokładnie ta jedna, przewidziana
asercja, nic więcej). Dopiero po tym dispatch. Nie ufać poprawności na podstawie samego
przeczytania kodu, zwłaszcza gdy kod i test powstały w tej samej turze rozumowania.
