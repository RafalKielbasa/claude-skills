import { test } from 'node:test';
import assert from 'node:assert/strict';

// The page runs in Node against stand-ins for the DOM, fetch, the ElevenLabs client and its own
// timers, which a test fires by hand (no timer runs, nothing is left behind).
const PREPARING = 'Claude się przygotowuje…';
const NOT_STARTED = 'Claude nie wystartował. Zamknij kartę i sprawdź komunikat w sesji.';
const ENDED = 'Rozmowa zakończona. Możesz zamknąć kartę.';
const flush = async () => { for (let i = 0; i < 5; i += 1) await new Promise((r) => setImmediate(r)); };
const json = (body, status = 200) => ({ ok: status < 300, status, json: async () => body, text: async () => JSON.stringify(body) });
// The bridge answers its errors in text/plain: json() fails on them as it does in a browser.
const plain = (body, status) => ({ ok: status < 300, status, json: async () => JSON.parse(body), text: async () => body });
// A response a test holds back until it calls resolve().
const deferred = () => {
  let resolve;
  const promise = new Promise((r) => { resolve = r; });
  return { promise, resolve };
};
// The bridge's full status before the first call (Task 2); a test passes what differs.
const STATUS = { forkReady: true, forkExited: false, ending: false, interruption: 'contextual-update', state: 'waiting', callLive: false,
  calls: 0, pausedUntil: null, label: 'notatki · abcdef12', agentHangup: 'pause', rejoinFirstMessage: true, undelivered: 0 };
const ready = (changes = {}) => json({ ...STATUS, ...changes });
// A local time, so that the HH:MM the page shows is 14:05 in any time zone.
const PAUSED = { state: 'paused', calls: 1, pausedUntil: new Date(2026, 9, 22, 14, 5).toISOString() };
// Token responses come from a queue, one per call.
const routes = (overrides) => {
  const tokens = ['conv-tok', 'conv-tok-2'];
  return async (path) => {
    if (overrides[path]) return overrides[path]();
    if (path === '/api/conversation-token') return json({ token: tokens.shift() });
    if (path === '/api/history') return json({ transcript: [] });
    return json(path === '/api/decisions' ? { decisions: '' } : { ok: true });
  };
};

let loads = 0;
async function loadPage(route) {
  const elements = new Map();
  const node = (fields) => ({ textContent: '', children: [], append(...nodes) { this.children.push(...nodes); }, ...fields });
  const element = (id) => {
    if (!elements.has(id)) {
      elements.set(id, node({ disabled: false, listeners: {}, addEventListener(type, fn) { this.listeners[type] = fn; } }));
    }
    return elements.get(id);
  };
  const intervals = new Set();
  const timeouts = new Set();
  const sessions = [];
  const conversations = [];
  const requests = [];
  const posts = [];
  const saved = { fetch: globalThis.fetch, setInterval: globalThis.setInterval, clearInterval: globalThis.clearInterval,
    setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout };
  Object.assign(globalThis, {
    location: { search: '?t=tok' },
    document: { getElementById: element, createElement: () => node({ className: '' }), createTextNode: (text) => text },
    window: { ElevenLabsClient: { Conversation: { startSession: async (options) => {
      sessions.push(options);
      // As in the client, the first endSession reports the disconnect with reason user before it resolves.
      const conversation = {
        ended: 0,
        updates: [],
        refuses: false,
        async endSession() {
          conversation.ended += 1;
          if (conversation.ended === 1) options.onDisconnect({ reason: 'user' });
        },
        sendContextualUpdate(text) {
          if (conversation.refuses) throw new Error('not connected');
          conversation.updates.push(text);
        },
      };
      conversations.push(conversation);
      return conversation;
    } } } },
    fetch: async (url, init = {}) => {
      const path = String(url).split('?')[0];
      const method = init.method ?? 'GET';
      requests.push([method, path]);
      if (method === 'POST') posts.push([path, JSON.parse(init.body)]);
      return route(path);
    },
    setInterval: (fn, ms) => { const handle = { fn, ms }; intervals.add(handle); return handle; },
    clearInterval: (handle) => { intervals.delete(handle); },
    setTimeout: (fn, ms) => { const handle = { fn, ms }; timeouts.add(handle); return handle; },
    clearTimeout: (handle) => { timeouts.delete(handle); },
  });
  loads += 1;
  await import(`../web/talk.mjs?load=${loads}`); // a fresh page per test
  await flush();
  return {
    element,
    intervals,
    timeouts,
    sessions,
    conversations,
    requests,
    posts,
    flush,
    // The transcript list as [who, text] pairs.
    transcript: () => element('transcript').children.map((li) => li.children.map((c) => (typeof c === 'string' ? c : c.textContent))),
    // Fires the status poll (the 1 s interval) once, as the next tick would.
    pollStatus: async () => { for (const handle of [...intervals].filter((h) => h.ms === 1000)) handle.fn(); await flush(); },
    // Fires every pending timeout once.
    fireTimeouts: async () => {
      for (const handle of [...timeouts]) { timeouts.delete(handle); handle.fn(); }
      await flush();
    },
    click: async (id) => { await element(id).listeners.click(); await flush(); },
    restore: () => Object.assign(globalThis, saved),
  };
}

test('a fork reported as exited: the page says Claude did not start and stops polling', async () => {
  const page = await loadPage(routes({ '/api/status': () => json({ forkReady: false, forkExited: true, ending: false, interruption: 'contextual-update' }) }));
  try {
    assert.equal(page.element('status').textContent, NOT_STARTED);
    assert.equal(page.element('start').disabled, true);
    assert.equal(page.intervals.size, 0);
  } finally {
    page.restore();
  }
});

test('three failed status polls in a row mean the bridge is gone; fewer, or a success between them, do not', async () => {
  const results = ['fail', 'fail', 'ok', 'fail', 'fail', 'fail'];
  const page = await loadPage(routes({
    '/api/status': () => {
      if (results.shift() === 'fail') throw new TypeError('Failed to fetch');
      return json({ forkReady: false, forkExited: false, ending: false, interruption: 'contextual-update' });
    },
  }));
  try {
    await page.pollStatus(); // the poll at load and this one failed
    await page.pollStatus(); // a success resets the count
    await page.pollStatus();
    await page.pollStatus();
    assert.equal(page.element('status').textContent, PREPARING);
    assert.ok(page.intervals.size > 0);
    await page.pollStatus(); // the third failure in a row
    assert.equal(page.element('status').textContent, NOT_STARTED);
    assert.equal(page.element('start').disabled, true);
    assert.equal(page.intervals.size, 0);
  } finally {
    page.restore();
  }
});

test('a failed token request shows the bridge reason in Polish and lets Rafal try again', async () => {
  const reason = 'ElevenLabs GET /v1/convai/conversation/token?agent_id=agent_x: 401 {"detail":"invalid key"}';
  const page = await loadPage(routes({ '/api/status': ready, '/api/conversation-token': () => plain(reason, 500) }));
  try {
    assert.equal(page.element('start').disabled, false);
    await page.click('start');
    assert.equal(page.element('status').textContent, `Nie udało się pobrać tokenu ElevenLabs: ${reason}`);
    assert.equal(page.element('start').disabled, false);
    assert.equal(page.sessions.length, 0);
  } finally {
    page.restore();
  }
});

test('a token refused because the end has started still says the conversation is ending', async () => {
  const page = await loadPage(routes({ '/api/status': ready, '/api/conversation-token': () => json({ error: 'ending' }, 409) }));
  try {
    await page.click('start');
    assert.equal(page.element('status').textContent, 'Rozmowa się kończy.');
    assert.equal(page.sessions.length, 0);
  } finally {
    page.restore();
  }
});

test('an ElevenLabs connection error is shown after a Polish sentence', async () => {
  const page = await loadPage(routes({ '/api/status': ready, '/api/conversation-token': () => json({ token: 'conv-tok' }) }));
  try {
    await page.click('start');
    assert.equal(page.sessions.length, 1);
    assert.equal(page.sessions[0].conversationToken, 'conv-tok');
    page.sessions[0].onError('Connection failed');
    assert.equal(page.element('status').textContent, 'Błąd połączenia z ElevenLabs: Connection failed');
  } finally {
    page.restore();
  }
});

test('the page shows the session label and the transcript so far on load', async () => {
  const transcript = [{ at: '10:00:00', role: 'user', text: 'Zrób przerwę.' }, { at: '10:00:02', role: 'agent', text: 'Rozmowa na ciebie czeka.' }];
  const page = await loadPage(routes({ '/api/status': ready, '/api/history': () => json({ transcript }) }));
  try {
    assert.deepEqual(page.transcript(), [['Ty', 'Zrób przerwę.'], ['Agent', 'Rozmowa na ciebie czeka.']]);
    assert.equal(page.element('who').textContent, 'notatki · abcdef12');
  } finally {
    page.restore();
  }
});

test('a disconnect that is not the end pauses: the button says Połącz ponownie and the bridge hears call-end', async () => {
  let status = {};
  const page = await loadPage(routes({ '/api/status': () => ready(status) }));
  try {
    assert.equal(page.element('start').textContent, 'Rozpocznij rozmowę');
    await page.click('start');
    // The first call: both client tools, and the agent's own first message.
    assert.deepEqual(Object.keys(page.sessions[0].clientTools), ['ask_claude', 'end_conversation']);
    assert.equal(page.sessions[0].overrides, undefined);
    page.sessions[0].onConnect({ conversationId: 'conv_a' });
    page.sessions[0].onDisconnect({ reason: 'agent', context: { type: 'end_call', reason: 'Agent ended the call' } });
    await page.flush();
    assert.deepEqual(page.posts.filter(([path]) => path === '/api/call-end'),
      [['/api/call-end', { conversationId: 'conv_a', reason: 'agent', context: 'end_call' }]]);
    assert.ok(!page.posts.some(([path]) => path === '/api/end'));
    status = PAUSED;
    await page.pollStatus();
    assert.equal(page.element('start').textContent, 'Połącz ponownie');
    assert.equal(page.element('start').disabled, false);
    assert.equal(page.element('pause').disabled, true);
    assert.equal(page.element('stop').disabled, false);
    assert.equal(page.element('status').textContent, 'Rozmowa wstrzymana. Połącz ponownie do 14:05; potem rozmowa się zakończy.');
  } finally {
    page.restore();
  }
});

test('a later call starts with the rejoin first message and sends the rejoin context once connected', async () => {
  const answers = 'Odpowiedź Claude na pytanie „czy sesja działa”, której nie usłyszałeś: Działa.';
  const context = { text: `Dalszy ciąg rozmowy po przerwie. Ostatnie wypowiedzi:\n- Rafał: Zrób przerwę.\n${answers}`, undelivered: 1, answers };
  const page = await loadPage(routes({ '/api/status': () => ready(PAUSED), '/api/rejoin-context': () => json(context) }));
  try {
    assert.equal(page.element('start').textContent, 'Połącz ponownie');
    await page.click('start');
    assert.deepEqual(page.sessions[0].overrides, { agent: { firstMessage: 'Wracamy do rozmowy. Słucham.' } });
    page.sessions[0].onConnect({ conversationId: 'conv_b' });
    await page.flush();
    assert.deepEqual(page.conversations[0].updates, [context.text]);
    assert.deepEqual(page.posts.filter(([path]) => path === '/api/rejoin-context-sent'), [['/api/rejoin-context-sent', { undelivered: 1 }]]);
  } finally {
    page.restore();
  }
});

test('a rejoin context the SDK refused is not marked sent', async () => {
  const context = { text: 'Dalszy ciąg rozmowy po przerwie. Ostatnie wypowiedzi:', undelivered: 1, answers: 'x' };
  const page = await loadPage(routes({ '/api/status': () => ready(PAUSED), '/api/rejoin-context': () => json(context) }));
  try {
    await page.click('start');
    page.conversations[0].refuses = true;
    page.sessions[0].onConnect({ conversationId: 'conv_b' });
    await page.flush();
    assert.ok(!page.posts.some(([path]) => path === '/api/rejoin-context-sent'));
    assert.deepEqual(page.transcript().at(-1), ['Notatka', 'rejoin context not sent']);
    assert.ok(page.posts.some(([path, body]) => path === '/api/transcript' && body.text === 'rejoin context not sent'));
  } finally {
    page.restore();
  }
});

test('an answer kept during a live call is sent to that call, once', async () => {
  const answers = 'Odpowiedź Claude na pytanie „czy sesja działa”, której nie usłyszałeś: Działa.';
  const context = deferred();
  let status = {};
  const page = await loadPage(routes({ '/api/status': () => ready(status), '/api/rejoin-context': () => context.promise }));
  try {
    await page.click('start');
    page.sessions[0].onConnect({ conversationId: 'conv_a' });
    await page.flush();
    status = { state: 'in-call', callLive: true, calls: 1, undelivered: 1 };
    await page.pollStatus();
    await page.pollStatus(); // the send is still in flight
    assert.equal(page.requests.filter(([, path]) => path === '/api/rejoin-context').length, 1);
    context.resolve(json({ text: `Dalszy ciąg rozmowy po przerwie. Ostatnie wypowiedzi:\n${answers}`, undelivered: 1, answers }));
    await page.flush();
    assert.deepEqual(page.conversations[0].updates, [answers]);
    assert.deepEqual(page.posts.filter(([path]) => path === '/api/rejoin-context-sent'), [['/api/rejoin-context-sent', { undelivered: 1 }]]);
  } finally {
    page.restore();
  }
});

test('the duration limit ends the old call at the bridge first, then starts the next call by itself', async () => {
  const callEnd = deferred();
  let status = {};
  const page = await loadPage(routes({ '/api/status': () => ready(status), '/api/call-end': () => callEnd.promise }));
  const tokenRequests = () => page.requests.filter(([, path]) => path === '/api/conversation-token').length;
  try {
    await page.click('start');
    page.sessions[0].onConnect({ conversationId: 'conv_a' });
    page.sessions[0].onDisconnect({ reason: 'error', message: 'Maximum duration exceeded', context: { type: 'max_duration_exceeded' } });
    await page.flush();
    assert.equal(page.element('status').textContent, 'Limit czasu połączenia. Łączę ponownie…');
    // The bridge pauses between the two calls; the page keeps its own text and asks for no token yet.
    status = PAUSED;
    await page.pollStatus();
    assert.equal(page.element('status').textContent, 'Limit czasu połączenia. Łączę ponownie…');
    assert.equal(tokenRequests(), 1);
    callEnd.resolve(json({ ok: true }));
    await page.flush();
    const log = page.requests.map(([method, path]) => `${method} ${path}`);
    assert.ok(log.indexOf('POST /api/call-end') < log.lastIndexOf('GET /api/conversation-token'));
    assert.deepEqual(page.posts.filter(([path]) => path === '/api/call-end'),
      [['/api/call-end', { conversationId: 'conv_a', reason: 'error', context: 'max_duration_exceeded' }]]);
    assert.equal(tokenRequests(), 2);
    assert.equal(page.sessions.length, 2);
    assert.equal(page.sessions[1].conversationToken, 'conv-tok-2');
    assert.equal(page.element('status').textContent, 'Limit czasu połączenia. Łączę ponownie…');
  } finally {
    page.restore();
  }
});

test('Zakończ rozmowę during a call ends the dialog without a pause', async () => {
  const page = await loadPage(routes({ '/api/status': ready }));
  try {
    await page.click('start');
    page.sessions[0].onConnect({ conversationId: 'conv_a' });
    await page.click('stop');
    assert.equal(page.conversations[0].ended, 1);
    assert.ok(!page.posts.some(([path]) => path === '/api/call-end'));
    assert.deepEqual(page.posts.at(-1), ['/api/end', { conversationId: 'conv_a' }]);
    assert.equal(page.element('status').textContent, ENDED);
  } finally {
    page.restore();
  }
});

test('Przerwa ends only the call', async () => {
  const page = await loadPage(routes({ '/api/status': ready }));
  try {
    await page.click('start');
    page.sessions[0].onConnect({ conversationId: 'conv_a' });
    assert.equal(page.element('pause').disabled, false);
    await page.click('pause');
    assert.equal(page.conversations[0].ended, 1);
    assert.deepEqual(page.posts.filter(([path]) => path === '/api/call-end'), [['/api/call-end', { conversationId: 'conv_a', reason: 'user' }]]);
    assert.ok(!page.posts.some(([path]) => path === '/api/end'));
  } finally {
    page.restore();
  }
});

test('Zakończ rozmowę during a pause ends the dialog at once', async () => {
  let status = {};
  const page = await loadPage(routes({ '/api/status': () => ready(status) }));
  try {
    await page.click('start');
    page.sessions[0].onConnect({ conversationId: 'conv_a' });
    page.sessions[0].onDisconnect({ reason: 'agent', context: { type: 'end_call' } });
    await page.flush();
    status = PAUSED;
    await page.pollStatus();
    assert.equal(page.element('stop').disabled, false);
    const before = page.posts.length;
    await page.click('stop');
    // No call is connected: nothing is hung up, and the bridge hears only the end of the dialog.
    assert.deepEqual(page.posts.slice(before), [['/api/end', { conversationId: 'conv_a' }]]);
    assert.equal(page.conversations[0].ended, 0);
    assert.equal(page.element('status').textContent, ENDED);
  } finally {
    page.restore();
  }
});

test('a token refused because a call is live in another tab says so', async () => {
  const page = await loadPage(routes({ '/api/status': ready, '/api/conversation-token': () => json({ error: 'call-live' }, 409) }));
  try {
    await page.click('start');
    assert.equal(page.element('status').textContent, 'Rozmowa trwa w innej karcie.');
    assert.equal(page.element('start').disabled, false);
    assert.equal(page.sessions.length, 0);
  } finally {
    page.restore();
  }
});

test('end_conversation tells the bridge and ends a call still running after 15 s', async () => {
  const request = deferred();
  const page = await loadPage(routes({ '/api/status': ready, '/api/end-request': () => request.promise }));
  try {
    await page.click('start');
    page.sessions[0].onConnect({ conversationId: 'conv_a' });
    let result;
    const tool = page.sessions[0].clientTools.end_conversation({}).then((r) => { result = r; });
    await page.flush();
    // The bridge hears the end before the agent gets the result and hangs up.
    assert.deepEqual(page.posts.filter(([path]) => path === '/api/end-request'), [['/api/end-request', {}]]);
    assert.equal(result, undefined);
    request.resolve(json({ ok: true }));
    await tool;
    assert.equal(result, 'Koniec rozmowy przyjęty. Pożegnaj się jednym zdaniem i zakończ połączenie.');
    assert.equal(page.conversations[0].ended, 0);
    assert.deepEqual([...page.timeouts].map((t) => t.ms), [15000]);
    await page.fireTimeouts();
    assert.equal(page.conversations[0].ended, 1);
    // The client reports the page's own endSession with reason user; the bridge hears that call end.
    assert.deepEqual(page.posts.filter(([path]) => path === '/api/call-end'), [['/api/call-end', { conversationId: 'conv_a', reason: 'user' }]]);
  } finally {
    page.restore();
  }
});

test('a call the agent ends after end_conversation leaves no timer behind', async () => {
  const page = await loadPage(routes({ '/api/status': ready }));
  try {
    await page.click('start');
    page.sessions[0].onConnect({ conversationId: 'conv_a' });
    await page.sessions[0].clientTools.end_conversation({});
    page.sessions[0].onDisconnect({ reason: 'agent', context: { type: 'end_call' } });
    await page.flush();
    assert.equal(page.timeouts.size, 0);
    assert.deepEqual(page.posts.filter(([path]) => path === '/api/call-end'),
      [['/api/call-end', { conversationId: 'conv_a', reason: 'agent', context: 'end_call' }]]);
  } finally {
    page.restore();
  }
});

test('a dialog ended by the bridge shows the end and stops polling', async () => {
  const page = await loadPage(routes({ '/api/status': () => ready({ state: 'ending', ending: true }) }));
  try {
    assert.equal(page.element('status').textContent, ENDED);
    assert.equal(page.intervals.size, 0);
    assert.equal(page.element('start').disabled, true);
    assert.equal(page.element('stop').disabled, true);
  } finally {
    page.restore();
  }
});

test('a dialog ended elsewhere during a call ends that call too, without telling the bridge again', async () => {
  let status = {};
  const page = await loadPage(routes({ '/api/status': () => ready(status) }));
  try {
    await page.click('start');
    page.sessions[0].onConnect({ conversationId: 'conv_a' });
    status = { state: 'ending', ending: true, calls: 1 };
    await page.pollStatus();
    assert.equal(page.conversations[0].ended, 1);
    assert.equal(page.element('status').textContent, ENDED);
    assert.ok(!page.posts.some(([path]) => path === '/api/call-end' || path === '/api/end'));
    assert.equal(page.intervals.size, 0);
  } finally {
    page.restore();
  }
});
