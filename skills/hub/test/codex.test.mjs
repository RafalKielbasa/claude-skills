import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, appendFileSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tempRoot, ev } from './helpers.mjs';
import { codexCommand, describeElement, runCodex, parseThreadId, mcpServerNames, isolationArgs, REVIEWER_ROLE, DeniedError } from '../lib/codex.mjs';

const HUB = fileURLToPath(new URL('../bin/hub.mjs', import.meta.url));
const FAKE = fileURLToPath(new URL('../fakes/codex.mjs', import.meta.url));
const FEATURES_OFF = ['-c', 'features.hooks=false', '-c', 'features.plugins=false', '-c', 'features.apps=false'];
// A config shaped like Rafal's ~/.codex/config.toml: two servers, one with an env subtable.
const CONFIG = [
  'notify = ["x.exe", "turn-ended"]',
  '[projects."d:\\\\praca\\\\baza wiedzy"]',
  'trust_level = "trusted"',
  '[mcp_servers.n8n]',
  'url = "http://localhost:5678/mcp-server/http"',
  '[mcp_servers.node_repl] # computer use',
  'command = "node_repl.exe"',
  '[mcp_servers.node_repl.env]',
  'CODEX_HOME = "C:\\\\Users\\\\rafal\\\\.codex"',
  '[mcp_servers."my server"]',
  "[mcp_servers.'lit server']",
  '[mcp_servers."esc\\"aped"]',
  '[mcp_servers."quoted-ok"]',
  "[mcp_servers.'lit_ok']",
  '[mcp_servers."n8n"]',
  '[mcp_servers.n8n]',
].join('\r\n');

function codexHome(config) {
  const home = tempRoot();
  if (config !== undefined) writeFileSync(join(home, 'config.toml'), config);
  return home;
}

test('isolation (P13): hooks, plugins and apps off, every MCP server table of $CODEX_HOME/config.toml disabled', () => {
  assert.deepEqual(mcpServerNames(CONFIG), ['n8n', 'node_repl', '"my server"', "'lit server'", '"quoted-ok"', "'lit_ok'", '"n8n"']);
  // Codex keeps quotes in a -c key path (`mcp_servers."x"` is a new server "x", and the call fails
  // with "invalid transport"), so a quoted name goes unquoted when it is a bare key and is skipped
  // otherwise; "n8n" and n8n are one server.
  assert.deepEqual(isolationArgs({ CODEX_HOME: codexHome(CONFIG) }), [
    ...FEATURES_OFF,
    '-c', 'mcp_servers.n8n.enabled=false',
    '-c', 'mcp_servers.node_repl.enabled=false',
    '-c', 'mcp_servers.quoted-ok.enabled=false',
    '-c', 'mcp_servers.lit_ok.enabled=false',
  ]);
  assert.deepEqual(isolationArgs({ CODEX_HOME: codexHome() }), FEATURES_OFF);
  assert.deepEqual(isolationArgs({ CODEX_HOME: codexHome('') }), FEATURES_OFF);
});

test('isolation with an unreadable config.toml keeps the features off and does not throw (M5)', () => {
  const home = tempRoot();
  mkdirSync(join(home, 'config.toml'));
  assert.deepEqual(isolationArgs({ CODEX_HOME: home }), FEATURES_OFF);
});

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
  // CODEX_HOME keeps the tests away from the real ~/.codex/config.toml.
  const env = { ...process.env, HUB_DATA: root, HUB_CODEX_CMD: JSON.stringify([process.execPath, FAKE]), FAKE_CODEX_LOG: log, CODEX_HOME: codexHome('[mcp_servers.n8n]\nurl = "x"\n') };
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
  const isolation = [...FEATURES_OFF, '-c', 'mcp_servers.n8n.enabled=false'];
  assert.deepEqual(call1.args, ['exec', '-s', 'read-only', '-C', repo, ...isolation, '--json', '-o', first.answerFile, '-']);
  assert.equal(call1.cwd.toLowerCase(), repo.toLowerCase());
  assert.match(call1.input, /^You are a reviewer/);
  assert.match(call1.input, /Wynik: zażółć gęślą jaźń/);
  assert.ok(call1.input.length > 200000);
  assert.ok(existsSync(first.errFile));
  const meta = JSON.parse(readFileSync(join(first.thread, 'meta.json'), 'utf8'));
  assert.deepEqual([meta.threadId, meta.cwd, meta.project, meta.calls], [first.threadId, repo, 'baza', 1]);

  const followed = JSON.parse(hub(['codex', 'follow', '--thread', first.thread, '--question-file', '-'], 'A testy?').stdout);
  const [, call2] = calls();
  assert.deepEqual(call2.args, ['exec', 'resume', first.threadId, '-c', 'sandbox_mode="read-only"', ...isolation, '--json', '-o', followed.answerFile, '-']);
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
