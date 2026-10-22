import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, appendFileSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tempRoot, ev } from './helpers.mjs';
import { isDenied } from '../lib/denylist.mjs';
import { takeSnapshot, forkSettings, forkArgs, forkStartPrompt, fallbackCommand, PROMPT_READY } from '../lib/dialog.mjs';
import { readHubSessions } from '../lib/hubsessions.mjs';
import { resolveSource, cwdForTranscript, withAncestors } from '../lib/resolve.mjs';
import { deriveSession } from '../lib/derive.mjs';

const HUB =fileURLToPath(new URL('../bin/hub.mjs', import.meta.url));
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

test('the fallback command quotes the fork name', () => {
  const command = fallbackCommand({ cwd: 'C:\\Repo X', sessionId: 'S', name: 'dlg-repo-x-w', settingsPath: 'C:\\d\\fork-settings.json', promptPath: 'C:\\d\\start-prompt.md', dialogDir: 'C:\\d' });
  assert.equal(command, 'cd "C:\\Repo X" && claude --resume S --fork-session --name "dlg-repo-x-w" --settings "C:\\d\\fork-settings.json" "$(cat "C:\\d\\start-prompt.md")" --add-dir "C:\\d"');
});

function dialogSetup() {
  const root = tempRoot();
  const repo = repoWithSecrets();
  mkdirSync(join(root, 'registry'), { recursive: true });
  appendFileSync(join(root, 'registry', 'src-old-1111.events.jsonl'), `${JSON.stringify(ev('UserPromptSubmit', '2026-10-14T10:00:00Z', { sessionId: 'src-old-1111', cwd: repo }))}\n`);
  writeFileSync(join(root, 'projects.json'), JSON.stringify({ projects: { app: { name: 'App', dir: repo, description: 'Test app.' } } }));
  const agents = join(root, 'agents.json');
  const log = join(root, 'fake-claude.log');
  // Stands in for ~/.claude/projects, where `voice resolve` looks for a transcript no event names.
  const projectsDir = join(root, 'claude-projects');
  const env = { ...process.env, HUB_DATA: root, HUB_CLAUDE_CMD: JSON.stringify([process.execPath, FAKE]), FAKE_CLAUDE_LOG: log, FAKE_AGENTS: agents, FAKE_CLAUDE_ID: 'f0f0f0f0', HUB_CLAUDE_PROJECTS: projectsDir };
  const hub = (...args) => spawnSync(process.execPath, [HUB, ...args], { encoding: 'utf8', env });
  return { root, repo, agents, log, projectsDir, hub };
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
  assert.deepEqual(out.twins, []);
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
  // The given id src-old-1111 is not live, so it is resolved by its name, which two sessions share.
  writeFileSync(agents, JSON.stringify([{ sessionId: 'a1', name: 'twin', cwd: repo }, { sessionId: 'b2', name: 'twin', cwd: repo }]));
  const twins = hub('dialog', 'start', '--session', 'src-old', '--slug', 'x', '--agents-json', agents);
  assert.equal(twins.status, 3);
  assert.deepEqual(JSON.parse(twins.stdout).candidates, ['a1', 'b2']);
  writeFileSync(agents, '[]');
  assert.deepEqual(JSON.parse(hub('dialog', 'start', '--session', 'src-old', '--slug', 'x', '--agents-json', agents).stdout).candidates, []);
});

test('dialog start forks a live id directly, also when another live session has its name, and reports the twin', () => {
  const { root, repo, agents, log, hub } = dialogSetup();
  for (const id of ['a1aaaaaa-1111', 'b2bbbbbb-2222']) {
    appendFileSync(join(root, 'registry', `${id}.events.jsonl`), `${JSON.stringify(ev('UserPromptSubmit', '2026-10-14T10:00:00Z', { sessionId: id, cwd: repo }))}\n`);
  }
  writeFileSync(agents, JSON.stringify([
    { sessionId: 'a1aaaaaa-1111', id: 'a1aaaaaa', name: 'twin', status: 'idle', cwd: repo },
    { sessionId: 'b2bbbbbb-2222', id: 'b2bbbbbb', name: 'twin', status: 'idle', cwd: repo },
  ]));
  const run = hub('dialog', 'start', '--session', 'a1aaaaaa', '--slug', 'w', '--agents-json', agents);
  assert.equal(run.status, 0, run.stdout + run.stderr);
  const out = JSON.parse(run.stdout);
  assert.equal(out.sourceSessionId, 'a1aaaaaa-1111');
  assert.equal(out.resolvedFrom, null);
  assert.deepEqual(out.twins, ['b2bbbbbb-2222']);
  assert.equal(JSON.parse(readFileSync(log, 'utf8').trim()).args[2], 'a1aaaaaa-1111');
});

test('a source that is not live and has no session_title resolves by its name in an earlier poll', () => {
  const { root, repo, agents, hub } = dialogSetup();
  // src-old-1111 carries no session_title, as a VS Code panel session; an earlier poll named it.
  appendFileSync(join(root, 'registry', 'polls.jsonl'), `${JSON.stringify({ at: '2026-10-14T10:00:30Z', ok: true, sessions: [{ sessionId: 'src-old-1111', name: 'panel', cwd: repo }] })}\n`);
  writeFileSync(agents, JSON.stringify([{ sessionId: 'src-new-2222', name: 'panel', cwd: repo, status: 'idle' }]));
  const run = hub('dialog', 'start', '--session', 'src-old', '--slug', 'p', '--agents-json', agents);
  assert.equal(run.status, 0, run.stdout + run.stderr);
  const out = JSON.parse(run.stdout);
  assert.deepEqual([out.sourceSessionId, out.resolvedFrom], ['src-new-2222', 'src-old-1111']);
});

test('a fork of a session in an unmapped directory with a space and capitals gets a kebab-case name', () => {
  const { root, agents, log, hub } = dialogSetup();
  const repo = join(tempRoot(), 'Repo X');
  mkdirSync(repo, { recursive: true });
  spawnSync('git', ['init', '-q', '-b', 'main', repo]);
  appendFileSync(join(root, 'registry', 'rx-4444.events.jsonl'), `${JSON.stringify(ev('UserPromptSubmit', '2026-10-14T10:00:00Z', { sessionId: 'rx-4444', cwd: repo }))}\n`);
  writeFileSync(agents, JSON.stringify([{ sessionId: 'rx-4444', name: 'repo-x-work', cwd: repo, status: 'idle' }]));
  const run = hub('dialog', 'start', '--session', 'rx-4444', '--slug', 'w', '--agents-json', agents);
  assert.equal(run.status, 0, run.stdout + run.stderr);
  assert.equal(JSON.parse(run.stdout).name, 'dlg-repo-x-w');
  assert.equal(JSON.parse(readFileSync(log, 'utf8').trim()).args[5], 'dlg-repo-x-w');
});

test('dialog start launches the fork for a source outside git, with a note instead of the snapshot', () => {
  const { root, agents, hub } = dialogSetup();
  const plain = join(tempRoot(), 'plain');
  mkdirSync(plain, { recursive: true });
  appendFileSync(join(root, 'registry', 'plain-6666.events.jsonl'), `${JSON.stringify(ev('UserPromptSubmit', '2026-10-14T10:00:00Z', { sessionId: 'plain-6666', cwd: plain }))}\n`);
  writeFileSync(agents, JSON.stringify([{ sessionId: 'plain-6666', name: 'plain-work', cwd: plain, status: 'idle' }]));
  const run = hub('dialog', 'start', '--session', 'plain-6666', '--slug', 'n', '--agents-json', agents);
  assert.equal(run.status, 0, run.stdout + run.stderr);
  const out = JSON.parse(run.stdout);
  assert.match(readFileSync(join(out.dialogDir, 'context', 'NO-GIT.txt'), 'utf8'), /is not inside a git work tree/);
  assert.equal(existsSync(join(out.dialogDir, 'context', 'diff.patch')), false);
});

test('dialog start refuses a fork name a live session already has, before creating anything', () => {
  const { root, repo, agents, log, hub } = dialogSetup();
  writeFileSync(agents, JSON.stringify([{ sessionId: 'src-old-1111', name: 'probe', cwd: repo, status: 'idle' }, { sessionId: 'other-9999', name: 'dlg-app-x', cwd: repo, status: 'idle' }]));
  const refused = hub('dialog', 'start', '--session', 'src-old-1111', '--slug', 'x', '--agents-json', agents);
  assert.equal(refused.status, 3);
  assert.match(refused.stderr, /a live session is already named dlg-app-x/);
  assert.equal(existsSync(join(root, 'projects')), false);
  assert.equal(existsSync(log), false);
});

test('dialog start refuses a source whose working directory holds the hub data, before creating anything', () => {
  const { root, agents, log, hub } = dialogSetup();
  const above = dirname(root);
  appendFileSync(join(root, 'registry', 'up-5555.events.jsonl'), `${JSON.stringify(ev('UserPromptSubmit', '2026-10-14T10:00:00Z', { sessionId: 'up-5555', cwd: above }))}\n`);
  writeFileSync(agents, JSON.stringify([{ sessionId: 'up-5555', name: 'up', cwd: above, status: 'idle' }]));
  const refused = hub('dialog', 'start', '--session', 'up-5555', '--slug', 'x', '--agents-json', agents);
  assert.equal(refused.status, 3);
  assert.match(refused.stderr, /the dialog directory would lie inside the session's working directory, where the fork may not write/);
  assert.equal(existsSync(join(root, 'projects')), false);
  assert.equal(existsSync(log), false);
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
  assert.match(out.command, /^cd ".*" && claude --resume src-old-1111 --fork-session --name "dlg-app-y" --settings ".*fork-settings\.json" "\$\(cat ".*start-prompt\.md"\)" --add-dir ".*"$/);

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

test('dialog start refuses a source without a working directory before creating anything', () => {
  const { root, agents, hub } = dialogSetup();
  appendFileSync(join(root, 'registry', 'nocwd-3333.events.jsonl'), `${JSON.stringify(ev('UserPromptSubmit', '2026-10-14T10:00:00Z', { sessionId: 'nocwd-3333', cwd: null, sessionTitle: 'nocwd' }))}\n`);
  writeFileSync(agents, JSON.stringify([{ sessionId: 'nocwd-3333', name: 'nocwd', cwd: null, status: 'idle' }]));
  const refused = hub('dialog', 'start', '--session', 'nocwd-3333', '--slug', 'x', '--agents-json', agents);
  assert.equal(refused.status, 3);
  assert.match(refused.stderr, /has no working directory/);
  assert.equal(existsSync(join(root, 'projects', 'unknown')), false);
});

// s1 as a hub-launched worktree session shows it (voice spec §19.2 step 2): its hook names the
// worktree, while `claude agents --json` lists it in the main checkout.
function hookAndPollDisagree({ root, agents, worktree, main, transcriptPath }) {
  appendFileSync(join(root, 'registry', 's1.events.jsonl'), `${JSON.stringify(ev('UserPromptSubmit', '2026-10-21T10:00:00Z', { sessionId: 's1', cwd: worktree, transcriptPath }))}\n`);
  writeFileSync(agents, JSON.stringify([{ sessionId: 's1', id: 's1', name: 'notatki-wt', kind: 'background', status: 'idle', cwd: main }]));
}

test('voice resolve takes the cwd from the session hook before the poll, with the transcript path, and launches nothing', () => {
  const { root, agents, log, hub } = dialogSetup();
  const transcriptPath = join(tempRoot(), 's1.jsonl');
  writeFileSync(transcriptPath, '{}\n');
  hookAndPollDisagree({ root, agents, worktree: 'C:\\wt', main: 'C:\\main', transcriptPath });
  const run = hub('voice', 'resolve', '--session', 's1', '--agents-json', agents);
  assert.equal(run.status, 0, run.stdout + run.stderr);
  const { project, ...out } = JSON.parse(run.stdout);
  assert.deepEqual(out, { ok: true, sessionId: 's1', name: 'notatki-wt', cwd: 'C:\\wt', busy: false, twins: [], resolvedFrom: null, transcriptPath, transcriptExists: true });
  assert.equal(project, 'wt');
  // Read-only apart from the poll record: no fork, no dialog directory, no registration.
  assert.equal(existsSync(log), false);
  assert.equal(existsSync(join(root, 'projects')), false);
  assert.equal(existsSync(join(root, 'hub-sessions.json')), false);
});

test('voice resolve falls back to the poll cwd when no event names one, and reports a missing transcript', () => {
  const { root, agents, hub } = dialogSetup();
  const gone = join(tempRoot(), 'gone.jsonl');
  appendFileSync(join(root, 'registry', 's1.events.jsonl'), `${JSON.stringify(ev('UserPromptSubmit', '2026-10-21T10:00:00Z', { sessionId: 's1', cwd: null, transcriptPath: gone }))}\n`);
  writeFileSync(agents, JSON.stringify([{ sessionId: 's1', name: 'notatki-wt', status: 'busy', cwd: 'C:\\main' }]));
  const run = hub('voice', 'resolve', '--session', 's1', '--agents-json', agents);
  assert.equal(run.status, 0, run.stdout + run.stderr);
  const out = JSON.parse(run.stdout);
  assert.deepEqual([out.ok, out.sessionId, out.cwd, out.transcriptPath, out.transcriptExists, out.busy], [true, 's1', 'C:\\main', gone, false, true]);
});

test('voice resolve resolves a restarted session by name and lists candidates when two live sessions share it', () => {
  const { root, agents, hub } = dialogSetup();
  const events = (id, fields = {}) => appendFileSync(join(root, 'registry', `${id}.events.jsonl`), `${JSON.stringify(ev('UserPromptSubmit', '2026-10-21T10:00:00Z', { sessionId: id, cwd: 'C:\\notatki', ...fields }))}\n`);
  const live = (...ids) => writeFileSync(agents, JSON.stringify(ids.map((id) => ({ sessionId: id, name: 'notatki-x', status: 'idle', cwd: 'C:\\notatki' }))));
  const voiceResolve = (id, status) => {
    const run = hub('voice', 'resolve', '--session', id, '--agents-json', agents);
    assert.equal(run.status, status, run.stdout + run.stderr);
    return JSON.parse(run.stdout);
  };
  events('o1', { sessionTitle: 'notatki-x' });

  live('n1');
  const restarted = voiceResolve('o1', 0);
  assert.deepEqual([restarted.ok, restarted.sessionId, restarted.resolvedFrom, restarted.twins], [true, 'n1', 'o1', []]);

  live('n1', 'n2');
  assert.deepEqual(voiceResolve('o1', 3), { ok: false, name: 'notatki-x', candidates: ['n1', 'n2'] });

  events('n1');
  const direct = voiceResolve('n1', 0);
  assert.deepEqual([direct.sessionId, direct.resolvedFrom, direct.twins], ['n1', null, ['n2']]);
});

test('voice resolve looks for the transcript under the Claude projects directory when no event names one', () => {
  const { root, agents, projectsDir, hub } = dialogSetup();
  // A tool call carries no transcript path; only a prompt does (lib/events.mjs).
  appendFileSync(join(root, 'registry', 's1.events.jsonl'), `${JSON.stringify(ev('PostToolUse', '2026-10-21T10:00:00Z', { sessionId: 's1', cwd: 'C:\\notatki' }))}\n`);
  writeFileSync(agents, JSON.stringify([{ sessionId: 's1', name: 'notatki-y', status: 'idle', cwd: 'C:\\notatki' }]));
  const voiceResolve = () => {
    const run = hub('voice', 'resolve', '--session', 's1', '--agents-json', agents);
    assert.equal(run.status, 0, run.stdout + run.stderr);
    return JSON.parse(run.stdout);
  };
  const missing = voiceResolve();
  assert.deepEqual([missing.transcriptPath, missing.transcriptExists], [null, false]);
  mkdirSync(join(projectsDir, 'C--notatki'), { recursive: true });
  writeFileSync(join(projectsDir, 'C--notatki', 's1.jsonl'), '{}\n');
  const found = voiceResolve();
  assert.deepEqual([found.transcriptPath, found.transcriptExists], [join(projectsDir, 'C--notatki', 's1.jsonl'), true]);
});

test('voice resolve refuses a session without a name or a working directory', () => {
  const { root, agents, hub } = dialogSetup();
  appendFileSync(join(root, 'registry', 'anon-1111.events.jsonl'), `${JSON.stringify(ev('UserPromptSubmit', '2026-10-21T10:00:00Z', { sessionId: 'anon-1111', cwd: 'C:\\notatki' }))}\n`);
  appendFileSync(join(root, 'registry', 'nocwd-2222.events.jsonl'), `${JSON.stringify(ev('UserPromptSubmit', '2026-10-21T10:00:00Z', { sessionId: 'nocwd-2222', cwd: null }))}\n`);
  writeFileSync(agents, JSON.stringify([{ sessionId: 'nocwd-2222', name: 'nocwd', status: 'idle', cwd: null }]));
  const anonymous = hub('voice', 'resolve', '--session', 'anon-1111', '--agents-json', agents);
  assert.equal(anonymous.status, 3);
  assert.match(anonymous.stderr, /session anon-1111 has no name/);
  const nowhere = hub('voice', 'resolve', '--session', 'nocwd-2222', '--agents-json', agents);
  assert.equal(nowhere.status, 3);
  assert.match(nowhere.stderr, /has no working directory/);
});

test('dialog start forks a worktree session from its hook cwd, not from the poll cwd', () => {
  // Decision „Katalog roboczy w dialog start”, variant A. The fixture of the first voice resolve
  // test, with real directories: the fork is launched and snapshotted in its cwd.
  const { root, agents, log, hub } = dialogSetup();
  const worktree = join(tempRoot(), 'wt');
  const main = join(tempRoot(), 'main');
  for (const dir of [worktree, main]) mkdirSync(dir, { recursive: true });
  const transcriptPath = join(tempRoot(), 's1.jsonl');
  writeFileSync(transcriptPath, '{}\n');
  hookAndPollDisagree({ root, agents, worktree, main, transcriptPath });
  const run = hub('dialog', 'start', '--session', 's1', '--slug', 'w', '--agents-json', agents);
  assert.equal(run.status, 0, run.stdout + run.stderr);
  const out = JSON.parse(run.stdout);
  assert.equal(JSON.parse(readFileSync(log, 'utf8').trim()).cwd.toLowerCase(), worktree.toLowerCase());
  assert.equal(JSON.parse(readFileSync(join(out.dialogDir, 'context', 'snapshot.json'), 'utf8')).cwd, worktree);
});

// Finding F1 of the final review: hook cwds follow `cd` and subagent tool calls, while the transcript
// lies in the Claude project folder named after the session's own cwd.
const projectFolder = (dir) => dir.replace(/[^A-Za-z0-9]/g, '-');

test('the source cwd is the first candidate whose project folder holds the transcript: latest hook cwd, its ancestors, poll, first hook cwd', () => {
  const derivedState = deriveSession([
    ev('UserPromptSubmit', '2026-10-22T10:00:00Z', { cwd: 'C:\\first' }),
    ev('PostToolUse', '2026-10-22T10:01:00Z', { cwd: null }),
    ev('PostToolUse', '2026-10-22T10:02:00Z', { cwd: 'C:\\proj\\sub\\deep' }),
  ]);
  assert.deepEqual([derivedState.cwd, derivedState.firstCwd], ['C:\\proj\\sub\\deep', 'C:\\first']);
  assert.deepEqual(withAncestors('C:\\proj\\sub'), ['C:\\proj\\sub', 'C:\\proj', 'C:\\']);
  const poll = { ok: true, sessions: [{ sessionId: 's1', name: 'x', status: 'idle', cwd: 'C:\\poll' }] };
  const cwdOf = (transcriptPath, state = derivedState) => resolveSource({
    requested: 's1', poll, derivedOf: () => ({ ...state, transcriptPath }), lastPollName: () => null,
  }).source.cwd;
  const under = (folder) => `X:\\claude\\projects\\${folder}\\s1.jsonl`;
  // A match, compared case-insensitively.
  assert.equal(cwdOf(under('C--proj-sub-deep')), 'C:\\proj\\sub\\deep');
  assert.equal(cwdOf(under('c--PROJ-sub-deep')), 'C:\\proj\\sub\\deep');
  // The nearest matching ancestor of the latest hook cwd.
  assert.equal(cwdOf(under('C--proj-sub')), 'C:\\proj\\sub');
  assert.equal(cwdOf(under('C--proj')), 'C:\\proj');
  // Then the poll cwd, then the first hook cwd.
  assert.equal(cwdOf(under('C--poll')), 'C:\\poll');
  assert.equal(cwdOf(under('C--first')), 'C:\\first');
  // No match, or no transcript path: the latest hook cwd, then the poll cwd.
  assert.equal(cwdOf(under('elsewhere')), 'C:\\proj\\sub\\deep');
  assert.equal(cwdOf(null), 'C:\\proj\\sub\\deep');
  assert.equal(cwdOf(under('elsewhere'), { ...derivedState, cwd: null, firstCwd: null }), 'C:\\poll');
  assert.equal(cwdForTranscript(['C:\\a', null, 'C:\\b'], under('C--b')), 'C:\\b');
  assert.equal(cwdForTranscript(['C:\\a'], null), null);
});

test('voice resolve and dialog start fork from the cwd whose project folder holds the transcript, not from a later subdirectory', () => {
  const { root, repo, agents, log, projectsDir, hub } = dialogSetup();
  const sub = join(repo, 'config');
  const transcriptPath = join(projectsDir, projectFolder(repo), 's1.jsonl');
  mkdirSync(dirname(transcriptPath), { recursive: true });
  writeFileSync(transcriptPath, '{}\n');
  // The session started in the repository and then ran a tool call in its subdirectory.
  appendFileSync(join(root, 'registry', 's1.events.jsonl'), [
    ev('UserPromptSubmit', '2026-10-22T10:00:00Z', { sessionId: 's1', cwd: repo, transcriptPath }),
    ev('PostToolUse', '2026-10-22T10:01:00Z', { sessionId: 's1', cwd: sub, tool: 'Bash' }),
  ].map((event) => `${JSON.stringify(event)}\n`).join(''));
  writeFileSync(agents, JSON.stringify([{ sessionId: 's1', id: 's1', name: 'app-x', kind: 'interactive', status: 'idle', cwd: join(tempRoot(), 'main') }]));
  const resolved = hub('voice', 'resolve', '--session', 's1', '--agents-json', agents);
  assert.equal(resolved.status, 0, resolved.stdout + resolved.stderr);
  const out = JSON.parse(resolved.stdout);
  assert.deepEqual([out.cwd, out.project, out.transcriptPath, out.transcriptExists], [repo, 'app', transcriptPath, true]);
  const started = hub('dialog', 'start', '--session', 's1', '--slug', 'sub', '--agents-json', agents);
  assert.equal(started.status, 0, started.stdout + started.stderr);
  assert.equal(JSON.parse(readFileSync(log, 'utf8').trim()).cwd.toLowerCase(), repo.toLowerCase());
  assert.equal(JSON.parse(readFileSync(join(JSON.parse(started.stdout).dialogDir, 'context', 'snapshot.json'), 'utf8')).cwd, repo);
});
