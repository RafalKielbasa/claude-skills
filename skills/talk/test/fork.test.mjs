import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { forkArgs, startFork } from '../lib/fork.mjs';

const FAKE = fileURLToPath(new URL('../fakes/claude.mjs', import.meta.url));
const tmp = mkdtempSync(join(tmpdir(), 'f-'));
const base = { cwd: tmp, sessionId: 's', settingsPath: 'x', dialogDir: tmp, command: [process.execPath, FAKE] };

test('ready answers the start prompt and sessionId comes from init', async () => {
  const f = startFork({ ...base, startPrompt: 'start' });
  assert.equal((await f.ready).text, 'echo: start');
  assert.equal(await f.sessionId, 'fork-1');
  assert.equal(await f.close(), 0);
});

test('a result that arrives before the echo of the sent message is not taken as its answer', async () => {
  const f = startFork({ ...base, startPrompt: 'start', env: { FAKE_SPURIOUS: '1' } });
  assert.equal((await f.ready).text, 'echo: start');
  assert.equal((await f.ask('pierwsze')).text, 'echo: pierwsze');
  await f.close();
});

test('rawLog receives every stdout line of the fork', async () => {
  const rawLog = join(tmp, 'raw.jsonl');
  const f = startFork({ ...base, startPrompt: 'start', rawLog });
  await f.ready;
  await f.close();
  assert.match(readFileSync(rawLog, 'utf8'), /"result":"echo: start"/);
});

test('the fork does not inherit ELEVENLABS_API_KEY', async () => {
  const f = startFork({ ...base, startPrompt: 'start', env: { ELEVENLABS_API_KEY: 'secret' } });
  assert.equal((await f.ready).text, 'echo: start');
  await f.close();
});

test('close kills a fork that does not exit within the deadline', async () => {
  const f = startFork({ ...base, startPrompt: 'start', env: { FAKE_HANG: '1' } });
  await f.ready;
  const t0 = Date.now();
  await f.close({ deadlineMs: 200 });
  assert.ok(Date.now() - t0 < 2000);
});

test('close does not wait forever for a turn that never ends', async () => {
  const f = startFork({ ...base, startPrompt: 'start', env: { FAKE_SLOW_MS: '100000', FAKE_HANG: '1' } });
  await f.ready;
  f.ask('slow forever', { timeoutMs: 50 });
  const t0 = Date.now();
  await f.close({ deadlineMs: 200 });
  assert.ok(Date.now() - t0 < 2000);
});

test('two asks sent at once are answered in order', async () => {
  const f = startFork({ ...base, startPrompt: 'start', env: { FAKE_DELAY_MS: '50' } });
  await f.ready;
  const [a, b] = await Promise.all([f.ask('pierwsze'), f.ask('drugie zażółć')]);
  assert.equal(a.text, 'echo: pierwsze');
  assert.equal(b.text, 'echo: drugie zażółć');
  await f.close();
});

test('a timed-out ask keeps the queue, and the next ask gets its own answer, not the late one', async () => {
  const f = startFork({ ...base, startPrompt: 'start', env: { FAKE_SLOW_MS: '300' } });
  await f.ready;
  const t0 = Date.now();
  const [a, b] = await Promise.all([f.ask('slow pierwsze', { timeoutMs: 100 }), f.ask('drugie')]);
  assert.equal(a.timedOut, true); assert.equal(a.text, '');
  assert.equal(b.timedOut, false); assert.equal(b.text, 'echo: drugie');
  assert.ok(Date.now() - t0 >= 300);
  await f.close();
});

test('forkArgs is the restricted command of spec §8 with --add-dir last', () => {
  assert.deepEqual(forkArgs({ sessionId: 's', settingsPath: 'p', dialogDir: 'd' }), ['-p', '--resume', 's', '--fork-session',
    '--restricted', '--tools', 'Read,Grep,Glob,Edit,Write', '--strict-mcp-config', '--permission-mode', 'default',
    '--input-format', 'stream-json', '--output-format', 'stream-json', '--verbose', '--replay-user-messages',
    '--settings', 'p', '--add-dir', 'd']);
});

test('forkArgs puts --model right before --add-dir', () => {
  const args = forkArgs({ sessionId: 's', settingsPath: 'p', dialogDir: 'd', model: 'm' });
  assert.deepEqual(args.slice(-4), ['--model', 'm', '--add-dir', 'd']);
});

test('a result with num_turns 0 after the replay is not taken as the answer', async () => {
  const f = startFork({ ...base, startPrompt: 'start', env: { FAKE_ZERO_TURNS: '1' } });
  try {
    assert.equal((await f.ready).text, 'echo: start');
  } finally {
    await f.close({ deadlineMs: 500 });
  }
});
