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
