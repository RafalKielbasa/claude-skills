# zrzuty-kontrolera-przed-bramka-wizualna

- **Skill:** superpowers:subagent-driven-development
- **Typ:** sukces
- **Status:** otwarty

## Opis
Sukces: zanim kontroler odda użytkownikowi bramkę wizualną (historie Storybooka), buduje Storybook
z bieżącego commita, robi zrzuty Playwrightem i sam je ogląda. Wady widoczne gołym okiem, których
testy i review kodu nie łapią, wracają do wykonawcy przed bramką, a nie jako „nie” użytkownika.

## Przyczyna źródłowa
Testy jsdom nie liczą układu, a recenzent kodu nie widzi renderu. Wady historii (za wąska kolumna,
dekorator `meta` owijający arkusz) i wady wyglądu stanu (wyłączona opcja identyczna z domyślną)
są więc niewidoczne aż do obrazu. Zrzut z buildu po ostatnim commicie to jedyny tani detektor przed
człowiekiem. Trzeba też robić zrzut ponownie po każdej poprawce przed bramką, bo poprawka potrafi
dać nową wadę.

## Dowody
- 2026-10-21/22, sesja 7f23d848-4179-4042-9697-36f88592a6fa (id claude.ai niedostępny), bramka web
  planu 3 biblioteki: zrzuty czterech arkuszy po fali poprawek z review pokazały trzy wady (ikona
  błędu `TextField` zwinięta do kropki przy zawiniętym komunikacie, kolumny ok. 170 px ucinające
  pole, `AnswerOption` `disabled` identyczna z domyślną). Po poprawce kolejny zrzut wykazał regresję:
  `w-80` wychodziło poza kolumnę, bo dekorator `max-w-sm` z `meta` owijał też `Sheet`. Rafał dostał
  bramkę po trzecim zrzucie i zaakceptował ją jednym „ok”.
- 2026-10-21, ta sama sesja, bramka planu 2: zrzuty wykazały zepsute historie `TimelineItem/Sheet`,
  `Navigation/Narrow` i dekorator `meta`, które poprawiono w fali poprawek przed bramką.

## Rozwiązanie
Przed bramką wizualną: zbuduj Storybook z HEAD (sprawdź, że build jest nowszy niż ostatnia zmiana
kodu), zrzuć każdą historię z bramki w obu motywach i co najmniej jednej szerokości telefonu,
obejrzyj zrzuty i porównaj z arkuszem. Każda wada wraca do wykonawcy przed bramką. Po poprawce
zrzuć ponownie, a przy zmianach szerokości sprawdź dekoratory `meta`, które owijają wszystkie
historie.
