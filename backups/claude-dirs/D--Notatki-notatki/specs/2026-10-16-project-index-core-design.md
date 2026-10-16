# Project index — design

**Project / part:** `project-index` / `project-index-core`
**Date:** 2026-10-16
**Index:** `.claude/projects/project-index.md`, created by the first plan. Until then this spec is a
draft for Rafal's approval.
**Origin:** brainstorming in session `2b64d06b` (2026-10-16), after an assessment of what is left
to finish the orchestrator hub.

One file per project that shows, at a glance, what the project consists of, where each part
stands, what is left before the project counts as finished, and which decisions wait for Rafal.
A naming convention ties every spec, plan and report to its project and part.

---

## 1. Purpose

On 2026-10-16 Rafal asked what is left before the hub is finished. Answering took a pass over the
hub spec (§10 table, status line, §13), two acceptance reports, the Plan 4 file, the hub dev
tree, the hub registry and two older transcripts. What it found:

- the voice part of the hub (sub-project 3) existed only in transcripts and in two last-message
  files of the hub registry; no file in the vault mentioned its state;
- "Plan 5" existed only in the conversation;
- decisions were labelled `D1`–`D5` in the conversation only, so Rafal could not tell what "D5"
  was without asking;
- status lived in several places: the spec's status line, the spec's §10 table and the
  acceptance reports.

Rafal does not search documents quickly, and codes such as `D5`, `P13`, `B2`, `I-3` or `S12` say
nothing without a lookup. He needs one place per project and a name for every part and decision.

## 2. Goals, non-goals, anti-goals

**Goals**

1. Every spec, plan, probe report and acceptance report carries its project and part in its file
   name.
2. Every project has one index file. Opening it answers, without searching: which parts the
   project has, the status of each, the documents of each, what is left before the finish line,
   the next step, and which decisions wait for Rafal, each by name.
3. The index stays current because the session that changes a spec, plan or report updates the
   index in the same commit.
4. Codes never stand alone, in files or in conversation: always with a name.
5. Work that has no file yet (a part only discussed) still appears in the index.

**Non-goals**

- The hub reading or showing indexes (a later increment of the hub, if wanted).
- `sync-project` copying indexes into the vault's project notes (later, if wanted).
- A hook that enforces index updates. It is added only if the hub pilot shows missed updates.
- Renaming old files outside the hub.
- Indexes for old, finished families of documents.
- Changes to `board-tracker` or GitHub boards.

**Anti-goals**

- An index that disagrees with reality, for example a status different from what a spec says.
- An index that grows into a second spec: design content belongs in specs and plans.
- A code without a name anywhere Rafal reads it.
- A part or decision that exists only in a conversation or a transcript.

## 3. Decisions

### 3.1 Rafal's decisions (2026-10-16)

| Question | Decision |
|---|---|
| What the index answers first | Composition and progress: parts with their documents and status, what is left to the finish line, the next step |
| Naming form | `<project>-<part>` everywhere: file names, conversation, hub. Plans numbered within a part (`hub-voice-plan-1`). Next to the name, the index shows a Polish label ("Hub · głos") |
| Reach | One convention for all repositories with specs and plans, rolled out from the hub |
| Where the index lives | One file per project in the project's repository, next to its specs and plans |
| What keeps it current | A rule in `~/.claude/CLAUDE.md` plus a skill `project-index`; the index changes in the same commit as the spec, plan or report |
| Layout | A table of parts, then a timeline of stages with a finish line (mockup variants A and C) |
| Existing files | Hub files are renamed after Plan 4 of the hub is accepted; in other repositories old names stay and indexes map them; new files everywhere follow the convention |
| What gets an index | Every new piece of work (every new spec) belongs to a project with an index, single-part projects included. Of the old files, only families with work in progress get an index |
| Language | The index is in Polish; part names and file names stay in English. The language rule in `~/.claude/CLAUDE.md` gains "indeksy projektów" next to tickets |
| Codes | A code (`D5`, `P13`, `B2`, `I-3`, `S12`) is shown only next to its name, also in Claude's replies |
| Codes already in hub files (about 670 occurrences of about 70 codes in the nine hub files, plus decisions 1–17) | A glossary file for `hub-core`, linked from the hub index: one line per code with the code, its name, and the file and section where it is defined. The old files stay unchanged; new text always gives the name with the code. Decided after the builder check |

### 3.2 Calls made by the designer (not discussed; Rafal checks them while reading)

| Call | Reason |
|---|---|
| Status lives only in the index. A spec keeps no status table and no status line beyond a link to its index | Two places with status is the drift the anti-goals forbid; today the hub status sits in the spec's status line and §10 table |
| The index lives in a folder `projects/` that is a sibling of the repository's `specs/` folder: `.claude/projects/<project>.md` in the vault, `docs/superpowers/projects/<project>.md` in code repositories | One rule for both repository layouts |
| The date stays first in file names (`2026-10-16-hub-voice-design.md`) | The `superpowers:brainstorming` and `superpowers:writing-plans` skills name files this way; a search for `hub-voice` still finds every file of the part |
| The hub spec becomes `hub-core` | Its §2 says it covers sub-project 1: "Sub-project 1: orchestration core | … | This spec" |
| The hub pilot first writes the voice state into a `hub-voice` file | The voice decisions live in `~/.claude/hub/registry/058993f5-….last/`; the hub's retention deletes them 14 days after that session ended (2026-10-14), so about 2026-10-28. The transcripts of 2026-10-11 and 2026-10-12 also age out (`cleanupPeriodDays` is not set in `~/.claude/settings.json`; the default is assumed to be 30 days, not verified) |
| Project keys are English kebab-case; a family that already has a slug in its repository keeps it as the key (`nagrywanie` in Baza wiedzy) | Old and new files of one family stay findable under one name |
| A resolved decision stays in the index as one line: date, name, outcome, link | The trace of the decision stays, and the index does not grow |
| Every project has at least one named part, a single-part project too (`project-index-core`) | A project that grows later needs no renaming of its first files |
| The skill `project-index` is written in English; its template, which produces the Polish index, is in Polish | The global rule puts skills in English; the index is in Polish by Rafal's decision |
| The hub pilot and the hub renaming are one step | Plan 4 of the hub was accepted on 2026-10-16 (commit `3759595`, "all four items passed"), so nothing waits for it; the hub index is created directly with the new names |
| Backfilling other repositories is a separate part, `project-index-rollout`, with its own plan later | It needs sessions in other repositories (Baza wiedzy is in the `board-tracker` registry and needs a pinned issue; code repositories do not commit by default) and Rafal's confirmation of each family; the first plan stays within the rule, the skill and the hub |
| The rule is mirrored into `~/.codex/AGENTS.md`, without a Codex variant of the skill | That file is a maintained near-copy of `~/.claude/CLAUDE.md` with the same language rule; the two would otherwise disagree |
| In the vault, the docs root is `.claude/`, not the older `docs/superpowers/` folder | The vault's specs and plans live in `.claude/specs/` and `.claude/plans/` |

## 4. Naming convention

| Document | File name |
|---|---|
| Spec | `YYYY-MM-DD-<project>-<part>-design.md` |
| Probe report | `YYYY-MM-DD-<project>-<part>-probes.md` |
| Plan | `YYYY-MM-DD-<project>-<part>-plan-<n>.md`, optionally `-plan-<n>-<slug>.md` |
| Acceptance report | `YYYY-MM-DD-<project>-<part>-plan-<n>-acceptance.md` |
| Other notes of a part (for example brainstorming notes) | `YYYY-MM-DD-<project>-<part>-<kind>.md` |
| Index | `<project>.md` in the `projects/` folder |

- `<project>` and `<part>` are kebab-case, English, except the family slugs kept by §3.2.
- `<n>` counts plans within one part, from 1.
- The same `<project>-<part>` name is used in conversation and, later, in the hub.
- Plans in repositories that name plans after tickets (for example `cp-15.md` in the saas app
  repository) keep the ticket id in the slug: `…-plan-<n>-cp-15.md`.

## 5. The index

### 5.1 Location and language

- One file per project: `<repo>/<docs root>/projects/<project>.md`, where `<docs root>` is the
  folder that holds `specs/` and `plans/` (`.claude` in the vault, `docs/superpowers` in code
  repositories).
- Text in Polish; part names, file names and links as they are.
- Links are relative Markdown links, so they open from VS Code. The vault's `.claude/` is tool
  state, not notes, so wikilinks are not used there.

### 5.2 Layout

The index has these sections, in this order:

1. **Title and one sentence** on what the project is.
2. **Meta**: the finish line, that is the list of parts that must be done for the project to count
   as finished, or "czeka na decyzję „<name>”" while Rafal has not set it. One line **Teraz**:
   the part and step in progress.
3. **Części**: a table with the columns Część (`<project>-<part>` and the Polish label), Status,
   Dokumenty (links), Co zostało.
4. **Oś**: the stages in order, one line each, with a status mark, the name, a few words and a
   date. A line marks the finish line; parts outside it are listed below it.
5. **Decyzje czekające**: each decision with its name, the question in one sentence, the
   options and the recommendation if one was given, and where it was raised (a link, or
   "rozmowa <date>, sesja <id>").
6. **Rozstrzygnięte**: one line per resolved decision: date, name, outcome, link to where the
   outcome is recorded.
7. **Następny krok**: one line.

Status marks: ✅ gotowe, ▶ w toku, ⏸ wstrzymane, ○ niezaczęte; a part outside the finish line is
marked "poza metą".

The index holds no design content: rationale, mechanisms and test lists belong in specs and plans,
which the index links.

### 5.3 Example: the hub

The hub index starts with these parts (labels in Polish as they will appear):

| Part | Label | Status at the pilot | Source |
|---|---|---|---|
| `hub-core` | Hub · rdzeń | ▶ w toku: Plans 1–4 done, Plan 4 accepted 2026-10-16; pilot not started | hub spec §2 sub-project 1, Plans 1–4, acceptance reports of Plans 2, 3 and 4 |
| `hub-voice` | Hub · głos | ⏸ wstrzymane: brainstorming stopped at the question what session X does after a voice conversation | hub spec §2 sub-project 3; voice notes (§7.2) |
| `hub-panel` | Hub · panel na localhost | ○ | hub spec §2 increment 1a |
| `hub-approvals` | Hub · karty zatwierdzeń | ○ | hub spec §2, §11; needs a probe |
| `hub-codex-status` | Hub · statusy sesji Codexa | ○ | hub spec §2, §11 |
| `hub-interlocutor` | Hub · rozmówca z innego modelu | ○ | hub spec §2 sub-project 2b |

Pending decisions to record, by name: **Zakres wersji finalnej** (finish line: `hub-core` +
`hub-voice`, or every part, or `hub-core` only), **Pilot przed poprawkami** (pilot right after
Plan 4, or a fifth plan first), **Start głosu** (when the voice brainstorming resumes), **Hub a
Orca** (continue the hub or move to Orca), **Orca w specu huba** (record Orca as a rejected
alternative in the spec). All five were raised in session `2b64d06b` on 2026-10-16.

"Co zostało" for `hub-core` names the pilot and the open points of its acceptance reports, each
by name: interrupted turn stays "working" (I-4), vanished sessions never age out (I-3), stale
decision wait (M-2), watcher re-arm noise (B7), "wyslij" without diacritics (B5). Before writing
it, the builder checks the Plan 4 acceptance report for points it closed or added. (The sender
name in delivery confirmation is not open: commit `d8e92f8` amended the spec, and the installed
`lib/confirm.mjs:11` accepts a set of hub names.)

## 6. Keeping the index current

### 6.1 Global rule

A new section in `~/.claude/CLAUDE.md` (Polish, as that file is). Draft:

> ## Indeks projektu
>
> - Każda praca, która dostaje spec, należy do projektu. Projekt ma jeden plik-indeks
>   `projects/<projekt>.md` obok folderów `specs/` i `plans/` repo (w vaultcie „Notatki”
>   `.claude/projects/`, w repo z kodem `docs/superpowers/projects/`).
> - Nazwy speców, planów i raportów: `RRRR-MM-DD-<projekt>-<część>-…` (`-design`, `-probes`,
>   `-plan-<n>`, `-plan-<n>-acceptance`). Projekt i część po angielsku, kebab-case.
> - Sesja, która tworzy albo zmienia spec, plan, raport sond albo akceptacji, albo rozstrzyga lub
>   odkłada decyzję zmieniającą zakres, aktualizuje indeks projektu w tym samym commicie, skillem
>   `project-index`. Dotyczy też subagentów i skilli, także `superpowers:*`.
> - Status projektu i jego części żyje tylko w indeksie. Spec nie prowadzi własnej tabeli
>   statusu; linkuje do indeksu.
> - Kod decyzji albo ustalenia (`D5`, `P13`, `B2`, `I-3`, `S12`) nigdy nie stoi sam: zawsze z
>   nazwą, w plikach i w rozmowie ze mną, np. „Zakres wersji finalnej (D5)”.
> - Indeks jest po polsku; nazwy części i plików zostają po angielsku.

The language section of the same file changes "Po polsku zostaje wyłącznie treść ticketów i
rozmowa ze mną" to "Po polsku zostaje wyłącznie treść ticketów, indeksów projektów i rozmowa ze
mną".

Both changes are mirrored into `~/.codex/AGENTS.md`, the maintained near-copy of that file. No
Codex variant of the skill is written; a Codex session follows the rule by hand.

### 6.2 Skill `project-index`

Location `~/.claude/skills/project-index/`: `SKILL.md` (English) and `template.md` (the index
skeleton, Polish). It triggers when a session creates or changes a spec, plan or report, when a
decision changes scope, and when Rafal asks about a project ("co zostało w hubie", "pokaż indeks
huba", "dodaj część").

Procedures:

| Procedure | What it does |
|---|---|
| Create | Creates the index from the template: project key, one sentence, first part, finish line or a pending decision for it |
| Add a part | Adds a row to Części and its stages to Oś |
| Register a document | Links a new or renamed spec, plan or report under its part and updates Oś |
| Update status | Sets a part's status, Co zostało, Teraz and Następny krok |
| Open a decision | Adds it to Decyzje czekające by name |
| Resolve a decision | Moves it to Rozstrzygnięte as one line and applies its effect (for example the finish line) |
| Answer about a project | Reads the index and answers from it; changes nothing |
| Backfill a family | For an old family with work in progress: lists its files by slug, proposes their assignment to parts and asks Rafal before writing, because membership is a judgment |

The skill commits under the repository's own rules: in the vault, it commits and pushes its own
files; elsewhere it follows the repository's commit setting. The index change goes into the same
commit as the document that caused it.

### 6.3 Specs point to the index

New specs carry a line `**Index:** <path of the index>` instead of a status line, and no status
table. Existing specs are changed only when renamed (§7.3) or when their family gets an index.

## 7. Rollout

### 7.1 Rule and skill

Write the rule (§6.1) and the skill (§6.2). From then on every new spec in any repository follows
the convention and creates or updates its project's index. Create
`.claude/projects/project-index.md` for this project itself.

### 7.2 Voice notes, first

Write `.claude/specs/2026-10-16-hub-voice-notes.md` (English): the voice goal, the decisions so
far with their dates (2026-10-11, 2026-10-12, 2026-10-14), the open questions, and the sources.
Sources: `~/.claude/hub/registry/058993f5-e8c5-468b-8a5d-a41f979b57b4.last/` (`d1198f9f-….md`,
`fd8af3d0-….md`), the transcripts `0e06a344-….jsonl` and `7e84737d-….jsonl` in
`~/.claude/projects/D--Notatki-notatki/`, and the hub's messages in
`~/.claude/hub/registry/4bd8c564-….last/`. This step comes first in the plan, because the registry
files are deleted about 2026-10-28.

### 7.3 Hub renaming and hub index, one commit

Plan 4 was accepted on 2026-10-16, so the renaming does not wait. In one commit in the vault:

| Old name | New name |
|---|---|
| `specs/2026-10-13-orchestrator-hub-design.md` | `specs/2026-10-13-hub-core-design.md` |
| `specs/2026-10-13-orchestrator-hub-probes.md` | `specs/2026-10-13-hub-core-probes.md` |
| `specs/2026-10-14-orchestrator-hub-plan-2-acceptance.md` | `specs/2026-10-14-hub-core-plan-2-acceptance.md` |
| `specs/2026-10-14-orchestrator-hub-plan-3-acceptance.md` | `specs/2026-10-14-hub-core-plan-3-acceptance.md` |
| `specs/2026-10-16-orchestrator-hub-plan-4-acceptance.md` | `specs/2026-10-16-hub-core-plan-4-acceptance.md` |
| `plans/2026-10-13-orchestrator-hub-plan-1-probes.md` | `plans/2026-10-13-hub-core-plan-1-probes.md` |
| `plans/2026-10-14-orchestrator-hub-plan-2-core.md` | `plans/2026-10-14-hub-core-plan-2-core.md` |
| `plans/2026-10-14-orchestrator-hub-plan-3.md` | `plans/2026-10-14-hub-core-plan-3.md` |
| `plans/2026-10-16-orchestrator-hub-plan-4.md` | `plans/2026-10-16-hub-core-plan-4.md` |

- Every reference by file name in tracked vault files is updated; on 2026-10-16 all of them were
  inside the hub files themselves. This spec and the plans of `project-index-core` keep the old
  names, as the record of the rename.
- `~/.claude/skills/hub/SKILL.md:9` and its copy in the dev tree
  `C:/Users/rafal/hub-dev/hub/SKILL.md` point to the new spec name. This is a change to the hub
  skill, which the hub never makes at runtime; it is done here as explicitly requested work.
- Untracked working files in `.superpowers/sdd/` keep the old names; they are history.
- The hub spec's status line and the status statements of its §10 table are replaced by a link
  to `.claude/projects/hub.md`; the plan scopes in §10 stay.
- The same commit creates `.claude/projects/hub.md` with the parts of §5.3, the new names and
  the five pending decisions.

After the rename, `.claude/specs/<date of writing>-hub-core-codes.md` (English) lists every code
used in the nine hub files: decisions 1–17 of the spec's §3, the probe questions S1–S12, the probe
decisions D1–D14, the Plan 3 additions and amendments P1–P15, the acceptance findings (A1–A2,
B1–B12, I-3, I-4, M-2 and the others found there) and the plan rulings (for example T4, T6).
One line per code: the code, a name of a few words, and the file (new name) and section that
define it. `hub.md` links it in its title block.

### 7.4 Other repositories: part `project-index-rollout`

Not part of the first plan. `.claude/projects/project-index.md` lists it as a second part, with
its own plan later:

- new work in every repository follows the rule from §7.1 on, without any rollout step;
- families with work in progress get an index through the skill's backfill procedure, repository
  by repository, starting with Baza wiedzy (for example the `nagrywanie`, `tor-b` and meetings
  families), then the saas app repository; Rafal confirms each family's parts;
- finished families and their files stay as they are.

## 8. Constraints

- `superpowers:*` skills are plugin skills and are not edited; the global rule is what makes them
  update indexes, because Rafal's rules take precedence over skills.
- Commit rules stay per repository: the vault commits and pushes its own files; Baza wiedzy
  commits on its own; code repositories do not commit by default. "Same commit" means the index
  change travels with the document that caused it, under that repository's rule.
- Code, specs, plans and skills in English; the index in Polish (§3.1).
- Before renaming, the builder checks that no session is executing a hub plan; the hub files are
  renamed only while none is.

## 9. Acceptance

1. Rafal opens `.claude/projects/hub.md` and, without opening another file, names the hub's parts,
   their status, what is left before the finish line, the next step and the five pending
   decisions by name.
2. The first change to a hub spec, plan or report after the rule is in force arrives in the same
   commit as the matching index update (`git show --stat`).
3. `.claude/specs/2026-10-16-hub-voice-notes.md` exists and holds the voice decisions of
   2026-10-11, 2026-10-12 and 2026-10-14 with their sources.
4. After §7.3: a search for `hub-core` in `.claude/` finds all nine `hub-core` files, and
   `git grep orchestrator-hub-` in the vault finds no reference to an old file name outside this
   spec and the plans of `project-index-core`.
5. In a new session, a reply that mentions a decision gives its name next to any code.
6. `~/.claude/CLAUDE.md` and `~/.codex/AGENTS.md` carry the same rule and the same language
   sentence.
7. The hub glossary has a line for every distinct code that a pattern search finds in the nine
   hub files, and `hub.md` links it.

## 10. Left to the builder

- The wording of `SKILL.md`, its trigger description and the exact template text.
- The status marks and the column widths of the index.
- How the backfill procedure recognises a family with work in progress (for example open issues
  of `board-tracker`, recent commits, a plan with unchecked steps), as long as Rafal confirms
  before anything is written.
- Whether §11 items of the hub spec without their own part (Codex consultation from a fork, Codex
  participation policy) appear as separate parts or under "Co zostało" of an existing part.
