# zmiana-skilla-poza-evolve-skill-bez-sladu

- **Skill:** evolve-skill
- **Typ:** porażka
- **Status:** otwarty

## Opis
Skill zmieniony na bezpośrednią prośbę użytkownika nie trafia do
`skill-impact.md`, bo ten plik zapisuje wyłącznie Krok 5 skilla `evolve-skill`.
Rejestr deklaruje „ślad każdej próby zmiany skilla", a zawiera tylko te zmiany,
które przyszły jedną z dwóch dróg.

## Przyczyna źródłowa
Drogi zmiany skilla są dwie — propozycja wyprowadzona z wzorców wiki oraz
doraźna prośba w rozmowie — a zapis do rejestru wisi na pierwszej z nich.
`evolve-skill` czyta rejestr właśnie po to, żeby nie powtórzyć propozycji już
rozstrzygniętej, więc luka nie jest kosmetyczna: skill może zaproponować zmianę
wprowadzoną ręcznie tydzień wcześniej albo odrzuconą poza jego ścieżką.

## Dowody
- 2026-09-03, sesja session_01TR43bKGaUWASqCrAsDE6GT: Krok 4 skilla
  `podsumuj-sesja-claude` zmieniony wprost na prośbę „tak, dopisz to zdanie do
  skilla". Ślad powstał w `PURPOSE.md` skilla; w `skill-impact.md` nie było go
  do końca sesji — wpis dopisano ręcznie dopiero w kroku Wiki Maintainer, po
  tym jak rozbieżność została zauważona przy pisaniu briefu.

## Rozwiązanie
Każdą zmianę treści skilla dopisz do `skill-impact.md` właściwego wiki jako
wpis `zaakceptowana` z pełnym diffem, niezależnie od tego, czy przyszła
z `evolve-skill`, czy z bezpośredniej prośby. Rejestr ma być kompletny, bo
`evolve-skill` traktuje jego brak jako „tej zmiany nikt nie rozważał".
