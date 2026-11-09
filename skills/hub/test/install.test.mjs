import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, delimiter } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mergeHooks, mergePermissionHook, permissionHookCommand, shimFiles, SHIM_NAMES, upsertRulesBlock, hookCommand, hubClaudeMd, HUB_ROLE_HEADER, RULES_BEGIN, HOOK_EVENTS } from '../lib/install.mjs';
import { tempRoot } from './helpers.mjs';

const INSTALL = fileURLToPath(new URL('../bin/install.mjs', import.meta.url));

// The only way a test starts the installer: both folders are always temporary, and HUB_TEST makes the
// installer itself refuse a default folder, so no test can write into the real ~/.claude or ~/.local/bin.
function runInstall(claude, bin = tempRoot(), extra = [], env = {}) {
  return spawnSync(process.execPath, [INSTALL, '--claude-dir', claude, '--bin-dir', bin, ...extra], { encoding: 'utf8', env: { ...process.env, HUB_TEST: '1', ...env } });
}
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

test('the rules block tells a session to quote a hub message it acts on (hub-panel probe D7)', () => {
  const block = upsertRulesBlock('');
  assert.match(block, /\*\*Hub messages\.\*\*/);
  assert.match(block, /quoting\s+that message verbatim/);
});

test('install.mjs on a temporary claude dir: dry run writes nothing, a real run installs idempotently', () => {
  const claude = tempRoot();
  writeFileSync(join(claude, 'settings.json'), JSON.stringify({ hooks: { SessionEnd: [backupHook] } }));
  writeFileSync(join(claude, 'CLAUDE.md'), '# Zasady\n');

  const dry = runInstall(claude, undefined, ['--dry-run']);
  assert.equal(dry.status, 0, dry.stderr);
  assert.match(dry.stdout, /^\[dry run\]/);
  assert.equal(existsSync(join(claude, 'skills')), false);
  assert.equal(readFileSync(join(claude, 'CLAUDE.md'), 'utf8'), '# Zasady\n');

  const real = runInstall(claude);
  assert.equal(real.status, 0, real.stderr);
  assert.ok(existsSync(join(claude, 'skills', 'hub', 'bin', 'hub-hook.mjs')));
  assert.ok(existsSync(join(claude, 'hub', 'projects.json')));
  const settings = JSON.parse(readFileSync(join(claude, 'settings.json'), 'utf8'));
  assert.equal(settings.hooks.SessionEnd.length, 2);
  assert.match(readFileSync(join(claude, 'CLAUDE.md'), 'utf8'), /hub-global-rules/);
  assert.ok(readdirSync(claude).some((name) => name.startsWith('settings.json.bak-hub-')));

  const again = runInstall(claude);
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

  const dry = runInstall(claude, undefined, ['--dry-run']);
  assert.match(dry.stdout, /hub CLAUDE\.md: create .*CLAUDE\.md/);
  assert.equal(existsSync(rolePath), false);

  const real = runInstall(claude);
  assert.equal(real.status, 0, real.stderr);
  assert.equal(readFileSync(rolePath, 'utf8'), wanted);
  assert.match(runInstall(claude).stdout, /hub CLAUDE\.md: role unchanged/);

  writeFileSync(rolePath, '@C:/Users/rafal/.claude/skills/hub/role.md\n', 'utf8');
  const rewritten = runInstall(claude);
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
  const run = runInstall(dir);
  assert.equal(run.status, 1);
  assert.match(run.stderr, /settings\.json: unreadable/);
  assert.ok(!existsSync(join(dir, 'skills')));
  assert.deepEqual(readdirSync(dir).filter((name) => name.includes('.bak-hub-')), []);
  assert.equal(readFileSync(join(dir, 'CLAUDE.md'), 'utf8'), '# Zasady\n');
});

const SKILL_DIR = 'C:\\Users\\rafal\\.claude\\skills\\hub';
const permissionCommand = permissionHookCommand(SKILL_DIR);

test('mergePermissionHook adds a blocking entry with the long timeout, keeps others, is idempotent, updates a timeout in place', () => {
  assert.equal(permissionCommand, 'node "C:/Users/rafal/.claude/skills/hub/bin/hub-permission.mjs"');
  const other = { matcher: 'Bash', hooks: [{ type: 'command', command: 'other.cmd', timeout: 5 }] };
  const first = mergePermissionHook({ hooks: { PermissionRequest: [other] }, model: 'x' }, permissionCommand, 28800);
  assert.equal(first.changed, true);
  assert.equal(first.settings.model, 'x');
  assert.deepEqual(first.settings.hooks.PermissionRequest[0], other);
  assert.deepEqual(first.settings.hooks.PermissionRequest[1], { hooks: [{ type: 'command', command: permissionCommand, timeout: 28800 }] });
  assert.equal('async' in first.settings.hooks.PermissionRequest[1].hooks[0], false);
  assert.equal(mergePermissionHook(first.settings, permissionCommand, 28800).changed, false);
  const updated = mergePermissionHook(first.settings, permissionCommand, 600);
  assert.equal(updated.changed, true);
  assert.equal(updated.settings.hooks.PermissionRequest.length, 2);
  assert.equal(updated.settings.hooks.PermissionRequest[1].hooks[0].timeout, 600);
  // An entry of ours that was registered async is made blocking again.
  const asyncEntry = { hooks: { PermissionRequest: [{ hooks: [{ type: 'command', command: permissionCommand, timeout: 28800, async: true }] }] } };
  const fixed = mergePermissionHook(asyncEntry, permissionCommand, 28800);
  assert.equal(fixed.changed, true);
  assert.equal('async' in fixed.settings.hooks.PermissionRequest[0].hooks[0], false);
});

test('shimFiles gives ok, nie, pauza, wracam each as an sh script and a .cmd that run hub-cmd.mjs of the installed skill', () => {
  const files = shimFiles(SKILL_DIR);
  assert.deepEqual(Object.keys(files).sort(), SHIM_NAMES.flatMap((name) => [name, `${name}.cmd`]).sort());
  assert.equal(Object.keys(files).length, 8);
  for (const name of SHIM_NAMES) {
    assert.match(files[name], /^#!\/bin\/sh\n/);
    assert.ok(files[name].includes(`exec node "C:/Users/rafal/.claude/skills/hub/bin/hub-cmd.mjs" ${name} "$@"`), files[name]);
    assert.equal(files[name].includes('\r'), false);
    assert.ok(files[`${name}.cmd`].includes(`node "C:\\Users\\rafal\\.claude\\skills\\hub\\bin\\hub-cmd.mjs" ${name} %*`), files[`${name}.cmd`]);
  }
});

test('install.mjs writes eight shims into --bin-dir, a dry run none, a rerun changes nothing, a foreign ok is left alone', () => {
  const claude = tempRoot();
  const bin = tempRoot();
  const dry = runInstall(claude, bin, ['--dry-run']);
  assert.equal(dry.status, 0, dry.stderr);
  assert.deepEqual(readdirSync(bin), []);
  for (const name of ['settings.json', 'skills', 'hub']) assert.equal(existsSync(join(claude, name)), false, name);
  assert.match(dry.stdout, /commands: /);

  writeFileSync(join(bin, 'ok'), '#!/bin/sh\necho mine\n', 'utf8');
  const real = runInstall(claude, bin);
  assert.equal(real.status, 0, real.stderr);
  assert.match(real.stdout, /commands: 7 written, 1 left alone/);
  assert.match(real.stdout, /ok is not a hub command, left alone/);
  assert.equal(readFileSync(join(bin, 'ok'), 'utf8'), '#!/bin/sh\necho mine\n');
  assert.equal(readdirSync(bin).length, 8);
  const expected = shimFiles(join(claude, 'skills', 'hub'));
  assert.equal(readFileSync(join(bin, 'nie'), 'utf8'), expected.nie);
  assert.equal(readFileSync(join(bin, 'wracam.cmd'), 'utf8'), expected['wracam.cmd']);

  const settings = JSON.parse(readFileSync(join(claude, 'settings.json'), 'utf8'));
  assert.equal(settings.hooks.PermissionRequest[0].hooks[0].timeout, 28800);
  assert.match(real.stdout, /PermissionRequest hook added/);

  const again = runInstall(claude, bin);
  assert.match(again.stdout, /commands: 0 written, 1 left alone/);
  assert.match(again.stdout, /PermissionRequest hook unchanged/);
  assert.deepEqual(readdirSync(bin).filter((n) => n.includes('.bak-hub-')), []);
});

test('install.mjs reports a bin dir that is not on PATH', () => {
  const claude = tempRoot();
  const bin = tempRoot();
  const off = runInstall(claude, bin);
  assert.match(off.stdout, /not on PATH/);
  const withoutPath = Object.fromEntries(Object.entries(process.env).filter(([key]) => key.toLowerCase() !== 'path'));
  const on = runInstall(claude, bin, [], { ...withoutPath, PATH: `${bin}${delimiter}${process.env.PATH ?? process.env.Path}` });
  assert.doesNotMatch(on.stdout, /not on PATH/);
});

test('a shim runs hub-cmd.mjs under the installed skill dir (sh, as Git Bash runs it under !)', () => {
  const claude = tempRoot();
  const bin = tempRoot();
  runInstall(claude, bin);
  const sh = spawnSync('sh', [join(bin, 'wracam')], { encoding: 'utf8', env: { ...process.env, HUB_DATA: tempRoot() } });
  if (sh.error) return; // no sh on this machine
  assert.equal(sh.stderr.includes('Cannot find module'), false, sh.stderr);
  assert.match(sh.stdout, /Nic nie czeka\.|Wracamy/);
});

test('install.mjs refuses a default folder when HUB_TEST is set', () => {
  for (const args of [[], ['--claude-dir', tempRoot()], ['--bin-dir', tempRoot()]]) {
    const run = spawnSync(process.execPath, [INSTALL, ...args], { encoding: 'utf8', env: { ...process.env, HUB_TEST: '1' } });
    assert.equal(run.status, 1, run.stdout);
    assert.match(run.stderr, /HUB_TEST is set: pass both --claude-dir and --bin-dir/);
    assert.equal(run.stdout, '');
  }
});
