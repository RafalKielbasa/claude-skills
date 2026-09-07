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

## 2026-09-07 — code-review-master — zaakceptowana
- **Wzorce:** review-pr-bez-skilla-odtwarzany-za-kazdym-razem (punkt 4 Rozwiązania: „komentarze przy liniach idą tylko przez `POST …/pulls/{n}/reviews` z tablicą `comments` … komentarz spoza diffu cicho przepada", zostawiony „na później" we wpisie wyżej), zmiana-skilla-poza-evolve-skill-bez-sladu (wpis mimo zmiany dyktowanej, nie z `/evolve-skill`)
- **Zmiana:** nowy tryb `send <n> [ids]` — znaleziska ostatniego runu `pr <n>` idą na PR jako jedno review z komentarzami przy liniach. Warunki: tip PR-a równy `target.head` runu, kotwiczenie w hunkach three-dot (znalezisko poza diffem odpada z podaniem id, bo GitHub odrzuca całe review 422), jeden komentarz na lokalizację, rejestr z `redakcja.md` (Baza wiedzy) po angielsku, `REQUEST_CHANGES` przy blokującym / `COMMENT` inaczej / nigdy `APPROVE`, pełny payload pokazany i zgoda przed `gh api … --input`, tylko interaktywnie, bez agentów, bez commita. Do tego wiersz w tabeli Invocation, fraza wyzwalająca w `description`, bullet w „Rules that do not bend" i test sekcji w `test/skill.test.mjs` (RED → GREEN, 168 testów zielonych).
- **Powód decyzji:** zmiana dyktowana wprost przez użytkownika („Dodaj te uwagi jako komentarze po angielsku na github … Chcę żeby to był tryb skilla code review master PR review send"), tekst trybu zaakceptowany po pokazaniu przy bramce („akceptuje zmiany w skill"). Pierwsze użycie w tej samej sesji: PR #164 `saas app`, review 5131590353 (`CHANGES_REQUESTED`, 3 komentarze); `f-01` odpadło na kotwiczeniu jako kod sprzed PR-a — weryfikator dał mu 100, tryb wyłapał.
- **Nawrót:** —

```diff
diff --git a/skills/code-review-master/SKILL.md b/skills/code-review-master/SKILL.md
index ef0f66c..1f68f72 100644
--- a/skills/code-review-master/SKILL.md
+++ b/skills/code-review-master/SKILL.md
@@ -1,6 +1,6 @@
 ---
 name: code-review-master
-description: Use for an automated, multi-agent code review of a repository — triggers like "zrób review", "sprawdź kod", "code review this branch/PR", an explicit `/code-review-master` invocation, and unattended nightly or CI invocations of it — and for checking which remarks of an existing GitHub review on a PR are already addressed ("czy poprawki do PR-a zostały naniesione", "co zostało z review", mode `recheck`). Reviews a bounded set of axes (security, quality, conventions, whatever `.claude/review/config.md` defines) with a subagent budget that is computed and announced before anything is dispatched, then writes a Polish report. NOT for reviewing a course student's homework against a task's acceptance criteria — that is `review-pracy-domowej`. NOT the bundled `/code-review` plugin, which is a different, single-session reviewer with no fixed subagent budget.
+description: Use for an automated, multi-agent code review of a repository — triggers like "zrób review", "sprawdź kod", "code review this branch/PR", an explicit `/code-review-master` invocation, and unattended nightly or CI invocations of it — and for checking which remarks of an existing GitHub review on a PR are already addressed ("czy poprawki do PR-a zostały naniesione", "co zostało z review", mode `recheck`) — and for posting the latest report's findings to the PR as a GitHub review with inline comments ("wyślij uwagi na GitHuba", "dodaj komentarze do PR-a", mode `send`). NOT for reviewing a course student's homework against a task's acceptance criteria — that is `review-pracy-domowej`. NOT the bundled `/code-review` plugin, which is a different, single-session reviewer with no fixed subagent budget.
 ---
 
 # code-review-master
@@ -27,6 +27,7 @@ This skill runs a fixed-axis code review of `<repo>` by dispatching Sonnet agent
 | `/code-review-master full [path]` | The whole tree, or `path` within it, paged across runs by `state.json`'s `file_cursor`. |
 | `/code-review-master ask [path]` | Questions about the latest report (or the run at `path`) and triage verdicts. Dispatches no agents — see "Mode `ask`" below. |
 | `/code-review-master recheck <n> [reviewer]` | Which remarks of an existing GitHub review on PR `<n>` are addressed on the PR's current tip. Dispatches no agents, runs no `crm` — see "Mode `recheck`" below. |
+| `/code-review-master send <n> [ids]` | Posts the latest `pr <n>` run's findings to PR `<n>` as one GitHub review with inline comments. Interactive only, nothing is posted before approval — see "Mode `send`" below. |
 | `/code-review-master fix [ids]` | Applies codex-confirmed fixes from the latest run. Interactive only — see "Mode `fix`" below. |
 | `/code-review-master init` | Drafts `.claude/review/config.md` for a repository that has none — see "Mode `init`" below. |
 
@@ -221,6 +222,20 @@ On success, show the user (in Polish) the path to `raport.md` and the headline c
 5. **Output, in Polish:** a table `uwaga | plik:linia z review | status | dowód na tipie`, blocking remarks first, then one line listing the commits after the baseline (`gh pr view <n> --json commits`) so the user sees what the verdict rests on.
 6. Dispatch no subagents in this mode, ever — the same rule as mode `ask`. Never commit.
 
+## Mode `send`
+
+`/code-review-master send <n> [ids]` posts the findings of the latest `pr` run as one GitHub review on PR `<n>`: one inline comment per finding, on the line the finding cites, plus a short summary body. **Interactive only** — a nightly or CI run never posts to GitHub, for the same reason mode `fix` never edits unattended: a review reaches the PR author the moment it is posted, and there is nobody at the keyboard to have read it first. This mode dispatches no agents and runs no `crm` command beyond `crm latest`.
+
+1. **Run.** `crm latest` (unless the user named a run). The run must be mode `pr` for this same `<n>` — a `branch` or `working` run cites lines of the working tree, not of the PR's head — otherwise say so, in Polish, and stop. Read its `findings.json` (as left by `crm score` and `crm codex`) and `plan.json`. With `[ids]`, keep only those findings.
+2. **Tip check.** `gh pr view <n> --json headRefOid` must equal the run's `target.head`. When the PR has moved on, stop and say a fresh `pr <n>` run is needed: the line numbers in `findings.json` belong to the commit that was reviewed, and GitHub anchors the whole review to one `commit_id`.
+3. **Diff anchoring.** GitHub accepts an inline comment only on a line that is part of the diff, and one comment outside it fails the whole review with 422. Compute the PR's hunks the way GitHub does — three-dot, `git diff -U0 $(git merge-base <base> <head>) <head> -- <path>` with the SHAs from `plan.json` — and keep only findings whose `lines` fall inside a `+` hunk of their file. A finding outside the hunks is a pre-existing issue that wave 2 let through: list it to the user as dropped, with its id and why, and do not move it into the summary body instead.
+4. **One comment per location.** Findings that share `file` and `lines` — two axes citing the same query — become one comment carrying both points. Each comment carries `path`, `line` (the last cited line), `side: RIGHT`, and `start_line` with `start_side: RIGHT` when the span is longer than one line.
+5. **Text, in English.** The register is the one `redakcja.md` in `Baza wiedzy` enforces on course text, applied to a review comment. Each comment opens with `Blocking:`, `Suggestion:` or `Nitpick:` and runs two to four sentences: what the line does, the rule it breaks and where that rule lives, the fix. The actor is named; no filler openers ("it's worth noting"), no evaluative adjectives, no triads, no hedging where the finding is certain, no emoji, no exclamation marks, straight quotes, a spaced hyphen where a dash would go. `codex.fix` is the fix's raw material, never its wording. The summary body is short and courteous — what the review covers, how many points block the merge, one sentence on what makes it mergeable — and does not recap the comments.
+6. **Event.** `REQUEST_CHANGES` when any posted comment is `blocking`, `COMMENT` otherwise. **Never `APPROVE`** from this mode: approval is the user's judgment after reading the whole PR, not something a five-axis review earns.
+7. **Show, then wait.** Print the complete payload — every comment with its `path:line`, the body, the event, and the findings dropped in step 3 — and **wait for approval**. Nothing is posted before it. Apply the user's edits to the text and show it again; approval covers the text that was shown, not a later version of it.
+8. **Post.** Write the payload to a file in the session's scratch directory and run `gh api repos/{owner}/{repo}/pulls/<n>/reviews --input <file>` with `commit_id` set to the run's `target.head`. Show the review's `html_url`. A 422 means step 3 missed a line: report it verbatim and stop; never retry by dropping comments silently.
+9. Dispatch no subagents in this mode, ever — the same rule as mode `ask`. Never commit.
+
 ## Mode `fix`
 
 `/code-review-master fix [ids]` implements the findings codex confirmed in the latest run. **Interactive only.** In a non-interactive run — nightly, CI, any invocation with no one at the keyboard to answer a prompt — refuse before touching anything and say why, in Polish: a scheduled or CI run that edits code unattended is a different product with a different risk profile. This is not left to your discretion — `crm fixable` itself exits 2 without `--interactive`, so the flow cannot start unattended even if this section were ignored. Pass `--interactive` on every `crm fixable` call this mode makes, because only a person typing this command themselves in an interactive session can have reached this section at all; the wrapper scripts never pass it, and a bare `crm fixable` without the flag is refused for exactly that reason.
@@ -242,3 +257,4 @@ On success, show the user (in Polish) the path to `raport.md` and the headline c
 - Verification is one agent per axis, never one agent per finding.
 - A non-interactive run never applies a fix and never raises the budget with `--slots`.
 - A finding without evidence found verbatim in the file is discarded by `crm assemble` before anyone reads it, never reported on the strength of its wording alone.
+- Nothing reaches GitHub before the user has read the exact text: mode `send` shows the full payload and waits, and it never runs unattended.
diff --git a/skills/code-review-master/test/skill.test.mjs b/skills/code-review-master/test/skill.test.mjs
index 5374ae3..7e1f70e 100644
--- a/skills/code-review-master/test/skill.test.mjs
+++ b/skills/code-review-master/test/skill.test.mjs
@@ -12,11 +12,30 @@ test('frontmatter names the skill and its triggers', () => {
 });
 
 test('every mode from the spec is documented', () => {
-  for (const mode of ['branch', 'pr', 'since', 'full', 'ask', 'fix', 'init']) {
+  for (const mode of ['branch', 'pr', 'since', 'full', 'ask', 'recheck', 'fix', 'init', 'send']) {
     assert.match(TEXT, new RegExp(`/code-review-master ${mode}`), `mode ${mode} is missing`);
   }
 });
 
+// `send` is the only mode that writes outside the working tree: a GitHub review
+// is visible to the PR author the moment it is posted. The section must gate on
+// approval, refuse unattended runs, and anchor every inline comment to a diff
+// line, or GitHub rejects the whole review with 422.
+test('send mode posts nothing before approval and anchors comments to the diff', () => {
+  const at = TEXT.indexOf('## Mode `send`');
+  const fixAt = TEXT.indexOf('## Mode `fix`');
+  assert.ok(at > 0, 'Mode send heading is missing');
+  assert.ok(fixAt > at, 'Mode send must be documented before Mode fix');
+  const section = TEXT.slice(at, fixAt);
+  assert.match(section, /wait for approval/i);
+  assert.match(section, /interactive only/i);
+  assert.match(section, /part of the diff/i);
+  assert.match(section, /REQUEST_CHANGES/);
+  assert.match(section, /never `?APPROVE`?/i);
+  assert.match(section, /dispatch no subagents/i);
+  assert.match(section, /never commit/i);
+});
+
 test('the main model is checked at entry but never blocks the run', () => {
   assert.match(TEXT, /Haiku or Sonnet/);
   assert.match(TEXT, /Never refuse over it/i);
```

## 2026-09-07 — podsumuj-sesja-claude — zaakceptowana (evolve-skill)
- **Wzorce:** plik-zmieniony-miedzy-odczytem-a-edycja
- **Zmiana:** Krok 4 dostał regułę: wpis do dziennika wstawiasz po ponownym odczycie tuż przed zapisem, jedną operacją z asercją stanu wejściowego (nagłówek dziennika w linii z tego odczytu, liczba linii pliku, brak własnego wpisu); padnięta asercja oznacza ponowny odczyt i wstawienie punktowe, nigdy z pamięci ani przez przepisanie pliku w całości. Do tabeli „Częste błędy" doszedł wiersz o wstawianiu z adresów zebranych na starcie podsumowania.
- **Powód decyzji:** akceptacja użytkownika („Akceptuję") po propozycji z `/evolve-skill` (sesja session_01BFVYzhLh64ykBPjopBZyHU). Wzorzec ma 5 dowodów z 4 sesji; trzy z nich padły w `praca-z-claude.md` w Kroku 4 (2026-09-03 w dwóch sesjach, 2026-09-06/07). Wcześniejsza zmiana z 2026-09-07 zaadresowała ten sam wzorzec tylko po stronie wiki (Krok 5.8, `index.md`); ta domyka dziennik. Zostawione na później: `windows-path-w-literale-skryptu` (treść wpisu przez narzędzie Write albo osobny plik zamiast literału w skrypcie) — dotyczy tych samych kroków 4 i 5.8.

```diff
--- a/skills/podsumuj-sesja-claude/SKILL.md
+++ b/skills/podsumuj-sesja-claude/SKILL.md
@@ ## Krok 4 — dopisz na GÓRZE pliku @@
 - Jeśli plik pusty/nie istnieje: załóż go z nagłówkiem `# Praca z Claude — dziennik sesji`, potem wpis.
 - **Dopisuj, nie nadpisuj** — starych wpisów nie kasujesz.
+- **Wstawiaj po świeżym odczycie, jedną operacją z asercją wejścia.** Dziennik
+  dzielisz z Obsidianem i z innymi sesjami Claude, a między odczytem na starcie
+  podsumowania a zapisem mija runda pytań — adresy z tamtego odczytu są wtedy
+  nieaktualne. Bezpośrednio przed zapisem przeczytaj plik ponownie i wstaw wpis
+  jedną operacją, która sprawdza stan wejściowy (nagłówek dziennika w linii
+  z tego odczytu, liczba linii pliku, brak Twojego wpisu) i zatrzymuje zapis,
+  gdy coś się nie zgadza. Padnięta asercja znaczy, że plik zmienił ktoś inny:
+  czytasz jeszcze raz i wstawiasz punktowo pod nagłówkiem — nigdy z pamięci
+  i nigdy przez przepisanie pliku w całości.
 - Po zapisie podaj partnerowi ścieżkę i 1-zdaniowe potwierdzenie.
@@ ## Częste błędy @@
 | `index.md` przepisany w całości, gdy w wiki pisze druga sesja | Krok 5.8 — aktualizacja punktowa, cudze wpisy zostają |
+| Wpis wstawiony z adresów zebranych na starcie podsumowania | Krok 4 — świeży odczyt tuż przed zapisem i asercja wejścia; padnięta asercja = czytaj ponownie |
 | Wzorzec opisujący objaw („Claude się pomylił") | Przyczyna źródłowa: dlaczego to się stało i co to powtórzy |
```
