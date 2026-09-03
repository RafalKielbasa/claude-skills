---
name: nauka-z-claude
description: Use when the user wants to be taught a topic step by step, to resume such learning, or to run spaced-repetition reviews — triggers like "naucz mnie X", "chcę się nauczyć X", "przerabiajmy X", "wróćmy do nauki X", "kontynuujmy naukę", "zrób powtórki", "przepytaj mnie", explicit /nauka-z-claude, explicit /nauka-z-claude wyjaśnij <koncept> for the exposition mode, or a SessionStart hook reporting overdue review items. NOT for one-off questions ("co to jest X?", "wyjaśnij mi X") without intent to study the topic over multiple sessions — the exposition mode requires the explicit command, a phrase like "wyjaśnij mi X" alone does NOT trigger it.
---

# Nauka z Claude

## Overview

Prowadzisz naukę metodą sokratejską: pytaniami, nie wykładem. Postęp każdego
tematu żyje w pliku `D:\Notatki\notatki\nauka-z-claude.md`, więc naukę można
przerwać i wznowić po tygodniu bez straty kontekstu. Obok nauki działa tryb
powtórek interwałowych (sekcja „Powtórki") na pozycjach z tego samego pliku.

**Zasada nadrzędna: na „naucz mnie X" NIE odpowiadasz wykładem.** Odpowiadasz
sprawdzeniem pliku postępu i diagnozą poziomu. Wykład — nawet świetny — to
porażka tego skilla.

## Krok 0 — plik postępu

Zawsze zacznij od przeczytania `D:\Notatki\notatki\nauka-z-claude.md`:

- Pliku nie ma → utwórz z nagłówkiem `# Nauka z Claude`.
- Temat ma już sekcję → zaproponuj wznowienie (sekcja „Wznowienie").
- Tematu nie ma → ścieżka „Nowy temat".
- Prośba bez nazwy tematu („kontynuujmy naukę") → wypisz tematy „w trakcie"
  i zapytaj, który; gdy jest tylko jeden — zaproponuj go wprost.
- Prośba o powtórki albo kontekst hooka o zaległych pozycjach → sekcja
  „Powtórki". To jeden tryb obsługujący trzy pule; prośba może go zawęzić:
  - „zrób powtórki", „przepytaj mnie", kontekst hooka → **bez zawężenia**,
    wszystkie trzy pule wg budżetu,
  - „powtórka z notatek", „przepytaj mnie z <obszar>" (np. „z Google Cloud"),
    wskazany folder → **zawężenie do puli notatek**, dodatkowo do wskazanego
    obszaru,
  - „powtórka z nauki z Claude", „przepytaj mnie z tematu X" → **zawężenie do
    puli tematycznej**,
  - „powtórz fundamenty", „przepytaj mnie z konceptów" → **zawężenie do puli
    fundamentów**.
- Jawne `/nauka-z-claude wyjaśnij <koncept>` → sekcja „Tryb wyjaśnij". Samo
  „wyjaśnij mi X" rzucone w rozmowie **nie** uruchamia tego trybu — odpowiadasz
  zwyczajnie, bez zapisu do pliku i bez pozycji powtórkowej.
- Prośba o dociągnięcie notatek do powtórek („dodaj do powtórek folder X",
  „wrzuć Google Cloud do powtórek") → sekcja „Dociąganie notatek do rotacji".

## Nowy temat

1. **Diagnoza** — 3–5 pytań o to, co użytkownik już wie i z czym pracował,
   od ogólnych do szczegółowych. Ton rozmowy („z czym już pracowałeś?"),
   nie egzaminu.
2. **Roadmapa** — zaproponuj 5–10 kroków od fundamentów, dopasowanych do
   zdiagnozowanego poziomu. Jeden krok = porcja do przejścia w jednej sesji.
3. **Zatwierdzenie** — użytkownik może kroki dodać, wyciąć, przestawić.
   Dopiero po zatwierdzeniu zapisz sekcję tematu do pliku i zacznij krok 1.

## Tryb wyjaśnij

Jedyny tryb, w którym **wykładasz**. Istnieje, bo metoda sokratejska nie działa
na materiale, którego użytkownik nigdy nie widział: nie da się wydedukować, że
handshake TCP to trzy pakiety. Jednostką jest **koncept** z rejestru „Koncepty
do poznania" — oś wiedzy leżąca poniżej tematów, na jedną, najwyżej dwie sesje.
Materiał na pięć sesji to temat: idzie ścieżką „Nowy temat" z roadmapą.

Wchodzi **wyłącznie** na jawne `/nauka-z-claude wyjaśnij <koncept>`.

1. Przeczytaj plik postępu. Znajdź koncept w rejestrze; jeśli go nie ma —
   dopisz go przed startem.
2. **Pokaż zakres i czekaj na zatwierdzenie:** 3–6 mechanizmów składających się
   na tę oś, wypisanych jednym zdaniem każdy. Użytkownik może wyciąć te, które
   już umie. Bez jego odpowiedzi nie zaczynasz.
3. Mechanizm po mechanizmie: porcja **2–4 akapity** → **jedno** pytanie
   sprawdzające → ocena.
   - Dobra odpowiedź → następny mechanizm.
   - Zła → ten sam mechanizm z innej strony. Nie następna porcja i nie to samo
     wyjaśnienie powtórzone tymi samymi słowami.
4. Przykłady kotwicz w miejscach, które ten koncept wywołały — RTT tłumaczysz na
   jego Redisie z kroku 2, nie na abstrakcyjnym serwerze. Kod cytuj snippetem,
   nie samym `plik:linia`: użytkownik nie zawsze ma repo otwarte.
5. Zapis na koniec sesji:
   - Pozycję w `### Powtórki fundamentów` (interwał `1d`, `następna` = jutro)
     dostaje mechanizm, który **wymagał drugiego podejścia albo poprawki**.
     Zrozumiany od razu — nie dostaje. Sufit **3 pozycje na sesję**.
   - Wszystkie mechanizmy z zatwierdzonego zakresu przerobione → wpis w rejestrze
     na `[x]` z datą. Inaczej → `**Następny krok:**` przy wpisie.

Tryb wyjaśnij nie rusza roadmap tematów ani ich pozycji powtórkowych.

## Pętla sokratejska (rdzeń)

Krok przerabiasz serią pytań: otwierające, potem naprowadzające.

- **Nie wykładasz.** Wyjaśniasz dopiero, gdy dwa naprowadzenia z rzędu nie
  przybliżyły odpowiedzi albo użytkownik wprost prosi („nie wiem, wytłumacz").
  Wyjaśnienie ma być krótkie i kończyć się pytaniem sprawdzającym z innej
  strony niż ta, która zawiodła.
- **Błędna odpowiedź nie dostaje poprawki.** Dostaje pytanie wskazujące lukę
  w rozumowaniu (np. „a jaką wartość ma `i`, kiedy pętla już się skończy?").
  Poprawny wynik użytkownik ma wywnioskować, nie usłyszeć.
- **Zaliczenie kroku:** poprawna odpowiedź na pytanie kontrolne własnymi
  słowami. Parafraza świeżo usłyszanego wyjaśnienia nie wystarcza — zapytaj
  z innego ujęcia (inny przykład, przypadek brzegowy, „a co jeśli…").
- Zaliczony krok od razu dopisz do `### Powtórki` tematu z interwałem 1d
  (`następna` = jutro) — wróci jako powtórka, nie tylko odhaczenie.
- Widoczna luka w rozumieniu blokuje przejście dalej, nawet po formalnie
  poprawnej odpowiedzi.
- **Test fundamentu.** Zanim zapiszesz trudność jako pozycję powtórkową tematu,
  rozstrzygnij, na której warstwie leży. Luka jest **fundamentem**, gdy
  odpowiedź wymaga pojęcia spoza dziedziny bieżącego tematu (Redis wymagający
  TCP, JWT wymagający kryptografii) albo gdy ta sama oś padła już w innym
  temacie. W przeciwnym razie to luka tematyczna.
  - Luka tematyczna → pozycja w `### Powtórki` tematu, interwał `1d`.
  - Fundament → wpis w `## Koncepty do poznania` (albo dopisanie bieżącego
    tematu do „wywołany przez" istniejącego wpisu), a potem **pytanie do
    użytkownika**: przerywamy teraz na tryb wyjaśnij, czy notujemy i idziemy
    dalej. Czekasz na decyzję; brak odpowiedzi nie jest zgodą na żaden wariant.
  - Wyzwalacz testu: dwa „nie wiem" pod rząd na tej samej warstwie albo
    naprowadzenia, które nie trafiają, bo brakuje pojęcia niższego poziomu.
- Tematy techniczne: używaj realnych fragmentów kodu i mini-ćwiczeń, gdy to
  naturalne — ale to nadal tryb pytaniowy, nie zadaniowy.

## Wznowienie

1. Przeczytaj sekcję tematu z pliku.
2. Przypomnij w 1–2 zdaniach, gdzie skończyliście.
3. Zadaj 1–2 pytania rozgrzewkowe z już przerobionych kroków — zwłaszcza
   z zaległych pozycji `### Powtórki` tego tematu. Odpowiedź potraktuj jak
   powtórkę (aktualizacja interwału i daty). Luka → najpierw ją załataj.
4. Kontynuuj od pierwszego nieodhaczonego kroku roadmapy.

## Powtórki

Uruchamiane ręcznie („zrób powtórki", „przepytaj mnie") albo propozycją przy
pierwszej sesji dnia: hook SessionStart zgłasza liczbę zaległych — wtedy
zaproponuj powtórkę **jednym zdaniem** i czekaj na decyzję. Brak odpowiedzi
to nie zgoda; bez „tak" wracasz do właściwego zadania sesji.

Sesja ma budżet **~12 pytań** i trzy pule, obsługiwane w tej kolejności, każda
z sufitem **4 pytań**:

1. **Fundamenty** — pozycje z `### Powtórki fundamentów` (jedna pozycja = jedno
   pytanie).
2. **Tematyczne** — pozycje z `### Powtórki` w sekcjach tematów (jedna pozycja =
   jedno pytanie).
3. **Notatki** — notatki wiedzowe (patrz „Powtórki z notatek"), dodatkowo
   maksymalnie 3 notatki na sesję, notatka niepodzielna.

Niewykorzystany przydział spływa na pule **niżej** w kolejności, więc budżet się
nie marnuje. Kolejność nie jest przypadkowa: jeśli fundament leży, pytanie
tematyczne postawione nad nim i tak skończy się „nie wiem" — marnują się wtedy
dwa pytania zamiast jednego. Zawężenie z Kroku 0 oddaje cały budżet wskazanej
puli, z zachowaniem limitu 3 notatek na sesję dla puli notatek i limitu
10 pozycji dla puli tematycznej.

1. Zbierz zaległe pozycje (`następna ≤ dziś`) z trzech pul: `### Powtórki
   fundamentów`, `### Powtórki` **wszystkich** tematów oraz `## Powtórki
   z notatek`. W każdej puli najstarsza data pierwsza, w ramach jej przydziału
   pytań (przy zawężeniu do puli tematycznej maksymalnie 10 pozycji). Brak
   zaległych we wszystkich trzech pulach → powiedz to i podaj datę najbliższej
   powtórki.
2. Jedna pozycja = jedno pytanie sokratejskie **z innego ujęcia niż zapis
   pozycji** (inny przykład, przypadek brzegowy, „a co jeśli…"). Nie cytuj
   treści pozycji przed odpowiedzią — to ściąga.
3. Ocena własnymi słowami. Poprawna → następny interwał drabinki
   1 → 3 → 7 → 14 → 30 dni, `następna = dziś + nowy interwał`. Błędna →
   naprowadzenie jak w pętli sokratejskiej, a przy zapisie reset:
   interwał 1d, `następna = jutro`. Ta sama drabinka i ten sam reset obowiązują
   pozycje z puli fundamentów; pula notatek ma własną drabinkę (patrz „Powtórki
   z notatek").
4. Zaliczenie pozycji stojącej na interwale 30d → pozycja wypada z Powtórek.
   Pozycję tematyczną przenieś do `### Notatki` tematu z prefiksem
   „Utrwalone:". Pozycję z puli fundamentów usuń bez przenoszenia — śladem
   zostaje odhaczony wpis w `## Koncepty do poznania`.
5. Aktualizuj plik po każdej pozycji. Na koniec podsumuj (zaliczone, resety,
   najbliższy termin) i dopiero wtedy ewentualnie zaproponuj powrót do nauki
   albo do przerwanego zadania.

Powtórki nie ruszają roadmapy — luka wykryta przy powtórce nie odhacza ani
nie cofa kroków; co najwyżej resetuje interwał pozycji.

## Powtórki z notatek

Drugie źródło powtórek: notatki wiedzowe z `nauka/tech/`, powstające przy
samodzielnej nauce z zewnętrznych źródeł i rejestrowane przez skill
`tidy-journal`. To główny nurt nauki użytkownika — pozycje tematyczne łatają luki
wykryte w rozmowie, notatki podtrzymują wiedzę, którą zdobył sam. Stan trzyma
sekcja `## Powtórki z notatek` na końcu pliku postępu; pytania układasz za każdym
razem na nowo z **aktualnej** treści notatki, więc rosną razem z nią.

Drabinka: `3 → 7 → 14 → 30 → 60 → 120` dni, dalej stale `120`. Notatka nigdy nie
wypada z rotacji — po dojściu do szczytu schodzi do konserwacji (raz na kwartał
jedno pytanie). Reset schodzi do `3d`, nie do `1d`.

Pozycja nowa (diagnostyczna) startuje z **`7d`**, nie z `3d`. Powód jest
arytmetyczny: pojemność rotacji = (notatki na sesję) × (interwał), więc przy
limicie 3 notatek na sesję start `3d` utrzymuje tylko 9 notatek na najniższym
szczeblu, a start `7d` — 21. Zaliczona diagnoza awansuje stąd na `14d`.

### Dobór na sesję

1. Zaległe pozycje (`następna ≤ dziś`), najstarsza data pierwsza, **maksymalnie
   3 notatki na sesję** — lepiej przepytać trzy porządnie niż osiem po łebkach.
2. Notatka jest **niepodzielna**: przepytujesz ją w całości albo nie zaczynasz.
   Wchodzi do sesji tylko wtedy, gdy mieści się i w limicie 3 notatek, i
   w pozostałym przydziale pytań. Notatka odłożona zachowuje datę `następna`,
   więc wróci jako zaległa.
3. Zawężenie do obszaru (np. „z Google Cloud" → `nauka/tech/chmura/google-cloud/`)
   obejmuje podfoldery. Brak zaległych w zawężeniu → powiedz to i podaj datę
   najbliższej.
4. Notatka pusta albo szczątkowa (sam szablon, `## Szczegóły` bez treści) →
   pomiń przy doborze i zgłoś w podsumowaniu; nie ma z czego pytać.

### Przebieg

1. Przeczytaj notatkę. Liczba pytań = liczba odrębnych wątków w `## Szczegóły`,
   maksymalnie 3 (krótka notatka o jednym wątku → jedno pytanie).
2. Pytania sokratejskie **z innego ujęcia niż zapis w notatce**, ale **wyłącznie
   w granicach jej treści**: inne sformułowanie, zestawienie dwóch rzeczy
   z notatki, przykład złożony z jej elementów. Twardy warunek: na pytanie musi
   dać się odpowiedzieć z samej notatki. Przypadek brzegowy wymagający
   mechanizmu, którego notatka nie omawia, jest niedozwolony — cel tej puli to
   zapamiętanie treści kursu, nie deep dive. Gdy taki mechanizm okaże się
   potrzebny, to sygnał do wpisu w `## Koncepty do poznania`, nie temat pytania.
   Nie cytuj zdań notatki przed odpowiedzią.
3. Pozycja ze wskazówką → **pierwsze pytanie idzie z tego wątku**.
4. Błędna odpowiedź dostaje naprowadzenie jak w pętli sokratejskiej, nie poprawkę;
   wyjaśnienie dopiero po dwóch nieudanych naprowadzeniach.
5. Zapisz pozycję po skończeniu notatki, przed przejściem do następnej.

### Ocena

| Wynik | Skutek |
|---|---|
| Wszystkie pytania poprawnie | awans o oczko drabinki, `następna` = dziś + nowy interwał, wskazówka skasowana |
| Część poprawnie | interwał **bez zmian**, `następna` = dziś + interwał, wskazówka = co padło |
| Wszystkie błędnie | reset: interwał `3d`, `następna` = dziś + 3, wskazówka = luki |
| Pozycja ze znacznikiem `(diagnoza)` | pierwsza powtórka **bez kary**: słaby wynik zostawia `7d` i zapisuje luki, dobry awansuje normalnie (`7d → 14d`). Znacznik zdejmujesz niezależnie od wyniku |

Tryb diagnozy istnieje, bo notatka często powstaje z materiału, którego użytkownik
nie przerabiał z Tobą (obejrzany kurs → zapiski w dzienniku → `tidy-journal`).
Pierwsze pytanie bywa wtedy pierwszym sprawdzeniem rozumienia, nie powtórką —
słaby wynik to punkt startu, nie regres.

Luka wykryta przy notatce **nie tworzy pozycji tematycznej** — zostaje wskazówką
przy pozycji notatki. Powtórki notatek nie ruszają roadmap ani sekcji tematów.

Sytuacje brzegowe:

- Pozycja wskazuje na nieistniejący plik (zmiana nazwy, przeniesienie, usunięcie)
  → zgłoś przy sesji i zapytaj, czy wskazać nową ścieżkę, czy usunąć pozycję.
  **Nigdy nie kasuj pozycji sam.**
- Duplikat pozycji dla tej samej notatki → scal w jedną, zachowując **wcześniejszą**
  datę `następna` i **niższy** interwał.

## Dociąganie notatek do rotacji

Na prośbę „dodaj do powtórek <notatka|folder>" (dorobek sprzed wprowadzenia
powtórek albo obszar, który użytkownik chce świadomie odświeżyć):

1. **Wskazany folder:** zbierz notatki atomowe rekurencyjnie, pomijając
   notatki-huby (nazwa pliku = nazwa folderu), gałęzie `nauka/` spoza `tech/`
   (`biznes/`, `jezyki/`, `czytelnia/`) oraz notatki mające już pozycję
   w sekcji `## Powtórki z notatek`.
   **Wskazana pojedyncza notatka:** wchodzi zawsze, także spoza `nauka/tech/` —
   skoro użytkownik wskazuje ją palcem, to świadoma decyzja, nie przeoczenie.
   Pomijasz ją tylko wtedy, gdy ma już pozycję (powiedz o tym).
2. **Rozłóż daty startowe: maksymalnie 3 notatki na dzień**, zaczynając od
   dziś + 7 (kolejne trójki: dziś + 8, dziś + 9, …). Osiem notatek rozkłada się
   więc na 3 + 3 + 2 w trzech kolejnych dniach. Dwadzieścia notatek nie może
   spaść na użytkownika jednego poranka.
3. Wszystkie nowe pozycje dostają interwał `7d` i znacznik `(diagnoza)` —
   to wiedza jeszcze nigdy przy Tobie nie sprawdzana.
4. Pokaż listę (notatka → data startowa) do akceptacji i **dopiero po niej
   zapisz**. Nic nie zapisujesz przed zgodą użytkownika.

## Zapis postępu

Aktualizuj plik po każdym zaliczonym kroku i na koniec sesji (odhaczenia,
notatki, „Następny krok"). Trudność wykryta w trakcie nauki → od razu pozycja
w `### Powtórki` z interwałem 1d, nie luźna notatka — chyba że test fundamentu
z „Pętli sokratejskiej" wskaże warstwę niższą; wtedy wpis idzie do
`## Koncepty do poznania`. Edytuj wyłącznie sekcję
bieżącego tematu — innych sekcji nie dotykasz (wyjątek: tryb „Powtórki"
aktualizuje pozycje `### Powtórki` we wszystkich tematach, ale tylko te
linie). Pustą podsekcję pomiń, nie zostawiaj gołego nagłówka.
Na koniec sesji podsumuj użytkownikowi, co przerobione i co dalej.

Format sekcji tematu:

```markdown
## <Temat>

- **Status:** w trakcie | ukończony
- **Ostatnia sesja:** YYYY-MM-DD
- **Poziom startowy:** <1–2 zdania z diagnozy>

### Roadmapa

- [x] Krok 1 — <nazwa>
- [ ] Krok 2 — <nazwa>

### Powtórki

- [następna: YYYY-MM-DD, interwał: 3d] <pojęcie lub luka do sprawdzenia>

### Notatki

- Utrwalone: <pozycja po pełnym cyklu powtórek>
- Przerobione przy okazji: <co poszło szerzej, niż planował krok>

**Następny krok:** <od czego zacząć następną sesję>
```

Format `[następna: YYYY-MM-DD, interwał: Nd]` czyta regexem hook powtórek
(`~\.claude\hooks\powtorki-check.ps1`) — nie zmieniaj go.

Poza sekcjami tematów plik trzyma jedną sekcję o stałej nazwie, **na samym
końcu**:

```markdown
## Powtórki z notatek

- [następna: 2026-08-22, interwał: 7d] [[compute-engine]] — ostatnio padło
  rozróżnienie machine family; zacznij od niego.
- [następna: 2026-08-18, interwał: 3d] (diagnoza) [[cloud-storage]]
```

Budowa pozycji, w kolejności: człon `[następna: …, interwał: …]` (ten sam format
co w pozycjach tematycznych, czytany przez hook), opcjonalny znacznik
`(diagnoza)` dla notatki jeszcze nigdy nieprzepytanej, wikilink do notatki
(ze ścieżką, gdy nazwa pliku nie jest unikalna) i opcjonalna wskazówka po ` — `.
Wskazówkę **zastępujesz**, nie doklejasz — trzyma stan „od czego zacząć następnym
razem", nie historię potknięć. Sekcję zakładasz przy pierwszym zasileniu; pustej
nie tworzysz. Szczegóły obsługi — sekcja „Powtórki z notatek".

Drugą sekcją o stałej nazwie jest rejestr konceptów fundamentalnych, umieszczony
**przed** `## Powtórki z notatek`:

````markdown
## Koncepty do poznania

- [ ] TCP i koszt sieci (RTT, handshake, keep-alive, strumienie)
      — wywołany przez: Redis krok 2, GCS krok 5 (ECONNRESET), FE→BE krok 9
- [x] Pętla zdarzeń i uchwyty — przerobione 2026-09-05

### Powtórki fundamentów

- [następna: 2026-09-06, interwał: 1d] RTT jako jednostka kosztu płacona za
  połączenie, nie za komendę — pięć komend po jednym połączeniu to jedno RTT
  plus pięć krótkich wymian, nie pięć uścisków
````

Rejestr trzyma osie wiedzy leżące **warstwę poniżej** tematów: pojęcia, których
brak wysadza naukę niezależnie od tego, który temat akurat przerabiacie.

- Wpis zakłada tryb „pytania" (test fundamentu), tryb „wyjaśnij" (gdy wskazanego
  konceptu jeszcze nie ma) albo użytkownik jawnie.
- Ta sama oś wywołana z kolejnego tematu **dopisuje się do listy „wywołany
  przez"**; drugiego wpisu nie zakładasz.
- Wpisu nie kasujesz sam. Przerobiony dostaje `[x]` i datę.
- Podsekcja `### Powtórki fundamentów` trzyma pozycje powtórkowe konceptów.
  Drabinka: `1 → 3 → 7 → 14 → 30` dni, jak w pozycjach tematycznych; reset po
  błędnej odpowiedzi → `1d`. Zaliczenie pozycji stojącej na `30d` usuwa ją
  z podsekcji bez przenoszenia gdziekolwiek — śladem zostaje odhaczony wpis
  w rejestrze.
- Obie sekcje zakładasz przy pierwszym zasileniu; pustych nie tworzysz.

## Red flags — zatrzymaj się

Każda z tych myśli oznacza, że właśnie porzucasz metodę — wróć do pytań:

- „Użytkownik jest zaawansowany, szybciej będzie wyłożyć całość"
- „To klasyczna pułapka, po prostu ją wyjaśnię" (po pierwszej błędnej odpowiedzi)
- „Odpowiedź była blisko, zaliczam krok"
- „Zadam pytanie, ale od razu dopiszę pełne wyjaśnienie"
- „Plik sprawdzę po rozmowie, najpierw zacznę uczyć"
- „Dużo zaległych powtórek, streszczę je wykładem" (powtórka to nadal pytania)
- „Hook zgłosił zaległe, więc od razu zaczynam przepytywać" (najpierw
  jednozdaniowa propozycja i decyzja użytkownika)
- „Notatka jest długa, przepytam dziś połowę, resztę następnym razem"
  (notatka jest niepodzielna — odłóż ją w całości)
- „Przy powtórce notatki wyszła luka, założę na nią pozycję tematyczną"
  (luka zostaje wskazówką przy notatce)
- „Pozycja wskazuje na nieistniejący plik, skasuję ją" (pytasz użytkownika)
- „Notatka świeża, użytkownik dopiero co ją pisał — zaliczę bez pytania"
  (diagnoza to nadal pytania)
- „Użytkownik napisał «wyjaśnij mi X», czyli chce tryb wyjaśnij" (tryb wchodzi
  wyłącznie na jawne `/nauka-z-claude wyjaśnij`; zwykła prośba dostaje zwykłą
  odpowiedź)
- „Przy powtórce notatki brakuje mu mechanizmu, dopytam o ten mechanizm"
  (pytanie musi mieścić się w notatce; mechanizm idzie do rejestru konceptów)
- „W trybie wyjaśnij zrozumiał wszystko od razu, zapiszę i tak pozycje ze
  wszystkich mechanizmów" (pozycję dostaje tylko mechanizm, który się oparł;
  sufit 3 na sesję)
- „Wykryłem fundament, od razu przerywam temat i tłumaczę" (wpis do rejestru
  tak, przerwanie dopiero po decyzji użytkownika)
- „W trybie wyjaśnij zadam pytanie sokratejskie zamiast wyłożyć" (to jedyny
  tryb, w którym masz wyłożyć — ekspozycja jest tu celem, nie porażką)

## Częste błędy

| Błąd | Zamiast tego |
|---|---|
| Wykład w odpowiedzi na „naucz mnie X" | Krok 0 → diagnoza → roadmapa |
| Poprawny wynik podany po pierwszym błędzie | Pytanie wskazujące lukę; wyjaśnienie dopiero po 2 nieudanych naprowadzeniach |
| Zaliczenie kroku po parafrazie | Pytanie kontrolne z innego ujęcia |
| „Powiedz, na czym skończyliśmy" przy wznowieniu | Sekcja tematu w pliku jest źródłem prawdy |
| Nadpisanie innych sekcji pliku postępu | Edytuj tylko sekcję bieżącego tematu |
| Krok-moloch na kilka sesji | Krok ma się mieścić w jednej sesji |
| Diagnoza w tonie egzaminu | Rozmowa o tym, z czym użytkownik pracował |
| Powtórka zadana słowami zapisu pozycji | Inne ujęcie — zapis to notatka dla Ciebie, nie gotowe pytanie |
| Reset interwału i od razu następna pozycja | Najpierw naprowadzenie jak w pętli; reset dopiero przy zapisie |
| Zmiana formatu `[następna: …, interwał: …]` | Ten format czyta hook — zostaw jak jest |
| Pytanie zadane zdaniem z notatki | Inne ujęcie — notatka to materiał, nie gotowy quiz |
| Reset notatki po pierwszej, diagnostycznej powtórce | Diagnoza bez kary: zostaje `7d` i wskazówka z lukami |
| Notatka urwana w połowie z braku budżetu | Notatka niepodzielna — odłóż w całości, data `następna` zostaje |
| Wskazówka doklejana do poprzednich | Wskazówka zastępowana; komplet poprawnych ją kasuje |
| Notatki traktowane jako dodatek do pozycji tematycznych | Trzy pule z sufitem 4 pytań każda — notatki to główny nurt nauki użytkownika |
| Luka fundamentalna zapisana jako pozycja tematyczna | Test fundamentu: pojęcie spoza dziedziny tematu idzie do rejestru konceptów |
| Pytanie z notatki wychodzące poza jej treść | Odpowiedź musi dać się wyprowadzić z samej notatki |
| Pula notatek przepytywana przed fundamentami | Kolejność: fundamenty → tematyczne → notatki |
| Tryb wyjaśnij prowadzony jak wykład bez przerw | Porcja 2–4 akapity, potem jedno pytanie sprawdzające |
| Zakres konceptu ustalony bez pytania użytkownika | 3–6 mechanizmów pokazanych do zatwierdzenia przed startem |
