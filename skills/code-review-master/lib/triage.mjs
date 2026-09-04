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

// The quoted code discriminates where the prose cannot. Two different defects
// in one file often share a templated claim ("query without X filter") whose
// differentiator falls past the token cap; they almost never share the line
// they quote. Without this, rejecting one defect silences the other.
export function evidenceKey(evidence) {
  return String(evidence ?? '').replace(/\s+/g, ' ').trim().slice(0, 60);
}

export function fingerprint(finding, scope) {
  const file = scope === 'everywhere' ? '*' : finding.file;
  return `${finding.axis}|${file}|${normalizeClaim(finding.claim)}|${evidenceKey(finding.evidence)}`;
}

export function isSuppressed(finding, triage, today) {
  for (const entry of triage) {
    if (entry.verdict === 'accepted') continue;
    // The scope is a field on the entry. Recovering it by splitting the
    // fingerprint would make a `|` in a file path silently select the wrong one.
    if (fingerprint(finding, entry.scope) !== entry.fingerprint) continue;
    if (entry.verdict === 'deferred' && entry.until !== null && entry.until < today) continue;
    return entry;
  }
  return null;
}

const VERDICTS = new Set(['accepted', 'rejected', 'deferred']);
const SCOPES = new Set(['here', 'everywhere']);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function recordTriage(state, finding, { verdict, scope, reason, until = null }) {
  if (!VERDICTS.has(verdict)) throw new Error(`verdict must be accepted, rejected or deferred, got "${verdict}"`);
  if (!SCOPES.has(scope)) throw new Error(`scope must be here or everywhere, got "${scope}"`);
  if (verdict !== 'accepted' && String(reason).trim() === '') {
    throw new Error('a rejected or deferred finding needs a reason — silence in a later report is unreadable without one');
  }
  if (verdict === 'deferred' && !ISO_DATE.test(String(until))) {
    throw new Error(`a deferred finding needs an until date as YYYY-MM-DD, got "${until}"`);
  }
  if (until !== null && !ISO_DATE.test(String(until))) {
    throw new Error(`until must be YYYY-MM-DD, got "${until}" — dates here are compared as strings`);
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
