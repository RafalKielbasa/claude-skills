// The voice bridge (spec §5, §6, §18): an HTTP server on 127.0.0.1 that lives for one dialog of
// ElevenLabs calls. It serves the page, mints a conversation token for each call, relays ask_claude
// to the voice fork, deletes each call at ElevenLabs when it ends, pauses between calls, and resolves
// the closing report that wakes session X.
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { takeSnapshot } from '../../hub/lib/dialog.mjs';
import { authorize } from './auth.mjs';
import { prepareDialog } from './dialog.mjs';
import { startFork } from './fork.mjs';
import { removeLiveFile, writeLiveFile } from './live.mjs';
import { closingReport, readDialogFiles } from './report.mjs';
import { endMessage, voiceStartPrompt } from './voice-prompt.mjs';

const WEB = fileURLToPath(new URL('../web/', import.meta.url));
// Fixed routes only: no part of a request path ever reaches the file system.
const STATIC = new Map([
  ['/talk.mjs', 'talk.mjs'],
  ['/ask-tracker.mjs', 'ask-tracker.mjs'],
  ['/vendor/elevenlabs-client.iife.js', 'vendor/elevenlabs-client.iife.js'],
  ['/vendor/libsamplerate.worklet.js', 'vendor/libsamplerate.worklet.js'],
]);
const STILL_THINKING = 'Claude nadal myśli. Zapytaj za chwilę jeszcze raz.';
const ENDING = 'Rozmowa się kończy.';
const FORK_GONE = 'Claude nie odpowie, bo jego proces się zakończył. Zakończ rozmowę.';
const END_TURN_MS = 120000; // the fork's last turn may write prompt.md
const FORK_CLOSE_MS = 30000; // fork.close() waits this long for the last turn, and again for the exit
const FORK_CLOSE_LIMIT_MS = 2 * FORK_CLOSE_MS + 5000; // a fork whose exit is never seen cannot hold the end
const MAX_BODY = 1 << 20;
// Conversation ids go into ElevenLabs API paths, so only plain ids are kept.
const CONVERSATION_ID = /^[A-Za-z0-9_-]{1,128}$/;
const REJOIN_LINES = 8; // the transcript lines a later call's agent gets (spec §18.6)
// A conversation's statuses after which ElevenLabs keeps no more of it (spec §18.4).
const FINISHED = new Set(['done', 'failed']);
const HEADERS = { 'cache-control': 'no-store', 'referrer-policy': 'no-referrer', 'x-content-type-options': 'nosniff' };

// UTF-8 is decoded across reads (a Polish letter may be split between two chunks); anything that is
// not a JSON object reads as {}.
const readBody = (req) => new Promise((resolve) => {
  let data = '';
  req.setEncoding('utf8');
  req.on('data', (c) => {
    data += c;
    if (data.length > MAX_BODY) { req.destroy(); resolve({}); }
  });
  req.on('end', () => {
    try {
      const body = data ? JSON.parse(data) : {};
      resolve(body && typeof body === 'object' && !Array.isArray(body) ? body : {});
    } catch { resolve({}); }
  });
  req.on('error', () => resolve({}));
  req.on('close', () => resolve({}));
});
const send = (res, status, body, type = 'text/plain; charset=utf-8') => {
  res.writeHead(status, { ...HEADERS, 'content-type': type });
  res.end(body);
};
const json = (res, body, status = 200) => send(res, status, JSON.stringify(body), 'application/json; charset=utf-8');
// Report values stay on one line: session X reads the report line by line.
const oneLine = (text) => String(text).replace(/\s+/g, ' ').trim().slice(0, 300);
const reason = (error) => oneLine(error?.message ?? error);
// A text field of a page request, on one line; anything else reads as ''.
const field = (value) => (typeof value === 'string' ? oneLine(value) : '');
// One line of the rejoin context per entry: line breaks become spaces, and nothing is cut.
const flat = (text) => String(text).replace(/\s*[\r\n]+\s*/g, ' ').trim();
const clock = (date) => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

// The call's result, or a rejection after `ms`: a stalled ElevenLabs call cannot hold the end.
function within(fn, ms) {
  let timer;
  const limit = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`no answer in ${ms} ms`)), ms); });
  return Promise.race([Promise.resolve().then(fn), limit]).finally(() => clearTimeout(timer));
}

export async function startBridge({ sessionId, cwd, dialogDir, agentId, eleven, command, forkEnv, port = 0,
  token = randomBytes(32).toString('hex'), heartbeatGraceMs = 15000, firstBeatDeadlineMs = 600000, askTimeoutMs = 115000,
  transcriptWaitMs = 1500, openBrowser = true, subject, interruption = 'contextual-update', asksFile, rawLog, elevenTimeoutMs = 20000,
  endTurnMs = END_TURN_MS, origin = 'session', label = '', pauseLimitMs = 3600000, agentHangup = 'pause', rejoinFirstMessage = true,
  doneWaitMs = 300000, donePollMs = 2000 }) {
  const { snapshot, settingsPath } = prepareDialog({ cwd, dialogDir });
  const fork = startFork({ cwd, sessionId, settingsPath, dialogDir, command, env: forkEnv, rawLog,
    startPrompt: voiceStartPrompt({ projectName: basename(cwd), sourceId: sessionId, dialogDir, snapshot, subject }) });

  // A fork that exits also resolves `ready` (subtype 'exited'): it is never reported ready (Ruling R7),
  // and once its exit is seen, asks are answered at once instead of waiting for their timeout.
  // `forkClosed` is set by the exit itself, whenever it comes; `forkExited` stays Plan 2's view of it.
  let forkReady = false;
  let forkExited = false;
  let forkClosed = false;
  fork.ready.then((turn) => { if (turn.subtype === 'exited') forkExited = true; else forkReady = true; });

  const transcript = [];
  const pendingUser = [];
  const userWaiters = [];
  // A call is one ElevenLabs conversation of the dialog (spec §18.2), kept by its id as { startedAt,
  // lastBeat, endedAt, endContext, cleaned }; `cleaned` is null until the call's cleanup starts, then
  // that cleanup's promise. `liveCall` is the id of the live call, or null; `lastLive` is the id of
  // the last call that was live, kept after it ended.
  const calls = new Map();
  let liveCall = null;
  let lastLive = null;
  // What a later call knows (spec §18.6): the note in front of the fork's next message, and the
  // answers that were ready while no call that asked for them was live, as { request, answer }.
  let forkNote = null;
  const undelivered = [];
  let endRequested = false;
  let pausedUntil = null;
  let ending = false;
  let watch;
  let firstBeat;
  let pauseLimit;
  let resolveDone;
  const done = new Promise((resolve) => { resolveDone = resolve; });

  // Only a plain id is kept, since it goes into ElevenLabs API paths; the call it names is returned.
  const remember = (id) => {
    if (typeof id !== 'string' || !CONVERSATION_ID.test(id)) return null;
    if (!calls.has(id)) calls.set(id, { startedAt: Date.now(), lastBeat: null, endedAt: null, endContext: null, cleaned: null });
    return calls.get(id);
  };
  const state = () => (ending ? 'ending' : liveCall !== null ? 'in-call' : pausedUntil !== null ? 'paused' : 'waiting');
  const addLine = (role, text) => transcript.push({ at: new Date().toLocaleTimeString('pl-PL'), role, text });
  const who = (role) => (role === 'user' ? 'Rafał' : role === 'note' ? 'Notatka' : 'Agent');
  // transcript.md, the only kept copy of the dialog (spec §6), with everything said so far.
  const writeTranscript = () => writeFileSync(join(dialogDir, 'transcript.md'),
    `# Transcript\n\n${transcript.map((t) => `- ${t.at} **${who(t.role)}**: ${t.text}\n`).join('')}`, 'utf8');
  const logAsk = (entry) => {
    if (!asksFile) return;
    try { appendFileSync(asksFile, `${JSON.stringify({ at: new Date().toISOString(), ...entry })}\n`, 'utf8'); } catch { /* timings only */ }
  };
  const nextUserLine = (ms) => new Promise((resolve) => {
    const timer = setTimeout(() => { userWaiters.splice(userWaiters.indexOf(wake), 1); resolve(false); }, ms);
    const wake = () => { clearTimeout(timer); resolve(true); };
    userWaiters.push(wake);
  });

  async function askFork(request) {
    if (forkExited) return FORK_GONE;
    let transcriptLate = false;
    if (pendingUser.length === 0) transcriptLate = await nextUserLine(transcriptWaitMs);
    // The end may have started during the wait: the fork's next message is then the end message.
    if (ending) return ENDING;
    if (forkExited) return FORK_GONE;
    const words = pendingUser.splice(0).join(' / ');
    // A later call's note goes in front of the first message sent after it, and only that one.
    const note = forkNote === null ? '' : `${forkNote}\n`;
    forkNote = null;
    const answer = await fork.ask(`${note}Agent głosowy przekazuje: ${request}\nRafał (transkrypcja): ${words}`, { timeoutMs: askTimeoutMs });
    logAsk({ ms: answer.ms, request, transcriptLate, timedOut: answer.timedOut });
    if (answer.subtype === 'exited') { forkExited = true; return FORK_GONE; }
    return answer.timedOut ? STILL_THINKING : answer.text;
  }

  // An answer is heard only by a caller ({ id, res }) whose call is live and whose response is still
  // open. A closed tab sends no call-end and its call stays live until the heartbeat grace passes, but
  // the responses of its asks close at once. An ask that names no call (a Plan 2 page) keeps nothing.
  const unheard = (callers) => {
    const named = callers.filter((c) => c.id !== null);
    return named.length > 0 && !named.some((c) => c.id === liveCall && !c.res.destroyed);
  };

  // The agent re-issues an interrupted ask_claude with the same request (Plan 2, Task 1): the repeat
  // joins the ask in flight instead of costing the fork a second turn. An answer that no caller hears
  // when it is ready is kept, once, for the agent: the next call's rejoin context, or the live call
  // once the page sees `undelivered` in its status (Ruling T3-2).
  const inFlight = new Map();
  async function ask(request, caller) {
    const pending = inFlight.get(request);
    if (pending) {
      pending.callers.push(caller);
      const calledAt = Date.now();
      const text = await pending.asked;
      logAsk({ ms: Date.now() - calledAt, request, joined: true });
      return text;
    }
    const callers = [caller];
    const asked = askFork(request).then((answer) => {
      if (unheard(callers)) undelivered.push({ request, answer });
      return answer;
    }).finally(() => inFlight.delete(request));
    inFlight.set(request, { asked, callers });
    return asked;
  }

  // A heartbeat with a new id starts a call, which clears the first-call deadline and the pause limit.
  // A new id while another call is live is a reloaded page (Ruling P1): it becomes the live call, and
  // the earlier call is left to end(). A call that has ended is not revived by a late heartbeat, and a
  // call that starts during the end is only kept for its deletion.
  // A new id while no call is live, after a call that was live, is a later call (Ruling T3-1): the git
  // snapshot is refreshed and the fork's next message gets a note on how that previous call ended. A
  // reloaded page gets neither.
  function beat(id) {
    const isNew = typeof id === 'string' && !calls.has(id);
    const c = remember(id);
    if (!c || c.endedAt !== null) return;
    c.lastBeat = Date.now();
    if (!isNew || ending) return;
    const previous = liveCall === null && lastLive !== null ? calls.get(lastLive) : null;
    liveCall = id;
    lastLive = id;
    clearTimeout(firstBeat);
    clearTimeout(pauseLimit);
    pausedUntil = null;
    if (previous) rejoin(previous);
  }

  // Synchronous, like the first snapshot: nothing else runs between the refresh and the note. A
  // refresh that fails leaves the note without its snapshot clause, which would say the snapshot was
  // refreshed, and a transcript note on the failure.
  function rejoin(previous) {
    let refreshed = '';
    try {
      const snapshot = takeSnapshot(cwd, join(dialogDir, 'context'));
      refreshed = ` Migawka git w context/ odświeżona o ${clock(new Date(snapshot.at))}.`;
    } catch (error) {
      addLine('note', `snapshot not refreshed: ${reason(error)}`);
    }
    const minutes = Math.max(1, Math.round((Date.now() - previous.endedAt) / 60000));
    forkNote = previous.endContext === 'max_duration_exceeded'
      ? `(Połączenie odnowione po limicie czasu.${refreshed})`
      : `(Rafał wrócił do rozmowy po ${minutes} min przerwy.${refreshed})`;
  }

  // The agent's contextual update at the start of a later call (spec §18.6): the last lines of Rafal
  // and the agent, then every kept answer, one line each. `answers` is the kept answers alone, which
  // the page sends during a live call (Ruling T3-2). Reading it clears nothing.
  function rejoinContext() {
    const said = transcript.filter((t) => t.role !== 'note').slice(-REJOIN_LINES).map((t) => `- ${who(t.role)}: ${flat(t.text)}`);
    const answers = undelivered.map((u) => `Odpowiedź Claude na pytanie „${flat(u.request)}”, której nie usłyszałeś: ${flat(u.answer)}`);
    return { text: ['Dalszy ciąg rozmowy po przerwie. Ostatnie wypowiedzi:', ...said, ...answers].join('\n'),
      undelivered: undelivered.length, answers: answers.join('\n') };
  }

  // Paused (spec §18.3): the bridge and the fork wait for the next call, until the pause limit.
  function pause() {
    clearTimeout(firstBeat);
    clearTimeout(pauseLimit);
    pausedUntil = Date.now() + pauseLimitMs;
    pauseLimit = setTimeout(() => end(), pauseLimitMs);
  }

  // A call's cleanup (spec §18.4) runs once, at the call's end or at the dialog's: transcript.md is
  // rewritten, then, once ElevenLabs has finished the conversation, its length is read and it is
  // deleted and read again. A conversation deleted while ElevenLabs still processes it stays there,
  // and a read right after such a delete may still answer 404 (Plan 3 acceptance, A1 and A5): so
  // nothing is deleted before a finished status, and only a 404 after the delete counts. It never
  // rejects; a failed deletion is kept for the report, not retried.
  function clean(id) {
    const c = calls.get(id);
    c.cleaned ??= (async () => {
      let seconds = null;
      let failure = null;
      let finished = false;
      // First, as the wait below may take minutes: a dialog killed meanwhile keeps its transcript.
      try { writeTranscript(); } catch { /* end() writes it too, and reports a failure */ }
      const read = async (ms = elevenTimeoutMs) => {
        try { return (await within(() => eleven.readConversation(id), ms)) ?? { ok: false, status: 0, text: 'no answer' }; }
        catch (error) { return { ok: false, status: 0, text: reason(error) }; }
      };
      const until = Date.now() + doneWaitMs;
      for (;;) {
        // No read of the wait runs past its end.
        const r = await read(Math.max(1, Math.min(elevenTimeoutMs, until - Date.now())));
        if (r.ok) {
          const secs = r.conversation?.metadata?.call_duration_secs;
          if (typeof secs === 'number') seconds = secs;
          if (FINISHED.has(r.conversation?.status)) { finished = true; break; }
        }
        if (Date.now() + donePollMs > until) break;
        await new Promise((resolve) => setTimeout(resolve, donePollMs));
      }
      // A wait that runs out deletes nothing: the report names the conversation left at ElevenLabs.
      if (!finished) return { seconds, failure: `${id} failed: not done at ElevenLabs within ${doneWaitMs / 1000} s` };
      try {
        const result = await within(() => eleven.deleteConversation(id), elevenTimeoutMs);
        if (!result?.ok) failure = `${id} failed: ${oneLine(`${result?.status ?? ''} ${result?.text ?? ''}`)}`;
      } catch (error) { failure = `${id} failed: ${reason(error)}`; }
      if (!failure) {
        const check = await read();
        if (check.ok) failure = `${id} failed: still at ElevenLabs after delete`;
        else if (check.status !== 404) failure = `${id} failed: not verified: ${oneLine(`${check.status} ${check.text ?? ''}`)}`;
      }
      return { seconds, failure };
    })();
    return c.cleaned;
  }

  // The end of a call (spec §18.3). The call stops being live before anything is awaited, so a token
  // request sent after the response is never refused as call-live: the page reconnects that way after
  // the duration limit. The first end of a call that leaves no call live ends the dialog when an end
  // was requested, when the fork has exited (Ruling T2-1), or on the agent's hang-up when agentHangup
  // is 'end'; otherwise the dialog pauses. `ending` is set before the cleanup is awaited, so a dialog
  // that ends is never reported paused. `detail`, when the page sends one, is the client's own account
  // of the end, kept in the note.
  async function endCall(id, cause, context, detail = '') {
    addLine('note', `call ended: ${cause}/${context}${detail ? ` (${detail})` : ''}`);
    const c = remember(id);
    if (!c) return;
    const first = c.endedAt === null;
    if (first) { c.endedAt = Date.now(); c.endContext = context; }
    if (liveCall === id) liveCall = null;
    if (first && liveCall === null && !ending) {
      if (endRequested || forkClosed || (agentHangup === 'end' && context === 'end_call')) end();
      else pause();
    }
    await clean(id);
  }

  // A live call whose heartbeat stopped (a closed tab, a lost network) ends as a call end with reason
  // heartbeat-lost: the dialog pauses, or ends when an end was requested. The watch checks it, and so
  // does a token request, so that a new call never starts beside one that was not ended.
  function endLostCall() {
    const live = liveCall === null ? null : calls.get(liveCall);
    if (live && Date.now() - live.lastBeat > heartbeatGraceMs) endCall(liveCall, 'heartbeat-lost', '');
  }

  // Runs once and always resolves `done`, so session X is woken whatever fails on the way. `ending`
  // is set before the first await. The three steps (spec §5.4) are independent: a failure in one is
  // added to the report and never skips the next.
  async function end() {
    if (ending) return;
    ending = true;
    clearInterval(watch);
    clearTimeout(firstBeat);
    clearTimeout(pauseLimit);
    pausedUntil = null;
    // An exit that no ask has seen yet is reported as one.
    if (forkClosed) forkExited = true;
    // A call still live (the end button) ends with the dialog.
    if (liveCall !== null) { calls.get(liveCall).endedAt ??= Date.now(); liveCall = null; }
    const notes = [];
    const conversations = [];
    let deletion = 'no conversation id';
    try {
      // 1. The fork's end turn (prompt.md, if a work order was confirmed), then the end of its input.
      try {
        if (forkExited) notes.push('fork exited before the end turn');
        else {
          // The end message may be queued behind a running ask, which may take askTimeoutMs; its timer
          // runs from this call, so that time is added and the end turn keeps endTurnMs of its own.
          const timeoutMs = askTimeoutMs + endTurnMs;
          const turn = await fork.ask(endMessage(dialogDir), { timeoutMs });
          if (turn.timedOut) notes.push(`fork end turn timed out after ${timeoutMs / 1000} s`);
          else if (turn.subtype === 'exited') { forkExited = true; notes.push('fork exited during the end turn'); }
        }
      } catch (error) { notes.push(`fork end turn failed (${reason(error)})`); }
      try {
        await within(() => fork.close({ deadlineMs: forkExited ? 0 : FORK_CLOSE_MS }), FORK_CLOSE_LIMIT_MS);
      } catch (error) { notes.push(`fork not closed (${reason(error)})`); }
      // The cause of an exit: the end of the fork's stderr, on one line and without a `;`, which would
      // split it into two segments of the deletion line.
      if (forkExited) {
        const tail = fork.stderrTail().replaceAll(';', ',').replace(/\s+/g, ' ').trim();
        if (tail) notes.push(`fork stderr: ${tail.length > 300 ? `…${tail.slice(-300)}` : tail}`);
      }

      // 2. transcript.md, with everything said in the dialog.
      try { writeTranscript(); } catch (error) { notes.push(`transcript not written (${reason(error)})`); }

      // 3. Every call not cleaned at its own end is cleaned now, and every call of the dialog is
      // reported (spec §18.4). A cleanup still running is waited for, so no call is deleted twice; a
      // call kept while this loop runs is still visited, as a Map's iteration includes added entries.
      const failures = [];
      for (const id of calls.keys()) {
        const { seconds, failure } = await clean(id);
        conversations.push({ id, seconds });
        if (failure) failures.push(failure);
      }
      if (calls.size > 0) deletion = failures.length ? failures.join('; ') : 'deleted';
    } catch (error) {
      notes.push(`end failed (${reason(error)})`);
    } finally {
      try { removeLiveFile(dialogDir); } catch { /* the file points at a closed bridge only */ }
      // Responses already written get a moment to leave; then nothing can keep the bridge open.
      server.close();
      setTimeout(() => server.closeAllConnections(), 1000).unref();
      let files = {};
      try { files = readDialogFiles(dialogDir); } catch (error) { notes.push(`dialog files not read (${reason(error)})`); }
      resolveDone(closingReport({ dialogDir, origin, files, deletion: [deletion, ...notes].join('; '), conversations }));
    }
  }

  let actualPort = port;
  async function handle(req, res) {
    const auth = authorize({ url: req.url, host: req.headers.host }, { token, port: actualPort });
    if (!auth.ok) { send(res, auth.status, auth.reason); return; }
    const path = new URL(req.url, 'http://local').pathname;
    if (req.method === 'GET' && path === '/') {
      send(res, 200, readFileSync(join(WEB, 'talk.html'), 'utf8').replaceAll('__TOKEN__', token), 'text/html; charset=utf-8');
    } else if (req.method === 'GET' && STATIC.has(path)) {
      let file;
      try { file = readFileSync(join(WEB, STATIC.get(path))); } catch { send(res, 404, 'not found'); return; }
      send(res, 200, file, 'text/javascript; charset=utf-8');
    } else if (req.method === 'GET' && path === '/api/status') {
      json(res, { forkReady: forkReady && !forkExited, forkExited, ending, interruption, state: state(), callLive: liveCall !== null,
        calls: calls.size, pausedUntil: pausedUntil === null ? null : new Date(pausedUntil).toISOString(), label, agentHangup, rejoinFirstMessage,
        undelivered: undelivered.length });
    } else if (req.method === 'GET' && path === '/api/conversation-token') {
      // One call at a time (spec §18.5): a second tab gets no token while a call is live, that is while
      // its heartbeat is within the grace. A conversation started once the end has begun would never
      // be deleted; a lost call ended here may itself end the dialog, so `ending` is read after it.
      endLostCall();
      if (ending) { json(res, { error: 'ending' }, 409); return; }
      if (liveCall !== null) { json(res, { error: 'call-live' }, 409); return; }
      json(res, { token: (await eleven.getConversationToken(agentId)).token });
    } else if (req.method === 'GET' && path === '/api/decisions') {
      const file = join(dialogDir, 'decisions.md');
      json(res, { decisions: existsSync(file) ? readFileSync(file, 'utf8') : '' });
    } else if (req.method === 'POST' && path === '/api/transcript') {
      const { role, text } = await readBody(req);
      if (typeof text === 'string') {
        addLine(role, text);
        if (role === 'user') { pendingUser.push(text); userWaiters.splice(0).forEach((wake) => wake()); }
      }
      json(res, { ok: true });
    } else if (req.method === 'GET' && path === '/api/history') {
      json(res, { transcript });
    } else if (req.method === 'GET' && path === '/api/rejoin-context') {
      json(res, rejoinContext());
    } else if (req.method === 'POST' && path === '/api/rejoin-context-sent') {
      // The page posts this only after the SDK accepted the update: that many of the oldest kept
      // answers are dropped, and any kept since the page read the context stay.
      const { undelivered: sent } = await readBody(req);
      if (Number.isInteger(sent) && sent > 0) undelivered.splice(0, sent);
      json(res, { ok: true });
    } else if (req.method === 'POST' && path === '/api/ask') {
      const { request, conversationId } = await readBody(req);
      if (ending) { json(res, { answer: ENDING }); return; }
      json(res, { answer: await ask(String(request ?? ''), { id: typeof conversationId === 'string' ? conversationId : null, res }) });
    } else if (req.method === 'POST' && path === '/api/heartbeat') {
      beat((await readBody(req)).conversationId);
      json(res, { ok: true });
    } else if (req.method === 'POST' && path === '/api/call-end') {
      // The answer comes once the call is no longer live, not after its cleanup: that waits for
      // ElevenLabs to finish the conversation (spec §18.4), and the page reconnects after the duration
      // limit only on this answer. end() still awaits every cleanup.
      const body = await readBody(req);
      endCall(body.conversationId, field(body.reason), field(body.context), field(body.detail));
      json(res, { ok: true });
    } else if (req.method === 'POST' && path === '/api/end-request') {
      // Rafal's spoken end (end_conversation): the dialog ends with the current call, or at once when no
      // call is live.
      endRequested = true;
      json(res, { ok: true });
      if (liveCall === null) end();
    } else if (req.method === 'POST' && path === '/api/end') {
      // The end button ends the dialog now; a call the bridge has not heard of yet is still deleted.
      remember((await readBody(req)).conversationId);
      json(res, { ok: true });
      end();
    } else {
      send(res, 404, 'not found');
    }
  }
  const server = createServer((req, res) => {
    handle(req, res).catch((error) => { if (res.headersSent) res.destroy(); else send(res, 500, reason(error)); });
  });

  // A start that cannot listen fails at once and takes its fork down with it.
  const url = await (async () => {
    try {
      await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, '127.0.0.1', () => { server.off('error', reject); resolve(); });
      });
      actualPort = server.address().port;
      const address = `http://127.0.0.1:${actualPort}/?t=${token}`;
      writeLiveFile(dialogDir, { sessionId, origin, url: address });
      return address;
    } catch (error) {
      server.close();
      await fork.close({ deadlineMs: 1000 }).catch(() => {});
      throw error;
    }
  })();
  server.on('error', () => {});

  // A page that never sends a heartbeat (no tab, no click) must not keep the bridge and fork alive.
  firstBeat = setTimeout(() => end(), firstBeatDeadlineMs);
  watch = setInterval(endLostCall, Math.min(1000, heartbeatGraceMs / 4));
  // A fork that exits before its introduction can serve no conversation, and no page can have started
  // one (the page waits for forkReady): the end runs at once instead of at the first-beat deadline. It
  // is attached only here, so that end() clears the timers set above.
  fork.ready.then((turn) => { if (turn.subtype === 'exited') end(); });
  // A fork that exits after its introduction (Ruling T2-1): a paused dialog ends at once, and during a
  // call the end of that call ends the dialog. Before the first call the exit is noticed by the next
  // ask, as in Plan 2, and the first-call deadline still ends the dialog.
  fork.exited.then(() => { forkClosed = true; if (state() === 'paused') end(); });
  if (openBrowser) {
    const browser = spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' });
    browser.on('error', () => {});
    browser.unref();
  }
  return { url, port: actualPort, token, done };
}
