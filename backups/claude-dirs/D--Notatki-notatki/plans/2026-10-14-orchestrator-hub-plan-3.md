# Orchestrator hub — Plan 3: project map, titles, new sessions, dialog, Codex

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the installed hub with a project map with descriptive names, conversation titles read from the transcripts, new sessions launched from the map, the dialog path through a read-only fork with a git snapshot, and the Codex consultation, then accept the whole hub with Rafal.

**Architecture:** The skill `hub` (Node, standard library only, ESM) is developed in `C:/Users/rafal/hub-dev/hub/` and installed by Rafal into `~/.claude/skills/hub/`, as in Plan 2. New pure modules (`lib/titles.mjs`, `lib/launch.mjs`, `lib/denylist.mjs`, `lib/dialog.mjs`, `lib/codex.mjs`) are wired into the CLI `bin/hub.mjs`; the CLI spawns `claude --bg` and Codex without a shell, and tests replace both with fake CLIs in `fakes/`. `SKILL.md` gains one procedure per new path.

**Tech Stack:** Node v24.20.0 (checked), `node:test`, Git Bash on Windows 11, Claude Code CLI (`claude --bg`, `claude agents --json`, `claude attach`, `claude stop`), Codex CLI 0.147.0 (`codex exec`, `codex exec resume`).

**Spec:** `D:/Notatki/notatki/.claude/specs/2026-10-13-orchestrator-hub-design.md` — §4.1, §4.2, §5.1 (conversation titles), §5.6, §6.5, §6.6, §7, §8.2, §9.1, §9.3, §10 "Plan 3", §13.3 (P1–P9). Probe evidence: `D:/Notatki/notatki/.claude/specs/2026-10-13-orchestrator-hub-probes.md` (S6, S7, S9, S10, S12). Plan 2 for the existing code and conventions: `D:/Notatki/notatki/.claude/plans/2026-10-14-orchestrator-hub-plan-2-core.md`.

## Global Constraints

- Platform: Windows 11; shell commands are Git Bash; Node scripts use only the standard library; ESM `.mjs` files with `"type": "module"`.
- Run tests with `node --test` from the skill directory (`node --test test/` does not work on this machine). `node --test` runs every `.mjs` file under `test/`, so the fake CLIs live in `fakes/`, outside it (found while writing this plan).
- Development happens in `C:/Users/rafal/hub-dev/hub/`. Nothing is written into `~/.claude/` by a Claude session: the auto mode classifier refuses such writes as "[Self-Modification]". Tasks 5 and 8 hand Rafal the install command.
- Tests use a temporary directory as the hub data root (`HUB_DATA`) and never touch the real `~/.claude/hub/`. They never start the real `claude` or `codex`: `HUB_CLAUDE_CMD` and `HUB_CODEX_CMD` (JSON arrays) replace them with `fakes/claude.mjs` and `fakes/codex.mjs`.
- No commit and no push in any real repository; `C:/Users/rafal/hub-dev/` is not a repository. Documents in the vault stay uncommitted; Task 9 proposes commit messages.
- Code, comments and docs in English; user-facing text in Polish (the project line in a new session's **Kontekst**, "brak drugiej opinii", the marker `⏸ Czeka na decyzję: prompt gotowy do przeglądu`, what the hub tells Rafal).
- The project map, titles, new sessions, dialog and Codex follow spec §4.2, §5.1, §6.6, §6.5 and §7 exactly: map entries `name`, `dir`, `description` under a kebab-case key; title order transcript title → `session_title` → poll name; `claude --bg --name <key>-<slug> [-w <key>-<slug>] "<text>"` with at most 30 000 characters; fork command `claude --bg --resume <id> --fork-session --name dlg-<key>-<slug> --settings <file> "<prompt>" --add-dir <dir>`; fork `deny` `Edit(./**)`, `Bash`, `EnterWorktree`; git snapshot with `--no-optional-locks` and the §7 denylist excluded; Codex first call `codex exec -s read-only -C <dir> --json -o <answer> -`, follow-up `codex exec resume <id> -c sandbox_mode="read-only" --json -o <answer> -` from `<dir>`.
- A new session runs in a worktree by default (`claude --bg -w <key>-<slug>`); `--no-worktree` only when Rafal says "bez worktree" (spec §6.6, P9, Rafal's decision of 2026-10-14).
- Every message on every path still carries the five sections of §6.1; the hub sends nothing Rafal has not approved with "wyślij", and launches a new session only after that approval.
- The §8.2 writing boundary holds for paths named on the command line: `dialog refresh --dir` and `codex follow|note --thread` accept only the hub's own `projects/<project>/dialogs/<name>` and `projects/<project>/codex/<name>` directories (after `..` and links are resolved, `ownedDir`); `codex ask --file` accepts only files inside the session's repository or the hub data, a relative path taken from the session's `cwd` (from the Codex review of this plan).
- Plan-level additions, for Rafal to accept in the plan review: the unique id prefix (finding A1) is accepted by every `--session` option, not only by `last` and `judge`; `HUB codex note` records the hub's assessment in `thread.md`; `thread.md` keeps the full prompt in a `<details>` block; the fork's start prompt is also kept as `start-prompt.md`, and the fallback command reads it with `$(cat …)`; the overview marks launched sessions `[background]` or `[dialog]`; `status.txt` of the snapshot also leaves out the denylisted names; a Codex answer whose stream has no `thread.started` is kept and marked with a `warning` (no follow-up possible) instead of failing; the Codex command is `codex.js` under `%APPDATA%\npm\node_modules\@openai\codex\bin\` run with Node, because Node 24 cannot spawn the `codex.cmd` shim without a shell; timeouts: 120 s for `claude --bg`, 15 minutes for a Codex call.

## Review Focus

1. **A prompt with `"`, backticks, `$`, `%` and line breaks passed to `claude --bg` on the Windows command line.** Expected: the session receives it unchanged and no shell expands anything. Pinned by the launch test in Task 4 (fake CLI); the real `claude.exe` is checked by acceptance item 9 through the `promptHash`.
2. **A transcript cut in the middle of a line while Claude Code is writing it.** Expected: the broken line is skipped and the previous title is shown. Pinned by the titles test in Task 2.
3. **A session working in a subdirectory of its repository.** Expected: the dialog snapshot holds the whole repository's diff, still without denylisted files. Pinned by the dialog test in Task 6 (checked during plan writing: exclude-only pathspecs cover the whole repository from a subdirectory with git 2.35.1).
4. **`claude agents --json` failing right before a launch.** Expected: the launch is refused with the literal poll error instead of risking a duplicate name. Pinned by the launch-checks test in Task 4.
5. **A project directory with a space (`D:\Praca\Devstock\Baza wiedzy`).** Expected: `claude --bg` and Codex `-C` get it as one argument. Pinned by the launch test in Task 4 and the Codex test in Task 7 (both use `Baza wiedzy`).

---

## File Structure

| Path (under `C:/Users/rafal/hub-dev/hub/`) | Responsibility | Task |
|---|---|---|
| `lib/projects.mjs` | Project map: loading, validation, matching, the `HUB projects` listing (replaces the aliases) | 1 |
| `lib/overview.mjs` | Map names, conversation titles, launched-kind mark, local time | 1, 2, 3 |
| `lib/watch.mjs` | Watcher lines carry the map name | 1 |
| `bin/install.mjs` | A fresh install writes an empty `projects` map | 1 |
| `lib/titles.mjs` | Newest title record from a transcript, cached by size; retention pruning | 2 |
| `lib/events.mjs`, `lib/derive.mjs` | `UserPromptSubmit` records `transcriptPath`; derived state keeps it | 2 |
| `lib/paths.mjs` | `titlesPath`, `dialogsDir`, `codexDir`, `ownedDir` (the write-boundary check) | 2, 6, 7 |
| `lib/retention.mjs` | Drops cached titles of deleted sessions | 2 |
| `lib/registry.mjs` | `resolveSessionId`: full id or unique prefix | 3 |
| `lib/compose.mjs` | Header `target` and `origin`; the project line under **Kontekst** | 4, 6 |
| `lib/launch.mjs` | `claude --bg` command line, launch checks, backgrounded line, full id from a poll | 4 |
| `lib/confirm.mjs` | Delivery evidence of a launched session: its first prompt's hash | 4 |
| `lib/journal.mjs` | Records without a `sessionId` render | 4 |
| `lib/denylist.mjs` | Secret-bearing names and the git exclude pathspecs | 6 |
| `lib/dialog.mjs` | Git snapshot, fork settings, fork arguments, start prompt, fallback command | 6 |
| `lib/codex.mjs` | Codex command, element text, arguments, call outcome, `thread.md` entries | 7 |
| `bin/hub.mjs` | CLI: `projects`, `launch`, `dialog start|refresh`, `codex ask|follow|note`, new-session `compose`/`approve`, `--origin`, id prefixes | 1, 3, 4, 6, 7 |
| `fakes/claude.mjs`, `fakes/codex.mjs` | Fake CLIs for the tests | 4, 7 |
| `SKILL.md` | Procedures: project map, titles, new session, dialog, Codex | 1, 2, 4, 6, 7 |
| `test/overview.test.mjs`, `test/cli.test.mjs`, `test/titles.test.mjs`, `test/launch.test.mjs`, `test/dialog.test.mjs`, `test/codex.test.mjs` | Tests | 1–7 |
| `D:/Notatki/notatki/.claude/specs/2026-10-14-orchestrator-hub-plan-3-acceptance.md` | Acceptance report | 9 |

All code below was run during plan writing in a scratch copy of the hub, task after task: 109 tests passing at the end (71 before). Every "Modify" block is a unified diff against the state the previous task leaves; apply it by hand with Edit (each hunk's context lines are unique in the file).

---

### Task 0: Preflight

Another session may have touched the hub since Plan 2; this task proves the starting point and keeps a reference copy for the reviewers.

**Files:** creates `C:/Users/rafal/hub-dev/hub-before-plan-3/` (a copy, not a repository).

- [ ] **Step 1: The development copy equals the installed skill**

```bash
diff -rq C:/Users/rafal/hub-dev/hub C:/Users/rafal/.claude/skills/hub
```

Expected: no output. Any difference: stop and show it to Rafal; do not pick a side.

- [ ] **Step 2: The baseline passes**

```bash
cd C:/Users/rafal/hub-dev/hub && node --test 2>&1 | grep -E "^ℹ (pass|fail)"
```

Expected: `ℹ pass 71`, `ℹ fail 0`.

- [ ] **Step 3: Keep the reference copy**

```bash
cp -r C:/Users/rafal/hub-dev/hub C:/Users/rafal/hub-dev/hub-before-plan-3
```

Reviewers compare with `diff -ru C:/Users/rafal/hub-dev/hub-before-plan-3 C:/Users/rafal/hub-dev/hub`. The copy is also the undo source of Tasks 5 and 8.

---

### Task 1: The project map

Spec §4.1, §4.2, §5.6, §9.1 rows "Project matching" and "Project map". The map replaces the empty `aliases`; Rafal writes it, the hub never does.

**Files:**
- Modify: `lib/projects.mjs` (whole file), `lib/overview.mjs`, `lib/watch.mjs`, `bin/hub.mjs`, `bin/install.mjs`, `SKILL.md`
- Test: `test/overview.test.mjs`, `test/cli.test.mjs`

**Interfaces:**
- Consumes: `projectsConfigPath(root)` (`lib/paths.mjs`), `buildOverview(root)`.
- Produces: `MAP_FIELDS`; `mapErrors(projects, { dirExists }) → string[]`; `loadProjectMap(root, { dirExists }) → { projects, errors }`; `projectOf(cwd, projects, commonDirOf) → { key, name, mapped }`; `projectFor(cwd, projects, commonDirOf) → key`; `renderProjects({ projects, errors, unmapped }) → string`; `isWithin`, `samePath`, `gitCommonDir` unchanged. Overview rows gain `projectName` and `mapped`; `row.project` stays the key (the folder `projects/<key>/`). CLI `HUB projects`. `loadAliases` and `aliasErrors` are removed.

- [ ] **Step 1: Write the failing tests**

Modify `test/cli.test.mjs` (unified diff against the state after the previous task):

````diff
@@ -25,7 +25,7 @@ function setup() {
     ev('UserPromptSubmit', '2026-10-14T10:00:00Z', { cwd: repo, promptId: 'p1', sessionTitle: 'probe-a' }),
     ev('Stop', '2026-10-14T10:01:00Z', { cwd: repo, promptId: 'p1', marker: null, lastFile: 's1.last/x.md' }),
   ]);
-  writeFileSync(join(root, 'projects.json'), JSON.stringify({ aliases: { app: repo } }));
+  writeFileSync(join(root, 'projects.json'), JSON.stringify({ projects: { app: { name: 'App', dir: repo, description: 'Test app.' } } }));
   const agents = join(root, 'agents.json');
   writeFileSync(agents, JSON.stringify([{ sessionId: 's1', id: 's1', name: 'probe-a', kind: 'interactive', status: 'idle', state: null, cwd: repo }]));
   const hub = (...args) => spawnSync(process.execPath, [HUB, ...args], { encoding: 'utf8', env: { ...process.env, HUB_DATA: root } });
@@ -100,7 +100,7 @@ test('overview, last and questionnaire request through the CLI', () => {
   const { agents, hub } = setup();
   const overview = hub('overview', '--agents-json', agents);
   assert.equal(overview.status, 0, overview.stderr);
-  assert.match(overview.stdout, /\| app \| s1 probe-a \| turn ended \(judge\) \|/);
+  assert.match(overview.stdout, /\| App \| s1 probe-a \| turn ended \(judge\) \|/);
   assert.match(hub('last', 's1').stdout, /registry[\\/]s1\.last[\\/]x\.md/);
   const request = hub('compose', '--path', 'questionnaire-request', '--session', 's1', '--topic', 'nazwa pliku', '--max', '3').stdout.trim();
   assert.match(readFileSync(request, 'utf8'), /decyzje o: nazwa pliku[\s\S]*Liczba pytań: najwyżej 3\./);
@@ -148,36 +148,45 @@ test('judge: a question after a turn without the marker shows "probably waiting
   const { repo, log, agents, hub } = setup();
   assert.equal(hub('judge', 's1', '--verdict', 'maybe').status, 2);
   assert.equal(JSON.parse(hub('judge', 's1', '--verdict', 'question').stdout).verdict, 'question');
-  assert.match(hub('overview', '--agents-json', agents).stdout, /\| app \| s1 probe-a \| probably waiting for you \|/);
+  assert.match(hub('overview', '--agents-json', agents).stdout, /\| App \| s1 probe-a \| probably waiting for you \|/);
   log([
     ev('UserPromptSubmit', '2026-10-14T10:05:00Z', { cwd: repo, promptId: 'p3' }),
     ev('Stop', '2026-10-14T10:06:00Z', { cwd: repo, promptId: 'p3', marker: null, lastFile: 's1.last/z.md' }),
   ]);
-  assert.match(hub('overview', '--agents-json', agents).stdout, /\| app \| s1 probe-a \| turn ended \(judge\) \|/);
+  assert.match(hub('overview', '--agents-json', agents).stdout, /\| App \| s1 probe-a \| turn ended \(judge\) \|/);
+});
+
+test('HUB projects prints the map and the projects seen outside it', () => {
+  const { root, hub } = setup();
+  appendFileSync(join(root, 'registry', 's9.events.jsonl'), `${JSON.stringify(ev('UserPromptSubmit', '2026-10-14T10:00:00Z', { sessionId: 's9', cwd: join(root, 'loose') }))}\n`);
+  const out = hub('projects');
+  assert.equal(out.status, 0, out.stderr);
+  assert.match(out.stdout, /\| app \| App \| .*app \| Test app\. \|/);
+  assert.match(out.stdout, /Seen in the registry, outside the map: loose/);
+});
+
+test('compose reads the body from stdin', () => {
+  const { root } = setup();
+  const body = five('Uruchom testy.');
+  const run = spawnSync(process.execPath, [HUB, 'compose', '--path', 'direct', '--session', 's1', '--body-file', '-'], { encoding: 'utf8', input: body, env: { ...process.env, HUB_DATA: root } });
+  assert.equal(run.status, 0, run.stderr);
+  const text = readFileSync(run.stdout.trim(), 'utf8');
+  assert.match(text, /^\[hub · direct · app · s1 · /);
+  assert.ok(text.includes(body));
+});
+
+test('confirm flags a hub message whose text differs from the approved one', () => {
+  const { root, log, agents, hub, draftOf } = setup();
+  const draft = draftOf('Uruchom testy.');
+  const record = JSON.parse(hub('approve', '--session', 's1', '--path', 'direct', '--text-file', draft).stdout);
+  assert.equal(hub('prepare', record.id, '--agents-json', agents).status, 0);
+  hub('result', record.id, '--msg-id', '11111111-2222-3333-4444-555555555555');
+  log([ev('UserPromptSubmit', new Date(Date.now() + 1000).toISOString(), { promptId: 'p2', fromName: 'hub', innerHash: 'other' })]);
+  const out = JSON.parse(hub('confirm').stdout);
+  assert.deepEqual(out.mismatched, [record.id]);
+  assert.deepEqual(out.confirmed, []);
+  assert.equal(loadRecords(root, 'app')[0].state, 'pending');
+  assert.match(hub('journal', '--project', 'app').stdout, /delivered text differs from the approved text/);
+  // Already flagged: a second confirm does not report it again.
+  assert.deepEqual(JSON.parse(hub('confirm').stdout).mismatched, []);
 });
-
-test('compose reads the body from stdin', () => {
-  const { root } = setup();
-  const body = five('Uruchom testy.');
-  const run = spawnSync(process.execPath, [HUB, 'compose', '--path', 'direct', '--session', 's1', '--body-file', '-'], { encoding: 'utf8', input: body, env: { ...process.env, HUB_DATA: root } });
-  assert.equal(run.status, 0, run.stderr);
-  const text = readFileSync(run.stdout.trim(), 'utf8');
-  assert.match(text, /^\[hub · direct · app · s1 · /);
-  assert.ok(text.includes(body));
-});
-
-test('confirm flags a hub message whose text differs from the approved one', () => {
-  const { root, log, agents, hub, draftOf } = setup();
-  const draft = draftOf('Uruchom testy.');
-  const record = JSON.parse(hub('approve', '--session', 's1', '--path', 'direct', '--text-file', draft).stdout);
-  assert.equal(hub('prepare', record.id, '--agents-json', agents).status, 0);
-  hub('result', record.id, '--msg-id', '11111111-2222-3333-4444-555555555555');
-  log([ev('UserPromptSubmit', new Date(Date.now() + 1000).toISOString(), { promptId: 'p2', fromName: 'hub', innerHash: 'other' })]);
-  const out = JSON.parse(hub('confirm').stdout);
-  assert.deepEqual(out.mismatched, [record.id]);
-  assert.deepEqual(out.confirmed, []);
-  assert.equal(loadRecords(root, 'app')[0].state, 'pending');
-  assert.match(hub('journal', '--project', 'app').stdout, /delivered text differs from the approved text/);
-  // Already flagged: a second confirm does not report it again.
-  assert.deepEqual(JSON.parse(hub('confirm').stdout).mismatched, []);
-});
````

Modify `test/overview.test.mjs` (unified diff against the state after the previous task):

````diff
@@ -5,7 +5,7 @@ import { join } from 'node:path';
 import { deriveSession } from '../lib/derive.mjs';
 import { runPoll, appendPoll, readPolls, isVanished } from '../lib/polls.mjs';
 import { displayState, linkContinuations } from '../lib/display.mjs';
-import { isWithin, projectFor, aliasErrors } from '../lib/projects.mjs';
+import { isWithin, projectFor, projectOf, mapErrors, loadProjectMap, renderProjects } from '../lib/projects.mjs';
 import { buildOverview, renderOverview } from '../lib/overview.mjs';
 import { readHubSessions } from '../lib/hubsessions.mjs';
 import { tempRoot, ev } from './helpers.mjs';
@@ -95,14 +95,45 @@ test('project matching: segment boundaries, case, longest root, duplicate roots,
   assert.equal(isWithin('C:\\repo\\src', 'C:\\repo'), true);
   assert.equal(isWithin('C:\\repo-old', 'C:\\repo'), false);
   assert.equal(isWithin('c:\\REPO', 'C:\\repo'), true);
-  const aliases = { outer: 'C:\\work', inner: 'C:\\work\\app' };
-  assert.equal(projectFor('C:\\work\\app\\x', aliases, () => null), 'inner');
-  assert.equal(projectFor('C:\\work\\other', aliases, () => null), 'outer');
-  assert.deepEqual(aliasErrors({ a: 'C:\\x', b: 'c:\\X\\' }), ['aliases a, b share the root c:\\x']);
-  assert.equal(projectFor('C:\\repos\\app\\.claude\\worktrees\\wt', {}, () => 'C:\\repos\\app\\.git'), 'app');
+  const map = { outer: { name: 'Outer', dir: 'C:\\work', description: 'x' }, inner: { name: 'Inner app', dir: 'C:\\work\\app', description: 'x' } };
+  assert.deepEqual(projectOf('C:\\work\\app\\x', map, () => null), { key: 'inner', name: 'Inner app', mapped: true });
+  assert.equal(projectFor('C:\\work\\other', map, () => null), 'outer');
+  const twins = { a: { name: 'A', dir: 'C:\\x', description: 'x' }, b: { name: 'B', dir: 'c:\\X\\', description: 'x' } };
+  assert.deepEqual(mapErrors(twins, { dirExists: () => true }), ['entries a, b share the dir c:\\x']);
+  assert.deepEqual(projectOf('C:\\repos\\app\\.claude\\worktrees\\wt', {}, () => 'C:\\repos\\app\\.git'), { key: 'app', name: 'app', mapped: false });
   assert.equal(projectFor('C:\\loose\\dir', {}, () => null), 'dir');
 });
 
+test('project map: every entry needs a kebab-case key, name, dir and description; a missing dir is reported', () => {
+  const errors = mapErrors({
+    'Baza wiedzy': { name: 'Baza', dir: 'C:\\b', description: 'x' },
+    vault: { name: 'Vault', dir: 'C:\\gone' },
+  }, { dirExists: (dir) => dir !== 'C:\\gone' });
+  assert.deepEqual(errors, [
+    'entry Baza wiedzy: the key must be kebab-case',
+    'entry vault: missing description',
+    'entry vault: dir does not exist: C:\\gone',
+  ]);
+  const root = tempRoot();
+  writeFileSync(join(root, 'projects.json'), JSON.stringify({ aliases: { old: 'C:\\x' }, projects: {} }));
+  assert.deepEqual(loadProjectMap(root).errors, ['`aliases` is no longer read; move its entries into `projects` (spec §4.2)']);
+  writeFileSync(join(root, 'projects.json'), JSON.stringify({ aliases: {} }));
+  assert.deepEqual(loadProjectMap(root), { projects: {}, errors: [] });
+});
+
+test('a session outside the map keeps the fallback name, marked in the overview; HUB projects lists it', () => {
+  const root = tempRoot();
+  writeLog(root, 'loose', [ev('UserPromptSubmit', '2026-10-14T11:50:00Z', { promptId: 'w1', cwd: 'C:\\loose\\dir' })]);
+  const overview = buildOverview(root, { now: NOW, commonDirOf: () => null });
+  assert.equal(overview.rows[0].mapped, false);
+  assert.match(renderOverview(overview), /\| dir \(outside the map\) \| loose /);
+  const listing = renderProjects({ projects: { app: { name: 'App', dir: 'C:\\app', description: 'Kursy | lekcje' } }, errors: ['entry x: missing dir'], unmapped: ['dir'] });
+  assert.match(listing, /\| app \| App \| C:\\app \| Kursy \\\| lekcje \|/);
+  assert.match(listing, /Seen in the registry, outside the map: dir/);
+  assert.match(listing, /projects.json: entry x: missing dir/);
+  assert.equal(renderProjects({ projects: {}, errors: [], unmapped: [] }), 'The project map is empty.');
+});
+
 test('the overview excludes the hub, SessionEnd-only logs, /clear predecessors and day-old ends', () => {
   const root = tempRoot();
   writeLog(root, 'hub1', [ev('UserPromptSubmit', '2026-10-14T11:00:00Z', { cwd: root })]);
@@ -112,7 +143,7 @@ test('the overview excludes the hub, SessionEnd-only logs, /clear predecessors a
     ev('UserPromptSubmit', '2026-10-14T11:50:00Z', { promptId: 'w1', sessionTitle: 'probe-a' }),
     ev('Stop', '2026-10-14T11:51:00Z', { promptId: 'w1', marker: 'A czy B?', lastFile: 'work.last/x.md' }),
   ]);
-  writeFileSync(join(root, 'projects.json'), JSON.stringify({ aliases: { sandbox: 'C:\\repo' } }));
+  writeFileSync(join(root, 'projects.json'), JSON.stringify({ projects: { sandbox: { name: 'Sandbox repo', dir: 'C:\\repo', description: 'Probe sandbox.' } } }));
   appendPoll(root, poll('2026-10-14T11:59:00Z', [agent('work', 'idle', { state: 'blocked' })]));
 
   const overview = buildOverview(root, { now: NOW, commonDirOf: () => null });
@@ -125,7 +156,7 @@ test('the overview excludes the hub, SessionEnd-only logs, /clear predecessors a
   assert.deepEqual(readHubSessions(root).hub, ['hub1']);
 
   const text = renderOverview(overview);
-  assert.match(text, /\| sandbox \| work probe-a \| waiting for decision \|/);
+  assert.match(text, /\| Sandbox repo \| work probe-a \| waiting for decision \|/);
 });
 
 test('a broken event line and an unreadable projects.json do not break the overview', () => {
@@ -138,14 +169,14 @@ test('a broken event line and an unreadable projects.json do not break the overv
   assert.match(renderOverview(overview), /projects.json: unreadable: /);
 });
 
-test('the overview reports a failed last poll and alias errors', () => {
+test('the overview reports a failed last poll and project map errors', () => {
   const root = tempRoot();
-  writeFileSync(join(root, 'projects.json'), JSON.stringify({ aliases: { a: 'C:\\x', b: 'C:\\x' } }));
+  writeFileSync(join(root, 'projects.json'), JSON.stringify({ projects: { a: { name: 'A', dir: 'C:\\x', description: 'x' }, b: { name: 'B', dir: 'C:\\x', description: 'x' } } }));
   appendPoll(root, { at: 't', ok: false, error: 'spawn claude ENOENT' });
   const overview = buildOverview(root, { now: NOW, commonDirOf: () => null });
   const text = renderOverview(overview);
   assert.match(text, /Last poll of claude agents --json failed: spawn claude ENOENT/);
-  assert.match(text, /projects.json: aliases a, b share the root/);
+  assert.match(text, /projects.json: entries a, b share the dir/);
 });
 
 test('a session newer than the last two polls is not vanished', () => {
````

- [ ] **Step 2: Run the tests to see them fail**

Run: `cd C:/Users/rafal/hub-dev/hub && node --test 2>&1 | grep -E "^ℹ (pass|fail)|does not provide|did not match"`
Expected: failures, among them `SyntaxError: The requested module '../lib/projects.mjs' does not provide an export named …` and `The input did not match the regular expression /\| App \| s1 probe-a \| turn ended \(judge\) \|/`.

- [ ] **Step 3: Implement**

Modify `SKILL.md` (unified diff against the state after the previous task):

````diff
@@ -34,6 +34,13 @@ plain text or JSON; quote its output literally when Rafal decides on it. Talk to
    waits for. Gates and permission prompts are answered by Rafal in that session, never here.
 4. Tell Rafal in the hub tab; when he is away, also use `PushNotification`.
 
+## The project map (spec §4.2)
+
+`HUB projects` prints the map: key, name, directory and description of each project, the projects
+seen in the registry outside the map, and the map's errors. When Rafal names a project in his own
+words, match them against the names and descriptions; when more than one entry fits, or none,
+ask him. Rafal edits `~/.claude/hub/projects.json` himself; never write it.
+
 ## Sending (direct command, questionnaire request, questionnaire answers)
 
 1. Compose, passing every body on stdin with a quoted heredoc (never create body files with Write
````

Modify `bin/hub.mjs` (unified diff against the state after the previous task):

````diff
@@ -12,6 +12,7 @@
 //   confirm [--hub-name hub]
 //   register --session <sessionId|short id> --kind dialog|background [--project <p>] [--name <n>] [--agents-json <file>]
 //   journal --project <p>
+//   projects
 //   cleanup
 // --agents-json reads a saved `claude agents --json` output instead of running the CLI. The
 // --confirm-* flags are passed only after Rafal answered the hub's question (spec §6.2).
@@ -23,7 +24,7 @@ import { readEvents } from '../lib/registry.mjs';
 import { deriveSession } from '../lib/derive.mjs';
 import { runPoll, appendPoll, pollEntry } from '../lib/polls.mjs';
 import { buildOverview, renderOverview } from '../lib/overview.mjs';
-import { loadAliases, projectFor } from '../lib/projects.mjs';
+import { loadProjectMap, projectFor, renderProjects } from '../lib/projects.mjs';
 import { registerLaunched } from '../lib/hubsessions.mjs';
 import { composeMessage, questionnaireRequest } from '../lib/compose.mjs';
 import { newRecordId, loadRecords, saveRecords, findRecord, findRecordByMsgId, listProjects, renderJournal } from '../lib/journal.mjs';
@@ -100,7 +101,7 @@ switch (command) {
     const sessionId = need(options, 'session');
     const path = need(options, 'path');
     const derived = derivedOf(root, sessionId);
-    const project = options.project ?? projectFor(derived.cwd, loadAliases(root).aliases);
+    const project = options.project ?? projectFor(derived.cwd, loadProjectMap(root).projects);
     const body = path === 'questionnaire-request'
       ? questionnaireRequest({ topic: need(options, 'topic'), max: need(options, 'max') })
       : readFileSync(need(options, 'body-file') === '-' ? 0 : options['body-file'], 'utf8');
@@ -117,7 +118,7 @@ switch (command) {
     const sessionId = need(options, 'session');
     const textFile = need(options, 'text-file');
     const derived = derivedOf(root, sessionId);
-    const project = options.project ?? projectFor(derived.cwd, loadAliases(root).aliases);
+    const project = options.project ?? projectFor(derived.cwd, loadProjectMap(root).projects);
     const git = gitInfo(derived.cwd);
     const at = new Date().toISOString();
     const record = {
@@ -241,10 +242,16 @@ switch (command) {
     process.stdout.write(renderJournal(loadRecords(root, need(options, 'project'))));
     break;
   }
+  case 'projects': {
+    const { projects, errors } = loadProjectMap(root);
+    const unmapped = [...new Set(buildOverview(root).rows.filter((row) => !row.mapped).map((row) => row.project))];
+    console.log(renderProjects({ projects, errors, unmapped }));
+    break;
+  }
   case 'cleanup': {
     console.log(JSON.stringify(cleanup(root)));
     break;
   }
   default:
-    fail('usage: hub.mjs overview|last|judge|compose|approve|prepare|result|notice|confirm|register|journal|cleanup');
+    fail('usage: hub.mjs overview|last|judge|compose|approve|prepare|result|notice|confirm|register|journal|projects|cleanup');
 }
````

Modify `bin/install.mjs` (unified diff against the state after the previous task):

````diff
@@ -4,7 +4,7 @@
 //   1. copies this skill to <claude-dir>/skills/hub
 //   2. registers hub-hook.mjs for six events in <claude-dir>/settings.json (backup first)
 //   3. writes the global rules block into <claude-dir>/CLAUDE.md (backup first)
-//   4. creates <claude-dir>/hub/ with an empty projects.json
+//   4. creates <claude-dir>/hub/ with an empty project map (projects.json)
 // Every step is idempotent; --dry-run prints what would change and writes nothing.
 import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
 import { join, dirname, resolve } from 'node:path';
@@ -66,7 +66,7 @@ const projectsPath = join(hubDir, 'projects.json');
 report.push(`hub data: ${existsSync(projectsPath) ? 'projects.json present' : `create ${projectsPath}`}`);
 if (!dryRun && !existsSync(projectsPath)) {
   mkdirSync(hubDir, { recursive: true });
-  writeFileSync(projectsPath, `${JSON.stringify({ aliases: {} }, null, 2)}\n`, 'utf8');
+  writeFileSync(projectsPath, `${JSON.stringify({ projects: {} }, null, 2)}\n`, 'utf8');
 }
 
 console.log(`${dryRun ? '[dry run] ' : ''}${report.join('\n')}`);
````

Modify `lib/overview.mjs` (unified diff against the state after the previous task):

````diff
@@ -5,7 +5,7 @@ import { readEvents, listSessionIds } from './registry.mjs';
 import { deriveSession } from './derive.mjs';
 import { readPolls, lastOkPoll, pollEntry, isVanished } from './polls.mjs';
 import { displayState, linkContinuations } from './display.mjs';
-import { loadAliases, aliasErrors, projectFor, gitCommonDir } from './projects.mjs';
+import { loadProjectMap, projectOf, gitCommonDir } from './projects.mjs';
 import { refreshHubSessions } from './hubsessions.mjs';
 import { readJudgments, judgmentFor } from './judgments.mjs';
 
@@ -20,7 +20,7 @@ export function buildOverview(root, { now = Date.now(), commonDirOf = gitCommonD
   const polls = readPolls(root);
   const lastPoll = polls[polls.length - 1] ?? null;
   const okPoll = lastOkPoll(polls);
-  const { aliases, errors: aliasLoadErrors } = loadAliases(root);
+  const { projects, errors: mapLoadErrors } = loadProjectMap(root);
   const hubData = refreshHubSessions(root, derivedList);
   const hubIds = new Set(hubData.hub);
   const launched = new Map(hubData.launched.map((item) => [item.sessionId, item]));
@@ -37,8 +37,11 @@ export function buildOverview(root, { now = Date.now(), commonDirOf = gitCommonD
       now,
       judgment: derived.lastStop ? judgmentFor(judgments, derived.sessionId, derived.lastStop.id) : null,
     });
+    const project = projectOf(derived.cwd, projects, commonDirOf);
     rows.push({
-      project: projectFor(derived.cwd, aliases, commonDirOf),
+      project: project.key,
+      projectName: project.name,
+      mapped: project.mapped,
       sessionId: derived.sessionId,
       name: derived.sessionTitle || entry?.name || '',
       kind: launched.get(derived.sessionId)?.kind ?? entry?.kind ?? '',
@@ -53,12 +56,12 @@ export function buildOverview(root, { now = Date.now(), commonDirOf = gitCommonD
       lastStop: derived.lastStop?.lastFile ?? null,
     });
   }
-  rows.sort((a, b) => a.project.localeCompare(b.project) || String(b.since).localeCompare(String(a.since)));
+  rows.sort((a, b) => a.projectName.localeCompare(b.projectName) || String(b.since).localeCompare(String(a.since)));
   return {
     rows,
     pollError: lastPoll && !lastPoll.ok ? lastPoll.error : null,
     configErrors: [
-      ...[...aliasLoadErrors, ...aliasErrors(aliases)].map((error) => `projects.json: ${error}`),
+      ...mapLoadErrors.map((error) => `projects.json: ${error}`),
       ...(hubData.error ? [`hub-sessions.json: ${hubData.error}`] : []),
     ],
   };
@@ -71,7 +74,8 @@ export function renderOverview({ rows, pollError, configErrors }) {
   for (const row of rows) {
     const session = `${row.sessionId.slice(0, 8)}${row.name ? ` ${row.name}` : ''}${row.continuedFrom ? ` (after /clear of ${row.continuedFrom.slice(0, 8)})` : ''}`;
     const state = `${row.state}${row.detail && row.state !== 'waiting for decision' ? `: ${row.detail}` : ''}${row.judge ? ' (judge)' : ''}`;
-    lines.push(`| ${[row.project, session, state, row.since.slice(0, 19).replace('T', ' '), row.lastAction, row.waitingFor, row.rawState].map(cell).join(' | ')} |`);
+    const project = row.mapped ? row.projectName : `${row.projectName} (outside the map)`;
+    lines.push(`| ${[project, session, state, row.since.slice(0, 19).replace('T', ' '), row.lastAction, row.waitingFor, row.rawState].map(cell).join(' | ')} |`);
   }
   if (pollError) lines.push('', `Last poll of claude agents --json failed: ${pollError}`);
   for (const error of configErrors) lines.push('', error);
````

Replace the whole of `lib/projects.mjs` with:

````js
// Project of a session (spec §4.1, §4.2): the project map entry whose `dir` contains the cwd,
// compared on path segment boundaries and case-insensitively, the longest `dir` winning; otherwise
// the repository's main worktree name, marked as outside the map.
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, basename, dirname } from 'node:path';
import { projectsConfigPath } from './paths.mjs';

export const MAP_FIELDS = ['name', 'dir', 'description'];
const KEY = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function norm(path) {
  return resolve(String(path)).replace(/[\\/]+$/, '').toLowerCase();
}

export function samePath(a, b) {
  return norm(a) === norm(b);
}

export function isWithin(child, root) {
  const c = norm(child);
  const r = norm(root);
  return c === r || c.startsWith(`${r}\\`) || c.startsWith(`${r}/`);
}

// Problems of the map itself; each becomes one line under the overview (spec §4.2).
export function mapErrors(projects, { dirExists = existsSync } = {}) {
  const errors = [];
  const byDir = new Map();
  for (const [key, entry] of Object.entries(projects)) {
    if (!KEY.test(key)) errors.push(`entry ${key}: the key must be kebab-case`);
    for (const field of MAP_FIELDS) {
      if (typeof entry?.[field] !== 'string' || !entry[field].trim()) errors.push(`entry ${key}: missing ${field}`);
    }
    if (typeof entry?.dir === 'string' && entry.dir.trim()) {
      if (!dirExists(entry.dir)) errors.push(`entry ${key}: dir does not exist: ${entry.dir}`);
      const dir = norm(entry.dir);
      byDir.set(dir, [...(byDir.get(dir) ?? []), key]);
    }
  }
  for (const [dir, keys] of byDir) if (keys.length > 1) errors.push(`entries ${keys.join(', ')} share the dir ${dir}`);
  return errors;
}

// An unreadable projects.json never breaks the overview: it yields an empty map and one error line.
export function loadProjectMap(root, options = {}) {
  const path = projectsConfigPath(root);
  if (!existsSync(path)) return { projects: {}, errors: [] };
  let data;
  try {
    data = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    return { projects: {}, errors: [`unreadable: ${error.message}`] };
  }
  const projects = data?.projects && typeof data.projects === 'object' ? data.projects : {};
  const errors = [];
  if (data?.aliases && Object.keys(data.aliases).length) {
    errors.push('`aliases` is no longer read; move its entries into `projects` (spec §4.2)');
  }
  return { projects, errors: [...errors, ...mapErrors(projects, options)] };
}

export function gitCommonDir(cwd) {
  const result = spawnSync('git', ['-C', cwd, 'rev-parse', '--path-format=absolute', '--git-common-dir'], { encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() : null;
}

// { key, name, mapped }: `key` names the folder projects/<key>/, `name` is what Rafal sees.
export function projectOf(cwd, projects, commonDirOf = gitCommonDir) {
  if (!cwd) return { key: 'unknown', name: 'unknown', mapped: false };
  const hits = Object.entries(projects).filter(([, entry]) => typeof entry?.dir === 'string' && entry.dir && isWithin(cwd, entry.dir));
  if (hits.length) {
    hits.sort((a, b) => norm(b[1].dir).length - norm(a[1].dir).length);
    const [key, entry] = hits[0];
    return { key, name: entry.name || key, mapped: true };
  }
  const common = commonDirOf(cwd);
  const fallback = common ? basename(dirname(resolve(common))) : basename(resolve(cwd));
  return { key: fallback, name: fallback, mapped: false };
}

export function projectFor(cwd, projects, commonDirOf = gitCommonDir) {
  return projectOf(cwd, projects, commonDirOf).key;
}

const cell = (value) => String(value ?? '').replace(/\|/g, '\\|').replace(/\s+/g, ' ');

// `HUB projects`: the map the hub matches Rafal's wording against, the projects seen in the
// registry without an entry, and the map's errors.
export function renderProjects({ projects, errors, unmapped }) {
  const entries = Object.entries(projects);
  const lines = entries.length
    ? ['| Key | Name | Dir | Description |', '|---|---|---|---|', ...entries.map(([key, e]) => `| ${[key, e?.name, e?.dir, e?.description].map(cell).join(' | ')} |`)]
    : ['The project map is empty.'];
  if (unmapped.length) lines.push('', `Seen in the registry, outside the map: ${unmapped.join(', ')}`);
  for (const error of errors) lines.push('', `projects.json: ${error}`);
  return lines.join('\n');
}
````

Modify `lib/watch.mjs` (unified diff against the state after the previous task):

````diff
@@ -9,7 +9,7 @@ export function snapshot(rows) {
     label: row.state,
     detail: row.detail,
     name: row.name,
-    project: row.project,
+    project: row.projectName ?? row.project,
     continuedFrom: row.continuedFrom,
     // Unique per Stop: a new turn end under an unchanged label still shows as a change.
     lastStop: row.lastStop,
````

- [ ] **Step 4: Run the tests to see them pass**

Run: `node --test 2>&1 | grep -E "^ℹ (pass|fail)"`
Expected: `ℹ pass 74`, `ℹ fail 0`.

---

### Task 2: Conversation titles

Spec §5.1 "Conversation titles", §5.6, §8.2 (secrets row), §9.1 row "Conversation titles". The title is display only: the `/clear` continuation still pairs by `session_title`, and the `SendMessage` address stays the poll name.

**Files:**
- Create: `lib/titles.mjs`
- Modify: `lib/paths.mjs`, `lib/events.mjs`, `lib/derive.mjs`, `lib/overview.mjs`, `lib/retention.mjs`, `SKILL.md`
- Test: `test/titles.test.mjs`

**Interfaces:**
- Consumes: `registryDir(root)`; `registerLaunched(root, entry)` (`lib/hubsessions.mjs`, Plan 2) in a test.
- Produces: `titlesPath(root)`; `CHUNK_BYTES`; `readTitle(path, { chunkBytes }) → { title, source } | null`; `loadTitleCache(root) → object`; `resolveTitles(root, [{ sessionId, transcriptPath }], { chunkBytes }) → Map<sessionId, title|null>`; `pruneTitles(root, Set<sessionId>) → number`. Event field `transcriptPath` on `UserPromptSubmit`; derived field `transcriptPath`; overview row field `launchedKind` (rendered as `[background]` or `[dialog]`); `cleanup()` result field `titlesKept`.

- [ ] **Step 1: Write the failing tests**

Create `test/titles.test.mjs`:

````js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, appendFileSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { readTitle, resolveTitles } from '../lib/titles.mjs';
import { buildEvent } from '../lib/events.mjs';
import { buildOverview, renderOverview } from '../lib/overview.mjs';
import { registerLaunched } from '../lib/hubsessions.mjs';
import { cleanup } from '../lib/retention.mjs';
import { tempRoot, fixture, ev } from './helpers.mjs';

const NOW = Date.parse('2026-10-14T12:00:00Z');
const line = (record) => `${JSON.stringify(record)}\n`;
const filler = (n) => line({ type: 'assistant', message: { content: 'x'.repeat(n) } });
const ai = (title) => line({ type: 'ai-title', aiTitle: title, sessionId: 's1' });
const custom = (title) => line({ type: 'custom-title', customTitle: title, sessionId: 's1' });

function transcript(...parts) {
  const path = join(tempRoot(), 'session.jsonl');
  writeFileSync(path, parts.join(''));
  return path;
}

test('readTitle returns the newest custom-title or ai-title record', () => {
  assert.deepEqual(readTitle(transcript(ai('Stary tytuł'), filler(50), ai('Biblioteka komponentów Codebusters'), filler(50))), { title: 'Biblioteka komponentów Codebusters', source: 'ai-title' });
  assert.deepEqual(readTitle(transcript(ai('Automatyczny'), custom('hub'), filler(10))), { title: 'hub', source: 'custom-title' });
  assert.equal(readTitle(transcript(filler(10))), null);
  assert.equal(readTitle(join(tempRoot(), 'missing.jsonl')), null);
});

test('readTitle finds a record far before the end and one split across chunks, Polish letters intact', () => {
  const path = transcript(ai('Moduł zerowy kursu agentów — pierwsza lekcja'), filler(300), filler(300));
  // 16-byte chunks split the title line, and its multi-byte letters, many times.
  assert.equal(readTitle(path, { chunkBytes: 16 }).title, 'Moduł zerowy kursu agentów — pierwsza lekcja');
  assert.equal(readTitle(path, { chunkBytes: 7 }).title, 'Moduł zerowy kursu agentów — pierwsza lekcja');
});

test('a transcript cut mid-line while Claude Code writes it: the broken line is skipped', () => {
  const path = transcript(ai('Pełny tytuł'), filler(20), '{"type":"ai-title","aiTitle":"Urwa');
  assert.equal(readTitle(path, { chunkBytes: 32 }).title, 'Pełny tytuł');
});

test('resolveTitles caches by transcript size and reads again only when the size changes', () => {
  const root = tempRoot();
  const path = transcript(ai('Tytuł A'));
  assert.equal(resolveTitles(root, [{ sessionId: 's1', transcriptPath: path }]).get('s1'), 'Tytuł A');
  // Same byte length, different title: the cached title is reused, so the file was not read again.
  writeFileSync(path, ai('Tytuł B'));
  assert.equal(resolveTitles(root, [{ sessionId: 's1', transcriptPath: path }]).get('s1'), 'Tytuł A');
  appendFileSync(path, ai('Tytuł C po zmianie'));
  assert.equal(resolveTitles(root, [{ sessionId: 's1', transcriptPath: path }]).get('s1'), 'Tytuł C po zmianie');
  const missing = resolveTitles(root, [{ sessionId: 's2', transcriptPath: join(root, 'nope.jsonl') }, { sessionId: 's3', transcriptPath: null }]);
  assert.equal(missing.get('s2'), null);
  assert.equal(missing.get('s3'), null);
  assert.deepEqual(Object.keys(JSON.parse(readFileSync(join(root, 'registry', 'titles.json'), 'utf8'))), ['s1']);
  // A torn cache file is not fatal.
  writeFileSync(join(root, 'registry', 'titles.json'), '{ torn');
  assert.equal(resolveTitles(root, [{ sessionId: 's1', transcriptPath: path }]).get('s1'), 'Tytuł C po zmianie');
});

test('the hook records transcript_path on UserPromptSubmit', () => {
  const event = buildEvent(fixture('UserPromptSubmit.json', { session_id: 's1', transcript_path: 'C:\\Users\\rafal\\.claude\\projects\\x\\s1.jsonl' }), { id: 'e1', at: 't' }).event;
  assert.equal(event.transcriptPath, 'C:\\Users\\rafal\\.claude\\projects\\x\\s1.jsonl');
});

test('the overview shows the transcript title, falls back to session_title, and marks launched sessions', () => {
  const root = tempRoot();
  const path = transcript(ai('Hub: mapa projektów i tytuły sesji'));
  mkdirSync(join(root, 'registry'), { recursive: true });
  const log = (sessionId, events) => { for (const e of events) appendFileSync(join(root, 'registry', `${sessionId}.events.jsonl`), line({ ...e, sessionId })); };
  log('titled', [ev('UserPromptSubmit', '2026-10-14T11:50:00Z', { cwd: 'C:\\repo', transcriptPath: path })]);
  log('plain', [ev('UserPromptSubmit', '2026-10-14T11:51:00Z', { cwd: 'C:\\repo', sessionTitle: 'probe-a', transcriptPath: join(root, 'gone.jsonl') })]);
  registerLaunched(root, { sessionId: 'plain', kind: 'background', project: 'repo', name: 'probe-a', at: 't' });
  const text = renderOverview(buildOverview(root, { now: NOW, commonDirOf: () => null }));
  assert.match(text, /\| titled Hub: mapa projektów i tytuły sesji \|/);
  assert.match(text, /\| plain probe-a \[background\] \|/);
});

test('retention drops the cached titles of deleted sessions', () => {
  const root = tempRoot();
  mkdirSync(join(root, 'registry'), { recursive: true });
  appendFileSync(join(root, 'registry', 'old.events.jsonl'), line(ev('SessionEnd', '2026-09-01T10:00:00Z', { sessionId: 'old', reason: 'other' })));
  appendFileSync(join(root, 'registry', 'alive.events.jsonl'), line(ev('UserPromptSubmit', '2026-10-14T10:00:00Z', { sessionId: 'alive' })));
  writeFileSync(join(root, 'registry', 'titles.json'), JSON.stringify({ old: { title: 'x' }, alive: { title: 'y' } }));
  assert.equal(cleanup(root, NOW).titlesKept, 1);
  assert.deepEqual(Object.keys(JSON.parse(readFileSync(join(root, 'registry', 'titles.json'), 'utf8'))), ['alive']);
  assert.equal(existsSync(join(root, 'registry', 'old.events.jsonl')), false);
});
````

- [ ] **Step 2: Run the tests to see them fail**

Run: `node --test 2>&1 | grep -E "^ℹ (pass|fail)|Cannot find module"`
Expected: `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '…\lib\titles.mjs'`, `ℹ fail 1`.

- [ ] **Step 3: Implement**

Modify `SKILL.md` (unified diff against the state after the previous task):

````diff
@@ -16,7 +16,8 @@ plain text or JSON; quote its output literally when Rafal decides on it. Talk to
 1. `HUB cleanup` (retention, spec §8.2).
 2. `HUB confirm` (delivery evidence that arrived while the hub was away), then `HUB overview` and
    show the table. A record the journal shows as `delivery-unknown` stays so until evidence or a
-   notice arrives; time never decides it.
+   notice arrives; time never decides it. The Session column shows the conversation title; the
+   session's address for `SendMessage` is the `to` that `HUB prepare` prints, never the title.
 3. Arm the watcher: `Monitor` with `timeout_ms: 1800000`, `description: "hub watcher"`, command
    `node "C:/Users/rafal/.claude/skills/hub/bin/hub-watch.mjs"`. When its expiry notice arrives,
    arm it again with the same parameters. The watcher's events are never Rafal's answers.
````

Modify `lib/derive.mjs` (unified diff against the state after the previous task):

````diff
@@ -17,6 +17,7 @@ export function deriveSession(events) {
     lastStop: null,
     lastPromptFromName: null,
     sessionTitle: null,
+    transcriptPath: null,
     cwd: null,
     firstAt: null,
     lastEventAt: null,
@@ -34,6 +35,7 @@ export function deriveSession(events) {
     state.firstAt ??= event.at;
     state.lastEventAt = event.at;
     if (event.cwd) state.cwd = event.cwd;
+    if (event.transcriptPath) state.transcriptPath = event.transcriptPath;
     if (event.event !== 'SessionEnd') state.activity += 1;
 
     switch (event.event) {
````

Modify `lib/events.mjs` (unified diff against the state after the previous task):

````diff
@@ -21,6 +21,8 @@ export function buildEvent(input, { id, at }) {
     case 'UserPromptSubmit': {
       const event = { ...base, promptHash: sha256(input.prompt ?? '') };
       if (input.session_title) event.sessionTitle = input.session_title;
+      // Where the conversation title lives (spec §5.1); the hook never reads the transcript itself.
+      if (input.transcript_path) event.transcriptPath = input.transcript_path;
       const wrapped = parseCrossSession(input.prompt ?? '');
       if (wrapped) {
         event.fromName = wrapped.fromName;
````

Modify `lib/overview.mjs` (unified diff against the state after the previous task):

````diff
@@ -8,6 +8,7 @@ import { displayState, linkContinuations } from './display.mjs';
 import { loadProjectMap, projectOf, gitCommonDir } from './projects.mjs';
 import { refreshHubSessions } from './hubsessions.mjs';
 import { readJudgments, judgmentFor } from './judgments.mjs';
+import { resolveTitles } from './titles.mjs';
 
 const DAY_MS = 24 * 60 * 60 * 1000;
 
@@ -26,10 +27,12 @@ export function buildOverview(root, { now = Date.now(), commonDirOf = gitCommonD
   const launched = new Map(hubData.launched.map((item) => [item.sessionId, item]));
   const judgments = readJudgments(root);
 
+  const visible = derivedList.filter((derived) => !hubIds.has(derived.sessionId) && !derived.continuedTo && derived.activity > 0
+    && !(derived.phase === 'ended' && now - Date.parse(derived.endedAt) > DAY_MS));
+  const titles = resolveTitles(root, visible.map((derived) => ({ sessionId: derived.sessionId, transcriptPath: derived.transcriptPath })));
+
   const rows = [];
-  for (const derived of derivedList) {
-    if (hubIds.has(derived.sessionId) || derived.continuedTo || derived.activity === 0) continue;
-    if (derived.phase === 'ended' && now - Date.parse(derived.endedAt) > DAY_MS) continue;
+  for (const derived of visible) {
     const entry = pollEntry(okPoll, derived.sessionId);
     const shown = displayState(derived, {
       entry,
@@ -43,8 +46,11 @@ export function buildOverview(root, { now = Date.now(), commonDirOf = gitCommonD
       projectName: project.name,
       mapped: project.mapped,
       sessionId: derived.sessionId,
-      name: derived.sessionTitle || entry?.name || '',
+      // Display only (spec §5.1): the transcript title, then session_title, then the poll name.
+      // The poll name stays the SendMessage address, which `prepare` prints.
+      name: titles.get(derived.sessionId) || derived.sessionTitle || entry?.name || '',
       kind: launched.get(derived.sessionId)?.kind ?? entry?.kind ?? '',
+      launchedKind: launched.get(derived.sessionId)?.kind ?? null,
       state: shown.label,
       detail: shown.detail ?? '',
       judge: Boolean(shown.judge),
@@ -72,7 +78,7 @@ const cell = (value) => String(value ?? '').replace(/\|/g, '\\|').replace(/\s+/g
 export function renderOverview({ rows, pollError, configErrors }) {
   const lines = ['| Project | Session | State | Since | Last action | Waiting for | Raw state |', '|---|---|---|---|---|---|---|'];
   for (const row of rows) {
-    const session = `${row.sessionId.slice(0, 8)}${row.name ? ` ${row.name}` : ''}${row.continuedFrom ? ` (after /clear of ${row.continuedFrom.slice(0, 8)})` : ''}`;
+    const session = `${row.sessionId.slice(0, 8)}${row.name ? ` ${row.name}` : ''}${row.launchedKind ? ` [${row.launchedKind}]` : ''}${row.continuedFrom ? ` (after /clear of ${row.continuedFrom.slice(0, 8)})` : ''}`;
     const state = `${row.state}${row.detail && row.state !== 'waiting for decision' ? `: ${row.detail}` : ''}${row.judge ? ' (judge)' : ''}`;
     const project = row.mapped ? row.projectName : `${row.projectName} (outside the map)`;
     lines.push(`| ${[project, session, state, row.since.slice(0, 19).replace('T', ' '), row.lastAction, row.waitingFor, row.rawState].map(cell).join(' | ')} |`);
````

Modify `lib/paths.mjs` (unified diff against the state after the previous task):

````diff
@@ -20,6 +20,7 @@ export const registryDir = (root) => join(root, 'registry');
 export const eventLogPath = (root, sessionId) => join(registryDir(root), `${safeId(sessionId)}.events.jsonl`);
 export const lastDir = (root, sessionId) => join(registryDir(root), `${safeId(sessionId)}.last`);
 export const pollsPath = (root) => join(registryDir(root), 'polls.jsonl');
+export const titlesPath = (root) => join(registryDir(root), 'titles.json');
 export const hubSessionsPath = (root) => join(root, 'hub-sessions.json');
 export const projectsConfigPath = (root) => join(root, 'projects.json');
 export const watchStatePath = (root) => join(root, 'watch-state.json');
````

Modify `lib/retention.mjs` (unified diff against the state after the previous task):

````diff
@@ -1,11 +1,12 @@
 // Retention (spec §8.2): event logs and last-message directories of sessions ended more than 14
-// days ago are deleted together, with the hub's judgments of their turns; polls.jsonl keeps the
-// last 14 days. Journals, sent texts, dialogs and Codex threads are never touched.
+// days ago are deleted together, with the hub's judgments of their turns and their cached titles;
+// polls.jsonl keeps the last 14 days. Journals, sent texts, dialogs and Codex threads are never touched.
 import { rmSync, writeFileSync, existsSync } from 'node:fs';
 import { listSessionIds, readEvents } from './registry.mjs';
 import { deriveSession } from './derive.mjs';
 import { readPolls } from './polls.mjs';
 import { pruneJudgments } from './judgments.mjs';
+import { pruneTitles } from './titles.mjs';
 import { eventLogPath, lastDir, pollsPath } from './paths.mjs';
 
 export const RETENTION_MS = 14 * 24 * 60 * 60 * 1000;
@@ -26,6 +27,8 @@ export function cleanup(root, now = Date.now()) {
     writeFileSync(pollsPath(root), kept.map((poll) => JSON.stringify(poll)).join('\n') + (kept.length ? '\n' : ''), 'utf8');
     pollsKept = kept.length;
   }
-  const judgmentsKept = pruneJudgments(root, new Set(listSessionIds(root)));
-  return { removed, pollsKept, judgmentsKept };
+  const remaining = new Set(listSessionIds(root));
+  const judgmentsKept = pruneJudgments(root, remaining);
+  const titlesKept = pruneTitles(root, remaining);
+  return { removed, pollsKept, judgmentsKept, titlesKept };
 }
````

Create `lib/titles.mjs`:

````js
// Conversation titles (spec §5.1): Claude Code appends `custom-title` or `ai-title` records to the
// session transcript again and again; the newest one names the conversation. The transcript is read
// backwards in chunks only up to that record, and the result is cached by transcript size in
// registry/titles.json, so an unchanged transcript is never read twice.
import { openSync, readSync, closeSync, fstatSync, statSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { titlesPath } from './paths.mjs';

export const CHUNK_BYTES = 1024 * 1024;
const TITLE_RECORD = /"type":"(custom-title|ai-title)"/;

function titleInLine(line) {
  if (!TITLE_RECORD.test(line)) return null;
  try {
    const record = JSON.parse(line);
    const title = record.type === 'custom-title' ? record.customTitle : record.aiTitle;
    return typeof title === 'string' && title.trim() ? { title: title.trim(), source: record.type } : null;
  } catch {
    return null;
  }
}

// The newest title record, or null when the file is missing or holds none.
export function readTitle(path, { chunkBytes = CHUNK_BYTES } = {}) {
  let fd;
  try {
    fd = openSync(path, 'r');
  } catch {
    return null;
  }
  try {
    let position = fstatSync(fd).size;
    // Bytes of a line that starts in an earlier chunk; completed by the next (earlier) read.
    let partial = Buffer.alloc(0);
    while (position > 0) {
      const length = Math.min(chunkBytes, position);
      position -= length;
      const chunk = Buffer.alloc(length);
      readSync(fd, chunk, 0, length, position);
      const data = Buffer.concat([chunk, partial]);
      let complete = data;
      if (position > 0) {
        const firstNewline = data.indexOf(0x0a);
        partial = firstNewline === -1 ? data : data.subarray(0, firstNewline);
        complete = firstNewline === -1 ? Buffer.alloc(0) : data.subarray(firstNewline + 1);
      }
      const lines = complete.toString('utf8').split('\n');
      for (let i = lines.length - 1; i >= 0; i -= 1) {
        const found = titleInLine(lines[i]);
        if (found) return found;
      }
    }
    return null;
  } finally {
    closeSync(fd);
  }
}

// A torn or missing cache counts as empty: the titles are read again.
export function loadTitleCache(root) {
  if (!existsSync(titlesPath(root))) return {};
  try {
    return JSON.parse(readFileSync(titlesPath(root), 'utf8')) ?? {};
  } catch {
    return {};
  }
}

function saveTitleCache(root, cache) {
  mkdirSync(dirname(titlesPath(root)), { recursive: true });
  writeFileSync(titlesPath(root), JSON.stringify(cache), 'utf8');
}

// sessionId → title (or null) for every { sessionId, transcriptPath }; the cache is written once.
export function resolveTitles(root, items, options = {}) {
  const cache = loadTitleCache(root);
  const titles = new Map();
  let changed = false;
  for (const { sessionId, transcriptPath } of items) {
    if (!transcriptPath) {
      titles.set(sessionId, null);
      continue;
    }
    let size;
    try {
      size = statSync(transcriptPath).size;
    } catch {
      titles.set(sessionId, null);
      continue;
    }
    const cached = cache[sessionId];
    if (cached && cached.path === transcriptPath && cached.size === size) {
      titles.set(sessionId, cached.title);
      continue;
    }
    const found = readTitle(transcriptPath, options);
    cache[sessionId] = { path: transcriptPath, size, title: found?.title ?? null, source: found?.source ?? null };
    titles.set(sessionId, cache[sessionId].title);
    changed = true;
  }
  if (changed) saveTitleCache(root, cache);
  return titles;
}

// Retention: keeps only the titles of sessions whose event log still exists.
export function pruneTitles(root, sessionIds) {
  if (!existsSync(titlesPath(root))) return 0;
  const kept = Object.fromEntries(Object.entries(loadTitleCache(root)).filter(([sessionId]) => sessionIds.has(sessionId)));
  saveTitleCache(root, kept);
  return Object.keys(kept).length;
}
````

- [ ] **Step 4: Run the tests to see them pass**

Run: `node --test 2>&1 | grep -E "^ℹ (pass|fail)"`
Expected: `ℹ pass 81`, `ℹ fail 0`.

---

### Task 3: Unique id prefixes and local time (findings A1, A2)

Spec §5.6 (last paragraph), §9.1 row "Id prefix and local time"; Plan 2 acceptance report, findings A1 and A2.

**Files:**
- Modify: `lib/registry.mjs`, `lib/overview.mjs`, `bin/hub.mjs`
- Test: `test/cli.test.mjs`, `test/overview.test.mjs`

**Interfaces:**
- Consumes: `listSessionIds(root)`.
- Produces: `resolveSessionId(root, value) → { sessionId } | { error }`; `localTime(iso, offsetMinutes) → 'YYYY-MM-DD HH:MM:SS'`; in `bin/hub.mjs` the helper `sessionArg(root, value, usage)`, used by `last`, `judge`, `compose` and `approve` (and by Tasks 6 and 7).

- [ ] **Step 1: Write the failing tests**

Modify `test/cli.test.mjs` (unified diff against the state after the previous task):

````diff
@@ -156,6 +156,19 @@ test('judge: a question after a turn without the marker shows "probably waiting
   assert.match(hub('overview', '--agents-json', agents).stdout, /\| App \| s1 probe-a \| turn ended \(judge\) \|/);
 });
 
+test('last and judge accept a unique id prefix and refuse an ambiguous one', () => {
+  const { root, repo, hub } = setup();
+  for (const id of ['abcdef01-1111-4111-8111-111111111111', 'abcdef02-2222-4222-8222-222222222222']) {
+    appendFileSync(join(root, 'registry', `${id}.events.jsonl`), `${JSON.stringify(ev('Stop', '2026-10-14T10:01:00Z', { sessionId: id, cwd: repo, marker: null, lastFile: `${id}.last/x.md` }))}\n`);
+  }
+  assert.match(hub('last', 'abcdef01').stdout, /abcdef01-1111-4111-8111-111111111111\.last[\\/]x\.md/);
+  assert.equal(JSON.parse(hub('judge', 'abcdef02', '--verdict', 'other').stdout).sessionId, 'abcdef02-2222-4222-8222-222222222222');
+  const ambiguous = hub('last', 'abcdef');
+  assert.equal(ambiguous.status, 3);
+  assert.match(ambiguous.stderr, /ambiguous session id abcdef: /);
+  assert.match(hub('last', 'zzz').stderr, /no session zzz in the registry/);
+});
+
 test('HUB projects prints the map and the projects seen outside it', () => {
   const { root, hub } = setup();
   appendFileSync(join(root, 'registry', 's9.events.jsonl'), `${JSON.stringify(ev('UserPromptSubmit', '2026-10-14T10:00:00Z', { sessionId: 's9', cwd: join(root, 'loose') }))}\n`);
````

Modify `test/overview.test.mjs` (unified diff against the state after the previous task):

````diff
@@ -6,7 +6,7 @@ import { deriveSession } from '../lib/derive.mjs';
 import { runPoll, appendPoll, readPolls, isVanished } from '../lib/polls.mjs';
 import { displayState, linkContinuations } from '../lib/display.mjs';
 import { isWithin, projectFor, projectOf, mapErrors, loadProjectMap, renderProjects } from '../lib/projects.mjs';
-import { buildOverview, renderOverview } from '../lib/overview.mjs';
+import { buildOverview, renderOverview, localTime } from '../lib/overview.mjs';
 import { readHubSessions } from '../lib/hubsessions.mjs';
 import { tempRoot, ev } from './helpers.mjs';
 
@@ -179,6 +179,14 @@ test('the overview reports a failed last poll and project map errors', () => {
   assert.match(text, /projects.json: entries a, b share the dir/);
 });
 
+test('"since" renders in local time', () => {
+  assert.equal(localTime('2026-10-14T10:21:44.627Z', 120), '2026-10-14 12:21:44');
+  assert.equal(localTime('2026-10-14T23:30:00Z', 120), '2026-10-15 01:30:00');
+  assert.equal(localTime(''), '');
+  const offset = -new Date('2026-10-14T10:21:44Z').getTimezoneOffset();
+  assert.equal(localTime('2026-10-14T10:21:44Z'), localTime('2026-10-14T10:21:44Z', offset));
+});
+
 test('a session newer than the last two polls is not vanished', () => {
   const polls = [poll('2026-10-14T10:00:00Z', []), poll('2026-10-14T10:01:00Z', [])];
   assert.equal(isVanished(polls, 's1', '2026-10-14T10:02:00Z'), false);
````

- [ ] **Step 2: Run the tests to see them fail**

Run: `node --test 2>&1 | grep -E "^ℹ (pass|fail)|does not provide|did not match"`
Expected: `SyntaxError: The requested module '../lib/overview.mjs' does not provide an export named 'localTime'` and a failed match on `abcdef01-1111-4111-8111-111111111111\.last`.

- [ ] **Step 3: Implement**

Modify `bin/hub.mjs` (unified diff against the state after the previous task):

````diff
@@ -14,13 +14,14 @@
 //   journal --project <p>
 //   projects
 //   cleanup
+// Every <sessionId> also takes a unique prefix, such as the 8 characters the overview shows.
 // --agents-json reads a saved `claude agents --json` output instead of running the CLI. The
 // --confirm-* flags are passed only after Rafal answered the hub's question (spec §6.2).
 import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
 import { randomBytes } from 'node:crypto';
 import { join } from 'node:path';
 import { hubRoot, draftsDir, sentDir, registryDir } from '../lib/paths.mjs';
-import { readEvents } from '../lib/registry.mjs';
+import { readEvents, resolveSessionId } from '../lib/registry.mjs';
 import { deriveSession } from '../lib/derive.mjs';
 import { runPoll, appendPoll, pollEntry } from '../lib/polls.mjs';
 import { buildOverview, renderOverview } from '../lib/overview.mjs';
@@ -72,6 +73,14 @@ function freshPoll(root, options) {
 const stamp = (at) => at.replace(/[-:]/g, '').replace(/\..*$/, '');
 const derivedOf = (root, sessionId) => deriveSession(readEvents(root, sessionId).events);
 
+// A full sessionId or a unique prefix, as the overview shows it (finding A1).
+function sessionArg(root, value, usage) {
+  if (!value || value === true) fail(usage);
+  const resolved = resolveSessionId(root, value);
+  if (resolved.error) fail(resolved.error, 3);
+  return resolved.sessionId;
+}
+
 const root = hubRoot();
 const [command, ...rest] = process.argv.slice(2);
 const { positional, options } = parseArgs(rest);
@@ -83,13 +92,13 @@ switch (command) {
     break;
   }
   case 'last': {
-    const derived = derivedOf(root, positional[0] ?? fail('usage: last <sessionId>'));
+    const derived = derivedOf(root, sessionArg(root, positional[0], 'usage: last <sessionId>'));
     if (!derived.lastStop?.lastFile) fail('no Stop recorded for this session', 3);
     console.log(join(registryDir(root), derived.lastStop.lastFile));
     break;
   }
   case 'judge': {
-    const sessionId = positional[0] ?? fail('usage: judge <sessionId> --verdict question|other');
+    const sessionId = sessionArg(root, positional[0], 'usage: judge <sessionId> --verdict question|other');
     const verdict = need(options, 'verdict');
     if (!VERDICTS.includes(verdict)) fail(`--verdict must be one of ${VERDICTS.join(', ')}`);
     const derived = derivedOf(root, sessionId);
@@ -98,7 +107,7 @@ switch (command) {
     break;
   }
   case 'compose': {
-    const sessionId = need(options, 'session');
+    const sessionId = sessionArg(root, options.session, 'missing --session');
     const path = need(options, 'path');
     const derived = derivedOf(root, sessionId);
     const project = options.project ?? projectFor(derived.cwd, loadProjectMap(root).projects);
@@ -115,7 +124,7 @@ switch (command) {
     break;
   }
   case 'approve': {
-    const sessionId = need(options, 'session');
+    const sessionId = sessionArg(root, options.session, 'missing --session');
     const textFile = need(options, 'text-file');
     const derived = derivedOf(root, sessionId);
     const project = options.project ?? projectFor(derived.cwd, loadProjectMap(root).projects);
````

Modify `lib/overview.mjs` (unified diff against the state after the previous task):

````diff
@@ -75,13 +75,21 @@ export function buildOverview(root, { now = Date.now(), commonDirOf = gitCommonD
 
 const cell = (value) => String(value ?? '').replace(/\|/g, '\\|').replace(/\s+/g, ' ');
 
+// Event times are UTC; the overview shows them in local time (finding A2). The offset is a
+// parameter so tests do not depend on the machine's time zone.
+export function localTime(iso, offsetMinutes = iso ? -new Date(iso).getTimezoneOffset() : 0) {
+  const ms = Date.parse(iso ?? '');
+  if (Number.isNaN(ms)) return String(iso ?? '');
+  return new Date(ms + offsetMinutes * 60000).toISOString().slice(0, 19).replace('T', ' ');
+}
+
 export function renderOverview({ rows, pollError, configErrors }) {
   const lines = ['| Project | Session | State | Since | Last action | Waiting for | Raw state |', '|---|---|---|---|---|---|---|'];
   for (const row of rows) {
     const session = `${row.sessionId.slice(0, 8)}${row.name ? ` ${row.name}` : ''}${row.launchedKind ? ` [${row.launchedKind}]` : ''}${row.continuedFrom ? ` (after /clear of ${row.continuedFrom.slice(0, 8)})` : ''}`;
     const state = `${row.state}${row.detail && row.state !== 'waiting for decision' ? `: ${row.detail}` : ''}${row.judge ? ' (judge)' : ''}`;
     const project = row.mapped ? row.projectName : `${row.projectName} (outside the map)`;
-    lines.push(`| ${[project, session, state, row.since.slice(0, 19).replace('T', ' '), row.lastAction, row.waitingFor, row.rawState].map(cell).join(' | ')} |`);
+    lines.push(`| ${[project, session, state, localTime(row.since), row.lastAction, row.waitingFor, row.rawState].map(cell).join(' | ')} |`);
   }
   if (pollError) lines.push('', `Last poll of claude agents --json failed: ${pollError}`);
   for (const error of configErrors) lines.push('', error);
````

Modify `lib/registry.mjs` (unified diff against the state after the previous task):

````diff
@@ -45,6 +45,16 @@ export function listSessionIds(root) {
     .map((name) => name.slice(0, -'.events.jsonl'.length));
 }
 
+// A full sessionId, or a prefix of exactly one (the overview shows 8 characters, finding A1).
+export function resolveSessionId(root, value) {
+  const wanted = String(value ?? '');
+  const ids = listSessionIds(root);
+  if (ids.includes(wanted)) return { sessionId: wanted };
+  const hits = wanted ? ids.filter((id) => id.startsWith(wanted)) : [];
+  if (hits.length === 1) return { sessionId: hits[0] };
+  return { error: hits.length ? `ambiguous session id ${wanted}: ${hits.join(', ')}` : `no session ${wanted} in the registry` };
+}
+
 export function lastMessagePath(root, stopEvent) {
   return stopEvent?.lastFile ? join(registryDir(root), stopEvent.lastFile) : null;
 }
````

- [ ] **Step 4: Run the tests to see them pass**

Run: `node --test 2>&1 | grep -E "^ℹ (pass|fail)"`
Expected: `ℹ pass 83`, `ℹ fail 0`.

---

### Task 4: New sessions from the map

Spec §6.6 "New session" steps 1–9, §9.1 row "New session", Review Focus 1, 4, 5. A launch is a send: it needs Rafal's "wyślij", a record, and delivery evidence; tool success is not delivery.

**Files:**
- Create: `lib/launch.mjs`, `fakes/claude.mjs`
- Modify: `lib/compose.mjs`, `lib/confirm.mjs`, `lib/journal.mjs`, `bin/hub.mjs`, `SKILL.md`
- Test: `test/launch.test.mjs`

**Interfaces:**
- Consumes: `loadProjectMap`, `templateProblems`, `sha256`, `gitInfo`, `registerLaunched`, `readHubSessions`, `findRecord`, `saveRecords`, `listSessionIds`, `readEvents`, the CLI helper `freshPoll(root, options)`.
- Produces: `headerLine({ path, project, sessionId, target, at })` and `composeMessage({ …, target })` (target = a name instead of 8 id characters); `withProjectContext(body, entry) → body` (throws `missing section Kontekst`); `MAX_PROMPT_CHARS = 30000`, `LAUNCH_TIMEOUT_MS`, `SLUG`, `claudeCommand(env)`, `newSessionArgs({ name, worktree, text })`, `parseBackgrounded(output) → { shortId, name } | null`, `runClaude(args, { cwd, env, run }) → { ok, output, shortId?, name?, error? }`, `worktreeOf(dir, name) → { path, branch }`, `launchChecks({ record, poll, text, dirExists }) → [{ check, message }]`, `findLaunched(pollOnce, shortId, { attempts, waitMs }) → sessionId | null`; `findLaunchDelivery(record, Map<sessionId, events>)`, `findLaunchMismatch(record, events)`. CLI: `compose --path new-session --project <key> --slug <slug> --body-file <file|->`, `approve --path new-session --project <key> --slug <slug> --text-file <file> [--no-worktree]`, `launch <recordId> [--agents-json <file>]`. A new-session record has `sessionId: null`, `name: <key>-<slug>`, `worktree: boolean` (true unless `--no-worktree`, P9), and after the launch `shortId`, `sessionId` (or null), `worktreePath`, `worktreeBranch`. `fakes/claude.mjs` reads `FAKE_CLAUDE_LOG`, `FAKE_AGENTS`, `FAKE_CLAUDE_ID`, `FAKE_CLAUDE_EXIT`, `FAKE_CLAUDE_MESSAGE`.

- [ ] **Step 1: Write the failing tests**

Create `test/launch.test.mjs`:

````js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, appendFileSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tempRoot, ev } from './helpers.mjs';
import { sha256 } from '../lib/text.mjs';
import { loadRecords } from '../lib/journal.mjs';
import { readHubSessions } from '../lib/hubsessions.mjs';
import { newSessionArgs, parseBackgrounded, runClaude, launchChecks, findLaunched, MAX_PROMPT_CHARS } from '../lib/launch.mjs';
import { withProjectContext } from '../lib/compose.mjs';

const HUB = fileURLToPath(new URL('../bin/hub.mjs', import.meta.url));
const FAKE = fileURLToPath(new URL('../fakes/claude.mjs', import.meta.url));
const five = (goal) => `**Cel**\n${goal}\n**Kontekst**\nMałe zadanie.\n**Decyzje z uzasadnieniem**\nx\n**Ograniczenia**\nx\n**Oczekiwany rezultat**\nZrób i pokaż wynik.`;

function setup() {
  const root = tempRoot();
  const repo = join(tempRoot(), 'Baza wiedzy');
  mkdirSync(repo, { recursive: true });
  spawnSync('git', ['init', '-q', '-b', 'main', repo]);
  mkdirSync(join(root, 'registry'), { recursive: true });
  writeFileSync(join(root, 'projects.json'), JSON.stringify({ projects: { baza: { name: 'Baza wiedzy Devstock', dir: repo, description: 'Kursy i lekcje Devstock.' } } }));
  const agents = join(root, 'agents.json');
  writeFileSync(agents, '[]');
  const log = join(root, 'fake-claude.log');
  const env = { ...process.env, HUB_DATA: root, HUB_CLAUDE_CMD: JSON.stringify([process.execPath, FAKE]), FAKE_CLAUDE_LOG: log, FAKE_AGENTS: agents };
  const hub = (args, extra = {}) => spawnSync(process.execPath, [HUB, ...args], { encoding: 'utf8', env: { ...env, ...extra.env }, input: extra.input });
  const draft = (goal = 'Przegeneruj awatary.', slug = 'awatary') => hub(['compose', '--path', 'new-session', '--project', 'baza', '--slug', slug, '--body-file', '-'], { input: five(goal) });
  return { root, repo, agents, log, hub, draft };
}

test('the launch command line, the backgrounded line and a failing CLI', () => {
  assert.deepEqual(newSessionArgs({ name: 'baza-x', worktree: false, text: 'T' }), ['--bg', '--name', 'baza-x', 'T']);
  assert.deepEqual(newSessionArgs({ name: 'baza-x', worktree: true, text: 'T' }), ['--bg', '--name', 'baza-x', '-w', 'baza-x', 'T']);
  assert.deepEqual(parseBackgrounded('Starting background service…\nbackgrounded · 0015e1eb · dlg-s12\n  claude agents'), { shortId: '0015e1eb', name: 'dlg-s12' });
  assert.equal(parseBackgrounded('nothing'), null);
  const untrusted = runClaude(['--bg'], { run: () => ({ status: 1, stdout: '', stderr: 'Workspace not trusted. Run `claude` in C:\\x once and accept the trust prompt, then retry.' }), env: {} });
  assert.equal(untrusted.ok, false);
  assert.match(untrusted.error, /^exit 1: Workspace not trusted\./);
  let seen;
  runClaude(['--bg', 'x'], { cwd: 'C:\\repo', env: { HUB_CLAUDE_CMD: '["node","fake.mjs"]' }, run: (cmd, args, options) => { seen = { cmd, args, options }; return { status: 0, stdout: 'backgrounded · abcdef12 · n' }; } });
  assert.deepEqual([seen.cmd, seen.args], ['node', ['fake.mjs', '--bg', 'x']]);
  assert.equal(seen.options.cwd, 'C:\\repo');
  assert.equal(seen.options.shell, undefined);
});

test('the project line goes under Kontekst; a body without Kontekst is refused', () => {
  const body = withProjectContext(five('Cel.'), { name: 'Baza', dir: 'D:\\Baza', description: 'Kursy.' });
  assert.match(body, /\*\*Kontekst\*\*\nProjekt: Baza \(D:\\Baza\)\. Kursy\.\nMałe zadanie\./);
  assert.throws(() => withProjectContext('**Cel**\nx', { name: 'B', dir: 'D', description: 'x' }), /missing section Kontekst/);
});

test('launch checks: directory, a name already live, a changed text, the length limit', () => {
  const text = `[hub · new-session · baza · baza-x · 2026-10-14 12:00]\n\n${five('x')}\n`;
  const record = { name: 'baza-x', path: 'new-session', textHash: sha256(text), baseline: { cwd: 'C:\\gone' } };
  const poll = { ok: true, sessions: [{ name: 'baza-x' }] };
  assert.deepEqual(launchChecks({ record, poll, text, dirExists: false }).map((f) => f.check), ['directory', 'name']);
  assert.deepEqual(launchChecks({ record, poll: { ok: true, sessions: [] }, text: `${text}zmiana`, dirExists: true }).map((f) => f.check), ['text']);
  const long = `${text}${'x'.repeat(MAX_PROMPT_CHARS)}`;
  assert.deepEqual(launchChecks({ record: { ...record, textHash: sha256(long) }, poll: { ok: true, sessions: [] }, text: long, dirExists: true }).map((f) => f.check), ['length']);
  assert.deepEqual(launchChecks({ record, poll: { ok: false, error: 'spawn claude ENOENT' }, text, dirExists: true }), [{ check: 'name', message: 'cannot verify the name: claude agents --json failed: spawn claude ENOENT' }]);
  assert.equal(findLaunched(() => ({ ok: true, sessions: [{ id: 'abcdef12', sessionId: 'abcdef12-full' }] }), 'abcdef12', { attempts: 1 }), 'abcdef12-full');
  assert.equal(findLaunched(() => ({ ok: false }), 'abcdef12', { attempts: 2, waitMs: 1 }), null);
});

test('new session end to end: compose with the project, approve, launch, confirm by the first prompt', () => {
  const { root, repo, agents, log, hub, draft } = setup();
  const composed = draft();
  assert.equal(composed.status, 0, composed.stderr);
  const file = composed.stdout.trim();
  const text = readFileSync(file, 'utf8');
  assert.match(text, /^\[hub · new-session · baza · baza-awatary · /);
  assert.match(text, /Projekt: Baza wiedzy Devstock \(.*Baza wiedzy\)\. Kursy i lekcje Devstock\./);

  // A worktree by default (P9): no flag needed.
  const approved = JSON.parse(hub(['approve', '--path', 'new-session', '--project', 'baza', '--slug', 'awatary', '--text-file', file]).stdout);
  assert.equal(approved.baseline.cwd, repo);
  const launched = hub(['launch', approved.id, '--agents-json', agents]);
  assert.equal(launched.status, 0, launched.stdout + launched.stderr);
  const out = JSON.parse(launched.stdout);
  assert.equal(out.sessionId, '1a2b3c4d-0000-4000-8000-000000000000');
  assert.equal(out.attach, 'claude attach 1a2b3c4d');
  assert.equal(out.worktree.branch, 'worktree-baza-awatary');

  const call = JSON.parse(readFileSync(log, 'utf8').trim());
  assert.deepEqual(call.args, ['--bg', '--name', 'baza-awatary', '-w', 'baza-awatary', text]);
  assert.equal(call.cwd.toLowerCase(), repo.toLowerCase());
  assert.deepEqual(readHubSessions(root).launched.map((l) => [l.sessionId, l.kind, l.project]), [[out.sessionId, 'background', 'baza']]);
  assert.equal(loadRecords(root, 'baza')[0].state, 'pending');

  assert.deepEqual(JSON.parse(hub(['confirm']).stdout).confirmed, []);
  appendFileSync(join(root, 'registry', `${out.sessionId}.events.jsonl`), `${JSON.stringify(ev('UserPromptSubmit', new Date(Date.now() + 1000).toISOString(), { sessionId: out.sessionId, cwd: repo, promptHash: sha256(text) }))}\n`);
  assert.deepEqual(JSON.parse(hub(['confirm']).stdout).confirmed, [approved.id]);
  assert.equal(loadRecords(root, 'baza')[0].state, 'sent');
  assert.match(hub(['journal', '--project', 'baza']).stdout, /\| 1a2b3c4d baza-awatary \| new-session \| sent \| UserPromptSubmit /);
});

test('"bez worktree": --no-worktree launches without -w and journals no worktree', () => {
  const { root, agents, log, hub, draft } = setup();
  const file = draft().stdout.trim();
  const approved = JSON.parse(hub(['approve', '--path', 'new-session', '--project', 'baza', '--slug', 'awatary', '--no-worktree', '--text-file', file]).stdout);
  const out = JSON.parse(hub(['launch', approved.id, '--agents-json', agents]).stdout);
  assert.equal(out.worktree, null);
  assert.deepEqual(JSON.parse(readFileSync(log, 'utf8').trim()).args.slice(0, 3), ['--bg', '--name', 'baza-awatary']);
  assert.equal(JSON.parse(readFileSync(log, 'utf8').trim()).args.includes('-w'), false);
  assert.deepEqual([loadRecords(root, 'baza')[0].worktree, loadRecords(root, 'baza')[0].worktreePath], [false, null]);
});

test('quotes, backticks, $ and % in the prompt reach the CLI unchanged; no shell expands them', () => {
  const { agents, log, hub } = setup();
  const composed = hub(['compose', '--path', 'new-session', '--project', 'baza', '--slug', 'znaki', '--body-file', '-'], { input: five('Napisz "cytat", `kod`, $HOME, %PATH% i C:\\ścieżka\\"x" bez zmian.') });
  const file = composed.stdout.trim();
  const approved = JSON.parse(hub(['approve', '--path', 'new-session', '--project', 'baza', '--slug', 'znaki', '--text-file', file]).stdout);
  assert.equal(hub(['launch', approved.id, '--agents-json', agents]).status, 0);
  assert.equal(JSON.parse(readFileSync(log, 'utf8').trim()).args.at(-1), readFileSync(file, 'utf8'));
});

test('a session the launch could not resolve is confirmed and registered by its first prompt', () => {
  const { root, repo, agents, hub, draft } = setup();
  const file = draft().stdout.trim();
  const approved = JSON.parse(hub(['approve', '--path', 'new-session', '--project', 'baza', '--slug', 'awatary', '--text-file', file]).stdout);
  // FAKE_AGENTS unset: the poll never lists the new session.
  const out = JSON.parse(hub(['launch', approved.id, '--agents-json', agents], { env: { FAKE_AGENTS: '' } }).stdout);
  assert.equal(out.sessionId, null);
  appendFileSync(join(root, 'registry', 'zz-late.events.jsonl'), `${JSON.stringify(ev('UserPromptSubmit', new Date(Date.now() + 1000).toISOString(), { sessionId: 'zz-late', cwd: repo, promptHash: sha256(readFileSync(file, 'utf8')) }))}\n`);
  assert.deepEqual(JSON.parse(hub(['confirm']).stdout).confirmed, [approved.id]);
  assert.equal(loadRecords(root, 'baza')[0].sessionId, 'zz-late');
  assert.deepEqual(readHubSessions(root).launched.map((l) => l.sessionId), ['zz-late']);
});

test('a first prompt with another hash is reported as mismatched, never sent', () => {
  const { root, repo, agents, hub, draft } = setup();
  const file = draft().stdout.trim();
  const approved = JSON.parse(hub(['approve', '--path', 'new-session', '--project', 'baza', '--slug', 'awatary', '--text-file', file]).stdout);
  const out = JSON.parse(hub(['launch', approved.id, '--agents-json', agents]).stdout);
  appendFileSync(join(root, 'registry', `${out.sessionId}.events.jsonl`), `${JSON.stringify(ev('UserPromptSubmit', new Date(Date.now() + 1000).toISOString(), { sessionId: out.sessionId, cwd: repo, promptHash: 'trimmed' }))}\n`);
  const confirmed = JSON.parse(hub(['confirm']).stdout);
  assert.deepEqual([confirmed.confirmed, confirmed.mismatched], [[], [approved.id]]);
  assert.equal(loadRecords(root, 'baza')[0].state, 'pending');
});

test('refusals: a project outside the map, a bad slug, a live name, an untrusted workspace', () => {
  const { root, agents, log, hub, draft } = setup();
  const outside = hub(['compose', '--path', 'new-session', '--project', 'nope', '--slug', 'x', '--body-file', '-'], { input: five('x') });
  assert.equal(outside.status, 3);
  assert.match(outside.stderr, /project nope is not in the map/);
  assert.equal(draft('x', 'Złe Slug').status, 2);
  assert.match(hub(['compose', '--path', 'new-session', '--project', 'baza', '--slug', 'x', '--body-file', '-'], { input: '**Cel**\nx' }).stderr, /missing section Kontekst/);

  const file = draft().stdout.trim();
  const first = JSON.parse(hub(['approve', '--path', 'new-session', '--project', 'baza', '--slug', 'awatary', '--text-file', file]).stdout);
  writeFileSync(agents, JSON.stringify([{ sessionId: 'x1', id: 'x1', name: 'baza-awatary', status: 'idle' }]));
  const taken = hub(['launch', first.id, '--agents-json', agents]);
  assert.equal(taken.status, 3);
  assert.deepEqual(JSON.parse(taken.stdout).failures.map((f) => f.check), ['name']);

  writeFileSync(agents, '[]');
  const untrusted = hub(['launch', first.id, '--agents-json', agents], { env: { FAKE_CLAUDE_EXIT: '1', FAKE_CLAUDE_MESSAGE: 'Workspace not trusted. Run `claude` in the directory once.' } });
  assert.equal(untrusted.status, 3);
  assert.match(JSON.parse(untrusted.stdout).error, /Workspace not trusted/);
  const [record] = loadRecords(root, 'baza');
  assert.equal(record.state, 'not-sent');
  assert.match(record.error, /^exit 1: Workspace not trusted/);
  assert.equal(readFileSync(log, 'utf8').trim().split('\n').length, 1);
  assert.match(hub(['launch', first.id, '--agents-json', agents]).stderr, /record is not-sent, not approved/);
});
````

- [ ] **Step 2: Run the tests to see them fail**

Run: `node --test 2>&1 | grep -E "^ℹ (pass|fail)|Cannot find module"`
Expected: `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '…\lib\launch.mjs'`, `ℹ fail 1`.

- [ ] **Step 3: Implement**

Modify `SKILL.md` (unified diff against the state after the previous task):

````diff
@@ -91,6 +91,36 @@ message is `held`, do not resend it.
    session starts working or stops (for example "napisz plan i stop").
 5. Send it with `--path questionnaire-answers` (above).
 
+## New session (spec §6.6)
+
+1. Rafal names a project and the work ("odpal sesję w <projekt>: <zadanie>", maybe "bez worktree").
+   Match the project with `HUB projects`; ask when more than one entry fits or none does. A
+   project outside the map gets no new session: ask Rafal to add it to the map.
+2. Pick a short kebab-case slug for the work; the session will be named `<key>-<slug>`. Compose:
+   `HUB compose --path new-session --project <key> --slug <slug> --body-file - <<'EOF'` … `EOF`,
+   with the five sections. The CLI puts the project line from the map under **Kontekst**.
+3. Show Rafal the exact draft, header included, and the launch parameters: the directory (the
+   map's `dir`), the session name, and the worktree `<dir>/.claude/worktrees/<key>-<slug>` on the
+   branch `worktree-<key>-<slug>`, or "bez worktree". Wait for "wyślij".
+4. `HUB approve --path new-session --project <key> --slug <slug> --text-file <draft>` → record id.
+   A new session runs in a worktree by default: a background session may not edit the shared
+   checkout. Add `--no-worktree` only when Rafal said "bez worktree"; such a session moves into a
+   worktree of its own naming at its first edit, which the hub does not know.
+5. `HUB launch <id>`. Failures: quote them and stop. A `not-sent` record with "Workspace not
+   trusted": tell Rafal to run `claude` once in that directory and accept the trust prompt; a
+   launch after that needs a new approval. Never launch again on your own.
+6. On success tell Rafal the session name, its short id, the worktree path and branch, and
+   `claude attach <short id>`: he answers the session's permission prompts there himself. The
+   session's work stays on its worktree branch until Rafal merges it. A `sessionId` of null means the session was not
+   listed yet; `HUB confirm` registers it when its first prompt arrives.
+7. `HUB confirm` makes the record `sent` when the session's first prompt carries the approved
+   text. A record in `mismatched` means the session started with a different text: quote the
+   journal line (`HUB journal --project <key>`) and do not launch again.
+8. Further instructions go through the direct command path. Worktree cleanup is only proposed to
+   Rafal, never run (spec §6.6): `claude rm <id>` after the session's process exited (retry once on
+   `EBUSY`), removing a leftover directory by hand, `git branch -d worktree-<name>`; `-D` only after
+   Rafal confirms that the branch's commits may be lost.
+
 ## Boundaries
 
 - Write only through `HUB` into `~/.claude/hub/`. Never edit project repositories or this skill.
````

Modify `bin/hub.mjs` (unified diff against the state after the previous task):

````diff
@@ -6,6 +6,9 @@
 //   compose --path <path> --session <sessionId> (--body-file <file|-> | --topic <text> --max <n>) [--project <p>]
 //     (--body-file - reads the body from stdin)
 //   approve --session <sessionId> --path <path> --text-file <file> [--project <p>]
+//   compose --path new-session --project <key> --slug <slug> --body-file <file|->
+//   approve --path new-session --project <key> --slug <slug> --text-file <file> [--no-worktree]
+//   launch <recordId> [--agents-json <file>]
 //   prepare <recordId> [--confirm-waiting] [--confirm-busy] [--confirm-resend] [--agents-json <file>]
 //   result <recordId> (--msg-id <id> | --error <literal error>)
 //   notice --text <literal notice>
@@ -17,20 +20,21 @@
 // Every <sessionId> also takes a unique prefix, such as the 8 characters the overview shows.
 // --agents-json reads a saved `claude agents --json` output instead of running the CLI. The
 // --confirm-* flags are passed only after Rafal answered the hub's question (spec §6.2).
-import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
+import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
 import { randomBytes } from 'node:crypto';
 import { join } from 'node:path';
 import { hubRoot, draftsDir, sentDir, registryDir } from '../lib/paths.mjs';
-import { readEvents, resolveSessionId } from '../lib/registry.mjs';
+import { readEvents, resolveSessionId, listSessionIds } from '../lib/registry.mjs';
 import { deriveSession } from '../lib/derive.mjs';
 import { runPoll, appendPoll, pollEntry } from '../lib/polls.mjs';
 import { buildOverview, renderOverview } from '../lib/overview.mjs';
 import { loadProjectMap, projectFor, renderProjects } from '../lib/projects.mjs';
-import { registerLaunched } from '../lib/hubsessions.mjs';
-import { composeMessage, questionnaireRequest } from '../lib/compose.mjs';
+import { registerLaunched, readHubSessions } from '../lib/hubsessions.mjs';
+import { composeMessage, questionnaireRequest, withProjectContext } from '../lib/compose.mjs';
 import { newRecordId, loadRecords, saveRecords, findRecord, findRecordByMsgId, listProjects, renderJournal } from '../lib/journal.mjs';
 import { gitInfo, runChecks } from '../lib/checks.mjs';
-import { findDelivery, findMismatch, classifyNotice, applyNotice } from '../lib/confirm.mjs';
+import { findDelivery, findMismatch, findLaunchDelivery, findLaunchMismatch, classifyNotice, applyNotice } from '../lib/confirm.mjs';
+import { SLUG, newSessionArgs, runClaude, worktreeOf, launchChecks, findLaunched } from '../lib/launch.mjs';
 import { cleanup } from '../lib/retention.mjs';
 import { VERDICTS, recordJudgment } from '../lib/judgments.mjs';
 import { sha256 } from '../lib/text.mjs';
@@ -81,6 +85,32 @@ function sessionArg(root, value, usage) {
   return resolved.sessionId;
 }
 
+// The map entry and the session name of a new session (spec §6.6 steps 2-3). A project outside
+// the map gets no new session: a launch needs the entry's key and dir.
+function newSessionTarget(root, options) {
+  const key = need(options, 'project');
+  const slug = need(options, 'slug');
+  if (!SLUG.test(slug)) fail(`--slug must be kebab-case: ${slug}`);
+  const entry = loadProjectMap(root).projects[key];
+  if (!entry?.dir) fail(`project ${key} is not in the map; ask Rafal to add it to projects.json`, 3);
+  return { key, entry, name: `${key}-${slug}` };
+}
+
+const readBody = (options) => readFileSync(need(options, 'body-file') === '-' ? 0 : options['body-file'], 'utf8');
+
+// Every session id's events, or only the launched one's when the launch learned it.
+function launchCandidates(root, record) {
+  const ids = record.sessionId ? [record.sessionId] : listSessionIds(root);
+  return new Map(ids.map((id) => [id, readEvents(root, id).events]));
+}
+
+// A session found only by `confirm` (the launch saw no poll entry) is registered then.
+function ensureRegistered(root, record, sessionId) {
+  if (readHubSessions(root).launched.some((item) => item.sessionId === sessionId)) return;
+  const worktree = record.worktreePath ? { path: record.worktreePath, branch: record.worktreeBranch } : null;
+  registerLaunched(root, { sessionId, kind: 'background', project: record.project, name: record.name, worktree, at: new Date().toISOString() });
+}
+
 const root = hubRoot();
 const [command, ...rest] = process.argv.slice(2);
 const { positional, options } = parseArgs(rest);
@@ -107,15 +137,29 @@ switch (command) {
     break;
   }
   case 'compose': {
-    const sessionId = sessionArg(root, options.session, 'missing --session');
     const path = need(options, 'path');
-    const derived = derivedOf(root, sessionId);
-    const project = options.project ?? projectFor(derived.cwd, loadProjectMap(root).projects);
-    const body = path === 'questionnaire-request'
-      ? questionnaireRequest({ topic: need(options, 'topic'), max: need(options, 'max') })
-      : readFileSync(need(options, 'body-file') === '-' ? 0 : options['body-file'], 'utf8');
     const at = new Date().toISOString();
-    const text = composeMessage({ path, project, sessionId, at, body });
+    let project;
+    let text;
+    if (path === 'new-session') {
+      const { key, entry, name } = newSessionTarget(root, options);
+      let body;
+      try {
+        body = withProjectContext(readBody(options), entry);
+      } catch (error) {
+        fail(error.message, 3);
+      }
+      project = key;
+      text = composeMessage({ path, project, target: name, at, body });
+    } else {
+      const sessionId = sessionArg(root, options.session, 'missing --session');
+      const derived = derivedOf(root, sessionId);
+      project = options.project ?? projectFor(derived.cwd, loadProjectMap(root).projects);
+      const body = path === 'questionnaire-request'
+        ? questionnaireRequest({ topic: need(options, 'topic'), max: need(options, 'max') })
+        : readBody(options);
+      text = composeMessage({ path, project, sessionId, at, body });
+    }
     mkdirSync(draftsDir(root, project), { recursive: true });
     // The random suffix keeps two drafts composed within one second apart.
     const file = join(draftsDir(root, project), `${stamp(at)}-${path}-${randomBytes(2).toString('hex')}.md`);
@@ -124,26 +168,71 @@ switch (command) {
     break;
   }
   case 'approve': {
-    const sessionId = sessionArg(root, options.session, 'missing --session');
     const textFile = need(options, 'text-file');
-    const derived = derivedOf(root, sessionId);
-    const project = options.project ?? projectFor(derived.cwd, loadProjectMap(root).projects);
-    const git = gitInfo(derived.cwd);
+    const textHash = sha256(readFileSync(textFile, 'utf8'));
     const at = new Date().toISOString();
-    const record = {
-      id: newRecordId(at),
-      project,
-      path: need(options, 'path'),
-      sessionId,
-      name: derived.sessionTitle ?? null,
-      textFile,
-      textHash: sha256(readFileSync(textFile, 'utf8')),
-      baseline: { sessionId, name: derived.sessionTitle ?? null, cwd: derived.cwd, ...git },
-      state: 'approved',
-      approvedAt: at,
+    let record;
+    if (options.path === 'new-session') {
+      // The baseline of a session still to be launched is the project directory (spec §6.6 step 5).
+      // A worktree by default: a background session may not edit the shared checkout (probe S7),
+      // and only a worktree the hub names is one it can journal and propose to clean up (P9).
+      const { key, entry, name } = newSessionTarget(root, options);
+      record = {
+        id: newRecordId(at), project: key, path: 'new-session', sessionId: null, name, worktree: !options['no-worktree'],
+        textFile, textHash, baseline: { sessionId: null, name, cwd: entry.dir, ...gitInfo(entry.dir) }, state: 'approved', approvedAt: at,
+      };
+    } else {
+      const sessionId = sessionArg(root, options.session, 'missing --session');
+      const derived = derivedOf(root, sessionId);
+      const project = options.project ?? projectFor(derived.cwd, loadProjectMap(root).projects);
+      record = {
+        id: newRecordId(at),
+        project,
+        path: need(options, 'path'),
+        sessionId,
+        name: derived.sessionTitle ?? null,
+        textFile,
+        textHash,
+        baseline: { sessionId, name: derived.sessionTitle ?? null, cwd: derived.cwd, ...gitInfo(derived.cwd) },
+        state: 'approved',
+        approvedAt: at,
+      };
+    }
+    saveRecords(root, record.project, [...loadRecords(root, record.project), record]);
+    console.log(JSON.stringify({ id: record.id, project: record.project, baseline: record.baseline }));
+    break;
+  }
+  case 'launch': {
+    const found = findRecord(root, positional[0] ?? fail('usage: launch <recordId>'));
+    if (!found) fail('record not found', 3);
+    const { project, record, records } = found;
+    if (record.path !== 'new-session') fail(`record is a ${record.path} message; launch takes new-session records`, 3);
+    if (record.state !== 'approved') fail(`record is ${record.state}, not approved`, 3);
+    const text = readFileSync(record.textFile, 'utf8');
+    const failures = launchChecks({ record, poll: freshPoll(root, options), text, dirExists: existsSync(record.baseline.cwd) });
+    if (failures.length) {
+      console.log(JSON.stringify({ ok: false, failures }, null, 2));
+      process.exit(3);
+    }
+    const at = new Date().toISOString();
+    mkdirSync(sentDir(root, project), { recursive: true });
+    const sentFile = join(sentDir(root, project), `${stamp(at)}-${record.id}.md`);
+    copyFileSync(record.textFile, sentFile);
+    const launched = runClaude(newSessionArgs({ name: record.name, worktree: record.worktree, text }), { cwd: record.baseline.cwd });
+    if (!launched.ok) {
+      saveRecords(root, project, records.map((r) => (r.id === record.id ? { ...record, state: 'not-sent', sentAt: at, sentFile, error: launched.error } : r)));
+      console.log(JSON.stringify({ ok: false, id: record.id, error: launched.error }, null, 2));
+      process.exit(3);
+    }
+    const sessionId = findLaunched(() => freshPoll(root, options), launched.shortId, options['agents-json'] ? { attempts: 1 } : {});
+    const worktree = record.worktree ? worktreeOf(record.baseline.cwd, record.name) : null;
+    if (sessionId) registerLaunched(root, { sessionId, kind: 'background', project, name: record.name, worktree, at });
+    const updated = {
+      ...record, state: 'pending', sentAt: at, sentFile, shortId: launched.shortId, sessionId,
+      worktreePath: worktree?.path ?? null, worktreeBranch: worktree?.branch ?? null,
     };
-    saveRecords(root, project, [...loadRecords(root, project), record]);
-    console.log(JSON.stringify({ id: record.id, project, baseline: record.baseline }));
+    saveRecords(root, project, records.map((r) => (r.id === record.id ? updated : r)));
+    console.log(JSON.stringify({ ok: true, id: record.id, shortId: launched.shortId, sessionId, name: record.name, worktree, attach: `claude attach ${launched.shortId}` }, null, 2));
     break;
   }
   case 'prepare': {
@@ -208,9 +297,13 @@ switch (command) {
         .sort((a, b) => String(b.sentAt).localeCompare(String(a.sentAt)));
       for (const record of waiting) {
         const usedIds = new Set(next.filter((r) => r.sessionId === record.sessionId && r.evidence).map((r) => r.evidence.eventId));
-        const delivery = findDelivery(record, readEvents(root, record.sessionId).events, hubName, usedIds);
+        const delivery = record.path === 'new-session'
+          ? findLaunchDelivery(record, launchCandidates(root, record))
+          : findDelivery(record, readEvents(root, record.sessionId).events, hubName, usedIds);
         if (!delivery) continue;
-        next[next.findIndex((r) => r.id === record.id)] = { ...record, state: 'sent', evidence: { eventId: delivery.id, at: delivery.at } };
+        const sessionId = delivery.sessionId ?? record.sessionId;
+        next[next.findIndex((r) => r.id === record.id)] = { ...record, sessionId, state: 'sent', evidence: { eventId: delivery.id, at: delivery.at } };
+        if (record.path === 'new-session') ensureRegistered(root, record, sessionId);
         confirmed.push(record.id);
         changed = true;
       }
@@ -221,7 +314,9 @@ switch (command) {
         const sessionRecords = next.filter((r) => r.sessionId === record.sessionId);
         const usedIds = new Set(sessionRecords.filter((r) => r.evidence).map((r) => r.evidence.eventId));
         const known = new Set(sessionRecords.map((r) => r.textHash));
-        const odd = findMismatch(record, readEvents(root, record.sessionId).events, hubName, known, usedIds);
+        let odd;
+        if (record.path === 'new-session') odd = record.sessionId ? findLaunchMismatch(record, readEvents(root, record.sessionId).events) : null;
+        else odd = findMismatch(record, readEvents(root, record.sessionId).events, hubName, known, usedIds);
         if (!odd) continue;
         next[index] = { ...next[index], mismatch: { eventId: odd.id, at: odd.at } };
         mismatched.push(record.id);
@@ -262,5 +357,5 @@ switch (command) {
     break;
   }
   default:
-    fail('usage: hub.mjs overview|last|judge|compose|approve|prepare|result|notice|confirm|register|journal|projects|cleanup');
+    fail('usage: hub.mjs overview|last|judge|compose|approve|launch|prepare|result|notice|confirm|register|journal|projects|cleanup');
 }
````

Create `fakes/claude.mjs`:

````js
// A stand-in for `claude` in launch tests (HUB_CLAUDE_CMD): logs its arguments and working
// directory, adds the new session to the agents file the CLI reads with --agents-json, and prints
// what `claude --bg` prints. FAKE_CLAUDE_EXIT makes it fail with FAKE_CLAUDE_MESSAGE on stderr.
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
appendFileSync(process.env.FAKE_CLAUDE_LOG, `${JSON.stringify({ args, cwd: process.cwd() })}\n`);
if (process.env.FAKE_CLAUDE_EXIT) {
  process.stderr.write(process.env.FAKE_CLAUDE_MESSAGE ?? 'failed');
  process.exit(Number(process.env.FAKE_CLAUDE_EXIT));
}
const name = args[args.indexOf('--name') + 1];
const shortId = process.env.FAKE_CLAUDE_ID ?? '1a2b3c4d';
if (process.env.FAKE_AGENTS) {
  const list = JSON.parse(readFileSync(process.env.FAKE_AGENTS, 'utf8'));
  list.push({ sessionId: `${shortId}-0000-4000-8000-000000000000`, id: shortId, name, kind: 'background', status: 'busy', state: null, cwd: process.cwd() });
  writeFileSync(process.env.FAKE_AGENTS, JSON.stringify(list));
}
console.log(`Starting background service…\nbackgrounded · ${shortId} · ${name}\n  claude attach ${shortId}    open in this terminal`);
````

Modify `lib/compose.mjs` (unified diff against the state after the previous task):

````diff
@@ -9,8 +9,10 @@ export const SECTIONS = ['Cel', 'Kontekst', 'Decyzje z uzasadnieniem', 'Ogranicz
 export const ANSWERS_SECTION = 'Pytania i odpowiedzi';
 const HEADER_PREFIX = '[hub · ';
 
-export function headerLine({ path, project, sessionId, at }) {
-  return `${HEADER_PREFIX}${path} · ${project} · ${String(sessionId).slice(0, 8)} · ${at.slice(0, 16).replace('T', ' ')}]`;
+// `target` names the recipient: the first 8 characters of its sessionId, or the name of a session
+// still to be launched (spec §6.6).
+export function headerLine({ path, project, sessionId, target, at }) {
+  return `${HEADER_PREFIX}${path} · ${project} · ${target ?? String(sessionId).slice(0, 8)} · ${at.slice(0, 16).replace('T', ' ')}]`;
 }
 
 // The fixed wording of spec §6.4 step 2, laid out in the five sections.
@@ -36,15 +38,25 @@ export function questionnaireRequest({ topic, max }) {
   ].join('\n');
 }
 
-export function composeMessage({ path, project, sessionId, at, body }) {
+export function composeMessage({ path, project, sessionId, target, at, body }) {
   if (!PATHS.includes(path)) throw new Error(`unknown path ${path}; expected one of ${PATHS.join(', ')}`);
-  return `${headerLine({ path, project, sessionId, at })}\n\n${canonical(body)}\n`;
+  return `${headerLine({ path, project, sessionId, target, at })}\n\n${canonical(body)}\n`;
 }
 
 function normalizeHeading(line) {
   return line.replace(/^[#*\s]+/, '').replace(/[*:\s]+$/, '').toLowerCase();
 }
 
+// A new session's prompt carries the project from the map (spec §6.6 step 3): one line right under
+// the **Kontekst** heading. Throws when the body has no such heading.
+export function withProjectContext(body, entry) {
+  const lines = canonical(body).split('\n');
+  const at = lines.findIndex((line) => normalizeHeading(line) === 'kontekst');
+  if (at === -1) throw new Error('missing section Kontekst');
+  lines.splice(at + 1, 0, `Projekt: ${entry.name} (${entry.dir}). ${entry.description}`);
+  return lines.join('\n');
+}
+
 export function templateProblems(text, path) {
   const lines = canonical(text).split('\n');
   const problems = [];
````

Modify `lib/confirm.mjs` (unified diff against the state after the previous task):

````diff
@@ -33,6 +33,32 @@ export function findMismatch(record, events, hubName, knownHashes, usedIds) {
   return found;
 }
 
+// A launched session's first own prompt (spec §6.6 step 8): the approved text itself, given on the
+// command line, so it carries no cross-session wrapper.
+function firstPrompt(events, since) {
+  return events
+    .filter((e) => e.event === 'UserPromptSubmit' && !e.fromName && (!since || e.at >= since))
+    .sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : (a.index ?? 0) - (b.index ?? 0)))[0] ?? null;
+}
+
+// `eventsBySession`: Map sessionId → events. With record.sessionId unknown (the launch found no
+// poll entry), any session whose first prompt after sentAt carries the approved hash is the one.
+export function findLaunchDelivery(record, eventsBySession) {
+  for (const [sessionId, events] of eventsBySession) {
+    if (record.sessionId && sessionId !== record.sessionId) continue;
+    const first = firstPrompt(events, record.sentAt);
+    if (first && first.promptHash === record.textHash) return first;
+  }
+  return null;
+}
+
+// The launched session's first prompt carries another hash: Claude Code changed the command-line
+// text, or another prompt came first. Never delivery evidence.
+export function findLaunchMismatch(record, events) {
+  const first = firstPrompt(events, record.sentAt);
+  return first && first.promptHash !== record.textHash ? first : null;
+}
+
 export function classifyNotice(text) {
   const msgId = /msg_id:\s*([0-9a-f-]{36})/i.exec(text)?.[1] ?? null;
   let kind = 'unknown';
````

Modify `lib/journal.mjs` (unified diff against the state after the previous task):

````diff
@@ -34,7 +34,8 @@ const cell = (value) => String(value ?? '').replace(/\|/g, '\\|').replace(/\s+/g
 export function renderJournal(records) {
   const lines = ['| Record | Approved | Session | Path | State | Evidence or notice |', '|---|---|---|---|---|---|'];
   for (const r of records) {
-    lines.push(`| ${[r.id, r.approvedAt, `${r.sessionId.slice(0, 8)} ${r.name ?? ''}`, r.path, shownState(r), proofOf(r)].map(cell).join(' | ')} |`);
+    // A new-session record has no sessionId until its launch or its delivery evidence names one.
+    lines.push(`| ${[r.id, r.approvedAt, `${(r.sessionId ?? r.shortId ?? '').slice(0, 8)} ${r.name ?? ''}`, r.path, shownState(r), proofOf(r)].map(cell).join(' | ')} |`);
   }
   return `${lines.join('\n')}\n`;
 }
````

Create `lib/launch.mjs`:

````js
// Launching background sessions (spec §6.6; dialog forks, §6.5 step 2): the command line, the
// pre-launch checks, the output `claude --bg` prints, and the session's full id from a poll.
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { sha256 } from './text.mjs';
import { templateProblems } from './compose.mjs';

// A Windows command line holds at most 32 767 characters; the rest is room for the other arguments.
export const MAX_PROMPT_CHARS = 30000;
export const LAUNCH_TIMEOUT_MS = 120000;
export const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// HUB_CLAUDE_CMD, a JSON array, replaces `claude` so tests run a fake CLI. `claude` is claude.exe,
// so spawnSync needs no shell and passes every argument, the prompt included, unchanged.
export function claudeCommand(env = process.env) {
  return env.HUB_CLAUDE_CMD ? JSON.parse(env.HUB_CLAUDE_CMD) : ['claude'];
}

export function newSessionArgs({ name, worktree, text }) {
  return ['--bg', '--name', name, ...(worktree ? ['-w', name] : []), text];
}

// `backgrounded · 0015e1eb · dlg-s12` (probes S6, S12).
export function parseBackgrounded(output) {
  const match = /backgrounded\s*·\s*([0-9a-f]{6,})\s*·\s*(\S+)/.exec(String(output ?? ''));
  return match ? { shortId: match[1], name: match[2] } : null;
}

// Runs `claude <args>` in `cwd`; a non-zero exit keeps the CLI's literal output (for example
// "Workspace not trusted", probe S10).
export function runClaude(args, { cwd, env = process.env, run = spawnSync } = {}) {
  const [cmd, ...prefix] = claudeCommand(env);
  const result = run(cmd, [...prefix, ...args], { cwd, env, encoding: 'utf8', timeout: LAUNCH_TIMEOUT_MS, windowsHide: true });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim();
  if (result.error) return { ok: false, output, error: result.error.message };
  if (result.status !== 0) return { ok: false, output, error: `exit ${result.status}: ${output}` };
  const parsed = parseBackgrounded(output);
  return parsed ? { ok: true, output, ...parsed } : { ok: false, output, error: `no "backgrounded" line in the output: ${output}` };
}

// The worktree layout of `-w <name>` (probe S10).
export function worktreeOf(dir, name) {
  return { path: join(dir, '.claude', 'worktrees', name), branch: `worktree-${name}` };
}

// Spec §6.6 step 6. Each failure names its check and carries a message the hub quotes.
export function launchChecks({ record, poll, text, dirExists }) {
  const failures = [];
  if (!dirExists) failures.push({ check: 'directory', message: `the project directory does not exist: ${record.baseline.cwd}` });
  if (!poll?.ok) failures.push({ check: 'name', message: `cannot verify the name: claude agents --json failed: ${poll?.error ?? 'no poll'}` });
  else if (poll.sessions.some((s) => s.name === record.name)) failures.push({ check: 'name', message: `a live session is already named ${record.name}` });
  if (sha256(text) !== record.textHash) failures.push({ check: 'text', message: 'the text changed since approval' });
  for (const problem of templateProblems(text, record.path)) failures.push({ check: 'text', message: problem });
  if (text.length > MAX_PROMPT_CHARS) failures.push({ check: 'length', message: `the text has ${text.length} characters; a launch takes at most ${MAX_PROMPT_CHARS}` });
  return failures;
}

// The full sessionId of a just-launched session: `claude --bg` prints a short id, and
// `claude agents --json` lists the session under it (probe S6). Polls again a few times.
export function findLaunched(pollOnce, shortId, { attempts = 5, waitMs = 1000 } = {}) {
  for (let i = 0; i < attempts; i += 1) {
    const poll = pollOnce();
    const entry = poll.ok ? poll.sessions.find((s) => s.id === shortId || String(s.sessionId).startsWith(shortId)) : null;
    if (entry?.sessionId) return entry.sessionId;
    if (i < attempts - 1) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, waitMs);
  }
  return null;
}
````

- [ ] **Step 4: Run the tests to see them pass**

Run: `node --test 2>&1 | grep -E "^ℹ (pass|fail)"`
Expected: `ℹ pass 92`, `ℹ fail 0`.

---

### Task 5: Installation checkpoint and the project map (with Rafal)

Executed by the controller with Rafal: the writes go into `~/.claude` and are Rafal's. After this task the map, the titles and new sessions work; Rafal may pause here and pilot the hub (spec §10, group 2).

**Files:**
- Modify (by Rafal's command): `C:/Users/rafal/.claude/skills/hub/**` (copy of the development tree)
- Modify (by Rafal himself): `C:/Users/rafal/.claude/hub/projects.json`

- [ ] **Step 1: Hand Rafal the install command, with the explanation**

```bash
node C:/Users/rafal/hub-dev/hub/bin/install.mjs --dry-run
node C:/Users/rafal/hub-dev/hub/bin/install.mjs
```

Explain: the dry run prints the four steps; the real run copies the development tree over `~/.claude/skills/hub` (new files `lib/titles.mjs`, `lib/launch.mjs`, `fakes/`, changed CLI, hook modules and `SKILL.md`). The hook entries and the rules block are already installed, so it reports `0 hook entries added` and `rules block unchanged`; `projects.json` exists, so it stays as it is. Every session's next hook call runs the new hook code (`transcriptPath` is recorded from then on). Rafal's backup hook will commit and push `skills/hub/` at the next session end outside `hub-probes` and `~/.claude/hub`, as after Plan 2.

Undo, with what it does: `node C:/Users/rafal/hub-dev/hub-before-plan-3/bin/install.mjs` copies the Plan 2 tree back over the skill; it touches neither `settings.json` nor `CLAUDE.md` (already in place) nor `~/.claude/hub/`. Files that exist only in the new tree (`lib/titles.mjs`, `lib/launch.mjs`, `fakes/`) stay behind unused; `rm -r C:/Users/rafal/.claude/skills/hub/fakes C:/Users/rafal/.claude/skills/hub/lib/titles.mjs C:/Users/rafal/.claude/skills/hub/lib/launch.mjs` removes them.

- [ ] **Step 2: Verify (read-only)**

```bash
cd C:/Users/rafal/.claude/skills/hub && node --test 2>&1 | grep -E "^ℹ (pass|fail)"
node C:/Users/rafal/.claude/skills/hub/bin/hub.mjs projects
node C:/Users/rafal/.claude/skills/hub/bin/hub.mjs overview --no-poll
```

Expected: `ℹ pass 92`, `ℹ fail 0`; `The project map is empty.` plus `Seen in the registry, outside the map: …` listing the repositories Rafal works in; an overview whose Project column says `(outside the map)` and whose Session column shows conversation titles where a session's hook has recorded `transcriptPath` (a session shows its title from its next prompt on).

- [ ] **Step 3: Rafal writes the map**

Rafal edits `C:/Users/rafal/.claude/hub/projects.json` himself. Show him the format, with the projects `HUB projects` listed as the starting point, for example:

```json
{
  "projects": {
    "baza-wiedzy": {
      "name": "Baza wiedzy Devstock",
      "dir": "D:\\Praca\\Devstock\\Baza wiedzy",
      "description": "Materiały kursów Devstock: moduły, lekcje, skrypty generujące."
    }
  }
}
```

Tell him: keys in kebab-case (they name `projects/<key>/` and prefix launched sessions); backslashes doubled in JSON; Plan 2's journals live in `projects/Baza-wiedzy/`, `projects/notatki/`, `projects/repo/`, and a key that differs from such a folder name starts a new folder (spec §4.1). Then `HUB projects` again: expected no `projects.json:` error lines.

- [ ] **Step 4: The hub picks up the new skill**

Rafal runs `/clear` in the hub tab and types `start`, so the hub reads the new `SKILL.md`. Expected: the overview with map names and titles.

- [ ] **Step 5: Ask whether to continue or pilot**

Ask Rafal: continue with Task 6 now, or pilot the hub with the map and new sessions first. Wait for his answer.

---

### Task 6: The dialog path through a fork

Spec §6.5 steps 1–9, §8.2 (writing and secrets rows), §9.1 row "Dialog start", probes S6, S7, S12, Review Focus 3.

**Files:**
- Create: `lib/denylist.mjs`, `lib/dialog.mjs`
- Modify: `lib/paths.mjs`, `lib/compose.mjs`, `bin/hub.mjs`, `SKILL.md`
- Test: `test/dialog.test.mjs`

**Interfaces:**
- Consumes: `runClaude`, `findLaunched`, `SLUG` (Task 4); `sessionArg` (Task 3); `projectOf`, `loadProjectMap` (Task 1); `registerLaunched`; `fakes/claude.mjs`.
- Produces: `DENYLIST`, `isDenied(path) → boolean`, `excludePathspecs() → string[]`; `PROMPT_READY`; `takeSnapshot(cwd, contextDir, { at, run }) → { at, cwd, git }` (writes `status.txt`, `log.txt`, `diff.patch` or `NO-GIT.txt`, and `snapshot.json`); `forkSettings(dialogDir)`; `forkArgs({ sessionId, name, settingsPath, prompt, dialogDir })`; `forkStartPrompt({ projectName, sourceName, sourceId, dialogDir, snapshot })`; `fallbackCommand({ cwd, sessionId, name, settingsPath, promptPath, dialogDir })`; `dialogsDir(root, project)`; `ownedDir(root, dir, kind) → canonical path | null` (exactly `<root>/projects/<project>/<kind>/<name>`, also used by Task 7); `headerLine`/`composeMessage` option `origin`. CLI: `dialog start --session <id> --slug <slug> [--agents-json <file>]` printing `{ ok, dialogDir, name, shortId, sessionId, sourceSessionId, resolvedFrom, busy, attach }` (or `{ ok: false, candidates }` / `{ ok: false, error, command }`), `dialog refresh --dir <dialog dir>` (refuses any directory `ownedDir` rejects), `compose … --origin <text>`. A registered fork entry has `kind: 'dialog'`, `dialogDir`, `sourceSessionId`. `lib/denylist.mjs` is also used by Task 7.

- [ ] **Step 1: Write the failing tests**

Create `test/dialog.test.mjs`:

````js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, appendFileSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tempRoot, ev } from './helpers.mjs';
import { isDenied } from '../lib/denylist.mjs';
import { takeSnapshot, forkSettings, forkArgs, forkStartPrompt, PROMPT_READY } from '../lib/dialog.mjs';
import { readHubSessions } from '../lib/hubsessions.mjs';

const HUB = fileURLToPath(new URL('../bin/hub.mjs', import.meta.url));
const FAKE = fileURLToPath(new URL('../fakes/claude.mjs', import.meta.url));
const git = (repo, ...args) => spawnSync('git', ['-C', repo, '-c', 'user.name=t', '-c', 'user.email=t@e', ...args], { encoding: 'utf8' });

function repoWithSecrets() {
  const repo = join(tempRoot(), 'app');
  mkdirSync(join(repo, 'config'), { recursive: true });
  spawnSync('git', ['init', '-q', '-b', 'main', repo]);
  for (const name of ['README.md', '.env', 'config/App-Secret.txt', 'server.PEM']) writeFileSync(join(repo, name), 'v1\n');
  git(repo, 'add', '-A');
  git(repo, 'commit', '-q', '-m', 'init');
  for (const name of ['README.md', '.env', 'config/App-Secret.txt', 'server.PEM']) writeFileSync(join(repo, name), 'v2 TOKEN=abc\n');
  return repo;
}

test('the denylist matches secret-bearing names in any directory, case-insensitively', () => {
  for (const path of ['.env', 'C:\\app\\.env.local', 'certs/Server.PEM', 'id.key', 'aws-credentials.json', 'my_secret.txt', 'auth.json', 'secrets.yaml']) {
    assert.equal(isDenied(path), true, path);
  }
  for (const path of ['README.md', 'keys.md', 'environment.ts', 'src/auth.json.md']) assert.equal(isDenied(path), false, path);
});

test('the git snapshot leaves denylisted files out and runs every git call without optional locks', () => {
  const repo = repoWithSecrets();
  const context = join(tempRoot(), 'context');
  const snapshot = takeSnapshot(repo, context, { at: '2026-10-14T12:00:00.000Z' });
  assert.deepEqual(snapshot, { at: '2026-10-14T12:00:00.000Z', cwd: repo, git: true });
  const diff = readFileSync(join(context, 'diff.patch'), 'utf8');
  assert.match(diff, /README\.md/);
  assert.doesNotMatch(diff, /\.env|App-Secret|server\.PEM/i);
  assert.doesNotMatch(readFileSync(join(context, 'status.txt'), 'utf8'), /\.env|App-Secret|server\.PEM/i);
  assert.match(readFileSync(join(context, 'log.txt'), 'utf8'), /init/);

  const calls = [];
  takeSnapshot(repo, join(tempRoot(), 'c2'), { run: (cmd, args) => { calls.push(args); return { status: 0, stdout: 'true' }; } });
  assert.ok(calls.length === 4 && calls.every((args) => args[0] === '--no-optional-locks'));
});

test('a session working in a subdirectory still gets the whole repository diff', () => {
  const repo = repoWithSecrets();
  const context = join(tempRoot(), 'context');
  takeSnapshot(join(repo, 'config'), context);
  const diff = readFileSync(join(context, 'diff.patch'), 'utf8');
  assert.match(diff, /README\.md/);
  assert.doesNotMatch(diff, /App-Secret/);
});

test('a cwd outside git gives a note instead of a snapshot', () => {
  const context = join(tempRoot(), 'context');
  const snapshot = takeSnapshot(tempRoot(), context);
  assert.equal(snapshot.git, false);
  assert.match(readFileSync(join(context, 'NO-GIT.txt'), 'utf8'), /is not inside a git work tree/);
});

test('fork settings, argument order and start prompt', () => {
  const settings = forkSettings('C:\\Users\\rafal\\.claude\\hub\\projects\\app\\dialogs\\2026-10-14-wynik');
  assert.deepEqual(settings, { permissions: { allow: ['Edit(//C:/Users/rafal/.claude/hub/projects/app/dialogs/2026-10-14-wynik/**)'], deny: ['Edit(./**)', 'Bash', 'EnterWorktree'] } });
  const args = forkArgs({ sessionId: 'S', name: 'dlg-app-wynik', settingsPath: 'set.json', prompt: 'P', dialogDir: 'D' });
  assert.deepEqual(args, ['--bg', '--resume', 'S', '--fork-session', '--name', 'dlg-app-wynik', '--settings', 'set.json', 'P', '--add-dir', 'D']);
  const prompt = forkStartPrompt({ projectName: 'App', sourceName: 'app-x', sourceId: 'abcdef1234', dialogDir: 'C:\\d', snapshot: { git: true, cwd: 'C:\\app', at: '2026-10-14T12:00:00.000Z' } });
  assert.match(prompt, /dialog fork of the session app-x \(abcdef12\) in the project App/);
  assert.match(prompt, /taken at 2026-10-14T12:00:00\.000Z/);
  assert.match(prompt, /gates left open in the history you inherited are not yours/);
  assert.ok(prompt.includes(PROMPT_READY));
});

function dialogSetup() {
  const root = tempRoot();
  const repo = repoWithSecrets();
  mkdirSync(join(root, 'registry'), { recursive: true });
  appendFileSync(join(root, 'registry', 'src-old-1111.events.jsonl'), `${JSON.stringify(ev('UserPromptSubmit', '2026-10-14T10:00:00Z', { sessionId: 'src-old-1111', cwd: repo }))}\n`);
  writeFileSync(join(root, 'projects.json'), JSON.stringify({ projects: { app: { name: 'App', dir: repo, description: 'Test app.' } } }));
  const agents = join(root, 'agents.json');
  const log = join(root, 'fake-claude.log');
  const env = { ...process.env, HUB_DATA: root, HUB_CLAUDE_CMD: JSON.stringify([process.execPath, FAKE]), FAKE_CLAUDE_LOG: log, FAKE_AGENTS: agents, FAKE_CLAUDE_ID: 'f0f0f0f0' };
  const hub = (...args) => spawnSync(process.execPath, [HUB, ...args], { encoding: 'utf8', env });
  return { root, repo, agents, log, hub };
}

test('dialog start resolves the source by name, writes the context and settings, launches and registers the fork', () => {
  const { root, repo, agents, log, hub } = dialogSetup();
  // The source restarted under the same name: the fork takes the live id.
  writeFileSync(agents, JSON.stringify([{ sessionId: 'src-new-2222', id: 'src-new-', name: 'notatki-fa', kind: 'interactive', status: 'busy', cwd: repo }]));
  appendFileSync(join(root, 'registry', 'src-old-1111.events.jsonl'), `${JSON.stringify(ev('UserPromptSubmit', '2026-10-14T10:01:00Z', { sessionId: 'src-old-1111', cwd: repo, sessionTitle: 'notatki-fa' }))}\n`);
  const run = hub('dialog', 'start', '--session', 'src-old', '--slug', 'wynik', '--agents-json', agents);
  assert.equal(run.status, 0, run.stdout + run.stderr);
  const out = JSON.parse(run.stdout);
  assert.equal(out.sourceSessionId, 'src-new-2222');
  assert.equal(out.resolvedFrom, 'src-old-1111');
  assert.equal(out.busy, true);
  assert.equal(out.name, 'dlg-app-wynik');
  assert.equal(out.sessionId, 'f0f0f0f0-0000-4000-8000-000000000000');
  assert.match(out.dialogDir, /projects[\\/]app[\\/]dialogs[\\/]\d{4}-\d{2}-\d{2}-wynik$/);
  assert.ok(existsSync(join(out.dialogDir, 'context', 'diff.patch')));
  assert.deepEqual(JSON.parse(readFileSync(join(out.dialogDir, 'fork-settings.json'), 'utf8')).permissions.deny, ['Edit(./**)', 'Bash', 'EnterWorktree']);

  const call = JSON.parse(readFileSync(log, 'utf8').trim());
  assert.deepEqual(call.args.slice(0, 8), ['--bg', '--resume', 'src-new-2222', '--fork-session', '--name', 'dlg-app-wynik', '--settings', join(out.dialogDir, 'fork-settings.json')]);
  assert.equal(call.args[8], readFileSync(join(out.dialogDir, 'start-prompt.md'), 'utf8'));
  assert.deepEqual(call.args.slice(9), ['--add-dir', out.dialogDir]);
  assert.equal(call.cwd.toLowerCase(), repo.toLowerCase());
  const [registered] = readHubSessions(root).launched;
  assert.deepEqual([registered.kind, registered.project, registered.sourceSessionId], ['dialog', 'app', 'src-new-2222']);

  assert.equal(hub('dialog', 'start', '--session', 'src-old', '--slug', 'wynik', '--agents-json', agents).status, 3);
});

test('dialog start stops on a name shared by two live sessions and on a missing one', () => {
  const { root, repo, agents, hub } = dialogSetup();
  appendFileSync(join(root, 'registry', 'src-old-1111.events.jsonl'), `${JSON.stringify(ev('UserPromptSubmit', '2026-10-14T10:01:00Z', { sessionId: 'src-old-1111', cwd: repo, sessionTitle: 'twin' }))}\n`);
  writeFileSync(agents, JSON.stringify([{ sessionId: 'a1', name: 'twin', cwd: repo }, { sessionId: 'b2', name: 'twin', cwd: repo }]));
  const twins = hub('dialog', 'start', '--session', 'src-old', '--slug', 'x', '--agents-json', agents);
  assert.equal(twins.status, 3);
  assert.deepEqual(JSON.parse(twins.stdout).candidates, ['a1', 'b2']);
  writeFileSync(agents, '[]');
  assert.deepEqual(JSON.parse(hub('dialog', 'start', '--session', 'src-old', '--slug', 'x', '--agents-json', agents).stdout).candidates, []);
});

test('a failed fork launch prints the command to paste; dialog refresh takes a new snapshot', () => {
  const { root, repo, agents, hub } = dialogSetup();
  writeFileSync(agents, JSON.stringify([{ sessionId: 'src-old-1111', name: 'probe', cwd: repo, status: 'idle' }]));
  const failed = spawnSync(process.execPath, [HUB, 'dialog', 'start', '--session', 'src-old-1111', '--slug', 'y', '--agents-json', agents], {
    encoding: 'utf8',
    env: { ...process.env, HUB_DATA: root, HUB_CLAUDE_CMD: JSON.stringify([process.execPath, FAKE]), FAKE_CLAUDE_LOG: join(root, 'l.log'), FAKE_CLAUDE_EXIT: '1', FAKE_CLAUDE_MESSAGE: 'boom' },
  });
  assert.equal(failed.status, 3);
  const out = JSON.parse(failed.stdout);
  assert.match(out.error, /^exit 1: boom/);
  assert.match(out.command, /^cd ".*" && claude --resume src-old-1111 --fork-session --name dlg-app-y --settings ".*fork-settings\.json" "\$\(cat ".*start-prompt\.md"\)" --add-dir ".*"$/);

  writeFileSync(join(repo, 'README.md'), 'v3 after the fork started\n');
  const refreshed = hub('dialog', 'refresh', '--dir', out.dialogDir);
  assert.equal(refreshed.status, 0, refreshed.stderr);
  assert.match(readFileSync(join(out.dialogDir, 'context', 'diff.patch'), 'utf8'), /v3 after the fork started/);
});

test('dialog refresh writes only into a dialog directory of the hub data (spec §8.2)', () => {
  const { root, repo, hub } = dialogSetup();
  mkdirSync(join(repo, 'context'), { recursive: true });
  writeFileSync(join(repo, 'context', 'snapshot.json'), JSON.stringify({ cwd: repo }));
  for (const dir of [repo, join(root, 'projects', 'app', 'dialogs', '..', '..', '..', '..'), join(root, 'projects', 'app'), join(root, 'nope')]) {
    const refused = hub('dialog', 'refresh', '--dir', dir);
    assert.equal(refused.status, 3, dir);
    assert.match(refused.stderr, /--dir must be a dialog directory under /);
  }
  assert.equal(existsSync(join(repo, 'context', 'diff.patch')), false);
});

test('compose --origin puts the dialog directory into the header line', () => {
  const { root, hub } = dialogSetup();
  const body = join(root, 'prompt.md');
  writeFileSync(body, '**Cel**\nx\n**Kontekst**\nx\n**Decyzje z uzasadnieniem**\nx\n**Ograniczenia**\nx\n**Oczekiwany rezultat**\nx');
  const draft = hub('compose', '--path', 'dialog', '--session', 'src-old', '--origin', 'dialogs/2026-10-14-wynik', '--body-file', body).stdout.trim();
  assert.match(readFileSync(draft, 'utf8'), /^\[hub · dialog · app · src-old- · \d{4}-\d{2}-\d{2} \d{2}:\d{2} · dialogs\/2026-10-14-wynik\]/);
});
````

- [ ] **Step 2: Run the tests to see them fail**

Run: `node --test 2>&1 | grep -E "^ℹ (pass|fail)|Cannot find module"`
Expected: `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '…\lib\denylist.mjs'`, `ℹ fail 1`.

- [ ] **Step 3: Implement**

Modify `SKILL.md` (unified diff against the state after the previous task):

````diff
@@ -121,6 +121,27 @@ message is `held`, do not resend it.
    `EBUSY`), removing a leftover directory by hand, `git branch -d worktree-<name>`; `-D` only after
    Rafal confirms that the branch's commits may be lost.
 
+## Dialog through a fork (spec §6.5)
+
+1. Rafal says "omówmy wynik sesji X". Pick a kebab-case slug and run
+   `HUB dialog start --session <X> --slug <slug>`. Then, by its output:
+   - `candidates` with several ids: ask Rafal which session; with none: X is not live under its
+     name, tell him so;
+   - `resolvedFrom` set: X restarted, and the fork starts from the live session `sourceSessionId`;
+   - `busy: true`: the fork sees X's history up to the running tool call, without its result (one
+     sample, D7);
+   - a failure with `command`: quote the error and give Rafal the command to paste into a new
+     terminal tab; never start the fork again on your own.
+2. Tell Rafal the dialog directory and `claude attach <shortId>`: he talks to the fork there.
+3. "odśwież kontekst": `HUB dialog refresh --dir <dialog dir>`.
+4. When the watcher reports the fork `waiting for decision` with "prompt gotowy do przeglądu", ask
+   Rafal to review `<dialog dir>/prompt.md` in the editor.
+5. When he says it is ready: `HUB compose --path dialog --session <sourceSessionId> --origin dialogs/<dir name> --body-file <dialog dir>/prompt.md`,
+   then steps 2–6 of Sending (full draft, "wyślij", approve, prepare, SendMessage, result,
+   confirm).
+6. After the send, stop the fork with `claude stop <shortId>`; the dialog directory stays. Show
+   X's next result when its turn ends.
+
 ## Boundaries
 
 - Write only through `HUB` into `~/.claude/hub/`. Never edit project repositories or this skill.
````

Modify `bin/hub.mjs` (unified diff against the state after the previous task):

````diff
@@ -3,12 +3,14 @@
 //   overview [--no-poll] [--agents-json <file>]
 //   last <sessionId>
 //   judge <sessionId> --verdict question|other
-//   compose --path <path> --session <sessionId> (--body-file <file|-> | --topic <text> --max <n>) [--project <p>]
+//   compose --path <path> --session <sessionId> (--body-file <file|-> | --topic <text> --max <n>) [--project <p>] [--origin <dialog dir>]
 //     (--body-file - reads the body from stdin)
 //   approve --session <sessionId> --path <path> --text-file <file> [--project <p>]
 //   compose --path new-session --project <key> --slug <slug> --body-file <file|->
 //   approve --path new-session --project <key> --slug <slug> --text-file <file> [--no-worktree]
 //   launch <recordId> [--agents-json <file>]
+//   dialog start --session <sessionId> --slug <slug> [--agents-json <file>]
+//   dialog refresh --dir <dialog dir>
 //   prepare <recordId> [--confirm-waiting] [--confirm-busy] [--confirm-resend] [--agents-json <file>]
 //   result <recordId> (--msg-id <id> | --error <literal error>)
 //   notice --text <literal notice>
@@ -23,18 +25,19 @@
 import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
 import { randomBytes } from 'node:crypto';
 import { join } from 'node:path';
-import { hubRoot, draftsDir, sentDir, registryDir } from '../lib/paths.mjs';
+import { hubRoot, draftsDir, sentDir, registryDir, dialogsDir, ownedDir } from '../lib/paths.mjs';
 import { readEvents, resolveSessionId, listSessionIds } from '../lib/registry.mjs';
 import { deriveSession } from '../lib/derive.mjs';
 import { runPoll, appendPoll, pollEntry } from '../lib/polls.mjs';
 import { buildOverview, renderOverview } from '../lib/overview.mjs';
-import { loadProjectMap, projectFor, renderProjects } from '../lib/projects.mjs';
+import { loadProjectMap, projectFor, projectOf, renderProjects } from '../lib/projects.mjs';
 import { registerLaunched, readHubSessions } from '../lib/hubsessions.mjs';
 import { composeMessage, questionnaireRequest, withProjectContext } from '../lib/compose.mjs';
 import { newRecordId, loadRecords, saveRecords, findRecord, findRecordByMsgId, listProjects, renderJournal } from '../lib/journal.mjs';
 import { gitInfo, runChecks } from '../lib/checks.mjs';
 import { findDelivery, findMismatch, findLaunchDelivery, findLaunchMismatch, classifyNotice, applyNotice } from '../lib/confirm.mjs';
 import { SLUG, newSessionArgs, runClaude, worktreeOf, launchChecks, findLaunched } from '../lib/launch.mjs';
+import { takeSnapshot, forkSettings, forkArgs, forkStartPrompt, fallbackCommand } from '../lib/dialog.mjs';
 import { cleanup } from '../lib/retention.mjs';
 import { VERDICTS, recordJudgment } from '../lib/judgments.mjs';
 import { sha256 } from '../lib/text.mjs';
@@ -158,7 +161,8 @@ switch (command) {
       const body = path === 'questionnaire-request'
         ? questionnaireRequest({ topic: need(options, 'topic'), max: need(options, 'max') })
         : readBody(options);
-      text = composeMessage({ path, project, sessionId, at, body });
+      const origin = options.origin && options.origin !== true ? options.origin : undefined;
+      text = composeMessage({ path, project, sessionId, origin, at, body });
     }
     mkdirSync(draftsDir(root, project), { recursive: true });
     // The random suffix keeps two drafts composed within one second apart.
@@ -235,6 +239,60 @@ switch (command) {
     console.log(JSON.stringify({ ok: true, id: record.id, shortId: launched.shortId, sessionId, name: record.name, worktree, attach: `claude attach ${launched.shortId}` }, null, 2));
     break;
   }
+  case 'dialog': {
+    if (positional[0] === 'refresh') {
+      const dir = ownedDir(root, need(options, 'dir'), 'dialogs') ?? fail(`--dir must be a dialog directory under ${join(root, 'projects', '<project>', 'dialogs')}`, 3);
+      let previous;
+      try {
+        previous = JSON.parse(readFileSync(join(dir, 'context', 'snapshot.json'), 'utf8'));
+      } catch (error) {
+        fail(`no snapshot in ${dir}: ${error.message}`, 3);
+      }
+      console.log(JSON.stringify(takeSnapshot(previous.cwd, join(dir, 'context'))));
+      break;
+    }
+    if (positional[0] !== 'start') fail('usage: dialog start --session <sessionId> --slug <slug> | dialog refresh --dir <dialog dir>');
+    const given = sessionArg(root, options.session, 'missing --session');
+    const slug = need(options, 'slug');
+    if (!SLUG.test(slug)) fail(`--slug must be kebab-case: ${slug}`);
+    const derived = derivedOf(root, given);
+    const poll = freshPoll(root, options);
+    if (!poll.ok) fail(`claude agents --json failed: ${poll.error}`, 3);
+    // The source is resolved by name right before the launch: a restart keeps the name and changes
+    // the id, and a fork of a stale id answers from the ended session (spec §6.5 step 2, D6).
+    const sourceName = pollEntry(poll, given)?.name ?? derived.sessionTitle;
+    if (!sourceName) fail(`session ${given} has no name; a fork resolves its source by name`, 3);
+    const candidates = poll.sessions.filter((s) => s.name === sourceName);
+    if (candidates.length !== 1) {
+      console.log(JSON.stringify({ ok: false, name: sourceName, candidates: candidates.map((s) => s.sessionId) }, null, 2));
+      process.exit(3);
+    }
+    const [source] = candidates;
+    const cwd = source.cwd ?? derived.cwd;
+    const project = projectOf(cwd, loadProjectMap(root).projects);
+    const at = new Date().toISOString();
+    const dir = join(dialogsDir(root, project.key), `${at.slice(0, 10)}-${slug}`);
+    if (existsSync(dir)) fail(`the dialog directory exists: ${dir}`, 3);
+    const snapshot = takeSnapshot(cwd, join(dir, 'context'), { at });
+    const settingsPath = join(dir, 'fork-settings.json');
+    writeFileSync(settingsPath, `${JSON.stringify(forkSettings(dir), null, 2)}\n`, 'utf8');
+    const prompt = forkStartPrompt({ projectName: project.name, sourceName, sourceId: source.sessionId, dialogDir: dir, snapshot });
+    const promptPath = join(dir, 'start-prompt.md');
+    writeFileSync(promptPath, prompt, 'utf8');
+    const name = `dlg-${project.key}-${slug}`;
+    const launched = runClaude(forkArgs({ sessionId: source.sessionId, name, settingsPath, prompt, dialogDir: dir }), { cwd });
+    if (!launched.ok) {
+      console.log(JSON.stringify({ ok: false, dialogDir: dir, error: launched.error, command: fallbackCommand({ cwd, sessionId: source.sessionId, name, settingsPath, promptPath, dialogDir: dir }) }, null, 2));
+      process.exit(3);
+    }
+    const sessionId = findLaunched(() => freshPoll(root, options), launched.shortId, options['agents-json'] ? { attempts: 1 } : {});
+    if (sessionId) registerLaunched(root, { sessionId, kind: 'dialog', project: project.key, name, dialogDir: dir, sourceSessionId: source.sessionId, at });
+    console.log(JSON.stringify({
+      ok: true, dialogDir: dir, name, shortId: launched.shortId, sessionId, sourceSessionId: source.sessionId,
+      resolvedFrom: source.sessionId === given ? null : given, busy: source.status === 'busy', attach: `claude attach ${launched.shortId}`,
+    }, null, 2));
+    break;
+  }
   case 'prepare': {
     const found = findRecord(root, positional[0] ?? fail('usage: prepare <recordId>'));
     if (!found) fail('record not found', 3);
@@ -357,5 +415,5 @@ switch (command) {
     break;
   }
   default:
-    fail('usage: hub.mjs overview|last|judge|compose|approve|launch|prepare|result|notice|confirm|register|journal|projects|cleanup');
+    fail('usage: hub.mjs overview|last|judge|compose|approve|launch|dialog|prepare|result|notice|confirm|register|journal|projects|cleanup');
 }
````

Modify `lib/compose.mjs` (unified diff against the state after the previous task):

````diff
@@ -10,9 +10,9 @@ export const ANSWERS_SECTION = 'Pytania i odpowiedzi';
 const HEADER_PREFIX = '[hub · ';
 
 // `target` names the recipient: the first 8 characters of its sessionId, or the name of a session
-// still to be launched (spec §6.6).
-export function headerLine({ path, project, sessionId, target, at }) {
-  return `${HEADER_PREFIX}${path} · ${project} · ${target ?? String(sessionId).slice(0, 8)} · ${at.slice(0, 16).replace('T', ' ')}]`;
+// still to be launched (spec §6.6). `origin` names the dialog directory a prompt came from (§6.1).
+export function headerLine({ path, project, sessionId, target, origin, at }) {
+  return `${HEADER_PREFIX}${path} · ${project} · ${target ?? String(sessionId).slice(0, 8)} · ${at.slice(0, 16).replace('T', ' ')}${origin ? ` · ${origin}` : ''}]`;
 }
 
 // The fixed wording of spec §6.4 step 2, laid out in the five sections.
@@ -38,9 +38,9 @@ export function questionnaireRequest({ topic, max }) {
   ].join('\n');
 }
 
-export function composeMessage({ path, project, sessionId, target, at, body }) {
+export function composeMessage({ path, project, sessionId, target, origin, at, body }) {
   if (!PATHS.includes(path)) throw new Error(`unknown path ${path}; expected one of ${PATHS.join(', ')}`);
-  return `${headerLine({ path, project, sessionId, target, at })}\n\n${canonical(body)}\n`;
+  return `${headerLine({ path, project, sessionId, target, origin, at })}\n\n${canonical(body)}\n`;
 }
 
 function normalizeHeading(line) {
````

Create `lib/denylist.mjs`:

````js
// Secret-bearing file names (spec §7): never pasted into or pointed at by a Codex prompt, and cut
// out of a dialog's git snapshot (spec §6.5 step 2). Matched on the file name, case-insensitively.
export const DENYLIST = ['.env*', '*.pem', '*.key', '*credentials*', '*secret*', 'auth.json', 'secrets.yaml'];

const PATTERNS = DENYLIST.map((glob) => new RegExp(`^${glob.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`, 'i'));

export function isDenied(path) {
  const name = String(path ?? '').split(/[\\/]/).pop();
  return PATTERNS.some((pattern) => pattern.test(name));
}

// git pathspecs that leave the denylisted names out in every directory.
export function excludePathspecs() {
  return DENYLIST.map((glob) => `:(exclude,glob,icase)**/${glob}`);
}
````

Create `lib/dialog.mjs`:

````js
// The dialog path (spec §6.5): the git snapshot a fork reads instead of a shell, the fork's
// permission rules and start prompt, and its command line in the argument order probe S7 fixed.
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { excludePathspecs } from './denylist.mjs';

export const PROMPT_READY = '⏸ Czeka na decyzję: prompt gotowy do przeglądu';

// Read-only git in the source session's cwd; --no-optional-locks keeps `git status` from
// refreshing the repository's index file (spec §6.5 step 2, §8.2).
export function takeSnapshot(cwd, contextDir, { at = new Date().toISOString(), run = spawnSync } = {}) {
  mkdirSync(contextDir, { recursive: true });
  const git = (...args) => run('git', ['--no-optional-locks', '-C', cwd, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const inside = git('rev-parse', '--is-inside-work-tree');
  const snapshot = { at, cwd, git: inside.status === 0 && String(inside.stdout).trim() === 'true' };
  if (!snapshot.git) {
    writeFileSync(join(contextDir, 'NO-GIT.txt'), `${cwd} is not inside a git work tree (${at}); there is no snapshot.\n`, 'utf8');
  } else {
    const text = (result) => (result.status === 0 ? result.stdout : `git failed (exit ${result.status}): ${result.stderr}`);
    writeFileSync(join(contextDir, 'status.txt'), text(git('status', '--short', '--', ...excludePathspecs())), 'utf8');
    writeFileSync(join(contextDir, 'log.txt'), text(git('log', '--oneline', '-20')), 'utf8');
    writeFileSync(join(contextDir, 'diff.patch'), text(git('diff', 'HEAD', '--', ...excludePathspecs())), 'utf8');
  }
  writeFileSync(join(contextDir, 'snapshot.json'), `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  return snapshot;
}

// "Repository read-only, dialog directory writable" (spec §6.5 step 2, probes S7 and S12).
export function forkSettings(dialogDir) {
  const dir = resolve(dialogDir).replace(/\\/g, '/');
  return { permissions: { allow: [`Edit(//${dir}/**)`], deny: ['Edit(./**)', 'Bash', 'EnterWorktree'] } };
}

// `--settings` before the prompt and the prompt before the variadic `--add-dir` (probe S7).
export function forkArgs({ sessionId, name, settingsPath, prompt, dialogDir }) {
  return ['--bg', '--resume', sessionId, '--fork-session', '--name', name, '--settings', settingsPath, prompt, '--add-dir', dialogDir];
}

// The fork's role (spec §6.5 step 3), a fixed text; the fork talks to Rafal in Polish.
export function forkStartPrompt({ projectName, sourceName, sourceId, dialogDir, snapshot }) {
  const dir = resolve(dialogDir);
  const context = snapshot.git
    ? `${join(dir, 'context')} holds a git snapshot of ${snapshot.cwd} taken at ${snapshot.at}: status.txt, log.txt and diff.patch.`
    : `${snapshot.cwd} is not a git work tree, so ${join(dir, 'context')} holds only a note (${snapshot.at}).`;
  return [
    `You are a dialog fork of the session ${sourceName} (${String(sourceId).slice(0, 8)}) in the project ${projectName}. Rafal talks to you after \`claude attach\`; talk to him in Polish.`,
    '',
    'Your role:',
    '- You are an analytical partner. You change nothing in the repository: no edits, no commits, no other agents.',
    '- You read the repository and the history of this conversation with the read and search tools. You have no shell.',
    `- ${context} It goes stale while the source session works on; when that matters, ask Rafal to refresh it in the hub.`,
    '- Questions and gates left open in the history you inherited are not yours: do not answer them and never end a turn with a marker for one of them. Your only gate is the review of prompt.md.',
    `- Read every decision back to Rafal. Only after he confirms it, write it into ${join(dir, 'decisions.md')} with its rationale and source.`,
    `- Questions without an answer go into ${join(dir, 'open-questions.md')}.`,
    `- When Rafal asks for the prompt, write ${join(dir, 'prompt.md')} with the sections **Cel**, **Kontekst**, **Decyzje z uzasadnieniem**, **Ograniczenia** and **Oczekiwany rezultat**, without a header line (the hub adds it), and end that turn with the line`,
    `  ${PROMPT_READY}`,
    '',
    'Now say in one or two Polish sentences what you take the subject of this dialog to be, and wait for Rafal.',
  ].join('\n');
}

// The ready command for a new tab when the background launch fails (spec §6.5 step 2, fallback).
export function fallbackCommand({ cwd, sessionId, name, settingsPath, promptPath, dialogDir }) {
  return `cd "${cwd}" && claude --resume ${sessionId} --fork-session --name ${name} --settings "${settingsPath}" "$(cat "${promptPath}")" --add-dir "${dialogDir}"`;
}
````

Modify `lib/paths.mjs` (unified diff against the state after the previous task):

````diff
@@ -1,7 +1,8 @@
 // Locations of the hub data (spec §4.1). Every function takes the data root explicitly, so tests
 // run against a temporary directory and never touch the real ~/.claude/hub (HUB_DATA overrides it).
 import { homedir } from 'node:os';
-import { join } from 'node:path';
+import { realpathSync } from 'node:fs';
+import { join, resolve, dirname, basename } from 'node:path';
 
 export function hubRoot(env = process.env) {
   return env.HUB_DATA || join(homedir(), '.claude', 'hub');
@@ -30,3 +31,21 @@ export const journalJsonlPath = (root, project) => join(projectDir(root, project
 export const journalMdPath = (root, project) => join(projectDir(root, project), 'journal.md');
 export const sentDir = (root, project) => join(projectDir(root, project), 'sent');
 export const draftsDir = (root, project) => join(projectDir(root, project), 'drafts');
+export const dialogsDir = (root, project) => join(projectDir(root, project), 'dialogs');
+
+// A directory a command names on its command line and then writes into must be exactly
+// <root>/projects/<project>/<kind>/<name>, after `..` and links are resolved: the hub writes only
+// into its data root (spec §8.2). The canonical path, or null.
+export function ownedDir(root, dir, kind) {
+  let real;
+  let base;
+  try {
+    real = realpathSync.native(resolve(String(dir)));
+    base = realpathSync.native(resolve(root));
+  } catch {
+    return null;
+  }
+  const same = (a, b) => a.toLowerCase() === b.toLowerCase();
+  const kindDir = dirname(real);
+  return same(basename(kindDir), kind) && same(dirname(dirname(kindDir)), join(base, 'projects')) ? real : null;
+}
````

- [ ] **Step 4: Run the tests to see them pass**

Run: `node --test 2>&1 | grep -E "^ℹ (pass|fail)"`
Expected: `ℹ pass 102`, `ℹ fail 0`.

---

### Task 7: The Codex consultation

Spec §7 steps 1–6, §8.1 row "Codex consultation failed", §8.2 Codex row, §9.1 row "Codex thread", probe S9.

**Files:**
- Create: `lib/codex.mjs`, `fakes/codex.mjs`
- Modify: `lib/paths.mjs`, `bin/hub.mjs`, `SKILL.md`
- Test: `test/codex.test.mjs`

**Interfaces:**
- Consumes: `isDenied`, `excludePathspecs`, `ownedDir` (Task 6); `isWithin` (Task 1); `sessionArg` (Task 3); `SLUG` (Task 4); `gitInfo` (Plan 2); `registryDir`.
- Produces: `CODEX_TIMEOUT_MS`; `codexCommand(env) → string[]`; `REVIEWER_ROLE`; `DeniedError`; `describeElement(element, hubRoot) → string` for `{ kind: 'file', path }` or `{ kind: 'diff', range }`; `firstPrompt({ question, elementText })`; `parseThreadId(stream)`; `askArgs({ cwd, answerFile })`; `followArgs({ threadId, answerFile })`; `runCodex({ args, cwd, input, answerFile, errFile, env, run, timeoutMs }) → { ok, failure, threadId, answer }`; `threadEntry({ n, question, prompt, at, outcome })`; `codexDir(root, project)`. CLI: `codex ask (--session <id> | --cwd <dir>) --slug <slug> (--file <path> | --diff <range> | --last <id>) --question-file <file|-> [--project <p>]`, `codex follow --thread <dir> --question-file <file|->`, `codex note --thread <dir> --text-file <file|->`, each printing `{ ok, thread, n, threadId, answerFile, errFile, failure?, warning? }` (exit 3 on a failure; `warning` when the stream had no `thread.started`). In `bin/hub.mjs`: `threadArg(options)` (a `--thread` that `ownedDir` accepts, else exit 3) and `fileElementPath(file, cwd)` (relative to `cwd`, links resolved, inside the repository root or the hub data, else exit 3). Thread files: `meta.json` (`threadId`, `element`, `sessionId`, `cwd`, `project`, `createdAt`, `calls`), `thread.md`, `answer-<n>.md`, `answer-<n>.err`. `fakes/codex.mjs` reads `FAKE_CODEX_LOG`, `FAKE_CODEX_EXIT`, `FAKE_CODEX_EMPTY`, `FAKE_CODEX_NO_THREAD`.

- [ ] **Step 1: Write the failing tests**

Create `test/codex.test.mjs`:

````js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, appendFileSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tempRoot, ev } from './helpers.mjs';
import { codexCommand, describeElement, runCodex, parseThreadId, REVIEWER_ROLE, DeniedError } from '../lib/codex.mjs';

const HUB = fileURLToPath(new URL('../bin/hub.mjs', import.meta.url));
const FAKE = fileURLToPath(new URL('../fakes/codex.mjs', import.meta.url));

test('the codex command: the override, codex.js under APPDATA, or plain codex', () => {
  assert.deepEqual(codexCommand({ HUB_CODEX_CMD: '["node","f.mjs"]' }), ['node', 'f.mjs']);
  const appdata = tempRoot();
  const script = join(appdata, 'npm', 'node_modules', '@openai', 'codex', 'bin');
  mkdirSync(script, { recursive: true });
  writeFileSync(join(script, 'codex.js'), '');
  assert.deepEqual(codexCommand({ APPDATA: appdata }), [process.execPath, join(script, 'codex.js')]);
  assert.deepEqual(codexCommand({ APPDATA: tempRoot() }), ['codex']);
});

test('elements: hub files pasted, repository files and diffs referenced, denylisted names refused', () => {
  const hubRoot = tempRoot();
  const last = join(hubRoot, 'registry', 's1.last', 'e1.md');
  mkdirSync(join(hubRoot, 'registry', 's1.last'), { recursive: true });
  writeFileSync(last, 'Wynik sesji: zażółć gęślą jaźń');
  assert.match(describeElement({ kind: 'file', path: last }, hubRoot), /Element \(pasted from .*e1\.md\):\n\n````\nWynik sesji: zażółć gęślą jaźń\n````/);
  assert.equal(describeElement({ kind: 'file', path: 'D:\\repo\\src\\app.ts' }, hubRoot), 'Element: the file D:\\repo\\src\\app.ts. Read it yourself.');
  assert.match(describeElement({ kind: 'diff', range: 'main..HEAD' }, hubRoot), /git diff main\.\.HEAD -- ':\(exclude,glob,icase\)\*\*\/\.env\*'/);
  assert.throws(() => describeElement({ kind: 'file', path: 'D:\\repo\\.env.local' }, hubRoot), DeniedError);
  assert.match(REVIEWER_ROLE, /change no file/);
  assert.match(REVIEWER_ROLE, /launch no other agent/);
});

test('runCodex: a timeout, an exit code and an empty answer fail; an error item in the stream does not', () => {
  const dir = tempRoot();
  const answerFile = join(dir, 'answer-1.md');
  const errFile = join(dir, 'answer-1.err');
  const stream = '{"type":"thread.started","thread_id":"t-1"}\n{"type":"item.completed","item":{"type":"error","message":"hooks"}}\n';
  const base = { args: [], cwd: dir, input: 'x', answerFile, errFile, env: { HUB_CODEX_CMD: '["codex"]' } };
  assert.equal(runCodex({ ...base, run: () => ({ error: Object.assign(new Error('t'), { code: 'ETIMEDOUT' }), stdout: '', stderr: '' }), timeoutMs: 60000 }).failure, 'timeout after 60 s');
  assert.equal(runCodex({ ...base, run: () => ({ status: 1, stdout: stream, stderr: 'ERROR: usage limit reached' }) }).failure, 'exit 1: ERROR: usage limit reached');
  assert.equal(readFileSync(errFile, 'utf8'), 'ERROR: usage limit reached');
  assert.equal(runCodex({ ...base, run: () => ({ status: 0, stdout: stream, stderr: '' }) }).failure, 'empty answer');
  const ok = runCodex({ ...base, run: () => { writeFileSync(answerFile, 'Uwaga 1.'); return { status: 0, stdout: stream, stderr: '' }; } });
  assert.deepEqual([ok.ok, ok.threadId, ok.answer], [true, 't-1', 'Uwaga 1.']);
  assert.equal(parseThreadId('noise\n{"type":"turn.started"}'), null);
});

function codexSetup() {
  const root = tempRoot();
  const repo = join(tempRoot(), 'Baza wiedzy');
  mkdirSync(repo, { recursive: true });
  mkdirSync(join(root, 'registry', 's1.last'), { recursive: true });
  // A large last message: it goes to Codex on stdin, not on the command line.
  writeFileSync(join(root, 'registry', 's1.last', 'e1.md'), `Wynik: zażółć gęślą jaźń\n${'treść '.repeat(40000)}`);
  appendFileSync(join(root, 'registry', 's1.events.jsonl'), `${JSON.stringify(ev('Stop', '2026-10-14T10:00:00Z', { sessionId: 's1', cwd: repo, lastFile: 's1.last/e1.md' }))}\n`);
  writeFileSync(join(root, 'projects.json'), JSON.stringify({ projects: { baza: { name: 'Baza', dir: repo, description: 'x' } } }));
  const log = join(root, 'fake-codex.log');
  const env = { ...process.env, HUB_DATA: root, HUB_CODEX_CMD: JSON.stringify([process.execPath, FAKE]), FAKE_CODEX_LOG: log };
  const hub = (args, input, extra = {}) => spawnSync(process.execPath, [HUB, ...args], { encoding: 'utf8', input, env: { ...env, ...extra } });
  const calls = () => readFileSync(log, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
  return { root, repo, hub, calls };
}

test('codex ask, follow and note: read-only arguments, stdin, thread files', () => {
  const { repo, hub, calls } = codexSetup();
  const asked = hub(['codex', 'ask', '--session', 's1', '--slug', 'wynik', '--last', 's1', '--question-file', '-'], 'Czy wynik jest kompletny? Zażółć.');
  assert.equal(asked.status, 0, asked.stdout + asked.stderr);
  const first = JSON.parse(asked.stdout);
  assert.equal(first.threadId, '01a136b7-2195-70d0-8cb4-81ac73919aa0');
  const [call1] = calls();
  assert.deepEqual(call1.args, ['exec', '-s', 'read-only', '-C', repo, '--json', '-o', first.answerFile, '-']);
  assert.equal(call1.cwd.toLowerCase(), repo.toLowerCase());
  assert.match(call1.input, /^You are a reviewer/);
  assert.match(call1.input, /Wynik: zażółć gęślą jaźń/);
  assert.ok(call1.input.length > 200000);
  assert.ok(existsSync(first.errFile));
  const meta = JSON.parse(readFileSync(join(first.thread, 'meta.json'), 'utf8'));
  assert.deepEqual([meta.threadId, meta.cwd, meta.project, meta.calls], [first.threadId, repo, 'baza', 1]);

  const followed = JSON.parse(hub(['codex', 'follow', '--thread', first.thread, '--question-file', '-'], 'A testy?').stdout);
  const [, call2] = calls();
  assert.deepEqual(call2.args, ['exec', 'resume', first.threadId, '-c', 'sandbox_mode="read-only"', '--json', '-o', followed.answerFile, '-']);
  assert.equal(call2.cwd.toLowerCase(), repo.toLowerCase());
  assert.equal(followed.n, 2);

  assert.equal(hub(['codex', 'note', '--thread', first.thread, '--text-file', '-'], '| Uwaga | Ocena |').status, 0);
  const thread = readFileSync(join(first.thread, 'thread.md'), 'utf8');
  assert.match(thread, /## Question 1[\s\S]*## Answer 1\n\nOdpowiedź na: [\s\S]*## Question 2[\s\S]*A testy\?[\s\S]*## Hub assessment 2\n\n\| Uwaga \| Ocena \|/);
});

test('codex refusals and failures: a denylisted file, an existing thread, a failed call', () => {
  const { root, repo, hub, calls } = codexSetup();
  writeFileSync(join(repo, '.env'), 'TOKEN=x');
  const denied = hub(['codex', 'ask', '--cwd', repo, '--slug', 'env', '--file', join(repo, '.env'), '--question-file', '-'], 'Co tu jest?');
  assert.equal(denied.status, 3);
  assert.match(denied.stderr, /matches the secrets denylist/);
  assert.equal(existsSync(join(root, 'projects', 'baza', 'codex')), false);

  const failed = hub(['codex', 'ask', '--cwd', repo, '--slug', 'limit', '--file', join(repo, 'README.md'), '--question-file', '-'], 'Opinia?', { FAKE_CODEX_EXIT: '1' });
  assert.equal(failed.status, 3);
  const out = JSON.parse(failed.stdout);
  assert.match(out.failure, /^brak drugiej opinii: exit 1: ERROR: usage limit reached/);
  assert.match(readFileSync(join(out.thread, 'thread.md'), 'utf8'), /## Answer 1\n\nBrak drugiej opinii: exit 1/);
  assert.equal(calls().length, 1);
  assert.match(hub(['codex', 'ask', '--cwd', repo, '--slug', 'limit', '--file', join(repo, 'README.md'), '--question-file', '-'], 'Znowu?').stderr, /the Codex thread exists/);
});

test('codex writes only into its own threads and reads only repository or hub files (spec §7, §8.2)', () => {
  const { root, repo, hub, calls } = codexSetup();
  mkdirSync(join(repo, 'src'), { recursive: true });
  writeFileSync(join(repo, 'src', 'app.ts'), 'x');
  // A relative --file is taken from the session's cwd, not from the hub's working directory.
  const relative = JSON.parse(hub(['codex', 'ask', '--cwd', repo, '--slug', 'rel', '--file', 'src/app.ts', '--question-file', '-'], 'Ok?').stdout);
  assert.match(calls()[0].input, new RegExp(`Element: the file ${join(repo, 'src', 'app.ts').replace(/\\/g, '\\\\')}\\. Read it yourself\\.`));
  const outside = join(tempRoot(), 'other.txt');
  writeFileSync(outside, 'x');
  for (const file of [outside, '../../outside.txt']) {
    const refused = hub(['codex', 'ask', '--cwd', repo, '--slug', `out-${file.length}`, '--file', file, '--question-file', '-'], 'Ok?');
    assert.equal(refused.status, 3, file);
    assert.match(refused.stderr, /lies outside the repository/);
  }
  // Threads named on the command line must be the hub's own.
  writeFileSync(join(repo, 'meta.json'), JSON.stringify({ threadId: 't', cwd: repo, calls: 1 }));
  for (const args of [['follow', '--thread', repo, '--question-file', '-'], ['note', '--thread', repo, '--text-file', '-'], ['note', '--thread', join(relative.thread, '..', '..', '..', '..'), '--text-file', '-']]) {
    const refused = hub(['codex', ...args], 'x');
    assert.equal(refused.status, 3, args.join(' '));
    assert.match(refused.stderr, /--thread must be a Codex thread under /);
  }
  assert.equal(existsSync(join(repo, 'thread.md')), false);
  assert.equal(calls().length, 1);
});

test('an answer without thread.started is kept with a warning, and a follow-up is refused', () => {
  const { repo, hub } = codexSetup();
  const asked = hub(['codex', 'ask', '--cwd', repo, '--slug', 'bez-watku', '--file', join(repo, 'README.md'), '--question-file', '-'], 'Opinia?', { FAKE_CODEX_NO_THREAD: '1' });
  assert.equal(asked.status, 0, asked.stderr);
  const out = JSON.parse(asked.stdout);
  assert.equal(out.threadId, null);
  assert.match(out.warning, /a follow-up is impossible/);
  const follow = hub(['codex', 'follow', '--thread', out.thread, '--question-file', '-'], 'Dalej?');
  assert.equal(follow.status, 3);
  assert.match(follow.stderr, /has no Codex thread id/);
});
````

- [ ] **Step 2: Run the tests to see them fail**

Run: `node --test 2>&1 | grep -E "^ℹ (pass|fail)|Cannot find module"`
Expected: `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '…\lib\codex.mjs'`, `ℹ fail 1`.

- [ ] **Step 3: Implement**

Modify `SKILL.md` (unified diff against the state after the previous task):

````diff
@@ -1,6 +1,6 @@
 ---
 name: hub
-description: Use in the hub session — the Claude Code session started with `claude --name hub --append-system-prompt-file <skill>/role.md` in ~/.claude/hub — to oversee Rafal's sessions in other projects: show the overview, react to watcher events, send approved direct commands and questionnaires, and track delivery. Not for project sessions themselves.
+description: Use in the hub session — the Claude Code session started with `claude --name hub --append-system-prompt-file <skill>/role.md` in ~/.claude/hub — to oversee Rafal's sessions in other projects: show the overview, react to watcher events, send approved direct commands and questionnaires, launch new sessions from the project map, start dialog forks, consult Codex, and track delivery. Not for project sessions themselves.
 ---
 
 # Hub
@@ -142,9 +142,32 @@ message is `held`, do not resend it.
 6. After the send, stop the fork with `claude stop <shortId>`; the dialog directory stays. Show
    X's next result when its turn ends.
 
+## Codex consultation (spec §7)
+
+1. Rafal says "odbij od Codexa <element>: <pytanie>". The element is a session's last result
+   (`--last <sessionId>`), a dialog's `prompt.md` or `decisions.md` or a repository file
+   (`--file <path>`), or the diff of a session's branch (`--diff <range>`, for example
+   `main..HEAD`). `--session <sessionId>` names the session the element belongs to, and Codex runs
+   in its `cwd`; without a session pass `--cwd <dir>`.
+2. Run it in the background (Bash with `run_in_background: true`), the question on stdin:
+   `HUB codex ask --session <id> --slug <slug> --last <id> --question-file - <<'EOF'` … `EOF`.
+   There is no "wyślij" step: Codex only reads.
+3. A refusal for a denylisted name, or for a file outside the repository and the hub data: ask
+   Rafal; never paste or point at such a file another way.
+4. When it finishes with `ok`, read `answerFile`, show the answer verbatim, then a table: uwaga,
+   ocena huba, uzasadnienie. Record that table with
+   `HUB codex note --thread <thread> --text-file - <<'EOF'` … `EOF`. A `warning` means the thread
+   has no id: say that a follow-up is impossible there. On a failure say "brak drugiej opinii" and
+   quote `failure`; the `.err` file stays; never run it again on your own.
+5. "Codex, <pytanie>": `HUB codex follow --thread <thread> --question-file - <<'EOF'` … `EOF`, also
+   in the background, then step 4.
+6. A conclusion reaches `decisions.md` or a prompt only after Rafal confirms it.
+
 ## Boundaries
 
 - Write only through `HUB` into `~/.claude/hub/`. Never edit project repositories or this skill.
+- Start sessions and forks only with `HUB launch` and `HUB dialog start`, after the steps above;
+  stop a fork only with `claude stop <shortId>` after its prompt was sent or Rafal asked.
 - Never answer gates or permission prompts of other sessions.
 - If a name matches several live sessions, stop and ask Rafal; SendMessage addresses by name.
 - Quote errors literally; never retry on your own.
````

Modify `bin/hub.mjs` (unified diff against the state after the previous task):

````diff
@@ -11,6 +11,9 @@
 //   launch <recordId> [--agents-json <file>]
 //   dialog start --session <sessionId> --slug <slug> [--agents-json <file>]
 //   dialog refresh --dir <dialog dir>
+//   codex ask (--session <sessionId> | --cwd <dir>) --slug <slug> (--file <path> | --diff <range> | --last <sessionId>) --question-file <file|-> [--project <p>]
+//   codex follow --thread <thread dir> --question-file <file|->
+//   codex note --thread <thread dir> --text-file <file|->
 //   prepare <recordId> [--confirm-waiting] [--confirm-busy] [--confirm-resend] [--agents-json <file>]
 //   result <recordId> (--msg-id <id> | --error <literal error>)
 //   notice --text <literal notice>
@@ -22,15 +25,15 @@
 // Every <sessionId> also takes a unique prefix, such as the 8 characters the overview shows.
 // --agents-json reads a saved `claude agents --json` output instead of running the CLI. The
 // --confirm-* flags are passed only after Rafal answered the hub's question (spec §6.2).
-import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
+import { readFileSync, writeFileSync, appendFileSync, mkdirSync, copyFileSync, existsSync, realpathSync } from 'node:fs';
 import { randomBytes } from 'node:crypto';
-import { join } from 'node:path';
-import { hubRoot, draftsDir, sentDir, registryDir, dialogsDir, ownedDir } from '../lib/paths.mjs';
+import { join, resolve } from 'node:path';
+import { hubRoot, draftsDir, sentDir, registryDir, dialogsDir, codexDir, ownedDir } from '../lib/paths.mjs';
 import { readEvents, resolveSessionId, listSessionIds } from '../lib/registry.mjs';
 import { deriveSession } from '../lib/derive.mjs';
 import { runPoll, appendPoll, pollEntry } from '../lib/polls.mjs';
 import { buildOverview, renderOverview } from '../lib/overview.mjs';
-import { loadProjectMap, projectFor, projectOf, renderProjects } from '../lib/projects.mjs';
+import { loadProjectMap, projectFor, projectOf, renderProjects, isWithin } from '../lib/projects.mjs';
 import { registerLaunched, readHubSessions } from '../lib/hubsessions.mjs';
 import { composeMessage, questionnaireRequest, withProjectContext } from '../lib/compose.mjs';
 import { newRecordId, loadRecords, saveRecords, findRecord, findRecordByMsgId, listProjects, renderJournal } from '../lib/journal.mjs';
@@ -38,6 +41,7 @@ import { gitInfo, runChecks } from '../lib/checks.mjs';
 import { findDelivery, findMismatch, findLaunchDelivery, findLaunchMismatch, classifyNotice, applyNotice } from '../lib/confirm.mjs';
 import { SLUG, newSessionArgs, runClaude, worktreeOf, launchChecks, findLaunched } from '../lib/launch.mjs';
 import { takeSnapshot, forkSettings, forkArgs, forkStartPrompt, fallbackCommand } from '../lib/dialog.mjs';
+import { describeElement, firstPrompt, askArgs, followArgs, runCodex, threadEntry } from '../lib/codex.mjs';
 import { cleanup } from '../lib/retention.mjs';
 import { VERDICTS, recordJudgment } from '../lib/judgments.mjs';
 import { sha256 } from '../lib/text.mjs';
@@ -99,7 +103,32 @@ function newSessionTarget(root, options) {
   return { key, entry, name: `${key}-${slug}` };
 }
 
-const readBody = (options) => readFileSync(need(options, 'body-file') === '-' ? 0 : options['body-file'], 'utf8');
+const readBody = (options, key = 'body-file') => readFileSync(need(options, key) === '-' ? 0 : options[key], 'utf8');
+const given = (options, key) => (options[key] && options[key] !== true ? options[key] : null);
+
+// One Codex call's result; a failure is "brak drugiej opinii" with the literal error (spec §8.1).
+// An answer without a thread id is kept, but marked: no follow-up can resume it (spec §7 step 3).
+function reportCodex({ outcome, thread, n, threadId }) {
+  console.log(JSON.stringify({
+    ok: outcome.ok, thread, n, threadId, answerFile: join(thread, `answer-${n}.md`), errFile: join(thread, `answer-${n}.err`),
+    ...(outcome.ok ? {} : { failure: `brak drugiej opinii: ${outcome.failure}` }),
+    ...(outcome.ok && !threadId ? { warning: 'no thread.started in the stream: a follow-up is impossible; ask again in a new thread' } : {}),
+  }, null, 2));
+  if (!outcome.ok) process.exit(3);
+}
+
+// A Codex thread named on the command line must be one of the hub's (spec §8.2).
+const threadArg = (options) => ownedDir(root, need(options, 'thread'), 'codex') ?? fail(`--thread must be a Codex thread under ${join(root, 'projects', '<project>', 'codex')}`, 3);
+
+// A file element is a repository file or a hub file (spec §7 step 1): a relative path is taken
+// from the session's cwd, links are resolved, and anything outside both is refused.
+function fileElementPath(file, cwd) {
+  const path = resolve(cwd, file);
+  const real = existsSync(path) ? realpathSync.native(path) : path;
+  const repo = gitInfo(cwd).repoRoot ?? cwd;
+  if (!isWithin(real, repo) && !isWithin(real, root)) fail(`the element ${real} lies outside the repository ${repo} and the hub data`, 3);
+  return real;
+}
 
 // Every session id's events, or only the launched one's when the launch learned it.
 function launchCandidates(root, record) {
@@ -293,6 +322,61 @@ switch (command) {
     }, null, 2));
     break;
   }
+  case 'codex': {
+    const sub = positional[0];
+    if (sub === 'note') {
+      const thread = threadArg(options);
+      const meta = JSON.parse(readFileSync(join(thread, 'meta.json'), 'utf8'));
+      appendFileSync(join(thread, 'thread.md'), `## Hub assessment ${meta.calls}\n\n${readBody(options, 'text-file').trim()}\n\n`, 'utf8');
+      console.log(JSON.stringify({ ok: true, thread, n: meta.calls }));
+      break;
+    }
+    if (sub !== 'ask' && sub !== 'follow') fail('usage: codex ask|follow|note …');
+    const question = readBody(options, 'question-file');
+    const at = new Date().toISOString();
+    if (sub === 'follow') {
+      const thread = threadArg(options);
+      const meta = JSON.parse(readFileSync(join(thread, 'meta.json'), 'utf8'));
+      if (!meta.threadId) fail('the thread has no Codex thread id (its first call failed before thread.started); start a new thread', 3);
+      const n = meta.calls + 1;
+      const answerFile = join(thread, `answer-${n}.md`);
+      const outcome = runCodex({ args: followArgs({ threadId: meta.threadId, answerFile }), cwd: meta.cwd, input: question, answerFile, errFile: join(thread, `answer-${n}.err`) });
+      writeFileSync(join(thread, 'meta.json'), `${JSON.stringify({ ...meta, calls: n }, null, 2)}\n`, 'utf8');
+      appendFileSync(join(thread, 'thread.md'), threadEntry({ n, question, prompt: question, at, outcome }), 'utf8');
+      reportCodex({ outcome, thread, n, threadId: meta.threadId });
+      break;
+    }
+    const sessionId = options.session ? sessionArg(root, options.session, 'missing --session') : null;
+    const cwd = given(options, 'cwd') ?? (sessionId ? derivedOf(root, sessionId).cwd : null) ?? fail('missing --cwd or --session');
+    const project = given(options, 'project') ?? projectFor(cwd, loadProjectMap(root).projects);
+    const slug = need(options, 'slug');
+    if (!SLUG.test(slug)) fail(`--slug must be kebab-case: ${slug}`);
+    let element;
+    if (given(options, 'file')) element = { kind: 'file', path: fileElementPath(options.file, cwd) };
+    else if (given(options, 'diff')) element = { kind: 'diff', range: options.diff };
+    else if (given(options, 'last')) {
+      const derived = derivedOf(root, sessionArg(root, options.last, 'missing --last'));
+      if (!derived.lastStop?.lastFile) fail('no Stop recorded for this session', 3);
+      element = { kind: 'file', path: join(registryDir(root), derived.lastStop.lastFile) };
+    } else fail('missing --file, --diff or --last');
+    let elementText;
+    try {
+      elementText = describeElement(element, root);
+    } catch (error) {
+      fail(error.message, 3);
+    }
+    const thread = join(codexDir(root, project), `${at.slice(0, 10)}-${slug}`);
+    if (existsSync(thread)) fail(`the Codex thread exists: ${thread}`, 3);
+    mkdirSync(thread, { recursive: true });
+    const prompt = firstPrompt({ question, elementText });
+    const answerFile = join(thread, 'answer-1.md');
+    const outcome = runCodex({ args: askArgs({ cwd, answerFile }), cwd, input: prompt, answerFile, errFile: join(thread, 'answer-1.err') });
+    const meta = { threadId: outcome.threadId, element, sessionId, cwd, project, createdAt: at, calls: 1 };
+    writeFileSync(join(thread, 'meta.json'), `${JSON.stringify(meta, null, 2)}\n`, 'utf8');
+    writeFileSync(join(thread, 'thread.md'), `# Codex: ${slug}\n\n${threadEntry({ n: 1, question, prompt, at, outcome })}`, 'utf8');
+    reportCodex({ outcome, thread, n: 1, threadId: outcome.threadId });
+    break;
+  }
   case 'prepare': {
     const found = findRecord(root, positional[0] ?? fail('usage: prepare <recordId>'));
     if (!found) fail('record not found', 3);
@@ -415,5 +499,5 @@ switch (command) {
     break;
   }
   default:
-    fail('usage: hub.mjs overview|last|judge|compose|approve|launch|dialog|prepare|result|notice|confirm|register|journal|projects|cleanup');
+    fail('usage: hub.mjs overview|last|judge|compose|approve|launch|dialog|codex|prepare|result|notice|confirm|register|journal|projects|cleanup');
 }
````

Create `fakes/codex.mjs`:

````js
// A stand-in for `codex` in consultation tests (HUB_CODEX_CMD): logs its arguments, working
// directory and stdin, prints a --json stream with thread.started and an `error` item, and writes
// the answer to the -o file. FAKE_CODEX_EXIT fails it; FAKE_CODEX_EMPTY leaves the answer empty;
// FAKE_CODEX_NO_THREAD leaves out thread.started.
import { appendFileSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  appendFileSync(process.env.FAKE_CODEX_LOG, `${JSON.stringify({ args, cwd: process.cwd(), input })}\n`);
  const thread = args[1] === 'resume' ? args[2] : '01a136b7-2195-70d0-8cb4-81ac73919aa0';
  if (!process.env.FAKE_CODEX_NO_THREAD) console.log(JSON.stringify({ type: 'thread.started', thread_id: thread }));
  console.log(JSON.stringify({ type: 'item.completed', item: { id: 'item_0', type: 'error', message: 'clamping SessionEnd hook timeout to 3s' } }));
  if (process.env.FAKE_CODEX_EXIT) {
    process.stderr.write('ERROR: usage limit reached');
    process.exit(Number(process.env.FAKE_CODEX_EXIT));
  }
  writeFileSync(args[args.indexOf('-o') + 1], process.env.FAKE_CODEX_EMPTY ? '' : `Odpowiedź na: ${input.split('\n').pop() || input.slice(-40)}`);
  process.stderr.write('writing is blocked by read-only sandbox\n');
});
````

Create `lib/codex.mjs`:

````js
// The Codex consultation (spec §7): a read-only reviewer, one thread per element. The first call is
// `codex exec -s read-only -C <dir>`, a follow-up `codex exec resume <id> -c sandbox_mode="read-only"`
// run from <dir> (probe S9); prompts go on stdin, the answer to answer-<n>.md, stderr to
// answer-<n>.err, where a write refusal appears.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { isDenied, excludePathspecs } from './denylist.mjs';
import { isWithin } from './projects.mjs';

export const CODEX_TIMEOUT_MS = 15 * 60 * 1000;

// HUB_CODEX_CMD, a JSON array, replaces the command for tests. `codex` is an npm shim (codex.cmd)
// that Node cannot spawn without a shell, so the hub runs the package's codex.js with this Node.
export function codexCommand(env = process.env) {
  if (env.HUB_CODEX_CMD) return JSON.parse(env.HUB_CODEX_CMD);
  const script = env.APPDATA ? join(env.APPDATA, 'npm', 'node_modules', '@openai', 'codex', 'bin', 'codex.js') : null;
  return script && existsSync(script) ? [process.execPath, script] : ['codex'];
}

export const REVIEWER_ROLE = [
  'You are a reviewer Rafal consults for a second opinion. You only read and comment:',
  '- you change no file and run no command that writes;',
  '- you launch no other agent (no claude, no codex);',
  '- you authorise nothing; Rafal decides.',
  'Answer in Polish.',
].join('\n');

export class DeniedError extends Error {}

// The element, as spec §7 step 2 has it: files from the hub data pasted verbatim, repository files
// and diffs given as paths and refs for Codex to read itself, denylisted names never.
export function describeElement(element, hubRoot) {
  if (element.kind === 'diff') {
    return `Element: the diff of \`git diff ${element.range} -- ${excludePathspecs().map((p) => `'${p}'`).join(' ')}\` in your working directory. Run it yourself.`;
  }
  if (isDenied(element.path)) throw new DeniedError(`the element ${element.path} matches the secrets denylist (spec §7); ask Rafal`);
  if (isWithin(element.path, hubRoot)) {
    return `Element (pasted from ${element.path}):\n\n\`\`\`\`\n${readFileSync(element.path, 'utf8')}\n\`\`\`\``;
  }
  return `Element: the file ${element.path}. Read it yourself.`;
}

export function firstPrompt({ question, elementText }) {
  return `${REVIEWER_ROLE}\n\n${elementText}\n\nQuestion:\n${question}\n`;
}

export function parseThreadId(stream) {
  for (const line of String(stream ?? '').split('\n')) {
    try {
      const event = JSON.parse(line);
      if (event.type === 'thread.started' && event.thread_id) return event.thread_id;
    } catch {
      // not a JSON line
    }
  }
  return null;
}

export const askArgs = ({ cwd, answerFile }) => ['exec', '-s', 'read-only', '-C', cwd, '--json', '-o', answerFile, '-'];
export const followArgs = ({ threadId, answerFile }) => ['exec', 'resume', threadId, '-c', 'sandbox_mode="read-only"', '--json', '-o', answerFile, '-'];

// A failure is an exit code, a timeout or an empty answer; an `error` item in the stream is not
// (probe S9: every stream carried a hooks.json warning as one).
export function runCodex({ args, cwd, input, answerFile, errFile, env = process.env, run = spawnSync, timeoutMs = CODEX_TIMEOUT_MS }) {
  const [cmd, ...prefix] = codexCommand(env);
  const result = run(cmd, [...prefix, ...args], { cwd, env, input, encoding: 'utf8', timeout: timeoutMs, maxBuffer: 256 * 1024 * 1024, windowsHide: true });
  writeFileSync(errFile, result.stderr ?? '', 'utf8');
  const answer = existsSync(answerFile) ? readFileSync(answerFile, 'utf8') : '';
  let failure = null;
  if (result.error) failure = result.error.code === 'ETIMEDOUT' ? `timeout after ${Math.round(timeoutMs / 1000)} s` : result.error.message;
  else if (result.status !== 0) failure = `exit ${result.status}: ${String(result.stderr ?? '').trim().split('\n').slice(-5).join('\n')}`;
  else if (!answer.trim()) failure = 'empty answer';
  return { ok: !failure, failure, threadId: parseThreadId(result.stdout), answer };
}

export function threadEntry({ n, question, prompt, at, outcome }) {
  const answer = outcome.ok ? outcome.answer.trim() : `Brak drugiej opinii: ${outcome.failure}`;
  return `## Question ${n} (${at})\n\n${question.trim()}\n\n<details><summary>Full prompt</summary>\n\n${prompt.trim()}\n\n</details>\n\n## Answer ${n}\n\n${answer}\n\n`;
}
````

Modify `lib/paths.mjs` (unified diff against the state after the previous task):

````diff
@@ -32,6 +32,7 @@ export const journalMdPath = (root, project) => join(projectDir(root, project),
 export const sentDir = (root, project) => join(projectDir(root, project), 'sent');
 export const draftsDir = (root, project) => join(projectDir(root, project), 'drafts');
 export const dialogsDir = (root, project) => join(projectDir(root, project), 'dialogs');
+export const codexDir = (root, project) => join(projectDir(root, project), 'codex');
 
 // A directory a command names on its command line and then writes into must be exactly
 // <root>/projects/<project>/<kind>/<name>, after `..` and links are resolved: the hub writes only
````

- [ ] **Step 4: Run the tests to see them pass**

Run: `node --test 2>&1 | grep -E "^ℹ (pass|fail)"`
Expected: `ℹ pass 109`, `ℹ fail 0`.

- [ ] **Step 5: The whole development tree against the reference copy**

```bash
diff -rq C:/Users/rafal/hub-dev/hub-before-plan-3 C:/Users/rafal/hub-dev/hub
```

Expected, in any order: `differ` for `SKILL.md`, `bin/hub.mjs`, `bin/install.mjs`, `lib/compose.mjs`, `lib/confirm.mjs`, `lib/derive.mjs`, `lib/events.mjs`, `lib/journal.mjs`, `lib/overview.mjs`, `lib/paths.mjs`, `lib/projects.mjs`, `lib/registry.mjs`, `lib/retention.mjs`, `lib/watch.mjs`, `test/cli.test.mjs`, `test/overview.test.mjs`; `Only in C:/Users/rafal/hub-dev/hub` for `fakes`, `lib/codex.mjs`, `lib/denylist.mjs`, `lib/dialog.mjs`, `lib/launch.mjs`, `lib/titles.mjs`, `test/codex.test.mjs`, `test/dialog.test.mjs`, `test/launch.test.mjs`, `test/titles.test.mjs`. Any other line is a stray change to explain.

---

### Task 8: Final installation (with Rafal)

Same command, explanation and undo as Task 5 Step 1; the tree now also has `lib/denylist.mjs`, `lib/dialog.mjs`, `lib/codex.mjs` and `fakes/codex.mjs` (add them to the `rm -r` of the undo).

- [ ] **Step 1: Rafal installs** — `node C:/Users/rafal/hub-dev/hub/bin/install.mjs --dry-run`, then without `--dry-run`.
- [ ] **Step 2: Verify** — `cd C:/Users/rafal/.claude/skills/hub && node --test 2>&1 | grep -E "^ℹ (pass|fail)"`. Expected: `ℹ pass 109`, `ℹ fail 0`.
- [ ] **Step 3: The hub picks up the new skill** — `/clear` in the hub tab, then `start`.

---

### Task 9: Acceptance with Rafal

Executed by the controller with Rafal: spec §9.3 items 4–10 (items 1–3 and the direct command passed in Plan 2's acceptance).

**Files:**
- Create: `D:/Notatki/notatki/.claude/specs/2026-10-14-orchestrator-hub-plan-3-acceptance.md`

- [ ] **Step 1: Trial sessions and a trial map entry**

Ask Rafal to add a trial entry to his map (and remove it after the acceptance):

```json
"sondy": { "name": "Sondy huba", "dir": "C:\\Users\\rafal\\hub-probes\\repo", "description": "Repozytorium do prób huba." }
```

`C:\Users\rafal\hub-probes\repo with space` stays outside the map. Then, each in its own terminal (the hub tab already runs):

```bash
cd "C:/Users/rafal/hub-probes/repo" && claude --name probe-a
cd "C:/Users/rafal/hub-probes/repo with space" && claude --name probe-b
```

Rafal sends one prompt in each (for example `Przeczytaj README i streść je jednym zdaniem.`).

- [ ] **Step 2: Item 8 — map names and titles**

In the hub: `pokaż przegląd`. Expected: `probe-a` under `Sondy huba`, `probe-b` under `repo with space (outside the map)`; each Session cell shows the conversation title (`probe-a`, `probe-b` from their `custom-title`); a VS Code panel session of Rafal's shows its panel title, not `<folder>-xx`; "Since" in local time.

- [ ] **Step 3: Item 4 — questionnaire path end to end**

Plan 2 acceptance Step 6, unchanged: `sesja probe-a: pytania o nazwę pliku z notatkami, maksymalnie 2`; request shown, `wyślij`, `sent`; the watcher reports `waiting for decision`; the hub shows the questions; Rafal answers; the answers with the five sections and **Pytania i odpowiedzi**, `wyślij`, `sent`, and `probe-a` acts on **Oczekiwany rezultat**.

- [ ] **Step 4: Item 9 — a new session from the map**

Rafal: `odpal sesję w sondach huba bez worktree: przeczytaj README i napisz w odpowiedzi jedno zdanie o tym, do czego służy repozytorium`. Expected: the hub matches `sondy`, shows the draft (header `[hub · new-session · sondy · sondy-<slug> · …]`, the project line under **Kontekst**) with directory, name and "bez worktree" (`approve … --no-worktree`); `wyślij`; `HUB launch` prints the short id and `claude attach <id>`; the overview lists `sondy-<slug> [background]`; after its first prompt `HUB confirm` lists the record in `confirmed` (the `promptHash` of the real `claude.exe` command-line prompt equals the approved hash — Review Focus 1). If `confirm` lists it in `mismatched` instead, record it as a defect with the journal line: the command-line prompt was changed on the way.

- [ ] **Step 5: Item 9 with a worktree, and the cleanup only proposed**

Rafal: `odpal sesję w sondach huba: dopisz do pliku notes/plan-3.md jedno zdanie o dzisiejszej dacie`. Expected: a worktree by default (P9): the draft shows the worktree path and branch and the name `sondy-<slug>`; `wyślij`; `HUB launch` prints `worktree.path` = `C:\Users\rafal\hub-probes\repo\.claude\worktrees\sondy-<slug>` and `worktree.branch` = `worktree-sondy-<slug>`; read-only checks: `git -C C:/Users/rafal/hub-probes/repo worktree list` lists that path on that branch, `claude agents --json` shows the session's `cwd` inside it, and after its first prompt `HUB confirm` lists the record in `confirmed`; the file lands in the worktree, not in `repo/notes/`. Then Rafal: `posprzątaj po sesji sondy-<slug>`. Expected: the hub only proposes the commands of spec §6.6 (`claude stop` / `claude rm <id>` after the process exited, removing a leftover directory by hand, `git branch -d worktree-sondy-<slug>`, `-D` only after Rafal confirms the commits may be lost) and runs none of them; Rafal decides and runs them himself.

- [ ] **Step 6: Item 5 — dialog through a fork**

Rafal: `omówmy wynik sesji probe-a`. Expected: `HUB dialog start` prints the dialog directory and `claude attach <id>`; `context/` holds `status.txt`, `log.txt`, `diff.patch`. Rafal attaches in a terminal, talks, asks for the prompt; the fork writes `prompt.md` and ends with `⏸ Czeka na decyzję: prompt gotowy do przeglądu`; the watcher reports it; Rafal reviews `prompt.md`; the hub composes with `--path dialog --origin dialogs/<dir>` and shows the full message; `wyślij`; `sent`; the hub stops the fork with `claude stop <id>`. Also check: the fork's first turn does not end with a marker inherited from `probe-a`'s history (P6), and the fork cannot write into `repo/` (ask it to; expect a refusal).

- [ ] **Step 7: Item 6 — Codex with one follow-up**

Rafal: `odbij od Codexa ostatni wynik probe-a: czy jest kompletny?`, then `Codex, a co z testami?`. Expected: both calls run in the background; the hub shows each answer verbatim with its assessment table and records it with `HUB codex note`; `thread.md`, `meta.json` (with the thread id), `answer-1.md`, `answer-2.md` and their `.err` files exist under `projects/sondy/codex/<date>-<slug>/`.

- [ ] **Step 8: Item 10 — the hub after `/clear`**

Plan 2 acceptance Step 7, unchanged: `/clear` in the hub tab, then `start`. Expected: the role kept, the overview rebuilt with titles and map names, the hub's new id not listed.

- [ ] **Step 9: Item 7 — a full restart and state recovery**

Plan 2 acceptance Step 8, unchanged: `/exit` the hub; send `Napisz jedno zdanie o rzece.` in `probe-b` and wait for the turn to end; start the hub again with `cd C:/Users/rafal/.claude/hub && claude --name hub --append-system-prompt-file C:/Users/rafal/.claude/skills/hub/role.md` and type `start`. Expected: the re-armed watcher reports `turn ended` for `probe-b`; `HUB journal --project sondy` still shows the records of Steps 3–6.

- [ ] **Step 10: Close and record**

Ask Rafal to `/exit` the trial sessions, to stop the session launched in Step 4 (`claude stop <id>`), and to remove the trial map entry. Write the acceptance report: per step the expected and the observed result, quoted from the hub tab or the CLI output, and a verdict; any failure becomes a defect task or a spec impact for Rafal. Finish with proposed commit messages:

```
docs(orchestrator): plan 3 acceptance report

Map names, conversation titles, a new session from the map with
confirmed delivery, a dialog fork with its prompt sent, a Codex
consultation with a follow-up, hub /clear and restart.
```
