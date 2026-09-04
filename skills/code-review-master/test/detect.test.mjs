import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeRepo, writeFiles } from '../test-helpers/repo.mjs';

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
