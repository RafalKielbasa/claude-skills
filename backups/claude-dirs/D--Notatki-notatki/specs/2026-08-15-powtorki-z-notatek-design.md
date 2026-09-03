# Powtórki z notatek własnych

Data: 2026-08-15

## Problem

Powtórki interwałowe działają dziś wyłącznie na pozycjach generowanych przez skill
`nauka-z-claude` — czyli na lukach wykrytych w rozmowie sokratejskiej. Tymczasem
główny nurt nauki użytkownika biegnie inaczej: zewnętrzne źródła (kursy,
dokumentacja) → zapiski w notatce dziennej → `tidy-journal` → notatki wiedzowe
w `nauka/`. Ta wiedza — największa objętościowo i najważniejsza dla użytkownika —
nie ma żadnego mechanizmu utrwalania. Notatka powstaje i cichnie.

`nauka-z-claude` pozostaje narzędziem doraźnym, używanym przy pracy do zrozumienia
konkretnego zagadnienia. Powtórki muszą więc obsłużyć oba nurty, przy czym nurt
notatkowy jest tym głównym, nie dodatkiem.

## Cel

Drugie źródło pozycji do powtórek: notatki wiedzowe z `nauka/tech/`. Stan trzymany per
notatka, pytania generowane każdorazowo z jej aktualnej treści — notatka rośnie,
pytania rosną razem z nią. Wiedza raz zapisana wraca w rosnących odstępach i nie
wywietrza.

## Zakres

**Wchodzi do rotacji:** notatka atomowa w `nauka/tech/` (rekurencyjnie — dziś
`agenci-ai/`, `chmura/`, `devops/`, `linux/`, `programowanie/`), w momencie gdy
`tidy-journal` ją utworzył albo dopisał do niej treść. Rotacja rośnie w tempie
realnej nauki — notatka, której użytkownik nie rusza, nie zaśmieca kolejki,
dopóki sam jej nie dociągnie.

**Nie wchodzi automatycznie:** notatki-huby (nazwa pliku = nazwa folderu),
pozostałe gałęzie `nauka/` — `biznes/`, `jezyki/` (tabela słówek), `czytelnia/`
(notatki z książek) — oraz wszystko spoza `nauka/` (`dom/`, `zdrowie/`, `praca/`).
Rządzą się inną logiką: słówka to tabela, książki to zapis przemyśleń, reszta to
fakty i decyzje, nie materiał do przepytywania.

**Furtka ręczna:** użytkownik może dociągnąć do rotacji cały folder („dodaj do
powtórek `nauka/tech/chmura/google-cloud/`") albo pojedynczą notatkę. Przy
folderze obowiązują wykluczenia jak wyżej; **jawnie wskazana pojedyncza notatka
wchodzi zawsze, także spoza `nauka/tech/`** — skoro użytkownik wskazuje ją
palcem, to świadoma decyzja, nie przeoczenie. Obsługuje to `nauka-z-claude` jako
gospodarz sekcji.

## Format stanu

Stan mieszka w `nauka-z-claude.md` (korzeń vaulta) w jednej sekcji o stałej nazwie,
umieszczonej **na końcu pliku**, po sekcjach tematów:

```markdown
## Powtórki z notatek

- [następna: 2026-08-22, interwał: 7d] [[compute-engine]] — ostatnio padło
  rozróżnienie machine family; zacznij od niego.
- [następna: 2026-08-18, interwał: 3d] (diagnoza) [[cloud-storage]]
```

Budowa pozycji, w kolejności:

1. `[następna: RRRR-MM-DD, interwał: Nd]` — **format identyczny jak w pozycjach
   tematycznych i nietykalny**, bo czyta go regexem hook `powtorki-check.ps1`.
   Dzięki temu poranny licznik zaległych obejmuje notatki bez zmiany hooka.
2. `(diagnoza)` — opcjonalny znacznik notatki, która nie była jeszcze ani razu
   przepytana. Zdejmowany po pierwszej powtórce.
3. Wikilink do notatki. Przy kolizji nazw plików — wikilink ze ścieżką.
4. Opcjonalna wskazówka po ` — `: co padło ostatnio albo który fragment jest nowy.
   Może się zawijać na kolejne linie, jak istniejące pozycje tematyczne. Wskazówka
   jest **zastępowana**, nie doklejana — trzyma stan „od czego zacząć następnym
   razem", a nie historię wszystkich potknięć, więc pozycja nie puchnie. Komplet
   poprawnych odpowiedzi kasuje wskazówkę.

Sekcja powstaje przy pierwszym zasileniu; nie zakładamy jej pustej na zapas.

**Notatka wiedzowa nie dostaje żadnych pól operacyjnych we frontmatterze** — reguła
z CLAUDE.md („notatka to czysta treść") zostaje nienaruszona. Cena tej decyzji to
możliwy rozjazd wikilinku po zmianie nazwy pliku; obsługa w sekcji „Sytuacje
brzegowe".

## Drabinka interwałów

`3 → 7 → 14 → 30 → 60 → 120`, dalej stale `120`. Notatka **nigdy nie wypada
z rotacji** — po dojściu do szczytu schodzi do trybu konserwacji: raz na kwartał
jedno pytanie sprawdzające, czy wiedza trzyma.

Różnice względem drabinki pozycji tematycznych (`1 → 3 → 7 → 14 → 30`, po
zaliczeniu 30d pozycja wypada jako „Utrwalone") są zamierzone i wynikają z innej
roli obu źródeł:

- start od 3d, nie 1d — notatkę użytkownik napisał świadomie, więc zna ją lepiej
  niż lukę wyłapaną w przepytywaniu;
- brak wypadania — pozycja tematyczna łata konkretną lukę i słusznie się domyka,
  notatka ma podtrzymywać wiedzę, a podtrzymywanie nie ma końca;
- reset schodzi do 3d (najniższy szczebel tej drabinki), nie do 1d.

Koszt konserwacji jest niski: 50 notatek na cyklu 120-dniowym to średnio niecała
jedna pozycja dziennie.

## Zmiany w skillu `tidy-journal`

Nowy krok w przebiegu, wykonywany przy zapisie notatek wiedzowych z `nauka/tech/`:

- **nowa notatka** w zakresie → nowa pozycja: interwał `3d`, `następna` = dziś + 3,
  znacznik `(diagnoza)`, bez wskazówki;
- **istniejąca notatka z pozycją**, do której dopisano treść → interwał wraca na
  `3d`, `następna` = dziś + 3, wskazówka dostaje `nowy fragment: <co doszło>`,
  żeby pierwsze pytanie poszło ze świeżego materiału;
- **istniejąca notatka bez pozycji** (sprzed tej zmiany), do której dopisano treść
  → wchodzi jak nowa.

Powiązania z resztą skilla:

- Zmiany w sekcji powtórek pokazują się **w planie** (punkt 9) i podlegają
  akceptacji na równi z resztą — zasada „żadnego zapisu przed akceptacją planu"
  nie dostaje wyjątku.
- **Raport** (punkt 11) wymienia, co doszło do rotacji i które pozycje wróciły
  na 3 dni.
- Krok jest niezależny od dotychczasowej obsługi `nauka-z-claude.md` (punkt 8,
  archiwizacja ukończonych tematów) — tamten dotyczy sekcji tematów, ten wyłącznie
  sekcji `## Powtórki z notatek`. Archiwizacja tematu nie rusza pozycji
  notatkowych; destylacja ukończonego tematu do notatek wiedzowych **rejestruje je
  w rotacji na zasadach nowych notatek**.

## Zmiany w skillu `nauka-z-claude`

### Rozpoznanie trybu (krok 0)

Do dotychczasowego rozpoznania dochodzą trzy tryby powtórek:

| Wyzwalacz | Tryb |
|---|---|
| „zrób powtórki", „przepytaj mnie", kontekst hooka | domyślny (mieszany) |
| „powtórka z notatek", „przepytaj mnie z Google Cloud", wskazany folder/obszar | tylko z notatek |
| „powtórka z nauki z Claude", „przepytaj z tematu X" | tylko tematyczny |

### Budżet sesji

Sesja ma budżet **~12 pytań**, dzielony po połowie: 6 na notatki, 6 na pozycje
tematyczne (pozycja tematyczna to zawsze jedno pytanie). Niewykorzystana część
jednego źródła przechodzi na drugie, więc budżet się nie marnuje, a żadne źródło
nie wypycha drugiego. Tryby jednoźródłowe dostają cały budżet dla swojego źródła,
przy czym tryb tylko tematyczny zachowuje dotychczasowy limit **10 pozycji na
sesję**.

Dobór notatek: zaległe (`następna ≤ dziś`), najstarsza data pierwsza, **maksymalnie
3 notatki na sesję** — lepiej przepytać trzy porządnie niż osiem po łebkach.
W trybie zawężonym do folderu bierzemy tylko notatki z tego folderu (i podfolderów);
brak zaległych w zawężeniu → powiedz to i podaj datę najbliższej.

Notatka jest niepodzielna: **przepytujesz ją w całości albo w ogóle jej nie
zaczynasz**. Ocena awansu wymaga kompletu pytań, więc notatka urwana w połowie dałaby
fałszywy wynik „część poprawnie". Praktycznie oznacza to, że o wejściu notatki do
sesji decydują dwa warunki naraz: mieści się w limicie 3 notatek **i** w pozostałym
przydziale pytań. Notatka trzypytaniowa przy dwóch wolnych pytaniach czeka do
następnej sesji — data `następna` zostaje nietknięta, więc wróci jako zaległa.

### Przebieg powtórki notatki

1. Przeczytaj notatkę. Liczba pytań zależy od liczby odrębnych wątków w sekcji
   `## Szczegóły`: 1 wątek → 1 pytanie, maksymalnie 3 pytania.
2. Pytania sokratejskie, **z innego ujęcia niż zapis w notatce** — inny przykład,
   przypadek brzegowy, „a co jeśli…". Nie cytuj zdań notatki przed odpowiedzią.
3. Jeśli pozycja ma wskazówkę, **pierwsze pytanie idzie z tego wątku**.
4. Błędna odpowiedź dostaje naprowadzenie jak w pętli sokratejskiej (nie poprawkę);
   wyjaśnienie dopiero po dwóch nieudanych naprowadzeniach.
5. Zapis pozycji po zakończeniu notatki, przed przejściem do następnej.

### Ocena i zapis

| Wynik | Skutek |
|---|---|
| Wszystkie pytania poprawnie | awans o oczko drabinki, `następna` = dziś + nowy interwał |
| Część poprawnie | interwał **bez zmian**, `następna` = dziś + interwał, wskazówka zapisuje, co padło |
| Wszystkie błędnie | reset: interwał `3d`, `następna` = dziś + 3, wskazówka zapisuje luki |
| Pierwsza powtórka — pozycja z `(diagnoza)` | **bez kary**: słaby wynik zostawia interwał `3d`, wskazówka zapisuje luki; znacznik zdjęty niezależnie od wyniku. Dobry wynik awansuje normalnie (3d → 7d) |

Uzasadnienie trybu diagnozy: notatka często powstaje z materiału, którego użytkownik
nie przerabiał sokratejsko (obejrzany kurs → zapiski → `tidy-journal`). Pierwsze
pytanie jest wtedy pierwszym sprawdzeniem rozumienia, a nie powtórką czegoś raz już
zaliczonego — słaby wynik to punkt startu, nie regres.

Luka wykryta przy powtórce notatki **nie tworzy pozycji tematycznej** — zostaje
wskazówką przy pozycji notatki. Oba źródła pozostają rozdzielone.

Powtórki notatek **nie ruszają roadmap tematów** ani sekcji tematycznych pliku.

## Sytuacje brzegowe

- **Wikilink wskazuje na nieistniejący plik** (zmiana nazwy, usunięcie, przeniesienie):
  skill zgłasza to przy sesji i pyta użytkownika, czy wskazać nową ścieżkę, czy
  usunąć pozycję. **Nigdy nie kasuje pozycji sam.**
- **Dociągnięcie folderu ręcznie:** daty startowe rozłożone w czasie, maksymalnie
  **3 notatki na dzień** (dziś + 3, dziś + 4, …), żeby dwadzieścia notatek nie
  spadło na użytkownika jednego poranka.
- **Notatka pusta albo szczątkowa** (sam szablon, `Szczegóły` bez treści): pomiń
  przy doborze i zgłoś w podsumowaniu sesji — nie ma z czego pytać.
- **Duplikat pozycji** dla tej samej notatki: scal w jedną, zachowując **wcześniejszą
  datę** `następna` i **niższy** interwał.
- **Zero zaległych w obu źródłach:** powiedz to i podaj datę najbliższej powtórki,
  jak dotąd.

## Hook

`~\.claude\hooks\powtorki-check.ps1` — **bez zmian**. Czyta cały plik regexem
`następna: (\d{4}-\d{2}-\d{2})`, więc pozycje notatkowe wpadają do porannego
licznika zaległych automatycznie. To główny powód, dla którego format członu
`[następna: …, interwał: …]` jest nietykalny.

## Pliki do zmiany

| Plik | Zmiana |
|---|---|
| `C:\Users\rafal\.claude\skills\nauka-z-claude\SKILL.md` | sekcja o powtórkach z notatek, trzy tryby w kroku 0, format sekcji stanu, wpisy w „Red flags" i „Częste błędy" |
| `D:\Notatki\notatki\.claude\skills\tidy-journal\SKILL.md` | krok rejestrujący notatki w rotacji, odbicie w planie (punkt 9) i raporcie (punkt 11), wpis w „Czego nie robić" |
| `D:\Notatki\notatki\.claude\CLAUDE.md` | dopisek o sekcji `## Powtórki z notatek` w opisie `nauka-z-claude.md` |
| `D:\Notatki\notatki\README.md` | aktualizacja opisu skilla `nauka-z-claude` |
| `~\.claude\hooks\powtorki-check.ps1` | bez zmian |

## Poza zakresem

- Widok powtórek w Obsidian Bases (wymagałby metadanych we frontmatterze notatek —
  odrzucone świadomie na rzecz czystej treści notatki).
- Automatyczne wciąganie do rotacji notatek spoza `nauka/tech/` (ręczne wskazanie pojedynczej notatki pozostaje możliwe).
- Awansowanie luki z powtórki notatki na pełny temat sokratejski.
- Zmiana drabinki albo zasad pozycji tematycznych — te zostają dokładnie takie,
  jakie są.
