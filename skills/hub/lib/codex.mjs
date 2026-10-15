// The Codex consultation (spec §7): a read-only reviewer, one thread per element. The first call is
// `codex exec -s read-only -C <dir>`, a follow-up `codex exec resume <id> -c sandbox_mode="read-only"`
// run from <dir> (probe S9); prompts go on stdin, the answer to answer-<n>.md, stderr to
// answer-<n>.err, where a write refusal appears.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { isDenied, excludePathspecs } from './denylist.mjs';
import { isWithin } from './projects.mjs';

export const CODEX_TIMEOUT_MS = 15 * 60 * 1000;

// HUB_CODEX_CMD, a JSON array, replaces the command for tests. `codex` is an npm shim (codex.cmd)
// that Node cannot spawn without a shell, so the hub runs the package's codex.js with this Node.
export function codexCommand(env = process.env) {
  if (env.HUB_CODEX_CMD) return JSON.parse(env.HUB_CODEX_CMD);
  const script = env.APPDATA ? join(env.APPDATA, 'npm', 'node_modules', '@openai', 'codex', 'bin', 'codex.js') : null;
  return script && existsSync(script) ? [process.execPath, script] : ['codex'];
}

export const REVIEWER_ROLE = [
  'You are a reviewer Rafal consults for a second opinion. You only read and comment:',
  '- you change no file and run no command that writes;',
  '- you launch no other agent (no claude, no codex);',
  '- you authorise nothing; Rafal decides.',
  'Answer in Polish.',
].join('\n');

export class DeniedError extends Error {}

// The element, as spec §7 step 2 has it: files from the hub data pasted verbatim, repository files
// and diffs given as paths and refs for Codex to read itself, denylisted names never.
export function describeElement(element, hubRoot) {
  if (element.kind === 'diff') {
    return `Element: the diff of \`git diff ${element.range} -- ${excludePathspecs().map((p) => `'${p}'`).join(' ')}\` in your working directory. Run it yourself.`;
  }
  if (isDenied(element.path)) throw new DeniedError(`the element ${element.path} matches the secrets denylist (spec §7); ask Rafal`);
  if (isWithin(element.path, hubRoot)) {
    return `Element (pasted from ${element.path}):\n\n\`\`\`\`\n${readFileSync(element.path, 'utf8')}\n\`\`\`\``;
  }
  return `Element: the file ${element.path}. Read it yourself.`;
}

export function firstPrompt({ question, elementText }) {
  return `${REVIEWER_ROLE}\n\n${elementText}\n\nQuestion:\n${question}\n`;
}

export function parseThreadId(stream) {
  for (const line of String(stream ?? '').split('\n')) {
    try {
      const event = JSON.parse(line);
      if (event.type === 'thread.started' && event.thread_id) return event.thread_id;
    } catch {
      // not a JSON line
    }
  }
  return null;
}

export const askArgs = ({ cwd, answerFile }) => ['exec', '-s', 'read-only', '-C', cwd, '--json', '-o', answerFile, '-'];
export const followArgs = ({ threadId, answerFile }) => ['exec', 'resume', threadId, '-c', 'sandbox_mode="read-only"', '--json', '-o', answerFile, '-'];

// A failure is an exit code, a timeout or an empty answer; an `error` item in the stream is not
// (probe S9: every stream carried a hooks.json warning as one).
export function runCodex({ args, cwd, input, answerFile, errFile, env = process.env, run = spawnSync, timeoutMs = CODEX_TIMEOUT_MS }) {
  const [cmd, ...prefix] = codexCommand(env);
  const result = run(cmd, [...prefix, ...args], { cwd, env, input, encoding: 'utf8', timeout: timeoutMs, maxBuffer: 256 * 1024 * 1024, windowsHide: true });
  writeFileSync(errFile, result.stderr ?? '', 'utf8');
  const answer = existsSync(answerFile) ? readFileSync(answerFile, 'utf8') : '';
  let failure = null;
  if (result.error) failure = result.error.code === 'ETIMEDOUT' ? `timeout after ${Math.round(timeoutMs / 1000)} s` : result.error.message;
  else if (result.status !== 0) failure = `exit ${result.status}: ${String(result.stderr ?? '').trim().split('\n').slice(-5).join('\n')}`;
  else if (!answer.trim()) failure = 'empty answer';
  return { ok: !failure, failure, threadId: parseThreadId(result.stdout), answer };
}

export function threadEntry({ n, question, prompt, at, outcome }) {
  const answer = outcome.ok ? outcome.answer.trim() : `Brak drugiej opinii: ${outcome.failure}`;
  return `## Question ${n} (${at})\n\n${question.trim()}\n\n<details><summary>Full prompt</summary>\n\n${prompt.trim()}\n\n</details>\n\n## Answer ${n}\n\n${answer}\n\n`;
}
