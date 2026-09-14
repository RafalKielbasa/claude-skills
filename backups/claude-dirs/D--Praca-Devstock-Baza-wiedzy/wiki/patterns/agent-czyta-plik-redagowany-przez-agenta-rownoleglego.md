# agent-czyta-plik-redagowany-przez-agenta-rownoleglego

- **Skill:** kurs-redakcja
- **Typ:** porazka
- **Status:** otwarty

## Opis
Krok 4 uruchamia grupy A, B i C przez `parallel`, a jednoczesnie kaze grupie A
doprowadzic `artykul.md` do zgodnosci z `video/scenariusz.md`, ktory w tym samym
czasie przepisuje grupa B. Agent A czyta scenariusz raz, na starcie, i wyrownuje
artykul do wersji, ktora przestaje istniec w trakcie jego wlasnego przebiegu.
Skutek wyglada jak nieuwaga agenta, a jest wyscigiem wpisanym w konstrukcje kroku.

## Przyczyna zrodlowa
`parallel` nie ustala kolejnosci, a zaleznosc miedzy grupami jest jednokierunkowa
i realna: A ma zrodlo prawdy w pliku grupy B, C ma zrodlo prawdy w pliku grupy A.
Prompt mowi agentowi "scenariusz jest zrodlem prawdy", nie mowiac, ze to zrodlo
jest w tej chwili przepisywane. Kontrola strukturalna z kroku 5 wychwytuje skutek,
ale dopiero po fakcie i w calosci rekami kontrolera.

## Dowody
- 2026-09-11, sesja session_01M1roR3MszbAgi1a1AE3xqh: zapisane w `log.md` jako
  obserwacja bez wzorca, w wariancie C<-A ("grupa C czyta `artykul.md`, a grupa A
  zmienia ten artykul w trakcie - wyscig wpisany w konstrukcje `parallel`").
  Notatka konczyla sie warunkiem: "dopiero rozjazd quizu z poprawionym artykulem
  by go uzasadnil".
- 2026-09-14, sesja session_01EBknRAiTAR3Phdk3gLiwNP: warunek spelniony, w wariancie A<-B i z realnym
  skutkiem. Z pieciu rozjazdow artykul-scenariusz, ktore musialem naprawic recznie
  po powrocie agentow, **cztery** powstaly wylacznie z tego wyscigu: agent B zmienil
  `scenariusz.md:35` na "Model nie dopisal tam niczego", `:67` na "jedno klikniecie
  roznicy", `:83` na "Po drugie, opis" i `:107` na "co ostatnio przyszlo", a agent A
  w tym czasie wyrownywal artykul do poprzednich brzmien. Przy pozycji `:67` agent A
  napisal w raporcie wprost, ze zmienil artykul "za scenariuszem" - podczas gdy
  scenariusz szedl w druga strone. Agent B sam zglosil jeden z tych rozjazdow jako
  niedomkniety: "artykul w Krok 4 nadal ma «co dzis przyszlo na skrzynke» (nie moj
  plik)".

## Rozwiazanie
W kroku 4 nie puszczac grupy A rownolegle z B, gdy w zestawie jest
`video/scenariusz.md`, ani grupy C rownolegle z A: `pipeline` B -> A -> C zamiast
`parallel` wszystkich trzech, kosztem wydluzenia przebiegu o jeden przelot.
Gdy rownoleglosc ma zostac, prompt grupy A musi wymieniac scenariusz jako plik
zmieniany w trakcie i kazac wylacznie ZGLOSIC rozjazdy zamiast je naprawiac -
naprawia wtedy kontroler w kroku 5, na stanie z konca przebiegu. Patrz tez
[[lista-wymowy-poprawiona-przed-startem-agenta]]: agent czyta zrodlo prawdy
w momencie startu i pozniejsza zmiana nie dziala wstecz.
