import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mergeHooks, upsertRulesBlock, hookCommand, RULES_BEGIN, HOOK_EVENTS } from '../lib/install.mjs';
import { tempRoot } from './helpers.mjs';

const INSTALL = fileURLToPath(new URL('../bin/install.mjs', import.meta.url));
const backupHook = { hooks: [{ type: 'command', command: 'powershell.exe -File backup-claude.ps1', timeout: 120 }] };

test('mergeHooks keeps existing entries, adds six async ones once, PostToolUse matches every tool', () => {
  const command = hookCommand('C:\\Users\\rafal\\.claude\\skills\\hub');
  assert.equal(command, 'node "C:/Users/rafal/.claude/skills/hub/bin/hub-hook.mjs"');
  const first = mergeHooks({ hooks: { SessionEnd: [backupHook] }, model: 'x' }, command);
  assert.equal(first.added, 6);
  assert.equal(first.settings.model, 'x');
  assert.equal(first.settings.hooks.SessionEnd.length, 2);
  assert.deepEqual(first.settings.hooks.SessionEnd[0], backupHook);
  assert.equal(first.settings.hooks.PostToolUse[0].matcher, '*');
  for (const event of HOOK_EVENTS) assert.equal(first.settings.hooks[event].at(-1).hooks[0].async, true);
  assert.equal(mergeHooks(first.settings, command).added, 0);
});

test('the rules block is appended once and replaced in place on a rerun', () => {
  const once = upsertRulesBlock('# Zasady\n\ntekst\n');
  assert.equal(once.split(RULES_BEGIN).length, 2);
  assert.match(once, /⏸ Czeka na decyzję: <one sentence>/);
  assert.equal(upsertRulesBlock(once), once);
  const edited = once.replace('## Orchestrator hub', '## Old title');
  assert.equal(upsertRulesBlock(edited), once);
});

test('install.mjs on a temporary claude dir: dry run writes nothing, a real run installs idempotently', () => {
  const claude = tempRoot();
  writeFileSync(join(claude, 'settings.json'), JSON.stringify({ hooks: { SessionEnd: [backupHook] } }));
  writeFileSync(join(claude, 'CLAUDE.md'), '# Zasady\n');

  const dry = spawnSync(process.execPath, [INSTALL, '--claude-dir', claude, '--dry-run'], { encoding: 'utf8' });
  assert.equal(dry.status, 0, dry.stderr);
  assert.match(dry.stdout, /^\[dry run\]/);
  assert.equal(existsSync(join(claude, 'skills')), false);
  assert.equal(readFileSync(join(claude, 'CLAUDE.md'), 'utf8'), '# Zasady\n');

  const real = spawnSync(process.execPath, [INSTALL, '--claude-dir', claude], { encoding: 'utf8' });
  assert.equal(real.status, 0, real.stderr);
  assert.ok(existsSync(join(claude, 'skills', 'hub', 'bin', 'hub-hook.mjs')));
  assert.ok(existsSync(join(claude, 'hub', 'projects.json')));
  const settings = JSON.parse(readFileSync(join(claude, 'settings.json'), 'utf8'));
  assert.equal(settings.hooks.SessionEnd.length, 2);
  assert.match(readFileSync(join(claude, 'CLAUDE.md'), 'utf8'), /hub-global-rules/);
  assert.ok(readdirSync(claude).some((name) => name.startsWith('settings.json.bak-hub-')));

  const again = spawnSync(process.execPath, [INSTALL, '--claude-dir', claude], { encoding: 'utf8' });
  assert.match(again.stdout, /0 hook entries added/);
  assert.match(again.stdout, /rules block unchanged/);
});

test('a malformed settings.json stops the installer before any write', () => {
  const dir = tempRoot();
  writeFileSync(join(dir, 'settings.json'), '{ broken', 'utf8');
  writeFileSync(join(dir, 'CLAUDE.md'), '# Zasady\n', 'utf8');
  const run = spawnSync(process.execPath, [INSTALL, '--claude-dir', dir], { encoding: 'utf8' });
  assert.equal(run.status, 1);
  assert.match(run.stderr, /settings\.json: unreadable/);
  assert.ok(!existsSync(join(dir, 'skills')));
  assert.deepEqual(readdirSync(dir).filter((name) => name.includes('.bak-hub-')), []);
  assert.equal(readFileSync(join(dir, 'CLAUDE.md'), 'utf8'), '# Zasady\n');
});
