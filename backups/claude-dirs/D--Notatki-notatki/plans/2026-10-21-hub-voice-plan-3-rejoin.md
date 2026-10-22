# Hub voice — Plan 3: rejoining a conversation and starting one from the hub

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A `/talk` dialog survives breaks, closed tabs and the call's duration limit, and Rafal rejoins it from the browser, from `/talk` or from the hub. The hub can start a voice conversation about another session and send its work order through its own send path.

**Architecture:**
- **Dialog and calls.** The bridge of Plan 2 becomes a dialog of several ElevenLabs calls: one fork, one dialog directory and one closing report. It pauses between calls and ends only on the button, on Rafal's spoken end marked by a new client tool, at the pause limit, at the first-call deadline, or when the fork exits.
- **Per-call cleanup.** Every call is deleted at ElevenLabs, and the transcript rewritten, as soon as that call ends.
- **What a later call knows.** It gets a fresh snapshot and a note for the fork, plus a first message and a contextual update for the agent.
- **Finding a live dialog.** A file in the dialog directory, `bridge.json`, lets `check`, `start` and `reopen` find it.
- **The hub side.** The hub gets a read-only resolver `HUB voice resolve`, shared with `dialog start`, and a procedure that runs the talk CLI with `--origin hub`.

**Tech Stack:** Node v24 (standard library only); Claude Code 2.1.302; ElevenLabs Agents API; vendored `@elevenlabs/client` 1.28.0 IIFE (unchanged).

**Spec:** `D:/Notatki/notatki/.claude/specs/2026-10-18-hub-voice-design.md`, amendment of 2026-10-21: §17–§20 and the sentences they add to §2, §4, §5.4, §6, §7 and §11. Built code: Plan 2 (`D:/Notatki/notatki/.claude/plans/2026-10-20-hub-voice-plan-2-talk.md`, acceptance report `D:/Notatki/notatki/.claude/specs/2026-10-21-hub-voice-plan-2-acceptance.md`).

## Global Constraints

**Locations and rules**
- `TALK/` = `C:/Users/rafal/.claude/skills/talk/`, `HUB/` = `C:/Users/rafal/.claude/skills/hub/`.
- Code, comments and `SKILL.md` in English; everything Rafal reads or hears in Polish, with the exact texts below.
- No new runtime dependency; the vendored client stays as it is (`TALK/web/vendor/VERSION.txt`).
- Tests: `node --test test/*.test.mjs` in `TALK/` (119 passing at the start); `node --test` in `HUB/`.

**Unchanged from Plan 2**
- The fork command and its settings (spec §8).
- Bridge on `127.0.0.1` only.
- Every request carries the token and a local `Host`.
- The key is never printed, logged, written, sent to the page or passed to the fork.
- Dialog directories: `C:/Users/rafal/hub-data/projects/<project key without leading dots>/dialogs/<YYYY-MM-DD-HHmm>-talk/`.
- Allowlist unchanged: `notatki`, `.claude`.

**Limits**
- One call at most 1800 s (`max_duration_seconds`; 60–7200 for a probe).
- Heartbeat grace 15 s.
- First-call deadline 10 min.
- Pause limit 60 min (`config.json` `pauseLimitMinutes`; `TALK_PAUSE_LIMIT_MS` overrides it in tests and live checks).
- A call still running 15 s after `end_conversation` is ended by the page.

**Configuration** (`TALK/config.json`, new keys)
- `"pauseLimitMinutes": 60`.
- `"agentHangup": "pause"`; `"end"` is the fallback of spec §18.3.
- `"rejoinFirstMessage": true`.
- `agent.endToolId` is saved by `agent setup` or `agent sync`.

**Polish texts** (exact)

| Where | Text |
|---|---|
| Buttons | „Rozpocznij rozmowę” (before the first call), „Połącz ponownie” (after it), „Przerwa”, „Zakończ rozmowę” |
| Paused | `Rozmowa wstrzymana. Połącz ponownie do <HH:MM>; potem rozmowa się zakończy.` |
| Second tab | `Rozmowa trwa w innej karcie.` |
| Auto reconnect | `Limit czasu połączenia. Łączę ponownie…` |
| Ended | `Rozmowa zakończona. Możesz zamknąć kartę.` |
| A later call's first message | `Wracamy do rozmowy. Słucham.` |
| Duration message | `Kończy się czas tego połączenia, zaraz łączę ponownie.` |
| `end_conversation` result | `Koniec rozmowy przyjęty. Pożegnaj się jednym zdaniem i zakończ połączenie.` |
| Fork note after a break | `(Rafał wrócił do rozmowy po <n> min przerwy. Migawka git w context/ odświeżona o <HH:MM>.)`, where n = max(1, minutes rounded) |
| Fork note after the limit | `(Połączenie odnowione po limicie czasu. Migawka git w context/ odświeżona o <HH:MM>.)` |
| Rejoin context | first line `Dalszy ciąg rozmowy po przerwie. Ostatnie wypowiedzi:`, then up to 8 lines `- Rafał: …` / `- Agent: …` (no notes), then one line per undelivered answer, `Odpowiedź Claude na pytanie „<request>”, której nie usłyszałeś: <answer>` |

**Agent and commits**
- Agent changes reach ElevenLabs only through `node TALK/bin/talk.mjs agent sync`, run by the controller in Task 9.
- `~/.claude` gets no manual commit, because its backup hook syncs it. Each task's review package is `git diff --no-index` between a snapshot of the touched skill folder taken before the task and the folder after it (Ruling R1 of Plan 2).
- Vault files are committed under the vault's rule, unless Rafal says otherwise when execution starts.
- Voice minutes: Task 9 about 3, Task 10 about 10. Anything beyond the Starter plan goes to Rafal first.

## Decisions for Rafal before execution (spec §20.4)

| Name | Variants | Effect on this plan |
|---|---|---|
| Working directory in `dialog start` | **A (recommended):** the hook-first cwd applies to `dialog start` too. **B:** voice path only | B: Task 7 Step 3 keeps `dialog start` on `source.cwd ?? derived.cwd` and drops its test, and the finding goes to the `hub-core` open points in the index |
| Silence in the fallback | **A (recommended):** `silence_end_call_timeout` stays at 30 s. **B:** 120 s | Only asked if Task 9 sets `agentHangup: "end"` and the silence hang-up arrives as `end_call`. B adds one value to `agentConfig` and one `agent sync` |
| Voice minutes | **A (recommended):** run Tasks 9 and 10 on the Starter plan, and stop if ElevenLabs reports the limit | — |

## Review Focus

1. **An answer that comes back after its call ended.** A cut, a break or a closed tab happens while an ask runs, and the fork's answer arrives after the call is gone. Rafal hears it in the next call. Pinned by Task 3 (rejoin context with an undelivered answer).
2. **A reopened tab while the old call still sends heartbeats.** The token is refused with `call-live` until 15 s pass without a heartbeat, then allowed. Pinned by Task 2.
3. **„Zakończ rozmowę” during a call.** The page's own `endSession` must not pause the dialog: the bridge gets `/api/end`, not `/api/call-end`. **„Zakończ” during a pause** ends at once. Pinned by Tasks 2 and 4.
4. **The pause limit while a page is open.** The page shows the end and stops polling, and any later token request answers `409 ending`. Pinned by Tasks 2 and 4.
5. **A `bridge.json` left by a bridge killed with its session.** It is not a live dialog: `check --session` does not report it and `start` does not refuse because of it. Pinned by Task 5.

---

## File Structure

| Path | Change |
|---|---|
| `TALK/lib/agent-config.mjs` | `end_conversation` tool, prompt rules for an end and a break, duration message, first-message override, duration parameter |
| `TALK/bin/talk.mjs` | agent commands handle the second tool and `TALK_MAX_DURATION_SECONDS`; `check --session`, `start --origin/--name`, `reopen` |
| `TALK/lib/live.mjs` (new) | `bridge.json`: write, remove, find a live dialog of a session |
| `TALK/lib/bridge.mjs` | calls, pause, pause limit, per-call cleanup, new routes, rejoin note and context |
| `TALK/lib/report.mjs` | `origin:` line |
| `TALK/lib/voice-prompt.mjs` | rule for a note after a break |
| `TALK/web/talk.html`, `TALK/web/talk.mjs` | label, „Przerwa”, „Połącz ponownie”, call handling |
| `TALK/config.json` | `pauseLimitMinutes`, `agentHangup`, `rejoinFirstMessage`, `agent.endToolId` |
| `TALK/SKILL.md` | live dialog → reopen; asking before `prompt.md` after own turns; breaks |
| `HUB/lib/resolve.mjs` (new) | source resolution shared by `dialog start` and `voice resolve` |
| `HUB/bin/hub.mjs` | `voice resolve`; `dialog start` uses the resolver |
| `HUB/SKILL.md`, `HUB/role.md` | voice section; boundary exception |
| `TALK/test/*`, `HUB/test/*` | tests named below |
| `D:/Notatki/notatki/.claude/specs/2026-10-19-hub-voice-probes.md` | Task 9 result appended |
| `D:/Notatki/notatki/.claude/specs/<date of the run>-hub-voice-plan-3-acceptance.md` | Task 10 report |

---

### Task 1: Agent: end of the conversation, duration message, first-message override

**Files:**
- Modify: `TALK/lib/agent-config.mjs`, `TALK/bin/talk.mjs` (`agentSetup`, `agentSync`, `main` passes `env` to agent commands)
- Test: `TALK/test/agent-config.test.mjs`, `TALK/test/cli.test.mjs`

**Interfaces:**
- **Produces:**
  - `endConversationToolConfig(): { tool_config }`.
  - `agentConfig({ llm, toolIds, voiceId, maxDurationSeconds = 1800 })`.
  - `agentSetup({ eleven, configPath })` saves `{ agentId, toolId, endToolId }`.
  - `agentSync({ eleven, configPath, env })`.
- **Tool name:** `end_conversation`; Task 4 registers the page handler under this name.

- [ ] **Step 1: Write the failing tests**

```js
// agent-config.test.mjs
test('end_conversation is a client tool without parameters that waits for the page', () => {
  const t = endConversationToolConfig().tool_config;
  assert.equal(t.type, 'client'); assert.equal(t.name, 'end_conversation');
  assert.deepEqual(t.parameters, { type: 'object', properties: {}, required: [] });
  assert.equal(t.expects_response, true); assert.equal(t.response_timeout_secs, 10);
  assert.match(t.description, /only when Rafal says the whole conversation is over/);
});
test('the agent marks the end, keeps a break open, and carries the duration message and the first-message override', () => {
  const c = agentConfig({});
  assert.match(c.conversation_config.agent.prompt.prompt, /call end_conversation, then say goodbye in one sentence and end the call/);
  assert.match(c.conversation_config.agent.prompt.prompt, /When Rafal wants a break .+ end the call without end_conversation/);
  assert.match(c.conversation_config.agent.prompt.built_in_tools.end_call.description, /asks for a break/);
  assert.equal(c.conversation_config.agent.max_conversation_duration_message, 'Kończy się czas tego połączenia, zaraz łączę ponownie.');
  assert.equal(c.platform_settings.overrides.conversation_config_override.agent.first_message, true);
  assert.equal(c.platform_settings.privacy.retention_days, 0);
});
test('the duration limit defaults to 1800 s and takes a probe value', () => {
  assert.equal(agentConfig({}).conversation_config.conversation.max_duration_seconds, 1800);
  assert.equal(agentConfig({ maxDurationSeconds: 60 }).conversation_config.conversation.max_duration_seconds, 60);
});
// cli.test.mjs (recordingClient's createTool returns tool_1 then tool_2)
test('agent setup creates both tools, then the agent with both, and saves three ids', async () => { /* createTool ×2, createAgent tool_ids ['tool_1','tool_2'], config.agent = { agentId: 'agent_1', toolId: 'tool_1', endToolId: 'tool_2' } */ });
test('agent sync creates end_conversation once, saves its id and gives the agent both tools', async () => {
  // config agent { agentId: 'a', toolId: 't' }: calls = createTool(end), updateTool t, updateTool <end id>, updateAgent a
  // updateAgent body: conversation_config.agent.prompt.tool_ids ['t', <end id>], .agent.max_conversation_duration_message,
  // .conversation.max_duration_seconds 1800, platform_settings.overrides.conversation_config_override.agent.first_message true
  // a second sync with endToolId saved makes no createTool call
});
test('agent sync takes TALK_MAX_DURATION_SECONDS and refuses a value outside 60-7200 without any API call', async () => {
  // '60' → max_duration_seconds 60; '59', '7201', 'x' → code 2, line 'TALK_MAX_DURATION_SECONDS musi być liczbą całkowitą od 60 do 7200.', calls []
});
```

The existing test 'agent sync patches the tool and the agent from the saved ids' changes its expected call list to the one above.

- [ ] **Step 2: Run, and see the new tests fail.** `node --test test/agent-config.test.mjs test/cli.test.mjs`

- [ ] **Step 3: Implement.**
  - Add these lines to `AGENT_PROMPT`:
    - `When Rafal says the whole conversation is over (for example „Kończymy”), call end_conversation, then say goodbye in one sentence and end the call.`
    - `When Rafal wants a break („przerwa”, „wrócę za chwilę”), say that the conversation waits for him and end the call without end_conversation.`
    - `A later call may start with the last lines of the conversation: continue from them, and never treat a „tak” as a confirmation yourself.`
  - The `END_CALL` description becomes `End the call after end_conversation, when Rafal asks for a break, or when he no longer answers.`
  - The `end_conversation` tool description is `Marks the end of the whole conversation. Call it only when Rafal says the whole conversation is over (for example „Kończymy”), never for a break; then say goodbye in one sentence and end the call.`
  - `agentSync` sends `conversation_config.agent.prompt.{prompt, tool_ids, built_in_tools}`, `conversation_config.agent.max_conversation_duration_message`, `turn`, `conversation`, and `platform_settings.overrides` (the one key above).

- [ ] **Step 4: Run the whole suite, and see it pass.** `node --test test/*.test.mjs`

---

### Task 2: Bridge: a dialog of calls

**Files:**
- Create: `TALK/lib/live.mjs` (write and remove only; Task 5 adds the lookup)
- Modify: `TALK/lib/bridge.mjs`, `TALK/lib/report.mjs`
- Test: `TALK/test/bridge.test.mjs`, `TALK/test/report.test.mjs`

**Interfaces:**
- **Consumes:** nothing new.
- **Produces, in `lib/live.mjs`:**
  - `LIVE_FILE = 'bridge.json'`;
  - `writeLiveFile(dialogDir, { sessionId, origin, url })`, which also writes `pid` and `startedAt`;
  - `removeLiveFile(dialogDir)`.
- **Produces, in `lib/report.mjs`:** `closingReport({ dialogDir, origin, files, deletion, conversations })`, with an `origin: <session|hub>` line right after `dialog:`.
- **Produces, in `lib/bridge.mjs`:** `startBridge({ …Plan 2 options, origin = 'session', label = '', pauseLimitMs = 3600000, agentHangup = 'pause', rejoinFirstMessage = true })`.
- **Routes:**
  - `GET /api/status` → `{ forkReady, forkExited, ending, interruption, state: 'waiting'|'in-call'|'paused'|'ending', callLive: boolean, calls: number, pausedUntil: ISO string|null, label, agentHangup, rejoinFirstMessage }`.
  - `GET /api/conversation-token` → `409 { error: 'ending' }` once ending; `409 { error: 'call-live' }` while another call had a heartbeat within the grace; the token otherwise.
  - `POST /api/heartbeat { conversationId }`: a new id starts a call. The first heartbeat clears the first-call deadline, and a heartbeat of a new call clears the pause limit.
  - `POST /api/call-end { conversationId, reason, context }`: adds the transcript note `call ended: <reason>/<context>`, runs the call's cleanup, then either ends the dialog or pauses it. It ends the dialog when an end was requested, or when `agentHangup === 'end'` and `context === 'end_call'`. It pauses otherwise.
  - `POST /api/end-request`: marks the end. It ends at once when no call is live.
  - `POST /api/end { conversationId }`: as in Plan 2, it ends the dialog now.
- **Lost heartbeat:** a live call whose heartbeat is older than the grace is ended as `call-end` with reason `heartbeat-lost`, and the dialog pauses.
- **Call cleanup:**
  1. read `call_duration_secs`;
  2. `deleteConversation`;
  3. rewrite `transcript.md`.
  Each call is cleaned once. `end()` cleans the calls that are not yet cleaned, and reports every call and every failed deletion of the dialog.

- [ ] **Step 1: Write the failing tests** (helpers `bridge`, `call`, `waitFor` as they are):

```js
test('a call end without an end request pauses: the call is deleted and the transcript written, the fork stays', async () => {
  const b = await bridge();
  await call(b.port, 'POST', '/api/heartbeat', { body: { conversationId: 'conv_a' } });
  await call(b.port, 'POST', '/api/transcript', { body: { role: 'user', text: 'pierwsze' } });
  await call(b.port, 'POST', '/api/call-end', { body: { conversationId: 'conv_a', reason: 'agent', context: 'end_call' } });
  const s = JSON.parse((await call(b.port, 'GET', '/api/status')).body);
  assert.equal(s.state, 'paused'); assert.equal(s.calls, 1); assert.equal(s.callLive, false); assert.ok(Date.parse(s.pausedUntil) > Date.now());
  assert.deepEqual(b.eleven.calls.filter((c) => c[0] === 'delete').map((c) => c[1]), ['conv_a']);
  assert.match(readFileSync(join(b.tmp, 'dialog', 'transcript.md'), 'utf8'), /pierwsze[\s\S]*call ended: agent\/end_call/);
  assert.equal((await call(b.port, 'GET', '/api/conversation-token')).status, 200);
  await call(b.port, 'POST', '/api/end', { body: {} });
  assert.match(await b.done, /conversations: conv_a \(30 s\)/);
  assert.equal(b.eleven.calls.filter((c) => c[0] === 'delete').length, 1);
});
test('an end request makes the end of the current call end the dialog', async () => { /* heartbeat conv_a, end-request, call-end conv_a → done resolves; status never 'paused' */ });
test('an end request or the end button during a pause ends the dialog at once', async () => { /* two bridges: call-end then end-request; call-end then /api/end */ });
test('agentHangup end: an end_call context ends the dialog, a close context pauses it', async () => { /* bridge({ agentHangup: 'end' }) */ });
test('a lost heartbeat pauses the dialog instead of ending it', async () => { /* heartbeatGraceMs 200: heartbeat conv_a, wait → state paused, delete conv_a, note call ended: heartbeat-lost/ */ });
test('the pause limit ends a paused dialog with its report, and a new call cancels it', async () => { /* pauseLimitMs 300: pause → done within 2 s; second bridge: pause, heartbeat conv_b before 300 ms → still running at 600 ms */ });
test('a token is refused while another call is live and allowed once its heartbeat is lost', async () => {
  const b = await bridge({ heartbeatGraceMs: 300 });
  await call(b.port, 'POST', '/api/heartbeat', { body: { conversationId: 'conv_a' } });
  const refused = await call(b.port, 'GET', '/api/conversation-token');
  assert.equal(refused.status, 409); assert.deepEqual(JSON.parse(refused.body), { error: 'call-live' });
  await waitFor(async () => (await call(b.port, 'GET', '/api/conversation-token')).status === 200, 3000);
  await call(b.port, 'POST', '/api/end', { body: {} }); await b.done;
});
test('the live file names the session, origin and URL while the bridge runs and is gone after the end', async () => { /* replaces the .url test: bridge({ origin: 'hub' }) → bridge.json { sessionId: 's', origin: 'hub', url: b.url, pid, startedAt } */ });
test('status carries the label and the configuration the page needs', async () => { /* label 'notatki · abcdef12', agentHangup 'pause', rejoinFirstMessage true, state 'waiting', calls 0 */ });
// report.test.mjs
test('the closing report names the origin right after the dialog line', () => { /* /^TALK CLOSING REPORT\ndialog: d\norigin: hub\ndeletion: / */ });
```

These existing tests change to the new semantics:
- 'a lost heartbeat ends the conversation and deletes it' becomes the pause test above;
- 'the URL file exists…' becomes the live-file test;
- 'a page reload adds a second conversation…' keeps its assertions, because both calls are reported and deleted.

- [ ] **Step 2: Run, and see the new tests fail.** `node --test test/bridge.test.mjs test/report.test.mjs` in `TALK/`

- [ ] **Step 3: Implement.**
  - The calls live in a `Map` from id to `{ startedAt, lastBeat, endedAt, endContext, cleaned }`. `liveCall` holds the id of the call that is live, or null.
  - `ending` stays synchronous, as in Plan 2.
  - `/api/call-end` sets `liveCall` to null before its cleanup awaits anything. A token request
    that follows its response is then never refused as `call-live`, which the reconnect after the
    duration limit relies on (Task 4).
  - `bridge.json` replaces `.url`: it is written after `listen` and removed in `end()`'s `finally`.

- [ ] **Step 4: Run the whole suite, and see it pass.**

---

### Task 3: Bridge: what a later call knows

**Files:**
- Modify: `TALK/lib/bridge.mjs`, `TALK/lib/voice-prompt.mjs`
- Test: `TALK/test/bridge.test.mjs`, `TALK/test/voice-prompt.test.mjs`

**Interfaces:**
- **Consumes:**
  - Task 2's calls, and the end context each call ended with;
  - `takeSnapshot(cwd, contextDir)` from `../../hub/lib/dialog.mjs`.
- **Produces:**
  - `POST /api/ask { request, conversationId }`. `conversationId` is new, and the page sends it in Task 4.
  - `GET /api/history` → `{ transcript: [{ at, role, text }] }`.
  - `GET /api/rejoin-context` → `{ text, undelivered: number }`. It is built as in Global Constraints and clears nothing.
  - `POST /api/rejoin-context-sent { undelivered: number }` removes that many of the oldest undelivered answers. The page posts it only after `sendContextualUpdate` returned without throwing, so an answer is lost only when the SDK accepted it.

- [ ] **Step 1: Write the failing tests**

```js
test('the first ask of a later call carries the break note, once, and the snapshot is refreshed', async () => {
  // cwd: a `git init` repository; heartbeat conv_a, call-end conv_a (context end_call), delete context/status.txt, heartbeat conv_b
  const first = JSON.parse((await call(b.port, 'POST', '/api/ask', { body: { request: 'dalej', conversationId: 'conv_b' } })).body).answer;
  assert.match(first, /^echo: \(Rafał wrócił do rozmowy po 1 min przerwy\. Migawka git w context\/ odświeżona o \d\d:\d\d\.\)\nAgent głosowy przekazuje: dalej/);
  assert.ok(existsSync(join(b.tmp, 'dialog', 'context', 'status.txt')));
  const second = JSON.parse((await call(b.port, 'POST', '/api/ask', { body: { request: 'jeszcze', conversationId: 'conv_b' } })).body).answer;
  assert.match(second, /^echo: Agent głosowy przekazuje: jeszcze/);
});
test('a call renewed after the duration limit tells the fork so', async () => { /* call-end context max_duration_exceeded → note starts with (Połączenie odnowione po limicie czasu. */ });
test('the first call carries no note', async () => { /* ask on conv_a → /^echo: Agent głosowy przekazuje:/ */ });
test('an answer that arrives after its call ended goes into the next call, once', async () => {
  const b = await bridge({ forkEnv: { FAKE_DELAY_MS: '300' } });
  await call(b.port, 'POST', '/api/heartbeat', { body: { conversationId: 'conv_a' } });
  const asked = call(b.port, 'POST', '/api/ask', { body: { request: 'wolne', conversationId: 'conv_a' } });
  await call(b.port, 'POST', '/api/call-end', { body: { conversationId: 'conv_a', reason: 'error', context: 'connection_state_changed' } });
  await asked;
  await call(b.port, 'POST', '/api/heartbeat', { body: { conversationId: 'conv_b' } });
  const context = async () => JSON.parse((await call(b.port, 'GET', '/api/rejoin-context')).body);
  const first = await context();
  assert.match(first.text, /^Dalszy ciąg rozmowy po przerwie\. Ostatnie wypowiedzi:/);
  assert.match(first.text, /Odpowiedź Claude na pytanie „wolne”, której nie usłyszałeś: echo: /);
  assert.equal(first.undelivered, 1);
  assert.match((await context()).text, /której nie usłyszałeś/); // not sent yet: still there
  await call(b.port, 'POST', '/api/rejoin-context-sent', { body: { undelivered: 1 } });
  assert.doesNotMatch((await context()).text, /której nie usłyszałeś/);
  await call(b.port, 'POST', '/api/end', { body: {} }); await b.done;
});
test('the rejoin context carries the last eight lines of Rafal and the agent, without notes', async () => { /* 10 user/agent lines + 2 notes → 8 lines `- Rafał: …`/`- Agent: …`, the last 8 */ });
test('history returns the transcript so far', async () => { /* two lines posted → { transcript: [{ at, role: 'user', text }, …] } */ });
// voice-prompt.test.mjs
test('after a break note a read-back that was not confirmed is read back again', () => {
  const p = voiceStartPrompt({ projectName: 'n', sourceId: 'a', dialogDir: 'C:/d', snapshot: { git: false, cwd: 'C:/r', at: 'T' } });
  assert.match(p, /A message may begin with a note in parentheses that Rafal came back after a break or that the call was renewed after its time limit\. A decision you read back before that note and Rafal has not confirmed is read back again before his confirmation counts/);
});
```

- [ ] **Step 2: Run, and see the new tests fail.** `node --test test/bridge.test.mjs test/voice-prompt.test.mjs` in `TALK/`

- [ ] **Step 3: Implement.**
  - A heartbeat that starts a call other than the first takes the snapshot into `<dialogDir>/context` and sets the pending note. The note says „break” or „limit”, from the previous call's end context.
  - `askFork` puts the note in front of its message and then clears it.
  - When an ask's answer is ready while its `conversationId` is no longer the live call, `{ request, answer }` is added to the undelivered list.
  - The role line, appended after the line about blocked writes: `- A message may begin with a note in parentheses that Rafal came back after a break or that the call was renewed after its time limit. A decision you read back before that note and Rafal has not confirmed is read back again before his confirmation counts; the note says when the git snapshot was refreshed.`

- [ ] **Step 4: Run the whole suite, and see it pass.**

---

### Task 4: Page: breaks, rejoining and the end

**Files:**
- Modify: `TALK/web/talk.html`, `TALK/web/talk.mjs`
- Test: `TALK/test/page.test.mjs`, `TALK/test/web.test.mjs`

**Interfaces:**
- **Consumes:** the routes of Tasks 2 and 3, and the tool name `end_conversation` (Task 1).
- **Element ids:** `who` (label), `status`, `start`, `pause`, `stop`, `pending`, `decisions`, `transcript`.
- **`startSession` options:**
  - always `clientTools: { ask_claude, end_conversation }`;
  - for every call after the first, when `status.rejoinFirstMessage` is set, also `overrides: { agent: { firstMessage: 'Wracamy do rozmowy. Słucham.' } }`.

- [ ] **Step 1: Write the failing tests.**

  Extend `loadPage` in `page.test.mjs`:
  - `posts`: `[path, body]` of every POST, and `requests`: `[method, path]` of every fetch, in order;
  - token responses taken from a queue (`'conv-tok'`, then `'conv-tok-2'`);
  - a stubbed `setTimeout`, fired by `page.fireTimeouts()`;
  - session objects that record `endSession` calls.

  `ready()` returns the full Task 2 status, with `state: 'waiting'`, `calls: 0`, `label: 'notatki · abcdef12'`, `agentHangup: 'pause'` and `rejoinFirstMessage: true`.

```js
test('the page shows the session label and the transcript so far on load', async () => { /* /api/history with two lines → transcript gets them; who = 'notatki · abcdef12' */ });
test('a disconnect that is not the end pauses: the button says Połącz ponownie and the bridge hears call-end', async () => {
  // click start, onConnect({ conversationId: 'conv_a' }), onDisconnect({ reason: 'agent', context: { type: 'end_call' } })
  // posts include ['/api/call-end', { conversationId: 'conv_a', reason: 'agent', context: 'end_call' }], none is '/api/end'
  // after a status poll with { state: 'paused', calls: 1, pausedUntil }: start.textContent 'Połącz ponownie', start enabled,
  // status 'Rozmowa wstrzymana. Połącz ponownie do HH:MM; potem rozmowa się zakończy.'
});
test('a later call starts with the rejoin first message and sends the rejoin context once connected', async () => { /* status calls 1 → sessions[0].overrides.agent.firstMessage 'Wracamy do rozmowy. Słucham.'; onConnect → GET /api/rejoin-context { text, undelivered: 1 }, sendContextualUpdate(text), then posts ['/api/rejoin-context-sent', { undelivered: 1 }] */ });
test('a rejoin context the SDK refused is not marked sent', async () => { /* sendContextualUpdate throws → no /api/rejoin-context-sent post, transcript note 'rejoin context not sent' */ });
test('the duration limit ends the old call at the bridge first, then starts the next call by itself', async () => {
  // onDisconnect({ reason: 'error', context: { type: 'max_duration_exceeded' } }) with no click:
  // status 'Limit czasu połączenia. Łączę ponownie…'; the request log (posts and GETs in order) has
  // '/api/call-end' { conversationId: 'conv_a', reason: 'error', context: 'max_duration_exceeded' } before the second
  // '/api/conversation-token'; sessions.length 2 and sessions[1].conversationToken is the second token response ('conv-tok-2')
});
test('Zakończ rozmowę during a call ends the dialog without a pause', async () => { /* click stop → endSession called; the onDisconnect it triggers posts no /api/call-end; posts end with /api/end */ });
test('Przerwa ends only the call', async () => { /* click pause → endSession; onDisconnect({ reason: 'user' }) → /api/call-end, no /api/end */ });
test('a token refused because a call is live in another tab says so', async () => { /* 409 { error: 'call-live' } → 'Rozmowa trwa w innej karcie.', start enabled */ });
test('end_conversation tells the bridge and ends a call still running after 15 s', async () => { /* clientTools.end_conversation() → returns 'Koniec rozmowy przyjęty. Pożegnaj się jednym zdaniem i zakończ połączenie.', post /api/end-request; fireTimeouts → endSession called */ });
test('a dialog ended by the bridge shows the end and stops polling', async () => { /* status { state: 'ending' } → 'Rozmowa zakończona. Możesz zamknąć kartę.', intervals.size 0 */ });
// web.test.mjs
test('the page has the label and the three buttons', () => { /* id="who", id="start", id="pause" with „Przerwa”, id="stop" */ });
```

The existing page tests keep passing, after `ready()` is changed.

- [ ] **Step 2: Run, and see the new tests fail.** `node --test test/page.test.mjs test/web.test.mjs` in `TALK/`

- [ ] **Step 3: Implement.**
  - **Polling.** The status poll runs every 1 s for the life of the page. It stops on the end, or when it fails three times in a row:
    - before any call, that is `notStarted()` (as today);
    - after a call, the end text.
  - **Ends that the page starts.** „Zakończ” and „Przerwa” set a flag before `endSession`, so that the `onDisconnect` they cause takes their path:
    - „Zakończ”: `POST /api/end`;
    - „Przerwa”: `POST /api/call-end` with reason `user`.
  - **Every other `onDisconnect`** posts `/api/call-end` with `details.reason` and `details.context?.type`.
  - **After the duration limit** the page awaits the `/api/call-end` response, and only then requests the next token.
  - **Asks.** `askClaude` sends `{ request, conversationId }`.

- [ ] **Step 4: Run the whole suite, and see it pass.**

---

### Task 5: CLI: live dialogs, `reopen`, `--origin` and the transcript guard

**Files:**
- Modify: `TALK/lib/live.mjs`, `TALK/bin/talk.mjs`, `TALK/config.json`
- Test: `TALK/test/cli.test.mjs`, `TALK/test/config.test.mjs`, `TALK/test/live.test.mjs` (new)

**Interfaces:**
- **Consumes:**
  - Task 2's `bridge.json`, and the `startBridge` options `origin`, `label`, `pauseLimitMs`, `agentHangup` and `rejoinFirstMessage`;
  - the hub's `readEvents` (`../../hub/lib/registry.mjs`) and `deriveSession` (`../../hub/lib/derive.mjs`).
- **Produces, in `lib/live.mjs`:**
  - `findLiveDialog({ root, sessionId, isLive = probeBridge }): Promise<{ dir, url, origin } | null>`. It scans `<root>/projects/*/dialogs/*/bridge.json`.
  - `probeBridge(url): Promise<boolean>`: a `GET /api/status` with the URL's token, a 1500 ms timeout, and true on 200 with `ending: false`.
- **Produces, in the CLI:**
  - `check --cwd <dir> [--session <id>]` prints `{"ok":true,"project":"<key>"}`, plus `"live":{"dir":…,"origin":…}` when the session has a live dialog.
  - `start --session <id> --cwd <dir> [--subject <text>] [--origin session|hub] [--name <text>]`.
  - `reopen --session <id>` opens the live dialog's URL and prints `{"ok":true,"dialog":…,"origin":…}`. The browser is opened through `deps.openUrl`, by default `cmd /c start "" <url>`.
- **Usage line:** `Użycie: node bin/talk.mjs check --cwd <katalog> [--session <id>] | start --session <id> --cwd <katalog> [--subject <tekst>] [--origin session|hub] [--name <nazwa>] | reopen --session <id> | agent setup | agent sync`.

- [ ] **Step 1: Write the failing tests**

```js
// live.test.mjs
test('a live dialog is found by its session and a bridge.json whose bridge does not answer is not', async () => {
  // root/projects/p/dialogs/d1/bridge.json { sessionId: 's1', origin: 'hub', url: 'http://127.0.0.1:1/?t=x' }, d2 for 's2'
  assert.deepEqual(await findLiveDialog({ root, sessionId: 's1', isLive: async () => true }), { dir: d1, url: 'http://127.0.0.1:1/?t=x', origin: 'hub' });
  assert.equal(await findLiveDialog({ root, sessionId: 's1', isLive: async () => false }), null);
  assert.equal(await findLiveDialog({ root, sessionId: 's3', isLive: async () => true }), null);
  assert.equal(await findLiveDialog({ root: join(root, 'missing'), sessionId: 's1' }), null);
});
// cli.test.mjs (start under TALK_ELEVEN_STUB=1 with TALK_FAKE_CLAUDE, as the existing start tests)
test('check --session reports the live dialog of the session, and start refuses a second one', async () => {
  // start s1 → wait for bridge.json; check --session s1 → live.dir = that dir, live.origin 'session';
  // a second start --session s1 → exit 2, line starts 'Rozmowa głosowa tej sesji już trwa (' and names 'reopen --session s1'
});
test('reopen opens the live dialog of the session and refuses a session without one', async () => { /* main(['reopen','--session','s1'], env, { openUrl }) → openUrl called with the bridge URL; 's9' → code 2, 'Ta sesja nie ma otwartej rozmowy głosowej.' */ });
test('a bridge.json left by a killed bridge neither shows as live nor blocks a start', async () => { /* write a bridge.json with a dead URL for s2; check --session s2 → no live; start s2 starts */ });
test('start --origin hub reaches the report, --name the page label, and the pause limit comes from the configuration or TALK_PAUSE_LIMIT_MS', async () => {
  // TALK_PAUSE_LIMIT_MS 300: heartbeat conv_a, call-end → the report arrives by itself; report has 'origin: hub';
  // status label 'allowed · dlg-name' with --name dlg-name, 'allowed · s1' without it (session.slice(0, 8))
});
test('a session whose transcript file is missing is refused before any bridge starts, with or without hook events', async () => {
  // (1) HUB_DATA registry/<id>.events.jsonl with one event { sessionId: id, cwd, transcriptPath: <missing file> }
  //     → check --session id and start: exit 2, 'Sesja <id8> nie ma pliku transkryptu (<path>), więc nie da się z niej uruchomić rozmowy głosowej.'
  // (2) no events for id2, and no <TALK_CLAUDE_PROJECTS>/*/<id2>.jsonl → the same sentence with '(<TALK_CLAUDE_PROJECTS>/*/<id2>.jsonl)' as the path
  // (3) no events for id3, <TALK_CLAUDE_PROJECTS>/p/<id3>.jsonl exists → check passes
  // no dialog directory is created in (1) or (2)
});
test('start refuses an origin other than session or hub with usage', () => {
  const r = run(['start', '--session', 's', '--cwd', allowedRepo, '--origin', 'browser'], { TALK_ELEVEN_STUB: '1' });
  assert.equal(r.status, 2);
  assert.match(r.stdout, /^Użycie: .+--origin session\|hub/);
  assert.equal(existsSync(join(dialogRoot, 'projects')), false);
});
// config.test.mjs
test('the shipped config has the pause limit, the hang-up mode and the rejoin first message', () => { /* 60, 'pause', true */ });
```

- [ ] **Step 2: Run, and see the new tests fail.** `node --test test/live.test.mjs test/cli.test.mjs test/config.test.mjs` in `TALK/`

- [ ] **Step 3: Implement.**
  - **The transcript guard runs in `admit`**, whenever `--session` is given:
    - with hook events, the session's latest `transcriptPath` from the hub registry under `hubRoot(env)` must exist;
    - without a `transcriptPath`, a file `<projects root>/*/<id>.jsonl` must exist. The projects root is `env.TALK_CLAUDE_PROJECTS`, else `~/.claude/projects`.
  - **Existing start tests.** `testEnv` in `cli.test.mjs` gets `TALK_CLAUDE_PROJECTS` pointing at a fixture folder holding `p/s.jsonl` and `p/s1.jsonl`, so the existing start tests keep passing.
  - **`start` takes its values in this order:**
    - `pauseLimitMs`: `Number(env.TALK_PAUSE_LIMIT_MS) > 0`, else `config.pauseLimitMinutes * 60000`;
    - `agentHangup`: `config.agentHangup ?? 'pause'`;
    - `rejoinFirstMessage`: `config.rejoinFirstMessage ?? true`;
    - `label`: `` `${key} · ${values.name ?? values.session.slice(0, 8)}` ``.

- [ ] **Step 4: Run the whole suite, and see it pass.**

---

### Task 6: `TALK/SKILL.md`

**Files:**
- Modify: `TALK/SKILL.md`
- Test: `TALK/test/skill.test.mjs`

**Interfaces:**
- **Consumes:** Task 5's commands and their output.

- [ ] **Step 1: Write the failing tests**

```js
test('SKILL.md checks with the session id and reopens a live dialog instead of starting a second one', () => {
  assert.match(skill, /check --cwd "<session cwd>" --session \$\{CLAUDE_SESSION_ID\}/);
  assert.match(skill, /reopen --session \$\{CLAUDE_SESSION_ID\}/);
  assert.match(skill, /Rozmowa głosowa ponownie otwarta w przeglądarce\./);
  assert.match(skill, /origin.+hub.+report goes to the hub/s);
  assert.doesNotMatch(skill, /Start-Process/);
});
test('SKILL.md asks before carrying out prompt.md when this session had turns of its own during the dialog', () => {
  assert.match(skill, /had turns of its own .+ show Rafal the order .+ wait for his word in text/s);
});
test('SKILL.md says a conversation lives through breaks until Rafal ends it or the pause limit passes, and how to start a fresh one', () => {
  assert.match(skill, /pauseLimitMinutes/);
  assert.match(skill, /end the open conversation on its page first/);
});
```

- [ ] **Step 2: Run, and see the new tests fail.** `node --test test/skill.test.mjs` in `TALK/`

- [ ] **Step 3: Rewrite the steps.**
  - **Step 1.**
    - `check` gets `--session ${CLAUDE_SESSION_ID}`.
    - When the output has `live`, the skill runs `reopen` in the foreground and ends the turn with the status line „Rozmowa głosowa ponownie otwarta w przeglądarce.”
    - For `origin: hub` it adds that the conversation's report goes to the hub.
  - **Step 3.**
    - The conversation pauses on breaks, and the task completes only when Rafal ends it, or after the pause limit (`pauseLimitMinutes`, 60 min by default).
    - „The tab did not open” is answered with `reopen`.
  - **Step 4.**
    - Several calls may be listed: give each one's length, and the total.
    - When this session had turns of its own between the start and the report, show Rafal the order next to what the session did since, and wait for his word in text.
    - A fresh conversation needs the open one ended on its page first.

- [ ] **Step 4: Run the whole suite, and see it pass.**

---

### Task 7: Hub: `voice resolve`, the shared resolver, the voice procedure

**Files:**
- Create: `HUB/lib/resolve.mjs`
- Modify: `HUB/bin/hub.mjs` (usage comment, `voice resolve`, `dialog start` uses the resolver), `HUB/SKILL.md`, `HUB/role.md`
- Test: `HUB/test/dialog.test.mjs`, `HUB/test/skill.test.mjs`

**Interfaces:**
- **Produces:** `resolveSource({ requested, poll, derivedOf, lastPollName })`.
  - Arguments: `derivedOf(id) → { cwd, transcriptPath, sessionTitle }` and `lastPollName(id) → string|null`.
  - On success it returns `{ ok: true, source: { sessionId, name, status, cwd, transcriptPath }, twins: string[], resolvedFrom: string|null }`, with `cwd = derivedOf(source.sessionId).cwd ?? source.cwd ?? null`.
  - Otherwise it returns `{ ok: false, name: string|null, candidates: string[], error?: string }`.
- **CLI:** `HUB voice resolve --session <id> [--agents-json <file>]`.
  - It prints `{ ok: true, sessionId, name, cwd, project, busy, twins, resolvedFrom, transcriptPath, transcriptExists }`.
  - Candidates give `{ ok: false, name, candidates }` and exit 3; no cwd gives exit 3.

- [ ] **Step 1: Write the failing tests** (fixtures through `--agents-json` and registry events, as the existing `dialog start` tests):

```js
test('voice resolve takes the cwd from the session hook before the poll, with the transcript path, and launches nothing', () => {
  // events for s1: cwd 'C:\\wt', transcriptPath <existing tmp file>; agents-json lists s1 with cwd 'C:\\main'
  // HUB_CLAUDE_CMD set to a fake that records calls → after the command, no call recorded
  // out: { ok: true, sessionId: s1, cwd: 'C:\\wt', transcriptPath, transcriptExists: true, busy: false, twins: [], resolvedFrom: null }
});
test('voice resolve falls back to the poll cwd when no event names one, and reports a missing transcript', () => {
  // events for s1 without cwd, transcriptPath <tmp>/gone.jsonl (absent); agents-json s1 cwd 'C:\\main', status 'busy'
  // exit 0; out { ok: true, sessionId: s1, cwd: 'C:\\main', transcriptPath: <tmp>/gone.jsonl, transcriptExists: false, busy: true }
});
test('voice resolve resolves a restarted session by name and lists candidates when two live sessions share it', () => {
  // (1) registry events for old id o1 with sessionTitle 'notatki-x'; agents-json has n1 named 'notatki-x', no o1
  //     → exit 0, { ok: true, sessionId: n1, resolvedFrom: o1, twins: [] }
  // (2) agents-json has n1 and n2 both named 'notatki-x', no o1 → exit 3, { ok: false, name: 'notatki-x', candidates: [n1, n2] }
  // (3) live id n1 with another live n2 of the same name → exit 0, { sessionId: n1, resolvedFrom: null, twins: [n2] }
});
test('dialog start forks a worktree session from its hook cwd, not from the poll cwd', () => { /* decision „Katalog roboczy w dialog start”, variant A */ });
// skill.test.mjs
test('SKILL.md starts a voice conversation through voice resolve and the talk CLI, and sends prompt.md only after wyślij', () => {
  assert.match(skill, /HUB voice resolve --session/);
  assert.match(skill, /talk\.mjs" check --cwd "<cwd>" --session <sessionId>/);
  assert.match(skill, /talk\.mjs" start --session <sessionId> --cwd "<cwd>" --origin hub/);
  assert.match(skill, /--path dialog --session <sessionId> --origin voice\//);
  assert.match(skill, /A voice decision is never „wyślij”/);
});
test('the role file allows the voice dialog directory as the one write outside the hub data', () => { /* role.md: 'a voice conversation's dialog directory is written by the talk CLI in its own dialog root' */ });
```

The existing test 'SKILL.md names the skill hub and every command it uses exists in the CLI usage' requires `voice resolve` in the usage comment of `hub.mjs`.

- [ ] **Step 2: Run, and see the new tests fail.** `node --test` in `HUB/`.

- [ ] **Step 3: Implement.**
  - `dialog start` replaces its inline resolution (`hub.mjs:319-333`) with `resolveSource`. Under decision B it keeps `source.cwd ?? derived.cwd`.
  - **SKILL.md** gets a section „Voice conversation about a session (voice spec §19)”, with these steps:
    1. trigger phrases;
    2. `HUB voice resolve`, with candidates, twins, `resolvedFrom` and busy handled as in the dialog path, and refused when `transcriptExists` is false;
    3. `talk.mjs check`, with `live` → `talk.mjs reopen`;
    4. `talk.mjs start … --origin hub --name "<name>"`, through Bash with `run_in_background: true`;
    5. on completion:
       - the decisions and open questions as tables, and the call lengths;
       - if there is a `prompt.md`, `HUB compose --path dialog --session <sessionId> --origin voice/<dialog dir name> --body-file "<dialog dir>/prompt.md"`, then Sending steps 2–6;
       - without a `prompt.md`, nothing is sent.
  - The Boundaries list adds that voice forks start only through the talk CLI after `HUB voice resolve`.
  - In `role.md`, the write rule becomes `- Write only into ~/.claude/hub/ (through the hub CLI); a voice conversation's dialog directory is written by the talk CLI in its own dialog root. Change nothing in project repositories and never edit the skill `hub` itself.`

- [ ] **Step 4: Run both suites, and see them pass.**

- [ ] **Step 5: Ask Rafal to reinstall the hub role.** `~/.claude/hub/CLAUDE.md` is written only by `node C:/Users/rafal/.claude/skills/hub/bin/install.mjs`, which Rafal runs himself, first with `--dry-run`. Until he does, the hub session keeps the old role text.

---

### Task 8: Live check without voice (controller): a hub-launched worktree session and the pause limit

**Files:**
- Modify: none (results go to the Task 10 report)

**Interfaces:**
- **Consumes:** Tasks 2, 5 and 7, with real `claude`, under `TALK_ELEVEN_STUB=1`: no ElevenLabs call and no browser.

- [ ] **Step 1: Pick the session.** Pick a live session in `notatki` that the hub launched in a worktree (`HUB overview`). If there is none, ask Rafal to launch one through the hub.

- [ ] **Step 2: Resolve it.** Run `HUB voice resolve --session <id>`. Expected: the cwd is the worktree path, and `transcriptExists` is true.

- [ ] **Step 3: Start the bridge.**
  - Command: `TALK_ELEVEN_STUB=1 TALK_PAUSE_LIMIT_MS=60000 node TALK/bin/talk.mjs start --session <id> --cwd "<cwd>" --origin hub --name check-f1`, run in the background.
  - Read `bridge.json`, and poll `/api/status` until `forkReady: true`. This proves finding F1 for hub launches.
  - `POST /api/heartbeat { conversationId: 'conv_check' }`, then `POST /api/call-end { conversationId: 'conv_check', reason: 'agent', context: 'close' }`.
  - Expected: `state: 'paused'`, and the report arrives by itself after about 60 s, with `origin: hub` and `conversations: conv_check (0 s)`.

- [ ] **Step 4: Check the fork's boundary.** `git status` in the worktree is unchanged before and after the run.

---

### Task 9: Probe with Rafal (spec §20.1, about 3 voice minutes)

**Files:**
- Modify: `TALK/config.json` (`agentHangup`, `rejoinFirstMessage` from the result)
- Modify: `D:/Notatki/notatki/.claude/specs/2026-10-19-hub-voice-probes.md` (new section „Rejoining a conversation”)

**Interfaces:**
- **Produces:** the values of `agentHangup` and `rejoinFirstMessage`. If the fallback applies, the question „Silence in the fallback” goes to Rafal.

- [ ] **Step 1: Sync the probe agent.**
  - Set `TALK/config.json` to `"agentHangup": "pause"` and `"rejoinFirstMessage": true`. Until this task, the shipped values are `"end"` and `false` (Ruling F2 of the execution, 2026-10-22), because the live agent still has the Plan 2 prompt. The config test changes with them.
  - Run `TALK_MAX_DURATION_SECONDS=60 node TALK/bin/talk.mjs agent sync`.
  - Read the agent back, without printing the key:
    - `max_duration_seconds` 60;
    - two tool ids;
    - `max_conversation_duration_message`;
    - the `first_message` override is true.

- [ ] **Step 2: Run one dialog with Rafal in `notatki`.**
  1. „Zrób przerwę.”
  2. „Połącz ponownie”, followed by one question.
  3. Wait for the 60 s cut and the automatic next call.
  4. „Kończymy.”

  The transcript notes `call ended: <reason>/<context>` give (d) of spec §20.1.

- [ ] **Step 3: Judge.**
  - (a): `end_conversation` before the last hang-up, and no `end_conversation` at the break. If (a) fails, set `agentHangup: "end"`, and if the silence hang-up arrives as `end_call`, ask Rafal „Silence in the fallback”.
  - (b): Rafal heard „Wracamy do rozmowy. Słucham.” and the agent continued. If the session failed to start with the override, set `rejoinFirstMessage: false`.
  - (c): the duration message was spoken.
  - Record all of it in the probes report.

- [ ] **Step 4: Restore the limit.** Run `node TALK/bin/talk.mjs agent sync` without the variable, and read back `max_duration_seconds` 1800.

---

### Task 10: Acceptance with Rafal (spec §20.2), report, index

**Files:**
- Create: `D:/Notatki/notatki/.claude/specs/<date>-hub-voice-plan-3-acceptance.md`
- Modify: `D:/Notatki/notatki/.claude/projects/hub.md` (skill `project-index`)

- [ ] **Step 1: One dialog in `notatki`, with these checks:**
  - „Przerwa”, then a rejoin;
  - a closed tab, reopened from the browser history;
  - a decision read back, a break before its confirmation, and the read-back again after the rejoin;
  - a question asked right before „Przerwa”, whose answer arrives after the call ended: the agent says that answer in the next call (Ruling F3 of the execution, 2026-10-22);
  - a call cut by a temporary 120 s limit (`TALK_MAX_DURATION_SECONDS=120` `agent sync`, restored to 1800 afterwards), followed by the automatic next call;
  - `/talk` in X during a pause reopens the same page;
  - „Kończymy” ends the dialog, and X's report lists every call.

  After each call: `GET /v1/convai/conversations/<id>` → 404.

- [ ] **Step 2: From the hub, a conversation about a session in `notatki`, ending in a work order.** The hub drafts `prompt.md` with `--origin voice/<dir>`, Rafal says „wyślij”, and the session receives it and stops at the first outward action.

- [ ] **Step 3: The pause limit without voice.** `TALK_PAUSE_LIMIT_MS=60000`, one call (the stub), then the report arrives by itself. Task 8 may serve, if it ran on the final code.

- [ ] **Step 4: Write the report and update the index.** The acceptance report has the runs, the checks, the findings and any deviations. In the index, plan 3 becomes ✅, and the decisions of §20.4 move to Rozstrzygnięte.
