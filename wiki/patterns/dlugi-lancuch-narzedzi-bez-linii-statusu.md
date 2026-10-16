# dlugi-lancuch-narzedzi-bez-linii-statusu

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
W pracy złożonej z wielu wywołań narzędzi (render, rozpoznanie mowy, upload, wyszukiwanie na tablicy, czytanie wiki) robię kilka wywołań pod rząd bez żadnego tekstu. Harness wtedy wtrąca „The user hasn't heard from you in a while”. Użytkownik przez kilka minut nie wie, co się dzieje i czy praca idzie.

## Przyczyna źródłowa
Linię tekstu traktuję jak „raport”, który należy się na końcu, a nie jak sygnał postępu. Pojedyncze wywołanie wydaje się krótkie, ale łańcuch 4–6 wywołań po kilkadziesiąt sekund daje minuty ciszy. W widoku Focus rozszerzenia VS Code tekst między wywołaniami jest widoczny, więc jedno zdanie statusu nic nie kosztuje i nie zaśmieca odpowiedzi końcowej.

## Dowody
- 2026-10-15/16, sesja 96436fe2-135f-4db8-9a6a-e2d0011a65cc (id claude.ai niedostępny; Baza wiedzy, lekcja agenty-ai 1.1): pięć przypomnień harnessu w jednej części sesji. Każde wypadło po serii 3–5 wywołań bez tekstu:
  - inwentaryzacja lekcji i wyszukiwanie issue (`gh issue list`);
  - testy wariantów `kontrola-ukladu`;
  - obliczenia sum kontrolnych i upload do HeyGen;
  - analiza `dopasowanie.md` i STT;
  - czytanie indeksów wiki.

## Rozwiązanie
Przed krokiem, który potrwa ponad minutę (render, STT, upload, długi `npm run`), i po trzech wywołaniach narzędzi z rzędu bez tekstu napisz jedną linię: co robię i po co, np. „Kontrola układu odrzuciła slajd 5; sprawdzam warianty na kopii”. Bez podsumowań, jedna linia.
