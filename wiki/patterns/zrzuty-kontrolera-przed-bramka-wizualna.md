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
- 2026-10-22, sesja f8d64eed-4822-47ab-af24-2115a5905b5f (id claude.ai niedostępny), bramka wizualna ekranów publicznych Kodożerców (plan 2 `kodozercy-platform-public-catalog`) na lokalnym CMS: trzeci dowód, druga sesja, tym razem strony aplikacji zamiast Storybooka. Zrzuty Playwrightem 1440/390 z ofertą i bez oferty plus skrypt kontrastu WCAG na wyrenderowanych stronach i wszystkich krokach darmowej lekcji. Skrypt znalazł tekst artykułu lekcji w kolorach `prose` (gray-700) na ciemnym polu, 1,68:1, czego nie złapało 1125 testów ani review całej gałęzi na Opusie; poprawka `a1d671dd7`, ponowny przebieg czysty. Trzy pułapki samego pomiaru: `next dev` dokładał nakładkę React Query Devtools do zrzutów i do kontrastu (przejście na `next build` + `next start`), strony trzymały dane 5 minut w cache po zmianie danych testowych (świeży build), a wypełnione przyciski `ds` malują tło w rodzeństwie `[data-part="fill"]`, więc skrypt czytający tło elementu dawał fałszywe porażki (poprawka skryptu). Rafał zaliczył bramkę jednym „OK”.

## Rozwiązanie
Przed bramką wizualną: zbuduj Storybook z HEAD (sprawdź, że build jest nowszy niż ostatnia zmiana
kodu), zrzuć każdą historię z bramki w obu motywach i co najmniej jednej szerokości telefonu,
obejrzyj zrzuty i porównaj z arkuszem. Każda wada wraca do wykonawcy przed bramką. Po poprawce
zrzuć ponownie, a przy zmianach szerokości sprawdź dekoratory `meta`, które owijają wszystkie
historie. Przy bramce na stronach aplikacji (nie w Storybooku): zrzuty i kontrast z `next build` + `next start`, nie z `next dev`, bo nakładki narzędzi deweloperskich trafiają do obrazu i do pomiaru; po zmianie danych testowych świeży build, gdy strony trzymają dane w cache; skrypt kontrastu bierze tło z elementu, który je faktycznie maluje (np. rodzeństwo `[data-part="fill"]`), i przechodzi wszystkie kroki przebiegu, nie tylko strony startowe.
