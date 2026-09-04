import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeRepo } from '../test-helpers/repo.mjs';

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
