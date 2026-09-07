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
