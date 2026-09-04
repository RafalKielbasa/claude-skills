import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCodexPrompt, parseCodexVerdicts, runCodex } from '../lib/codex.mjs';

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
