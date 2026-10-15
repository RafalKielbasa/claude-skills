// A stand-in for `codex` in consultation tests (HUB_CODEX_CMD): logs its arguments, working
// directory and stdin, prints a --json stream with thread.started and an `error` item, and writes
// the answer to the -o file. FAKE_CODEX_EXIT fails it; FAKE_CODEX_EMPTY leaves the answer empty;
// FAKE_CODEX_NO_THREAD leaves out thread.started.
import { appendFileSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  appendFileSync(process.env.FAKE_CODEX_LOG, `${JSON.stringify({ args, cwd: process.cwd(), input })}\n`);
  const thread = args[1] === 'resume' ? args[2] : '01a136b7-2195-70d0-8cb4-81ac73919aa0';
  if (!process.env.FAKE_CODEX_NO_THREAD) console.log(JSON.stringify({ type: 'thread.started', thread_id: thread }));
  console.log(JSON.stringify({ type: 'item.completed', item: { id: 'item_0', type: 'error', message: 'clamping SessionEnd hook timeout to 3s' } }));
  if (process.env.FAKE_CODEX_EXIT) {
    process.stderr.write('ERROR: usage limit reached');
    process.exit(Number(process.env.FAKE_CODEX_EXIT));
  }
  writeFileSync(args[args.indexOf('-o') + 1], process.env.FAKE_CODEX_EMPTY ? '' : `Odpowiedź na: ${input.split('\n').pop() || input.slice(-40)}`);
  process.stderr.write('writing is blocked by read-only sandbox\n');
});
