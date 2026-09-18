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

- 2026-09-11, sesja session_01Ed5FeuzWuuXgE2NexUX3pe: piata sesja z rzedu z tym samym objawem. Dwa "Environment update" (`tools/course-pipeline` po `npm run validate`, `.claude/skills/kurs-video` po `ls`) i dwa "Shell cwd was reset". Podpowloka `( cd ... && ... )` znowu nie uzyta ani razu, mimo ze strona opisuje ja wprost; nawyk `cd X && komenda` okazuje sie silniejszy niz przeczytana regula. Szkody nie bylo tylko dlatego, ze kazde kolejne wywolanie zaczynalo sie od wlasnego `cd` ze sciezka bezwzgledna - czyli od obejscia, nie od poprawki.

- 2026-09-11, sesja session_01YVYBimtiCfF3SS1QHH4Cvi (druga część dnia, po `/clear`): ósmy dowód,
  siódma sesja, piąty raz z rzędu ten sam konkretny przypadek
  `tools/course-pipeline`. Dziesięć komunikatów „Environment update" i dwa
  „Shell cwd was reset" — katalog wędrował między korzeniem repo, katalogiem
  lekcji, `video/audio`, katalogiem pakietu i `.claude/wiki`. Podpowłoka
  `( cd … && … )` nie użyta ani razu, mimo że rozwiązanie stoi na tej stronie
  od pierwszego dowodu, a strona była w tej sesji czytana. Raz otarło się
  o szkodę: skrypt wstawiający twarde spacje dostał względną ścieżkę
  `artykul.md` i trafił tylko dlatego, że cwd przypadkiem stało w katalogu
  lekcji. Osiem dowodów bez ani jednego użycia poprawki znaczy, że reguła
  zapisana na stronie wzorca nie zmienia nawyku — jej miejscem jest
  `~/.claude/CLAUDE.md`, nie wiki.


- 2026-09-14, sesja session_01EBknRAiTAR3Phdk3gLiwNP: dziewiaty dowod, osma sesja. Osiem komunikatow
  "Environment update" o zmianie katalogu roboczego, znowu bez ani jednego uzycia
  podpowloki `( cd ... && ... )`. Katalog wedrowal miedzy `kursy/`, `kursy/_wspolne`,
  `kursy/agenty-ai`, katalogiem lekcji, katalogiem sasiedniej lekcji
  i `tools/course-pipeline`, a kazde `npm run validate` przestawialo go z powrotem
  na `tools/course-pipeline`. Szkody nie bylo, bo wszystkie sciezki w skryptach byly
  bezwzgledne albo liczone od jawnego `cd` w tej samej komendzie - ale dwa razy
  musialem sprawdzic, gdzie stoje, zanim napisalem kolejna komende.

- 2026-09-15, sesja session_01FP9aoLo5yuoCv411Gis6gR: dziesiąty dowód, dziewiąta sesja,
  znowu `tools/course-pipeline`. Trzy komunikaty „Environment update" i dwa „Shell cwd was
  reset" — katalog wędrował między korzeniem repo, `tools/course-pipeline`, vaultem
  `D:/Notatki/notatki` i `~/.claude/wiki`. Każda komenda zaczynała się od własnego
  `cd "…" &&`, podpowłoka `( cd … && … )` nie użyta ani razu. Bez szkody, bo wszystkie
  ścieżki były bezwzględne.

- 2026-09-18, sesja fe0e2a4e (id claude.ai niedostępny): jedenasty dowód,
  dziesiąta sesja, i PIERWSZY z realną szkodą zamiast samych komunikatów
  „Environment update". `cd ".../prezent/out/.review/lektor" && ls` zostawiło
  powłokę wewnątrz katalogu stagingu. Kilka wywołań później sprzątanie
  `cp … && rm -rf out && …` padło na `rm: cannot remove 'out/.review/lektor':
  Device or resource busy`, bo usuwany katalog był katalogiem roboczym sesji.
  Łańcuch `&&` urwał się w połowie: pliki zostały skopiowane, ale staging
  usunął się tylko częściowo (zniknęły `instrukcja.md`, `narracja.md`
  i zawartość `lektor/`, został pusty katalog), a kolejne polecenia w tej samej
  komendzie — aktualizacja `live.yaml` — w ogóle nie poszły. Naprawa: `cd` do
  korzenia repo i powtórzenie `rm`, plus sprawdzenie rozmiarów skopiowanych
  mp3 co do bajta, bo po częściowym `rm` nie było już z czym ich porównać.
  Podpowłoka `( cd … && … )` znowu nie użyta ani razu.

## Rozwiązanie
W komendach narzędzia Bash nie używaj `cd`. Ścieżki podawaj bezwzględnie, a
gdy komenda musi biec z innego katalogu, opakuj ją w podpowłokę:
`( cd <katalog> && <komenda> )` — podpowłoka kończy się razem z komendą i cwd
sesji zostaje nietknięte. Przed `rm -rf <katalog>` sprawdź dodatkowo, gdzie
stoi powłoka: katalog roboczy sesji leżący w usuwanym drzewie daje `Device or
resource busy`, a łańcuch `&&` urywa się wtedy w połowie i zostawia stan
częściowy.
