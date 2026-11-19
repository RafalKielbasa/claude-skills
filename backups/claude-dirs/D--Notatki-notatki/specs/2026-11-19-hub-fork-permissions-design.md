# Hub fork permissions: absolute deny for the fork's working directory

**Index:** [projects/hub.md](../projects/hub.md)

A short design (small change). It repairs a regression in `hub-voice` (`/talk`) and `hub-core`
(written dialogs started by the hub) that appeared with a Claude Code update.

## 1. Intent

Since Claude Code 2.1.326 the voice fork of `/talk` cannot write `decisions.md`, `open-questions.md`
or `prompt.md` into its dialog directory. Every decision Rafal confirms by voice stays only in
`transcript.md`, the closing report shows `(not written)`, and the source session gets neither the
decisions nor the work order. Rafal wants voice decisions recorded again, in every project where
`/talk` runs, and wants a future regression of this kind to be visible at once instead of after
days.

## 2. What is known

Verified in session `b352c64f` (2026-11-19):

- The fork of dialog `claude/2026-11-19-1215-talk` (log
  `~/.claude/projects/C--Users-rafal--claude-hub/5d9c109a-….jsonl`) called
  `Write …\2026-11-19-1215-talk\decisions.md` and got
  `File is in a directory that is denied by your permission settings.`
- Fork logs on Claude Code 2.1.318, 2.1.319 and 2.1.322 (up to 2026-11-12) have no denial; every
  fork on 2.1.326, 2.1.327 and 2.1.328 that tried to write a decision got this denial
  (dialogs `code-busters/2026-11-17-0931`, `code-busters/2026-11-17-1314`,
  `claude/2026-11-19-1215`).
- The fork settings did not change between a working and a failing dialog: `allow
  Edit(//c/…/dialogs/<dialog>/**)`, `deny Edit(./**)`, `Bash`, `EnterWorktree` and the secret reads
  (`talk/lib/settings.mjs:11-17`). `~/.claude/settings.json` has no `permissions` key.
- The hub's written dialog uses the same deny `Edit(./**)` with the settings file in the dialog
  directory (`hub/lib/dialog.mjs:30-33`, `hub/bin/hub.mjs:497-498`).

From the diagnosis of session `a3b708e6` (code-busters, 2026-11-18), not repeated here:

- Hypothesis: Claude Code now resolves `./` in a `--settings` file against the settings file's
  directory, not the working directory. `fork-settings.json` lies in the dialog directory, so the
  deny covers exactly that directory, and deny wins over allow.
- Probes H1 and H2 (`run.sh` in that session's scratchpad): with the deny written as the absolute
  path of the working directory, a write into the allowed directory passed and a write into the
  working directory was refused with the deny message. Both ran on drive C:, in a path without
  spaces, with the settings file outside the target directory. The production layout (drive D:,
  a path with a space, a worktree, the settings file inside the dialog directory) is untested.

## 3. Goals, non-goals, anti-goals

Goals:

- The voice fork writes `decisions.md`, `open-questions.md` and `prompt.md` again, in every
  working-directory layout `/talk` is used from: a repository on D: without spaces (`notatki`,
  `code-busters`, `fit-body-business`), a path with a space (`baza-wiedzy`), a worktree under
  `.claude\worktrees\<name>`, and `~/.claude` or `~/.claude/hub`.
- The hub's written dialog is no longer hard-denied when it writes into its dialog directory.
- A write the fork was refused shows up in the `/talk` closing report, by path.

Non-goals:

- The `/talk` allowlist (`talk/config.json`) stays as it is.
- Protection of a worktree's main checkout stays at the level before the regression: the deny
  covers the worktree, the main checkout is protected by `default` mode refusing every write
  without an allow rule (voice fork) or by a permission prompt (written hub fork).
- The sensitive-file prompt Claude Code raises for paths with a `.claude` segment (hub written
  dialogs live in `~/.claude/hub/projects/…`) is not addressed.
- Decisions from the dialogs of 2026-11-17 and 2026-11-19 are not recovered; they stay in their
  `transcript.md`.

Anti-goals (a failure even if writes work):

- The fork can write anywhere outside its dialog directory that it could not write before the
  regression.
- A refused write ends with `(not written)` in the report and nothing else.

## 4. Approaches

| | Approach | Trade-off |
|---|---|---|
| **A (chosen)** | Absolute deny for the working directory in `talk` and `hub`, the denial guard in the `/talk` report, and a live probe in the four working-directory layouts as an acceptance condition | Most files (about 7 in `~/.claude/skills`), about 8 `claude -p --model haiku` calls; every layout confirmed by a probe, the next regression visible in the report |
| B | The same deny change in `talk` and `hub`, unit tests only | Cheapest; the space and worktree layouts stay unverified, the next regression is silent again |
| C | The deny change in `talk` only | The hub's written dialogs stay broken |

Rafal chose A on 2026-11-19 (decision „Zakres naprawy reguły deny forków”). Rejected without a
variant: moving `fork-settings.json` out of the dialog directory and keeping `./**`, because it
relies on how Claude Code resolves `./`, which is exactly what changed.

## 5. Design

### 5.1 Voice fork settings (`talk`)

- `voiceForkSettings(dialogDir, cwd)` and `writeVoiceForkSettings(dialogDir, cwd)`
  (`talk/lib/settings.mjs`): the deny `Edit(./**)` becomes `Edit(<posixPath(cwd)>/**)`, the same
  `//<drive>/…` form the allow rule already uses. Everything else in the settings stays.
- Every caller passes the source session's working directory (the bridge's `cwd`, which is also the
  fork's `cwd` in `startFork`), and `test/live/boundary.mjs` passes its `REPO`.
- `check` and `start` refuse, with one Polish sentence (exit 2), when the dialog directory would lie
  inside the working directory, the same rule as `hub/bin/hub.mjs:494`. With the deny on the
  working directory such a dialog directory would be unwritable. (Author's call: with today's
  `dialogRoot` and allowlist the case cannot occur; the check keeps the claim „every layout”
  true if either changes.)

### 5.2 Hub written fork settings (`hub`)

- `forkSettings(dialogDir, cwd)` (`hub/lib/dialog.mjs:30`): the deny becomes
  `Edit(<posixPath(cwd)>/**)`; `hub/bin/hub.mjs:498` passes `cwd`; the comment at
  `hub/bin/hub.mjs:493` names the new rule.
- The allow rule moves from the `//C:/…` form to the `posixPath` form `//c/…` (author's call: the
  index of `hub-core` records that the `//C:/…` allow form does not work on Windows; the voice fork
  uses `//c/…` successfully).
- `posixPath` moves from `talk/lib/settings.mjs` to a module in `hub/lib/`, and `talk` imports it
  from there, as it already imports `DENYLIST` (author's call: one definition for both forks).

### 5.3 Denial guard in the `/talk` closing report

- `startFork` (`talk/lib/fork.mjs`) collects the `permission_denials` of every `result` line of the
  fork's stream (tool name and `file_path`, or the tool input when there is no path), without
  duplicates, and exposes them.
- The closing report (`talk/lib/report.mjs`) gets a line `denied:` after `conversations:`: `none`,
  or the refused calls as `<tool> <path>`, separated by `; `.
- `talk/SKILL.md` step 4: for every denied path, tell Rafal that the file was not written and that
  what the fork meant to write there is only in the dialog's `transcript.md` (give its path).
- The hub's written dialog gets no guard: it is an interactive fork without a stream the hub reads.

### 5.4 Specs

- The voice spec (`2026-10-18-hub-voice-design.md`, §8) and the hub spec
  (`2026-10-13-hub-core-design.md`, §6.5) get a dated amendment next to the `Edit(./**)` text
  pointing to this spec.

## 6. Acceptance

1. `node --test` passes in `~/.claude/skills/talk` and `~/.claude/skills/hub`, with the updated
   assertions in `talk/test/settings.test.mjs` and `hub/test/dialog.test.mjs` and new tests for the
   denial collection and the `denied:` line.
2. Live probe of the voice fork settings, on the production `writeVoiceForkSettings` (settings file
   inside the dialog directory), `claude -p --model haiku` with the fork's flags, in four
   working-directory layouts built as dummy directories, never in a real repository: a directory on
   D: without spaces, a directory on D: with a space, a nested `.claude\worktrees\<name>` directory
   on D:, and a directory under a `.claude` folder on C:. In each layout:
   - a write into the dialog directory creates the file;
   - a write into the working directory is refused with the deny message
     (`denied by your permission settings`), which proves the deny itself matched, not only
     `default` mode.
3. Live probe of the hub fork settings (`forkSettings`), `claude -p`: a write into the dialog
   directory is not refused with the deny message; a write into the working directory is.
4. A failed probe stops the work before hand-off; nothing the probes created is deleted.
5. Rafal runs one real `/talk` with one confirmed decision: `decisions.md` exists and the report
   says `denied: none` (ElevenLabs minutes, Rafal's run).

## 7. Constraints

- Changes in `~/.claude` land in the automatic `backup: sync` commits; no manual commit, no push.
- Probes call only `claude -p` with `haiku`; no ElevenLabs call outside Rafal's acceptance run.
- The voice fork keeps `--restricted`, the five file tools, no MCP and `default` mode.

## 8. Left to the builder

- Where the probe dummy directories live and whether the probe extends `test/live/boundary.mjs` or
  is a separate script; `boundary.mjs` refuses to run while its October output files exist, which
  are moved aside, not deleted.
- The name of the shared module for `posixPath`.
- The exact text of the Polish refusal sentence in 5.1 and of the `SKILL.md` instruction in 5.3.
