// Text helpers shared by the hook and the CLI: canonical hashing, the gate marker (spec §5.3) and
// the cross-session wrapper that a SendMessage delivery carries (spec §5.1, probe S4).
import { createHash } from 'node:crypto';

export const MARKER = '⏸ Czeka na decyzję:';

// One canonical form for every hash, so the text the hub sends and the inner text the recipient's
// hook sees compare equal despite CRLF and trailing whitespace.
export function canonical(text) {
  return String(text ?? '').replace(/\r\n/g, '\n').replace(/\s+$/, '');
}

export function sha256(text) {
  return createHash('sha256').update(canonical(text), 'utf8').digest('hex');
}

const WRAPPER = /^<cross-session-message\s([^>]*)>\r?\n([\s\S]*?)\r?\n<\/cross-session-message>\s*$/;

export function parseCrossSession(prompt) {
  const match = WRAPPER.exec(String(prompt ?? ''));
  if (!match) return null;
  const attrs = {};
  for (const attr of match[1].matchAll(/([\w-]+)="([^"]*)"/g)) attrs[attr[1]] = attr[2];
  return {
    from: attrs.from ?? null,
    fromName: attrs['from-name'] ?? null,
    fromMode: attrs['from-mode'] ?? null,
    inner: match[2],
  };
}

// Whether the wrapper escapes <, & and " in the inner text is checked in Task 0; the hook records
// the hash of the raw inner text and of the entity-decoded one, and either may confirm delivery.
export function decodeEntities(text) {
  const map = { lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'", amp: '&' };
  return String(text).replace(/&(lt|gt|quot|apos|#39|amp);/g, (_, name) => map[name]);
}

export function markerText(message) {
  const lastLine = String(message ?? '').trimEnd().split('\n').pop().trim();
  return lastLine.startsWith(MARKER) ? lastLine.slice(MARKER.length).trim() : null;
}

// Event times are UTC; the overview (finding A2) and the header line of a composed message (P15)
// show them in local time. The offset is a parameter so tests do not depend on the time zone.
export function localTime(iso, offsetMinutes = iso ? -new Date(iso).getTimezoneOffset() : 0) {
  const ms = Date.parse(iso ?? '');
  if (Number.isNaN(ms)) return String(iso ?? '');
  return new Date(ms + offsetMinutes * 60000).toISOString().slice(0, 19).replace('T', ' ');
}

export function summarize(message, max = 200) {
  const oneLine = String(message ?? '').replace(/\s+/g, ' ').trim();
  return oneLine.length > max ? `${oneLine.slice(0, max - 1)}…` : oneLine;
}
