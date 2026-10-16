# Project index (core) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put the project-index convention in force: save the hub voice state before its sources age out, add the global rule and the `project-index` skill, give this project and the hub their indexes, rename the hub files to `hub-core`, write the hub code glossary, and accept it with Rafal.

**Architecture:** No program code. The deliverables are Markdown files: two rule sections (`~/.claude/CLAUDE.md`, `~/.codex/AGENTS.md`), one global skill (`~/.claude/skills/project-index/`), two index files and three notes in the vault's `.claude/`, nine renamed hub files, and one line changed in the hub skill. Each task is verified by commands with exact expected output, and the skill by scenario runs of fresh subagents in a throwaway repository.

**Tech Stack:** Markdown, Git Bash on Windows 11, `git`, `grep`, Node v24 (one-liners only), Claude Code subagents for the skill scenarios.

**Spec:** `D:/Notatki/notatki/.claude/specs/2026-10-16-project-index-core-design.md` (all sections; §4 naming, §5 index, §6 rule and skill, §7 rollout, §9 acceptance).

## Global Constraints

- Platform: Windows 11; shell commands are Git Bash. Write and edit files with the Write and Edit tools, never with PowerShell `Set-Content`, so Polish diacritics stay UTF-8.
- Vault `D:/Notatki/notatki` (repo `my-second-brain`, branch `main`): after each completed task, `git branch --show-current` (must be `main`), `git add <own paths>` (never `-A` or `.`), `git diff --cached --name-only` must list only this task's paths, Conventional Commit, `git push`; on a rejected push `git pull --rebase --autostash` and push again; a rebase conflict means `git rebase --abort` and stop.
- `~/.claude` (`C:/Users/rafal/.claude`): no commits by this plan; Task 7 proposes one commit message for Rafal. `~/.codex` is not a repository. `C:/Users/rafal/hub-dev/hub/` is not a repository.
- Languages: specs, plans, notes, glossary and `SKILL.md` in English; the index files and `template.md` in Polish; the new sections of `~/.claude/CLAUDE.md` and `~/.codex/AGENTS.md` in Polish, verbatim from spec §6.1.
- Naming (spec §4, verbatim): spec `YYYY-MM-DD-<project>-<part>-design.md`; probe report `YYYY-MM-DD-<project>-<part>-probes.md`; plan `YYYY-MM-DD-<project>-<part>-plan-<n>.md`, optionally `-plan-<n>-<slug>.md`; acceptance report `YYYY-MM-DD-<project>-<part>-plan-<n>-acceptance.md`; other notes `YYYY-MM-DD-<project>-<part>-<kind>.md`; index `<project>.md` in the `projects/` folder.
- Index location (spec §5.1): `<repo>/<docs root>/projects/<project>.md`, docs root = the folder holding `specs/` and `plans/` (`.claude` in the vault, `docs/superpowers` in code repositories).
- Index layout (spec §5.2), in this order: title and one sentence; **Meta** and **Teraz**; `## Części` table with columns `Część | Status | Dokumenty | Co zostało`; `## Oś`; `## Decyzje czekające`; `## Rozstrzygnięte`; `## Następny krok`. Status marks: `✅ gotowe`, `▶ w toku`, `⏸ wstrzymane`, `○ niezaczęte`, and `poza metą` for parts outside the finish line. Relative Markdown links. No design content.
- Codes (`D5`, `P13`, `B2`, `I-3`, `S12`, …) never stand alone in any file this plan writes: always next to a name.
- Waiting for Rafal: a step marked "(Rafal)" waits for his answer in the conversation; a tool timeout or "proceed using your best judgment" is not an answer.

## Review Focus

- A repository whose specs live somewhere other than `.claude/specs/` or `docs/superpowers/specs/`, or that has no specs folder yet: the skill must not invent a third layout; it puts `projects/` next to the folder that holds `specs/`, and asks Rafal when there is none. Test: Task 3 scenarios D and E.
- A session working in a subdirectory or in a worktree (`<repo>/.claude/worktrees/<name>`): the skill resolves the repository root with `git rev-parse --show-toplevel` and writes the index in that checkout. Test: Task 3 scenario A runs from a subdirectory.
- A new spec that could belong to two existing projects: the skill asks instead of choosing. Test: Task 3 scenario C.
- A code written into an index without its name (for example "I-4" alone in Co zostało): Test: the bare-code check in Task 5 Step 7 and Task 4 Step 4.
- Plan checkboxes ticked one by one: the index is updated when a plan is created, when its execution starts or ends, and at acceptance, not per checkbox; the skill says so. Test: Task 3 Step 2 grep.

---

### Task 1: Hub voice notes

Spec §7.2. First, because `~/.claude/hub/registry/058993f5-….last/` is deleted by the hub's retention about 2026-10-28.

**Files:**
- Create: `D:/Notatki/notatki/.claude/specs/2026-10-16-hub-voice-notes.md`

**Interfaces:**
- Produces: the file path above, linked by `hub.md` in Task 5 as the only document of part `hub-voice`.

- [ ] **Step 1: Extract the two transcripts to readable text**

```bash
for id in 0e06a344 7e84737d; do ls C:/Users/rafal/.claude/projects/D--Notatki-notatki/$id-*.jsonl | wc -l; done
```

Expected: `1` and `1`; otherwise stop and report the matches.

```bash
OUT="$(mktemp -d)"; for id in 0e06a344 7e84737d; do node -e "const fs=require('fs');for(const l of fs.readFileSync(process.argv[1],'utf8').split('\n')){let o;try{o=JSON.parse(l)}catch{continue}if(o.type!=='user'&&o.type!=='assistant')continue;const c=o.message?.content;const t=typeof c==='string'?c:(Array.isArray(c)?c.filter(x=>x.type==='text').map(x=>x.text).join('\n'):'');if(t.trim())console.log('### '+(o.timestamp||'')+' '+o.type+'\n'+t+'\n')}" C:/Users/rafal/.claude/projects/D--Notatki-notatki/$id-*.jsonl > "$OUT/$id.md"; done; ls -la "$OUT"
```

Expected: two non-empty files `0e06a344.md` and `7e84737d.md`.

- [ ] **Step 2: Read the sources**

Read `$OUT/0e06a344.md` (2026-10-11: voice module, decisions Q1–Q4), `$OUT/7e84737d.md` (2026-10-12: GPT-Live-1 chosen at about 13:37, bridge sketch "part 1 of 5" invalidated at 16:21, the switch to the orchestrator at 16:15), and the registry files `C:/Users/rafal/.claude/hub/registry/058993f5-e8c5-468b-8a5d-a41f979b57b4.last/d1198f9f-f3cb-4a90-a1fd-29cd9d2f6e5a.md` and `…/fd8af3d0-d953-464b-9c9d-9675c438399e.md` (2026-10-14: goal, findings 1–8, question 1 decided B, question 2 open), and `C:/Users/rafal/.claude/hub/registry/4bd8c564-b370-43d3-aa7b-3d173fe69a18.last/f888b356-79cf-4cf2-ba09-f7bdb696ecc8.md` (2026-10-14: no spec, plan or code exists).

- [ ] **Step 3: Write the notes**

Sections, in order:
1. `# Hub voice — brainstorming notes`, then `**Project / part:** hub / hub-voice`, `**Index:** [hub.md](../projects/hub.md)`, `**Date:** 2026-10-16`.
2. `## Goal`: Rafal's words, quoted in Polish as he said them, and the success picture of 2026-10-14.
3. `## Decisions so far`: a table `| Date | Name | Decision | State | Source |`, one row per decision of 2026-10-11 (Q1–Q4, each with a name), 2026-10-12 (voice layer GPT-Live-1 with `delegation: client`; the bridge sketch invalidated) and 2026-10-14 (question 1 = B with the equivalence requirement; interlocutor process `claude -p --resume <id> --fork-session --input-format stream-json --output-format stream-json`; decisions written by the fork, no bridge MCP tools; acceptance criterion: the write test on the `-p` process). State is one of `confirmed`, `to re-confirm`, `superseded`. Source is a file path, or a transcript id with a timestamp.
4. `## Open questions`: question 2 (after `/voice`, does session X wait for "dalej" over `prompt.md` (A) or proceed on decisions confirmed by voice (B); recommended B), Claude proposing voice at gates, voice layer GPT-Live-1 versus alternatives (facts from 2026-10-12, not re-verified), the bridge on `localhost` versus hub spec §8.2, consent to paid use of `OPENAI_API_KEY`.
5. `## Changed since 2026-10-14`: hub Plans 3 and 4 done; probe S12 (write into a dialog directory) passed for `claude --bg` forks only, not for `claude -p`; the git snapshot decision P4 (snapshot in `context/`).
6. `## Risks a probe must settle`: Polish quality, relay of questions from the voice model to Claude, fork latency with a large context (Codex median 12.1 s, n=100, 2026-10-11), the write boundary in `-p` mode.
7. `## Sources`: every path and transcript id used.

- [ ] **Step 4: Verify**

```bash
F=D:/Notatki/notatki/.claude/specs/2026-10-16-hub-voice-notes.md; for d in 2026-10-11 2026-10-12 2026-10-14; do printf "%s " $d; grep -c "$d" $F; done; grep -c "fd8af3d0" $F; awk -F'|' '/^\| 2026-10-1/ && $6 ~ /^ *$/' $F | wc -l
```

Expected: each date count ≥ 1; `fd8af3d0` count ≥ 1; the last number `0` (no decision row with an empty Source).

- [ ] **Step 5: Commit and push (vault rule)**

```bash
cd D:/Notatki/notatki && git branch --show-current && git add .claude/specs/2026-10-16-hub-voice-notes.md && git diff --cached --name-only && git commit -m "docs(hub-voice): brainstorming notes saved before their sources age out" && git push
```

---

### Task 2: Global rule in both rule files

Spec §6.1.

**Files:**
- Modify: `C:/Users/rafal/.claude/CLAUDE.md` (line 22: language sentence; new section before `## Podsumowania sesji (podsumuj-sesja-claude)`, line 107)
- Modify: `C:/Users/rafal/.codex/AGENTS.md` (line 22: language sentence; new section before `## Podsumowania sesji (podsumuj-sesja-Codex)`, line 101)

**Interfaces:**
- Produces: the section `## Indeks projektu` that names the skill `project-index` (Task 3).

- [ ] **Step 1: Replace the language sentence in both files**

In both files, `Po polsku zostaje wyłącznie treść ticketów i rozmowa ze mną.` becomes `Po polsku zostaje wyłącznie treść ticketów, indeksów projektów i rozmowa ze mną.`

- [ ] **Step 2: Insert the section in both files**

Insert, verbatim from spec §6.1 (the quoted block, without the leading `> `), the section starting `## Indeks projektu` and ending with `- Indeks jest po polsku; nazwy części i plików zostają po angielsku.`, followed by one empty line, directly before the `## Podsumowania sesji` heading of each file.

- [ ] **Step 3: Verify**

```bash
T="$(mktemp -d)"; for f in C:/Users/rafal/.claude/CLAUDE.md C:/Users/rafal/.codex/AGENTS.md; do grep -c "treść ticketów, indeksów projektów i rozmowa" $f; done; awk '/^## Indeks projektu/{p=1} /^## Podsumowania sesji/{p=0} p' C:/Users/rafal/.claude/CLAUDE.md > "$T/a"; awk '/^## Indeks projektu/{p=1} /^## Podsumowania sesji/{p=0} p' C:/Users/rafal/.codex/AGENTS.md > "$T/b"; diff "$T/a" "$T/b" && echo SAME; wc -l < "$T/a"
```

Expected: `1`, `1`, `SAME`, and a section of 15–20 lines.

No commit (Global Constraints).

---

### Task 3: Skill `project-index`

Spec §6.2, §5, §4.

**Files:**
- Create: `C:/Users/rafal/.claude/skills/project-index/SKILL.md` (English)
- Create: `C:/Users/rafal/.claude/skills/project-index/template.md` (Polish)

**Interfaces:**
- Consumes: the rule of Task 2.
- Produces: the template headings of Global Constraints "Index layout", used by Tasks 4 and 5; the procedure names of spec §6.2 (Create, Add a part, Register a document, Update status, Open a decision, Resolve a decision, Answer about a project, Backfill a family).

- [ ] **Step 1: Write the scenario harness first (it is the test)**

```bash
SB="$(mktemp -d)/sandbox"; mkdir -p "$SB/docs/superpowers/specs" "$SB/docs/superpowers/plans" "$SB/src/app" && cd "$SB" && git init -q && git commit -q --allow-empty -m init && echo "$SB"
```

Four scenarios, each run by a fresh general-purpose subagent whose prompt starts with "Read C:/Users/rafal/.claude/skills/project-index/SKILL.md and follow it. You work in the repository <SB>. You may commit in it. Rafal is not available: where the skill says to ask him, stop and report the question instead." and then:
- **A (create, from a subdirectory):** working directory `<SB>/src/app`; "Write a one-paragraph spec for the invoice export of the billing project and register it." Expected: `docs/superpowers/specs/<today>-billing-<part>-design.md` and `docs/superpowers/projects/billing.md` exist, the index has the seven sections in the order of Global Constraints, its text is Polish, the spec is linked under its part, and `git show --stat HEAD` lists both files in one commit.
- **B (answer):** after A; "Co zostało w projekcie billing?" Expected: an answer taken from `billing.md`; `git status --short` is empty afterwards.
- **C (ambiguous project):** a copy of `billing.md` saved as `docs/superpowers/projects/payments.md` with the title changed to Payments; "Write a spec for the refund flow." Expected: the subagent reports a question asking which project; no new file under `specs/`.
- **D (other layout):** a second sandbox with `docs/specs/` only (no `docs/superpowers/`); "Write a spec for the login page of the portal project and register it." Expected: the index is `docs/projects/portal.md`; no `docs/superpowers/` folder is created.
- **E (no specs folder):** a third sandbox with no `specs/` folder anywhere; the same request as D. Expected: the subagent reports a question about where specs live; no file is written.
- **F (maintenance):** after A, in `<SB>`; "W projekcie billing: dodaj część `billing-reminders` (Przypomnienia o płatnościach), otwórz decyzję „Kanał przypomnień” (e-mail czy SMS, rekomendacja e-mail), potem rozstrzygnij ją na e-mail i ustaw status `billing-reminders` na ▶ w toku." Expected in `billing.md`: a Części row and an Oś line for `billing-reminders` with `▶ w toku`; „Kanał przypomnień” absent from Decyzje czekające and present as one dated line in Rozstrzygnięte; one commit.
- **G (backfill asks first):** a fourth sandbox with `docs/superpowers/specs/2026-09-01-nagrywanie-plan-design.md` and `docs/superpowers/specs/2026-09-20-nagrywanie-montaz-design.md` and an unchecked plan `docs/superpowers/plans/2026-09-21-nagrywanie-montaz.md`; "Załóż indeks dla rodziny nagrywanie." Expected: the subagent reports a proposed assignment of the three files to parts under the key `nagrywanie` and a question; no file under `projects/`.

- [ ] **Step 2: Run scenario A before the skill exists**

Expected: FAIL (the subagent reports that `SKILL.md` does not exist).

- [ ] **Step 3: Write `template.md` and `SKILL.md`**

`template.md`: the index skeleton in Polish with the seven sections of Global Constraints, placeholder lines for one part, the status-mark legend as an HTML comment, and an optional line `**Słownik kodów:** [<plik>](<link>)` in the title block.

`SKILL.md`: frontmatter `name: project-index` and a description whose triggers cover writing or changing a spec, plan, probe or acceptance report, a decision that changes scope, and Rafal asking about a project ("co zostało w <projekt>", "pokaż indeks", "dodaj część"). Body: locating the index (repository root by `git rev-parse --show-toplevel`; docs root = the folder holding `specs/`; when none exists, ask Rafal); the naming table of spec §4; the layout of spec §5.2 pointing to `template.md`; the eight procedures of spec §6.2 as numbered steps; the rules: same commit as the causing document under the repository's own commit rule, status only in the index, a new spec carries `**Index:** <link>` instead of a status line (spec §6.3), codes always with names, Polish text, no design content, ask when a document fits two projects, a backfilled family keeps its existing slug as the project key (spec §3.2); when to update during plan execution (plan created, execution started, execution ended, acceptance), not per checkbox.

- [ ] **Step 4: Run scenarios A–G**

Expected: each as described in Step 1. A failed expectation is fixed in `SKILL.md` and the scenario is run again with a fresh subagent and a fresh sandbox.

- [ ] **Step 5: Verify the skill text**

```bash
S=C:/Users/rafal/.claude/skills/project-index; grep -c -E "^name: project-index$" $S/SKILL.md; for h in "## Części" "## Oś" "## Decyzje czekające" "## Rozstrzygnięte" "## Następny krok"; do grep -c "^$h" $S/template.md; done; grep -c -i "checkbox" $S/SKILL.md; grep -c "rev-parse --show-toplevel" $S/SKILL.md
```

Expected: every count ≥ 1.

No commit (Global Constraints).

---

### Task 4: This project's own index, and the vault docs

Spec §7.1. The first real use of the skill.

**Files:**
- Create: `D:/Notatki/notatki/.claude/projects/project-index.md`
- Modify: `D:/Notatki/notatki/.claude/specs/2026-10-16-project-index-core-design.md` (the `**Index:**` paragraph under the title)
- Modify: `D:/Notatki/notatki/.claude/CLAUDE.md:62`, `D:/Notatki/notatki/AGENTS.md:50`, `D:/Notatki/notatki/README.md:45` (the `.claude/` folder line)

**Interfaces:**
- Consumes: the skill's Create procedure and `template.md` (Task 3).

- [ ] **Step 1: Create the index with the skill**

Project `project-index`, one sentence on the convention. Parts: `project-index-core` (Indeks projektów · rdzeń, `▶ w toku`, documents: the spec and this plan, Co zostało: the remaining tasks of this plan) and `project-index-rollout` (Indeks projektów · wdrożenie w innych repo, `○ niezaczęte`, Co zostało: backfill of Baza wiedzy, then the saas app repository). Meta: both parts. Decyzje czekające: none. Rozstrzygnięte: one line per decision of spec §3.1 (eleven rows), each dated 2026-10-16 and linking `../specs/2026-10-16-project-index-core-design.md`.

- [ ] **Step 2: Point the spec to its index**

The `**Index:**` paragraph of the spec becomes the single line `**Index:** [.claude/projects/project-index.md](../projects/project-index.md)`; the sentence about a draft for Rafal's approval is removed.

- [ ] **Step 3: Mention `projects/` in the three vault docs**

In each `.claude/` line, after the mention of `specs/` and `plans/`, add: `projects/` (indeksy projektów: jeden plik na projekt z jego częściami, statusem i decyzjami; konwencja w `~/.claude/CLAUDE.md`, sekcja „Indeks projektu”). `.claude/CLAUDE.md` and `AGENTS.md` change together (README, section "Pliki w korzeniu").

- [ ] **Step 4: Verify**

```bash
cd D:/Notatki/notatki && I=.claude/projects/project-index.md; grep -n "^## " $I; grep -c "^- 2026-10-16" $I; grep -c "projects/" .claude/CLAUDE.md AGENTS.md README.md; grep -n -E "\b(D|P|S|B|A|T)[0-9]{1,2}\b|\b[IM]-?[0-9]\b" $I || echo "no bare codes"
```

Expected: the headings `## Części`, `## Oś`, `## Decyzje czekające`, `## Rozstrzygnięte`, `## Następny krok` in this order; `11`; each of the three files ≥ 1; `no bare codes`, or only lines where the code stands next to its name.

- [ ] **Step 5: Commit and push (vault rule)**

```bash
cd D:/Notatki/notatki && git branch --show-current && git add .claude/projects/project-index.md .claude/specs/2026-10-16-project-index-core-design.md .claude/CLAUDE.md AGENTS.md README.md && git diff --cached --name-only && git commit -m "docs(project-index): project index for the convention itself and the projects folder in the vault docs" && git push
```

---

### Task 5: Hub renaming and the hub index

Spec §7.3, §5.3.

**Files:**
- Rename (git mv): the nine files of spec §7.3, table "Old name → New name"
- Modify: every tracked vault file that names an old file, except the spec and this plan of `project-index-core` (they record the rename)
- Modify: `D:/Notatki/notatki/.claude/specs/2026-10-13-hub-core-design.md` (after the rename): the `**Status:**` paragraph (lines 4–7), §10 table
- Modify: `C:/Users/rafal/.claude/skills/hub/SKILL.md:9`, `C:/Users/rafal/hub-dev/hub/SKILL.md:9`
- Create: `D:/Notatki/notatki/.claude/projects/hub.md`

**Interfaces:**
- Consumes: the skill's Create procedure (Task 3); `.claude/specs/2026-10-16-hub-voice-notes.md` (Task 1).
- Produces: the nine `hub-core` file names, and `hub.md`, which Task 6 extends with the glossary link.

- [ ] **Step 1 (Rafal): Confirm that no session is executing a hub plan**

Ask Rafal; wait for his answer. On "no", stop this task.

- [ ] **Step 2: Rename**

```bash
cd D:/Notatki/notatki/.claude && for p in "specs/2026-10-13-orchestrator-hub-design.md specs/2026-10-13-hub-core-design.md" "specs/2026-10-13-orchestrator-hub-probes.md specs/2026-10-13-hub-core-probes.md" "specs/2026-10-14-orchestrator-hub-plan-2-acceptance.md specs/2026-10-14-hub-core-plan-2-acceptance.md" "specs/2026-10-14-orchestrator-hub-plan-3-acceptance.md specs/2026-10-14-hub-core-plan-3-acceptance.md" "specs/2026-10-16-orchestrator-hub-plan-4-acceptance.md specs/2026-10-16-hub-core-plan-4-acceptance.md" "plans/2026-10-13-orchestrator-hub-plan-1-probes.md plans/2026-10-13-hub-core-plan-1-probes.md" "plans/2026-10-14-orchestrator-hub-plan-2-core.md plans/2026-10-14-hub-core-plan-2-core.md" "plans/2026-10-14-orchestrator-hub-plan-3.md plans/2026-10-14-hub-core-plan-3.md" "plans/2026-10-16-orchestrator-hub-plan-4.md plans/2026-10-16-hub-core-plan-4.md"; do git mv $p; done; git status --short | grep -c "^R"
```

Expected: `9`.

- [ ] **Step 3: Update references**

```bash
cd D:/Notatki/notatki && L="$(mktemp)"; git grep -l -E "orchestrator-hub-(design|probes|plan-[0-9])" -- . ':!.claude/specs/2026-10-16-project-index-core-design.md' ':!.claude/plans/2026-10-16-project-index-core-plan-1.md' > "$L"; cat "$L"; tr '\n' '\0' < "$L" | xargs -0 sed -i -E 's/orchestrator-hub-design/hub-core-design/g; s/orchestrator-hub-probes/hub-core-probes/g; s/orchestrator-hub-plan-/hub-core-plan-/g'; echo "$L"; for f in C:/Users/rafal/.claude/skills/hub/SKILL.md C:/Users/rafal/hub-dev/hub/SKILL.md; do sed -i 's/2026-10-13-orchestrator-hub-design\.md/2026-10-13-hub-core-design.md/' $f; done
```

- [ ] **Step 4: Status of the hub spec moves to the index**

In `.claude/specs/2026-10-13-hub-core-design.md`: the `**Status:**` paragraph (lines 4–7) becomes `**Index:** [.claude/projects/hub.md](../projects/hub.md)`. In the §10 table: the Plan 1 content cell loses its leading `**Done** (2026-10-14). `; the Plan 3 and Plan 4 cells of the column "Written when" become `—`; one sentence under the table: `The status of every plan is kept in [.claude/projects/hub.md](../projects/hub.md).` The plan scopes stay unchanged.

- [ ] **Step 5: Create `hub.md` with the skill**

Project `hub`, one sentence from the hub spec's opening paragraph. Parts, labels and statuses of spec §5.3 (`hub-core` `▶ w toku`; `hub-voice` `⏸ wstrzymane`, document `../specs/2026-10-16-hub-voice-notes.md`; `hub-panel`, `hub-approvals`, `hub-codex-status`, `hub-interlocutor` `○ niezaczęte`). `hub-core` documents: the nine renamed files. `hub-core` Co zostało: the pilot and the open points by name (interrupted turn stays "working" (I-4), vanished sessions never age out (I-3), stale decision wait (M-2), watcher re-arm noise (B7), "wyslij" without diacritics (B5)), after checking `.claude/specs/2026-10-16-hub-core-plan-4-acceptance.md` for points it closed or added. Meta: `czeka na decyzję „Zakres wersji finalnej”`. Oś: Plans 1–4 with their dates and acceptance verdicts, the pilot, the voice stages, the finish line, the parts outside it. Decyzje czekające: the five decisions of spec §5.3, each with its question, its variants and the recommendation given in session `2b64d06b` on 2026-10-16 (Zakres wersji finalnej: rdzeń + głos; Pilot przed poprawkami: pilot zaraz po Planie 4; Start głosu: teraz, w osobnej sesji; Hub a Orca: hub dalej; Orca w specu huba: dopisać do §12). Następny krok: the decision „Pilot przed poprawkami”.

- [ ] **Step 6: Run the hub tests**

```bash
cd C:/Users/rafal/.claude/skills/hub && node --test 2>&1 | grep -E "^# (pass|fail)"
```

Expected: `# pass 132` and `# fail 0`.

- [ ] **Step 7: Verify**

```bash
cd D:/Notatki/notatki && git grep -n "orchestrator-hub-" -- . ':!.claude/specs/2026-10-16-project-index-core-design.md' ':!.claude/plans/2026-10-16-project-index-core-plan-1.md' || echo "no old names"; ls .claude/specs .claude/plans | grep -c "hub-core"; grep -c "^\*\*Index:\*\*" .claude/specs/2026-10-13-hub-core-design.md; grep -c "hub-core-design" C:/Users/rafal/.claude/skills/hub/SKILL.md C:/Users/rafal/hub-dev/hub/SKILL.md; grep -n -E "\b(D|P|S|B|A|T)[0-9]{1,2}\b|\b[IM]-?[0-9]\b" .claude/projects/hub.md
```

Expected: `no old names`; `9`; `1`; `1` and `1`; every printed `hub.md` line shows the code next to its name.

- [ ] **Step 8: Commit and push (vault rule)**

```bash
`$L` is the list file printed in Step 3 (the files whose references changed; after the rename they carry the new names, so `git add` takes the paths that `git status --short` shows for them).

```bash
cd D:/Notatki/notatki && git branch --show-current && git status --short .claude/specs .claude/plans .claude/projects
```

Stage exactly: the nine renames (already staged by `git mv`), the files of `$L` under their current names, `.claude/specs/2026-10-13-hub-core-design.md` and `.claude/projects/hub.md`, each by explicit path with `git add <path>`. Then:

```bash
git diff --cached --name-only && git commit -m "docs(hub): rename the hub files to hub-core and add the hub index" && git push
```

Expected in the cached list: the nine renamed files, `hub.md`, and the files of `$L` that are not among the nine (for example the voice notes of Task 1, if they name the old spec); nothing else. A path outside this set means stop and ask Rafal.

---

### Task 6: Hub code glossary

Spec §7.3 (glossary paragraph), §3.1 (codes).

**Files:**
- Create: `D:/Notatki/notatki/.claude/specs/<date of writing>-hub-core-codes.md` (English)
- Modify: `D:/Notatki/notatki/.claude/projects/hub.md` (title block: the glossary link)

**Interfaces:**
- Consumes: the nine `hub-core` file names (Task 5).

- [ ] **Step 1: List the codes**

```bash
cd D:/Notatki/notatki && cat $(git ls-files '.claude/specs/*hub-core*' '.claude/plans/*hub-core*') | grep -o -E '\b(D[0-9]{1,2}|P[0-9]{1,2}|S[0-9]{1,2}|A[0-9]|B[0-9]{1,2}|I-?[0-9]|M-?[0-9]|T[0-9]{1,2})\b' | sort -u | tr '\n' ' '
```

Expected on 2026-10-16: 69 codes (A1–A4, B1–B12, D1–D14, I-3, I-4, I1–I3, M-2, M1, M4–M6, P1–P15, S1–S12, T4, T6).

- [ ] **Step 2: Write the glossary**

`# Hub core — code glossary`, `**Project / part:** hub / hub-core`, `**Index:** [hub.md](../projects/hub.md)`. One table `| Code | Name | Defined in |`: one row per code of Step 1 and per decision 1–17 of the hub spec §3 (written `Decision 1` … `Decision 17`). Name: a few words. Defined in: new file name and section. A Step 1 match that is not a code goes into a final line `Not codes: …` with the reason.

- [ ] **Step 3: Link it from `hub.md`**

Title block line `**Słownik kodów:** [<file name>](../specs/<file name>)`.

- [ ] **Step 4: Verify coverage**

```bash
cd D:/Notatki/notatki && G=$(ls .claude/specs/*-hub-core-codes.md); for c in $(cat $(git ls-files '.claude/specs/*hub-core*' '.claude/plans/*hub-core*') | grep -o -E '\b(D[0-9]{1,2}|P[0-9]{1,2}|S[0-9]{1,2}|A[0-9]|B[0-9]{1,2}|I-?[0-9]|M-?[0-9]|T[0-9]{1,2})\b' | sort -u); do grep -q -E "^\| $c \||Not codes:.*\b$c\b" $G || echo "MISSING $c"; done; grep -c "^| Decision " $G; grep -c "Słownik kodów" .claude/projects/hub.md
```

Expected: no `MISSING` line; `17`; `1`.

- [ ] **Step 5: Commit and push (vault rule)**

```bash
cd D:/Notatki/notatki && git branch --show-current && git add .claude/specs/*-hub-core-codes.md .claude/projects/hub.md && git diff --cached --name-only && git commit -m "docs(hub-core): code glossary linked from the hub index" && git push
```

---

### Task 7: Acceptance with Rafal

Spec §9.

**Files:**
- Create: `D:/Notatki/notatki/.claude/specs/<date>-project-index-core-plan-1-acceptance.md`
- Modify: `D:/Notatki/notatki/.claude/projects/project-index.md` (status of `project-index-core`, Oś, Następny krok)

- [ ] **Step 1 (Rafal): Item 1**

Rafal opens `.claude/projects/hub.md` and, without opening another file, names the hub's parts, their status, what is left before the finish line, the next step and the five pending decisions. Record his words.

- [ ] **Step 2: Items 2, 3, 4, 6, 7 by command**

```bash
cd D:/Notatki/notatki && git show --stat --format=%s $(git log --diff-filter=A --format=%H -- .claude/projects/hub.md | tail -1) | grep -E "hub-core-design|projects/hub.md"; git grep -c "orchestrator-hub-" -- . ':!.claude/specs/2026-10-16-project-index-core-design.md' ':!.claude/plans/2026-10-16-project-index-core-plan-1.md' || echo "item 4: no old names"
```

Expected: the Task 5 commit (the first change to hub documents after the rule) lists both `2026-10-13-hub-core-design.md` and `.claude/projects/hub.md` (item 2); `item 4: no old names`. Item 3: Task 1 Step 4 run again, with the same expected output. Items 6 and 7: Task 2 Step 3 and Task 6 Step 4 run again.

- [ ] **Step 3 (Rafal): Item 5**

Rafal starts a new session in the vault and asks "jakie decyzje czekają w hubie?". Expected: the answer names each decision; any code appears next to its name. Record the reply.

- [ ] **Step 4: Report, index, commit**

Write the acceptance report in the shape of `.claude/specs/2026-10-14-hub-core-plan-3-acceptance.md`: per item the expected and the observed result, quoted, and a verdict; a failure becomes a named finding for Rafal. With the skill: `project-index-core` becomes `✅ gotowe` when every item passed, Oś gets the acceptance line, Następny krok names `project-index-rollout`. Commit and push both files (vault rule). Then give Rafal the proposed commit message for `~/.claude`: `feat(project-index): project index rule and skill; hub skill points to hub-core-design`.
