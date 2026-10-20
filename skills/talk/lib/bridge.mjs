// The voice bridge (spec §5, §6): a short-lived HTTP server on 127.0.0.1 that serves the page, mints
// the ElevenLabs conversation token, relays ask_claude to the voice fork, ends the conversation,
// deletes it at ElevenLabs and resolves the closing report that wakes session X.
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { appendFileSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { authorize } from './auth.mjs';
import { prepareDialog } from './dialog.mjs';
import { startFork } from './fork.mjs';
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

// The call's result, or a rejection after `ms`: a stalled ElevenLabs call cannot hold the end.
function within(fn, ms) {
  let timer;
  const limit = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`no answer in ${ms} ms`)), ms); });
  return Promise.race([Promise.resolve().then(fn), limit]).finally(() => clearTimeout(timer));
}

export async function startBridge({ sessionId, cwd, dialogDir, agentId, eleven, command, forkEnv, port = 0,
  token = randomBytes(32).toString('hex'), heartbeatGraceMs = 15000, firstBeatDeadlineMs = 600000, askTimeoutMs = 115000,
  transcriptWaitMs = 1500, openBrowser = true, subject, interruption = 'contextual-update', asksFile, rawLog, elevenTimeoutMs = 20000 }) {
  const { snapshot, settingsPath } = prepareDialog({ cwd, dialogDir });
  const fork = startFork({ cwd, sessionId, settingsPath, dialogDir, command, env: forkEnv, rawLog,
    startPrompt: voiceStartPrompt({ projectName: basename(cwd), sourceId: sessionId, dialogDir, snapshot, subject }) });
  const urlFile = join(dialogDir, '.url');

  // A fork that exits also resolves `ready` (subtype 'exited'): it is never reported ready (Ruling R7),
  // and once its exit is seen, asks are answered at once instead of waiting for their timeout.
  let forkReady = false;
  let forkExited = false;
  fork.ready.then((turn) => { if (turn.subtype === 'exited') forkExited = true; else forkReady = true; });

  const transcript = [];
  const pendingUser = [];
  const userWaiters = [];
  const conversationIds = new Set(); // a page reload starts a second ElevenLabs conversation
  let lastBeat = null;
  let ending = false;
  let watch;
  let firstBeat;
  let resolveDone;
  const done = new Promise((resolve) => { resolveDone = resolve; });

  const remember = (id) => { if (typeof id === 'string' && CONVERSATION_ID.test(id)) conversationIds.add(id); };
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
    const answer = await fork.ask(`Agent głosowy przekazuje: ${request}\nRafał (transkrypcja): ${words}`, { timeoutMs: askTimeoutMs });
    logAsk({ ms: answer.ms, request, transcriptLate, timedOut: answer.timedOut });
    if (answer.subtype === 'exited') { forkExited = true; return FORK_GONE; }
    return answer.timedOut ? STILL_THINKING : answer.text;
  }

  // The agent re-issues an interrupted ask_claude with the same request (Plan 2, Task 1): the repeat
  // joins the ask in flight instead of costing the fork a second turn.
  const inFlight = new Map();
  async function ask(request) {
    const pending = inFlight.get(request);
    if (pending) {
      const calledAt = Date.now();
      const text = await pending;
      logAsk({ ms: Date.now() - calledAt, request, joined: true });
      return text;
    }
    const asked = askFork(request).finally(() => inFlight.delete(request));
    inFlight.set(request, asked);
    return asked;
  }

  // Runs once and always resolves `done`, so session X is woken whatever fails on the way. `ending`
  // is set before the first await. The three steps (spec §5.4) are independent: a failure in one is
  // added to the report and never skips the next.
  async function end() {
    if (ending) return;
    ending = true;
    clearInterval(watch);
    clearTimeout(firstBeat);
    const notes = [];
    const conversations = [];
    let deletion = 'no conversation id';
    try {
      // 1. The fork's end turn (prompt.md, if a work order was confirmed), then the end of its input.
      try {
        if (forkExited) notes.push('fork exited before the end turn');
        else {
          const turn = await fork.ask(endMessage(dialogDir), { timeoutMs: END_TURN_MS });
          if (turn.timedOut) notes.push(`fork end turn timed out after ${END_TURN_MS / 1000} s`);
          else if (turn.subtype === 'exited') { forkExited = true; notes.push('fork exited during the end turn'); }
        }
      } catch (error) { notes.push(`fork end turn failed (${reason(error)})`); }
      try {
        await within(() => fork.close({ deadlineMs: forkExited ? 0 : FORK_CLOSE_MS }), FORK_CLOSE_LIMIT_MS);
      } catch (error) { notes.push(`fork not closed (${reason(error)})`); }

      // 2. transcript.md, the only kept copy of the conversation (spec §6).
      try {
        const who = (role) => (role === 'user' ? 'Rafał' : role === 'note' ? 'Notatka' : 'Agent');
        const lines = transcript.map((t) => `- ${t.at} **${who(t.role)}**: ${t.text}\n`).join('');
        writeFileSync(join(dialogDir, 'transcript.md'), `# Transcript\n\n${lines}`, 'utf8');
      } catch (error) { notes.push(`transcript not written (${reason(error)})`); }

      // 3. Every known conversation is deleted at ElevenLabs; a failure is reported, not retried.
      const failures = [];
      for (const id of conversationIds) {
        let seconds = null;
        try {
          const secs = (await within(() => eleven.getConversation(id), elevenTimeoutMs))?.metadata?.call_duration_secs;
          if (typeof secs === 'number') seconds = secs;
        } catch { /* duration unknown */ }
        conversations.push({ id, seconds });
        try {
          const result = await within(() => eleven.deleteConversation(id), elevenTimeoutMs);
          if (!result?.ok) failures.push(`${id} failed: ${oneLine(`${result?.status ?? ''} ${result?.text ?? ''}`)}`);
        } catch (error) { failures.push(`${id} failed: ${reason(error)}`); }
      }
      if (conversationIds.size > 0) deletion = failures.length ? failures.join('; ') : 'deleted';
    } catch (error) {
      notes.push(`end failed (${reason(error)})`);
    } finally {
      try { rmSync(urlFile, { force: true }); } catch { /* the file points at a closed bridge only */ }
      // Responses already written get a moment to leave; then nothing can keep the bridge open.
      server.close();
      setTimeout(() => server.closeAllConnections(), 1000).unref();
      let files = {};
      try { files = readDialogFiles(dialogDir); } catch (error) { notes.push(`dialog files not read (${reason(error)})`); }
      resolveDone(closingReport({ dialogDir, files, deletion: [deletion, ...notes].join('; '), conversations }));
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
      json(res, { forkReady: forkReady && !forkExited, ending, interruption });
    } else if (req.method === 'GET' && path === '/api/conversation-token') {
      // A conversation started once the end has begun would never be deleted.
      if (ending) { json(res, { error: 'ending' }, 409); return; }
      json(res, { token: (await eleven.getConversationToken(agentId)).token });
    } else if (req.method === 'GET' && path === '/api/decisions') {
      const file = join(dialogDir, 'decisions.md');
      json(res, { decisions: existsSync(file) ? readFileSync(file, 'utf8') : '' });
    } else if (req.method === 'POST' && path === '/api/transcript') {
      const { role, text } = await readBody(req);
      if (typeof text === 'string') {
        transcript.push({ at: new Date().toLocaleTimeString('pl-PL'), role, text });
        if (role === 'user') { pendingUser.push(text); userWaiters.splice(0).forEach((wake) => wake()); }
      }
      json(res, { ok: true });
    } else if (req.method === 'POST' && path === '/api/ask') {
      const { request } = await readBody(req);
      if (ending) { json(res, { answer: ENDING }); return; }
      json(res, { answer: await ask(String(request ?? '')) });
    } else if (req.method === 'POST' && path === '/api/heartbeat') {
      remember((await readBody(req)).conversationId);
      lastBeat = Date.now();
      clearTimeout(firstBeat);
      json(res, { ok: true });
    } else if (req.method === 'POST' && path === '/api/end') {
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
      writeFileSync(urlFile, address, 'utf8');
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
  watch = setInterval(() => { if (lastBeat && Date.now() - lastBeat > heartbeatGraceMs) end(); }, Math.min(1000, heartbeatGraceMs / 4));
  if (openBrowser) {
    const browser = spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' });
    browser.on('error', () => {});
    browser.unref();
  }
  return { url, port: actualPort, token, done };
}
