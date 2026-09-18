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

## 2026-09-11 — kurs-uwagi — zaakceptowana
- **Wzorce:** poprawka-frazy-tylko-w-scenariuszu-zostawia-artykul-i-konspekt, naniesienie-uwagi-siega-poza-akapit-znacznika
- **Zmiana:** Nowy krok 7 „Propagate to every file the change touches": tabela rodzajów zmiany w scenariuszu i ich odpowiedników w `artykul.md`, `video/konspekt-nagrania.md`, `video/dane-do-nagrania.md` i `video/prezentacja.yaml`, plus cztery reguły propagacji (jeden kierunek — scenariusz źródłem prawdy; pisownia tłumaczona, nie kopiowana; `grep` po STARYM brzmieniu zamiast założeń, z ostrzeżeniem o twardych spacjach; chirurgiczność także w pliku zależnym). Krok 1 inwentaryzuje pliki zależne i `typ_video`; krok 8 wymaga zacytowania liczników `grep`; krok 10 raportuje tabelę propagacji z `plik:linia`; „Zasady" nazywają uwagę naniesioną tylko w scenariuszu naniesioną w połowie i wyjaśniają, dlaczego ani `validate`, ani `plan-nagrania` tego nie łapią. Kroki 7–11 to renumeracja dawnych 7–10.
- **Powód decyzji:** decyzja Rafała wprost, po raporcie z sesji, w którym zgłosiłem żywy rozjazd — `konspekt-nagrania.md:101,126,147` z „dziś" przy scenariuszu mówiącym „wczoraj": „skill kurs-uwagi powinien aktualizować wszystke treści które są zależne, czyli artykuł, scenariusz, konspekt, i dane do nagrania, w innym wypadku zawsze będzie rozjazd". Zmiana wprowadzona poza ścieżką `evolve-skill`, wpis dopisany ręcznie w tej samej sesji, żeby rejestr był kompletny. Rozszerzenie o `prezentacja.yaml` (tor A) nie padło w zdaniu Rafała — dołożone jako ta sama reguła dla drugiego toru i zgłoszone mu wprost w raporcie do ewentualnego wycofania.

```diff
diff --git a/.claude/skills/kurs-uwagi/SKILL.md b/.claude/skills/kurs-uwagi/SKILL.md
index 721ad8d..f646b84 100644
--- a/.claude/skills/kurs-uwagi/SKILL.md
+++ b/.claude/skills/kurs-uwagi/SKILL.md
@@ -1,26 +1,32 @@
 ---
 name: kurs-uwagi
-description: Applies Rafał's inline remarks — `[UWAGA: ...]` lines written straight into video/scenariusz.md — one at a time, then deletes the ones it applied. Use when Rafał says "nanieś uwagi", "przejdź przez uwagi", "poprawki ze scenariusza", or points at a scenariusz that contains [UWAGA: ...] markers.
+description: Applies Rafał's inline remarks — `[UWAGA: ...]` lines written straight into video/scenariusz.md — one at a time, propagates each applied change to every dependent lesson file, then deletes the markers it applied. Use when Rafał says "nanieś uwagi", "przejdź przez uwagi", "poprawki ze scenariusza", or points at a scenariusz that contains [UWAGA: ...] markers.
 ---
 
 # /kurs-uwagi — apply inline remarks from a scenariusz
 
 Input: a lesson path, e.g. `kursy/<slug>/modul-01-x/lekcja-02-y`.
-Output: `video/scenariusz.md` edited only where the remarks point, plus a report at a review
-gate. Everything runs in the main session — no subagents, no Workflow.
+Output: `video/scenariusz.md` edited only where the remarks point, **every dependent lesson
+file brought into line with those edits**, plus a report at a review gate. Everything runs in
+the main session — no subagents, no Workflow.
 
 Talk to Rafał in Polish; this file is in English only because `CLAUDE.md` requires it of
 skills. The marker, the file paths and the report labels stay Polish.
 
-**This is not `/kurs-redakcja`.** Redakcja rewrites the whole file for style and invalidates
-every segment's TTS cache. This skill touches only what a marker points at, so a lesson that
-is already rendered pays only for the segments that actually changed.
+**This is not `/kurs-redakcja`.** Redakcja rewrites whole files for style and invalidates
+every segment's TTS cache. This skill touches only what a marker points at — in the scenariusz
+and in the files that repeat the same thing — so a lesson that is already rendered pays only
+for the segments that actually changed.
 
 ## Procedure
 
-1. **Entry gate.** `video/scenariusz.md` must exist and contain at least one `[UWAGA: ...]`
-   line. Zero markers → stop and say so plainly. Do not offer `/kurs-redakcja` as a
-   substitute; the user asked for remarks, not for a style pass.
+1. **Entry gate and inventory of dependants.** `video/scenariusz.md` must exist and contain at
+   least one `[UWAGA: ...]` line. Zero markers → stop and say so plainly. Do not offer
+   `/kurs-redakcja` as a substitute; the user asked for remarks, not for a style pass.
+   Then list which dependent files exist, because step 7 needs them: `artykul.md`,
+   `video/konspekt-nagrania.md`, `video/dane-do-nagrania.md` (both only for
+   `typ_video: demo`), `video/prezentacja.yaml` (only for `typ_video: prezentacja`).
+   Note `typ_video` and `status.tresc` from `lekcja.yaml` — steps 7, 9 and 10 branch on them.
 2. **Inventory.** Read the whole scenariusz. Show a table before changing anything:
    number, segment (`NN — tytuł`, or `cały scenariusz` for a marker before the first
    heading), the sentence directly above the marker, and the remark text. Rafał must see
@@ -33,11 +39,12 @@ is already rendered pays only for the segments that actually changed.
    - remarks whose application would override a course rule (see step 5).
    Wait for the answer. A timeout, or a hint to "proceed using your best judgment", is NOT
    consent — say you are waiting and ask again.
-4. **Apply surgically.** Edit only the places the remarks point at. Outside those places the
-   file stays byte-identical: no reflowing, no re-punctuating, no "while I'm here" fixes.
-   Scope of an edit: narration text and `[AKCJA: ...]` lines. Segment count, order, screen
-   types and the frontmatter `typ:` never change — a remark asking for that belongs to
-   `/kurs-lekcja`, and you say so instead of doing it.
+4. **Apply surgically in the scenariusz.** Edit only the places the remarks point at. Outside
+   those places the file stays byte-identical: no reflowing, no re-punctuating, no "while I'm
+   here" fixes. Scope inside this file: narration text and `[AKCJA: ...]` lines. Segment
+   count, order, screen types and the frontmatter `typ:` never change — a remark asking for
+   that belongs to `/kurs-lekcja`, and you say so instead of doing it. The other lesson files
+   are not touched yet; they are step 7, after every remark has landed here.
 5. **Rafał's remark outranks a course rule, but never silently.** If applying a remark
    contradicts `kursy/<slug>/wymowa.md` or the "Nietykalne" section of
    `kursy/_wspolne/redakcja.md`, apply it and name the overridden rule in the report. A
@@ -47,36 +54,75 @@ is already rendered pays only for the segments that actually changed.
    A remark you did not apply — disputed, needing Rafał's decision, or rejected — keeps its
    line and goes into the report with the reason. Deleting a marker without making the change
    is a silent rejection and is forbidden.
-7. **Self-check.** Before the gate, verify yourself:
+7. **Propagate to every file the change touches.** A lesson says the same thing in up to four
+   places. A change that lands in the scenariusz alone is a rozjazd, and it surfaces at
+   recording time — after the content gate, when Rafał is already clicking. Walk every applied
+   change and bring its counterparts into line:
+
+   | what changed in the scenariusz | where the same thing also lives |
+   |---|---|
+   | a literal typed or pasted on screen: chat question, node / credential / sheet / field name, field value | `artykul.md` (the step telling the reader to type it), `video/konspekt-nagrania.md` (the numbered step), `video/dane-do-nagrania.md` (the "Do wklejenia i wpisania na ekranie" table and the blocks under it) |
+   | an `[AKCJA: ...]` line: what is clicked, opened or shown, and in what order | `video/konspekt-nagrania.md` (the numbered step), and `artykul.md` where the article walks the same click |
+   | a claim about the interface: a field invisible in some mode, a warning that does not appear, the name of a section or tab | `artykul.md`, `video/konspekt-nagrania.md` |
+   | the outcome of a demo beat, or the point the beat is making | `artykul.md` (the matching `### Krok N` section) |
+   | a slide's wording, for `typ_video: prezentacja` | `video/prezentacja.yaml` |
+   | narration wording with no counterpart on screen or in the article | nothing — stop here |
+
+   Four rules for the propagation itself:
+   - **One direction only.** The scenariusz is the source of truth (`redakcja.md` →
+     "Scenariusz jest źródłem prawdy") because it is the file Rafał verifies by clicking
+     through the product. The other files follow it. Never edit the scenariusz to match them.
+   - **Spelling is translated, not copied.** Narration carries names quoted and phonetic
+     (`"Get Meni"`, `"en osiem en"`, `"Google Szits"`); `artykul.md`, the konspekt, the cheat
+     sheet and `prezentacja.yaml` carry the original spelling (`Get Many`, `n8n`,
+     `Google Sheets`). Carry the meaning across, not the string — see "Nazwy w scenariuszu"
+     in `redakcja.md`.
+   - **Search, never assume.** For every literal that changed, grep the OLD wording across all
+     dependent files and fix every hit. These files use U+00A0 after one-letter words, so a
+     pattern containing ` i `, ` w `, ` z ` can return zero on text that is certainly there —
+     anchor on a fragment without one-letter words, or allow both space characters.
+   - **Surgical there too.** In a dependent file you change only what the propagation
+     requires. If a counterpart cannot be fixed without rewriting a whole section, that is
+     still yours to do, but it goes into the report as a separate line, flagged as a rewrite.
+   `video/plan-nagrania.md` is generated, never edited by hand: it refreshes in step 9.
+8. **Self-check.** Before the gate, verify yourself:
    - segment count, order and screen types unchanged; frontmatter `typ:` unchanged,
    - proper names in narration follow `kursy/<slug>/wymowa.md`; any new phonetic spelling is
      appended to that list,
    - `[AKCJA: ...]` lines and segment titles keep names in their original spelling, per
      "Nazwy w scenariuszu" in `kursy/_wspolne/redakcja.md`,
-   - no remark text leaked into narration.
-8. **Statuses.** If the scenariusz changed and `status.video` is `wyrenderowane` or
-   `zaakceptowane`, set it to `brak` in `lekcja.yaml` — the render is now out of date, and a
-   fresh `/kurs-video` costs TTS and HeyGen (for a demo lesson, also Rafał's manual edit).
-   Say this out loud. `status.tresc` is not touched. The skill runs at any `status.tresc`,
-   `zatwierdzona` included — a remark on an approved, rendered lesson is the main case this
-   exists for.
-9. **Validate.** `cd tools/course-pipeline && npm run validate -- ../../kursy/<slug>/<modul>/<lekcja>`
+   - no remark text leaked into narration,
+   - **zero leftovers of the propagation:** for every literal you changed, grep its OLD form
+     across `artykul.md`, `video/konspekt-nagrania.md`, `video/dane-do-nagrania.md` and
+     `video/prezentacja.yaml`. A single hit means the job is half done. Quote the grep and its
+     count in the report — "sprawdziłem" without a number is not a check.
+9. **Statuses and validation.** If the scenariusz changed and `status.video` is
+   `wyrenderowane` or `zaakceptowane`, set it to `brak` in `lekcja.yaml` — the render is now
+   out of date, and a fresh `/kurs-video` costs TTS and HeyGen (for a demo lesson, also
+   Rafał's manual edit). Say this out loud. `status.tresc` is not touched. The skill runs at
+   any `status.tresc`, `zatwierdzona` included — a remark on an approved, rendered lesson is
+   the main case this exists for.
+   Then `cd tools/course-pipeline && npm run validate -- ../../kursy/<slug>/<modul>/<lekcja>`
    (the lesson directory, not the course — errors from other lessons do not belong in this
    gate). Fix every ERROR **with one exception**: when you deliberately left a remark
    unapplied on a lesson at `status.tresc: zatwierdzona`, the validator reports
-   `nienaniesione uwagi przy status.tresc zatwierdzona`. That error is the expected consequence of step 6,
-   not a defect — do not "fix" it by deleting the marker. Quote it in the report and say which
-   remark keeps it alive; it clears when Rafał decides that remark. Every other ERROR you fix.
+   `nienaniesione uwagi przy status.tresc zatwierdzona`. That error is the expected
+   consequence of step 6, not a defect — do not "fix" it by deleting the marker. Quote it in
+   the report and say which remark keeps it alive; it clears when Rafał decides that remark.
+   Every other ERROR you fix.
    For `typ_video: demo` **at `status.tresc: zatwierdzona`**, regenerate the recording plan:
-   `npm run plan-nagrania -- ../../kursy/<slug>/<modul>/<lekcja>`; narration changed, so the
-   plan is genuinely stale. At `szkic` or `do_review` do not run it — `generateRecordingPlan`
-   refuses anything but approved content. Say in the report that the plan regenerates on
-   approval instead.
-10. **GATE: report for Rafał.** A table — remark → what you did → segment. Then: remarks left
-    unapplied with reasons; rules overridden; the list of segments whose narration changed
-    (exactly the set that will be re-synthesised; every other segment keeps its cached audio
-    and avatar); status changes. Remind him the full diff is in the working tree. Apply his
-    follow-up remarks directly and iterate.
+   `npm run plan-nagrania -- ../../kursy/<slug>/<modul>/<lekcja>`; narration and konspekt both
+   changed, so the plan is genuinely stale. Read its warnings — a step that suddenly pairs
+   "po kolejności" is a naming rozjazd you introduced. At `szkic` or `do_review` do not run it
+   — `generateRecordingPlan` refuses anything but approved content. Say in the report that the
+   plan regenerates on approval instead.
+10. **GATE: report for Rafał.** A table — remark → what you did → segment. Then: the
+    propagation table (change → files updated → `plik:linia`), with any counterpart rewrite
+    flagged separately; the grep counts from step 8; remarks left unapplied with reasons;
+    rules overridden; the list of segments whose narration changed (exactly the set that will
+    be re-synthesised; every other segment keeps its cached audio and avatar); status changes.
+    Remind him the full diff is in the working tree. Apply his follow-up remarks directly and
+    iterate.
 11. **After Rafał approves.** If you made further edits, run validation again. Changes stay
     uncommitted — Rafał commits. Offer a Conventional Commits message, e.g.
     `kurs(<slug>): uwagi do scenariusza lekcji NN-y`.
@@ -85,10 +131,18 @@ is already rendered pays only for the segments that actually changed.
 
 - A remark is an instruction about a place, not a licence to edit the file. If you cannot tell
   which sentence a remark is about, that is a question for step 3, not a guess.
+- **A remark applied only in the scenariusz is not applied, it is half applied.** The lesson is
+  one document split across four files; whatever the viewer sees on screen has to say the same
+  thing in every one of them. Propagation is not an optional extra step — leaving it out
+  guarantees a rozjazd, and the rozjazd is found by Rafał at the recording, not by the
+  validator.
 - NEVER render video, generate content, or write quizzes — those are `/kurs-video`,
   `/kurs-lekcja`, `/kurs-zadania`.
 - The pipeline blocks a forgotten marker in two places: `npm run validate` errors when markers
   survive at `status.tresc: zatwierdzona`, and `npm run video` refuses to start before its
-  first paid API call. Neither is a substitute for finishing the job here.
+  first paid API call. Neither is a substitute for finishing the job here, and neither catches
+  a missed propagation — `validate` never compares files against each other, and
+  `plan-nagrania` pairs steps by whole-step similarity, so a pair differing by one word pairs
+  cleanly and warns about nothing.
 - If Rafał wants the whole file reworked rather than these specific places, that is
   `/kurs-redakcja`. Say so instead of quietly widening the scope.
```

## 2026-09-11 — kurs-redakcja — zaakceptowana (propagacja)
- **Wzorce:** poprawka-frazy-tylko-w-scenariuszu-zostawia-artykul-i-konspekt, agent-redakcji-naprawia-rozjazd-zamiast-go-zglosic
- **Zmiana:** Ta sama reguła propagacji, którą tego dnia dostał `kurs-uwagi`, przeniesiona do `kurs-redakcja` jako nowy krok 6 „Propagacja na pliki zależne" (tabela odpowiedników + cztery reguły: jeden kierunek ze scenariusza, pisownia tłumaczona a nie kopiowana, `grep` po STARYM brzmieniu z ostrzeżeniem o twardych spacjach, chirurgiczność w pliku zależnym). Krok 1 inwentaryzuje pliki zależne i `typ_video`; krok 5 odsyła zmienione literały do kroku 6; krok 8 raportuje tabelę propagacji z licznikami `grep`; „Zasady" nazywają redakcję naniesioną tylko w zredagowanym pliku naniesioną w połowie. Przy okazji naprawiona kolejność, którą propagacja pogłębiała: regeneracja `plan-nagrania.md` przeniesiona z kroku 9 do kroku 7, PRZED walidację (dotąd bramka zawsze widziała ostrzeżenie o nieaktualnym planie, bo plan odświeżał się dopiero po zatwierdzeniu), z poleceniem porównania ostrzeżeń generatora z przebiegiem sprzed redakcji. Kroki 6–9 to renumeracja dawnych 5–8 od nowego kroku 6 w dół.
- **Powód decyzji:** decyzja Rafała wprost — „napraw konspekt i przenieś tę regułę do kurs-redakcja" — po tym, jak w raporcie ze zmiany `kurs-uwagi` wskazałem, że `kurs-redakcja` ma identyczną dziurę i że to właśnie nią powstał dzisiejszy rozjazd „dziś/wczoraj". Zmiana poza ścieżką `evolve-skill`, wpis dopisany ręcznie w tej samej sesji.

```diff
commit 0c5593deff17c950168c1cacdff85ba2cc296163
Author: RafalKielbasa <kielbasarafal92@gmail.com>
Date:   Fri Sep 11 13:38:03 2026 +0200

    docs: wiki update

diff --git a/.claude/skills/kurs-redakcja/SKILL.md b/.claude/skills/kurs-redakcja/SKILL.md
index c697060..4519540 100644
--- a/.claude/skills/kurs-redakcja/SKILL.md
+++ b/.claude/skills/kurs-redakcja/SKILL.md
@@ -17,8 +17,11 @@ z modelem i effortem wybranym przez Rafała na starcie.
    `artykul.md`, `video/scenariusz.md`, `video/prezentacja.yaml`, `quiz.json`,
    `cwiczenia/*.json`. Redagujesz wyłącznie istniejące pliki — nic nie
    generujesz od zera (od tego są `/kurs-lekcja` i `/kurs-zadania`). Jeśli nie
-   istnieje żaden — przerwij i skieruj na `/kurs-lekcja`. Zanotuj
-   `status.video` z `lekcja.yaml` (potrzebny w krokach 3 i 6). Jeśli w zestawie
+   istnieje żaden — przerwij i skieruj na `/kurs-lekcja`. Osobno wypisz pliki
+   ZALEŻNE, których redakcja nie dotyka, ale które powtarzają tę samą treść
+   i muszą za nią nadążyć (krok 6): `video/konspekt-nagrania.md`
+   i `video/dane-do-nagrania.md` przy `typ_video: demo`. Zanotuj
+   `status.video` i `typ_video` z `lekcja.yaml` (potrzebne w krokach 3, 6, 7 i 9). Jeśli w zestawie
    jest `video/scenariusz.md`, ustal listę wymowy kursu `kursy/<slug>/wymowa.md`
    — gdy pliku nie ma, utwórz go z `kursy/_wspolne/szablony/wymowa.md`
    (podmień `<nazwa kursu>`, przykładowy wiersz zostaw do czasu pierwszego
@@ -123,7 +126,8 @@ z modelem i effortem wybranym przez Rafała na starcie.
      Po przepisaniu sekcji sprawdź, czy reszta artykułu nie odwołuje się
      jeszcze do starej tezy. Potem sprawdź, czy poprawki
      w artykule nie rozjechały quizu i ćwiczeń — grupa C czytała artykuł
-     sprzed naprawy,
+     sprzed naprawy. Literały wpisywane na ekranie, które przy tej okazji
+     zmieniłeś, idą dalej: krok 6,
    - prezentacja.yaml: liczba i kolejność slajdów, `id` i `uklad` bez zmian,
      zero HTML w treści,
    - artykuł: callouty 🎬 na miejscach, ≥1 blok bez calloutu; każdy obrazek ma
@@ -134,15 +138,67 @@ z modelem i effortem wybranym przez Rafała na starcie.
      te same,
    - merytoryka: diff nie dodaje ani nie gubi faktów, liczb, cen, nazw.
    Naruszenia napraw od ręki.
-6. **Status video i walidacja.** Jeśli dotyczy (krok 3), ustaw
+6. **Propagacja na pliki zależne.** Lekcja mówi to samo w kilku plikach,
+   a redakcja rusza tylko część z nich. Zmiana, która wylądowała wyłącznie
+   w zredagowanym pliku, jest rozjazdem — wychodzi przy nagraniu, po bramce
+   treści, kiedy Rafał już klika. Przejdź `git diff` zredagowanych plików
+   i dla każdej zmiany dotykającej treści widocznej poza tym plikiem
+   doprowadź odpowiedniki do zgodności:
+
+   | co się zmieniło | gdzie to samo jeszcze żyje |
+   |---|---|
+   | literał wpisywany albo wklejany na ekranie: pytanie do czatu, nazwa węzła / credentiala / arkusza / pola, wartość pola | `artykul.md`, `video/konspekt-nagrania.md` (numerowany krok), `video/dane-do-nagrania.md` (tabela "Do wklejenia i wpisania na ekranie" i bloki pod nią) |
+   | linia `[AKCJA: ...]`: co jest klikane, otwierane, pokazywane i w jakiej kolejności | `video/konspekt-nagrania.md`, a w `artykul.md` tam, gdzie artykuł prowadzi to samo kliknięcie |
+   | twierdzenie o interfejsie: pole niewidoczne w danym trybie, ostrzeżenie, którego nie ma, nazwa sekcji albo zakładki | `artykul.md`, `video/konspekt-nagrania.md` |
+   | wynik albo puenta beatu demo | `artykul.md` (odpowiadająca sekcja `### Krok N`) |
+   | brzmienie narracji bez odpowiednika na ekranie i w artykule | nic — koniec |
+
+   Cztery reguły samej propagacji:
+   - **Jeden kierunek.** Źródłem prawdy jest `video/scenariusz.md` (redakcja.md
+     → "Scenariusz jest źródłem prawdy"), bo to jego Rafał weryfikuje klikając
+     w produkcie. Pozostałe pliki idą za nim, nigdy odwrotnie.
+   - **Pisownię tłumaczysz, nie kopiujesz.** Narracja niesie nazwy
+     w cudzysłowie i fonetycznie (`"Get Meni"`, `"en osiem en"`,
+     `"Google Szits"`); artykuł, konspekt, dane do nagrania i
+     `prezentacja.yaml` mają oryginalną pisownię (`Get Many`, `n8n`,
+     `Google Sheets`). Przenosisz znaczenie, nie string.
+   - **Szukasz, nie zakładasz.** Dla każdego zmienionego literału zrób `grep`
+     po STARYM brzmieniu we wszystkich plikach zależnych i popraw każde
+     trafienie. Te pliki mają twarde spacje po jednoliterowych słowach, więc
+     wzorzec z ` i `, ` w `, ` z ` zwróci zero na tekście, który tam na
+     pewno jest — kotwicz się na fragmencie bez nich albo dopuszczaj oba znaki
+     spacji. Liczniki `grep` cytujesz w raporcie; "sprawdziłem" bez liczby
+     nie jest kontrolą.
+   - **Chirurgicznie także tam.** W pliku zależnym zmieniasz wyłącznie to,
+     czego wymaga propagacja. Jeśli odpowiednika nie da się naprawić bez
+     przepisania całej sekcji — przepisujesz, ale w raporcie idzie to osobną
+     linią, oznaczone jako przepisanie.
+
+   `video/plan-nagrania.md` jest generowany, nie edytowany ręcznie —
+   odświeża się w kroku 7.
+7. **Status video, plan nagrania i walidacja.** Jeśli dotyczy (krok 3), ustaw
    `status.video: brak` w `lekcja.yaml`; statusów `tresc`/`zadania` nie
-   ruszaj. Potem `cd tools/course-pipeline && npm run validate --
+   ruszaj.
+   Potem, gdy lekcja ma `typ_video: demo` przy `status.tresc: zatwierdzona`,
+   a redakcja albo propagacja ruszyła `video/scenariusz.md` lub
+   `video/konspekt-nagrania.md` — przegeneruj plan nagrania:
+   `npm run plan-nagrania -- ../../kursy/<slug>/<modul>/<lekcja>`. Robisz to
+   PRZED walidacją, bo inaczej bramka zobaczy ostrzeżenie o nieaktualnym
+   `video/plan-nagrania.md`. Przeczytaj ostrzeżenia generatora i porównaj je
+   z przebiegiem sprzed redakcji: krok, który dopiero teraz paruje się
+   "po kolejności", to rozjazd nazewnictwa, który sam wprowadziłeś. Przy
+   `szkic` albo `do_review` planu nie generujesz — `generateRecordingPlan`
+   odmawia treści niezatwierdzonej; napisz w raporcie, że plan odświeży się
+   przy zatwierdzeniu.
+   Na koniec `cd tools/course-pipeline && npm run validate --
    ../../kursy/<slug>/<modul>/<lekcja>` (katalog lekcji, nie kursu — błędy
    z innych lekcji nie wchodzą do tej bramki) — napraw wszystkie BŁĘDY.
-7. **BRAMKA: raport dla Rafała.** Pokaż: per plik 3–5 charakterystycznych
+8. **BRAMKA: raport dla Rafała.** Pokaż: per plik 3–5 charakterystycznych
    zmian "przed → po", łączną skalę zmian, listę naprawionych rozjazdów
    artykuł vs scenariusz (osobno oznaczone te, przy których przepisałeś tezę
    sekcji — te Rafał czyta w pierwszej kolejności),
+   tabelę propagacji na pliki zależne (co się zmieniło → jakie pliki
+   zaktualizowane → `plik:linia`) wraz z licznikami `grep` z kroku 6,
    listę wątpliwości merytorycznych od agentów, pozycje dopisane
    do `wymowa.md` (jeśli redagowałeś scenariusz),
    zmiany statusów (w tym `video → brak`, jeśli zaszło),
@@ -150,15 +206,14 @@ z modelem i effortem wybranym przez Rafała na starcie.
    od ręki (w głównej sesji, bez ponownego Workflow) i iteruj. Rafał może też
    wpisać je wprost do `video/scenariusz.md` jako linie `[UWAGA: ...]` — wtedy
    nanosi je `/kurs-uwagi`, a nie ta procedura.
-8. **Po zatwierdzeniu przez Rafała:** jeśli nanosiłeś poprawki po uwagach,
+9. **Po zatwierdzeniu przez Rafała:** jeśli nanosiłeś poprawki po uwagach,
    uruchom walidację ponownie. `video` zostaje `brak` do decyzji
    o re-renderze. Zmiany zostają niezacommitowane — commit robi Rafał.
    Jeśli Rafał przerwie bramkę bez decyzji, powiedz wprost w podsumowaniu,
    że pliki w drzewie są po redakcji, ale bez akceptacji.
-   Jeśli lekcja ma `typ_video: demo`, a redakcja objęła grupę B
-   (`video/scenariusz.md`), przegeneruj plan nagrania:
-   `npm run plan-nagrania -- <lekcja>`. Bez tego `npm run validate` zgłosi
-   ostrzeżenie o nieaktualnym `video/plan-nagrania.md`.
+   Jeśli poprawki po uwagach ruszyły `video/scenariusz.md` albo
+   `video/konspekt-nagrania.md`, przegeneruj plan nagrania jeszcze raz
+   (warunki i komenda — krok 7) i dopiero potem uruchom walidację.
 
 ## Zasady
 
@@ -169,6 +224,12 @@ z modelem i effortem wybranym przez Rafała na starcie.
   KAŻDY, po stronie artykułu, w tej redakcji — także taki, który wymaga
   przepisania tezy całej sekcji. Artykuł ma wyjść z redakcji zgodny ze
   scenariuszem; `/kurs-lekcja` nie jest miejscem na rozjazdy.
+- **Redakcja naniesiona tylko w zredagowanym pliku jest naniesiona w połowie.**
+  Lekcja to jeden dokument rozbity na kilka plików; to, co widz zobaczy na
+  ekranie, musi brzmieć tak samo w każdym z nich. Ani `npm run validate`, ani
+  `npm run plan-nagrania` tego nie złapią — walidator nigdy nie porównuje
+  plików między sobą, a plan paruje kroki po podobieństwie całego kroku, więc
+  para różniąca się jednym słowem paruje się czysto i nie ostrzega o niczym.
 - NIE renderuj video, NIE generuj nowych treści ani zadań — to
   `/kurs-video`, `/kurs-lekcja`, `/kurs-zadania`.
 - Najtaniej redagować PRZED `/kurs-video` — redakcja scenariusza lub slajdów
```

## 2026-09-11 — kurs-redakcja — zaakceptowana (kontrole odczytem)
- **Wzorce:** grep-po-tresciach-kursu-gubi-twarde-spacje-i-emoji (5 dowodów, status `nawrót (2026-09-11)`)
- **Zmiana:** Krok 5 („Kontrola strukturalna") dostaje regułę kotwiczenia kontroli: checklistę sprawdza się odczytem pliku, nie `grep`-em po frazie z treści; wzorzec kotwiczy się na fragmencie bez jednoliterowego słowa i bez emoji, a przy krótkich akronimach na granicy słowa (`\bAPI\b`); „0 trafień" i „kilkanaście trafień" na pliku właśnie przeczytanym to wynik wzorca, nie fakt — tak samo odbite `old_string` w `Edit` i licznik własnego skryptu. Ostatnie zdanie rozciąga regułę na `grep`-y propagacyjne z kroku 6.
- **Powód decyzji:** propozycja z `/evolve-skill kurs-redakcja`, zaakceptowana przez Rafała słowem „Akceptuję" (wariant pełny, razem z częścią o akronimach). Krok 6 tego skilla miał od 2026-09-11 połowę reguły — o twardych spacjach w `grep`-ach propagacyjnych — ale krok 5 to inne kontrole (callouty 🎬, numeracja ilustracji, merytoryka), czyli dokładnie te, w których wzorzec ma cztery z pięciu dowodów. Połowy o krótkich akronimach (`grep -i "API"` trafiające w „napisze"/„zapisz") nie miał dotąd żaden skill rodziny.
- **Zakres świadomie pominięty:** `kurs-lekcja` — to tam wzorzec ma status `nawrót` i to tam jego strona proponuje przeniesienie reguły z kroku 4 (samokontrola) do kroku 3 (pisanie treści); Rafał odłożył tę zmianę („Nie teraz") przy tym samym wywołaniu. Nie zakładano też `npm run sierotki` w `course-pipeline`, o którym mówi sekcja Rozwiązanie wzorca `regex-walidatora-uzyty-jako-fixer-typografii`.

```diff
--- a/.claude/skills/kurs-redakcja/SKILL.md
+++ b/.claude/skills/kurs-redakcja/SKILL.md
@@ -137,6 +137,16 @@
    - quiz/ćwiczenia: JSON się parsuje, pola bez zmian, poprawne odpowiedzi
      te same,
    - merytoryka: diff nie dodaje ani nie gubi faktów, liczb, cen, nazw.
+   **Kontrole z tej listy rób odczytem pliku, nie `grep`-em po frazie z treści.**
+   Po redakcji `w wideo`, `z inwestycji` i `U Ciebie` mają w środku U+00A0,
+   a emoji jako pattern w Git Bash nie trafia — oba przypadki dają ciche "0",
+   nie błąd. Kotwicz na fragmencie bez jednoliterowego słowa (`wideo**`,
+   `Ciebie (`, `^> `). Odwrotna pułapka jest równie cicha: `grep -i` po krótkim
+   akronimie (`API`) trafia w podciągi polskich słów („napisze", „zapisz") —
+   kotwicz na granicy słowa (`\bAPI\b`) albo czytaj trafienia z kontekstem.
+   "0 trafień" i "kilkanaście trafień" na pliku, który właśnie przeczytałeś, to
+   wynik wzorca, a nie fakt — tak samo odbite `old_string` w `Edit` i licznik
+   z własnego skryptu kontrolnego. Reguła obowiązuje też `grep`-y z kroku 6.
    Naruszenia napraw od ręki.
 6. **Propagacja na pliki zależne.** Lekcja mówi to samo w kilku plikach,
```

## 2026-09-11 — kurs-zadania — zaakceptowana (kontrole odczytem)
- **Wzorce:** grep-po-tresciach-kursu-gubi-twarde-spacje-i-emoji (5 dowodów, status `nawrót (2026-09-11)`)
- **Zmiana:** Krok 4 („Samokontrola") dostaje tę samą regułę, przełożoną na pola quizu i ćwiczeń: po wstawieniu twardych spacji `opis`, `wskazowki` i treści pytań mają U+00A0 w środku `a i o u w z`, więc wzorzec ze zwykłą spacją daje ciche „0"; `grep -i` po krótkim akronimie trafia w podciągi polskich słów. Kotwica na fragmencie bez jednoliterowego słowa albo na granicy słowa (`\bAPI\b`). Wstawka idzie zaraz po zdaniu o typografii, przed zdaniem o grywalizacji.
- **Powód decyzji:** propozycja z `/evolve-skill kurs-zadania`, zaakceptowana przez Rafała słowem „Akceptuję" (wariant pełny). To realizacja decyzji odłożonej 2026-09-10: wpis z tamtego dnia mówi wprost, że regułę pominięto, bo wzorzec miał wtedy status `zaadresowany` i Krok 2 `evolve-skill` kazał go pominąć — „zgłoszone Rafałowi jako skutek uboczny tamtego statusu, do osobnej decyzji". Status `nawrót` tę blokadę zdejmuje. Krok 4 już wcześniej kazał wstawiać U+00A0 w pola widoczne dla kursanta, a nie mówił nic o tym, jak potem te pola kontrolować.
- **Zakres świadomie pominięty:** krok 2 (lektura kontekstu) i krok 5 (tasowanie i walidacja); checklista w `struktura-zadania.md` bez zmian.

```diff
--- a/.claude/skills/kurs-zadania/SKILL.md
+++ b/.claude/skills/kurs-zadania/SKILL.md
@@ -75,7 +75,16 @@
    spacjami), tylko proste cudzysłowy `"` i `'`, twarda spacja U+00A0 po
    jednoliterowych słowach (`a i o u w z`) w polach widocznych dla kursanta —
    `tytul`, `opis`, treści i odpowiedzi pytań, `wskazowki`, `elementy`,
-   `cele`. Zero grywalizacji: pytanie ani ćwiczenie nie obiecuje odznaki,
+   `cele`.
+   **Kontrole tej checklisty rób odczytem pliku, nie `grep`-em po frazie
+   z treści.** Po wstawieniu twardych spacji pola `opis`, `wskazowki` i treści
+   pytań mają U+00A0 w środku `a i o u w z`, więc wzorzec ze zwykłą spacją
+   zwróci ciche "0" na tekście, który tam na pewno jest; `grep -i` po krótkim
+   akronimie (`API`) trafia z kolei w podciągi polskich słów („napisze").
+   Kotwicz na fragmencie bez jednoliterowego słowa albo na granicy słowa
+   (`\bAPI\b`). "0 trafień" na pliku, który właśnie napisałeś, to błąd wzorca,
+   nie fakt — tak samo odbite `old_string` w `Edit`.
+   Zero grywalizacji: pytanie ani ćwiczenie nie obiecuje odznaki,
    rangi, punktów ani awansu — nagrody pokazuje platforma, treść o nich
    milczy. Dla ćwiczenia `dopasowanie` sprawdź osobno, czy zadania da się
```

## 2026-09-16 — kurs-lekcja — zaakceptowana (reguła związana z przebiegiem, nie z checklistą)
- **Wzorce:** grep-po-tresciach-kursu-gubi-twarde-spacje-i-emoji (status `nawrót (2026-09-11)`, 5 dowodów z 5 sesji)
- **Zmiana:** Krok 3 dostaje podpunkt `f`: twarde spacje wstawia się na końcu kroku 3, a od tej chwili własny brudnopis jest nieaktualny wobec dysku, więc do końca lekcji KAŻDY `old_string` w `Edit`, pattern w `grep` i wzorzec we własnym skrypcie kontrolnym kotwiczy się na fragmencie bez jednoliterowego słowa ze spacją. Odbita edycja i ciche "0" na pliku, który samemu przed chwilą zapisało się, to objaw twardej spacji, a nie dowód zmiany pliku przez kogoś innego — w obu wypadkach najpierw odczyt pliku. Reguła obowiązuje także przy przebiegu puszczonym ręcznie, poza komendą `course-pipeline`. Krok 4 zostaje nietknięty co do zasady, ale dostaje drugą połowę tej samej pułapki: `grep -i` po krótkim akronimie (`API`) trafia w podciągi polskich słów („napisze", „zapisz"), więc kotwica na granicy słowa albo czytanie trafień z kontekstem; brzmienie skopiowane z `kurs-redakcja` krok 5, żeby rodzina mówiła jednym głosem.
- **Powód decyzji:** propozycja z `/evolve-skill kurs-lekcja`, zaakceptowana przez Rafała słowami „akceptuje, i dołóż tę drugą połowę z \bAPI\b". Wzorzec ma status `nawrót` od 2026-09-11 i 5 dowodów z 5 sesji — najwięcej w wiki repo. Nawrót wydarzył się w `kurs-lekcja`, gdzie reguła już stała w kroku 4: była przeczytana na starcie sesji i mimo to złamana dwa razy w jednej lekcji. Diagnoza ze strony wzorca: reguła jest trafna, ale stoi w złym miejscu — krok 4 to samokontrola czytana później, a szkoda dzieje się w kroku 3, tuż po przebiegu wstawiającym U+00A0, gdy o twardych spacjach najłatwiej zapomnieć, bo właśnie się je wstawiło. Sprawdzone w tej sesji: `grep -n "sierotk" tools/course-pipeline/package.json tools/course-pipeline/src/*.js` — komendy naprawiającej sierotki NIE MA, `typografia.js` to detektor, więc przebieg wstawiający jest zawsze doraźny; stąd ostatnie zdanie podpunktu `f`.
- **Relacja do propozycji odłożonej 2026-09-11:** strona wzorca nazywa dwa warianty zamknięcia nawrotu — „przenieść regułę do kroku 3" ALBO „związać ją ze skryptem". Pierwszy Rafał odłożył słowem „Nie teraz" przy `/evolve-skill kurs-redakcja` 2026-09-11. Ta zmiana realizuje drugi i została przedstawiona Rafałowi z tym zastrzeżeniem na wierzchu, wraz z tabelą różnic (operacja: dopisanie vs przeniesienie; wyzwalacz: moment przebiegu vs moment czytania checklisty; zasięg: każda czynność do końca lekcji vs kontrole checklisty kroku 4; nowa treść: „twój brudnopis jest nieaktualny", czego krok 4 nie mówi w ogóle) i z ofertą zapisania jej jako odrzuconej, gdyby uznał to za przeformułowanie. Rafał przyjął.
- **Zakres świadomie pominięty:** `regex-walidatora-uzyty-jako-fixer-typografii` (3 dowody, `otwarty`) — asercja „brak U+00A0 razem ze zwykłą spacją" w skrypcie wstawiającym oraz komenda naprawiająca sierotki w `course-pipeline`; to osobny wzorzec i w dużej części zadanie dla `tools/`, nie dla `SKILL.md`. Zostawione też sześć wzorców `kurs-lekcja` po jednym dowodzie: `lekcja-dopasowana-do-niezacommitowanej-zmiany-poprzedniej`, `review-ai-ocenia-zargon-bez-kontekstu-poprzednich-lekcji`, `twierdzenie-negatywne-o-narzedziu-bez-zrodla`, `format-scenariusza-skopiowany-z-sasiedniej-lekcji`, `scenariusz-screencastu-pisany-bez-otwarcia-produktu` oraz dwudowodowy `url-dokumentacji-n8n-przeniesiony-bez-przekierowania`.

```diff
--- a/.claude/skills/kurs-lekcja/SKILL.md
+++ b/.claude/skills/kurs-lekcja/SKILL.md
@@ -68,6 +68,20 @@ przedstawione Rafałowi do bramki review.
       pierwsze wystąpienie w lekcji `> 🎬 **Też w wideo** - możesz przejrzeć pobieżnie, jeśli obejrzałeś.`,
       kolejne `> 🎬 **Też w wideo**`. Bloki tylko-artykułowe zostaw bez
       calloutu; ≥1 blok MUSI zostać nieoznaczony. Konwencja w struktura-lekcji.md.
+   f. **Twarde spacje wstaw na końcu kroku 3 — i od tej chwili traktuj własny
+      brudnopis jako nieaktualny.** Przebieg wstawiający U+00A0 po `a i o u w z`
+      przepisuje pliki, które już napisałeś, więc tekst, który masz w pamięci
+      i w brudnopisie, przestaje zgadzać się z dyskiem co do znaku — a Ty o tym
+      nie wiesz, bo pliku po przebiegu nie czytałeś. Od tego momentu do końca
+      lekcji, w KAŻDEJ czynności, nie tylko w kontrolach checklisty kroku 4:
+      `old_string` w `Edit`, pattern w `grep` i wzorzec we własnym skrypcie
+      kontrolnym kotwicz na fragmencie BEZ jednoliterowego słowa ze spacją
+      (`wideo**`, `Ciebie (`, `^> `). Odbite `old_string` na pliku, który sam
+      przed chwilą zapisałeś, i "0 trafień" na frazie, którą sam przed chwilą
+      napisałeś, to objaw twardej spacji, a nie dowód, że plik zmienił ktoś
+      inny — w obu wypadkach przeczytaj plik, zanim cokolwiek z tego wyniku
+      wywnioskujesz. Reguła obowiązuje także wtedy, gdy przebieg wstawiający
+      puściłeś ręcznie, poza jakąkolwiek komendą `course-pipeline`.
 4. **Samokontrola.** Sprawdź checklistę:
    - artykuł realizuje cel z lekcja.yaml i strukturę z struktura-lekcji.md,
    - artykuł pokrywa całą treść scenariusza; scenariusz jest nadrzędny, więc
@@ -91,9 +105,13 @@ przedstawione Rafałowi do bramki review.
      z treści.** Po wstawieniu twardych spacji `w wideo`, `z inwestycji`
      i `U Ciebie` mają w środku U+00A0, a emoji jako pattern w Git Bash nie
      trafia — oba przypadki dają ciche "0", nie błąd. Kotwicz na fragmencie
-     bez jednoliterowego słowa (`wideo**`, `Ciebie (`, `^> `). "0 trafień"
-     na pliku, który właśnie napisałeś, to błąd wzorca, nie fakt — tak samo
-     odbite `old_string` w `Edit` i licznik z własnego skryptu kontrolnego.
+     bez jednoliterowego słowa (`wideo**`, `Ciebie (`, `^> `). Odwrotna
+     pułapka jest równie cicha: `grep -i` po krótkim akronimie (`API`) trafia
+     w podciągi polskich słów („napisze", „zapisz") — kotwicz na granicy słowa
+     (`\bAPI\b`) albo czytaj trafienia z kontekstem. "0 trafień"
+     i "kilkanaście trafień" na pliku, który właśnie napisałeś, to wynik
+     wzorca, a nie fakt — tak samo odbite `old_string` w `Edit` i licznik
+     z własnego skryptu kontrolnego.
 5. **Walidacja.** Ustaw `status.tresc: do_review` w lekcja.yaml, potem
    `cd tools/course-pipeline && npm run validate --
    ../../kursy/<slug>/modul-NN-x/lekcja-NN-y` (katalog lekcji, nie kursu —
```

## 2026-09-18 — live-demo — zaakceptowana
- **Wzorce:** szkielet-workflowu-pomija-krok-ktorego-nie-da-sie-zapisac
- **Zmiana:** §10 dostaje regułę, że każdy `.json` pod `workflows/` odzwierciedla run of show, a węzeł niezapisywalny w JSON-ie wchodzi jako wyłączona atrapa plus blokująca linia README; §13 dostaje czwarty check (każdy beat scenariusza ma węzeł, inaczej plik odrzucony i `status.demo` zostaje `draft`); w Rules skrót obu.
- **Powód decyzji:** zmiana na wprost sformułowaną prośbę Rafała („wprowadź zasadę, która jednoznacznie będzie mówiła, że generowane JSON-y są odzwierciedleniem realizacji scenariusza") po tym, jak brak bramki zatwierdzenia w szkielecie wyszedł 3 dni przed transmisją; poza ścieżką `evolve-skill`, wpis dopisany ręcznie, żeby rejestr był kompletny.

```diff
diff --git a/.claude/skills/live-demo/SKILL.md b/.claude/skills/live-demo/SKILL.md
index 4cd2fe9..104f500 100644
--- a/.claude/skills/live-demo/SKILL.md
+++ b/.claude/skills/live-demo/SKILL.md
@@ -274,6 +274,22 @@ credentials. Cover, at minimum:
   that were never a real gotowiec until a rehearsal produced a real export).
   This skill never writes workflow JSON itself, in either mode; §13
   confirms an export exists, it never creates one.
+- **Any workflow `.json` under `workflows/` mirrors the run of show, or it
+  does not ship.** This binds every file that lands there by any route —
+  an export, a scaffold written during plan execution, a file pasted in by
+  hand. Every moment the run of show asks the presenter to show or click
+  has a node in the file, named as the scenario names it. A node that
+  cannot be expressed reliably in JSON (an approval step, a human-review
+  connection) is **not** a licence to omit it: it appears in the file as a
+  disabled placeholder node carrying the scenario's own name, and as the
+  first, blocking line of that directory's README — never as a silent gap
+  in a file that otherwise looks finished. State this rule in
+  `workflows/KONWENCJE.md` too, in the event's own terms. The September
+  2026 event paid for it: the approval gate „Pyta Cię na Telegramie" was
+  left out of the scaffold as "cannot be saved reliably in JSON", nobody
+  noticed it was never built, and the hole surfaced three days before the
+  broadcast — with blocks 3, 4 and 5 of the run of show, half the airtime,
+  resting on a button that did not exist.
 
 ## 11. Gate: show, then write
 
@@ -346,7 +362,17 @@ first failure and reporting exactly which one fired:
    keys a real n8n export ever writes there). Either condition refuses the
    file by name and quotes the offending key path.
 
-Only if every `.json` file in `workflows/` clears all three checks does this
+4. **Every beat of the run of show has a node.** When `documents.script`
+   points at a run of show, read it and list every moment it puts on
+   screen: each `[CUE]`, each node the presenter is scripted to show, each
+   button press. Each one must exist in the export, under the name the
+   scenario uses. A beat with no node refuses the file by name, quotes the
+   scenario line as `<file>:<line>` and names what is missing. An export
+   that omits a beat is not "a scaffold to finish by hand" — it is a file
+   that cannot run the demo the script sells, and `status.demo` stays
+   `draft` until it can.
+
+Only if every `.json` file in `workflows/` clears all four checks does this
 section end cleanly. Report to Rafał, plainly: which file(s) were found,
 that they parse, the node names and credential names referenced inside (by
 name only — never print a credential's `id` value or any other field as if
@@ -411,6 +437,11 @@ After any write, in either mode:
   an existing spec goes through `documents.demo` (§3); a newly minted path
   is written back into `documents.demo` in the same write that changes
   `status.demo` (§11).
+- **A workflow `.json` is a faithful implementation of the run of show or it
+  is a defect** (§10, §13 check 4). Whatever wrote it, every scripted beat
+  has a node under the scenario's own name; a step that JSON cannot carry
+  reliably goes in as a disabled placeholder node plus a blocking line in
+  the README, never as a silent omission.
 - **This skill never writes a workflow `.json` file, in either mode.** Only
   Rafał's own export out of n8n, after a rehearsal, produces one. Design
   mode writes `workflows/KONWENCJE.md` and nothing else under `workflows/`;
```
