# wspolny-model-liczb-narzucony-piszacemu-raport

- **Skill:** anthropic-skills:deep-research
- **Typ:** sukces
- **Status:** otwarty

## Opis
Równolegli badacze liczyli ekonomię opcji, każdy na własnych założeniach
kosztowych. Koordynator kazał autorowi raportu przeliczyć wszystkie opcje jednym
modelem zbudowanym z notatek przekrojowych i pokazać ten model raz. Dopiero to
przeliczenie dało porównywalny ranking.

## Przyczyna źródłowa
Badacze tematyczni i przekrojowi pracują w tej samej turze i nie widzą swoich
notatek. Badacz nisz nie zna zweryfikowanych stawek (prowizje, fulfillment,
fracht), więc przyjmuje własne. Ranking z takich liczb porównuje założenia, a
nie opcje. Raport i tak powstaje po wszystkich notatkach, więc to jedyne miejsce,
w którym da się zastosować jeden zestaw kosztów.

## Dowody
- 2026-10-24, sesja session_018h6huVMv7ymFg4EEx4A78e (lokalnie
  0daa3cb0-3d18-4574-9113-63274220e556), repo agent-biznes, etap 1 badania nisz
  importu z Chin. Trzy notatki niszowe liczyły prowizję Allegro od ceny netto
  albo brutto, fulfillment na zamówienie albo na sztukę, fracht morski albo
  kolejowy. Prompt autora raportu zawierał wymóg „Recompute the candidates'
  economics with one consistent model built from the verified inputs in the
  other notes, and show that model once in a table”. Przeliczenie zmieniło
  wskaźniki zysku o −44 do +14 punktów. Trzy nisze (fermentacja, kamizelki
  biegowe, wzmacniacze klasy D) odpadły dopiero po nim, a raport pokazał
  tabelę zmian przy czterech produktach.

## Rozwiązanie
Gdy raport porównuje opcje liczbami wyliczonymi przez różnych badaczy, w prompcie
autora raportu wymagaj trzech rzeczy:
- przelicz wszystkie opcje jednym modelem z danych przekrojowych;
- pokaż model jako jedną tabelę z etykietami źródeł;
- pokaż różnice względem liczb z notatek.

Jeśli stawki są znane przed rundą, daj je badaczom od razu jako wspólny szablon
kosztów.
