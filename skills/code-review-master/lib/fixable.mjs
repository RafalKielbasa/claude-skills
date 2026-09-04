// A finding is fixable when codex confirmed it and a verification agent scored
// it. `crm score` has already dropped everything below threshold, so a finding
// still present has passed; the confidence check guards against a findings.json
// that never went through score at all.
export function selectFixable(findings, ids = null) {
  const only = ids ? new Set(String(ids).split(',').map((s) => s.trim())) : null;
  const fixable = [];
  const skipped = [];
  for (const finding of findings) {
    if (only && !only.has(finding.id)) { skipped.push({ id: finding.id, why: 'not named in --ids' }); continue; }
    if (finding.confidence === undefined || finding.confidence === null) {
      skipped.push({ id: finding.id, why: 'never scored — run crm score before fixing' });
      continue;
    }
    if (!finding.codex) { skipped.push({ id: finding.id, why: 'no codex verdict — cross-check did not run' }); continue; }
    if (finding.codex.verdict !== 'confirms') { skipped.push({ id: finding.id, why: `codex ${finding.codex.verdict}` }); continue; }
    fixable.push(finding);
  }
  return { fixable, skipped };
}
