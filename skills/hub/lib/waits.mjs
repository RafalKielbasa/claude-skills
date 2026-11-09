// What waits for Rafal right now: a pure function from the overview rows, the hook's open pending
// records and its ask records to Wait objects (consumed by queue.mjs `reconcile`), plus the name a
// session is spoken by.
const DAY_MS = 24 * 60 * 60 * 1000;
const ASK_LOOKBACK_MS = 120 * 1000;
const NAME_MAX = 120;

const toMs = (value) => (typeof value === 'number' ? value : Date.parse(value));
// A dialog fork is never queued or spoken: launched by the hub as a dialog, or named like one.
const DIALOG_PREFIX = 'dlg-';
export const isDialogName = (name) => typeof name === 'string' && name.startsWith(DIALOG_PREFIX);
export const isDialog = (row) => row.launchedKind === 'dialog' || isDialogName(String(row.name ?? '')) || String(row.name ?? '').includes('[dialog]');
const isWaiting = (row) => row.state === 'waiting for decision' || row.state === 'waiting for permission';

const title = (row) => String(row.name ?? '').slice(0, NAME_MAX);

// The title; no title: the project name; another waiting session with the same title: "<title>, <project>".
export function spokenName(row, rows) {
  const own = title(row);
  if (!own) return row.projectName;
  const clash = rows.some((other) => other.sessionId !== row.sessionId && !isDialog(other) && isWaiting(other) && title(other) === own);
  return clash ? `${own}, ${row.projectName}` : own;
}

export function collectWaits({ rows, pendings = [], asks = [], now }) {
  const waits = [];
  for (const row of rows) {
    if (isDialog(row)) continue;
    const base = { sessionId: row.sessionId, name: spokenName(row, rows), project: row.projectName, shortId: String(row.sessionId).slice(0, 8) };
    const own = [];
    for (const p of pendings) {
      if (p.sessionId !== row.sessionId) continue;
      const since = toMs(p.startedAt);
      if (!Number.isFinite(since) || now - since > DAY_MS) continue;
      own.push(p);
      waits.push({ ...base, key: `${row.sessionId}|p:${p.id}`, kind: 'permission', since, pendingId: p.id, answerable: true, askTool: null, detail: `${p.tool ?? ''} ${p.target ?? ''}`.trim() });
    }
    if (!isWaiting(row)) continue;
    const since = toMs(row.since);
    if (!Number.isFinite(since) || now - since > DAY_MS) continue;
    const key = `${row.sessionId}|${since}`;
    if (row.state === 'waiting for decision') {
      waits.push({ ...base, key, kind: 'decision', since, pendingId: null, answerable: true, askTool: null, detail: row.detail ?? '' });
    } else if (own.length === 0) {
      let ask = null;
      for (const a of asks) {
        const at = toMs(a.at);
        if (a.sessionId === row.sessionId && at >= since - ASK_LOOKBACK_MS && (!ask || at >= ask.at)) ask = { at, tool: a.tool };
      }
      const asked = Boolean(ask);
      waits.push({ ...base, key, kind: asked ? 'decision' : 'permission', since, pendingId: null, answerable: false, askTool: asked ? (ask.tool ?? 'AskUserQuestion') : null, detail: row.detail ?? '' });
    }
  }
  return waits;
}
