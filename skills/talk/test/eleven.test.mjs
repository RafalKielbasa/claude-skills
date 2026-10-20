import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElevenClient } from '../lib/eleven.mjs';

test('every ElevenLabs request carries xi-api-key and a failed delete is reported, not thrown', async () => {
  const seen = [];
  const fetch = async (url, init) => { seen.push([url, init]); return new Response('gone', { status: 404 }); };
  const r = await createElevenClient({ apiKey: 'k', fetch }).deleteConversation('c1');
  assert.deepEqual(r, { ok: false, status: 404, text: 'gone' });
  assert.equal(seen[0][0], 'https://api.elevenlabs.io/v1/convai/conversations/c1');
  assert.equal(seen[0][1].method, 'DELETE');
  assert.equal(seen[0][1].headers['xi-api-key'], 'k');
});

test('a network failure on delete is reported, not thrown', async () => {
  const fetch = async () => { throw new Error('offline'); };
  const r = await createElevenClient({ apiKey: 'k', fetch }).deleteConversation('c1');
  assert.equal(r.ok, false);
  assert.match(r.text, /offline/);
});

test('the conversation token comes from the agent token endpoint', async () => {
  const seen = [];
  const fetch = async (url, init) => { seen.push([url, init]); return Response.json({ token: 'tok' }); };
  assert.deepEqual(await createElevenClient({ apiKey: 'k', fetch }).getConversationToken('agent_1'), { token: 'tok' });
  assert.equal(seen[0][0], 'https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=agent_1');
});

test('tools and agents use the documented endpoints and methods', async () => {
  const seen = [];
  const fetch = async (url, init) => { seen.push([init.method, url, init.body]); return Response.json({ id: 'x' }); };
  const c = createElevenClient({ apiKey: 'k', fetch });
  await c.createTool({ a: 1 });
  await c.updateTool('t1', { b: 2 });
  await c.createAgent({ c: 3 });
  await c.updateAgent('a1', { d: 4 });
  await c.getAgent('a1');
  await c.getConversation('c9');
  const base = 'https://api.elevenlabs.io';
  assert.deepEqual(seen.map(([m, u]) => [m, u]), [
    ['POST', `${base}/v1/convai/tools`],
    ['PATCH', `${base}/v1/convai/tools/t1`],
    ['POST', `${base}/v1/convai/agents/create`],
    ['PATCH', `${base}/v1/convai/agents/a1`],
    ['GET', `${base}/v1/convai/agents/a1`],
    ['GET', `${base}/v1/convai/conversations/c9`],
  ]);
  assert.equal(seen[1][2], '{"b":2}');
});

test('an API error carries the status and body but never the key', async () => {
  const fetch = async () => new Response('{"detail":"bad"}', { status: 401 });
  await assert.rejects(
    createElevenClient({ apiKey: 'secret-key-value', fetch }).getAgent('a1'),
    (e) => /401/.test(e.message) && /bad/.test(e.message) && !e.message.includes('secret-key-value'),
  );
});
