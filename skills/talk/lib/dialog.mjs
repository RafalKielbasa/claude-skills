// Dialog directory naming and preparation (spec §8): hub git snapshot plus the fork's settings.
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { takeSnapshot } from '../../hub/lib/dialog.mjs';
import { safeName } from '../../hub/lib/paths.mjs';
import { writeVoiceForkSettings } from './settings.mjs';

const pad = (n) => String(n).padStart(2, '0');

// <root>/projects/<safe key>/dialogs/<YYYY-MM-DD-HHmm>-talk, with -2, -3... on collision.
export function dialogDirFor({ root, projectKey, now }) {
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
  const base = join(root, 'projects', safeName(projectKey), 'dialogs', `${stamp}-talk`);
  let dir = base;
  for (let n = 2; existsSync(dir); n += 1) dir = `${base}-${n}`;
  return dir;
}

export function prepareDialog({ cwd, dialogDir }) {
  mkdirSync(dialogDir, { recursive: true });
  const snapshot = takeSnapshot(cwd, join(dialogDir, 'context'));
  const settingsPath = writeVoiceForkSettings(dialogDir);
  return { snapshot, settingsPath };
}
