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
