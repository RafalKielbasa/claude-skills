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

**Question:** do a Codex consultation (`codex exec -s read-only`) and its follow-up (`codex exec resume <id> -c sandbox_mode="read-only"`) stay read-only, keep the working directory and thread context, pass Polish diacritics via stdin, and launch no other agent?

**Method:** prompts `s9-first.md` / `s9-follow.md` fed through stdin; call 1 `codex exec -s read-only -C <repo> --json -o s9-1.md -`; call 2 `codex exec resume <id> -c sandbox_mode="read-only" ...`; call 3 (informational) the same resume without `-c`. Codex CLI 0.147.0, Windows 11, contract removed from `~/.codex/AGENTS.md`. Files: `C:/Users/rafal/hub-probes/data/codex/s9-{1,2,3}.{md,jsonl}`.

**codex-commands.js outputs (commands shortened):**

| Call | threadId | itemTypes | agentLaunches | otherToolItems | commands |
|---|---|---|---|---|---|
| 1 | 01a136b7-2195-70d0-8cb4-81ac73919aa0 | error 1, agent_message 3, command_execution 4 | [] | [] | 4 x powershell.exe: read of superpowers SKILL.md (exit -1, then 0), `$PWD.Path; Test-Path ...`, `Get-Content -TotalCount 1 .\README.md; $PWD.Path` |
| 2 (resume, with override) | same | error 1, agent_message 2, command_execution 1 | [] | [] | `powershell.exe -Command '$PWD.Path'` (exit 0) |
| 3 (resume, no override) | same | error 1, agent_message 2, command_execution 1 | [] | [] | `powershell.exe -Command '$PWD.Path'` (exit 0) |

The write attempt in each call was an apply_patch, rejected by stderr: `patch rejected: writing is blocked by read-only sandbox; rejected by user approval settings` (the `error` item). In call 1 one shell command also failed with `windows sandbox: CreateProcessWithLogonW failed: 267` (exit -1), retried successfully.

**Answers (verbatim):**

Call 1:
```
# Wynik próby S9

- Pierwsza linia: `# Probe sandbox`
- Utworzenie `s9-write-1.txt`: **nie powiodło się**.
- Bieżący katalog: `C:\Users\rafal\hub-probes\repo`

zażółć gęślą jaźń.
```

Call 2:
```
# Wynik dalszej próby S9

It did not succeed.

`C:\Users\rafal\hub-probes\repo`

W pierwszej wiadomości poprosiłeś o zacytowanie pierwszej linii `README.md`, próbę utworzenia `s9-write-1.txt` z treścią `x`, raport wyniku, wydrukowanie bieżącego katalogu oraz dokładne powtórzenie frazy „zażółć gęślą jaźń.”
```

Call 3:
```
# Wynik próby S9

It did not succeed.

`C:\Users\rafal\hub-probes\repo`

W pierwszej wiadomości poprosiłeś o zacytowanie pierwszej linii `README.md`, próbę utworzenia `s9-write-1.txt` z treścią `x`, dosłowne podanie wyniku, wydrukowanie bieżącego katalogu oraz dokładne powtórzenie frazy „zażółć gęślą jaźń.”
```

**ls results:** after call 2 and after call 3, `ls repo/s9-write-*.txt` -> `No such file or directory`; repo contains only `CLAUDE.md`, `README.md`. No s9-write-*.txt to delete.

**Verdict: pass.** Write refused in all three calls, working directory is the repo, context recalled, diacritics intact, no agent launch, no other tool items.

**Fallback:** not needed (would be a fresh `codex exec -s read-only -C <dir>` per follow-up with `thread.md` as context).

**Spec impact:**
- The follow-up kept read-only with the `-c sandbox_mode="read-only"` override; keep passing it (cheap, explicit).
- Without the override (call 3) the resumed thread was still read-only on this machine: `~/.codex/config.toml` sets no `sandbox_mode` (only a Windows `sandbox = "elevated"`), so resume evidently inherits the thread's read-only policy or the default is read-only. The cause (inheritance vs. default) was not separated; do not rely on it, keep the override.
- `resume` takes the working directory from the shell cwd (ran from the repo); the `-C` flag was not passed on resume and cwd was correct.
- Codex on its own reads the superpowers skill (using-superpowers SKILL.md) at the start of call 1; harmless here, but it is extra token use.
- stderr noise (models cache `supports_parallel_tool_calls`, Figma MCP AuthRequired) does not affect results; send stderr away from stdout JSONL.
## S10 — background session in a new worktree

**Question:** does `claude --bg -w probe-wt` start a background session in a new git worktree, and how does `claude rm` clean it up?

**Method:** brief Step 1-3 verbatim from C:/Users/rafal/hub-probes/repo. Before: `git worktree list` -> `C:/Users/rafal/hub-probes/repo  043c443 [master]`. Two attempts: the first before the workspace was trusted, the second after Rafal accepted the trust prompt by running `claude` once in the repo.

**Attempt 1 (untrusted workspace), launch stdout+stderr, exit 1:**

```
Workspace not trusted. Run `claude` in C:\Users\rafal\hub-probes\repo once and accept the trust prompt, then retry.
```

Finding: `claude --bg` requires workspace trust, while `claude -p` did not. No session or worktree was created.

**Attempt 2 (after trust), launch, exit 0:**

```
Starting background service…
backgrounded · df73ebe4 · probe-wt
  claude agents             list sessions
  claude attach df73ebe4    open in this terminal
  claude logs df73ebe4      show recent output
  claude stop df73ebe4      stop this session
```

`--allowedTools` and `--` were accepted; the session did not block on a permission prompt (both commands ran).

**agents JSON line (after ~30 s):**

```
{"pid":32300,"id":"df73ebe4","cwd":"C:\Users\rafal\hub-probes\repo\.claude\worktrees\probe-wt","kind":"background","startedAt":1791919663452,"sessionId":"df73ebe4-e63d-4ad5-b912-1680681f9537","name":"probe-wt","status":"idle","state":"done"}
```

**`git worktree list` after launch:**

```
C:/Users/rafal/hub-probes/repo                             043c443 [master]
C:/Users/rafal/hub-probes/repo/.claude/worktrees/probe-wt  043c443 [worktree-probe-wt] locked
```

**`claude logs probe-wt`:** raw output is a full terminal (ANSI) screen dump of ~218 KB; the relevant lines after stripping escape codes:

```
⎿ $ git rev-parse --show-toplevel; git branch --show-current
│ git rev-parse --show-toplevel │ C:/Users/rafal/hub-probes/repo/.claude/worktrees/probe-wt │
│ git branch --show-current     │ worktree-probe-wt │
```

The header showed the cwd `~\hub-probes\repo\.claude\worktrees\probe-wt`. Note: the session's startup git-status snapshot still described the main checkout (branch master); only the actual commands show the worktree.

**Location check:** worktree path `C:/Users/rafal/hub-probes/repo/.claude/worktrees/probe-wt` lies under `C:/Users/rafal/hub-probes/` -> `claude rm` allowed.

**`claude rm df73ebe4` (three runs):**

Run 1, exit 1:
```
kept df73ebe4 — its worktree is still at “C:\Users\rafal\hub-probes\repo\.claude\worktrees\probe-wt”
  Worktree not removed. Claude Code couldn't remove it (“some of its files could not be deleted: EBUSY; a program may have them open, so try removing it again”). The session stays until the directory is gone.
  close anything using the directory or fix its permissions, then retry: claude rm df73ebe4 --force-remove-worktree 1da888643bec76c2c41cfef4c14fdf46
```
After run 1 `git worktree list` showed only the main repo, but the directory `.claude/worktrees/probe-wt` remained containing only a `.git` file.

Run 2, exit 1:
```
kept df73ebe4 — its worktree is still at “C:\Users\rafal\hub-probes\repo\.claude\worktrees\probe-wt”
  Worktree not removed. Refused before anything was deleted (“the repository's worktree registrations cannot be vetted before git lists them (.git is a link, a mount point, or cannot be probed)”); remove it by hand. The session stays until the directory is gone.
  remove the directory yourself if you don't need it, then run 'claude rm df73ebe4' again
```

After `rm -rf .claude/worktrees/probe-wt` by hand (inside the throwaway repo), run 3, exit 0:
```
removed df73ebe4
  worktree: “C:\Users\rafal\hub-probes\repo\.claude\worktrees\probe-wt”
```

`git worktree list` after: `C:/Users/rafal/hub-probes/repo  043c443 [master]`. The branch `worktree-probe-wt` was NOT deleted by `claude rm` (`git branch --list` still shows it). `claude agents --json` lists no probe-wt.

**Events:** the session wrote 4 events (UserPromptSubmit, PostToolUse, Stop, SessionEnd) to `data/events/df73ebe4-e63d-4ad5-b912-1680681f9537.jsonl`; moved to `data/events-s10/`. Hooks from the project fired in the worktree session (project settings are inherited by the worktree checkout).

**Verdict:** PASS (partial on cleanup). `--bg -w` created a background session with cwd in a new worktree under `<repo>/.claude/worktrees/<name>`, on a new branch `worktree-<name>` differing from `master`; the worktree appears in `git worktree list`. `claude rm` on Windows needed a retry: the first run hit EBUSY, leaving an empty directory that had to be removed by hand before the second pass succeeded; the branch is left behind.

**Fallback:** if `claude rm` fails with EBUSY, the hub retries after the session process has exited, and deletes the leftover directory plus `git branch -D worktree-<name>` itself; alternatively create the worktree with `git worktree add` and start the session in it.

**Spec impact:**
- Hub setup needs a trust step per project repo; `--bg` fails fast with exit 1 in an untrusted workspace (observed for the repo; a worktree under the trusted repo did not need separate trust).
- Worktree path convention: `<repo>/.claude/worktrees/<name>`, branch `worktree-<name>`, registered as locked.
- Worktree cleanup must handle EBUSY on Windows and delete the branch explicitly.
- `claude logs` returns a terminal screen dump, not structured text; for result extraction the hub should use the events files / transcript instead.

## S11 — gate marker smoke test

## Summary

| Probe | Verdict | Fallback taken | Spec impact |
|---|---|---|---|
