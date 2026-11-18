// What wave 1 returned, checked against what the plan asked for. A part agent
// answers with its findings and with what it read and searched; this turns the
// replies into the flat findings list `assemble` takes and names every part
// that gave no sign of having been reviewed.

// Plan paths are repo-relative with forward slashes; an agent on Windows may
// write `apps\x.ts` or `./apps/x.ts` for the same file (as in lib/codex.mjs).
const normalisePath = (file) => String(file).replace(/\\/g, '/').replace(/^(\.\/)+/, '');

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const strings = (v) => (Array.isArray(v) ? v.filter((item) => typeof item === 'string') : []);

// A bare array is the contract from before the reading list existed: its
// findings are still held to the evidence gate later, so they are kept.
function readReply(reply) {
  if (Array.isArray(reply)) return { findings: reply, read: [], searches: [] };
  if (!isPlainObject(reply) || !Array.isArray(reply.findings)) return null;
  return { findings: reply.findings, read: strings(reply.read), searches: strings(reply.searches) };
}

export function collectReplies(selected, replies) {
  const findings = [];
  const incomplete = [];
  const coverage = [];
  const known = new Set();
  for (const entry of selected) {
    const parts = entry.parts ?? [{ label: entry.axisId, index: 1, of: 1, files: entry.files ?? [] }];
    // A grouped entry counts as search-only only when every member axis is.
    const searchOnly = (entry.axes ?? []).length > 0 && entry.axes.every((a) => a.reads === 'search');
    for (const part of parts) {
      known.add(part.label);
      const reply = readReply(replies[part.label]);
      if (reply === null) { incomplete.push(part.label); continue; }
      findings.push(...reply.findings.filter(isPlainObject));
      const read = new Set(reply.read.map(normalisePath));
      // No findings and no file read: nothing shows the part was reviewed, and
      // it must not read as clean. A part with findings stands on their
      // evidence, which `assemble` checks against the files.
      const unreviewed = reply.findings.length === 0 && read.size === 0;
      if (unreviewed) incomplete.push(part.label);
      coverage.push({
        label: part.label,
        read: read.size,
        // A deleted file has no content to open (size 0 in the plan).
        unread: searchOnly ? [] : part.files.filter((f) => f.size > 0 && !read.has(f.path)).map((f) => f.path),
        searches: reply.searches.length,
        // Findings with no file opened came from the diff alone.
        diffOnly: !searchOnly && reply.findings.length > 0 && read.size === 0,
        incomplete: unreviewed,
      });
    }
  }
  const unknownLabels = Object.keys(replies).filter((label) => !known.has(label));
  return { findings, incomplete, coverage, unknownLabels };
}
