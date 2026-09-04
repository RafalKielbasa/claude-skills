import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';

const git = (dir, ...args) => execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8' }).trim();

// Every repository this helper builds is removed when the test process exits.
// Without it a full suite run leaves a few dozen directories behind, and this
// suite is run many times a day: the litter reached four figures in one session.
const built = [];
process.on('exit', () => {
  for (const dir of built) {
    try { rmSync(dir, { recursive: true, force: true }); } catch { /* best effort */ }
  }
});

export function makeRepo(files = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'crm-repo-'));
  built.push(dir);
  git(dir, 'init', '-q', '-b', 'main');
  git(dir, 'config', 'user.email', 'test@example.com');
  git(dir, 'config', 'user.name', 'Test');
  writeFiles(dir, files);
  git(dir, 'add', '-A');
  git(dir, 'commit', '-qm', 'initial');
  return dir;
}

export function writeFiles(dir, files) {
  for (const [path, content] of Object.entries(files)) {
    const full = join(dir, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content, 'utf8');
  }
}

export function commitAll(dir, message) {
  git(dir, 'add', '-A');
  git(dir, 'commit', '-qm', message);
  return git(dir, 'rev-parse', 'HEAD');
}

export { git };
