import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCodexPrompt, parseCodexVerdicts, runCodex, buildCodexFindPrompt, parseCodexFindings, runCodexFind } from '../lib/codex.mjs';

const findings = [{
  id: 'f-01', axis: 'security', file: 'a.ts', lines: [88, 94], severity: 'blocking',
  claim: 'query without tenant filter', evidence: 'findFirst({ where: { id } })', rule: 'config.md#security',
}];

test('the prompt carries id, location, quote and rule for every finding', () => {
  const prompt = buildCodexPrompt(findings);
  assert.match(prompt, /f-01/);
  assert.match(prompt, /a\.ts:88-94/);
  assert.match(prompt, /findFirst\(\{ where: \{ id \} \}\)/);
  assert.match(prompt, /config\.md#security/);
});

test('verdicts are parsed out of surrounding chatter', () => {
  const out = parseCodexVerdicts('thinking...\n{"verdicts":[{"id":"f-01","verdict":"confirms","reason":"r","fix":null}]}\ndone');
  assert.equal(out['f-01'].verdict, 'confirms');
  assert.equal(out['f-01'].fix, null);
});

test('an unknown verdict value is coerced to unsure', () => {
  const out = parseCodexVerdicts('{"verdicts":[{"id":"f-01","verdict":"maybe","reason":"r"}]}');
  assert.equal(out['f-01'].verdict, 'unsure');
});

test('a missing binary reports unavailable rather than throwing', () => {
  const out = runCodex('anything', { cwd: process.cwd(), timeoutMs: 1000, binary: 'codex-does-not-exist' });
  assert.equal(out.status, 'unavailable');
  assert.deepEqual(out.verdicts, {});
});

// This pair is the permanent guard for the defect the live test found once:
// on Windows the npm shim cannot be spawned directly, and without the fallback
// the cross-check reported "unavailable" on every run while every test passed.
test('on Windows a failed direct spawn retries through the shell, prompt still on stdin', () => {
  const calls = [];
  const spawn = (command, args, options) => {
    calls.push({ command, args, options });
    return calls.length === 1
      ? { error: Object.assign(new Error('nope'), { code: 'ENOENT' }) }
      : { status: 0, stdout: '{"verdicts":[{"id":"f-01","verdict":"confirms","reason":"r","fix":null}]}' };
  };
  const out = runCodex('PROMPT-BODY', { cwd: '.', timeoutMs: 1000, spawn, platform: 'win32' });
  assert.equal(out.status, 'ok');
  assert.equal(calls.length, 2);
  assert.equal(calls[1].command, process.env.ComSpec || 'cmd.exe');
  assert.deepEqual(calls[1].args.slice(0, 3), ['/d', '/s', '/c']);
  assert.equal(calls[1].args[3].includes('PROMPT-BODY'), false,
    'the prompt must never reach the command line');
  assert.equal(calls[1].options.input, 'PROMPT-BODY');
});

test('on a POSIX platform a failed spawn is not retried through a shell', () => {
  const calls = [];
  const spawn = (command, args, options) => {
    calls.push({ command, args, options });
    return { error: Object.assign(new Error('nope'), { code: 'ENOENT' }) };
  };
  const out = runCodex('PROMPT-BODY', { cwd: '.', timeoutMs: 1000, spawn, platform: 'linux' });
  assert.equal(out.status, 'unavailable');
  assert.equal(calls.length, 1);
});

// Opt-in, not opt-out: a machine without codex must not fail the suite, since
// the module's whole contract is that a missing codex never fails a run.
test('codex can actually be started on this machine', { skip: process.env.CRM_LIVE_CODEX !== '1' }, () => {
  const out = runCodex('Reply with exactly: STDIN_OK', { cwd: process.cwd(), timeoutMs: 120000 });
  assert.notEqual(out.status, 'unavailable',
    'codex could not be spawned — the cross-check would silently never run');
});

const selected = [
  { axisId: 'security', group: null, axes: [{ id: 'security', checklist: '- no raw SQL', severity_default: 'blocking' }],
    files: [{ path: 'a.ts', added: 3, removed: 1 }] },
  { axisId: 'cms-security+cms-data', group: 'cms',
    axes: [
      { id: 'cms-security', checklist: '- check tenant filter', severity_default: 'blocking' },
      { id: 'cms-data', checklist: '- check cuid ids', severity_default: 'suggestion' },
    ],
    files: [{ path: 'b.ts', added: 5, removed: 0 }, { path: 'c.ts', added: 1, removed: 2 }] },
];
const goodFinding = { axis: 'security', file: 'a.ts', lines: [1, 1], severity: 'blocking', claim: 'c', evidence: 'e', fix: 'do x' };

test('the find prompt lists every selected axis with its checklist and files', () => {
  const prompt = buildCodexFindPrompt(selected);
  assert.match(prompt, /### security\n/);
  assert.match(prompt, /### cms-security\+cms-data\n/);
  assert.match(prompt, /no raw SQL/);
  assert.match(prompt, /check tenant filter/);
  assert.match(prompt, /check cuid ids/);
  assert.match(prompt, /cms-security: blocking by default; cms-data: suggestion by default/);
  assert.match(prompt, /a\.ts \(\+3\/-1\)/);
  assert.match(prompt, /c\.ts \(\+1\/-2\)/);
  assert.equal(prompt.includes('{{AXES}}'), false);
});

test('findings are parsed from the last array in the output', () => {
  const out = parseCodexFindings(`notes [1] ... ${JSON.stringify([goodFinding])} done`, selected);
  assert.equal(out.findings.length, 1);
  assert.equal(out.findings[0].fix, 'do x');
  assert.equal(out.droppedOffAxis, 0);
});

test('a finding on an axis or file outside the plan is dropped and counted', () => {
  const out = parseCodexFindings(JSON.stringify([
    { ...goodFinding, axis: 'other' },
    { ...goodFinding, file: 'z.ts' },
  ]), selected);
  assert.equal(out.findings.length, 0);
  assert.equal(out.droppedOffAxis, 2);
});

test('a file belonging to another entry does not pass for this axis', () => {
  const out = parseCodexFindings(JSON.stringify([{ ...goodFinding, file: 'b.ts' }]), selected);
  assert.equal(out.findings.length, 0);
  assert.equal(out.droppedOffAxis, 1);
});

test('unparsable output is reported, not thrown', () => {
  const spawn = () => ({ status: 0, stdout: 'no json' });
  const out = runCodexFind(selected, { cwd: '.', timeoutMs: 1000, spawn, platform: 'linux' });
  assert.equal(out.status, 'unparsable');
  assert.deepEqual(out.findings, []);
});

test('an empty array is a valid answer', () => {
  const spawn = () => ({ status: 0, stdout: '[]' });
  const out = runCodexFind(selected, { cwd: '.', timeoutMs: 1000, spawn, platform: 'linux' });
  assert.equal(out.status, 'ok');
  assert.deepEqual(out.findings, []);
});

test('the finder reuses the Windows fallback', () => {
  const calls = [];
  const spawn = (command, args, options) => {
    calls.push({ command, args, options });
    return calls.length === 1
      ? { error: Object.assign(new Error('nope'), { code: 'ENOENT' }) }
      : { status: 0, stdout: '[]' };
  };
  const out = runCodexFind(selected, { cwd: '.', timeoutMs: 1000, spawn, platform: 'win32' });
  assert.equal(out.status, 'ok');
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[1].args, ['/d', '/s', '/c', 'codex exec --sandbox read-only -']);
  assert.match(calls[1].options.input, /### security/);
});

test('prose brackets after the real answer do not replace it', () => {
  const real = JSON.stringify([goodFinding]);
  assert.equal(parseCodexFindings(`${real}\n\nsee [1]`, selected).findings.length, 1);
  assert.equal(parseCodexFindings(`${real}\n\ndone []`, selected).findings.length, 1);
});

test('a finding with nested lines survives trailing prose with brackets', () => {
  const finding = { ...goodFinding, lines: [88, 94] };
  const out = parseCodexFindings(`${JSON.stringify([finding])} refs [88, 94] and [x]`, selected);
  assert.deepEqual(out.findings[0].lines, [88, 94]);
});

test('an output that is only an empty array means no findings', () => {
  const out = parseCodexFindings('nothing found: []', selected);
  assert.deepEqual(out, { findings: [], droppedOffAxis: 0 });
});

test('a large bracket-heavy output is bounded and still finds the answer', () => {
  const prose = '[1] [2] [{ '.repeat(20000);
  let start = Date.now();
  assert.equal(parseCodexFindings(prose, selected), null);
  assert.ok(Date.now() - start < 2000, 'unparsable noise must not take long');
  start = Date.now();
  const out = parseCodexFindings(`${'[1] [2] '.repeat(25000)}${JSON.stringify([goodFinding])}`, selected);
  assert.equal(out.findings.length, 1);
  assert.ok(Date.now() - start < 2000);
});
