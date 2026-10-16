// Delivery evidence and cross-session notices (spec §6.3, probe S4). Tool success is never
// delivery: only the recipient's UserPromptSubmit with the hub's from-name and a matching
// inner-text hash makes a record `sent`.

// Only the raw inner hash counts: the wrapper delivers `<`, `&` and `"` unescaped (probe S4), so a
// match on the entity-decoded hash could only confirm text that differs from the approved one.
// The latest matching event not already used as evidence (`usedIds`). After a confirmed resend of
// the same text, records are confirmed newest first, so the newest record takes the newest delivery
// and an undelivered older record stays delivery-unknown.
// `hubName` is one from-name or a Set of them (a hub without --name has a poll name, P10).
const isHub = (hubName, fromName) => (hubName instanceof Set ? hubName.has(fromName) : fromName === hubName);

export function findDelivery(record, events, hubName = 'hub', usedIds = new Set()) {
  let found = null;
  for (const event of events) {
    if (event.event === 'UserPromptSubmit'
      && isHub(hubName, event.fromName)
      && event.innerHash === record.textHash
      && (!record.sentAt || event.at >= record.sentAt)
      && !usedIds.has(event.id)) found = event;
  }
  return found;
}

// A hub-origin message the session received after sentAt whose text matches no record of that
// session: the hub copied something other than the approved text. Not delivery evidence.
export function findMismatch(record, events, hubName, knownHashes, usedIds) {
  let found = null;
  for (const event of events) {
    if (event.event === 'UserPromptSubmit'
      && isHub(hubName, event.fromName)
      && (!record.sentAt || event.at >= record.sentAt)
      && !usedIds.has(event.id)
      && !knownHashes.has(event.innerHash)) found = event;
  }
  return found;
}

// A launched session's first own prompt (spec §6.6 step 8): the approved text itself, given on the
// command line, so it carries no cross-session wrapper.
function firstPrompt(events, since) {
  return events
    .filter((e) => e.event === 'UserPromptSubmit' && !e.fromName && (!since || e.at >= since))
    .sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : (a.index ?? 0) - (b.index ?? 0)))[0] ?? null;
}

// `eventsBySession`: Map sessionId → events. With record.sessionId unknown (the launch found no
// poll entry), any session whose first prompt after sentAt carries the approved hash is the one.
export function findLaunchDelivery(record, eventsBySession) {
  for (const [sessionId, events] of eventsBySession) {
    if (record.sessionId && sessionId !== record.sessionId) continue;
    const first = firstPrompt(events, record.sentAt);
    if (first && first.promptHash === record.textHash) return first;
  }
  return null;
}

// The launched session's first prompt carries another hash: Claude Code changed the command-line
// text, or another prompt came first. Never delivery evidence.
export function findLaunchMismatch(record, events) {
  const first = firstPrompt(events, record.sentAt);
  return first && first.promptHash !== record.textHash ? first : null;
}

export function classifyNotice(text) {
  const msgId = /msg_id:\s*([0-9a-f-]{36})/i.exec(text)?.[1] ?? null;
  let kind = 'unknown';
  if (/was held by that session|NOT delivered: its Claude has not seen it/i.test(text)) kind = 'held';
  else if (/was refused/i.test(text)) kind = 'refused';
  else if (/denied/i.test(text)) kind = 'denied';
  else if (/expired/i.test(text)) kind = 'expired';
  else if (/released/i.test(text)) kind = 'released';
  return { kind, msgId };
}

export function applyNotice(record, { kind }, text) {
  // Delivery evidence is final; a later notice is only kept for the record.
  if (record.evidence) return { ...record, notice: text };
  if (kind === 'held') return { ...record, state: 'held', notice: text };
  if (['refused', 'denied', 'expired'].includes(kind)) return { ...record, state: 'not-sent', notice: text };
  if (kind === 'released') return { ...record, state: 'pending', notice: text };
  return { ...record, notice: text };
}
