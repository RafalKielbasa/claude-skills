# Orchestrator hub — Plan 4: acceptance fixes

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the four findings of the Plan 3 acceptance that the spec turned into P10, P13, P14 and P15: the installer writes the hub role into `~/.claude/hub/CLAUDE.md`, Codex calls run without Rafal's Codex hooks and MCP servers, the watcher stops with its hub session, and the header line shows local time; then install and accept with Rafal.

**Architecture:** The skill `hub` (Node, standard library only, ESM) is developed in `C:/Users/rafal/hub-dev/hub/` and installed into `~/.claude/skills/hub/`, as in Plans 2 and 3. Each fix is a small change to an existing module (`lib/install.mjs` + `bin/install.mjs`, `lib/codex.mjs` + `bin/hub.mjs`, `lib/compose.mjs` + `lib/text.mjs`) plus one new module, `lib/owner.mjs`, used by `bin/hub-watch.mjs`. Tests keep replacing every outside program: fake CLIs, a temporary `CODEX_HOME`, and `HUB_PROCESS_TABLE` for the process table.

**Tech Stack:** Node v24.20.0, `node:test`, Git Bash on Windows 11, PowerShell 5.1 (`Get-CimInstance Win32_Process`), Claude Code CLI, Codex CLI 0.147.0.

**Spec:** `D:/Notatki/notatki/.claude/specs/2026-10-13-orchestrator-hub-design.md` — §4 (hub row and hub setup), §4.1, §5.5 ("The watcher stops with its hub session"), §5.6, §6.1, §7 step 3 ("Isolation from Rafal's Codex setup"), §8.1, §8.2, §9.1, §9.3 ("Plan 4's acceptance"), §10 "Plan 4", §13.4 (P10–P15). Evidence: `D:/Notatki/notatki/.claude/specs/2026-10-14-orchestrator-hub-plan-3-acceptance.md` (findings B1, B2, B3, B6). Plan 3 for the code conventions: `D:/Notatki/notatki/.claude/plans/2026-10-14-orchestrator-hub-plan-3.md`.

## Global Constraints

- Platform: Windows 11; shell commands are Git Bash; Node scripts use only the standard library; ESM `.mjs` files with `"type": "module"`.
- Run tests with `node --test` from the skill directory (`node --test test/` does not work on this machine). `node --test` runs every `.mjs` file under `test/`, so fake CLIs live in `fakes/`.
- Development happens in `C:/Users/rafal/hub-dev/hub/`, which is not a repository: no commits there. Task 5 installs into `~/.claude/` only after Rafal says so in the conversation.
- Tests use a temporary hub data root (`HUB_DATA`) and never touch the real `~/.claude/hub/` or `~/.codex/`. They never start the real `claude` or `codex` (`HUB_CLAUDE_CMD`, `HUB_CODEX_CMD`); Codex tests set `CODEX_HOME` to a temporary directory; a watcher test either runs `--once`, passes `--owner-pid`, or sets `HUB_PROCESS_TABLE`, so no test depends on whether a `claude` process is among its ancestors.
- The vault `D:/Notatki/notatki` commits and pushes its own changed files after each completed change (its `.claude/CLAUDE.md`, section Git); the controller does that for this plan and the acceptance report, never `git add -A`.
- Code, comments and docs in English; user-facing text stays Polish (what the hub tells Rafal).
- Exact values from the spec: Codex isolation `-c features.hooks=false -c features.plugins=false -c features.apps=false` plus `-c mcp_servers.<name>.enabled=false` for every `[mcp_servers.<name>]` table of `$CODEX_HOME/config.toml` (`CODEX_HOME` defaults to `~/.codex`), on the first call and on every follow-up (§7); the watcher's owner is the nearest ancestor process named `claude` (`claude.exe` on Windows), checked before every write of `watch-state.json` and every 10 seconds, and a watcher without an owner prints one line and runs as before (§5.5); `~/.claude/hub/CLAUDE.md` holds the text of the skill's `role.md`, written by the installer when missing or different (§4); the header line shows local time (§6.1).
- Plan-level additions, for Rafal to accept in the plan review: the watcher takes `--owner-pid=<pid>` and `--owner-check-ms=<ms>` (tests), and `HUB_PROCESS_TABLE` replaces the process table (tests); only a long-running watcher looks up its owner, a `--once` tick does not; `localTime` moves from `lib/overview.mjs` to `lib/text.mjs` (re-exported from the overview); server names are recognised as bare keys, "basic" quoted keys without escapes and 'literal' quoted keys (from the Codex review of this plan), and a quoted name is passed as written (`mcp_servers."my server".enabled=false`), which Codex was not tried with; a name with escapes is not found; `hub/CLAUDE.md` starts with one HTML comment naming its source; `SKILL.md` gains one sentence for P13 and one for P14.

## Review Focus

1. **Rafal's real `~/.codex/config.toml`, where `[mcp_servers.node_repl]` has an `[mcp_servers.node_repl.env]` subtable and a `[projects."d:\\…"]` table sits next to the servers.** Expected: exactly the server names `n8n` and `node_repl` are disabled; the subtable and the project table are not servers. Pinned by the isolation test in Task 2 (the config there is shaped like his, with CRLF line endings).
2. **The process table cannot be read (PowerShell missing, slow or printing broken JSON).** Expected: the watcher never crashes; it prints the "no claude process among its ancestors" line and keeps running as before. Pinned by the `processTable` failure cases and the no-owner CLI test in Task 3.
3. **The suite run from a plain Git Bash tab, with no Claude Code process above it.** Expected: the same results as from a Claude session. Pinned in Task 3: every watcher CLI test runs `--once`, passes `--owner-pid`, or sets `HUB_PROCESS_TABLE`.
4. **`role.md` checked out with CRLF line endings (`core.autocrlf` on Windows).** Expected: `hub/CLAUDE.md` is written with LF, and the next install reports "role unchanged" instead of rewriting it with a new backup every time. Pinned by the installer test in Task 1 (`wanted` holds no `\r`; the rerun reports "role unchanged").
5. **A machine whose offset is negative or crosses midnight.** Expected: the header shows the local wall-clock time of composing. Pinned by the header test in Task 4 (offsets +120 and −90, and the machine's own offset).

---

## File Structure

| Path (under `C:/Users/rafal/hub-dev/hub/`) | Responsibility | Task |
|---|---|---|
| `lib/install.mjs` | `hubClaudeMd(role)`: the text of `~/.claude/hub/CLAUDE.md` | 1 |
| `bin/install.mjs` | Step 5: write `<claude-dir>/hub/CLAUDE.md` when missing or different, with a backup | 1 |
| `SKILL.md` | Description without start flags (P10); a sentence on Codex isolation (P13) and on the watcher's owner (P14) | 1, 2, 3 |
| `lib/codex.mjs` | `mcpServerNames`, `isolationArgs`; `askArgs` and `followArgs` take `isolation` | 2 |
| `bin/hub.mjs` | `codex ask` and `codex follow` pass `isolationArgs()` | 2 |
| `lib/owner.mjs` (new) | `processTable`, `findOwner`, `isAlive` | 3 |
| `bin/hub-watch.mjs` | Owner lookup, `--owner-pid`, `--owner-check-ms`, exit without writing when the owner is gone | 3 |
| `lib/text.mjs`, `lib/overview.mjs`, `lib/compose.mjs` | `localTime` shared; the header line in local time | 4 |
| `test/install.test.mjs`, `test/skill.test.mjs`, `test/codex.test.mjs`, `test/owner.test.mjs` (new), `test/watch.test.mjs`, `test/send.test.mjs` | Tests | 1–4 |
| `D:/Notatki/notatki/.claude/specs/2026-10-16-orchestrator-hub-plan-4-acceptance.md` | Acceptance report | 6 |

All code below was run during plan writing in a scratch copy of the hub, task after task: 131 tests passing at the end (123 before). Every "Modify" block is a unified diff against the state the previous task leaves; apply it by hand with Edit (each hunk's context lines are unique in the file). The Codex isolation was also run against the real Codex CLI 0.147.0 (a first call and a follow-up with exactly the arguments `isolationArgs()` builds on this machine: answers "ONE" and "TWO", `answer-1.err` held only the models-cache warning, `answer-2.err` was empty, and the review-reminder hook's state file kept its time), and the owner lookup against the real process table (590 ms, 457 processes, the owner found was this session's `claude.exe`).

---

### Task 0: Preflight

Proves the starting point and keeps a reference copy for the reviewers and for undoing Task 5.

**Files:** creates `C:/Users/rafal/hub-dev/hub-before-plan-4/` (a copy, not a repository).

- [ ] **Step 1: The development copy equals the installed skill**

```bash
diff -rq C:/Users/rafal/hub-dev/hub C:/Users/rafal/.claude/skills/hub
```

Expected: no output. Any difference: stop and show it to Rafal; do not pick a side.

- [ ] **Step 2: The baseline passes**

```bash
cd C:/Users/rafal/hub-dev/hub && node --test 2>&1 | grep -E "^ℹ (pass|fail)"
```

Expected: `ℹ pass 123`, `ℹ fail 0`.

- [ ] **Step 3: Keep the reference copy and the current hub role file**

```bash
cp -r C:/Users/rafal/hub-dev/hub C:/Users/rafal/hub-dev/hub-before-plan-4
cat C:/Users/rafal/.claude/hub/CLAUDE.md | head -3
```

Expected for the second command: the first line is the comment written by hand during the Plan 3 acceptance (`<!-- Copy of C:/Users/rafal/.claude/skills/hub/role.md, inlined because …`). Task 5's install will replace this file and keep it as a backup.

---

### Task 1: The installer writes the hub role (P10)

Spec §4 (hub setup), §4.1, §9.1 row "Installer". `~/.claude/hub/CLAUDE.md` holds the text of `role.md` itself, because an `@` import was not expanded in a VS Code panel session (acceptance B3); the hub needs no name and no start flags.

**Files:**
- Modify: `lib/install.mjs`, `bin/install.mjs`, `SKILL.md` (front matter `description`)
- Test: `test/install.test.mjs`, `test/skill.test.mjs`

**Interfaces:**
- Consumes: `role.md` in the skill directory (unchanged); `backup(path)` and `hubDir` in `bin/install.mjs`.
- Produces: `HUB_ROLE_HEADER` (string) and `hubClaudeMd(role: string): string` in `lib/install.mjs`; the installer report line `hub CLAUDE.md: role unchanged | create <path> | role rewritten from role.md`.

- [ ] **Step 1: Write the failing tests**

In `test/install.test.mjs`:

```diff
@@ -5,5 +5,5 @@ import { writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
 import { join } from 'node:path';
 import { fileURLToPath } from 'node:url';
-import { mergeHooks, upsertRulesBlock, hookCommand, RULES_BEGIN, HOOK_EVENTS } from '../lib/install.mjs';
+import { mergeHooks, upsertRulesBlock, hookCommand, hubClaudeMd, RULES_BEGIN, HOOK_EVENTS } from '../lib/install.mjs';
 import { tempRoot } from './helpers.mjs';
 
@@ -58,4 +58,30 @@ test('install.mjs on a temporary claude dir: dry run writes nothing, a real run
 });
 
+test('install.mjs writes the hub role into hub/CLAUDE.md, leaves an identical one, rewrites a changed one (P10)', () => {
+  const claude = tempRoot();
+  const rolePath = join(claude, 'hub', 'CLAUDE.md');
+  const wanted = hubClaudeMd(readFileSync(new URL('../role.md', import.meta.url), 'utf8'));
+  assert.match(wanted, /^<!-- Written by the hub installer from the skill's role\.md/);
+  assert.match(wanted, /Hard rules, also when the skill is not loaded:/);
+  assert.equal(wanted.includes('\r'), false);
+
+  const dry = spawnSync(process.execPath, [INSTALL, '--claude-dir', claude, '--dry-run'], { encoding: 'utf8' });
+  assert.match(dry.stdout, /hub CLAUDE\.md: create .*CLAUDE\.md/);
+  assert.equal(existsSync(rolePath), false);
+
+  const real = spawnSync(process.execPath, [INSTALL, '--claude-dir', claude], { encoding: 'utf8' });
+  assert.equal(real.status, 0, real.stderr);
+  assert.equal(readFileSync(rolePath, 'utf8'), wanted);
+  assert.match(spawnSync(process.execPath, [INSTALL, '--claude-dir', claude], { encoding: 'utf8' }).stdout, /hub CLAUDE\.md: role unchanged/);
+
+  writeFileSync(rolePath, '@C:/Users/rafal/.claude/skills/hub/role.md\n', 'utf8');
+  const rewritten = spawnSync(process.execPath, [INSTALL, '--claude-dir', claude], { encoding: 'utf8' });
+  assert.match(rewritten.stdout, /hub CLAUDE\.md: role rewritten from role\.md/);
+  assert.equal(readFileSync(rolePath, 'utf8'), wanted);
+  const backups = readdirSync(join(claude, 'hub')).filter((name) => name.startsWith('CLAUDE.md.bak-hub-'));
+  assert.equal(backups.length, 1);
+  assert.equal(readFileSync(join(claude, 'hub', backups[0]), 'utf8'), '@C:/Users/rafal/.claude/skills/hub/role.md\n');
+});
+
 test('a malformed settings.json stops the installer before any write', () => {
   const dir = tempRoot();
```

In `test/skill.test.mjs`:

```diff
@@ -16,4 +16,11 @@ test('SKILL.md names the skill hub and every command it uses exists in the CLI u
 });
 
+test('SKILL.md describes the hub session without start flags (P10)', () => {
+  const description = read('../SKILL.md').split('\n').find((line) => line.startsWith('description: '));
+  assert.match(description, /working directory is ~\/\.claude\/hub/);
+  assert.match(description, /~\/\.claude\/hub\/CLAUDE\.md gives it the hub role/);
+  assert.doesNotMatch(description, /--append-system-prompt-file|--name hub/);
+});
+
 test('the role file carries the hard rules and points at the skill', () => {
   const role = read('../role.md');
```

- [ ] **Step 2: Run the tests to see them fail**

```bash
cd C:/Users/rafal/hub-dev/hub && node --test test/install.test.mjs test/skill.test.mjs 2>&1 | grep -E "^ℹ (pass|fail)|^✖|does not provide"
```

Expected: `SyntaxError: The requested module '../lib/install.mjs' does not provide an export named 'hubClaudeMd'` and the failing test "SKILL.md describes the hub session without start flags (P10)".

- [ ] **Step 3: Implement**

`lib/install.mjs`:

```diff
@@ -52,4 +52,13 @@ export function upsertRulesBlock(text, block = RULES_BLOCK) {
   return `${text.replace(/\s*$/, '')}\n\n${block}\n`;
 }
 
+// The hub session's role (spec §4 hub setup, P10): ~/.claude/hub/CLAUDE.md holds the text of the
+// skill's role.md itself, because an @import from outside that folder is not expanded in a VS Code
+// panel session (Plan 3 acceptance, B3).
+export const HUB_ROLE_HEADER = "<!-- Written by the hub installer from the skill's role.md (spec §4, P10). Edit role.md and reinstall. -->";
+
+export function hubClaudeMd(role) {
+  return `${HUB_ROLE_HEADER}\n\n${role.replace(/\r\n/g, '\n').replace(/\s*$/, '')}\n`;
+}
+
 export function copySkill(srcDir, destDir) {
   mkdirSync(destDir, { recursive: true });
```

`bin/install.mjs` (the role is read before the first write, so a missing `role.md` stops the installer before it changes anything):

```diff
@@ -5,12 +5,13 @@
 //   2. registers hub-hook.mjs for six events in <claude-dir>/settings.json (backup first)
 //   3. writes the global rules block into <claude-dir>/CLAUDE.md (backup first)
 //   4. creates <claude-dir>/hub/ with an empty project map (projects.json)
+//   5. writes <claude-dir>/hub/CLAUDE.md, the hub session's role, from role.md (backup first)
 // Every step is idempotent; --dry-run prints what would change and writes nothing.
 import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
 import { join, dirname, resolve } from 'node:path';
 import { homedir } from 'node:os';
 import { fileURLToPath } from 'node:url';
-import { hookCommand, mergeHooks, upsertRulesBlock, copySkill } from '../lib/install.mjs';
+import { hookCommand, mergeHooks, upsertRulesBlock, hubClaudeMd, copySkill } from '../lib/install.mjs';
 
 const argv = process.argv.slice(2);
 const dirIndex = argv.indexOf('--claude-dir');
@@ -36,6 +37,7 @@ try {
 }
 const claudeMdPath = join(claudeDir, 'CLAUDE.md');
 const before = existsSync(claudeMdPath) ? readFileSync(claudeMdPath, 'utf8') : '';
+const role = readFileSync(join(srcDir, 'role.md'), 'utf8');
 
 // 1. skill
 if (resolve(srcDir) === resolve(skillDir)) report.push(`skill: already running from ${skillDir}`);
@@ -69,4 +71,15 @@ if (!dryRun && !existsSync(projectsPath)) {
   writeFileSync(projectsPath, `${JSON.stringify({ projects: {} }, null, 2)}\n`, 'utf8');
 }
 
+// 5. the hub session's role
+const rolePath = join(hubDir, 'CLAUDE.md');
+const wanted = hubClaudeMd(role);
+const current = existsSync(rolePath) ? readFileSync(rolePath, 'utf8') : null;
+report.push(`hub CLAUDE.md: ${current === wanted ? 'role unchanged' : current === null ? `create ${rolePath}` : 'role rewritten from role.md'}`);
+if (!dryRun && current !== wanted) {
+  if (current !== null) backup(rolePath);
+  mkdirSync(hubDir, { recursive: true });
+  writeFileSync(rolePath, wanted, 'utf8');
+}
+
 console.log(`${dryRun ? '[dry run] ' : ''}${report.join('\n')}`);
```

`SKILL.md`, the front matter:

```diff
@@ -1,6 +1,6 @@
 ---
 name: hub
-description: Use in the hub session — the Claude Code session started with `claude --name hub --append-system-prompt-file <skill>/role.md` in ~/.claude/hub — to oversee Rafal's sessions in other projects: show the overview, react to watcher events, send approved direct commands and questionnaires, launch new sessions from the project map, start dialog forks, consult Codex, and track delivery. Not for project sessions themselves.
+description: Use in the hub session — a Claude Code session, in a VS Code panel or a terminal, whose working directory is ~/.claude/hub, where ~/.claude/hub/CLAUDE.md gives it the hub role — to oversee Rafal's sessions in other projects: show the overview, react to watcher events, send approved direct commands and questionnaires, launch new sessions from the project map, start dialog forks, consult Codex, and track delivery. Not for project sessions themselves.
 ---
```

- [ ] **Step 4: Run the tests to see them pass**

```bash
cd C:/Users/rafal/hub-dev/hub && node --test test/install.test.mjs test/skill.test.mjs 2>&1 | grep -E "^ℹ (pass|fail)" && node --test 2>&1 | grep -E "^ℹ (pass|fail)"
```

Expected: `ℹ pass 8`, `ℹ fail 0`; whole suite `ℹ pass 125`, `ℹ fail 0`.

---

### Task 2: Codex calls isolated from Rafal's Codex setup (P13)

Spec §7 step 3 and step 5, §8.2 row "Codex", §9.1 row "Codex thread". In the Plan 3 acceptance the `SessionStart` hooks of `~/.codex/hooks.json` turned the first answer into a review reminder, the `SessionEnd` backup hook ran after every call, and Rafal's MCP servers started on every call (B1).

**Files:**
- Modify: `lib/codex.mjs`, `bin/hub.mjs`, `SKILL.md` (Codex consultation, step 2)
- Test: `test/codex.test.mjs`

**Interfaces:**
- Consumes: `codexSetup()` in `test/codex.test.mjs`; `fakes/codex.mjs` (unchanged: it reads `resume` from `args[1]`, so the isolation arguments go after the existing options, before `--json`).
- Produces: `ISOLATED_FEATURES` (`['hooks', 'plugins', 'apps']`), `mcpServerNames(configText: string): string[]`, `isolationArgs(env = process.env): string[]`; `askArgs({ cwd, answerFile, isolation = [] })` and `followArgs({ threadId, answerFile, isolation = [] })`.

- [ ] **Step 1: Write the failing tests**

In `test/codex.test.mjs` (the CLI tests now set `CODEX_HOME`, so they never read the real `~/.codex/config.toml`):

```diff
@@ -6,8 +6,41 @@ import { join } from 'node:path';
 import { fileURLToPath } from 'node:url';
 import { tempRoot, ev } from './helpers.mjs';
-import { codexCommand, describeElement, runCodex, parseThreadId, REVIEWER_ROLE, DeniedError } from '../lib/codex.mjs';
+import { codexCommand, describeElement, runCodex, parseThreadId, mcpServerNames, isolationArgs, REVIEWER_ROLE, DeniedError } from '../lib/codex.mjs';
 
 const HUB = fileURLToPath(new URL('../bin/hub.mjs', import.meta.url));
 const FAKE = fileURLToPath(new URL('../fakes/codex.mjs', import.meta.url));
+const FEATURES_OFF = ['-c', 'features.hooks=false', '-c', 'features.plugins=false', '-c', 'features.apps=false'];
+// A config shaped like Rafal's ~/.codex/config.toml: two servers, one with an env subtable.
+const CONFIG = [
+  'notify = ["x.exe", "turn-ended"]',
+  '[projects."d:\\\\praca\\\\baza wiedzy"]',
+  'trust_level = "trusted"',
+  '[mcp_servers.n8n]',
+  'url = "http://localhost:5678/mcp-server/http"',
+  '[mcp_servers.node_repl] # computer use',
+  'command = "node_repl.exe"',
+  '[mcp_servers.node_repl.env]',
+  'CODEX_HOME = "C:\\\\Users\\\\rafal\\\\.codex"',
+  '[mcp_servers."my server"]',
+  "[mcp_servers.'lit server']",
+  '[mcp_servers."esc\\"aped"]',
+  '[mcp_servers.n8n]',
+].join('\r\n');
+
+function codexHome(config) {
+  const home = tempRoot();
+  if (config !== undefined) writeFileSync(join(home, 'config.toml'), config);
+  return home;
+}
+
+test('isolation (P13): hooks, plugins and apps off, every MCP server table of $CODEX_HOME/config.toml disabled', () => {
+  assert.deepEqual(mcpServerNames(CONFIG), ['n8n', 'node_repl', '"my server"', "'lit server'"]);
+  assert.deepEqual(isolationArgs({ CODEX_HOME: codexHome(CONFIG) }), [
+    ...FEATURES_OFF,
+    '-c', 'mcp_servers.n8n.enabled=false',
+    '-c', 'mcp_servers.node_repl.enabled=false',
+    '-c', 'mcp_servers."my server".enabled=false',
+    '-c', "mcp_servers.'lit server'.enabled=false",
+  ]);
+  assert.deepEqual(isolationArgs({ CODEX_HOME: codexHome() }), FEATURES_OFF);
+  assert.deepEqual(isolationArgs({ CODEX_HOME: codexHome('') }), FEATURES_OFF);
+});
 
 test('the codex command: the override, codex.js under APPDATA, or plain codex', () => {
@@ -59,5 +92,6 @@ function codexSetup() {
   writeFileSync(join(root, 'projects.json'), JSON.stringify({ projects: { baza: { name: 'Baza', dir: repo, description: 'x' } } }));
   const log = join(root, 'fake-codex.log');
-  const env = { ...process.env, HUB_DATA: root, HUB_CODEX_CMD: JSON.stringify([process.execPath, FAKE]), FAKE_CODEX_LOG: log };
+  // CODEX_HOME keeps the tests away from the real ~/.codex/config.toml.
+  const env = { ...process.env, HUB_DATA: root, HUB_CODEX_CMD: JSON.stringify([process.execPath, FAKE]), FAKE_CODEX_LOG: log, CODEX_HOME: codexHome('[mcp_servers.n8n]\nurl = "x"\n') };
   const hub = (args, input, extra = {}) => spawnSync(process.execPath, [HUB, ...args], { encoding: 'utf8', input, env: { ...env, ...extra } });
   const calls = () => readFileSync(log, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
@@ -72,5 +106,6 @@ test('codex ask, follow and note: read-only arguments, stdin, thread files', ()
   assert.equal(first.threadId, '01a136b7-2195-70d0-8cb4-81ac73919aa0');
   const [call1] = calls();
-  assert.deepEqual(call1.args, ['exec', '-s', 'read-only', '-C', repo, '--json', '-o', first.answerFile, '-']);
+  const isolation = [...FEATURES_OFF, '-c', 'mcp_servers.n8n.enabled=false'];
+  assert.deepEqual(call1.args, ['exec', '-s', 'read-only', '-C', repo, ...isolation, '--json', '-o', first.answerFile, '-']);
   assert.equal(call1.cwd.toLowerCase(), repo.toLowerCase());
   assert.match(call1.input, /^You are a reviewer/);
@@ -83,5 +118,5 @@ test('codex ask, follow and note: read-only arguments, stdin, thread files', ()
   const followed = JSON.parse(hub(['codex', 'follow', '--thread', first.thread, '--question-file', '-'], 'A testy?').stdout);
   const [, call2] = calls();
-  assert.deepEqual(call2.args, ['exec', 'resume', first.threadId, '-c', 'sandbox_mode="read-only"', '--json', '-o', followed.answerFile, '-']);
+  assert.deepEqual(call2.args, ['exec', 'resume', first.threadId, '-c', 'sandbox_mode="read-only"', ...isolation, '--json', '-o', followed.answerFile, '-']);
   assert.equal(call2.cwd.toLowerCase(), repo.toLowerCase());
   assert.equal(followed.n, 2);
```

- [ ] **Step 2: Run the tests to see them fail**

```bash
cd C:/Users/rafal/hub-dev/hub && node --test test/codex.test.mjs 2>&1 | grep -E "^ℹ (pass|fail)|does not provide"
```

Expected: `SyntaxError: The requested module '../lib/codex.mjs' does not provide an export named 'isolationArgs'`.

- [ ] **Step 3: Implement**

`lib/codex.mjs`:

```diff
@@ -1,9 +1,10 @@
 // The Codex consultation (spec §7): a read-only reviewer, one thread per element. The first call is
 // `codex exec -s read-only -C <dir>`, a follow-up `codex exec resume <id> -c sandbox_mode="read-only"`
-// run from <dir> (probe S9); prompts go on stdin, the answer to answer-<n>.md, stderr to
-// answer-<n>.err, where a write refusal appears.
+// run from <dir> (probe S9), both with the isolation overrides (P13); prompts go on stdin, the
+// answer to answer-<n>.md, stderr to answer-<n>.err, where a write refusal appears.
 import { spawnSync } from 'node:child_process';
 import { existsSync, readFileSync, writeFileSync } from 'node:fs';
 import { join } from 'node:path';
+import { homedir } from 'node:os';
 import { isDenied, excludePathspecs } from './denylist.mjs';
 import { isWithin } from './projects.mjs';
@@ -58,6 +59,30 @@ export function parseThreadId(stream) {
 }
 
-export const askArgs = ({ cwd, answerFile }) => ['exec', '-s', 'read-only', '-C', cwd, '--json', '-o', answerFile, '-'];
-export const followArgs = ({ threadId, answerFile }) => ['exec', 'resume', threadId, '-c', 'sandbox_mode="read-only"', '--json', '-o', answerFile, '-'];
+// Isolation from Rafal's Codex setup (spec §7 step 3, P13): his hooks put a review reminder into the
+// first answer and ran a backup after every call, and his MCP servers started on every call (Plan 3
+// acceptance, B1). Only the server table names are read from the config: bare keys, "basic" quoted
+// keys without escapes and 'literal' quoted keys. A name with escapes, or a server defined as a
+// dotted key under a plain [mcp_servers] table, is not found.
+export const ISOLATED_FEATURES = ['hooks', 'plugins', 'apps'];
+
+export function mcpServerNames(configText) {
+  const names = [];
+  for (const line of String(configText ?? '').split(/\r?\n/)) {
+    const match = /^\s*\[mcp_servers\.([A-Za-z0-9_-]+|"[^"\\]+"|'[^']+')\]\s*(#.*)?$/.exec(line);
+    if (match && !names.includes(match[1])) names.push(match[1]);
+  }
+  return names;
+}
+
+export function isolationArgs(env = process.env) {
+  const config = join(env.CODEX_HOME || join(homedir(), '.codex'), 'config.toml');
+  const servers = existsSync(config) ? mcpServerNames(readFileSync(config, 'utf8')) : [];
+  return [
+    ...ISOLATED_FEATURES.flatMap((feature) => ['-c', `features.${feature}=false`]),
+    ...servers.flatMap((name) => ['-c', `mcp_servers.${name}.enabled=false`]),
+  ];
+}
+
+export const askArgs = ({ cwd, answerFile, isolation = [] }) => ['exec', '-s', 'read-only', '-C', cwd, ...isolation, '--json', '-o', answerFile, '-'];
+export const followArgs = ({ threadId, answerFile, isolation = [] }) => ['exec', 'resume', threadId, '-c', 'sandbox_mode="read-only"', ...isolation, '--json', '-o', answerFile, '-'];
 
 // A failure is an exit code, a timeout or an empty answer; an `error` item in the stream is not
```

`bin/hub.mjs` (the arguments are computed per call, so a follow-up on a thread started before this plan is isolated too):

```diff
@@ -42,5 +42,5 @@ import { findDelivery, findMismatch, findLaunchDelivery, findLaunchMismatch, cla
 import { SLUG, newSessionArgs, runClaude, worktreeOf, launchChecks, findLaunched } from '../lib/launch.mjs';
 import { takeSnapshot, forkSettings, forkArgs, forkStartPrompt, fallbackCommand } from '../lib/dialog.mjs';
-import { describeElement, firstPrompt, askArgs, followArgs, runCodex, threadEntry } from '../lib/codex.mjs';
+import { describeElement, firstPrompt, askArgs, followArgs, isolationArgs, runCodex, threadEntry } from '../lib/codex.mjs';
 import { cleanup } from '../lib/retention.mjs';
 import { VERDICTS, recordJudgment } from '../lib/judgments.mjs';
@@ -382,5 +382,5 @@ switch (command) {
       const n = meta.calls + 1;
       const answerFile = join(thread, `answer-${n}.md`);
-      const outcome = runCodex({ args: followArgs({ threadId: meta.threadId, answerFile }), cwd: meta.cwd, input: question, answerFile, errFile: join(thread, `answer-${n}.err`) });
+      const outcome = runCodex({ args: followArgs({ threadId: meta.threadId, answerFile, isolation: isolationArgs() }), cwd: meta.cwd, input: question, answerFile, errFile: join(thread, `answer-${n}.err`) });
       writeFileSync(join(thread, 'meta.json'), `${JSON.stringify({ ...meta, calls: n }, null, 2)}\n`, 'utf8');
       appendFileSync(join(thread, 'thread.md'), threadEntry({ n, question, prompt: question, at, outcome }), 'utf8');
@@ -412,5 +412,5 @@ switch (command) {
     const prompt = firstPrompt({ question, elementText });
     const answerFile = join(thread, 'answer-1.md');
-    const outcome = runCodex({ args: askArgs({ cwd, answerFile }), cwd, input: prompt, answerFile, errFile: join(thread, 'answer-1.err') });
+    const outcome = runCodex({ args: askArgs({ cwd, answerFile, isolation: isolationArgs() }), cwd, input: prompt, answerFile, errFile: join(thread, 'answer-1.err') });
     const meta = { threadId: outcome.threadId, element, sessionId, cwd, project, createdAt: at, calls: 1 };
     writeFileSync(join(thread, 'meta.json'), `${JSON.stringify(meta, null, 2)}\n`, 'utf8');
```

`SKILL.md`, section "Codex consultation (spec §7)", step 2:

```diff
@@ -166,5 +166,7 @@ message is `held`, do not resend it.
 2. Run it in the background (Bash with `run_in_background: true`), the question on stdin:
    `HUB codex ask --session <id> --slug <slug> --last <id> --question-file - <<'EOF'` … `EOF`.
-   There is no "wyślij" step: Codex only reads.
+   There is no "wyślij" step: Codex only reads. The CLI runs Codex without Rafal's Codex hooks,
+   plugins, apps and MCP servers (spec §7, P13); an answer about something other than the question
+   (for example a review reminder) is assessed as off-topic, not as an answer.
 3. A refusal for a denylisted name, or for a file outside the repository and the hub data: ask
    Rafal; never paste or point at such a file another way.
```

- [ ] **Step 4: Run the tests to see them pass**

```bash
cd C:/Users/rafal/hub-dev/hub && node --test test/codex.test.mjs 2>&1 | grep -E "^ℹ (pass|fail)" && node --test 2>&1 | grep -E "^ℹ (pass|fail)"
```

Expected: `ℹ pass 8`, `ℹ fail 0`; whole suite `ℹ pass 126`, `ℹ fail 0`.

---

### Task 3: The watcher stops with its hub session (P14)

Spec §5.5 ("The watcher stops with its hub session"), §8.1 row "Hub session ended, its watcher still running", §9.1 row `hub-watch.js`. In the Plan 3 acceptance, closing a VS Code panel ended the hub's `claude.exe` but not the watcher `Monitor` had started; the orphan kept writing `watch-state.json` and took the transition the next hub's watcher should have reported (B2).

**Files:**
- Create: `lib/owner.mjs`, `test/owner.test.mjs`
- Modify: `bin/hub-watch.mjs` (whole file below), `SKILL.md` (Start, step 3)
- Test: `test/owner.test.mjs`, `test/watch.test.mjs`

**Interfaces:**
- Consumes: `hubRoot`, `registryDir`, `runPoll`, `appendPoll`, `buildOverview`, `snapshot`, `transitions`, `readWatchState`, `writeWatchState`, `errorReporter` (unchanged).
- Checks the owner twice per tick: first, so a dead owner's watcher does not even poll, and right before `writeWatchState`, because the owner may end while the overview is built (from the Codex review of this plan; spec §5.5 "before every write").
- Produces: `processTable({ env, platform, run }): { pid: number, ppid: number, name: string }[]`, `findOwner(table, pid): number | null`, `isAlive(pid): boolean` in `lib/owner.mjs`; watcher options `--owner-pid=<pid>` and `--owner-check-ms=<ms>`; env `HUB_PROCESS_TABLE` (JSON array in the `processTable` shape); the watcher lines `watcher: no claude process among its ancestors; it will not stop with the hub session` and `watcher stopped: its hub session (process <pid>) has ended`.

- [ ] **Step 1: Write the failing tests**

Create `test/owner.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { processTable, findOwner, isAlive } from '../lib/owner.mjs';

// The chain seen in the Plan 3 acceptance: Code.exe -> claude.exe -> bash -> bash -> node (watcher).
const TABLE = [
  { pid: 15096, ppid: 1, name: 'explorer.exe' },
  { pid: 36988, ppid: 15096, name: 'Code.exe' },
  { pid: 11508, ppid: 36988, name: 'claude.exe' },
  { pid: 42568, ppid: 11508, name: 'bash.exe' },
  { pid: 35248, ppid: 42568, name: 'bash.exe' },
  { pid: 21236, ppid: 35248, name: 'node.exe' },
];

test('findOwner: the nearest claude ancestor; none, a gap or a loop give null', () => {
  assert.equal(findOwner(TABLE, 21236), 11508);
  assert.equal(findOwner([...TABLE, { pid: 7, ppid: 21236, name: 'claude' }, { pid: 8, ppid: 7, name: 'node' }], 8), 7);
  assert.equal(findOwner(TABLE.filter((p) => p.name !== 'claude.exe'), 21236), null);
  // The orphan of the acceptance: its claude.exe (35508) is gone from the table.
  assert.equal(findOwner([{ pid: 14272, ppid: 34044, name: 'bash.exe' }, { pid: 34044, ppid: 35508, name: 'bash.exe' }, { pid: 14132, ppid: 14272, name: 'node.exe' }], 14132), null);
  assert.equal(findOwner([{ pid: 1, ppid: 2, name: 'a' }, { pid: 2, ppid: 1, name: 'b' }, { pid: 3, ppid: 1, name: 'node' }], 3), null);
  assert.equal(findOwner(TABLE, 999), null);
});

test('processTable: the override, PowerShell JSON (one process or several), ps output, failures', () => {
  assert.deepEqual(processTable({ env: { HUB_PROCESS_TABLE: JSON.stringify(TABLE) } }), TABLE);
  const several = JSON.stringify([{ ProcessId: 4, ParentProcessId: 0, Name: 'System' }, { ProcessId: 11508, ParentProcessId: 36988, Name: 'claude.exe' }]);
  let call;
  const win = processTable({ env: {}, platform: 'win32', run: (cmd, args) => { call = [cmd, ...args]; return { status: 0, stdout: several }; } });
  assert.deepEqual(win, [{ pid: 4, ppid: 0, name: 'System' }, { pid: 11508, ppid: 36988, name: 'claude.exe' }]);
  assert.equal(call[0], 'powershell.exe');
  assert.match(call.at(-1), /Get-CimInstance Win32_Process/);
  const one = JSON.stringify({ ProcessId: 4, ParentProcessId: 0, Name: 'System' });
  assert.deepEqual(processTable({ env: {}, platform: 'win32', run: () => ({ status: 0, stdout: one }) }), [{ pid: 4, ppid: 0, name: 'System' }]);
  const ps = '    1     0 init\n  200     1 /usr/local/bin/claude\n  300   200 node\n';
  assert.deepEqual(processTable({ env: {}, platform: 'linux', run: () => ({ status: 0, stdout: ps }) }), [
    { pid: 1, ppid: 0, name: 'init' }, { pid: 200, ppid: 1, name: 'claude' }, { pid: 300, ppid: 200, name: 'node' },
  ]);
  assert.deepEqual(processTable({ env: {}, platform: 'win32', run: () => ({ status: 1, stdout: '' }) }), []);
  assert.deepEqual(processTable({ env: {}, platform: 'win32', run: () => ({ status: 0, stdout: '{ broken' }) }), []);
});

test('isAlive: this process is alive, a finished one is not', () => {
  assert.equal(isAlive(process.pid), true);
  assert.equal(isAlive(2147483646), false);
});
```

In `test/watch.test.mjs` (the first test proves both halves: a live owner keeps the watcher reporting, a dead one stops it before it writes; the 10-second guard keeps the old watcher, which never exits, from hanging the run):

```diff
@@ -1,5 +1,5 @@
 import { test } from 'node:test';
 import assert from 'node:assert/strict';
-import { spawnSync } from 'node:child_process';
+import { spawnSync, spawn } from 'node:child_process';
 import { mkdirSync, appendFileSync, writeFileSync } from 'node:fs';
 import { join } from 'node:path';
@@ -65,4 +65,66 @@ test('the error reporter prints a repeated error once and again after a good tic
 });
 
+const waitFor = async (check, ms = 15000) => {
+  const end = Date.now() + ms;
+  while (!check()) {
+    if (Date.now() > end) throw new Error('timed out');
+    await new Promise((resolve) => setTimeout(resolve, 50));
+  }
+};
+
+test('a running watcher reports while its owner lives, then stops without writing its state (P14)', async () => {
+  const root = tempRoot();
+  mkdirSync(join(root, 'registry'), { recursive: true });
+  const log = join(root, 'registry', 'w1.events.jsonl');
+  const add = (event) => appendFileSync(log, `${JSON.stringify(event)}\n`);
+  const t = () => new Date().toISOString();
+  const env = { ...process.env, HUB_DATA: root };
+  add(ev('UserPromptSubmit', t(), { sessionId: 'w1', promptId: 'p1', sessionTitle: 'probe-a' }));
+  add(ev('Stop', t(), { sessionId: 'w1', promptId: 'p1', marker: null, lastFile: 'w1.last/a.md' }));
+  spawnSync(process.execPath, [WATCH, '--once', '--no-poll'], { env });
+
+  const owner = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 60000)']);
+  const watcher = spawn(process.execPath, [WATCH, '--no-poll', `--owner-pid=${owner.pid}`, '--owner-check-ms=100', '--interval-ms=600000'], { env });
+  let out = '';
+  watcher.stdout.on('data', (chunk) => { out += chunk; });
+  const exited = new Promise((resolve) => watcher.on('exit', resolve));
+  try {
+    await new Promise((resolve) => setTimeout(resolve, 1000));
+    add(ev('UserPromptSubmit', t(), { sessionId: 'w1', promptId: 'p2' }));
+    add(ev('Stop', t(), { sessionId: 'w1', promptId: 'p2', marker: null, lastFile: 'w1.last/b.md' }));
+    await waitFor(() => /turn ended: .* w1 probe-a/.test(out));
+
+    const ownerGone = new Promise((resolve) => owner.on('exit', resolve));
+    owner.kill();
+    await ownerGone;
+    add(ev('UserPromptSubmit', t(), { sessionId: 'w1', promptId: 'p3' }));
+    add(ev('Stop', t(), { sessionId: 'w1', promptId: 'p3', marker: null, lastFile: 'w1.last/c.md' }));
+    assert.equal(await Promise.race([exited, new Promise((resolve) => setTimeout(() => resolve('still running'), 10000))]), 0);
+  } finally {
+    owner.kill();
+    watcher.kill();
+  }
+  assert.match(out, new RegExp(`watcher stopped: its hub session \\(process ${owner.pid}\\) has ended`));
+  assert.equal(out.match(/turn ended/g).length, 1);
+  // The orphan wrote nothing, so the next watcher still reports the turn that ended after it.
+  assert.match(spawnSync(process.execPath, [WATCH, '--once', '--no-poll'], { encoding: 'utf8', env }).stdout, /^turn ended: .* w1 probe-a/m);
+});
+
+test('a running watcher without a claude ancestor says so once and keeps running (P14)', async () => {
+  const root = tempRoot();
+  mkdirSync(join(root, 'registry'), { recursive: true });
+  const watcher = spawn(process.execPath, [WATCH, '--no-poll'], { env: { ...process.env, HUB_DATA: root, HUB_PROCESS_TABLE: '[]' } });
+  let out = '';
+  watcher.stdout.on('data', (chunk) => { out += chunk; });
+  try {
+    await waitFor(() => out.includes('\n'));
+    await new Promise((resolve) => setTimeout(resolve, 300));
+    assert.equal(out, 'watcher: no claude process among its ancestors; it will not stop with the hub session\n');
+    assert.equal(watcher.exitCode, null);
+  } finally {
+    watcher.kill();
+  }
+});
+
 test('a re-armed watcher reports a turn that ended while it was down, also when the saved label was already "turn ended"', () => {
   const root = tempRoot();
```

- [ ] **Step 2: Run the tests to see them fail**

```bash
cd C:/Users/rafal/hub-dev/hub && node --test test/owner.test.mjs test/watch.test.mjs 2>&1 | grep -E "^ℹ (pass|fail)|^✖|Cannot find"
```

Expected: `Cannot find module …lib\owner.mjs`, and both new watcher tests fail (the first after about 10 seconds with `'still running'`, the second with `timed out` after 15 seconds); `ℹ pass 6`, `ℹ fail 3`.

- [ ] **Step 3: Implement**

Create `lib/owner.mjs`:

```js
// The watcher's owner (spec §5.5, P14): the nearest ancestor process named claude, so the watcher
// stops when the hub session that started it through Monitor has ended. Closing a VS Code panel
// ended the hub's claude.exe but not the watcher (Plan 3 acceptance, B2).
import { spawnSync } from 'node:child_process';

const OWNER_NAME = /^claude(\.exe)?$/i;
const WINDOWS_QUERY = 'Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,Name | ConvertTo-Json -Compress';

// One read of the process table as [{ pid, ppid, name }]; [] when it cannot be read.
// HUB_PROCESS_TABLE, a JSON array in that shape, replaces it for tests.
export function processTable({ env = process.env, platform = process.platform, run = spawnSync } = {}) {
  if (env.HUB_PROCESS_TABLE) return JSON.parse(env.HUB_PROCESS_TABLE);
  try {
    if (platform === 'win32') {
      const result = run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', WINDOWS_QUERY], { encoding: 'utf8', timeout: 30000, windowsHide: true, maxBuffer: 64 * 1024 * 1024 });
      if (result.status !== 0 || !result.stdout?.trim()) return [];
      // ConvertTo-Json prints a single process as an object, several as an array.
      return [JSON.parse(result.stdout)].flat().map((p) => ({ pid: p.ProcessId, ppid: p.ParentProcessId, name: String(p.Name ?? '') }));
    }
    const result = run('ps', ['-A', '-o', 'pid=,ppid=,comm='], { encoding: 'utf8', timeout: 30000 });
    if (result.status !== 0 || !result.stdout) return [];
    return result.stdout.split('\n')
      .map((line) => /^\s*(\d+)\s+(\d+)\s+(.+?)\s*$/.exec(line))
      .filter(Boolean)
      .map(([, pid, ppid, comm]) => ({ pid: Number(pid), ppid: Number(ppid), name: comm.split('/').pop() }));
  } catch {
    return [];
  }
}

// The nearest ancestor of `pid` named claude, or null. A loop in the table ends the walk.
export function findOwner(table, pid) {
  const byPid = new Map(table.map((p) => [p.pid, p]));
  const seen = new Set([pid]);
  let current = byPid.get(pid)?.ppid;
  while (current && !seen.has(current)) {
    seen.add(current);
    const entry = byPid.get(current);
    if (!entry) return null;
    if (OWNER_NAME.test(entry.name)) return entry.pid;
    current = entry.ppid;
  }
  return null;
}

// EPERM means the process exists but belongs to someone else.
export function isAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === 'EPERM';
  }
}
```

Replace the whole of `bin/hub-watch.mjs` (the options parsing changes too: every `--name=value` option is read by `value()`, the flags are the arguments without `=`):

```js
#!/usr/bin/env node
// The hub watcher (spec §5.5), started by the hub through Monitor. Prints one line per state
// transition. It reacts to registry file changes and, every interval, polls `claude agents --json`
// and rescans all event logs, so a missed file notification is reconciled at the next interval.
// The previous states live in watch-state.json, so a re-armed watcher reports what changed while
// no watcher ran. The first run ever only records the states and prints nothing. A watcher that
// keeps running stops, without writing its state, once the claude process that started it is gone
// (P14).
// Usage: node hub-watch.mjs [--once] [--no-poll] [--interval-ms=120000] [--owner-pid=<pid>] [--owner-check-ms=10000]
import { watch, mkdirSync } from 'node:fs';
import { hubRoot, registryDir } from '../lib/paths.mjs';
import { runPoll, appendPoll } from '../lib/polls.mjs';
import { buildOverview } from '../lib/overview.mjs';
import { snapshot, transitions, readWatchState, writeWatchState, errorReporter } from '../lib/watch.mjs';
import { processTable, findOwner, isAlive } from '../lib/owner.mjs';

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((arg) => !arg.includes('=')));
const value = (name) => argv.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
const intervalMs = Number(value('interval-ms') ?? 120000);
const once = flags.has('--once');
const root = hubRoot();
const errors = errorReporter((line) => console.log(line));

// Only a watcher that keeps running needs an owner; a single --once tick cannot outlive it.
let owner = null;
if (!once) {
  owner = value('owner-pid') ? Number(value('owner-pid')) : findOwner(processTable(), process.pid);
  if (!owner) console.log('watcher: no claude process among its ancestors; it will not stop with the hub session');
}

function stopIfOrphaned() {
  if (owner && !isAlive(owner)) {
    console.log(`watcher stopped: its hub session (process ${owner}) has ended`);
    process.exit(0);
  }
}

function tick(withPoll) {
  stopIfOrphaned();
  try {
    if (withPoll) appendPoll(root, runPoll());
    const next = snapshot(buildOverview(root).rows);
    const { state: prev, unreadable } = readWatchState(root);
    // The owner may have ended while the overview was built: check again right before the write.
    stopIfOrphaned();
    if (unreadable) console.log('watcher state unreadable; seeded again from the current overview');
    if (prev) for (const line of transitions(prev, next)) console.log(line);
    writeWatchState(root, next);
    errors.ok();
  } catch (error) {
    errors.fail(error.message);
  }
}

tick(!flags.has('--no-poll'));
if (!once) {
  mkdirSync(registryDir(root), { recursive: true });
  let pending = null;
  watch(registryDir(root), () => {
    clearTimeout(pending);
    pending = setTimeout(() => tick(false), 500);
  });
  setInterval(() => tick(!flags.has('--no-poll')), intervalMs);
  setInterval(stopIfOrphaned, Number(value('owner-check-ms') ?? 10000));
}
```

`SKILL.md`, section "Start (also after /clear)", step 3:

```diff
@@ -21,5 +21,8 @@ plain text or JSON; quote its output literally when Rafal decides on it. Talk to
 3. Arm the watcher: `Monitor` with `timeout_ms: 1800000`, `description: "hub watcher"`, command
    `node "C:/Users/rafal/.claude/skills/hub/bin/hub-watch.mjs"`. When its expiry notice arrives,
-   arm it again with the same parameters. The watcher's events are never Rafal's answers.
+   arm it again with the same parameters. The watcher's events are never Rafal's answers. The
+   watcher stops by itself when this session's `claude` process ends (spec §5.5, P14); if it
+   prints "watcher: no claude process among its ancestors", tell Rafal that it will outlive this
+   session until its `Monitor` timeout.
 
 ## A watcher event
```

- [ ] **Step 4: Run the tests to see them pass**

```bash
cd C:/Users/rafal/hub-dev/hub && node --test test/owner.test.mjs test/watch.test.mjs 2>&1 | grep -E "^ℹ (pass|fail)" && node --test 2>&1 | grep -E "^ℹ (pass|fail)"
```

Expected: `ℹ pass 11`, `ℹ fail 0`; whole suite `ℹ pass 131`, `ℹ fail 0`.

- [ ] **Step 5: The real process table on this machine (read-only)**

```bash
cd C:/Users/rafal/hub-dev/hub && node --input-type=module -e "import { processTable, findOwner } from './lib/owner.mjs'; const t = processTable(); const o = findOwner(t, process.pid); console.log(JSON.stringify({ processes: t.length, owner: o, name: t.find((p) => p.pid === o)?.name }));"
```

Expected, when run from a Claude Code session's Bash: `"name":"claude.exe"` and an `owner` equal to that session's `pid` in `claude agents --json`. From a plain Git Bash tab: `"owner":null`, which is the no-owner path.

---

### Task 4: The header line in local time (P15)

Spec §5.6, §6.1, §9.1 row "Prompt template and answer message". In the Plan 3 acceptance a header said `2026-10-15 19:15` (UTC) while its own Kontekst quoted "z 21:11" (local) (B6).

**Files:**
- Modify: `lib/text.mjs`, `lib/overview.mjs`, `lib/compose.mjs`
- Test: `test/send.test.mjs`

**Interfaces:**
- Consumes: `localTime(iso, offsetMinutes)` (moves unchanged from `lib/overview.mjs`; `test/overview.test.mjs` keeps importing it from there).
- Produces: `localTime` exported by `lib/text.mjs` and re-exported by `lib/overview.mjs`; `headerLine({ …, at, offsetMinutes })` and `composeMessage({ …, at, offsetMinutes, body })`, where an absent `offsetMinutes` means the machine's offset at `at`.

- [ ] **Step 1: Write the failing test**

In `test/send.test.mjs`:

```diff
@@ -5,5 +5,5 @@ import { runChecks, gitInfo } from '../lib/checks.mjs';
 import { findDelivery, classifyNotice, applyNotice } from '../lib/confirm.mjs';
 import { shownState, renderJournal } from '../lib/journal.mjs';
-import { sha256 } from '../lib/text.mjs';
+import { sha256, localTime } from '../lib/text.mjs';
 
 const AT = '2026-10-14T10:00:00.000Z';
@@ -14,6 +14,10 @@ const answers = composeMessage({
 });
 
-test('the header line opens every message and is part of the approved text', () => {
-  assert.match(answers, /^\[hub · questionnaire-answers · sandbox · abcdef12 · 2026-10-14 10:00\]\n\n\*\*Cel\*\*/);
+test('the header line opens every message, shows local time and is part of the approved text (P15)', () => {
+  const at = (offsetMinutes) => composeMessage({ path: 'direct', project: 'sandbox', sessionId: 'abcdef123456', at: AT, offsetMinutes, body: FIVE });
+  assert.match(at(120), /^\[hub · direct · sandbox · abcdef12 · 2026-10-14 12:00\]\n\n\*\*Cel\*\*/);
+  assert.match(at(-90), /^\[hub · direct · sandbox · abcdef12 · 2026-10-14 08:30\]/);
+  // Without an offset the machine's time zone decides, as in the overview.
+  assert.match(answers, new RegExp(`^\\[hub · questionnaire-answers · sandbox · abcdef12 · ${localTime(AT).slice(0, 16)}\\]\\n\\n\\*\\*Cel\\*\\*`));
   assert.throws(() => composeMessage({ path: 'other', project: 'p', sessionId: 's', at: AT, body: 'x' }), /unknown path/);
 });
```

- [ ] **Step 2: Run the test to see it fail**

```bash
cd C:/Users/rafal/hub-dev/hub && node --test test/send.test.mjs 2>&1 | grep -E "^ℹ (pass|fail)|does not provide"
```

Expected: `SyntaxError: The requested module '../lib/text.mjs' does not provide an export named 'localTime'`.

- [ ] **Step 3: Implement**

`lib/text.mjs`:

```diff
@@ -42,4 +42,12 @@ export function markerText(message) {
 }
 
+// Event times are UTC; the overview (finding A2) and the header line of a composed message (P15)
+// show them in local time. The offset is a parameter so tests do not depend on the time zone.
+export function localTime(iso, offsetMinutes = iso ? -new Date(iso).getTimezoneOffset() : 0) {
+  const ms = Date.parse(iso ?? '');
+  if (Number.isNaN(ms)) return String(iso ?? '');
+  return new Date(ms + offsetMinutes * 60000).toISOString().slice(0, 19).replace('T', ' ');
+}
+
 export function summarize(message, max = 200) {
   const oneLine = String(message ?? '').replace(/\s+/g, ' ').trim();
```

`lib/overview.mjs`:

```diff
@@ -10,4 +10,5 @@ import { refreshHubSessions } from './hubsessions.mjs';
 import { readJudgments, judgmentFor } from './judgments.mjs';
 import { resolveTitles } from './titles.mjs';
+import { localTime } from './text.mjs';
 
 const DAY_MS = 24 * 60 * 60 * 1000;
@@ -76,11 +77,5 @@ export function buildOverview(root, { now = Date.now(), commonDirOf = gitCommonD
 const cell = (value) => String(value ?? '').replace(/\|/g, '\\|').replace(/\s+/g, ' ');
 
-// Event times are UTC; the overview shows them in local time (finding A2). The offset is a
-// parameter so tests do not depend on the machine's time zone.
-export function localTime(iso, offsetMinutes = iso ? -new Date(iso).getTimezoneOffset() : 0) {
-  const ms = Date.parse(iso ?? '');
-  if (Number.isNaN(ms)) return String(iso ?? '');
-  return new Date(ms + offsetMinutes * 60000).toISOString().slice(0, 19).replace('T', ' ');
-}
+export { localTime };
 
 export function renderOverview({ rows, pollError, configErrors }) {
```

`lib/compose.mjs`:

```diff
@@ -1,5 +1,5 @@
 // Messages the hub sends (spec §6.1, §6.4): the origin header line, the fixed questionnaire request
 // and the prompt template check. User-facing text stays in Polish.
-import { canonical } from './text.mjs';
+import { canonical, localTime } from './text.mjs';
 
 export const PATHS = ['direct', 'questionnaire-request', 'questionnaire-answers', 'dialog', 'new-session'];
@@ -12,6 +12,7 @@ const HEADER_PREFIX = '[hub · ';
 // `target` names the recipient: the first 8 characters of its sessionId, or the name of a session
 // still to be launched (spec §6.6). `origin` names the dialog directory a prompt came from (§6.1).
-export function headerLine({ path, project, sessionId, target, origin, at }) {
-  return `${HEADER_PREFIX}${path} · ${project} · ${target ?? String(sessionId).slice(0, 8)} · ${at.slice(0, 16).replace('T', ' ')}${origin ? ` · ${origin}` : ''}]`;
+// The time is local, like the times the message body quotes (P15).
+export function headerLine({ path, project, sessionId, target, origin, at, offsetMinutes }) {
+  return `${HEADER_PREFIX}${path} · ${project} · ${target ?? String(sessionId).slice(0, 8)} · ${localTime(at, offsetMinutes).slice(0, 16)}${origin ? ` · ${origin}` : ''}]`;
 }
 
@@ -39,7 +40,7 @@ export function questionnaireRequest({ topic, max }) {
 }
 
-export function composeMessage({ path, project, sessionId, target, origin, at, body }) {
+export function composeMessage({ path, project, sessionId, target, origin, at, offsetMinutes, body }) {
   if (!PATHS.includes(path)) throw new Error(`unknown path ${path}; expected one of ${PATHS.join(', ')}`);
-  return `${headerLine({ path, project, sessionId, target, origin, at })}\n\n${canonical(body)}\n`;
+  return `${headerLine({ path, project, sessionId, target, origin, at, offsetMinutes })}\n\n${canonical(body)}\n`;
 }
 
```

`approve --path new-session` reads the header's fourth `·` field (the target), which this change does not touch; `test/dialog.test.mjs` matches the time with `\d{4}-\d{2}-\d{2} \d{2}:\d{2}` and stays as it is.

- [ ] **Step 4: Run the tests to see them pass**

```bash
cd C:/Users/rafal/hub-dev/hub && node --test test/send.test.mjs test/overview.test.mjs test/dialog.test.mjs 2>&1 | grep -E "^ℹ (pass|fail)" && node --test 2>&1 | grep -E "^ℹ (pass|fail)"
```

Expected: `ℹ fail 0` for the three files; whole suite `ℹ pass 131`, `ℹ fail 0`.

- [ ] **Step 5: The whole development tree against the reference copy**

```bash
diff -ruN C:/Users/rafal/hub-dev/hub-before-plan-4 C:/Users/rafal/hub-dev/hub | grep -E "^diff " 
```

Expected: exactly these files: `SKILL.md`, `bin/hub-watch.mjs`, `bin/hub.mjs`, `bin/install.mjs`, `lib/codex.mjs`, `lib/compose.mjs`, `lib/install.mjs`, `lib/overview.mjs`, `lib/owner.mjs`, `lib/text.mjs`, `test/codex.test.mjs`, `test/install.test.mjs`, `test/owner.test.mjs`, `test/send.test.mjs`, `test/skill.test.mjs`, `test/watch.test.mjs`.

---

### Task 5: Installation (with Rafal)

The install writes into `~/.claude/`. It runs only after Rafal says so in the conversation; in Plan 3 he asked the controller to run it, and the dry run comes first either way.

- [ ] **Step 1: Ask Rafal, with the explanation and the undo**

Show him the two commands below and what each changes: the dry run writes nothing; the real run copies the dev tree over `~/.claude/skills/hub/` (new `lib/owner.mjs`, `test/owner.test.mjs`, the changed files of Tasks 1–4), adds no hooks, leaves the rules block and `projects.json` alone, and rewrites `~/.claude/hub/CLAUDE.md` from `role.md`, keeping the hand-written file of the Plan 3 acceptance as `CLAUDE.md.bak-hub-<stamp>`. Undo: `node C:/Users/rafal/hub-dev/hub-before-plan-4/bin/install.mjs`, then `rm C:/Users/rafal/.claude/skills/hub/lib/owner.mjs C:/Users/rafal/.claude/skills/hub/test/owner.test.mjs`, and copy the backup back over `~/.claude/hub/CLAUDE.md`. End the turn with the gate marker and wait.

```bash
node C:/Users/rafal/hub-dev/hub/bin/install.mjs --dry-run
node C:/Users/rafal/hub-dev/hub/bin/install.mjs
```

Expected output of the real run:

```
skill: copy C:\Users\rafal\hub-dev\hub -> C:\Users\rafal\.claude\skills\hub
settings.json: 0 hook entries added (node "C:/Users/rafal/.claude/skills/hub/bin/hub-hook.mjs")
CLAUDE.md: rules block unchanged
hub data: projects.json present
hub CLAUDE.md: role rewritten from role.md
```

- [ ] **Step 2: Verify (read-only)**

```bash
diff -rq C:/Users/rafal/hub-dev/hub C:/Users/rafal/.claude/skills/hub
cd C:/Users/rafal/.claude/skills/hub && node --test 2>&1 | grep -E "^ℹ (pass|fail)"
node --input-type=module -e "import { hubClaudeMd } from 'file:///C:/Users/rafal/.claude/skills/hub/lib/install.mjs'; import { readFileSync } from 'node:fs'; console.log(readFileSync('C:/Users/rafal/.claude/hub/CLAUDE.md', 'utf8') === hubClaudeMd(readFileSync('C:/Users/rafal/.claude/skills/hub/role.md', 'utf8')));"
ls C:/Users/rafal/.claude/hub/ | grep "CLAUDE.md.bak-hub-"
```

Expected: no `diff` output; `ℹ pass 131`, `ℹ fail 0`; `true`; one backup name.

- [ ] **Step 3: The hub picks up the new skill**

Rafal closes the hub's panel and opens a new Claude conversation in the VS Code window of `C:\Users\rafal\.claude\hub`, then types `kim jesteś?`. The watcher of the closed hub should stop within about 10 seconds (Task 6 checks it).

---

### Task 6: Acceptance with Rafal

Spec §9.3, "Plan 4's acceptance". One trial session `probe-a` in `C:\Users\rafal\hub-probes\repo` (outside the map, so its threads land under `projects/repo/`).

**Files:**
- Create: `D:/Notatki/notatki/.claude/specs/2026-10-16-orchestrator-hub-plan-4-acceptance.md`
- Modify: `D:/Notatki/notatki/.claude/specs/2026-10-13-orchestrator-hub-design.md` (status line, §10 row "Plan 4")

- [ ] **Step 1: Trial session**

Rafal, in a Git Bash tab: `cd "C:/Users/rafal/hub-probes/repo" && claude --name probe-a`, then sends `Przeczytaj README i streść je jednym zdaniem.`

- [ ] **Step 2: P10 — the role in the first turn of a panel hub**

After Task 5 Step 3, the controller reads the new hub's transcript (read-only; replace `<id>` with the new hub `sessionId` from `claude agents --json`, the session whose `cwd` is `c:\Users\rafal\.claude\hub`):

```bash
node -e "const L=require('fs').readFileSync(process.argv[1],'utf8').split('\n').filter(Boolean).map(l=>{try{return JSON.parse(l)}catch{return null}}).filter(Boolean); for(const o of L){if(o.type==='attachment'&&o.attachment?.type==='instructions')for(const f of o.attachment.files)console.log(f.type,f.path,f.content.length,/Hard rules/.test(f.content)); if(o.type==='assistant')for(const x of o.message?.content||[])if(x.type==='tool_use'){console.log('first tool:',x.name,JSON.stringify(x.input).slice(0,80));process.exit(0)}}" C:/Users/rafal/.claude/projects/C--Users-rafal--claude-hub/<id>.jsonl
```

Expected: a line `Project c:\Users\rafal\.claude\hub\CLAUDE.md <length> true`, and the first tool is `Skill` with `{"skill":"hub"}`, not a `Read` of `role.md`.

- [ ] **Step 3: P14 — the closed hub's watcher stops**

Right after Rafal closed the old hub (Task 5 Step 3), and again after the new hub armed its watcher:

```bash
powershell.exe -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object { \$_.CommandLine -like '*hub-watch*' } | Select-Object ProcessId, CreationDate | Format-Table -AutoSize"
```

Expected: about 10 seconds after the old panel closed, no `hub-watch` process; after the new hub's `start`, exactly one. Then Rafal closes the new hub's panel too, sends `Napisz jedno zdanie o rzece.` in `probe-a`, waits for the turn to end, opens a new hub conversation and types `start`. Expected: the new hub's watcher reports `turn ended` for `probe-a` (quote the hub's line).

- [ ] **Step 4: P13 — Codex without Rafal's hooks and MCP servers**

Before: `ls -la --time-style=+%FT%T C:/Users/rafal/.claude/hooks/powtorki-last-check.txt`. Rafal in the hub: `odbij od Codexa ostatni wynik probe-a: czy jest kompletny?`. Expected: the answer is about `probe-a`'s result (no review reminder); in the new thread under `C:/Users/rafal/.claude/hub/projects/repo/codex/`, `grep -c rmcp answer-1.err` gives `0`; the time of `powtorki-last-check.txt` is unchanged.

- [ ] **Step 5: P15 — local time in the header**

Rafal in the hub: `sesja probe-a: napisz jedno zdanie o morzu`. Expected: the draft's header ends with the local time of composing (compare with the clock); `wyślij` is up to Rafal.

- [ ] **Step 6: Close and record**

Ask Rafal to `/exit` `probe-a`. Write the acceptance report in the shape of the Plan 3 report: per step the expected and the observed result, quoted from the hub tab, the CLI or the transcript, and a verdict; any failure becomes a finding for Rafal. In the spec, set the status line to "Plan 4 done and accepted" and the §10 row "Plan 4" to **Done** with the date and the test count. Commit and push the two vault files by the vault's rule (branch `main` checked first), and propose the commit message for `~/.claude` (not a repository with its own commit rule):

```
feat(hub): plan 4 — role file installed, Codex isolated, watcher owner, local header time
```
