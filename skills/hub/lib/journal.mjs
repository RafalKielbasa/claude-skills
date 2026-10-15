// Send records (spec §6.3). Records live in projects/<project>/journal.jsonl, written only by the
// hub CLI; journal.md is a readable view rebuilt on every save (journal.jsonl is a plan-level
// addition to the spec's layout, so the checks can read the records reliably).
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { join } from 'node:path';
import { projectDir, journalJsonlPath, journalMdPath } from './paths.mjs';

export function newRecordId(at) {
  return `r${at.replace(/\D/g, '').slice(0, 14)}-${randomBytes(2).toString('hex')}`;
}

export function loadRecords(root, project) {
  const path = journalJsonlPath(root, project);
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf8').split('\n').filter((line) => line.trim()).map((line) => JSON.parse(line));
}

// A pending record has neither the delivery evidence nor a notice (spec §6.3 step 6), also when the
// hub was interrupted before it stored the tool result; it is shown as delivery-unknown.
export function shownState(record) {
  return record.state === 'pending' ? 'delivery-unknown' : record.state;
}

function proofOf(record) {
  if (record.evidence) return `UserPromptSubmit ${record.evidence.at}`;
  if (record.mismatch) return `delivered text differs from the approved text (UserPromptSubmit ${record.mismatch.at})`;
  if (record.notice ?? record.error) return record.notice ?? record.error;
  return record.state === 'pending' && !record.msgId ? 'no tool result recorded' : '';
}

const cell = (value) => String(value ?? '').replace(/\|/g, '\\|').replace(/\s+/g, ' ');

export function renderJournal(records) {
  const lines = ['| Record | Approved | Session | Path | State | Evidence or notice |', '|---|---|---|---|---|---|'];
  for (const r of records) {
    // A new-session record has no sessionId until its launch or its delivery evidence names one.
    lines.push(`| ${[r.id, r.approvedAt, `${(r.sessionId ?? r.shortId ?? '').slice(0, 8)} ${r.name ?? ''}`, r.path, shownState(r), proofOf(r)].map(cell).join(' | ')} |`);
  }
  return `${lines.join('\n')}\n`;
}

export function saveRecords(root, project, records) {
  mkdirSync(projectDir(root, project), { recursive: true });
  writeFileSync(journalJsonlPath(root, project), records.map((r) => JSON.stringify(r)).join('\n') + (records.length ? '\n' : ''), 'utf8');
  writeFileSync(journalMdPath(root, project), renderJournal(records), 'utf8');
}

export function listProjects(root) {
  const dir = join(root, 'projects');
  return existsSync(dir) ? readdirSync(dir).filter((name) => existsSync(journalJsonlPath(root, name))) : [];
}

export function findRecord(root, id) {
  for (const project of listProjects(root)) {
    const records = loadRecords(root, project);
    const record = records.find((r) => r.id === id);
    if (record) return { project, record, records };
  }
  return null;
}

export function findRecordByMsgId(root, msgId) {
  for (const project of listProjects(root)) {
    const records = loadRecords(root, project);
    const record = records.find((r) => r.msgId === msgId);
    if (record) return { project, record, records };
  }
  return null;
}
