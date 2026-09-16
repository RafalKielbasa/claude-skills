# grep-po-tresciach-kursu-gubi-twarde-spacje-i-emoji

- **Skill:** kurs-lekcja (krok 4, reguła wpisana 2026-09-10; krok 3f, reguła
  związana z przebiegiem wstawiającym, 2026-09-16), kurs-redakcja
  (krok 5, 2026-09-11) i kurs-zadania (krok 4, 2026-09-11); `kurs-uwagi` ma
  odpowiednik reguły w kroku 7 (propagacja) — rodzina `kurs-*` domknięta
- **Typ:** porażka
- **Status:** zaadresowany (2026-09-16, kurs-lekcja) — nawrót z 2026-09-11 zamknięty podpunktem 3f, który wiąże regułę z przebiegiem wstawiającym twarde spacje zamiast zostawiać ją w checkliście kroku 4

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
- 2026-09-11, sesja session_01M1roR3MszbAgi1a1AE3xqh: piąty dowód, pierwszy PO
  wpisaniu reguły do `kurs-lekcja` krok 4 - czyli nawrót, w sesji prowadzonej
  tym właśnie skillem. Lekcja 2.2, dwa wystąpienia pod rząd. Najpierw `Edit`
  odbił się od "String to replace not found in file" na `old_string`
  przepisanym z własnego brudnopisu sprzed przebiegu skryptu sierotek; kotwica
  zawierała "w tej lekcji" i "i obie", czyli dwa jednoliterowe słowa ze zwykłą
  spacją. Narzędzie samo zgłosiło, że próbowało też zamiany sekwencji
  unikodowych i nie trafiło. Zadziałała dopiero kotwica bez jednoliterowego
  słowa (`gwiazdka wstawia pod spodem.**`). Zaraz potem własny skrypt
  kontrolny `node -e` liczący callouty wzorcem z emoji i zwykłą spacją zwrócił
  `calloutow w artykule: 0` na pliku z ośmioma calloutami; kotwica `wideo**`
  dała 8. Regułę z kroku 4 miałem przeczytaną na starcie sesji i złamałem ją
  dwa razy - rozpoznałem objaw od razu, bo jest opisany, ale nie zapobiegłem
  mu. Trzecie wystąpienie tej samej rodziny, tym razem odwrotne: kontrolne
  `grep -i "API"` po artykule dało 15 trafień, wszystkie fałszywe, bo "napisze"
  i "zapisz" zawierają `api` jako podciąg. Wzorzec nie chybił - trafił za dużo,
  a wniosek "w artykule jest żargon API" byłby równie nieprawdziwy jak "nie ma
  calloutów".
- 2026-09-16, sesja (id niedostępny): szósty dowód, pierwszy **poza jakimkolwiek
  skillem `kurs-*`**. Zwykła praca na treści (usunięcie nagłówka H1 z czterech
  artykułów modułu 2 po decyzji o krótszych tytułach): `Edit` odbił się trzy razy
  z „String to replace not found", choć `old_string` był kopią tego, co przed
  chwilą wypisał `head -6`. Powód pokazał dopiero `cat -A`: `i M-BM- pierwsze`,
  czyli U+00A0 po jednoliterowym „i" w H1 lekcji 2.1 (tak samo 2.3 i 2.4);
  przeszła jedynie lekcja 2.2, której nagłówek nie ma jednoliterowego słowa.
  Naprawa poszła kanałem liniowym, nie tekstowym: `sed -i '1,2d'` z asercją
  („linia 1 zaczyna się od `# `, linia 2 pusta") i wypisaniem wyniku per plik.
  Wniosek dla umiejscowienia reguły: podpunkt 3f `kurs-lekcja` z 2026-09-16 wiąże
  ją z przebiegiem wstawiającym twarde spacje **wewnątrz pracy nad lekcją**,
  a ten przypadek przyszedł z zupełnie innej strony — z publikacji. Reguła
  „`old_string` z pliku kursowego kotwicz bez jednoliterowego słowa ze spacją"
  należy się każdej sesji dotykającej `kursy/`, nie tylko rodzinie `kurs-*`.

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

**Nawrót 2026-09-11.** Reguła z kroku 4 była przeczytana na starcie sesji
i mimo to złamana dwa razy w jednej lekcji. Sama reguła jest trafna, ale stoi
w złym miejscu: krok 4 to samokontrola, a szkoda dzieje się w kroku 3, przy
edycjach pliku tuż po przebiegu skryptu sierotek - wtedy, gdy o twardych
spacjach najłatwiej zapomnieć, bo właśnie się je wstawiło. Kandydat na kolejną
ewolucję: przenieść regułę do kroku 3 albo związać ją ze skryptem
(„kto wstawia twarde spacje, ten od tej chwili kotwiczy bez `a i o u w z`"),
zamiast zostawiać ją jako punkt checklisty odczytywanej później.

Drugie rozszerzenie z tej samej sesji: pułapka ma dwie twarze. Obok cichego
„0" jest ciche „za dużo" - `grep -i` po krótkim ciągu ASCII (`API`) trafia
w podciągi polskich słów („n**api**sze", „z**api**sz") i daje 15 trafień tam,
gdzie prawdziwych jest zero. Wniosek z takiego wyniku jest równie fałszywy jak
z zera, tylko brzmi groźniej. Przy kontrolach na krótkich akronimach kotwiczyć
na granicy słowa (`\bAPI\b`) albo czytać trafienia z kontekstem, zanim
wejdą do raportu.

**Pokrycie rodziny domknięte 2026-09-11** (`/evolve-skill kurs-redakcja`
i `/evolve-skill kurs-zadania`, obie propozycje przyjęte w wariancie pełnym).
Reguła stoi teraz w `kurs-lekcja` krok 4, `kurs-redakcja` krok 5,
`kurs-zadania` krok 4 i — jako reguła propagacyjna — w `kurs-uwagi` krok 7.
Obie dzisiejsze zmiany wniosły też drugą połowę pułapki, ciche „za dużo" przy
krótkich akronimach (`\bAPI\b`), której nie miał dotąd żaden skill rodziny.

**Nawrót zamknięty 2026-09-16** (`/evolve-skill kurs-lekcja`, przyjęte
w wariancie pełnym). Z dwóch wariantów nazwanych wyżej — przeniesienie reguły
do kroku 3 albo związanie jej z przebiegiem — wszedł drugi. `kurs-lekcja` ma
teraz podpunkt 3f: twarde spacje wstawia się na końcu kroku 3, a od tej chwili
własny brudnopis jest nieaktualny wobec dysku, więc do końca lekcji KAŻDY
`old_string`, pattern `grep` i wzorzec skryptu kontrolnego kotwiczy się bez
jednoliterowego słowa ze spacją — nie tylko kontrole checklisty kroku 4, która
zostaje na miejscu. Pierwszy wariant (przeniesienie) pozostaje nietknięty:
Rafał odłożył go 2026-09-11 słowem „Nie teraz" i ta decyzja nie została
cofnięta. Przy tej samej zmianie `kurs-lekcja` dostał wreszcie drugą połowę
pułapki, ciche „za dużo" przy krótkich akronimach (`\bAPI\b`), w brzmieniu
skopiowanym z `kurs-redakcja` krok 5 — czyli rodzina mówi teraz jednym głosem
o obu twarzach.

Sprawdzone przy tej zmianie: komendy naprawiającej sierotki w `course-pipeline`
NIE MA (`typografia.js` to detektor, `sierotki` jest tam flagą walidacji, nie
fixerem), więc przebieg wstawiający twarde spacje jest zawsze doraźnym skryptem
— podpunkt 3f mówi o tym wprost, żeby reguła nie wyglądała na związaną
z nieistniejącą komendą.

**Czym będzie kolejny nawrót:** ciche „0" albo ciche „za dużo" w sesji
prowadzonej `kurs-lekcja` po 2026-09-16. Wystąpienie w `kurs-redakcja`,
`kurs-zadania` albo `kurs-uwagi` to nadal nie nawrót tego wpisu — reguła stoi
tam od 2026-09-11 w wariancie z kroku 4, bez powiązania z przebiegiem
wstawiającym. Gdyby padło właśnie tam, kandydatem jest przeniesienie wariantu
3f do reszty rodziny, tym samym rytmem co poprzednio.
