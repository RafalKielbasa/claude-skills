# crm-plan-diffu-z-usuniec-pomija-zmienione-pliki

- **Skill:** code-review-master
- **Typ:** porażka
- **Status:** otwarty

## Opis
Gałąź głównie usuwała pliki: 132 martwe pliki ikon i kilka zmienionych barreli `index.ts`. Dla niej `crm plan` wybrał
do osi 40 największych plików z diffu, czyli pliki usunięte, a zmienione barrele pominął. Usunięty plik nie ma treści
do przeczytania ani dowodu do zacytowania. Agenci osi przejrzeliby więc pustkę, a poza przeglądem zostałyby jedyne
miejsca z realnym ryzykiem: eksporty w barrelach i ich importerzy. Rafał zdecydował, że ta gałąź idzie bez review.
Weryfikację dały `tsc`, build Storybooka, vitest i grep po importerach.

## Przyczyna źródłowa
Zakładam (kodu doboru plików nie czytałem w tej sesji), że dobór waży plik wielkością zmiany (`+added/-removed`)
i nie odróżnia pliku usuniętego od zmienionego. Przy diffie zdominowanym przez usunięcia limit plików na przebieg
zjadają pliki, których nie da się przeglądać. Do tego `crm assemble` odrzuca uwagę, której dowodu nie znajdzie
w treści pliku, więc uwaga o pliku usuniętym i tak nie przeszłaby.

## Dowody
- 2026-11-12, sesja 0437af48-c40c-473a-a2a5-5d2bb978768c (id claude.ai niedostępny; code-busters-v2, DT-92 #833):
  - gałąź `fix/rafal-kielbasa/dt-92-dead-icons`, PR #1752;
  - przebieg `20261112-144536-ze1q` skończył się na samym planie: 40 największych usuniętych plików, bez zmienionych barreli;
  - Rafał: „D1 A”, czyli bez review;
  - trzy równoległe gałęzie z edycjami przeszły review normalnie (0 uwag powyżej progu).

## Rozwiązanie
W `crm plan` pliki o statusie `D` (usunięte) nie wchodzą do list plików osi i nie zajmują limitu; zmienione pliki
mają pierwszeństwo. Gdy diff to głównie usunięcia, linia budżetu mówi to wprost („X usuniętych, Y zmienionych”).
Plan proponuje wtedy kontrolę martwego kodu zamiast osi: `git grep` po ścieżkach i nazwach usuniętych eksportów,
`tsc` i build.
