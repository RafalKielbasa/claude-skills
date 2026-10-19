# Hub voice — Plan 1: probes

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Answer the six probes of the hub voice spec §10 with recorded, literal evidence, so that Plan 2 (the skill `talk`) is written on verified mechanisms: the `-p` fork's permission boundary, fork latency and speakable answers, waking session X, Polish quality, read-back fidelity of Haiku and Sonnet, and one conversation end to end.

**Architecture:** Throwaway probe tools in `C:/Users/rafal/hub-probes/voice/` (Node, standard library only, `node --test`) import the hub skill's `lib/` read-only. Voiceless probes drive a `claude -p … --input-format stream-json` fork directly or through a probe bridge; voice probes run an ElevenLabs agent against forks of a throwaway sandbox repository only. Every result lands in a probe report next to the spec.

**Tech Stack:** Node v24 (checked: `v24.20.0`), Claude Code `2.1.302`, Git Bash on Windows 11, ElevenLabs Agents API, a vendored `@elevenlabs/client`.

**Spec:** `D:/Notatki/notatki/.claude/specs/2026-10-18-hub-voice-design.md` (§10 probes; §5–§8 for what the probe bridge imitates; §14 decisions).

## Global Constraints

- Probe code lives only in `C:/Users/rafal/hub-probes/voice/` (abbreviated `VOICE/`) and is never committed. The sandbox repository `C:/Users/rafal/hub-probes/repo` may receive commits; it is throwaway.
- No change to `C:/Users/rafal/.claude` other than dialog directories `~/.claude/hub/projects/<key>/dialogs/2026-10-19-voice-*`. The hub skill is imported, never edited.
- Vault files (this plan, the probe report, the hub index, the spec) are committed and pushed by the executing session after each finished change, staging only its own paths (vault rule in `D:/Notatki/notatki/.claude/CLAUDE.md`). Nothing is pushed anywhere else.
- Voice minutes: budget about 13 (Polish 4, Haiku and Sonnet 2 × 3, end to end 3). `VOICE/data/minutes.jsonl` gets a line after every voice conversation; when the total reaches 15 minutes or ElevenLabs refuses for quota, stop and ask Rafal.
- `ELEVENLABS_API_KEY` is read only from `process.env` by probe tools; it is never printed, logged, written to a file or sent to the page.
- Voice probes fork only sessions of the sandbox repository (`C:/Users/rafal/hub-probes/repo`, hub key `repo`); no real project's content goes to ElevenLabs in this plan.
- The ElevenLabs agent has `retention_days` 0; every conversation is deleted at its end by the bridge or by `conversations.mjs purge`.
- Every probe result is quoted verbatim in `D:/Notatki/notatki/.claude/specs/2026-10-19-hub-voice-probes.md`. A result that would change the spec (a failed pass criterion, a need for build tooling, no way to learn the session id) stops the plan at that task and goes to Rafal.
- Code and comments in English; everything Rafal reads or hears in Polish.

## Review Focus

1. **A secret read through Grep or Glob instead of Read.** Expected: the `.env` sentinel never appears in the fork's output. Pinned by Task 2, step 5 (the Grep request).
2. **A secret name in another case on Windows** (`Server.PEM`). Expected: refused like `.env`. Pinned by Task 2, step 5.
3. **A dialog directory under `~/.claude` in `-p` mode** (probe S12 of the hub covered `--bg` only). Expected: the write is accepted with no prompt and no self-modification refusal. Pinned by Task 2, which uses the real hub location.
4. **A second `ask_claude` while the fork is mid-turn** (Rafal interrupts and asks again). Expected: queued and answered in order, no crossed answers. Pinned by Task 3, step 1 (`fork.test.mjs`) and Task 3, step 7 (the serialisation pair).
5. **Polish diacritics through stdin and HTTP JSON** (`zażółć gęślą jaźń`). Expected: intact in the fork's input and in `transcript.md`. Pinned by Task 3, step 1 and Task 6, step 2.

---

## File Structure

| Path | Responsibility |
|---|---|
| `VOICE/package.json` | `{"type":"module","scripts":{"test":"node --test"}}` |
| `VOICE/tools/fork-settings.mjs` | Voice fork settings: the hub's `forkSettings` plus `Read` denies |
| `VOICE/tools/boundary.mjs` | Probe "Fork boundary in `-p`" runner |
| `VOICE/tools/dialog.mjs` | Prepares a dialog directory: hub snapshot plus voice settings |
| `VOICE/tools/stream.mjs` | `stream-json` input line and turn collection |
| `VOICE/tools/fork.mjs` | The voice fork process with a serialised ask queue |
| `VOICE/tools/speakable.mjs` | Detects text that is unusable by ear |
| `VOICE/tools/voice-prompt.mjs` | The voice fork's start prompt (spec §8) |
| `VOICE/tools/roundtrip.mjs` | Probe "Round trip and latency" runner |
| `VOICE/tools/report.mjs` | Dialog files and the closing report (spec §5.4) |
| `VOICE/tools/fake-bridge.mjs` | Probe "End and wake-up": a bridge stand-in without HTTP or voice |
| `VOICE/tools/minutes.mjs` | Minutes ledger |
| `VOICE/tools/eleven.mjs` | ElevenLabs API client |
| `VOICE/tools/agent-config.mjs` | Agent and `ask_claude` tool configuration (spec §7) |
| `VOICE/tools/agent-setup.mjs`, `VOICE/tools/conversations.mjs` | CLIs: create and change the agent; list, purge and inspect conversations |
| `VOICE/tools/auth.mjs` | Request authorisation: token and `Host` (spec §6) |
| `VOICE/tools/bridge.mjs` | Probe bridge (spec §5, §6) and its CLI |
| `VOICE/tools/bridge-smoke.mjs` | Voiceless harness against the probe bridge |
| `VOICE/web/talk.html`, `VOICE/web/talk.mjs` | The conversation page |
| `VOICE/web/vendor/elevenlabs-client.mjs`, `VOICE/web/vendor/VERSION.txt` | Vendored browser client, version, source URL, SHA-256 |
| `VOICE/test/*.test.mjs`, `VOICE/test/fake-claude.mjs` | Tests and a `claude` stand-in speaking `stream-json` |
| `VOICE/data/` | Seed session id, agent id, ledgers, probe outputs |
| `C:/Users/rafal/hub-probes/repo/{.env,Server.PEM,PLAN.md}` | Sandbox sentinels and the decision subject |
| `C:/Users/rafal/hub-probes/repo/.claude/skills/{sid-probe,talk-probe}/SKILL.md` | Sandbox skills for Tasks 4 and 8 |
| `D:/Notatki/notatki/.claude/specs/2026-10-19-hub-voice-probes.md` | Probe report |

---

### Task 1: Sandbox, prerequisites and report skeleton

**Files:**
- Create: `VOICE/package.json`, `VOICE/data/seed-session.txt`
- Create: `C:/Users/rafal/hub-probes/repo/.env`, `C:/Users/rafal/hub-probes/repo/Server.PEM`, `C:/Users/rafal/hub-probes/repo/PLAN.md`
- Create: `D:/Notatki/notatki/.claude/specs/2026-10-19-hub-voice-probes.md`

**Interfaces:**
- Produces: `VOICE/data/seed-session.txt` (one UUID, the sandbox session every voice fork resumes); sentinels `VOICE_PROBE_SENTINEL=ok-7f3a` in `.env` and `PEM_PROBE_SENTINEL` in `Server.PEM`.

- [ ] **Step 1: Check the prerequisites**

Run: `node --version; claude --version; claude --help | grep -c -- '--input-format'; node -e "process.exit(process.env.ELEVENLABS_API_KEY ? 0 : 1)"; echo key=$?`
Expected: `v24.…`, `2.1.302 (Claude Code)` or newer, `1` or more, `key=0`. With `key=1`: check `powershell -NoProfile -Command "if ([Environment]::GetEnvironmentVariable('ELEVENLABS_API_KEY','User')) { exit 0 } else { exit 1 }"`; exit 0 means the key exists but this session predates it, so Rafal restarts VS Code; exit 1 means Rafal still has to create the account and set the key (spec §3). Wait in both cases.

- [ ] **Step 2: Create `VOICE/` with `tools/`, `test/`, `web/vendor/`, `data/` and `package.json`**

- [ ] **Step 3: Prepare the sandbox repository**

`.env` holds `VOICE_PROBE_SENTINEL=ok-7f3a`; `Server.PEM` holds `PEM_PROBE_SENTINEL`; `PLAN.md` (Polish) describes a feature „eksport listy lektur" with three open choices: 1. format pliku: CSV czy JSON; 2. miejsce przycisku: pasek narzędzi czy menu; 3. domyślna nazwa pliku: z datą czy bez. Commit in the sandbox repository: `git -C C:/Users/rafal/hub-probes/repo add .env Server.PEM PLAN.md && git -C C:/Users/rafal/hub-probes/repo commit -m "chore: voice probe sentinels and decision subject"`.

- [ ] **Step 4: Create the seed session**

Run in `C:/Users/rafal/hub-probes/repo`: `id=$(node -e "console.log(crypto.randomUUID())"); claude -p --session-id "$id" "Przeczytaj PLAN.md i powiedz jednym zdaniem, czego dotyczy."; echo "$id" > C:/Users/rafal/hub-probes/voice/data/seed-session.txt`
Expected: one Polish sentence about the reading-list export; the transcript `~/.claude/projects/C--Users-rafal-hub-probes-repo/<id>.jsonl` exists.

- [ ] **Step 5: Write the report skeleton**

Sections: Preliminary findings (versions from step 1; `claude-haiku-5-5` is on ElevenLabs' `prompt.llm` list, which the research of 2026-10-17 missed; on 2026-10-19 Rafal chose `claude-haiku-5-5` instead of `claude-haiku-4-5` for the probes); Fork boundary in `-p`; Round trip and latency; End and wake-up; Polish without the fork; Vendored client; Haiku and Sonnet; End to end; Minutes ledger; Conclusions for Plan 2. Header: `**Index:** [.claude/projects/hub.md](../projects/hub.md)` and a link to the spec.

- [ ] **Step 6: Commit and push the report skeleton** (vault rule; only the report path)

---

### Task 2: Voice fork settings and probe "Fork boundary in `-p`"

**Files:**
- Create: `VOICE/tools/fork-settings.mjs`, `VOICE/test/fork-settings.test.mjs`, `VOICE/tools/boundary.mjs`

**Interfaces:**
- Consumes: `forkSettings(dialogDir)` from `file:///C:/Users/rafal/.claude/skills/hub/lib/dialog.mjs`; `DENYLIST` from `file:///C:/Users/rafal/.claude/skills/hub/lib/denylist.mjs`.
- Produces: `SECRET_READ_DENY: string[]` (`DENYLIST.map((g) => \`Read(**/${g})\`)`); `voiceForkSettings(dialogDir: string): { permissions: { allow: string[], deny: string[] } }`; `writeVoiceForkSettings(dialogDir: string): string` (creates the directory, writes `fork-settings.json`, returns its path).

- [ ] **Step 1: Write the failing test**

```js
test('voice settings are the written fork settings plus Read denies for the denylist', () => {
  const s = voiceForkSettings('C:/Users/rafal/.claude/hub/projects/repo/dialogs/x');
  assert.deepEqual(s.permissions.allow, ['Edit(//C:/Users/rafal/.claude/hub/projects/repo/dialogs/x/**)']);
  assert.deepEqual(s.permissions.deny, ['Edit(./**)', 'Bash', 'EnterWorktree',
    'Read(**/.env*)', 'Read(**/*.pem)', 'Read(**/*.key)', 'Read(**/*credentials*)',
    'Read(**/*secret*)', 'Read(**/auth.json)', 'Read(**/secrets.yaml)']);
});
test('writeVoiceForkSettings writes fork-settings.json into the dialog directory', () => {
  const dir = join(mkdtempSync(join(tmpdir(), 'v-')), 'd');
  const path = writeVoiceForkSettings(dir);
  assert.equal(path, join(dir, 'fork-settings.json'));
  assert.deepEqual(JSON.parse(readFileSync(path, 'utf8')), voiceForkSettings(dir));
});
```

- [ ] **Step 2: Run it and see it fail** — Run: `cd VOICE && node --test test/fork-settings.test.mjs`. Expected: FAIL, module not found.

- [ ] **Step 3: Implement `fork-settings.mjs`** with the signatures above.

- [ ] **Step 4: Run it and see it pass** — same command. Expected: 2 passing.

- [ ] **Step 5: Implement `boundary.mjs`**

CLI: `node tools/boundary.mjs --session <id> --cwd <repo> --dialog <dir>`. It writes the settings, then runs, with `cwd` = `--cwd` and a 300-second timeout: `claude -p --resume <id> --fork-session --output-format stream-json --verbose --settings <path> "<prompt>" --add-dir <dialog>`. The prompt asks, in order, each as a separate tool attempt: write `probe-repo-write.txt` with `x` in the repository root; write `<dialog>/probe-dialog-write.txt` with `x`; Read `.env` and quote it; Read `Server.PEM` and quote it; Grep the repository for `VOICE_PROBE_SENTINEL`; then list each attempt's outcome on its own line. It saves the raw stream to `VOICE/data/boundary.jsonl` and prints: exit code, wall time, whether each file exists, whether `ok-7f3a` or `PEM_PROBE_SENTINEL` occurs anywhere in the stream, and the `permission_denials` of the `result` event.

- [ ] **Step 6: Run the probe**

Run: `node tools/boundary.mjs --session $(cat data/seed-session.txt) --cwd C:/Users/rafal/hub-probes/repo --dialog C:/Users/rafal/.claude/hub/projects/repo/dialogs/2026-10-19-voice-boundary`
Passes when: the process ends before the timeout with no prompt; `probe-repo-write.txt` does not exist; `probe-dialog-write.txt` exists; neither sentinel occurs in the stream. On failure: stop and report to Rafal (spec §8 acceptance criterion).

- [ ] **Step 7: Record verbatim in the report** (the printed summary, the denial messages) and commit and push the report.

---

### Task 3: Fork driver, voice role and probe "Round trip and latency"

**Files:**
- Create: `VOICE/tools/stream.mjs`, `VOICE/tools/fork.mjs`, `VOICE/tools/speakable.mjs`, `VOICE/tools/voice-prompt.mjs`, `VOICE/tools/dialog.mjs`, `VOICE/tools/roundtrip.mjs`, `VOICE/data/roundtrip-questions.txt`
- Test: `VOICE/test/stream.test.mjs`, `VOICE/test/fork.test.mjs`, `VOICE/test/speakable.test.mjs`, `VOICE/test/voice-prompt.test.mjs`, `VOICE/test/fake-claude.mjs`

**Interfaces:**
- Consumes: `writeVoiceForkSettings` (Task 2); `takeSnapshot(cwd, contextDir)` from the hub's `lib/dialog.mjs`.
- Produces:
  - `userLine(text: string): string`: `JSON.stringify({ type: 'user', message: { role: 'user', content: [{ type: 'text', text }] } }) + '\n'`.
  - `createTurnCollector(): { push(line: string): null | { text: string, subtype: string } }`: returns a turn on a `type: 'result'` line (`text` = its `result` string), otherwise `null`; ignores lines that are not JSON.
  - `startFork({ cwd, sessionId, settingsPath, dialogDir, startPrompt, command = ['claude'], model, env }): ForkHandle` (`env` is merged over `process.env`). It spawns `command[0]` with `[...command.slice(1), '-p', '--resume', sessionId, '--fork-session', '--input-format', 'stream-json', '--output-format', 'stream-json', '--verbose', '--settings', settingsPath, ...(model ? ['--model', model] : []), '--add-dir', dialogDir]` and sends `startPrompt` as the first user line. `ForkHandle` = `{ ready: Promise<Turn>, sessionId: Promise<string>, ask(text: string, { timeoutMs = 115000 } = {}): Promise<{ text: string, subtype: string, ms: number, timedOut: boolean }>, close(): Promise<number> }`. `ask` calls run strictly one after another (FIFO); `sessionId` comes from the `system`/`init` line; a timed-out `ask` resolves with `timedOut: true` and `text: ''`, while its turn keeps the queue until it ends; `close` ends stdin and resolves with the exit code.
  - `isSpeakable(text: string): { ok: boolean, hits: string[] }`. The hits are `heading` (`^#`), `table` (`^\|`), `fence` (```` ``` ````), `inline-code` (a backtick), `bullet` (`^\s*[-*] `), `numbered` (`^\s*\d+\. `), `bold` (`**`), `path` (`\w+\.(mjs|js|md|json)(:\d+)?`) and `gate` (`⏸`).
  - `DECISION_PREFIX = 'Decyzja do potwierdzenia:'`, `END_PREFIX = 'KONIEC ROZMOWY'`, `voiceStartPrompt({ projectName: string, sourceId: string, dialogDir: string, snapshot: { git: boolean, cwd: string, at: string } }): string`.
  - `prepareDialog({ cwd: string, dialogDir: string }): { snapshot, settingsPath: string }` (hub `takeSnapshot` into `<dialogDir>/context`, then `writeVoiceForkSettings`).

- [ ] **Step 1: Write the failing tests**

`fake-claude.mjs` reads `stream-json` lines from stdin and handles them one at a time. On the first user line it prints `{"type":"system","subtype":"init","session_id":"fork-1"}`. For every user line it waits a delay and prints an `assistant` line and `{"type":"result","subtype":"success","result":"echo: <the line's text>"}`. The delay is `FAKE_SLOW_MS` when the text contains `slow`, otherwise `FAKE_DELAY_MS` (both default 0). When stdin ends it finishes the pending turns and exits 0.

```js
// stream.test.mjs
test('a turn ends on the result line and carries its result text', () => {
  const c = createTurnCollector();
  assert.equal(c.push('{"type":"system","subtype":"init","session_id":"s"}'), null);
  assert.equal(c.push('not json'), null);
  assert.deepEqual(c.push('{"type":"result","subtype":"success","result":"Dobrze."}'), { text: 'Dobrze.', subtype: 'success' });
});
test('userLine keeps Polish diacritics', () => {
  assert.equal(JSON.parse(userLine('zażółć gęślą jaźń')).message.content[0].text, 'zażółć gęślą jaźń');
});
// fork.test.mjs (command = [process.execPath, FAKE])
test('ready answers the start prompt and sessionId comes from init', async () => {
  const f = startFork({ ...base, startPrompt: 'start' });
  assert.equal((await f.ready).text, 'echo: start');
  assert.equal(await f.sessionId, 'fork-1');
  assert.equal(await f.close(), 0);
});
test('two asks sent at once are answered in order', async () => {
  const f = startFork({ ...base, startPrompt: 'start', env: { FAKE_DELAY_MS: '50' } });
  await f.ready;
  const [a, b] = await Promise.all([f.ask('pierwsze'), f.ask('drugie zażółć')]);
  assert.equal(a.text, 'echo: pierwsze');
  assert.equal(b.text, 'echo: drugie zażółć');
  await f.close();
});
test('a timed-out ask keeps the queue, and the next ask gets its own answer, not the late one', async () => {
  const f = startFork({ ...base, startPrompt: 'start', env: { FAKE_SLOW_MS: '300' } });
  await f.ready;
  const t0 = Date.now();
  const [a, b] = await Promise.all([f.ask('slow pierwsze', { timeoutMs: 100 }), f.ask('drugie')]);
  assert.equal(a.timedOut, true); assert.equal(a.text, '');
  assert.equal(b.timedOut, false); assert.equal(b.text, 'echo: drugie');
  assert.ok(Date.now() - t0 >= 300);
  await f.close();
});
// speakable.test.mjs
test('plain Polish sentences are speakable', () => {
  assert.deepEqual(isSpeakable('Most nasłuchuje tylko lokalnie. Dzięki temu nikt z sieci się nie podłączy.'), { ok: true, hits: [] });
});
test('markdown, paths and the gate marker are not', () => {
  assert.deepEqual(isSpeakable('## A\n- b\n| c |\n`d` **e** spec.md:12 ⏸').hits.sort(),
    ['bold', 'bullet', 'gate', 'heading', 'inline-code', 'path', 'table'].sort());
});
// voice-prompt.test.mjs
test('the voice role pins the decision prefix, the end message and the dialog files', () => {
  const p = voiceStartPrompt({ projectName: 'repo', sourceId: 'abcdef12-0000', dialogDir: 'C:/d', snapshot: { git: true, cwd: 'C:/r', at: 'T' } });
  for (const s of ['Decyzja do potwierdzenia:', 'KONIEC ROZMOWY', 'decisions.md', 'open-questions.md', 'prompt.md', 'Polish', 'gate marker', 'Markdown']) assert.ok(p.includes(s), s);
});
```

`base` = `{ cwd: tmp, sessionId: 's', settingsPath: 'x', dialogDir: tmp, command: [process.execPath, FAKE] }`; `env` sets `FAKE_DELAY_MS`.

- [ ] **Step 2: Run them and see them fail** — `node --test`. Expected: FAIL, modules not found.

- [ ] **Step 3: Implement `stream.mjs`, `fork.mjs`, `speakable.mjs`, `dialog.mjs`**

- [ ] **Step 4: Implement `voiceStartPrompt`**

English text, one bullet per point, with the paths filled in:
- the source session and project, the snapshot sentence as the hub's `forkStartPrompt` words it;
- the written fork's read-only role;
- the voice differences of spec §8:
  - Rafal hears you through a voice agent, so answer in plain spoken Polish, at most four sentences;
  - no Markdown, tables, lists, paths or code; offer to put such things in the files instead;
  - this overrides any global answer format (sections, headers, details blocks, the gate marker);
- decisions:
  - formulate a decision in one or two sentences starting exactly with `Decyzja do potwierdzenia:`;
  - write it into `decisions.md` with rationale and source only after a later message carries Rafal's explicit confirmation of that wording;
  - on a correction, read back the corrected wording;
  - a work order is a decision too;
- questions without an answer go into `open-questions.md`;
- no gate of your own; never end with a gate marker; inherited open questions and gates are not yours;
- the message format you will receive:
  - `Agent głosowy przekazuje: …` followed by `Rafał (transkrypcja): …`;
  - a message starting with `KONIEC ROZMOWY` asks for `prompt.md` (sections **Cel**, **Kontekst**, **Decyzje z uzasadnieniem**, **Ograniczenia**, **Oczekiwany rezultat**) only when a work order was confirmed;
- the closing instruction: introduce yourself in one Polish sentence and wait.

- [ ] **Step 5: Run the tests and see them pass** — `node --test`. Expected: all passing.

- [ ] **Step 6: Implement `roundtrip.mjs` and the questions file**

CLI: `node tools/roundtrip.mjs --session <id> --cwd <dir> --dialog <dir> --questions <file> --out <jsonl>`. It runs `prepareDialog`, starts the fork with `voiceStartPrompt`, and sends questions 1–8 one by one, each formatted as `Agent głosowy przekazuje: <q>\nRafał (transkrypcja): <q>`. It then sends questions 9 and 10 with `Promise.all` and records each answer's `ms`, `isSpeakable` result and start/end times. Finally it closes the fork, appends JSON lines to `--out` and prints the median and maximum `ms`, the speakable count, and whether 9 ended before 10 started.

The questions, Polish, one per line, about the hub voice spec:
1. Jaką komendą uruchamiam rozmowę głosową?
2. Dlaczego most nasłuchuje tylko na 127.0.0.1?
3. Co się dzieje z rozmową w ElevenLabs po jej zakończeniu?
4. Które projekty są na starcie na liście dozwolonych?
5. Kiedy zapisujesz decyzję do decisions.md?
6. Co robi sesja po zakończeniu rozmowy?
7. Zażółć gęślą jaźń: powtórz te trzy słowa i powiedz, ile minut głosu przewidują sondy.
8. Zaproponuj jedną decyzję o nazwie pliku raportu sond i poproś mnie o potwierdzenie.
9. Tak, potwierdzam.
10. Jakie pytania zostają otwarte?

- [ ] **Step 7: Run the probe on a fork of this planning session**

Run: `node tools/roundtrip.mjs --session c0987db9-b09b-453f-8cfe-0770239787b8 --cwd D:/Notatki/notatki --dialog C:/Users/rafal/.claude/hub/projects/notatki/dialogs/2026-10-19-voice-roundtrip --questions data/roundtrip-questions.txt --out data/roundtrip.jsonl`. Before the run, check that `~/.claude/projects/D--Notatki-notatki/c0987db9-b09b-453f-8cfe-0770239787b8.jsonl` exists. No voice is involved.
Passes when:
- at least 9 of 10 answers are speakable;
- answer 7 repeats the diacritics intact;
- answer 8 contains `Decyzja do potwierdzenia:`;
- `decisions.md` holds that decision after answer 9;
- answer 9 ended before answer 10 started;
- the median and maximum latency are recorded.

If fewer than 9 answers are speakable, adjust the voice role once, re-run, and record both runs.

- [ ] **Step 8: Record verbatim in the report** (summary, every non-speakable answer with its hits, the decision text as said and as written) and commit and push the report.

---

### Task 4: Probe "End and wake-up" and the session id

**Files:**
- Create: `VOICE/tools/report.mjs`, `VOICE/test/report.test.mjs`, `VOICE/tools/fake-bridge.mjs`, `C:/Users/rafal/hub-probes/repo/.claude/skills/sid-probe/SKILL.md`

**Interfaces:**
- Consumes: `startFork`, `prepareDialog`, `voiceStartPrompt` (Task 3).
- Produces: `readDialogFiles(dialogDir: string): { decisions?: string, openQuestions?: string, prompt?: string }`; `closingReport({ dialogDir: string, files, deletion: string }): string`.

- [ ] **Step 1: Write the failing test**

```js
test('the closing report carries every dialog file or says it was not written', () => {
  const r = closingReport({ dialogDir: 'C:/d', files: { decisions: '- CSV\n' }, deletion: 'deleted' });
  assert.match(r, /^TALK CLOSING REPORT\ndialog: C:\/d\ndeletion: deleted\n/);
  assert.match(r, /--- decisions\.md ---\n- CSV\n/);
  assert.match(r, /--- open-questions\.md ---\n\(not written\)\n/);
  assert.match(r, /--- prompt\.md ---\n\(not written\)\nEND OF REPORT\n$/);
});
```

- [ ] **Step 2: Run it and see it fail; implement `report.mjs`; run it and see it pass** — `node --test test/report.test.mjs`.

- [ ] **Step 3: Implement `fake-bridge.mjs`**

CLI: `node tools/fake-bridge.mjs --session <id> --cwd <dir> --dialog <dir> --seconds 60`. It runs `prepareDialog` and starts the fork with `voiceStartPrompt`. Then it sends these messages through `ask`, each in the bridge's format `Agent głosowy przekazuje: … / Rafał (transkrypcja): …`:
1. `Co zrobiła sesja źródłowa tuż przed uruchomieniem ciebie? Odpowiedz jednym zdaniem.` The answer goes to `VOICE/data/wake-fork-answer.txt`.
2. `Zdecydujmy pierwszy wybór z PLAN.md: CSV.`
3. `Tak.`
4. `Zlecenie dla sesji: dopisz na końcu PLAN.md linię „Wybrany format: CSV.". Potwierdź to zlecenie.`
5. `Tak.`

After `--seconds` (standing in for a lost heartbeat) it runs the real end path: the end message starting with `END_PREFIX` (as Task 6 words it), `close()`, `readDialogFiles`, `closingReport` with `deletion: no conversation (probe)`. It prints the report and exits 0.

- [ ] **Step 4: Write the sandbox skill `sid-probe`**

`SKILL.md` frontmatter: `name: sid-probe`, a one-line description. Body, in English:
1. With the Bash tool and `run_in_background: true`, run `node C:/Users/rafal/hub-probes/voice/tools/fake-bridge.mjs --session ${CLAUDE_SESSION_ID} --cwd C:/Users/rafal/hub-probes/repo --dialog C:/Users/rafal/.claude/hub/projects/repo/dialogs/2026-10-19-voice-wake --seconds 60`.
2. End the turn with one Polish sentence saying the probe bridge runs.
3. When the background task completes, read the closing report from its output and show Rafal the decisions as a short Polish table. Then proceed as `/talk` will (spec §5.5): carry out the work order of the report's `prompt.md` section (in the sandbox it only edits `PLAN.md`). Do not commit, and stop at any outward action. End with `sonda wybudzenia: OK`.

- [ ] **Step 5: Run the probe with Rafal**

Rafal opens a new Claude Code session in VS Code on `C:/Users/rafal/hub-probes/repo` and types `/sid-probe`. Record:
- (a) the command line the session ran: a UUID, or the literal `${CLAUDE_SESSION_ID}`;
- (b) that UUID compared with the newest transcript name in `~/.claude/projects/C--Users-rafal-hub-probes-repo/`;
- (c) `wake-fork-answer.txt`: does the fork know the `/sid-probe` launch;
- (d) whether the session woke by itself about 60 s later and showed the table;
- (e) whether the report's `prompt.md` section holds the confirmed order, and whether `git -C C:/Users/rafal/hub-probes/repo diff` afterwards shows exactly the line „Wybrany format: CSV." added by session X and nothing from the fork.

Passes when (a) is a UUID equal to (b), (c) names the launch, and (d) and (e) happened. If (a) is literal, try the fallback: the newest `~/.claude/hub/registry/*.events.jsonl` whose events carry `cwd` = the sandbox repository and a `UserPromptSubmit` with `sid-probe`. Record whether it identifies the session uniquely. If no method works, stop and ask Rafal.

- [ ] **Step 6: Record verbatim in the report** and commit and push the report.

---

### Task 5: ElevenLabs agent and probe "Polish without the fork"

**Files:**
- Create: `VOICE/tools/minutes.mjs`, `VOICE/tools/eleven.mjs`, `VOICE/tools/agent-config.mjs`, `VOICE/tools/agent-setup.mjs`, `VOICE/tools/conversations.mjs`
- Test: `VOICE/test/agent-config.test.mjs`, `VOICE/test/minutes.test.mjs`, `VOICE/test/eleven.test.mjs`

**Interfaces:**
- Produces:
  - `appendMinutes(file: string, { probe: string, conversationId: string, seconds: number }): void` (adds `at`); `totalMinutes(file: string): number` (sum of `seconds` / 60, 0 for a missing file).
  - `createElevenClient({ apiKey, fetchImpl = fetch, base = 'https://api.elevenlabs.io' })` returning:
    - `createTool(body)` → `{ id }`;
    - `createAgent(body)` → `{ agent_id }`;
    - `updateAgent(agentId, body)` and `getAgent(agentId)`;
    - `getConversationToken(agentId)` → `{ token }`;
    - `listConversations(agentId)` → `[{ conversation_id }]`;
    - `getConversation(id)` → `{ metadata: { call_duration_secs } }`;
    - `deleteConversation(id)` → `{ ok: boolean, status: number, text: string }`.

    Every request carries the header `xi-api-key`. Paths: `POST /v1/convai/tools`, `POST /v1/convai/agents/create`, `PATCH /v1/convai/agents/{id}`, `GET /v1/convai/agents/{id}`, `GET /v1/convai/conversation/token?agent_id=`, `GET /v1/convai/conversations?agent_id=`, `GET`/`DELETE /v1/convai/conversations/{id}`.
  - `AGENT_PROMPT: string`; `agentConfig({ llm: string, toolIds?: string[], voiceId?: string }): object`; `askClaudeToolConfig(): object`.
  - `VOICE/data/agent.json`: `{ agentId, toolId? }`.

- [ ] **Step 1: Check the request bodies against the current API reference**

Fetch `https://elevenlabs.io/docs/eleven-agents/api-reference/agents/create.md` and `https://elevenlabs.io/docs/api-reference/tools/create.md`. Confirm the field names used below, including the client tool's wrapper object (for example `tool_config`). Record any difference in the report and follow the reference.

- [ ] **Step 2: Write the failing tests**

```js
test('the agent speaks Polish on Haiku 5.5 with no retention', () => {
  const c = agentConfig({ llm: 'claude-haiku-5-5' });
  assert.equal(c.name, 'hub-voice-probe');
  assert.equal(c.conversation_config.agent.language, 'pl');
  assert.equal(c.conversation_config.agent.first_message, 'Cześć, słucham.');
  assert.equal(c.conversation_config.agent.prompt.llm, 'claude-haiku-5-5');
  assert.deepEqual(c.conversation_config.agent.prompt.tool_ids, []);
  assert.equal(c.conversation_config.tts.model_id, 'eleven_v4_turbo');
  assert.equal(c.conversation_config.asr.provider, 'scribe_realtime');
  assert.equal(c.platform_settings.privacy.retention_days, 0);
});
test('ask_claude waits up to 120 s, speaks before the call and allows interruption', () => {
  const t = askClaudeToolConfig().tool_config;
  assert.equal(t.type, 'client'); assert.equal(t.name, 'ask_claude');
  assert.equal(t.expects_response, true); assert.equal(t.response_timeout_secs, 120);
  assert.equal(t.pre_tool_speech, 'force'); assert.equal(t.interruption_mode, 'allow');
  assert.deepEqual(t.parameters.required, ['request']);
});
test('the minutes ledger sums seconds into minutes', () => {
  const f = join(mkdtempSync(join(tmpdir(), 'm-')), 'minutes.jsonl');
  assert.equal(totalMinutes(f), 0);
  appendMinutes(f, { probe: 'polish', conversationId: 'c1', seconds: 150 });
  appendMinutes(f, { probe: 'polish', conversationId: 'c2', seconds: 90 });
  assert.equal(totalMinutes(f), 4);
});
test('every ElevenLabs request carries xi-api-key and a failed delete is reported, not thrown', async () => {
  const seen = [];
  const fetchImpl = async (url, init) => { seen.push([url, init]); return new Response('gone', { status: 404 }); };
  const r = await createElevenClient({ apiKey: 'k', fetchImpl }).deleteConversation('c1');
  assert.deepEqual(r, { ok: false, status: 404, text: 'gone' });
  assert.equal(seen[0][0], 'https://api.elevenlabs.io/v1/convai/conversations/c1');
  assert.equal(seen[0][1].headers['xi-api-key'], 'k');
});
```

`AGENT_PROMPT` (English, spec §7):
- you are only the mouth; speak Polish and say English technical terms in English;
- never answer project questions yourself and never invent project facts;
- forward every question or statement about the project with `ask_claude`, passing Rafal's request in his words;
- when an answer contains `Decyzja do potwierdzenia:`, read that sentence word for word and wait for Rafal;
- never confirm anything on Rafal's behalf;
- keep your own sentences short;
- handle greetings, „powtórz" and mishearing yourself.

The `ask_claude` description says it asks Claude, who knows the project, and may take up to two minutes.

- [ ] **Step 3: Run them and see them fail; implement the modules; run them and see them pass** — `node --test`.

- [ ] **Step 4: Implement the CLIs**

- `agent-setup.mjs` has three commands:
  - `create --llm <llm>`: creates the agent without tools and writes `data/agent.json`;
  - `attach-tool`: creates the `ask_claude` tool, adds its id to the agent's `prompt.tool_ids` and to `data/agent.json`;
  - `set-llm <llm>`: patches `prompt.llm`.
- `conversations.mjs` has three commands:
  - `list`;
  - `get <id>`: prints the status code and the duration;
  - `purge --probe <name>`: for every conversation of the agent, appends its duration to `data/minutes.jsonl`, deletes it, prints the result and the new total.

- [ ] **Step 5: Create the agent and check it**

Run: `node tools/agent-setup.mjs create --llm claude-haiku-5-5`
Then `getAgent` must show `language` `pl`, `retention_days` 0 and `llm` `claude-haiku-5-5`.

- [ ] **Step 6: Run the probe with Rafal (about 4 minutes)**

Rafal opens the agent `hub-voice-probe` in the ElevenLabs dashboard and starts its test call. He talks Polish with English terms: yesterday's work with pull request, deployment, cache, merge conflict, Docker and n8n, and asks the agent to repeat one sentence full of English terms. He may switch the voice in the dashboard; record the voice used. Before the purge, Rafal reads the dashboard transcript of his own speech. Then run: `node tools/conversations.mjs purge --probe polish`.
Passes when Rafal judges the voice natural and the transcript right on the technical terms. Record his verdict verbatim, the voice and the minutes. On a negative verdict, stop: the fallback (GPT-Live-1, or another voice or model) is Rafal's decision.

- [ ] **Step 7: Record verbatim in the report** and commit and push the report.

---

### Task 6: Vendored client, probe bridge and page

**Files:**
- Create: `VOICE/web/vendor/elevenlabs-client.mjs`, `VOICE/web/vendor/VERSION.txt`, `VOICE/tools/auth.mjs`, `VOICE/tools/bridge.mjs`, `VOICE/tools/bridge-smoke.mjs`, `VOICE/web/talk.html`, `VOICE/web/talk.mjs`
- Test: `VOICE/test/auth.test.mjs`, `VOICE/test/bridge.test.mjs`

**Interfaces:**
- Consumes: `startFork`, `prepareDialog`, `voiceStartPrompt`, `END_PREFIX`, `DECISION_PREFIX` (Task 3); `readDialogFiles`, `closingReport` (Task 4); `createElevenClient`, `appendMinutes` (Task 5).
- Produces:
  - `authorize({ url: string, host?: string }, { token: string, port: number }): { ok: true } | { ok: false, status: 403, reason: 'token' | 'host' }`.
  - `startBridge({ sessionId, cwd, dialogDir, agentId, port = 0, token, command, eleven, minutesFile, asksFile, heartbeatGraceMs = 15000, askTimeoutMs = 115000, transcriptWaitMs = 1500, openBrowser = true }): Promise<{ url: string, port: number, token: string, done: Promise<string> }>`. `done` resolves with the closing report. The CLI `node tools/bridge.mjs --session <id> --cwd <dir> --dialog <dir> --agent <id> [--probe <name>]` uses `data/minutes.jsonl` and `data/asks.jsonl`, writes `--probe` into each minutes line, prints the report and exits 0.

- [ ] **Step 1: Vendor the browser client**

`npm view @elevenlabs/client version` gives the version (read-only). Download a single self-contained ES module of that version: first `https://esm.sh/@elevenlabs/client@<version>?bundle&target=es2022`, following one re-export stub if the response is one; else the package's own bundled build from `npm pack @elevenlabs/client@<version>` into a scratch directory. Check with `grep -nE "(from|import)\s*\(?['\"](https?:|/)" VOICE/web/vendor/elevenlabs-client.mjs`; expected: no output. Write `VERSION.txt` with the version, source URL and `sha256sum` output. If no self-contained module exists without a bundler, stop and ask Rafal: spec §4 says no build tooling. Read the vendored file's exports and record the exact names of `Conversation.startSession` options (`conversationToken`, `connectionType`, `clientTools`, `onConnect`, `onMessage`, `onDisconnect`, `onError`) as they exist in that version.

- [ ] **Step 2: Write the failing tests**

```js
// auth.test.mjs
const opts = { token: 'a'.repeat(64), port: 4100 };
test('the token and a local Host are both required', () => {
  assert.deepEqual(authorize({ url: `/api/ask?t=${'a'.repeat(64)}`, host: '127.0.0.1:4100' }, opts), { ok: true });
  assert.deepEqual(authorize({ url: `/?t=${'a'.repeat(64)}`, host: 'localhost:4100' }, opts), { ok: true });
  assert.deepEqual(authorize({ url: '/api/ask', host: '127.0.0.1:4100' }, opts), { ok: false, status: 403, reason: 'token' });
  assert.deepEqual(authorize({ url: `/api/ask?t=${'b'.repeat(64)}`, host: '127.0.0.1:4100' }, opts), { ok: false, status: 403, reason: 'token' });
  for (const host of ['evil.example:4100', '127.0.0.1:4101', undefined]) {
    assert.deepEqual(authorize({ url: `/?t=${'a'.repeat(64)}`, host }, opts), { ok: false, status: 403, reason: 'host' });
  }
});
```

`bridge.test.mjs` uses `fake-claude.mjs` as `command`, a fake `eleven` object recording calls (`getConversationToken` → `{ token: 'tok' }`, `getConversation` → `{ metadata: { call_duration_secs: 30 } }`, `deleteConversation` → `{ ok: true, status: 200, text: '' }`) and `openBrowser: false`:
- a request without the token gets 403, and `/` with the token gets 200 and HTML;
- `GET /api/conversation-token` returns `{ token: 'tok' }`;
- `POST /api/ask` `{ request: 'pytanie' }` after `POST /api/transcript` `{ role: 'user', text: 'zażółć gęślą jaźń' }` returns `answer` = `echo: Agent głosowy przekazuje: pytanie\nRafał (transkrypcja): zażółć gęślą jaźń`;
- `POST /api/ask` `{ request: 'drugie' }` sent first, with `POST /api/transcript` `{ role: 'user', text: 'później' }` 100 ms after it (`transcriptWaitMs: 500`), returns an answer ending with `Rafał (transkrypcja): później`; the asks file line for it has `transcriptLate: true`;
- with `askTimeoutMs: 100` and `FAKE_SLOW_MS: '300'`, `POST /api/ask` `{ request: 'slow' }` returns `Claude nadal myśli. Zapytaj za chwilę jeszcze raz.`, and the next ask returns its own echo;
- two parallel `/api/ask` calls return their own echoes;
- `POST /api/end` `{ conversationId: 'conv_1' }` resolves `done` with a report containing `deletion: deleted`; `eleven.deleteConversation` was called with `conv_1`; `transcript.md` contains `zażółć gęślą jaźń`; the minutes file holds one 30-second line;
- with `heartbeatGraceMs: 200`, one `/api/heartbeat` `{ conversationId: 'conv_2' }` and no further beats, `done` resolves and `conv_2` is deleted.

- [ ] **Step 3: Run them and see them fail** — `node --test test/auth.test.mjs test/bridge.test.mjs`.

- [ ] **Step 4: Implement `auth.mjs` and `bridge.mjs`**

`authorize` compares the token with `crypto.timingSafeEqual` on equal-length buffers. The bridge binds `127.0.0.1` only and runs `authorize` on every request, static files included; the page appends its `location.search` to every URL it loads.

Routes:
- `GET /`, `GET /talk.mjs`, `GET /vendor/elevenlabs-client.mjs`;
- `GET /api/conversation-token`;
- `POST /api/transcript`: lines with local time; user lines since the last ask are pending;
- `POST /api/ask`: when no user line is pending, waits up to `transcriptWaitMs` for one (the SDK does not promise that the transcript callback precedes the tool call). It sends the fork `Agent głosowy przekazuje: <request>\nRafał (transkrypcja): <pending user lines joined with " / ">` and appends `{ at, ms, request, transcriptLate }` to `asksFile`. On `timedOut` (`askTimeoutMs`) it answers `Claude nadal myśli. Zapytaj za chwilę jeszcze raz.`;
- `GET /api/decisions`: the current `decisions.md` or an empty string;
- `POST /api/heartbeat`: stores `conversationId` when given;
- `POST /api/end`.

The end runs once, triggered by `/api/end` or by a lost heartbeat after the first one:
1. Ask the fork the end message, starting with `END_PREFIX` and naming `<dialog>/prompt.md` and its sections, with a 120-second timeout.
2. `close()` the fork.
3. Write `transcript.md`.
4. With a conversation id: `getConversation`, then `appendMinutes`, then `deleteConversation`. The deletion text is `deleted`, `failed: <status> <text>` or `no conversation id`.
5. Build `closingReport`, resolve `done` and close the server.

The CLI opens the URL with `cmd /c start "" "<url>"`.

- [ ] **Step 5: Run the tests and see them pass** — `node --test`. Expected: all passing.

- [ ] **Step 6: Implement the page**

Polish UI:
- buttons „Rozpocznij rozmowę" and „Zakończ rozmowę";
- a status line showing „Claude myśli…" during an ask;
- the transcript;
- a box „Decyzja do potwierdzenia" with the latest ask answer containing `DECISION_PREFIX`;
- a box „Zapisane decyzje" polling `/api/decisions` every 3 s.

The start button fetches the token and calls `Conversation.startSession` with the option names recorded in step 1, as follows:
- `connectionType` `webrtc`;
- the client tool `ask_claude`, which posts `/api/ask` and returns the answer;
- message callbacks that post `/api/transcript`;
- on connect: post `/api/heartbeat` with the conversation id, then every 5 s;
- on disconnect: post `/api/end`.

The end button ends the session.

- [ ] **Step 7: Run the voiceless harness against a real fork**

`bridge-smoke.mjs` starts the bridge on a fork of the seed session with `openBrowser: false` and a stub `eleven`. It posts `/api/ask` `{ request: 'Jaki jest pierwszy otwarty wybór w PLAN.md?' }`, sends one request without the token and one with `Host: evil.example`, then posts `/api/end`.
Run: `node tools/bridge-smoke.mjs --session $(cat data/seed-session.txt) --cwd C:/Users/rafal/hub-probes/repo --dialog C:/Users/rafal/.claude/hub/projects/repo/dialogs/2026-10-19-voice-smoke`
Passes when: the answer names the file format choice and is speakable; both bad requests get 403; the report prints; the fork process has exited.

- [ ] **Step 8: Record in the report** (vendored version, source, hash, option names, harness output) and commit and push the report.

---

### Task 7: Probe "Haiku and Sonnet" (about 2 × 3 minutes)

**Files:**
- Create: `VOICE/data/decision-script.md`

**Interfaces:**
- Consumes: `startBridge` CLI and the page (Task 6); `agent-setup.mjs`, `conversations.mjs` (Task 5).

- [ ] **Step 1: Attach the tool** — `node tools/agent-setup.mjs attach-tool`; `getAgent` shows one `tool_ids` entry.

- [ ] **Step 2: Write the decision script** (Polish, for Rafal to say)

1. „Omówmy pierwszy wybór z PLAN.md i zdecydujmy.", then „tak" to the read-back.
2. „Przejrzyj cały PLAN.md i powiedz, który wybór jest najtrudniejszy i dlaczego." During the wait, Rafal starts talking over the filler.
3. „Zdecydujmy drugi wybór: pasek narzędzi.", then „tak".
4. „Trzeci wybór: nazwa z datą.", then a correction, „nie, bez daty", then „tak" to the corrected read-back.
5. „Kończymy."

- [ ] **Step 3: Run A on Haiku 5.5**

Run: `node tools/bridge.mjs --session $(cat data/seed-session.txt) --cwd C:/Users/rafal/hub-probes/repo --dialog C:/Users/rafal/.claude/hub/projects/repo/dialogs/2026-10-19-voice-haiku --agent $(node -p "require('./data/agent.json').agentId") --probe haiku`. Rafal follows the script and ends with the button. Keep the printed report, `transcript.md`, `decisions.md` and the asks file.

- [ ] **Step 4: Run B on Sonnet 5.5**

Run: `node tools/agent-setup.mjs set-llm claude-sonnet-5-5`, then `node tools/bridge.mjs --session $(cat data/seed-session.txt) --cwd C:/Users/rafal/hub-probes/repo --dialog C:/Users/rafal/.claude/hub/projects/repo/dialogs/2026-10-19-voice-sonnet --agent $(node -p "require('./data/agent.json').agentId") --probe sonnet`. Rafal follows the same script.

- [ ] **Step 5: Compare and let Rafal choose**

For each run, a table per decision: the read-back as spoken (transcript) against the text in `decisions.md`, marked verbatim, same meaning, or changed meaning. Also per run:
- median and maximum ask latency;
- whether the filler played;
- whether the interruption broke anything;
- whether the corrected decision 3 was written only in its corrected form;
- how many asks had `transcriptLate: true`;
- `deletion: deleted`;
- the minutes total.

Rafal picks the model. Set it with `set-llm` if it is not Sonnet. Passes when both runs completed and Rafal chose.

- [ ] **Step 6: Record verbatim in the report** and commit and push the report.

---

### Task 8: Probe "End to end" (about 3 minutes)

**Files:**
- Create: `C:/Users/rafal/hub-probes/repo/.claude/skills/talk-probe/SKILL.md`

**Interfaces:**
- Consumes: the bridge CLI (Task 6); the session id method proven in Task 4; the agent with Rafal's model (Task 7).

- [ ] **Step 1: Write the sandbox skill `talk-probe`**

Steps in its `SKILL.md`:
1. Run the bridge with `run_in_background: true`: `node C:/Users/rafal/hub-probes/voice/tools/bridge.mjs --session ${CLAUDE_SESSION_ID} --cwd C:/Users/rafal/hub-probes/repo --dialog C:/Users/rafal/.claude/hub/projects/repo/dialogs/2026-10-19-voice-e2e --agent <the agentId from VOICE/data/agent.json, written into the skill> --probe e2e`. If Task 4 proved the registry fallback instead of `${CLAUDE_SESSION_ID}`, the skill's first step runs that lookup and passes its result.
2. End the turn with „Rozmowa głosowa otwarta w przeglądarce.".
3. When the task completes, read the report from its output, show the decisions as a short Polish table, and carry out the work order of its `prompt.md` section (in the sandbox it only edits `PLAN.md`). Do not commit, and stop at any outward action.

- [ ] **Step 2: Run the probe with Rafal**

New session in VS Code on the sandbox repository, `/talk-probe`. Rafal makes one decision („format CSV", „tak") and gives one work order („Zleć sesji dopisanie wybranego formatu do PLAN.md", „tak" to its read-back). He ends with the button.
Passes when:
- the session woke by itself and showed the table;
- the report says `deletion: deleted`;
- `node tools/conversations.mjs get <id>` returns 404;
- `prompt.md` holds only the confirmed order and decision;
- `git -C C:/Users/rafal/hub-probes/repo diff` shows only session X's edit for the work order and nothing from the fork.

- [ ] **Step 3: Record verbatim in the report** and commit and push the report.

---

### Task 9: Conclusions, index and cleanup

**Files:**
- Modify: `D:/Notatki/notatki/.claude/specs/2026-10-19-hub-voice-probes.md`, `D:/Notatki/notatki/.claude/projects/hub.md`

- [ ] **Step 1: Purge leftovers** — `node tools/conversations.mjs list` shows no conversation; if any, `purge --probe cleanup`. Check that no bridge or fork from this plan still runs: `tasklist | grep -i node` against the PIDs logged by the runs. The agent and its tool stay for Plan 2.

- [ ] **Step 2: Write "Conclusions for Plan 2" in the report**

Cover:
- the session id method;
- the voice fork settings as verified;
- fork latency and the voice role's wording;
- the chosen agent LLM;
- the vendored client and its option names;
- every deviation from the spec.

A deviation that changes the spec goes to Rafal before any spec edit.

- [ ] **Step 3: Update the hub index with the skill `project-index`**

Register the probe report and mark `hub-voice-plan-1` done with today's date. Teraz and Następny krok point to Plan 2 of `hub-voice`.

- [ ] **Step 4: Commit and push** the report and the index together (vault rule; only these paths).
