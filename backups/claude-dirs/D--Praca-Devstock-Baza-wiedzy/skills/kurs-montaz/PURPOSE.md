# PURPOSE — kurs-montaz

## Pochodzenie

Skill powstał 2026-10-02 i zastępuje ręczny montaż nagrania lekcji w CapCucie: wycięcie zbędnych scen, dopasowanie czynności na ekranie do lektora, zaznaczenia na interfejsie i sklejenie z intro i outro. CapCut nie ma API ani serwera MCP, a reszta toru B działa już w `tools/course-pipeline`, dlatego montaż robi ffmpeg sterowany plikiem decyzji (EDL). Spec: `docs/superpowers/specs/2026-10-02-kurs-montaz-design.md`, plan: `docs/superpowers/plans/2026-10-02-kurs-montaz.md`.

Skill odwraca decyzję ze specu `docs/superpowers/specs/2026-08-05-tor-b-montaz-reczny-design.md` („system niczego nie tnie”). Wtedy deklarowane czasy akcji kolidowały z narracją. Od specu z 2026-09-11 paczka lektora niesie timecode każdego akapitu, więc oś czasu montażu jest znana z góry i wystarczy dopasować do niej nagranie. Ręczny montaż w edytorze pozostaje równoprawną ścieżką.

## Adresowane wzorce

Lokalne wiki (`~/.claude/wiki/projects/…/patterns/`), wszystkie z montażu M03L01 (2026-10-05):

- zaznaczenia-montazu-bez-budzetu-przeladowuja-film — zaadresowany
- prostokat-zaznaczenia-z-jednej-klatki-przy-zmianie-ekranu — zaadresowany
- zakres-akapitu-obejmuje-ekrany-spoza-narracji — zaadresowany
- pauza-montazowa-na-starcie-zdania-ucina-gloske — zaadresowany
- kontrola-tempa-przepuszcza-poszatkowane-ujecia — zaadresowany
- kolejnosc-narracji-inna-niz-kolejnosc-nagrania — zaadresowany
- krok-miedzy-akapitami-znika-w-cieciu — zaadresowany
- agent-nie-slyszy-wtracen-lektora — otwarty (kandydat `31bbbeb0` czeka na walidację)

## Historia ewolucji

- 2026-10-02 — utworzenie skilla: bramka wejścia z listą kandydatów (krok 1), bramka decyzyjna z wyborem lekcji i ścieżkami do nagrania, intro i outro (krok 2), indeks nagrania (krok 3), EDL z regułami zaznaczeń (krok 4), bramka próbki (krok 5), pełny render z kontrolą (krok 6), przekazanie do `/kurs-video` (krok 7); zakres: wyłącznie lekcje kursów.
- 2026-10-02 — reguła „intro, outro i avatarów nie modyfikujesz”: bez wyrównywania głośności (loudnorm) i fade'ów na styku z oprawą, zostaje tylko przekodowanie do wspólnego formatu klipów.
- 2026-10-02 — krok 4: prostokąty zaznaczeń wyłącznie z komendy `klatka` (pełna rozdzielczość z siatką), nigdy z arkuszy kontaktowych — w próbnym renderze na nagraniu 4K M03L01 prostokąt oszacowany z miniatury trafił obok wyrażenia `$fromAI` (tekst leżał przy x 860–2190, oszacowanie 580–1580).
- 2026-10-05 — spokojny styl montażu po odbiorze M03L01 przez Grzegorza (zmiany ręczne na jego polecenie, poza `evolve-skill`; pełny diff w `skill-impact.md` lokalnego wiki): sekcje „Pace comes first” (pauzy zamiast przyspieszeń, obraz nigdy przed narracją, „One step, one shot” z ruchem kursora w naturalnym tempie, „Best take, whole transitions”) i „Effects palette” z limitami; krok 4 — `po` pauzy z kolumny „cięcie pauzy”, oczekiwania na martwych panelach, pola `wyciszenia` i `wstawki`, wycinanie ekranów spoza narracji; krok 5 — kafle R i porównanie Z/A na stykach. Silnik równolegle: kontrola pauz i wyciszeń na nagraniu lektora, ostrzeżenia o ramce > 6 s, udziale > 25% i ujęciu < 1,2 s, zoom przez `perspective`, kontrola długości obrazu co do klatki.
