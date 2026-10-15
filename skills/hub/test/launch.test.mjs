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
  assert.equal('unknown' in untrusted, false);
  const timedOut = runClaude(['--bg'], { run: () => ({ error: Object.assign(new Error('spawnSync claude ETIMEDOUT'), { code: 'ETIMEDOUT' }), stdout: '', stderr: '' }), env: {} });
  assert.equal(timedOut.ok, false);
  assert.equal(timedOut.unknown, true);
  assert.match(timedOut.error, /^timeout after 120 s: the launch outcome is unknown$/);
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
