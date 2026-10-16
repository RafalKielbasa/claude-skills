import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mergeHooks, upsertRulesBlock, hookCommand, hubClaudeMd, HUB_ROLE_HEADER, RULES_BEGIN, HOOK_EVENTS } from '../lib/install.mjs';
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

test('install.mjs writes the hub role into hub/CLAUDE.md, leaves an identical one, rewrites a changed one (P10)', () => {
  const claude = tempRoot();
  const rolePath = join(claude, 'hub', 'CLAUDE.md');
  const wanted = hubClaudeMd(readFileSync(new URL('../role.md', import.meta.url), 'utf8'));
  assert.match(wanted, /^<!-- Written by the hub installer from the skill's role\.md/);
  assert.match(wanted, /Hard rules, also when the skill is not loaded:/);
  assert.equal(wanted.includes('\r'), false);
  // role.md checked out with CRLF (core.autocrlf) gives the same file as with LF.
  assert.equal(hubClaudeMd('a\r\nb\r\n\r\n'), `${HUB_ROLE_HEADER}\n\na\nb\n`);

  const dry = spawnSync(process.execPath, [INSTALL, '--claude-dir', claude, '--dry-run'], { encoding: 'utf8' });
  assert.match(dry.stdout, /hub CLAUDE\.md: create .*CLAUDE\.md/);
  assert.equal(existsSync(rolePath), false);

  const real = spawnSync(process.execPath, [INSTALL, '--claude-dir', claude], { encoding: 'utf8' });
  assert.equal(real.status, 0, real.stderr);
  assert.equal(readFileSync(rolePath, 'utf8'), wanted);
  assert.match(spawnSync(process.execPath, [INSTALL, '--claude-dir', claude], { encoding: 'utf8' }).stdout, /hub CLAUDE\.md: role unchanged/);

  writeFileSync(rolePath, '@C:/Users/rafal/.claude/skills/hub/role.md\n', 'utf8');
  const rewritten = spawnSync(process.execPath, [INSTALL, '--claude-dir', claude], { encoding: 'utf8' });
  assert.match(rewritten.stdout, /hub CLAUDE\.md: role rewritten from role\.md/);
  assert.equal(readFileSync(rolePath, 'utf8'), wanted);
  const backups = readdirSync(join(claude, 'hub')).filter((name) => name.startsWith('CLAUDE.md.bak-hub-'));
  assert.equal(backups.length, 1);
  assert.equal(readFileSync(join(claude, 'hub', backups[0]), 'utf8'), '@C:/Users/rafal/.claude/skills/hub/role.md\n');
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
