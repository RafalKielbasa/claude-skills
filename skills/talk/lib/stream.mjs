// stream-json framing for a `claude -p --input-format stream-json` fork.

export function userLine(text) {
  return `${JSON.stringify({ type: 'user', message: { role: 'user', content: [{ type: 'text', text }] } })}\n`;
}

// A turn ends on the `result` line; its `result` string is the turn's final text.
export function createTurnCollector() {
  return {
    push(line) {
      let msg;
      try { msg = JSON.parse(line); } catch { return null; }
      if (msg?.type !== 'result') return null;
      if (msg.num_turns === 0) return null; // an empty bookkeeping result, not a turn
      return { text: msg.result ?? '', subtype: msg.subtype ?? '' };
    },
  };
}
