import { fingerprint, isSuppressed } from './triage.mjs';

const SEVERITY_ORDER = { blocking: 3, suggestion: 2, nitpick: 1 };
// Tie order between sources: on equal severity the earlier one's claim is kept.
const SOURCE_ORDER = ['sonnet', 'semgrep', 'codex'];
const sourceRank = (source) => {
  const at = SOURCE_ORDER.indexOf(source);
  return at === -1 ? SOURCE_ORDER.length : at;
};
// Unknown severities rank 0 so comparisons stay total; applyThresholds drops
// them later, but only after another source's valid claim had its chance to win.
const severityRank = (finding) => SEVERITY_ORDER[finding.severity] ?? 0;
const squash = (text) => String(text).replace(/\s+/g, ' ').trim();

// Three characters are a substring of nearly any source file, so a fragment
// that short proves nothing. A whole line is the exception: `@Public()` is
// short and still identifies exactly one thing.
const MIN_EVIDENCE = 12;

export function validateFinding(finding, sourceOf) {
  const quote = squash(finding.evidence ?? '');
  if (quote === '') {
    return { ok: false, why: 'evidence is missing — a claim without a quote is not reviewable' };
  }
  let source;
  try {
    source = sourceOf(finding.file);
  } catch {
    return { ok: false, why: `file ${finding.file} could not be read` };
  }
  if (source === undefined) return { ok: false, why: `file ${finding.file} is not part of this run` };

  const lines = source.split(/\r?\n/);
  // Without a line range the location check below silently does nothing, which
  // is the failure it exists to prevent. A finding with no usable `lines` is
  // off-contract, like an unrecognised severity, and is refused the same way.
  const hasRange = Array.isArray(finding.lines) && finding.lines.length === 2
    && finding.lines.every((n) => Number.isInteger(n) && n > 0);
  if (!hasRange) {
    return { ok: false, why: 'lines must be a [start, end] pair of positive integers — without it the quote cannot be tied to a location' };
  }
  const [from, to] = finding.lines;
  const trimmed = String(finding.evidence).trim();
  // Compared the same way as everything else here, so a whole line quoted with
  // different internal spacing still counts as a whole line.
  const isWholeLine = lines.some((line) => line.trim() !== '' && squash(line) === quote);
  if (quote.length < MIN_EVIDENCE && !isWholeLine) {
    return { ok: false, why: `evidence "${trimmed}" is too short to identify anything — quote the whole line` };
  }

  // The report pairs a file:line link with this quote, so the two have to agree.
  // Two lines of slack either way: an agent counting lines by eye is often off
  // by one, and rejecting a true finding over that costs more than it saves.
  const window = squash(lines.slice(Math.max(0, from - 3), to + 2).join('\n'));
  if (window.includes(quote)) return { ok: true, finding };
  if (squash(source).includes(quote)) {
    return { ok: false, why: `evidence appears in ${finding.file} but not at the cited lines ${from}-${to}` };
  }
  return { ok: false, why: `evidence not found verbatim in ${finding.file}` };
}

export function dedupe(findings) {
  const byKey = new Map();
  for (const finding of findings) {
    // The same key suppression uses, so the two can never drift apart.
    // Source is part of the key: a Sonnet and a codex finding with identical
    // wording must stay two entries here so `mergeAgreement` can record both
    // sources, instead of one silently absorbing the other.
    const key = JSON.stringify([finding.source ?? 'sonnet', fingerprint(finding, 'here')]);
    const seen = byKey.get(key);
    if (!seen) { byKey.set(key, { ...finding }); continue; }
    if (severityRank(finding) > severityRank(seen)) seen.severity = finding.severity;
    seen.lines = [Math.min(seen.lines[0], finding.lines[0]), Math.max(seen.lines[1], finding.lines[1])];
    seen.confidence = Math.max(seen.confidence ?? 0, finding.confidence ?? 0);
  }
  return [...byKey.values()];
}

// Findings from different sources that point at the same place are one finding
// with several witnesses. Two findings of the same source never join, even
// through a third: that would chain unrelated claims into one blob.
export function mergeAgreement(findings) {
  const ordered = [...findings].sort((a, b) => sourceRank(a.source) - sourceRank(b.source)
    || a.file.localeCompare(b.file) || a.lines[0] - b.lines[0]);
  const clusters = [];
  for (const finding of ordered) {
    let best = null;
    let bestOverlap = 0;
    for (const cluster of clusters) {
      if (cluster.axis !== finding.axis || cluster.file !== finding.file) continue;
      if (cluster.members.some((m) => m.source === finding.source)) continue;
      const overlap = Math.min(cluster.span[1], finding.lines[1]) - Math.max(cluster.span[0], finding.lines[0]) + 1;
      // Strictly greater: on a tie the first cluster wins.
      if (overlap > bestOverlap) { best = cluster; bestOverlap = overlap; }
    }
    if (!best) {
      clusters.push({ axis: finding.axis, file: finding.file, span: [...finding.lines], members: [finding] });
      continue;
    }
    best.members.push(finding);
    best.span = [Math.min(best.span[0], finding.lines[0]), Math.max(best.span[1], finding.lines[1])];
  }
  return clusters.map(({ members, span }) => {
    // `source` is dropped: the finding has `sources` and `keptFrom` instead.
    const kept = members.reduce((top, m) => (severityRank(m) > severityRank(top) ? m : top));
    const { source: _source, ...rest } = kept;
    return {
      ...rest,
      lines: span,
      sources: members.map((m) => m.source),
      keptFrom: kept.source,
      alsoClaimed: members.filter((m) => m !== kept)
        .map((m) => ({ source: m.source, claim: m.claim, severity: m.severity, fix: m.fix ?? null })),
    };
  });
}

export function applyThresholds(findings, thresholds) {
  const kept = [];
  const dropped = [];
  for (const finding of findings) {
    // `hasOwn`, not `in`: `in` walks the prototype chain, so a severity of
    // "toString" would read as known.
    if (!Object.hasOwn(SEVERITY_ORDER, finding.severity)) { dropped.push(finding); continue; }
    const floor = thresholds[finding.severity] ?? 100;
    ((finding.confidence ?? 0) >= floor ? kept : dropped).push(finding);
  }
  return { kept, dropped };
}

export function assemble({ run, findings, triage, today }) {
  const suppressed = [];
  const surviving = [];
  // Findings without a stamp are Sonnet's, which is what every caller before
  // the extra finders produced.
  const stamped = findings.map((f) => ({ ...f, source: f.source ?? 'sonnet' }));
  for (const finding of mergeAgreement(dedupe(stamped))) {
    const hit = isSuppressed(finding, triage, today);
    if (hit) { suppressed.push({ ...finding, reason: hit.reason, verdict: hit.verdict }); continue; }
    surviving.push(finding);
  }
  surviving.sort((a, b) => severityRank(b) - severityRank(a)
    || a.file.localeCompare(b.file) || a.lines[0] - b.lines[0]);
  return {
    run,
    findings: surviving.map((finding, index) => ({
      ...finding,
      // Assigned fields come last on purpose: a subagent that emits its own
      // `id` would otherwise break scoring silently, and one that emits its own
      // `codex` object would forge a cross-check verdict that reaches the
      // report, the artifact badge, and the auto-fix eligibility check. The
      // same goes for `sources`, `keptFrom` and `alsoClaimed`, which come from
      // `mergeAgreement` and never from what a finder wrote.
      id: `f-${String(index + 1).padStart(2, '0')}`,
      codex: null,
      triage: null,
    })),
    suppressed,
  };
}
