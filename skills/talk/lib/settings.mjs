// Fork settings (spec §8): the fork edits only its dialog directory and reads no secret. The deny
// names the source session's working directory by its absolute path: since Claude Code 2.1.326 a
// relative `./**` in this file also covered the dialog directory that holds it
// (D:/Notatki/notatki/.claude/specs/2026-11-19-hub-fork-permissions-design.md).
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { DENYLIST } from '../../hub/lib/denylist.mjs';
import { posixPath } from '../../hub/lib/paths.mjs';

export { posixPath };

export function voiceForkSettings(dialogDir, cwd) {
  return {
    permissions: {
      allow: [`Edit(${posixPath(resolve(dialogDir))}/**)`],
      deny: [`Edit(${posixPath(resolve(cwd))}/**)`, 'Bash', 'EnterWorktree', ...DENYLIST.map((glob) => `Read(**/${glob})`)],
    },
  };
}

export function writeVoiceForkSettings(dialogDir, cwd) {
  mkdirSync(dialogDir, { recursive: true });
  const path = join(dialogDir, 'fork-settings.json');
  writeFileSync(path, `${JSON.stringify(voiceForkSettings(dialogDir, cwd), null, 2)}\n`, 'utf8');
  return path;
}
