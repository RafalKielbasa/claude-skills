#!/usr/bin/env node
// Installs the hub. Run by Rafal, not by a Claude session: it writes into ~/.claude.
// Usage: node install.mjs [--claude-dir <dir>] [--bin-dir <dir>] [--dry-run]
//   1. copies this skill to <claude-dir>/skills/hub
//   2. registers hub-hook.mjs for six events in <claude-dir>/settings.json (backup first)
//   3. writes the global rules block into <claude-dir>/CLAUDE.md (backup first)
//   4. creates <claude-dir>/hub/ with an empty project map (projects.json)
//   5. writes <claude-dir>/hub/CLAUDE.md, the hub session's role, from role.md (backup first)
//   6. registers hub-permission.mjs as a blocking PermissionRequest hook, timeout 28800 s (backup first)
//   7. writes the ok/nie/pauza/wracam command shims into <bin-dir> (default ~/.local/bin); a file of that
//      name that is not ours stays untouched and is reported
// Every step is idempotent; --dry-run prints what would change and writes nothing.
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { join, dirname, resolve, delimiter } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { hookCommand, mergeHooks, upsertRulesBlock, hubClaudeMd, copySkill, permissionHookCommand, mergePermissionHook, PERMISSION_TIMEOUT_SECONDS, shimFiles, SHIM_MARKER } from '../lib/install.mjs';

const argv = process.argv.slice(2);
const dirIndex = argv.indexOf('--claude-dir');
const claudeDir = resolve(dirIndex !== -1 ? argv[dirIndex + 1] : join(homedir(), '.claude'));
const binIndex = argv.indexOf('--bin-dir');
const binDir = resolve(binIndex !== -1 ? argv[binIndex + 1] : join(homedir(), '.local', 'bin'));
const dryRun = argv.includes('--dry-run');
if (process.env.HUB_TEST && (dirIndex === -1 || binIndex === -1)) {
  console.error('HUB_TEST is set: pass both --claude-dir and --bin-dir, so a test never writes into the real folders');
  process.exit(1);
}
const srcDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const skillDir = join(claudeDir, 'skills', 'hub');
const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..*$/, '');
const report = [];

function backup(path) {
  if (existsSync(path)) copyFileSync(path, `${path}.bak-hub-${stamp}`);
}

// Read and parse everything before the first write, so a malformed settings.json leaves nothing half-installed.
const settingsPath = join(claudeDir, 'settings.json');
let settings = {};
try {
  if (existsSync(settingsPath)) settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
} catch (error) {
  console.error(`settings.json: unreadable: ${error.message}`);
  process.exit(1);
}
const claudeMdPath = join(claudeDir, 'CLAUDE.md');
const before = existsSync(claudeMdPath) ? readFileSync(claudeMdPath, 'utf8') : '';
const role = readFileSync(join(srcDir, 'role.md'), 'utf8');

// 1. skill
if (resolve(srcDir) === resolve(skillDir)) report.push(`skill: already running from ${skillDir}`);
else {
  report.push(`skill: copy ${srcDir} -> ${skillDir}`);
  if (!dryRun) copySkill(srcDir, skillDir);
}

// 2. hooks
const merged = mergeHooks(settings, hookCommand(skillDir));
report.push(`settings.json: ${merged.added} hook entries added (${hookCommand(skillDir)})`);
if (!dryRun && merged.added) {
  backup(settingsPath);
  writeFileSync(settingsPath, `${JSON.stringify(merged.settings, null, 2)}\n`, 'utf8');
}

// 3. global rules
const after = upsertRulesBlock(before);
report.push(`CLAUDE.md: ${after === before ? 'rules block unchanged' : 'rules block written'}`);
if (!dryRun && after !== before) {
  backup(claudeMdPath);
  writeFileSync(claudeMdPath, after, 'utf8');
}

// 4. hub data directory
const hubDir = join(claudeDir, 'hub');
const projectsPath = join(hubDir, 'projects.json');
report.push(`hub data: ${existsSync(projectsPath) ? 'projects.json present' : `create ${projectsPath}`}`);
if (!dryRun && !existsSync(projectsPath)) {
  mkdirSync(hubDir, { recursive: true });
  writeFileSync(projectsPath, `${JSON.stringify({ projects: {} }, null, 2)}\n`, 'utf8');
}

// 5. the hub session's role
const rolePath = join(hubDir, 'CLAUDE.md');
const wanted = hubClaudeMd(role);
const current = existsSync(rolePath) ? readFileSync(rolePath, 'utf8') : null;
report.push(`hub CLAUDE.md: ${current === wanted ? 'role unchanged' : current === null ? `create ${rolePath}` : 'role rewritten from role.md'}`);
if (!dryRun && current !== wanted) {
  if (current !== null) backup(rolePath);
  mkdirSync(hubDir, { recursive: true });
  writeFileSync(rolePath, wanted, 'utf8');
}

// 6. the blocking permission hook (settings.json is merged again, so step 2's entries survive)
const permission = mergePermissionHook(merged.settings, permissionHookCommand(skillDir), PERMISSION_TIMEOUT_SECONDS);
report.push(`settings.json: PermissionRequest hook ${permission.changed ? 'added or updated' : 'unchanged'} (timeout ${PERMISSION_TIMEOUT_SECONDS} s)`);
if (!dryRun && (merged.added || permission.changed)) {
  if (!merged.added) backup(settingsPath);
  writeFileSync(settingsPath, `${JSON.stringify(permission.settings, null, 2)}\n`, 'utf8');
}

// 7. command shims
const shims = shimFiles(skillDir);
let written = 0;
const foreign = [];
for (const [name, content] of Object.entries(shims)) {
  const path = join(binDir, name);
  const existing = existsSync(path) ? readFileSync(path, 'utf8') : null;
  if (existing === content) continue;
  if (existing !== null && !existing.includes(SHIM_MARKER)) { foreign.push(name); continue; }
  written += 1;
  if (dryRun) continue;
  if (existing !== null) backup(path);
  mkdirSync(binDir, { recursive: true });
  writeFileSync(path, content, { encoding: 'utf8', mode: 0o755 });
}
const unchanged = Object.keys(shims).length - written - foreign.length;
report.push(`commands: ${written} written, ${foreign.length} left alone in ${binDir}${unchanged ? ` (${unchanged} already current)` : ''}`);
for (const name of foreign) report.push(`commands: ${name} is not a hub command, left alone; the hub command of that name is not installed`);
const onPath = (process.env.PATH ?? '').split(delimiter).some((entry) => entry && resolve(entry).toLowerCase() === binDir.toLowerCase());
if (!onPath) report.push(`commands: ${binDir} is not on PATH; add it so \`! ok a3\` resolves`);

console.log(`${dryRun ? '[dry run] ' : ''}${report.join('\n')}`);
