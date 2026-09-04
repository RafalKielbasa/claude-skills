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
