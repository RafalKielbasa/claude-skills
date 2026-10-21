import { test } from 'node:test';
import assert from 'node:assert/strict';
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

// Every test ends its bridge here, so a failed assertion fails the test instead of leaving a bridge
// and its fork running; a bridge that already ended refuses the connection, which is ignored.
async function finish(b) {
  await call(b.port, 'POST', '/api/end', { body: {} }).catch(() => {});
  let timer;
  const limit = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('the bridge did not end within 10 s')), 10000); });
  try { return await Promise.race([b.done, limit]); } finally { clearTimeout(timer); }
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

test('a lost heartbeat ends the conversation and deletes it', async () => {
  const b = await bridge({ heartbeatGraceMs: 200 });
  try {
    await call(b.port, 'POST', '/api/heartbeat', { body: { conversationId: 'conv_2' } });
    const report = await b.done;
    assert.match(report, /deletion: deleted/);
    assert.deepEqual(b.eleven.calls.filter((c) => c[0] === 'delete'), [['delete', 'conv_2']]);
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
    assert.deepEqual(await status(b), { forkReady: true, forkExited: false, ending: false, interruption: 'contextual-update' });
  } finally {
    await finish(b);
  }
});

test('the URL file exists while the bridge runs and is gone after the end', async () => {
  const b = await bridge();
  try {
    const urlFile = join(b.tmp, 'dialog', '.url');
    assert.equal(readFileSync(urlFile, 'utf8'), b.url);
    await call(b.port, 'POST', '/api/end', { body: {} });
    await b.done;
    assert.equal(existsSync(urlFile), false);
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
    assert.deepEqual(await status(b), { forkReady: false, forkExited: true, ending: false, interruption: 'contextual-update' });
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
