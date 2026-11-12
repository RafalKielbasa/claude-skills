import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderReport } from '../lib/report.mjs';

const selection = {
  selected: [{ axisId: 'security', group: null, axes: [{ id: 'security', heading: 'Security' }], files: [] }],
  skippedOnTouch: ['migrations'], deferred: ['conventions'], agents: 3, slots: 5,
};

const findings = [{
  id: 'f-01', axis: 'security', severity: 'blocking', confidence: 92,
  file: 'apps/api/a.ts', lines: [88, 94], evidence: 'findFirst({ where: { id } })',
  claim: 'query without tenant filter', rule: 'config.md#security',
  codex: { verdict: 'confirms', reason: 'no tenantId in where', fix: 'Add tenantId.' },
}];

test('the header states coverage and spend', () => {
  const md = renderReport({
    run: { id: 'r1', mode: 'since', base: '6c0b497', head: 'a1f2e30' },
    selection, findings, suppressed: [], prose: {}, codexStatus: 'ok', remote: null,
  });
  assert.match(md, /Osie w tym przebiegu: security \(1 z 3\)/);
  assert.match(md, /Pominięte przez on-touch: migrations/);
  assert.match(md, /Czeka w rotacji: conventions/);
  assert.match(md, /Zużycie: 3 agenty \(1 brief \+ 1 oś \+ 1 weryfikacja\)/);
});

test('a finding shows severity, location, quote and the codex verdict', () => {
  const md = renderReport({
    run: { id: 'r1', mode: 'since', base: 'x', head: 'y' },
    selection, findings, suppressed: [],
    prose: { 'f-01': { title: 'Zapytanie o kurs bez filtra tenanta', body: 'CoursesService.findOne woła findFirst z samym id.' } },
    codexStatus: 'ok', remote: 'git@github.com:R/app.git',
  });
  assert.match(md, /Zapytanie o kurs bez filtra tenanta/);
  assert.match(md, /apps\/api\/a\.ts:88/);
  assert.match(md, /findFirst\(\{ where: \{ id \} \}\)/);
  assert.match(md, /codex: potwierdza/);
  assert.match(md, /https:\/\/github\.com\/R\/app\/blob\/y\/apps\/api\/a\.ts#L88-L94/);
});

test('a finding with no prose is marked rather than dropped', () => {
  const md = renderReport({
    run: { id: 'r1', mode: 'since', base: 'x', head: 'y' },
    selection, findings, suppressed: [], prose: {}, codexStatus: 'ok', remote: null,
  });
  assert.match(md, /\[bez opisu\]/);
});

test('suppressed findings are counted in the footer', () => {
  const md = renderReport({
    run: { id: 'r1', mode: 'since', base: 'x', head: 'y' },
    selection, findings: [], suppressed: [{ id: 'x', reason: 'public by design' }],
    prose: {}, codexStatus: 'unavailable', remote: null,
  });
  assert.match(md, /Pominięto 1 uwagę wcześniej odrzuconą/);
  assert.match(md, /codex niedostępny/);
});

// `truncatedFrom`, `skippedFiles` and `selection.truncated` were computed by
// lib/axes.mjs and stored as `pending_files`, but nothing ever told the
// reader — a `full` audit that read 40 of 4000 files could report complete
// axis coverage.
test('a truncated selection tells the reader how much was held over', () => {
  const truncatedSelection = {
    ...selection,
    selected: [{ ...selection.selected[0], skippedFiles: ['a.ts', 'b.ts', 'c.ts'] }],
  };
  const md = renderReport({
    run: { id: 'r1', mode: 'since', base: 'x', head: 'y' },
    selection: truncatedSelection, findings: [], suppressed: [], prose: {}, codexStatus: 'ok', remote: null,
  });
  assert.match(md, /Ponad limit, do kolejnego przebiegu: 3 pliki\./);
});

test('a selection with nothing held over says nothing about it', () => {
  const md = renderReport({
    run: { id: 'r1', mode: 'since', base: 'x', head: 'y' },
    selection, findings: [], suppressed: [], prose: {}, codexStatus: 'ok', remote: null,
  });
  assert.equal(/Ponad limit/.test(md), false);
});

// An axis that was paid for and produced nothing must never read as covered
// just because "Osie w tym przebiegu" already lists it.
test('an axis whose agent never returned is named as not reviewed', () => {
  const md = renderReport({
    run: { id: 'r1', mode: 'since', base: 'x', head: 'y' },
    selection, findings: [], suppressed: [], prose: {}, codexStatus: 'ok', remote: null,
    incomplete: ['security'],
  });
  assert.match(md, /\*\*Nie przejrzano\*\* \(agent nie zwrócił wyniku\): security\./);
});

// A report that cries breakage when nothing is broken teaches its reader to
// stop believing the header.
test('each codex outcome is named for what it was', () => {
  const render = (codexStatus) => renderReport({
    run: { id: 'r1', mode: 'since', base: 'x', head: 'y' },
    selection, findings: [], suppressed: [], prose: {}, codexStatus, remote: null,
  });
  assert.match(render('disabled'), /codex wyłączony w konfiguracji/);
  assert.match(render('nothing-to-judge'), /nie było uwag do oceny/);
  assert.match(render('timeout'), /przekroczył limit czasu/);
  assert.match(render('unparsable'), /nieczytelna/);
  assert.match(render('skipped'), /krok codexa nie został wykonany/);
  assert.match(render('something-new'), /nieznany status codexa/);
  assert.equal(/codex: /.test(render('something-new')), false, 'no raw enum reaches a Polish report');
  assert.equal(/Uwaga:/.test(render('ok')), false, 'a working codex earns no note at all');
});

// ---- extra finders (codex as a finder, Semgrep) ----

const prRun = { id: 'r1', mode: 'pr', base: 'x', head: 'y' };
const okSemgrep = {
  status: 'ok', found: 2, scannedAxes: ['security', 'conventions'], outsideChange: 3,
  hunksAvailable: true, image: 'semgrep/semgrep:1',
};
const okCodex = { status: 'ok', found: 4, droppedOffAxis: 0 };
const renderPr = (finders, extra = {}) => renderReport({
  run: prRun, selection, findings, suppressed: [], prose: {}, codexStatus: 'ok', remote: null,
  finders, ...extra,
});
const RAW_ENUM = /\b(unavailable|timeout|unparsable|not-in-mode)\b/;

test('each finder outcome is named for what it was', () => {
  const image = 'semgrep/semgrep:1';
  const codexCases = [
    [{ status: 'ok', found: 4 }, 'codex jako szukający: 4 uwagi przed weryfikacją.'],
    [{ status: 'ok', found: 1 }, 'codex jako szukający: 1 uwaga przed weryfikacją.'],
    [{ status: 'ok', found: 5 }, 'codex jako szukający: 5 uwag przed weryfikacją.'],
    [{ status: 'disabled' }, 'codex jako szukający wyłączony w konfiguracji.'],
    [{ status: 'unavailable' }, '**codex jako szukający niedostępny** — uwagi pochodzą tylko od pozostałych źródeł.'],
    [{ status: 'timeout' }, '**codex jako szukający przekroczył limit czasu** — uwagi pochodzą tylko od pozostałych źródeł.'],
    [{ status: 'timeout', reason: 'worker-deadline' }, '**codex jako szukający przekroczył limit czasu** — uwagi pochodzą tylko od pozostałych źródeł.'],
    [{ status: 'unparsable' }, '**odpowiedź codexa jako szukającego nieczytelna** — uwagi pochodzą tylko od pozostałych źródeł.'],
  ];
  for (const [codexFind, line] of codexCases) {
    const md = renderPr({ codexFind, semgrep: { status: 'disabled' } });
    assert.ok(md.includes(line), `missing: ${line}`);
    assert.equal(RAW_ENUM.test(md), false, `raw enum in: ${line}`);
  }
  const semgrepCases = [
    [okSemgrep, 'Semgrep (osie: security, conventions): 2 uwagi w zmienionych liniach, 3 poza zmianą pominięto.'],
    [{ ...okSemgrep, hunksAvailable: false },
      'Semgrep (osie: security, conventions): 2 uwagi w zmienionych liniach, 3 poza zmianą pominięto. Filtr zmienionych linii niedostępny — wyniki niefiltrowane.'],
    [{ status: 'nothing-to-scan' }, 'Semgrep: żadna oś w tym przebiegu nie ma reguł.'],
    [{ status: 'disabled' }, 'Semgrep wyłączony w konfiguracji.'],
    [{ status: 'unavailable', reason: 'image-not-pulled', image },
      `**Semgrep niedostępny**: brak obrazu \`${image}\` — uruchom raz \`docker pull ${image}\`.`],
    [{ status: 'unavailable', reason: 'pr-not-checked-out' }, '**Semgrep pominięty**: lokalny checkout nie jest tipem PR-a.'],
    [{ status: 'unavailable', reason: 'docker-missing', detail: 'spawn docker ENOENT' },
      '**Semgrep niedostępny** (Docker nie działa albo nie jest zainstalowany): `spawn docker ENOENT`.'],
    [{ status: 'unavailable', reason: 'docker-error' },
      '**Semgrep niedostępny** (Docker nie działa albo nie jest zainstalowany).'],
    [{ status: 'timeout' }, '**Semgrep przekroczył limit czasu.**'],
    [{ status: 'timeout', reason: 'worker-deadline' }, '**Semgrep przekroczył limit czasu.**'],
    [{ status: 'unparsable' }, '**odpowiedź Semgrepa nieczytelna** — brak uwag od Semgrepa.'],
    [{ status: 'unparsable', detail: 'bad json' }, '**odpowiedź Semgrepa nieczytelna** — brak uwag od Semgrepa.'],
  ];
  for (const [semgrep, line] of semgrepCases) {
    const md = renderPr({ codexFind: { status: 'disabled' }, semgrep });
    assert.ok(md.includes(line), `missing: ${line}`);
    assert.equal(RAW_ENUM.test(md), false, `raw enum in: ${line}`);
  }
});

test('a finder that died replaces both finder lines with one', () => {
  const died = '**proces szukających przerwał pracę** — brak uwag od codexa jako szukającego i od Semgrepa.';
  for (const finders of [
    { codexFind: { status: 'unavailable', reason: 'worker-died' }, semgrep: okSemgrep },
    { codexFind: okCodex, semgrep: { status: 'unavailable', reason: 'worker-died' } },
  ]) {
    const md = renderPr(finders);
    assert.equal(md.split(died).length - 1, 1);
    assert.equal(/codex jako szukający|Semgrep \(osie|Semgrep niedostępny/.test(md), false);
  }
});

test('a not-in-mode finder prints nothing', () => {
  const md = renderPr({ codexFind: { status: 'not-in-mode' }, semgrep: { status: 'not-in-mode' } });
  assert.equal(/not-in-mode|szukając|Semgrep/.test(md), false);
});

test('a finding shows its sources and what else was claimed at that place', () => {
  const md = renderReport({
    run: prRun, selection, suppressed: [], prose: {}, codexStatus: 'ok', remote: null,
    finders: { codexFind: okCodex, semgrep: okSemgrep },
    findings: [{
      ...findings[0], sources: ['sonnet', 'codex'],
      alsoClaimed: [{ source: 'sonnet', claim: 'missing check', severity: 'suggestion', fix: 'x' }],
    }],
  });
  assert.match(md, /źródło: sonnet\+codex/);
  assert.match(md, /_Też w tym miejscu \(sonnet\):_ missing check/);
});

test('the sources line counts kept findings once per source', () => {
  const md = renderReport({
    run: prRun, selection, suppressed: [], prose: {}, codexStatus: 'ok', remote: null,
    finders: { codexFind: okCodex, semgrep: okSemgrep },
    findings: [
      { ...findings[0], id: 'f-01', sources: ['sonnet', 'codex'] },
      { ...findings[0], id: 'f-02', sources: ['semgrep'] },
      { ...findings[0], id: 'f-03', sources: ['sonnet'] },
    ],
  });
  assert.match(md, /Źródła uwag: sonnet 2, codex 1, semgrep 1; wskazane przez więcej niż jedno źródło: 1\./);
});

test('codex own finding is not labelled as confirmed', () => {
  const md = renderReport({
    run: prRun, selection, suppressed: [], prose: {}, codexStatus: 'ok', remote: null,
    findings: [{ ...findings[0], sources: ['codex'], codex: { verdict: 'own', reason: 'r', fix: '' } }],
  });
  assert.match(md, /codex: własne znalezisko/);
  assert.equal(md.includes('codex: potwierdza'), false);
});

test('codex as judge is skipped when all remarks are its own', () => {
  const md = renderReport({
    run: prRun, selection, suppressed: [], prose: {}, codexStatus: 'nothing-to-judge', remote: null,
    findings: [{ ...findings[0], sources: ['codex'], codex: { verdict: 'own', reason: 'r', fix: '' } }],
  });
  assert.match(md, /codex jako sędzia pominięty — wszystkie uwagi pochodzą od codexa jako szukającego\./);
  assert.equal(md.includes('nie było uwag do oceny'), false);
});

test('a working-mode report says nothing about finders', () => {
  const md = renderReport({
    run: { id: 'r1', mode: 'working', base: 'x', head: 'y' },
    selection, findings, suppressed: [], prose: {}, codexStatus: 'ok', remote: null, finders: null,
  });
  assert.equal(md.includes('szukając'), false);
  assert.equal(md.includes('Źródła uwag'), false);
});

test('a pr report whose finders never ran says so', () => {
  const md = renderPr(null);
  assert.match(md, /\*\*krok szukających nie został wykonany\*\* — uwagi pochodzą tylko od agentów Sonnet\./);
});
