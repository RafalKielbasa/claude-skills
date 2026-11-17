// An axis whose files do not fit one agent is split into parts; each part is
// reviewed by its own finder pair. Labels name a part; findings keep the axisId.

export function partLabel(axisId, index, of) {
  return of === 1 ? axisId : `${axisId}#${index}`;
}

const churn = (f) => (f.added || 0) + (f.removed || 0);

// Greedy balance over already-ranked files (no re-sorting): each file goes to
// the part with the lowest churn total, then fewer files, then lower index.
// Zero-churn files therefore spread by count.
export function partition(rankedFiles, count) {
  const parts = Array.from({ length: count }, () => ({ files: [], churn: 0 }));
  for (const f of rankedFiles) {
    let best = parts[0];
    for (const p of parts) {
      if (p.churn < best.churn || (p.churn === best.churn && p.files.length < best.files.length)) best = p;
    }
    best.files.push(f);
    best.churn += churn(f);
  }
  return parts.map((p) => p.files);
}

export function buildParts(axisId, rankedFiles, size) {
  const of = Math.max(1, Math.ceil(rankedFiles.length / size));
  return partition(rankedFiles, of).map((files, i) => ({
    label: partLabel(axisId, i + 1, of), index: i + 1, of, files,
  }));
}
