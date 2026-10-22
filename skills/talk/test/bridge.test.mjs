import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createServer, request } from 'node:http';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startBridge } from '../lib/bridge.mjs';

const FAKE = fileURLToPath(new URL('../fakes/claude.mjs', import.meta.url));
const token = 'c'.repeat(64);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function fakeEleven() {
  const calls = [];
  return {
    calls,
    getConversationToken: async (agentId) => { calls.push(['token', agentId]); return { token: 'tok' }; },
    getConversation: async (id) => { calls.push(['get', id]); return { metadata: { call_duration_secs: 30 } }; },
    deleteConversation: async (id) => { calls.push(['delete', id]); return { ok: true, status: 200, text: '' }; },
  };
}

async function bridge(extra = {}) {
  const tmp = mkdtempSync(join(tmpdir(), 'b-'));
  const eleven = fakeEleven();
  const b = await startBridge({
    sessionId: 's', cwd: tmp, dialogDir: join(tmp, 'dialog'), agentId: 'agent_1', token,
    command: [process.execPath, FAKE], eleven, asksFile: join(tmp, 'asks.jsonl'),
    openBrowser: false, transcriptWaitMs: 50, ...extra,
  });
  return { ...b, tmp, eleven };
}

function call(port, method, path, { body, host = `127.0.0.1:${port}`, withToken = true } = {}) {
  const url = withToken ? `${path}${path.includes('?') ? '&' : '?'}t=${token}` : path;
  return new Promise((resolve, reject) => {
    const req = request({ host: '127.0.0.1', port, method, path: url, headers: { host, 'content-type': 'application/json' } }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { data += c; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    req.end(body ? JSON.stringify(body) : undefined);
  });
}

// Sends the chunks 50 ms apart under one content-length, so the server sees them as separate reads.
function rawPost(port, path, chunks) {
  const length = chunks.reduce((n, c) => n + c.length, 0);
  return new Promise((resolve, reject) => {
    const req = request({ host: '127.0.0.1', port, method: 'POST', path,
      headers: { host: `127.0.0.1:${port}`, 'content-type': 'application/json', 'content-length': length } }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { data += c; });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    (async () => {
      for (const [i, chunk] of chunks.entries()) {
        if (i > 0) await sleep(50);
        req.write(chunk);
      }
      req.end();
    })();
  });
}

async function waitFor(fn, ms) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    if (await fn()) return;
    await sleep(50);
  }
  assert.fail(`condition not met within ${ms} ms`);
}

// The closing report, or a failure when the bridge has not ended within `ms`.
async function doneWithin(b, ms) {
  let timer;
  const limit = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`the bridge did not end within ${ms / 1000} s`)), ms); });
  try { return await Promise.race([b.done, limit]); } finally { clearTimeout(timer); }
}

// Every test ends its bridge here, so a failed assertion fails the test instead of leaving a bridge
// and its fork running; a bridge that already ended refuses the connection, which is ignored.
async function finish(b) {
  await call(b.port, 'POST', '/api/end', { body: {} }).catch(() => {});
  return doneWithin(b, 10000);
}

const status = async (b) => JSON.parse((await call(b.port, 'GET', '/api/status')).body);

test('a request without the token or with a foreign Host is refused, the page with the token is served', async () => {
  const b = await bridge();
  try {
    assert.equal((await call(b.port, 'GET', '/', { withToken: false })).status, 403);
    assert.equal((await call(b.port, 'GET', '/', { host: 'evil.example' })).status, 403);
    const page = await call(b.port, 'GET', '/');
    assert.equal(page.status, 200);
    assert.match(page.body, /<html/i);
    assert.ok(page.body.includes(`?t=${token}`));
    assert.doesNotMatch(page.body, /__TOKEN__/);
    assert.equal(page.headers['cache-control'], 'no-store');
    assert.equal(page.headers['referrer-policy'], 'no-referrer');
  } finally {
    await finish(b);
  }
});

test('the conversation token comes from ElevenLabs through the bridge', async () => {
  const b = await bridge();
  try {
    assert.deepEqual(JSON.parse((await call(b.port, 'GET', '/api/conversation-token')).body), { token: 'tok' });
    assert.deepEqual(b.eleven.calls[0], ['token', 'agent_1']);
  } finally {
    await finish(b);
  }
});

test('an ask carries the agent words and Rafal transcribed words, diacritics intact', async () => {
  const b = await bridge();
  try {
    await call(b.port, 'POST', '/api/transcript', { body: { role: 'user', text: 'zażółć gęślą jaźń' } });
    const r = JSON.parse((await call(b.port, 'POST', '/api/ask', { body: { request: 'pytanie' } })).body);
    assert.equal(r.answer, 'echo: Agent głosowy przekazuje: pytanie\nRafał (transkrypcja): zażółć gęślą jaźń');
  } finally {
    await finish(b);
  }
});

test('an ask waits for a transcript that arrives after it', async () => {
  const b = await bridge({ transcriptWaitMs: 500 });
  try {
    const pending = call(b.port, 'POST', '/api/ask', { body: { request: 'drugie' } });
    await sleep(100);
    await call(b.port, 'POST', '/api/transcript', { body: { role: 'user', text: 'później' } });
    assert.match(JSON.parse((await pending).body).answer, /Rafał \(transkrypcja\): później$/);
    const ask = JSON.parse(readFileSync(join(b.tmp, 'asks.jsonl'), 'utf8').trim());
    assert.equal(ask.transcriptLate, true);
  } finally {
    await finish(b);
  }
});

test('a timed-out ask answers "Claude nadal myśli" and the next ask, after the slow turn ended, gets its own answer', async () => {
  const b = await bridge({ askTimeoutMs: 100, transcriptWaitMs: 10, forkEnv: { FAKE_SLOW_MS: '300' } });
  try {
    assert.equal(JSON.parse((await call(b.port, 'POST', '/api/ask', { body: { request: 'slow' } })).body).answer, 'Claude nadal myśli. Zapytaj za chwilę jeszcze raz.');
    await sleep(400);
    const next = JSON.parse((await call(b.port, 'POST', '/api/ask', { body: { request: 'kolejne' } })).body).answer;
    assert.match(next, /^echo: Agent głosowy przekazuje: kolejne/);
  } finally {
    await finish(b);
  }
});

test('two parallel asks get their own answers', async () => {
  const b = await bridge();
  try {
    const [x, y] = await Promise.all([
      call(b.port, 'POST', '/api/ask', { body: { request: 'pierwsze' } }),
      call(b.port, 'POST', '/api/ask', { body: { request: 'drugie' } }),
    ]);
    const answers = [JSON.parse(x.body).answer, JSON.parse(y.body).answer];
    assert.ok(answers[0].includes('przekazuje: pierwsze'));
    assert.ok(answers[1].includes('przekazuje: drugie'));
  } finally {
    await finish(b);
  }
});

test('the end deletes the conversation, writes the transcript, and reports the call duration', async () => {
  const b = await bridge();
  try {
    await call(b.port, 'POST', '/api/transcript', { body: { role: 'user', text: 'zażółć gęślą jaźń' } });
    await call(b.port, 'POST', '/api/end', { body: { conversationId: 'conv_1' } });
    const report = await b.done;
    assert.match(report, /deletion: deleted\n/);
    assert.match(report, /conversations: conv_1 \(30 s\)\n/);
    assert.deepEqual(b.eleven.calls.filter((c) => c[0] === 'delete'), [['delete', 'conv_1']]);
    assert.match(readFileSync(join(b.tmp, 'dialog', 'transcript.md'), 'utf8'), /zażółć gęślą jaźń/);
  } finally {
    await finish(b);
  }
});

test('a failed deletion still ends the bridge, with the error in the report', async () => {
  const b = await bridge();
  try {
    b.eleven.deleteConversation = async () => { throw new Error('network down'); };
    await call(b.port, 'POST', '/api/end', { body: { conversationId: 'conv_3' } });
    assert.match(await b.done, /deletion: conv_3 failed: network down\n/);
  } finally {
    await finish(b);
  }
});

test('a deletion answered with an error status is reported with the status and text', async () => {
  const b = await bridge();
  try {
    b.eleven.deleteConversation = async () => ({ ok: false, status: 500, text: 'boom\n  again' });
    await call(b.port, 'POST', '/api/end', { body: { conversationId: 'conv_x' } });
    assert.match(await b.done, /deletion: conv_x failed: 500 boom again\n/);
  } finally {
    await finish(b);
  }
});

test('a bridge whose page never sends a heartbeat ends after the first-beat deadline', async () => {
  const b = await bridge({ firstBeatDeadlineMs: 300 });
  try {
    assert.match(await b.done, /deletion: no conversation id/);
  } finally {
    await finish(b);
  }
});

test('a lost heartbeat pauses the dialog instead of ending it', async () => {
  const b = await bridge({ heartbeatGraceMs: 200 });
  try {
    await call(b.port, 'POST', '/api/heartbeat', { body: { conversationId: 'conv_a' } });
    await waitFor(async () => (await status(b)).state === 'paused', 3000);
    assert.equal((await status(b)).ending, false);
    assert.deepEqual(b.eleven.calls.filter((c) => c[0] === 'delete').map((c) => c[1]), ['conv_a']);
    assert.match(readFileSync(join(b.tmp, 'dialog', 'transcript.md'), 'utf8'), /\*\*Notatka\*\*: call ended: heartbeat-lost\/\n/);
    await call(b.port, 'POST', '/api/end', { body: {} });
    assert.match(await b.done, /deletion: deleted\nconversations: conv_a \(30 s\)\n/);
  } finally {
    await finish(b);
  }
});

test('an ask identical to one in flight joins it: one fork turn, the same answer for both', async () => {
  const b = await bridge({ forkEnv: { FAKE_DELAY_MS: '300' } });
  try {
    await call(b.port, 'POST', '/api/transcript', { body: { role: 'user', text: 'słowa' } });
    const first = call(b.port, 'POST', '/api/ask', { body: { request: 'to samo' } });
    await new Promise((r) => setTimeout(r, 100));
    const second = call(b.port, 'POST', '/api/ask', { body: { request: 'to samo' } });
    const [a1, a2] = (await Promise.all([first, second])).map((r) => JSON.parse(r.body).answer);
    assert.equal(a1, 'echo: Agent głosowy przekazuje: to samo\nRafał (transkrypcja): słowa');
    assert.equal(a2, a1);
    const asks = readFileSync(join(b.tmp, 'asks.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
    assert.deepEqual(asks.map((a) => Boolean(a.joined)), [false, true]);
  } finally {
    await call(b.port, 'POST', '/api/end', { body: {} });
    await b.done;
  }
});

test('a page reload adds a second conversation; both are deleted and reported', async () => {
  const b = await bridge();
  try {
    await call(b.port, 'POST', '/api/heartbeat', { body: { conversationId: 'conv_a' } });
    await call(b.port, 'POST', '/api/heartbeat', { body: { conversationId: 'conv_b' } });
    await call(b.port, 'POST', '/api/end', { body: {} });
    const report = await b.done;
    assert.deepEqual(b.eleven.calls.filter((c) => c[0] === 'delete').map((c) => c[1]).sort(), ['conv_a', 'conv_b']);
    assert.match(report, /conversations: conv_a \(30 s\), conv_b \(30 s\)/);
  } finally {
    await finish(b);
  }
});

test('a request body split inside a Polish letter is decoded intact', async () => {
  const b = await bridge();
  try {
    const body = Buffer.from(JSON.stringify({ role: 'user', text: 'zażółć' }), 'utf8');
    const cut = body.indexOf(Buffer.from('ż', 'utf8')) + 1; // between the two bytes of „ż”
    await rawPost(b.port, `/api/transcript?t=${token}`, [body.subarray(0, cut), body.subarray(cut)]); // two writes, 50 ms apart
    await call(b.port, 'POST', '/api/end', { body: {} });
    await b.done;
    assert.match(readFileSync(join(b.tmp, 'dialog', 'transcript.md'), 'utf8'), /zażółć/);
  } finally {
    await finish(b);
  }
});

test('asks are refused once the end has started', async () => {
  const b = await bridge({ forkEnv: { FAKE_DELAY_MS: '300' } }); // the end message keeps the fork busy
  try {
    await call(b.port, 'POST', '/api/end', { body: {} });            // `ending` is set before end() awaits anything
    const r = JSON.parse((await call(b.port, 'POST', '/api/ask', { body: { request: 'późno' } })).body);
    assert.equal(r.answer, 'Rozmowa się kończy.');
    await b.done;
    assert.equal(existsSync(join(b.tmp, 'asks.jsonl')), false);
  } finally {
    await finish(b);
  }
});

test('a refused ask answers at once, without waiting for a transcript', async () => {
  const b = await bridge({ transcriptWaitMs: 2000, forkEnv: { FAKE_DELAY_MS: '300' } });
  try {
    await call(b.port, 'POST', '/api/end', { body: {} });
    const t0 = Date.now();
    assert.equal(JSON.parse((await call(b.port, 'POST', '/api/ask', { body: { request: 'późno' } })).body).answer, 'Rozmowa się kończy.');
    assert.ok(Date.now() - t0 < 1000);
  } finally {
    await finish(b);
  }
});

test('an end posted during a running ask still gives the end turn its own time', async () => {
  // Every fork turn takes 400 ms; the end turn queued behind the ask starts 250 ms after its call
  // and ends 650 ms after it, past endTurnMs counted from the call.
  const b = await bridge({ forkEnv: { FAKE_DELAY_MS: '400' }, askTimeoutMs: 1000, endTurnMs: 500 });
  try {
    await waitFor(async () => (await status(b)).forkReady, 5000);
    const asked = call(b.port, 'POST', '/api/ask', { body: { request: 'w toku' } });
    await sleep(200); // transcriptWaitMs is 50 ms: the ask is in the fork now
    await call(b.port, 'POST', '/api/end', { body: {} });
    const report = await b.done;
    assert.match(JSON.parse((await asked).body).answer, /^echo: Agent głosowy przekazuje: w toku/);
    assert.match(report, /deletion: no conversation id\n/); // no "fork end turn timed out" note
  } finally {
    await finish(b);
  }
});

test('status reports the fork ready only after its introduction', async () => {
  const b = await bridge({ forkEnv: { FAKE_DELAY_MS: '400' } });
  try {
    assert.equal(JSON.parse((await call(b.port, 'GET', '/api/status')).body).forkReady, false);
    await waitFor(async () => JSON.parse((await call(b.port, 'GET', '/api/status')).body).forkReady, 3000);
    assert.deepEqual(await status(b), { forkReady: true, forkExited: false, ending: false, interruption: 'contextual-update',
      state: 'waiting', callLive: false, calls: 0, pausedUntil: null, label: '', agentHangup: 'pause', rejoinFirstMessage: true, undelivered: 0 });
  } finally {
    await finish(b);
  }
});

test('the live file names the session, origin and URL while the bridge runs and is gone after the end', async () => {
  const b = await bridge({ origin: 'hub' });
  try {
    const liveFile = join(b.tmp, 'dialog', 'bridge.json');
    const live = JSON.parse(readFileSync(liveFile, 'utf8'));
    assert.deepEqual(live, { sessionId: 's', origin: 'hub', url: b.url, pid: process.pid, startedAt: live.startedAt });
    assert.match(live.startedAt, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/);
    assert.equal(existsSync(join(b.tmp, 'dialog', '.url')), false);
    await call(b.port, 'POST', '/api/end', { body: {} });
    assert.match(await b.done, /^TALK CLOSING REPORT\ndialog: .+\norigin: hub\n/);
    assert.equal(existsSync(liveFile), false);
  } finally {
    await finish(b);
  }
});

test('a failure in the end still deletes every known conversation and reports it', async () => {
  const b = await bridge();
  try {
    await call(b.port, 'POST', '/api/heartbeat', { body: { conversationId: 'conv_x' } });
    rmSync(join(b.tmp, 'dialog'), { recursive: true, force: true }); // transcript.md cannot be written now
    await call(b.port, 'POST', '/api/end', { body: {} });
    const report = await b.done;
    assert.deepEqual(b.eleven.calls.filter((c) => c[0] === 'delete').map((c) => c[1]), ['conv_x']);
    assert.match(report, /deletion: deleted/);
    assert.match(report, /transcript not written/);
  } finally {
    await finish(b);
  }
});

test('the transcript names Rafal, the agent and the page notes', async () => {
  const b = await bridge();
  try {
    await call(b.port, 'POST', '/api/transcript', { body: { role: 'user', text: 'pierwsze' } });
    await call(b.port, 'POST', '/api/transcript', { body: { role: 'agent', text: 'drugie' } });
    await call(b.port, 'POST', '/api/transcript', { body: { role: 'note', text: 'trzecie' } });
    await call(b.port, 'POST', '/api/end', { body: {} });
    await b.done;
    const transcript = readFileSync(join(b.tmp, 'dialog', 'transcript.md'), 'utf8');
    assert.match(transcript, /^# Transcript\n\n- \S+ \*\*Rafał\*\*: pierwsze\n- \S+ \*\*Agent\*\*: drugie\n- \S+ \*\*Notatka\*\*: trzecie\n$/);
  } finally {
    await finish(b);
  }
});

test('a conversation id that is not a plain id never reaches ElevenLabs', async () => {
  const b = await bridge();
  try {
    await call(b.port, 'POST', '/api/heartbeat', { body: { conversationId: '../agents/agent_1' } });
    await call(b.port, 'POST', '/api/end', { body: { conversationId: { id: 'conv_1' } } });
    const report = await b.done;
    assert.deepEqual(b.eleven.calls, []);
    assert.match(report, /deletion: no conversation id/);
  } finally {
    await finish(b);
  }
});

test('no new ElevenLabs conversation token once the end has started', async () => {
  const b = await bridge({ forkEnv: { FAKE_DELAY_MS: '300' } });
  try {
    await call(b.port, 'POST', '/api/end', { body: {} });
    assert.equal((await call(b.port, 'GET', '/api/conversation-token')).status, 409);
    assert.equal((await status(b)).ending, true);
    await b.done;
    assert.deepEqual(b.eleven.calls, []);
  } finally {
    await finish(b);
  }
});

test('a missing static file or an unknown path answers without crashing the bridge', async () => {
  const b = await bridge();
  try {
    for (const path of ['/talk.mjs', '/vendor/elevenlabs-client.iife.js', '/vendor/libsamplerate.worklet.js']) {
      assert.ok([200, 404].includes((await call(b.port, 'GET', path)).status), path);
    }
    assert.equal((await call(b.port, 'GET', '/../config.json')).status, 404);
    assert.equal((await call(b.port, 'GET', '/nope')).status, 404);
    assert.equal((await status(b)).ending, false);
  } finally {
    await finish(b);
  }
});

test('the ask tracker module is served with the token and refused without it', async () => {
  const b = await bridge();
  try {
    const ok = await call(b.port, 'GET', '/ask-tracker.mjs');
    assert.equal(ok.status, 200);
    assert.match(ok.body, /createAskTracker/);
    assert.notEqual((await call(b.port, 'GET', '/ask-tracker.mjs', { withToken: false })).status, 200);
  } finally {
    await finish(b);
  }
});

test('a fork that exits before its introduction ends the bridge at once, with its stderr in the report', async () => {
  const scripts = mkdtempSync(join(tmpdir(), 'x-'));
  writeFileSync(join(scripts, 'exit.mjs'), "process.stderr.write('Error: no conversation found\\nsecond; line\\n', () => process.exit(1));\n");
  const b = await bridge({ command: [process.execPath, join(scripts, 'exit.mjs')], firstBeatDeadlineMs: 20000 });
  try {
    let timer;
    const limit = new Promise((resolve) => { timer = setTimeout(() => resolve('the bridge did not end within 5 s'), 5000); });
    const report = await Promise.race([b.done, limit]).finally(() => clearTimeout(timer));
    // A `;` from stderr would split the note into two segments of the deletion line (SKILL.md reads it by `;`).
    assert.match(report, /deletion: no conversation id; fork exited before the end turn; fork stderr: Error: no conversation found second, line\n/);
  } finally {
    await finish(b);
  }
});

test('a fork that exits after its introduction: an ask answers at once that its process ended, and status says it exited', async () => {
  const b = await bridge({ forkEnv: { FAKE_EXIT_AFTER_FIRST: '1' }, askTimeoutMs: 5000 });
  try {
    await waitFor(async () => (await status(b)).forkReady, 5000);
    const t0 = Date.now();
    const r = JSON.parse((await call(b.port, 'POST', '/api/ask', { body: { request: 'pytanie' } })).body);
    assert.equal(r.answer, 'Claude nie odpowie, bo jego proces się zakończył. Zakończ rozmowę.');
    assert.ok(Date.now() - t0 < 2000);
    assert.deepEqual(await status(b), { forkReady: false, forkExited: true, ending: false, interruption: 'contextual-update',
      state: 'waiting', callLive: false, calls: 0, pausedUntil: null, label: '', agentHangup: 'pause', rejoinFirstMessage: true, undelivered: 0 });
    await call(b.port, 'POST', '/api/end', { body: {} });
    assert.match(await b.done, /deletion: no conversation id; fork exited before the end turn; fork stderr: fake: crashed after the introduction\n/);
  } finally {
    await finish(b);
  }
});

test('an ElevenLabs call that never answers at the end is cut off and reported', async () => {
  const b = await bridge({ elevenTimeoutMs: 100 });
  try {
    b.eleven.getConversation = () => new Promise(() => {});
    b.eleven.deleteConversation = () => new Promise(() => {});
    await call(b.port, 'POST', '/api/heartbeat', { body: { conversationId: 'conv_h' } });
    await call(b.port, 'POST', '/api/end', { body: {} });
    const report = await b.done;
    assert.match(report, /deletion: conv_h failed: no answer in 100 ms\n/);
    assert.match(report, /conversations: conv_h \(unknown\)\n/);
  } finally {
    await finish(b);
  }
});

test('the fork behind the bridge never gets the ElevenLabs key', async () => {
  const b = await bridge({ forkEnv: { ELEVENLABS_API_KEY: 'secret' } });
  try {
    const r = JSON.parse((await call(b.port, 'POST', '/api/ask', { body: { request: 'klucz' } })).body);
    assert.match(r.answer, /^echo: /);
    assert.doesNotMatch(r.answer, /\[key\]/);
  } finally {
    await finish(b);
  }
});

test('a port already in use rejects the start instead of hanging', { timeout: 10000 }, async () => {
  const busy = createServer();
  await new Promise((r) => busy.listen(0, '127.0.0.1', r));
  try {
    await assert.rejects(bridge({ port: busy.address().port }), { code: 'EADDRINUSE' });
  } finally {
    busy.close();
  }
});

// --- a dialog of calls (Plan 3, Task 2) ---

test('a call end without an end request pauses: the call is deleted and the transcript written, the fork stays', async () => {
  const b = await bridge();
  try {
    await call(b.port, 'POST', '/api/heartbeat', { body: { conversationId: 'conv_a' } });
    await call(b.port, 'POST', '/api/transcript', { body: { role: 'user', text: 'pierwsze' } });
    await call(b.port, 'POST', '/api/call-end', { body: { conversationId: 'conv_a', reason: 'agent', context: 'end_call' } });
    const s = JSON.parse((await call(b.port, 'GET', '/api/status')).body);
    assert.equal(s.state, 'paused');
    assert.equal(s.calls, 1);
    assert.equal(s.callLive, false);
    assert.ok(Date.parse(s.pausedUntil) > Date.now());
    assert.equal(s.ending, false);
    assert.deepEqual(b.eleven.calls.filter((c) => c[0] === 'delete').map((c) => c[1]), ['conv_a']);
    assert.match(readFileSync(join(b.tmp, 'dialog', 'transcript.md'), 'utf8'), /pierwsze[\s\S]*call ended: agent\/end_call/);
    assert.equal((await call(b.port, 'GET', '/api/conversation-token')).status, 200);
    await call(b.port, 'POST', '/api/end', { body: {} });
    assert.match(await b.done, /conversations: conv_a \(30 s\)/);
    assert.equal(b.eleven.calls.filter((c) => c[0] === 'delete').length, 1);
  } finally {
    await finish(b);
  }
});

test('an end request makes the end of the current call end the dialog', async () => {
  const b = await bridge({ forkEnv: { FAKE_DELAY_MS: '300' } }); // the end turn keeps the bridge up for the last status
  try {
    await call(b.port, 'POST', '/api/heartbeat', { body: { conversationId: 'conv_a' } });
    await call(b.port, 'POST', '/api/end-request', { body: {} });
    assert.equal((await status(b)).state, 'in-call');
    await call(b.port, 'POST', '/api/call-end', { body: { conversationId: 'conv_a', reason: 'agent', context: 'end_call' } });
    assert.equal((await status(b)).state, 'ending');
    const report = await doneWithin(b, 5000);
    assert.match(report, /deletion: deleted\nconversations: conv_a \(30 s\)\n/);
    assert.deepEqual(b.eleven.calls.filter((c) => c[0] === 'delete').map((c) => c[1]), ['conv_a']);
  } finally {
    await finish(b);
  }
});

test('an end request or the end button during a pause ends the dialog at once', async () => {
  for (const route of ['/api/end-request', '/api/end']) {
    const b = await bridge();
    try {
      await call(b.port, 'POST', '/api/heartbeat', { body: { conversationId: 'conv_a' } });
      await call(b.port, 'POST', '/api/call-end', { body: { conversationId: 'conv_a', reason: 'user' } });
      assert.equal((await status(b)).state, 'paused', route);
      await call(b.port, 'POST', route, { body: {} });
      assert.match(await doneWithin(b, 5000), /deletion: deleted\nconversations: conv_a \(30 s\)\n/, route);
      assert.equal(b.eleven.calls.filter((c) => c[0] === 'delete').length, 1, route);
    } finally {
      await finish(b);
    }
  }
});

test('agentHangup end: an end_call context ends the dialog, a close context pauses it', async () => {
  const b = await bridge({ agentHangup: 'end' });
  try {
    assert.equal((await status(b)).agentHangup, 'end');
    await call(b.port, 'POST', '/api/heartbeat', { body: { conversationId: 'conv_a' } });
    await call(b.port, 'POST', '/api/call-end', { body: { conversationId: 'conv_a', reason: 'agent', context: 'close' } });
    assert.equal((await status(b)).state, 'paused');
    await call(b.port, 'POST', '/api/heartbeat', { body: { conversationId: 'conv_b' } });
    assert.equal((await status(b)).state, 'in-call');
    await call(b.port, 'POST', '/api/call-end', { body: { conversationId: 'conv_b', reason: 'agent', context: 'end_call' } });
    assert.match(await doneWithin(b, 5000), /deletion: deleted\nconversations: conv_a \(30 s\), conv_b \(30 s\)\n/);
  } finally {
    await finish(b);
  }
});

test('the pause limit ends a paused dialog with its report, and a new call cancels it', async () => {
  const b = await bridge({ pauseLimitMs: 300 });
  try {
    await call(b.port, 'POST', '/api/heartbeat', { body: { conversationId: 'conv_a' } });
    await call(b.port, 'POST', '/api/call-end', { body: { conversationId: 'conv_a', reason: 'user' } });
    assert.match(await doneWithin(b, 2000), /deletion: deleted\nconversations: conv_a \(30 s\)\n/);
  } finally {
    await finish(b);
  }
  const c = await bridge({ pauseLimitMs: 300 });
  try {
    await call(c.port, 'POST', '/api/heartbeat', { body: { conversationId: 'conv_a' } });
    await call(c.port, 'POST', '/api/call-end', { body: { conversationId: 'conv_a', reason: 'user' } });
    await call(c.port, 'POST', '/api/heartbeat', { body: { conversationId: 'conv_b' } });
    await sleep(600);
    const s = await status(c);
    assert.equal(s.state, 'in-call');
    assert.equal(s.pausedUntil, null);
    assert.equal(s.calls, 2);
  } finally {
    await finish(c);
  }
});

test('a token is refused while another call is live and allowed once its heartbeat is lost', async () => {
  const b = await bridge({ heartbeatGraceMs: 300 });
  try {
    await call(b.port, 'POST', '/api/heartbeat', { body: { conversationId: 'conv_a' } });
    const refused = await call(b.port, 'GET', '/api/conversation-token');
    assert.equal(refused.status, 409);
    assert.deepEqual(JSON.parse(refused.body), { error: 'call-live' });
    await waitFor(async () => (await call(b.port, 'GET', '/api/conversation-token')).status === 200, 3000);
    await call(b.port, 'POST', '/api/end', { body: {} });
    await b.done;
  } finally {
    await finish(b);
  }
});

test('status carries the label and the configuration the page needs', async () => {
  const b = await bridge({ label: 'notatki · abcdef12' });
  try {
    const s = await status(b);
    assert.equal(s.label, 'notatki · abcdef12');
    assert.equal(s.agentHangup, 'pause');
    assert.equal(s.rejoinFirstMessage, true);
    assert.equal(s.state, 'waiting');
    assert.equal(s.calls, 0);
    assert.equal(s.callLive, false);
    assert.equal(s.pausedUntil, null);
  } finally {
    await finish(b);
  }
});

test('a fork that exits during a pause ends the dialog at once', async () => {
  // The fake fork introduces itself 500 ms in and exits right after: the call below has ended by then.
  const b = await bridge({ forkEnv: { FAKE_DELAY_MS: '500', FAKE_EXIT_AFTER_FIRST: '1' } });
  try {
    await call(b.port, 'POST', '/api/heartbeat', { body: { conversationId: 'conv_a' } });
    await call(b.port, 'POST', '/api/call-end', { body: { conversationId: 'conv_a', reason: 'agent', context: 'end_call' } });
    assert.equal((await status(b)).state, 'paused');
    const report = await doneWithin(b, 2000);
    assert.match(report, /deletion: deleted; fork exited before the end turn; fork stderr: fake: crashed after the introduction\nconversations: conv_a \(30 s\)\n/);
  } finally {
    await finish(b);
  }
});

test('a call whose fork exited ends the dialog instead of pausing it', async () => {
  const b = await bridge({ forkEnv: { FAKE_DELAY_MS: '300', FAKE_EXIT_AFTER_FIRST: '1' } });
  try {
    await call(b.port, 'POST', '/api/heartbeat', { body: { conversationId: 'conv_a' } });
    await waitFor(async () => (await status(b)).forkReady, 5000);
    await sleep(300); // the fake exits right after its introduction; no ask sees the exit
    assert.equal((await status(b)).state, 'in-call');
    await call(b.port, 'POST', '/api/call-end', { body: { conversationId: 'conv_a', reason: 'agent', context: 'end_call' } });
    // The bridge may have closed already; only a status it still answers could say paused.
    const after = await call(b.port, 'GET', '/api/status').then((r) => JSON.parse(r.body).state, () => 'closed');
    assert.notEqual(after, 'paused');
    assert.match(await doneWithin(b, 5000), /deletion: deleted; fork exited before the end turn; fork stderr: fake: crashed after the introduction\nconversations: conv_a \(30 s\)\n/);
  } finally {
    await finish(b);
  }
});

// --- what a later call knows (Plan 3, Task 3) ---

const answerOf = async (b, request, conversationId) =>
  JSON.parse((await call(b.port, 'POST', '/api/ask', { body: { request, conversationId } })).body).answer;
const rejoinContext = async (b) => JSON.parse((await call(b.port, 'GET', '/api/rejoin-context')).body);

test('the first ask of a later call carries the break note, once, and the snapshot is refreshed', async () => {
  const repo = mkdtempSync(join(tmpdir(), 'r-'));
  assert.equal(spawnSync('git', ['init', '-q', repo]).status, 0);
  const b = await bridge({ cwd: repo });
  try {
    await call(b.port, 'POST', '/api/heartbeat', { body: { conversationId: 'conv_a' } });
    await call(b.port, 'POST', '/api/call-end', { body: { conversationId: 'conv_a', reason: 'agent', context: 'end_call' } });
    rmSync(join(b.tmp, 'dialog', 'context', 'status.txt')); // throws if the first snapshot did not write it
    await call(b.port, 'POST', '/api/heartbeat', { body: { conversationId: 'conv_b' } });
    const first = JSON.parse((await call(b.port, 'POST', '/api/ask', { body: { request: 'dalej', conversationId: 'conv_b' } })).body).answer;
    assert.match(first, /^echo: \(Rafał wrócił do rozmowy po 1 min przerwy\. Migawka git w context\/ odświeżona o \d\d:\d\d\.\)\nAgent głosowy przekazuje: dalej/);
    assert.ok(existsSync(join(b.tmp, 'dialog', 'context', 'status.txt')));
    const second = JSON.parse((await call(b.port, 'POST', '/api/ask', { body: { request: 'jeszcze', conversationId: 'conv_b' } })).body).answer;
    assert.match(second, /^echo: Agent głosowy przekazuje: jeszcze/);
  } finally {
    await finish(b);
  }
});

test('a call renewed after the duration limit tells the fork so', async () => {
  const b = await bridge();
  try {
    await call(b.port, 'POST', '/api/heartbeat', { body: { conversationId: 'conv_a' } });
    await call(b.port, 'POST', '/api/call-end', { body: { conversationId: 'conv_a', reason: 'error', context: 'max_duration_exceeded' } });
    await call(b.port, 'POST', '/api/heartbeat', { body: { conversationId: 'conv_b' } });
    assert.match(await answerOf(b, 'dalej', 'conv_b'),
      /^echo: \(Połączenie odnowione po limicie czasu\. Migawka git w context\/ odświeżona o \d\d:\d\d\.\)\nAgent głosowy przekazuje: dalej/);
  } finally {
    await finish(b);
  }
});

test('the first call carries no note', async () => {
  const b = await bridge();
  try {
    await call(b.port, 'POST', '/api/heartbeat', { body: { conversationId: 'conv_a' } });
    assert.match(await answerOf(b, 'pierwsze', 'conv_a'), /^echo: Agent głosowy przekazuje:/);
  } finally {
    await finish(b);
  }
});

test('a reloaded page during a call carries no note and takes no snapshot (Ruling T3-1)', async () => {
  const b = await bridge();
  try {
    await call(b.port, 'POST', '/api/heartbeat', { body: { conversationId: 'conv_a' } });
    rmSync(join(b.tmp, 'dialog', 'context', 'snapshot.json'));
    await call(b.port, 'POST', '/api/heartbeat', { body: { conversationId: 'conv_b' } }); // conv_a is still live
    assert.match(await answerOf(b, 'po odświeżeniu', 'conv_b'), /^echo: Agent głosowy przekazuje: po odświeżeniu/);
    assert.equal(existsSync(join(b.tmp, 'dialog', 'context', 'snapshot.json')), false);
  } finally {
    await finish(b);
  }
});

test('an answer that arrives after its call ended goes into the next call, once', async () => {
  const b = await bridge({ forkEnv: { FAKE_DELAY_MS: '300' } });
  try {
    await call(b.port, 'POST', '/api/heartbeat', { body: { conversationId: 'conv_a' } });
    const asked = call(b.port, 'POST', '/api/ask', { body: { request: 'wolne', conversationId: 'conv_a' } });
    await call(b.port, 'POST', '/api/call-end', { body: { conversationId: 'conv_a', reason: 'error', context: 'connection_state_changed' } });
    await asked;
    await call(b.port, 'POST', '/api/heartbeat', { body: { conversationId: 'conv_b' } });
    const context = async () => JSON.parse((await call(b.port, 'GET', '/api/rejoin-context')).body);
    const first = await context();
    assert.match(first.text, /^Dalszy ciąg rozmowy po przerwie\. Ostatnie wypowiedzi:/);
    assert.match(first.text, /Odpowiedź Claude na pytanie „wolne”, której nie usłyszałeś: echo: /);
    assert.equal(first.undelivered, 1);
    assert.match((await context()).text, /której nie usłyszałeś/); // not sent yet: still there
    await call(b.port, 'POST', '/api/rejoin-context-sent', { body: { undelivered: 1 } });
    assert.doesNotMatch((await context()).text, /której nie usłyszałeś/);
    await call(b.port, 'POST', '/api/end', { body: {} }); await b.done;
  } finally {
    await finish(b);
  }
});

test('an answer that the next call asked for again is heard there and not kept', async () => {
  const b = await bridge({ forkEnv: { FAKE_DELAY_MS: '300' } });
  try {
    await call(b.port, 'POST', '/api/heartbeat', { body: { conversationId: 'conv_a' } });
    const asked = answerOf(b, 'wolne', 'conv_a');
    await call(b.port, 'POST', '/api/call-end', { body: { conversationId: 'conv_a', reason: 'error', context: 'connection_state_changed' } });
    await call(b.port, 'POST', '/api/heartbeat', { body: { conversationId: 'conv_b' } });
    const again = answerOf(b, 'wolne', 'conv_b'); // joins the ask in flight
    const [a1, a2] = await Promise.all([asked, again]);
    assert.equal(a2, a1);
    assert.deepEqual(await rejoinContext(b), { text: 'Dalszy ciąg rozmowy po przerwie. Ostatnie wypowiedzi:', undelivered: 0, answers: '' });
  } finally {
    await finish(b);
  }
});

test('the rejoin context carries the last eight lines of Rafal and the agent, without notes', async () => {
  const b = await bridge();
  try {
    for (let n = 1; n <= 10; n += 1) {
      await call(b.port, 'POST', '/api/transcript', { body: { role: n % 2 ? 'user' : 'agent', text: `linia ${n}` } });
      if (n === 3 || n === 9) await call(b.port, 'POST', '/api/transcript', { body: { role: 'note', text: `notatka ${n}` } });
    }
    const lines = [3, 4, 5, 6, 7, 8, 9, 10].map((n) => `- ${n % 2 ? 'Rafał' : 'Agent'}: linia ${n}`);
    assert.deepEqual(await rejoinContext(b), { text: ['Dalszy ciąg rozmowy po przerwie. Ostatnie wypowiedzi:', ...lines].join('\n'), undelivered: 0, answers: '' });
  } finally {
    await finish(b);
  }
});

test('history returns the transcript so far', async () => {
  const b = await bridge();
  try {
    await call(b.port, 'POST', '/api/transcript', { body: { role: 'user', text: 'pierwsze' } });
    await call(b.port, 'POST', '/api/transcript', { body: { role: 'agent', text: 'drugie' } });
    const history = JSON.parse((await call(b.port, 'GET', '/api/history')).body);
    const [at1, at2] = history.transcript.map((t) => t.at);
    assert.deepEqual(history, { transcript: [{ at: at1, role: 'user', text: 'pierwsze' }, { at: at2, role: 'agent', text: 'drugie' }] });
    for (const at of [at1, at2]) assert.match(at, /^\d{1,2}:\d\d:\d\d$/);
  } finally {
    await finish(b);
  }
});

// --- fix round 1 of Task 3 ---

// Sends an ask and closes its connection after `ms` without reading an answer, as a closed tab does.
function abandonedAsk(port, body, ms) {
  return new Promise((resolve) => {
    const req = request({ host: '127.0.0.1', port, method: 'POST', path: `/api/ask?t=${token}`,
      headers: { host: `127.0.0.1:${port}`, 'content-type': 'application/json' } });
    req.on('error', () => {});
    req.end(JSON.stringify(body));
    setTimeout(() => { req.destroy(); resolve(); }, ms);
  });
}

test('the answer to an ask whose tab closed is kept, although its call is still live', async () => {
  // The heartbeat grace stays at 15 s, so conv_a is live when the answer comes 500 ms after the ask.
  const b = await bridge({ forkEnv: { FAKE_DELAY_MS: '500' } });
  try {
    await call(b.port, 'POST', '/api/heartbeat', { body: { conversationId: 'conv_a' } });
    await abandonedAsk(b.port, { request: 'wolne', conversationId: 'conv_a' }, 200);
    await waitFor(async () => (await status(b)).undelivered === 1, 5000);
    assert.equal((await status(b)).callLive, true);
    assert.match((await rejoinContext(b)).answers, /^Odpowiedź Claude na pytanie „wolne”, której nie usłyszałeś: echo: Agent głosowy przekazuje: wolne/);
  } finally {
    await finish(b);
  }
});

test('status counts the kept answers, and the rejoin context gives them alone in answers (Ruling T3-2)', async () => {
  const b = await bridge({ forkEnv: { FAKE_DELAY_MS: '300' } });
  try {
    await call(b.port, 'POST', '/api/heartbeat', { body: { conversationId: 'conv_a' } });
    await call(b.port, 'POST', '/api/transcript', { body: { role: 'user', text: 'zdanie Rafała' } });
    const asked = answerOf(b, 'wolne', 'conv_a');
    await call(b.port, 'POST', '/api/call-end', { body: { conversationId: 'conv_a', reason: 'error', context: 'connection_state_changed' } });
    await asked;
    await call(b.port, 'POST', '/api/heartbeat', { body: { conversationId: 'conv_b' } });
    assert.equal((await status(b)).undelivered, 1);
    const kept = 'Odpowiedź Claude na pytanie „wolne”, której nie usłyszałeś: echo: Agent głosowy przekazuje: wolne Rafał (transkrypcja): zdanie Rafała';
    assert.deepEqual(await rejoinContext(b), { text: `Dalszy ciąg rozmowy po przerwie. Ostatnie wypowiedzi:\n- Rafał: zdanie Rafała\n${kept}`, undelivered: 1, answers: kept });
    await call(b.port, 'POST', '/api/rejoin-context-sent', { body: { undelivered: 1 } });
    assert.equal((await status(b)).undelivered, 0);
    assert.equal((await rejoinContext(b)).answers, '');
  } finally {
    await finish(b);
  }
});

test('a transcript line and an answer with line breaks each take one line of the rejoin context', async () => {
  const b = await bridge();
  try {
    await call(b.port, 'POST', '/api/transcript', { body: { role: 'user', text: 'pierwsza\ndruga' } });
    await call(b.port, 'POST', '/api/transcript', { body: { role: 'agent', text: 'trzecia\r\nczwarta' } });
    await call(b.port, 'POST', '/api/heartbeat', { body: { conversationId: 'conv_a' } });
    await call(b.port, 'POST', '/api/call-end', { body: { conversationId: 'conv_a', reason: 'user' } });
    await answerOf(b, 'pytanie\nw dwóch liniach', 'conv_a'); // conv_a has ended: the answer is kept
    assert.deepEqual((await rejoinContext(b)).text.split('\n'), [
      'Dalszy ciąg rozmowy po przerwie. Ostatnie wypowiedzi:',
      '- Rafał: pierwsza druga',
      '- Agent: trzecia czwarta',
      'Odpowiedź Claude na pytanie „pytanie w dwóch liniach”, której nie usłyszałeś: echo: Agent głosowy przekazuje: pytanie w dwóch liniach Rafał (transkrypcja): pierwsza druga',
    ]);
  } finally {
    await finish(b);
  }
});
