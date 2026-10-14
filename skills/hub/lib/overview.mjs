// The overview table (spec §5.6): project, session, state, since, last action, waiting for, raw
// `state`. Excludes the hub itself, SessionEnd-only logs, /clear predecessors and sessions ended
// more than 24 hours ago.
import { readEvents, listSessionIds } from './registry.mjs';
import { deriveSession } from './derive.mjs';
import { readPolls, lastOkPoll, pollEntry, isVanished } from './polls.mjs';
import { displayState, linkContinuations } from './display.mjs';
import { loadAliases, aliasErrors, projectFor, gitCommonDir } from './projects.mjs';
import { refreshHubSessions } from './hubsessions.mjs';
import { readJudgments, judgmentFor } from './judgments.mjs';

const DAY_MS = 24 * 60 * 60 * 1000;

export function deriveAll(root) {
  return listSessionIds(root).map((sessionId) => deriveSession(readEvents(root, sessionId).events));
}

export function buildOverview(root, { now = Date.now(), commonDirOf = gitCommonDir } = {}) {
  const derivedList = linkContinuations(deriveAll(root).filter((d) => d.sessionId));
  const polls = readPolls(root);
  const lastPoll = polls[polls.length - 1] ?? null;
  const okPoll = lastOkPoll(polls);
  const { aliases, errors: aliasLoadErrors } = loadAliases(root);
  const hubData = refreshHubSessions(root, derivedList);
  const hubIds = new Set(hubData.hub);
  const launched = new Map(hubData.launched.map((item) => [item.sessionId, item]));
  const judgments = readJudgments(root);

  const rows = [];
  for (const derived of derivedList) {
    if (hubIds.has(derived.sessionId) || derived.continuedTo || derived.activity === 0) continue;
    if (derived.phase === 'ended' && now - Date.parse(derived.endedAt) > DAY_MS) continue;
    const entry = pollEntry(okPoll, derived.sessionId);
    const shown = displayState(derived, {
      entry,
      vanished: derived.phase !== 'ended' && isVanished(polls, derived.sessionId, derived.firstAt),
      now,
      judgment: derived.lastStop ? judgmentFor(judgments, derived.sessionId, derived.lastStop.id) : null,
    });
    rows.push({
      project: projectFor(derived.cwd, aliases, commonDirOf),
      sessionId: derived.sessionId,
      name: derived.sessionTitle || entry?.name || '',
      kind: launched.get(derived.sessionId)?.kind ?? entry?.kind ?? '',
      state: shown.label,
      detail: shown.detail ?? '',
      judge: Boolean(shown.judge),
      since: shown.since ?? '',
      lastAction: derived.lastAction ? `${derived.lastAction.tool} ${derived.lastAction.target}`.trim() : '',
      waitingFor: derived.waiting?.kind === 'decision' ? derived.waiting.text : derived.waiting?.kind === 'permission' ? 'permission' : '',
      rawState: entry?.state ?? '',
      continuedFrom: derived.continuedFrom ?? null,
      lastStop: derived.lastStop?.lastFile ?? null,
    });
  }
  rows.sort((a, b) => a.project.localeCompare(b.project) || String(b.since).localeCompare(String(a.since)));
  return {
    rows,
    pollError: lastPoll && !lastPoll.ok ? lastPoll.error : null,
    configErrors: [
      ...[...aliasLoadErrors, ...aliasErrors(aliases)].map((error) => `projects.json: ${error}`),
      ...(hubData.error ? [`hub-sessions.json: ${hubData.error}`] : []),
    ],
  };
}

const cell = (value) => String(value ?? '').replace(/\|/g, '\\|').replace(/\s+/g, ' ');

export function renderOverview({ rows, pollError, configErrors }) {
  const lines = ['| Project | Session | State | Since | Last action | Waiting for | Raw state |', '|---|---|---|---|---|---|---|'];
  for (const row of rows) {
    const session = `${row.sessionId.slice(0, 8)}${row.name ? ` ${row.name}` : ''}${row.continuedFrom ? ` (after /clear of ${row.continuedFrom.slice(0, 8)})` : ''}`;
    const state = `${row.state}${row.detail && row.state !== 'waiting for decision' ? `: ${row.detail}` : ''}${row.judge ? ' (judge)' : ''}`;
    lines.push(`| ${[row.project, session, state, row.since.slice(0, 19).replace('T', ' '), row.lastAction, row.waitingFor, row.rawState].map(cell).join(' | ')} |`);
  }
  if (pollError) lines.push('', `Last poll of claude agents --json failed: ${pollError}`);
  for (const error of configErrors) lines.push('', error);
  return lines.join('\n');
}
