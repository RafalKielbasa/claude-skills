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
- 2026-10-23, sesja session_01UTQuE3EwUpLuJMEs83YJwD (lokalnie 362d75a8-47e4-4b51-a94a-5c747a21b5c6), bramka W1 Kodożerców: przed oddaniem arkusza obejrzałem dwa zrzuty z pierwszego przebiegu harnessu (`dashboard--in--desktop--dark`, `dashboard--in--phone--light`). Pokazały szkielety zamiast treści, awatar „U”, nakładkę samouczka JoyRide i CTA „Wybierz plan” mimo triala, czego raport kontrastu nie mówił wprost. Brief pętli bramki zbudowany z tych obserwacji doprowadził do prawdziwej przyczyny (rozjechany `SESSION_SECRET`) i do osiadłych zrzutów; Rafał przyjął arkusz za pierwszym podejściem („OK”).
- 2026-10-27, sesja session_01WryF5VMEsMHtnHj5CCKTC4 (lokalnie 1faa07a7-ff1f-431b-bc16-b826e84f3e24), bramka M2 mobile: dowód z drugiej strony, bez zrzutów. Na mobile nie było emulatora ani zrzutów, więc 21 review zadaniowych i review całej gałęzi (opus) oceniały układ tylko z kodu. Na telefonie Rafał znalazł trzy wady układu:
  - stopka dymka samouczka wychodzi poza dymek — wprowadziła ją moja poprawka z review („przyciski < 44 px” → zdjęte `h-10`, przyciski wzięły `h-12 px-5` w dymku o szerokości 280–350 px);
  - narożniki panelu `highlight` (11 px poza panelem) wchodzą na sąsiednią kartę;
  - imię w Michromie 24 px z `numberOfLines={1}` przycięte u góry na Androidzie.
  Żadna z tych wad nie była widoczna w diffie, a pierwszą wprowadziła poprawka zgodna z regułą.
- 2026-10-29, sesja a011691a-07ee-43f2-ad0e-bac7765e83bf (id claude.ai niedostępny; code-busters-v2, worktree `code-busters-app-migration-w3-profile`, plan 5 W3 subagent-driven) (sukces, web): raport przebiegu 1 bramki W3 nie widział dwóch wad — hero profilu ściśniętego do ~110 px obok czterech kafli przy 1440 px i tabel historii/rekrutów rozpychających telefon do 454/429 px. Złapało je obejrzenie zrzutów przez kontrolera i odczyt szerokości PNG z nagłówka pliku; przebieg 2 po poprawkach czysty, Rafał przyjął arkusz bez uwag.
- 2026-10-30, sesja 188f3a4d-7157-4ac4-991a-d02805f5d47b (id claude.ai niedostępny; code-busters-v2, bramka W4) (sukces, web): raport przebiegu 1 liczył 12 błędów kontrastu i 4 błędy konsoli. Obejrzenie ośmiu zrzutów pokazało dwie rzeczy, których raport nie widzi: puste okładki „Zobacz także” na dole wpisu (leniwe obrazy poza progiem, patrz [[zrzut-pelnej-strony-pomija-leniwe-obrazy]]) i brak CTA gościa na stronie karty (żaden użytkownik seeda nie ma kodu polecającego, patrz [[wiersz-bramki-bez-drogi-do-ekranu]]). Obie poprawione w harnessie przed przebiegiem 2 (130/130, 0/0); Rafał przyjął wszystkie 15 wierszy jednym „OK”.

## Rozwiązanie
Przed bramką wizualną: zbuduj Storybook z HEAD (sprawdź, że build jest nowszy niż ostatnia zmiana
kodu), zrzuć każdą historię z bramki w obu motywach i co najmniej jednej szerokości telefonu,
obejrzyj zrzuty i porównaj z arkuszem. Każda wada wraca do wykonawcy przed bramką. Po poprawce
zrzuć ponownie, a przy zmianach szerokości sprawdź dekoratory `meta`, które owijają wszystkie
historie. Przy bramce na stronach aplikacji (nie w Storybooku): zrzuty i kontrast z `next build` + `next start`, nie z `next dev`, bo nakładki narzędzi deweloperskich trafiają do obrazu i do pomiaru; po zmianie danych testowych świeży build, gdy strony trzymają dane w cache; skrypt kontrastu bierze tło z elementu, który je faktycznie maluje (np. rodzeństwo `[data-part="fill"]`), i przechodzi wszystkie kroki przebiegu, nie tylko strony startowe. Gdy zrzutów zrobić się nie da (mobile bez emulatora): każda poprawka zmieniająca rozmiar elementu w kontenerze o stałej szerokości (dymek, wiersz, nagłówek) podaje w raporcie rachunek miejsca (szerokość kontenera, padding, etykieta), a elementy rysowane poza ramką (narożniki `highlight`) i tekst z `numberOfLines` dostają osobny wiersz w skrypcie bramki.
