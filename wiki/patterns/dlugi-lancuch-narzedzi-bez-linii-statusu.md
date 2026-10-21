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
- 2026-10-16, sesja a7fb8394-0358-4975-bc18-9da4d6298a8a (id claude.ai niedostępny; Baza wiedzy, krok wiki
  `podsumuj-sesja-claude` po kompakcji): cztery przypomnienia w jednym kroku. Za każdym razem padło po 3–6
  wywołaniach bez tekstu: przeszukiwanie transkryptu skryptem, czytanie stron wzorców, sprawdzanie commitów,
  odczyt indeksów. Reguła z tej strony była w indeksie, który czytałem w pierwszym wywołaniu kroku. Linię
  statusu pisałem dopiero po przypomnieniu, nie przed nim.
- 2026-10-16, sesja d92b17c0-d005-44e9-a147-6183eb2f8eb1 (id claude.ai niedostępny; vault, pytanie „W jakich
  sytuacjach z huba będę mógł odpowiedzieć do innej sesji?”): jedno przypomnienie po pięciu turach narzędzi
  bez tekstu. Były to odczyty specu `hub-core-design.md` (§3, §5.3–§6.6, §8), `SKILL.md` huba i raportów
  akceptacji Planów 2–3. Linię statusu („Sprawdzam jeszcze, czy ścieżkę kwestionariusza…”) napisałem
  dopiero po przypomnieniu. W kroku wiki tej samej sesji pierwszą linię napisałem po czterech wywołaniach.
  Drugie przypomnienie przyszło po kolejnych czterech wywołaniach bez tekstu (dopisanie logów, sprawdzenie
  indeksu gita, commit i push), już po zapisaniu tego dowodu.
- 2026-10-16, sesja 7875e423-9ae8-4e55-a56b-31766c608f4e (id claude.ai niedostępny): dwa przypomnienia harnessu w jednej sesji — po zapisie indeksu projektu,
  commicie i czterech śladach board-tracker (pięć wywołań bez tekstu) i w kroku wiki po trzech
  odczytach; linia statusu za każdym razem dopiero po przypomnieniu.
- 2026-10-17/19, sesja e81e95d7-be5a-457d-884b-77d8d63c4251 (id claude.ai niedostępny; Baza wiedzy i repo Kodożerców, spec i plan 1
  biblioteki komponentów, egzekucja SDD): sześć przypomnień harnessu w jednej sesji, każde po 3–6 wywołaniach
  bez tekstu: rozpoznanie repo w brainstormingu (klasy `ds-*`, fonty makiety), sprawdzenie pola okładki
  w CMS przed pytaniami D5–D9, commit planu z aktualizacją śladu #665, odczyt raportu zadania 1 z paczką
  review, walidacja i commit `app.json` przeniesione w tło. Linia statusu za każdym razem dopiero po
  przypomnieniu, choć ta strona była w indeksie czytanym w poprzednich sesjach.
- 2026-10-21, sesja 0f7d3ee3-3f43-459d-b22d-93a1f726f081 (id claude.ai niedostępny), egzekucja SDD planu CMS, review końcowe, PR i podsumowanie: sześć przypomnień harnessu po kompaktowaniu, każde po 3–5 wywołaniach bez tekstu — budowa paczki review całej gałęzi, dispatch rundy poprawek, szukanie śladu #651, dopisanie sekcji do specu, sprawdzenie gałęzi sond, przegląd wiki. Linia statusu za każdym razem dopiero po przypomnieniu.

## Rozwiązanie
Przed krokiem, który potrwa ponad minutę (render, STT, upload, długi `npm run`), i po trzech wywołaniach narzędzi z rzędu bez tekstu napisz jedną linię: co robię i po co, np. „Kontrola układu odrzuciła slajd 5; sprawdzam warianty na kopii”. Bez podsumowań, jedna linia.
