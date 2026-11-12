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

## How we review

Prose with no yaml block. This heading must never become an axis, and the
test below is what proves it: without this section, that assertion would
pass against a parser that had lost the fence check entirely.
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
  assert.equal(doc.axes.length, 2, 'the prose section must not have become a third axis');
  assert.equal(doc.axes.some((a) => a.heading === 'How we review'), false);
  assert.deepEqual(doc.ignoredSections, [], 'a section with no yaml is not an axis at all, not an ignored one');
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

// B5: templates/config.md added `.claude/review/**` to its own exclude list,
// but a repository whose config.md predates that template change sets no
// `exclude` of its own and falls back to this default — which was still `[]`.
// Without this, every such repository keeps spending its budget reviewing
// its own state.json and reports, which every run rewrites.
test('a review never reviews its own bookkeeping by default', () => {
  assert.deepEqual(DEFAULT_SETTINGS.exclude, ['.claude/review/**']);
  const merged = mergeConfig(parseConfigDoc('---\n---\n'), parseConfigDoc('---\n---\n'));
  assert.deepEqual(merged.settings.exclude, ['.claude/review/**'],
    'a repo config.md that sets no exclude of its own must still inherit this default');
});

test('a file cap that is not a positive integer is a configuration error, not a runtime guess', () => {
  const doc = parseConfigDoc(`---\n---\n\n## A\n\n\`\`\`yaml\nid: a\nwhen: always\nrank: always\nmax_files: 0\n\`\`\`\n\n- x\n`);
  const zeroCap = validateConfig({ settings: DEFAULT_SETTINGS, axes: doc.axes });
  assert.equal(zeroCap.length, 1);
  assert.match(zeroCap[0], /max_files/);

  const badDefault = validateConfig({
    settings: { ...DEFAULT_SETTINGS, budget: { ...DEFAULT_SETTINGS.budget, max_files_per_axis: null } },
    axes: [],
  });
  assert.equal(badDefault.length, 1);
  assert.match(badDefault[0], /max_files_per_axis/);
});

test('validateConfig reports a bad rank and a duplicate id', () => {
  const doc = parseConfigDoc(`---\n---\n\n## A\n\n\`\`\`yaml\nid: a\nwhen: always\nrank: sometimes\n\`\`\`\n\n- x\n\n## B\n\n\`\`\`yaml\nid: a\nwhen: always\nrank: always\n\`\`\`\n\n- y\n`);
  const problems = validateConfig({ settings: DEFAULT_SETTINGS, axes: doc.axes });
  assert.equal(problems.length, 2);
  assert.match(problems.join('\n'), /rank/);
  assert.match(problems.join('\n'), /duplicate/);
});

const axisDoc = (yamlLines) => parseConfigDoc(`---\n---\n\n## S\n\n\`\`\`yaml\nid: s\n${yamlLines}\n\`\`\`\n\n- x\n`);
const EMPTY = () => parseConfigDoc('---\n---\n');

test('an axis may list semgrep rule packs', () => {
  assert.deepEqual(axisDoc('semgrep: [p/secrets, p/security-audit]').axes[0].semgrep, ['p/secrets', 'p/security-audit']);
  assert.deepEqual(axisDoc('rank: always').axes[0].semgrep, []);
});

test('a semgrep value that is not a list of non-empty strings is a configuration error', () => {
  for (const line of ['semgrep: p/secrets', "semgrep: ['']"]) {
    const problems = validateConfig({ settings: DEFAULT_SETTINGS, axes: axisDoc(line).axes });
    assert.ok(problems.some((p) => p.includes('semgrep')), `no semgrep problem for ${line}: ${problems}`);
  }
});

test('codex and semgrep settings merge key by key', () => {
  const repo = parseConfigDoc('---\nsemgrep: { timeout_s: 60 }\ncodex: { timeout_s: 10 }\n---\n');
  const global = parseConfigDoc('---\ncodex: { find: false }\n---\n');
  const merged = mergeConfig(global, repo).settings;
  assert.equal(merged.semgrep.timeout_s, 60);
  assert.equal(merged.semgrep.image, DEFAULT_SETTINGS.semgrep.image);
  assert.equal(merged.semgrep.enabled, true);
  assert.equal(merged.codex.find, false);
  assert.equal(merged.codex.timeout_s, 10);
  assert.equal(merged.codex.find_timeout_s, 600);
});

test('the semgrep image must be pinned', () => {
  for (const image of ['semgrep/semgrep:latest', 'semgrep/semgrep']) {
    const merged = mergeConfig(EMPTY(), parseConfigDoc(`---\nsemgrep: { image: '${image}' }\n---\n`));
    const problems = validateConfig(merged);
    assert.ok(problems.some((p) => p.includes('pinned')), `no pinned problem for ${image}: ${problems}`);
  }
});

test('a semgrep image or rule pack shaped like an option is a configuration error', () => {
  const withImage = (image) => validateConfig({ settings: { ...DEFAULT_SETTINGS, semgrep: { ...DEFAULT_SETTINGS.semgrep, image } }, axes: [] });
  for (const image of ['-semgrep/semgrep:1.182.1', '--privileged:1', 'Semgrep/Semgrep:1.182.1', ' semgrep/semgrep:1']) {
    const problems = withImage(image);
    assert.equal(problems.length, 1, `${image}: ${problems}`);
    assert.match(problems[0], /semgrep\.image/);
  }
  const digest = `semgrep/semgrep@sha256:${'a1'.repeat(32)}`;
  for (const image of ['semgrep/semgrep:1.182.1', 'localhost:5000/semgrep/semgrep:1.2', digest]) {
    assert.deepEqual(withImage(image), [], image);
  }
  for (const image of ['semgrep/semgrep:latest', 'semgrep/semgrep', 'localhost:5000/semgrep']) {
    assert.ok(withImage(image).some((p) => p.includes('pinned')), image);
  }
  for (const line of ["semgrep: ['--config=/etc/passwd']", "semgrep: ['-x']", "semgrep: [p/secrets, '-v']"]) {
    const problems = validateConfig({ settings: DEFAULT_SETTINGS, axes: axisDoc(line).axes });
    assert.ok(problems.some((p) => p.includes('semgrep') && p.includes('"-')), `no option-shaped pack problem for ${line}: ${problems}`);
  }
  assert.deepEqual(validateConfig({ settings: DEFAULT_SETTINGS, axes: axisDoc('semgrep: [p/secrets, r/a-b]').axes }), []);
});
