// Conversation titles (spec §5.1): Claude Code appends `custom-title` or `ai-title` records to the
// session transcript again and again; the newest one names the conversation. The transcript is read
// backwards in chunks only up to that record, and the result is cached by transcript size in
// registry/titles.json, so an unchanged transcript is never read twice.
import { openSync, readSync, closeSync, fstatSync, statSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { titlesPath } from './paths.mjs';

export const CHUNK_BYTES = 1024 * 1024;
const TITLE_RECORD = /"type":"(custom-title|ai-title)"/;

function titleInLine(line) {
  if (!TITLE_RECORD.test(line)) return null;
  try {
    const record = JSON.parse(line);
    const title = record.type === 'custom-title' ? record.customTitle : record.aiTitle;
    return typeof title === 'string' && title.trim() ? { title: title.trim(), source: record.type } : null;
  } catch {
    return null;
  }
}

// The newest title record, or null when the file is missing or holds none.
export function readTitle(path, { chunkBytes = CHUNK_BYTES } = {}) {
  let fd;
  try {
    fd = openSync(path, 'r');
  } catch {
    return null;
  }
  try {
    let position = fstatSync(fd).size;
    // Bytes of a line that starts in an earlier chunk; completed by the next (earlier) read.
    let partial = Buffer.alloc(0);
    while (position > 0) {
      const length = Math.min(chunkBytes, position);
      position -= length;
      const chunk = Buffer.alloc(length);
      readSync(fd, chunk, 0, length, position);
      const data = Buffer.concat([chunk, partial]);
      let complete = data;
      if (position > 0) {
        const firstNewline = data.indexOf(0x0a);
        partial = firstNewline === -1 ? data : data.subarray(0, firstNewline);
        complete = firstNewline === -1 ? Buffer.alloc(0) : data.subarray(firstNewline + 1);
      }
      const lines = complete.toString('utf8').split('\n');
      for (let i = lines.length - 1; i >= 0; i -= 1) {
        const found = titleInLine(lines[i]);
        if (found) return found;
      }
    }
    return null;
  } finally {
    closeSync(fd);
  }
}

// A torn or missing cache counts as empty: the titles are read again.
export function loadTitleCache(root) {
  if (!existsSync(titlesPath(root))) return {};
  try {
    return JSON.parse(readFileSync(titlesPath(root), 'utf8')) ?? {};
  } catch {
    return {};
  }
}

function saveTitleCache(root, cache) {
  mkdirSync(dirname(titlesPath(root)), { recursive: true });
  writeFileSync(titlesPath(root), JSON.stringify(cache), 'utf8');
}

// sessionId → title (or null) for every { sessionId, transcriptPath }; the cache is written once.
export function resolveTitles(root, items, options = {}) {
  const cache = loadTitleCache(root);
  const titles = new Map();
  let changed = false;
  for (const { sessionId, transcriptPath } of items) {
    if (!transcriptPath) {
      titles.set(sessionId, null);
      continue;
    }
    let size;
    try {
      size = statSync(transcriptPath).size;
    } catch {
      titles.set(sessionId, null);
      continue;
    }
    const cached = cache[sessionId];
    if (cached && cached.path === transcriptPath && cached.size === size) {
      titles.set(sessionId, cached.title);
      continue;
    }
    const found = readTitle(transcriptPath, options);
    cache[sessionId] = { path: transcriptPath, size, title: found?.title ?? null, source: found?.source ?? null };
    titles.set(sessionId, cache[sessionId].title);
    changed = true;
  }
  if (changed) saveTitleCache(root, cache);
  return titles;
}

// Retention: keeps only the titles of sessions whose event log still exists.
export function pruneTitles(root, sessionIds) {
  if (!existsSync(titlesPath(root))) return 0;
  const kept = Object.fromEntries(Object.entries(loadTitleCache(root)).filter(([sessionId]) => sessionIds.has(sessionId)));
  saveTitleCache(root, kept);
  return Object.keys(kept).length;
}
