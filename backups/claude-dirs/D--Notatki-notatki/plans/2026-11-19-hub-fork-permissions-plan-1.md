# Hub fork permissions — Implementation Plan 1

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The `/talk` voice fork and the hub's written dialog fork can write into their dialog directories again, the repository stays write-protected, and a refused write shows up in the `/talk` closing report.

**Architecture:** Both forks' `--settings` files replace the relative deny `Edit(./**)` with the absolute deny `Edit(<posixPath(cwd)>/**)`; `posixPath` moves to `hub/lib/paths.mjs` and serves both forks. `startFork` collects the `permission_denials` of the fork's `result` lines, and the closing report prints them on a new `denied:` line. A live probe script checks four working-directory layouts with real `claude -p` calls.

**Tech Stack:** Node.js ESM (`.mjs`), `node:test`, Claude Code CLI 2.1.328 (`claude -p`), Windows paths.

**Spec:** [2026-11-19-hub-fork-permissions-design.md](../specs/2026-11-19-hub-fork-permissions-design.md)

## Global Constraints

- Code: `C:/Users/rafal/.claude/skills/talk` and `C:/Users/rafal/.claude/skills/hub`. Changes there land in the automatic `backup: sync` commits of `~/.claude`: no manual commit, no push.
- Vault files (this plan, spec amendments, `projects/hub.md`): the vault's rule — commit and push after each finished change, only this session's paths, branch `main`, `git diff --cached --name-only` checked first.
- The voice fork keeps `--restricted`, `--tools Read,Grep,Glob,Edit,Write`, `--strict-mcp-config`, `--permission-mode default` (`talk/lib/fork.mjs:15`).
- Deny rule form: `Edit(<posixPath(resolve(cwd))>/**)`, e.g. `Edit(//d/Praca/Devstock/Baza wiedzy/**)`; spaces kept, drive letter lower-cased.
- No rule in either fork's settings may start with `Edit(./`.
- Live probes call only `claude -p --model haiku`; no ElevenLabs call except Rafal's own acceptance run (Task 6).
- Probes never write into a real repository and delete nothing.
- Baseline before Task 1 (run 2026-11-19): `talk` 185 tests, 184 pass, 1 fail — `the shipped config allows notatki and .claude and stores dialogs outside ~/.claude` (`talk/test/config.test.mjs`, expects the allowlist to equal `['notatki', '.claude']`, the shipped `config.json` has five keys since Rafal extended it). Task 1 Step 0 fixes that test, so from then on both suites pass in full (spec §6.1). `hub` 465 tests, all pass.
- Test commands: `node --test test/*.test.mjs`, run in the skill directory.

## Review Focus

1. A working directory with a space (`D:\Praca\Devstock\Baza wiedzy`): the deny must keep the space and still match — pinned by the unit test in Task 2 and the `d-space` layout of the probe in Task 5.
2. A worktree working directory (`…\.claude\worktrees\<name>`): the deny covers the worktree; a write into it must be refused — `d-worktree` layout in Task 5 (records the exact refusal message).
3. A `permission_denials` entry without `file_path` (a refused non-file tool): the report must still name it — test in Task 3.
4. The same refused path in two turns: listed once — test in Task 3.
5. A dialog root inside the session's working directory: `check` and `start` refuse in Polish before anything is created — test in Task 2.

---

### Task 1: Shared `posixPath` and the hub fork's settings

**Files:**
- Modify: `hub/lib/paths.mjs` (add `posixPath`)
- Modify: `hub/lib/dialog.mjs:29-33` (`forkSettings`)
- Modify: `hub/bin/hub.mjs:493,498`
- Modify: `talk/lib/settings.mjs:6-9` (import and re-export instead of the local definition)
- Test: `hub/test/dialog.test.mjs:68-70,116`, `talk/test/config.test.mjs` (Step 0)

**Interfaces:**
- Produces: `posixPath(winPath: string): string` in `hub/lib/paths.mjs` (body moved unchanged from `talk/lib/settings.mjs:7-9`); `talk/lib/settings.mjs` keeps exporting `posixPath` (`export { posixPath } from '../../hub/lib/paths.mjs'` plus an import for its own use), so `talk/test/settings.test.mjs:6` stays valid.
- Produces: `forkSettings(dialogDir: string, cwd: string): { permissions: { allow: string[], deny: string[] } }`.

- [ ] **Step 0: Fix the stale allowlist assertion in `talk/test/config.test.mjs`**

The test keeps its intent (the shipped config allows `notatki` and `.claude` and stores dialogs outside `~/.claude`) but checks inclusion instead of equality, so Rafal's later additions to `allow` do not break it: `assert.ok(['notatki', '.claude'].every((key) => config.allow.includes(key)))` in place of the `deepEqual` on `allow`. The test name stays. Run (in `talk`): `node --test test/*.test.mjs` — Expected: 185 pass, 0 fail.

- [ ] **Step 1: Update the failing tests in `hub/test/dialog.test.mjs`**

```js
// line 69-70, test 'fork settings, argument order and start prompt'
const settings = forkSettings('C:\\Users\\rafal\\.claude\\hub\\projects\\app\\dialogs\\2026-10-14-wynik', 'D:\\Praca\\Devstock\\Baza wiedzy');
assert.deepEqual(settings, { permissions: {
  allow: ['Edit(//c/Users/rafal/.claude/hub/projects/app/dialogs/2026-10-14-wynik/**)'],
  deny: ['Edit(//d/Praca/Devstock/Baza wiedzy/**)', 'Bash', 'EnterWorktree'] } });

// line 116, test 'dialog start resolves the source by name, …'
assert.deepEqual(JSON.parse(readFileSync(join(out.dialogDir, 'fork-settings.json'), 'utf8')).permissions.deny,
  [`Edit(${posixPath(repo)}/**)`, 'Bash', 'EnterWorktree']);
```

Import `posixPath` from `../lib/paths.mjs` in the test file.

- [ ] **Step 2: Run and see them fail**

Run (in `hub`): `node --test test/dialog.test.mjs`
Expected: FAIL in both tests (allow still `//C:/…`, deny still `Edit(./**)`; `posixPath` not exported by `paths.mjs`).

- [ ] **Step 3: Implement**

Move `posixPath` to `hub/lib/paths.mjs`; `forkSettings(dialogDir, cwd)` returns allow `` `Edit(${posixPath(resolve(dialogDir))}/**)` `` and deny `` [`Edit(${posixPath(resolve(cwd))}/**)`, 'Bash', 'EnterWorktree'] ``; `hub/bin/hub.mjs:498` passes `cwd`; the comment at `hub/bin/hub.mjs:493` reads that the fork's settings deny edits under its cwd by the absolute rule `Edit(<cwd>/**)`. `talk/lib/settings.mjs` imports and re-exports `posixPath`.

- [ ] **Step 4: Run both suites**

Run (in `hub`): `node --test test/*.test.mjs` — Expected: 465 pass, 0 fail.
Run (in `talk`): `node --test test/*.test.mjs` — Expected: all pass, 0 fail.

---

### Task 2: Voice fork settings and the dialog-root check

**Files:**
- Modify: `talk/lib/settings.mjs:11-25`
- Modify: `talk/lib/dialog.mjs:21-25` (`prepareDialog`)
- Modify: `talk/test/live/boundary.mjs:89`
- Modify: `talk/bin/talk.mjs:15,31-36,152-166` (import `isWithin`, new message, check in `admit`)
- Test: `talk/test/settings.test.mjs`, `talk/test/cli.test.mjs`

**Interfaces:**
- Consumes: `posixPath` (Task 1); `isWithin(child, root)` from `hub/lib/projects.mjs:20`; `dialogDirFor({ root, projectKey, now })` from `talk/lib/dialog.mjs:13`.
- Produces: `voiceForkSettings(dialogDir: string, cwd: string)`, `writeVoiceForkSettings(dialogDir: string, cwd: string): string` (path of `fork-settings.json` in `dialogDir`). Deny order: `` `Edit(${posixPath(resolve(cwd))}/**)` ``, `'Bash'`, `'EnterWorktree'`, then the `Read(**/<glob>)` denies as today.

- [ ] **Step 1: Write the failing tests in `talk/test/settings.test.mjs`**

```js
test('the fork may edit only the dialog directory and reads no secret', () => {
  const s = voiceForkSettings('C:/Users/rafal/hub-data/projects/notatki/dialogs/2026-10-21-1015-talk', 'D:\\Notatki\\notatki');
  assert.deepEqual(s.permissions.allow, ['Edit(//c/Users/rafal/hub-data/projects/notatki/dialogs/2026-10-21-1015-talk/**)']);
  assert.deepEqual(s.permissions.deny, ['Edit(//d/Notatki/notatki/**)', 'Bash', 'EnterWorktree', 'Read(**/.env*)', 'Read(**/*.pem)',
    'Read(**/*.key)', 'Read(**/*credentials*)', 'Read(**/*secret*)', 'Read(**/auth.json)', 'Read(**/secrets.yaml)']);
});

test('a working directory with a space keeps it in the deny rule, and no rule is relative', () => {
  const s = voiceForkSettings('C:\\Users\\rafal\\hub-data\\d', 'D:\\Praca\\Devstock\\Baza wiedzy');
  assert.equal(s.permissions.deny[0], 'Edit(//d/Praca/Devstock/Baza wiedzy/**)');
  assert.ok([...s.permissions.allow, ...s.permissions.deny].every((rule) => !rule.includes('(./')));
});
```

The existing tests `a dialog directory with spaces keeps them in the allow rule` and `writeVoiceForkSettings writes fork-settings.json into the dialog directory` get a second argument (`'D:\\repo'`, and `cwd` passed to both `writeVoiceForkSettings` and `voiceForkSettings`).

- [ ] **Step 2: Write the failing test in `talk/test/cli.test.mjs`**

```js
test('check and start refuse a dialog root inside the working directory, in one Polish sentence, creating nothing', () => {
  const inside = join(allowedRepo, 'talk-dialogs');
  const env = { ELEVENLABS_API_KEY: 'k', TALK_CONFIG: tmpConfig({ ...startBase, dialogRoot: inside }) };
  for (const args of [['check', '--cwd', allowedRepo], ['start', '--session', 's', '--cwd', allowedRepo]]) {
    const r = run(args, env);
    assert.equal(r.status, 2, r.stdout + r.stderr);
    assert.match(r.stdout, /^Katalog rozmów .+ leży wewnątrz katalogu roboczego .+\.$/m);
    assert.equal(r.stdout.trim().split('\n').length, 1);
    assert.equal(existsSync(inside), false);
  }
});
```

- [ ] **Step 3: Run and see them fail**

Run (in `talk`): `node --test test/settings.test.mjs test/cli.test.mjs`
Expected: FAIL — deny still `Edit(./**)`; `check` exits 0 for the dialog root inside the repository.

- [ ] **Step 4: Implement**

- `voiceForkSettings` / `writeVoiceForkSettings` as in Interfaces; `prepareDialog` passes its `cwd`; `boundary.mjs:89` passes `REPO`.
- `talk/bin/talk.mjs`: message `` const dialogInsideCwd = (root, cwd, configPath) => `Katalog rozmów ${root} leży wewnątrz katalogu roboczego ${cwd}, do którego fork nie może zapisywać: przenieś dialogRoot w ${configPath} poza ten katalog.` ``; in `admit`, right after the allowlist check: `if (isWithin(dialogDirFor({ root: config.dialogRoot, projectKey: key, now: new Date() }), cwd)) return { ok: false, line: dialogInsideCwd(config.dialogRoot, cwd, configPath) };`.

- [ ] **Step 5: Run the suite**

Run (in `talk`): `node --test test/*.test.mjs`
Expected: all pass, 0 fail.

---

### Task 3: Denial collection in `startFork`

**Files:**
- Modify: `talk/lib/fork.mjs:20-93`
- Modify: `talk/fakes/claude.mjs:33` (the `result` line)
- Test: `talk/test/fork.test.mjs`

**Interfaces:**
- Produces: the object returned by `startFork` gains `denials(): string[]` — every entry of every `result` line's `permission_denials`, as `` `${tool_name} ${tool_input?.file_path ?? JSON.stringify(tool_input ?? {})}` ``, first-seen order, no duplicates.
- Fake: env `FAKE_DENY` — a JSON array copied verbatim as `permission_denials` into every non-empty `result` line the fake prints.

- [ ] **Step 1: Write the failing tests in `talk/test/fork.test.mjs`**

```js
test('denials lists each refused call once, as tool and path, or tool and input', async () => {
  const deny = [{ tool_name: 'Write', tool_use_id: 'u1', tool_input: { file_path: 'C:\\d\\decisions.md', content: 'x' } },
    { tool_name: 'Bash', tool_use_id: 'u2', tool_input: { command: 'ls' } }];
  const f = startFork({ ...base, startPrompt: 'start', env: { FAKE_DENY: JSON.stringify(deny) } });
  await f.ready;
  await f.ask('drugie');
  await f.close();
  assert.deepEqual(f.denials(), ['Write C:\\d\\decisions.md', 'Bash {"command":"ls"}']);
});

test('a fork without refusals has no denials', async () => {
  const f = startFork({ ...base, startPrompt: 'start' });
  await f.ready;
  await f.close();
  assert.deepEqual(f.denials(), []);
});
```

- [ ] **Step 2: Run and see them fail**

Run (in `talk`): `node --test test/fork.test.mjs`
Expected: FAIL with `f.denials is not a function`.

- [ ] **Step 3: Implement**

In the stdout line handler of `startFork` (the `try` block that already parses each line), read `msg.permission_denials` when `msg.type === 'result'` and it is an array; keep a `Set` of the formatted strings. The fake adds `permission_denials: JSON.parse(process.env.FAKE_DENY)` to its answer's `result` line when `FAKE_DENY` is set.

- [ ] **Step 4: Run the suite**

Run (in `talk`): `node --test test/*.test.mjs`
Expected: all pass, 0 fail.

---

### Task 4: The `denied:` line in the closing report and in both skills

**Files:**
- Modify: `talk/lib/report.mjs:13-21`
- Modify: `talk/lib/bridge.mjs:384`
- Modify: `talk/SKILL.md` (step 4), `hub/SKILL.md:256-261`
- Test: `talk/test/report.test.mjs`, `talk/test/bridge.test.mjs`

**Interfaces:**
- Consumes: `fork.denials()` (Task 3).
- Produces: `closingReport({ dialogDir, origin, files, deletion, conversations, denied = [] }): string`; the line `denied: <entries joined by '; '>` or `denied: none` comes right after `conversations:`.

- [ ] **Step 1: Write the failing tests**

```js
// talk/test/report.test.mjs
test('the report says denied: none without refusals, right after conversations', () => {
  assert.match(closingReport({ dialogDir: 'C:/d', files: {}, deletion: 'deleted', conversations: [] }),
    /conversations: none\ndenied: none\n--- decisions\.md ---/);
});
test('the report lists every refused call on the denied line', () => {
  const r = closingReport({ dialogDir: 'C:/d', files: {}, deletion: 'deleted', conversations: [], denied: ['Write C:\\d\\decisions.md', 'Write C:\\d\\prompt.md'] });
  assert.match(r, /\ndenied: Write C:\\d\\decisions\.md; Write C:\\d\\prompt\.md\n/);
});

// talk/test/bridge.test.mjs
test('the closing report carries the paths the fork was refused', async () => {
  const deny = [{ tool_name: 'Write', tool_use_id: 'u1', tool_input: { file_path: 'C:\\d\\decisions.md' } }];
  const b = await bridge({ forkEnv: { FAKE_DENY: JSON.stringify(deny) } });
  try {
    await call(b.port, 'POST', '/api/end', { body: { conversationId: 'conv_1' } });
    assert.match(await b.done, /\ndenied: Write C:\\d\\decisions\.md\n/);
  } finally {
    await finish(b);
  }
});
```

- [ ] **Step 2: Run and see them fail**

Run (in `talk`): `node --test test/report.test.mjs test/bridge.test.mjs`
Expected: FAIL — no `denied:` line.

- [ ] **Step 3: Implement**

`closingReport` prints the line; `bridge.mjs:384` passes `denied: fork.denials()`.
`talk/SKILL.md` step 4, a new bullet after the `conversations:` bullet: the `denied:` line lists the fork's refused calls (`none`: there were none); for every listed path, tell Rafal the file was not written and that what the fork meant to write there is only in `transcript.md` of the dialog directory (the `dialog:` line).
`hub/SKILL.md:257` names the `denied:` line among the report lines, and the bullet at `:259-261` adds: every refused call on the `denied:` line, with the same `transcript.md` note.

- [ ] **Step 4: Run both suites**

Run (in `talk`): `node --test test/*.test.mjs` — Expected: all pass, 0 fail.
Run (in `hub`): `node --test test/*.test.mjs` — Expected: 465 pass, 0 fail.

---

### Task 5: Live probe of both forks' settings

**Files:**
- Create: `talk/test/live/fork-permissions.mjs` (not a `*.test.mjs`: `node --test test/*.test.mjs` never runs it)

**Interfaces:**
- Consumes: `writeVoiceForkSettings(dialogDir, cwd)` (Task 2), `forkSettings(dialogDir, cwd)` (Task 1).
- Produces: `<probe root>/summary.json` and exit code 0 (every check passed) or 1.

Layout (author's call, spec §8): stamp `YYYY-MM-DD-HHmm`; C: probe root `C:/Users/rafal/hub-probes/fork-permissions/<stamp>/`, D: probe root `D:/hub-probes/fork-permissions/<stamp>/` (a new folder on D:, outside every repository). The script refuses to run when either probe root exists.

| Layout | Working directory (created) | Settings |
|---|---|---|
| `d-plain` | `<D root>/repo-plain` | voice |
| `d-space` | `<D root>/Baza wiedzy` | voice |
| `d-worktree` | `<D root>/repo-wt/.claude/worktrees/wt-probe` | voice |
| `c-dotclaude` | `<C root>/home/.claude/hub` | voice |
| `hub-written` | `<D root>/repo-hub` | hub `forkSettings` |

Dialog directories: `<C root>/dialogs/<layout>` for the voice layouts (no `.claude` segment, like `hub-data`); `<C root>/hub/.claude/hub/projects/p/dialogs/<stamp>-probe` for `hub-written` (the `.claude` segment of real hub dialogs).

Each layout makes two calls, `spawnSync('claude', args, { cwd, encoding: 'utf8', timeout: 180000 })`:
- voice args: `-p <ask> --restricted --tools Read,Grep,Glob,Edit,Write --strict-mcp-config --permission-mode default --output-format stream-json --verbose --settings <settings> --model haiku --add-dir <dialogDir>`;
- `hub-written` args: the same without `--restricted`.
- ask: `Use the Write tool exactly once to create <target> with the content ok. Use no other tool.`
- targets: `<dialogDir>/probe-dialog.txt`, then `<cwd>/probe-repo.txt`.

Reading a call's result (the same correlation as `callsOf` in `talk/test/live/boundary.mjs:74-86`): parse every stdout line as JSON; take the `tool_use` blocks of `type: "assistant"` lines whose `name` is `Write` and whose `input.file_path` is the call's target (compared case-insensitively, after `\`→`/`); take the `tool_result` blocks of `type: "user"` lines and match them to those `tool_use` blocks by `tool_use_id`; the content may be a string or an array of `{ type: 'text', text }`, joined to one string. The call's verdict is that matched `tool_result` (`is_error`, text). A call with no `Write` on its target, or no matched `tool_result`, fails its check as `no attempt`, never as a pass.

Per call the summary records: target, whether it exists afterwards, the matched `tool_result` (`is_error`, first 300 characters of its text), and the `permission_denials` of the stream's `result` line.

Checks:
- voice layouts: `probe-dialog.txt` exists; `probe-repo.txt` does not exist and its `tool_result` contains `denied by your permission settings`;
- `hub-written`: the dialog write's `tool_result` does not contain `denied by your permission settings` (the file may or may not exist: the `.claude` segment may still need approval, spec §3 non-goals); `probe-repo.txt` does not exist and its `tool_result` contains `denied by your permission settings`.

- [ ] **Step 1: Write the script** as specified above.
- [ ] **Step 2: Run it**

Run (in `talk`): `node test/live/fork-permissions.mjs`
Expected: exit 0, `"passed": true` in `summary.json`, 10 `claude -p` calls.

- [ ] **Step 3: On any failed check, stop**

Report the failing layout with its `tool_result` text verbatim and wait for Rafal; do not change the deny form on your own. Nothing the probe created is deleted.

---

### Task 6: Spec amendments, index, and Rafal's acceptance run

**Files:**
- Modify: `D:/Notatki/notatki/.claude/specs/2026-10-18-hub-voice-design.md:239`
- Modify: `D:/Notatki/notatki/.claude/specs/2026-10-13-hub-core-design.md:538`
- Modify: `D:/Notatki/notatki/.claude/projects/hub.md` (skill `project-index`)
- Create: `D:/Notatki/notatki/.claude/specs/2026-11-19-hub-fork-permissions-plan-1-acceptance.md`

- [ ] **Step 1: Amend both specs**

Next to each `Edit(./**)` text, one dated line: `**Amended 2026-11-19:** since Claude Code 2.1.326 the deny is the absolute working directory, Edit(<posixPath(cwd)>/**); see [2026-11-19-hub-fork-permissions-design.md](2026-11-19-hub-fork-permissions-design.md).`

- [ ] **Step 2: Write the acceptance report** — the test counts of both suites, the probe's `summary.json` path and its per-layout results, the files changed.

- [ ] **Step 3: Update the index** — part `hub-fork-permissions`: plan and acceptance linked, Oś line, Co zostało „rozmowa testowa `/talk` Rafała”.

- [ ] **Step 4: Commit and push the vault files**

```bash
git branch --show-current   # main
git add .claude/specs/2026-10-18-hub-voice-design.md .claude/specs/2026-10-13-hub-core-design.md .claude/specs/2026-11-19-hub-fork-permissions-plan-1-acceptance.md .claude/projects/hub.md
git diff --cached --name-only   # only these four paths
git commit -m "docs(hub-fork-permissions): plan 1 built, acceptance report"
git push
```

- [ ] **Step 5: Hand over for Rafal's run**

Rafal runs one `/talk` in any allowed project and confirms one decision by voice. Pass: the report shows `decisions.md` with that decision and `denied: none`. Record the result in the acceptance report and the index (Step 3 and 4 again), and mark the part `✅ gotowe` only after this run.
