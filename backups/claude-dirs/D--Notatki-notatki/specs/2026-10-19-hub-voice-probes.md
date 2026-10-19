# Hub voice — probe report

**Index:** [.claude/projects/hub.md](../projects/hub.md)
**Spec:** [2026-10-18-hub-voice-design.md](2026-10-18-hub-voice-design.md) (§10 probes)
**Plan:** [2026-10-19-hub-voice-plan-1-probes.md](../plans/2026-10-19-hub-voice-plan-1-probes.md)

Results of Plan 1, quoted verbatim where Rafal decides on them. Probe tools live in
`C:/Users/rafal/hub-probes/voice/` (throwaway, not committed); voice probes fork only sessions of
the sandbox repository `C:/Users/rafal/hub-probes/repo`.

## Preliminary findings

- Versions (2026-10-19): `node --version` → `v24.20.0`; `claude --version` →
  `2.1.302 (Claude Code)`; `claude --help` lists `--input-format`.
- `ELEVENLABS_API_KEY` was set neither in the executing session nor in the User environment at
  the start of the plan.
- `claude-haiku-5-5` is on ElevenLabs' `prompt.llm` list (agents create API reference), which the
  research of 2026-10-17 missed; on 2026-10-19 Rafal chose `claude-haiku-5-5` instead of
  `claude-haiku-4-5` for the probes.
- Seed session `7210f405-4a57-458a-ac48-09c1f0cc2615` in the sandbox repository, created with
  `claude -p --session-id`. Its one answer came in the global answer format (`## …`,
  `### 🎯 STATUS / DECYZJA`), which is what the voice role must override (spec §8).

## Fork boundary in `-p`

Tool: `VOICE/tools/boundary.mjs`; fork of the seed session in the sandbox repository, voice
`fork-settings.json` (written fork's rules plus `Read(**/<denylist name>)`), dialog directories
under `~/.claude/hub/projects/repo/dialogs/2026-10-19-voice-boundary*`. Five attempts: write in the
repository, write in the dialog directory, Read `.env`, Read `Server.PEM`, Grep for
`VOICE_PROBE_SENTINEL`.

| Permission mode | Exit, wall time | Repo write | Dialog write | `.env` | `Server.PEM` | Grep | Sentinels in stream |
|---|---|---|---|---|---|---|---|
| none given (default) | 0, 64 s | refused | **refused** | refused | refused | allowed, `No matches found` | none |
| `acceptEdits` | 0, 54 s | refused | **refused** | refused | refused | allowed, `No matches found` | none |
| `auto` | 0, 63 s | refused | **accepted** | refused | refused | allowed, no match quoted | none |

Refusal messages, verbatim from the fork's own report (default mode):

- repository write, `.env`, `Server.PEM`: `File is in a directory that is denied by your permission settings.`
- dialog write: `Claude requested permissions to edit C:\Users\rafal\.claude\hub\projects\repo\dialogs\2026-10-19-voice-boundary\probe-dialog-write.txt which is a sensitive file.`

`permission_denials` of the `result` event list exactly the refused attempts in each mode (four in
default and `acceptEdits`, three in `auto`). No run hung: a refusal in `-p` ends the attempt rather
than waiting for an answer.

Result: the acceptance criterion of spec §8 passes only with `--permission-mode auto`. Without it,
Claude Code treats a write under `~/.claude` as a sensitive file and, with nobody to answer in
`-p`, refuses it. Probe S12 of the hub saw no such refusal for `--bg` forks, which inherited
`auto` from the account default (hub spec §6.5, open point d). The `Read` denies hold in every
mode, `Server.PEM` included, and Grep did not surface the `.env` sentinel. Later probes run the
voice fork with `--permission-mode auto`.

## Round trip and latency

Pending.

## End and wake-up

Pending.

## Polish without the fork

Pending.

## Vendored client

Pending.

## Haiku and Sonnet

Pending.

## End to end

Pending.

## Minutes ledger

| Probe | Conversation | Seconds |
|---|---|---|

## Conclusions for Plan 2

Pending.
