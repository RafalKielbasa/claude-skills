// A stand-in for `claude` in launch tests (HUB_CLAUDE_CMD): logs its arguments and working
// directory, adds the new session to the agents file the CLI reads with --agents-json, and prints
// what `claude --bg` prints. FAKE_CLAUDE_EXIT makes it fail with FAKE_CLAUDE_MESSAGE on stderr;
// FAKE_CLAUDE_GARBLED makes it exit 0 without the "backgrounded" line.
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
appendFileSync(process.env.FAKE_CLAUDE_LOG, `${JSON.stringify({ args, cwd: process.cwd() })}\n`);
if (process.env.FAKE_CLAUDE_EXIT) {
  process.stderr.write(process.env.FAKE_CLAUDE_MESSAGE ?? 'failed');
  process.exit(Number(process.env.FAKE_CLAUDE_EXIT));
}
if (process.env.FAKE_CLAUDE_GARBLED) {
  process.stdout.write('started\n');
  process.exit(0);
}
const name = args[args.indexOf('--name') + 1];
const shortId = process.env.FAKE_CLAUDE_ID ?? '1a2b3c4d';
if (process.env.FAKE_AGENTS) {
  const list = JSON.parse(readFileSync(process.env.FAKE_AGENTS, 'utf8'));
  list.push({ sessionId: `${shortId}-0000-4000-8000-000000000000`, id: shortId, name, kind: 'background', status: 'busy', state: null, cwd: process.cwd() });
  writeFileSync(process.env.FAKE_AGENTS, JSON.stringify(list));
}
console.log(`Starting background service…\nbackgrounded · ${shortId} · ${name}\n  claude attach ${shortId}    open in this terminal`);
