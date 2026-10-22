// The live dialog file (spec §18.5): `bridge.json` in the dialog directory exists only while its
// bridge runs, and names the session, the origin and the page URL, so a later `/talk` or the hub can
// find the dialog and reopen its page.
import { readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const LIVE_FILE = 'bridge.json';
const PROBE_MS = 1500;

// Written under another name and renamed, so a reader in another process never sees half a file.
export function writeLiveFile(dialogDir, { sessionId, origin, url }) {
  const file = join(dialogDir, LIVE_FILE);
  const body = { sessionId, origin, url, pid: process.pid, startedAt: new Date().toISOString() };
  writeFileSync(`${file}.tmp`, `${JSON.stringify(body)}\n`, 'utf8');
  renameSync(`${file}.tmp`, file);
}

export function removeLiveFile(dialogDir) {
  rmSync(join(dialogDir, LIVE_FILE), { force: true });
}

// A bridge is live while its status answers 200 with `ending: false`. The file of a bridge killed
// with its session stays behind, and nothing answers at its URL. Only a bridge URL on 127.0.0.1 is
// probed, since `reopen` hands the URL to the browser.
export async function probeBridge(url) {
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

const subdirs = (dir) => {
  try {
    return readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => join(dir, e.name));
  } catch {
    return [];
  }
};

// The live dialog of a session, from `<root>/projects/*/dialogs/*/bridge.json`, or null. A file that
// cannot be read or parsed is passed over.
export async function findLiveDialog({ root, sessionId, isLive = probeBridge }) {
  for (const project of subdirs(join(root, 'projects'))) {
    for (const dir of subdirs(join(project, 'dialogs'))) {
      let live;
      try { live = JSON.parse(readFileSync(join(dir, LIVE_FILE), 'utf8')); } catch { continue; }
      if (live?.sessionId !== sessionId || typeof live.url !== 'string') continue;
      if (await isLive(live.url)) return { dir, url: live.url, origin: live.origin };
    }
  }
  return null;
}
