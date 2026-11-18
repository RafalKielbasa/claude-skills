import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { makeRepo, writeFiles, commitAll, git } from '../test-helpers/repo.mjs';
import { collectTarget, renderIssues } from '../lib/target.mjs';
import { parseConfigDoc, mergeConfig, validateConfig } from '../lib/config.mjs';
import { selectAxes, emptySelection } from '../lib/axes.mjs';
import { DEFAULT_SETTINGS } from '../lib/config.mjs';
import { buildCodexFindPrompt } from '../lib/codex.mjs';
import { renderReport } from '../lib/report.mjs';

const PR_FIELDS = 'files,headRefOid,baseRefOid,closingIssuesReferences';
const ISSUE_FIELDS = 'number,title,body,url';

const prView = (refs) => JSON.stringify({
  baseRefOid: 'base111', headRefOid: 'head222',
  files: [{ path: 'a.ts', additions: 3, deletions: 1 }],
  closingIssuesReferences: refs,
});

// The review never saw the task before this: `crm plan` has to bring the text
// of every issue the PR closes, from the repository the reference names (a PR
// in one repository may close an issue kept in another).
test('pr mode fetches the body of every issue the pull request closes', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  const calls = [];
  const gh = (args) => {
    calls.push(args);
    if (args[0] === 'pr') {
      return prView([{ number: 181, url: 'https://github.com/acme/tasks/issues/181',
        repository: { name: 'tasks', owner: { login: 'acme' } } }]);
    }
    return JSON.stringify({ number: 181, title: 'Quiz lock', body: '- [ ] criterion one', url: 'https://github.com/acme/tasks/issues/181' });
  };
  const target = collectTarget(dir, 'pr', { pr: 217, gh });
  assert.deepEqual(calls[0], ['pr', 'view', '217', '--json', PR_FIELDS]);
  assert.deepEqual(calls[1], ['issue', 'view', '181', '--repo', 'acme/tasks', '--json', ISSUE_FIELDS]);
  assert.deepEqual(target.issues, [{
    number: 181, title: 'Quiz lock', body: '- [ ] criterion one', url: 'https://github.com/acme/tasks/issues/181',
  }]);
});

// An issue that cannot be read (no access, deleted) must not break the plan,
// and must not pass for an issue with nothing in it either.
test('an issue whose body cannot be fetched stays in the list with a null body', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  const gh = (args) => {
    if (args[0] === 'pr') {
      return prView([{ number: 9, url: 'https://github.com/acme/tasks/issues/9',
        repository: { name: 'tasks', owner: { login: 'acme' } } }]);
    }
    throw new Error('HTTP 404');
  };
  const target = collectTarget(dir, 'pr', { pr: 1, gh });
  assert.deepEqual(target.issues, [{ number: 9, title: null, body: null, url: 'https://github.com/acme/tasks/issues/9' }]);
});

test('a pull request that closes no issue has an empty issue list', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  const target = collectTarget(dir, 'pr', { pr: 1, gh: () => prView([]) });
  assert.deepEqual(target.issues, []);
});

// `branch` has no pull request to ask, so the issue is named by the caller and
// read from the repository under review.
test('an explicitly named issue is fetched in branch mode', () => {
  const dir = makeRepo({ 'a.ts': 'one\n' });
  git(dir, 'checkout', '-q', '-b', 'feature');
  writeFiles(dir, { 'a.ts': 'two\n' });
  commitAll(dir, 'change');
  const calls = [];
  const gh = (args) => {
    calls.push(args);
    return JSON.stringify({ number: 181, title: 'T', body: 'B', url: 'u' });
  };
  const target = collectTarget(dir, 'branch', { issues: [181], gh });
  assert.deepEqual(calls, [['issue', 'view', '181', '--json', ISSUE_FIELDS]]);
  assert.deepEqual(target.issues.map((i) => i.number), [181]);
});

test('an issue named explicitly and closed by the pull request is fetched once', () => {
  const dir = makeRepo({ 'a.ts': 'x\n' });
  const calls = [];
  const gh = (args) => {
    calls.push(args);
    if (args[0] === 'pr') {
      return prView([{ number: 181, url: 'u', repository: { name: 'tasks', owner: { login: 'acme' } } }]);
    }
    return JSON.stringify({ number: Number(args[2]), title: 'T', body: 'B', url: 'u' });
  };
  const target = collectTarget(dir, 'pr', { pr: 1, issues: [181, 182], gh });
  assert.deepEqual(target.issues.map((i) => i.number), [181, 182]);
  assert.equal(calls.filter((args) => args[0] === 'issue').length, 2);
});

test('a mode without a named issue never calls gh', () => {
  const dir = makeRepo({ 'a.ts': 'one\n' });
  writeFiles(dir, { 'a.ts': 'two\n' });
  const target = collectTarget(dir, 'working', { gh: () => { throw new Error('gh must not run'); } });
  assert.deepEqual(target.issues, []);
});

// A regression is the difference between two versions; the agents are given the
// one command that shows it, built here so nobody composes it by hand.
test('every mode with a diff names the command that shows it', () => {
  const dir = makeRepo({ 'a.ts': 'one\n' });
  const root = resolve(dir).replace(/\\/g, '/');
  writeFiles(dir, { 'a.ts': 'two\n' });
  assert.equal(collectTarget(dir, 'working', {}).diffCommand, `git -C "${root}" diff HEAD --`);
  const base = git(dir, 'rev-parse', 'HEAD');
  git(dir, 'checkout', '-q', '-b', 'feature');
  const head = commitAll(dir, 'change');
  assert.equal(collectTarget(dir, 'branch', {}).diffCommand, `git -C "${root}" diff ${base} ${head} --`);
  assert.equal(collectTarget(dir, 'since', { base }).diffCommand, `git -C "${root}" diff ${base} ${head} --`);
  const pr = collectTarget(dir, 'pr', { pr: 1, gh: () => prView([]) });
  assert.equal(pr.diffCommand, `git -C "${root}" diff base111...head222 --`);
  assert.equal(collectTarget(dir, 'full', {}).diffCommand, null);
});

test('issues render as one section each, and an unreadable one says so', () => {
  const text = renderIssues([
    { number: 181, title: 'Quiz lock', body: 'line one\nline two', url: 'https://x/181' },
    { number: 9, title: null, body: null, url: 'https://x/9' },
  ]);
  assert.match(text, /### Issue #181 — Quiz lock \(https:\/\/x\/181\)\n\nline one\nline two/);
  assert.match(text, /### Issue #9[^\n]*\n\n[^\n]*could not be fetched/);
  assert.equal(renderIssues([]), '');
});

const CONFIG = (yaml) => `# demo\n\n## Issue\n\n\`\`\`yaml\nid: issue-conformance\nwhen: always\n${yaml}\`\`\`\n\n- Every criterion is met.\n`;
const EMPTY = { settings: {}, axes: [], ignoredSections: [] };

test('an axis may declare that it needs an issue', () => {
  const doc = parseConfigDoc(CONFIG('needs: [issue]\n'));
  assert.deepEqual(doc.axes[0].needs, ['issue']);
  assert.deepEqual(validateConfig(mergeConfig(EMPTY, doc)), []);
  assert.deepEqual(parseConfigDoc(CONFIG('')).axes[0].needs, []);
});

test('an unknown need is a configuration problem, not a silently sleeping axis', () => {
  const problems = validateConfig(mergeConfig(EMPTY, parseConfigDoc(CONFIG('needs: [figma]\n'))));
  assert.equal(problems.length, 1);
  assert.match(problems[0], /issue-conformance.*needs.*figma/);
});

const axis = (id, extra = {}) => ({
  id, when: 'always', rank: 'always', group: null, severity_default: 'blocking',
  max_files: null, max_files_per_part: null, tools: [], semgrep: [], needs: [], heading: id, checklist: `- check ${id}`, ...extra,
});
const files = [{ path: 'a.ts', added: 1, removed: 0, size: 10 }];
const select = (over) => selectAxes({
  axes: [axis('correctness'), axis('issue-conformance', { needs: ['issue'] })],
  files, settings: DEFAULT_SETTINGS, state: { axis_cursor: [] }, budgetMode: 'auto', ...over,
});

// An axis that checks the change against its task has nothing to check without
// the task: it must cost no agent, and the plan must say why it did not run.
test('an axis that needs an issue sleeps when the run has none', () => {
  const out = select({ hasIssue: false });
  assert.deepEqual(out.selected.map((s) => s.axisId), ['correctness']);
  assert.deepEqual(out.skippedNoIssue, ['issue-conformance']);
  assert.deepEqual(out.skippedOnTouch, []);
  assert.equal(out.agents, 3);
});

test('an axis that needs an issue runs when the run has one', () => {
  const out = select({ hasIssue: true });
  assert.deepEqual(out.selected.map((s) => s.axisId), ['correctness', 'issue-conformance']);
  assert.deepEqual(out.skippedNoIssue, []);
  assert.equal(out.agents, 5);
});

test('an empty selection carries the skippedNoIssue key', () => {
  assert.deepEqual(emptySelection(DEFAULT_SETTINGS, 'auto').skippedNoIssue, []);
});

// codex reviews the same checklists; an issue checklist without the issue text
// would have it judging requirements it never saw.
test('the codex finder prompt carries the issue under an axis that needs it', () => {
  const selected = select({ hasIssue: true }).selected;
  const issues = [{ number: 181, title: 'Quiz lock', body: 'criterion one', url: 'https://x/181' }];
  const prompt = buildCodexFindPrompt(selected, issues);
  const [correctness, conformance] = prompt.split('### issue-conformance');
  assert.match(conformance, /Issue:\n\n### Issue #181 — Quiz lock/);
  assert.match(conformance, /criterion one/);
  assert.equal(/criterion one/.test(correctness), false, 'an axis that does not need the issue must not carry it');
});

test('the report names an axis skipped for want of an issue', () => {
  const selection = { ...select({ hasIssue: false }) };
  const report = renderReport({
    run: { id: 'r1', mode: 'pr', base: null, head: 'abc' }, selection,
    findings: [], suppressed: [], prose: {}, codexStatus: 'ok', remote: null,
  });
  assert.match(report, /Osie w tym przebiegu: correctness \(1 z 2\)\./);
  assert.match(report, /Pominięte — brak powiązanego issue: issue-conformance\./);
});
