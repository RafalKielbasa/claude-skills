# Orchestrator hub — Plan 2: the hub core

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and install the hub core — the global hook and registry, derived session state, overview, watcher, sending with send records, the questionnaire and direct command paths, the hub role and global rules — and accept it with Rafal on two trial sessions.

**Architecture:** A Claude Code skill `hub` (Node, standard library only, ESM) developed in `C:/Users/rafal/hub-dev/hub/` and installed by Rafal into `~/.claude/skills/hub/`. A global async hook appends one event per hook call to a per-session log under `~/.claude/hub/registry/`; pure modules derive each session's state from its events; a CLI (`bin/hub.mjs`) and a watcher (`bin/hub-watch.mjs`) serve the hub session, which follows `SKILL.md` and the role file.

**Tech Stack:** Node v24.20.0 (checked), `node:test`, Git Bash on Windows 11, Claude Code CLI (`claude agents --json`, `SendMessage`, `Monitor`).

**Spec:** `D:/Notatki/notatki/.claude/specs/2026-10-13-orchestrator-hub-design.md` (§4, §4.1, §5, §6.1–§6.4, §8, §9.1, §9.3, §10 "Plan 2"). Probe evidence: `D:/Notatki/notatki/.claude/specs/2026-10-13-orchestrator-hub-probes.md`.

## Global Constraints

- Platform: Windows 11; shell commands are Git Bash; Node scripts use only the standard library; ESM `.mjs` files with `"type": "module"` (pattern of the skill `code-review-master`).
- Run tests with `node --test` from the skill directory. `node --test test/` does not work on this machine (checked during plan writing).
- Development happens in `C:/Users/rafal/hub-dev/hub/`. Nothing is written into `~/.claude/` by a Claude session: the auto mode classifier refuses such writes as "[Self-Modification]" (Plan 1 ledger). Task 9 hands Rafal the install command.
- Tests use a temporary directory as the hub data root (`HUB_DATA`) and never touch the real `~/.claude/hub/` (wiki pattern `konfiguracja-z-katalogu-domowego-wchodzi-do-testow`).
- No commit and no push in any real repository; `C:/Users/rafal/hub-dev/` is not a repository. The acceptance report in the vault stays uncommitted; the final task proposes commit messages.
- Code, comments and docs in English; user-facing text in Polish (the questionnaire request, the marker `⏸ Czeka na decyzję: <one sentence>`, what the hub tells Rafal).
- Event fields, derived state, display priority, the six pre-send checks and the send record follow spec §5.1, §5.2, §5.4, §6.2 and §6.3 exactly; retention keeps 24 hours in the overview and deletes ended sessions after 14 days (§8.2).
- Plan-level readings of the spec, flagged for Rafal at the end: records live in `journal.jsonl` with `journal.md` as the readable view; the full template (§6.1) is required for `questionnaire-answers` and `dialog`, while `direct` and `questionnaire-request` need only the header line; because `SendMessage` addresses a session by name, check 1 also requires the baseline session to be the only live session with its name; the CLI accepts `--agents-json <file>` instead of running `claude agents --json`; the watcher's first run ever records the states silently.

## Review Focus

1. **A working directory with a space or Polish letters** (for example `D:\Praca\Devstock\Baza wiedzy`). Expected: the hook records `cwd` intact. Pinned by the hook test in Task 2.
2. **Two live sessions with the same name.** Expected: `prepare` refuses, because `SendMessage` would be ambiguous. Pinned by the check test in Task 7.
3. **A half-written line in an event log** (a session killed mid-write). Expected: the overview still renders and the broken line is skipped. Pinned by the overview test in Task 5.
4. **An unreadable `projects.json`.** Expected: the overview shows one error line instead of crashing. Pinned by the overview test in Task 5.
5. **The hub restarted between `prepare` and `SendMessage`.** Expected: the record stays `pending`, and approving the same text again is refused by check 3. Pinned by the CLI test in Task 7.

---

## File Structure

| Path (under `C:/Users/rafal/hub-dev/hub/`) | Responsibility |
|---|---|
| `package.json` | Module type and the `node --test` script |
| `lib/paths.mjs` | Hub data locations; `HUB_DATA` overrides the root |
| `lib/text.mjs` | Canonical hashing, the gate marker, the cross-session wrapper |
| `lib/events.mjs` | One hook input → one registry event, without content |
| `lib/registry.mjs` | Append-only event logs and per-`Stop` last-message files |
| `bin/hub-hook.mjs` | The global hook; exits 0 on every failure |
| `lib/derive.mjs` | Derived session state (spec §5.2) |
| `lib/polls.mjs` | `claude agents --json` polls and the vanished rule |
| `lib/display.mjs` | Display priority (§5.4) and `/clear` continuations |
| `lib/projects.mjs` | Project of a session (§4.1) |
| `lib/hubsessions.mjs` | `hub-sessions.json`: the hub by `cwd`, launched sessions |
| `lib/overview.mjs` | Overview rows and the rendered table (§5.6) |
| `lib/watch.mjs`, `bin/hub-watch.mjs` | Watcher transitions (§5.5) |
| `lib/compose.mjs` | Header line, questionnaire request, template check (§6.1, §6.4) |
| `lib/journal.mjs` | Send records (§6.3) |
| `lib/checks.mjs` | The six pre-send checks (§6.2) |
| `lib/confirm.mjs` | Delivery evidence and cross-session notices |
| `lib/retention.mjs` | Retention (§8.2) |
| `bin/hub.mjs` | The hub CLI |
| `lib/install.mjs`, `bin/install.mjs` | Hook registration, rules block, skill copy; run by Rafal |
| `role.md`, `SKILL.md` | The hub role file (`--append-system-prompt-file`) and procedures |
| `test/*.test.mjs`, `test/helpers.mjs`, `test/fixtures/` | Tests and fixtures (13 probe fixtures, 3 built by hand, 2 recorded in Task 3) |
| `D:/Notatki/notatki/.claude/specs/2026-10-14-orchestrator-hub-plan-2-acceptance.md` | Acceptance report (Task 10) |

All code below was run during plan writing in a scratch copy: 56 tests passing before Task 3's recorded fixture.

---

### Task 1: Skill skeleton, paths and text helpers

**Files:**
- Create: `package.json`, `lib/paths.mjs`, `lib/text.mjs`, `test/helpers.mjs`, `test/text.test.mjs`
- Create: `test/fixtures/` — copy of `C:/Users/rafal/hub-probes/data/fixtures/*.json` (13 files) and `test/fixtures/cross-session-UserPromptSubmit.json`

**Interfaces:**
- Produces: `hubRoot(env)`, `safeId(id)`, `safeName(name)`, `registryDir(root)`, `eventLogPath(root, sessionId)`, `lastDir(root, sessionId)`, `pollsPath(root)`, `hubSessionsPath(root)`, `projectsConfigPath(root)`, `watchStatePath(root)`, `projectDir(root, project)`, `journalJsonlPath(root, project)`, `journalMdPath(root, project)`, `sentDir(root, project)`, `draftsDir(root, project)`; `MARKER`, `canonical(text)`, `sha256(text)`, `parseCrossSession(prompt) → {from, fromName, fromMode, inner} | null`, `decodeEntities(text)`, `markerText(message) → string | null`, `summarize(message, max)`; test helpers `tempRoot()`, `fixture(name, overrides)`, `ev(event, at, fields)`.

- [ ] **Step 1: Create the directory, copy the probe fixtures, write the hand-built fixture**

```bash
mkdir -p C:/Users/rafal/hub-dev/hub/bin C:/Users/rafal/hub-dev/hub/lib C:/Users/rafal/hub-dev/hub/test/fixtures
cp C:/Users/rafal/hub-probes/data/fixtures/*.json C:/Users/rafal/hub-dev/hub/test/fixtures/
ls C:/Users/rafal/hub-dev/hub/test/fixtures | wc -l
```

Expected: `13`. Then write `test/fixtures/cross-session-UserPromptSubmit.json` (built from the S4 recipient event):

```json
{
  "session_id": "f27a4367-dcba-476e-9ee6-4f4525434a7b",
  "transcript_path": "<string>",
  "cwd": "C:\\Users\\rafal\\hub-probes\\repo",
  "scratchpad_dir": "<string>",
  "prompt_id": "<string>",
  "permission_mode": "auto",
  "hook_event_name": "UserPromptSubmit",
  "session_title": "probe-recipient",
  "prompt": "<cross-session-message from=\"uds:\\\\.\\pipe\\LOCAL\\cc-msg-4f2bd183e38230e3700d0e561d3ecf0a\" from-name=\"notatki-7a\" from-mode=\"prompting\">\nProbe S4: reply with the single word RECEIVED.\n</cross-session-message>"
}
```

- [ ] **Step 2: Write the failing tests**

`package.json`:

```json
{
  "name": "hub",
  "private": true,
  "type": "module",
  "scripts": { "test": "node --test" }
}
```

`test/helpers.mjs`:

```js
// Shared test helpers: a fresh temporary hub data root per test and fixture loading with overrides.
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export function tempRoot() {
  return mkdtempSync(join(tmpdir(), 'hub-test-'));
}

export function fixture(name, overrides = {}) {
  const base = JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'));
  return { ...base, ...overrides };
}

// A registry event as the hook would write it, for derive/overview tests.
let counter = 0;
export function ev(event, at, fields = {}) {
  counter += 1;
  return { id: `e${counter}`, at, event, sessionId: 's1', cwd: 'C:\\repo', promptId: 'p1', index: counter, ...fields };
}
```

`test/text.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { canonical, sha256, parseCrossSession, decodeEntities, markerText, summarize } from '../lib/text.mjs';

const fixture = (name) => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'));

test('canonical form ignores CRLF and trailing whitespace', () => {
  assert.equal(canonical('a\r\nb  \n\n'), 'a\nb');
  assert.equal(sha256('Cel\r\nx\n'), sha256('Cel\nx'));
  assert.notEqual(sha256('a'), sha256('b'));
});

test('the S4 wrapper yields the sender name and the inner text', () => {
  const parsed = parseCrossSession(fixture('cross-session-UserPromptSubmit.json').prompt);
  assert.equal(parsed.fromName, 'notatki-7a');
  assert.equal(parsed.fromMode, 'prompting');
  assert.equal(parsed.from, 'uds:\\\\.\\pipe\\LOCAL\\cc-msg-4f2bd183e38230e3700d0e561d3ecf0a');
  assert.equal(parsed.inner, 'Probe S4: reply with the single word RECEIVED.');
});

test('a multi-line inner text and CRLF line ends survive the wrapper', () => {
  const prompt = '<cross-session-message from="x" from-name="hub" from-mode="auto">\r\nline 1\nline 2 <&>\r\n</cross-session-message>';
  assert.equal(parseCrossSession(prompt).inner, 'line 1\nline 2 <&>');
});

test('a plain prompt is not a cross-session message', () => {
  assert.equal(parseCrossSession('zażółć gęślą jaźń'), null);
  assert.equal(parseCrossSession('<cross-session-message from="x">no newline</cross-session-message>'), null);
});

test('entity decoding covers the escapes an XML-like wrapper could use', () => {
  assert.equal(decodeEntities('a &lt;b&gt; &amp; &quot;c&quot; &#39;d&apos;'), 'a <b> & "c" \'d\'');
  assert.equal(decodeEntities('&amp;lt;'), '&lt;');
});

test('the gate marker is read only from the last line', () => {
  assert.equal(markerText('Pytanie?\n\n⏸ Czeka na decyzję: wybierz A albo B\n'), 'wybierz A albo B');
  assert.equal(markerText('⏸ Czeka na decyzję: stare\nGotowe.'), null);
  assert.equal(markerText(''), null);
});

test('a summary is one line and at most the given length', () => {
  assert.equal(summarize('a\n\nb   c'), 'a b c');
  const long = summarize('x'.repeat(300), 10);
  assert.equal(long.length, 10);
  assert.ok(long.endsWith('…'));
});
```

- [ ] **Step 3: Run them to see them fail**

Run: `cd C:/Users/rafal/hub-dev/hub && node --test`
Expected: FAIL — `ERR_MODULE_NOT_FOUND` for `lib/text.mjs`.

- [ ] **Step 4: Implement**

`lib/paths.mjs`:

```js
// Locations of the hub data (spec §4.1). Every function takes the data root explicitly, so tests
// run against a temporary directory and never touch the real ~/.claude/hub (HUB_DATA overrides it).
import { homedir } from 'node:os';
import { join } from 'node:path';

export function hubRoot(env = process.env) {
  return env.HUB_DATA || join(homedir(), '.claude', 'hub');
}

// Session ids and project names become file names; anything outside a safe set is replaced.
export function safeId(id) {
  return String(id || 'unknown').replace(/[^A-Za-z0-9-]/g, '_');
}

export function safeName(name) {
  return String(name || 'unknown').replace(/[<>:"/\\|?*\s]+/g, '-');
}

export const registryDir = (root) => join(root, 'registry');
export const eventLogPath = (root, sessionId) => join(registryDir(root), `${safeId(sessionId)}.events.jsonl`);
export const lastDir = (root, sessionId) => join(registryDir(root), `${safeId(sessionId)}.last`);
export const pollsPath = (root) => join(registryDir(root), 'polls.jsonl');
export const hubSessionsPath = (root) => join(root, 'hub-sessions.json');
export const projectsConfigPath = (root) => join(root, 'projects.json');
export const watchStatePath = (root) => join(root, 'watch-state.json');
export const projectDir = (root, project) => join(root, 'projects', safeName(project));
export const journalJsonlPath = (root, project) => join(projectDir(root, project), 'journal.jsonl');
export const journalMdPath = (root, project) => join(projectDir(root, project), 'journal.md');
export const sentDir = (root, project) => join(projectDir(root, project), 'sent');
export const draftsDir = (root, project) => join(projectDir(root, project), 'drafts');
```

`lib/text.mjs`:

```js
// Text helpers shared by the hook and the CLI: canonical hashing, the gate marker (spec §5.3) and
// the cross-session wrapper that a SendMessage delivery carries (spec §5.1, probe S4).
import { createHash } from 'node:crypto';

export const MARKER = '⏸ Czeka na decyzję:';

// One canonical form for every hash, so the text the hub sends and the inner text the recipient's
// hook sees compare equal despite CRLF and trailing whitespace.
export function canonical(text) {
  return String(text ?? '').replace(/\r\n/g, '\n').replace(/\s+$/, '');
}

export function sha256(text) {
  return createHash('sha256').update(canonical(text), 'utf8').digest('hex');
}

const WRAPPER = /^<cross-session-message\s([^>]*)>\r?\n([\s\S]*?)\r?\n<\/cross-session-message>\s*$/;

export function parseCrossSession(prompt) {
  const match = WRAPPER.exec(String(prompt ?? ''));
  if (!match) return null;
  const attrs = {};
  for (const attr of match[1].matchAll(/([\w-]+)="([^"]*)"/g)) attrs[attr[1]] = attr[2];
  return {
    from: attrs.from ?? null,
    fromName: attrs['from-name'] ?? null,
    fromMode: attrs['from-mode'] ?? null,
    inner: match[2],
  };
}

// Whether the wrapper escapes <, & and " in the inner text is checked in Task 0; the hook records
// the hash of the raw inner text and of the entity-decoded one, and either may confirm delivery.
export function decodeEntities(text) {
  const map = { lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'", amp: '&' };
  return String(text).replace(/&(lt|gt|quot|apos|#39|amp);/g, (_, name) => map[name]);
}

export function markerText(message) {
  const lastLine = String(message ?? '').trimEnd().split('\n').pop().trim();
  return lastLine.startsWith(MARKER) ? lastLine.slice(MARKER.length).trim() : null;
}

export function summarize(message, max = 200) {
  const oneLine = String(message ?? '').replace(/\s+/g, ' ').trim();
  return oneLine.length > max ? `${oneLine.slice(0, max - 1)}…` : oneLine;
}
```

- [ ] **Step 5: Run the tests**

Run: `cd C:/Users/rafal/hub-dev/hub && node --test`
Expected: `ℹ pass 8`, `ℹ fail 0` (7 tests plus `test/helpers.mjs`, which the runner counts as a test file).

- [ ] **Step 6: Checkpoint** — no commit (`hub-dev` is not a repository).

---

### Task 2: The global hook and the registry

**Files:**
- Create: `lib/events.mjs`, `lib/registry.mjs`, `bin/hub-hook.mjs`, `test/hook.test.mjs`

**Interfaces:**
- Consumes: `sha256`, `parseCrossSession`, `decodeEntities`, `markerText`, `summarize` (Task 1); `safeId`, `registryDir`, `eventLogPath`, `lastDir`, `hubRoot` (Task 1).
- Produces: `buildEvent(input, {id, at}) → {event, lastMessage?} | null`; event fields `id, at, event, sessionId, cwd, promptId` plus `promptHash, sessionTitle?, fromName?, fromMode?, innerHash?, innerHashDecoded?` (UserPromptSubmit), `tool, target, toolUseId` (PostToolUse), `kind: 'permission_prompt'` (Notification), `summary, marker, lastFile` (Stop), `error, errorDetails` (StopFailure), `reason` (SessionEnd); `recordHook(root, input, {id, at}) → event | null`; `readEvents(root, sessionId) → {events, broken}` (each event gets `index`); `listSessionIds(root)`; `lastMessagePath(root, stopEvent)`.

- [ ] **Step 1: Write the failing tests**

`test/hook.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildEvent } from '../lib/events.mjs';
import { recordHook, readEvents } from '../lib/registry.mjs';
import { sha256 } from '../lib/text.mjs';
import { tempRoot, fixture } from './helpers.mjs';

const HOOK = fileURLToPath(new URL('../bin/hub-hook.mjs', import.meta.url));
const meta = (id = 'e1') => ({ id, at: '2026-10-14T10:00:00.000Z' });

test('every recorded kind keeps prompt_id and drops content', () => {
  const ups = buildEvent(fixture('UserPromptSubmit.json', { session_id: 's1', prompt_id: 'p1', prompt: 'tajny tekst' }), meta()).event;
  assert.equal(ups.promptId, 'p1');
  assert.equal(ups.promptHash, sha256('tajny tekst'));
  assert.ok(!JSON.stringify(ups).includes('tajny tekst'));

  const bash = buildEvent(fixture('PostToolUse-Bash.json', {
    session_id: 's1', tool_input: { command: 'curl -H "Authorization: secret"', description: 'Fetch status' },
  }), meta()).event;
  assert.equal(bash.tool, 'Bash');
  assert.equal(bash.target, 'Fetch status');
  assert.ok(!JSON.stringify(bash).includes('secret'));
  assert.ok(!('tool_response' in bash));

  const read = buildEvent(fixture('PostToolUse-Read.json', { tool_input: { file_path: 'C:\\repo\\a.md' } }), meta()).event;
  assert.equal(read.target, 'C:\\repo\\a.md');

  const end = buildEvent(fixture('SessionEnd.json', { reason: 'clear' }), meta()).event;
  assert.equal(end.reason, 'clear');
});

test('only a permission_prompt notification becomes an event', () => {
  assert.equal(buildEvent(fixture('Notification-idle_prompt.json'), meta()), null);
  assert.equal(buildEvent(fixture('Notification-permission_prompt.json'), meta()).event.kind, 'permission_prompt');
});

test('StopFailure records the documented error field', () => {
  const failure = buildEvent({ hook_event_name: 'StopFailure', session_id: 's1', prompt_id: 'p1', error: 'rate_limit', error_details: '429 Too Many Requests' }, meta()).event;
  assert.equal(failure.error, 'rate_limit');
  assert.equal(failure.errorDetails, '429 Too Many Requests');
});

test('a cross-session prompt records the sender and inner-text hashes, never the text', () => {
  const event = buildEvent(fixture('cross-session-UserPromptSubmit.json'), meta()).event;
  assert.equal(event.fromName, 'notatki-7a');
  assert.equal(event.innerHash, sha256('Probe S4: reply with the single word RECEIVED.'));
  assert.equal(event.sessionTitle, 'probe-recipient');
  assert.ok(!JSON.stringify(event).includes('RECEIVED'));
});

test('a multi-line inner text with <, & and " hashes the same raw or entity-decoded', () => {
  const text = 'Cel\nline <a> & "b"';
  const raw = `<cross-session-message from="x" from-name="hub" from-mode="auto">\n${text}\n</cross-session-message>`;
  const escaped = `<cross-session-message from="x" from-name="hub" from-mode="auto">\nCel\nline &lt;a&gt; &amp; &quot;b&quot;\n</cross-session-message>`;
  const rawEvent = buildEvent({ hook_event_name: 'UserPromptSubmit', session_id: 's1', prompt: raw }, meta()).event;
  const escapedEvent = buildEvent({ hook_event_name: 'UserPromptSubmit', session_id: 's1', prompt: escaped }, meta()).event;
  assert.equal(rawEvent.innerHash, sha256(text));
  assert.equal(escapedEvent.innerHashDecoded, sha256(text));
});

test('each Stop writes its own last-message file and the event references it', () => {
  const root = tempRoot();
  const first = recordHook(root, fixture('Stop-marker.json', { session_id: 's1', last_assistant_message: 'Pytanie?\n⏸ Czeka na decyzję: A czy B' }), meta('stop-1'));
  const second = recordHook(root, fixture('Stop-plain.json', { session_id: 's1', last_assistant_message: 'Gotowe.' }), meta('stop-2'));
  assert.equal(first.marker, 'A czy B');
  assert.equal(second.marker, null);
  assert.notEqual(first.lastFile, second.lastFile);
  assert.equal(readFileSync(join(root, 'registry', first.lastFile), 'utf8'), 'Pytanie?\n⏸ Czeka na decyzję: A czy B');
  assert.equal(readEvents(root, 's1').events.length, 2);
});

test('the hook script records an event and exits 0 on broken input and an unwritable root', () => {
  const root = tempRoot();
  const ok = spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify(fixture('UserPromptSubmit.json', { session_id: 's1', prompt: 'zażółć gęślą jaźń', cwd: 'D:\\Praca\\Devstock\\Baza wiedzy' })),
    env: { ...process.env, HUB_DATA: root },
  });
  assert.equal(ok.status, 0);
  const [event] = readEvents(root, 's1').events;
  assert.equal(event.cwd, 'D:\\Praca\\Devstock\\Baza wiedzy');
  assert.equal(event.promptHash, sha256('zażółć gęślą jaźń'));

  const broken = spawnSync(process.execPath, [HOOK], { input: 'not json', env: { ...process.env, HUB_DATA: root } });
  assert.equal(broken.status, 0);
  assert.equal(broken.stdout.length + broken.stderr.length, 0);

  const unwritable = spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify(fixture('UserPromptSubmit.json')),
    env: { ...process.env, HUB_DATA: 'Z:\\nonexistent\\hub' },
  });
  assert.equal(unwritable.status, 0);
  assert.equal(unwritable.stdout.length + unwritable.stderr.length, 0);
});

test('parallel hook processes of one session lose no event', async () => {
  const root = tempRoot();
  const runs = Array.from({ length: 12 }, (_, i) => new Promise((resolve) => {
    const child = spawn(process.execPath, [HOOK], { env: { ...process.env, HUB_DATA: root } });
    child.on('exit', resolve);
    child.stdin.end(JSON.stringify(fixture('PostToolUse-Read.json', { session_id: 's1', tool_input: { file_path: `f${i}` } })));
  }));
  await Promise.all(runs);
  const { events, broken } = readEvents(root, 's1');
  assert.equal(broken, 0);
  assert.equal(events.length, 12);
  assert.equal(new Set(events.map((event) => event.id)).size, 12);
  assert.ok(!existsSync(join(root, 'registry', 's1.last')));
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `cd C:/Users/rafal/hub-dev/hub && node --test`
Expected: FAIL — `ERR_MODULE_NOT_FOUND` for `lib/events.mjs`.

- [ ] **Step 3: Implement**

`lib/events.mjs`:

```js
// Turns one Claude Code hook input into one registry event (spec §5.1). Never keeps prompt text,
// full commands or tool responses; a Stop also hands back its full message for its own file.
import { sha256, parseCrossSession, decodeEntities, markerText, summarize } from './text.mjs';
import { safeId } from './paths.mjs';

function toolTarget(toolInput) {
  const value = toolInput?.file_path ?? toolInput?.notebook_path ?? toolInput?.description ?? toolInput?.pattern ?? '';
  return String(value).slice(0, 200);
}

export function buildEvent(input, { id, at }) {
  const base = {
    id,
    at,
    event: input?.hook_event_name ?? null,
    sessionId: input?.session_id ?? null,
    cwd: input?.cwd ?? null,
    promptId: input?.prompt_id ?? null,
  };
  switch (base.event) {
    case 'UserPromptSubmit': {
      const event = { ...base, promptHash: sha256(input.prompt ?? '') };
      if (input.session_title) event.sessionTitle = input.session_title;
      const wrapped = parseCrossSession(input.prompt ?? '');
      if (wrapped) {
        event.fromName = wrapped.fromName;
        event.fromMode = wrapped.fromMode;
        event.innerHash = sha256(wrapped.inner);
        event.innerHashDecoded = sha256(decodeEntities(wrapped.inner));
      }
      return { event };
    }
    case 'PostToolUse':
      return {
        event: { ...base, tool: input.tool_name ?? null, target: toolTarget(input.tool_input), toolUseId: input.tool_use_id ?? null },
      };
    case 'Notification':
      // Only a pending permission prompt is a state change; idle_prompt and the rest are ignored.
      return input.notification_type === 'permission_prompt' ? { event: { ...base, kind: 'permission_prompt' } } : null;
    case 'Stop': {
      const message = String(input.last_assistant_message ?? '');
      return {
        event: {
          ...base,
          summary: summarize(message),
          marker: markerText(message),
          lastFile: `${safeId(base.sessionId)}.last/${id}.md`,
        },
        lastMessage: message,
      };
    }
    case 'StopFailure':
      return { event: { ...base, error: input.error ?? 'unknown', errorDetails: input.error_details ?? null } };
    case 'SessionEnd':
      return { event: { ...base, reason: input.reason ?? null } };
    default:
      return null;
  }
}
```

`lib/registry.mjs`:

```js
// The append-only registry (spec §4.1, §5.1): one event log per session, one last-message file per
// Stop. Writers only append or create files named by a fresh event id, so concurrent hooks of one
// session never overwrite each other (probe S3).
import { appendFileSync, mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { buildEvent } from './events.mjs';
import { registryDir, eventLogPath, lastDir } from './paths.mjs';

export function recordHook(root, input, { id, at }) {
  const built = buildEvent(input, { id, at });
  if (!built) return null;
  const { event, lastMessage } = built;
  mkdirSync(registryDir(root), { recursive: true });
  if (lastMessage !== undefined) {
    const dir = lastDir(root, event.sessionId);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, `${id}.md`), lastMessage, 'utf8');
  }
  appendFileSync(eventLogPath(root, event.sessionId), `${JSON.stringify(event)}\n`, 'utf8');
  return event;
}

// Events of one session with their line index; a broken line is counted, never fatal.
export function readEvents(root, sessionId) {
  const path = eventLogPath(root, sessionId);
  if (!existsSync(path)) return { events: [], broken: 0 };
  const events = [];
  let broken = 0;
  readFileSync(path, 'utf8').split('\n').forEach((line, index) => {
    if (!line.trim()) return;
    try {
      events.push({ ...JSON.parse(line), index });
    } catch {
      broken += 1;
    }
  });
  return { events, broken };
}

export function listSessionIds(root) {
  const dir = registryDir(root);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith('.events.jsonl'))
    .map((name) => name.slice(0, -'.events.jsonl'.length));
}

export function lastMessagePath(root, stopEvent) {
  return stopEvent?.lastFile ? join(registryDir(root), stopEvent.lastFile) : null;
}
```

`bin/hub-hook.mjs`:

```js
#!/usr/bin/env node
// Global Claude Code hook (spec §4, §5.1): records one event per call into the hub registry.
// It never blocks a session: every failure ends with exit code 0 and no output.
import { randomUUID } from 'node:crypto';
import { hubRoot } from '../lib/paths.mjs';
import { recordHook } from '../lib/registry.mjs';

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  raw += chunk;
});
process.stdin.on('end', () => {
  try {
    recordHook(hubRoot(), JSON.parse(raw), { id: randomUUID(), at: new Date().toISOString() });
  } catch {
    // never block a session
  }
  process.exit(0);
});
process.stdin.on('error', () => process.exit(0));
```

- [ ] **Step 4: Run the tests**

Run: `cd C:/Users/rafal/hub-dev/hub && node --test`
Expected: `ℹ pass 16`, `ℹ fail 0`.

- [ ] **Step 5: Checkpoint** — no commit.

---

### Task 3: Check the cross-session wrapper with a real multi-line message

Spec §6.3 and §10: before delivery confirmation relies on the hash, check how `SendMessage` wraps a multi-line text containing `<`, `&` and `"`. Executed by the controller with Rafal: it needs a live recipient session and the controller's own `SendMessage` tool (load it with ToolSearch `select:SendMessage,ListAgents`). The sandbox repository `C:/Users/rafal/hub-probes/repo` still records raw hook inputs (Plan 1 probe hooks) into `C:/Users/rafal/hub-probes/data/events/`.

**Files:**
- Create: `test/fixtures/cross-session-multiline.sent.md`, `test/fixtures/cross-session-multiline.json`
- Modify: `test/hook.test.mjs` (append one test)

**Interfaces:**
- Consumes: `buildEvent` (Task 2), `sha256` (Task 1).
- Produces: the recorded wrapper fixture that Task 7's delivery confirmation relies on.

- [ ] **Step 1: Recipient**

Ask Rafal: `cd "C:/Users/rafal/hub-probes/repo" && claude --name probe-wrap`, and leave it idle.

- [ ] **Step 2: Write the exact text to send**

Write `test/fixtures/cross-session-multiline.sent.md` with exactly this content (no trailing blank line):

```markdown
[hub · direct · sandbox · probe-wr · 2026-10-14 12:00]

Wrapper check, line 2.
Special characters: <tag attr="v"> & "quoted" 'single' > end.
Polish: zażółć gęślą jaźń.
Reply with the single word RECEIVED.
```

- [ ] **Step 3: Send it**

`SendMessage` to `probe-wrap` with `message` = the file content exactly. Record the tool result verbatim (expected: `"success":true` and a `msg_id`).

- [ ] **Step 4: Extract the recorded prompt as a fixture**

```bash
cd C:/Users/rafal/hub-probes/data/events
F=$(grep -l "Wrapper check, line 2." *.jsonl | head -n 1)
node -e '
const fs = require("fs");
const line = fs.readFileSync(process.argv[1], "utf8").trim().split("\n").map(JSON.parse)
  .find((r) => r.event === "UserPromptSubmit" && String(r.input.prompt).includes("Wrapper check, line 2."));
const i = line.input;
const out = { hook_event_name: i.hook_event_name, session_id: i.session_id, cwd: i.cwd, prompt_id: i.prompt_id, session_title: i.session_title, prompt: i.prompt };
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 2) + "\n");
console.log(JSON.stringify(i.prompt));
' "$F" C:/Users/rafal/hub-dev/hub/test/fixtures/cross-session-multiline.json
```

Expected: one JSON string starting with `<cross-session-message from=` and containing the sent text. Write down verbatim whether `<`, `&` and `"` inside the text appear raw or as entities.

- [ ] **Step 5: Append the test to `test/hook.test.mjs`**

```js
test('the real multi-line wrapper from Task 3 confirms delivery of the sent text', () => {
  const event = buildEvent(fixture('cross-session-multiline.json'), meta()).event;
  const sent = readFileSync(new URL('./fixtures/cross-session-multiline.sent.md', import.meta.url), 'utf8');
  assert.ok(event.innerHash === sha256(sent) || event.innerHashDecoded === sha256(sent),
    `neither hash matches: raw ${event.innerHash}, decoded ${event.innerHashDecoded}, sent ${sha256(sent)}`);
});
```

- [ ] **Step 6: Run the tests**

Run: `cd C:/Users/rafal/hub-dev/hub && node --test`
Expected: `ℹ pass 17`, `ℹ fail 0`. If the new test fails, the wrapper changes the text in a way neither hash covers: stop the plan and take the recorded prompt to Rafal as a spec impact on §6.3 (delivery confirmation).

- [ ] **Step 7: Close the recipient** — ask Rafal to `/exit` `probe-wrap`. Note the result (raw or entities) for the final report.

---

### Task 4: Derived session state

**Files:**
- Create: `lib/derive.mjs`, `test/fixtures/s11-queued.json`, `test/derive.test.mjs`

**Interfaces:**
- Consumes: registry events as produced by Task 2 (fields listed there, plus `index`).
- Produces: `sortEvents(events)`; `deriveSession(events) → {sessionId, phase: 'working'|'turn-ended'|'ended'|null, phaseSince, waiting: {kind:'permission'|'decision', since, promptId, text?}|null, problem, lastAction: {tool, target, at}|null, queuedPromptId, lastStop, lastPromptFromName, sessionTitle, cwd, firstAt, lastEventAt, endedAt, endReason, activity}`.

- [ ] **Step 1: Write the fixture (the S11 events of session `8db2b062`, idle notifications left out because the hook ignores them)**

`test/fixtures/s11-queued.json`:

```json
[
  { "at": "2026-10-14T05:28:05.944Z", "event": "Stop", "promptId": "2e0ae0f2", "marker": "czy akceptujesz proponowaną strukturę `notes.md`." },
  { "at": "2026-10-14T05:28:07.618Z", "event": "UserPromptSubmit", "promptId": "dfbfb101" },
  { "at": "2026-10-14T05:28:15.356Z", "event": "PostToolUse", "promptId": "dfbfb101", "tool": "Write", "target": "notes.md" },
  { "at": "2026-10-14T05:28:16.125Z", "event": "PostToolUse", "promptId": "dfbfb101", "tool": "Bash", "target": "git status" },
  { "at": "2026-10-14T05:28:18.435Z", "event": "UserPromptSubmit", "promptId": "dfbfb101" },
  { "at": "2026-10-14T05:28:21.546Z", "event": "Stop", "promptId": "dfbfb101", "marker": null },
  { "at": "2026-10-14T05:28:36.180Z", "event": "PostToolUse", "promptId": "f229e27f", "tool": "Write", "target": "spec.md" },
  { "at": "2026-10-14T05:28:36.384Z", "event": "PostToolUse", "promptId": "f229e27f", "tool": "Bash", "target": "git status" },
  { "at": "2026-10-14T05:28:46.604Z", "event": "Stop", "promptId": "f229e27f", "marker": "review `spec.md` (akceptujesz czy coś zmienić)." },
  { "at": "2026-10-14T05:29:55.050Z", "event": "UserPromptSubmit", "promptId": "617d5c90" },
  { "at": "2026-10-14T05:30:02.718Z", "event": "UserPromptSubmit", "promptId": "617d5c90" },
  { "at": "2026-10-14T05:30:02.964Z", "event": "Stop", "promptId": "617d5c90", "marker": null },
  { "at": "2026-10-14T05:30:08.351Z", "event": "PostToolUse", "promptId": "df105060", "tool": "Grep", "target": "Log" },
  { "at": "2026-10-14T05:30:12.592Z", "event": "Stop", "promptId": "df105060", "marker": "wariant A (`notes.md`) czy B (`NOTES.md`)." }
]
```

- [ ] **Step 2: Write the failing tests**

`test/derive.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { deriveSession } from '../lib/derive.mjs';
import { ev } from './helpers.mjs';

const s11 = JSON.parse(readFileSync(new URL('./fixtures/s11-queued.json', import.meta.url), 'utf8'))
  .map((event, index) => ({ id: `s11-${index}`, sessionId: '8db2b062', cwd: 'C:\\repo', index, ...event }));
const upTo = (time) => deriveSession(s11.filter((event) => event.at <= `2026-10-14T${time}`));

test('the S11 queued prompt keeps the session working through the earlier turn\'s Stop', () => {
  assert.equal(upTo('05:28:06.000Z').waiting.kind, 'decision');
  assert.equal(upTo('05:28:18.500Z').queuedPromptId, 'dfbfb101');
  const afterEarlierStop = upTo('05:28:22.000Z');
  assert.equal(afterEarlierStop.phase, 'working');
  assert.equal(afterEarlierStop.waiting, null);
  const afterOwnStop = upTo('05:28:47.000Z');
  assert.equal(afterOwnStop.phase, 'turn-ended');
  assert.equal(afterOwnStop.queuedPromptId, null);
  assert.equal(afterOwnStop.waiting.text, 'review `spec.md` (akceptujesz czy coś zmienić).');
});

test('the second S11 queued sequence behaves the same', () => {
  assert.equal(upTo('05:30:03.000Z').phase, 'working');
  const end = upTo('05:30:13.000Z');
  assert.equal(end.phase, 'turn-ended');
  assert.equal(end.waiting.kind, 'decision');
});

test('a permission wait clears only with a later event of the same prompt_id', () => {
  const base = [
    ev('UserPromptSubmit', '2026-10-14T10:00:00Z', { promptId: 'p1' }),
    ev('Notification', '2026-10-14T10:00:10Z', { promptId: 'p1', kind: 'permission_prompt' }),
  ];
  assert.equal(deriveSession(base).waiting.kind, 'permission');
  assert.equal(deriveSession([...base, ev('PostToolUse', '2026-10-14T10:00:20Z', { promptId: 'p2', tool: 'Read' })]).waiting.kind, 'permission');
  assert.equal(deriveSession([...base, ev('PostToolUse', '2026-10-14T10:00:05Z', { promptId: 'p1', tool: 'Read' })]).waiting.kind, 'permission');
  assert.equal(deriveSession([...base, ev('PostToolUse', '2026-10-14T10:00:20Z', { promptId: 'p1', tool: 'Read' })]).waiting, null);
  assert.equal(deriveSession([...base, ev('Stop', '2026-10-14T10:00:30Z', { promptId: 'p1', marker: null })]).waiting, null);
});

test('out-of-order lines are derived by hook start time', () => {
  const events = [
    ev('Stop', '2026-10-14T10:00:30Z', { promptId: 'p1', marker: 'A czy B' }),
    ev('UserPromptSubmit', '2026-10-14T10:00:00Z', { promptId: 'p1' }),
  ];
  const state = deriveSession(events);
  assert.equal(state.phase, 'turn-ended');
  assert.equal(state.waiting.kind, 'decision');
});

test('a hub-caused prompt clears a decision wait and is remembered as from the hub', () => {
  const state = deriveSession([
    ev('Stop', '2026-10-14T10:00:00Z', { promptId: 'p1', marker: 'A czy B' }),
    ev('UserPromptSubmit', '2026-10-14T10:01:00Z', { promptId: 'p2', fromName: 'hub', innerHash: 'h' }),
  ]);
  assert.equal(state.waiting, null);
  assert.equal(state.phase, 'working');
  assert.equal(state.lastPromptFromName, 'hub');
});

test('StopFailure sets a problem and SessionEnd ends the session', () => {
  const failed = deriveSession([ev('UserPromptSubmit', '2026-10-14T10:00:00Z'), ev('StopFailure', '2026-10-14T10:00:05Z', { error: 'rate_limit' })]);
  assert.equal(failed.problem, 'rate_limit');
  const ended = deriveSession([ev('UserPromptSubmit', '2026-10-14T10:00:00Z'), ev('SessionEnd', '2026-10-14T10:05:00Z', { reason: 'clear' })]);
  assert.equal(ended.phase, 'ended');
  assert.equal(ended.endReason, 'clear');
  assert.equal(ended.endedAt, '2026-10-14T10:05:00Z');
});

test('a SessionEnd-only log is tolerated and counts no activity', () => {
  const state = deriveSession([ev('SessionEnd', '2026-10-14T10:05:00Z', { reason: 'other' })]);
  assert.equal(state.phase, 'ended');
  assert.equal(state.activity, 0);
});
```

- [ ] **Step 3: Run them to see them fail**

Run: `cd C:/Users/rafal/hub-dev/hub && node --test`
Expected: FAIL — `ERR_MODULE_NOT_FOUND` for `lib/derive.mjs`.

- [ ] **Step 4: Implement**

`lib/derive.mjs`:

```js
// Derived session state from its registry events (spec §5.2). Pure: events in, state out.
// Events are ordered by hook start time, then by line order.

export function sortEvents(events) {
  return [...events].sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : (a.index ?? 0) - (b.index ?? 0)));
}

export function deriveSession(events) {
  const state = {
    sessionId: events[0]?.sessionId ?? null,
    phase: null,
    phaseSince: null,
    waiting: null,
    problem: null,
    lastAction: null,
    queuedPromptId: null,
    lastStop: null,
    lastPromptFromName: null,
    sessionTitle: null,
    cwd: null,
    firstAt: null,
    lastEventAt: null,
    endedAt: null,
    endReason: null,
    activity: 0,
  };
  const seenPromptIds = new Set();
  const setPhase = (phase, at) => {
    if (state.phase !== phase) state.phaseSince = at;
    state.phase = phase;
  };

  for (const event of sortEvents(events)) {
    state.firstAt ??= event.at;
    state.lastEventAt = event.at;
    if (event.cwd) state.cwd = event.cwd;
    if (event.event !== 'SessionEnd') state.activity += 1;

    switch (event.event) {
      case 'UserPromptSubmit':
        // A prompt carrying a prompt_id already seen in this session was queued behind a running turn.
        if (event.promptId && seenPromptIds.has(event.promptId)) state.queuedPromptId = event.promptId;
        setPhase('working', event.at);
        state.waiting = null;
        state.problem = null;
        state.lastPromptFromName = event.fromName ?? null;
        if (event.sessionTitle) state.sessionTitle = event.sessionTitle;
        break;
      case 'PostToolUse':
        setPhase('working', event.at);
        state.lastAction = { tool: event.tool, target: event.target, at: event.at };
        if (state.waiting?.kind === 'permission' && state.waiting.promptId === event.promptId && event.at >= state.waiting.since) {
          state.waiting = null;
        }
        break;
      case 'Notification':
        state.waiting = { kind: 'permission', since: event.at, promptId: event.promptId };
        break;
      case 'Stop': {
        state.lastStop = event;
        if (state.waiting?.kind === 'permission' && state.waiting.promptId === event.promptId) state.waiting = null;
        if (state.queuedPromptId && event.promptId === state.queuedPromptId) {
          // The earlier turn ended; the queued prompt still runs, so the session keeps working.
          setPhase('working', event.at);
          break;
        }
        if (state.queuedPromptId) state.queuedPromptId = null;
        setPhase('turn-ended', event.at);
        if (event.marker) state.waiting = { kind: 'decision', since: event.at, text: event.marker, promptId: event.promptId };
        break;
      }
      case 'StopFailure':
        state.problem = event.error ?? 'unknown';
        setPhase('turn-ended', event.at);
        break;
      case 'SessionEnd':
        setPhase('ended', event.at);
        state.waiting = null;
        state.endedAt = event.at;
        state.endReason = event.reason ?? null;
        break;
      default:
        break;
    }
    if (event.promptId) seenPromptIds.add(event.promptId);
  }
  return state;
}
```

- [ ] **Step 5: Run the tests**

Run: `cd C:/Users/rafal/hub-dev/hub && node --test`
Expected: `ℹ pass 24`, `ℹ fail 0`.

- [ ] **Step 6: Checkpoint** — no commit.

---

### Task 5: Polls, display priority, projects and the overview

**Files:**
- Create: `lib/polls.mjs`, `lib/display.mjs`, `lib/projects.mjs`, `lib/hubsessions.mjs`, `lib/overview.mjs`, `test/overview.test.mjs`

**Interfaces:**
- Consumes: `readEvents`, `listSessionIds` (Task 2); `deriveSession` (Task 4); paths (Task 1).
- Produces: `runPoll({run, at}) → {at, ok, sessions?, error?}`, `appendPoll(root, poll)`, `readPolls(root)`, `lastOkPoll(polls)`, `pollEntry(poll, sessionId)`, `isVanished(polls, sessionId)`; `UNCERTAIN_AFTER_MS`, `displayState(derived, {entry, vanished, now}) → {label, since, detail?, judge?}`, `linkContinuations(derivedList)`; `isWithin(child, root)`, `loadAliases(root) → {aliases, errors}`, `aliasErrors(aliases)`, `gitCommonDir(cwd)`, `projectFor(cwd, aliases, commonDirOf)`; `readHubSessions(root)`, `refreshHubSessions(root, derivedList)`, `registerLaunched(root, entry)`; `deriveAll(root)`, `buildOverview(root, {now, commonDirOf}) → {rows, pollError, configErrors}` (row fields: `project, sessionId, name, kind, state, detail, judge, since, lastAction, waitingFor, rawState, continuedFrom, lastStop`), `renderOverview(overview) → string`.

- [ ] **Step 1: Write the failing tests**

`test/overview.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, appendFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deriveSession } from '../lib/derive.mjs';
import { runPoll, appendPoll, readPolls, isVanished } from '../lib/polls.mjs';
import { displayState, linkContinuations } from '../lib/display.mjs';
import { isWithin, projectFor, aliasErrors } from '../lib/projects.mjs';
import { buildOverview, renderOverview } from '../lib/overview.mjs';
import { readHubSessions } from '../lib/hubsessions.mjs';
import { tempRoot, ev } from './helpers.mjs';

const NOW = Date.parse('2026-10-14T12:00:00Z');

function writeLog(root, sessionId, events) {
  mkdirSync(join(root, 'registry'), { recursive: true });
  for (const event of events) appendFileSync(join(root, 'registry', `${sessionId}.events.jsonl`), `${JSON.stringify({ ...event, sessionId })}\n`);
}

const poll = (at, sessions) => ({ at, ok: true, sessions });
const agent = (sessionId, status = 'idle', extra = {}) => ({ sessionId, id: sessionId.slice(0, 8), name: null, kind: 'interactive', status, state: null, cwd: null, ...extra });

test('runPoll records success, a non-zero exit and unparsable output', () => {
  const ok = runPoll({ run: () => ({ status: 0, stdout: JSON.stringify([{ sessionId: 's1', status: 'busy', state: 'blocked' }]) }), at: 't' });
  assert.equal(ok.ok, true);
  assert.equal(ok.sessions[0].state, 'blocked');
  assert.equal(runPoll({ run: () => ({ status: 1, stderr: 'boom' }), at: 't' }).error, 'boom');
  assert.match(runPoll({ run: () => ({ status: 0, stdout: 'x' }), at: 't' }).error, /^unparsable/);
});

test('a session vanishes only after two successful polls without it; failed polls do not count', () => {
  const polls = [poll('t1', [agent('s1')]), poll('t2', []), { at: 't3', ok: false, error: 'boom' }];
  assert.equal(isVanished(polls, 's1'), false);
  assert.equal(isVanished([...polls, poll('t4', [])], 's1'), true);
});

test('appendPoll and readPolls round-trip and skip a broken line', () => {
  const root = tempRoot();
  appendPoll(root, poll('t1', []));
  appendFileSync(join(root, 'registry', 'polls.jsonl'), 'broken\n');
  assert.equal(readPolls(root).length, 1);
});

test('display priority: ended, problem, permission, decision, uncertain, working, turn ended', () => {
  const base = { phase: 'working', phaseSince: 'a', lastEventAt: '2026-10-14T11:00:00Z', waiting: null, problem: null };
  assert.equal(displayState({ ...base, phase: 'ended', endedAt: 'x' }, { now: NOW }).label, 'ended');
  assert.equal(displayState({ ...base, problem: 'rate_limit' }, { now: NOW }).detail, 'rate_limit');
  assert.equal(displayState(base, { vanished: true, now: NOW }).detail, 'vanished');
  assert.equal(displayState({ ...base, waiting: { kind: 'permission', since: 's' } }, { now: NOW }).label, 'waiting for permission');
  assert.equal(displayState({ ...base, waiting: { kind: 'decision', since: 's', text: 'A?' } }, { now: NOW }).detail, 'A?');
  assert.equal(displayState(base, { entry: { status: 'busy' }, now: NOW }).label, 'uncertain');
  assert.equal(displayState({ ...base, lastEventAt: '2026-10-14T11:55:00Z' }, { entry: { status: 'busy' }, now: NOW }).label, 'working');
  const ended = displayState({ ...base, phase: 'turn-ended' }, { entry: { status: 'idle', state: 'blocked' }, now: NOW });
  assert.equal(ended.label, 'turn ended');
  assert.equal(ended.judge, true);
});

test('a /clear pair with the same title is linked; an untitled one is not', () => {
  const old = deriveSession([ev('UserPromptSubmit', '2026-10-14T10:00:00Z', { sessionId: 'a', sessionTitle: 'probe-role' }), ev('SessionEnd', '2026-10-14T10:05:00Z', { sessionId: 'a', reason: 'clear' })]);
  const next = deriveSession([ev('UserPromptSubmit', '2026-10-14T10:05:10Z', { sessionId: 'b', sessionTitle: 'probe-role' })]);
  const untitledOld = deriveSession([ev('UserPromptSubmit', '2026-10-14T10:00:00Z', { sessionId: 'c' }), ev('SessionEnd', '2026-10-14T10:05:00Z', { sessionId: 'c', reason: 'clear' })]);
  linkContinuations([old, next, untitledOld]);
  assert.equal(old.continuedTo, 'b');
  assert.equal(next.continuedFrom, 'a');
  assert.equal(untitledOld.continuedTo, undefined);
});

test('project matching: segment boundaries, case, longest root, duplicate roots, git fallback', () => {
  assert.equal(isWithin('C:\\repo\\src', 'C:\\repo'), true);
  assert.equal(isWithin('C:\\repo-old', 'C:\\repo'), false);
  assert.equal(isWithin('c:\\REPO', 'C:\\repo'), true);
  const aliases = { outer: 'C:\\work', inner: 'C:\\work\\app' };
  assert.equal(projectFor('C:\\work\\app\\x', aliases, () => null), 'inner');
  assert.equal(projectFor('C:\\work\\other', aliases, () => null), 'outer');
  assert.deepEqual(aliasErrors({ a: 'C:\\x', b: 'c:\\X\\' }), ['aliases a, b share the root c:\\x']);
  assert.equal(projectFor('C:\\repos\\app\\.claude\\worktrees\\wt', {}, () => 'C:\\repos\\app\\.git'), 'app');
  assert.equal(projectFor('C:\\loose\\dir', {}, () => null), 'dir');
});

test('the overview excludes the hub, SessionEnd-only logs, /clear predecessors and day-old ends', () => {
  const root = tempRoot();
  writeLog(root, 'hub1', [ev('UserPromptSubmit', '2026-10-14T11:00:00Z', { cwd: root })]);
  writeLog(root, 'ghost', [ev('SessionEnd', '2026-10-14T11:00:00Z', { reason: 'other' })]);
  writeLog(root, 'old', [ev('UserPromptSubmit', '2026-10-12T10:00:00Z'), ev('SessionEnd', '2026-10-12T11:00:00Z', { reason: 'other' })]);
  writeLog(root, 'work', [
    ev('UserPromptSubmit', '2026-10-14T11:50:00Z', { promptId: 'w1', sessionTitle: 'probe-a' }),
    ev('Stop', '2026-10-14T11:51:00Z', { promptId: 'w1', marker: 'A czy B?', lastFile: 'work.last/x.md' }),
  ]);
  writeFileSync(join(root, 'projects.json'), JSON.stringify({ aliases: { sandbox: 'C:\\repo' } }));
  appendPoll(root, poll('2026-10-14T11:59:00Z', [agent('work', 'idle', { state: 'blocked' })]));

  const overview = buildOverview(root, { now: NOW, commonDirOf: () => null });
  assert.deepEqual(overview.rows.map((row) => row.sessionId), ['work']);
  const [row] = overview.rows;
  assert.equal(row.project, 'sandbox');
  assert.equal(row.state, 'waiting for decision');
  assert.equal(row.waitingFor, 'A czy B?');
  assert.equal(row.rawState, 'blocked');
  assert.deepEqual(readHubSessions(root).hub, ['hub1']);

  const text = renderOverview(overview);
  assert.match(text, /\| sandbox \| work probe-a \| waiting for decision \|/);
});

test('a broken event line and an unreadable projects.json do not break the overview', () => {
  const root = tempRoot();
  writeLog(root, 'work', [ev('UserPromptSubmit', '2026-10-14T11:50:00Z', { promptId: 'w1' })]);
  appendFileSync(join(root, 'registry', 'work.events.jsonl'), '{"half a line\n');
  writeFileSync(join(root, 'projects.json'), '{ not json');
  const overview = buildOverview(root, { now: NOW, commonDirOf: () => null });
  assert.deepEqual(overview.rows.map((row) => row.state), ['working']);
  assert.match(renderOverview(overview), /projects.json: unreadable: /);
});

test('the overview reports a failed last poll and alias errors', () => {
  const root = tempRoot();
  writeFileSync(join(root, 'projects.json'), JSON.stringify({ aliases: { a: 'C:\\x', b: 'C:\\x' } }));
  appendPoll(root, { at: 't', ok: false, error: 'spawn claude ENOENT' });
  const overview = buildOverview(root, { now: NOW, commonDirOf: () => null });
  const text = renderOverview(overview);
  assert.match(text, /Last poll of claude agents --json failed: spawn claude ENOENT/);
  assert.match(text, /projects.json: aliases a, b share the root/);
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `cd C:/Users/rafal/hub-dev/hub && node --test`
Expected: FAIL — `ERR_MODULE_NOT_FOUND` for `lib/polls.mjs`.

- [ ] **Step 3: Implement**

`lib/polls.mjs`:

```js
// Polls of `claude agents --json` (spec §5.2, §5.4). A failed poll is recorded with its error and
// never counts as evidence that a session vanished.
import { spawnSync } from 'node:child_process';
import { appendFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { pollsPath, registryDir } from './paths.mjs';

export function runPoll({ run = spawnSync, at = new Date().toISOString() } = {}) {
  const result = run('claude', ['agents', '--json'], { encoding: 'utf8' });
  if (result.error || result.status !== 0) {
    return { at, ok: false, error: String(result.error?.message || result.stderr || `exit ${result.status}`).slice(0, 300) };
  }
  try {
    const list = JSON.parse(result.stdout);
    return {
      at,
      ok: true,
      sessions: list.map((s) => ({
        sessionId: s.sessionId ?? null,
        id: s.id ?? null,
        name: s.name ?? null,
        kind: s.kind ?? null,
        status: s.status ?? null,
        state: s.state ?? null,
        cwd: s.cwd ?? null,
      })),
    };
  } catch (error) {
    return { at, ok: false, error: `unparsable: ${error.message}` };
  }
}

export function appendPoll(root, poll) {
  mkdirSync(registryDir(root), { recursive: true });
  appendFileSync(pollsPath(root), `${JSON.stringify(poll)}\n`, 'utf8');
}

export function readPolls(root) {
  if (!existsSync(pollsPath(root))) return [];
  return readFileSync(pollsPath(root), 'utf8')
    .split('\n')
    .filter((line) => line.trim())
    .flatMap((line) => {
      try {
        return [JSON.parse(line)];
      } catch {
        return [];
      }
    });
}

export function lastOkPoll(polls) {
  return [...polls].reverse().find((poll) => poll.ok) ?? null;
}

export function pollEntry(poll, sessionId) {
  return poll?.sessions?.find((s) => s.sessionId === sessionId) ?? null;
}

// Vanished: the last two successful polls both miss the session. Failed polls are skipped.
export function isVanished(polls, sessionId) {
  const ok = polls.filter((poll) => poll.ok);
  if (ok.length < 2) return false;
  return ok.slice(-2).every((poll) => !pollEntry(poll, sessionId));
}
```

`lib/display.mjs`:

```js
// The state shown to Rafal (spec §5.4, priority order) and /clear continuations (spec §5.2).
// The raw `state` from `claude agents --json` is shown next to it and never ranks.

export const UNCERTAIN_AFTER_MS = 10 * 60 * 1000;

export function displayState(derived, { entry, vanished, now }) {
  if (derived.phase === 'ended') return { label: 'ended', since: derived.endedAt };
  if (derived.problem || vanished) return { label: 'problem', since: derived.lastEventAt, detail: derived.problem || 'vanished' };
  if (derived.waiting?.kind === 'permission') return { label: 'waiting for permission', since: derived.waiting.since };
  if (derived.waiting?.kind === 'decision') return { label: 'waiting for decision', since: derived.waiting.since, detail: derived.waiting.text };
  const busy = entry?.status === 'busy';
  if (busy && derived.lastEventAt && now - Date.parse(derived.lastEventAt) > UNCERTAIN_AFTER_MS) {
    return { label: 'uncertain', since: derived.lastEventAt };
  }
  if (derived.phase === 'working' || busy) return { label: 'working', since: derived.phaseSince };
  // No marker: the hub reads the last message and judges it ("probably waiting for you" or not).
  if (derived.phase === 'turn-ended') return { label: 'turn ended', since: derived.phaseSince, judge: true };
  return { label: 'unknown', since: derived.lastEventAt };
}

// A session ended by /clear and a later session with the same title form one tab: the old one gets
// continuedTo, the new one continuedFrom. Untitled sessions (VS Code panels) are never paired.
export function linkContinuations(derivedList) {
  const byStart = [...derivedList].sort((a, b) => String(a.firstAt).localeCompare(String(b.firstAt)));
  for (const old of byStart) {
    if (old.endReason !== 'clear' || !old.sessionTitle) continue;
    const next = byStart.find((d) => d !== old && !d.continuedFrom && d.sessionTitle === old.sessionTitle && d.firstAt >= old.endedAt);
    if (next) {
      old.continuedTo = next.sessionId;
      next.continuedFrom = old.sessionId;
    }
  }
  return derivedList;
}
```

`lib/projects.mjs`:

```js
// Project of a session (spec §4.1): the longest alias root containing the cwd, compared on path
// segment boundaries and case-insensitively; otherwise the repository's main worktree name.
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, basename, dirname } from 'node:path';
import { projectsConfigPath } from './paths.mjs';

function norm(path) {
  return resolve(String(path)).replace(/[\\/]+$/, '').toLowerCase();
}

export function isWithin(child, root) {
  const c = norm(child);
  const r = norm(root);
  return c === r || c.startsWith(`${r}\\`) || c.startsWith(`${r}/`);
}

// An unreadable projects.json never breaks the overview: it yields no aliases and one error line.
export function loadAliases(root) {
  const path = projectsConfigPath(root);
  if (!existsSync(path)) return { aliases: {}, errors: [] };
  try {
    return { aliases: JSON.parse(readFileSync(path, 'utf8')).aliases ?? {}, errors: [] };
  } catch (error) {
    return { aliases: {}, errors: [`unreadable: ${error.message}`] };
  }
}

export function aliasErrors(aliases) {
  const byRoot = new Map();
  for (const [name, dir] of Object.entries(aliases)) {
    const key = norm(dir);
    byRoot.set(key, [...(byRoot.get(key) ?? []), name]);
  }
  return [...byRoot.entries()]
    .filter(([, names]) => names.length > 1)
    .map(([dir, names]) => `aliases ${names.join(', ')} share the root ${dir}`);
}

export function gitCommonDir(cwd) {
  const result = spawnSync('git', ['-C', cwd, 'rev-parse', '--path-format=absolute', '--git-common-dir'], { encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() : null;
}

export function projectFor(cwd, aliases, commonDirOf = gitCommonDir) {
  if (!cwd) return 'unknown';
  const hits = Object.entries(aliases).filter(([, dir]) => isWithin(cwd, dir));
  if (hits.length) {
    hits.sort((a, b) => norm(b[1]).length - norm(a[1]).length);
    return hits[0][0];
  }
  const common = commonDirOf(cwd);
  if (common) return basename(dirname(resolve(common)));
  return basename(resolve(cwd));
}
```

`lib/hubsessions.mjs`:

```js
// hub-sessions.json (spec §4.1): the hub's own sessions, recognised by events whose cwd lies in the
// hub data root (this also covers the new id after /clear), and sessions the hub launched.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { hubSessionsPath } from './paths.mjs';
import { isWithin } from './projects.mjs';

export function readHubSessions(root) {
  if (!existsSync(hubSessionsPath(root))) return { hub: [], launched: [] };
  const data = JSON.parse(readFileSync(hubSessionsPath(root), 'utf8'));
  return { hub: data.hub ?? [], launched: data.launched ?? [] };
}

function writeHubSessions(root, data) {
  mkdirSync(root, { recursive: true });
  writeFileSync(hubSessionsPath(root), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export function refreshHubSessions(root, derivedList) {
  const data = readHubSessions(root);
  const hub = new Set(data.hub);
  for (const derived of derivedList) {
    if (derived.cwd && isWithin(derived.cwd, root)) hub.add(derived.sessionId);
  }
  const next = { hub: [...hub], launched: data.launched };
  if (next.hub.length !== data.hub.length) writeHubSessions(root, next);
  return next;
}

export function registerLaunched(root, entry) {
  const data = readHubSessions(root);
  const launched = data.launched.filter((item) => item.sessionId !== entry.sessionId);
  launched.push(entry);
  writeHubSessions(root, { hub: data.hub, launched });
  return entry;
}
```

`lib/overview.mjs`:

```js
// The overview table (spec §5.6): project, session, state, since, last action, waiting for, raw
// `state`. Excludes the hub itself, SessionEnd-only logs, /clear predecessors and sessions ended
// more than 24 hours ago.
import { readEvents, listSessionIds } from './registry.mjs';
import { deriveSession } from './derive.mjs';
import { readPolls, lastOkPoll, pollEntry, isVanished } from './polls.mjs';
import { displayState, linkContinuations } from './display.mjs';
import { loadAliases, aliasErrors, projectFor, gitCommonDir } from './projects.mjs';
import { refreshHubSessions } from './hubsessions.mjs';

const DAY_MS = 24 * 60 * 60 * 1000;

export function deriveAll(root) {
  return listSessionIds(root).map((sessionId) => deriveSession(readEvents(root, sessionId).events));
}

export function buildOverview(root, { now = Date.now(), commonDirOf = gitCommonDir } = {}) {
  const derivedList = linkContinuations(deriveAll(root).filter((d) => d.sessionId));
  const polls = readPolls(root);
  const lastPoll = polls[polls.length - 1] ?? null;
  const okPoll = lastOkPoll(polls);
  const { aliases, errors: aliasLoadErrors } = loadAliases(root);
  const hubData = refreshHubSessions(root, derivedList);
  const hubIds = new Set(hubData.hub);
  const launched = new Map(hubData.launched.map((item) => [item.sessionId, item]));

  const rows = [];
  for (const derived of derivedList) {
    if (hubIds.has(derived.sessionId) || derived.continuedTo || derived.activity === 0) continue;
    if (derived.phase === 'ended' && now - Date.parse(derived.endedAt) > DAY_MS) continue;
    const entry = pollEntry(okPoll, derived.sessionId);
    const shown = displayState(derived, {
      entry,
      vanished: derived.phase !== 'ended' && isVanished(polls, derived.sessionId),
      now,
    });
    rows.push({
      project: projectFor(derived.cwd, aliases, commonDirOf),
      sessionId: derived.sessionId,
      name: derived.sessionTitle || entry?.name || '',
      kind: launched.get(derived.sessionId)?.kind ?? entry?.kind ?? '',
      state: shown.label,
      detail: shown.detail ?? '',
      judge: Boolean(shown.judge),
      since: shown.since ?? '',
      lastAction: derived.lastAction ? `${derived.lastAction.tool} ${derived.lastAction.target}`.trim() : '',
      waitingFor: derived.waiting?.kind === 'decision' ? derived.waiting.text : derived.waiting?.kind === 'permission' ? 'permission' : '',
      rawState: entry?.state ?? '',
      continuedFrom: derived.continuedFrom ?? null,
      lastStop: derived.lastStop?.lastFile ?? null,
    });
  }
  rows.sort((a, b) => a.project.localeCompare(b.project) || String(b.since).localeCompare(String(a.since)));
  return {
    rows,
    pollError: lastPoll && !lastPoll.ok ? lastPoll.error : null,
    configErrors: [...aliasLoadErrors, ...aliasErrors(aliases)],
  };
}

const cell = (value) => String(value ?? '').replace(/\|/g, '\\|').replace(/\s+/g, ' ');

export function renderOverview({ rows, pollError, configErrors }) {
  const lines = ['| Project | Session | State | Since | Last action | Waiting for | Raw state |', '|---|---|---|---|---|---|---|'];
  for (const row of rows) {
    const session = `${row.sessionId.slice(0, 8)}${row.name ? ` ${row.name}` : ''}${row.continuedFrom ? ` (after /clear of ${row.continuedFrom.slice(0, 8)})` : ''}`;
    const state = `${row.state}${row.detail && row.state !== 'waiting for decision' ? `: ${row.detail}` : ''}${row.judge ? ' (judge)' : ''}`;
    lines.push(`| ${[row.project, session, state, row.since.slice(0, 19).replace('T', ' '), row.lastAction, row.waitingFor, row.rawState].map(cell).join(' | ')} |`);
  }
  if (pollError) lines.push('', `Last poll of claude agents --json failed: ${pollError}`);
  for (const error of configErrors) lines.push('', `projects.json: ${error}`);
  return lines.join('\n');
}
```

- [ ] **Step 4: Run the tests**

Run: `cd C:/Users/rafal/hub-dev/hub && node --test`
Expected: `ℹ pass 33`, `ℹ fail 0`.

- [ ] **Step 5: Checkpoint** — no commit.

---

### Task 6: The watcher

**Files:**
- Create: `lib/watch.mjs`, `bin/hub-watch.mjs`, `test/watch.test.mjs`

**Interfaces:**
- Consumes: `buildOverview` (Task 5); `runPoll`, `appendPoll` (Task 5); `hubRoot`, `registryDir`, `watchStatePath` (Task 1).
- Produces: `snapshot(rows)`, `transitions(prev, next) → string[]`, `readWatchState(root)`, `writeWatchState(root, state)`; `bin/hub-watch.mjs [--once] [--no-poll] [--interval-ms=120000]`.

- [ ] **Step 1: Write the failing tests**

`test/watch.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transitions } from '../lib/watch.mjs';
import { tempRoot, ev } from './helpers.mjs';

const WATCH = fileURLToPath(new URL('../bin/hub-watch.mjs', import.meta.url));
const s = (label, extra = {}) => ({ label, detail: '', name: 'probe-a', project: 'sandbox', continuedFrom: null, ...extra });

test('only the transitions of spec §5.5 are printed', () => {
  assert.deepEqual(transitions({}, { abcdefgh1: s('working') }), ['new session: sandbox abcdefgh probe-a']);
  assert.deepEqual(transitions({ x1: s('working') }, { x1: s('waiting for decision', { detail: 'A czy B?' }) }), ['waiting for decision: sandbox x1 probe-a — A czy B?']);
  assert.deepEqual(transitions({ x1: s('working') }, { x1: s('waiting for permission') }), ['waiting for permission: sandbox x1 probe-a']);
  assert.deepEqual(transitions({ x1: s('working') }, { x1: s('problem', { detail: 'rate_limit' }) }), ['problem: sandbox x1 probe-a — rate_limit']);
  assert.deepEqual(transitions({ x1: s('working') }, { x1: s('turn ended') }), ['turn ended: sandbox x1 probe-a']);
  assert.deepEqual(transitions({ x1: s('working') }, { x1: s('working') }), []);
  assert.deepEqual(transitions({ x1: s('turn ended') }, { x1: s('ended') }), []);
});

test('a /clear continuation is not reported as a new session', () => {
  const lines = transitions({}, { newid0001: s('working', { name: 'probe-role', continuedFrom: 'oldid0001' }) });
  assert.deepEqual(lines, ['continued after /clear: sandbox probe-role oldid000 -> newid000']);
});

test('the watcher seeds silently, then reports what changed while it was not running', () => {
  const root = tempRoot();
  mkdirSync(join(root, 'registry'), { recursive: true });
  const log = join(root, 'registry', 'w1.events.jsonl');
  appendFileSync(log, `${JSON.stringify(ev('UserPromptSubmit', new Date().toISOString(), { sessionId: 'w1', promptId: 'q1', sessionTitle: 'probe-a' }))}\n`);
  const run = () => spawnSync(process.execPath, [WATCH, '--once', '--no-poll'], { encoding: 'utf8', env: { ...process.env, HUB_DATA: root } });

  const first = run();
  assert.equal(first.status, 0);
  assert.equal(first.stdout, '');

  appendFileSync(log, `${JSON.stringify(ev('Stop', new Date(Date.now() + 1000).toISOString(), { sessionId: 'w1', promptId: 'q1', marker: 'A czy B?' }))}\n`);
  const second = run();
  assert.match(second.stdout, /^waiting for decision: .* w1 probe-a — A czy B\?/m);
  assert.equal(run().stdout, '');
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `cd C:/Users/rafal/hub-dev/hub && node --test`
Expected: FAIL — `ERR_MODULE_NOT_FOUND` for `lib/watch.mjs`.

- [ ] **Step 3: Implement**

`lib/watch.mjs`:

```js
// State transitions the watcher prints (spec §5.5): waiting for a decision or permission, a
// problem, a turn ended, a new session or a /clear continuation. Nothing else, so Monitor never
// stops the source for being too chatty.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { watchStatePath } from './paths.mjs';

export function snapshot(rows) {
  return Object.fromEntries(rows.map((row) => [row.sessionId, {
    label: row.state,
    detail: row.detail,
    name: row.name,
    project: row.project,
    continuedFrom: row.continuedFrom,
  }]));
}

const who = (sessionId, s) => `${s.project} ${sessionId.slice(0, 8)}${s.name ? ` ${s.name}` : ''}`;

export function transitions(prev, next) {
  const lines = [];
  for (const [sessionId, s] of Object.entries(next)) {
    const before = prev[sessionId];
    if (!before) {
      lines.push(s.continuedFrom
        ? `continued after /clear: ${s.project}${s.name ? ` ${s.name}` : ''} ${s.continuedFrom.slice(0, 8)} -> ${sessionId.slice(0, 8)}`
        : `new session: ${who(sessionId, s)}`);
    }
    if (before?.label === s.label && before?.detail === s.detail) continue;
    if (s.label === 'waiting for decision') lines.push(`waiting for decision: ${who(sessionId, s)} — ${s.detail}`);
    else if (s.label === 'waiting for permission') lines.push(`waiting for permission: ${who(sessionId, s)}`);
    else if (s.label === 'problem') lines.push(`problem: ${who(sessionId, s)} — ${s.detail}`);
    else if (s.label === 'turn ended' && before && before.label !== 'turn ended') lines.push(`turn ended: ${who(sessionId, s)}`);
  }
  return lines;
}

export function readWatchState(root) {
  return existsSync(watchStatePath(root)) ? JSON.parse(readFileSync(watchStatePath(root), 'utf8')) : null;
}

export function writeWatchState(root, state) {
  mkdirSync(root, { recursive: true });
  writeFileSync(watchStatePath(root), JSON.stringify(state), 'utf8');
}
```

`bin/hub-watch.mjs`:

```js
#!/usr/bin/env node
// The hub watcher (spec §5.5), started by the hub through Monitor. Prints one line per state
// transition. It reacts to registry file changes and, every interval, polls `claude agents --json`
// and rescans all event logs, so a missed file notification is reconciled at the next interval.
// The previous states live in watch-state.json, so a re-armed watcher reports what changed while
// no watcher ran. The first run ever only records the states and prints nothing.
// Usage: node hub-watch.mjs [--once] [--no-poll] [--interval-ms=120000]
import { watch, mkdirSync } from 'node:fs';
import { hubRoot, registryDir } from '../lib/paths.mjs';
import { runPoll, appendPoll } from '../lib/polls.mjs';
import { buildOverview } from '../lib/overview.mjs';
import { snapshot, transitions, readWatchState, writeWatchState } from '../lib/watch.mjs';

const args = new Set(process.argv.slice(2).filter((arg) => !arg.startsWith('--interval-ms=')));
const intervalArg = process.argv.slice(2).find((arg) => arg.startsWith('--interval-ms='));
const intervalMs = intervalArg ? Number(intervalArg.split('=')[1]) : 120000;
const root = hubRoot();

function tick(withPoll) {
  try {
    if (withPoll) appendPoll(root, runPoll());
    const next = snapshot(buildOverview(root).rows);
    const prev = readWatchState(root);
    if (prev) for (const line of transitions(prev, next)) console.log(line);
    writeWatchState(root, next);
  } catch (error) {
    console.log(`watcher error: ${error.message}`);
  }
}

tick(!args.has('--no-poll'));
if (!args.has('--once')) {
  mkdirSync(registryDir(root), { recursive: true });
  let pending = null;
  watch(registryDir(root), () => {
    clearTimeout(pending);
    pending = setTimeout(() => tick(false), 500);
  });
  setInterval(() => tick(!args.has('--no-poll')), intervalMs);
}
```

- [ ] **Step 4: Run the tests**

Run: `cd C:/Users/rafal/hub-dev/hub && node --test`
Expected: `ℹ pass 36`, `ℹ fail 0`.

- [ ] **Step 5: Checkpoint** — no commit.

---

### Task 7: The sending path and the hub CLI

**Files:**
- Create: `lib/compose.mjs`, `lib/journal.mjs`, `lib/checks.mjs`, `lib/confirm.mjs`, `lib/retention.mjs`, `bin/hub.mjs`, `test/send.test.mjs`, `test/cli.test.mjs`, `test/retention.test.mjs`

**Interfaces:**
- Consumes: Tasks 1, 2, 4 and 5 (`readEvents`, `deriveSession`, `runPoll`, `appendPoll`, `pollEntry`, `buildOverview`, `renderOverview`, `loadAliases`, `projectFor`, `registerLaunched`, `sha256`, paths).
- Produces: `PATHS`, `SECTIONS`, `TEMPLATE_PATHS`, `headerLine({path, project, sessionId, at})`, `questionnaireRequest({topic, max})`, `composeMessage({path, project, sessionId, at, body})`, `templateProblems(text, path)`; `newRecordId(at)`, `loadRecords(root, project)`, `saveRecords(root, project, records)`, `shownState(record)`, `renderJournal(records)`, `listProjects(root)`, `findRecord(root, id)`, `findRecordByMsgId(root, msgId)`; `gitInfo(cwd, run)`, `runChecks({record, records, poll, derived, git, text, confirmWaiting}) → [{check, message, candidates?}]`; `findDelivery(record, events, hubName)`, `classifyNotice(text) → {kind, msgId}`, `applyNotice(record, notice, text)`; `RETENTION_MS`, `cleanup(root, now) → {removed, pollsKept}`; CLI commands `overview`, `last`, `compose`, `approve`, `prepare`, `result`, `notice`, `confirm`, `register`, `journal`, `cleanup` (usage in the file header).
- Record fields: `id, project, path, sessionId, name, textFile, textHash, baseline {sessionId, name, cwd, repoRoot, branch, sha}, state ('approved'|'pending'|'sent'|'held'|'not-sent'), approvedAt, sentAt?, sentFile?, msgId?, evidence? {eventId, at}, notice?, error?`.

- [ ] **Step 1: Write the failing tests**

`test/send.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { composeMessage, questionnaireRequest, templateProblems } from '../lib/compose.mjs';
import { runChecks } from '../lib/checks.mjs';
import { findDelivery, classifyNotice, applyNotice } from '../lib/confirm.mjs';
import { shownState, renderJournal } from '../lib/journal.mjs';
import { sha256 } from '../lib/text.mjs';

const AT = '2026-10-14T10:00:00.000Z';
const answers = composeMessage({
  path: 'questionnaire-answers', project: 'sandbox', sessionId: 'abcdef123456', at: AT,
  body: '**Cel**\nx\n**Kontekst**\nx\n**Decyzje z uzasadnieniem**\nx\n**Ograniczenia**\nx\n**Oczekiwany rezultat**\nnapisz plan i stop',
});

test('the header line opens every message and is part of the approved text', () => {
  assert.match(answers, /^\[hub · questionnaire-answers · sandbox · abcdef12 · 2026-10-14 10:00\]\n\n\*\*Cel\*\*/);
  assert.throws(() => composeMessage({ path: 'other', project: 'p', sessionId: 's', at: AT, body: 'x' }), /unknown path/);
});

test('the questionnaire request keeps the fixed wording', () => {
  const text = questionnaireRequest({ topic: 'nazwa pliku', max: 3 });
  assert.match(text, /najwyżej 3 pytań o: nazwa pliku/);
  assert.match(text, /Nie edytuj plików\./);
  assert.match(text, /znacznikiem bramki/);
});

test('template check: composed paths need every section, direct needs only the header', () => {
  assert.deepEqual(templateProblems(answers, 'questionnaire-answers'), []);
  const noResult = answers.replace('**Oczekiwany rezultat**', '');
  assert.deepEqual(templateProblems(noResult, 'questionnaire-answers'), ['missing section Oczekiwany rezultat']);
  const direct = composeMessage({ path: 'direct', project: 'p', sessionId: 's1', at: AT, body: 'Uruchom testy.' });
  assert.deepEqual(templateProblems(direct, 'direct'), []);
  assert.deepEqual(templateProblems('Uruchom testy.', 'direct'), ['missing header line']);
});

const baseline = { sessionId: 's1', name: 'probe-a', cwd: 'C:\\repo', repoRoot: 'C:/repo', branch: 'main', sha: 'abc' };
const record = { id: 'r1', path: 'direct', sessionId: 's1', textHash: sha256('[hub · direct · p · s1 · x]\n\nok'), baseline, state: 'approved' };
const text = '[hub · direct · p · s1 · x]\n\nok';
const poll = { ok: true, sessions: [{ sessionId: 's1', name: 'probe-a', status: 'idle' }] };
const derived = { phase: 'turn-ended', cwd: 'C:\\repo', waiting: null };
const git = { repoRoot: 'C:/repo', branch: 'main', sha: 'abc' };
const checks = (overrides = {}) => runChecks({ record, records: [record], poll, derived, git, text, ...overrides }).map((f) => f.check);

test('all six checks pass for an approved, unchanged message to an idle session', () => {
  assert.deepEqual(checks(), []);
});

test('check 1: dead target with a same-name candidate, ambiguous name, failed poll', () => {
  const restarted = runChecks({ record, records: [record], poll: { ok: true, sessions: [{ sessionId: 's2', name: 'probe-a', status: 'idle' }] }, derived, git, text });
  assert.equal(restarted[0].check, 1);
  assert.deepEqual(restarted[0].candidates, ['s2']);
  assert.deepEqual(checks({ poll: { ok: true, sessions: [...poll.sessions, { sessionId: 's3', name: 'probe-a', status: 'idle' }] } }), [1]);
  assert.deepEqual(checks({ poll: { ok: false, error: 'boom' } }), [1]);
});

test('check 2: changed cwd, repository root, branch, and commit when detached', () => {
  assert.deepEqual(checks({ derived: { ...derived, cwd: 'C:\\other' } }), [2]);
  assert.deepEqual(checks({ git: { ...git, branch: 'feature' } }), [2]);
  const detached = { ...record, baseline: { ...baseline, branch: null, sha: 'abc' } };
  assert.deepEqual(runChecks({ record: detached, records: [detached], poll, derived, git: { ...git, branch: null, sha: 'def' }, text }).map((f) => f.check), [2]);
});

test('check 3: the same text already pending, sent or held for the session', () => {
  for (const state of ['pending', 'sent', 'held']) {
    assert.deepEqual(runChecks({ record, records: [record, { ...record, id: 'r0', state }], poll, derived, git, text }).map((f) => f.check), [3]);
  }
  assert.deepEqual(runChecks({ record, records: [record, { ...record, id: 'r0', state: 'not-sent' }], poll, derived, git, text }).map((f) => f.check), []);
});

test('checks 4, 5 and 6: changed text, busy session, waiting session unless confirmed', () => {
  assert.deepEqual(checks({ text: `${text} edited` }), [4]);
  assert.deepEqual(checks({ poll: { ok: true, sessions: [{ ...poll.sessions[0], status: 'busy' }] } }), [5]);
  assert.deepEqual(checks({ derived: { ...derived, phase: 'working' } }), [5]);
  assert.deepEqual(checks({ derived: { ...derived, waiting: { kind: 'decision' } } }), [6]);
  assert.deepEqual(checks({ derived: { ...derived, waiting: { kind: 'decision' } }, confirmWaiting: true }), []);
});

test('delivery needs the hub from-name and a matching inner-text hash after the send', () => {
  const pending = { textHash: 'h1', sentAt: '2026-10-14T10:00:00Z' };
  const ups = (fields) => ({ event: 'UserPromptSubmit', at: '2026-10-14T10:00:05Z', fromName: 'hub', innerHash: 'h1', ...fields });
  assert.ok(findDelivery(pending, [ups()]));
  assert.ok(findDelivery(pending, [ups({ innerHash: 'x', innerHashDecoded: 'h1' })]));
  assert.equal(findDelivery(pending, [ups({ fromName: 'other' })]), null);
  assert.equal(findDelivery(pending, [ups({ innerHash: 'x' })]), null);
  assert.equal(findDelivery(pending, [ups({ at: '2026-10-14T09:00:00Z' })]), null);
});

test('the S4 notices are classified, with their msg_id', () => {
  const held = 'Your message to another session was held by that session (recipient: uds:\\\\.\\pipe\\LOCAL\\cc-msg-eabc; msg_id: 4b8b0732-2830-4c04-8f38-ca22dfe06e59). NOT delivered: its Claude has not seen it.';
  const refused = 'Your message to another session was refused (recipient: uds:\\\\.\\pipe\\LOCAL\\cc-msg-140f; msg_id: ae0a2392-2eee-4b3c-b277-1b34e22ccc21): that session is not accepting cross-session messages';
  assert.deepEqual(classifyNotice(held), { kind: 'held', msgId: '4b8b0732-2830-4c04-8f38-ca22dfe06e59' });
  assert.deepEqual(classifyNotice(refused), { kind: 'refused', msgId: 'ae0a2392-2eee-4b3c-b277-1b34e22ccc21' });
  assert.equal(applyNotice({ state: 'pending' }, { kind: 'held' }, held).state, 'held');
  assert.equal(applyNotice({ state: 'held' }, { kind: 'refused' }, refused).state, 'not-sent');
  assert.equal(applyNotice({ state: 'held' }, { kind: 'released' }, 'released').state, 'pending');
});

test('a pending record shows as delivery-unknown once the tool returned a msg_id', () => {
  assert.equal(shownState({ state: 'pending' }), 'pending');
  assert.equal(shownState({ state: 'pending', msgId: 'm' }), 'delivery-unknown');
  assert.match(renderJournal([{ id: 'r1', approvedAt: AT, sessionId: 's1abcdefg', name: 'probe-a', path: 'direct', state: 'held', notice: 'held by that session' }]), /\| r1 \| .* \| held \| held by that session \|/);
});
```

`test/cli.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, appendFileSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tempRoot, ev } from './helpers.mjs';
import { sha256 } from '../lib/text.mjs';
import { loadRecords } from '../lib/journal.mjs';

const HUB = fileURLToPath(new URL('../bin/hub.mjs', import.meta.url));

function setup() {
  const root = tempRoot();
  const repo = join(tempRoot(), 'app');
  mkdirSync(repo, { recursive: true });
  spawnSync('git', ['init', '-q', '-b', 'main', repo]);
  writeFileSync(join(repo, 'README.md'), 'x');
  spawnSync('git', ['-C', repo, '-c', 'user.name=t', '-c', 'user.email=t@e', 'add', '-A']);
  spawnSync('git', ['-C', repo, '-c', 'user.name=t', '-c', 'user.email=t@e', 'commit', '-q', '-m', 'init']);
  mkdirSync(join(root, 'registry'), { recursive: true });
  const log = (events) => { for (const e of events) appendFileSync(join(root, 'registry', 's1.events.jsonl'), `${JSON.stringify({ ...e, sessionId: 's1' })}\n`); };
  log([
    ev('UserPromptSubmit', '2026-10-14T10:00:00Z', { cwd: repo, promptId: 'p1', sessionTitle: 'probe-a' }),
    ev('Stop', '2026-10-14T10:01:00Z', { cwd: repo, promptId: 'p1', marker: null, lastFile: 's1.last/x.md' }),
  ]);
  writeFileSync(join(root, 'projects.json'), JSON.stringify({ aliases: { app: repo } }));
  const agents = join(root, 'agents.json');
  writeFileSync(agents, JSON.stringify([{ sessionId: 's1', id: 's1', name: 'probe-a', kind: 'interactive', status: 'idle', state: null, cwd: repo }]));
  const hub = (...args) => spawnSync(process.execPath, [HUB, ...args], { encoding: 'utf8', env: { ...process.env, HUB_DATA: root } });
  return { root, repo, log, agents, hub };
}

test('direct command: compose, approve, prepare, result, confirm by the recipient event', () => {
  const { root, log, agents, hub } = setup();
  const body = join(root, 'body.md');
  writeFileSync(body, 'Uruchom testy i pokaż wynik.');
  const draft = hub('compose', '--path', 'direct', '--session', 's1', '--body-file', body).stdout.trim();
  assert.match(readFileSync(draft, 'utf8'), /^\[hub · direct · app · s1 · /);

  const approved = JSON.parse(hub('approve', '--session', 's1', '--path', 'direct', '--text-file', draft).stdout);
  assert.equal(approved.baseline.branch, 'main');

  const prepared = hub('prepare', approved.id, '--agents-json', agents);
  assert.equal(prepared.status, 0, prepared.stdout + prepared.stderr);
  const out = JSON.parse(prepared.stdout);
  assert.equal(out.to, 'probe-a');
  assert.ok(existsSync(out.sentFile));

  hub('result', approved.id, '--msg-id', '11111111-2222-3333-4444-555555555555');
  assert.equal(loadRecords(root, 'app')[0].state, 'pending');
  assert.deepEqual(JSON.parse(hub('confirm').stdout).confirmed, []);

  log([ev('UserPromptSubmit', new Date(Date.now() + 1000).toISOString(), { promptId: 'p2', fromName: 'hub', innerHash: sha256(readFileSync(draft, 'utf8')) })]);
  assert.deepEqual(JSON.parse(hub('confirm').stdout).confirmed, [approved.id]);
  assert.equal(loadRecords(root, 'app')[0].state, 'sent');
  assert.match(readFileSync(join(root, 'projects', 'app', 'journal.md'), 'utf8'), /\| sent \| UserPromptSubmit /);
});

test('prepare refuses a duplicate and a changed text; notice moves a record to held then not-sent', () => {
  const { root, agents, hub } = setup();
  const body = join(root, 'body.md');
  writeFileSync(body, 'Uruchom testy.');
  const draft = hub('compose', '--path', 'direct', '--session', 's1', '--body-file', body).stdout.trim();
  const first = JSON.parse(hub('approve', '--session', 's1', '--path', 'direct', '--text-file', draft).stdout);
  assert.equal(hub('prepare', first.id, '--agents-json', agents).status, 0);
  hub('result', first.id, '--msg-id', '4b8b0732-2830-4c04-8f38-ca22dfe06e59');

  const second = JSON.parse(hub('approve', '--session', 's1', '--path', 'direct', '--text-file', draft).stdout);
  const duplicate = hub('prepare', second.id, '--agents-json', agents);
  assert.equal(duplicate.status, 3);
  assert.equal(JSON.parse(duplicate.stdout).failures[0].check, 3);

  const held = hub('notice', '--text', 'Your message to another session was held by that session (recipient: x; msg_id: 4b8b0732-2830-4c04-8f38-ca22dfe06e59). NOT delivered: its Claude has not seen it.');
  assert.equal(JSON.parse(held.stdout).state, 'held');
  const refused = hub('notice', '--text', 'Your message to another session was refused (recipient: x; msg_id: 4b8b0732-2830-4c04-8f38-ca22dfe06e59): not accepting');
  assert.equal(JSON.parse(refused.stdout).state, 'not-sent');

  writeFileSync(draft, `${readFileSync(draft, 'utf8')}\nzmiana`);
  const changed = hub('prepare', second.id, '--agents-json', agents);
  assert.ok(JSON.parse(changed.stdout).failures.some((f) => f.check === 4));
});

test('a tool error marks the record not-sent with the literal error', () => {
  const { root, agents, hub } = setup();
  const draft = join(root, 'd.md');
  writeFileSync(draft, '[hub · direct · app · s1 · x]\n\nok\n');
  const record = JSON.parse(hub('approve', '--session', 's1', '--path', 'direct', '--text-file', draft).stdout);
  hub('prepare', record.id, '--agents-json', agents);
  hub('result', record.id, '--error', 'No such agent: probe-a');
  const [saved] = loadRecords(root, 'app');
  assert.equal(saved.state, 'not-sent');
  assert.equal(saved.error, 'No such agent: probe-a');
});

test('overview, last and questionnaire request through the CLI', () => {
  const { agents, hub } = setup();
  const overview = hub('overview', '--agents-json', agents);
  assert.equal(overview.status, 0, overview.stderr);
  assert.match(overview.stdout, /\| app \| s1 probe-a \| turn ended \(judge\) \|/);
  assert.match(hub('last', 's1').stdout, /registry[\\/]s1\.last[\\/]x\.md/);
  const request = hub('compose', '--path', 'questionnaire-request', '--session', 's1', '--topic', 'nazwa pliku', '--max', '3').stdout.trim();
  assert.match(readFileSync(request, 'utf8'), /najwyżej 3 pytań o: nazwa pliku/);
});
```

`test/retention.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, appendFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { cleanup } from '../lib/retention.mjs';
import { readPolls } from '../lib/polls.mjs';
import { tempRoot, ev } from './helpers.mjs';

test('retention deletes old ended sessions with their last-message directory, and old polls only', () => {
  const root = tempRoot();
  const registry = join(root, 'registry');
  mkdirSync(join(registry, 'old.last'), { recursive: true });
  writeFileSync(join(registry, 'old.last', 'e.md'), 'x');
  appendFileSync(join(registry, 'old.events.jsonl'), `${JSON.stringify(ev('SessionEnd', '2026-09-01T10:00:00Z', { sessionId: 'old', reason: 'other' }))}\n`);
  appendFileSync(join(registry, 'recent.events.jsonl'), `${JSON.stringify(ev('SessionEnd', '2026-10-13T10:00:00Z', { sessionId: 'recent', reason: 'other' }))}\n`);
  appendFileSync(join(registry, 'alive.events.jsonl'), `${JSON.stringify(ev('UserPromptSubmit', '2026-09-01T10:00:00Z', { sessionId: 'alive' }))}\n`);
  appendFileSync(join(registry, 'polls.jsonl'), `${JSON.stringify({ at: '2026-09-01T10:00:00Z', ok: true, sessions: [] })}\n${JSON.stringify({ at: '2026-10-14T10:00:00Z', ok: true, sessions: [] })}\n`);
  mkdirSync(join(root, 'projects', 'app'), { recursive: true });
  writeFileSync(join(root, 'projects', 'app', 'journal.jsonl'), '{}\n');

  const result = cleanup(root, Date.parse('2026-10-14T12:00:00Z'));
  assert.deepEqual(result.removed, ['old']);
  assert.equal(existsSync(join(registry, 'old.events.jsonl')), false);
  assert.equal(existsSync(join(registry, 'old.last')), false);
  assert.equal(existsSync(join(registry, 'recent.events.jsonl')), true);
  assert.equal(existsSync(join(registry, 'alive.events.jsonl')), true);
  assert.equal(readPolls(root).length, 1);
  assert.equal(existsSync(join(root, 'projects', 'app', 'journal.jsonl')), true);
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `cd C:/Users/rafal/hub-dev/hub && node --test`
Expected: FAIL — `ERR_MODULE_NOT_FOUND` for `lib/compose.mjs`.

- [ ] **Step 3: Implement**

`lib/compose.mjs`:

```js
// Messages the hub sends (spec §6.1, §6.4): the origin header line, the fixed questionnaire request
// and the prompt template check. User-facing text stays in Polish.
import { canonical } from './text.mjs';

export const PATHS = ['direct', 'questionnaire-request', 'questionnaire-answers', 'dialog', 'new-session'];
export const SECTIONS = ['Cel', 'Kontekst', 'Decyzje z uzasadnieniem', 'Ograniczenia', 'Oczekiwany rezultat'];
// Composed messages carry the full template; a direct command and the questionnaire request carry
// only the header line (a plan-level reading of spec §6.1, flagged for Rafal).
export const TEMPLATE_PATHS = ['questionnaire-answers', 'dialog'];
const HEADER_PREFIX = '[hub · ';

export function headerLine({ path, project, sessionId, at }) {
  return `${HEADER_PREFIX}${path} · ${project} · ${String(sessionId).slice(0, 8)} · ${at.slice(0, 16).replace('T', ' ')}]`;
}

export function questionnaireRequest({ topic, max }) {
  return [
    `Przeczytaj projekt i zadaj mi najwyżej ${max} pytań o: ${topic}.`,
    '- Pytaj tylko o to, co zmienia pracę.',
    '- Rekomendację podawaj tylko wtedy, gdy masz realny powód.',
    '- Nie edytuj plików.',
    '- Zakończ turę znacznikiem bramki.',
  ].join('\n');
}

export function composeMessage({ path, project, sessionId, at, body }) {
  if (!PATHS.includes(path)) throw new Error(`unknown path ${path}; expected one of ${PATHS.join(', ')}`);
  return `${headerLine({ path, project, sessionId, at })}\n\n${canonical(body)}\n`;
}

function normalizeHeading(line) {
  return line.replace(/^[#*\s]+/, '').replace(/[*:\s]+$/, '').toLowerCase();
}

export function templateProblems(text, path) {
  const lines = canonical(text).split('\n');
  const problems = [];
  if (!lines[0]?.startsWith(HEADER_PREFIX)) problems.push('missing header line');
  if (TEMPLATE_PATHS.includes(path)) {
    const headings = new Set(lines.map(normalizeHeading));
    for (const section of SECTIONS) if (!headings.has(section.toLowerCase())) problems.push(`missing section ${section}`);
  }
  return problems;
}
```

`lib/journal.mjs`:

```js
// Send records (spec §6.3). Records live in projects/<project>/journal.jsonl, written only by the
// hub CLI; journal.md is a readable view rebuilt on every save (journal.jsonl is a plan-level
// addition to the spec's layout, so the checks can read the records reliably).
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { join } from 'node:path';
import { projectDir, journalJsonlPath, journalMdPath } from './paths.mjs';

export function newRecordId(at) {
  return `r${at.replace(/\D/g, '').slice(0, 14)}-${randomBytes(2).toString('hex')}`;
}

export function loadRecords(root, project) {
  const path = journalJsonlPath(root, project);
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf8').split('\n').filter((line) => line.trim()).map((line) => JSON.parse(line));
}

export function shownState(record) {
  if (record.state === 'pending') return record.msgId ? 'delivery-unknown' : 'pending';
  return record.state;
}

const cell = (value) => String(value ?? '').replace(/\|/g, '\\|').replace(/\s+/g, ' ');

export function renderJournal(records) {
  const lines = ['| Record | Approved | Session | Path | State | Evidence or notice |', '|---|---|---|---|---|---|'];
  for (const r of records) {
    const proof = r.evidence ? `UserPromptSubmit ${r.evidence.at}` : r.notice ?? r.error ?? '';
    lines.push(`| ${[r.id, r.approvedAt, `${r.sessionId.slice(0, 8)} ${r.name ?? ''}`, r.path, shownState(r), proof].map(cell).join(' | ')} |`);
  }
  return `${lines.join('\n')}\n`;
}

export function saveRecords(root, project, records) {
  mkdirSync(projectDir(root, project), { recursive: true });
  writeFileSync(journalJsonlPath(root, project), records.map((r) => JSON.stringify(r)).join('\n') + (records.length ? '\n' : ''), 'utf8');
  writeFileSync(journalMdPath(root, project), renderJournal(records), 'utf8');
}

export function listProjects(root) {
  const dir = join(root, 'projects');
  return existsSync(dir) ? readdirSync(dir).filter((name) => existsSync(journalJsonlPath(root, name))) : [];
}

export function findRecord(root, id) {
  for (const project of listProjects(root)) {
    const records = loadRecords(root, project);
    const record = records.find((r) => r.id === id);
    if (record) return { project, record, records };
  }
  return null;
}

export function findRecordByMsgId(root, msgId) {
  for (const project of listProjects(root)) {
    const records = loadRecords(root, project);
    const record = records.find((r) => r.msgId === msgId);
    if (record) return { project, record, records };
  }
  return null;
}
```

`lib/checks.mjs`:

```js
// The six pre-send checks (spec §6.2). Pure apart from gitInfo; every failure carries its check
// number and a message the hub shows Rafal verbatim.
import { spawnSync } from 'node:child_process';
import { sha256 } from './text.mjs';
import { pollEntry } from './polls.mjs';
import { templateProblems } from './compose.mjs';

export function gitInfo(cwd, run = spawnSync) {
  const git = (...args) => {
    const result = run('git', ['-C', cwd, ...args], { encoding: 'utf8' });
    return result.status === 0 ? result.stdout.trim() : null;
  };
  if (!cwd) return { repoRoot: null, branch: null, sha: null };
  return {
    repoRoot: git('rev-parse', '--show-toplevel'),
    branch: git('symbolic-ref', '--short', '-q', 'HEAD') || null,
    sha: git('rev-parse', 'HEAD'),
  };
}

const ACTIVE = ['pending', 'sent', 'held'];

export function runChecks({ record, records, poll, derived, git, text, confirmWaiting = false }) {
  const failures = [];
  const { baseline } = record;

  // 1. Alive under the baseline sessionId, and the only live session with its name, because
  //    SendMessage addresses sessions by name.
  let entry = null;
  if (!poll?.ok) {
    failures.push({ check: 1, message: `cannot verify the target: claude agents --json failed: ${poll?.error ?? 'no poll'}` });
  } else {
    entry = pollEntry(poll, baseline.sessionId);
    if (!entry) {
      const candidates = poll.sessions.filter((s) => baseline.name && s.name === baseline.name).map((s) => s.sessionId);
      failures.push({ check: 1, message: `target ${baseline.sessionId} is not alive`, candidates });
    } else if (entry.name && poll.sessions.filter((s) => s.name === entry.name).length > 1) {
      failures.push({ check: 1, message: `name ${entry.name} matches several live sessions; SendMessage would be ambiguous` });
    }
  }

  // 2. Same cwd, repository root and branch (or commit when HEAD is detached).
  if ((derived.cwd ?? '').toLowerCase() !== (baseline.cwd ?? '').toLowerCase()) {
    failures.push({ check: 2, message: `cwd changed: ${baseline.cwd} -> ${derived.cwd}` });
  }
  if (git.repoRoot !== baseline.repoRoot) failures.push({ check: 2, message: `repository root changed: ${baseline.repoRoot} -> ${git.repoRoot}` });
  const before = baseline.branch ?? baseline.sha;
  const now = baseline.branch ? git.branch : git.sha;
  if (before !== now) failures.push({ check: 2, message: `${baseline.branch ? 'branch' : 'commit'} changed: ${before} -> ${now}` });

  // 3. No active record with the same text for this session.
  const duplicates = records.filter((r) => r.id !== record.id && r.sessionId === record.sessionId && r.textHash === record.textHash && ACTIVE.includes(r.state));
  if (duplicates.length) failures.push({ check: 3, message: `the same text is already ${duplicates.map((r) => `${r.state} (${r.id})`).join(', ')}` });

  // 4. Exactly the approved text, with the template it needs.
  if (sha256(text) !== record.textHash) failures.push({ check: 4, message: 'the text changed since approval' });
  for (const problem of templateProblems(text, record.path)) failures.push({ check: 4, message: problem });

  // 5. Idle.
  if (derived.phase === 'working' || (entry && entry.status !== 'idle')) {
    failures.push({ check: 5, message: `the session is busy (${entry?.status ?? derived.phase})` });
  }

  // 6. Not waiting, unless Rafal confirmed after the warning.
  if (derived.waiting && !confirmWaiting) {
    failures.push({ check: 6, message: `the session waits for ${derived.waiting.kind}; gates are answered in the session itself` });
  }
  return failures;
}
```

`lib/confirm.mjs`:

```js
// Delivery evidence and cross-session notices (spec §6.3, probe S4). Tool success is never
// delivery: only the recipient's UserPromptSubmit with the hub's from-name and a matching
// inner-text hash makes a record `sent`.

export function findDelivery(record, events, hubName = 'hub') {
  return events.find((event) => event.event === 'UserPromptSubmit'
    && event.fromName === hubName
    && (event.innerHash === record.textHash || event.innerHashDecoded === record.textHash)
    && (!record.sentAt || event.at >= record.sentAt)) ?? null;
}

export function classifyNotice(text) {
  const msgId = /msg_id:\s*([0-9a-f-]{36})/i.exec(text)?.[1] ?? null;
  let kind = 'unknown';
  if (/was held by that session|NOT delivered: its Claude has not seen it/i.test(text)) kind = 'held';
  else if (/was refused/i.test(text)) kind = 'refused';
  else if (/denied/i.test(text)) kind = 'denied';
  else if (/expired/i.test(text)) kind = 'expired';
  else if (/released/i.test(text)) kind = 'released';
  return { kind, msgId };
}

export function applyNotice(record, { kind }, text) {
  if (kind === 'held') return { ...record, state: 'held', notice: text };
  if (['refused', 'denied', 'expired'].includes(kind)) return { ...record, state: 'not-sent', notice: text };
  if (kind === 'released') return { ...record, state: 'pending', notice: text };
  return { ...record, notice: text };
}
```

`lib/retention.mjs`:

```js
// Retention (spec §8.2): event logs and last-message directories of sessions ended more than 14
// days ago are deleted together; polls.jsonl keeps the last 14 days. Journals, sent texts, dialogs
// and Codex threads are never touched.
import { rmSync, writeFileSync, existsSync } from 'node:fs';
import { listSessionIds, readEvents } from './registry.mjs';
import { deriveSession } from './derive.mjs';
import { readPolls } from './polls.mjs';
import { eventLogPath, lastDir, pollsPath } from './paths.mjs';

export const RETENTION_MS = 14 * 24 * 60 * 60 * 1000;

export function cleanup(root, now = Date.now()) {
  const removed = [];
  for (const sessionId of listSessionIds(root)) {
    const derived = deriveSession(readEvents(root, sessionId).events);
    if (derived.phase === 'ended' && now - Date.parse(derived.endedAt) > RETENTION_MS) {
      rmSync(eventLogPath(root, sessionId), { force: true });
      rmSync(lastDir(root, sessionId), { recursive: true, force: true });
      removed.push(sessionId);
    }
  }
  let pollsKept = 0;
  if (existsSync(pollsPath(root))) {
    const kept = readPolls(root).filter((poll) => now - Date.parse(poll.at) <= RETENTION_MS);
    writeFileSync(pollsPath(root), kept.map((poll) => JSON.stringify(poll)).join('\n') + (kept.length ? '\n' : ''), 'utf8');
    pollsKept = kept.length;
  }
  return { removed, pollsKept };
}
```

`bin/hub.mjs`:

```js
#!/usr/bin/env node
// Hub CLI (spec §4, §5.6, §6). The hub session calls it; every command prints plain text or JSON.
//   overview [--no-poll] [--agents-json <file>]
//   last <sessionId>
//   compose --path <path> --session <sessionId> (--body-file <file> | --topic <text> --max <n>) [--project <p>]
//   approve --session <sessionId> --path <path> --text-file <file> [--project <p>]
//   prepare <recordId> [--confirm-waiting] [--agents-json <file>]
//   result <recordId> (--msg-id <id> | --error <literal error>)
//   notice --text <literal notice>
//   confirm [--hub-name hub]
//   register --session <sessionId|short id> --kind dialog|background [--project <p>] [--name <n>] [--agents-json <file>]
//   journal --project <p>
//   cleanup
// --agents-json reads a saved `claude agents --json` output instead of running the CLI.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { hubRoot, draftsDir, sentDir, registryDir } from '../lib/paths.mjs';
import { readEvents } from '../lib/registry.mjs';
import { deriveSession } from '../lib/derive.mjs';
import { runPoll, appendPoll, pollEntry } from '../lib/polls.mjs';
import { buildOverview, renderOverview } from '../lib/overview.mjs';
import { loadAliases, projectFor } from '../lib/projects.mjs';
import { registerLaunched } from '../lib/hubsessions.mjs';
import { composeMessage, questionnaireRequest } from '../lib/compose.mjs';
import { newRecordId, loadRecords, saveRecords, findRecord, findRecordByMsgId, listProjects, renderJournal } from '../lib/journal.mjs';
import { gitInfo, runChecks } from '../lib/checks.mjs';
import { findDelivery, classifyNotice, applyNotice } from '../lib/confirm.mjs';
import { cleanup } from '../lib/retention.mjs';
import { sha256 } from '../lib/text.mjs';

function parseArgs(argv) {
  const positional = [];
  const options = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) options[key] = true;
      else {
        options[key] = next;
        i += 1;
      }
    } else positional.push(argv[i]);
  }
  return { positional, options };
}

function fail(message, code = 2) {
  process.stderr.write(`${message}\n`);
  process.exit(code);
}

function need(options, key) {
  if (!options[key] || options[key] === true) fail(`missing --${key}`);
  return options[key];
}

function freshPoll(root, options) {
  const poll = options['agents-json']
    ? { at: new Date().toISOString(), ok: true, sessions: JSON.parse(readFileSync(options['agents-json'], 'utf8')).map((s) => ({ sessionId: s.sessionId ?? null, id: s.id ?? null, name: s.name ?? null, kind: s.kind ?? null, status: s.status ?? null, state: s.state ?? null, cwd: s.cwd ?? null })) }
    : runPoll();
  appendPoll(root, poll);
  return poll;
}

const stamp = (at) => at.replace(/[-:]/g, '').replace(/\..*$/, '');
const derivedOf = (root, sessionId) => deriveSession(readEvents(root, sessionId).events);

const root = hubRoot();
const [command, ...rest] = process.argv.slice(2);
const { positional, options } = parseArgs(rest);

switch (command) {
  case 'overview': {
    if (!options['no-poll']) freshPoll(root, options);
    console.log(renderOverview(buildOverview(root)));
    break;
  }
  case 'last': {
    const derived = derivedOf(root, positional[0] ?? fail('usage: last <sessionId>'));
    if (!derived.lastStop?.lastFile) fail('no Stop recorded for this session', 3);
    console.log(join(registryDir(root), derived.lastStop.lastFile));
    break;
  }
  case 'compose': {
    const sessionId = need(options, 'session');
    const path = need(options, 'path');
    const derived = derivedOf(root, sessionId);
    const project = options.project ?? projectFor(derived.cwd, loadAliases(root).aliases);
    const body = path === 'questionnaire-request'
      ? questionnaireRequest({ topic: need(options, 'topic'), max: need(options, 'max') })
      : readFileSync(need(options, 'body-file'), 'utf8');
    const at = new Date().toISOString();
    const text = composeMessage({ path, project, sessionId, at, body });
    mkdirSync(draftsDir(root, project), { recursive: true });
    const file = join(draftsDir(root, project), `${stamp(at)}-${path}.md`);
    writeFileSync(file, text, 'utf8');
    console.log(file);
    break;
  }
  case 'approve': {
    const sessionId = need(options, 'session');
    const textFile = need(options, 'text-file');
    const derived = derivedOf(root, sessionId);
    const project = options.project ?? projectFor(derived.cwd, loadAliases(root).aliases);
    const git = gitInfo(derived.cwd);
    const at = new Date().toISOString();
    const record = {
      id: newRecordId(at),
      project,
      path: need(options, 'path'),
      sessionId,
      name: derived.sessionTitle ?? null,
      textFile,
      textHash: sha256(readFileSync(textFile, 'utf8')),
      baseline: { sessionId, name: derived.sessionTitle ?? null, cwd: derived.cwd, ...git },
      state: 'approved',
      approvedAt: at,
    };
    saveRecords(root, project, [...loadRecords(root, project), record]);
    console.log(JSON.stringify({ id: record.id, project, baseline: record.baseline }));
    break;
  }
  case 'prepare': {
    const found = findRecord(root, positional[0] ?? fail('usage: prepare <recordId>'));
    if (!found) fail('record not found', 3);
    const { project, record, records } = found;
    if (record.state !== 'approved') fail(`record is ${record.state}, not approved`, 3);
    const poll = freshPoll(root, options);
    const derived = derivedOf(root, record.sessionId);
    const text = readFileSync(record.textFile, 'utf8');
    if (!record.baseline.name) record.baseline.name = pollEntry(poll, record.sessionId)?.name ?? null;
    const failures = runChecks({ record, records, poll, derived, git: gitInfo(derived.cwd), text, confirmWaiting: Boolean(options['confirm-waiting']) });
    if (failures.length) {
      console.log(JSON.stringify({ ok: false, failures }, null, 2));
      process.exit(3);
    }
    const at = new Date().toISOString();
    mkdirSync(sentDir(root, project), { recursive: true });
    const sentFile = join(sentDir(root, project), `${stamp(at)}-${record.id}.md`);
    copyFileSync(record.textFile, sentFile);
    const updated = { ...record, state: 'pending', sentAt: at, sentFile };
    saveRecords(root, project, records.map((r) => (r.id === record.id ? updated : r)));
    console.log(JSON.stringify({ ok: true, id: record.id, to: pollEntry(poll, record.sessionId)?.name ?? null, sentFile }, null, 2));
    break;
  }
  case 'result': {
    const found = findRecord(root, positional[0] ?? fail('usage: result <recordId>'));
    if (!found) fail('record not found', 3);
    const { project, record, records } = found;
    const updated = options.error
      ? { ...record, state: 'not-sent', error: String(options.error) }
      : { ...record, msgId: need(options, 'msg-id') };
    saveRecords(root, project, records.map((r) => (r.id === record.id ? updated : r)));
    console.log(JSON.stringify({ id: record.id, state: updated.state, msgId: updated.msgId ?? null }));
    break;
  }
  case 'notice': {
    const text = need(options, 'text');
    const notice = classifyNotice(text);
    const found = notice.msgId ? findRecordByMsgId(root, notice.msgId) : null;
    if (!found) fail(`no record with msg_id ${notice.msgId ?? '(none in the notice)'}`, 3);
    const updated = applyNotice(found.record, notice, text);
    saveRecords(root, found.project, found.records.map((r) => (r.id === updated.id ? updated : r)));
    console.log(JSON.stringify({ id: updated.id, kind: notice.kind, state: updated.state }));
    break;
  }
  case 'confirm': {
    const hubName = options['hub-name'] && options['hub-name'] !== true ? options['hub-name'] : 'hub';
    const confirmed = [];
    for (const project of listProjects(root)) {
      const records = loadRecords(root, project);
      let changed = false;
      const next = records.map((record) => {
        if (record.state !== 'pending' && record.state !== 'held') return record;
        const delivery = findDelivery(record, readEvents(root, record.sessionId).events, hubName);
        if (!delivery) return record;
        changed = true;
        confirmed.push(record.id);
        return { ...record, state: 'sent', evidence: { eventId: delivery.id, at: delivery.at } };
      });
      if (changed) saveRecords(root, project, next);
    }
    console.log(JSON.stringify({ confirmed }));
    break;
  }
  case 'register': {
    const poll = freshPoll(root, options);
    const wanted = need(options, 'session');
    const entry = poll.sessions?.find((s) => s.sessionId === wanted || s.id === wanted);
    if (!entry) fail(`no live session ${wanted} in claude agents --json`, 3);
    const registered = registerLaunched(root, {
      sessionId: entry.sessionId,
      kind: need(options, 'kind'),
      project: options.project ?? null,
      name: options.name ?? entry.name ?? null,
      at: new Date().toISOString(),
    });
    console.log(JSON.stringify(registered));
    break;
  }
  case 'journal': {
    process.stdout.write(renderJournal(loadRecords(root, need(options, 'project'))));
    break;
  }
  case 'cleanup': {
    console.log(JSON.stringify(cleanup(root)));
    break;
  }
  default:
    fail('usage: hub.mjs overview|last|compose|approve|prepare|result|notice|confirm|register|journal|cleanup');
}
```

- [ ] **Step 4: Run the tests**

Run: `cd C:/Users/rafal/hub-dev/hub && node --test`
Expected: `ℹ pass 52`, `ℹ fail 0`.

- [ ] **Step 5: Checkpoint** — no commit.

---

### Task 8: Installer, role file and SKILL.md

**Files:**
- Create: `lib/install.mjs`, `bin/install.mjs`, `role.md`, `SKILL.md`, `test/install.test.mjs`, `test/skill.test.mjs`

**Interfaces:**
- Consumes: the CLI command names of Task 7 (checked by `test/skill.test.mjs`).
- Produces: `HOOK_EVENTS`, `RULES_BEGIN`, `RULES_END`, `RULES_BLOCK`, `hookCommand(skillDir)`, `mergeHooks(settings, command) → {settings, added}`, `upsertRulesBlock(text, block)`, `copySkill(srcDir, destDir)`; `bin/install.mjs [--claude-dir <dir>] [--dry-run]`; the hub start command `claude --name hub --append-system-prompt-file C:/Users/rafal/.claude/skills/hub/role.md`, run in `C:/Users/rafal/.claude/hub`.

- [ ] **Step 1: Write the failing tests**

`test/install.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mergeHooks, upsertRulesBlock, hookCommand, RULES_BEGIN, HOOK_EVENTS } from '../lib/install.mjs';
import { tempRoot } from './helpers.mjs';

const INSTALL = fileURLToPath(new URL('../bin/install.mjs', import.meta.url));
const backupHook = { hooks: [{ type: 'command', command: 'powershell.exe -File backup-claude.ps1', timeout: 120 }] };

test('mergeHooks keeps existing entries, adds six async ones once, PostToolUse matches every tool', () => {
  const command = hookCommand('C:\\Users\\rafal\\.claude\\skills\\hub');
  assert.equal(command, 'node "C:/Users/rafal/.claude/skills/hub/bin/hub-hook.mjs"');
  const first = mergeHooks({ hooks: { SessionEnd: [backupHook] }, model: 'x' }, command);
  assert.equal(first.added, 6);
  assert.equal(first.settings.model, 'x');
  assert.equal(first.settings.hooks.SessionEnd.length, 2);
  assert.deepEqual(first.settings.hooks.SessionEnd[0], backupHook);
  assert.equal(first.settings.hooks.PostToolUse[0].matcher, '*');
  for (const event of HOOK_EVENTS) assert.equal(first.settings.hooks[event].at(-1).hooks[0].async, true);
  assert.equal(mergeHooks(first.settings, command).added, 0);
});

test('the rules block is appended once and replaced in place on a rerun', () => {
  const once = upsertRulesBlock('# Zasady\n\ntekst\n');
  assert.equal(once.split(RULES_BEGIN).length, 2);
  assert.match(once, /⏸ Czeka na decyzję: <one sentence>/);
  assert.equal(upsertRulesBlock(once), once);
  const edited = once.replace('## Orchestrator hub', '## Old title');
  assert.equal(upsertRulesBlock(edited), once);
});

test('install.mjs on a temporary claude dir: dry run writes nothing, a real run installs idempotently', () => {
  const claude = tempRoot();
  writeFileSync(join(claude, 'settings.json'), JSON.stringify({ hooks: { SessionEnd: [backupHook] } }));
  writeFileSync(join(claude, 'CLAUDE.md'), '# Zasady\n');

  const dry = spawnSync(process.execPath, [INSTALL, '--claude-dir', claude, '--dry-run'], { encoding: 'utf8' });
  assert.equal(dry.status, 0, dry.stderr);
  assert.match(dry.stdout, /^\[dry run\]/);
  assert.equal(existsSync(join(claude, 'skills')), false);
  assert.equal(readFileSync(join(claude, 'CLAUDE.md'), 'utf8'), '# Zasady\n');

  const real = spawnSync(process.execPath, [INSTALL, '--claude-dir', claude], { encoding: 'utf8' });
  assert.equal(real.status, 0, real.stderr);
  assert.ok(existsSync(join(claude, 'skills', 'hub', 'bin', 'hub-hook.mjs')));
  assert.ok(existsSync(join(claude, 'hub', 'projects.json')));
  const settings = JSON.parse(readFileSync(join(claude, 'settings.json'), 'utf8'));
  assert.equal(settings.hooks.SessionEnd.length, 2);
  assert.match(readFileSync(join(claude, 'CLAUDE.md'), 'utf8'), /hub-global-rules/);
  assert.ok(readdirSync(claude).some((name) => name.startsWith('settings.json.bak-hub-')));

  const again = spawnSync(process.execPath, [INSTALL, '--claude-dir', claude], { encoding: 'utf8' });
  assert.match(again.stdout, /0 hook entries added/);
  assert.match(again.stdout, /rules block unchanged/);
});
```

`test/skill.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('SKILL.md names the skill hub and every command it uses exists in the CLI usage', () => {
  const skill = read('../SKILL.md');
  assert.match(skill, /^---\nname: hub\ndescription: /);
  const usage = read('../bin/hub.mjs');
  for (const [, command] of skill.matchAll(/`HUB (\w+)/g)) {
    assert.match(usage, new RegExp(`case '${command}':`), `CLI handles ${command}`);
  }
  assert.ok(existsSync(fileURLToPath(new URL('../bin/hub-watch.mjs', import.meta.url))));
});

test('the role file carries the hard rules and points at the skill', () => {
  const role = read('../role.md');
  assert.match(role, /invoke the skill `hub`/);
  assert.match(role, /"wyślij"/);
  assert.match(role, /Never answer a permission prompt or a gate/);
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `cd C:/Users/rafal/hub-dev/hub && node --test`
Expected: FAIL — `ERR_MODULE_NOT_FOUND` for `lib/install.mjs`, and `ENOENT` for `SKILL.md`.

- [ ] **Step 3: Implement**

`lib/install.mjs`:

```js
// Installation pieces (spec §4, §5.1, §5.3, decision 8): hook registration in settings.json, the
// global rules block in CLAUDE.md, and the skill copy. Pure where possible; bin/install.mjs wires
// them to the real files and is run by Rafal, because writes to ~/.claude are his.
import { cpSync, mkdirSync } from 'node:fs';

export const HOOK_EVENTS = ['UserPromptSubmit', 'PostToolUse', 'Notification', 'Stop', 'StopFailure', 'SessionEnd'];
export const RULES_BEGIN = '<!-- BEGIN hub-global-rules -->';
export const RULES_END = '<!-- END hub-global-rules -->';

export const RULES_BLOCK = [
  RULES_BEGIN,
  '## Orchestrator hub',
  '',
  "- **Gate marker.** A turn that ends waiting for Rafal's decision ends with the line",
  '',
  '  ⏸ Czeka na decyzję: <one sentence>',
  '',
  '- **Isolation.** A project session does not message another project session on its own',
  '  initiative; the hub is the only channel between projects. Exception: Rafal asks for it',
  '  explicitly in that session.',
  RULES_END,
].join('\n');

export function hookCommand(skillDir) {
  return `node "${skillDir.replace(/\\/g, '/')}/bin/hub-hook.mjs"`;
}

// Adds one async hook entry per event, keeping every existing entry; a second run changes nothing.
export function mergeHooks(settings, command) {
  const next = structuredClone(settings ?? {});
  next.hooks ??= {};
  let added = 0;
  for (const event of HOOK_EVENTS) {
    const groups = next.hooks[event] ?? [];
    const present = groups.some((group) => (group.hooks ?? []).some((hook) => hook.command === command));
    if (!present) {
      const group = { hooks: [{ type: 'command', command, async: true }] };
      if (event === 'PostToolUse') group.matcher = '*';
      groups.push(group);
      added += 1;
    }
    next.hooks[event] = groups;
  }
  return { settings: next, added };
}

// Inserts the rules block at the end, or replaces an existing block between the markers.
export function upsertRulesBlock(text, block = RULES_BLOCK) {
  const begin = text.indexOf(RULES_BEGIN);
  const end = text.indexOf(RULES_END);
  if (begin !== -1 && end > begin) return `${text.slice(0, begin)}${block}${text.slice(end + RULES_END.length)}`;
  return `${text.replace(/\s*$/, '')}\n\n${block}\n`;
}

export function copySkill(srcDir, destDir) {
  mkdirSync(destDir, { recursive: true });
  cpSync(srcDir, destDir, { recursive: true, filter: (path) => !/[\\/](node_modules|\.git)([\\/]|$)/.test(path) });
}
```

`bin/install.mjs`:

```js
#!/usr/bin/env node
// Installs the hub. Run by Rafal, not by a Claude session: it writes into ~/.claude.
// Usage: node install.mjs [--claude-dir <dir>] [--dry-run]
//   1. copies this skill to <claude-dir>/skills/hub
//   2. registers hub-hook.mjs for six events in <claude-dir>/settings.json (backup first)
//   3. writes the global rules block into <claude-dir>/CLAUDE.md (backup first)
//   4. creates <claude-dir>/hub/ with an empty projects.json
// Every step is idempotent; --dry-run prints what would change and writes nothing.
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { hookCommand, mergeHooks, upsertRulesBlock, copySkill } from '../lib/install.mjs';

const argv = process.argv.slice(2);
const dirIndex = argv.indexOf('--claude-dir');
const claudeDir = resolve(dirIndex !== -1 ? argv[dirIndex + 1] : join(homedir(), '.claude'));
const dryRun = argv.includes('--dry-run');
const srcDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const skillDir = join(claudeDir, 'skills', 'hub');
const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..*$/, '');
const report = [];

function backup(path) {
  if (existsSync(path)) copyFileSync(path, `${path}.bak-hub-${stamp}`);
}

// 1. skill
if (resolve(srcDir) === resolve(skillDir)) report.push(`skill: already running from ${skillDir}`);
else {
  report.push(`skill: copy ${srcDir} -> ${skillDir}`);
  if (!dryRun) copySkill(srcDir, skillDir);
}

// 2. hooks
const settingsPath = join(claudeDir, 'settings.json');
const settings = existsSync(settingsPath) ? JSON.parse(readFileSync(settingsPath, 'utf8')) : {};
const merged = mergeHooks(settings, hookCommand(skillDir));
report.push(`settings.json: ${merged.added} hook entries added (${hookCommand(skillDir)})`);
if (!dryRun && merged.added) {
  backup(settingsPath);
  writeFileSync(settingsPath, `${JSON.stringify(merged.settings, null, 2)}\n`, 'utf8');
}

// 3. global rules
const claudeMdPath = join(claudeDir, 'CLAUDE.md');
const before = existsSync(claudeMdPath) ? readFileSync(claudeMdPath, 'utf8') : '';
const after = upsertRulesBlock(before);
report.push(`CLAUDE.md: ${after === before ? 'rules block unchanged' : 'rules block written'}`);
if (!dryRun && after !== before) {
  backup(claudeMdPath);
  writeFileSync(claudeMdPath, after, 'utf8');
}

// 4. hub data directory
const hubDir = join(claudeDir, 'hub');
const projectsPath = join(hubDir, 'projects.json');
report.push(`hub data: ${existsSync(projectsPath) ? 'projects.json present' : `create ${projectsPath}`}`);
if (!dryRun && !existsSync(projectsPath)) {
  mkdirSync(hubDir, { recursive: true });
  writeFileSync(projectsPath, `${JSON.stringify({ aliases: {} }, null, 2)}\n`, 'utf8');
}

console.log(`${dryRun ? '[dry run] ' : ''}${report.join('\n')}`);
```

`role.md`:

```markdown
You are the hub: the session Rafal uses to oversee his Claude Code sessions in other projects.
Before anything else in this session, and again after every /clear, invoke the skill `hub` and
follow its start procedure. Talk to Rafal in Polish.

Hard rules, also when the skill is not loaded:
- Never send a message to another session before Rafal has seen its exact text and said "wyślij".
- Never answer a permission prompt or a gate of another session, and never treat another session's
  reply or a watcher event as Rafal's answer.
- Write only into ~/.claude/hub/ (through the hub CLI). Change nothing in project repositories and
  never edit the skill `hub` itself.
- Quote errors and notices literally; never retry on your own.
```

`SKILL.md`:

````markdown
---
name: hub
description: Use in the hub session — the Claude Code session started with `claude --name hub --append-system-prompt-file <skill>/role.md` in ~/.claude/hub — to oversee Rafal's sessions in other projects: show the overview, react to watcher events, send approved direct commands and questionnaires, and track delivery. Not for project sessions themselves.
---

# Hub

The hub watches other Claude Code sessions through a registry that a global hook fills, and sends
them messages only after Rafal approves the exact text. Design: `D:/Notatki/notatki/.claude/specs/2026-10-13-orchestrator-hub-design.md`.

`HUB` below means `node "C:/Users/rafal/.claude/skills/hub/bin/hub.mjs"`. Every command prints
plain text or JSON; quote its output literally when Rafal decides on it. Talk to Rafal in Polish.

## Start (also after /clear)

1. `HUB cleanup` (retention, spec §8.2).
2. `HUB overview` and show the table.
3. Arm the watcher: `Monitor` with `timeout_ms: 1800000`, `description: "hub watcher"`, command
   `node "C:/Users/rafal/.claude/skills/hub/bin/hub-watch.mjs"`. When its expiry notice arrives,
   arm it again with the same parameters. The watcher's events are never Rafal's answers.

## A watcher event

1. `HUB confirm` (delivery evidence), then `HUB overview --no-poll`.
2. For `turn ended`: read the file printed by `HUB last <sessionId>` and judge whether the last
   message waits for Rafal ("prawdopodobnie czeka na Ciebie") or is a finished result.
3. For `waiting for decision`, `waiting for permission`, `problem`: say which session and what it
   waits for. Gates and permission prompts are answered by Rafal in that session, never here.
4. Tell Rafal in the hub tab; when he is away, also use `PushNotification`.

## Sending (direct command, questionnaire request, questionnaire answers)

1. Compose: `HUB compose --path direct --session <sessionId> --body-file <file>`, or
   `HUB compose --path questionnaire-request --session <sessionId> --topic "<temat>" --max <n>`,
   or `--path questionnaire-answers --body-file <file>`. Write a body file only under
   `~/.claude/hub/`. The command prints the draft path.
2. Show Rafal the exact draft text (read the file, quote it in full, header line included). Wait
   for "wyślij". Any other answer is not approval.
3. `HUB approve --session <sessionId> --path <path> --text-file <draft>` → record id.
4. `HUB prepare <id>`. If it prints failures, quote them and stop; for check 6 send only after
   Rafal confirms again, then `HUB prepare <id> --confirm-waiting`. For check 1 with candidates,
   show the candidate ids and wait for a new approval; never re-target on your own.
5. `SendMessage` with `to` = the `to` name printed by prepare and `message` = the draft text
   exactly. Then `HUB result <id> --msg-id <msg_id from the tool result>`, or on a tool error
   `HUB result <id> --error "<literal error>"`.
6. Tool success is not delivery. The record becomes `sent` only through `HUB confirm`.

## A `[Cross-session delivery notice]`

Run `HUB notice --text "<the notice, verbatim>"` and tell Rafal the resulting state. While a
message is `held`, do not resend it.

## Questionnaire path (spec §6.4)

1. Send a questionnaire request (above).
2. When the watcher reports `waiting for decision` for that session, read its last message and
   show the questions.
3. Rafal answers all of them at once.
4. Compose the answers with the sections **Cel**, **Kontekst**, **Decyzje z uzasadnieniem**,
   **Ograniczenia**, **Oczekiwany rezultat**, plus a block **Pytania i odpowiedzi** with the topic,
   each question, the chosen option and Rafal's answer. **Oczekiwany rezultat** says whether the
   session starts working or stops (for example "napisz plan i stop").
5. Send it with `--path questionnaire-answers` (above).

## Boundaries

- Write only through `HUB` into `~/.claude/hub/`. Never edit project repositories or this skill.
- Never answer gates or permission prompts of other sessions.
- If a name matches several live sessions, stop and ask Rafal; SendMessage addresses by name.
- Quote errors literally; never retry on your own.
````

- [ ] **Step 4: Run the tests**

Run: `cd C:/Users/rafal/hub-dev/hub && node --test`
Expected: `ℹ pass 57`, `ℹ fail 0`.

- [ ] **Step 5: Dry run against the real configuration (writes nothing)**

Run: `node C:/Users/rafal/hub-dev/hub/bin/install.mjs --dry-run`
Expected: four lines starting with `[dry run] skill: copy`, then `settings.json: 6 hook entries added (node "C:/Users/rafal/.claude/skills/hub/bin/hub-hook.mjs")`, `CLAUDE.md: rules block written`, `hub data: create …projects.json`. Confirm nothing changed: `git -C C:/Users/rafal/.claude status --short` shows no new entry from this step.

- [ ] **Step 6: Checkpoint** — no commit.

---

### Task 9: Installation by Rafal

Executed by the controller with Rafal: the writes go into `~/.claude` and are Rafal's.

**Files:**
- Create (by Rafal's command): `C:/Users/rafal/.claude/skills/hub/**`, `C:/Users/rafal/.claude/hub/projects.json`
- Modify (by Rafal's command): `C:/Users/rafal/.claude/settings.json` (six hook entries), `C:/Users/rafal/.claude/CLAUDE.md` (rules block); backups `*.bak-hub-<timestamp>`

- [ ] **Step 1: Hand Rafal the command, with the explanation**

Give Rafal, for Git Bash:

```bash
node C:/Users/rafal/hub-dev/hub/bin/install.mjs --dry-run
node C:/Users/rafal/hub-dev/hub/bin/install.mjs
```

Explain each part: the dry run prints the four changes; the real run copies the skill to `~/.claude/skills/hub`, adds six async hook entries to `~/.claude/settings.json` without touching existing ones (backup `settings.json.bak-hub-<timestamp>`), writes the rules block (gate marker and isolation) between `<!-- BEGIN/END hub-global-rules -->` in `~/.claude/CLAUDE.md` (backup), and creates `~/.claude/hub/projects.json`. Undo: restore the two `.bak-hub-*` files and delete `~/.claude/skills/hub` and `~/.claude/hub`. His backup hook will commit and push the new files on the next session end.

- [ ] **Step 2: Verify (read-only)**

```bash
cd C:/Users/rafal/.claude/skills/hub && node --test 2>&1 | grep -E "^ℹ (pass|fail)"
grep -c "hub-hook.mjs" C:/Users/rafal/.claude/settings.json
grep -c "hub-global-rules" C:/Users/rafal/.claude/CLAUDE.md
cat C:/Users/rafal/.claude/hub/projects.json
```

Expected: `ℹ pass 57`, `ℹ fail 0`; `6`; `2`; `{ "aliases": {} }`.

- [ ] **Step 3: The hook fires in a new session**

Ask Rafal to open any new Claude Code session, send one prompt and exit. Then:

```bash
ls C:/Users/rafal/.claude/hub/registry/ | head
node C:/Users/rafal/.claude/skills/hub/bin/hub.mjs overview
```

Expected: at least one `<sessionId>.events.jsonl`, and an overview table without errors.

- [ ] **Step 4: Optional aliases** — offer Rafal to add short names to `C:/Users/rafal/.claude/hub/projects.json` (for example `{ "aliases": { "vault": "D:\\Notatki\\notatki", "baza": "D:\\Praca\\Devstock\\Baza wiedzy" } }`); without them the project is the repository directory name.

---

### Task 10: Acceptance with Rafal

Executed by the controller with Rafal (spec §9.3 items 1–4 and 7 — the Plan 2 scope — plus the direct command path).

**Files:**
- Create: `D:/Notatki/notatki/.claude/specs/2026-10-14-orchestrator-hub-plan-2-acceptance.md`

- [ ] **Step 1: Start the hub and two trial sessions**

Ask Rafal to start, each in its own terminal:

```bash
cd C:/Users/rafal/.claude/hub && claude --name hub --append-system-prompt-file C:/Users/rafal/.claude/skills/hub/role.md
cd "C:/Users/rafal/hub-probes/repo" && claude --name probe-a
cd "C:/Users/rafal/hub-probes/repo with space" && claude --name probe-b --permission-mode default
```

In the hub tab, Rafal types `start`; the hub loads the skill, runs `cleanup` and `overview`, and arms the watcher.

- [ ] **Step 2: Item 1 — overview**

Rafal sends one prompt in each trial session. Expected: the hub's overview lists `probe-a` and `probe-b`, with project names `repo` and `repo with space`, and does not list the hub.

- [ ] **Step 3: Item 2 — a marker notification**

In `probe-a`: `Zadaj mi jedno pytanie doprecyzowujące i poczekaj na odpowiedź.` Expected: within about 2 minutes the hub reports `waiting for decision` for `probe-a` with the marker sentence.

- [ ] **Step 4: Item 3 — waiting for permission**

In `probe-b`: `Uruchom: node -e "require('fs').writeFileSync('accept.txt','x')"` and wait at the prompt. Expected: the hub reports `waiting for permission` for `probe-b`. Rafal then approves in `probe-b`.

- [ ] **Step 5: Direct command with delivery confirmation**

Rafal asks the hub: `sesja probe-a: wyślij polecenie "Napisz jedno zdanie o pogodzie."`. Expected sequence: the hub shows the exact draft with its header line; Rafal says `wyślij`; `prepare` passes (if check 6 warns because `probe-a` still waits for the answer from Step 3, Rafal confirms); `SendMessage` succeeds; after `probe-a` receives it, `HUB confirm` marks the record `sent`; `HUB journal --project repo` shows it.

- [ ] **Step 6: Item 4 — questionnaire path end to end**

Rafal asks the hub: `sesja probe-a: pytania o nazwę pliku z notatkami, maksymalnie 2`. Expected: request shown, `wyślij`, `sent`; the watcher reports `waiting for decision`; the hub shows the questions; Rafal answers; the hub composes the answers with the five sections and **Pytania i odpowiedzi**, Rafal says `wyślij`, the record becomes `sent`, and `probe-a` acts on **Oczekiwany rezultat**.

- [ ] **Step 7: Item 7 — hub restart and state recovery**

In the hub tab Rafal runs `/clear`, then types `start`. Expected: the hub still answers in its role, the overview again lists `probe-a` and `probe-b` with their current states, and the hub's new session is not in the overview (recognised by `cwd`).

- [ ] **Step 8: Close and record**

Ask Rafal to `/exit` the trial sessions and the hub. Write the acceptance report: for each step, the expected and the observed result quoted from the hub tab or the CLI output, and a verdict. Any failed item is a defect to fix (a new task) or a spec impact for Rafal. Finish with proposed commit messages:

```
docs(orchestrator): plan 2 acceptance report

Hub core accepted on two trial sessions: overview, marker and
permission notifications, direct command and questionnaire path with
confirmed delivery, hub restart.
```
