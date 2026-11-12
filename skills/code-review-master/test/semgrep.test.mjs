import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdirSync } from 'node:fs';
import { join, dirname, relative, resolve, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeRepo } from '../test-helpers/repo.mjs';
import { buildSemgrepArgs, mapSemgrepResults, runSemgrep } from '../lib/semgrep.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const fixture = JSON.parse(readFileSync(join(HERE, 'fixtures', 'semgrep-secrets-output.json'), 'utf8'));

// The probe file's source, rebuilt from fragments: a joined key-shaped literal
// in a file under ~/.claude would be blocked by GitHub push protection.
const PROBE_LINE_1 = 'const awsKey = "AKIA' + 'Q7ZT4XKD2PLMN3VB";';
const PROBE_LINE_2 = 'const note = "not detected";';
const PROBE_LINE_3 = 'const stripeKey = "sk_' + 'live_51Hx9QaLk2mP7rT3vW8yZ1bC4dF6gJ0nS";';
const PROBE_SOURCE = [PROBE_LINE_1, PROBE_LINE_2, PROBE_LINE_3, ''].join('\n');

const SETTINGS = { semgrep: { enabled: true, image: 'semgrep/semgrep:1.182.1', timeout_s: 300 } };
const slot = (axisId, axes, paths) => ({
  axisId, group: null, axes, files: paths.map((path) => ({ path })), skippedFiles: [],
});
const planOf = (selected, extra = {}) => ({
  runId: 'r1', mode: 'branch', target: { base: 'main', head: 'def', pr: null }, selection: { selected }, ...extra,
});
const result = (line, extra = {}) => ({
  check_id: 'rule.x', path: 'a.ts', start: { line }, end: { line },
  extra: { message: 'Bad thing. More text.', severity: 'ERROR', lines: 'requires login', ...extra },
});
const okSpawn = (results) => () => ({ status: 0, stdout: JSON.stringify({ results }), stderr: '' });

test('args mount the repository read-only and never pull', () => {
  const args = buildSemgrepArgs({
    repo: 'D:\\Praca\\My Repo', image: 'semgrep/semgrep:1.182.1', name: 'crm-r1-0',
    packs: ['p/secrets'], files: ['apps\\cms\\a.ts'],
  });
  assert.ok(args.includes('-v'));
  assert.ok(args.includes('D:\\Praca\\My Repo:/src:ro'));
  assert.ok(args.includes('--pull=never'));
  assert.ok(args.includes('--metrics=off'));
  assert.ok(args.includes('apps/cms/a.ts'));
  assert.ok(args.every((a) => !/[;&|`$<>]/.test(a)));
});

test('the probe output maps to a blocking secrets finding', () => {
  const found = mapSemgrepResults({ results: [fixture.results[0]] }, { axisId: 'secrets', sourceOf: () => PROBE_SOURCE });
  assert.equal(found.length, 1);
  assert.equal(found[0].severity, 'blocking');
  assert.equal(found[0].axis, 'secrets');
  assert.equal(found[0].file, 'leak.js');
  assert.deepEqual(found[0].lines, [1, 1]);
  assert.equal(found[0].evidence, PROBE_LINE_1);
  assert.equal(found[0].rule, fixture.results[0].check_id);
  assert.ok(found[0].claim.endsWith(`(semgrep: ${fixture.results[0].check_id})`));
  assert.ok(!found[0].evidence.includes('requires login'));
});

test('a grouped slot labels findings with the slot id', () => {
  const found = mapSemgrepResults({ results: [result(1)] }, { axisId: 'cms-security+cms-data', sourceOf: () => 'x\n' });
  assert.equal(found[0].axis, 'cms-security+cms-data');
});

test('every semgrep severity maps as the spec says', () => {
  const table = {
    ERROR: 'blocking', CRITICAL: 'blocking', HIGH: 'blocking',
    WARNING: 'suggestion', MEDIUM: 'suggestion',
    INFO: 'nitpick', LOW: 'nitpick', WHATEVER: 'suggestion',
  };
  for (const [semgrep, ours] of Object.entries(table)) {
    const [f] = mapSemgrepResults({ results: [result(1, { severity: semgrep })] }, { axisId: 'a', sourceOf: () => 'x\n' });
    assert.equal(f.severity, ours, semgrep);
  }
});

test('results outside the change are counted, not kept', () => {
  const dir = makeRepo({ 'a.ts': Array.from({ length: 50 }, (_, i) => `line ${i + 1}`).join('\n') });
  const plan = planOf([slot('secrets', [{ id: 'secrets', semgrep: ['p/secrets'] }], ['a.ts'])]);
  const out = runSemgrep({
    runId: 'r1', repo: dir, plan, settings: SETTINGS, hunks: new Map([['a.ts', [[10, 12]]]]),
    spawn: okSpawn([result(11), result(40)]),
  });
  assert.equal(out.status, 'ok');
  assert.equal(out.findings.length, 1);
  assert.deepEqual(out.findings[0].lines, [11, 11]);
  assert.equal(out.outsideChange, 1);
  assert.equal(out.hunksAvailable, true);
  assert.deepEqual(out.scannedAxes, ['secrets']);
});

test('without hunks nothing is filtered and the status says so', () => {
  const dir = makeRepo({ 'a.ts': Array.from({ length: 50 }, (_, i) => `line ${i + 1}`).join('\n') });
  const plan = planOf([slot('secrets', [{ id: 'secrets', semgrep: ['p/secrets'] }], ['a.ts'])]);
  const out = runSemgrep({ runId: 'r1', repo: dir, plan, settings: SETTINGS, hunks: null, spawn: okSpawn([result(11), result(40)]) });
  assert.equal(out.findings.length, 2);
  assert.equal(out.outsideChange, 0);
  assert.equal(out.hunksAvailable, false);
});

test('a missing file is not handed to docker', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  const plan = planOf([slot('secrets', [{ id: 'secrets', semgrep: ['p/secrets'] }], ['gone.ts', 'a.ts'])]);
  const calls = [];
  runSemgrep({
    runId: 'r1', repo: dir, plan, settings: SETTINGS, hunks: null,
    spawn: (cmd, args) => { calls.push(args); return { status: 0, stdout: '{"results":[]}', stderr: '' }; },
  });
  assert.equal(calls.length, 1);
  assert.ok(calls[0].includes('a.ts'));
  assert.ok(!calls[0].includes('gone.ts'));
});

test('a pr run on a different checkout does not scan', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  const plan = planOf([slot('secrets', [{ id: 'secrets', semgrep: ['p/secrets'] }], ['a.ts'])], { mode: 'pr' });
  let spawned = 0;
  const out = runSemgrep({
    runId: 'r1', repo: dir, plan, settings: SETTINGS, hunks: null, headOf: () => 'abc',
    spawn: () => { spawned += 1; return { status: 0, stdout: '{"results":[]}', stderr: '' }; },
  });
  assert.equal(out.status, 'unavailable');
  assert.equal(out.reason, 'pr-not-checked-out');
  assert.equal(spawned, 0);
});

test('docker missing, image missing, daemon error, timeout, garbage', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  const plan = planOf([slot('secrets', [{ id: 'secrets', semgrep: ['p/secrets'] }], ['a.ts'])]);
  const go = (spawn) => runSemgrep({ runId: 'r1', repo: dir, plan, settings: SETTINGS, hunks: null, spawn });

  const missing = go(() => ({ error: Object.assign(new Error('spawn docker ENOENT'), { code: 'ENOENT' }) }));
  assert.deepEqual([missing.status, missing.reason], ['unavailable', 'docker-missing']);

  const noImage = go(() => ({ status: 125, stdout: '', stderr: 'docker: Error response from daemon: No such image: semgrep/semgrep:0.0.0-missing\n' }));
  assert.deepEqual([noImage.status, noImage.reason], ['unavailable', 'image-not-pulled']);

  const daemon = go(() => ({ status: 1, stdout: '', stderr: 'error during connect: open //./pipe/docker_engine\n' }));
  assert.deepEqual([daemon.status, daemon.reason], ['unavailable', 'docker-error']);

  const calls = [];
  const timedOut = go((cmd, args) => {
    calls.push([cmd, ...args]);
    return calls.length === 1 ? { error: Object.assign(new Error('spawnSync docker ETIMEDOUT'), { code: 'ETIMEDOUT' }) } : { status: 0 };
  });
  assert.equal(timedOut.status, 'timeout');
  assert.deepEqual(calls[1], ['docker', 'rm', '-f', 'crm-r1-0']);

  const garbage = go(() => ({ status: 0, stdout: 'not json', stderr: '' }));
  assert.equal(garbage.status, 'unparsable');
});

test('findings collected before a failing call are discarded', () => {
  const dir = makeRepo({ 'a.ts': 'x\ny\n' });
  const rules = [{ id: 'one', semgrep: ['p/a'] }, { id: 'two', semgrep: ['p/b'] }];
  const plan = planOf(rules.map((axis) => slot(axis.id, [axis], ['a.ts'])));
  let n = 0;
  const out = runSemgrep({
    runId: 'r1', repo: dir, plan, settings: SETTINGS, hunks: null,
    spawn: () => { n += 1; return n === 1 ? { status: 0, stdout: JSON.stringify({ results: [result(1)] }), stderr: '' } : { status: 1, stdout: '', stderr: 'boom' }; },
  });
  assert.equal(out.status, 'unavailable');
  assert.deepEqual(out.findings, []);
});

test("docker's error is kept as one line of detail", () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  const plan = planOf([slot('secrets', [{ id: 'secrets', semgrep: ['p/secrets'] }], ['a.ts'])]);
  const go = (stderr) => runSemgrep({
    runId: 'r1', repo: dir, plan, settings: SETTINGS, hunks: null, spawn: () => ({ status: 1, stdout: '', stderr }),
  });
  assert.equal(go('error during connect: open //./pipe/docker_engine\nmore\n').detail, 'error during connect: open //./pipe/docker_engine');
  assert.equal(go(`${'x'.repeat(300)}\nmore`).detail.length, 200);
});

test('disabled, not-in-mode and nothing-to-scan return before docker', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  const withRules = planOf([slot('secrets', [{ id: 'secrets', semgrep: ['p/secrets'] }], ['a.ts'])]);
  const noRules = planOf([slot('quality', [{ id: 'quality', semgrep: [] }], ['a.ts'])]);
  const boom = () => { throw new Error('spawn must not be called'); };
  const go = (plan, settings = SETTINGS) => runSemgrep({ runId: 'r1', repo: dir, plan, settings, hunks: null, spawn: boom }).status;
  assert.equal(go({ ...withRules, mode: 'working' }), 'not-in-mode');
  assert.equal(go(withRules, { semgrep: { ...SETTINGS.semgrep, enabled: false } }), 'disabled');
  assert.equal(go(noRules), 'nothing-to-scan');
});

test('a grouped slot scans each member only over its own files and packs', () => {
  const dir = makeRepo({ 'api/a.ts': 'x\n', 'db/b.ts': 'y\n' });
  const members = [
    { id: 'sec', when: ['api/**'], semgrep: ['p/sec'] },
    { id: 'data', when: ['db/**'], semgrep: ['p/data'] },
    { id: 'docs', when: ['docs/**'], semgrep: ['p/docs'] },
  ];
  const plan = planOf([slot('sec+data+docs', members, ['api/a.ts', 'db/b.ts'])]);
  const calls = [];
  runSemgrep({
    runId: 'r1', repo: dir, plan, settings: SETTINGS, hunks: null,
    spawn: (cmd, args) => { calls.push(args); return { status: 0, stdout: '{"results":[]}', stderr: '' }; },
  });
  assert.equal(calls.length, 2);
  const tail = (args) => args.slice(args.indexOf('--') + 1);
  assert.deepEqual(tail(calls[0]), ['api/a.ts']);
  assert.ok(calls[0].includes('p/sec') && !calls[0].includes('p/data'));
  assert.deepEqual(tail(calls[1]), ['db/b.ts']);
  assert.ok(calls[1].includes('p/data'));
});

test('a directory listed as a changed path is not handed to docker', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  mkdirSync(join(dir, 'sub'));
  const plan = planOf([slot('secrets', [{ id: 'secrets', when: 'always', semgrep: ['p/secrets'] }], ['sub', 'a.ts'])]);
  const calls = [];
  runSemgrep({
    runId: 'r1', repo: dir, plan, settings: SETTINGS, hunks: null,
    spawn: (cmd, args) => { calls.push(args); return { status: 0, stdout: '{"results":[]}', stderr: '' }; },
  });
  assert.deepEqual(calls[0].slice(calls[0].indexOf('--') + 1), ['a.ts']);
});

test('a file named like an option is passed after the -- separator', () => {
  const args = buildSemgrepArgs({ repo: '/r', image: 'i', name: 'n', packs: ['p/x'], files: ['--x', 'b.ts'] });
  assert.ok(args.indexOf('--x') > args.indexOf('--'));
  assert.equal(args.filter((a) => a === '--').length, 1);
});

test('detail falls back to the json errors, then stdout, and pr mismatch names both shas', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  const plan = planOf([slot('secrets', [{ id: 'secrets', when: 'always', semgrep: ['p/secrets'] }], ['a.ts'])]);
  const go = (spawn, p = plan, extra = {}) => runSemgrep({ runId: 'r1', repo: dir, plan: p, settings: SETTINGS, hunks: null, spawn, ...extra });
  const viaErrors = go(() => ({ status: 2, stdout: JSON.stringify({ errors: [{ message: 'bad config' }] }), stderr: '' }));
  assert.equal(viaErrors.detail, 'bad config');
  const viaStdout = go(() => ({ status: 2, stdout: '\n  plain failure\nrest', stderr: '' }));
  assert.equal(viaStdout.detail, 'plain failure');
  const pr = go(() => ({ status: 0 }), { ...plan, mode: 'pr', target: { ...plan.target, head: 'def4567890' } }, { headOf: () => 'abc1234567' });
  assert.equal(pr.detail, 'HEAD abc1234 ≠ def4567');
  assert.ok(go(() => ({ status: 0, stdout: 'not json', stderr: '' })).detail);
});

test('the timeout budget is the configured one, shrinks, and an exhausted one does not spawn', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  const members = [{ id: 'one', when: 'always', semgrep: ['p/a'] }, { id: 'two', when: 'always', semgrep: ['p/b'] }];
  const plan = planOf(members.map((m) => slot(m.id, [m], ['a.ts'])));
  const timeouts = [];
  let clock = 1000;
  runSemgrep({
    runId: 'r1', repo: dir, plan, settings: SETTINGS, hunks: null, now: () => clock,
    spawn: (cmd, args, opts) => { timeouts.push(opts.timeout); clock += 5000; return { status: 0, stdout: '{"results":[]}', stderr: '' }; },
  });
  assert.equal(timeouts[0], 300000);
  assert.ok(timeouts[1] > 0 && timeouts[1] <= timeouts[0]);
  assert.equal(timeouts[1], 295000);

  let spawned = 0;
  let tick = 0;
  const out = runSemgrep({
    runId: 'r1', repo: dir, plan, settings: SETTINGS, hunks: null,
    now: () => { tick += 1; return tick === 1 ? 0 : 400000; },
    spawn: () => { spawned += 1; return { status: 0, stdout: '{"results":[]}', stderr: '' }; },
  });
  assert.equal(out.status, 'timeout');
  assert.equal(spawned, 0);
});

test('a throw while mapping, reading or spawning becomes a status, never an exception', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  const plan = planOf([slot('secrets', [{ id: 'secrets', when: 'always', semgrep: ['p/secrets'] }], ['a.ts'])]);
  const go = (spawn, settings = SETTINGS) => runSemgrep({ runId: 'r1', repo: dir, plan, settings, hunks: null, spawn });
  const noStart = go(okSpawn([{ check_id: 'r', path: 'a.ts', end: { line: 1 }, extra: {} }]));
  assert.equal(noStart.status, 'unparsable');
  assert.ok(noStart.detail);
  const outside = go(okSpawn([result(1, {}) && { ...result(1), path: '../../nope.ts' }]));
  assert.equal(outside.status, 'unparsable');
  const spawnThrows = go(() => { throw new Error('spawn exploded'); });
  assert.deepEqual([spawnThrows.status, spawnThrows.reason, spawnThrows.detail], ['unavailable', 'docker-error', 'spawn exploded']);
  const badTimeout = go(okSpawn([]), { semgrep: { ...SETTINGS.semgrep, timeout_s: 'soon' } });
  assert.deepEqual([badTimeout.status, badTimeout.reason], ['unavailable', 'docker-error']);
  assert.ok(badTimeout.detail);
});

test('an exit-0 scan that reported errors stays ok and counts them across calls', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  const members = [{ id: 'one', when: 'always', semgrep: ['p/a'] }, { id: 'two', when: 'always', semgrep: ['p/b'] }];
  const plan = planOf(members.map((m) => slot(m.id, [m], ['a.ts'])));
  const outputs = [
    { results: [], errors: [{ message: 'Syntax error at line a.ts:1' }, { message: 'rule failed' }] },
    { results: [], errors: [{ message: 'timeout on a.ts' }] },
  ];
  let n = 0;
  const out = runSemgrep({
    runId: 'r1', repo: dir, plan, settings: SETTINGS, hunks: null,
    spawn: () => ({ status: 0, stdout: JSON.stringify(outputs[n++]), stderr: '' }),
  });
  assert.equal(out.status, 'ok');
  assert.equal(out.errors, 3);
  const clean = runSemgrep({ runId: 'r1', repo: dir, plan, settings: SETTINGS, hunks: null, spawn: okSpawn([]) });
  assert.equal(clean.errors, 0);
});

test('a relative repository is mounted by its absolute path', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  const rel = relative(process.cwd(), dir);
  assert.equal(isAbsolute(rel), false, 'precondition: the test repo must be reachable by a relative path');
  const plan = planOf([slot('secrets', [{ id: 'secrets', when: 'always', semgrep: ['p/secrets'] }], ['a.ts'])]);
  const calls = [];
  runSemgrep({
    runId: 'r1', repo: rel, plan, settings: SETTINGS, hunks: null,
    spawn: (cmd, args) => { calls.push(args); return { status: 0, stdout: '{"results":[]}', stderr: '' }; },
  });
  assert.equal(calls.length, 1);
  assert.ok(calls[0].includes(`${resolve(rel)}:/src:ro`), calls[0].join(' '));
});

test('the changed-line diff is computed only when a scan will happen', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  const rules = [{ id: 'secrets', when: 'always', semgrep: ['p/secrets'] }];
  const noRules = planOf([slot('quality', [{ id: 'quality', semgrep: [] }], ['a.ts'])], { mode: 'pr' });
  const withRules = planOf([slot('secrets', rules, ['a.ts'])], { mode: 'pr' });
  const forbidden = () => { throw new Error('the diff (gh/git) must not be computed'); };
  const go = (plan, extra = {}) => runSemgrep({
    runId: 'r1', repo: dir, plan, settings: SETTINGS, hunks: forbidden, spawn: forbidden, headOf: () => 'abc', ...extra,
  });
  assert.equal(go(noRules).status, 'nothing-to-scan');
  assert.equal(go({ ...withRules, mode: 'working' }).status, 'not-in-mode');
  assert.equal(go(withRules, { settings: { semgrep: { ...SETTINGS.semgrep, enabled: false } } }).status, 'disabled');
  assert.equal(go(withRules).reason, 'pr-not-checked-out');

  let computed = 0;
  const out = runSemgrep({
    runId: 'r1', repo: dir, plan: withRules, settings: SETTINGS, headOf: () => 'def',
    hunks: () => { computed += 1; return new Map([['a.ts', [[1, 1]]]]); },
    spawn: okSpawn([result(1)]),
  });
  assert.equal(computed, 1);
  assert.equal(out.status, 'ok');
  assert.equal(out.hunksAvailable, true);
  assert.equal(out.findings.length, 1);
});
