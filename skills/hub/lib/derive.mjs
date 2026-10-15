// Derived session state from its registry events (spec §5.2). Pure: events in, state out.
// Events are ordered by hook start time, then by line order.

export function sortEvents(events) {
  return [...events].sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : (a.index ?? 0) - (b.index ?? 0)));
}

export function deriveSession(events) {
  const state = {
    sessionId: events[0]?.sessionId ?? null,
    phase: null,
    phaseSince: null,
    waiting: null,
    problem: null,
    lastAction: null,
    queuedPromptId: null,
    lastStop: null,
    lastPromptFromName: null,
    sessionTitle: null,
    transcriptPath: null,
    cwd: null,
    firstAt: null,
    lastEventAt: null,
    endedAt: null,
    endReason: null,
    activity: 0,
  };
  const seenPromptIds = new Set();
  const setPhase = (phase, at) => {
    if (state.phase !== phase) state.phaseSince = at;
    state.phase = phase;
  };

  for (const event of sortEvents(events)) {
    state.firstAt ??= event.at;
    state.lastEventAt = event.at;
    if (event.cwd) state.cwd = event.cwd;
    if (event.transcriptPath) state.transcriptPath = event.transcriptPath;
    if (event.event !== 'SessionEnd') state.activity += 1;

    switch (event.event) {
      case 'UserPromptSubmit':
        // A prompt carrying a prompt_id already seen in this session was queued behind a running turn.
        if (event.promptId && seenPromptIds.has(event.promptId)) state.queuedPromptId = event.promptId;
        setPhase('working', event.at);
        state.waiting = null;
        state.problem = null;
        state.lastPromptFromName = event.fromName ?? null;
        if (event.sessionTitle) state.sessionTitle = event.sessionTitle;
        break;
      case 'PostToolUse':
        setPhase('working', event.at);
        state.lastAction = { tool: event.tool, target: event.target, at: event.at };
        if (state.waiting?.kind === 'permission' && state.waiting.promptId === event.promptId && event.at >= state.waiting.since) {
          state.waiting = null;
        }
        break;
      case 'Notification':
        state.waiting = { kind: 'permission', since: event.at, promptId: event.promptId };
        break;
      case 'Stop': {
        state.lastStop = event;
        if (state.waiting?.kind === 'permission' && state.waiting.promptId === event.promptId) state.waiting = null;
        if (state.queuedPromptId && event.promptId === state.queuedPromptId) {
          // The earlier turn ended; the queued prompt still runs, so the session keeps working.
          setPhase('working', event.at);
          break;
        }
        if (state.queuedPromptId) state.queuedPromptId = null;
        setPhase('turn-ended', event.at);
        if (event.marker) state.waiting = { kind: 'decision', since: event.at, text: event.marker, promptId: event.promptId };
        break;
      }
      case 'StopFailure':
        state.problem = event.error ?? 'unknown';
        setPhase('turn-ended', event.at);
        break;
      case 'SessionEnd':
        setPhase('ended', event.at);
        state.waiting = null;
        state.endedAt = event.at;
        state.endReason = event.reason ?? null;
        break;
      default:
        break;
    }
    if (event.promptId) seenPromptIds.add(event.promptId);
  }
  return state;
}
