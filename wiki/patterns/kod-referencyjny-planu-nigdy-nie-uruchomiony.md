# kod-referencyjny-planu-nigdy-nie-uruchomiony

- **Skill:** superpowers:writing-plans
- **Typ:** porażka
- **Status:** otwarty

## Opis

Plan implementacyjny zawiera kompletne bloki kodu, żeby implementer nie
improwizował. Te bloki powstają w jednym przebiegu pisania i **nigdy nie są
uruchamiane**, zanim staną się briefem. Defekt w nich propaguje się do kodu z
pełną wiernością, a review zadania go nie widzi, bo zadanie zgadza się ze swoim
briefem co do znaku.

## Przyczyna źródłowa

Plan jest oceniany jako dokument (self-review, review przez codex), a nie jako
program. Oba przeglądy czytają kod, żaden go nie wykonuje. Im wierniej
implementer przepisuje, tym pewniej defekt planu dociera do repozytorium — a
wierność jest tym, o co się go prosi.

## Dowody

- 2026-09-04/05, sesja session_01WXmUJrXM5viDmNJuc3xjy6: budowa skilla
  `code-review-master` z planu o 19 zadaniach. Finalne review całej gałęzi
  orzekło **not ready** — 5 uwag krytycznych, każda odtworzona na prawdziwym
  repozytorium, **wszystkie w tekście planu**, żadna w transkrypcji agentów.
  Najgroźniejsza: `{ id, codex: null, ...finding }` ze spreadem na końcu, przez
  co agent podający własne `id` sprawiał, że dwie uwagi blokujące znikały, a
  raport meldował „brak uwag" i kończył zerem. Wcześniej w tej samej sesji plan
  dał: parser YAML milcząco łykający składnię spoza podzbioru, `commitAll` po
  `makeRepo` bez niczego do zacommitowania, test nazwany „sekcja bez yaml nie
  jest osią" niezawierający sekcji bez yaml, sprzeczne liczebniki polskie
  (kod i test niezgodne ze sobą i oba błędne), `runCodex` niemogący uruchomić
  codexa na Windowsie, oraz `crm gate` czytające „ostatni przebieg" bez pojęcia,
  którego przebiegu dotyczy pytanie.
- 2026-09-06/07, sesja session_01T6FrJW1rs56KS6EsPB5agM: Plan B silnika pomysłów
  (11 zadań, 5157 linii, kompletne bloki kodu dla `lib/dispatch.mjs`,
  `lib/agent-schema.mjs`, `lib/merge.mjs`, pięciu trybów i piętnastu promptów)
  oceniony wyłącznie lekturą. Review przez codex znalazło dwa realne defekty:
  `schema/run-plan.json` z Planu A ma `additionalProperties: false`, więc pola
  `target`, `input`, `agents[].kind` dopisywane przez Plan B łamały dokument;
  `SKILL.md` kazał po niepustym `memo-check.json` renderować prompt z
  `--retry`, a `synthesize finish` nie zapisywał pliku błędów, którego
  `--retry` wymaga. Self-review złapał trzy kolejne rozumowaniem, nie
  uruchomieniem: `ref` przenoszony do obiektu claimu psuł detekcję „replace" w
  `mergeClaims` (`canonicalJson` widział dodatkowy klucz), R10 odrzucało
  ponowny `validate merge` (plan miał już weryfikatorów, ledger nie), błędna
  liczba `pending` w podsumowaniu (11 zamiast 15). Żaden blok nie został
  wykonany przed oddaniem planu do egzekucji.
- 2026-09-06/07, sesja session_01CqWuPYXRh5VSuurqzqb5y3: egzekucja Planu A tego
  samego silnika, 18 zadań, każde z osobnym recenzentem. **Wszystkie 7 wad
  Important znalezionych przez recenzentów w Taskach 1–16 siedziało w kodzie,
  który plan podaje dosłownie — żadna nie była błędem transkrypcji.** Do tego
  trzy defekty planu wykryte poza review, każdy uniemożliwiający wykonanie
  zadania jak napisane: stała `WEIGHTS` zadeklarowana bez `export`, a używana
  w innym pliku (test rzuciłby `ReferenceError`); helper testowy
  `entry({ ts: … })` niemogący nadpisać `ts`, bo `makeEntry` liczy je z `now`
  i nigdy nie czyta takiego parametru (asercja nieosiągalna); brak `join` na
  liście importów przy kodzie handlera, który go wywołuje. Najgroźniejsza z wad
  Important: `checkOutputs` i `checkLedgerAgainstPlan` — obie z sygnaturą
  walidatora zwracającego listę błędów — rzucały surowym `TypeError` na
  zniekształconym wejściu, łamiąc ograniczenie „Validators never throw"
  zacytowane dosłownie w Global Constraints tego samego planu. Wzorzec
  potwierdza się też od drugiej strony: wierność transkrypcji była wysoka
  (recenzenci wielokrotnie potwierdzali zgodność bajt w bajt z briefem), co
  dokładnie zgadza się z przyczyną źródłową — im wierniej, tym pewniej defekt
  planu dociera do repozytorium.
- 2026-09-07, sesja session_01JAgUNken6DG6aFPjDmKkAX: czwarty dowod, czwarta sesja. Skan pre-flight planu B (5157 linii) znalazl w kodzie referencyjnym dwa defekty czyniace plik testowy nieuruchamialnym: `import { validMemo }` kolidujacy z `export function validMemo` w `refs.test.mjs:7` (`SyntaxError`, ktory kladł tez piec testow Plan A) oraz piec wywolan `checked()`/`verified()` w `synthesize.test.mjs` asertujacych `code === 0` bez utworzenia repo — cztery z pieciu testow zadania padalyby na pierwszej asercji. Nowe wzgledem poprzednich dowodow: wystarczyl skan **statyczny** przed pierwszym dispatchem, bez uruchamiania kodu — wystarczylo, ze ktos przeczytal go z zamiarem wykonania, zamiast ocenic jako dokument.
- 2026-09-08/09, sesja session_01VwQutH9xHrU3vwiwnhbL8y: piaty dowod, piata sesja. Plan trybu
  `vision` (8 zadan, ~2000 linii) przeszedl self-review i review przez codex (10 uwag, 9
  wcielonych) — oba czytaly kod, zaden go nie uruchomil. Dwie z czterech uwag Important
  znalezionych potem przez recenzentow zadaniowych siedzialy w kodzie planu, nie
  w transkrypcji: (1) `validateVision` budowal `RegExp` z niezwalidowanego id klocka, wiec
  wiersz z metaznakiem w id i niepusta kolumna notatek rzucal `SyntaxError: Unterminated
  group` z walidatora — lamiac ograniczenie „Validators never throw" zacytowane w Global
  Constraints tego samego planu, dokladnie tak jak w dowodzie z 2026-09-06/07; (2)
  `checkSeedAgainstCurrent` porownywal `title` i liste id bez sprawdzenia, czy szkic w ogole
  sparsowal sie jako wizja, wiec dwa dowolne nieparsowalne teksty przechodzily z pusta lista
  bledow. Nowe wzgledem poprzednich dowodow: wada dotknela **tekstu instrukcji, nie tylko
  kodu** — dwa Important z Taska 8 to brakujace zdania w `SKILL.md` podanym przez plan
  dosłownie (krok omowienia nie wymienial pliku zrodlowego tez, a krok omowienia notatek
  pomijal sekcje `## Odpowiedzi`, czyli dokladnie te tresc, dla ktorej caly plan powstal).
  Blok prozy w planie jest wykonywany przez model tak samo jak blok kodu i tak samo nikt go
  przed egzekucja nie „uruchomil".
- 2026-09-09, sesja session_017vpJFetLqZycH7sUkFH2XE: blok `parseKonspekt` z planu przepisany wiernie do `src/plan-nagrania.js`; flush pola `lead` w galezi kroku mial warunek `if (leadLines)`, prawdziwy dla PUSTEJ tablicy, wiec drugi krok segmentu nadpisywal `lead` pustym stringiem. Test z planu przechodzil, bo jego przyklad mial jeden krok. Review zadania 1 tego nie zobaczylo (kod zgadzal sie z briefem co do znaku); znalazl to dopiero implementer zadania 4, ktory uzyl tej funkcji na dwukrokowym przykladzie.
- 2026-09-11, sesja session_01YVYBimtiCfF3SS1QHH4Cvi: plan `2026-09-10-kurs-uwagi` przypiął w Global Constraints regex usuwania jako "exact", a w Tasku 4 test, który przy tym regexie nie mógł przejść — dwa bloki kodu tego samego planu, wzajemnie sprzeczne, żaden nigdy nie uruchomiony. Sprzeczność wyszła dopiero u implementera Taska 4, po self-review planu i po review przez codex.

- 2026-09-15, sesja session_01FP9aoLo5yuoCv411Gis6gR: ósmy dowód, ósma sesja. Plan toru
  stacjonarnego (17 zadań, 4167 linii; kompletne moduły `konspekt-bloku.js`,
  `validate-blok.js`, `zadania-sali.js`, `checklista-sali.js`, `paczka-sali.js` i ok. 40
  testów vitest) oddany do przeczytania po self-review i review przez codex (4 uwagi,
  wszystkie wcielone) — oba przeglądy czytały kod, żaden go nie uruchomił. Codex
  potwierdził „sygnatury istniejącego kodu użyte poprawnie", co jest sprawdzeniem
  statycznym, nie wykonaniem. `npx vitest run` na tymczasowym pliku z blokami zadania 1
  kosztowałby minuty; „Rozwiązanie" tej strony, znane od siedmiu dowodów, nadal nieużyte.
- 2026-09-16, sesja (id niedostępny), repo Baza wiedzy: dziewiąty raz, dziewiąta sesja. Plan
  scalenia ściągi klawiaturowej z konspektem (8 zadań, 46 kroków, komplet fragmentów
  `plan-nagrania.js`, `validate-lesson.js` i ok. 15 bloków testowych) oddany po self-review
  i review codexa — żaden blok nie uruchomiony. Tym razem koszt był policzalny: codex znalazł dwa
  defekty, które `npx vitest run` pokazałby natychmiast (fixture `KONSPEKT_DEMO` odrzucany przez
  nową bramkę w dwóch plikach testowych), a moja kontrola statyczna ich nie widziała. Baseline
  suite'u uruchomiłem (121/121) — czyli dostęp do wykonania był, tylko nieużyty na kodzie
  referencyjnym planu. Wart odnotowania wariant: uruchomienie **samego fixture'u** przez istniejący
  suite jest tańsze niż uruchomienie bloków zadania i łapie dokładnie tę klasę defektu.
- 2026-10-08, sesja 8d719440 (id claude.ai niedostępny), repo Baza wiedzy: dziesiąty dowód. Plan bramki
  `/daily` niósł pełny `check_runs.py`; przed zapisem planu przeszedł tylko `ast.parse`, nie uruchomienie.
  W egzekucji wyszły: `IndexError` przy krótszym przebiegu (indeksowanie kart), crash cp1252 przy
  przekierowaniu wyjścia i dwie błędne wartości oczekiwane (15 zamiast 16 kart, `## Statusy` jako dowód
  pokazania notatki) — każda kosztowała ruling. Zob. asercja-testu-na-sygnale-zastepczym.
- 2026-10-15, sesja ad16420c-5965-4484-a54d-32148a48f6ea (id claude.ai niedostępny), repo Baza wiedzy:
  jedenasty dowód, plan `2026-10-15-nagrywanie-przelaczanie-kart` (tools/nagrywanie, 8 zadań, review
  codex przeszło). Trzy defekty w kodzie testów planu, żaden nie wykonany przed briefem: helper `piksel`
  z `-ss t` zwracał NASTĘPNĄ klatkę (ffmpeg daje pierwszą z pts ≥ t), więc test z planu padł w Tasku 1
  i implementer poprawił seek; próg `sprawdzone > 20` przy próbkach co 100 ms na okresie 500 ms zależał
  od fazy zegara (2 albo 3 trafienia na 5, ~21 próbek) i padł dopiero w siódmym pełnym przebiegu;
  klasyfikator koloru karty liczył magentę jako kartę `b`, więc E2E nie mogło wykryć mignięcia planszy
  (znalazło to review całej gałęzi). Nowe: defekty **numeryczne/czasowe** w kodzie testu (semantyka seek,
  liczność próbek) — tych nie łapie ani lektura, ani pojedynczy zielony przebieg.
- 2026-10-19, sesja e81e95d7-be5a-457d-884b-77d8d63c4251 (id claude.ai niedostępny), plan 1 biblioteki komponentów Kodożerców:
  dwunasty dowód. Global Constraints i zadania 11–12 kazały w repo mobile „`pnpm format:write` only on
  touched files (pass the paths)”. Skrypt to `prettier --write .`, więc dopisane ścieżki niczego nie
  zawężają; implementer zadania 1 sformatował 31 niepowiązanych plików (odłożone na `stash@{0}`, plan
  poprawiony na `npx prettier --write <pliki>`). Blok `scripts` z `package.json` czytałem przy pisaniu
  planu, ale komendy nie uruchomiłem. Nowe: defekt w **komendzie** planu, nie w bloku kodu — wystarczyło
  jedno `grep '"format:write"' package.json` przed zapisem kroku.
- 2026-10-21, sesja 0f7d3ee3-3f43-459d-b22d-93a1f726f081 (id claude.ai niedostępny), plan 1 warstwy CMS katalogu publicznego: trzynasty dowód. Plan kazał podpiąć `isCourseEditor(session)` wprost jako dostęp pól Keystone (i list w zadaniach 3–4). Keystone woła funkcję dostępu z obiektem `{ session, context, listKey, … }`, więc pól katalogu nie mógł zapisać nikt (fail closed, bez błędu). Testy z planu wołały pomocnika z gołą sesją i były zielone; złapało to review zadania 2, nie test. Poprawka: `courseEditorAccess({ session })` i ruling na zadania 3–4. Odmiana wzorca: kod pomocnika poprawny, błędne jego podpięcie do frameworka, którego żaden test nie wykonuje.

- 2026-10-22, sesja session_01QxjrWc65U98yvi7rPWyHoa (lokalnie bdda6800-f7c7-4172-b436-16c321621fcf), plan M1 migracji Kodożerców: czternasty dowód, tym razem złapany przed dispatchem. Task 6 kazał sprawdzić `lib/forms/form-errors.ts` przez `node --experimental-strip-types -e "import(...)"`, a w tym samym pliku umieścić `announceFormErrors` z importem `react-native`. Skan pre-flight uruchomił `node -e "import('react-native')"` → `Unexpected token 'typeof'`, więc sprawdzenie z planu nie mogło przejść; ruling R3 rozdzielił plik na czysty helper i plik z `react-native`. Odmiana: defekt w **komendzie weryfikacji** planu, wykryty jej jednym uruchomieniem w pre-flight.

- 2026-10-26/27, sesja session_01WryF5VMEsMHtnHj5CCKTC4 (lokalnie 1faa07a7-ff1f-431b-bc16-b826e84f3e24), plan 4 (M2) migracji Kodożerców: piętnasty dowód, złapany przed dispatchem zadania 4.
  - Plan kazał sprawdzić w Node „code tokens are equal in both themes” (każdy klucz `code-*` równy w obu motywach). Na tym założeniu oparł też memoizację WebView edytora.
  - Dane przyszły z gałęzi kontraktów v1.2 dopiero po pre-flight. Jedno wywołanie `node -e` na `tokens/generated/colors.js` pokazało, że `code-bg` się różni (`#0a0f1c` / `#0f1729`), więc sprawdzenie z planu nie mogło przejść.
  - Ruling R16: równość dla pozostałych kluczy, a `code-bg` dociera do panelu bez przeładowania.
  - Odmiana: założenie planu o **danych**, które powstają w innym strumieniu. Sondę trzeba uruchomić w chwili, gdy dane trafiają do gałęzi, a nie tylko w pre-flight.

## Rozwiązanie

Zanim plan stanie się źródłem briefów, uruchom jego kod: dla każdego bloku,
który implementer ma przepisać, odpal choćby raz jego najważniejszą funkcję na
danych z jego własnego testu. Blok, którego nikt nie wykonał, oznacz w planie
jako niezweryfikowany, żeby review zadania wiedziało, że jest pierwszym
czytelnikiem, który może go sprawdzić.
