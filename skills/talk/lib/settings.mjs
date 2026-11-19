// Fork settings (spec §8): the fork edits only its dialog directory and reads no secret.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DENYLIST } from '../../hub/lib/denylist.mjs';
import { posixPath } from '../../hub/lib/paths.mjs';

export { posixPath };

export function voiceForkSettings(dialogDir) {
  return {
    permissions: {
      allow: [`Edit(${posixPath(dialogDir)}/**)`],
      deny: ['Edit(./**)', 'Bash', 'EnterWorktree', ...DENYLIST.map((glob) => `Read(**/${glob})`)],
    },
  };
}

export function writeVoiceForkSettings(dialogDir) {
  mkdirSync(dialogDir, { recursive: true });
  const path = join(dialogDir, 'fork-settings.json');
  writeFileSync(path, `${JSON.stringify(voiceForkSettings(dialogDir), null, 2)}\n`, 'utf8');
  return path;
}
