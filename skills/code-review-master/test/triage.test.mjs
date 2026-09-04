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

// LLM-phrased claims are templated; the differentiator often falls past the
// token cap. The quoted code is what keeps two defects apart.
test('two defects sharing a phrasing but not a quote keep separate fingerprints', () => {
  const a = { axis: 'sec', file: 'a.ts', claim: 'query without tenant filter',
    evidence: 'prisma.course.findFirst({ where: { id } })' };
  const b = { axis: 'sec', file: 'a.ts', claim: 'query without tenant filter',
    evidence: 'prisma.lesson.findMany({ where: { courseId } })' };
  assert.notEqual(fingerprint(a, 'here'), fingerprint(b, 'here'));
  const state = recordTriage(emptyState(), a, { verdict: 'rejected', scope: 'here', reason: 'public by design' });
  assert.ok(isSuppressed(a, state.triage, '2026-09-04'));
  assert.equal(isSuppressed(b, state.triage, '2026-09-04'), null,
    'rejecting one defect must not silence a different one');
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

test('verdict, scope and date are validated, not stored blindly', () => {
  const finding = { axis: 'perf', file: 'a.ts', claim: 'x' };
  const at = (over) => () => recordTriage(emptyState(), finding, { verdict: 'rejected', scope: 'here', reason: 'r', ...over });
  assert.throws(at({ verdict: 'maybe' }), /verdict must be/);
  assert.throws(at({ scope: 'globally' }), /scope must be/);
  assert.throws(at({ until: '01.10.2026' }), /YYYY-MM-DD/);
  assert.throws(at({ verdict: 'deferred', until: null }), /until date/);
});
