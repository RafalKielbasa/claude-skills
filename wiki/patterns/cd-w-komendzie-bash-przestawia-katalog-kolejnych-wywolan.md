# cd-w-komendzie-bash-przestawia-katalog-kolejnych-wywolan

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
`cd <katalog> && <komenda>` w narzędziu Bash zmienia katalog roboczy nie tylko
tej komendy, ale wszystkich następnych wywołań w sesji. Kolejne ścieżki
względne trafiają w zły katalog, a harness zgłasza zmianę dopiero po fakcie,
komunikatem „Environment update — Primary working directory".

## Przyczyna źródłowa
Katalog roboczy powłoki trwa między wywołaniami narzędzia (opis narzędzia mówi
to wprost), a `cd … && …` pisze się odruchowo, żeby skrócić ścieżki w jednej
komendzie. Efekt uboczny nie jest widoczny w wyniku tej komendy i ujawnia się
dopiero, gdy następna komenda dostanie ścieżkę względną.

## Dowody
- 2026-09-06/07, sesja session_01T6FrJW1rs56KS6EsPB5agM:
  `cd .claude/skills/idea-engine && for f in lib/*.mjs …` przestawiło cwd
  sesji na katalog skilla; dwie kolejne partie komend musiały wracać przez
  `cd /e/Praca/agent-biznes && …`, co przestawiało cwd z powrotem — dwa
  komunikaty „Environment update" w jednej sesji, a wszystkie późniejsze
  komendy pisane już na ścieżkach bezwzględnych.
- 2026-09-07, sesja session_01YYxVxgP1QYqdEoh63ozDfs: `cd apps/api && pnpm exec
  jest …` przestawiło cwd na `apps/api`, potem `cd "D:/…/saas app" && git status`
  z powrotem — cztery komunikaty „Environment update" w jednej sesji. Bez
  szkody, bo `Read`/`Edit` dostawały ścieżki bezwzględne, ale każda komenda
  `pnpm exec` musiała dostać własne `cd`, bo skrypty pakietu wymagają katalogu
  `apps/api` — dokładnie przypadek na podpowłokę `( cd … && … )`, której nie
  użyłem (drugi dowód, druga sesja).
- 2026-09-07, sesja session_01BFVYzhLh64ykBPjopBZyHU: `cd "/d/…/kursy/_wspolne"
  && for f in …`, `cd …/tools/course-pipeline && npm run validate …` i powroty
  przez `cd "/d/Praca/Devstock/Baza wiedzy" && …` — cztery komunikaty
  „Environment update" i jeden „Shell cwd was reset" w jednej sesji. Bez
  szkody, bo wszystkie ścieżki były bezwzględne, ale `npm run validate` wymaga
  katalogu pakietu i za każdym razem dostawał `cd` zamiast `( cd … && … )`
  (trzeci dowód, trzecia sesja).
- 2026-09-07, sesja session_01JAgUNken6DG6aFPjDmKkAX: czwarty dowod. `cd .claude/skills/idea-engine && node --test test/` przestawil katalog na kolejne wywolania; nastepne `printf ... >> `.superpowers/sdd/.../progress.md`` padlo z `No such file or directory`, bo sciezka wzgledna liczyla sie od katalogu skilla. Naprawione sciezka bezwzgledna. Komunikat „Environment update: Primary working directory changed” przychodzi po fakcie i w dlugiej sesji latwo go przeoczyc — tu przelaczenie tam i z powrotem zdarzylo sie kilkanascie razy.

- 2026-09-11, sesja session_017aBB9RTKx1hZBSvF1TH7bi: piaty dowod, piata sesja.
  `cd ".../.claude/skills/kurs-zadania" && find . -type f` przestawilo katalog
  glowny na katalog skilla; kolejna komenda musiala zaczac sie od `cd` z powrotem.
  Potem to samo z `tools/course-pipeline` - dwa komunikaty „Environment update”
  i pieciokrotne „Shell cwd was reset”. Bez szkody, bo wszystkie sciezki byly
  bezwzgledne albo liczone od katalogu pakietu, ale `npm run validate` i
  `npm run tasuj` wymagaja katalogu pakietu i za kazdym razem dostawaly `cd`
  zamiast podpowloki `( cd … && … )` - trzecia sesja z rzedu z tym samym
  konkretnym przypadkiem (`tools/course-pipeline`).
- 2026-09-11, sesja session_01M1roR3MszbAgi1a1AE3xqh: szósty dowód, szósta
  sesja, czwarty raz z rzędu ten sam konkretny przypadek `tools/course-pipeline`.
  `cd ".../tools/course-pipeline" && npm run validate -- ...` i `npm run review-ai`
  przestawiały katalog główny tam i z powrotem między katalogiem pakietu,
  katalogiem lekcji a korzeniem repo - siedem komunikatów „Environment update"
  i cztery „Shell cwd was reset" w jednej sesji. Raz zdarzyło się to
  z realnym skutkiem: po `cd` do katalogu lekcji kolejne wywołanie skryptu
  wstawiającego twarde spacje dostało ścieżkę względną `artykul.md`, która
  akurat trafiła - ale wyłącznie dlatego, że cwd przypadkiem było już tam,
  gdzie trzeba. Podpowłoka `( cd … && … )` nie została użyta ani razu, mimo że
  rozwiązanie stoi na tej stronie od pierwszego dowodu.

## Rozwiązanie
W komendach narzędzia Bash nie używaj `cd`. Ścieżki podawaj bezwzględnie, a
gdy komenda musi biec z innego katalogu, opakuj ją w podpowłokę:
`( cd <katalog> && <komenda> )` — podpowłoka kończy się razem z komendą i cwd
sesji zostaje nietknięte.
