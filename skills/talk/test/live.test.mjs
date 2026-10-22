import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findLiveDialog, probeBridge } from '../lib/live.mjs';

function liveFile(root, project, name, body) {
  const dir = join(root, 'projects', project, 'dialogs', name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'bridge.json'), typeof body === 'string' ? body : JSON.stringify(body), 'utf8');
  return dir;
}

test('a live dialog is found by its session and a bridge.json whose bridge does not answer is not', async () => {
  const root = mkdtempSync(join(tmpdir(), 'talk-live-'));
  const d1 = liveFile(root, 'p', 'd1', { sessionId: 's1', origin: 'hub', url: 'http://127.0.0.1:1/?t=x' });
  liveFile(root, 'p', 'd2', { sessionId: 's2', origin: 'session', url: 'http://127.0.0.1:2/?t=y' });
  // A dialog directory without the file, and a file that is not JSON, are passed over.
  mkdirSync(join(root, 'projects', 'p', 'dialogs', 'd3'));
  liveFile(root, 'q', 'd4', '{"sessionId":"s1"');
  assert.deepEqual(await findLiveDialog({ root, sessionId: 's1', isLive: async () => true }), { dir: d1, url: 'http://127.0.0.1:1/?t=x', origin: 'hub' });
  assert.equal(await findLiveDialog({ root, sessionId: 's1', isLive: async () => false }), null);
  assert.equal(await findLiveDialog({ root, sessionId: 's3', isLive: async () => true }), null);
  assert.equal(await findLiveDialog({ root: join(root, 'missing'), sessionId: 's1' }), null);
});

// A stand-in for the bridge's status route: 200 with `ending` for the right token, 403 otherwise.
async function statusServer(answer) {
  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://local');
    if (url.pathname !== '/api/status' || url.searchParams.get('t') !== 'tok') { res.writeHead(403); res.end('token'); return; }
    answer(res);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { server, url: `http://127.0.0.1:${server.address().port}/?t=tok` };
}

test('a bridge is live only when its status answers 200 with ending false, within the probe timeout', async () => {
  const running = await statusServer((res) => { res.writeHead(200, { 'content-type': 'application/json' }); res.end('{"ending":false}'); });
  const ending = await statusServer((res) => { res.writeHead(200, { 'content-type': 'application/json' }); res.end('{"ending":true}'); });
  const silent = await statusServer(() => { /* never answers */ });
  try {
    assert.equal(await probeBridge(running.url), true);
    assert.equal(await probeBridge(running.url.replace('t=tok', 't=bad')), false);
    assert.equal(await probeBridge(ending.url), false);
    const before = Date.now();
    assert.equal(await probeBridge(silent.url), false);
    assert.ok(Date.now() - before < 3000);
    // Only a bridge on 127.0.0.1 is probed.
    assert.equal(await probeBridge(running.url.replace('127.0.0.1', 'localhost')), false);
    assert.equal(await probeBridge('not a url'), false);
  } finally {
    for (const { server } of [running, ending, silent]) { server.closeAllConnections(); server.close(); }
  }
});
