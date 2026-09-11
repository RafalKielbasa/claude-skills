# Wiki — rejestr zmian skilli (repo Baza wiedzy)

Ślad każdej próby zmiany skilla z `.claude/skills/`: zaakceptowanej
i odrzuconej. Skill `evolve-skill` czyta ten plik przed propozycją i nie wolno
mu powtórzyć propozycji już odrzuconej. Pełny diff zostaje także przy
odrzuceniu — to jedyny sposób, żeby rozpoznać powtórkę. Zmiany wprowadzone
ręcznie, poza `evolve-skill`, też tu trafiają (wzorzec globalny
zmiana-skilla-poza-evolve-skill-bez-sladu).

Format wpisu:

    ## YYYY-MM-DD — <skill> — zaakceptowana | odrzucona
    - **Wzorce:** <nazwy stron wiki>
    - **Zmiana:** <streszczenie w 1–3 zdaniach>
    - **Powód decyzji:** <przy odrzuceniu: powód użytkownika>
    - **Nawrót:** YYYY-MM-DD, <wzorzec>
    (pod spodem blok diff z pełnym diffem SKILL.md)

## Wpisy

## 2026-09-07 — kurs-redakcja — zaakceptowana
- **Wzorce:** walidacja-calego-kursu-wnosi-cudze-bledy-do-bramki
- **Zmiana:** Krok 6: komenda walidacji wskazuje katalog lekcji (`../../kursy/<slug>/<modul>/<lekcja>`) zamiast katalogu kursu, z dopiskiem, że błędy z innych lekcji nie wchodzą do bramki redakcji.
- **Powód decyzji:** zmiana wprowadzona wprost na zgodę użytkownika („zgadzam się z twoją propozycją") po jego pytaniu „czemu uruchamiamy walidator całego kursu, przecież pracujemy lekcja po lekcji"; poza ścieżką `evolve-skill`, wpis dopisany ręcznie w tej samej sesji, żeby rejestr był kompletny.

```diff
--- a/.claude/skills/kurs-redakcja/SKILL.md
+++ b/.claude/skills/kurs-redakcja/SKILL.md
@@ -106,7 +106,8 @@ z modelem i effortem wybranym przez Rafała na starcie.
 6. **Status video i walidacja.** Jeśli dotyczy (krok 3), ustaw
    `status.video: brak` w `lekcja.yaml`; statusów `tresc`/`zadania` nie
    ruszaj. Potem `cd tools/course-pipeline && npm run validate --
-   ../../kursy/<slug>` — napraw wszystkie BŁĘDY.
+   ../../kursy/<slug>/<modul>/<lekcja>` (katalog lekcji, nie kursu — błędy
+   z innych lekcji nie wchodzą do tej bramki) — napraw wszystkie BŁĘDY.
 7. **BRAMKA: raport dla Rafała.** Pokaż: per plik 3–5 charakterystycznych
```

## 2026-09-10 — kurs-lekcja — zaakceptowana
- **Wzorce:** walidacja-calego-kursu-wnosi-cudze-bledy-do-bramki
- **Zmiana:** Krok 5: komenda walidacji wskazuje katalog lekcji (`../../kursy/<slug>/modul-NN-x/lekcja-NN-y`) zamiast katalogu kursu, z dopiskiem, że błędy z innych lekcji nie wchodzą do tej bramki. Treściowo to ta sama poprawka, którą 2026-09-07 przyjął `kurs-redakcja`; placeholder ścieżki zapisany w konwencji używanej w krokach 6 i 8 tego samego pliku, nie w konwencji `<modul>/<lekcja>` z `kurs-redakcja`. Krok 8 („uruchom walidację ponownie") dziedziczy komendę z kroku 5, więc poprawia się bez osobnej zmiany.
- **Powód decyzji:** propozycja z `/evolve-skill kurs-lekcja`, zaakceptowana przez Rafała słowem „akceptuje". Wzorzec miał 3 dowody z 3 sesji i status `otwarty`; sprawdzone w tej sesji `grep -rn "npm run validate" .claude/skills/` potwierdziło, że `kurs-lekcja:88` i `kurs-zadania:73` nadal walidowały cały kurs, a `kurs-nowy:38` robi to słusznie (skill zakłada program całego kursu).
- **Zakres świadomie pominięty:** `kurs-zadania` krok 4 z tym samym defektem — zasada „jedna zmiana, jeden skill"; do osobnego wywołania `/evolve-skill kurs-zadania`. Nie dopisano też klauzuli „błędy spoza lekcji trafiają do briefu jako osobne zadanie" z sekcji Rozwiązanie wzorca, bo przyjęta poprawka w `kurs-redakcja` też jej nie ma, a cały udokumentowany koszt bierze się z hałasu cudzych błędów, nie z tego, co się z nimi potem robi.
```diff
diff --git a/.claude/skills/kurs-lekcja/SKILL.md b/.claude/skills/kurs-lekcja/SKILL.md
index 1fcda34..4fecf0a 100644
--- a/.claude/skills/kurs-lekcja/SKILL.md
+++ b/.claude/skills/kurs-lekcja/SKILL.md
@@ -85,8 +85,9 @@ przedstawione Rafałowi do bramki review.
      i cudzysłowów,
    - liczba segmentów avatar ≤ 3.
 5. **Walidacja.** Ustaw `status.tresc: do_review` w lekcja.yaml, potem
-   `cd tools/course-pipeline && npm run validate -- ../../kursy/<slug>` —
-   napraw wszystkie BŁĘDY.
+   `cd tools/course-pipeline && npm run validate --
+   ../../kursy/<slug>/modul-NN-x/lekcja-NN-y` (katalog lekcji, nie kursu —
+   błędy z innych lekcji nie wchodzą do tej bramki) — napraw wszystkie BŁĘDY.
 6. **Niezależny review AI.**
    `npm run review-ai -- ../../kursy/<slug>/modul-NN-x/lekcja-NN-y`.
    Przeczytaj `review-ai.md`: problemy zasadne → popraw treść i powtórz
```

## 2026-09-10 — kurs-lekcja — zaakceptowana (kontrole odczytem)
- **Wzorce:** grep-po-tresciach-kursu-gubi-twarde-spacje-i-emoji
- **Zmiana:** Krok 4: nowy punkt checklisty — kontrole robi się odczytem pliku, nie `grep`-em po frazie z treści. Po wstawieniu twardych spacji `w wideo`, `z inwestycji` i `U Ciebie` mają w środku U+00A0, a emoji jako pattern w Git Bash nie trafia — oba przypadki dają ciche "0", nie błąd. Kotwica na fragmencie bez jednoliterowego słowa; "0 trafień" na właśnie napisanym pliku to błąd wzorca, nie fakt — reguła obejmuje też `old_string` w `Edit` i własne skrypty liczące.
- **Powód decyzji:** propozycja z `/evolve-skill kurs-lekcja`, zaakceptowana przez Rafała słowami „Przyjmij i przy okaćji napaw wiki". Wzorzec miał 4 dowody z 4 sesji i trzy klasy narzędzia (`grep`, `Edit`, własny skrypt kontrolny), a sprawdzone w tej sesji `grep -n -i "grep\|U+00A0" .claude/skills/kurs-*/SKILL.md` potwierdziło, że żaden skill rodziny nie miał tej reguły. Czwarty dowód powstał właśnie w tej sesji i właśnie w `kurs-lekcja`: skrypt liczący callouty zwrócił 0 na artykule, w którym jest ich sześć.
- **Zakres świadomie pominięty:** `kurs-redakcja` i `kurs-zadania` — zasada „jedna zmiana, jeden skill"; wzorzec nazywa je wprost, więc wystąpienie tam będzie brakiem pokrycia, nie nawrotem. Zostawione też trzy wzorce `kurs-lekcja` po jednym dowodzie: `regex-walidatora-uzyty-jako-fixer-typografii`, `twierdzenie-negatywne-o-narzedziu-bez-zrodla`, `url-dokumentacji-n8n-przeniesiony-bez-przekierowania`.

```diff
--- a/.claude/skills/kurs-lekcja/SKILL.md
+++ b/.claude/skills/kurs-lekcja/SKILL.md
@@ -84,7 +84,14 @@
      i cudzysłowów,
-   - liczba segmentów avatar ≤ 3.
+   - liczba segmentów avatar ≤ 3,
+   - **kontrole tej checklisty rób odczytem pliku, nie `grep`-em po frazie
+     z treści.** Po wstawieniu twardych spacji `w wideo`, `z inwestycji`
+     i `U Ciebie` mają w środku U+00A0, a emoji jako pattern w Git Bash nie
+     trafia — oba przypadki dają ciche "0", nie błąd. Kotwicz na fragmencie
+     bez jednoliterowego słowa (`wideo**`, `Ciebie (`, `^> `). "0 trafień"
+     na pliku, który właśnie napisałeś, to błąd wzorca, nie fakt — tak samo
+     odbite `old_string` w `Edit` i licznik z własnego skryptu kontrolnego.
 5. **Walidacja.** Ustaw `status.tresc: do_review` w lekcja.yaml, potem
```

- **Nawrót:** 2026-09-11, grep-po-tresciach-kursu-gubi-twarde-spacje-i-emoji (sesja session_01M1roR3MszbAgi1a1AE3xqh, `/kurs-lekcja M02L02`; `Edit` odbity od `old_string` z brudnopisu i własny skrypt liczący callouty z wynikiem 0 na pliku z ośmioma — reguła z kroku 4 przeczytana i mimo to złamana dwa razy)

## 2026-09-10 — kurs-zadania — zaakceptowana
- **Wzorce:** walidacja-calego-kursu-wnosi-cudze-bledy-do-bramki
- **Zmiana:** Krok 5: komenda walidacji wskazuje katalog lekcji (`../../kursy/<slug>/modul-NN-x/lekcja-NN-y`) zamiast katalogu kursu, z dopiskiem, że błędy z innych lekcji nie wchodzą do tej bramki. Placeholder w konwencji `modul-NN-x/lekcja-NN-y` — tej samej co w `kurs-lekcja` i co zapis wejścia w nagłówku tego pliku (`SKILL.md:8`), nie `<modul>/<lekcja>` z `kurs-redakcja`. Krok 7 („uruchom walidację ponownie") dziedziczy komendę z kroku 5, więc poprawia się bez osobnej zmiany.
- **Powód decyzji:** propozycja z `/evolve-skill kurs-zadania`, zaakceptowana przez Rafała słowem „przyjąć". Wzorzec miał 4 dowody z 4 sesji i status `otwarty`; `kurs-zadania` był jego ostatnim niepoprawionym wystąpieniem, więc ta zmiana zamyka wzorzec. Sprawdzone przed propozycją: `SKILL.md:73` faktycznie miał `-- ../../kursy/<slug>`.
- **Zakres świadomie pominięty:** reguła kontroli odczytem zamiast `grep`-a (wzorzec `grep-po-tresciach-kursu-gubi-twarde-spacje-i-emoji`), choć `kurs-zadania` ma w kroku 4 tę samą typografię z U+00A0 co `kurs-lekcja` — wzorzec ma status `zaadresowany`, więc Krok 2 skilla `evolve-skill` kazał go pominąć. Zgłoszone Rafałowi jako skutek uboczny tamtego statusu, do osobnej decyzji.

```diff
--- a/.claude/skills/kurs-zadania/SKILL.md
+++ b/.claude/skills/kurs-zadania/SKILL.md
@@ -72,8 +72,9 @@
 5. **Walidacja.** Ustaw `status.zadania: do_review` w `lekcja.yaml`, potem
-   `cd tools/course-pipeline && npm run validate -- ../../kursy/<slug>` —
-   napraw wszystkie BŁĘDY.
+   `cd tools/course-pipeline && npm run validate --
+   ../../kursy/<slug>/modul-NN-x/lekcja-NN-y` (katalog lekcji, nie kursu —
+   błędy z innych lekcji nie wchodzą do tej bramki) — napraw wszystkie BŁĘDY.
 6. **BRAMKA: prezentacja Rafałowi.** Pokaż: treść pytań quizu (z poprawnymi
```

## 2026-09-11 — kurs-zadania — zaakceptowana
- **Wzorce:** generator-wypisuje-dwie-listy-zadania-rownolegle, kontrakt-platformy-opisany-ze-schematu-bez-kodu-konsumenta
- **Zmiana:** Trzy miejsca. Krok 3b: wszystkie trzy kategorie `dopasowanie` mają ten sam komplet pól (`elementy` + `cele` + `rozwiazanie`, przy `SORT` `cele` to numery pozycji), a kolejności list nie ustawia autor. Krok 4: osobny punkt samokontroli — czy zadanie da się rozwiązać bez wiedzy z lekcji, skoro platforma renderuje obie listy w kolejności z pliku. Krok 5 przemianowany na „Tasowanie i walidacja": przed walidacją idzie `npm run tasuj -- <lekcja>`, z wyjaśnieniem, czemu operacja jest bezpieczna (`rozwiazanie` wiąże pary po treści, nie po indeksie).
- **Powód decyzji:** zmiana wprowadzona wprost na zgodę Rafała („tak") po przedstawieniu projektu, poza ścieżką `evolve-skill` — wpis dopisany ręcznie w tej samej sesji, żeby rejestr był kompletny (wzorzec globalny zmiana-skilla-poza-evolve-skill-bez-sladu). Wyzwalaczem był zrzut ekranu z platformy: siedem par połączonych idealną przekątną.
- **Zakres poza SKILL.md:** to jest najmniejsza część zmiany. Egzekwowanie leży w kodzie, nie w instrukcji — nowa komenda `npm run tasuj` (`tools/course-pipeline/src/tasuj-zadania.js`), reguła przekątnej i wymóg `cele`/`rozwiazanie` w `walidujDopasowanie`, przepisana sekcja `DragActivity` w `kursy/_wspolne/szablony/struktura-zadania.md`. Wszystko w commicie `6c7bb30`. To celowa proporcja, opisana w globalnym wzorcu defekt-generowania-naprawiany-narzedziem-nie-regula: reguła w skillu jest ostatnim, nie pierwszym elementem naprawy.
- **Zgłoszone, nie zmienione:** krok 7 nadal każe zrobić `commit kurs(<slug>): zadania lekcji NN-y zatwierdzone`, co stoi w sprzeczności z regułą „nie commituj" z `CLAUDE.md`. Ten sam dług zgłoszono 2026-09-10 dla `kurs-lekcja` krok 8 — do zdjęcia w obu skillach jedną decyzją Rafała.

```diff
--- a/.claude/skills/kurs-zadania/SKILL.md
+++ b/.claude/skills/kurs-zadania/SKILL.md
@@ -54,7 +54,10 @@
       - **`dopasowanie`** — praktyka sprawdza znajomość pojęć lub kolejności
         kroków, ale nie wymaga budowania niczego. `kategoria: MATCH`/
         `CATEGORIZE` dla par pojęcie↔znaczenie, `SORT` dla kolejności kroków
-        z jedną logicznie poprawną odpowiedzią.
+        z jedną logicznie poprawną odpowiedzią. Wszystkie trzy kategorie mają
+        ten sam komplet pól: `elementy` + `cele` + `rozwiazanie`; w `SORT`
+        `cele` to numery pozycji `["1" … "N"]`. Kolejności list NIE ustawiasz
+        sam — od tego jest `npm run tasuj` w kroku 5.
       - **Żaden nie pasuje** — **nie fabrykuj ćwiczenia na siłę**; pomiń
         `cwiczenia/` i przygotuj krótkie uzasadnienie na bramkę.
       Nazwa pliku: `cwiczenia/<rodzaj>-01-<krotki-slug>.json`.
@@ -68,11 +71,19 @@
    `tytul`, `opis`, treści i odpowiedzi pytań, `wskazowki`, `elementy`,
    `cele`. Zero grywalizacji: pytanie ani ćwiczenie nie obiecuje odznaki,
    rangi, punktów ani awansu — nagrody pokazuje platforma, treść o nich
-   milczy.
-5. **Walidacja.** Ustaw `status.zadania: do_review` w `lekcja.yaml`, potem
-   `cd tools/course-pipeline && npm run validate --
-   ../../kursy/<slug>/modul-NN-x/lekcja-NN-y` (katalog lekcji, nie kursu —
-   błędy z innych lekcji nie wchodzą do tej bramki) — napraw wszystkie BŁĘDY.
+   milczy. Dla ćwiczenia `dopasowanie` sprawdź osobno, czy zadania da się
+   rozwiązać bez wiedzy z lekcji: platforma renderuje obie listy w kolejności
+   z pliku, więc listy wypisane parami zdradzają odpowiedź samym układem kart.
+   Kolejności nie poprawiasz ręcznie — robi to `npm run tasuj` w kroku 5.
+5. **Tasowanie i walidacja.** Ustaw `status.zadania: do_review` w
+   `lekcja.yaml`. Jeśli lekcja ma ćwiczenie `dopasowanie`, najpierw
+   `cd tools/course-pipeline && npm run tasuj -- ../../kursy/<slug>/modul-NN-x/lekcja-NN-y`
+   — komenda przestawia `cele` (MATCH/CATEGORIZE) albo `elementy` (SORT) tak,
+   żeby odpowiedź nie leżała na przekątnej; `rozwiazanie` zostaje nietknięte,
+   więc tasowanie nie może zepsuć poprawnej odpowiedzi. Potem
+   `npm run validate -- ../../kursy/<slug>/modul-NN-x/lekcja-NN-y` (katalog
+   lekcji, nie kursu — błędy z innych lekcji nie wchodzą do tej bramki) —
+   napraw wszystkie BŁĘDY.
 6. **BRAMKA: prezentacja Rafałowi.** Pokaż: treść pytań quizu (z poprawnymi
    odpowiedziami oznaczonymi), wygenerowane ćwiczenie (polecenie + treść
    właściwa dla rodzaju) albo uzasadnienie, czemu go nie ma. Uwagi Rafała
```

## 2026-09-11 — kurs-lekcja — zaakceptowana
- **Wzorce:** brak strony wiki — dług zgłaszany w logu 2026-09-10 i 2026-09-11, rozstrzygnięty decyzją Rafała, nie dowodami.
- **Zmiana:** Krok 8 przestaje kazać zrobić `commit kurs(<slug>): lekcja NN-y zatwierdzona`. W jego miejsce zdanie z `kurs-redakcja` krok 8: „Zmiany zostają niezacommitowane — commit robi Rafał." Reszta kroku (status `tresc: zatwierdzona`, ponowna walidacja, plan nagrania dla `typ_video: demo`) bez zmian.
- **Powód decyzji:** polecenie Rafała „usuń z kurs-zadania i kurs-lekcja mowę o commicie". Krok stał w sprzeczności z regułą „Nie commituj" z `~/.claude/CLAUDE.md`, która i tak wygrywa w czasie wykonania — instrukcja skilla kazała więc zrobić rzecz, której wykonanie trzeba było za każdym razem pominąć. Sprzeczność zgłoszona 2026-09-10 przy `/evolve-skill kurs-lekcja` (wtedy poza zakresem ewolucji, bo bez dowodu w wiki) i ponownie 2026-09-11.
- **Brzmienie wzięte z `kurs-redakcja` krok 8**, nie napisane od nowa — trzeci skill rodziny `kurs-*` mówi teraz to samo tymi samymi słowami.

```diff
--- a/.claude/skills/kurs-lekcja/SKILL.md
+++ b/.claude/skills/kurs-lekcja/SKILL.md
@@ -103,8 +103,8 @@
    lekcji (3–5 zdań), werdykt z review-ai.md + co poprawiono, liczbę
    segmentów avatar. Uwagi Rafała nanoś od ręki i iteruj.
 8. **Po zatwierdzeniu przez Rafała:** ustaw `status.tresc: zatwierdzona`,
-   uruchom walidację ponownie, commit
-   `kurs(<slug>): lekcja NN-y zatwierdzona`.
+   uruchom walidację ponownie. Zmiany zostają niezacommitowane — commit robi
+   Rafał.
    Dla `typ_video: demo` wygeneruj plan nagrania:
    `npm run plan-nagrania -- ../../kursy/<slug>/modul-NN-x/lekcja-NN-y`.
    Ostrzeżenia o rozjeździe scenariusza z konspektem pokaż Rafałowi razem ze
```

## 2026-09-11 — kurs-zadania — zaakceptowana (druga zmiana tego dnia)
- **Wzorce:** brak strony wiki — jak wyżej, decyzja Rafała.
- **Zmiana:** Krok 7 przestaje kazać zrobić `commit kurs(<slug>): zadania lekcji NN-y zatwierdzone`; to samo zdanie co w `kurs-lekcja` i `kurs-redakcja`. Status `zadania: zatwierdzone` i ponowna walidacja bez zmian.
- **Powód decyzji:** to samo polecenie Rafała, ta sama sprzeczność z `CLAUDE.md`. Zgłoszona w tej sesji przy okazji zmiany kroków 3b/4/5 (wpis wyżej) i rozstrzygnięta osobnym poleceniem.
- **Nie objęte, bo Rafał wskazał dwa skille:** `kurs-nowy` krok 8 (`git add kursy/<slug>` + commit), `kurs-video` krok 113-114 (commit `lekcja.yaml`) i `spotkanie` kroki 2, 5d, 7 nadal każą commitować. Wymienione w raporcie sesji, nie zmienione.

```diff
--- a/.claude/skills/kurs-zadania/SKILL.md
+++ b/.claude/skills/kurs-zadania/SKILL.md
@@ -89,8 +89,8 @@
    właściwa dla rodzaju) albo uzasadnienie, czemu go nie ma. Uwagi Rafała
    nanoś od ręki i iteruj.
 7. **Po zatwierdzeniu przez Rafała:** ustaw `status.zadania: zatwierdzone`,
-   uruchom walidację ponownie, commit
-   `kurs(<slug>): zadania lekcji NN-y zatwierdzone`.
+   uruchom walidację ponownie. Zmiany zostają niezacommitowane — commit robi
+   Rafał.
 
 ## Zasady
```

## 2026-09-11 — kurs-nowy — zaakceptowana
- **Wzorce:** brak strony wiki — decyzja Rafała, nie dowody.
- **Zmiana:** Krok 8 „Commit" (`git add kursy/<slug>` + commit `kurs(<slug>): program kursu zatwierdzony`) zastąpiony krokiem „Zakończenie": program i szkielet folderów zostają w drzewie roboczym pod `kursy/<slug>`, commit robi Rafał. Ścieżka z `git add` zachowana jako informacja, co jest produktem skilla — bez niej krok nie mówiłby, czego zmiana dotyczy.
- **Powód decyzji:** polecenie Rafała „zdejmij też z kurs-nowy, kurs-video i spotkanie", rozszerzenie decyzji sprzed kilkunastu minut o `kurs-lekcja` i `kurs-zadania`. Sprzeczność z regułą „Nie commituj" z `~/.claude/CLAUDE.md` ta sama; tutaj ostrzejsza, bo krok nazywał się „Commit" i nie zostawało z niego nic poza commitem.

```diff
--- a/.claude/skills/kurs-nowy/SKILL.md
+++ b/.claude/skills/kurs-nowy/SKILL.md
@@ -37,8 +37,8 @@
 7. **Walidacja.** `cd tools/course-pipeline && npm run validate -- ../../kursy/<slug>`
    — napraw wszystkie BŁĘDY (ostrzeżenia zgłoś Rafałowi).
-8. **Commit.** `git add kursy/<slug>` i commit
-   `kurs(<slug>): program kursu zatwierdzony`.
+8. **Zakończenie.** Program i szkielet folderów zostają w drzewie roboczym
+   pod `kursy/<slug>` — commit robi Rafał.
```

## 2026-09-11 — kurs-video — zaakceptowana
- **Wzorce:** brak strony wiki — decyzja Rafała.
- **Zmiana:** Krok 6 nie każe już commitować `kurs(<slug>): video lekcji NN-y zaakceptowane`. Fakt z nawiasu — że do zacommitowania jest sam `lekcja.yaml`, bo media binarne są w `.gitignore` — zostaje, przepisany jako wskazówka dla Rafała, nie polecenie dla Claude'a.
- **Powód decyzji:** to samo polecenie. Ten krok był najbardziej mylący z całej piątki: mówił „commitujesz tylko `lekcja.yaml`", czyli wprost instruował, co Claude ma wstawić do commita.

```diff
--- a/.claude/skills/kurs-video/SKILL.md
+++ b/.claude/skills/kurs-video/SKILL.md
@@ -110,8 +110,8 @@
 6. **Po akceptacji przez Rafała:** ustaw `status.video: zaakceptowane` w
-   `lekcja.yaml`, commit `kurs(<slug>): video lekcji NN-y zaakceptowane`
-   (commitujesz tylko `lekcja.yaml` — media binarne są w `.gitignore`).
+   `lekcja.yaml`. Zmiany zostają niezacommitowane — commit robi Rafał;
+   do zacommitowania jest sam `lekcja.yaml`, media binarne są w `.gitignore`.
```

## 2026-09-11 — spotkanie — zaakceptowana
- **Wzorce:** brak strony wiki — decyzja Rafała.
- **Zmiana:** Cztery miejsca. Tryb „przygotuj" krok 5: zapis agendy bez commita `spotkanie(YYYY-MM-DD): agenda`. Tryb „prowadź" krok 1: nawias „zapis pliku bez commitu" → „sam zapis pliku", bo po zmianie nie odróżnia już niczego od trybu pełnego. Tryb „prowadź" krok 5d i 5e: bramka to akceptacja Rafała, a indeksowanie do bazy wiedzy rusza po akceptacji, nie „po commicie" — to była jedyna zmiana o realnym skutku na przepływ, bo skill czekał na zdarzenie, które nigdy nie następowało. Tryb „transkrypt" krok 7: commit notatki zdjęty, kasowanie transkryptów i reszta kroku bez zmian.
- **Powód decyzji:** to samo polecenie Rafała.
- **Świadomie zostawione:** `SKILL.md:38` („bez commitów od 3 tygodni — omówić blokery?") to sygnał aktywności repo wchodzący do agendy, nie polecenie. `SKILL.md:213` („Nigdy nie commituj ich zawartości") to zakaz chroniący poufne transkrypty — zdjęcie go osłabiłoby niezmiennik, a nie usunęło polecenia commitowania.

```diff
--- a/.claude/skills/spotkanie/SKILL.md
+++ b/.claude/skills/spotkanie/SKILL.md
@@ -48,14 +48,14 @@
 5. **BRAMKA: Rafał zatwierdza agendę.** Bez zatwierdzenia nie zapisuj
-   plików. Po zatwierdzeniu: zapis `planning/YYYY-MM-DD-agenda.md`,
-   commit `spotkanie(YYYY-MM-DD): agenda`.
+   plików. Po zatwierdzeniu: zapis `planning/YYYY-MM-DD-agenda.md`. Plik
+   zostaje niezacommitowany — commit robi Rafał.
 
 1. **Start.** Wczytaj `planning/YYYY-MM-DD-agenda.md` z dzisiejszą datą;
    brak → najnowszą; brak jakiejkolwiek → zaproponuj szybką agendę ad-hoc
-   (skrócone „przygotuj": kroki 1 i 4, zapis pliku bez commitu).
+   (skrócone „przygotuj": kroki 1 i 4, sam zapis pliku).
@@ -94,9 +94,9 @@
-   d. BRAMKA: po akceptacji Rafała commit
-      `spotkanie(YYYY-MM-DD): notatka`.
-   e. Po commicie przejdź do indeksowania notatki do bazy wiedzy
+   d. BRAMKA: akceptacja Rafała. Notatka zostaje niezacommitowana —
+      commit robi Rafał.
+   e. Po akceptacji przejdź do indeksowania notatki do bazy wiedzy
       (sekcja „Indeksowanie notatki do bazy wiedzy").
@@ -145,10 +145,10 @@
 7. **BRAMKA: Rafał zatwierdza notatkę.** Dopiero wtedy: zmień
-   `**Status:** szkic` → `**Status:** finalna`, zapisz plik, commit
-   `spotkanie(YYYY-MM-DD): notatka`, i USUŃ wszystkie pliki (poza
-   `.gitkeep`) z `planning/transkrypty/` — surowy transkrypt to poufna
-   treść rozmowy, nie zostaje w repo ani na dysku po przetworzeniu.
+   `**Status:** szkic` → `**Status:** finalna`, zapisz plik i USUŃ
+   wszystkie pliki (poza `.gitkeep`) z `planning/transkrypty/` — surowy
+   transkrypt to poufna treść rozmowy, nie zostaje w repo ani na dysku po
+   przetworzeniu. Notatka zostaje niezacommitowana — commit robi Rafał.
```

**Domknięcie wątku:** po tych trzech wpisach żaden skill w `.claude/skills/` nie każe Claude'owi commitować. Stan sprawdzony `grep -rn "commit" .claude/skills/ --include=SKILL.md`: zostały wyłącznie zdania „commit robi Rafał", sygnał aktywności repo w agendzie `spotkanie` (`:38`), zakaz commitowania transkryptów (`spotkanie:213`) oraz opisy okna commitów w `knowledge-base-update`, który od początku miał regułę „Nie commitujesz" (`:20`).
