---
name: live-demo
description: Design the teaching demo for a live event and produce its assets — the demo spec, the seed data, the agent prompt, the tool descriptions the model actually sees, and the n8n workflow conventions. Use when Rafał works on what the live will actually show ("demo na live", "co pokazujemy", "seed do dema", "prompt agenta"). NOT for the n8n workflows themselves, which Rafał builds in n8n and exports.
---

# /live-demo — design the teaching demo and produce its assets

Result: a demo spec in `docs/superpowers/specs/`, tracked by `live.yaml`'s
`documents.demo`, plus the event's `seed/`, `prompts/` and
`workflows/KONWENCJE.md`. `live-script` reads `status.demo` as its own hard
gate, so this is the skill that unblocks it — but only once a real n8n
rehearsal has produced an export, which happens outside this skill entirely
(§12-§14).

## 1. What this skill owns

Exactly one status key (`status.demo`) and one documents key
(`documents.demo`) in the event's `live.yaml`, plus:

- the spec file at `documents.demo`'s path;
- every file under the event's `seed/` and `prompts/` directories;
- exactly one file under `workflows/`: `workflows/KONWENCJE.md`.

It never touches `status.concept`, `status.prework`, or any other stage key.
It never touches the event's `README.md` — that belongs to `live-new`. It
never writes a workflow `.json` file, in either mode, ever: those come only
from Rafał exporting a real, rehearsed workflow out of n8n. A hand-written
`.json` that never ran in n8n is not a fallback and this skill does not
produce one — see §10 and §13.

## 2. Two modes: what triggers each, what each may write

This skill has two entirely separate flows. Tell Rafał plainly, at the end
of every run, which one just executed (§15).

| | **Design mode** | **Approve mode** |
|---|---|---|
| Triggered by | `/live-demo [event]` — no `approve` argument | `/live-demo approve [event]` |
| Does | Runs the design conversation (§7) and drafts every asset from scratch or from a revision | Skips the conversation entirely; inspects `workflows/` for a rehearsed export (§13) |
| May write | the spec doc, `seed/*`, `prompts/*`, `workflows/KONWENCJE.md`, `status.demo`, `documents.demo` (§5-§11) | `status.demo` only — nothing else, ever (§14) |
| Can set `status.demo` to `approved`? | **Never.** A design-mode run ends at `draft` at most — see §11 | **Only this mode can**, and only after §13's checks pass and Rafał confirms (§14) |
| Reads | `documents.concept`, `status.concept` | `documents.demo`, `status.demo`, the contents of `workflows/` |

The reason for the split: a demo becomes real only when a rehearsal in n8n
has produced a working export. Design mode cannot know that happened — it
only ever produces the plan and the seed material. Approve mode is the only
place in this skill where `status.demo: approved` can be written, and it
writes nothing else.

An argument of exactly `approve` (optionally followed by an event argument)
selects approve mode. Any other argument, or no argument, selects design
mode.

## 3. Path resolution rule — read this before touching any `documents.*` field

`docs/superpowers/specs/` is not renamed to a uniform pattern once a spec
exists there — the same argument `live-concept`'s SKILL.md §2 makes for
`knowledge-base/marketing/` applies here. The September event's own spec is
`docs/superpowers/specs/2026-09-13-demo-live-2026-09-21-design.md`; the
August event's is `docs/superpowers/specs/2026-08-13-demo-live-agenci-ai-design.md`.
Neither matches a single predictable pattern, and neither is
ever renamed to match one invented later.

1. **If `documents.demo` holds a path, that path is the spec.** Read it
   directly. Never pattern-match a filename.
2. **Only when `documents.demo` is `null` is there no spec yet.** A naming
   pattern applies only to a spec this skill is about to create:
   `docs/superpowers/specs/<YYYY-MM-DD>-demo-live-<slug>-design.md`, where
   the date is *today* (the day this run composes the document, not the
   broadcast date) and `<slug>` is the event's own `slug` field from
   `live.yaml` — the same identifier `live-concept` and `live-plan` already
   use to name their own new documents, and the one guaranteed not to
   collide across events.
3. **The moment a new spec is created, its path is written into
   `documents.demo` in the same write as the status change** (§11). A spec
   on disk that the manifest does not point at is invisible to `live-script`
   and to every other later reader.

`seed/`, `prompts/` and `workflows/` are different: they are not
`documents.*` fields, and nothing about them needs to be guessed. `live-new`
creates all three as fixed, permanent locations under
`live-events/<date>-<slug>/` for every event, before this skill ever runs.
Read and write their contents by that fixed relative path — never search for
them elsewhere, and never invent an alternate location.

## 4. Resolving the event argument

Both modes accept the same three forms: a full folder path
(`live-events/<date>-<slug>/`, trailing slash tolerated), a bare folder name
(`<date>-<slug>`), or a bare date (`<date>`) — matched against the folder
names under `live-events/`. In approve mode, this argument comes after the
literal word `approve` (`/live-demo approve 2026-09-21`); in design mode it
is the only argument (`/live-demo 2026-09-21`).

- Exactly one match → proceed with that event.
- Zero matches → say so plainly and ask Rafał to name the event.
- More than one match — cannot happen for a bare date or a full/bare folder
  name (both unique by construction); if it ever does, list every match and
  ask Rafał to pick.
- **No argument at all** — each mode has its own default; see §5 (design
  mode) and §12 (approve mode).

---

# Design mode

## 5. Gate: `status.concept` must be `approved`

**No-argument default.** List every `live-events/*/live.yaml` whose
`status.concept` is `approved` and whose `status.demo` is **not** `approved`
(`missing` or `draft`) — these are the events where demo design is actually
actionable. Exactly one such event → use it, announcing which. None → say
plainly why (no event has an approved concept yet, or every event with one
already has an approved demo) and ask Rafał which event to work on. More
than one → ask Rafał to pick, naming them.

Once an event is resolved (by argument or by the default above), read its
`live.yaml` and check `status.concept` before doing anything else — this is
a hard gate, not a warning, matching `live-plan`'s own gate on the same
field:

- **Not `approved`** (`missing` or `draft`) → stop. Name the event, name the
  exact current value of `status.concept`, and, per §3's rule for
  `documents.concept`, whether it is `null` or points at a draft. Say
  plainly that a demo needs an approved concept to know what it must prove.
  Do not proceed to §6. Rafał's next step is `/live-concept`, not this
  skill.
- **`approved`** → continue to §6.

## 6. Does a demo spec already exist

Per §3, if `documents.demo` is not `null`, that path is the existing spec —
read it in full:

1. Show Rafał a short summary — what the demo currently proves, the two
   counterparties (working and failing), the current step count — together
   with the current `status.demo` value.
2. Ask explicitly: work from it and revise, or leave it alone.
   - **Leave it alone** → stop here. Write nothing, change nothing in
     `live.yaml`. `git status --short` stays exactly as it was.
   - **Revise, and `status.demo` is `draft`** → nothing was signed off yet,
     continue straight to §7.
   - **Revise, and `status.demo` is `approved`** → tell Rafał plainly that
     continuing will drop `status.demo` to `draft` until a fresh rehearsal
     and a fresh `approve` run sign it off again, and get one explicit
     confirmation of that specific consequence before touching anything. On
     confirmation, write `status.demo: draft` immediately — a small,
     isolated edit, independent of §11's larger write, so the manifest never
     claims an approved demo while its spec is mid-revision. Declining is
     the same as leaving it alone: stop, write nothing.

If `documents.demo` is `null`, there is nothing to confirm — continue
straight to §7; this run creates a new spec (minted per §3 once §11 writes
it).

## 7. Design conversation

One question per message, never batch. Read `documents.concept` in full
first — it is the only source for what the demo must prove; never invent a
selling point the concept doesn't support. Then ask, in this order:

1. **What must this demo prove** — tie it back to the concept's own promise
   and to whatever the previous event's report flagged as missing (if a
   previous event exists and its report is readable).
2. **What is the trigger** — the event that starts the demo (a message
   arriving, a file appearing, a schedule) and the concrete channel it
   arrives on.
3. **Which systems appear** — every tool the agent will have available, in
   plain terms (a log/register it can check, a channel it can write to, an
   action that needs a human's approval, a fallback action for when approval
   is refused).
4. **Which step is designed to fail, and why.** A demo with no planned
   failure teaches nothing about the agent's limits — do not accept an
   answer that skips this question, and do not let "it should just work"
   stand in for a real answer. The failing path needs its own reason the
   agent cannot paper over (missing data, an unfamiliar counterparty,
   anything that forces an honest "I don't know" rather than a guess).

Once these four are answered, keep asking — still one at a time — for
whatever concrete detail §8-§10 need and the conversation hasn't produced
yet: the viewer's fictional company and industry (dull on purpose — every
viewer should recognize the situation without knowing the industry), the
working counterparty's name and history (at least two prior entries at the
same terms, so a viewer believes the comparison), the failing counterparty's
identity and exactly what is missing from its document, the concrete numbers
(chosen so the arithmetic is trivial — a round percentage, a round
difference — because the model has to produce them live, not this skill),
and the literal sentence the agent must say when it notices the discrepancy.

## 8. Seed data

Draft, in context, fictional and dull-industry data, consistent across every
file — the same company names, dates and numbers must match everywhere they
recur (a register entry, a document, a message on screen). Typical set,
adapted to what §7 established (not every demo needs all of these; none of
this is a fixed checklist to satisfy blindly):

- a register/log file (CSV) the agent can query, with a handful of prior
  entries — at least two for the working counterparty, at the same terms;
- one plain-text file per inbound message (mail, form, whatever the trigger
  is), one for the working path and one for the failing path;
- one HTML file per document that needs to reach the agent as a PDF (an
  invoice, a pro forma, an offer) — write the HTML, not the PDF, by hand;
- a PowerShell export script next to the HTML files, shaped like
  `live-events/2026-09-21-mail-z-zalacznikiem/seed/export-pdf.ps1`: headless
  Chrome/Edge, `--print-to-pdf`, one page per document, **rendered with a
  text layer** so n8n's Extract from File reads it without OCR. Adapt the
  script's file-name list to this event's own documents; do not reuse
  Kowalczyk/Wiśniewski names for a different event's story.

**Then run the script once**, so `seed/` ends up holding the rendered `.pdf`
files next to their `.html` sources — not just the HTML and the script. A
`seed/` that n8n cannot actually read in a rehearsal because nobody rendered
the PDF yet is not the deliverable; the September event's own `seed/` holds
both `proforma-A-kowalczyk.html` and `proforma-A-kowalczyk.pdf`, and this
skill's output must match that shape.

## 9. Prompts

Draft three files under `prompts/` — the September event's `prompts/` holds
exactly these three, and all three are this skill's to produce:

1. **The agent system prompt** (`agent-system-prompt.md`) — who the agent
   is, what it must extract, when it must consult the register **before**
   judging the new document's terms, what it is never allowed to do (send
   without approval, confirm on the company's behalf, invent missing data),
   and the exact shape of the comparison sentence and the closing report to
   the human. No template governs this file's shape — draft it from §7's
   answers, matching `live-events/2026-09-21-mail-z-zalacznikiem/prompts/agent-system-prompt.md`'s
   structure (numbered "how you work" steps, a
   "not allowed to" list, a worked example of the one sentence that matters
   most).
2. **The tool descriptions** (`narzedzia-opisy.md`), from
   `templates/tool-descriptions.md`. One block per tool the agent has under
   it. The description text is the entire contract between the model and
   the tool — it is what decides the order the agent reaches for things in,
   not the system prompt. State this in the file itself, the way the
   template does.
3. **The approval-request and report message** (named `<channel>-prosba-o-zgode.md`,
   e.g. `telegram-prosba-o-zgode.md`) — the literal text the
   human sees on the approval channel, built from the same field names the
   sending tool exposes (`$tool.parameters.*` or equivalent), plus the
   short closing report sent after the human's decision, for both the
   accepted and the refused outcome. No template governs this file either —
   draft it directly, and copy its literal message text verbatim into the
   spec's §3 ("Wiadomość na ekranie/telefonie") so the two never drift
   apart.

## 10. Workflow conventions

Write `workflows/KONWENCJE.md` fresh for this event — it is not a shared
file copied between events; the August and September events each have (or,
for September, will have) their own, naming their own nodes and their own
credentials. Cover, at minimum:

- **Node naming**: nodes are named in Polish, in human terms, matching
  exactly what the tool-descriptions file (§9.2) calls them and what the
  spec's §3 shows on screen — the viewer reads the canvas during "klocek po
  klocku", not the presenter.
- **Credentials by name only.** List the actual credential names this event
  needs (e.g. `google-demo-gmail`, `telegram-demo`, `<model>-demo`), one
  per external account/service. State plainly: **no token, key or secret
  value ever appears in a workflow file or in this file** — a credential is
  a name, resolved inside n8n, exactly as
  `live-events/2026-08-27-agenci-ai/workflows/KONWENCJE.md` (Zasada 3) already established for the August
  event.
- **What the export must contain**: the whole workflow, including any
  sub-workflow it calls, downloaded from n8n's canvas (menu → Download)
  *after* a rehearsal has actually run it successfully — never assembled by
  hand. State this rule explicitly, in these terms: **a hand-written `.json`
  that never passed through n8n is not a fallback, no matter how carefully
  it is written** — this is the lesson
  `live-events/2026-08-27-agenci-ai/workflows/README.md` already paid for (three hand-written option files
  that were never a real gotowiec until a rehearsal produced a real export).
  This skill never writes workflow JSON itself, in either mode; §13
  confirms an export exists, it never creates one.

## 11. Gate: show, then write

Show Rafał everything composed so far in one message: the full spec (all
eleven sections), every seed file, all three prompt files, and
`workflows/KONWENCJE.md`. Exactly two outcomes — **not three**, unlike
`live-concept` and `live-plan`, because this gate can never certify
`approved` (§2):

- **Decline** — anything short of a clear yes to saving. Write nothing to
  disk, change nothing in `live.yaml`. The working tree is exactly as it
  was before this run (beyond the isolated `draft` edit from §6, if that
  path was taken).
- **Save but do not sign off** — write the spec per §3 (existing path if
  revising, the freshly minted `docs/superpowers/specs/<date>-demo-live-<slug>-design.md`
  if creating), write every seed and prompt file, write
  `workflows/KONWENCJE.md`, set `status.demo: draft`, and — only when a new
  spec was just created — write its path into `documents.demo` in this same
  write (§3 rule 3). Render the PDFs (§8) as part of this same step, not
  before Rafał has said yes.

There is no third outcome here. `status.demo` never becomes `approved` as a
result of this gate, on a first run or any later one — only §14 can do that,
and only after a real rehearsal.

---

# Approve mode

## 12. Precondition: a design must exist

**No-argument default.** List every `live-events/*/live.yaml` whose
`status.demo` is `draft` — these are the events where a rehearsal might
plausibly have just happened. Exactly one → use it, announcing which. None →
say so (no event has a draft demo waiting on approval) and ask Rafał which
event to check. More than one → ask Rafał to pick, naming them.

Once an event is resolved, read its `live.yaml`:

- **`status.demo` is `missing`** → refuse. Name the event and say plainly
  that no demo design exists yet — `documents.demo` is `null` — so there is
  nothing here to approve. Point at design mode (`/live-demo`) as the next
  step. Write nothing.
- **`status.demo` is `draft` or `approved`** → continue to §13 either way.
  (`approved` means Rafał is re-checking an export that changed since the
  last approval — still worth re-verifying, never skip §13 just because the
  status already says `approved`.)

## 13. Verify the export

List `<event>/workflows/`. Apply these checks in order, stopping at the
first failure and reporting exactly which one fired:

1. **At least one file ending in `.json`.** `.gitkeep` does not count, and
   neither does any other extension. Zero such files → refuse: name the
   directory as empty (list whatever *is* there, even if that is only
   `.gitkeep`) and say plainly that a rehearsal in n8n, followed by a real
   export, has to happen before this mode can do anything. This is the
   September event's own current state — `workflows/` holds only
   `.gitkeep`.
2. **Each `.json` file parses as JSON.** A file that fails to parse is
   refused by name, with the parse error quoted verbatim — it is not a real
   export, whatever its extension claims.
3. **No credential values beyond names.** Walk the parsed document. Flag as
   a Critical finding: any object key matching
   `/(token|api[_-]?key|password|secret)/i` — the same pattern
   `tools/course-pipeline/src/validate-live-yaml.mjs` applies to
   `environment.*` — anywhere in the file; and any `credentials.<node>.<type>`
   object holding a key other than `id` or `name` (the only two
   keys a real n8n export ever writes there). Either condition refuses the
   file by name and quotes the offending key path.

Only if every `.json` file in `workflows/` clears all three checks does this
section end cleanly. Report to Rafał, plainly: which file(s) were found,
that they parse, the node names and credential names referenced inside (by
name only — never print a credential's `id` value or any other field as if
it mattered, since only the name is meaningful to a human reader), and that
no secret-shaped field was found.

**Exception: a failure here while `status.demo` is currently `approved`.**
The manifest is claiming a rehearsed, clean export exists, and this check
just found otherwise — that is a Critical finding in its own right, worse
than an ordinary refusal, because `live-script` may already be proceeding on
the strength of that stale `approved` status. State this explicitly, and ask
Rafał whether to drop `status.demo` to `draft` now so the manifest reflects
reality. This is the one write approve mode makes on anything short of a
clean §13 pass — everywhere else, a failed check means stop and write
nothing (§14).

## 14. Gate: report, then approve

After §13 reports cleanly, ask Rafał explicitly whether to approve.

- **Anything short of a clear yes** — write nothing. `status.demo` stays
  exactly what it was (`draft`, or `approved` if this was a re-check).
- **Yes** — write `status.demo: approved` to `live.yaml`. Nothing else
  changes: `documents.demo` already holds the spec's path from design mode
  and is left untouched; no file under `seed/`, `prompts/` or `workflows/`
  is written or modified by this mode, ever.

If §13 refused at any check, there is no approval to offer — say so plainly
and stop; do not ask the yes/no question at all when the export itself
failed verification. The one exception is §13's own carve-out: a refusal
while `status.demo` was already `approved` still asks one yes/no question,
but a different one ("drop `status.demo` to `draft` to match reality?"), and
a **yes** there writes `draft`, never `approved` — this is not the mode's
approval question, it is damage control for a manifest that is currently
lying about its own demo.

---

## 15. Closing

After any write, in either mode:

1. Validate: `node tools/course-pipeline/src/validate-live-yaml.mjs` from
   the repository root (or `npm run validate-live` from
   `tools/course-pipeline`). Fix and rewrite before reporting success if it
   flags this event's manifest.
2. State plainly that everything is left uncommitted.
3. **Say explicitly which mode just ran** — design or approve — and what it
   did and did not touch, per §2's table.
4. **Design mode**, ending at `draft`: say plainly that `live-script` stays
   blocked until a rehearsal in n8n produces a real export and `/live-demo
   approve` confirms it — this run alone can never unblock it.
5. **Approve mode**, ending at `approved`: say plainly that `live-script`'s
   gate on `status.demo` is now satisfied and Rafał can move on to it.

## Rules

- One question per message during the design conversation (§7) — never
  bundle two of the four required questions, or a follow-up, into one
  prompt.
- **Never guess a filename under `docs/superpowers/specs/`.** Every read of
  an existing spec goes through `documents.demo` (§3); a newly minted path
  is written back into `documents.demo` in the same write that changes
  `status.demo` (§11).
- **This skill never writes a workflow `.json` file, in either mode.** Only
  Rafał's own export out of n8n, after a rehearsal, produces one. Design
  mode writes `workflows/KONWENCJE.md` and nothing else under `workflows/`;
  approve mode writes nothing under `workflows/` at all.
- **`status.demo` can become `approved` only in approve mode (§14), never in
  design mode's gate (§11)**, no matter how confident the design looks — an
  approved status asserts a rehearsal happened, and design mode has no way
  to know that.
- A demo with no deliberately failing path is refused at §7 — keep asking
  until Rafał names one, per §7 item 4.
- `status` values are exactly `missing`, `draft`, `approved` — nothing else.
- Template comments (`<!-- -->`) in `templates/demo-spec.md` and
  `templates/tool-descriptions.md` never survive into a written document —
  they are worked examples to replace, not content to keep.
- Secrets never enter any file this skill writes. A field name matching
  `token|api[_-]?key|password|secret` anywhere in `seed/`, `prompts/`,
  `workflows/KONWENCJE.md` or the spec is a defect in this skill's own
  output, not just a thing to check for in someone else's export.
