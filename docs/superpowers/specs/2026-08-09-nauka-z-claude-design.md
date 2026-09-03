# Spec: skill `nauka-z-claude` — nauka zagadnień krok po kroku

Data: 2026-08-09
Status: zatwierdzony projekt, do implementacji

## Cel

Globalny skill Claude Code do nauki zagadnień (głównie technicznych) metodą
sokratejską: Claude prowadzi pytaniami przez zatwierdzoną roadmapę kroków,
tłumaczy dopiero gdy naprowadzanie nie działa, a postęp zapisuje w pliku
notatek, żeby dało się wrócić do tematu po przerwie i kontynuować od miejsca,
w którym skończyliśmy.

## Lokalizacja i wywołanie

- Plik skilla: `C:\Users\rafal\.claude\skills\nauka-z-claude\SKILL.md`.
- Ciało skilla po polsku; `description` we frontmatter po angielsku
  z polskimi frazami-triggerami (konwencja jak w `podsumuj-sesja-claude`).
- Triggery: „naucz mnie X", „chcę się nauczyć X", „przerabiajmy X",
  „wróćmy do nauki X", „kontynuujmy naukę", jawne `/nauka-z-claude`.
- NIE dotyczy: jednorazowych pytań („co to jest X?", „wyjaśnij mi X")
  bez intencji przerabiania tematu — to zwykła odpowiedź, nie ten skill.

## Przebieg

### Krok 0 — plik postępu

Na początku każdego uruchomienia skill czyta plik postępu
`D:\Notatki\notatki\nauka-z-claude.md`:

- Plik nie istnieje → utwórz z nagłówkiem `# Nauka z Claude`.
- Temat z prośby użytkownika ma już sekcję w pliku → zaproponuj wznowienie
  (ścieżka „Wznowienie" niżej) zamiast zaczynania od zera.
- Tematu nie ma → ścieżka „Nowy temat".
- Prośba bez nazwy tematu („kontynuujmy naukę") → wypisz tematy ze statusem
  „w trakcie" i zapytaj, który przerabiamy; przy jednym takim temacie —
  zaproponuj go wprost.

### Nowy temat: diagnoza i roadmapa

1. **Diagnoza**: 3–5 pytań kalibrujących poziom, od ogólnych do
   szczegółowych, ton rozmowy — nie egzaminu. Cel: ustalić, od czego zacząć
   i czego nie tłumaczyć od zera.
2. **Roadmapa**: propozycja 5–10 kroków od fundamentów, dopasowanych do
   zdiagnozowanego poziomu. Jeden krok = porcja do przejścia w jednej sesji.
3. **Zatwierdzenie**: użytkownik może kroki dodać, wyciąć lub zmienić
   kolejność. Dopiero po zatwierdzeniu roadmapa trafia do pliku postępu
   i zaczyna się nauka.

### Pętla sokratejska (rdzeń skilla)

Jeden krok roadmapy to seria pytań: otwierające, potem naprowadzające.
Zasady:

- **Claude nie wykłada.** Tłumaczy dopiero, gdy dwie próby naprowadzenia
  nie przybliżają odpowiedzi albo gdy użytkownik wprost mówi „nie wiem,
  wytłumacz". Wtedy: krótkie wyjaśnienie i pytanie sprawdzające z innej
  strony niż to, które zawiodło.
- **Błędna odpowiedź nie dostaje od razu poprawki** — dostaje pytanie
  wskazujące lukę w rozumowaniu.
- **Krok jest zaliczony**, gdy użytkownik odpowie poprawnie na pytanie
  kontrolne własnymi słowami. Parafraza świeżo usłyszanego wyjaśnienia
  nie wystarcza — wtedy pytanie kontrolne z innego ujęcia.
- Przy tematach technicznych pytania mogą używać realnych fragmentów kodu
  i mini-ćwiczeń, gdy to naturalne — ale to nadal tryb pytaniowy,
  nie zadaniowy.
- Widoczna luka w rozumieniu blokuje przejście dalej, nawet jeśli formalnie
  padła poprawna odpowiedź.

### Wznowienie tematu

1. Przeczytaj sekcję tematu z pliku postępu.
2. Krótkie przypomnienie, gdzie skończyliśmy (1–2 zdania).
3. 1–2 pytania rozgrzewkowe z już przerobionych kroków (retencja) —
   jeśli odpowiedzi pokazują lukę, najpierw ją załataj.
4. Kontynuacja od pierwszego nieodhaczonego kroku roadmapy.

### Koniec sesji

- Krótkie podsumowanie: co przerobione, co sprawiało trudność.
- Aktualizacja pliku postępu (odhaczenia, notatki, następny krok).
- Wskazanie następnego kroku na przyszłą sesję.

## Format pliku postępu

Plik: `D:\Notatki\notatki\nauka-z-claude.md`. Nagłówek `# Nauka z Claude`,
potem sekcja per temat:

```markdown
## <Temat>

- **Status:** w trakcie | ukończony
- **Ostatnia sesja:** YYYY-MM-DD
- **Poziom startowy:** <1–2 zdania z diagnozy>

### Roadmapa

- [x] Krok 1 — <nazwa>
- [ ] Krok 2 — <nazwa>

### Notatki

- Wracać do: <pojęcie, które sprawiało trudność>
- <inne obserwacje przydatne przy wznowieniu>

**Następny krok:** <konkretnie, od czego zacząć następną sesję>
```

Zasady zapisu:

- Aktualizacja po każdym zaliczonym kroku i na koniec sesji.
- Skill dopisuje/aktualizuje wyłącznie sekcję bieżącego tematu — pozostałych
  sekcji nie rusza. Dopisywanie, nie nadpisywanie pliku.
- Pusta podsekcja (np. brak notatek) znika, nie zostaje pusty nagłówek.

## Częste błędy (tabela w skillu)

| Błąd | Zamiast tego |
|---|---|
| Wykładanie zamiast pytań | Pytanie naprowadzające; wyjaśnienie dopiero po 2 nieudanych próbach lub na prośbę |
| Zaliczanie kroku po parafrazie | Pytanie kontrolne z innego ujęcia, odpowiedź własnymi słowami |
| Przechodzenie dalej mimo widocznej luki | Wróć i załataj lukę, dopiero potem następny krok |
| Nadpisanie innych sekcji pliku postępu | Edytuj tylko sekcję bieżącego tematu |
| Zbyt duże kroki roadmapy | Krok ma być do przejścia w jednej sesji |
| Diagnoza w tonie egzaminu | Rozmowa: „z czym już pracowałeś?", nie odpytywanie |

## Poza zakresem (świadomie)

- Osobne pliki per temat — dopiero gdyby wspólny plik urósł za bardzo.
- Mechanizmy typu spaced repetition, quizy z punktacją, statystyki nauki.
- Katalog `references/` w skillu — całość mieści się w jednym `SKILL.md`.

## Kryteria akceptacji

1. Frazy „naucz mnie X" / „wróćmy do nauki X" uruchamiają skill; „co to
   jest X?" — nie.
2. Nowy temat zawsze przechodzi: diagnoza → roadmapa → zatwierdzenie
   użytkownika → zapis do pliku.
3. W trakcie nauki Claude domyślnie zadaje pytania; wyjaśnienie pojawia się
   wyłącznie po dwóch nieudanych naprowadzeniach lub na wyraźną prośbę.
4. Krok odhaczany tylko po poprawnej odpowiedzi własnymi słowami.
5. Wznowienie zaczyna się od rozgrzewki z przerobionego materiału
   i kontynuuje od pierwszego nieodhaczonego kroku.
6. Plik postępu po sesji jest zaktualizowany, a sekcje innych tematów —
   nietknięte.
