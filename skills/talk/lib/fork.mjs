// The voice fork (spec §8): one `claude -p` process per conversation, fed over stream-json.
// A message is written only after the previous turn ended, and a result counts as its answer only
// after the fork replayed that message (--replay-user-messages): one real fork printed an empty
// result before answering its first message (round-trip probe, 2026-10-19).
import { spawn } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { createTurnCollector, userLine } from './stream.mjs';

const STDERR_TAIL_LINES = 20;
const textOf = (msg) => (Array.isArray(msg?.message?.content) ? msg.message.content.filter((c) => c.type === 'text').map((c) => c.text).join('') : null);

// The restricted fork command of spec §8, without the executable; --add-dir stays the last pair.
export function forkArgs({ sessionId, settingsPath, dialogDir, model }) {
  return ['-p', '--resume', sessionId, '--fork-session', '--restricted', '--tools', 'Read,Grep,Glob,Edit,Write',
    '--strict-mcp-config', '--permission-mode', 'default', '--input-format', 'stream-json', '--output-format', 'stream-json',
    '--verbose', '--replay-user-messages', '--settings', settingsPath, ...(model ? ['--model', model] : []), '--add-dir', dialogDir];
}

export function startFork({ cwd, sessionId, settingsPath, dialogDir, startPrompt, command = ['claude'], model, env, rawLog }) {
  const args = [...command.slice(1), ...forkArgs({ sessionId, settingsPath, dialogDir, model })];
  // Only the bridge reads the ElevenLabs key (spec §3); the fork and its hooks never get it. Windows
  // reads env names in any letter case, so every spelling of the name is removed.
  const childEnv = { ...process.env, ...env };
  for (const name of Object.keys(childEnv)) if (name.toUpperCase() === 'ELEVENLABS_API_KEY') delete childEnv[name];
  const child = spawn(command[0], args, { cwd, env: childEnv, stdio: ['pipe', 'pipe', 'pipe'] });
  child.on('error', () => {});
  child.stdin.on('error', () => {});
  const collector = createTurnCollector();
  const waiters = [];
  let closed = false;
  let resolveSessionId;
  const sessionIdPromise = new Promise((resolve) => { resolveSessionId = resolve; });
  const exited = new Promise((resolve) => {
    child.on('close', (code) => {
      closed = true;
      for (const waiter of waiters.splice(0)) waiter.resolve({ text: '', subtype: 'exited' });
      resolveSessionId(null);
      resolve(code);
    });
  });
  // stderr is drained, and only its last lines are kept: the cause the report gives for a fork that exited.
  const stderrLines = [];
  createInterface({ input: child.stderr }).on('line', (line) => {
    stderrLines.push(line);
    if (stderrLines.length > STDERR_TAIL_LINES) stderrLines.shift();
  });
  createInterface({ input: child.stdout }).on('line', (line) => {
    if (rawLog) appendFileSync(rawLog, `${line}\n`, 'utf8');
    try {
      const msg = JSON.parse(line);
      if (msg.type === 'system' && msg.subtype === 'init' && msg.session_id) resolveSessionId(msg.session_id);
      if (msg.type === 'user' && waiters[0] && !waiters[0].echoed && textOf(msg) === waiters[0].text) waiters[0].echoed = true;
    } catch { /* not JSON */ }
    const turn = collector.push(line);
    if (turn && waiters[0]?.echoed) waiters.shift().resolve(turn);
  });

  // After the close event no waiter would ever be resolved: a message sent then is answered at once.
  const send = (text) => (closed ? Promise.resolve({ text: '', subtype: 'exited' })
    : new Promise((resolve) => { waiters.push({ text, echoed: false, resolve }); child.stdin.write(userLine(text)); }));
  const ready = send(startPrompt);
  let tail = ready;

  function ask(text, { timeoutMs = 115000 } = {}) {
    const calledAt = Date.now();
    const turn = tail.then(() => {
      const startedAt = Date.now();
      return send(text).then((t) => ({ ...t, startedAt, endedAt: Date.now() }));
    });
    tail = turn;
    let timer;
    const timeout = new Promise((resolve) => {
      timer = setTimeout(() => resolve({ text: '', subtype: 'timeout', ms: Date.now() - calledAt, timedOut: true }), timeoutMs);
    });
    const answered = turn.then((t) => ({ ...t, ms: Date.now() - calledAt, timedOut: false }));
    return Promise.race([answered, timeout]).finally(() => clearTimeout(timer));
  }

  // Ends stdin once the last turn ended or the deadline passed, and kills a fork that does not
  // exit within a second deadline, so the bridge's end can never hang on the fork.
  async function close({ deadlineMs = 30000 } = {}) {
    const wait = (ms) => new Promise((resolve) => { setTimeout(resolve, ms).unref(); });
    await Promise.race([tail.catch(() => {}), wait(deadlineMs)]);
    child.stdin.end();
    const code = await Promise.race([exited, wait(deadlineMs).then(() => 'deadline')]);
    if (code !== 'deadline') return code;
    child.kill();
    return exited;
  }

  return { ready, sessionId: sessionIdPromise, ask, close, stderrTail: () => stderrLines.join('\n') };
}
