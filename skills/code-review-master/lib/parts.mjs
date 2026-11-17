import { plural } from './report.mjs';

// An axis whose files do not fit one agent is split into parts; each part is
// reviewed by its own finder pair. Labels name a part; findings keep the axisId.

export function partLabel(axisId, index, of) {
  return of === 1 ? axisId : `${axisId}#${index}`;
}

const churn = (f) => (f.added || 0) + (f.removed || 0);

// Greedy balance over already-ranked files (no re-sorting): each file goes to
// the part with the lowest churn total, then fewer files, then lower index.
// Zero-churn files therefore spread by count. A part holds at most
// ceil(files / count) files: churn alone would let one dominant file leave
// its part nearly empty and pile everything else on the others, past the
// per-part file limit the count was derived from.
export function partition(rankedFiles, count) {
  const cap = Math.ceil(rankedFiles.length / count);
  const parts = Array.from({ length: count }, () => ({ files: [], churn: 0 }));
  for (const f of rankedFiles) {
    let best = null;
    for (const p of parts) {
      if (p.files.length >= cap) continue;
      if (!best || p.churn < best.churn || (p.churn === best.churn && p.files.length < best.files.length)) best = p;
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

const dirSegments = (path) => (path ?? '').split('/').slice(0, -1);

function sharedPrefix(a, b) {
  let n = 0;
  while (n < a.length && n < b.length && a[n] === b[n]) n += 1;
  return n;
}

// Plan paths are repo-relative with forward slashes; a finder on Windows may
// write `apps\x.ts` or `./apps/x.ts` for the same file (as in lib/codex.mjs).
const normalisePath = (file) => file.replace(/\\/g, '/').replace(/^(\.\/)+/, '');

// Findings carry the axisId, never a part label. A finding whose file no part
// holds (the finder looked outside its slice) goes to the part sharing the
// longest directory prefix; ties and no overlap fall to the lower index.
export function assignFindings(selected, findings) {
  const parts = {};
  const byAxis = new Map();
  for (const entry of selected) {
    const list = entry.parts ?? [{ label: entry.axisId, index: 1, of: 1, files: entry.files ?? [] }];
    for (const p of list) parts[p.label] = [];
    byAxis.set(entry.axisId, list);
  }
  // A grouped entry's finder sees each member's checklist under its own
  // heading and may answer with the member id; it still belongs to the
  // entry's parts. Only the lookup maps it; finding.axis stays as written.
  for (const entry of selected) {
    for (const axis of entry.axes ?? []) if (!byAxis.has(axis.id)) byAxis.set(axis.id, byAxis.get(entry.axisId));
  }
  const unassigned = [];
  for (const finding of findings) {
    const list = byAxis.get(finding.axis);
    if (!list) { unassigned.push(finding.id); continue; }
    const paths = (p) => p.files.map((f) => (typeof f === 'string' ? f : f.path));
    // A finding without a file falls to part 1 rather than throwing, so no
    // finding is ever lost.
    const file = normalisePath(String(finding.file ?? ''));
    let target = list.find((p) => paths(p).includes(file));
    if (!target) {
      const segs = dirSegments(file);
      let best = -1;
      for (const p of list) {
        const score = Math.max(0, ...paths(p).map((path) => sharedPrefix(segs, dirSegments(path))));
        if (score > best) { best = score; target = p; }
      }
    }
    parts[target.label].push(finding.id);
  }
  return { parts, unassigned };
}

// Names the parts that returned nothing, with their position and size, so a
// reader sees how much of the axis went unreviewed.
export function describeIncomplete(selected, labels, lang) {
  return labels.map((label) => {
    for (const entry of selected) {
      const part = (entry.parts ?? []).find((q) => q.label === label);
      if (!part || part.of === 1) continue;
      const n = part.files.length;
      return lang === 'pl'
        ? `${entry.axisId} (część ${part.index} z ${part.of}, ${n} ${plural(n, 'plik', 'pliki', 'plików')})`
        : `${entry.axisId} (part ${part.index} of ${part.of}, ${n} file${n === 1 ? '' : 's'})`;
    }
    return label;
  });
}
