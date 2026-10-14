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

export function copySkill(srcDir, destDir) {
  mkdirSync(destDir, { recursive: true });
  cpSync(srcDir, destDir, { recursive: true, filter: (path) => !/[\\/](node_modules|\.git)([\\/]|$)/.test(path) });
}
