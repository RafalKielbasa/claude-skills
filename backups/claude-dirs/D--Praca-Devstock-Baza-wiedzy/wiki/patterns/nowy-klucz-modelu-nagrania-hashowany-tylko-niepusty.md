# nowy-klucz-modelu-nagrania-hashowany-tylko-niepusty

- **Skill:** kurs-nagrywanie (zmiany silnika `tools/nagrywanie`)
- **Typ:** sukces
- **Status:** otwarty

## Opis
Nowy klucz w schemacie `nagrywanie.yaml` wszedł do modelu tak, że `haszModelu` lekcji bez tego klucza się
nie zmienił. Nagrane i zaakceptowane lekcje dalej pasują do swoich manifestów. Test z dosłownym hashem
policzonym na kodzie sprzed zmiany pilnuje tego w kolejnych zmianach.

## Przyczyna źródłowa
`haszModelu` (`tools/nagrywanie/src/schemat.js:229`) liczy hash z całego modelu. Ten sam hash sprawdzają
wznowienie ujęcia (`src/komendy.js:529`) i materiał do montażu (`src/material.js:44-47`). Każde nowe pole
modelu, nawet z wartością pustą (`{}`), zmienia hash każdej lekcji. Wznowienie i materiał nagrań zrobionych
przed zmianą przestają wtedy pasować, choć ich plan się nie zmienił. Test „po zmianie hash jest stabilny”
tego nie wyłapie: porównuje nowy kod z nowym kodem.

## Dowody
- 2026-11-02, sesja 5a729830-7014-4847-af44-dd79cd5db98c (id claude.ai niedostępny; Baza wiedzy, opcja lekcji
  `service_options.n8n.tidy_up`, #783).
  - Przed pierwszą edycją `schemat.js` policzyłem `haszModelu` modelu testowego na starym kodzie:
    `306097400130037a…178df3`.
  - Test `tools/nagrywanie/test/service-options-schema.test.js:44-46` blokuje ten literał bez opcji
    i z `service_options: {}`, a z niepustą opcją oczekuje innego hashu.
  - Implementacja (`schemat.js:239`) dokłada `serviceOptions` do hashu tylko wtedy, gdy mapa ma klucze.
  - Commit `46cbace4`. Lekcje M00L01 i 1.4 (nagrane) zostają przy swoim hashu.

## Rozwiązanie
Przy każdym nowym polu modelu nagrania (`schemat.js`, `wczytajModel`): przed edycją policz `haszModelu`
modelu bez nowego pola na starym kodzie i zablokuj go literałem w teście. Nowe pole wchodzi do hashu
wyłącznie z wartością niepustą. Lekcja, która włącza nowe pole, świadomie dostaje nowy hash: napisz
w raporcie, że jej ostatni przebieg przestaje pasować.
