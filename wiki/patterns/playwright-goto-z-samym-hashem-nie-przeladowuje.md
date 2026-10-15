# playwright-goto-z-samym-hashem-nie-przeladowuje

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Seria zrzutów tej samej strony różniących się tylko `#hash` (`page.goto(url#k=a)`, potem
`page.goto(url#k=b)`) dała identyczne PNG — strona nie przeładowała się i nie przeczytała nowego
stanu.

## Przyczyna źródłowa
Zmiana samego fragmentu URL to nawigacja w obrębie dokumentu: przeglądarka nie wykonuje skryptów
ponownie, tylko emituje `hashchange`. Strona, która czyta stan z hasha wyłącznie przy starcie,
zostaje w pierwszym stanie.

## Dowody
- 2026-10-14, sesja e61003ff (id claude.ai niedostępny; Baza wiedzy, makiety kierunków szaty):
  `renderuj.js` zrenderował landing w trzech kierunkach — wszystkie trzy PNG wyglądały jak
  kierunek 1. Wykryte obejrzeniem PNG, zanim trafiły do użytkownika. Naprawa: `page.goto('about:blank')`
  przed każdą nawigacją i nasłuch `hashchange` w samej makiecie.

## Rozwiązanie
W skryptach Playwright zmieniających stan strony przez `#hash` wymuś przeładowanie
(`about:blank` przed `goto` albo `page.reload()`), a w stronie obsłuż `hashchange`. Po pierwszym
przebiegu porównaj PNG dwóch różnych stanów — identyczne sumy przy różnych stanach to sygnał tego
błędu.
