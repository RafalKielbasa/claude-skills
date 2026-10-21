# poprawka-konspektu-po-akceptacji-przebiegu-zmienia-hasz

- **Skill:** kurs-montaz (i kurs-nagrywanie)
- **Typ:** sukces
- **Status:** otwarty

## Opis
Przegląd montażu wykrył błąd w tabeli przygotowania konspektu. Poprawka zmieniła `zrodla-hasz` planu nagrania, więc
zaakceptowany raport przebiegu próbnego przestał się zgadzać z treścią. Claude nie poprawił hasza ręcznie. Sprawdził
w kodzie, który etap blokuje rozjazd, i zgłosił skutek Rafałowi.

## Przyczyna źródłowa
Hasz źródeł obejmuje cały konspekt i scenariusz, łącznie z sekcjami, których automat nie wykonuje. Bramka
`powodBlokadyPrzebiegu` (`tools/course-pipeline/src/przebieg-probny.js:18`) blokuje etap 1 `/kurs-video`, czyli płatnego
lektora (`src/video.js:261-264`). Etap 2 przepuszcza, bo lektor jest już opłacony. Nie ma procedury ponownej akceptacji
raportu po zmianie samej dokumentacji, więc kusi ręczne przepisanie hasza.

## Dowody
- 2026-10-20, sesja 541cf3f0-bb8c-449a-92fd-d69e74d140fc (id claude.ai niedostępny): lekcja agenty-ai 1.3. Wiersz
  „Test eksportu z Worda” poprawiony na „`§` jako `<h2>`” (`d2b4c2fb`). Hasz zmienił się z 27c3f98db91f na
  01f198608182, a `przebieg-probny.md` został na starym. W raporcie stoi: blokuje tylko ponowny etap 1, hasza nie
  zmieniałem. Etap 2 przeszedł następnego dnia bez obejścia.

## Rozwiązanie
Po zmianie konspektu albo scenariusza w lekcji z zaakceptowanym przebiegiem nie przepisuj `zrodla-hasz` w
`przebieg-probny.md`. Napisz w raporcie, że ponowny etap 1 wymaga nowego przebiegu albo jawnego `--bez-przebiegu` od
Rafała. Napisz też, że etap 2 nie jest blokowany.
