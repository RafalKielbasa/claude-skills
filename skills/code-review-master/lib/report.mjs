import { blobLink } from './links.mjs';

const SEVERITY_LABEL = { blocking: 'BLOKUJĄCE', suggestion: 'sugestia', nitpick: 'drobiazg' };
const CODEX_LABEL = { confirms: 'codex: potwierdza', rejects: 'codex: odrzuca (sporne)', unsure: 'codex: bez zdania' };

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

function header({ run, selection, codexStatus, incomplete }) {
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
  if (codexStatus !== 'ok') {
    lines.push(`Uwaga: ${CODEX_NOTE[codexStatus] ?? `nieznany status codexa: \`${codexStatus}\`.`}`);
  }
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
  ].filter((part) => part !== '').join('\n');
}

export function renderReport({ run, selection, findings, suppressed, prose, codexStatus, remote, incomplete = [] }) {
  const parts = [header({ run, selection, codexStatus, incomplete }), ''];
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
