# review-ai-ocenia-zargon-bez-kontekstu-poprzednich-lekcji

- **Skill:** kurs-lekcja (krok 6)
- **Typ:** porażka
- **Status:** otwarty

## Opis
`npm run review-ai` wystawia werdykt DO POPRAWY za „żargon bez wyjaśnienia przy
pierwszym użyciu", wskazując termin zdefiniowany w poprzedniej, zatwierdzonej
lekcji tego samego modułu. Reguła styleguide mówi o pierwszym użyciu, ale
recenzent nie ma jak stwierdzić, gdzie ono padło.

## Przyczyna źródłowa
Review-ai dostaje jedną lekcję i styleguide, bez artykułów wcześniejszych
lekcji. „Pierwsze użycie" ocenia więc w obrębie pliku, nie kursu, a każdy
termin wprowadzony wcześniej wygląda dla niego na niewyjaśniony. Efekt jest
systematyczny i będzie wracał w każdej lekcji od drugiej wzwyż, tym częściej,
im więcej słownictwa kurs zbudował.

## Dowody
- 2026-09-09, sesja session_01Kpavh9GSwwHtUcwJNUyRNm: review lekcji 0.3 kursu
  agenty-ai (Gemini 3.1 Pro) → werdykt DO POPRAWY, punkt 6 „Zrozumiałość",
  trzy terminy: `credential`, `prompt`, `klucz API`. Dwie uwagi trafne
  (`prompt` i `klucz API` padają w kursie pierwszy raz), jedna nie:
  `credential` ma pełną definicję w lekcji 0.2 („Credential to zapisany dostęp
  do konta w zewnętrznej usłudze"), w teorii-minimum i w scenariuszu. Uwaga
  została wcielona mimo to, bo przypomnienie kosztowało jedno zdanie - czyli
  ocena trafności nie zrobiła żadnej różnicy w działaniu.

## Rozwiązanie
Przed oceną uwag z `review-ai.md` sprawdzić każdy zarzut o żargon przeciwko
artykułom wcześniejszych lekcji: `grep` po terminie w `kursy/<slug>/**/artykul.md`
lekcji ze statusem `zatwierdzona`. Termin już zdefiniowany → uwaga niezasadna,
odnotowana z numerem lekcji, w której definicja stoi; wcielenie jako
przypomnienia jest dopuszczalne, ale świadome, nie automatyczne. Docelowo:
przekazywać review-ai listę terminów zdefiniowanych we wcześniejszych lekcjach
kursu, żeby nie zgłaszał ich w ogóle.
