// Project of a session (spec §4.1, §4.2): the project map entry whose `dir` contains the cwd,
// compared on path segment boundaries and case-insensitively, the longest `dir` winning; otherwise
// the repository's main worktree name, marked as outside the map.
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, basename, dirname } from 'node:path';
import { projectsConfigPath } from './paths.mjs';

export const MAP_FIELDS = ['name', 'dir', 'description'];
const KEY = /^[a-z0-9]+(-[a-z0-9]+)*$/;

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

// Problems of the map itself; each becomes one line under the overview (spec §4.2).
export function mapErrors(projects, { dirExists = existsSync } = {}) {
  const errors = [];
  const byDir = new Map();
  for (const [key, entry] of Object.entries(projects)) {
    if (!KEY.test(key)) errors.push(`entry ${key}: the key must be kebab-case`);
    for (const field of MAP_FIELDS) {
      if (typeof entry?.[field] !== 'string' || !entry[field].trim()) errors.push(`entry ${key}: missing ${field}`);
    }
    if (typeof entry?.dir === 'string' && entry.dir.trim()) {
      if (!dirExists(entry.dir)) errors.push(`entry ${key}: dir does not exist: ${entry.dir}`);
      const dir = norm(entry.dir);
      byDir.set(dir, [...(byDir.get(dir) ?? []), key]);
    }
  }
  for (const [dir, keys] of byDir) if (keys.length > 1) errors.push(`entries ${keys.join(', ')} share the dir ${dir}`);
  return errors;
}

// An unreadable projects.json never breaks the overview: it yields an empty map and one error line.
export function loadProjectMap(root, options = {}) {
  const path = projectsConfigPath(root);
  if (!existsSync(path)) return { projects: {}, errors: [] };
  let data;
  try {
    data = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    return { projects: {}, errors: [`unreadable: ${error.message}`] };
  }
  const projects = data?.projects && typeof data.projects === 'object' ? data.projects : {};
  const errors = [];
  if (data?.aliases && Object.keys(data.aliases).length) {
    errors.push('`aliases` is no longer read; move its entries into `projects` (spec §4.2)');
  }
  return { projects, errors: [...errors, ...mapErrors(projects, options)] };
}

export function gitCommonDir(cwd) {
  const result = spawnSync('git', ['-C', cwd, 'rev-parse', '--path-format=absolute', '--git-common-dir'], { encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() : null;
}

// { key, name, mapped }: `key` names the folder projects/<key>/, `name` is what Rafal sees.
export function projectOf(cwd, projects, commonDirOf = gitCommonDir) {
  if (!cwd) return { key: 'unknown', name: 'unknown', mapped: false };
  const hits = Object.entries(projects).filter(([, entry]) => typeof entry?.dir === 'string' && entry.dir && isWithin(cwd, entry.dir));
  if (hits.length) {
    hits.sort((a, b) => norm(b[1].dir).length - norm(a[1].dir).length);
    const [key, entry] = hits[0];
    // A non-string name is a map error (mapErrors); the key keeps the overview rendering (spec §4.2).
    return { key, name: typeof entry.name === 'string' && entry.name.trim() ? entry.name : key, mapped: true };
  }
  const common = commonDirOf(cwd);
  const fallback = common ? basename(dirname(resolve(common))) : basename(resolve(cwd));
  return { key: fallback, name: fallback, mapped: false };
}

export function projectFor(cwd, projects, commonDirOf = gitCommonDir) {
  return projectOf(cwd, projects, commonDirOf).key;
}

const cell = (value) => String(value ?? '').replace(/\|/g, '\\|').replace(/\s+/g, ' ');

// `HUB projects`: the map the hub matches Rafal's wording against, the projects seen in the
// registry without an entry, and the map's errors.
export function renderProjects({ projects, errors, unmapped }) {
  const entries = Object.entries(projects);
  const lines = entries.length
    ? ['| Key | Name | Dir | Description |', '|---|---|---|---|', ...entries.map(([key, e]) => `| ${[key, e?.name, e?.dir, e?.description].map(cell).join(' | ')} |`)]
    : ['The project map is empty.'];
  if (unmapped.length) lines.push('', `Seen in the registry, outside the map: ${unmapped.join(', ')}`);
  for (const error of errors) lines.push('', `projects.json: ${error}`);
  return lines.join('\n');
}
