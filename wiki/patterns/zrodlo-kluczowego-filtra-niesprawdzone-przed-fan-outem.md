# zrodlo-kluczowego-filtra-niesprawdzone-przed-fan-outem

- **Skill:** anthropic-skills:deep-research
- **Typ:** porażka
- **Status:** otwarty

## Opis
Koordynator rozpisuje badanie na kilku badaczy, choć filtr, który musi przejść
każda opcja, zależy od jednego źródła danych. Że to źródło blokuje automatyczny
odczyt, każdy badacz odkrywa osobno, w trakcie pracy, a raport nie może wykonać
kluczowego testu dla żadnej opcji.

## Przyczyna źródłowa
Skill dzieli pytanie na tematy (krok 3) i od razu uruchamia badaczy (krok 4).
Nie ma kroku, w którym koordynator sprawdza, czy źródła danych potrzebne do
kryterium rozstrzygającego są osiągalne narzędziami badaczy (WebFetch,
WebSearch). Badacze zgłaszają blokadę w lukach notatek, kiedy runda jest już
opłacona, a decyzję, jak zdobyć dane, i tak musi podjąć użytkownik.

## Dowody
- 2026-10-24, sesja session_018h6huVMv7ymFg4EEx4A78e (lokalnie
  0daa3cb0-3d18-4574-9113-63274220e556), repo agent-biznes, etap 1 badania nisz
  importu z Chin. Spec wymagał testu popytu: wolumen do progu najwyżej 20%
  miesięcznej sprzedaży niszy na Allegro. Wszyscy czterej badacze, którzy
  czytali Allegro, dostali „allegro.pl returned HTTP 403”. Raport ma przy każdej
  z 13 nisz status „niezweryfikowany”. Sposób odczytu (Claude in Chrome,
  ręczne spisanie, konto i Allegro Analytics) stał się decyzją Rafała dopiero po
  rundzie, a etap 2 musi ruszyć w innej sesji, z przeglądarką.

## Rozwiązanie
Przed uruchomieniem badaczy wypisz kryteria, które każda opcja musi przejść, i
źródło danych każdego z nich. Każde źródło, które nie jest oczywiście publiczne
(marketplace, serwis z logowaniem, aplikacja), sprawdź jednym `WebFetch`. Gdy
odpowiedź to 401, 403, CAPTCHA albo pusta strona renderowana przez JS, zapytaj
użytkownika przed rundą: narzędzie przeglądarki, dane od niego, inne źródło albo
oznaczenie kryterium jako niesprawdzalnego w tej rundzie. Badaczom wpisz w
prompt, że ta domena jest zablokowana, żeby nie tracili na nią wywołań.
