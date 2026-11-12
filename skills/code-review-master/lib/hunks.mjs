import { execFileSync } from 'node:child_process';

// "@@ -3,0 +4,2 @@" — start and optional count on both sides; an omitted count
// means 1.
const HUNK_HEADER = /^@@ -\d+(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/;

// Added line ranges per file, read from the new side of a unified diff. Works
// with any context size: only the `@@` headers give positions, so `-U0` output
// and the `-U3` that `gh pr diff` prints both parse the same way.
export function parseHunks(patch) {
  const hunks = new Map();
  let ranges = null;
  // Lines still owed to the current hunk on each side. While either is above
  // zero every line is hunk content, so an added line that itself starts with
  // "++ " (shown as "+++ …") is not mistaken for a new-file header.
  let oldLeft = 0;
  let newLeft = 0;
  for (const line of patch.split('\n')) {
    if (oldLeft > 0 || newLeft > 0) {
      if (line.startsWith('+')) newLeft -= 1;
      else if (line.startsWith('-')) oldLeft -= 1;
      else if (!line.startsWith('\\')) { oldLeft -= 1; newLeft -= 1; } // "\ No newline" counts for neither side
      continue;
    }
    if (line.startsWith('+++ ')) {
      // `+++ /dev/null` is a deleted file: nothing on the new side to keep.
      const path = line.slice(4).trim();
      if (path === '/dev/null') {
        ranges = null;
      } else {
        const name = path.startsWith('b/') ? path.slice(2) : path;
        ranges = hunks.get(name) ?? [];
        hunks.set(name, ranges);
      }
      continue;
    }
    const match = HUNK_HEADER.exec(line);
    if (!match) continue;
    oldLeft = match[1] === undefined ? 1 : Number(match[1]);
    newLeft = match[3] === undefined ? 1 : Number(match[3]);
    const start = Number(match[2]);
    // `+c,0` is a pure deletion: it adds no line on the new side.
    if (ranges && newLeft > 0) ranges.push([start, start + newLeft - 1]);
  }
  return hunks;
}

export function overlapsHunks(hunks, file, lines) {
  const [from, to] = lines;
  return (hunks.get(file) ?? []).some(([start, end]) => from <= end && to >= start);
}

const defaultGit = (repo) => (args) => execFileSync('git', ['-C', repo, ...args],
  { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 60000 });
const defaultGh = (repo) => (args) => execFileSync('gh', args,
  { cwd: repo, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 60000 });

// The lines the change added, or null when the diff cannot be computed (no
// network, gh missing, base gone). Null lets the caller fail open instead of
// dropping every finding as "outside the change".
export function changedHunks({ repo, plan, git = defaultGit(repo), gh = defaultGh(repo) }) {
  try {
    const patch = plan.mode === 'pr'
      ? gh(['pr', 'diff', String(plan.target.pr)])
      // Pinned against user config: quotepath would octal-escape non-ASCII
      // paths, a diff.noprefix/mnemonicPrefix setting would change the b/
      // prefix, and color or an external differ would corrupt the text. The
      // Semgrep filter matches these keys against Semgrep's own paths, so any
      // mismatch would silently drop findings.
      : git(['-c', 'core.quotepath=false', 'diff', '--no-color', '--no-ext-diff',
        '--src-prefix=a/', '--dst-prefix=b/', '-U0', plan.target.base, 'HEAD']);
    return parseHunks(patch);
  } catch {
    return null;
  }
}
