// The state shown to Rafal (spec §5.4, priority order) and /clear continuations (spec §5.2).
// The raw `state` from `claude agents --json` is shown next to it and never ranks.

export const UNCERTAIN_AFTER_MS = 10 * 60 * 1000;

export function displayState(derived, { entry, vanished, now, judgment = null }) {
  if (derived.phase === 'ended') return { label: 'ended', since: derived.endedAt };
  if (derived.problem || vanished) return { label: 'problem', since: derived.lastEventAt, detail: derived.problem || 'vanished' };
  if (derived.waiting?.kind === 'permission') return { label: 'waiting for permission', since: derived.waiting.since };
  if (derived.waiting?.kind === 'decision') return { label: 'waiting for decision', since: derived.waiting.since, detail: derived.waiting.text };
  const busy = entry?.status === 'busy';
  if (busy && derived.lastEventAt && now - Date.parse(derived.lastEventAt) > UNCERTAIN_AFTER_MS) {
    return { label: 'uncertain', since: derived.lastEventAt };
  }
  if (derived.phase === 'working' || busy) return { label: 'working', since: derived.phaseSince };
  // No marker: the hub reads the last message and records its judgment of this Stop (`HUB judge`).
  if (derived.phase === 'turn-ended') {
    if (judgment === 'question') return { label: 'probably waiting for you', since: derived.phaseSince };
    return { label: 'turn ended', since: derived.phaseSince, judge: !judgment };
  }
  return { label: 'unknown', since: derived.lastEventAt };
}

// A session ended by /clear and a later session with the same title form one tab: the old one gets
// continuedTo, the new one continuedFrom. Untitled sessions (VS Code panels) are never paired.
export function linkContinuations(derivedList) {
  const byStart = [...derivedList].sort((a, b) => String(a.firstAt).localeCompare(String(b.firstAt)));
  for (const old of byStart) {
    if (old.endReason !== 'clear' || !old.sessionTitle) continue;
    const next = byStart.find((d) => d !== old && !d.continuedFrom && d.sessionTitle === old.sessionTitle && d.firstAt >= old.endedAt);
    if (next) {
      old.continuedTo = next.sessionId;
      next.continuedFrom = old.sessionId;
    }
  }
  return derivedList;
}
