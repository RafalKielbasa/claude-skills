// Fork settings (spec §8): the fork edits only its dialog directory and reads no secret.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DENYLIST } from '../../hub/lib/denylist.mjs';

// `C:\Users\x` or `C:/Users/x` -> `//c/Users/x`: the form a Windows permission rule matches (spaces kept).
export function posixPath(winPath) {
  return String(winPath).replace(/\\/g, '/').replace(/^([A-Za-z]):/, (_, d) => `//${d.toLowerCase()}`);
}

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
