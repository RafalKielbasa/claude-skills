# Hub voice — Plan 2: the skill `talk`

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/talk`: in any allowlisted Claude Code session, a Polish voice conversation through an ElevenLabs agent with a restricted `claude -p` fork of that session behind it, ending in confirmed decisions, a work order and a woken session X.

**Architecture:** A global skill `~/.claude/skills/talk/` (Node, standard library only, `node --test`) whose CLI checks the project and key, prepares a dialog directory outside `~/.claude`, and runs a bridge on `127.0.0.1` as a background task of session X. The bridge serves the page, mints the ElevenLabs token, drives the fork over `stream-json`, ends the conversation and prints the closing report that wakes X. It reuses the hub's project matching and git snapshot by import. The probe code in `C:/Users/rafal/hub-probes/voice/` is the reference for every module; each is rewritten here test-first with the final review's fixes.

**Tech Stack:** Node v24, Claude Code 2.1.302, ElevenLabs Agents API, vendored `@elevenlabs/client` 1.28.0 IIFE.

**Spec:** `D:/Notatki/notatki/.claude/specs/2026-10-18-hub-voice-design.md` (accepted 2026-10-20; §3–§16). Evidence: `D:/Notatki/notatki/.claude/specs/2026-10-19-hub-voice-probes.md`.

## Global Constraints

- Skill location `C:/Users/rafal/.claude/skills/talk/` (abbreviated `TALK/`); code, comments and `SKILL.md` in English; everything Rafal reads or hears in Polish.
- No runtime dependency except the vendored client (`dist/lib.iife.js` and the `libsamplerate` worklet, hashes in `VERSION.txt`); no bundler, no CDN at runtime.
- The fork command, exactly (spec §8): `claude -p --resume <X> --fork-session --restricted --tools Read,Grep,Glob,Edit,Write --strict-mcp-config --permission-mode default --input-format stream-json --output-format stream-json --verbose --replay-user-messages --settings <dialog dir>/fork-settings.json --add-dir <dialog dir>`, started in session X's project directory.
- Fork settings: `allow` = `Edit(//c/<dialog dir, POSIX form>/**)`; `deny` = `Edit(./**)`, `Bash`, `EnterWorktree` and `Read(**/<name>)` for each hub denylist name (`.env*`, `*.pem`, `*.key`, `*credentials*`, `*secret*`, `auth.json`, `secrets.yaml`).
- Dialog directories: `C:/Users/rafal/hub-data/projects/<project key>/dialogs/<YYYY-MM-DD-HHmm>-talk/`, never under `~/.claude`.
- Initial allowlist: `notatki` and `.claude` (the hub's key for the `~/.claude` repository); a project outside it is refused before any fork starts or any ElevenLabs call is made.
- `ELEVENLABS_API_KEY`: read only by the CLI and bridge (process env, else the User environment); never printed, logged, written, sent to the page or passed to the fork.
- Agent (spec §7, §15): Haiku 5.5 (`claude-haiku-5-5`), `language: pl`, `scribe_realtime`, `eleven_v4_turbo`, `retention_days` 0, `turn_timeout` 20, built-in `end_call`, `silence_end_call_timeout` 30, tool `ask_claude` (`expects_response`, 120 s, `pre_tool_speech: force`, interruption per Task 1).
- Bridge (spec §6): binds `127.0.0.1` only; every request needs the conversation token and a local `Host`; lives only for one conversation.
- The hub skill is imported read-only (`../hub/lib/projects.mjs`, `../hub/lib/paths.mjs`, `../hub/lib/dialog.mjs`, `../hub/lib/denylist.mjs`); its own `forkSettings` stays as it is (a `hub-core` correction, hub index).
- `~/.claude` gets no manual commit: its backup hook syncs it. Vault files are committed and pushed after each finished change, staging only own paths.
- Voice minutes: Task 1 about 3, acceptance about 8; beyond the Starter plan's minutes, ask Rafal.

## Review Focus

1. **A project path with spaces** (`D:/Praca/Devstock/Baza wiedzy`) or a dialog root with spaces: the POSIX allow rule must keep the space and still match. Pinned by Task 2 (`posixPath` and settings tests).
2. **`/talk` in a project outside the allowlist**: refused with one Polish sentence before any fork, file or network call. Pinned by Task 8 (`check` test with a spy on fork start and network).
3. **Two `/talk` runs at the same time** (two sessions): separate ports and dialog directories, no shared state. Pinned by Task 2 (`dialogDirFor` names differ by minute and a numeric suffix on collision).
4. **A page reload in mid-conversation** starts a second ElevenLabs conversation: both are deleted at the end and both appear in the report. Pinned by Task 5 (bridge test with two conversation ids).
5. **A session started before the key was set** (VS Code not restarted): the key is read from the User environment without printing it. Pinned by Task 6 (`loadKey` test with an injected reader).

---

## File Structure

| Path | Responsibility |
|---|---|
| `TALK/package.json` | `{"name":"talk","private":true,"type":"module","scripts":{"test":"node --test"}}` |
| `TALK/config.json` | allowlist, dialog root, agent ids, interruption strategy |
| `TALK/SKILL.md` | the procedure session X follows (spec §5) |
| `TALK/bin/talk.mjs` | CLI: `check`, `start`, `agent setup`, `agent sync` |
| `TALK/lib/config.mjs` | read and write `config.json` |
| `TALK/lib/settings.mjs` | POSIX path form and the fork's settings |
| `TALK/lib/dialog.mjs` | dialog directory name and preparation (hub snapshot) |
| `TALK/lib/stream.mjs`, `TALK/lib/fork.mjs` | `stream-json` framing and the restricted fork process |
| `TALK/lib/voice-prompt.mjs` | the fork's role and the end message |
| `TALK/lib/report.mjs` | dialog files and the closing report |
| `TALK/lib/auth.mjs`, `TALK/lib/bridge.mjs` | request authorisation and the bridge |
| `TALK/lib/key.mjs`, `TALK/lib/eleven.mjs`, `TALK/lib/agent-config.mjs` | key loading, API client, agent and tool configuration |
| `TALK/web/talk.html`, `TALK/web/talk.mjs`, `TALK/web/vendor/*` | the page and the vendored client |
| `TALK/fakes/claude.mjs` | a `claude` stand-in speaking `stream-json` |
| `TALK/test/*.test.mjs` | tests |
| `D:/Notatki/notatki/.claude/specs/2026-10-19-hub-voice-probes.md` | Task 1 result appended |
| `D:/Notatki/notatki/.claude/specs/<YYYY-MM-DD of the run>-hub-voice-plan-2-acceptance.md` | acceptance report |
| `D:/Notatki/notatki/README.md:20` | `talk` added to the global skills |

---

### Task 1: Probe "Interruption with a contextual update" (spec §16, about 3 voice minutes)

**Files:**
- Modify: `C:/Users/rafal/hub-probes/voice/web/talk.mjs`, `C:/Users/rafal/hub-probes/voice/tools/bridge.mjs` (transcript roles)
- Modify: `D:/Notatki/notatki/.claude/specs/2026-10-19-hub-voice-probes.md` (new section)

**Interfaces:**
- Produces: the value of `config.json` `interruption`: `"contextual-update"` or `"disable-during-tool"`, used by Tasks 6 and 7.

- [ ] **Step 1: Teach the probe page to resend an interrupted answer**

In `askClaude`, record the request and set `interruptedDuringAsk = false`; `onInterruption` sets it to `true` while an ask is pending. When the bridge's answer arrives and the flag is set, call `conversation.sendContextualUpdate("Odpowiedź Claude na pytanie „<request>”, której nie usłyszałeś: <answer>")` and post `/api/transcript` `{ role: 'note', text: 'contextual update sent' }`. Still return the answer to the SDK. In the bridge, a `note` line is written as `**Notatka**`.

- [ ] **Step 2: Run one conversation with Rafal**

Start the probe bridge on the sandbox seed (`bash with-key.sh node tools/bridge.mjs --session $(cat data/seed-session.txt) --cwd C:/Users/rafal/hub-probes/repo --dialog C:/Users/rafal/hub-probes/voice-dialogs/<YYYY-MM-DD>-interrupt --agent $(node -p "require('./data/agent.json').agentId") --probe interrupt`). Rafal says „Przejrzyj cały PLAN.md i powiedz, który wybór jest najtrudniejszy i dlaczego.”, talks over the filler („a ile to potrwa?”) and then waits silently for 20 s; then „Kończymy.”

- [ ] **Step 3: Judge and record**

Passes when the transcript has the `Notatka` line, the agent's next turn conveys the fork's answer without Rafal asking again, and `asks-interrupt.jsonl` holds one ask for that question. Record verbatim in a new report section „Interruption with a contextual update (Plan 2, Task 1)” and the strategy for `config.json`: pass → `contextual-update`; fail → `disable-during-tool`. Commit and push the report.

---

### Task 2: Skill scaffold, configuration, fork settings, dialog directory

**Files:**
- Create: `TALK/package.json`, `TALK/config.json`, `TALK/lib/config.mjs`, `TALK/lib/settings.mjs`, `TALK/lib/dialog.mjs`
- Test: `TALK/test/settings.test.mjs`, `TALK/test/dialog.test.mjs`, `TALK/test/config.test.mjs`

**Interfaces:**
- Consumes: `DENYLIST` (`../../hub/lib/denylist.mjs`), `takeSnapshot(cwd, contextDir)` (`../../hub/lib/dialog.mjs`).
- Produces:
  - `loadConfig(path = <TALK>/config.json): { allow: string[], dialogRoot: string, agent: { agentId: string|null, toolId: string|null }, interruption: 'contextual-update'|'disable-during-tool' }`; `saveConfig(config, path)`.
  - `posixPath(winPath: string): string` — `C:\Users\x` or `C:/Users/x` → `//c/Users/x` (drive letter lower-cased, backslashes to slashes, spaces kept).
  - `voiceForkSettings(dialogDir: string): { permissions: { allow: string[], deny: string[] } }`; `writeVoiceForkSettings(dialogDir: string): string` (path of `fork-settings.json`).
  - `dialogDirFor({ root: string, projectKey: string, now: Date }): string` — `<root>/projects/<safe key>/dialogs/<YYYY-MM-DD-HHmm>-talk`, with `-2`, `-3`… appended when the directory exists.
  - `prepareDialog({ cwd: string, dialogDir: string }): { snapshot, settingsPath }`.

- [ ] **Step 1: Write the failing tests**

```js
test('posixPath lower-cases the drive, turns backslashes into slashes and keeps spaces', () => {
  assert.equal(posixPath('C:\\Users\\rafal\\hub data\\x'), '//c/Users/rafal/hub data/x');
  assert.equal(posixPath('D:/Praca/Devstock/Baza wiedzy'), '//d/Praca/Devstock/Baza wiedzy');
});
test('the fork may edit only the dialog directory and reads no secret', () => {
  const s = voiceForkSettings('C:/Users/rafal/hub-data/projects/notatki/dialogs/2026-10-21-1015-talk');
  assert.deepEqual(s.permissions.allow, ['Edit(//c/Users/rafal/hub-data/projects/notatki/dialogs/2026-10-21-1015-talk/**)']);
  assert.deepEqual(s.permissions.deny, ['Edit(./**)', 'Bash', 'EnterWorktree', 'Read(**/.env*)', 'Read(**/*.pem)',
    'Read(**/*.key)', 'Read(**/*credentials*)', 'Read(**/*secret*)', 'Read(**/auth.json)', 'Read(**/secrets.yaml)']);
});
test('dialog directories are named by minute and never reuse an existing one', () => {
  const root = mkdtempSync(join(tmpdir(), 't-'));
  const now = new Date(2026, 9, 21, 10, 15);
  const first = dialogDirFor({ root, projectKey: 'notatki', now });
  assert.equal(first, join(root, 'projects', 'notatki', 'dialogs', '2026-10-21-1015-talk'));
  mkdirSync(first, { recursive: true });
  assert.equal(dialogDirFor({ root, projectKey: 'notatki', now }), `${first}-2`);
});
test('the shipped config allows notatki and .claude and stores dialogs outside ~/.claude', () => {
  const c = loadConfig();
  assert.deepEqual(c.allow, ['notatki', '.claude']);
  assert.equal(c.dialogRoot, 'C:/Users/rafal/hub-data');
  assert.ok(['contextual-update', 'disable-during-tool'].includes(c.interruption));
});
```

- [ ] **Step 2: Run them and see them fail** — `cd TALK && node --test`. Expected: FAIL, modules not found.

- [ ] **Step 3: Implement** the modules above. `config.json` starts with `"agent": { "agentId": null, "toolId": null }` and the interruption strategy from Task 1. `dialogDirFor` uses the hub's `safeName` for the key.

- [ ] **Step 4: Run them and see them pass** — `node --test`. Expected: all passing.

---

### Task 3: Fork driver

**Files:**
- Create: `TALK/lib/stream.mjs`, `TALK/lib/fork.mjs`, `TALK/fakes/claude.mjs`
- Test: `TALK/test/stream.test.mjs`, `TALK/test/fork.test.mjs`

**Interfaces:**
- Produces:
  - `userLine(text: string): string`; `createTurnCollector(): { push(line: string): null | { text: string, subtype: string } }` — a `result` with `num_turns: 0` is not a turn.
  - `forkArgs({ sessionId, settingsPath, dialogDir, model? }): string[]` — the Global Constraints command without `claude`, `--add-dir` last.
  - `startFork({ cwd, sessionId, settingsPath, dialogDir, startPrompt, command = ['claude'], env, rawLog, model }): ForkHandle`, `ForkHandle = { ready: Promise<Turn>, sessionId: Promise<string|null>, ask(text, { timeoutMs = 115000 }): Promise<{ text, subtype, ms, timedOut }>, close({ deadlineMs = 30000 }): Promise<number|null> }`. A result counts only after the replay of its message; `ELEVENLABS_API_KEY` is removed from the child's environment; `close` ends stdin after the last turn or the deadline and kills the child after a second deadline.

`fakes/claude.mjs` is the probe's `fakes/fake-claude.mjs` (echo, replay with `--replay-user-messages`, `FAKE_DELAY_MS`, `FAKE_SLOW_MS`, `FAKE_SPURIOUS`, `FAKE_HANG`, `[key]` suffix when the key is present), plus `FAKE_ZERO_TURNS=1`, which prints `{"type":"result","subtype":"success","num_turns":0,"result":""}` after the first replay.

- [ ] **Step 1: Write the failing tests** — the probe's `stream.test.mjs` and `fork.test.mjs` (all eight fork tests, the `command` pointing at `../fakes/claude.mjs`), plus:

```js
test('forkArgs is the restricted command of spec §8 with --add-dir last', () => {
  assert.deepEqual(forkArgs({ sessionId: 's', settingsPath: 'p', dialogDir: 'd' }), ['-p', '--resume', 's', '--fork-session',
    '--restricted', '--tools', 'Read,Grep,Glob,Edit,Write', '--strict-mcp-config', '--permission-mode', 'default',
    '--input-format', 'stream-json', '--output-format', 'stream-json', '--verbose', '--replay-user-messages',
    '--settings', 'p', '--add-dir', 'd']);
});
test('a result with num_turns 0 after the replay is not taken as the answer', async () => {
  const f = startFork({ ...base, startPrompt: 'start', env: { FAKE_ZERO_TURNS: '1' } });
  assert.equal((await f.ready).text, 'echo: start');
  await f.close();
});
```

- [ ] **Step 2: Run and see them fail**; **Step 3: implement**; **Step 4: run and see them pass** — `node --test`.

---

### Task 4: Voice role, end message, closing report

**Files:**
- Create: `TALK/lib/voice-prompt.mjs`, `TALK/lib/report.mjs`
- Test: `TALK/test/voice-prompt.test.mjs`, `TALK/test/report.test.mjs`

**Interfaces:**
- Produces: `DECISION_PREFIX = 'Decyzja do potwierdzenia:'`, `END_PREFIX = 'KONIEC ROZMOWY'`, `voiceStartPrompt({ projectName, sourceId, dialogDir, snapshot, subject? }): string`, `endMessage(dialogDir: string): string`; `readDialogFiles(dialogDir)`, `closingReport({ dialogDir, files, deletion, conversations: { id: string, seconds: number|null }[] }): string`.

- [ ] **Step 1: Write the failing tests** — the probe's tests for both modules, the `closingReport` test extended with a line `conversations: c1 (150 s), c2 (unknown)` after `deletion:`, and:

```js
test('the introduction turn reads the git snapshot so the first question does not wait for it', () => {
  const p = voiceStartPrompt({ projectName: 'notatki', sourceId: 'abcdef12', dialogDir: 'C:/d', snapshot: { git: true, cwd: 'C:/r', at: 'T' } });
  assert.match(p, /Before you introduce yourself, read .*status\.txt.*log\.txt.*diff\.patch/s);
});
test('a subject from /talk reaches the role', () => {
  assert.match(voiceStartPrompt({ projectName: 'n', sourceId: 'a', dialogDir: 'C:/d', snapshot: { git: false, cwd: 'C:/r', at: 'T' }, subject: 'plan 3' }), /plan 3/);
});
```

- [ ] **Step 2–4:** run and fail; implement (the probe's `voice-prompt.mjs` text plus the snapshot instruction and the subject line); run and pass.

---

### Task 5: Bridge

**Files:**
- Create: `TALK/lib/auth.mjs`, `TALK/lib/bridge.mjs`
- Test: `TALK/test/auth.test.mjs`, `TALK/test/bridge.test.mjs`

**Interfaces:**
- Consumes: Tasks 2–4.
- Produces: `authorize({ url, host }, { token, port })`; `startBridge({ sessionId, cwd, dialogDir, agentId, eleven, command, forkEnv, port = 0, token, heartbeatGraceMs = 15000, firstBeatDeadlineMs = 600000, askTimeoutMs = 115000, transcriptWaitMs = 1500, openBrowser = true, subject, interruption = 'contextual-update' }): Promise<{ url, port, token, done: Promise<string> }>`. Routes as in the probe bridge plus `GET /api/status` → `{ forkReady: boolean, ending: boolean, interruption: string }`. While opening, it writes the URL to `<dialogDir>/.url` and deletes that file at the end.

- [ ] **Step 1: Write the failing tests** — the probe's `auth.test.mjs` and all ten `bridge.test.mjs` tests, plus:

```js
test('a page reload adds a second conversation; both are deleted and reported', async () => {
  const b = await bridge();
  await call(b.port, 'POST', '/api/heartbeat', { body: { conversationId: 'conv_a' } });
  await call(b.port, 'POST', '/api/heartbeat', { body: { conversationId: 'conv_b' } });
  await call(b.port, 'POST', '/api/end', { body: {} });
  const report = await b.done;
  assert.deepEqual(b.eleven.calls.filter((c) => c[0] === 'delete').map((c) => c[1]).sort(), ['conv_a', 'conv_b']);
  assert.match(report, /conversations: conv_a \(30 s\), conv_b \(30 s\)/);
});
test('a request body split inside a Polish letter is decoded intact', async () => { /* send 'zażółć' as two raw chunks split inside 'ż' to /api/transcript, then end; transcript.md contains 'zażółć' */ });
test('asks are refused once the end has started', async () => { /* /api/end, then /api/ask → answer 'Rozmowa się kończy.' and no fork ask logged */ });
test('status reports the fork ready after its introduction', async () => { /* GET /api/status before and after ready */ });
test('the URL file exists while the bridge runs and is gone after the end', async () => { /* existsSync(<dialogDir>/.url) true, then false after done */ });
```

Write the four commented tests out in full in the same style as the first; the comments are their exact scenarios.

- [ ] **Step 2–4:** run and fail; implement (body read with `req.setEncoding('utf8')`, `conversationIds` as a set, the end in `try/finally`, first-beat deadline); run and pass.

---

### Task 6: Key, ElevenLabs client, agent configuration, agent setup

**Files:**
- Create: `TALK/lib/key.mjs`, `TALK/lib/eleven.mjs`, `TALK/lib/agent-config.mjs`, `TALK/bin/talk.mjs` (`agent` commands only)
- Test: `TALK/test/key.test.mjs`, `TALK/test/eleven.test.mjs`, `TALK/test/agent-config.test.mjs`

**Interfaces:**
- Produces: `loadKey({ env = process.env, readUserEnv }): string|null` — `readUserEnv(name)` defaults to `powershell -NoProfile -Command "[Console]::Out.Write([Environment]::GetEnvironmentVariable('<name>','User'))"`; `createElevenClient(...)` (probe API, `deleteConversation` never throws); `agentConfig({ llm, toolIds, voiceId })` with name `hub-voice`; `askClaudeToolConfig({ interruptionMode: 'allow'|'disable_during_tool' })`. CLI: `node bin/talk.mjs agent setup` (creates tool and agent, saves ids to `config.json`), `node bin/talk.mjs agent sync` (patches prompt, tools, turn, built-in tools from `agentConfig`).

- [ ] **Step 1: Write the failing tests** — the probe's agent-config tests (name `hub-voice`, Haiku 5.5, `end_call`, `silence_end_call_timeout` 30, `turn_timeout` 20, „ty”), the probe's eleven tests, and:

```js
test('the key comes from the process env first, else from the User environment, never printed', () => {
  assert.equal(loadKey({ env: { ELEVENLABS_API_KEY: 'a' }, readUserEnv: () => 'b' }), 'a');
  assert.equal(loadKey({ env: {}, readUserEnv: () => 'b' }), 'b');
  assert.equal(loadKey({ env: {}, readUserEnv: () => '' }), null);
});
test('the interruption strategy maps to the tool setting', () => {
  assert.equal(askClaudeToolConfig({ interruptionMode: 'disable_during_tool' }).tool_config.interruption_mode, 'disable_during_tool');
});
```

- [ ] **Step 2–4:** run and fail; implement; run and pass.

- [ ] **Step 5: Create the production agent** — `node TALK/bin/talk.mjs agent setup`, with `interruptionMode` `allow` when Task 1 chose `contextual-update`, else `disable_during_tool`. Check with the API that the agent shows all Global Constraints values. The probe agent `hub-voice-probe` stays until the acceptance passes.

---

### Task 7: Page and vendored client

**Files:**
- Create: `TALK/web/talk.html`, `TALK/web/talk.mjs`, `TALK/web/vendor/{elevenlabs-client.iife.js,libsamplerate.worklet.js,VERSION.txt}` (copied from the probe)
- Test: `TALK/test/web.test.mjs`

**Interfaces:**
- Consumes: bridge routes (Task 5), the `interruption` field of `GET /api/status` (Task 5).

- [ ] **Step 1: Write the failing tests**

```js
test('the vendored files match the hashes in VERSION.txt', () => {
  const version = read('../web/vendor/VERSION.txt');
  for (const name of ['elevenlabs-client.iife.js', 'libsamplerate.worklet.js']) {
    const hash = createHash('sha256').update(readFileSync(new URL(`../web/vendor/${name}`, import.meta.url))).digest('hex');
    assert.match(version, new RegExp(`${hash} \\*${name.replace('.', '\\.')}`));
  }
});
test('the page loads only local files, all with the token', () => {
  const html = read('../web/talk.html');
  assert.doesNotMatch(html, /https?:\/\//);
  for (const [, src] of html.matchAll(/src="([^"]+)"/g)) assert.match(src, /\?t=__TOKEN__$/);
});
test('the page resends an interrupted answer, stops polling at the end and waits for the fork', () => {
  const js = read('../web/talk.mjs');
  for (const s of ['onInterruption', 'sendContextualUpdate', 'clearInterval(poll)', '/api/status', 'libsampleratePath']) assert.ok(js.includes(s), s);
});
```

- [ ] **Step 2–4:** run and fail; implement (the probe page plus: „Rozpocznij rozmowę” enabled only when `/api/status` says `forkReady`, with „Claude się przygotowuje…” until then; the Task 1 interruption handling when `interruption` is `contextual-update`; polling stopped at the end); run and pass.

---

### Task 8: CLI `check` and `start`, and `SKILL.md`

**Files:**
- Modify: `TALK/bin/talk.mjs`
- Create: `TALK/SKILL.md`
- Test: `TALK/test/cli.test.mjs`, `TALK/test/skill.test.mjs`

**Interfaces:**
- Consumes: everything above; `loadProjectMap`, `projectOf` (`../../hub/lib/projects.mjs`), `hubRoot` (`../../hub/lib/paths.mjs`).
- Produces: `node bin/talk.mjs check --cwd <dir>` → exit 0 and JSON `{ ok: true, project, dialogDir }`, or exit 2 and one Polish sentence; `node bin/talk.mjs start --session <id> --cwd <dir> [--subject <text>]` → runs the bridge, prints the closing report, exits 0. Both take test hooks through env: `TALK_CONFIG` (config path), `TALK_FAKE_CLAUDE` (fork command), `TALK_ELEVEN_STUB=1` (stub client), `TALK_USER_ENV_EMPTY=1` (the User-environment reader returns nothing), `TALK_FIRST_BEAT_MS` (overrides `firstBeatDeadlineMs`), `HUB_DATA`.

- [ ] **Step 1: Write the failing tests**

```js
test('check refuses a project outside the allowlist in Polish, with no dialog directory created', () => {
  const r = run(['check', '--cwd', outsideRepo], { ELEVENLABS_API_KEY: 'k' });
  assert.equal(r.status, 2);
  assert.match(r.stdout, /^Projekt .+ nie jest na liście dozwolonych dla \/talk \(.+config\.json\)\.$/m);
  assert.equal(existsSync(join(dialogRoot, 'projects')), false);
});
test('check without a key tells Rafal where to set it', () => {
  const r = run(['check', '--cwd', allowedRepo], { ELEVENLABS_API_KEY: '', TALK_USER_ENV_EMPTY: '1' });
  assert.equal(r.status, 2);
  assert.match(r.stdout, /ELEVENLABS_API_KEY/);
});
test('start with a fake fork and a stub client prints the closing report after /api/end', async () => { /* start, read the URL from <dialogDir>/.url, POST /api/end with the token, the output ends with END OF REPORT and exit code 0 */ });
test('SKILL.md runs check in the foreground and start in the background with the session id', () => {
  const skill = read('../SKILL.md');
  assert.match(skill, /^---\nname: talk\ndescription: /);
  assert.match(skill, /check --cwd/);
  assert.match(skill, /start --session \$\{CLAUDE_SESSION_ID\}/);
  assert.match(skill, /run_in_background: true/);
});
```

Write the third test out in full; the comment is its exact scenario.

- [ ] **Step 2–4:** run and fail; implement; run and pass.

`SKILL.md` (English). Description: use when Rafal types `/talk` or asks to talk about the current session by voice. Steps:
1. `node "C:/Users/rafal/.claude/skills/talk/bin/talk.mjs" check --cwd "<session cwd>"`. On exit 2, show its sentence and stop.
2. With `run_in_background: true`: `node … start --session ${CLAUDE_SESSION_ID} --cwd "<session cwd>" [--subject "<Rafal's subject>"]`.
3. End the turn with „Rozmowa głosowa otwarta w przeglądarce.” If Rafal says the tab did not open, run `powershell -NoProfile -Command "Start-Process (Get-Content -Raw '<dialog dir>\.url')"`.
4. When the task completes, read the closing report from its output, show the decisions and open questions as short Polish tables, then carry out the report's `prompt.md`, if any, under the repository's own rules. Push, tickets, GCP, a new dependency and anything outward wait for Rafal's word in text.

- [ ] **Step 5: Voiceless smoke on a real fork** — `TALK_ELEVEN_STUB=1 node bin/talk.mjs start --session $(cat C:/Users/rafal/hub-probes/voice/data/seed-session.txt) --cwd C:/Users/rafal/hub-probes/repo` with `TALK_CONFIG` allowing `repo`; from another shell, read `.url`, check `GET /api/status` until `forkReady`, post one ask and `/api/end`. Expected: a speakable answer, the report, and a dialog directory under `C:/Users/rafal/hub-data/projects/repo/dialogs/` with `transcript.md`; the fork's `init` (raw log) lists only the five file tools.

---

### Task 9: Acceptance with Rafal (spec §11), documentation, rule for proposals

**Files:**
- Create: `D:/Notatki/notatki/.claude/specs/<YYYY-MM-DD of the run>-hub-voice-plan-2-acceptance.md`
- Modify: `D:/Notatki/notatki/.claude/projects/hub.md`, `D:/Notatki/notatki/README.md:20`

- [ ] **Step 1: Run the acceptance with Rafal** in a real `notatki` session.
  - The conversation: `/talk` with at least two decisions, one open question and a work order. Rafal ends it with the „Zakończ rozmowę” button.
  - Checks:
    - decisions as read back match `decisions.md`;
    - `prompt.md` holds only confirmed items;
    - `open-questions.md` and `transcript.md` exist;
    - `git status` shows only X's later work;
    - the conversation returns `404` at ElevenLabs;
    - X proceeded and stopped at the first outward action;
    - a `curl` without the token gets `403`.
  - Two more short runs: one closed by closing the tab (lost heartbeat), and one `/talk` whose page Rafal never starts. Use `firstBeatDeadlineMs` lowered through `TALK_FIRST_BEAT_MS=120000` for this run. Each must wake X with a report and leave no conversation.
  - `/talk` in an `edu-saas` session must refuse.

- [ ] **Step 2: Write the acceptance report** (verbatim evidence per check) and update the hub index with the skill `project-index` (`hub-voice-plan-2` done or the failed checks). Add `talk` to the global skills listed in `README.md:20`. Commit and push the vault files.

- [ ] **Step 3: Propose the voice-proposal rule** (spec §9) to Rafal as the exact text for `~/.claude/CLAUDE.md`, section „Decyzje: Recommendation-First”. Add it only after his „tak”; it is his global configuration.

- [ ] **Step 4: Cleanup after his OK:** delete the probe agent `hub-voice-probe` and its tool (ElevenLabs API), and remove the probe's `with-key.sh` URL files. Keep `C:/Users/rafal/hub-probes/` as it is.
