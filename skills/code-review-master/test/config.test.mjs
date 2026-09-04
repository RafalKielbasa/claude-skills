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
