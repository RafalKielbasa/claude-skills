# Wiki — rejestr zmian skilli (globalne)

Ślad każdej próby zmiany skilla: zaakceptowanej i odrzuconej. Skill
`evolve-skill` czyta ten plik przed propozycją i nie wolno mu powtórzyć
propozycji już odrzuconej. Pełny diff zostaje także przy odrzuceniu — to
jedyny sposób, żeby rozpoznać powtórkę.

Format wpisu:

    ## YYYY-MM-DD — <skill> — zaakceptowana | odrzucona
    - **Wzorce:** <nazwy stron wiki>
    - **Zmiana:** <streszczenie w 1–3 zdaniach>
    - **Powód decyzji:** <przy odrzuceniu: powód użytkownika>
    - **Nawrót:** YYYY-MM-DD, <wzorzec>
    (pod spodem blok diff z pełnym diffem SKILL.md)

## Wpisy

## 2026-09-03 — podsumuj-sesja-claude — zaakceptowana
- **Wzorce:** instrukcja-zakotwiczona-na-pozycji-nie-na-naglowku
- **Zmiana:** Krok 4 dostał punkt precyzujący, że „góra pliku" znaczy „pod nagłówkiem `# Praca z Claude — dziennik sesji`", a sekcje leżące nad tym nagłówkiem zostają nietknięte. Powód: w `praca-z-claude.md` stanęła nad dziennikiem sekcja `# Pomysły` z tabelą, a dotychczasowe brzmienie pozwalało wstawić brief przed nią.
- **Powód decyzji:** zmiana wprowadzona wprost na prośbę użytkownika („tak, dopisz to zdanie do skilla"), poza ścieżką `evolve-skill`; wpis dopisany ręcznie, żeby rejestr pozostał kompletny.

```diff
--- SKILL.md (przed)
+++ SKILL.md (po)
@@ ## Krok 4 — dopisz na GÓRZE pliku @@
 - Nowy wpis idzie **nad** poprzednie (odwrotnie chronologicznie) — rano partner widzi najnowszy pierwszy.
+- „Góra pliku" znaczy **pod nagłówkiem `# Praca z Claude — dziennik sesji`**, nie na fizycznym początku pliku. Nad tym nagłówkiem mogą leżeć inne sekcje (np. tabela pomysłów) — nie ruszasz ich i nie wstawiasz wpisu przed nimi.
 - Jeśli plik pusty/nie istnieje: załóż go z nagłówkiem `# Praca z Claude — dziennik sesji`, potem wpis.
 - **Dopisuj, nie nadpisuj** — starych wpisów nie kasujesz.
 - Po zapisie podaj partnerowi ścieżkę i 1-zdaniowe potwierdzenie.
```

## 2026-09-07 — podsumuj-sesja-claude — zaakceptowana

- **Wzorce:** `plik-zmieniony-miedzy-odczytem-a-edycja` (dotyczy tylko drugiej ze zmian; pierwsza jest bezpośrednią prośbą użytkownika, nie wynika z wzorca)
- **Zmiana:** Krok 5.7 przestaje być bramką zgody. Było „Pokaż podgląd i poczekaj / Nic nie zapisujesz przed zgodą"; jest „Zapisz i wypisz, co zapisałeś" — zapis od razu, lista zmian po fakcie, o tej samej treści co dawny podgląd. Osobno krok 5.8 dostał wyjątek od „`index.md` przepisz w całości": gdy w tym samym wiki pisze równolegle druga sesja, aktualizacja ma być punktowa, bo przepisanie skasuje cudze wpisy.
- **Powód decyzji:** Pierwsza zmiana — bezpośrednia prośba użytkownika („Chcę zmienić zasadę wpisu do wiki, nie potrzebujesz mojej zgody żeby ją uzupełnić"), po sesji, w której bramka kosztowała pełną turę i nie zmieniła ani jednego wpisu. Druga zmiana — moja, na dowodzie z tej samej sesji: równolegle pracowała druga sesja Claude'a (`session_01T6FrJW1rs56KS6EsPB5agM`) nad Planem B tego samego projektu i pisała do tego samego `~/.claude/wiki/`; wykonanie kroku 5.8 dosłownie skasowałoby jej wpisy w `index.md`. Zapisane tutaj, a nie przez `evolve-skill`, zgodnie z rozwiązaniem wzorca `zmiana-skilla-poza-evolve-skill-bez-sladu`.

```diff
diff --git a/skills/podsumuj-sesja-claude/SKILL.md b/skills/podsumuj-sesja-claude/SKILL.md
index b1d652e..434b518 100644
--- a/skills/podsumuj-sesja-claude/SKILL.md
+++ b/skills/podsumuj-sesja-claude/SKILL.md
@@ -142,21 +142,35 @@ tego, w którym wiki leży sam wzorzec (reguła kierowania zapisu, Krok 5 skilla
 `evolve-skill`). Nawrót jest jedyną miarą skuteczności zmiany skilla, jaką
 mamy — nie pomijaj go.
 
-### 5.7 Pokaż podgląd i poczekaj
+### 5.7 Zapisz i wypisz, co zapisałeś
 
-Wypisz użytkownikowi listę w formie:
+**Zapisujesz od razu, bez pytania o zgodę.** Podgląd przed zapisem był bramką,
+która kosztowała turę i niczego nie chroniła: wiki leży w gicie, każdy wpis da
+się poprawić albo skasować, a użytkownik i tak czyta listę zmian — tyle że po
+fakcie zamiast przed.
 
-- `załóż: <nazwa> (skill: X, typ: porażka|sukces) — <jedno zdanie>`
-- `dopisz dowód: <nazwa> — <jedno zdanie>`
+Po zapisie wypisz, co powstało:
+
+- `założono: <nazwa> (skill: X, typ: porażka|sukces) — <jedno zdanie>`
+- `dopisano dowód: <nazwa> — <jedno zdanie>`
 - `nawrót: <nazwa> — zaadresowany <data>, wraca`
 
-**Nic nie zapisujesz przed zgodą.** Brak odpowiedzi nie jest zgodą.
+Lista po fakcie ma tę samą treść co podgląd, zmienia się tylko moment. Gdy
+obserwacja wydaje Ci się wątpliwa, zapisz ją i powiedz w jednym zdaniu, że jest
+wątpliwa — decyzję o skasowaniu podejmie użytkownik, patrząc na gotowy wpis, a
+nie na jego opis.
 
 ### 5.8 Zapisz
 
 - Nowe strony wzorców w całości wg szablonu poniżej; istniejące — dopisz dowód
   do sekcji „Dowody", resztę popraw punktowo, nie przepisuj strony od zera.
-- `index.md` przepisz w całości, z aktualnym statusem i liczbą dowodów.
+- `index.md` przepisz w całości, z aktualnym statusem i liczbą dowodów —
+  **chyba że w tym samym wiki pisze równolegle druga sesja.** Wtedy aktualizuj
+  punktowo: dopisz swoje linie i popraw liczniki dowodów, bo przepisanie
+  w całości skasuje jej wpisy. Rozpoznasz to po tym, że plik zmienił się między
+  Twoim odczytem a zapisem albo że `Edit` odmówił z powodu nieaktualnego
+  odczytu — potraktuj odmowę jak asercję wejścia, przeczytaj ponownie i pisz
+  punktowo.
 - Dopisz wpis na końcu `log.md` (repo i globalnego, każdy o swoich wzorcach).
 - Dopisz ewentualne linie „Nawrót" w `skill-impact.md`.
 
@@ -213,6 +227,7 @@ nie dotknęła. Log ma być kompletny.
 | Długa narracja przebiegu dnia | TL;DR + „następny krok" |
 | Brak sekcji „następny krok" | To rdzeń briefu — zawsze ją wypełnij |
 | Zgadywanie ścieżki pliku | Marker w `CLAUDE.md` (Krok 1) |
-| Zapis do wiki bez pokazania podglądu | Krok 5.7 — lista zmian, potem zgoda |
+| Wstrzymanie zapisu do wiki w oczekiwaniu na zgodę | Krok 5.7 — zapisz, potem wypisz listę zmian |
+| `index.md` przepisany w całości, gdy w wiki pisze druga sesja | Krok 5.8 — aktualizacja punktowa, cudze wpisy zostają |
 | Wzorzec opisujący objaw („Claude się pomylił") | Przyczyna źródłowa: dlaczego to się stało i co to powtórzy |
 | Nowa strona wzorca dla obserwacji, która pasuje do istniejącej | Dowód na istniejącej stronie; duplikat rozprasza dowody |
```

## 2026-09-07 — code-review-master — zaakceptowana

- **Wzorce:** review-pr-bez-skilla-odtwarzany-za-kazdym-razem
- **Zmiana:** Nowy tryb `recheck <n> [reviewer]` — sprawdza, które uwagi istniejącego review na GitHubie są naniesione na bieżącym tipie PR-a: bazą jest `reviews[].commit.oid`, uwagi z `pulls/<n>/comments`, kod czytany przez `git show origin/<branch>:<path>` bez checkoutu, werdykt z kodu z jawnym ignorowaniem `isResolved`, tabela po polsku; bez agentów i bez `crm`. Do tego wiersz w tabeli Invocation i fraza wyzwalająca w `description`.
- **Powód decyzji:** akceptacja użytkownika („akceptuje") po propozycji z `/evolve-skill`; pierwsza ewolucja tego skilla, `skill-impact.md` nie miał wcześniej wpisu. Zastrzeżenie z propozycji: punkt 5 Rozwiązania wzorca (tryb re-review) ma jeden dowód (sesja session_01YYxVxgP1QYqdEoh63ozDfs, 2026-09-07), sam wzorzec trzy; punkty 2 i 4 Rozwiązania (sprawdzenia z liczbami przed pierwszym ustaleniem, publikacja komentarzy na PR) zostawione na później.

```diff
--- a/skills/code-review-master/SKILL.md
+++ b/skills/code-review-master/SKILL.md
@@ frontmatter @@
-description: Use for an automated, multi-agent code review of a repository — triggers like "zrób review", "sprawdź kod", "code review this branch/PR", an explicit `/code-review-master` invocation, and unattended nightly or CI invocations of it. Reviews a bounded set of axes (security, quality, conventions, whatever `.claude/review/config.md` defines) with a subagent budget that is computed and announced before anything is dispatched, then writes a Polish report. NOT for reviewing a course student's homework against a task's acceptance criteria — that is `review-pracy-domowej`. NOT the bundled `/code-review` plugin, which is a different, single-session reviewer with no fixed subagent budget.
+description: Use for an automated, multi-agent code review of a repository — triggers like "zrób review", "sprawdź kod", "code review this branch/PR", an explicit `/code-review-master` invocation, and unattended nightly or CI invocations of it — and for checking which remarks of an existing GitHub review on a PR are already addressed ("czy poprawki do PR-a zostały naniesione", "co zostało z review", mode `recheck`). Reviews a bounded set of axes (security, quality, conventions, whatever `.claude/review/config.md` defines) with a subagent budget that is computed and announced before anything is dispatched, then writes a Polish report. NOT for reviewing a course student's homework against a task's acceptance criteria — that is `review-pracy-domowej`. NOT the bundled `/code-review` plugin, which is a different, single-session reviewer with no fixed subagent budget.
@@ ## Invocation @@
 | `/code-review-master ask [path]` | Questions about the latest report (or the run at `path`) and triage verdicts. Dispatches no agents — see "Mode `ask`" below. |
+| `/code-review-master recheck <n> [reviewer]` | Which remarks of an existing GitHub review on PR `<n>` are addressed on the PR's current tip. Dispatches no agents, runs no `crm` — see "Mode `recheck`" below. |
 | `/code-review-master fix [ids]` | Applies codex-confirmed fixes from the latest run. Interactive only — see "Mode `fix`" below. |
@@ after ## Mode `ask`, before ## Mode `fix` @@
+## Mode `recheck`
+
+`/code-review-master recheck <n> [reviewer]` answers one question about PR `<n>`: which remarks of an existing GitHub review are addressed on the PR's current tip, and which are not. It reads the review from GitHub and the code from `origin`; it dispatches no agents, runs no `crm` command, and never checks the branch out.
+
+1. **Baseline.** `gh pr view <n> --json headRefName,reviews`. Take the review by `reviewer` (default: the user's own login from `gh api user --jq .login`) with the latest `submittedAt`; its `commit.oid` is the SHA the review was written against. No such review → say so, in Polish, and stop.
+2. **Remarks.** `gh api repos/{owner}/{repo}/pulls/<n>/comments --paginate`, filtered to that reviewer: one row per comment, keyed by `path` + `original_line`. Remarks that live only in the review's summary body (step 1) get a row without a line.
+3. **Code.** `git fetch origin <headRefName>`, then `git diff <oid>..origin/<headRefName> --stat` to see which files moved at all, and read every file a remark names with `git show origin/<headRefName>:<path>`. **Never `git checkout`** — the branch is the working tree's, not this mode's, and a checkout swaps files under the user's session.
+4. **Verdict per remark, from the code, never from GitHub:** `naniesiona` with the `plik:linia` on the tip that shows it; `nie naniesiona` with the line that still shows the old behaviour; `nieaktualna` when the code the remark named no longer exists. **Ignore `isResolved` on review threads** — authors push fixes without resolving threads, so thread state says nothing about the code (PR #165, 2026-09-07: 19 of 19 threads unresolved while 5 of 6 blocking remarks were fixed).
+5. **Output, in Polish:** a table `uwaga | plik:linia z review | status | dowód na tipie`, blocking remarks first, then one line listing the commits after the baseline (`gh pr view <n> --json commits`) so the user sees what the verdict rests on.
+6. Dispatch no subagents in this mode, ever — the same rule as mode `ask`. Never commit.
+
```
