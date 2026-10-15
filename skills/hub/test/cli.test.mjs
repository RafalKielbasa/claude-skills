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
const five = (goal) => `**Cel**\n${goal}\n**Kontekst**\nx\n**Decyzje z uzasadnieniem**\nx\n**Ograniczenia**\nx\n**Oczekiwany rezultat**\nPokaż wynik.`;

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
  writeFileSync(join(root, 'projects.json'), JSON.stringify({ projects: { app: { name: 'App', dir: repo, description: 'Test app.' } } }));
  const agents = join(root, 'agents.json');
  writeFileSync(agents, JSON.stringify([{ sessionId: 's1', id: 's1', name: 'probe-a', kind: 'interactive', status: 'idle', state: null, cwd: repo }]));
  const hub = (...args) => spawnSync(process.execPath, [HUB, ...args], { encoding: 'utf8', env: { ...process.env, HUB_DATA: root } });
  const draftOf = (goal) => {
    const body = join(root, `body-${goal.length}.md`);
    writeFileSync(body, five(goal));
    return hub('compose', '--path', 'direct', '--session', 's1', '--body-file', body).stdout.trim();
  };
  return { root, repo, log, agents, hub, draftOf };
}

test('direct command: compose, approve, prepare, result, confirm by the recipient event', () => {
  const { root, log, agents, hub, draftOf } = setup();
  const draft = draftOf('Uruchom testy.');
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
  const { agents, hub, draftOf } = setup();
  const draft = draftOf('Uruchom testy.');
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
  const { root, agents, hub, draftOf } = setup();
  const draft = draftOf('Uruchom testy.');
  const record = JSON.parse(hub('approve', '--session', 's1', '--path', 'direct', '--text-file', draft).stdout);
  // An approved record has no pending send yet, so a result for it is refused.
  assert.equal(hub('result', record.id, '--msg-id', '11111111-2222-3333-4444-555555555555').status, 3);
  assert.equal(hub('prepare', record.id, '--agents-json', agents).status, 0);
  hub('result', record.id, '--error', 'No such agent: probe-a');
  const [saved] = loadRecords(root, 'app');
  assert.equal(saved.state, 'not-sent');
  assert.equal(saved.error, 'No such agent: probe-a');
});

test('overview, last and questionnaire request through the CLI', () => {
  const { agents, hub } = setup();
  const overview = hub('overview', '--agents-json', agents);
  assert.equal(overview.status, 0, overview.stderr);
  assert.match(overview.stdout, /\| App \| s1 probe-a \| turn ended \(judge\) \|/);
  assert.match(hub('last', 's1').stdout, /registry[\\/]s1\.last[\\/]x\.md/);
  const request = hub('compose', '--path', 'questionnaire-request', '--session', 's1', '--topic', 'nazwa pliku', '--max', '3').stdout.trim();
  assert.match(readFileSync(request, 'utf8'), /decyzje o: nazwa pliku[\s\S]*Liczba pytań: najwyżej 3\./);
});

test('the hub restarted between prepare and SendMessage: delivery-unknown, and a resend needs confirmation', () => {
  const { root, agents, hub, draftOf } = setup();
  const draft = draftOf('Uruchom testy.');
  const first = JSON.parse(hub('approve', '--session', 's1', '--path', 'direct', '--text-file', draft).stdout);
  assert.equal(hub('prepare', first.id, '--agents-json', agents).status, 0);
  // No `result`: the hub stopped before SendMessage returned.
  assert.match(hub('journal', '--project', 'app').stdout, new RegExp(`\\| ${first.id} \\| .* \\| delivery-unknown \\| no tool result recorded \\|`));

  const second = JSON.parse(hub('approve', '--session', 's1', '--path', 'direct', '--text-file', draft).stdout);
  const refused = hub('prepare', second.id, '--agents-json', agents);
  assert.equal(refused.status, 3);
  assert.match(JSON.parse(refused.stdout).failures[0].message, /delivery-unknown/);
  assert.equal(hub('prepare', second.id, '--confirm-resend', '--agents-json', agents).status, 0);
  assert.deepEqual(loadRecords(root, 'app').map((r) => r.state), ['pending', 'pending']);
});

test('a busy target: "send now" passes with --confirm-busy; a delayed send runs every check again', () => {
  const { root, repo, log, hub, draftOf } = setup();
  const busy = join(root, 'agents-busy.json');
  const idle = join(root, 'agents-idle.json');
  const agentsWith = (status) => JSON.stringify([{ sessionId: 's1', id: 's1', name: 'probe-a', kind: 'interactive', status, state: null, cwd: repo }]);
  writeFileSync(busy, agentsWith('busy'));
  writeFileSync(idle, agentsWith('idle'));
  log([ev('UserPromptSubmit', '2026-10-14T10:02:00Z', { cwd: repo, promptId: 'p2' })]);

  const now = JSON.parse(hub('approve', '--session', 's1', '--path', 'direct', '--text-file', draftOf('Teraz.')).stdout);
  assert.deepEqual(JSON.parse(hub('prepare', now.id, '--agents-json', busy).stdout).failures.map((f) => f.check), [5]);
  assert.equal(hub('prepare', now.id, '--confirm-busy', '--agents-json', busy).status, 0);

  const later = JSON.parse(hub('approve', '--session', 's1', '--path', 'direct', '--text-file', draftOf('Po turze.')).stdout);
  assert.deepEqual(JSON.parse(hub('prepare', later.id, '--agents-json', busy).stdout).failures.map((f) => f.check), [5]);
  log([ev('Stop', '2026-10-14T10:03:00Z', { cwd: repo, promptId: 'p2', marker: null, lastFile: 's1.last/y.md' })]);
  spawnSync('git', ['-C', repo, 'checkout', '-q', '-b', 'feature']);
  assert.deepEqual(JSON.parse(hub('prepare', later.id, '--agents-json', idle).stdout).failures.map((f) => f.check), [2]);
  spawnSync('git', ['-C', repo, 'checkout', '-q', 'main']);
  assert.equal(hub('prepare', later.id, '--agents-json', idle).status, 0);
});

test('judge: a question after a turn without the marker shows "probably waiting for you" until the next turn', () => {
  const { repo, log, agents, hub } = setup();
  assert.equal(hub('judge', 's1', '--verdict', 'maybe').status, 2);
  assert.equal(JSON.parse(hub('judge', 's1', '--verdict', 'question').stdout).verdict, 'question');
  assert.match(hub('overview', '--agents-json', agents).stdout, /\| App \| s1 probe-a \| probably waiting for you \|/);
  log([
    ev('UserPromptSubmit', '2026-10-14T10:05:00Z', { cwd: repo, promptId: 'p3' }),
    ev('Stop', '2026-10-14T10:06:00Z', { cwd: repo, promptId: 'p3', marker: null, lastFile: 's1.last/z.md' }),
  ]);
  assert.match(hub('overview', '--agents-json', agents).stdout, /\| App \| s1 probe-a \| turn ended \(judge\) \|/);
});

test('last and judge accept a unique id prefix and refuse an ambiguous one', () => {
  const { root, repo, hub } = setup();
  for (const id of ['abcdef01-1111-4111-8111-111111111111', 'abcdef02-2222-4222-8222-222222222222']) {
    appendFileSync(join(root, 'registry', `${id}.events.jsonl`), `${JSON.stringify(ev('Stop', '2026-10-14T10:01:00Z', { sessionId: id, cwd: repo, marker: null, lastFile: `${id}.last/x.md` }))}\n`);
  }
  assert.match(hub('last', 'abcdef01').stdout, /abcdef01-1111-4111-8111-111111111111\.last[\\/]x\.md/);
  assert.equal(JSON.parse(hub('judge', 'abcdef02', '--verdict', 'other').stdout).sessionId, 'abcdef02-2222-4222-8222-222222222222');
  const ambiguous = hub('last', 'abcdef');
  assert.equal(ambiguous.status, 3);
  assert.match(ambiguous.stderr, /ambiguous session id abcdef: /);
  assert.match(hub('last', 'zzz').stderr, /no session zzz in the registry/);
});

test('HUB projects prints the map and the projects seen outside it', () => {
  const { root, hub } = setup();
  appendFileSync(join(root, 'registry', 's9.events.jsonl'), `${JSON.stringify(ev('UserPromptSubmit', '2026-10-14T10:00:00Z', { sessionId: 's9', cwd: join(root, 'loose') }))}\n`);
  const out = hub('projects');
  assert.equal(out.status, 0, out.stderr);
  assert.match(out.stdout, /\| app \| App \| .*app \| Test app\. \|/);
  assert.match(out.stdout, /Seen in the registry, outside the map: loose/);
});

test('HUB projects lists an unmapped project of a session that ended days ago, but not the hub itself', () => {
  const { root, hub } = setup();
  const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
  const cwd = join(root, 'archived');
  appendFileSync(join(root, 'registry', 's8.events.jsonl'), [
    ev('UserPromptSubmit', daysAgo(3.1), { sessionId: 's8', cwd }),
    ev('SessionEnd', daysAgo(3), { sessionId: 's8', cwd, reason: 'other' }),
  ].map((e) => `${JSON.stringify(e)}\n`).join(''));
  appendFileSync(join(root, 'registry', 'hub1.events.jsonl'), `${JSON.stringify(ev('UserPromptSubmit', daysAgo(0), { sessionId: 'hub1', cwd: root }))}\n`);
  const out = hub('projects');
  assert.equal(out.status, 0, out.stderr);
  assert.match(out.stdout, /^Seen in the registry, outside the map: archived$/m);
});

test('compose reads the body from stdin', () => {
  const { root } = setup();
  const body = five('Uruchom testy.');
  const run = spawnSync(process.execPath, [HUB, 'compose', '--path', 'direct', '--session', 's1', '--body-file', '-'], { encoding: 'utf8', input: body, env: { ...process.env, HUB_DATA: root } });
  assert.equal(run.status, 0, run.stderr);
  const text = readFileSync(run.stdout.trim(), 'utf8');
  assert.match(text, /^\[hub · direct · app · s1 · /);
  assert.ok(text.includes(body));
});

test('confirm flags a hub message whose text differs from the approved one', () => {
  const { root, log, agents, hub, draftOf } = setup();
  const draft = draftOf('Uruchom testy.');
  const record = JSON.parse(hub('approve', '--session', 's1', '--path', 'direct', '--text-file', draft).stdout);
  assert.equal(hub('prepare', record.id, '--agents-json', agents).status, 0);
  hub('result', record.id, '--msg-id', '11111111-2222-3333-4444-555555555555');
  log([ev('UserPromptSubmit', new Date(Date.now() + 1000).toISOString(), { promptId: 'p2', fromName: 'hub', innerHash: 'other' })]);
  const out = JSON.parse(hub('confirm').stdout);
  assert.deepEqual(out.mismatched, [record.id]);
  assert.deepEqual(out.confirmed, []);
  assert.equal(loadRecords(root, 'app')[0].state, 'pending');
  assert.match(hub('journal', '--project', 'app').stdout, /delivered text differs from the approved text/);
  // Already flagged: a second confirm does not report it again.
  assert.deepEqual(JSON.parse(hub('confirm').stdout).mismatched, []);
});
