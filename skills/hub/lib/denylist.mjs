// Secret-bearing file names (spec §7): never pasted into or pointed at by a Codex prompt, and cut
// out of a dialog's git snapshot (spec §6.5 step 2). Matched on the file name, case-insensitively.
export const DENYLIST = ['.env*', '*.pem', '*.key', '*credentials*', '*secret*', 'auth.json', 'secrets.yaml'];

const PATTERNS = DENYLIST.map((glob) => new RegExp(`^${glob.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`, 'i'));

export function isDenied(path) {
  const name = String(path ?? '').split(/[\\/]/).pop();
  return PATTERNS.some((pattern) => pattern.test(name));
}

// git pathspecs that leave the denylisted names out in every directory.
export function excludePathspecs() {
  return DENYLIST.map((glob) => `:(exclude,glob,icase)**/${glob}`);
}
