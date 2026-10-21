# Hub voice — Plan 2 acceptance report

**Index:** [.claude/projects/hub.md](../projects/hub.md)
**Spec:** [2026-10-18-hub-voice-design.md](2026-10-18-hub-voice-design.md) (§11 acceptance, §3 anti-goals, §5.5)
**Plan:** [2026-10-20-hub-voice-plan-2-talk.md](../plans/2026-10-20-hub-voice-plan-2-talk.md), Task 9

Date: 2026-10-21, local time (UTC+2). Skill: `C:/Users/rafal/.claude/skills/talk/` (116 tests passing after the fixes below). Agent: `agent_5001m5df9a5zeesaff7ney8ypmak`, tool `tool_9201m5df99v6e1psq1pcg84kbdt0`. Dialogs: `C:/Users/rafal/hub-data/projects/notatki/dialogs/`. Every session X was a fresh Claude Code session in `D:\Notatki\notatki`, started by the controller at Rafal's request ("uruchom przebieg") from a script that removes the inherited `CLAUDE*` variables first (finding F1).

**Result:** every §11 check passed. The push gate passed only after a fix: it failed in run 1 and passed in run 5.

## Runs

| Run | Session X | Dialog | Conversation, length | End path |
|---|---|---|---|---|
| 0 | `522f7a6f` | `2026-10-21-0841-talk` | none | the fork could not start (F1) |
| 1 | `2e87769d` | `2026-10-21-0843-talk` | `conv_5701m5ek79gfey59zdm6q2g8yjw6`, 321 s | „Zakończ rozmowę” button |
| 2 | `de0bbad2` | `2026-10-21-1411-talk` | `conv_8301m5f609m6fkdr63p68farqy1a`, 272 s | closed tab (lost heartbeat) |
| 3 | `56378102` | `2026-10-21-1419-talk` | none | page never started, `TALK_FIRST_BEAT_MS=120000` |
| 4 | `f0176b38` | `2026-10-21-1428-talk` | `conv_8201m5f6zjtwfhwrap7pt0cbrapw`, 48 s | agent ended on „I na tym kończymy.” |
| 5 | `f0176b38` (second `/talk`) | `2026-10-21-1430-talk` | `conv_8101m5f73c8qeaka49wdtp6dtnga`, 77 s | „Zakończ rozmowę” button |
| refusal | `85d3f609` in `D:\Praca\Devstock\Projekty\saas app` | — | — | refused at `check` |

Voice time: 718 s (11 min 58 s).

## Checks

| Check (spec §11) | Observed | Verdict |
|---|---|---|
| Decisions as read back match `decisions.md` | Run 1: the three decisions are word for word the read-backs of 08:46:21, 08:46:44 and 08:48:24. Run 5: the decision matches the read-back of 14:31:39 | pass |
| `prompt.md` holds only confirmed items | Run 1: decisions 1–3; „Na razie to zostawmy” became the constraint „Pozostałe zadania backlogu zostają bez zmian”. Run 4: the order was never confirmed and no `prompt.md` was written; `open-questions.md`: „Zlecenie dopisania, commitu i pusha nie zostało potwierdzone.” | pass |
| `open-questions.md` and `transcript.md` exist | Both exist in runs 1, 2 and 4. In run 1 the open question was superseded within the conversation, so the file holds only a note about it; runs 2 and 4 hold real open questions | pass |
| The fork leaves the repository unchanged | `git status` before and after every run differs only by X's commits `dd9e6f8` (run 1) and `64a3364` (run 5); the three `praca/projekty/edu-saas/*` changes predate the session | pass |
| The page refuses a request without the token | Run 1, live bridge on `127.0.0.1:53781`: `GET /api/status`, `/api/status?t=wrong`, `/`, `/api/decisions` → `403`; with the token and `Host: evil.example` → `403`; with the token → `{"forkReady":true,"forkExited":false,"ending":false,"interruption":"contextual-update"}` | pass |
| The conversation is gone from ElevenLabs | `GET /v1/convai/conversations/<id>` → `404 conversation_not_found` for the conversations of runs 1, 2 and 4; every report reads `deletion: deleted` (runs 1, 2, 4, 5) or `deletion: no conversation id` (runs 0, 3) | pass |
| `/talk` outside the allowlist refuses | edu-saas session: „Projekt edu-saas nie jest na liście dozwolonych dla /talk (C:\Users\rafal\.claude\skills\talk\config.json).”, shown verbatim, nothing started | pass |
| X proceeds on `prompt.md` and stops at the first outward action | Run 1: X committed and pushed `dd9e6f8` (`0d2e1ba..dd9e6f8  main -> main`) on the voice decision alone (F2). After the fix, run 5: X committed `64a3364`, `main` ahead 1, and ended with „⏸ Czeka na decyzję: zgoda w tekście na push commita `64a3364` do `origin/main`.” | fail in run 1, pass in run 5 |
| Button end wakes X with a report | Run 1: report on button end; `conversations: conv_5701m5ek79gfey59zdm6q2g8yjw6 (321 s)` | pass |
| Closed tab wakes X with a report | Run 2: the transcript ends at 14:16:26, the report reached X at 14:17:12; `--- prompt.md ---` followed by `(not written)` | pass |
| Page never started wakes X with a report | Run 3: bridge up at 14:19:28, report at 14:21:31; `conversations: none`, all three files `(not written)` | pass |

## Findings

| # | Finding | Kind | Handling |
|---|---|---|---|
| F1 | A Claude Code session started from inside another session inherits `CLAUDE_CODE_*` (among them `CLAUDE_CODE_CHILD_SESSION`) and writes no transcript, so `--resume` fails: „No conversation found with session ID: 522f7a6f-df26-487a-bb72-d1745441c71f”. The bridge ended at once and the report carried the fork's stderr (final review fix I1, confirmed live). X misread the cause and proposed starting with the controller's session id; the controller stopped X before any answer | environment | fresh sessions get a clean environment; to check again when the hub starts voice conversations |
| F2 | Run 1: the fork wrote „zacommitować i wypchnąć … wg reguł Git vaulta” into `prompt.md`, and X followed the vault's push-by-default rule against `SKILL.md` step 4: a push on a voice decision alone (spec §3 anti-goal). Rafal kept `dd9e6f8`, whose content is his confirmed decisions | defect | fixed: `SKILL.md:67-70`, `lib/voice-prompt.mjs:9,34,38`, two tests; verified live in run 4 (the read-back said „Sesja zatrzyma się przed pushem i poczeka na twoje słowo w tekście”) and run 5 (push only under **Ograniczenia**, X stopped after the commit) |
| F3 | On `--resume --fork-session` Claude Code injects into the fork `<status>stopped</status> <summary>Background shell command didn't finish before the previous session ended</summary>` for X's own running `talk start` task. In run 2 the fork took it for a failed earlier run and built decision 1 on it; Rafal confirmed it. X2 began acting on that decision and the controller stopped it; the vault stayed unchanged | defect | fixed: `lib/voice-prompt.mjs:37` names the notice as the conversation's own bridge, one test; the forks of runs 4 and 5 did not raise it (no targeted live check) |
| F4 | Run 1: the agent's read-back of 08:48:07 also removed the task Rafal later said was done; he corrected it and only the corrected wording was recorded. Garbled transcription („Zostawę zadania. Akceptuję to.”) made the fork ask for one clear sentence | observation | none; the confirmation rule held |
| F5 | First live `sendContextualUpdate`: run 1, „interruption during ask” 08:49:08, „contextual update sent” 08:49:09; the conversation ended 2 s later, so the agent's uptake is not observable | observation | none |
| F6 | The agent's texts carry audio tags (`[slow]`, `[sad]`); whether the voice spoke them aloud was not reported | observation | listen in later use |
| F7 | Window switch during run 2: Rafal reported that the conversation ended on the tab close; the transcript runs without a break from 14:12:07 to 14:16:26. Assumed: the 15 s heartbeat grace (Ruling R9) survived the switch; the switch was not timed | observation | none unless a false end shows up |
| F8 | Time to „Gotowe do rozmowy.” not recorded by Rafal; the bridge reported `forkReady: true` 10–15 s after the dialog directory appeared (runs 1 and 4) | observation | none |

## Deviations from the plan

- Sessions X were started by the controller from `start-x.ps1` (scratchpad) at Rafal's request, not typed by Rafal; run 0 failed because the first launch kept the inherited environment (F1).
- Runs 4 and 5 were added after the F2 fix to verify it (Rafal's decision „Dodatkowy przebieg ze zleceniem”, variant A).
- Fixes after the runs, not in the plan: F2 and F3 above, and `test/config.test.mjs:12`, which now accepts the agent ids saved by `agent setup`.
- The production agent was created by the final fix-wave subagent against its brief (`node bin/talk.mjs agent setup` without the stub). A read-only check matched every Global Constraints value; Rafal kept it (decision „Agent założony przez subagenta”, variant A).
- The controller stopped two sessions X: run 0's (pid 19576) before its wrong recommendation was answered, run 2's (pid 29884) while it worked on the decision built on F3.

## Closing steps

- Push: Rafal's word in text („Push commitów 64a3364 i 6ae6f42”, variant A); `dd9e6f8..6ae6f42  main -> main`.
- Task 9 Step 3: the voice-proposal rule (spec §9) added to `~/.claude/CLAUDE.md`, section „Decyzje: Recommendation-First”, in the wording Rafal approved (variant A).
- Task 9 Step 4 (variant A): probe agent `agent_8901m5am01ghej0ryhp9k58fvwej` (`hub-voice-probe`) `DELETE` → `204`, `GET` → `404`. Its tool `tool_9901m5an60rffxbryj877vay4gqc` first answered `409` „Tool is still in use by: Unknown / Main. Please remove the dependency or use Force Delete.” (the only dependent was the deleted agent's branch `Main`); `DELETE …?force=true` → `204`, `GET` → `404`. The production agent and its tool were re-read unchanged afterwards. `C:/Users/rafal/hub-probes/voice/data/interrupt-url.txt` deleted; the rest of `hub-probes` kept.

## Open after Plan 2

- Starting a voice conversation from the hub: check F1 for hub-launched sessions.
- The parked findings below.

## Rulings made during execution (from the execution ledger, verbatim)

Each ruling reads: what was decided — why — what it costs if wrong. Rafal saw the list on 2026-10-20 and kept all of them.

- R1: no worktree and no commits in ~/.claude; each task's review package is `git diff --no-index` between a snapshot of `talk/` taken before the task and `talk/` after it — Global Constraints forbid manual commits there and the backup hook may commit at any time — if wrong: noisier diffs only.
- R2: Task 5 `startBridge` keeps an optional `asksFile` (JSONL of ask timings, as in the probe; the CLI does not pass it) so the test "asks are refused once the end has started" asserts something — if wrong: one unused option in production.
- R3: Task 7 `talk.mjs` loads `ask-tracker.mjs` with `await import(\`./ask-tracker.mjs?t=${token}\`)` — every bridge request needs the token (spec §6) and a static import cannot carry it — if wrong: a one-line change.
- R4: Task 6 Step 5 (creating the production agent at ElevenLabs) is run by the controller after the task review passes — if wrong: none. (In the event the auto-mode classifier blocked the controller and the final fix-wave subagent created the agent; see Deviations.)
- R5: Task 5 copies the probe's `web/talk.html` into `talk/web/` because its test serves `/` before Task 7 exists; Task 7 owns every later change to the page — if wrong: Task 7 rewrites one file anyway.
- R6: `startBridge` takes an optional `rawLog` path passed to `startFork` (the CLI passes it only when `TALK_RAW_LOG` is set) because Task 8's smoke checks the fork's `init` in the raw log — if wrong: one unused option.
- R7: `/api/status.forkReady` is true only when `fork.ready` resolved with a subtype other than `exited` — if wrong: a page that waits on a dead fork.
- R8: `check` also refuses, with a Polish sentence, when `config.json` has no `agentId` (outside the ElevenLabs stub) — `start` would fail at the first token request — if wrong: one extra check line.
- R9: heartbeat grace stays 15 s — spec §13 leaves it to the builder, and a page with an open RTCPeerConnection is exempt from Chrome's intensive throttling — if wrong: one false end, then raise the grace. (Acceptance: F7.)
- R10: no extra deny for `fork-settings.json` — spec §8 fixes the exact rule list and the settings are read at start — if wrong: a fork could edit its own settings file, with unknown effect.
- R11: `check` stays local, no `getAgent` call — the plan says check only validates; a bad key is readable on the page — if wrong: a bad key surfaces after „Rozpocznij” instead of before the browser opens.
- R12: end-step notes stay on the `deletion:` line — SKILL.md documents the first-segment rule — if wrong: an error text with `;` reads as an extra segment.

## Parked findings (from the execution ledger, verbatim)

The task reviewers deferred these minors; the final review triaged them. It required only "T3 send-after-exit" and "T3 stderr", both fixed with its findings I1 and I2, and its fix wave also took the subject quoting. Entries not named here were not re-checked after the fixes.

- Task 2: `voiceForkSettings` does not resolve a relative dialogDir (lib/settings.mjs:92).
- Task 2: `dialogDirFor` check-then-create; two /talk in one minute could share a dir silently (lib/dialog.mjs:66-71).
- Task 2: shipped-config test hardcodes C:/Users/rafal/hub-data (test/config.test.mjs:7-9), brief-mandated.
- Task 3: `send` after the child exited never resolves (lib/fork.mjs:106) — fixed with I2.
- Task 3: spawn errors and stderr discarded (lib/fork.mjs:81,94) — stderr fixed with I1; spawn ENOENT still gives no cause (final, parked).
- Task 3: key removal case-sensitive (lib/fork.mjs:78-79) — fixed: `lib/fork.mjs:25` compares the name upper-cased.
- Task 3: key-leak test relies on the fake's `[key]` suffix without a comment; no start timeout for `ready` (test/fork.test.mjs:203-207).
- Task 4: the fork reads all of diff.patch before introducing itself; a large diff delays the start (lib/voice-prompt.mjs:58-60), brief-mandated.
- Task 4: `subject` interpolated raw, a newline could add lines to the role (lib/voice-prompt.mjs:61).
- Task 4: "no subject" test matches /start with/, brittle (test/voice-prompt.test.mjs:156).
- Task 5: end-step notes appended to the `deletion:` line (lib/bridge.mjs:190) — Ruling R12: stays.
- Task 5: a refused (non-plain) conversation id is dropped silently (lib/bridge.mjs:93).
- Task 5: an id arriving after step 3 (or „Zakończ” before the page knows the id) is never deleted; report says `no conversation id` (lib/bridge.mjs:168-180, 210, 225-226).
- Task 5: an empty `request` still costs a fork turn; body cap counts UTF-16 chars (lib/bridge.mjs:41, 222-224).
- Task 5: listen-failure path awaits fork.close without a limit (lib/bridge.mjs:255).
- Task 5: a dead fork is detected late (lib/bridge.mjs) — fixed with I1/I2.
- Task 5: FORK_GONE „Claude nie odpowie, bo jego proces się zakończył. Zakończ rozmowę.” is new spoken text, not heard in the acceptance (lib/bridge.mjs:25).
- Task 5: wall-clock bounds (< 250 ms, < 1000 ms) in bridge tests can flake (test/bridge.test.mjs:403).
- Task 6: no test of the partial-failure rerun of `agent setup` (bin/talk.mjs:41-43).
- Task 6: any `interruption` other than `contextual-update` silently maps to disable_during_tool (bin/talk.mjs:29).
- Task 6: TALK_ELEVEN_STUB=1 without TALK_CONFIG could write fake ids into the real config.json (bin/talk.mjs:79).
- Task 6: non-JSON success body throws a bare SyntaxError (lib/eleven.mjs:177).
- Task 6: `agent sync` not exercised through the CLI (test/cli.test.mjs).
- Task 7: `api()` ignores `r.ok`; an error body from /api/ask throws after `tracker.start` outside the try, leaking a pending ask (web/talk.mjs:204-206, 236-243).
- Task 7: error path calls `tracker.answered(ask, '')`, marking the request delivered (web/talk.mjs:238-239).
- Task 7: a status poll in flight can re-enable „Rozpocznij” mid-connect (web/talk.mjs:321).
- Task 7: no tracker test for two interrupted asks pending at once or a double `answered` (test/ask-tracker.test.mjs).
- Task 8: boundary checks can pass vacuously (test/live/boundary.mjs:135,137,139).
- Task 8: sentinel scan skips non-JSON lines; control count not recorded (test/live/boundary.mjs:68).
- Task 8: SKILL.md quoted --subject in double quotes (SKILL.md:35, bin/talk.mjs:133) — fixed in the final fix wave (single quotes).
- Task 8: dialog dir announced before it exists; same-minute collision (bin/talk.mjs:99-100, lib/dialog.mjs:20).
- Task 8: no tests for the missing --cwd message, the no-agent start message, key-before-agent order (test/cli.test.mjs:198).
- Final: M5 bound approximate when a different ask queues behind the running one (lib/bridge.mjs:152-154) — stays.
- Final: browser still opens after an early fork exit (lib/bridge.mjs:279-283) — stays.
- Final: „Claude nie wystartował…” after a reload when the fork died after its intro (web/talk.mjs:139) — stays; wording only.
- Final: page test leaves location/document/window on globalThis (test/page.test.mjs:722) — stays.
- Final: bridge ending before the click leaves „Gotowe do rozmowy.”; raw English message after „Błąd:” for startSession failures — stay.
