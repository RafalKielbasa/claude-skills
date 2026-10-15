// The overview table (spec §5.6): project, session, state, since, last action, waiting for, raw
// `state`. Excludes the hub itself, SessionEnd-only logs, /clear predecessors and sessions ended
// more than 24 hours ago.
import { readEvents, listSessionIds } from './registry.mjs';
import { deriveSession } from './derive.mjs';
import { readPolls, lastOkPoll, pollEntry, isVanished } from './polls.mjs';
import { displayState, linkContinuations } from './display.mjs';
import { loadProjectMap, projectOf, gitCommonDir } from './projects.mjs';
import { refreshHubSessions } from './hubsessions.mjs';
import { readJudgments, judgmentFor } from './judgments.mjs';
import { resolveTitles } from './titles.mjs';

const DAY_MS = 24 * 60 * 60 * 1000;

export function deriveAll(root) {
  return listSessionIds(root).map((sessionId) => deriveSession(readEvents(root, sessionId).events));
}

export function buildOverview(root, { now = Date.now(), commonDirOf = gitCommonDir } = {}) {
  const derivedList = linkContinuations(deriveAll(root).filter((d) => d.sessionId));
  const polls = readPolls(root);
  const lastPoll = polls[polls.length - 1] ?? null;
  const okPoll = lastOkPoll(polls);
  const { projects, errors: mapLoadErrors } = loadProjectMap(root);
  const hubData = refreshHubSessions(root, derivedList);
  const hubIds = new Set(hubData.hub);
  const launched = new Map(hubData.launched.map((item) => [item.sessionId, item]));
  const judgments = readJudgments(root);

  const visible = derivedList.filter((derived) => !hubIds.has(derived.sessionId) && !derived.continuedTo && derived.activity > 0
    && !(derived.phase === 'ended' && now - Date.parse(derived.endedAt) > DAY_MS));
  const titles = resolveTitles(root, visible.map((derived) => ({ sessionId: derived.sessionId, transcriptPath: derived.transcriptPath })));

  const rows = [];
  for (const derived of visible) {
    const entry = pollEntry(okPoll, derived.sessionId);
    const shown = displayState(derived, {
      entry,
      vanished: derived.phase !== 'ended' && isVanished(polls, derived.sessionId, derived.firstAt),
      now,
      judgment: derived.lastStop ? judgmentFor(judgments, derived.sessionId, derived.lastStop.id) : null,
    });
    const project = projectOf(derived.cwd, projects, commonDirOf);
    rows.push({
      project: project.key,
      projectName: project.name,
      mapped: project.mapped,
      sessionId: derived.sessionId,
      // Display only (spec §5.1): the transcript title, then session_title, then the poll name.
      // The poll name stays the SendMessage address, which `prepare` prints.
      name: titles.get(derived.sessionId) || derived.sessionTitle || entry?.name || '',
      kind: launched.get(derived.sessionId)?.kind ?? entry?.kind ?? '',
      launchedKind: launched.get(derived.sessionId)?.kind ?? null,
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
  rows.sort((a, b) => a.projectName.localeCompare(b.projectName) || String(b.since).localeCompare(String(a.since)));
  return {
    rows,
    pollError: lastPoll && !lastPoll.ok ? lastPoll.error : null,
    configErrors: [
      ...mapLoadErrors.map((error) => `projects.json: ${error}`),
      ...(hubData.error ? [`hub-sessions.json: ${hubData.error}`] : []),
    ],
  };
}

const cell = (value) => String(value ?? '').replace(/\|/g, '\\|').replace(/\s+/g, ' ');

// Event times are UTC; the overview shows them in local time (finding A2). The offset is a
// parameter so tests do not depend on the machine's time zone.
export function localTime(iso, offsetMinutes = iso ? -new Date(iso).getTimezoneOffset() : 0) {
  const ms = Date.parse(iso ?? '');
  if (Number.isNaN(ms)) return String(iso ?? '');
  return new Date(ms + offsetMinutes * 60000).toISOString().slice(0, 19).replace('T', ' ');
}

export function renderOverview({ rows, pollError, configErrors }) {
  const lines = ['| Project | Session | State | Since | Last action | Waiting for | Raw state |', '|---|---|---|---|---|---|---|'];
  for (const row of rows) {
    const session = `${row.sessionId.slice(0, 8)}${row.name ? ` ${row.name}` : ''}${row.launchedKind ? ` [${row.launchedKind}]` : ''}${row.continuedFrom ? ` (after /clear of ${row.continuedFrom.slice(0, 8)})` : ''}`;
    const state = `${row.state}${row.detail && row.state !== 'waiting for decision' ? `: ${row.detail}` : ''}${row.judge ? ' (judge)' : ''}`;
    const project = row.mapped ? row.projectName : `${row.projectName} (outside the map)`;
    lines.push(`| ${[project, session, state, localTime(row.since), row.lastAction, row.waitingFor, row.rawState].map(cell).join(' | ')} |`);
  }
  if (pollError) lines.push('', `Last poll of claude agents --json failed: ${pollError}`);
  for (const error of configErrors) lines.push('', error);
  return lines.join('\n');
}
