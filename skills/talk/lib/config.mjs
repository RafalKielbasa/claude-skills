// Reads and writes the skill's config.json: allowlist, dialog root, agent ids, interruption strategy (spec §5, §7).
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const CONFIG_PATH = fileURLToPath(new URL('../config.json', import.meta.url));

export function loadConfig(path = CONFIG_PATH) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function saveConfig(config, path = CONFIG_PATH) {
  writeFileSync(path, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
}
