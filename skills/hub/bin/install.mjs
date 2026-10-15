#!/usr/bin/env node
// Installs the hub. Run by Rafal, not by a Claude session: it writes into ~/.claude.
// Usage: node install.mjs [--claude-dir <dir>] [--dry-run]
//   1. copies this skill to <claude-dir>/skills/hub
//   2. registers hub-hook.mjs for six events in <claude-dir>/settings.json (backup first)
//   3. writes the global rules block into <claude-dir>/CLAUDE.md (backup first)
//   4. creates <claude-dir>/hub/ with an empty project map (projects.json)
// Every step is idempotent; --dry-run prints what would change and writes nothing.
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { hookCommand, mergeHooks, upsertRulesBlock, copySkill } from '../lib/install.mjs';

const argv = process.argv.slice(2);
const dirIndex = argv.indexOf('--claude-dir');
const claudeDir = resolve(dirIndex !== -1 ? argv[dirIndex + 1] : join(homedir(), '.claude'));
const dryRun = argv.includes('--dry-run');
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

console.log(`${dryRun ? '[dry run] ' : ''}${report.join('\n')}`);
