# code-review-master Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a global Claude Code skill that runs a configuration-driven code review under a hard, computed agent budget, cross-checks its findings with `codex`, and produces a Polish report plus machine-readable findings.

**Architecture:** A thin `SKILL.md` orchestrates; everything deterministic lives in a Node CLI (`bin/crm.mjs`, stdlib only) shipped inside the skill directory. The CLI resolves configuration, collects the target from git, computes the axis selection and the agent budget, applies triage suppression, assembles `findings.json`, runs the codex cross-check, renders `raport.md`, and returns the exit code. Claude does only what a program cannot: dispatch subagents, write Polish prose, and implement fixes. The budget ceiling is therefore a number a tested function returns, not a rule a model promises to keep.

**Tech Stack:** Node 20 (v20.19.4 confirmed on this machine), ES modules, `node:test` + `node:assert/strict`, zero npm dependencies. Git and `gh` are invoked as child processes. `codex` CLI for the cross-check.

**Spec:** `D:\Notatki\notatki\.claude\specs\2026-09-04-code-review-master-design.md`

## Global Constraints

- **Everything in the skill is written in English** — identifiers, comments, tests, configuration, templates, prompts, `SKILL.md`. The only Polish is the text the skill emits at runtime: `raport.md`, the artifact, and its conversation with the user.
- **Never commit.** This plan has no commit steps. Each task ends with a **Checkpoint** — verification plus a stop for review — and leaves changes uncommitted in the working tree. If any sub-skill instructs a commit, skip that step and say so in the summary.
- **No npm dependencies.** Node standard library only. Anything that would need a package (YAML, glob) is implemented as a small, tested module in `lib/`.
- **Agent budget invariant:** a run costs `1 + 2 × selectedAxes.length` subagents, `selectedAxes.length ≤ slots`, `slots` default 5. No code path may raise this without an explicit `--slots` argument.
- **Subagents never receive the `Agent` tool.** Enforced in the dispatch instructions in `SKILL.md` and asserted in Task 13's review.
- **Skill root:** `C:\Users\rafal\.claude\skills\code-review-master\` (referred to below as `<skill>`). It sits inside the git repository at `C:\Users\rafal\.claude`.
- **Codex is one process per run**, batched over all findings, and never a subagent.
- **Unattended runs never apply fixes and never raise the budget.**

---

## File Structure

```
<skill>/
  SKILL.md                  # orchestration: modes, dispatch, prose, gates
  package.json              # { "type": "module" } — no dependencies
  bin/crm.mjs               # CLI entry, subcommand dispatch, exit codes
  lib/yaml-lite.mjs         # restricted YAML subset parser
  lib/glob.mjs              # glob → RegExp matcher, plus specificity scoring
  lib/state.mjs             # state.json read/write, defaults, atomic write
  lib/config.mjs            # parse config.md, merge global+repo, validate
  lib/target.mjs            # git/gh target collection per mode
  lib/axes.mjs              # on-touch, rank, rotation, slots, budget  ← cost governor
  lib/triage.mjs            # claim normalisation, fingerprints, suppression
  lib/findings.mjs          # evidence validation, dedupe, thresholds
  lib/links.mjs             # git remote → GitHub blob URL
  lib/report.mjs            # raport.md rendering (Polish)
  lib/codex.mjs             # codex prompt, spawn, verdict parsing
  lib/gate.mjs              # exit-code decision
  prompts/brief.md          # wave 0 agent prompt template
  prompts/axis.md           # wave 1 agent prompt template
  prompts/verify.md         # wave 2 agent prompt template
  prompts/codex.md          # codex cross-check prompt template
  templates/global.md       # seed for ~/.claude/review/global.md
  templates/config.md       # skeleton emitted by `init`
  templates/artifact.html   # artifact shell rendered by SKILL.md
  scripts/review.ps1        # Windows scheduled nightly run
  scripts/review.sh         # CI / POSIX run
  ci/code-review.yml        # GitHub Actions job to copy into a repo
  test/helpers/repo.mjs     # temp git repository builder for tests
  test/*.test.mjs           # one file per lib module
```

Each `lib/` module is a pure function surface over plain data, apart from `target.mjs` and `codex.mjs`, which shell out, and `state.mjs`, which touches disk. That split is what keeps the tests fast and the budget logic verifiable.

## Notes on spec interpretation

Two places where this plan resolves something the spec left to implementation:

1. **Wave 0's assignment work moves into the CLI.** Spec §7 step 3 gives the brief agent the file inventory, the summary, and the file-to-axis assignment. Churn, glob matching, ranking, and truncation are deterministic, so `lib/axes.mjs` computes them and the brief agent receives the candidate assignment, supplying only the change summary and any risk reordering. Same behaviour, one fewer thing the model can get wrong, and testable.
2. **Configuration uses a restricted YAML subset.** With no dependencies, `lib/yaml-lite.mjs` supports exactly: scalars, quoted strings, inline maps, inline lists, block lists, and one level of nested map. Anything else raises `YamlLiteError` naming the line — the parser refuses rather than guesses.

---

## Stage 1 — deterministic core

### Task 1: Skeleton and state store

**Files:**
- Create: `<skill>/package.json`
- Create: `<skill>/lib/state.mjs`
- Test: `<skill>/test/state.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: `readState(repoDir) -> State`, `writeState(repoDir, state) -> void`, `emptyState() -> State`, where `State` is `{ schema: 1, last_reviewed_sha: string|null, axis_cursor: string[], file_cursor: Record<string,string>, triage: TriageEntry[], runs: {id: string, artifact_url: string|null}[] }` and `TriageEntry` is `{ fingerprint: string, verdict: 'accepted'|'rejected'|'deferred', scope: 'here'|'everywhere', reason: string, at: string, until: string|null }`.

- [ ] **Step 1: Create the package manifest**

`<skill>/package.json`:

```json
{
  "name": "code-review-master",
  "private": true,
  "type": "module",
  "scripts": { "test": "node --test test/" }
}
```

- [ ] **Step 2: Write the failing test**

`<skill>/test/state.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readState, writeState, emptyState } from '../lib/state.mjs';

test('readState returns an empty state when the file is absent', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'crm-'));
  assert.deepEqual(readState(dir), emptyState());
});

test('writeState then readState round-trips', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'crm-'));
  const state = emptyState();
  state.last_reviewed_sha = 'a1f2e30';
  state.axis_cursor = ['conventions', 'git-history'];
  writeState(dir, state);
  assert.equal(readState(dir).last_reviewed_sha, 'a1f2e30');
  const raw = await readFile(join(dir, '.claude/review/state.json'), 'utf8');
  assert.match(raw, /\n$/, 'file ends with a newline');
});

test('readState rejects an unknown schema version', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'crm-'));
  writeState(dir, { ...emptyState(), schema: 99 });
  assert.throws(() => readState(dir), /schema 99/);
});
```

- [ ] **Step 3: Run the test and confirm it fails**

Run: `cd <skill> && node --test test/state.test.mjs`
Expected: FAIL — `Cannot find module '../lib/state.mjs'`.

- [ ] **Step 4: Implement `lib/state.mjs`**

```js
import { readFileSync, writeFileSync, mkdirSync, renameSync } from 'node:fs';
import { join, dirname } from 'node:path';

const SCHEMA = 1;

export function emptyState() {
  return { schema: SCHEMA, last_reviewed_sha: null, axis_cursor: [], file_cursor: {}, triage: [], runs: [] };
}

export function statePath(repoDir) {
  return join(repoDir, '.claude', 'review', 'state.json');
}

export function readState(repoDir) {
  let raw;
  try {
    raw = readFileSync(statePath(repoDir), 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return emptyState();
    throw err;
  }
  const state = JSON.parse(raw);
  if (state.schema !== SCHEMA) {
    throw new Error(`state.json has schema ${state.schema}, this build understands ${SCHEMA}`);
  }
  return { ...emptyState(), ...state };
}

// Temp file plus rename, so an interrupted run never leaves half a state file.
export function writeState(repoDir, state) {
  const target = statePath(repoDir);
  mkdirSync(dirname(target), { recursive: true });
  const tmp = `${target}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  renameSync(tmp, target);
}
```

- [ ] **Step 5: Run the test and confirm it passes**

Run: `cd <skill> && node --test test/state.test.mjs`
Expected: PASS, 3 tests.

- [ ] **Step 6: Checkpoint**

Report: files created, test output. Leave uncommitted.

---

### Task 2: Parsing primitives — restricted YAML and glob

**Files:**
- Create: `<skill>/lib/yaml-lite.mjs`
- Create: `<skill>/lib/glob.mjs`
- Test: `<skill>/test/yaml-lite.test.mjs`, `<skill>/test/glob.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: `parseYamlLite(text) -> object` (throws `YamlLiteError`); `globToRegExp(pattern) -> RegExp`, `matchGlob(pattern, path) -> boolean`, `globSpecificity(pattern) -> number` (count of literal path segments, used to break ties in file ranking).

- [ ] **Step 1: Write the failing tests**

`<skill>/test/yaml-lite.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseYamlLite, YamlLiteError } from '../lib/yaml-lite.mjs';

test('parses scalars, inline maps and inline lists', () => {
  const out = parseYamlLite(`
gate: blocking
gate_on_disputed: true
budget: { slots: 5, max_files_per_axis: 40 }
exclude: ['**/node_modules/**', 'pnpm-lock.yaml']
`);
  assert.equal(out.gate, 'blocking');
  assert.equal(out.gate_on_disputed, true);
  assert.deepEqual(out.budget, { slots: 5, max_files_per_axis: 40 });
  assert.deepEqual(out.exclude, ['**/node_modules/**', 'pnpm-lock.yaml']);
});

test('parses block lists and one level of nesting', () => {
  const out = parseYamlLite(`
when:
  - apps/api/**
  - packages/**
codex:
  enabled: true
  timeout_s: 300
`);
  assert.deepEqual(out.when, ['apps/api/**', 'packages/**']);
  assert.deepEqual(out.codex, { enabled: true, timeout_s: 300 });
});

test('ignores comments outside quotes', () => {
  const out = parseYamlLite(`gate: blocking   # exit 1 on blocking\nid: 'a#b'\n`);
  assert.equal(out.gate, 'blocking');
  assert.equal(out.id, 'a#b');
});

test('refuses syntax outside the supported subset', () => {
  assert.throws(() => parseYamlLite('key: |\n  folded text\n'), YamlLiteError);
});
```

`<skill>/test/glob.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchGlob, globSpecificity } from '../lib/glob.mjs';

test('** spans directories, * does not', () => {
  assert.equal(matchGlob('apps/api/**', 'apps/api/src/x.ts'), true);
  assert.equal(matchGlob('apps/*/x.ts', 'apps/api/x.ts'), true);
  assert.equal(matchGlob('apps/*/x.ts', 'apps/api/src/x.ts'), false);
  assert.equal(matchGlob('**/*.tsx', 'apps/web/a/b.tsx'), true);
  assert.equal(matchGlob('**/node_modules/**', 'apps/web/node_modules/x/y.js'), true);
});

test('specificity counts literal segments', () => {
  assert.equal(globSpecificity('**'), 0);
  assert.equal(globSpecificity('apps/api/**'), 2);
  assert.equal(globSpecificity('apps/api/src/x.ts'), 4);
});
```

- [ ] **Step 2: Run both tests and confirm they fail**

Run: `cd <skill> && node --test test/yaml-lite.test.mjs test/glob.test.mjs`
Expected: FAIL — both modules missing.

- [ ] **Step 3: Implement `lib/glob.mjs`**

```js
const SEGMENT = '[^/]*';

export function globToRegExp(pattern) {
  let out = '';
  for (let i = 0; i < pattern.length; i += 1) {
    const ch = pattern[i];
    if (ch === '*' && pattern[i + 1] === '*') {
      // `**/` may also match nothing, so `**/a.ts` matches a top-level a.ts.
      if (pattern[i + 2] === '/') { out += '(?:.*/)?'; i += 2; } else { out += '.*'; i += 1; }
    } else if (ch === '*') {
      out += SEGMENT;
    } else if (ch === '?') {
      out += '[^/]';
    } else {
      out += ch.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    }
  }
  return new RegExp(`^${out}$`);
}

export function matchGlob(pattern, path) {
  return globToRegExp(pattern).test(path);
}

export function globSpecificity(pattern) {
  return pattern.split('/').filter((seg) => seg !== '' && !seg.includes('*') && !seg.includes('?')).length;
}
```

- [ ] **Step 4: Implement `lib/yaml-lite.mjs`**

```js
export class YamlLiteError extends Error {
  constructor(lineNo, text, why) {
    super(`yaml-lite: line ${lineNo}: ${why} — ${JSON.stringify(text)}`);
    this.lineNo = lineNo;
  }
}

function stripComment(line) {
  let quote = null;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quote) { if (ch === quote) quote = null; continue; }
    if (ch === "'" || ch === '"') { quote = ch; continue; }
    if (ch === '#') return line.slice(0, i);
  }
  return line;
}

function splitTop(body, sep) {
  const parts = [];
  let depth = 0, quote = null, current = '';
  for (const ch of body) {
    if (quote) { current += ch; if (ch === quote) quote = null; continue; }
    if (ch === "'" || ch === '"') { quote = ch; current += ch; continue; }
    if (ch === '[' || ch === '{') depth += 1;
    if (ch === ']' || ch === '}') depth -= 1;
    if (ch === sep && depth === 0) { parts.push(current); current = ''; continue; }
    current += ch;
  }
  if (current.trim() !== '') parts.push(current);
  return parts;
}

function scalar(raw, lineNo, text) {
  const t = raw.trim();
  if (t === '') return '';
  if ((t.startsWith("'") && t.endsWith("'")) || (t.startsWith('"') && t.endsWith('"'))) return t.slice(1, -1);
  if (t === 'true') return true;
  if (t === 'false') return false;
  if (t === 'null') return null;
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  if (t.startsWith('[') && t.endsWith(']')) {
    return splitTop(t.slice(1, -1), ',').map((item) => scalar(item, lineNo, text));
  }
  if (t.startsWith('{') && t.endsWith('}')) {
    const map = {};
    for (const entry of splitTop(t.slice(1, -1), ',')) {
      const at = entry.indexOf(':');
      if (at === -1) throw new YamlLiteError(lineNo, text, 'inline map entry without a colon');
      map[entry.slice(0, at).trim()] = scalar(entry.slice(at + 1), lineNo, text);
    }
    return map;
  }
  if (t === '|' || t === '>') throw new YamlLiteError(lineNo, text, 'block scalars are not supported');
  if (t.includes(': ')) throw new YamlLiteError(lineNo, text, 'unsupported nested syntax');
  return t;
}

export function parseYamlLite(text) {
  const out = {};
  const lines = text.split(/\r?\n/);
  let key = null;
  for (let i = 0; i < lines.length; i += 1) {
    const raw = stripComment(lines[i]);
    if (raw.trim() === '') continue;
    const indent = raw.length - raw.trimStart().length;
    const body = raw.trim();

    if (indent === 0) {
      const at = body.indexOf(':');
      if (at === -1) throw new YamlLiteError(i + 1, body, 'top-level line without a colon');
      key = body.slice(0, at).trim();
      const rest = body.slice(at + 1).trim();
      out[key] = rest === '' ? undefined : scalar(rest, i + 1, body);
      continue;
    }
    if (indent !== 2) throw new YamlLiteError(i + 1, body, 'only two-space indentation is supported');
    if (key === null) throw new YamlLiteError(i + 1, body, 'indented line without a parent key');

    if (body.startsWith('- ')) {
      if (out[key] === undefined) out[key] = [];
      if (!Array.isArray(out[key])) throw new YamlLiteError(i + 1, body, 'list item under a non-list key');
      out[key].push(scalar(body.slice(2), i + 1, body));
      continue;
    }
    const at = body.indexOf(':');
    if (at === -1) throw new YamlLiteError(i + 1, body, 'nested line without a colon');
    if (out[key] === undefined) out[key] = {};
    if (typeof out[key] !== 'object' || Array.isArray(out[key])) {
      throw new YamlLiteError(i + 1, body, 'map entry under a non-map key');
    }
    out[key][body.slice(0, at).trim()] = scalar(body.slice(at + 1), i + 1, body);
  }
  for (const [k, v] of Object.entries(out)) {
    if (v === undefined) throw new YamlLiteError(0, k, 'key has no value and no indented block');
  }
  return out;
}
```

- [ ] **Step 5: Run both tests and confirm they pass**

Run: `cd <skill> && node --test test/yaml-lite.test.mjs test/glob.test.mjs`
Expected: PASS, 6 tests.

- [ ] **Step 6: Checkpoint**

---

### Task 3: Configuration parsing, merging and validation

**Files:**
- Create: `<skill>/lib/config.mjs`
- Test: `<skill>/test/config.test.mjs`

**Interfaces:**
- Consumes: `parseYamlLite` (Task 2).
- Produces:
  - `parseConfigDoc(text) -> { settings: object, axes: Axis[], ignoredSections: string[] }` where `Axis` is `{ id, when: 'always'|string[], rank: 'always'|'rotate', group: string|null, severity_default: 'blocking'|'suggestion'|'nitpick', max_files: number|null, tools: string[], heading: string, checklist: string }`.
  - `mergeConfig(globalDoc, repoDoc) -> { settings, axes }` — repo settings override global key by key; a repo axis replaces a global axis with the same `id`; ids listed in `settings.disable` are dropped.
  - `validateConfig(config) -> string[]` returning human-readable problems, empty when valid.
  - `DEFAULT_SETTINGS` — `{ budget: { slots: 5, max_files_per_axis: 40 }, confidence_threshold: { blocking: 85, suggestion: 70, nitpick: 70 }, gate: 'blocking', gate_on_disputed: true, codex: { enabled: true, timeout_s: 300 }, commands: {}, exclude: [], disable: [] }`.

- [ ] **Step 1: Write the failing test**

`<skill>/test/config.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseConfigDoc, mergeConfig, validateConfig, DEFAULT_SETTINGS } from '../lib/config.mjs';

const DOC = `---
budget: { slots: 3, max_files_per_axis: 10 }
gate: blocking
---

# Review configuration — demo

Prose that belongs to no axis.

## Security & tenant isolation

\`\`\`yaml
id: security-tenant
when: ['apps/api/**']
rank: always
severity_default: blocking
\`\`\`

- Every endpoint is guarded by JwtAuthGuard.

## Git history context

\`\`\`yaml
id: git-history
when: always
rank: rotate
tools: [git-log]
\`\`\`

- Read git blame for the touched lines.
`;

test('parses frontmatter, axes and their checklists', () => {
  const doc = parseConfigDoc(DOC);
  assert.equal(doc.settings.budget.slots, 3);
  assert.equal(doc.axes.length, 2);
  assert.equal(doc.axes[0].id, 'security-tenant');
  assert.deepEqual(doc.axes[0].when, ['apps/api/**']);
  assert.match(doc.axes[0].checklist, /JwtAuthGuard/);
  assert.equal(doc.axes[1].when, 'always');
  assert.deepEqual(doc.axes[1].tools, ['git-log']);
});

test('a heading without a yaml block is not an axis', () => {
  const doc = parseConfigDoc(DOC);
  assert.deepEqual(doc.ignoredSections, []);
  assert.equal(doc.axes.some((a) => a.heading.startsWith('Review configuration')), false);
});

test('repo axes override global axes by id and disable removes them', () => {
  const globalDoc = parseConfigDoc(`---\ngate: none\n---\n\n## Secrets\n\n\`\`\`yaml\nid: secrets\nwhen: always\nrank: always\n\`\`\`\n\n- No secrets in the repository.\n`);
  const repoDoc = parseConfigDoc(`---\ndisable: [secrets]\n---\n\n## Quality\n\n\`\`\`yaml\nid: code-quality\nwhen: always\nrank: always\n\`\`\`\n\n- Explicit return types.\n`);
  const merged = mergeConfig(globalDoc, repoDoc);
  assert.deepEqual(merged.axes.map((a) => a.id), ['code-quality']);
  assert.equal(merged.settings.gate, 'none');
});

test('defaults fill in every setting the documents omit', () => {
  const merged = mergeConfig(parseConfigDoc('---\n---\n'), parseConfigDoc('---\n---\n'));
  assert.deepEqual(merged.settings.budget, DEFAULT_SETTINGS.budget);
  assert.equal(merged.settings.gate_on_disputed, true);
});

test('validateConfig reports a bad rank and a duplicate id', () => {
  const doc = parseConfigDoc(`---\n---\n\n## A\n\n\`\`\`yaml\nid: a\nwhen: always\nrank: sometimes\n\`\`\`\n\n- x\n\n## B\n\n\`\`\`yaml\nid: a\nwhen: always\nrank: always\n\`\`\`\n\n- y\n`);
  const problems = validateConfig({ settings: DEFAULT_SETTINGS, axes: doc.axes });
  assert.equal(problems.length, 2);
  assert.match(problems.join('\n'), /rank/);
  assert.match(problems.join('\n'), /duplicate/);
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `cd <skill> && node --test test/config.test.mjs`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement `lib/config.mjs`**

```js
import { parseYamlLite } from './yaml-lite.mjs';

export const DEFAULT_SETTINGS = {
  budget: { slots: 5, max_files_per_axis: 40 },
  confidence_threshold: { blocking: 85, suggestion: 70, nitpick: 70 },
  gate: 'blocking',
  gate_on_disputed: true,
  codex: { enabled: true, timeout_s: 300 },
  commands: {},
  exclude: [],
  disable: [],
};

const RANKS = new Set(['always', 'rotate']);
const SEVERITIES = new Set(['blocking', 'suggestion', 'nitpick']);

function splitFrontmatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n?---\r?\n?/.exec(text);
  if (!match) return { front: '', body: text };
  return { front: match[1], body: text.slice(match[0].length) };
}

// A section is an axis only when its first fenced block is yaml; anything else
// is prose that lives in the same document (title, rationale, links).
function sectionToAxis(heading, body) {
  const fence = /```ya?ml\r?\n([\s\S]*?)```/.exec(body);
  if (!fence) return null;
  const meta = parseYamlLite(fence[1]);
  const checklist = `${body.slice(0, fence.index)}${body.slice(fence.index + fence[0].length)}`.trim();
  return {
    id: meta.id,
    when: meta.when ?? 'always',
    rank: meta.rank ?? 'rotate',
    group: meta.group ?? null,
    severity_default: meta.severity_default ?? 'suggestion',
    max_files: meta.max_files ?? null,
    tools: meta.tools ?? [],
    heading,
    checklist,
  };
}

export function parseConfigDoc(text) {
  const { front, body } = splitFrontmatter(text);
  const settings = front.trim() === '' ? {} : parseYamlLite(front);
  const axes = [];
  const ignoredSections = [];
  const parts = body.split(/^## +/m).slice(1);
  for (const part of parts) {
    const newline = part.indexOf('\n');
    const heading = (newline === -1 ? part : part.slice(0, newline)).trim();
    const rest = newline === -1 ? '' : part.slice(newline + 1);
    const axis = sectionToAxis(heading, rest);
    if (axis === null) continue;
    if (axis.id === undefined) { ignoredSections.push(heading); continue; }
    axes.push(axis);
  }
  return { settings, axes, ignoredSections };
}

export function mergeConfig(globalDoc, repoDoc) {
  const settings = {
    ...DEFAULT_SETTINGS,
    ...globalDoc.settings,
    ...repoDoc.settings,
    budget: { ...DEFAULT_SETTINGS.budget, ...globalDoc.settings.budget, ...repoDoc.settings.budget },
    confidence_threshold: {
      ...DEFAULT_SETTINGS.confidence_threshold,
      ...globalDoc.settings.confidence_threshold,
      ...repoDoc.settings.confidence_threshold,
    },
    codex: { ...DEFAULT_SETTINGS.codex, ...globalDoc.settings.codex, ...repoDoc.settings.codex },
  };
  const disabled = new Set(settings.disable ?? []);
  const byId = new Map();
  for (const axis of globalDoc.axes) byId.set(axis.id, axis);
  for (const axis of repoDoc.axes) byId.set(axis.id, axis);
  const axes = [...byId.values()].filter((axis) => !disabled.has(axis.id));
  return { settings, axes };
}

export function validateConfig({ settings, axes }) {
  const problems = [];
  const seen = new Set();
  for (const axis of axes) {
    if (!axis.id) problems.push(`axis "${axis.heading}" has no id`);
    if (seen.has(axis.id)) problems.push(`duplicate axis id "${axis.id}"`);
    seen.add(axis.id);
    if (!RANKS.has(axis.rank)) problems.push(`axis "${axis.id}" has rank "${axis.rank}", expected always or rotate`);
    if (!SEVERITIES.has(axis.severity_default)) {
      problems.push(`axis "${axis.id}" has severity_default "${axis.severity_default}"`);
    }
    if (axis.when !== 'always' && !Array.isArray(axis.when)) {
      problems.push(`axis "${axis.id}" has a when that is neither "always" nor a list of globs`);
    }
    if (axis.checklist.trim() === '') problems.push(`axis "${axis.id}" has an empty checklist`);
  }
  if (!['blocking', 'any', 'none'].includes(settings.gate)) {
    problems.push(`gate is "${settings.gate}", expected blocking, any or none`);
  }
  if (!Number.isInteger(settings.budget.slots) || settings.budget.slots < 1) {
    problems.push('budget.slots must be a positive integer');
  }
  return problems;
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `cd <skill> && node --test test/config.test.mjs`
Expected: PASS, 5 tests.

- [ ] **Step 5: Checkpoint**

---

### Task 4: Target collection from git

**Files:**
- Create: `<skill>/lib/target.mjs`
- Create: `<skill>/test/helpers/repo.mjs`
- Test: `<skill>/test/target.test.mjs`

**Interfaces:**
- Consumes: `matchGlob` (Task 2), `readState` (Task 1).
- Produces: `collectTarget(repoDir, mode, opts) -> { mode, base, head, files: TargetFile[] }` where `TargetFile` is `{ path, added, removed }`; `opts` is `{ base?, pr?, path?, exclude? }`. Modes: `working`, `branch`, `pr`, `since`, `full`. Also `isEmpty(target) -> boolean`.
- Test helper: `makeRepo({ files, commit }) -> repoDir` and `commitAll(repoDir, message) -> sha`.

- [ ] **Step 1: Write the test helper**

`<skill>/test/helpers/repo.mjs`:

```js
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';

const git = (dir, ...args) => execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8' }).trim();

export function makeRepo(files = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'crm-repo-'));
  git(dir, 'init', '-q', '-b', 'main');
  git(dir, 'config', 'user.email', 'test@example.com');
  git(dir, 'config', 'user.name', 'Test');
  writeFiles(dir, files);
  git(dir, 'add', '-A');
  git(dir, 'commit', '-qm', 'initial');
  return dir;
}

export function writeFiles(dir, files) {
  for (const [path, content] of Object.entries(files)) {
    const full = join(dir, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content, 'utf8');
  }
}

export function commitAll(dir, message) {
  git(dir, 'add', '-A');
  git(dir, 'commit', '-qm', message);
  return git(dir, 'rev-parse', 'HEAD');
}

export { git };
```

- [ ] **Step 2: Write the failing test**

`<skill>/test/target.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRepo, writeFiles, commitAll } from './helpers/repo.mjs';
import { collectTarget, isEmpty } from '../lib/target.mjs';

test('working mode reports uncommitted changes with churn', () => {
  const dir = makeRepo({ 'a.ts': 'one\n' });
  writeFiles(dir, { 'a.ts': 'one\ntwo\n', 'b.ts': 'new\n' });
  const target = collectTarget(dir, 'working', {});
  const paths = target.files.map((f) => f.path).sort();
  assert.deepEqual(paths, ['a.ts', 'b.ts']);
  assert.equal(target.files.find((f) => f.path === 'a.ts').added, 1);
});

test('since mode diffs from the stored sha', () => {
  const dir = makeRepo({ 'a.ts': 'one\n' });
  const base = commitAll(dir, 'noop');
  writeFiles(dir, { 'c.ts': 'x\n' });
  commitAll(dir, 'add c');
  const target = collectTarget(dir, 'since', { base });
  assert.deepEqual(target.files.map((f) => f.path), ['c.ts']);
});

test('exclude patterns drop files', () => {
  const dir = makeRepo({ 'a.ts': 'one\n' });
  writeFiles(dir, { 'a.ts': 'two\n', 'pnpm-lock.yaml': 'lock\n' });
  const target = collectTarget(dir, 'working', { exclude: ['pnpm-lock.yaml'] });
  assert.deepEqual(target.files.map((f) => f.path), ['a.ts']);
});

test('an unchanged tree yields an empty target', () => {
  const dir = makeRepo({ 'a.ts': 'one\n' });
  assert.equal(isEmpty(collectTarget(dir, 'working', {})), true);
});

test('full mode lists tracked files from the cursor onwards', () => {
  const dir = makeRepo({ 'a.ts': '1\n', 'b.ts': '2\n', 'c.ts': '3\n' });
  const target = collectTarget(dir, 'full', { cursor: 'b.ts' });
  assert.deepEqual(target.files.map((f) => f.path), ['b.ts', 'c.ts']);
});
```

- [ ] **Step 3: Run the test and confirm it fails**

Run: `cd <skill> && node --test test/target.test.mjs`
Expected: FAIL — `lib/target.mjs` missing.

- [ ] **Step 4: Implement `lib/target.mjs`**

```js
import { execFileSync } from 'node:child_process';
import { matchGlob } from './glob.mjs';

function git(repoDir, args) {
  return execFileSync('git', ['-C', repoDir, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

// `git diff --numstat` prints "added<TAB>removed<TAB>path"; binary files print "-".
function parseNumstat(out) {
  return out.split('\n').filter(Boolean).map((line) => {
    const [added, removed, ...rest] = line.split('\t');
    return { path: rest.join('\t'), added: added === '-' ? 0 : Number(added), removed: removed === '-' ? 0 : Number(removed) };
  });
}

function mergeFiles(lists) {
  const byPath = new Map();
  for (const file of lists.flat()) {
    const seen = byPath.get(file.path);
    if (seen) { seen.added += file.added; seen.removed += file.removed; continue; }
    byPath.set(file.path, { ...file });
  }
  return [...byPath.values()];
}

function untrackedFiles(repoDir) {
  return git(repoDir, ['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean)
    .map((path) => ({ path, added: 0, removed: 0 }));
}

export function collectTarget(repoDir, mode, opts = {}) {
  const exclude = opts.exclude ?? [];
  const head = git(repoDir, ['rev-parse', 'HEAD']).trim();
  let base = null;
  let files = [];

  if (mode === 'working') {
    files = mergeFiles([
      parseNumstat(git(repoDir, ['diff', '--numstat'])),
      parseNumstat(git(repoDir, ['diff', '--numstat', '--cached'])),
      untrackedFiles(repoDir),
    ]);
    base = head;
  } else if (mode === 'branch') {
    const against = opts.base ?? 'main';
    base = git(repoDir, ['merge-base', 'HEAD', against]).trim();
    files = parseNumstat(git(repoDir, ['diff', '--numstat', `${base}..HEAD`]));
  } else if (mode === 'since') {
    base = opts.base ?? null;
    if (base === null) throw new Error('since mode needs a base sha; state.json has none — run another mode first');
    files = parseNumstat(git(repoDir, ['diff', '--numstat', `${base}..HEAD`]));
  } else if (mode === 'pr') {
    const raw = execFileSync('gh', ['pr', 'view', String(opts.pr), '--json', 'files,headRefOid'],
      { cwd: repoDir, encoding: 'utf8' });
    const parsed = JSON.parse(raw);
    base = parsed.headRefOid;
    files = parsed.files.map((f) => ({ path: f.path, added: f.additions, removed: f.deletions }));
  } else if (mode === 'full') {
    const listed = git(repoDir, ['ls-files', ...(opts.path ? [opts.path] : [])]).split('\n').filter(Boolean);
    const from = opts.cursor ? listed.findIndex((p) => p >= opts.cursor) : 0;
    files = listed.slice(from === -1 ? listed.length : from).map((path) => ({ path, added: 0, removed: 0 }));
    base = head;
  } else {
    throw new Error(`unknown mode "${mode}"`);
  }

  files = files.filter((file) => !exclude.some((pattern) => matchGlob(pattern, file.path)));
  files.sort((a, b) => a.path.localeCompare(b.path));
  return { mode, base, head, files };
}

export function isEmpty(target) {
  return target.files.length === 0;
}
```

- [ ] **Step 5: Run the test and confirm it passes**

Run: `cd <skill> && node --test test/target.test.mjs`
Expected: PASS, 5 tests. The `pr` path is not covered here — it needs `gh` and a live PR, and is exercised in Task 19.

- [ ] **Step 6: Checkpoint**

---

### Task 5: Axis selection and the agent budget

This is the task the whole design exists to protect. Review it hardest.

**Files:**
- Create: `<skill>/lib/axes.mjs`
- Test: `<skill>/test/axes.test.mjs`

**Interfaces:**
- Consumes: `matchGlob`, `globSpecificity` (Task 2); `Axis` (Task 3); `TargetFile` (Task 4).
- Produces: `selectAxes({ axes, files, settings, state, slotsOverride }) -> Selection` where `Selection` is:

```
{
  selected: [{ axisId, group, files: [{ path, added, removed, truncatedFrom: number|null }] }],
  skippedOnTouch: string[],     // axis ids no changed file wakes
  emptyAfterAssignment: string[],
  deferred: string[],           // woken, but no slot this run
  slots: number,
  agents: number,               // 1 + 2 * selected.length
  nextAxisCursor: string[]
}
```

- [ ] **Step 1: Write the failing test**

`<skill>/test/axes.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectAxes } from '../lib/axes.mjs';
import { DEFAULT_SETTINGS } from '../lib/config.mjs';

const axis = (id, when, rank = 'rotate', extra = {}) => ({
  id, when, rank, group: null, severity_default: 'suggestion',
  max_files: null, tools: [], heading: id, checklist: `- check ${id}`, ...extra,
});

const file = (path, added = 1) => ({ path, added, removed: 0 });

const settings = (over = {}) => ({ ...DEFAULT_SETTINGS, ...over, budget: { ...DEFAULT_SETTINGS.budget, ...over.budget } });
const state = (over = {}) => ({ axis_cursor: [], ...over });

test('an axis no file wakes is skipped and costs nothing', () => {
  const out = selectAxes({
    axes: [axis('api', ['apps/api/**']), axis('web', ['apps/web/**'])],
    files: [file('apps/web/page.tsx')],
    settings: settings(), state: state(),
  });
  assert.deepEqual(out.selected.map((s) => s.axisId), ['web']);
  assert.deepEqual(out.skippedOnTouch, ['api']);
  assert.equal(out.agents, 3);
});

test('the agent count is 1 + 2 per selected axis and never exceeds the slot budget', () => {
  const axes = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((id) => axis(id, 'always'));
  const out = selectAxes({ axes, files: [file('x.ts')], settings: settings(), state: state() });
  assert.equal(out.selected.length, 5);
  assert.equal(out.agents, 11);
  assert.equal(out.deferred.length, 2);
});

test('always-ranked axes claim slots before rotate-ranked ones', () => {
  const axes = [axis('r1', 'always'), axis('a1', 'always', 'always'), axis('r2', 'always')];
  const out = selectAxes({ axes, files: [file('x.ts')], settings: settings({ budget: { slots: 2 } }), state: state() });
  assert.equal(out.selected[0].axisId, 'a1');
  assert.equal(out.selected.length, 2);
});

test('the rotation cursor gives a deferred axis first claim next run', () => {
  const axes = [axis('a', 'always'), axis('b', 'always'), axis('c', 'always')];
  const first = selectAxes({ axes, files: [file('x.ts')], settings: settings({ budget: { slots: 1 } }), state: state() });
  assert.deepEqual(first.selected.map((s) => s.axisId), ['a']);
  const second = selectAxes({
    axes, files: [file('x.ts')], settings: settings({ budget: { slots: 1 } }),
    state: state({ axis_cursor: first.nextAxisCursor }),
  });
  assert.deepEqual(second.selected.map((s) => s.axisId), ['b']);
});

test('axes sharing a group share one slot', () => {
  const axes = [axis('q1', 'always', 'rotate', { group: 'quality' }), axis('q2', 'always', 'rotate', { group: 'quality' })];
  const out = selectAxes({ axes, files: [file('x.ts')], settings: settings({ budget: { slots: 1 } }), state: state() });
  assert.equal(out.selected.length, 1);
  assert.deepEqual(out.selected[0].group, 'quality');
  assert.equal(out.agents, 3);
});

test('files are ranked by churn, then glob specificity, then size, and truncated', () => {
  const axes = [axis('api', ['apps/api/**', '**'])];
  const files = [file('apps/api/a.ts', 1), file('apps/api/b.ts', 90), file('apps/api/c.ts', 40)];
  const out = selectAxes({
    axes, files, settings: settings({ budget: { slots: 5, max_files_per_axis: 2 } }), state: state(),
  });
  assert.deepEqual(out.selected[0].files.map((f) => f.path), ['apps/api/b.ts', 'apps/api/c.ts']);
  assert.equal(out.selected[0].files[0].truncatedFrom, 3);
});

test('an axis whose files all fall outside its globs is dropped, not merely empty', () => {
  const out = selectAxes({
    axes: [axis('api', ['apps/api/**'])], files: [file('apps/web/x.tsx')],
    settings: settings(), state: state(),
  });
  assert.deepEqual(out.selected, []);
  assert.equal(out.agents, 0, 'no axis means no run at all');
});

test('slotsOverride raises the budget only when passed explicitly', () => {
  const axes = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => axis(id, 'always'));
  const out = selectAxes({ axes, files: [file('x.ts')], settings: settings(), state: state(), slotsOverride: 6 });
  assert.equal(out.selected.length, 6);
  assert.equal(out.agents, 13);
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `cd <skill> && node --test test/axes.test.mjs`
Expected: FAIL — `lib/axes.mjs` missing.

- [ ] **Step 3: Implement `lib/axes.mjs`**

```js
import { matchGlob, globSpecificity } from './glob.mjs';

function wakes(axis, files) {
  if (axis.when === 'always') return true;
  return files.some((file) => axis.when.some((pattern) => matchGlob(pattern, file.path)));
}

function specificityFor(axis, path) {
  if (axis.when === 'always') return 0;
  let best = 0;
  for (const pattern of axis.when) {
    if (matchGlob(pattern, path)) best = Math.max(best, globSpecificity(pattern));
  }
  return best;
}

function assign(axis, files, maxFiles) {
  const mine = axis.when === 'always'
    ? [...files]
    : files.filter((file) => axis.when.some((pattern) => matchGlob(pattern, file.path)));
  mine.sort((a, b) => {
    const churn = (b.added + b.removed) - (a.added + a.removed);
    if (churn !== 0) return churn;
    const spec = specificityFor(axis, b.path) - specificityFor(axis, a.path);
    if (spec !== 0) return spec;
    return a.path.localeCompare(b.path);
  });
  const kept = mine.slice(0, maxFiles);
  const truncatedFrom = mine.length > maxFiles ? mine.length : null;
  return kept.map((file, index) => ({ ...file, truncatedFrom: index === 0 ? truncatedFrom : null }));
}

// Order matters and is the whole point: wake, assign, drop empties, only then
// spend slots. An axis that would have received no file must not consume one.
export function selectAxes({ axes, files, settings, state, slotsOverride = null }) {
  const slots = slotsOverride ?? settings.budget.slots;
  const maxFilesDefault = settings.budget.max_files_per_axis;

  const skippedOnTouch = [];
  const emptyAfterAssignment = [];
  const candidates = [];

  for (const axis of axes) {
    if (!wakes(axis, files)) { skippedOnTouch.push(axis.id); continue; }
    const assigned = assign(axis, files, axis.max_files ?? maxFilesDefault);
    if (assigned.length === 0) { emptyAfterAssignment.push(axis.id); continue; }
    candidates.push({ axis, files: assigned });
  }

  // Grouped axes collapse into a single slot entry, keeping every checklist.
  const units = [];
  const byGroup = new Map();
  for (const candidate of candidates) {
    const group = candidate.axis.group;
    if (group === null) { units.push({ group: null, members: [candidate] }); continue; }
    if (!byGroup.has(group)) { const unit = { group, members: [] }; byGroup.set(group, unit); units.push(unit); }
    byGroup.get(group).members.push(candidate);
  }

  const rankOf = (unit) => (unit.members.some((m) => m.axis.rank === 'always') ? 0 : 1);
  const cursor = state.axis_cursor ?? [];
  const cursorIndex = (unit) => {
    const at = cursor.indexOf(unit.members[0].axis.id);
    return at === -1 ? Number.MAX_SAFE_INTEGER : at;
  };
  const ordered = [...units].sort((a, b) => {
    if (rankOf(a) !== rankOf(b)) return rankOf(a) - rankOf(b);
    if (cursorIndex(a) !== cursorIndex(b)) return cursorIndex(a) - cursorIndex(b);
    return units.indexOf(a) - units.indexOf(b);
  });

  const taken = ordered.slice(0, slots);
  const left = ordered.slice(slots);

  const selected = taken.map((unit) => ({
    axisId: unit.members.map((m) => m.axis.id).join('+'),
    group: unit.group,
    axes: unit.members.map((m) => m.axis),
    files: unit.members[0].files,
  }));

  return {
    selected,
    skippedOnTouch,
    emptyAfterAssignment,
    deferred: left.flatMap((unit) => unit.members.map((m) => m.axis.id)),
    slots,
    agents: selected.length === 0 ? 0 : 1 + 2 * selected.length,
    nextAxisCursor: [...left.flatMap((u) => u.members.map((m) => m.axis.id)),
                     ...taken.flatMap((u) => u.members.map((m) => m.axis.id))],
  };
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `cd <skill> && node --test test/axes.test.mjs`
Expected: PASS, 8 tests.

- [ ] **Step 5: Add a property-style guard for the invariant**

Append to `test/axes.test.mjs`:

```js
test('no configuration of axes and files can exceed the budget', () => {
  for (let count = 1; count <= 40; count += 1) {
    const axes = Array.from({ length: count }, (_, i) => axis(`ax${i}`, 'always'));
    const files = Array.from({ length: count }, (_, i) => file(`f${i}.ts`, i));
    for (const slots of [1, 3, 5, 8]) {
      const out = selectAxes({ axes, files, settings: settings({ budget: { slots } }), state: state() });
      assert.ok(out.selected.length <= slots, `selected ${out.selected.length} with ${slots} slots`);
      assert.equal(out.agents, out.selected.length === 0 ? 0 : 1 + 2 * out.selected.length);
    }
  }
});
```

- [ ] **Step 6: Run it and confirm it passes**

Run: `cd <skill> && node --test test/axes.test.mjs`
Expected: PASS, 9 tests.

- [ ] **Step 7: Checkpoint**

State in the report the maximum `agents` observed across the guard test.

---

### Task 6: Triage fingerprints and suppression

**Files:**
- Create: `<skill>/lib/triage.mjs`
- Test: `<skill>/test/triage.test.mjs`

**Interfaces:**
- Consumes: `TriageEntry` (Task 1).
- Produces: `normalizeClaim(claim) -> string`; `fingerprint({ axis, file, claim }, scope) -> string`; `isSuppressed(finding, triage, today) -> TriageEntry|null`; `recordTriage(state, finding, { verdict, scope, reason, until }) -> State`.

- [ ] **Step 1: Write the failing test**

`<skill>/test/triage.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeClaim, fingerprint, isSuppressed, recordTriage } from '../lib/triage.mjs';
import { emptyState } from '../lib/state.mjs';

test('two phrasings of the same defect normalise identically', () => {
  const a = normalizeClaim('Query filters by courseId without tenantId');
  const b = normalizeClaim('query filters courseId, no tenantId');
  assert.equal(a, b);
  assert.equal(a, 'query-filters-courseid-tenantid');
});

test('normalisation keeps at most twelve tokens', () => {
  const long = normalizeClaim(Array.from({ length: 30 }, (_, i) => `word${i}`).join(' '));
  assert.equal(long.split('-').length, 12);
});

test('scope here pins the file, scope everywhere does not', () => {
  const finding = { axis: 'security', file: 'a.ts', claim: 'no tenant filter' };
  assert.match(fingerprint(finding, 'here'), /^security\|a\.ts\|/);
  assert.match(fingerprint(finding, 'everywhere'), /^security\|\*\|/);
});

test('a rejection suppresses a matching finding in the same file only', () => {
  const finding = { axis: 'security', file: 'a.ts', claim: 'no tenant filter' };
  const state = recordTriage(emptyState(), finding, { verdict: 'rejected', scope: 'here', reason: 'public by design' });
  assert.ok(isSuppressed(finding, state.triage, '2026-09-04'));
  assert.equal(isSuppressed({ ...finding, file: 'b.ts' }, state.triage, '2026-09-04'), null);
});

test('a deferred finding returns after its date', () => {
  const finding = { axis: 'perf', file: 'a.ts', claim: 'n plus one query' };
  const state = recordTriage(emptyState(), finding, { verdict: 'deferred', scope: 'here', reason: 'after CP-90', until: '2026-10-01' });
  assert.ok(isSuppressed(finding, state.triage, '2026-09-04'));
  assert.equal(isSuppressed(finding, state.triage, '2026-10-02'), null);
});

test('an accepted verdict does not suppress anything', () => {
  const finding = { axis: 'perf', file: 'a.ts', claim: 'n plus one query' };
  const state = recordTriage(emptyState(), finding, { verdict: 'accepted', scope: 'here', reason: 'will fix' });
  assert.equal(isSuppressed(finding, state.triage, '2026-09-04'), null);
});

test('a rejection without a reason is refused', () => {
  const finding = { axis: 'perf', file: 'a.ts', claim: 'x' };
  assert.throws(() => recordTriage(emptyState(), finding, { verdict: 'rejected', scope: 'here', reason: '' }), /reason/);
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `cd <skill> && node --test test/triage.test.mjs`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement `lib/triage.mjs`**

```js
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'from', 'has', 'in', 'is', 'it',
  'its', 'no', 'not', 'of', 'on', 'or', 'that', 'the', 'this', 'to', 'was', 'with', 'without',
]);

export function normalizeClaim(claim) {
  return String(claim)
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .split(/\s+/)
    .filter((token) => token !== '' && !STOP_WORDS.has(token))
    .slice(0, 12)
    .join('-');
}

export function fingerprint(finding, scope) {
  const file = scope === 'everywhere' ? '*' : finding.file;
  return `${finding.axis}|${file}|${normalizeClaim(finding.claim)}`;
}

export function isSuppressed(finding, triage, today) {
  for (const entry of triage) {
    if (entry.verdict === 'accepted') continue;
    const scope = entry.fingerprint.split('|')[1] === '*' ? 'everywhere' : 'here';
    if (fingerprint(finding, scope) !== entry.fingerprint) continue;
    if (entry.verdict === 'deferred' && entry.until !== null && entry.until < today) continue;
    return entry;
  }
  return null;
}

export function recordTriage(state, finding, { verdict, scope, reason, until = null }) {
  if (verdict !== 'accepted' && String(reason).trim() === '') {
    throw new Error('a rejected or deferred finding needs a reason — silence in a later report is unreadable without one');
  }
  const entry = {
    fingerprint: fingerprint(finding, scope),
    verdict, scope, reason,
    at: new Date().toISOString().slice(0, 10),
    until,
  };
  const triage = state.triage.filter((existing) => existing.fingerprint !== entry.fingerprint);
  triage.push(entry);
  return { ...state, triage };
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `cd <skill> && node --test test/triage.test.mjs`
Expected: PASS, 7 tests.

- [ ] **Step 5: Checkpoint**

---

### Task 7: Finding validation, dedupe and thresholds

**Files:**
- Create: `<skill>/lib/findings.mjs`
- Test: `<skill>/test/findings.test.mjs`

**Interfaces:**
- Consumes: `normalizeClaim`, `isSuppressed` (Task 6).
- Produces:
  - `validateFinding(finding, sourceOf) -> { ok: true, finding } | { ok: false, why: string }` — `sourceOf(path)` returns the file's text; a finding is rejected when `evidence` is missing, empty, or not present verbatim in the file (whitespace-normalised comparison).
  - `dedupe(findings) -> findings` — same axis, file and normalised claim collapse; the highest severity and the union of line ranges win.
  - `applyThresholds(findings, thresholds) -> { kept, dropped }`.
  - `assemble({ run, findings, triage, today }) -> { findings, suppressed }`.

- [ ] **Step 1: Write the failing test**

`<skill>/test/findings.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateFinding, dedupe, applyThresholds, assemble } from '../lib/findings.mjs';
import { recordTriage } from '../lib/triage.mjs';
import { emptyState } from '../lib/state.mjs';

const SOURCE = { 'a.ts': 'const x = 1;\nconst course = await prisma.course.findFirst({ where: { id } });\n' };
const sourceOf = (path) => SOURCE[path];

const base = {
  axis: 'security', file: 'a.ts', lines: [2, 2], severity: 'blocking',
  claim: 'query without tenant filter',
  evidence: 'const course = await prisma.course.findFirst({ where: { id } });',
};

test('a finding whose evidence appears verbatim is accepted', () => {
  assert.equal(validateFinding(base, sourceOf).ok, true);
});

test('a finding with invented evidence is rejected', () => {
  const out = validateFinding({ ...base, evidence: 'const course = await prisma.course.findMany();' }, sourceOf);
  assert.equal(out.ok, false);
  assert.match(out.why, /not found/);
});

test('a finding with no evidence is rejected', () => {
  assert.equal(validateFinding({ ...base, evidence: '' }, sourceOf).ok, false);
});

test('evidence differing only in whitespace still matches', () => {
  const spaced = { ...base, evidence: 'const  course = await prisma.course.findFirst({ where: { id } });' };
  assert.equal(validateFinding(spaced, sourceOf).ok, true);
});

test('duplicates collapse and keep the highest severity', () => {
  const out = dedupe([
    { ...base, severity: 'suggestion', lines: [2, 2] },
    { ...base, severity: 'blocking', lines: [2, 4], claim: 'query, without the tenant filter' },
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0].severity, 'blocking');
  assert.deepEqual(out[0].lines, [2, 4]);
});

test('thresholds are per severity', () => {
  const { kept, dropped } = applyThresholds(
    [{ ...base, confidence: 80 }, { ...base, severity: 'suggestion', confidence: 75 }],
    { blocking: 85, suggestion: 70, nitpick: 70 },
  );
  assert.equal(kept.length, 1);
  assert.equal(kept[0].severity, 'suggestion');
  assert.equal(dropped.length, 1);
});

test('assemble drops suppressed findings and reports them separately', () => {
  const state = recordTriage(emptyState(), base, { verdict: 'rejected', scope: 'here', reason: 'public by design' });
  const out = assemble({ run: { id: 'r1' }, findings: [{ ...base, confidence: 95 }], triage: state.triage, today: '2026-09-04' });
  assert.equal(out.findings.length, 0);
  assert.equal(out.suppressed.length, 1);
  assert.match(out.suppressed[0].reason, /public by design/);
});

test('ids are stable and sequential', () => {
  const out = assemble({
    run: { id: 'r1' },
    findings: [{ ...base, confidence: 95 }, { ...base, file: 'b.ts', confidence: 95 }],
    triage: [], today: '2026-09-04',
  });
  assert.deepEqual(out.findings.map((f) => f.id), ['f-01', 'f-02']);
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `cd <skill> && node --test test/findings.test.mjs`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement `lib/findings.mjs`**

```js
import { normalizeClaim, isSuppressed } from './triage.mjs';

const SEVERITY_ORDER = { blocking: 3, suggestion: 2, nitpick: 1 };
const squash = (text) => String(text).replace(/\s+/g, ' ').trim();

export function validateFinding(finding, sourceOf) {
  if (!finding.evidence || squash(finding.evidence) === '') {
    return { ok: false, why: 'evidence is missing — a claim without a quote is not reviewable' };
  }
  let source;
  try {
    source = sourceOf(finding.file);
  } catch {
    return { ok: false, why: `file ${finding.file} could not be read` };
  }
  if (source === undefined) return { ok: false, why: `file ${finding.file} is not part of this run` };
  if (!squash(source).includes(squash(finding.evidence))) {
    return { ok: false, why: `evidence not found verbatim in ${finding.file}` };
  }
  return { ok: true, finding };
}

export function dedupe(findings) {
  const byKey = new Map();
  for (const finding of findings) {
    const key = `${finding.axis}|${finding.file}|${normalizeClaim(finding.claim)}`;
    const seen = byKey.get(key);
    if (!seen) { byKey.set(key, { ...finding }); continue; }
    if (SEVERITY_ORDER[finding.severity] > SEVERITY_ORDER[seen.severity]) seen.severity = finding.severity;
    seen.lines = [Math.min(seen.lines[0], finding.lines[0]), Math.max(seen.lines[1], finding.lines[1])];
    seen.confidence = Math.max(seen.confidence ?? 0, finding.confidence ?? 0);
  }
  return [...byKey.values()];
}

export function applyThresholds(findings, thresholds) {
  const kept = [];
  const dropped = [];
  for (const finding of findings) {
    const floor = thresholds[finding.severity] ?? 100;
    ((finding.confidence ?? 0) >= floor ? kept : dropped).push(finding);
  }
  return { kept, dropped };
}

export function assemble({ run, findings, triage, today }) {
  const suppressed = [];
  const surviving = [];
  for (const finding of dedupe(findings)) {
    const hit = isSuppressed(finding, triage, today);
    if (hit) { suppressed.push({ ...finding, reason: hit.reason, verdict: hit.verdict }); continue; }
    surviving.push(finding);
  }
  surviving.sort((a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity]
    || a.file.localeCompare(b.file) || a.lines[0] - b.lines[0]);
  return {
    run,
    findings: surviving.map((finding, index) => ({
      id: `f-${String(index + 1).padStart(2, '0')}`,
      codex: null, triage: null, ...finding,
    })),
    suppressed,
  };
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `cd <skill> && node --test test/findings.test.mjs`
Expected: PASS, 8 tests.

- [ ] **Step 5: Checkpoint**

---

### Task 8: Code links and the Polish report

**Files:**
- Create: `<skill>/lib/links.mjs`
- Create: `<skill>/lib/report.mjs`
- Test: `<skill>/test/links.test.mjs`, `<skill>/test/report.test.mjs`

**Interfaces:**
- Consumes: assembled findings (Task 7), selection (Task 5).
- Produces: `remoteToHttps(remote) -> string|null`; `blobLink(remote, sha, file, lines) -> string|null`; `renderReport({ run, selection, findings, suppressed, prose, codexStatus, remote }) -> string`. `prose` is `Record<findingId, { title: string, body: string }>` supplied by the main model; a finding with no prose entry falls back to its English `claim`, marked `[bez opisu]`.

- [ ] **Step 1: Write the failing tests**

`<skill>/test/links.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { remoteToHttps, blobLink } from '../lib/links.mjs';

test('ssh and https remotes both resolve', () => {
  assert.equal(remoteToHttps('git@github.com:RafalKielbasa/app.git'), 'https://github.com/RafalKielbasa/app');
  assert.equal(remoteToHttps('https://github.com/RafalKielbasa/app.git'), 'https://github.com/RafalKielbasa/app');
});

test('a non-github remote yields no link', () => {
  assert.equal(remoteToHttps('git@gitlab.com:x/y.git'), null);
  assert.equal(blobLink('git@gitlab.com:x/y.git', 'abc', 'a.ts', [1, 2]), null);
});

test('blob links carry the sha and the line range', () => {
  assert.equal(
    blobLink('git@github.com:RafalKielbasa/app.git', 'a1f2e30', 'apps/api/a.ts', [88, 94]),
    'https://github.com/RafalKielbasa/app/blob/a1f2e30/apps/api/a.ts#L88-L94',
  );
});
```

`<skill>/test/report.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderReport } from '../lib/report.mjs';

const selection = {
  selected: [{ axisId: 'security', group: null, axes: [{ id: 'security', heading: 'Security' }], files: [] }],
  skippedOnTouch: ['migrations'], deferred: ['conventions'], agents: 3, slots: 5,
};

const findings = [{
  id: 'f-01', axis: 'security', severity: 'blocking', confidence: 92,
  file: 'apps/api/a.ts', lines: [88, 94], evidence: 'findFirst({ where: { id } })',
  claim: 'query without tenant filter', rule: 'config.md#security',
  codex: { verdict: 'confirms', reason: 'no tenantId in where', fix: 'Add tenantId.' },
}];

test('the header states coverage and spend', () => {
  const md = renderReport({
    run: { id: 'r1', mode: 'since', base: '6c0b497', head: 'a1f2e30' },
    selection, findings, suppressed: [], prose: {}, codexStatus: 'ok', remote: null,
  });
  assert.match(md, /Osie w tym przebiegu: security \(1 z 3\)/);
  assert.match(md, /Pominięte przez on-touch: migrations/);
  assert.match(md, /Czeka w rotacji: conventions/);
  assert.match(md, /Zużycie: 3 agentów \(1 brief \+ 1 osi \+ 1 weryfikacji\)/);
});

test('a finding shows severity, location, quote and the codex verdict', () => {
  const md = renderReport({
    run: { id: 'r1', mode: 'since', base: 'x', head: 'y' },
    selection, findings, suppressed: [],
    prose: { 'f-01': { title: 'Zapytanie o kurs bez filtra tenanta', body: 'CoursesService.findOne woła findFirst z samym id.' } },
    codexStatus: 'ok', remote: 'git@github.com:R/app.git',
  });
  assert.match(md, /Zapytanie o kurs bez filtra tenanta/);
  assert.match(md, /apps\/api\/a\.ts:88/);
  assert.match(md, /findFirst\(\{ where: \{ id \} \}\)/);
  assert.match(md, /codex: potwierdza/);
  assert.match(md, /https:\/\/github\.com\/R\/app\/blob\/y\/apps\/api\/a\.ts#L88-L94/);
});

test('a finding with no prose is marked rather than dropped', () => {
  const md = renderReport({
    run: { id: 'r1', mode: 'since', base: 'x', head: 'y' },
    selection, findings, suppressed: [], prose: {}, codexStatus: 'ok', remote: null,
  });
  assert.match(md, /\[bez opisu\]/);
});

test('suppressed findings are counted in the footer', () => {
  const md = renderReport({
    run: { id: 'r1', mode: 'since', base: 'x', head: 'y' },
    selection, findings: [], suppressed: [{ id: 'x', reason: 'public by design' }],
    prose: {}, codexStatus: 'unavailable', remote: null,
  });
  assert.match(md, /Pominięto 1 uwagę wcześniej odrzuconą/);
  assert.match(md, /codex niedostępny/);
});
```

- [ ] **Step 2: Run both tests and confirm they fail**

Run: `cd <skill> && node --test test/links.test.mjs test/report.test.mjs`
Expected: FAIL — both modules missing.

- [ ] **Step 3: Implement `lib/links.mjs`**

```js
export function remoteToHttps(remote) {
  if (!remote) return null;
  const ssh = /^git@github\.com:(.+?)(?:\.git)?$/.exec(remote.trim());
  if (ssh) return `https://github.com/${ssh[1]}`;
  const https = /^https:\/\/github\.com\/(.+?)(?:\.git)?$/.exec(remote.trim());
  if (https) return `https://github.com/${https[1]}`;
  return null;
}

export function blobLink(remote, sha, file, lines) {
  const base = remoteToHttps(remote);
  if (base === null) return null;
  const range = lines[0] === lines[1] ? `#L${lines[0]}` : `#L${lines[0]}-L${lines[1]}`;
  return `${base}/blob/${sha}/${file}${range}`;
}
```

- [ ] **Step 4: Implement `lib/report.mjs`**

```js
import { blobLink } from './links.mjs';

const SEVERITY_LABEL = { blocking: 'BLOKUJĄCE', suggestion: 'sugestia', nitpick: 'drobiazg' };
const CODEX_LABEL = { confirms: 'codex: potwierdza', rejects: 'codex: odrzuca (sporne)', unsure: 'codex: bez zdania' };

// Polish plural for counts, so the header does not read like machine output.
function plural(n, one, few, many) {
  if (n === 1) return one;
  const last = n % 10;
  const lastTwo = n % 100;
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return few;
  return many;
}

function header({ run, selection, codexStatus }) {
  const chosen = selection.selected.map((s) => s.axisId);
  const total = chosen.length + selection.skippedOnTouch.length + selection.deferred.length;
  const lines = [
    `# Review — ${run.id} (tryb \`${run.mode}\`)`,
    '',
    `Zakres: \`${run.base ?? '—'}\` → \`${run.head}\`.`,
    `Osie w tym przebiegu: ${chosen.join(', ') || '—'} (${chosen.length} z ${total}).`,
  ];
  if (selection.skippedOnTouch.length > 0) lines.push(`Pominięte przez on-touch: ${selection.skippedOnTouch.join(', ')}.`);
  if (selection.deferred.length > 0) lines.push(`Czeka w rotacji: ${selection.deferred.join(', ')}.`);
  lines.push(`Zużycie: ${selection.agents} ${plural(selection.agents, 'agent', 'agentów', 'agentów')} `
    + `(1 brief + ${chosen.length} ${plural(chosen.length, 'oś', 'osi', 'osi')} `
    + `+ ${chosen.length} ${plural(chosen.length, 'weryfikacja', 'weryfikacji', 'weryfikacji')}).`);
  if (codexStatus !== 'ok') lines.push(`Uwaga: **codex niedostępny** — uwagi nie mają drugiej opinii.`);
  return lines.join('\n');
}

function renderFinding(finding, prose, run, remote) {
  const text = prose[finding.id];
  const title = text ? text.title : `${finding.claim} [bez opisu]`;
  const body = text ? text.body : '';
  const link = blobLink(remote, run.head, finding.file, finding.lines);
  const where = link ? `[\`${finding.file}:${finding.lines[0]}\`](${link})` : `\`${finding.file}:${finding.lines[0]}\``;
  const badges = [`**${SEVERITY_LABEL[finding.severity]}**`, `pewność ${finding.confidence}`];
  if (finding.codex) badges.push(CODEX_LABEL[finding.codex.verdict]);
  return [
    `### ${finding.id} — ${title}`,
    '',
    `${badges.join(' · ')} · ${where} · reguła: \`${finding.rule ?? finding.axis}\``,
    '',
    '```',
    finding.evidence,
    '```',
    '',
    body,
    finding.codex && finding.codex.fix ? `\n_Propozycja codexa:_ ${finding.codex.fix}` : '',
  ].filter((part) => part !== '').join('\n');
}

export function renderReport({ run, selection, findings, suppressed, prose, codexStatus, remote }) {
  const parts = [header({ run, selection, codexStatus }), ''];
  const byAxis = new Map();
  for (const finding of findings) {
    if (!byAxis.has(finding.axis)) byAxis.set(finding.axis, []);
    byAxis.get(finding.axis).push(finding);
  }
  if (findings.length === 0) parts.push('Brak uwag przekraczających próg pewności.', '');
  for (const [axis, group] of byAxis) {
    parts.push(`## Oś: ${axis}`, '');
    for (const finding of group) parts.push(renderFinding(finding, prose, run, remote), '');
  }
  if (suppressed.length > 0) {
    parts.push('---', '',
      `Pominięto ${suppressed.length} ${plural(suppressed.length, 'uwagę wcześniej odrzuconą', 'uwagi wcześniej odrzucone', 'uwag wcześniej odrzuconych')}. `
      + 'Pełna lista: `/code-review-master ask` → `show-suppressed`.', '');
  }
  return `${parts.join('\n').trimEnd()}\n`;
}
```

- [ ] **Step 5: Run both tests and confirm they pass**

Run: `cd <skill> && node --test test/links.test.mjs test/report.test.mjs`
Expected: PASS, 7 tests.

- [ ] **Step 6: Checkpoint**

---

### Task 9: Codex cross-check

**Files:**
- Create: `<skill>/lib/codex.mjs`
- Create: `<skill>/prompts/codex.md`
- Test: `<skill>/test/codex.test.mjs`

**Interfaces:**
- Consumes: assembled findings (Task 7).
- Produces: `buildCodexPrompt(findings, { repoDir }) -> string`; `parseCodexVerdicts(stdout) -> Record<findingId, { verdict, reason, fix }>`; `runCodex(prompt, { cwd, timeoutMs, binary }) -> { status: 'ok'|'unavailable'|'timeout'|'unparsable', verdicts, raw }`.

- [ ] **Step 1: Write the codex prompt template**

`<skill>/prompts/codex.md`:

```markdown
You are a second reviewer. Another reviewer produced the findings below for this
repository. Judge each one independently by reading the code yourself.

For every finding return one verdict:
- "confirms" — a real problem, and you saw it in the code
- "rejects"  — a false positive, pre-existing, or plainly intended
- "unsure"   — you cannot judge it without context you do not have

Reply with a single JSON object and nothing else:

{"verdicts": [{"id": "f-01", "verdict": "confirms", "reason": "one line", "fix": "one sentence, or null"}]}

Findings:

{{FINDINGS}}
```

- [ ] **Step 2: Write the failing test**

`<skill>/test/codex.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCodexPrompt, parseCodexVerdicts, runCodex } from '../lib/codex.mjs';

const findings = [{
  id: 'f-01', axis: 'security', file: 'a.ts', lines: [88, 94], severity: 'blocking',
  claim: 'query without tenant filter', evidence: 'findFirst({ where: { id } })', rule: 'config.md#security',
}];

test('the prompt carries id, location, quote and rule for every finding', () => {
  const prompt = buildCodexPrompt(findings, { repoDir: '/repo' });
  assert.match(prompt, /f-01/);
  assert.match(prompt, /a\.ts:88-94/);
  assert.match(prompt, /findFirst\(\{ where: \{ id \} \}\)/);
  assert.match(prompt, /config\.md#security/);
});

test('verdicts are parsed out of surrounding chatter', () => {
  const out = parseCodexVerdicts('thinking...\n{"verdicts":[{"id":"f-01","verdict":"confirms","reason":"r","fix":null}]}\ndone');
  assert.equal(out['f-01'].verdict, 'confirms');
  assert.equal(out['f-01'].fix, null);
});

test('an unknown verdict value is coerced to unsure', () => {
  const out = parseCodexVerdicts('{"verdicts":[{"id":"f-01","verdict":"maybe","reason":"r"}]}');
  assert.equal(out['f-01'].verdict, 'unsure');
});

test('a missing binary reports unavailable rather than throwing', () => {
  const out = runCodex('anything', { cwd: process.cwd(), timeoutMs: 1000, binary: 'codex-does-not-exist' });
  assert.equal(out.status, 'unavailable');
  assert.deepEqual(out.verdicts, {});
});
```

- [ ] **Step 3: Run the test and confirm it fails**

Run: `cd <skill> && node --test test/codex.test.mjs`
Expected: FAIL — module missing.

- [ ] **Step 4: Implement `lib/codex.mjs`**

```js
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const VERDICTS = new Set(['confirms', 'rejects', 'unsure']);

export function buildCodexPrompt(findings, { repoDir }) {
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
  return template.replace('{{FINDINGS}}', rendered).replace('{{REPO}}', repoDir);
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

export function runCodex(prompt, { cwd, timeoutMs, binary = 'codex' }) {
  const result = spawnSync(binary, ['exec', '--sandbox', 'read-only', prompt],
    { cwd, encoding: 'utf8', timeout: timeoutMs, maxBuffer: 32 * 1024 * 1024 });
  if (result.error && result.error.code === 'ENOENT') return { status: 'unavailable', verdicts: {}, raw: '' };
  if (result.error && result.error.code === 'ETIMEDOUT') return { status: 'timeout', verdicts: {}, raw: result.stdout ?? '' };
  if (result.status !== 0) return { status: 'unavailable', verdicts: {}, raw: result.stderr ?? '' };
  const verdicts = parseCodexVerdicts(result.stdout);
  if (verdicts === null) return { status: 'unparsable', verdicts: {}, raw: result.stdout };
  return { status: 'ok', verdicts, raw: result.stdout };
}
```

- [ ] **Step 5: Run the test and confirm it passes**

Run: `cd <skill> && node --test test/codex.test.mjs`
Expected: PASS, 4 tests.

- [ ] **Step 6: Checkpoint**

---

### Task 10: Gate and the CLI

**Files:**
- Create: `<skill>/lib/gate.mjs`
- Create: `<skill>/bin/crm.mjs`
- Test: `<skill>/test/gate.test.mjs`, `<skill>/test/cli.test.mjs`

**Interfaces:**
- Consumes: every module from Tasks 1–9.
- Produces:
  - `exitCode({ findings, gate, gateOnDisputed }) -> 0|1`.
  - CLI subcommands, each reading and writing JSON on stdout/stdin so `SKILL.md` can pipe them:
    - `crm plan --repo <dir> --mode <mode> [--base <ref>] [--pr <n>] [--path <p>] [--slots <n>]` → `{ runId, target, selection, config, empty }`
    - `crm assemble --repo <dir> --run <id> --raw <file> --scores <file>` → writes `findings.json`, prints its summary
    - `crm codex --repo <dir> --run <id>` → merges verdicts into `findings.json`, prints status
    - `crm render --repo <dir> --run <id> --prose <file>` → writes `raport.md`
    - `crm finish --repo <dir> --run <id>` → updates `state.json`, exits with the gate code
    - `crm triage --repo <dir> --run <id> --id <f-NN> --verdict <v> --scope <s> --reason <text> [--until <date>]`
    - `crm suppressed --repo <dir> [--restore <fingerprint>]`
  - `--json` on every subcommand; without a TTY the CLI never prompts.

- [ ] **Step 1: Write the failing gate test**

`<skill>/test/gate.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { exitCode } from '../lib/gate.mjs';

const finding = (over = {}) => ({ severity: 'blocking', codex: null, ...over });

test('gate none always passes', () => {
  assert.equal(exitCode({ findings: [finding()], gate: 'none', gateOnDisputed: true }), 0);
});

test('gate blocking fails only on blocking findings', () => {
  assert.equal(exitCode({ findings: [finding({ severity: 'suggestion' })], gate: 'blocking', gateOnDisputed: true }), 0);
  assert.equal(exitCode({ findings: [finding()], gate: 'blocking', gateOnDisputed: true }), 1);
});

test('gate any fails on any finding', () => {
  assert.equal(exitCode({ findings: [finding({ severity: 'nitpick' })], gate: 'any', gateOnDisputed: true }), 1);
});

test('a codex-disputed blocking finding still fails by default', () => {
  const disputed = finding({ codex: { verdict: 'rejects', reason: 'r', fix: null } });
  assert.equal(exitCode({ findings: [disputed], gate: 'blocking', gateOnDisputed: true }), 1);
  assert.equal(exitCode({ findings: [disputed], gate: 'blocking', gateOnDisputed: false }), 0);
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `cd <skill> && node --test test/gate.test.mjs`
Expected: FAIL — module missing.

- [ ] **Step 3: Implement `lib/gate.mjs`**

```js
export function exitCode({ findings, gate, gateOnDisputed }) {
  if (gate === 'none') return 0;
  const counted = findings.filter((finding) => {
    if (finding.codex && finding.codex.verdict === 'rejects' && !gateOnDisputed) return false;
    return gate === 'any' || finding.severity === 'blocking';
  });
  return counted.length > 0 ? 1 : 0;
}
```

- [ ] **Step 4: Write the failing CLI test**

`<skill>/test/cli.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { makeRepo, writeFiles } from './helpers/repo.mjs';

const CLI = join(dirname(fileURLToPath(import.meta.url)), '..', 'bin', 'crm.mjs');
const run = (args, opts = {}) => execFileSync(process.execPath, [CLI, ...args], { encoding: 'utf8', ...opts });

const CONFIG = `---
budget: { slots: 2, max_files_per_axis: 5 }
---

# demo

## Quality

\`\`\`yaml
id: quality
when: always
rank: always
\`\`\`

- Explicit return types.
`;

test('plan reports an empty target without selecting any axis', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  writeFiles(dir, { '.claude/review/config.md': CONFIG });
  execFileSync('git', ['-C', dir, 'add', '-A']);
  execFileSync('git', ['-C', dir, 'commit', '-qm', 'config']);
  const out = JSON.parse(run(['plan', '--repo', dir, '--mode', 'working', '--json']));
  assert.equal(out.empty, true);
  assert.equal(out.selection.agents, 0);
});

test('plan announces the budget for a real change', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  writeFiles(dir, { '.claude/review/config.md': CONFIG, 'a.ts': 'x\ny\n' });
  const out = JSON.parse(run(['plan', '--repo', dir, '--mode', 'working', '--json']));
  assert.equal(out.empty, false);
  assert.equal(out.selection.selected.length, 1);
  assert.equal(out.selection.agents, 3);
});

test('a missing config.md exits 2 with a readable message', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  writeFiles(dir, { 'a.ts': 'x\ny\n' });
  try {
    run(['plan', '--repo', dir, '--mode', 'working', '--json']);
    assert.fail('should have exited non-zero');
  } catch (err) {
    assert.equal(err.status, 2);
    assert.match(String(err.stderr), /config\.md/);
  }
});

test('finish exits 1 when a blocking finding survives', () => {
  const dir = makeRepo({ 'a.ts': 'const course = findFirst({ where: { id } });\n' });
  writeFiles(dir, { '.claude/review/config.md': CONFIG, 'a.ts': 'const course = findFirst({ where: { id } });\nchanged\n' });
  const plan = JSON.parse(run(['plan', '--repo', dir, '--mode', 'working', '--json']));
  const raw = join(dir, 'raw.json');
  writeFileSync(raw, JSON.stringify([{
    axis: 'quality', file: 'a.ts', lines: [1, 1], severity: 'blocking',
    claim: 'query without tenant filter', evidence: 'const course = findFirst({ where: { id } });',
  }]));
  const scores = join(dir, 'scores.json');
  writeFileSync(scores, JSON.stringify([{ id: 'f-01', confidence: 95 }]));
  run(['assemble', '--repo', dir, '--run', plan.runId, '--raw', raw, '--scores', scores, '--json']);
  try {
    run(['finish', '--repo', dir, '--run', plan.runId, '--json']);
    assert.fail('should have exited 1');
  } catch (err) {
    assert.equal(err.status, 1);
  }
});
```

- [ ] **Step 5: Run it and confirm it fails**

Run: `cd <skill> && node --test test/cli.test.mjs`
Expected: FAIL — `bin/crm.mjs` missing.

- [ ] **Step 6: Implement `bin/crm.mjs`**

```js
#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { parseConfigDoc, mergeConfig, validateConfig } from '../lib/config.mjs';
import { collectTarget, isEmpty } from '../lib/target.mjs';
import { selectAxes } from '../lib/axes.mjs';
import { assemble, validateFinding, applyThresholds } from '../lib/findings.mjs';
import { recordTriage } from '../lib/triage.mjs';
import { renderReport } from '../lib/report.mjs';
import { buildCodexPrompt, runCodex } from '../lib/codex.mjs';
import { exitCode } from '../lib/gate.mjs';
import { readState, writeState } from '../lib/state.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(2);
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) { out._.push(token); continue; }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) { out[key] = true; continue; }
    out[key] = next;
    i += 1;
  }
  return out;
}

const reviewDir = (repo) => join(repo, '.claude', 'review');
const reportPath = (repo, runId, name) => join(reviewDir(repo), 'reports', `${runId}-${name}`);

function loadConfig(repo) {
  const repoPath = join(reviewDir(repo), 'config.md');
  if (!existsSync(repoPath)) fail(`no .claude/review/config.md in ${repo} — run "/code-review-master init" first`);
  const globalPath = join(homedir(), '.claude', 'review', 'global.md');
  const globalDoc = existsSync(globalPath)
    ? parseConfigDoc(readFileSync(globalPath, 'utf8'))
    : { settings: {}, axes: [], ignoredSections: [] };
  const config = mergeConfig(globalDoc, parseConfigDoc(readFileSync(repoPath, 'utf8')));
  const problems = validateConfig(config);
  if (problems.length > 0) fail(`config.md problems:\n- ${problems.join('\n- ')}`);
  return config;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function gitRemote(repo) {
  try {
    return execFileSync('git', ['-C', repo, 'remote', 'get-url', 'origin'], { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

const COMMANDS = {
  plan(args) {
    const repo = args.repo ?? process.cwd();
    const config = loadConfig(repo);
    const state = readState(repo);
    const mode = args.mode ?? 'working';
    const target = collectTarget(repo, mode, {
      base: mode === 'since' ? state.last_reviewed_sha : args.base,
      pr: args.pr, path: args.path, cursor: state.file_cursor[mode],
      exclude: config.settings.exclude,
    });
    const runId = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12).replace(/^(\d{8})(\d{4})$/, '$1-$2');
    if (isEmpty(target)) {
      return { runId, mode, target, empty: true, selection: { selected: [], skippedOnTouch: [], deferred: [], agents: 0 } };
    }
    const selection = selectAxes({
      axes: config.axes, files: target.files, settings: config.settings, state,
      slotsOverride: args.slots ? Number(args.slots) : null,
    });
    return { runId, mode, target, empty: false, selection, settings: config.settings, axes: config.axes };
  },

  assemble(args) {
    const repo = args.repo ?? process.cwd();
    const config = loadConfig(repo);
    const state = readState(repo);
    const raw = readJson(args.raw);
    const scores = args.scores ? readJson(args.scores) : [];
    const scoreById = new Map(scores.map((s) => [s.id ?? s.claim, s.confidence]));

    const sourceOf = (path) => readFileSync(join(repo, path), 'utf8');
    const rejected = [];
    const valid = [];
    for (const finding of raw) {
      const check = validateFinding(finding, sourceOf);
      if (!check.ok) { rejected.push({ finding, why: check.why }); continue; }
      valid.push({ ...finding, confidence: scoreById.get(finding.id ?? finding.claim) ?? finding.confidence ?? 0 });
    }
    const { kept, dropped } = applyThresholds(valid, config.settings.confidence_threshold);
    const out = assemble({
      run: { id: args.run, mode: args.mode ?? null },
      findings: kept, triage: state.triage, today: new Date().toISOString().slice(0, 10),
    });
    out.rejectedForEvidence = rejected.length;
    out.belowThreshold = dropped.length;
    writeJson(reportPath(repo, args.run, 'findings.json'), out);
    return { findings: out.findings.length, suppressed: out.suppressed.length, rejectedForEvidence: rejected.length, belowThreshold: dropped.length };
  },

  codex(args) {
    const repo = args.repo ?? process.cwd();
    const config = loadConfig(repo);
    const path = reportPath(repo, args.run, 'findings.json');
    const data = readJson(path);
    if (!config.settings.codex.enabled || data.findings.length === 0) return { status: 'skipped' };
    const result = runCodex(buildCodexPrompt(data.findings, { repoDir: repo }),
      { cwd: repo, timeoutMs: config.settings.codex.timeout_s * 1000 });
    for (const finding of data.findings) {
      finding.codex = result.verdicts[finding.id] ?? { verdict: 'unsure', reason: result.status, fix: null };
    }
    data.codexStatus = result.status;
    writeJson(path, data);
    return { status: result.status, judged: Object.keys(result.verdicts).length };
  },

  render(args) {
    const repo = args.repo ?? process.cwd();
    const data = readJson(reportPath(repo, args.run, 'findings.json'));
    const plan = readJson(reportPath(repo, args.run, 'plan.json'));
    const markdown = renderReport({
      run: { id: args.run, mode: plan.mode, base: plan.target.base, head: plan.target.head },
      selection: plan.selection, findings: data.findings, suppressed: data.suppressed,
      prose: args.prose ? readJson(args.prose) : {},
      codexStatus: data.codexStatus ?? 'skipped', remote: gitRemote(repo),
    });
    const out = reportPath(repo, args.run, 'raport.md');
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, markdown, 'utf8');
    return { report: out, bytes: markdown.length };
  },

  finish(args) {
    const repo = args.repo ?? process.cwd();
    const config = loadConfig(repo);
    const data = readJson(reportPath(repo, args.run, 'findings.json'));
    const plan = readJson(reportPath(repo, args.run, 'plan.json'));
    const state = readState(repo);
    state.last_reviewed_sha = plan.target.head;
    state.axis_cursor = plan.selection.nextAxisCursor ?? state.axis_cursor;
    state.runs = [...state.runs, { id: args.run, artifact_url: args.artifact ?? null }].slice(-50);
    writeState(repo, state);
    const code = exitCode({
      findings: data.findings, gate: config.settings.gate, gateOnDisputed: config.settings.gate_on_disputed,
    });
    process.stdout.write(`${JSON.stringify({ exit: code, findings: data.findings.length })}\n`);
    process.exit(code);
  },

  triage(args) {
    const repo = args.repo ?? process.cwd();
    const path = reportPath(repo, args.run, 'findings.json');
    const data = readJson(path);
    const finding = data.findings.find((f) => f.id === args.id);
    if (!finding) fail(`no finding ${args.id} in run ${args.run}`);
    const state = recordTriage(readState(repo), finding, {
      verdict: args.verdict, scope: args.scope ?? 'here', reason: args.reason ?? '', until: args.until ?? null,
    });
    writeState(repo, state);
    finding.triage = { verdict: args.verdict, scope: args.scope ?? 'here', reason: args.reason ?? '' };
    writeJson(path, data);
    return { id: args.id, verdict: args.verdict };
  },

  suppressed(args) {
    const repo = args.repo ?? process.cwd();
    const state = readState(repo);
    if (args.restore) {
      state.triage = state.triage.filter((entry) => entry.fingerprint !== args.restore);
      writeState(repo, state);
      return { restored: args.restore, remaining: state.triage.length };
    }
    return { triage: state.triage };
  },
};

const args = parseArgs(process.argv.slice(2));
const name = args._[0];
const command = COMMANDS[name];
if (!command) fail(`unknown command "${name ?? ''}" — expected one of ${Object.keys(COMMANDS).join(', ')}`);
const result = command(args);
if (name === 'plan') {
  const repo = args.repo ?? process.cwd();
  writeJson(reportPath(repo, result.runId, 'plan.json'), result);
}
process.stdout.write(`${JSON.stringify(result, null, args.json ? 0 : 2)}\n`);
```

- [ ] **Step 7: Run the CLI test and confirm it passes**

Run: `cd <skill> && node --test test/cli.test.mjs test/gate.test.mjs`
Expected: PASS, 8 tests.

- [ ] **Step 8: Run the whole suite**

Run: `cd <skill> && node --test test/`
Expected: PASS, all tests from Tasks 1–10.

- [ ] **Step 9: Checkpoint**

---

## Stage 2 — the skill

### Task 11: Global configuration template and the config skeleton

**Files:**
- Create: `<skill>/templates/global.md`
- Create: `<skill>/templates/config.md`
- Test: `<skill>/test/templates.test.mjs`

**Interfaces:**
- Consumes: `parseConfigDoc`, `validateConfig` (Task 3).
- Produces: two template documents. `templates/global.md` is copied to `~/.claude/review/global.md` on first run; `templates/config.md` is the skeleton `init` fills in.

- [ ] **Step 1: Write the failing test**

`<skill>/test/templates.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseConfigDoc, mergeConfig, validateConfig } from '../lib/config.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => readFileSync(join(ROOT, 'templates', name), 'utf8');

test('the shipped global template parses and validates', () => {
  const doc = parseConfigDoc(read('global.md'));
  assert.ok(doc.axes.length >= 2, 'ships at least the universal axes');
  assert.deepEqual(validateConfig(mergeConfig(doc, { settings: {}, axes: [] })), []);
});

test('the global template declares the report language and the false-positive list', () => {
  const text = read('global.md');
  assert.match(text, /Polish/);
  assert.match(text, /pre-existing/);
  assert.match(text, /linter, typechecker/);
});

test('the config skeleton parses and validates once its placeholder axis is kept', () => {
  const doc = parseConfigDoc(read('config.md'));
  assert.deepEqual(validateConfig(mergeConfig({ settings: {}, axes: [] }, doc)), []);
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `cd <skill> && node --test test/templates.test.mjs`
Expected: FAIL — templates missing.

- [ ] **Step 3: Write `templates/global.md`**

````markdown
---
budget: { slots: 5, max_files_per_axis: 40 }
confidence_threshold: { blocking: 85, suggestion: 70, nitpick: 70 }
gate: blocking
gate_on_disputed: true
codex: { enabled: true, timeout_s: 300 }
---

# Global review configuration

Applies to every repository. A repository's `.claude/review/config.md` overrides
any setting here, replaces an axis by declaring the same `id`, and removes one
with `disable: [<id>]`.

## Report language and register

The report is written in **Polish**. Severities are `blocking` (blokujące),
`suggestion` (sugestia) and `nitpick` (drobiazg).

Every sentence names its referent. Not "something gets thrown", but
"`apiRequest` throws `ApiError(401)` at `api-client.ts:124`". Passive voice must
not hide the actor: if something is called, set, or cleared, name the function or
the line that does it. Order and causality are explicit, and "before" and "after"
point at lines. Code references are always `file:line`.

## What is a false positive

Never report:

- a pre-existing issue on lines the change did not touch;
- anything a linter, typechecker, or compiler catches — those run separately;
- a nitpick a senior engineer would not raise;
- a finding deliberately silenced in code with a justified suppression comment;
- a functional change that is plainly intentional and part of the broader change.

## Secrets in the repository

```yaml
id: secrets
when: always
rank: always
severity_default: blocking
```

- No credentials, API keys, tokens, or private keys committed to the repository.
- No committed `.env`; `.env.example` carries placeholder values only.
- A secret that reaches git history is blocking even after it is deleted from the
  working tree.

## Debug leftovers

```yaml
id: debug-leftovers
when: always
rank: rotate
severity_default: nitpick
```

- No `console.log`, `debugger`, or `print` left in production files. Test files
  and deliberate logging through the project's logger are exempt.
- No commented-out blocks of code. Deleted code lives in git history.
````

- [ ] **Step 4: Write `templates/config.md`**

````markdown
---
budget: { slots: 5, max_files_per_axis: 40 }
gate: blocking
gate_on_disputed: true
commands: {}
exclude: ['**/node_modules/**', '**/dist/**', '**/*.snap']
disable: []
---

# Review configuration — {{REPO_NAME}}

{{REPO_SUMMARY}}

This file is the source of truth for how this repository is reviewed. One `##`
section per axis; the fenced `yaml` block is the axis metadata, the prose below
it is the checklist a reviewing agent receives verbatim.

## Code quality

```yaml
id: code-quality
when: always
rank: always
severity_default: suggestion
```

- Names are descriptive and in English.
- No duplicated logic — a shared fragment moves into a helper.
- A comment explains why, not what.
````

- [ ] **Step 5: Run the test and confirm it passes**

Run: `cd <skill> && node --test test/templates.test.mjs`
Expected: PASS, 3 tests.

- [ ] **Step 6: Checkpoint**

---

### Task 12: Agent prompt templates

**Files:**
- Create: `<skill>/prompts/brief.md`, `<skill>/prompts/axis.md`, `<skill>/prompts/verify.md`
- Test: `<skill>/test/prompts.test.mjs`

**Interfaces:**
- Consumes: nothing at runtime; `SKILL.md` (Task 13) substitutes the placeholders.
- Produces: three templates with the placeholders `{{SUMMARY_INPUT}}`, `{{AXIS_ID}}`, `{{CHECKLIST}}`, `{{FILES}}`, `{{FINDINGS}}`.

- [ ] **Step 1: Write the failing test**

`<skill>/test/prompts.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'prompts');
const read = (name) => readFileSync(join(DIR, name), 'utf8');

test('every prompt forbids spawning further agents', () => {
  for (const name of readdirSync(DIR)) {
    if (name === 'codex.md') continue;
    assert.match(read(name), /do not (dispatch|spawn)/i, `${name} must forbid fan-out`);
  }
});

test('the axis prompt demands verbatim evidence and fixes the return shape', () => {
  const text = read('axis.md');
  assert.match(text, /verbatim/i);
  assert.match(text, /"evidence"/);
  assert.match(text, /\{\{CHECKLIST\}\}/);
  assert.match(text, /\{\{FILES\}\}/);
});

test('the verify prompt carries the 0-100 rubric and is batched', () => {
  const text = read('verify.md');
  assert.match(text, /\b0\b[\s\S]*\b100\b/);
  assert.match(text, /all of the findings below/i);
  assert.match(text, /\{\{FINDINGS\}\}/);
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `cd <skill> && node --test test/prompts.test.mjs`
Expected: FAIL — prompts missing.

- [ ] **Step 3: Write `prompts/brief.md`**

```markdown
You are preparing a code review. You do not review anything yourself.

Read the files listed below and return a JSON object:

{"summary": "3-5 sentences on what this change does",
 "risks": [{"file": "path", "why": "one line"}]}

`risks` names files that deserve a closer look than their line count suggests —
a small edit to an authorisation check outranks a large edit to a fixture. List
at most eight. Do not repeat the file list back; it is already known.

Do not dispatch or spawn any further agents. Do not write any file.

Files in this change:

{{SUMMARY_INPUT}}
```

- [ ] **Step 4: Write `prompts/axis.md`**

````markdown
You are reviewing one axis of a code review: **{{AXIS_ID}}**.

Judge the files below against this checklist and nothing else. Another reviewer
covers the other axes; a finding outside your checklist is noise.

## Checklist

{{CHECKLIST}}

## Change summary

{{SUMMARY}}

## Files

{{FILES}}

## What to return

A JSON array. One object per finding:

```json
{"axis": "{{AXIS_ID}}", "file": "path/from/repo/root.ts", "lines": [88, 94],
 "severity": "blocking|suggestion|nitpick",
 "claim": "one sentence, in English",
 "evidence": "the exact line or lines from the file"}
```

`evidence` must be copied **verbatim** from the file. A finding whose evidence
does not appear in the file is discarded before anyone reads it, so never
paraphrase, never reconstruct from memory, and never quote a line you did not
open.

Return `[]` when the files are clean against your checklist. An empty array is a
valid, useful answer; an invented finding is not.

Do not dispatch or spawn any further agents. Do not modify any file.
````

- [ ] **Step 5: Write `prompts/verify.md`**

````markdown
You are verifying, not reviewing. Judge **all of the findings below** in one
pass — do not delegate, and do not look for new problems.

For each finding, open the file, look at the cited lines, and score how confident
you are that it is real:

- **0** — a false positive that does not survive light scrutiny, or a pre-existing
  issue on lines this change did not touch.
- **25** — might be real, might not; you could not verify it.
- **50** — verified as real, but a nitpick or rare in practice.
- **75** — verified, likely to be hit in practice, and the current code is
  insufficient. Or: named explicitly by the axis checklist.
- **100** — certain; the evidence directly confirms it.

A finding you cannot confirm in the file scores **0**, however convincing its
wording.

Return a JSON array: `[{"id": "f-01", "confidence": 92, "note": "one line"}]`.

Do not dispatch or spawn any further agents. Do not modify any file.

## Findings

{{FINDINGS}}
````

- [ ] **Step 6: Run the test and confirm it passes**

Run: `cd <skill> && node --test test/prompts.test.mjs`
Expected: PASS, 3 tests.

- [ ] **Step 7: Checkpoint**

---

### Task 13: SKILL.md — orchestration

**Files:**
- Create: `<skill>/SKILL.md`
- Test: `<skill>/test/skill.test.mjs`

**Interfaces:**
- Consumes: every CLI subcommand (Task 10), every prompt (Task 12).
- Produces: the skill document Claude Code loads. Frontmatter `name: code-review-master` and a `description` naming the triggers.

- [ ] **Step 1: Write the failing test**

`<skill>/test/skill.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const TEXT = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'SKILL.md'), 'utf8');

test('frontmatter names the skill and its triggers', () => {
  assert.match(TEXT, /^---\nname: code-review-master\n/);
  assert.match(TEXT, /description: .*review/i);
});

test('every mode from the spec is documented', () => {
  for (const mode of ['branch', 'pr', 'since', 'full', 'ask', 'fix', 'init']) {
    assert.match(TEXT, new RegExp(`/code-review-master ${mode}`), `mode ${mode} is missing`);
  }
});

test('the budget is announced before dispatch and never raised silently', () => {
  assert.match(TEXT, /crm plan/);
  assert.match(TEXT, /before dispatching/i);
  assert.match(TEXT, /--slots/);
  assert.match(TEXT, /never pass `--slots`/i);
});

test('subagents are dispatched without the Agent tool', () => {
  assert.match(TEXT, /without the `Agent` tool/);
});

test('the skill states that it never commits', () => {
  assert.match(TEXT, /never commit/i);
});

test('unattended runs are barred from fixing', () => {
  assert.match(TEXT, /non-interactive[\s\S]{0,400}never (apply|applies)/i);
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `cd <skill> && node --test test/skill.test.mjs`
Expected: FAIL — `SKILL.md` missing.

- [ ] **Step 3: Write `<skill>/SKILL.md`**

Write the document with these sections, in this order. Content requirements are given per section; write them out in full — no placeholders.

1. **Frontmatter.** `name: code-review-master`; `description:` covering the triggers ("zrób review", "sprawdź kod", "/code-review-master", nightly and CI invocations) and the exclusions ("NOT for reviewing a course student's homework — that is `review-pracy-domowej`; NOT the bundled `/code-review` plugin").
2. **Overview.** Three sentences: what it does, that the budget is computed by `bin/crm.mjs` and not negotiable, and that the report is Polish while everything else is English.
3. **Invocation table.** Every mode from spec §3 with one line each.
4. **Step 1 — plan.** Run `node <skill>/bin/crm.mjs plan --repo <cwd> --mode <mode> [...]`. Exit 2 means stop and show the message. `empty: true` means say so and stop — no agents. Otherwise print the budget line to the user **before dispatching anything**: axes selected, axes skipped, axes deferred, and `selection.agents`.
5. **Step 2 — raise the budget only on request.** `--slots` is passed only when the user typed it. State: in a non-interactive run, never pass `--slots`.
6. **Step 3 — wave 0.** Dispatch one Haiku agent with `prompts/brief.md`, `{{SUMMARY_INPUT}}` filled from `selection`. Dispatch it **without the `Agent` tool**.
7. **Step 4 — wave 1.** Dispatch one Sonnet agent per entry in `selection.selected`, all in a single message so they run concurrently, each with `prompts/axis.md` filled from that entry's `axes[].checklist` and `files`. **Without the `Agent` tool.** Collect the JSON arrays into `raw.json`.
8. **Step 5 — wave 2.** For each selected axis, one Haiku agent with `prompts/verify.md` and that axis's findings, batched. **Without the `Agent` tool.** Collect into `scores.json`. State explicitly: one agent per axis, never one per finding.
9. **Step 6 — assemble.** `crm assemble --raw raw.json --scores scores.json`. Report how many findings were discarded for missing or invented evidence, and how many fell below threshold.
10. **Step 7 — codex.** `crm codex`. If the status is not `ok`, say so and continue.
11. **Step 8 — prose.** For each surviving finding write `{title, body}` in Polish following the register rules in `~/.claude/review/global.md`; two to three sentences naming the function and the line. Write `prose.json`, then `crm render --prose prose.json`.
12. **Step 9 — artifact.** Interactive runs only; see Task 17.
13. **Step 10 — finish.** `crm finish`, which sets the exit code. Show the user the report path and the headline counts.
14. **Modes `ask` and `fix`.** One paragraph each pointing at Tasks 15 and 16.
15. **Rules that do not bend.** A short list: never commit; subagents never get the `Agent` tool; verification is per axis, never per finding; a non-interactive run never applies fixes and never raises the budget; a finding without verbatim evidence is discarded rather than reported.

- [ ] **Step 4: Run the test and confirm it passes**

Run: `cd <skill> && node --test test/skill.test.mjs`
Expected: PASS, 6 tests.

- [ ] **Step 5: Dry-run the skill end to end on a scratch repository**

Create a throwaway repository in the scratchpad with `.claude/review/config.md` copied from `templates/config.md`, one deliberate defect (a `console.log` in a production file so the `debug-leftovers` axis fires), and one clean file. Invoke the skill interactively. Confirm: the budget line appears before any agent runs; exactly `1 + 2 × selected` agents are dispatched; `raport.md` is Polish; `findings.json` exists.

- [ ] **Step 6: Checkpoint**

Report the observed agent count against `selection.agents`. A mismatch is a blocking defect in this task.

---

### Task 14: `init` mode

**Files:**
- Modify: `<skill>/SKILL.md` — add the `init` section
- Modify: `<skill>/bin/crm.mjs` — add the `detect` subcommand
- Test: `<skill>/test/detect.test.mjs`

**Interfaces:**
- Consumes: `templates/config.md` (Task 11).
- Produces: `crm detect --repo <dir>` → `{ name, hasGit, remote, packageManager, languages, lintCommands, docs: string[], topLevelDirs: string[] }`. `SKILL.md` turns that plus the repository's own documents into axes.

- [ ] **Step 1: Write the failing test**

`<skill>/test/detect.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeRepo, writeFiles } from './helpers/repo.mjs';

const CLI = join(dirname(fileURLToPath(import.meta.url)), '..', 'bin', 'crm.mjs');
const run = (args) => JSON.parse(execFileSync(process.execPath, [CLI, ...args], { encoding: 'utf8' }));

test('detect reports the package manager, scripts and docs it found', () => {
  const dir = makeRepo({
    'package.json': JSON.stringify({ name: 'demo', scripts: { lint: 'eslint .', typecheck: 'tsc -b' } }),
    'pnpm-workspace.yaml': 'packages:\n  - apps/*\n',
    'docs/review-guide.md': '# guide\n',
    'apps/api/src/main.ts': 'export const x = 1;\n',
  });
  const out = run(['detect', '--repo', dir]);
  assert.equal(out.name, 'demo');
  assert.equal(out.packageManager, 'pnpm');
  assert.deepEqual(out.lintCommands, { lint: 'eslint .', typecheck: 'tsc -b' });
  assert.ok(out.docs.includes('docs/review-guide.md'));
  assert.ok(out.topLevelDirs.includes('apps'));
});

test('detect survives a repository with no package.json', () => {
  const dir = makeRepo({ 'main.py': 'x = 1\n' });
  const out = run(['detect', '--repo', dir]);
  assert.equal(out.packageManager, null);
  assert.ok(out.languages.includes('python'));
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `cd <skill> && node --test test/detect.test.mjs`
Expected: FAIL — unknown command `detect`.

- [ ] **Step 3: Add `detect` to `bin/crm.mjs`**

Insert into `COMMANDS`:

```js
  detect(args) {
    const repo = args.repo ?? process.cwd();
    const tracked = execFileSync('git', ['-C', repo, 'ls-files'], { encoding: 'utf8' }).split('\n').filter(Boolean);
    const has = (path) => tracked.includes(path);
    const pkg = has('package.json') ? JSON.parse(readFileSync(join(repo, 'package.json'), 'utf8')) : null;
    const byExtension = { ts: 'typescript', tsx: 'typescript', js: 'javascript', py: 'python', go: 'go', rs: 'rust' };
    const languages = [...new Set(tracked
      .map((path) => byExtension[path.split('.').pop()])
      .filter(Boolean))];
    return {
      name: pkg?.name ?? repo.split(/[\\/]/).pop(),
      hasGit: true,
      remote: gitRemote(repo),
      packageManager: has('pnpm-lock.yaml') || has('pnpm-workspace.yaml') ? 'pnpm'
        : has('yarn.lock') ? 'yarn' : has('package-lock.json') ? 'npm' : null,
      languages,
      lintCommands: Object.fromEntries(Object.entries(pkg?.scripts ?? {})
        .filter(([name]) => ['lint', 'typecheck', 'test', 'format:check'].includes(name))),
      docs: tracked.filter((path) => /^(docs\/|AGENTS\.md$|CLAUDE\.md$|CONTRIBUTING\.md$)/.test(path)),
      topLevelDirs: [...new Set(tracked.map((path) => path.split('/')[0]).filter((seg) => !seg.includes('.')))],
    };
  },
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `cd <skill> && node --test test/detect.test.mjs`
Expected: PASS, 2 tests.

- [ ] **Step 5: Add the `init` section to `SKILL.md`**

Requirements for that section, written out in full:

- Run `crm detect`. Read every document it lists under `docs`, plus `AGENTS.md` and `CLAUDE.md` when present.
- Draft `.claude/review/config.md` from `templates/config.md`: fill `{{REPO_NAME}}` and `{{REPO_SUMMARY}}`, and turn each coherent group of rules found in those documents into one axis with an `id`, a `when` derived from the directories the rules concern, a `rank`, and the checklist in the document's own words.
- Ask about gaps rather than inventing: an axis whose `when` you cannot infer, a rule that names a tool the repository does not appear to use, a severity you are unsure of.
- Show the drafted file and **wait for approval before writing it**.
- When a document was lifted wholesale — `docs/review-guide.md` is the case in `saas app` — **propose**, as a separate question, reducing it to a heading plus a pointer at `.claude/review/config.md`. Never do it unasked: people read that document without Claude.
- Add `.claude/review/reports/` to the repository's `.gitignore`, and say that `state.json` is deliberately left tracked.

- [ ] **Step 6: Checkpoint**

---

### Task 15: `ask` mode — questions and triage

**Files:**
- Modify: `<skill>/SKILL.md` — add the `ask` section
- Modify: `<skill>/bin/crm.mjs` — add the `latest` subcommand
- Test: `<skill>/test/latest.test.mjs`

**Interfaces:**
- Consumes: `crm triage`, `crm suppressed` (Task 10).
- Produces: `crm latest --repo <dir>` → `{ runId, report, findings }` paths for the newest run, or `{ runId: null }`.

- [ ] **Step 1: Write the failing test**

`<skill>/test/latest.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeRepo } from './helpers/repo.mjs';

const CLI = join(dirname(fileURLToPath(import.meta.url)), '..', 'bin', 'crm.mjs');
const run = (args) => JSON.parse(execFileSync(process.execPath, [CLI, ...args], { encoding: 'utf8' }));

test('latest returns null when nothing has been reviewed', () => {
  assert.equal(run(['latest', '--repo', makeRepo({ 'a.ts': 'x\n' })]).runId, null);
});

test('latest picks the newest run id', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  const reports = join(dir, '.claude', 'review', 'reports');
  mkdirSync(reports, { recursive: true });
  for (const id of ['20260901-1000', '20260904-1830', '20260903-0900']) {
    writeFileSync(join(reports, `${id}-findings.json`), '{"findings":[]}');
    writeFileSync(join(reports, `${id}-raport.md`), '# x\n');
  }
  assert.equal(run(['latest', '--repo', dir]).runId, '20260904-1830');
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `cd <skill> && node --test test/latest.test.mjs`
Expected: FAIL — unknown command `latest`.

- [ ] **Step 3: Add `latest` to `bin/crm.mjs`**

```js
  latest(args) {
    const repo = args.repo ?? process.cwd();
    const dir = join(reviewDir(repo), 'reports');
    if (!existsSync(dir)) return { runId: null };
    const ids = [...new Set(readdirSync(dir)
      .map((name) => /^(.+?)-findings\.json$/.exec(name)?.[1])
      .filter(Boolean))].sort();
    const runId = ids.at(-1) ?? null;
    if (runId === null) return { runId: null };
    return { runId, report: reportPath(repo, runId, 'raport.md'), findings: reportPath(repo, runId, 'findings.json') };
  },
```

Add `readdirSync` to the `node:fs` import at the top of the file.

- [ ] **Step 4: Run the test and confirm it passes**

Run: `cd <skill> && node --test test/latest.test.mjs`
Expected: PASS, 2 tests.

- [ ] **Step 5: Add the `ask` section to `SKILL.md`**

Requirements, written out in full:

- `/code-review-master ask [path]`. With no path, run `crm latest`; `runId: null` means say there is no report yet and stop.
- Read `findings.json` and `raport.md`. Answer questions from them.
- When asked to justify a finding — "is that really a problem", "how do you know" — **read the code** with `Read` and `Grep` and answer from what you see. Either bring firmer evidence or say plainly that it was a false positive. Do not defend a finding you cannot re-confirm.
- **Dispatch no subagents.** This mode is a conversation; the budget belongs to the review, not to the discussion of it.
- Recording a verdict: `crm triage --run <id> --id <f-NN> --verdict accepted|rejected|deferred --scope here|everywhere --reason "<one line>" [--until YYYY-MM-DD]`. For `rejected` and `deferred`, **ask for the reason if the user did not give one** — the CLI refuses a blank reason, and a later report's silence is unreadable without it.
- `show-suppressed` runs `crm suppressed`; `restore <fingerprint>` runs `crm suppressed --restore <fingerprint>`.
- Never commit.

- [ ] **Step 6: Checkpoint**

---

### Task 16: `fix` mode

**Files:**
- Modify: `<skill>/SKILL.md` — add the `fix` section
- Modify: `<skill>/bin/crm.mjs` — add the `fixable` subcommand
- Test: `<skill>/test/fixable.test.mjs`

**Interfaces:**
- Consumes: `findings.json` with codex verdicts (Task 9).
- Produces: `crm fixable --repo <dir> --run <id> [--ids f-01,f-03]` → `{ fixable: Finding[], skipped: [{ id, why }] }`. A finding is fixable when `codex.verdict === 'confirms'` and it passed its threshold; everything else is skipped with a stated reason.

- [ ] **Step 1: Write the failing test**

`<skill>/test/fixable.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeRepo } from './helpers/repo.mjs';

const CLI = join(dirname(fileURLToPath(import.meta.url)), '..', 'bin', 'crm.mjs');
const run = (args) => JSON.parse(execFileSync(process.execPath, [CLI, ...args], { encoding: 'utf8' }));

function repoWithFindings(findings) {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  const reports = join(dir, '.claude', 'review', 'reports');
  mkdirSync(reports, { recursive: true });
  writeFileSync(join(reports, 'r1-findings.json'), JSON.stringify({ findings }));
  return dir;
}

test('only codex-confirmed findings are fixable', () => {
  const dir = repoWithFindings([
    { id: 'f-01', severity: 'blocking', codex: { verdict: 'confirms', reason: 'r', fix: 'do x' } },
    { id: 'f-02', severity: 'blocking', codex: { verdict: 'rejects', reason: 'r', fix: null } },
    { id: 'f-03', severity: 'suggestion', codex: null },
  ]);
  const out = run(['fixable', '--repo', dir, '--run', 'r1']);
  assert.deepEqual(out.fixable.map((f) => f.id), ['f-01']);
  assert.equal(out.skipped.length, 2);
  assert.match(out.skipped.find((s) => s.id === 'f-02').why, /rejects/);
  assert.match(out.skipped.find((s) => s.id === 'f-03').why, /no codex verdict/);
});

test('--ids narrows the set further', () => {
  const dir = repoWithFindings([
    { id: 'f-01', severity: 'blocking', codex: { verdict: 'confirms', reason: 'r', fix: 'x' } },
    { id: 'f-02', severity: 'blocking', codex: { verdict: 'confirms', reason: 'r', fix: 'y' } },
  ]);
  const out = run(['fixable', '--repo', dir, '--run', 'r1', '--ids', 'f-02']);
  assert.deepEqual(out.fixable.map((f) => f.id), ['f-02']);
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `cd <skill> && node --test test/fixable.test.mjs`
Expected: FAIL — unknown command `fixable`.

- [ ] **Step 3: Add `fixable` to `bin/crm.mjs`**

```js
  fixable(args) {
    const repo = args.repo ?? process.cwd();
    const data = readJson(reportPath(repo, args.run, 'findings.json'));
    const only = args.ids ? new Set(String(args.ids).split(',').map((s) => s.trim())) : null;
    const fixable = [];
    const skipped = [];
    for (const finding of data.findings) {
      if (only && !only.has(finding.id)) { skipped.push({ id: finding.id, why: 'not named in --ids' }); continue; }
      if (!finding.codex) { skipped.push({ id: finding.id, why: 'no codex verdict — cross-check did not run' }); continue; }
      if (finding.codex.verdict !== 'confirms') { skipped.push({ id: finding.id, why: `codex ${finding.codex.verdict}` }); continue; }
      fixable.push(finding);
    }
    return { fixable, skipped };
  },
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `cd <skill> && node --test test/fixable.test.mjs`
Expected: PASS, 2 tests.

- [ ] **Step 5: Add the `fix` section to `SKILL.md`**

Requirements, written out in full:

- `/code-review-master fix [ids]`. **Interactive runs only.** In a non-interactive run, refuse and say why: a scheduled or CI run that edits code unattended is a different product with a different risk profile.
- Run `crm fixable`. Show the user what will be attempted and what is skipped, with the reason for each skip, and **wait for approval before editing anything**.
- Implement each fix yourself. `codex.fix` is advice: judge it before writing it, and reject it when it is wrong, stating why.
- Follow the repository's own conventions and tests. Where the repository has tests for the touched behaviour, run them.
- Afterwards, present a table: finding id, what it said, your assessment, applied or not, and why. **A rejected remark with no stated reason is worse than a bad remark applied**, because the trace of the decision disappears.
- A fix that would change scope, add a dependency, or do something irreversible is not yours to decide. List it separately and stop for the user.
- **Never commit.** Leave every edit uncommitted in the working tree and say so in the closing summary.

- [ ] **Step 6: Checkpoint**

---

### Task 17: Artifact rendering

**Files:**
- Create: `<skill>/templates/artifact.html`
- Modify: `<skill>/SKILL.md` — fill in step 9
- Test: `<skill>/test/artifact.test.mjs`

**Interfaces:**
- Consumes: `findings.json`, `raport.md`.
- Produces: an HTML page written to the scratchpad and published with the `Artifact` tool by `SKILL.md`. Data is injected as a single `<script type="application/json" id="findings">` block, so the template stays static and testable.

- [ ] **Step 1: Write the failing test**

`<skill>/test/artifact.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const TEXT = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'templates', 'artifact.html'), 'utf8');

test('the template carries a title and the data placeholder', () => {
  assert.match(TEXT, /<title>[^<]+<\/title>/);
  assert.match(TEXT, /id="findings"/);
  assert.match(TEXT, /\{\{DATA\}\}/);
});

test('it defines light and dark palettes without a document-level fetch', () => {
  assert.match(TEXT, /prefers-color-scheme: dark/);
  assert.match(TEXT, /\[data-theme="dark"\]/);
  assert.equal(/fetch\(|XMLHttpRequest|<script src=/.test(TEXT), false, 'no external loads — CSP blocks them');
});

test('it filters by axis and severity', () => {
  assert.match(TEXT, /data-filter="axis"/);
  assert.match(TEXT, /data-filter="severity"/);
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `cd <skill> && node --test test/artifact.test.mjs`
Expected: FAIL — template missing.

- [ ] **Step 3: Write `templates/artifact.html`**

Requirements, written out in full — no `<!doctype>`, `<html>`, `<head>` or `<body>` tags, because the publisher wraps the file:

- A `<title>` naming the repository and the run, e.g. `Review saas app`.
- `<style>` defining the full light palette on bare `:root`, redefining tokens under `@media (prefers-color-scheme: dark)` guarded as `:root:not([data-theme="light"])`, and again under `:root[data-theme="dark"]`. `body` gets an explicit token background.
- A header block repeating the coverage and spend lines from `raport.md`.
- Filter controls: one `<select data-filter="axis">` and one `<select data-filter="severity">`, plus a live count.
- One card per finding: severity badge coloured by severity, `file:line` as a link when `link` is present and as plain copyable text when it is not, the evidence in a `<pre>` that scrolls horizontally inside its own container, the Polish body, and the codex verdict as a second badge.
- `<script type="application/json" id="findings">{{DATA}}</script>` followed by an inline `<script>` that reads it with `JSON.parse(document.getElementById('findings').textContent)` and renders. No external scripts, no fonts, no fetch.

- [ ] **Step 4: Run the test and confirm it passes**

Run: `cd <skill> && node --test test/artifact.test.mjs`
Expected: PASS, 3 tests.

- [ ] **Step 5: Fill in step 9 of `SKILL.md`**

- Interactive runs only. Skip silently when there is no TTY.
- Read `templates/artifact.html`, replace `{{DATA}}` with the contents of `findings.json`, write the result into the scratchpad directory, and publish it with the `Artifact` tool: a two-to-four-word title (`Review <repo>`), a one-sentence `description`, and a favicon on first publish only.
- Record the returned URL by passing `--artifact <url>` to `crm finish`.
- A new artifact per run. Never redeploy over a previous run's URL: comparing runs is the point.

- [ ] **Step 6: Checkpoint**

---

## Stage 3 — running without a person

### Task 18: Wrapper scripts and the CI job

**Files:**
- Create: `<skill>/scripts/review.ps1`
- Create: `<skill>/scripts/review.sh`
- Create: `<skill>/ci/code-review.yml`
- Test: manual, described below

**Interfaces:**
- Consumes: the finished skill (Tasks 13–17).
- Produces: three copyable artifacts. The scripts take `-Repo`/`--repo` and `-Mode`/`--mode`, force the model, and propagate the exit code.

- [ ] **Step 1: Confirm the CLI flags before writing anything**

Run: `claude --help`

Record, in the plan's own execution notes, the exact flags for: non-interactive prompt, model override, output format, and permission mode. **Do not write a flag you have not seen in that output.** If a needed flag does not exist, say so in the checkpoint rather than inventing one.

- [ ] **Step 2: Write `scripts/review.ps1`**

Requirements:

- Parameters `-Repo` (required), `-Mode` (default `since`), `-Model` (default the strong model), `-LogDir` (default `<repo>\.claude\review\reports`).
- Sets the working directory to `-Repo`, invokes `claude` non-interactively with `/code-review-master <mode>` using the flags recorded in Step 1.
- Writes stdout and stderr to `<LogDir>\<timestamp>-nightly.log`.
- Propagates the exit code with `exit $LASTEXITCODE`, so a scheduled task records a real failure.
- **Passes no `--slots`.** A comment on that line says why: an unattended run must not be able to raise the budget.
- Header comment: how to register it in Task Scheduler, with the exact `schtasks` line as a comment, not executed.

- [ ] **Step 3: Write `scripts/review.sh`**

Same behaviour for POSIX: `set -euo pipefail`, `--repo` and `--mode` arguments, log to the same location, propagate the exit code, no `--slots`.

- [ ] **Step 4: Write `ci/code-review.yml`**

A workflow that:

- triggers on `pull_request`;
- checks out with `fetch-depth: 0` — `merge-base` needs history;
- installs Node 20 and the Claude CLI;
- runs `scripts/review.sh --repo . --mode pr --pr ${{ github.event.pull_request.number }}`;
- posts `raport.md` as **one comment updated in place**: find a comment by this workflow's marker (an HTML comment such as `<!-- code-review-master -->`), update it when found, create it otherwise, using `gh pr comment --edit-last` or the API;
- lets the job fail on exit code 1 and marks exit code 2 as a workflow error with a distinct message;
- reads `ANTHROPIC_API_KEY` from `secrets`, with a comment naming what to add and where.

- [ ] **Step 5: Verify the nightly path end to end**

On the scratch repository from Task 13: register nothing in Task Scheduler yet, just run `scripts/review.ps1 -Repo <scratch> -Mode since` from a non-interactive shell. Confirm: no artifact is published; no `--slots` reaches the CLI; the log file exists; the exit code matches the gate.

- [ ] **Step 6: Verify the fix bar**

In the same non-interactive run, confirm the skill refuses `fix` and says why.

- [ ] **Step 7: Checkpoint**

Report the exact `claude` flags used and the observed exit codes. Note that registering the scheduled task and adding the repository secret are the user's actions, listed as commands to paste, not executed.

---

### Task 19: Rollout on `saas app`

**Files:**
- Create: `D:\Praca\Devstock\Projekty\saas app\.claude\review\config.md`
- Modify: `D:\Praca\Devstock\Projekty\saas app\.gitignore`
- Propose: reducing `docs/review-guide.md` to a pointer

**Interfaces:**
- Consumes: the whole skill.
- Produces: a working configuration for the first real repository.

- [ ] **Step 1: Run `init`**

`/code-review-master init` in `saas app`. It reads `AGENTS.md`, `docs/review-guide.md`, `docs/conventions.md`, and the workspace layout.

- [ ] **Step 2: Draft the axes**

At minimum these seven, drawn from the existing documents rather than invented:

| id | source | when | rank |
|---|---|---|---|
| `code-quality` | review-guide §1 | `always` | `always` |
| `security-tenant` | review-guide §2 | `apps/api/**` | `always` |
| `migrations-rls` | review-guide §2, RLS paragraph | `apps/api/prisma/**`, `**/migrations/**` | `always` |
| `nest-architecture` | review-guide §3 | `apps/api/**` | `rotate` |
| `performance-db` | review-guide §4 | `apps/api/**` | `rotate` |
| `conventions` | conventions.md | `always` | `rotate` |
| `react-patterns` | review-guide §1 hooks rule, conventions web section | `apps/web/**/*.tsx` | `rotate` |

Carry the RLS paragraph across verbatim — it is the one rule where a plausible-looking policy is the trap.

- [ ] **Step 3: Show the draft and wait for approval**

Do not write the file before the user approves it.

- [ ] **Step 4: Add the gitignore entry**

Append `.claude/review/reports/` to `saas app`'s `.gitignore`. State explicitly that `.claude/review/state.json` stays tracked, and why.

- [ ] **Step 5: Run a real review**

`/code-review-master branch main` on the current branch. Confirm: the budget line matches `1 + 2 × selected`; `on-touch` skipped the axes it should have; the report is Polish and its `file:line` references resolve; the codex verdicts arrived.

- [ ] **Step 6: Ask about the `review-guide.md` pointer**

Present the proposal to reduce `docs/review-guide.md` to a heading plus a pointer at `.claude/review/config.md`. Do not touch that file without an answer — it is read by people working without Claude.

- [ ] **Step 7: Checkpoint**

Report: the axes created, the budget observed, the findings count, how many codex confirmed, and anything `init` had to ask about. Leave everything uncommitted.

---

## Verification of the whole plan

- [ ] `cd <skill> && node --test test/` — every test passes.
- [ ] The agent-count guard from Task 5 Step 5 passes for 1–40 axes at 1, 3, 5 and 8 slots.
- [ ] A run on the `saas app` branch dispatches exactly `1 + 2 × selected.length` subagents, counted from the transcript, and the number matches the budget line printed before dispatch.
- [ ] A non-interactive run publishes no artifact, applies no fix, and passes no `--slots`.
- [ ] `raport.md` is Polish; `SKILL.md`, configuration, prompts, templates and tests are English.
- [ ] Nothing is committed anywhere.
