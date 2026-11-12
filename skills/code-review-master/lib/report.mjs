import { blobLink } from './links.mjs';

const SEVERITY_LABEL = { blocking: 'BLOKUJĄCE', suggestion: 'sugestia', nitpick: 'drobiazg' };
const CODEX_LABEL = { confirms: 'codex: potwierdza', rejects: 'codex: odrzuca (sporne)', unsure: 'codex: bez zdania',
  own: 'codex: własne znalezisko' };

// Polish plural for counts, so the header does not read like machine output.
function plural(n, one, few, many) {
  if (n === 1) return one;
  const last = n % 10;
  const lastTwo = n % 100;
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return few;
  return many;
}

// Full 40-character hashes push the interesting part of the line off the eye's
// path; seven characters is what git itself shows and what the reader compares.
const short = (sha) => (typeof sha === 'string' && /^[0-9a-f]{40}$/.test(sha) ? sha.slice(0, 7) : sha);

const remarks = (count) => `${count} ${plural(count, 'uwaga', 'uwagi', 'uwag')}`;

// One line per finder, naming what happened. A raw enum in the report is the
// same failure as a wrong label, so an unknown status prints nothing at all
// (`not-in-mode` cannot occur in a pr/branch report; if it does, silence is
// more honest than a made-up sentence).
const CODEX_FIND_NOTE = {
  disabled: () => 'codex jako szukający wyłączony w konfiguracji.',
  unavailable: () => '**codex jako szukający niedostępny** — uwagi pochodzą tylko od pozostałych źródeł.',
  timeout: () => '**codex jako szukający przekroczył limit czasu** — uwagi pochodzą tylko od pozostałych źródeł.',
  unparsable: () => '**odpowiedź codexa jako szukającego nieczytelna** — uwagi pochodzą tylko od pozostałych źródeł.',
  // Off-axis drops are named: a finding codex gave on a file or axis outside
  // the plan is lost work, and the count is the only trace of it.
  ok: (c) => `codex jako szukający: ${remarks(c.found ?? 0)} przed weryfikacją`
    + `${c.droppedOffAxis > 0 ? `, ${c.droppedOffAxis} odrzucono jako spoza osi` : ''}.`,
};

// Only a failure Docker itself reported is blamed on Docker. A bad rule pack, a
// Semgrep crash or a dead crm child is something else, and telling the reader
// to start Docker would send them to fix what is not broken.
const DOCKER_DOWN = /error during connect|Cannot connect to the Docker daemon/i;
const dockerIsDown = (s) => s.reason === 'docker-missing'
  || (s.reason === 'docker-error' && DOCKER_DOWN.test(s.detail ?? ''));

function semgrepUnavailable(s) {
  if (s.reason === 'image-not-pulled') {
    return `**Semgrep niedostępny**: brak obrazu \`${s.image}\` — uruchom raz \`docker pull ${s.image}\`.`;
  }
  if (s.reason === 'pr-not-checked-out') return '**Semgrep pominięty**: lokalny checkout nie jest tipem PR-a.';
  const detail = s.detail ? `: \`${s.detail}\`` : '';
  if (dockerIsDown(s)) return `**Semgrep niedostępny** (Docker nie działa albo nie jest zainstalowany)${detail}.`;
  return `**Semgrep nie zadziałał**${detail}.`;
}

// Exit 0 with entries in `errors[]` means Semgrep skipped part of the scan (a
// file it could not parse, a rule that failed); "0 uwag" alone would read as clean.
const scanErrors = (n) => (n > 0
  ? ` Semgrep zgłosił ${n} ${plural(n, 'błąd', 'błędy', 'błędów')} skanowania — część plików mogła nie zostać przejrzana.`
  : '');

const SEMGREP_NOTE = {
  disabled: () => 'Semgrep wyłączony w konfiguracji.',
  'nothing-to-scan': () => 'Semgrep: żadna oś w tym przebiegu nie ma reguł.',
  unavailable: semgrepUnavailable,
  timeout: () => '**Semgrep przekroczył limit czasu.**',
  unparsable: () => '**odpowiedź Semgrepa nieczytelna** — brak uwag od Semgrepa.',
  ok: (s) => `Semgrep (osie: ${(s.scannedAxes ?? []).join(', ')}): ${remarks(s.found ?? 0)} w zmienionych liniach, `
    + `${s.outsideChange ?? 0} poza zmianą pominięto.`
    + (s.hunksAvailable === false ? ' Filtr zmienionych linii niedostępny — wyniki niefiltrowane.' : '')
    + scanErrors(s.errors ?? 0),
};

const workerDied = (f) => f?.reason === 'worker-died';
const hasFinderStep = (run) => run.mode === 'pr' || run.mode === 'branch';

function finderLines({ run, finders }) {
  if (!hasFinderStep(run)) return [];
  if (!finders) return ['**krok szukających nie został wykonany** — uwagi pochodzą tylko od agentów Sonnet.'];
  const { codexFind, semgrep } = finders;
  const died = '**proces szukających przerwał pracę**';
  if (workerDied(codexFind) && workerDied(semgrep)) {
    return [`${died} — brak uwag od codexa jako szukającego i od Semgrepa.`];
  }
  // A finder that finished before the worker died left its own status file
  // (`finders --wait`), and that result stands: only the dead one loses its line.
  return [
    workerDied(codexFind) ? `${died} — brak uwag od codexa jako szukającego.` : CODEX_FIND_NOTE[codexFind?.status]?.(codexFind),
    workerDied(semgrep) ? `${died} — brak uwag od Semgrepa.` : SEMGREP_NOTE[semgrep?.status]?.(semgrep),
  ].filter(Boolean);
}

function sourcesLine(findings) {
  const counts = { sonnet: 0, codex: 0, semgrep: 0 };
  let multi = 0;
  for (const f of findings) {
    const sources = f.sources ?? [];
    for (const s of sources) if (s in counts) counts[s] += 1;
    if (sources.length > 1) multi += 1;
  }
  return `Źródła uwag: sonnet ${counts.sonnet}, codex ${counts.codex}, semgrep ${counts.semgrep}; `
    + `wskazane przez więcej niż jedno źródło: ${multi}.`;
}

function header({ run, selection, codexStatus, incomplete, findings, finders }) {
  const chosen = selection.selected.map((s) => s.axisId);
  const total = chosen.length + selection.skippedOnTouch.length + selection.deferred.length;
  const lines = [
    `# Review — ${run.id} (tryb \`${run.mode}\`)`,
    '',
    `Zakres: \`${short(run.base) ?? '—'}\` → \`${short(run.head)}\`.`,
    `Osie w tym przebiegu: ${chosen.join(', ') || '—'} (${chosen.length} z ${total}).`,
  ];
  if (selection.skippedOnTouch.length > 0) lines.push(`Pominięte przez on-touch: ${selection.skippedOnTouch.join(', ')}.`);
  if (selection.deferred.length > 0) lines.push(`Czeka w rotacji: ${selection.deferred.join(', ')}.`);
  // `skippedFiles` is computed by lib/axes.mjs's `selectAxes` and stored as
  // `pending_files`, but until now no report ever told the reader about it —
  // a `full` audit that read 40 of 4000 files could report complete axis
  // coverage. Summing over `selection.selected` (once per slot) is what avoids
  // double-counting a file that a truncated slot's every kept entry repeats
  // in its own `truncatedFrom` metadata.
  const heldOver = selection.selected.reduce((n, s) => n + (s.skippedFiles?.length ?? 0), 0);
  if (heldOver > 0) {
    lines.push(`Ponad limit, do kolejnego przebiegu: ${heldOver} `
      + `${plural(heldOver, 'plik', 'pliki', 'plików')}. `
      + 'Ten przebieg nie objął ich w całości.');
  }
  // Three forms per noun, because Polish needs all three: 1 agent, 3 agenty,
  // 5 agentów. Collapsing "few" into "many" is the mistake that makes generated
  // Polish read like a machine wrote it.
  lines.push(`Zużycie: ${selection.agents} ${plural(selection.agents, 'agent', 'agenty', 'agentów')} `
    + `(1 brief + ${chosen.length} ${plural(chosen.length, 'oś', 'osie', 'osi')} `
    + `+ ${chosen.length} ${plural(chosen.length, 'weryfikacja', 'weryfikacje', 'weryfikacji')}).`);
  // An axis whose agent hung, crashed, or returned garbage was still paid for
  // — it must never read as covered just because nothing else went wrong.
  if (incomplete.length > 0) lines.push(`**Nie przejrzano** (agent nie zwrócił wyniku): ${incomplete.join(', ')}.`);
  // Each status says what actually happened. Telling the reader "niedostępny"
  // when codex was merely switched off reports a breakage that is not there,
  // in a document whose only job is to be trustworthy about what it checked.
  const CODEX_NOTE = {
    disabled: 'codex wyłączony w konfiguracji — uwagi nie mają drugiej opinii.',
    'nothing-to-judge': 'codex pominięty — nie było uwag do oceny.',
    skipped: '**krok codexa nie został wykonany** — uwagi nie mają drugiej opinii.',
    unavailable: '**codex niedostępny** — uwagi nie mają drugiej opinii.',
    timeout: '**codex przekroczył limit czasu** — uwagi nie mają drugiej opinii.',
    unparsable: '**odpowiedź codexa nieczytelna** — uwagi nie mają drugiej opinii.',
  };
  // The fallback is Polish too. A raw enum spliced into this report is the same
  // failure as a wrong label: the reader stops trusting the line.
  // When codex judged nothing only because every remark was its own, "nothing
  // to judge" would hide that codex did contribute — say so instead.
  const allOwn = codexStatus === 'nothing-to-judge' && findings.some((f) => f.codex?.verdict === 'own');
  if (allOwn) {
    lines.push('Uwaga: codex jako sędzia pominięty — wszystkie uwagi pochodzą od codexa jako szukającego.');
  } else if (codexStatus !== 'ok') {
    lines.push(`Uwaga: ${CODEX_NOTE[codexStatus] ?? `nieznany status codexa: \`${codexStatus}\`.`}`);
  }
  lines.push(...finderLines({ run, finders }));
  if (finders && hasFinderStep(run)) lines.push(sourcesLine(findings));
  return lines.join('\n');
}

function renderFinding(finding, prose, run, remote) {
  const text = prose[finding.id];
  const title = text ? text.title : `${finding.claim} [bez opisu]`;
  const body = text ? text.body : '';
  const link = blobLink(remote, run.head, finding.file, finding.lines);
  const where = link ? `[\`${finding.file}:${finding.lines[0]}\`](${link})` : `\`${finding.file}:${finding.lines[0]}\``;
  const badges = [`**${SEVERITY_LABEL[finding.severity]}**`, `pewność ${finding.confidence}`];
  if (finding.codex) badges.push(CODEX_LABEL[finding.codex.verdict]);
  if (finding.sources?.length > 0) badges.push(`źródło: ${finding.sources.join('+')}`);
  return [
    `### ${finding.id} — ${title}`,
    '',
    `${badges.join(' · ')} · ${where} · reguła: \`${finding.rule ?? finding.axis}\``,
    '',
    '```',
    finding.evidence,
    '```',
    '',
    body,
    finding.codex && finding.codex.fix ? `\n_Propozycja codexa:_ ${finding.codex.fix}` : '',
    ...(finding.alsoClaimed ?? []).map((c) => `\n_Też w tym miejscu (${c.source}):_ ${c.claim}`),
  ].filter((part) => part !== '').join('\n');
}

export function renderReport({ run, selection, findings, suppressed, prose, codexStatus, remote, incomplete = [], finders = null }) {
  const parts = [header({ run, selection, codexStatus, incomplete, findings, finders }), ''];
  const byAxis = new Map();
  for (const finding of findings) {
    if (!byAxis.has(finding.axis)) byAxis.set(finding.axis, []);
    byAxis.get(finding.axis).push(finding);
  }
  if (findings.length === 0) parts.push('Brak uwag przekraczających próg pewności.', '');
  for (const [axis, group] of byAxis) {
    parts.push(`## Oś: ${axis}`, '');
    for (const finding of group) parts.push(renderFinding(finding, prose, run, remote), '');
  }
  if (suppressed.length > 0) {
    parts.push('---', '',
      `Pominięto ${suppressed.length} ${plural(suppressed.length, 'uwagę wcześniej odrzuconą', 'uwagi wcześniej odrzucone', 'uwag wcześniej odrzuconych')}. `
      + 'Pełna lista: `/code-review-master ask` → `show-suppressed`.', '');
  }
  return `${parts.join('\n').trimEnd()}\n`;
}
