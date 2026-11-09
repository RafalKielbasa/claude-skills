// A stand-in for the speech process in tests (HUB_SPEAK_CMD): reads stdin and appends
// { start, end, text, argv } to HUB_SPEAK_LOG. HUB_SPEAK_MS makes it take that long; HUB_SPEAK_FAIL
// makes it exit 1 after logging.
import { appendFileSync } from 'node:fs';

const start = Date.now();
const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);
const text = Buffer.concat(chunks).toString('utf8');
if (process.env.HUB_SPEAK_MS) await new Promise((resolve) => setTimeout(resolve, Number(process.env.HUB_SPEAK_MS)));
appendFileSync(process.env.HUB_SPEAK_LOG, `${JSON.stringify({ start, end: Date.now(), text, argv: process.argv.slice(2) })}\n`);
if (process.env.HUB_SPEAK_FAIL) {
  process.stderr.write(process.env.HUB_SPEAK_STDERR ?? 'fake speech failure');
  process.exit(1);
}
