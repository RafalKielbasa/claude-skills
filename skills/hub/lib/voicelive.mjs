// Whether a voice conversation is live: the hub stays silent while Rafal talks. A dialog counts as live
// when its `bridge.json` names a 127.0.0.1 URL whose /api/status answers 200 with `ending: false`, as
// the talk skill detects it (talk/lib/live.mjs). Re-implemented here on purpose: the hub never imports
// from the talk skill and never writes there.
import { readdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PROBE_MS = 1500;

const subdirs = (dir) => {
  try {
    return readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => join(dir, e.name));
  } catch {
    return [];
  }
};

async function probe(url) {
  try {
    const page = new URL(url);
    if (page.protocol !== 'http:' || page.hostname !== '127.0.0.1') return false;
    const res = await fetch(new URL(`/api/status${page.search}`, page), { signal: AbortSignal.timeout(PROBE_MS) });
    if (res.status !== 200) { await res.body?.cancel(); return false; }
    return (await res.json())?.ending === false;
  } catch {
    return false;
  }
}

export async function anyLiveVoice(dialogRoot) {
  if (!dialogRoot) return false;
  for (const project of subdirs(join(dialogRoot, 'projects'))) {
    for (const dir of subdirs(join(project, 'dialogs'))) {
      let live;
      try { live = JSON.parse(readFileSync(join(dir, 'bridge.json'), 'utf8')); } catch { continue; }
      if (typeof live?.url === 'string' && await probe(live.url)) return true;
    }
  }
  return false;
}

// HUB_TALK_ROOT, else the talk skill's configured dialog root (read only), else null.
export function dialogRootOf(env = process.env) {
  if (env.HUB_TALK_ROOT) return env.HUB_TALK_ROOT;
  try {
    const config = JSON.parse(readFileSync(join(homedir(), '.claude', 'skills', 'talk', 'config.json'), 'utf8'));
    return typeof config.dialogRoot === 'string' && config.dialogRoot ? config.dialogRoot : null;
  } catch {
    return null;
  }
}
