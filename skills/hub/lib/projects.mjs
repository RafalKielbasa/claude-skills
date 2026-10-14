// Project of a session (spec §4.1): the longest alias root containing the cwd, compared on path
// segment boundaries and case-insensitively; otherwise the repository's main worktree name.
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, basename, dirname } from 'node:path';
import { projectsConfigPath } from './paths.mjs';

function norm(path) {
  return resolve(String(path)).replace(/[\\/]+$/, '').toLowerCase();
}

export function samePath(a, b) {
  return norm(a) === norm(b);
}

export function isWithin(child, root) {
  const c = norm(child);
  const r = norm(root);
  return c === r || c.startsWith(`${r}\\`) || c.startsWith(`${r}/`);
}

// An unreadable projects.json never breaks the overview: it yields no aliases and one error line.
export function loadAliases(root) {
  const path = projectsConfigPath(root);
  if (!existsSync(path)) return { aliases: {}, errors: [] };
  try {
    return { aliases: JSON.parse(readFileSync(path, 'utf8')).aliases ?? {}, errors: [] };
  } catch (error) {
    return { aliases: {}, errors: [`unreadable: ${error.message}`] };
  }
}

export function aliasErrors(aliases) {
  const byRoot = new Map();
  for (const [name, dir] of Object.entries(aliases)) {
    const key = norm(dir);
    byRoot.set(key, [...(byRoot.get(key) ?? []), name]);
  }
  return [...byRoot.entries()]
    .filter(([, names]) => names.length > 1)
    .map(([dir, names]) => `aliases ${names.join(', ')} share the root ${dir}`);
}

export function gitCommonDir(cwd) {
  const result = spawnSync('git', ['-C', cwd, 'rev-parse', '--path-format=absolute', '--git-common-dir'], { encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() : null;
}

export function projectFor(cwd, aliases, commonDirOf = gitCommonDir) {
  if (!cwd) return 'unknown';
  const hits = Object.entries(aliases).filter(([, dir]) => isWithin(cwd, dir));
  if (hits.length) {
    hits.sort((a, b) => norm(b[1]).length - norm(a[1]).length);
    return hits[0][0];
  }
  const common = commonDirOf(cwd);
  if (common) return basename(dirname(resolve(common)));
  return basename(resolve(cwd));
}
