// The conversation page: ElevenLabs client in the browser, every Claude question through the bridge.
// One page drives a dialog of calls (spec §18): breaks, rejoining, the next call after the duration
// limit, and the end.
const token = new URLSearchParams(location.search).get('t');
// The bridge refuses a request without the token, and a static import cannot carry it.
const { createAskTracker } = await import(`./ask-tracker.mjs?t=${token}`);
const DECISION_PREFIX = 'Decyzja do potwierdzenia:';
const REJOIN_FIRST_MESSAGE = 'Wracamy do rozmowy. Słucham.';
const END_ACCEPTED = 'Koniec rozmowy przyjęty. Pożegnaj się jednym zdaniem i zakończ połączenie.';
const ENDED = 'Rozmowa zakończona. Możesz zamknąć kartę.';
const END_GRACE_MS = 15000; // a call still running this long after end_conversation is ended here
// The agent's duration message (lib/agent-config.mjs). Over WebRTC the cut it announces reaches
// onDisconnect as a close, not as max_duration_exceeded (the rejoin probe of Plan 3, Task 9), so a
// close right after it is taken for the cut.
const DURATION_MESSAGE = 'Kończy się czas tego połączenia, zaraz łączę ponownie.';
const $ = (id) => document.getElementById(id);
const api = (path, body) => fetch(`${path}?t=${token}`, body === undefined ? {} : {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
}).then((r) => r.json());
const clock = (date) => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

const tracker = createAskTracker();
// `conversation` is the session of this page's live call, or null; `conversationId` is the id of the
// last call that connected here. `connecting` runs from a start to its onConnect. `hadCall` is set
// once a call of the dialog has connected, in this tab or in another one.
let conversation = null;
let conversationId = null;
let connected = false;
let connecting = false;
let hadCall = false;
let forkReady = false;
let rejoinFirstMessage = false;
// „Zakończ” and „Przerwa” set this before endSession, so that the onDisconnect they cause takes their
// path: 'end' posts nothing there (the button posts /api/end), 'pause' posts call-end with reason user.
let ownEnd = null;
let endTimer = null;
// The last message the agent said in the live call.
let lastAgentMessage = null;
// One send of what the bridge kept runs at a time; a call whose SDK refused one tries no other.
let keptSending = false;
let keptRefused = false;
let beat = null;
let statusPoll = null;
let decisionsPoll = null;
let failedPolls = 0;
// The bridge state the page last showed, and the one the last poll reported.
let shown = null;
let lastState = null;
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

function buttons() {
  $('start').textContent = hadCall ? 'Połącz ponownie' : 'Rozpocznij rozmowę';
  $('start').disabled = finished || connecting || connected || !forkReady;
  $('pause').disabled = finished || !connected;
  // „Zakończ” also ends a paused dialog, but not while a call is connecting.
  $('stop').disabled = finished || connecting || !(connected || hadCall);
}

async function askClaude({ request }) {
  const call = conversationId;
  $('status').textContent = 'Claude myśli…';
  const ask = tracker.start(request);
  let answer;
  try {
    ({ answer } = await api('/api/ask', { request, conversationId: call }));
  } catch (error) {
    // Nothing was answered; clear the ask so it cannot block a resend.
    tracker.answered(ask, '');
    throw error;
  }
  if (answer.includes(DECISION_PREFIX)) $('pending').textContent = answer.slice(answer.indexOf(DECISION_PREFIX));
  const { resend, text } = tracker.answered(ask, answer);
  // An answer that comes back after its call ended is the bridge's to keep for the next call, and the
  // page keeps showing the bridge's state.
  if (!connected || conversationId !== call) return answer;
  if (resend && interruption === 'contextual-update') {
    conversation?.sendContextualUpdate(text);
    note('contextual update sent');
  } else if (resend) note('interrupted answer not resent (strategy disable-during-tool)');
  $('status').textContent = 'Rozmowa trwa.';
  return answer;
}

// Rafal's spoken end (spec §18.3). The bridge hears it before the agent gets the result, says goodbye
// and hangs up, so that the end of this call ends the dialog; a call still running 15 s later is
// ended here.
async function endConversation() {
  const call = conversationId;
  await api('/api/end-request', {}).catch(() => {});
  if (connected && conversationId === call) {
    clearTimeout(endTimer);
    endTimer = setTimeout(() => { conversation?.endSession().catch(() => {}); }, END_GRACE_MS);
  }
  return END_ACCEPTED;
}

// What the bridge kept for the agent (spec §18.6): the rejoin context's `text` when a later call
// connects, or only its `answers` when a status poll during a call reports kept answers (Ruling T3-2).
// The bridge drops the answers only after sendContextualUpdate returned without throwing.
async function sendKept(part) {
  if (keptSending || keptRefused) return;
  keptSending = true;
  const call = conversationId;
  try {
    const kept = await api('/api/rejoin-context');
    // onConnect runs before startSession resolves, so `conversation` is read only after the bridge
    // answered. A call that ended meanwhile leaves everything kept for the next one.
    if (!connected || conversationId !== call || !conversation) return;
    if (part === 'answers' && !(kept.undelivered > 0)) return;
    try {
      conversation.sendContextualUpdate(kept[part]);
    } catch {
      keptRefused = true;
      note(part === 'text' ? 'rejoin context not sent' : 'kept answers not sent');
      return;
    }
    note(part === 'text' ? 'rejoin context sent' : 'kept answers sent');
    await api('/api/rejoin-context-sent', { undelivered: kept.undelivered });
  } catch {
    // A failed request leaves the answers kept; a later poll during the call tries again.
  } finally {
    keptSending = false;
  }
}

function stopPolling() {
  clearInterval(beat);
  clearInterval(statusPoll);
  clearInterval(decisionsPoll);
}

// The dialog is over. A call still connected here (the dialog was ended in another tab) is ended
// without telling the bridge again.
function showEnd() {
  finished = true;
  stopPolling();
  if (connected) {
    ownEnd = 'end';
    conversation?.endSession().catch(() => {});
  }
  $('status').textContent = ENDED;
  buttons();
}

async function finish() {
  if (finished) return;
  showEnd();
  await api('/api/end', { conversationId }).catch(() => {});
}

// A start that failed: Rafal can try again, and the message stays until the bridge's state changes.
function failed(text) {
  connecting = false;
  shown = lastState;
  $('status').textContent = text;
  buttons();
}

function callConnected(id, later) {
  if (finished) return;
  connecting = false;
  connected = true;
  hadCall = true;
  keptRefused = false;
  conversationId = id;
  // Heartbeats start only once the ElevenLabs session is connected.
  api('/api/heartbeat', { conversationId: id }).catch(() => {});
  beat = setInterval(() => api('/api/heartbeat', { conversationId: id }).catch(() => {}), 5000);
  $('status').textContent = 'Rozmowa trwa.';
  buttons();
  if (later) sendKept('text');
}

// Every end of a call. After „Zakończ” the button posts /api/end; any other end tells the bridge,
// which pauses the dialog or ends it. After the duration limit the next call starts by itself, once
// the bridge has answered call-end: it refuses a token while the old call is live.
function callEnded(details) {
  const own = ownEnd;
  ownEnd = null;
  const said = lastAgentMessage;
  lastAgentMessage = null;
  connected = false;
  conversation = null;
  clearInterval(beat);
  clearTimeout(endTimer);
  // The next status poll shows the bridge's state.
  shown = null;
  if (own === 'end' || finished) return;
  const reason = own === 'pause' ? 'user' : details?.reason;
  const reported = own === 'pause' ? undefined : details?.context?.type;
  const cut = reported === 'max_duration_exceeded' || (reported === 'close' && said?.trim() === DURATION_MESSAGE);
  const context = cut ? 'max_duration_exceeded' : reported;
  // The client's own reason goes into the bridge's note, after the reported type when the page read
  // the end as another one.
  const why = own === 'pause' ? undefined : details?.context?.reason;
  const detail = context === reported ? why : [reported, why].filter(Boolean).join(': ');
  const ended = api('/api/call-end', { conversationId, reason, context, ...(detail ? { detail } : {}) }).catch(() => {});
  if (context !== 'max_duration_exceeded') {
    buttons();
    return;
  }
  connecting = true;
  $('status').textContent = 'Limit czasu połączenia. Łączę ponownie…';
  buttons();
  ended.then(() => connect(true));
}

async function start(auto) {
  if (finished) return;
  connecting = true;
  ownEnd = null;
  buttons();
  // After the duration limit the status keeps saying why the page reconnects.
  if (!auto) $('status').textContent = 'Łączę…';
  const later = hadCall;
  const response = await fetch(`/api/conversation-token?t=${token}`);
  if (response.status === 409) {
    const { error } = await response.json().catch(() => ({}));
    if (error === 'call-live') {
      failed('Rozmowa trwa w innej karcie.');
      return;
    }
    // The end has started: nothing starts any more, and the next status poll shows the end.
    $('status').textContent = 'Rozmowa się kończy.';
    return;
  }
  if (!response.ok) {
    // The bridge answers a failed token call in text/plain, with the ElevenLabs status and reason.
    failed(`Nie udało się pobrać tokenu ElevenLabs: ${await response.text().catch(() => response.status)}`);
    return;
  }
  const { token: conversationToken } = await response.json();
  const session = await window.ElevenLabsClient.Conversation.startSession({
    conversationToken,
    connectionType: 'webrtc',
    libsampleratePath: `./vendor/libsamplerate.worklet.js?t=${token}`,
    clientTools: { ask_claude: askClaude, end_conversation: endConversation },
    // A later call opens with its own first message (spec §18.6), an override the agent allows.
    ...(later && rejoinFirstMessage ? { overrides: { agent: { firstMessage: REJOIN_FIRST_MESSAGE } } } : {}),
    onConnect: ({ conversationId: id }) => callConnected(id, later),
    onMessage: ({ message, role, source }) => {
      const who = role ?? (source === 'ai' ? 'agent' : 'user');
      if (who === 'agent') lastAgentMessage = message;
      addLine(who, message);
      api('/api/transcript', { role: who, text: message }).catch(() => {});
    },
    onInterruption: () => {
      tracker.interrupted();
      note('interruption during ask');
    },
    onDisconnect: callEnded,
    onError: (message) => { $('status').textContent = `Błąd połączenia z ElevenLabs: ${message}`; },
  });
  // The dialog ended while this call was connecting: the call ends at once.
  if (finished) {
    ownEnd = 'end';
    session.endSession().catch(() => {});
    return;
  }
  conversation = session;
}

const connect = (auto = false) => start(auto).catch((error) => failed(`Błąd: ${error.message}`));

$('start').addEventListener('click', () => connect());
$('pause').addEventListener('click', async () => {
  // „Przerwa” ends only the call; the dialog pauses.
  ownEnd = 'pause';
  $('pause').disabled = true;
  await conversation?.endSession().catch(() => {});
});
$('stop').addEventListener('click', async () => {
  // „Zakończ” ends the dialog: the session ends first, then finish() tells the bridge. During a pause
  // it ends at once.
  ownEnd = 'end';
  await conversation?.endSession().catch(() => {});
  finish();
});

function notStarted() {
  finished = true;
  stopPolling();
  $('status').textContent = 'Claude nie wystartował. Zamknij kartę i sprawdź komunikat w sesji.';
  buttons();
}

function showState(s) {
  if (s.state === 'paused' && s.pausedUntil) {
    $('status').textContent = `Rozmowa wstrzymana. Połącz ponownie do ${clock(new Date(s.pausedUntil))}; potem rozmowa się zakończy.`;
  } else if (s.state === 'in-call') $('status').textContent = 'Rozmowa trwa w innej karcie.';
  else if (forkReady) $('status').textContent = 'Gotowe do rozmowy.';
  buttons();
}

// The status poll runs every 1 s for the life of the page. While the page has no call of its own it
// shows the bridge's state, only when that state changes, so that a message the page wrote stays.
// It stops at the end, or after three failed polls in a row (the bridge is gone): before any call
// Claude did not start, after one the dialog is over. A fork that exits before its introduction ends
// the bridge at once, and the page says so when the status reports forkExited.
async function pollStatus() {
  let s;
  try {
    s = await api('/api/status');
  } catch {
    // One miss is retried by the next tick.
    failedPolls += 1;
    if (failedPolls >= 3 && !finished) {
      if (hadCall) showEnd();
      else notStarted();
    }
    return;
  }
  failedPolls = 0;
  if (finished) return;
  if (s.interruption) interruption = s.interruption;
  if (s.label) $('who').textContent = s.label;
  forkReady = s.forkReady === true;
  rejoinFirstMessage = s.rejoinFirstMessage === true;
  if (s.calls > 0) hadCall = true;
  lastState = [s.state, s.pausedUntil, forkReady, hadCall].join('|');
  if (s.forkExited && !hadCall) notStarted();
  else if (s.state === 'ending') showEnd();
  else if (connected) {
    if (s.undelivered > 0) sendKept('answers');
  } else if (!connecting && lastState !== shown) {
    shown = lastState;
    showState(s);
  }
}

// "Rozpocznij rozmowę" stays disabled until the fork is ready.
$('status').textContent = 'Claude się przygotowuje…';
buttons();
// A reopened tab shows what was said so far (spec §18.5).
api('/api/history').then(({ transcript }) => { for (const t of transcript ?? []) addLine(t.role, t.text); }).catch(() => {});
statusPoll = setInterval(pollStatus, 1000);
pollStatus();
const pollDecisions = () => api('/api/decisions').then(({ decisions }) => { $('decisions').textContent = decisions || '—'; }).catch(() => {});
decisionsPoll = setInterval(pollDecisions, 3000);
pollDecisions();
