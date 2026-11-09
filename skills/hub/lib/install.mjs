// Installation pieces (spec §4, §5.1, §5.3, decision 8): hook registration in settings.json, the
// global rules block in CLAUDE.md, and the skill copy. Pure where possible; bin/install.mjs wires
// them to the real files and is run by Rafal, because writes to ~/.claude are his.
import { cpSync, mkdirSync } from 'node:fs';

export const HOOK_EVENTS = ['UserPromptSubmit', 'PostToolUse', 'Notification', 'Stop', 'StopFailure', 'SessionEnd'];
export const RULES_BEGIN = '<!-- BEGIN hub-global-rules -->';
export const RULES_END = '<!-- END hub-global-rules -->';

export const RULES_BLOCK = [
  RULES_BEGIN,
  '## Orchestrator hub',
  '',
  "- **Gate marker.** A turn that ends waiting for Rafal's decision ends with the line",
  '',
  '  ⏸ Czeka na decyzję: <one sentence>',
  '',
  '- **Isolation.** A project session does not message another project session on its own',
  '  initiative; the hub is the only channel between projects. Exception: Rafal asks for it',
  '  explicitly in that session.',
  '',
  '- **Hub messages.** A session that acts on a message from the hub starts its reply by quoting',
  '  that message verbatim, because the desktop app card shows the reply but not the message.',
  RULES_END,
].join('\n');

export function hookCommand(skillDir) {
  return `node "${skillDir.replace(/\\/g, '/')}/bin/hub-hook.mjs"`;
}

// Adds one async hook entry per event, keeping every existing entry; a second run changes nothing.
export function mergeHooks(settings, command) {
  const next = structuredClone(settings ?? {});
  next.hooks ??= {};
  let added = 0;
  for (const event of HOOK_EVENTS) {
    const groups = next.hooks[event] ?? [];
    const present = groups.some((group) => (group.hooks ?? []).some((hook) => hook.command === command));
    if (!present) {
      const group = { hooks: [{ type: 'command', command, async: true }] };
      if (event === 'PostToolUse') group.matcher = '*';
      groups.push(group);
      added += 1;
    }
    next.hooks[event] = groups;
  }
  return { settings: next, added };
}

// Inserts the rules block at the end, or replaces an existing block between the markers.
export function upsertRulesBlock(text, block = RULES_BLOCK) {
  const begin = text.indexOf(RULES_BEGIN);
  const end = text.indexOf(RULES_END);
  if (begin !== -1 && end > begin) return `${text.slice(0, begin)}${block}${text.slice(end + RULES_END.length)}`;
  return `${text.replace(/\s*$/, '')}\n\n${block}\n`;
}

// The hub session's role (spec §4 hub setup, P10): ~/.claude/hub/CLAUDE.md holds the text of the
// skill's role.md itself, because an @import from outside that folder is not expanded in a VS Code
// panel session (Plan 3 acceptance, B3).
export const HUB_ROLE_HEADER = "<!-- Written by the hub installer from the skill's role.md (spec §4, P10). Edit role.md and reinstall. -->";

export function hubClaudeMd(role) {
  return `${HUB_ROLE_HEADER}\n\n${role.replace(/\r\n/g, '\n').replace(/\s*$/, '')}\n`;
}

export function copySkill(srcDir, destDir) {
  mkdirSync(destDir, { recursive: true });
  cpSync(srcDir, destDir, { recursive: true, filter: (path) => !/[\\/](node_modules|\.git)([\\/]|$)/.test(path) });
}

// The blocking PermissionRequest hook (approvals design §6.1): no `async`, a long timeout, because the
// hook waits for Rafal's command. An entry of ours with another timeout, or registered async, is
// corrected in place; every other entry stays.
export const PERMISSION_TIMEOUT_SECONDS = 28800;

export function permissionHookCommand(skillDir) {
  return `node "${skillDir.replace(/\\/g, '/')}/bin/hub-permission.mjs"`;
}

export function mergePermissionHook(settings, command, timeoutSeconds) {
  const next = structuredClone(settings ?? {});
  next.hooks ??= {};
  const groups = next.hooks.PermissionRequest ?? [];
  let changed = false;
  let found = false;
  for (const group of groups) {
    for (const hook of group.hooks ?? []) {
      if (hook.command !== command) continue;
      found = true;
      if (hook.timeout !== timeoutSeconds) { hook.timeout = timeoutSeconds; changed = true; }
      if ('async' in hook) { delete hook.async; changed = true; }
    }
  }
  if (!found) {
    groups.push({ hooks: [{ type: 'command', command, timeout: timeoutSeconds }] });
    changed = true;
  }
  next.hooks.PermissionRequest = groups;
  return { settings: next, changed };
}

// The commands Rafal types after `!` in the hub tab (approvals design §6.2). Each is a `sh` script
// (Git Bash runs it under `!`) and a `.cmd` (PowerShell finds that one); both start hub-cmd.mjs of the
// installed skill. The marker line tells our shim from a foreign file of the same name.
export const SHIM_NAMES = ['ok', 'nie', 'pauza', 'wracam'];
export const SHIM_MARKER = 'hub-shim';

export function shimFiles(skillDir) {
  const forward = skillDir.replace(/\\/g, '/');
  const backward = forward.replace(/\//g, '\\');
  const files = {};
  for (const name of SHIM_NAMES) {
    files[name] = `#!/bin/sh\n# ${SHIM_MARKER}\nexec node "${forward}/bin/hub-cmd.mjs" ${name} "$@"\n`;
    files[`${name}.cmd`] = `@echo off\r\nrem ${SHIM_MARKER}\r\nnode "${backward}\\bin\\hub-cmd.mjs" ${name} %*\r\n`;
  }
  return files;
}
