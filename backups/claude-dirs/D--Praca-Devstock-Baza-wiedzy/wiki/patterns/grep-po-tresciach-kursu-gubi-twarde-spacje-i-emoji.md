# grep-po-tresciach-kursu-gubi-twarde-spacje-i-emoji

- **Skill:** kurs-lekcja (krok 4, reguła wpisana 2026-09-10); dotyczy wszystkich
  skilli `kurs-*`, a `kurs-redakcja` i `kurs-zadania` reguły jeszcze nie mają
- **Typ:** porażka
- **Status:** zaadresowany (2026-09-10, kurs-lekcja)

## Opis
Kontrolne `grep` po `artykul.md` zwracało 0 trafień dla fraz, które w pliku na
pewno są: „Też w wideo" (5 calloutów), „🎬", „U Ciebie (zwrot", „zwrot
z inwestycji". Bez pamięci świeżego odczytu wynik wyglądałby jak brak
calloutów i poszedłby do raportu jako fakt.

## Przyczyna źródłowa
Styleguide (Typografia, reguła 3) wymaga twardej spacji U+00A0 po każdym
jednoliterowym słowie w treści oglądanej, więc w pliku stoi „w wideo",
„z inwestycji", „U Ciebie" ze znakiem, którego zwykła spacja w patternie nie
dopasuje. Emoji jako pattern w Git Bash na Windowsie nie trafia z powodu
kodowania argumentu. Oba efekty dają ciche „0", nie błąd, a `-c` wygląda jak
policzony wynik.

## Dowody
- 2026-09-07, sesja session_01BFVYzhLh64ykBPjopBZyHU: `grep -c "Też w wideo"`
  → 0, `grep -n "🎬"` → nic, `grep -c "w wideo"` → 0 na pliku z pięcioma
  calloutami; kotwica `wideo**` (z escapowanymi gwiazdkami) → 5.
  `grep 'U Ciebie (zwrot\|Dla siebie:'` → 1 (tylko „Dla siebie"),
  `grep 'zwrot z inwestycji'` → nic; `grep 'Ciebie ('` → linia 131. Za każdym
  razem wynik trzeba było podważyć z pamięci odczytu, zanim poszedł dalej.
- 2026-09-09, sesja session_01PrFurqNDm53ZdkCryE5kjm: powtórka na lekcji 0.2 —
  `grep -c "Też w wideo"` → 0, `grep -c "w wideo"` → 0 i `grep -c "🎬"` → 0 na
  pliku z sześcioma calloutami; `grep -c "wideo"` → 6, a `od -c` pokazał bajty
  `w 302 240 w i d e o`. Wzorzec `"Te.* w wideo"` też chybił, bo `.` w Git Bash
  dopasowuje bajt, nie znak, a „ż" zajmuje dwa. Nowe: raport subagenta podawał
  8 calloutów zamiast 6, więc liczba z cudzego raportu wymagała tej samej
  kontroli kotwicą ASCII co własny `grep`.
- 2026-09-09, sesja session_01Kpavh9GSwwHtUcwJNUyRNm: ten sam mechanizm uderzył
  w `Edit`, nie w `grep`. Artykuł lekcji 0.3 powstał ze zwykłymi spacjami,
  a twarde wstawił dopiero skrypt po zapisaniu pliku. Dwie kolejne edycje
  odbiły się od „String to replace not found in file", bo `old_string`
  przepisany z własnego brudnopisu miał zwykłe spacje w „podział na łańcuchy
  i agentów" oraz „pole `roslina` z panelu INPUT". Narzędzie samo zgłosiło, że
  próbowało też zamiany `\uXXXX` - i nie trafiło. Zadziałała dopiero kotwica
  bez jednoliterowego słowa (`bez klucza API.`, `na to nowe pole.`).
  `grep -c "Też w wideo"` → 0 na pliku z siedmioma calloutami wystąpiło jak
  poprzednio; kotwica `wideo` → 7.
- 2026-09-10, sesja session_01316pV2UPCFTTDHE9dksP6H: czwarty dowod, trzecia
  klasa narzedzia - po `grep` i `Edit` teraz wlasny skrypt kontrolny.
  `node -e` liczacy callouty wzorcem `/Też w wideo/g` zwrocil
  `calloutow: 0` na artykule lekcji 2.1, w ktorym jest ich szesc, bo
  skrypt sierotek wstawil U+00A0 miedzy „w" a „wideo" juz po napisaniu
  pliku. Rownolegle `grep -c "🎬"` zwrocil 0 przy szesciu emoji.
  Przez chwile wygladalo to na skasowanie calloutow przez wlasna edycje;
  rozstrzygnal dopiero licznik w Pythonie po `'Te\u017c w\u00a0wideo'`
  (6) i `'\U0001F3AC'` (6). Wniosek do sekcji Rozwiazanie: skrypt
  kontrolny pisany PO przebiegu fixera podlega tej samej regule co
  `grep` i `old_string` - jego wzorzec tez trzeba kotwiczyc bez
  jednoliterowego slowa albo dopuszczac oba znaki spacji.


## Rozwiązanie
W kontrolach treści kursu kotwiczyć pattern na fragmencie bez jednoliterowego
słowa ze spacją i bez emoji (`wideo**`, `Ciebie (`, `^> `), albo w miejscu
spacji dopuszczać oba znaki: zwykłą spację i bajty `C2 A0`. „0 trafień" na
pliku właśnie przeczytanym traktować jako błąd patternu, nie jako fakt,
i sprawdzić kotwicą ASCII, zanim wynik trafi do raportu.

Ta sama zasada dotyczy `old_string` w `Edit`: po każdym przebiegu skryptu
wstawiającego twarde spacje kotwica musi być fragmentem bez `a i o u w z`
ze spacją, bo tekst przepisany z pamięci albo z brudnopisu ma w tych miejscach
zwykłą spację i nie trafi. Odbita edycja na pliku, który się właśnie zapisało,
to znak twardej spacji, nie zmiany pliku przez kogoś innego.

Reguła wpisana do `kurs-lekcja` krok 4 (2026-09-10, `/evolve-skill`).
Nawrotem będzie dopiero ciche „0" w sesji prowadzonej TYM skillem po tej
dacie. Wystąpienie w `kurs-redakcja` albo `kurs-zadania` to nie nawrót, tylko
dowód, że poprawka nie objęła całej rodziny - dokładnie ta sama sytuacja co
przy [[walidacja-calego-kursu-wnosi-cudze-bledy-do-bramki]], gdzie został
`kurs-zadania`. Rytm z tamtej strony obowiązuje i tu: przy pierwszej okazji
`grep` po katalogu skilli i lista pozostałych wystąpień do zrobienia.
