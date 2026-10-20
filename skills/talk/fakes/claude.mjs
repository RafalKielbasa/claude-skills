// Accepts and ignores the restricted-command flags.
// A `claude -p --input-format stream-json` stand-in: answers each user line with "echo: <text>",
// one line at a time; FAKE_SLOW_MS applies to texts containing "slow", FAKE_DELAY_MS to the rest.
import { createInterface } from 'node:readline';

// With --replay-user-messages it echoes each user line before answering; FAKE_SPURIOUS=1 prints an
// empty result before the first echo, as one real fork did in the round-trip probe.
const slow = Number(process.env.FAKE_SLOW_MS ?? 0);
const delay = Number(process.env.FAKE_DELAY_MS ?? 0);
const replay = process.argv.includes('--replay-user-messages');
const print = (obj) => process.stdout.write(`${JSON.stringify(obj)}\n`);
let initDone = false;
let zeroDone = false;
let chain = Promise.resolve();
if (process.env.FAKE_SPURIOUS === '1') print({ type: 'result', subtype: 'success', result: '' });

const rl = createInterface({ input: process.stdin });
rl.on('line', (line) => {
  let msg;
  try { msg = JSON.parse(line); } catch { return; }
  if (msg.type !== 'user') return;
  const text = msg.message.content.map((c) => c.text).join('');
  chain = chain.then(async () => {
    if (!initDone) { print({ type: 'system', subtype: 'init', session_id: 'fork-1' }); initDone = true; }
    if (replay) print({ type: 'user', message: { role: 'user', content: [{ type: 'text', text }] } });
    // FAKE_ZERO_TURNS=1: a `result` with num_turns 0 right after the first replay, before the real answer.
    if (process.env.FAKE_ZERO_TURNS === '1' && !zeroDone) { zeroDone = true; print({ type: 'result', subtype: 'success', num_turns: 0, result: '' }); }
    await new Promise((r) => setTimeout(r, text.includes('slow') ? slow : delay));
    const answer = `echo: ${text}${process.env.ELEVENLABS_API_KEY ? ' [key]' : ''}`;
    print({ type: 'assistant', message: { content: [{ type: 'text', text: answer }] } });
    print({ type: 'result', subtype: 'success', result: answer });
  });
});
// FAKE_HANG=1: the process ignores the end of stdin, like a fork that never exits.
rl.on('close', () => { if (process.env.FAKE_HANG === '1') setInterval(() => {}, 1000); else chain.then(() => process.exit(0)); });
