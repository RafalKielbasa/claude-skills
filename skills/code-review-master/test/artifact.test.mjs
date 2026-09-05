import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { embedJson } from '../lib/embed.mjs';
import { makeRepo } from '../test-helpers/repo.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const CLI = join(HERE, '..', 'bin', 'crm.mjs');
const TEXT = readFileSync(join(HERE, '..', 'templates', 'artifact.html'), 'utf8');

test('the template carries a title and the data placeholder', () => {
  assert.match(TEXT, /<title>[^<]+<\/title>/);
  assert.match(TEXT, /id="findings"/);
  assert.match(TEXT, /\{\{DATA\}\}/);
});

// A hardcoded title would name every repository's artifact identically in the
// gallery, and the `Artifact` tool never overrides a `<title>` a file already
// carries — so a fixed one here would also make the publisher's own `title`
// parameter permanently inert. `crm artifact` fills this the same way it
// fills `{{DATA}}`.
test('the title is a per-repository placeholder, never hardcoded text', () => {
  assert.match(TEXT, /<title>\{\{TITLE\}\}<\/title>/);
});

test('it defines light and dark palettes without a document-level fetch', () => {
  assert.match(TEXT, /prefers-color-scheme: dark/);
  assert.match(TEXT, /\[data-theme="dark"\]/);
  assert.equal(/fetch\(|XMLHttpRequest|<script src=/.test(TEXT), false, 'no external loads — CSP blocks them');
});

test('it filters by axis and severity', () => {
  assert.match(TEXT, /data-filter="axis"/);
  assert.match(TEXT, /data-filter="severity"/);
});

// The page — the output a user may share with someone else — used to claim
// coverage raport.md correctly disclaimed: no `--incomplete` flag on `crm
// artifact`, and no rendering of either honesty marker in the template.
test('the template renders an incomplete-axis note, a codex-status note and a truncation note', () => {
  assert.match(TEXT, /id="incomplete-line"/);
  assert.match(TEXT, /id="codex-line"/);
  assert.match(TEXT, /id="truncated-line"/);
  assert.match(TEXT, /Not reviewed/);
  assert.match(TEXT, /Held over to the next run/);
});

test('embedded JSON cannot close the script block', () => {
  const payload = embedJson({ evidence: '</script><img src=x onerror=alert(1)>', amp: 'a & b' });
  assert.equal(payload.includes('</script>'), false);
  assert.match(payload, /\\u003c\/script\\u003e/);
  assert.match(payload, /\\u0026/);
  assert.deepEqual(JSON.parse(payload).evidence, '</script><img src=x onerror=alert(1)>',
    'escaping must be reversible — JSON.parse in the page sees the original text');
});

test('a rendered page keeps the payload inside one script block', () => {
  const page = TEXT.replace('{{DATA}}', embedJson({ findings: [{ evidence: '</script>' }] }));
  assert.equal(page.split('</script>').length, TEXT.split('</script>').length,
    'no extra closing tag was introduced by the data');
});

// The command's own logic — the prose merge, the fallback, the link and the
// title — was added beyond the brief's pseudocode and had no test at all: a
// swapped blobLink argument would have passed the whole suite.
test('crm artifact merges prose, links and title into the page', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  const reports = join(dir, '.claude', 'review', 'reports');
  mkdirSync(reports, { recursive: true });
  const run = 'r1';
  writeFileSync(join(reports, `${run}-plan.json`), JSON.stringify({
    mode: 'working', target: { head: 'a1f2e30' },
    selection: { selected: [], skippedOnTouch: [], deferred: [], agents: 0 },
  }));
  writeFileSync(join(reports, `${run}-findings.json`), JSON.stringify({
    findings: [
      { id: 'f-01', axis: 'sec', severity: 'blocking', confidence: 90, file: 'a.ts', lines: [1, 1], evidence: 'x', claim: 'english claim', codex: null },
      { id: 'f-02', axis: 'sec', severity: 'nitpick', confidence: 80, file: 'a.ts', lines: [2, 3], evidence: 'y', claim: 'uncovered claim', codex: null },
    ],
    suppressed: [],
  }));
  writeFileSync(join(reports, `${run}-prose.json`), JSON.stringify({
    'f-01': { title: 'Polski tytuł', body: 'Polskie zdanie.' },
  }));
  // A remote, so blobLink reaches the file and line arguments at all. Without
  // one it returns null on its first line and the link assertion below would
  // pass whatever order those arguments were given in.
  execFileSync('git', ['-C', dir, 'remote', 'add', 'origin', 'git@github.com:acme/demo.git']);
  const out = join(dir, 'page.html');
  execFileSync(process.execPath, [CLI, 'artifact', '--repo', dir, '--run', run, '--out', out], { encoding: 'utf8' });
  const page = readFileSync(out, 'utf8');
  const payload = JSON.parse(/<script type="application\/json" id="findings">([\s\S]*?)<\/script>/.exec(page)[1]);

  assert.match(page, /<title>Review /, 'the title is filled from the repository name');
  assert.equal(payload.findings[0].title, 'Polski tytuł');
  assert.equal(payload.findings[1].title, 'uncovered claim [bez opisu]',
    'a finding with no prose entry is marked, not dropped');
  assert.equal(payload.findings[1].link, 'https://github.com/acme/demo/blob/a1f2e30/a.ts#L2-L3',
    'the exact url, so a swapped file/lines argument pair fails here');
});

// `--incomplete` mirrors `crm render`'s flag exactly, and prose.json is
// optional here too (the way it already is for `crm render`) — a zero-finding
// run may legitimately have none, and exiting 2 for a missing one would tell
// the model to report a defect that is not one.
test('crm artifact carries an incomplete axis and a non-ok codex status into the payload', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  const reports = join(dir, '.claude', 'review', 'reports');
  mkdirSync(reports, { recursive: true });
  const run = 'r1';
  writeFileSync(join(reports, `${run}-plan.json`), JSON.stringify({
    mode: 'working', target: { head: 'a1f2e30' },
    selection: { selected: [], skippedOnTouch: [], deferred: [], agents: 0 },
  }));
  writeFileSync(join(reports, `${run}-findings.json`), JSON.stringify({
    findings: [],
    suppressed: [],
    codexStatus: 'disabled',
  }));
  // No prose.json written on purpose — a zero-finding run may have none.
  const out = join(dir, 'page.html');
  execFileSync(process.execPath,
    [CLI, 'artifact', '--repo', dir, '--run', run, '--out', out, '--incomplete', 'security,conventions'],
    { encoding: 'utf8' });
  const page = readFileSync(out, 'utf8');
  const payload = JSON.parse(/<script type="application\/json" id="findings">([\s\S]*?)<\/script>/.exec(page)[1]);
  assert.deepEqual(payload.incomplete, ['security', 'conventions']);
  assert.equal(payload.codexStatus, 'disabled');
});

test('a repository with no remote yields no link rather than a broken one', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  const reports = join(dir, '.claude', 'review', 'reports');
  mkdirSync(reports, { recursive: true });
  writeFileSync(join(reports, 'r1-plan.json'), JSON.stringify({
    mode: 'working', target: { head: 'a1f2e30' },
    selection: { selected: [], skippedOnTouch: [], deferred: [], agents: 0 },
  }));
  writeFileSync(join(reports, 'r1-findings.json'), JSON.stringify({
    findings: [{ id: 'f-01', axis: 'sec', severity: 'blocking', confidence: 90, file: 'a.ts', lines: [1, 1], evidence: 'x', claim: 'c', codex: null }],
    suppressed: [],
  }));
  writeFileSync(join(reports, 'r1-prose.json'), '{}');
  const out = join(dir, 'page.html');
  execFileSync(process.execPath, [CLI, 'artifact', '--repo', dir, '--run', 'r1', '--out', out], { encoding: 'utf8' });
  const payload = JSON.parse(/<script type="application\/json" id="findings">([\s\S]*?)<\/script>/.exec(readFileSync(out, 'utf8'))[1]);
  assert.equal(payload.findings[0].link, null);
});
