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

**Question:** does an asynchronous Node hook (`probe-hook.js`) on every tool call slow a Claude Code session on Windows? Criterion (spec §9.2): spawn `p95Ms` < 500 and median latency with hooks minus without < 100 ms (50 paired tool calls each, 50 `PostToolUse` events with hooks).

**Method:** (1) `spawn-bench.js 50`; (2) `claude -p` (haiku, 50x `node -e 0`) in the throwaway repo with project hooks, then `transcript-latency.js`; (3) the same with `.claude/settings.json` renamed to `.off` (restored afterwards).

**Raw outputs:**

```
node tools/spawn-bench.js 50
{"runs":50,"p50Ms":40,"p95Ms":44,"maxMs":49}

with hooks (session a05efe9c-1dc8-44f0-bb8b-331eeb855dfa)
{"transcript":"C:\Users\rafal\.claude\projects\C--Users-rafal-hub-probes-repo\a05efe9c-1dc8-44f0-bb8b-331eeb855dfa.jsonl","toolCalls":50,"p50Ms":104,"p95Ms":124}
grep -c '"event":"PostToolUse"' data/events/a05efe9c-....jsonl  ->  50

without hooks (session db77357a-7462-425b-a54c-69361174b9e8)
{"transcript":"C:\Users\rafal\.claude\projects\C--Users-rafal-hub-probes-repo\db77357a-7462-425b-a54c-69361174b9e8.jsonl","toolCalls":50,"p50Ms":93,"p95Ms":103}
```

**Verdict: pass.** Both runs had exactly 50 tool calls and the hooked run 50 `PostToolUse` events, so the comparison counts. Spawn p95 44 ms (< 500); median with hooks 104 ms minus without 93 ms = 11 ms (< 100). The run without hooks produced no event file (hooks truly off).

**Fallback:** not needed.

**Spec impact:** none; an async PostToolUse hook on every tool call is acceptable. Event files of both runs moved to `hub-probes/data/events-s2/`.

## S3 — fs.watch reliability, concurrent writes, claude agents --json

**Question.** Do concurrent appends to an event log lose or corrupt events? Does a directory watcher plus a catch-up scan see every event, also across a watcher restart? How do concurrent renames onto one `.last.md` behave? How fast is `claude agents --json` and what does it return?

**Method.** Tools in `C:/Users/rafal/hub-probes/tools/`. Step 1 (runs a1-a3): 100 events into separate files, one watcher running during the burst. Step 2 (runs b1-b3): 100 events into one shared file (`--shared=1`, concurrent hooks of one session), a first watcher for 0.6 s during the burst, then a second watcher for 3 s (catch-up scan plus watch). Step 3: `time-agents.js 10`.

**Raw output, step 1 (separate files, one watcher).** Per run: burst.js, watch-probe.js, count-lines.js.

```
a1
{"generated":100,"appended":100,"shared":false,"renameErrors":0,"renameErrorCodes":[]}
{"seen":100,"bySource":{"catch-up":0,"watch":100},"fsEvents":225}
{"wellFormed":100,"broken":0,"leftoverTmp":0}
a2
{"generated":100,"appended":100,"shared":false,"renameErrors":0,"renameErrorCodes":[]}
{"seen":100,"bySource":{"catch-up":0,"watch":100},"fsEvents":225}
{"wellFormed":100,"broken":0,"leftoverTmp":0}
a3
{"generated":100,"appended":100,"shared":false,"renameErrors":0,"renameErrorCodes":[]}
{"seen":100,"bySource":{"catch-up":0,"watch":100},"fsEvents":225}
{"wellFormed":100,"broken":0,"leftoverTmp":0}
```

**Raw output, step 2 (one shared file, watcher restarted).** Per run: burst.js, count-lines.js, second watcher.

```
b1
{"generated":100,"appended":100,"shared":true,"renameErrors":5,"renameErrorCodes":["EPERM"]}
{"wellFormed":100,"broken":0,"leftoverTmp":0}
second watcher: 100 {"catch-up":50,"watch":50}
b2
{"generated":100,"appended":100,"shared":true,"renameErrors":7,"renameErrorCodes":["EPERM"]}
{"wellFormed":100,"broken":0,"leftoverTmp":0}
second watcher: 100 {"catch-up":50,"watch":50}
b3
{"generated":100,"appended":100,"shared":true,"renameErrors":2,"renameErrorCodes":["EPERM"]}
{"wellFormed":100,"broken":0,"leftoverTmp":0}
second watcher: 100 {"catch-up":46,"watch":54}
```

**Raw output, step 3 (`time-agents.js 10`).**

```
{"runs":10,"p50Ms":161,"p95Ms":171,"failures":[],"sessionCount":5,"keys":["cwd","id","kind","name","pid","sessionId","startedAt","state","status"],"kinds":["background","interactive"],"states":["blocked"],"statuses":["idle","busy"]}
```

**Verdict: PASS.** Criteria: received after catch-up equals generated; broken lines 0.
- Separate files (a1-a3): generated 100 = appended 100 = seen 100 (all via watch), broken 0, leftover tmp 0.
- Shared file (b1-b3): appended 100, wellFormed 100, broken 0; the second watcher saw 100 of 100 each run (catch-up 50/50/46 + watch 50/50/54), so nothing is lost across a watcher restart.
- `claude agents --json`: p50 161 ms, p95 171 ms, no failures; 5 sessions; keys `cwd,id,kind,name,pid,sessionId,startedAt,state,status`; kinds `background,interactive`; states `blocked` (only value observed); statuses `idle,busy`.

**Rename finding: spec impact, decision for Rafal at Task 14.** Concurrent rename onto one file gave `EPERM` in every shared run: `renameErrors` 5, 7, 2 (of 100 events per run; none in the separate-file runs a1-a3). Spec §5.1 writes `.last.md` by temp file plus rename, so with concurrent `Stop` hooks some `.last.md` writes fail. The event log itself was unaffected (0 broken lines). Options:
1. Keep the single `.last.md`, retry the rename with backoff on `EPERM`.
2. Write one last-message file per `Stop` event and reference it from the event (no rename contention on a shared target).

Not yet decided; waiting for Rafal at Task 14.

## S4 — SendMessage and the recipient
## S5 — Monitor expiry wakes an idle hub
## S6 — fork launch
## S7 — write boundary of the fork
## S8 — role file survives /clear
## S9 — Codex follow-up sandbox and working directory
## S10 — background session in a new worktree

**Question:** does `claude --bg -w probe-wt` start a background session in a new git worktree, and how does `claude rm` clean it up?

**Method:** brief Step 1 verbatim from C:/Users/rafal/hub-probes/repo. Before: `git worktree list` -> `C:/Users/rafal/hub-probes/repo  043c443 [master]`.

**Raw output (launch stdout+stderr, exit 1):**

```
Workspace not trusted. Run `claude` in C:\Users\rafal\hub-probes\repo once and accept the trust prompt, then retry.
```

No session started: nothing to inspect, no worktree created, no `claude rm` run. `data/events/` stayed empty; `claude agents --json` lists no probe-wt.

**Verdict:** not run (BLOCKED). The brief's pass criterion could not be tested. Prerequisite: interactive trust acceptance of the throwaway repo, which a non-interactive executor must not do. Finding in itself: `--bg` in a not-yet-trusted workspace fails fast with exit 1.

**Fallback:** the hub creates the worktree with `git worktree add` and starts the session in it, after ensuring the workspace is trusted.

**Spec impact:** hub setup needs a trust step per project repo/worktree; untrusted workspaces cannot be started with `--bg`.
## S11 — gate marker smoke test

## Summary

| Probe | Verdict | Fallback taken | Spec impact |
|---|---|---|---|
