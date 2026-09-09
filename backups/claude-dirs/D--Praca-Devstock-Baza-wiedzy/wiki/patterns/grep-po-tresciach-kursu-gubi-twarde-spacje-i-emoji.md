# grep-po-tresciach-kursu-gubi-twarde-spacje-i-emoji

- **Skill:** kurs-redakcja (krok 5), dotyczy wszystkich skilli `kurs-*`
- **Typ:** porażka
- **Status:** otwarty

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

## Rozwiązanie
W kontrolach treści kursu kotwiczyć pattern na fragmencie bez jednoliterowego
słowa ze spacją i bez emoji (`wideo**`, `Ciebie (`, `^> `), albo w miejscu
spacji dopuszczać oba znaki: zwykłą spację i bajty `C2 A0`. „0 trafień" na
pliku właśnie przeczytanym traktować jako błąd patternu, nie jako fakt,
i sprawdzić kotwicą ASCII, zanim wynik trafi do raportu.
