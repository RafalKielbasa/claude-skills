# Scenariusz live „<TYTUŁ>" — <DD.MM.YYYY>

Dokument prowadzący transmisję. Poziom: **beaty + kwestie kluczowe** —
dosłownie zapisane są tylko te zdania, które muszą paść co do słowa (hook,
rachunek korzyści, zapowiedzi prezentu, przejścia, ogłoszenie oferty, cała
oferta, CTA). Reszta jest punktowo: prowadzący ma mówić, nie czytać.

<!--
Wzór: `live-events/2026-08-27-agenci-ai/runbook/scenariusz-live.md`,
jedenaście bloków. Nie kopiuj liczby bloków ani ich nazw — wynikają z
minutówki (SKILL.md §7), zbudowanej z `promise` i z przebiegu dema
zatwierdzonego w `documents.demo`. Usuń ten komentarz po wypełnieniu.
-->

| | |
|---|---|
| Data i godzina | <DD.MM.YYYY>, transmisja ~<H:MM> |
| Platforma | <np. YouTube (rejestracja przez landing)> |
| HOST | **<imię>** — prowadzi, buduje ramę, liczy korzyść, sprzedaje |
| EKSPERT | **<imię>** — obsługuje demo, komentuje, nie sprzedaje |
| Czat | **<imię>** — moderuje przez całą transmisję, wybiera pytania do Q&A |
| Produkcja | **<imię>** — sceny OBS, overlaye, licznik |
| Próba generalna | <data i pora> |

Dokumenty towarzyszące: `plany-b.md` (degradacja), `scenografia-obs.md`
(sceny), `pre-live-checklist.md` (start minus 60 min), ściąga prowadzącego
(`knowledge-base/marketing/live-<data>-sciaga-prowadzacego.md`).

## Legenda

- **[D]** — kwestia dosłowna, pada co do słowa.
- **[CUE]** — sygnał dla produkcji (scena, overlay, plansza). Konwencja
  poniżej — `live-boards` czyta te znaczniki, żeby wiedzieć, które plansze
  wyrenderować, więc każdy `[CUE]` musi dać się rozebrać na scenę i (jeśli
  jest) planszę.
- **[B]** — plan B tego bloku (pełna degradacja: `plany-b.md`).
- **[WAR]** — blok warunkowy, do wycięcia jednym ruchem.

### Konwencja `[CUE]`

<!--
Reguła sprawdzona na sierpniowym scenariuszu (11 wystąpień, wszystkie
sparsowane): każdy `[CUE]` robi dwie rzeczy. Nie rozluźniaj tej reguły bez
ponownego przejścia po wzorcu — patrz raport zadania 8, sekcja o weryfikacji
cue. Usuń ten komentarz po wypełnieniu (zostaw resztę sekcji — to część
dokumentu, nie tylko instrukcja dla autora).
-->

Każdy `[CUE]`, zaraz po pogrubionym `**[CUE]**`, mówi dwie rzeczy:

1. **Co się zmienia na obrazie** — scena, na którą przełącza produkcja
   (`Scena „<nazwa>"`), **albo**, jeśli scena zostaje ta sama co przy
   poprzednim `[CUE]`, sam element overlayu, który się zmienia (np. „Overlay
   z licznikiem piętnastu minut startuje teraz"). Blok z kilkoma przełączeniami
   scen w trakcie (np. głosowanie → pisanie → import) wymienia je w kolejności,
   każdą jako osobne zdanie.
2. **Jaka plansza jest na ekranie.** Plansza pojawiająca się pierwszy raz jest
   nazwana i opisana na tyle konkretnie (tytuł + treść), żeby ktoś, kto nie
   widział tego bloku, umiał ją narysować. Plansza, która **zostaje** z
   wcześniejszego bloku, jest nazwana z dopiskiem, że zostaje (np. „plansza
   oferty zostaje w rogu ekranu") — nie opisujemy jej drugi raz od zera. Gdy
   na ekranie **nie ma** żadnej planszy w miejscu, gdzie widz mógłby się jej
   spodziewać, `[CUE]` mówi to wprost („bez planszy", „bez licznika") —
   milczenie na ten temat nie jest równoznaczne z brakiem planszy.

**Jedna plansza — jeden `[CUE]`, który ją wprowadza.** Każda plansza, która
w ogóle pojawia się w scenariuszu, ma dokładnie jeden blok, w którym `[CUE]`
wprowadza ją po raz pierwszy i opisuje. Późniejsze bloki, w których ta sama
plansza zostaje na ekranie, odwołują się do niej po nazwie — nie tworzą
drugiego, konkurencyjnego opisu tej samej planszy. `live-boards` renderuje
dokładnie te plansze, które `[CUE]` nazywa — nienazwana plansza nie powstanie,
a nazwana bez opisu treści powstanie pusta.

## Zasady na całą transmisję

<!--
Przenieś tu zasady językowe i sprzedażowe ustalone z koncepcji i (jeśli
demo już to sprawdziło) z dema: czego nie mówimy, jak nazywamy rzeczy po
ludzku, kto sprzedaje a kto milczy na antenie, kto ma czat. Wzór: sierpniowy
scenariusz, sekcja o tej samej nazwie — dziesięć-dwanaście punktów, każdy
jednym akapitem, żaden nie jest ogólnikiem bez konkretnego zakazanego słowa
albo konkretnej osoby.
-->

- <zasada 1 — np. co jest pokazem, a nie tutorialem>
- <zasada 2 — słowa, które nie padają, i czym je zastępujemy>
- <zasada 3 — jak liczymy i wyceniamy bonusy (ceny katalogowe, nie dorobione)>
- <zasada 4 — kto sprzedaje, kto milczy, kto wkleja linki>
- <zasada 5 — czyj jest czat i co konkretnie robi każda z osób przy nim>
- <zasada 6 — co robimy, kiedy coś nie działa (nikt nie przeprasza za
  technologię na antenie)>

---

## Minutówka

<!--
Buduj tę tabelę PRZED blokami (SKILL.md §7) — zegar jest ograniczeniem, nie
skutkiem. Wzór: sierpniowy scenariusz. Blok, który się nie mieści, jest
cięty tutaj, zanim powstanie choćby jedno zdanie jego treści.
-->

| Czas | Blok | Prowadzi |
|---|---|---|
| 0:00–<M> | 1. <nazwa bloku otwierającego> | <kto> |
| <M>–<M> | 2. <nazwa> | <kto> |
| <M>–<M> | 3. <nazwa> | <kto> |
| … | … | … |

Momenty na klipy do socjali (produkcja znacza timecode): <2-3 momenty>.

---

<!--
Blok 1 jest strukturalnie inny niż każdy kolejny: to jedyne miejsce, gdzie
`promise` z `live.yaml` musi paść dosłownie (SKILL.md §6, Rules) — słowo w
słowo to samo, co w `templates/host-sheet.md`, wiersz "Hasło live'a", i to
samo, co widz zobaczy na planszach i na landing page. Dlatego blok 1 ma swój
własny szkielet, z gotowym slotem na tę obietnicę, zamiast być kopią
generycznego bloku poniżej. Usuń ten komentarz po wypełnieniu.
-->

## Blok 1 · 0:00–<M> — <nazwa bloku otwierającego>

**Cel:** <jedno zdanie — co widz ma wiedzieć/czuć na końcu tego bloku>

**Prowadzi:** <kto, i co robi druga osoba w tym czasie>

**Hasło live'a (musi paść w tym bloku, dosłownie):**
**„<promise z `live.yaml`, dosłownie — te same słowa co w
`templates/host-sheet.md` i na planszach/landing page, żadnej parafrazy>"**

**[CUE]** <scena + plansza (albo jej brak) — konwencja wyżej>

**Beaty:**

1. <beat>
2. <beat>

**[D] <nazwa kwestii — hasło z góry wpleć w tę albo w osobną kwestię, nie
tylko wypisz osobno>:**

> „<treść dosłowna, tylko jeśli musi paść co do słowa>"

**[B]** <plan B tego konkretnego bloku, jednym-dwoma zdaniami; pełna wersja
w `plany-b.md`>

---

<!--
Kolejne bloki (2, 3, …) NIE mają własnego slotu na obietnicę — ona pada raz,
w bloku otwierającym powyżej. Skopiuj poniższy generyczny szkielet tyle razy,
ile jeszcze bloków ma minutówka, w tej samej kolejności i z tymi samymi
granicami czasowymi, i usuń ten komentarz w gotowym dokumencie.
-->

## Blok 2 · <M>–<M> — <nazwa>

**Cel:** <jedno zdanie — co widz ma wiedzieć/czuć na końcu tego bloku>

**Prowadzi:** <kto, i co robi druga osoba w tym czasie>

**[CUE]** <scena + plansza (albo jej brak) — konwencja wyżej>

**Beaty:**

1. <beat>
2. <beat>

**[D] <nazwa kwestii>:**

> „<treść dosłowna, tylko jeśli musi paść co do słowa>"

**[B]** <plan B tego konkretnego bloku, jednym-dwoma zdaniami; pełna wersja
w `plany-b.md`>

---

## Mapa obiekcji — ściąga do Q&A

<!--
Wzór: sierpniowy scenariusz, sekcja o tej samej nazwie. Kto odpowiada:
inicjały osób z tabeli na górze dokumentu. Obiekcje bierz z raportu
poprzedniego live'a (co naprawdę padło na czacie) i z rzeczy, których
demo świadomie NIE robi (bo tam rodzą się pytania "a co jeśli..."). Pytania
bez potwierdzonej odpowiedzi zostają oznaczone wprost jako otwarte — nie
improwizujemy warunków handlowych.
-->

| # | Obiekcja / pytanie | Kto | Odpowiedź |
|---|---|---|---|
| 1 | <obiekcja> | <inicjał> | „<odpowiedź gotowa do powiedzenia z pamięci>" |

Pytania spoza mapy, na które **nie odpowiadamy z głowy**: <lista>. Formuła:
„nie chcę Ci czegoś obiecać na żywo i się pomylić — odpiszę w komentarzu po
transmisji".

---

## Karta kieszonkowa (na antenę)

<!--
Jedna strona, do wydruku albo na drugi ekran. Wzór: sierpniowy scenariusz,
sekcja o tej samej nazwie — przebieg czasowy w jednej linii, tabela liczb,
które padają na antenie, lista słów zakazanych, lista rzeczy do uzupełnienia
tuż przed livem.
-->

**Przebieg:** <cała minutówka w jednej linii, godzina po godzinie>.

**Liczby, które padają na antenie:**

| Co | Wartość |
|---|---|
| <cena / rabat / termin / liczba> | <wartość> |

**Czego nie mówimy:** <lista słów i zwrotów zakazanych>.

**Uzupełnić przed livem:** <linki, terminy, decyzje jeszcze otwarte w
momencie pisania tego dokumentu>.

---

## Changelog decyzji

<!--
Ta sekcja trzyma uzasadnienia zmian, żeby przy kolejnej rewizji nie
odtwarzać ich z pamięci. Wzór: sierpniowy scenariusz — wpisy narastające,
nowsze unieważniają starsze, miejsca unieważnienia oznaczone wprost. Pierwszy
wpis przy nowym dokumencie to zwykle "brak — pierwsza wersja"; kolejne
uruchomienia tego skilla dopisują tu, co się zmieniło i dlaczego.
-->

**<DD.MM — pierwsza wersja>**

Brak wcześniejszych decyzji do unieważnienia — to pierwsza wersja tego
scenariusza, zbudowana z `documents.concept` i `documents.demo` w stanie
zatwierdzonym na ten dzień.
