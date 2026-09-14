---
name: live-new
description: Scaffold a new live event — creates live-events/YYYY-MM-DD-slug/ with its directory skeleton, live.yaml manifest and README. Use when Rafał starts work on a new live broadcast ("nowy live", "zaczynamy live", "załóż folder na live"). NOT for an event that already has a folder — the per-stage skills live-concept, live-demo, live-script, live-boards, live-gift and live-report work on an existing one.
---

# /live-new — scaffold a new live event

Result: a new `live-events/YYYY-MM-DD-slug/` directory with its six-folder
skeleton, a `live.yaml` manifest (every `status` key `missing`) and a starter
`README.md`. This skill produces no stage artifact — no concept, no demo, no
script. That work starts with `/live-concept` on the folder this skill leaves
behind.

## 1. What this skill owns

The event's directory and its two orientation files: `live.yaml` and
`README.md`. Nothing else. It never touches `documents.*` (every value stays
`null`) and never sets a `status.*` key above `missing` — those move only
when the per-stage skill for that stage runs and Rafał approves its output.

## 2. Inputs to ask for, one question per message

Ask in this order, one question per message:

1. **Broadcast date**, ISO (`YYYY-MM-DD`). If Rafał answers in another
   unambiguous format ("31 grudnia 2026"), normalize it yourself — don't
   spend a turn asking him to retype it.
2. **Start time**, `HH:MM`, 24h.
3. **Working title** — the name of the event as of today; it does not have
   to be the final marketing title.

Check the date against today's date as soon as you have it (see §3) before
asking for the time — no point collecting more input for an event that gets
refused.

Once you have the title, derive `slug`:

- transliterate Polish diacritics to ASCII: `ą→a ć→c ę→e ł→l ń→n ó→o ś→s ź→z
  ż→z` (same map upper-case, then lower-case the whole string);
- lower-case everything;
- replace every run of whitespace or punctuation with a single `-`;
- drop any character outside `[a-z0-9-]`;
- collapse repeated `-` and trim leading/trailing `-`.

Show the derived slug to Rafał for confirmation ("slug: `test-skilla` — pasuje,
czy wolisz inny?") before moving on. The folder name is `<date>-<slug>`.

## 3. Refuse-and-report conditions

Check these as soon as the relevant input is known; stop at the first one
that fires, explain which condition triggered and why, and do not ask
anything further in that run:

- **The date is in the past.** `date` before today → refuse, ask for a real
  future date if Rafał wants to try again in a new run.
- **A folder for that date already exists.** Any `live-events/<date>-*`
  directory, regardless of its slug, means this date is already taken — name
  the existing folder and point at the per-stage skills (`/live-concept` etc.)
  as the way to keep working on it. Do not merge into it and do not create a
  second folder for the same date.
- **The slug collides with an existing folder.** The derived slug matches the
  slug portion of a *different* date's folder — name that folder and ask
  Rafał for a different working title (a shared slug would make anything
  that refers to an event by slug alone ambiguous).

## 4. Directory skeleton and starter README

Once the plan is approved (§6), create:

```
live-events/<date>-<slug>/
├── seed/
├── prompts/
├── workflows/
│   └── .gitkeep
├── runbook/
├── plansze/
└── prezent/
```

Only `workflows/` gets a `.gitkeep`: the other five folders are populated by
the very next skills to touch this event (`live-demo`, `live-script`,
`live-boards`, `live-gift`), while `workflows/` legitimately stays empty
until the first successful n8n export — exactly the state
`live-events/2026-09-21-mail-z-zalacznikiem/workflows/` is in today. Empty
directories are not tracked by git either way; `.gitkeep` just keeps the
folder present on disk for the first person who looks for it.

Also write `live-events/<date>-<slug>/README.md`, short and in Polish (it is
read alongside the event material, like every other file in this tree):

- title line, e.g. `# Live <DD.MM.YYYY>: "<title>"`;
- one line saying the folder was created by `/live-new` and nothing is
  decided yet;
- a "Struktura" list, one line per directory from the skeleton above, naming
  which skill fills it (`seed/`, `prompts/`, `workflows/` → `/live-demo`;
  `runbook/` → `/live-script`; `plansze/` → `/live-boards`; `prezent/` →
  `/live-gift`);
- a "Środowiska" section with `(uzupełnij ...)` placeholders for the n8n
  workspace, the Telegram bot, the demo chat id and the ElevenLabs voice —
  this is prose for a human, so a placeholder string is fine here (see the
  note on `live.yaml` in §5); tell Rafał to fill these in before the first
  rehearsal and then mirror the real values into `live.yaml`'s
  `environment.*` keys;
- closing line pointing at `/live-concept` as the next step.

## 5. Manifest to write

`live-events/<date>-<slug>/live.yaml`, same eight top-level keys as every
other manifest in this repo (emulate
`live-events/2026-08-27-agenci-ai/live.yaml`):

```yaml
date: <date>
time: "<time>"
title: "<title>"
slug: <slug>
promise: "(TBD — do ustalenia w /live-concept)"
status:
  concept: missing
  prework: missing
  demo: missing
  script: missing
  boards: missing
  gift: missing
  report: missing
documents:
  concept: null
  prework: null
  demo: null
  script: null
  boards: null
  gift: null
  report: null
environment:
  n8n_workspace: null
  telegram_bot: null
  demo_chat_id: null
  elevenlabs_voice_id: null
```

Two things that are *not* obvious from the shape above, both worth stating
because getting them wrong reads as "close enough" and isn't:

- **`environment.*` values are real YAML `null`, never the string
  `"(uzupełnij)"`.** `environment.*` is typed as identifiers and URLs read
  by other tooling; a placeholder string sitting in that slot would be
  indistinguishable from a real workspace name to the first thing that reads
  it programmatically. `null` is the true, absent value — the readable
  reminder to fill it in belongs in the README's prose (§4), not in the
  manifest's data. This mirrors the August and September manifests exactly:
  both carry real `null`s for their still-unknown environment values.
- **`promise` cannot be empty or missing.** The validator (§7) rejects a
  blank `promise`, but this skill never asks for one — the real promise gets
  decided in `/live-concept`, grounded in the previous event's numbers. Write
  the literal placeholder `"(TBD — do ustalenia w /live-concept)"` so the
  manifest validates, and say so plainly when you report what was created.

## 6. Gate

Before writing anything, show Rafał the full plan in one message:

- the folder path (`live-events/<date>-<slug>/`) and the six-directory
  skeleton from §4;
- the full `README.md` you intend to write;
- the full `live.yaml` you intend to write.

**Write only after Rafał approves.** Anything short of a clear yes — silence,
a request to change something, an explicit "nie" — is a decline: create
nothing (no directory, no `.gitkeep`, no files) and say so in one line. A
declined run leaves the working tree exactly as it was; correcting and
re-running is the only path back to §4.

## 7. Closing

After writing the skeleton, the README and the manifest:

1. Validate the new manifest against the fixed contract:
   `node tools/course-pipeline/src/validate-live-yaml.mjs` run from the
   repository root (equivalently `npm run validate-live` from
   `tools/course-pipeline`). It walks every `live-events/*/live.yaml`, so a
   clean run means the new manifest is well-formed *and* the two existing
   events are untouched. Fix and rewrite before reporting success if it
   reports an error against the new file — nothing else in the repo should
   be touched to make it pass.
2. List exactly what was created (folder, six sub-directories, `README.md`,
   `live.yaml`).
3. State explicitly that everything is left uncommitted — committing is
   Rafał's own step, not this skill's.
4. Point at `/live-concept` as the next step for this event.

## Rules

- One question per message during input-gathering (§2) — never bundle date,
  time and title into a single prompt.
- `status` and `documents` always carry exactly the seven stage keys
  `concept`, `prework`, `demo`, `script`, `boards`, `gift`, `report` — no
  more, no fewer, same order every time, matching every other manifest in
  `live-events/`.
- Never invent a value this skill has no way of knowing (an n8n workspace
  URL, a bot handle, a real promise). An honest `null` or a clearly-marked
  placeholder beats a guess that later gets mistaken for fact.
