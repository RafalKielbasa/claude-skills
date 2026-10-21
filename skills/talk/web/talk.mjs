// The conversation page: ElevenLabs client in the browser, every Claude question through the bridge.
const token = new URLSearchParams(location.search).get('t');
// The bridge refuses a request without the token, and a static import cannot carry it.
const { createAskTracker } = await import(`./ask-tracker.mjs?t=${token}`);
const DECISION_PREFIX = 'Decyzja do potwierdzenia:';
const $ = (id) => document.getElementById(id);
const api = (path, body) => fetch(`${path}?t=${token}`, body === undefined ? {} : {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
}).then((r) => r.json());

const tracker = createAskTracker();
let conversation = null;
let conversationId = null;
let beat = null;
let statusPoll = null;
let decisionsPoll = null;
let finished = false;
let interruption = 'disable-during-tool';

function addLine(role, text) {
  const li = document.createElement('li');
  const who = document.createElement('span');
  who.className = 'who';
  who.textContent = role === 'user' ? 'Ty' : role === 'note' ? 'Notatka' : 'Agent';
  li.append(who, document.createTextNode(text));
  $('transcript').append(li);
}

function note(text) {
  addLine('note', text);
  api('/api/transcript', { role: 'note', text }).catch(() => {});
}

async function askClaude({ request }) {
  $('status').textContent = 'Claude myśli…';
  const ask = tracker.start(request);
  let answer;
  try {
    ({ answer } = await api('/api/ask', { request }));
  } catch (error) {
    // Nothing was answered; clear the ask so it cannot block a resend.
    tracker.answered(ask, '');
    throw error;
  }
  if (answer.includes(DECISION_PREFIX)) $('pending').textContent = answer.slice(answer.indexOf(DECISION_PREFIX));
  const { resend, text } = tracker.answered(ask, answer);
  if (resend && interruption === 'contextual-update') {
    conversation?.sendContextualUpdate(text);
    note('contextual update sent');
  } else if (resend) note('interrupted answer not resent (strategy disable-during-tool)');
  $('status').textContent = 'Rozmowa trwa.';
  return answer;
}

function stopPolling() {
  clearInterval(beat);
  clearInterval(statusPoll);
  clearInterval(decisionsPoll);
}

async function finish() {
  if (finished) return;
  finished = true;
  stopPolling();
  $('start').disabled = true;
  $('stop').disabled = true;
  $('status').textContent = 'Rozmowa zakończona. Możesz zamknąć kartę.';
  await api('/api/end', { conversationId }).catch(() => {});
}

async function start() {
  $('start').disabled = true;
  $('status').textContent = 'Łączę…';
  const response = await fetch(`/api/conversation-token?t=${token}`);
  if (response.status === 409) {
    $('status').textContent = 'Rozmowa się kończy.';
    return;
  }
  if (!response.ok) {
    // The bridge answers a failed token call in text/plain, with the ElevenLabs status and reason.
    $('status').textContent = `Nie udało się pobrać tokenu ElevenLabs: ${await response.text().catch(() => response.status)}`;
    $('start').disabled = false;
    return;
  }
  const { token: conversationToken } = await response.json();
  conversation = await window.ElevenLabsClient.Conversation.startSession({
    conversationToken,
    connectionType: 'webrtc',
    libsampleratePath: `./vendor/libsamplerate.worklet.js?t=${token}`,
    clientTools: { ask_claude: askClaude },
    onConnect: ({ conversationId: id }) => {
      // Heartbeats start only once the ElevenLabs session is connected.
      conversationId = id;
      api('/api/heartbeat', { conversationId: id }).catch(() => {});
      beat = setInterval(() => api('/api/heartbeat', { conversationId }).catch(() => {}), 5000);
      $('status').textContent = 'Rozmowa trwa.';
      $('stop').disabled = false;
    },
    onMessage: ({ message, role, source }) => {
      const who = role ?? (source === 'ai' ? 'agent' : 'user');
      addLine(who, message);
      api('/api/transcript', { role: who, text: message }).catch(() => {});
    },
    onInterruption: () => {
      tracker.interrupted();
      note('interruption during ask');
    },
    onDisconnect: () => { finish(); },
    onError: (message) => { $('status').textContent = `Błąd połączenia z ElevenLabs: ${message}`; },
  });
}

$('start').addEventListener('click', () => start().catch((error) => {
  $('status').textContent = `Błąd: ${error.message}`;
  $('start').disabled = false;
}));
$('stop').addEventListener('click', async () => {
  // End the ElevenLabs session first, then tell the bridge; finish() guards against a second end.
  await conversation?.endSession().catch(() => {});
  finish();
});

// "Rozpocznij rozmowę" stays disabled until the fork is ready.
$('start').disabled = true;
$('status').textContent = 'Claude się przygotowuje…';
// A fork that exits before its introduction ends the bridge at once: the page says so when the status
// reports forkExited, or when three polls in a row get no answer (the bridge is gone).
let failedPolls = 0;
function notStarted() {
  stopPolling();
  $('start').disabled = true;
  $('status').textContent = 'Claude nie wystartował. Zamknij kartę i sprawdź komunikat w sesji.';
}
async function pollStatus() {
  try {
    const s = await api('/api/status');
    failedPolls = 0;
    if (s.interruption) interruption = s.interruption;
    if (s.forkExited && !conversation && !finished) notStarted();
    else if (s.forkReady && !conversation && !finished) {
      clearInterval(statusPoll);
      $('start').disabled = false;
      $('status').textContent = 'Gotowe do rozmowy.';
    }
  } catch {
    // One miss is retried by the next tick.
    failedPolls += 1;
    if (failedPolls >= 3 && !conversation && !finished) notStarted();
  }
}
statusPoll = setInterval(pollStatus, 1000);
pollStatus();
decisionsPoll = setInterval(() => api('/api/decisions').then(({ decisions }) => { $('decisions').textContent = decisions || '—'; }).catch(() => {}), 3000);
