# Orchestrator hub — probe report

**Spec:** `2026-10-13-orchestrator-hub-design.md` §9.2
**Plan:** `.claude/plans/2026-10-13-orchestrator-hub-plan-1-probes.md`
**Sandbox:** `C:/Users/rafal/hub-probes/`

Each section: question, method, raw result (verbatim), verdict (pass / fail / partial),
fallback taken, spec impact.

## Preliminary findings (plan writing, 2026-10-13, scratch directory)

- Five processes appending 20 lines each to one file within one second: 100 well-formed lines,
  0 broken, in 3 of 3 runs.
- A watcher stopped mid-burst and a second watcher with a catch-up scan: the second saw 100 of
  100 ids, in 3 of 3 runs.
- Concurrent `renameSync` of temp files onto the same `.last.md`: 5–6 of 25 renames per run
  failed with `EPERM`. Spec §5.1 writes `.last.md` by temp file and rename, so this needs a
  decision (retry with backoff, or one last-message file per `Stop` event).
- `claude agents --json`: p50 164 ms, p95 173 ms over 3 runs; keys `cwd, id, kind, name, pid,
  sessionId, startedAt, state, status`; `status` values seen `idle`, `busy`; `state` seen
  `blocked`; no `waitingFor` key in that output.
- `codex exec --json` emits `thread.started` with `thread_id`; with a reviewer instruction in the
  prompt Codex ran no agent while the contract was still in place.

## S1 — hooks in a VS Code panel session, payload fields
## S2 — cost of the PostToolUse hook
## S3 — fs.watch reliability, concurrent writes, claude agents --json
## S4 — SendMessage and the recipient
## S5 — Monitor expiry wakes an idle hub
## S6 — fork launch
## S7 — write boundary of the fork
## S8 — role file survives /clear
## S9 — Codex follow-up sandbox and working directory
## S10 — background session in a new worktree
## S11 — gate marker smoke test

## Summary

| Probe | Verdict | Fallback taken | Spec impact |
|---|---|---|---|
