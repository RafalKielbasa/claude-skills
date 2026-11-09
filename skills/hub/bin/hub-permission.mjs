#!/usr/bin/env node
// Global, blocking PermissionRequest hook (spec §5, §6.1): holds a tool call until a decision typed by
// Rafal in the hub tab is verified, or until the prompt was answered in the session, the hub closed or
// the session's process is gone. It never stalls a session: every failure ends with exit code 0 and no
// output, which leaves Claude Code's normal flow. After an answer the process ends on its own, so that
// stdout flushes.
import { randomUUID } from 'node:crypto';
import { hubRoot } from '../lib/paths.mjs';
import { inputHash, toolTarget } from '../lib/events.mjs';
import { readHubSessions } from '../lib/hubsessions.mjs';
import { readEvents, recordPermissionClosed } from '../lib/registry.mjs';
import { appendApproval, appendAsk, closePending, readDecision, removeDecision, writeOutcome, writePending } from '../lib/pending.mjs';
import { hookOutput, hubRunning, laterEvent, markAnswered, nextHubWatch, passThroughReason, readJobName, sessionProcessGone, shownCall, verifyDecision } from '../lib/permission.mjs';
import { sessionAnswerCheck } from '../lib/transcript.mjs';

const POLL_MS = 500;
const CHECK_MS = 2000;
// The typed record reaches the disk only after the command has ended (spec §5): the search lasts 8 s after the decision.
const TYPED_SEARCH_MS = 8000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function readInput() {
  let raw = '';
  process.stdin.setEncoding('utf8');
  for await (const chunk of process.stdin) raw += chunk;
  const input = JSON.parse(raw);
  if (typeof input?.session_id !== 'string' || typeof input.tool_name !== 'string') throw new Error('not a hook input');
  return input;
}

// A decision file is not trusted to hold a usable time, and the log line must not fail on it.
const isoOf = (at) => {
  const date = new Date(at);
  return typeof at === 'number' && !Number.isNaN(date.getTime()) ? date.toISOString() : null;
};

// `typedAt`, `decidedAt` and `at` give the time from typing to the verdict.
const approvalLine = (record, decision, verdict) => ({
  at: verdict.at,
  code: decision.code,
  sessionId: record.sessionId,
  tool: record.tool,
  target: record.target,
  verb: decision.verb,
  accepted: verdict.accepted,
  typedAt: verdict.typedAt,
  decidedAt: isoOf(decision.at),
});
const outcomeOf = (decision, verdict, call) => ({
  accepted: verdict.accepted, verb: decision.verb, attempt: decision.attempt, reason: verdict.reason, at: verdict.at, ...(call ? { call } : {}),
});

// An accepted decision's output and log line, or null when there is nothing left to wait for.
async function waitForAnswer(root, record) {
  let hubWatch = { wasAt: Date.now(), staleMs: 0 };
  // For tests only; anything but a positive number leaves the default.
  const grace = Number(process.env.HUB_STALE_GRACE_MS);
  const graceMs = grace > 0 ? grace : undefined;
  const answeredInSession = sessionAnswerCheck(record);
  for (;;) {
    const decision = readDecision(root, record.id);
    if (decision) {
      const now = Date.now();
      const verdict = verifyDecision({ root, record, decision, now });
      if (verdict.accepted) {
        // HUB outcome reports no answer when it sees no outcome, so the outcome stands before any answer. The hook
        // marks the item itself, so a hub model turn that never runs costs the printed outcome alone, and it does so
        // while its pending record stands, so reconcile's successor keeps the answer. closePending removes the
        // decision, best effort: a failed delete cannot cost a typed approval.
        writeOutcome(root, record.id, outcomeOf(decision, verdict, [record.tool, shownCall(record)].filter(Boolean).join(' ')));
        markAnswered(root, decision.code, now);
        return { output: hookOutput(decision.verb), line: approvalLine(record, decision, verdict) };
      }
      if (verdict.reason !== 'not-typed' || now - decision.at >= TYPED_SEARCH_MS) {
        // The decision goes first, so a next attempt written on seeing the outcome is not removed with it.
        // A failed delete ends the hook here, because a decision left behind would be searched again.
        removeDecision(root, record.id);
        appendApproval(root, approvalLine(record, decision, verdict));
        writeOutcome(root, record.id, outcomeOf(decision, verdict));
      }
    }
    const roundAt = Date.now();
    if (roundAt - hubWatch.wasAt >= CHECK_MS) {
      hubWatch = nextHubWatch(hubWatch, { now: roundAt, running: hubRunning(root, roundAt), graceMs });
      if (laterEvent(readEvents(root, record.sessionId).events, record) || hubWatch.gone) return null;
      const answer = answeredInSession();
      if (answer) {
        recordPermissionClosed(root, record, answer, { id: randomUUID(), at: new Date().toISOString() });
        return null;
      }
      if (sessionProcessGone(process.env.CLAUDE_PID)) return null;
    }
    await sleep(POLL_MS);
  }
}

try {
  // A reader that closed the pipe must not turn into a failure exit.
  process.stdout.on('error', () => {});
  const input = await readInput();
  const root = hubRoot();
  const reason = passThroughReason({
    input,
    root,
    hubRunning: hubRunning(root),
    hubSessions: readHubSessions(root),
    entrypoint: process.env.CLAUDE_CODE_ENTRYPOINT,
    jobName: readJobName(process.env.CLAUDE_JOB_DIR),
  });
  if (reason === 'ask-tool') appendAsk(root, { sessionId: input.session_id, tool: input.tool_name, at: new Date().toISOString() });
  if (!reason) {
    const record = {
      id: randomUUID(),
      sessionId: input.session_id,
      promptId: input.prompt_id ?? null,
      tool: input.tool_name,
      target: toolTarget(input.tool_input),
      inputHash: inputHash(input.tool_input),
      input: input.tool_input ?? null,
      pid: process.pid,
      startedAt: Date.now(),
      transcriptPath: input.transcript_path ?? null,
    };
    writePending(root, record);
    let answer = null;
    try {
      answer = await waitForAnswer(root, record);
    } finally {
      closePending(root, record.id);
    }
    if (answer) {
      // The log line follows the write, so it cannot claim an answer that was not given. Failing to write
      // it costs the line alone: the outcome has already told Rafal.
      process.stdout.write(JSON.stringify(answer.output), (error) => {
        if (error) return;
        try {
          appendApproval(root, answer.line);
        } catch {
          // see above
        }
      });
    }
  }
} catch {
  // never block a session
}
