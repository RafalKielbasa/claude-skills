import { test } from 'node:test';
import assert from 'node:assert/strict';

// The page runs in Node against stand-ins for the DOM, fetch, the ElevenLabs client and its own
// intervals, which a test fires by hand (no timer runs, nothing is left behind).
const PREPARING = 'Claude się przygotowuje…';
const NOT_STARTED = 'Claude nie wystartował. Zamknij kartę i sprawdź komunikat w sesji.';
const flush = async () => { for (let i = 0; i < 5; i += 1) await new Promise((r) => setImmediate(r)); };
const json = (body, status = 200) => ({ ok: status < 300, status, json: async () => body, text: async () => JSON.stringify(body) });
// The bridge answers its errors in text/plain: json() fails on them as it does in a browser.
const plain = (body, status) => ({ ok: status < 300, status, json: async () => JSON.parse(body), text: async () => body });
const ready = () => json({ forkReady: true, forkExited: false, ending: false, interruption: 'contextual-update' });
const routes = (overrides) => async (path) => {
  if (overrides[path]) return overrides[path]();
  return json(path === '/api/decisions' ? { decisions: '' } : { ok: true });
};

let loads = 0;
async function loadPage(route) {
  const elements = new Map();
  const element = (id) => {
    if (!elements.has(id)) {
      elements.set(id, { textContent: '', disabled: false, listeners: {}, addEventListener(type, fn) { this.listeners[type] = fn; }, append() {} });
    }
    return elements.get(id);
  };
  const intervals = new Set();
  const sessions = [];
  const saved = { fetch: globalThis.fetch, setInterval: globalThis.setInterval, clearInterval: globalThis.clearInterval };
  Object.assign(globalThis, {
    location: { search: '?t=tok' },
    document: { getElementById: element, createElement: () => ({ append() {} }), createTextNode: (text) => text },
    window: { ElevenLabsClient: { Conversation: { startSession: async (options) => {
      sessions.push(options);
      return { endSession: async () => {}, sendContextualUpdate() {} };
    } } } },
    fetch: async (url) => route(String(url).split('?')[0]),
    setInterval: (fn, ms) => { const handle = { fn, ms }; intervals.add(handle); return handle; },
    clearInterval: (handle) => { intervals.delete(handle); },
  });
  loads += 1;
  await import(`../web/talk.mjs?load=${loads}`); // a fresh page per test
  await flush();
  return {
    element,
    intervals,
    sessions,
    // Fires the status poll (the 1 s interval) once, as the next tick would.
    pollStatus: async () => { for (const handle of [...intervals].filter((h) => h.ms === 1000)) handle.fn(); await flush(); },
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
