# Nauka z Claude — tryb ekspozycji i rejestr fundamentów

Data: 2026-09-01
Dotyczy: `~/.claude/skills/nauka-z-claude/SKILL.md`, `D:\Notatki\notatki\.claude\skills\tidy-journal\SKILL.md`
Poprzedni spec: `2026-08-09-nauka-z-claude-design.md`

## Problem

Powtórki przestały uczyć. Trzy niezależne przyczyny, wszystkie zmierzone na
stanie pliku `D:\Notatki\notatki\nauka-z-claude.md` z 2026-09-01.

**1. Brak warstwy fundamentów.** Plik trzyma 51 pozycji powtórkowych: 22
tematyczne i 29 notatkowych. Fraza „nie wiem, wytłumacz" pada w nim 16 razy,
niemal wyłącznie przy pozycjach tematycznych. Te luki nie są rozsiane —
układają się w sześć powtarzających się osi, z których każda leży warstwę
**poniżej** tematu, który ją wywołał:

| Oś | Gdzie wraca |
|---|---|
| Model wykonania Node/JS: pętla zdarzeń, uchwyty, `await` jako punkt przerwania, wyścigi, zasięg stanu | FE→BE kroki 5 i 7, Redis krok 2 |
| Kryptografia: podpis vs szyfrowanie, symetria vs asymetria | FE→BE krok 4 (HMAC), GCS kroki 2–3 (signed URL) |
| Sieć od dołu: TCP, RTT, strumienie, gniazda | Redis krok 2, GCS krok 5 (`ECONNRESET`), FE→BE krok 9 (keep-alive) |
| Zasoby procesu i OS: deskryptory, GC, pamięć, tożsamość procesu | Redis krok 2, GCS kroki 1 i 3 |
| HTTP: kto jest aktorem — przeglądarka czy JS | FE→BE kroki 2–3, GCS krok 5 |
| Gwarancje rozproszone: at-least-once, idempotencja, brak kolejności | Redis krok 1, temat „Potwierdzanie płatności" |

Skill nie ma dziś **żadnego** mechanizmu, który by taką oś rozpoznał, zapisał
i przerobił. Zasada nadrzędna („na «naucz mnie X» NIE odpowiadasz wykładem")
zakazuje ekspozycji w każdym trybie, a metoda sokratejska nie działa na
materiale, którego użytkownik nigdy nie widział: nie da się wydedukować, że
handshake TCP to trzy pakiety.

**2. Pula notatek pyta poza swoim zakresem.** Notatki w `nauka/tech/chmura/google-cloud/`
to glosariusze z kursu — 27 plików, średnio ~35 linii, w formie listy definicji
(`podstawowe-pojecia-sieciowe.md` załatwia „Hardened kernel & IPC" jednym
zdaniem). Skill każe pytać „z innego ujęcia — inny przykład, przypadek
brzegowy, «a co jeśli…»" (`SKILL.md:120`), co na glosariuszu systematycznie
wymusza pytanie o mechanizm, którego notatka nie omawia. Cel tej puli to
zapamiętanie treści kursu, nie deep dive.

**3. Pula notatek jest przeciążona konstrukcyjnie.** Pojemność rotacji =
(notatki na sesję) × (interwał). Skill dopuszcza 3 notatki na sesję, a pozycja
diagnostyczna startuje z 3d, więc nawet przy codziennych sesjach utrzyma
3 × 3 = 9 notatek na najniższym szczeblu. W puli notatek jest ich 29, z czego
27 stoi na pozycji diagnostycznej. Na 2026-09-01 zaległe są **44 z 51** pozycji
w całym pliku, najstarsze z 2026-08-15.

## Cel

Rozdzielić **ekspozycję** (podanie materiału) od **sprawdzania** (pytania),
dać fundamentom własne miejsce w pliku i zwęzić pulę notatek do jej
rzeczywistego zadania. Trzy tryby, jeden plik postępu, format pozycji
niezmieniony.

## Mapa trybów

| Tryb | Wywołanie | Rola |
|---|---|---|
| **wyjaśnij** | wyłącznie `/nauka-z-claude wyjaśnij <koncept>` | Ekspozycja porcjami. Nowy |
| **pytania** | „przerabiajmy X", „kontynuujmy naukę", `/nauka-z-claude <temat>` | Pętla sokratejska po roadmapie. Zmieniony: rozpoznaje brak fundamentu |
| **powtórki** | „zrób powtórki", „przepytaj mnie [z X]", hook SessionStart | Jedna sesja, trzy pule. Rozszerzony i zwężony |

Tryby „powtórki" i „notatki" zostają **scalone**: pula notatek to filtr w trybie
powtórek („przepytaj mnie z Google Cloud"), nie osobny tryb.

## Rejestr konceptów

Nowa sekcja w `nauka-z-claude.md`, umieszczona **przed** `## Powtórki z notatek`:

```markdown
## Koncepty do poznania

- [ ] TCP i koszt sieci (RTT, handshake, keep-alive, strumienie)
      — wywołany przez: Redis krok 2, GCS krok 5 (ECONNRESET), FE→BE krok 9
- [x] Pętla zdarzeń i uchwyty — przerobione 2026-09-05

### Powtórki fundamentów

- [następna: 2026-09-06, interwał: 1d] RTT jako jednostka kosztu płacona za
  połączenie, nie za komendę — pięć komend po jednym połączeniu to jedno RTT
  plus pięć krótkich wymian, nie pięć uścisków
```

Reguły:

- Wpis zakłada tryb `pytania`, tryb `wyjaśnij` (gdy wskazanego konceptu jeszcze
  nie ma w rejestrze) albo użytkownik jawnie. Kolejne wywołanie tej samej osi
  z innego tematu **dopisuje się do listy „wywołany przez"**, nie tworzy
  drugiego wpisu.
- Wpisu nigdy nie kasujesz sam — przerobiony dostaje `[x]` i datę.
- Pozycje w `### Powtórki fundamentów` używają formatu
  `[następna: RRRR-MM-DD, interwał: Nd]` — czyta go hook, format bez zmian.
- Hook `powtorki-check.ps1` nie wymaga modyfikacji: liczy dopasowania regexu
  w całym pliku, bez rozróżniania sekcji (`powtorki-check.ps1:26-28`).

Rejestr na start (kolejność wg liczby dotychczasowych wywołań):

1. Model wykonania Node/JS — pętla zdarzeń, uchwyty, `await` jako punkt
   przerwania, wyścigi, zasięg stanu
2. Kryptografia — podpis vs szyfrowanie, symetria vs asymetria
3. Sieć od dołu — TCP, RTT, strumienie, gniazda
4. Zasoby procesu i OS — deskryptory, GC, pamięć, tożsamość procesu
5. HTTP — kto jest aktorem: przeglądarka czy JS
6. Gwarancje rozproszone — at-least-once, idempotencja, brak kolejności

## Tryb `wyjaśnij`

Wchodzi **wyłącznie** na jawne `/nauka-z-claude wyjaśnij <koncept>`. Opis skilla
(`description`) zachowuje dzisiejsze wykluczenie pytań jednorazowych — rzucone
w trakcie pracy „co to jest RTT?" dostaje zwykłą odpowiedź, bez zapisu do pliku
i bez pozycji powtórkowej.

Przebieg:

1. Przeczytaj `nauka-z-claude.md`. Znajdź koncept w rejestrze; jeśli go nie ma —
   dopisz przed startem.
2. **Pokaż zakres i czekaj na zatwierdzenie:** 3–6 mechanizmów składających się
   na tę oś. Użytkownik może wyciąć te, które już umie.
3. Dla każdego mechanizmu: porcja **2–4 akapity** → **jedno** pytanie
   sprawdzające → ocena.
   - Dobra odpowiedź → następny mechanizm.
   - Zła → ten sam mechanizm z innej strony (nie następna porcja, nie powtórzone
     wyjaśnienie tymi samymi słowami).
4. Przykłady kotwicz w miejscach, które koncept wywołały — RTT na `Redis krok 2`,
   nie na abstrakcyjnym serwerze. Kod cytuj snippetem, nie samym `plik:linia`
   (użytkownik nie zawsze ma repo otwarte).
5. Zapis na koniec sesji:
   - Pozycję w `### Powtórki fundamentów` dostaje mechanizm, który **wymagał
     drugiego podejścia albo poprawki**. Zrozumiany od razu — nie dostaje.
     Sufit **3 pozycje na sesję**.
   - Wszystkie mechanizmy z zakresu przerobione → wpis w rejestrze na `[x]`
     z datą. Inaczej → `**Następny krok:**` przy wpisie.

Drabinka pozycji fundamentów: `1 → 3 → 7 → 14 → 30` dni, jak pozycje tematyczne.
Reset po błędnej odpowiedzi → `1d`. Zaliczenie pozycji stojącej na 30d → pozycja
znika z `### Powtórki fundamentów` bez przenoszenia dokądkolwiek: śladem po niej
jest odhaczony wpis w rejestrze. (Pozycje tematyczne przenoszą się w tym miejscu
do `### Notatki` z prefiksem „Utrwalone:" — fundamenty nie mają odpowiednika tej
sekcji i nie potrzebują go.)

`wyjaśnij` operuje na **koncepcie**, nie na temacie: jedna, najwyżej dwie sesje,
bez własnej roadmapy. Materiał na pięć sesji to temat i idzie zwykłą ścieżką
„Nowy temat" z roadmapą.

## Tryb `pytania` — rozpoznanie fundamentu

Dziś każda wykryta trudność ląduje jako pozycja powtórkowa tematu
(`SKILL.md:157`). Wprowadzamy rozróżnienie z jawnym testem:

> Luka jest **fundamentem**, gdy odpowiedź na pytanie wymaga pojęcia spoza
> dziedziny bieżącego tematu (Redis wymagający TCP, JWT wymagający
> kryptografii), albo gdy ta sama oś padła już w innym temacie. W przeciwnym
> razie to luka tematyczna.

- Luka tematyczna → pozycja w `### Powtórki` tematu, interwał 1d. Bez zmian.
- Fundament → wpis do rejestru (albo dopisanie tematu do „wywołany przez"
  istniejącego wpisu), a następnie **pytanie do użytkownika**: przerywamy na
  `wyjaśnij`, czy notujemy i idziemy dalej. Czekasz na decyzję — brak odpowiedzi
  nie jest zgodą na żaden z wariantów.

Wyzwalacz: dwa „nie wiem" pod rząd na tej samej warstwie, albo naprowadzenia,
które nie trafiają, bo brakuje pojęcia niższego poziomu.

## Tryb `powtórki` — trzy pule i budżet

Budżet sesji: **~12 pytań**, sufit **4 na pulę**, kolejność obsługi:

1. **Fundamenty** (`### Powtórki fundamentów`) — ≤ 4 pytania
2. **Tematyczne** (`### Powtórki` w sekcjach tematów) — ≤ 4 pytania
3. **Notatki** (`## Powtórki z notatek`) — ≤ 4 pytania, ≤ 3 notatki, notatka
   niepodzielna

Niewykorzystany przydział spływa na pule niżej w kolejności, więc budżet się nie
marnuje. Uzasadnienie kolejności: jeśli fundament leży, pytanie tematyczne nad
nim i tak skończy się „nie wiem" — marnują się dwa pytania zamiast jednego.

Zawężenie w prośbie („przepytaj mnie z Google Cloud", „powtórka z notatek")
oddaje cały budżet wskazanej puli, z zachowaniem limitu 3 notatek na sesję.

## Tryb `powtórki`, pula notatek — zakres jako twarda granica

Zastępuje dzisiejszą regułę „inne ujęcie — przypadek brzegowy, «a co jeśli…»"
(`SKILL.md:120`, `SKILL.md:139`):

> Pytanie musi dać się odpowiedzieć **wyłącznie z treści notatki**. „Inne
> ujęcie" zostaje, ale w obrębie notatki: inne sformułowanie, zestawienie dwóch
> rzeczy z notatki, przykład złożony z jej elementów. Przypadek brzegowy
> wymagający mechanizmu, którego notatka nie omawia, jest niedozwolony — jeśli
> taki mechanizm okaże się potrzebny, to sygnał do wpisu w rejestrze konceptów,
> nie temat pytania.

Cel tej puli: zapamiętanie treści kursu. Deep dive należy do trybów `wyjaśnij`
i `pytania`.

Drabinka i interwały:

- Pozycja diagnostyczna startuje z **7d** (dziś 3d) — podnosi pojemność rotacji
  z 9 do 21 notatek przy niezmienionym limicie 3 notatek na sesję.
- Zaliczona diagnoza awansuje na **14d**; słaba zostaje na **7d** bez kary
  (zasada „diagnoza bez kary" bez zmian). Znacznik `(diagnoza)` zdejmowany
  niezależnie od wyniku.
- Drabinka dalej bez zmian: `… → 14 → 30 → 60 → 120`, potem konserwacja.
- **Reset (wszystkie pytania błędnie) zostaje na 3d.** Założenie do weryfikacji
  po miesiącu: przy glosariuszach z kursu resetów może być na tyle dużo, że
  odbudują stos na najniższym szczeblu. Jeśli tak się stanie, reset podnosimy
  do 7d.

## Zmiany w `tidy-journal`

`tidy-journal` zakłada pozycje notatek, więc bez zmian tam decyzja o 7d nie
zadziała — pierwszy przebieg znów zaleje pulę pozycjami na 3d.

| Miejsce | Dziś | Po zmianie |
|---|---|---|
| `SKILL.md:88` | nowa pozycja: `następna` = dziś + 3, `interwał: 3d` | dziś + 7, `interwał: 7d` |
| `SKILL.md:89-90` | notatka z dopisaną treścią wraca na 3d | wraca na **7d** — dopisanie nie może karać mocniej niż utworzenie |
| `SKILL.md:114` | raport: „które pozycje wróciły na 3 dni" | „na 7 dni" |
| `SKILL.md:118` | podsumowanie stanu docelowego | zgodnie z powyższym |

Reszta zachowania `tidy-journal` bez zmian: nadal nie prowadzi powtórek, nadal
pomija huby i gałęzie `nauka/` spoza `tech/`, nadal nie zapisuje przed
akceptacją planu.

## Operacja porządkowa (jednorazowa)

Wykonywana **po** zmianie skilli, na `nauka-z-claude.md`, w całości do
akceptacji przed zapisem:

1. **Podniesienie diagnoz.** 27 pozycji ze znacznikiem `(diagnoza)` dostaje
   `interwał: 7d`. Ten krok zmienia wyłącznie pole `interwał`; daty ustala
   krok 2.
2. **Rozsyp zaległych.** 44 pozycje z `następna ≤ 2026-09-01` (ze wszystkich
   trzech pul) rozłożyć po **≤ 4 dziennie**, zaczynając od dziś, zachowując
   kolejność „najstarsza data pierwsza". Zmieniamy wyłącznie pole `następna`;
   interwałów nie ruszamy.
3. **Zasilenie rejestru.** Sekcja `## Koncepty do poznania` z sześcioma osiami
   i listą „wywołany przez" wyprowadzoną z istniejących pozycji.

## Poza zakresem

- Zmiany w `powtorki-check.ps1` — hook liczy regexem cały plik, pozycje
  fundamentów zobaczy sam.
- Zmiana formatu `[następna: …, interwał: …]` — czyta go hook i `tidy-journal`.
- Osobne sekcje tematów dla fundamentów (odrzucone: sześć nowych tematów obok
  czterech otwartych).
- Przepisywanie notatek z `nauka/tech/chmura/google-cloud/` — ich zakres jest
  zgodny z celem (zapamiętanie kursu), problem był po stronie pytań.
- Automatyczne kasowanie wpisów rejestru i pozycji powtórkowych.

## Kryteria akceptacji

1. `/nauka-z-claude wyjaśnij <koncept>` uruchamia ekspozycję: pokazuje zakres,
   czeka na zatwierdzenie, potem porcja → jedno pytanie → porcja.
2. Zdanie „wyjaśnij mi X" **nie** uruchamia trybu `wyjaśnij`.
3. Sesja `wyjaśnij` zostawia ≤ 3 pozycje w `### Powtórki fundamentów`, i tylko
   dla mechanizmów, które wymagały drugiego podejścia.
4. Tryb `pytania` po dwóch „nie wiem" na warstwie niższej niż temat zakłada wpis
   w rejestrze i pyta o przerwanie — nie decyduje sam.
5. Sesja `powtórki` obsługuje pule w kolejności fundamenty → tematyczne →
   notatki, z sufitem 4 pytań na pulę i przelewem nadwyżki w dół.
6. Pytanie z puli notatek daje się odpowiedzieć wyłącznie z treści notatki.
7. `tidy-journal` zakłada nowe pozycje notatek z `interwał: 7d` i cofa dopisane
   na 7d.
8. Po operacji porządkowej żadna data `następna` nie powtarza się w pliku więcej
   niż 4 razy, żadna nie jest wcześniejsza niż dzień operacji, a każda pozycja
   ze znacznikiem `(diagnoza)` ma `interwał: 7d`.
9. Hook `powtorki-check.ps1` działa bez zmian i liczy również pozycje
   fundamentów.
