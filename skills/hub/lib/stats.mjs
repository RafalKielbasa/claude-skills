// The numbers of the spoken alerts (spec §10), to compare with the baseline of 2026-10-26..2026-11-04 a
// week after installation. Pure: alert-log lines and sessions' events in, numbers out; `renderStats` prints
// them next to the baseline, row for row. Days and hours are of the local clock.
import { isDialogName } from './waits.mjs';

export const BASELINE_SPEC_PATH = 'D:/Notatki/notatki/.claude/specs/2026-11-05-hub-approvals-voice-alerts-design.md';

// Spec §10, as text so the two read side by side.
export const BASELINE = {
  total: '635, ok. 71 na dzień',
  perHour: 'mediana 5, p90 11, maks. 23',
  share: 'Baza wiedzy ok. 40%',
  typedLast: '42%; 93 z nich z odpowiedzią w 5 min',
  gates: 'do 1 min 19%, 1–5 min 31%, 5–30 min 27%, ponad 30 min 18%, brak 4%',
  permissions: 'do 1 min 75%, 1–5 min 16%, 5–30 min 5%, ponad 30 min 4%',
  walks: 'ostatnie 24 h: mediana 4, maks. 7; wszystkie: mediana 10, maks. 13',
};

const MIN = 60 * 1000;
const toMs = (value) => (typeof value === 'number' ? value : Date.parse(value));

// Median of the sorted values: the mean of the two middle ones for an even count.
function median(sorted) {
  if (sorted.length === 0) return 0;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

// Nearest rank.
function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1))];
}

const dayKey = (ms) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};
const hourKey = (ms) => `${dayKey(ms)}-${new Date(ms).getHours()}`;

function bucketOf(gap) {
  if (gap < MIN) return 'under1';
  if (gap < 5 * MIN) return 'to5';
  if (gap < 30 * MIN) return 'to30';
  return 'over30';
}

function shares(values, keys, denominator) {
  const counts = Object.fromEntries(keys.map((key) => [key, 0]));
  for (const value of values) counts[value] += 1;
  return Object.fromEntries(keys.map((key) => [key, denominator ? counts[key] / denominator : 0]));
}

// `sessions`: [{ sessionId, events, hub, dialog }]. `since`: 'YYYY-MM-DD' (local midnight) or null.
export function alertStats({ alerts, sessions, since }) {
  const sinceMs = since ? new Date(`${since}T00:00:00`).getTime() : -Infinity;
  const skipped = new Set(sessions.filter((s) => s.hub || s.dialog).map((s) => s.sessionId));
  const inRange = alerts.filter((line) => toMs(line.at) >= sinceMs);
  const spoken = inRange
    .filter((line) => line.type === 'alert' && !skipped.has(line.sessionId) && !isDialogName(line.name))
    .map((line) => ({ ...line, at: toMs(line.at) }));
  const walkLines = inRange.filter((line) => line.type === 'walk');

  const days = new Set(spoken.map((line) => dayKey(line.at)));
  const perHourCounts = new Map();
  for (const line of spoken) perHourCounts.set(hourKey(line.at), (perHourCounts.get(hourKey(line.at)) ?? 0) + 1);
  const hours = [...perHourCounts.values()].sort((a, b) => a - b);

  const byProject = new Map();
  for (const line of spoken) byProject.set(line.project ?? '?', (byProject.get(line.project ?? '?') ?? 0) + 1);
  const projectShares = [...byProject].map(([project, count]) => ({ project, count, share: count / spoken.length }))
    .sort((a, b) => b.count - a.count || a.project.localeCompare(b.project));

  // Prompts Rafal typed himself: the hub's own sessions and dialog forks do not count.
  const own = sessions.filter((s) => !s.hub && !s.dialog);
  const prompts = own.flatMap((s) => s.events.filter((e) => e.event === 'UserPromptSubmit' && Number.isFinite(toMs(e.at))).map((e) => ({ sessionId: s.sessionId, at: toMs(e.at) })))
    .sort((a, b) => a.at - b.at);
  const eventsOf = new Map(sessions.map((s) => [s.sessionId, s.events.map((e) => ({ event: e.event, at: toMs(e.at) })).filter((e) => Number.isFinite(e.at)).sort((a, b) => a.at - b.at)]));
  const nextAfter = (sessionId, at, accept) => (eventsOf.get(sessionId) ?? []).find((e) => e.at > at && accept(e.event))?.at ?? null;

  let typed = 0;
  let answeredIn5 = 0;
  for (const line of spoken) {
    let last = null;
    for (const prompt of prompts) {
      if (prompt.at >= line.at) break;
      last = prompt;
    }
    if (last?.sessionId !== line.sessionId) continue;
    typed += 1;
    const next = nextAfter(line.sessionId, line.at, (name) => name === 'UserPromptSubmit');
    if (next !== null && next - line.at <= 5 * MIN) answeredIn5 += 1;
  }

  // Gates and permissions are measured from the sessions' own events over the window, not from the alerts, as
  // the baseline replayed every wait: a gate answered in 30 s never got an alert.
  const gateGaps = [];
  const permGaps = [];
  let permNone = 0;
  for (const s of own) {
    for (const gate of s.events.filter((e) => e.event === 'Stop' && e.marker && toMs(e.at) >= sinceMs)) {
      const next = nextAfter(s.sessionId, toMs(gate.at), (name) => name === 'UserPromptSubmit');
      gateGaps.push(next === null ? null : next - toMs(gate.at));
    }
    for (const note of s.events.filter((e) => e.event === 'Notification' && e.kind === 'permission_prompt' && toMs(e.at) >= sinceMs)) {
      const next = nextAfter(s.sessionId, toMs(note.at), (name) => name !== 'Notification');
      if (next === null) permNone += 1;
      else permGaps.push(next - toMs(note.at));
    }
  }
  const gateBuckets = shares(gateGaps.map((gap) => (gap === null ? 'none' : bucketOf(gap))), ['under1', 'to5', 'to30', 'over30', 'none'], gateGaps.length);

  const waitingSorted = walkLines.map((line) => line.waiting).filter((n) => Number.isFinite(n)).sort((a, b) => a - b);

  return {
    since: since ?? null,
    total: spoken.length,
    activeDays: days.size,
    perDay: days.size ? spoken.length / days.size : 0,
    perHour: { median: median(hours), p90: percentile(hours, 0.9), max: hours.length ? hours[hours.length - 1] : 0 },
    shares: projectShares,
    typedLast: { count: typed, share: spoken.length ? typed / spoken.length : 0, answeredIn5 },
    gates: { total: gateGaps.length, buckets: gateBuckets },
    permissions: {
      total: permGaps.length,
      none: permNone,
      buckets: shares(permGaps.map(bucketOf), ['under1', 'to5', 'to30', 'over30'], permGaps.length),
    },
    walks: { count: waitingSorted.length, median: median(waitingSorted), max: waitingSorted.length ? waitingSorted[waitingSorted.length - 1] : 0 },
  };
}

const pct = (share) => `${Math.round(share * 100)}%`;
const number = (value) => (Number.isInteger(value) ? String(value) : value.toFixed(1));
const bucketText = (b, withNone) => `do 1 min ${pct(b.under1)}, 1–5 min ${pct(b.to5)}, 5–30 min ${pct(b.to30)}, ponad 30 min ${pct(b.over30)}${withNone ? `, brak ${pct(b.none)}` : ''}`;

export function renderStats(stats) {
  const bazaWiedzy = stats.shares.find((row) => row.project === 'Baza wiedzy');
  const rows = [
    ['Alerty łącznie', `${stats.total}, ok. ${number(stats.perDay)} na dzień (dni z alertem: ${stats.activeDays})`, BASELINE.total],
    ['Alerty na godzinę z co najmniej jednym', `mediana ${number(stats.perHour.median)}, p90 ${number(stats.perHour.p90)}, maks. ${number(stats.perHour.max)}`, BASELINE.perHour],
    ['Udział z Baza wiedzy', bazaWiedzy ? `ok. ${pct(bazaWiedzy.share)}` : 'brak', BASELINE.share],
    ['Alerty o sesji, w której wpisał ostatnio', `${pct(stats.typedLast.share)}; ${stats.typedLast.answeredIn5} z nich z odpowiedzią w 5 min`, BASELINE.typedLast],
    [`Decyzje (${stats.gates.total}), czas do następnego promptu`, bucketText(stats.gates.buckets, true), BASELINE.gates],
    [`Uprawnienia (${stats.permissions.total}${stats.permissions.none ? `, bez następnego zdarzenia: ${stats.permissions.none}` : ''}), czas do następnego zdarzenia`, bucketText(stats.permissions.buckets, false), BASELINE.permissions],
    [`Przeglądy „wracam” (${stats.walks.count}), czekało na starcie`, `mediana ${number(stats.walks.median)}, maks. ${number(stats.walks.max)}`, BASELINE.walks],
  ];
  const lines = [
    `Alerty głosowe${stats.since ? ` od ${stats.since}` : ' (całość)'}, bez sesji huba i rozgałęzień rozmów.`,
    `Baseline: spec §10 „Measures and the week-one review”, ${BASELINE_SPEC_PATH}`,
    '(26.10–04.11.2026, 9 dni z alertem, odtworzenie dawnych zdarzeń sprzed huba.)',
    '',
    '| Miara | Teraz | Baseline |',
    '|---|---|---|',
    ...rows.map(([label, now, base]) => `| ${label} | ${now} | ${base} |`),
    '',
    'Decyzje i uprawnienia liczone ze zdarzeń sesji w całym oknie (także te bez alertu), tak jak baseline; wiersz o odpowiedzi w 5 min liczony od chwili alertu. Wiersza „uprawnienia w trakcie przerwy” nie ma: dziennik nie zapisuje przerw.',
  ];
  return lines.join('\n');
}
