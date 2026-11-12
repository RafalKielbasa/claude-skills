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
// Shared by the judge (`runCodex`) and the finder (`runCodexFind`), so the stdin
// and Windows-shell handling cannot drift between the two.
export function spawnCodex(prompt, { cwd, timeoutMs, binary = 'codex', spawn = spawnSync, platform = process.platform }) {
  if (!SAFE_BINARY.test(binary)) return { status: 'unavailable', stdout: '', raw: 'unsafe binary name' };
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
  if (result.error && result.error.code === 'ETIMEDOUT') return { status: 'timeout', stdout: result.stdout ?? '', raw: result.stdout ?? '' };
  if (result.error) return { status: 'unavailable', stdout: '', raw: String(result.error.code ?? result.error.message) };
  if (result.status !== 0) return { status: 'unavailable', stdout: result.stdout ?? '', raw: result.stderr ?? '' };
  return { status: 'ok', stdout: result.stdout, raw: result.stdout };
}

export function runCodex(prompt, options) {
  const spawned = spawnCodex(prompt, options);
  if (spawned.status !== 'ok') return { status: spawned.status, verdicts: {}, raw: spawned.raw };
  const verdicts = parseCodexVerdicts(spawned.stdout);
  if (verdicts === null) return { status: 'unparsable', verdicts: {}, raw: spawned.stdout };
  return { status: 'ok', verdicts, raw: spawned.stdout };
}

// Same wording rule as SKILL.md Step 4: a grouped slot names each axis's default
// next to its checklist instead of averaging them into one value.
export function buildCodexFindPrompt(selected) {
  const template = readFileSync(join(HERE, '..', 'prompts', 'codex-find.md'), 'utf8');
  const rendered = selected.map((entry) => {
    const grouped = entry.axes.length > 1;
    const severity = entry.axes.map((a) => `${a.id}: ${a.severity_default} by default`).join('; ');
    const checklist = entry.axes
      .map((a) => (grouped ? `#### ${a.id}\n\n${a.checklist}` : a.checklist))
      .join('\n\n');
    const files = entry.files.map((f) => `${f.path} (+${f.added}/-${f.removed})`).join('\n');
    return [
      `### ${entry.axisId}`, '',
      `Severity: ${severity}`, '',
      'Checklist:', '', checklist, '',
      'Files:', '', files,
    ].join('\n');
  }).join('\n\n');
  // A replacer function: a checklist may contain `$&` or `$1`, which a string
  // replacement would interpret.
  return template.replace('{{AXES}}', () => rendered);
}

// Codex prints prose around its answer, and the prose may contain brackets
// ("see [1]") that are valid JSON. The answer is therefore the LAST array that
// is non-empty and made only of plain objects; a bare `[]` is the answer only
// when no such array exists. Closing brackets are walked from the end and
// openers from the start, so the first match is the outermost array ending
// last, never an inner `[88, 94]` of a finding.
const MAX_PARSE_ATTEMPTS = 5000;
const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

const lastJsonArray = (text) => {
  const opens = [];
  const closes = [];
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === '[') {
      // An array of findings opens with `{` (or is `[]`); skipping every other
      // opener keeps prose brackets from costing a parse each.
      const next = /\S/.exec(text.slice(i + 1, i + 1 + 64));
      if (next && (next[0] === '{' || next[0] === ']')) opens.push(i);
    } else if (text[i] === ']') closes.push(i);
  }
  let emptyFallback = null;
  let attempts = 0;
  for (const end of closes.reverse()) {
    for (const start of opens) {
      if (start > end) break;
      if (attempts >= MAX_PARSE_ATTEMPTS) return emptyFallback;
      attempts += 1;
      let parsed;
      try {
        parsed = JSON.parse(text.slice(start, end + 1));
      } catch {
        continue;
      }
      if (!Array.isArray(parsed)) continue;
      if (parsed.length === 0) emptyFallback ??= parsed;
      else if (parsed.every(isPlainObject)) return parsed;
    }
  }
  return emptyFallback;
};

export function parseCodexFindings(stdout, selected) {
  const array = lastJsonArray(String(stdout));
  if (array === null) return null;
  const filesByAxis = new Map(selected.map((e) => [e.axisId, new Set(e.files.map((f) => f.path))]));
  const findings = [];
  let droppedOffAxis = 0;
  for (const item of array) {
    const files = item && typeof item === 'object' ? filesByAxis.get(item.axis) : undefined;
    if (!files || !files.has(item.file)) {
      droppedOffAxis += 1;
      continue;
    }
    // `fix` is the only optional field given a defined shape; anything else the
    // finder adds is left alone, since assemble overwrites provenance fields.
    findings.push({ ...item, fix: typeof item.fix === 'string' ? item.fix : null });
  }
  return { findings, droppedOffAxis };
}

export function runCodexFind(selected, { cwd, timeoutMs, spawn, platform }) {
  const spawned = spawnCodex(buildCodexFindPrompt(selected), { cwd, timeoutMs, spawn, platform });
  if (spawned.status !== 'ok') {
    return { status: spawned.status, findings: [], droppedOffAxis: 0, raw: spawned.raw };
  }
  const parsed = parseCodexFindings(spawned.stdout, selected);
  if (parsed === null) return { status: 'unparsable', findings: [], droppedOffAxis: 0, raw: spawned.stdout };
  return { status: 'ok', ...parsed, raw: spawned.stdout };
}
