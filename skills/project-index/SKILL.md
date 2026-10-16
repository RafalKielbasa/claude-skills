---
name: project-index
description: Use when a session writes or changes a spec, plan, probe report or acceptance report, or opens, resolves or postpones a decision that changes a project's scope — the project's index `projects/<project>.md` changes in the same commit. Also when Rafal asks about a project ("co zostało w <projekt>", "pokaż indeks <projekt>", "jakie decyzje czekają w <projekt>", "dodaj część") or asks for an index of an existing family of specs. Defines the `<project>-<part>` file naming convention.
---

# Project index

One file per project shows what the project consists of, where each part stands, what is left
before the finish line, and which decisions wait for Rafal. The rule is in `~/.claude/CLAUDE.md`,
section „Indeks projektu”; the design is
`D:/Notatki/notatki/.claude/specs/2026-10-16-project-index-core-design.md`.

## Locating the index

1. Repository root: `git rev-parse --show-toplevel`, run from the current directory. This works from
   subdirectories and from worktrees; a worktree has its own checkout, and the index is written in
   that checkout.
2. Docs root: the folder that holds the repository's `specs/` folder (and `plans/`): `.claude/` in
   the vault „Notatki”, `docs/superpowers/` in most code repositories, `docs/` when specs live in
   `docs/specs/`. Use the layout the repository already has; never create a second one.
3. No `specs/` folder anywhere in the repository: stop and ask Rafal where specs live. Write nothing.
   More than one `specs/` folder (for example `.claude/specs/` and `docs/superpowers/specs/`) and
   no rule here that names the repository: ask Rafal which one is the docs root.
4. The index is `<docs root>/projects/<project>.md`.

## Naming

| Document | File name |
|---|---|
| Spec | `YYYY-MM-DD-<project>-<part>-design.md` |
| Probe report | `YYYY-MM-DD-<project>-<part>-probes.md` |
| Plan | `YYYY-MM-DD-<project>-<part>-plan-<n>.md`, optionally `-plan-<n>-<slug>.md` |
| Acceptance report | `YYYY-MM-DD-<project>-<part>-plan-<n>-acceptance.md` |
| Other notes of a part | `YYYY-MM-DD-<project>-<part>-<kind>.md` |
| Index | `<project>.md` in `<docs root>/projects/` |

- `<project>` and `<part>` are kebab-case English. A family that already has a slug in the
  repository keeps it as the project key (`nagrywanie`), so old and new files share one name.
- Every project has at least one named part, a single-part project too (`billing-export`, not
  `billing`), so nothing is renamed when the project grows.
- `<n>` counts plans within one part, from 1.
- A plan named after a ticket keeps the ticket id in the slug: `…-plan-<n>-cp-15.md`.
- The same `<project>-<part>` name is used in conversation.

## Choosing the project

- The document's name, after the date, begins with `<project>-` (`2026-10-16-hub-core-design.md`
  belongs to `hub`), or the request names the project: that project.
- New work that belongs to no existing project: create a project (procedure 1).
- The work could belong to two or more existing projects, or it is unclear which: ask Rafal which
  one, and write nothing until he answers.

## Index layout

Copy `template.md` (next to this file). Sections, in this order: title and one sentence; **Meta**
and **Teraz**; `## Części` (table `Część | Status | Dokumenty | Co zostało`); `## Oś`;
`## Decyzje czekające`; `## Rozstrzygnięte`; `## Następny krok`.

- Status marks: `✅ gotowe`, `▶ w toku`, `⏸ wstrzymane`, `○ niezaczęte`; a part outside the finish
  line is marked `poza metą` and listed below the `META` line of Oś.
- Text in Polish; part names and file names stay as they are.
- Links are relative Markdown links (from `projects/` to `../specs/…`, `../plans/…`).
- No design content: rationale, mechanisms and test lists stay in specs and plans.
- A code (`D5`, `P13`, `B2`, `I-3`, `S12`) never stands alone: always next to its name, for
  example „Zakres wersji finalnej (D5)”. The same holds in replies to Rafal.
- A part that exists only in conversation still gets its row; its Dokumenty cell says `—` and Co
  zostało says what is missing (for example „spec”).

## Procedures

1. **Create.** Copy the template to `<docs root>/projects/<project>.md`. Fill the title, one
   sentence, the first part, and Meta: the parts Rafal named as the finish line, or „czeka na
   decyzję „<name>”” and that decision under Decyzje czekające.
2. **Add a part.** One row in Części, its stages in Oś (above or below the META line), Teraz if it
   is the part in progress. Re-read Decyzje czekające: a decision whose variants or recommendation
   name the parts (for example the finish line) gets the new part added to its wording.
3. **Register a document.** Link a new or renamed spec, plan or report in its part's Dokumenty
   cell and add or update its Oś line with the date.
4. **Update status.** Set the part's Status and Co zostało, the Oś mark, Teraz and Następny krok.
5. **Open a decision.** Add it under Decyzje czekające with a name, the question in one sentence,
   the variants, the recommendation if one was given, and the source (a link, or „rozmowa
   RRRR-MM-DD, sesja <id>”).
6. **Resolve a decision.** Remove it from Decyzje czekające, add one dated line under Rozstrzygnięte
   (name, outcome, link to where the outcome is recorded), and apply its effect (Meta, a part's
   status, Następny krok).
7. **Postpone a decision.** Keep it under Decyzje czekające and append „Odłożona RRRR-MM-DD do
   <termin albo warunek>.” with the reason in a few words; Meta and statuses stay as they are.
8. **Answer about a project.** Read the index and answer from it. Change nothing.
9. **Backfill a family.** For an old family of documents with work in progress: list its files by
   slug, propose their assignment to parts under the family's existing slug as the project key, and
   ask Rafal. Write the index only after he confirms. Finished families get no index.

## When to update

- A spec, probe report or acceptance report is written or changed.
- A plan is created, its execution starts (part `▶ w toku`, Teraz), and its execution ends.
- A decision that changes scope is opened, resolved or postponed.
- Not for every ticked checkbox of a plan.

## Specs point to the index

A new spec carries `**Index:** [<path of the index>](<relative link>)` under its title instead of a
status line, and no status table. Status lives only in the index.

## Commit

The index change goes into the same commit as the document that caused it, under the repository's
own commit rule: the vault „Notatki” commits and pushes its own files; Baza wiedzy commits on its
own; code repositories do not commit by default, so the index change stays uncommitted next to the
document. Stage paths one by one; never `git add -A` or `git add .`.
