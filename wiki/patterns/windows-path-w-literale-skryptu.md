# windows-path-w-literale-skryptu

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Tekst zawierający ścieżkę Windows, wklejony do literału łańcuchowego w skrypcie,
wysadza parser na sekwencji ucieczki, zanim skrypt w ogóle się uruchomi.

## Przyczyna źródłowa
`C:\Users\...` w literale Pythona, który nie jest surowy, zaczyna się od `\U` —
czyli od sekwencji `\UXXXXXXXX`. Prefiks `r` rozwiązuje problem dla krótkiej
ścieżki, ale nie dla wielolinijkowej treści, która ma jednocześnie zawierać
znaki ucieczki i ścieżki. Treść przeznaczona do wstawienia do pliku nie jest
kodem i nie powinna przechodzić przez składnię języka.

## Dowody
- 2026-09-03, sesja session_01APWRKsZej4SeoF4vvdibEC: `restore.py` odtwarzający
  wpis dziennika padł na `SyntaxError: (unicode error) 'unicodeescape' codec
  can't decode bytes in position 3603-3604: truncated \UXXXXXXXX escape`.
  Pozycja 3603 wypadła dokładnie na `C:\Users\rafal\.claude\skills\...`
  wewnątrz odtwarzanej treści. Obejście: treść zapisana heredokiem do osobnego
  pliku `.md`, a skrypt tylko ją wczytał i wstawił.

- 2026-09-03, sesja session_01APWRKsZej4SeoF4vvdibEC (druga część): ten sam
  kształt bez żadnej ścieżki Windows. Zapis specu heredokiem `<<'SPECEOF'` przez
  narzędzie Bash padł na `unexpected EOF while looking for matching ''`, bo
  narzędzie owija komendę w pojedyncze cudzysłowy, a treść zawierała angielskie
  dopełniacze (`skill's own checklist`, `the child's database id`). Naprawą było
  porzucenie heredoku na rzecz narzędzia zapisującego plik wprost. Ta sama
  lekcja weszła potem do skilla `github-tickets` jako reguła kroku 3 i jako
  wymóg podawania promptu codeksowi przez stdin, nie argumentem.

- 2026-09-04, sesja session_013eH7DXzW8DZjC16fy2ZCs4: trzeci raz ten sam
  wyzwalacz. Skrypt składający payload review dla PR #165, zapisywany heredokiem
  `<<'SCRIPT'` przez narzędzie Bash, padł na `unexpected EOF while looking for
  matching ''` — treść komentarzy zawierała angielskie dopełniacze i skrócenia
  (`student's name`, `endpoint's contract`, `does not`). Naprawa ta sama co
  poprzednio: skrypt zapisany narzędziem Write, uruchomiony z osobnego pliku,
  payload podany do `gh api` przez `--input`, nie argumentem.
- 2026-09-04/05, sesja session_01WXmUJrXM5viDmNJuc3xjy6: skrypty Pythona wklejane do heredoca przez narzędzie Bash wielokrotnie zjadły sekwencje ucieczki w podmienianym kodzie. Regex miał wejść jako klasa znaków dopasowująca ukośnik i backslash, a wyszedł z jednym backslashem mniej, czyli jako coś innego. Ciąg oznaczający nową linię stał się prawdziwą nową linią w środku literału szablonu, a escapowany cudzysłów zamienił się w goły. Naprawa za każdym razem szła przez narzędzie Edit na pliku docelowym. **Trzecia sesja z tym samym objawem — i zdarzyło się to ponownie przy zapisywaniu tego właśnie dowodu.**
- 2026-09-09, sesja session_01Kpavh9GSwwHtUcwJNUyRNm: piąty raz, tym razem na
  polskiej prozie. Dwa heredoki `<<'PLIK'` i `<<'ZRODLA'` przez narzędzie Bash
  padły na `unexpected EOF while looking for matching ''` — pierwszy przy
  zapisie artykułu lekcji, drugi przy dopisywaniu sekcji do `zrodla.md`.
  Cytowany ogranicznik heredoku nie chroni, bo komenda i tak jedzie przez
  `bash -c '...'`, a w treści stały angielskie cytaty z dokumentacji n8n
  (`You'll receive this error`, `your instance's balance`). Naprawa: artykuł
  i scenariusz zapisane narzędziem Write, a dopisek do `zrodla.md` — Write do
  pliku w scratchpadzie plus `cat plik >> cel`. Wniosek do zapamiętania:
  cytaty z angielskiej dokumentacji to prawie gwarancja apostrofu, więc przy
  nich heredoku nie ma sensu nawet próbować.

- 2026-09-09, sesja session_017vpJFetLqZycH7sUkFH2XE: szosty dowod, tym razem na wlasnym skrypcie aktualizujacym wiki. Heredoc `python - <<PY` przez narzedzie Bash padl na `unexpected EOF while looking for matching` — wyzwalaczem byly apostrofy w polskiej prozie wzorca (`cache'uje`, `Dice'a`) oraz separator `'; '` cytowany w tresci. Naprawa dokladnie wedlug sekcji Rozwiazanie tej strony: skrypt zapisany Write do scratchpada i uruchomiony sciezka, bez heredoku.

- 2026-09-10, sesja session_015PLcG6rJFegWQiawFUeamB: siódmy dowód, i pierwszy, w którym do
  heredoku popchnęła mnie instrukcja środowiska. Tryb auto tej sesji mówi wprost „make file
  changes with sed, heredocs, or short scripts, rather than using the dedicated Read, Edit, or
  Write tools". Zapis specu `cat > 2026-09-10-kurs-uwagi-design.md <<'SPEC_EOF'` padł na
  `unexpected EOF while looking for matching ''` — parser wskazał linię 40, czyli zdanie
  `Rafał's remark outranks a course rule`. Plik nie powstał w ogóle. Naprawa: narzędzie Write.
  Wniosek: instrukcja „preferuj Bash do zmian w plikach" dotyczy edycji punktowych, nie
  wielolinijkowych dokumentów prozą — te zawsze przez Write, niezależnie od tego, co mówi tryb.
- 2026-09-10, sesja session_01316pV2UPCFTTDHE9dksP6H: osmy dowod, i pierwszy,
  w ktorym regula z tej strony byla mi znana i mimo to jej nie
  zastosowalem. `cat >> zrodla.md <<'EOF'` z trzynastoma pozycjami
  zrodel padl na `unexpected EOF while looking for matching '`;
  wyzwalaczem byly apostrofy w angielskich cytatach z dokumentacji
  (`agent type setting`, `when it shouldn't`, `Salesforce'a`) - czyli
  dokladnie przypadek nazwany w sekcji Rozwiazanie zdaniem „cytat
  z angielskiej dokumentacji w tresci to prawie pewny apostrof".
  Naprawa zgodna ze strona: tresc zapisana narzedziem Write do
  scratchpada, potem doklejona krotkim `python -c`, ktory czyta plik.
  Wniosek: sama swiadomosc reguly nie wystarcza, bo heredoc jest
  odruchem przy dopisywaniu do pliku - regula musi brzmiec jako zakaz
  narzedziowy („nie uzywaj heredoku do prozy"), nie jako ostrzezenie.
- 2026-09-11, sesja session_01M1roR3MszbAgi1a1AE3xqh: dziewiąty dowód, dwa
  wystąpienia w jednej sesji, oba na regule opisanej wprost na tej stronie.
  Pierwsze: `cat > artykul.md <<'EOF'` z gotowym artykułem lekcji (~3400 słów
  polskiego markdownu z blokami kodu, backtickami i apostrofami w cytatach
  z dokumentacji) padł komunikatem `bash: -c: line 82: unexpected EOF while
  looking for matching `''` - mimo cytowanego delimitera. Plik nie powstał
  w ogóle, tura przepadła, treść trzeba było podać jeszcze raz narzędziem
  `Write`. Drugie, godzinę później i po napisaniu tej samej strony wiki:
  heredoc `python - <<'PY'` z blokiem `'''...'''`, w którym siedziały sekwencje
  `\\uXXXX` i `\\u{1F3AC}` jako **treść dowodu o innym wzorcu**, wysadził parser
  Pythona (`SyntaxError: truncated \uXXXX escape`) - też zanim cokolwiek
  się wykonało. Naprawione dopiero po przejściu na schemat opisany niżej:
  treść dowodów zapisana narzędziem `Write` do plików w scratchpadzie, skrypt
  Pythona wyłącznie ASCII, wklejanie przez `io.open(...).read()`.

## Rozwiązanie
Treść przeznaczoną do wstawienia do pliku trzymaj w osobnym pliku i wczytuj ją
w skrypcie, zamiast wklejać do literału. Skrypt ma wtedy w sobie wyłącznie
logikę i ścieżki (te jako literały surowe), a tekst nie przechodzi przez
składnię języka ani przez dwa poziomy cytowania powłoki.

Wyzwalaczem nie jest sama ścieżka Windows, tylko dowolny znak, który jeden
z poziomów cytowania traktuje jako składnię: odwrotny ukośnik w literale
nie-surowym, apostrof wewnątrz `bash -c '...'`, backtick w podwójnym cudzysłowie.
Prozy pisanej dla człowieka nie da się z góry przeczyścić z takich znaków, więc
nie przepuszczaj jej przez powłokę: użyj narzędzia zapisującego plik wprost,
a przy wywołaniach CLI podawaj długi tekst plikiem albo na stdin.
