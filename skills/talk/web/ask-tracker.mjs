// Tracks ask_claude calls so an answer lost to an interruption can be resent. No DOM, no globals:
// the page imports it and Node tests import it directly.
//
// An interruption while an ask is pending loses the tool result. Each ask keeps its own mark; the
// answer of an interrupted ask is resent only when no other ask is still pending (a re-issued ask
// joins the first in the bridge and delivers the answer itself) and the same request was not already
// answered by an uninterrupted call.
export function createAskTracker() {
  const pending = new Set();
  const delivered = new Set();
  return {
    start(request) {
      const ask = { request, interrupted: false };
      pending.add(ask);
      // A new ask with a text answered earlier must not be suppressed.
      delivered.delete(request);
      return ask;
    },
    interrupted() {
      for (const ask of pending) ask.interrupted = true;
    },
    answered(ask, answer) {
      pending.delete(ask);
      if (!ask.interrupted) {
        delivered.add(ask.request);
        return { resend: false, text: answer };
      }
      if (pending.size === 0 && !delivered.has(ask.request)) {
        return { resend: true, text: `Odpowiedź Claude na pytanie „${ask.request}”, której nie usłyszałeś: ${answer}` };
      }
      return { resend: false, text: answer };
    },
  };
}
