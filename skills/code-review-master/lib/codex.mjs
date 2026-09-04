import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const VERDICTS = new Set(['confirms', 'rejects', 'unsure']);

export function buildCodexPrompt(findings) {
  const template = readFileSync(join(HERE, '..', 'prompts', 'codex.md'), 'utf8');
  const rendered = findings.map((f) => [
    `- id: ${f.id}`,
    `  axis: ${f.axis}`,
    `  where: ${f.file}:${f.lines[0]}-${f.lines[1]}`,
    `  severity: ${f.severity}`,
    `  claim: ${f.claim}`,
    `  rule: ${f.rule ?? f.axis}`,
    '  evidence: |',
    `    ${f.evidence.split('\n').join('\n    ')}`,
  ].join('\n')).join('\n');
  return template.replace('{{FINDINGS}}', rendered);
}

// Codex prints prose around its answer; take the last balanced JSON object.
export function parseCodexVerdicts(stdout) {
  const matches = [...String(stdout).matchAll(/\{[\s\S]*?"verdicts"[\s\S]*?\}\s*\]?\s*\}/g)];
  for (const match of matches.reverse()) {
    try {
      const parsed = JSON.parse(match[0]);
      const out = {};
      for (const entry of parsed.verdicts ?? []) {
        out[entry.id] = {
          verdict: VERDICTS.has(entry.verdict) ? entry.verdict : 'unsure',
          reason: entry.reason ?? '',
          fix: entry.fix ?? null,
        };
      }
      return out;
    } catch {
      continue;
    }
  }
  return null;
}

// The prompt goes on stdin (`-`), never on the command line: it carries quoted
// source code, and no amount of escaping makes that safe as an argument.
const CODEX_ARGS = ['exec', '--sandbox', 'read-only', '-'];
const SAFE_BINARY = /^[A-Za-z0-9._-]+$/;

// `spawn` and `platform` are injectable so the Windows fallback can be tested
// deterministically, without a codex install and without an API call. The
// defect this guards against was invisible to every unit test written before it.
export function runCodex(prompt, { cwd, timeoutMs, binary = 'codex', spawn = spawnSync, platform = process.platform }) {
  if (!SAFE_BINARY.test(binary)) return { status: 'unavailable', verdicts: {}, raw: 'unsafe binary name' };
  const attempt = (command, args) => spawn(command, args,
    { cwd, input: prompt, encoding: 'utf8', timeout: timeoutMs, maxBuffer: 32 * 1024 * 1024 });
  let result = attempt(binary, CODEX_ARGS);
  // Windows cannot exec an npm shim directly: the extensionless `codex` is a
  // shell script, and Node has refused to spawn `.cmd` since CVE-2024-27980.
  // Retry through the shell with a command line that interpolates no data —
  // the prompt is still on stdin, and the binary name is pattern-checked above.
  if (result.error && platform === 'win32') {
    result = attempt(process.env.ComSpec || 'cmd.exe',
      ['/d', '/s', '/c', `${binary} ${CODEX_ARGS.join(' ')}`]);
  }
  if (result.error && result.error.code === 'ETIMEDOUT') return { status: 'timeout', verdicts: {}, raw: result.stdout ?? '' };
  if (result.error) return { status: 'unavailable', verdicts: {}, raw: String(result.error.code ?? result.error.message) };
  if (result.status !== 0) return { status: 'unavailable', verdicts: {}, raw: result.stderr ?? '' };
  const verdicts = parseCodexVerdicts(result.stdout);
  if (verdicts === null) return { status: 'unparsable', verdicts: {}, raw: result.stdout };
  return { status: 'ok', verdicts, raw: result.stdout };
}
