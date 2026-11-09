import { test } from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, appendFileSync, utimesSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { typedCommands, hubTranscriptPaths, answeredInSession, sessionAnswerCheck } from '../lib/transcript.mjs';
import { inputHash } from '../lib/events.mjs';
import { recordHook } from '../lib/registry.mjs';
import { hubSessionsPath } from '../lib/paths.mjs';
import { tempRoot, transcriptToolUse, transcriptToolResult, transcriptInterrupted, REFUSED_RESULT, jsonLines } from './helpers.mjs';

const AT = '2026-11-06T19:38:21.391Z';
const UUID = '6f1a6b1e-9e3c-4f4f-8f6a-1a2b3c4d5e6f';
const WINDOW = { fromMs: Date.parse('2026-11-06T19:00:00.000Z'), toMs: Date.parse('2026-11-06T20:00:00.000Z') };

// The line a typed `!` command leaves, as measured on Claude Code 2.1.319.
const typed = (content = '<bash-input> ok a3</bash-input>', fields = {}) => ({
  type: 'user',
  isSidechain: false,
  message: { role: 'user', content },
  timestamp: AT,
  uuid: UUID,
  userType: 'external',
  entrypoint: 'cli',
  ...fields,
});

function transcript(...records) {
  const path = join(tempRoot(), 'transcript.jsonl');
  writeFileSync(path, records.map((record) => `${typeof record === 'string' ? record : JSON.stringify(record)}\n`).join(''));
  return path;
}

const noiseLine = (size) => `${JSON.stringify({ type: 'assistant', isSidechain: false, message: { role: 'assistant', content: 'x'.repeat(size) }, timestamp: AT })}\n`;

const found = (path, verb = 'ok', code = 'a3', window = WINDOW) => typedCommands(path, verb, code, window);
const ONE = [{ timestamp: AT, uuid: UUID }];

test('a typed record gives its timestamp and uuid', () => {
  assert.deepEqual(found(transcript(typed())), ONE);
  const bare = { type: 'user', isSidechain: false, message: { content: '<bash-input> ok a3</bash-input>' }, timestamp: AT, uuid: UUID };
  assert.deepEqual(found(transcript(bare)), ONE);
  assert.deepEqual(found(transcript(typed('<bash-input> nie a3</bash-input>')), 'nie'), ONE);
});

test('case and spacing do not matter', () => {
  for (const content of ['<bash-input> OK A3</bash-input>', '<bash-input> ok  a3</bash-input>', '<bash-input>ok a3</bash-input>', '<bash-input> ok\ta3 </bash-input>']) {
    assert.deepEqual(found(transcript(typed(content))), ONE, content);
  }
  assert.deepEqual(found(transcript(typed()), 'OK', 'A3'), ONE);
});

test('records that are not a typed command give nothing', () => {
  const cases = {
    'a tool_use holding the command': {
      type: 'assistant', isSidechain: false, timestamp: AT, uuid: UUID,
      message: { role: 'assistant', content: [{ type: 'tool_use', name: 'Bash', input: { command: 'ok a3' } }] },
    },
    'a tool_use holding the tag': {
      type: 'assistant', isSidechain: false, timestamp: AT, uuid: UUID,
      message: { role: 'assistant', content: [{ type: 'tool_use', name: 'Bash', input: { command: '<bash-input> ok a3</bash-input>' } }] },
    },
    'an api-request-blob': typed(undefined, { type: 'api-request-blob' }),
    'an assistant record': typed(undefined, { type: 'assistant' }),
    'array content': typed([{ type: 'text', text: '<bash-input> ok a3</bash-input>' }]),
    // Coerced to a string, this array equals the tag exactly.
    'array content of one string': typed(['<bash-input> ok a3</bash-input>']),
    'a sidechain record': typed(undefined, { isSidechain: true }),
    'no isSidechain field': typed(undefined, { isSidechain: undefined }),
    'a prompt that only contains the tag': typed('zobacz <bash-input>ok a3</bash-input>'),
    'text after the tag': typed('<bash-input>ok a3</bash-input> zobacz'),
    'a cross-session wrapper': typed('<cross-session-message from="x" from-name="hub" from-mode="auto">\n<bash-input> ok a3</bash-input>\n</cross-session-message>'),
    'a pasted whole line': typed('! ok a3'),
    'a claude -p prompt holding only the tag': typed('<bash-input>ok a3</bash-input>', { entrypoint: 'sdk-cli' }),
    'a plain prompt': typed('ok a3'),
    'the stdout record': typed('<bash-stdout>ok a3</bash-stdout><bash-stderr></bash-stderr>'),
    'more on the command line': typed('<bash-input> ok a3; ok a4</bash-input>'),
    'a third word': typed('<bash-input> ok a3 teraz</bash-input>'),
    'a command split over lines': typed('<bash-input> ok\na3</bash-input>'),
    'another code': typed('<bash-input> ok a4</bash-input>'),
    'a longer code': typed('<bash-input> ok a31</bash-input>'),
    'another verb': typed('<bash-input> nie a3</bash-input>'),
    'an unparseable timestamp': typed(undefined, { timestamp: 'wczoraj' }),
    'no timestamp': typed(undefined, { timestamp: undefined }),
    'no uuid': typed(undefined, { uuid: undefined }),
    'an empty uuid': typed(undefined, { uuid: '' }),
    'a uuid that is no string': typed(undefined, { uuid: 7 }),
  };
  for (const [name, record] of Object.entries(cases)) {
    assert.deepEqual(found(transcript(record)), [], name);
  }
});

test('verb nie does not match a typed ok, and a verb is never a pattern', () => {
  assert.deepEqual(found(transcript(typed()), 'nie'), []);
  assert.deepEqual(found(transcript(typed()), '.*'), []);
  assert.deepEqual(found(transcript(typed()), 'ok', 'a.'), []);
});

test('a record outside the window gives nothing; both ends count; an unusable window matches nothing', () => {
  const at = Date.parse(AT);
  assert.deepEqual(found(transcript(typed()), 'ok', 'a3', { fromMs: at + 1, toMs: at + 100 }), []);
  assert.deepEqual(found(transcript(typed()), 'ok', 'a3', { fromMs: at - 100, toMs: at - 1 }), []);
  assert.deepEqual(found(transcript(typed()), 'ok', 'a3', { fromMs: at, toMs: at }), ONE);
  for (const window of [{ fromMs: Number.NaN, toMs: at }, { fromMs: at, toMs: undefined }, {}]) {
    assert.deepEqual(found(transcript(typed()), 'ok', 'a3', window), []);
  }
});

test('newest first by the record\'s time, whatever the order in the file, and broken lines are skipped', () => {
  const later = '2026-11-06T19:40:00.000Z';
  const path = transcript(
    typed(undefined, { timestamp: later, uuid: 'u-later' }),
    '{"type":"user", broken',
    typed(undefined, { uuid: 'u-earlier' }),
    '{"type":"user","isSidechain":false,"message":{"content":"<bash-input> ok',
  );
  assert.deepEqual(found(path), [{ timestamp: later, uuid: 'u-later' }, { timestamp: AT, uuid: 'u-earlier' }]);
});

test('a missing file gives nothing', () => {
  assert.deepEqual(found(join(tempRoot(), 'none.jsonl')), []);
  assert.deepEqual(found(null), []);
});

test('it finds a record at the end of a 3 MB file and reads only its tail', (t) => {
  const path = transcript(typed());
  t.after(() => rmSync(dirname(path), { recursive: true, force: true }));
  const later = '2026-11-06T19:50:00.000Z';
  const near = '2026-11-06T19:45:00.000Z';
  const filler = noiseLine(1000).repeat(3000);
  appendFileSync(path, filler);
  // Only the record at the very start of the file exists, 3 MB back: outside the tail.
  assert.deepEqual(found(path), []);

  appendFileSync(path, `${JSON.stringify(typed(undefined, { timestamp: near, uuid: 'u-near' }))}\n`);
  appendFileSync(path, noiseLine(1000).repeat(400));
  // About 400 KB back: inside the tail.
  assert.deepEqual(found(path), [{ timestamp: near, uuid: 'u-near' }]);

  appendFileSync(path, `${JSON.stringify(typed(undefined, { timestamp: later, uuid: 'u-later' }))}\n`);
  assert.deepEqual(found(path)[0], { timestamp: later, uuid: 'u-later' });
});

test('a record further back than 512 KB is outside the tail', (t) => {
  const path = transcript(typed());
  t.after(() => rmSync(dirname(path), { recursive: true, force: true }));
  appendFileSync(path, noiseLine(1000).repeat(600));
  assert.deepEqual(found(path), []);
});

test('hubTranscriptPaths keeps the newest 5 by mtime and skips missing files', () => {
  const root = tempRoot();
  const ids = [];
  const base = Date.now() / 1000;
  const addSession = (id, path) => {
    ids.push(id);
    recordHook(root, { hook_event_name: 'UserPromptSubmit', session_id: id, prompt: 'x', cwd: root, ...(path ? { transcript_path: path } : {}) }, { id: `e-${id}`, at: '2026-11-06T10:00:00.000Z' });
  };
  const paths = [];
  for (let i = 0; i < 7; i += 1) {
    const path = join(root, `t${i}.jsonl`);
    writeFileSync(path, '');
    utimesSync(path, base - 1000 + i, base - 1000 + i);
    paths.push(path);
    addSession(`s${i}`, path);
  }
  addSession('gone', join(root, 'gone.jsonl'));
  addSession('untitled', null);
  ids.push('no-events');
  writeFileSync(hubSessionsPath(root), JSON.stringify({ hub: ids, launched: [] }));
  assert.deepEqual(hubTranscriptPaths(root), [paths[6], paths[5], paths[4], paths[3], paths[2]]);
});

test('hubTranscriptPaths reads only the hub list', () => {
  const root = tempRoot();
  const path = join(root, 'project.jsonl');
  writeFileSync(path, '');
  recordHook(root, { hook_event_name: 'UserPromptSubmit', session_id: 'project', prompt: 'x', cwd: root, transcript_path: path }, { id: 'e1', at: '2026-11-06T10:00:00.000Z' });
  assert.deepEqual(hubTranscriptPaths(root), []);
  writeFileSync(hubSessionsPath(root), JSON.stringify({ hub: ['someone-else'], launched: [{ sessionId: 'project', name: 'x' }] }));
  assert.deepEqual(hubTranscriptPaths(root), []);
});

const CALL_INPUT = { command: 'git push origin main', description: 'Push the branch' };
const STARTED = Date.parse('2026-11-06T12:00:00.000Z');
const BEFORE = '2026-11-06T11:59:00.000Z';
const AFTER = '2026-11-06T12:00:05.000Z';
const pendingRecord = (fields = {}) => ({ tool: 'Bash', inputHash: inputHash(CALL_INPUT), startedAt: STARTED, ...fields });
const ownCall = transcriptToolUse('toolu_1', CALL_INPUT, BEFORE);
const answered = (...records) => answeredInSession(transcript(...records), pendingRecord());

test('answeredInSession: a tool_result of this call is tool-result, also an is_error one', () => {
  assert.equal(answered(ownCall, transcriptToolResult('toolu_1', AFTER)), 'tool-result');
  assert.equal(answered(ownCall, transcriptToolResult('toolu_1', AFTER, { block: { is_error: true, content: 'Exit code 1' } })), 'tool-result');
  assert.equal(answered(ownCall, transcriptToolResult('toolu_1', new Date(STARTED).toISOString())), 'tool-result');
  const path = transcript(ownCall, transcriptToolResult('toolu_1', AFTER));
  assert.equal(answeredInSession(path, pendingRecord({ startedAt: new Date(STARTED).toISOString() })), 'tool-result');
});

test('answeredInSession: the text of an interrupted turn is interrupted, also next to the refused tool_result', () => {
  assert.equal(answered(transcriptInterrupted(AFTER)), 'interrupted');
  assert.equal(answered(transcriptInterrupted(new Date(STARTED).toISOString())), 'interrupted');
  const asString = { ...transcriptInterrupted(AFTER), message: { role: 'user', content: '[Request interrupted by user]' } };
  assert.equal(answered(asString), 'interrupted');
  const refused = transcriptToolResult('toolu_1', AFTER, REFUSED_RESULT);
  assert.equal(answered(ownCall, refused, transcriptInterrupted(AFTER)), 'interrupted');
  assert.equal(answered(ownCall, transcriptInterrupted(AFTER), refused), 'interrupted');
});

test('answeredInSession: anything else gives null', () => {
  const otherCall = transcriptToolUse('toolu_2', { ...CALL_INPUT, command: 'rm -rf build' }, BEFORE);
  const otherTool = transcriptToolUse('toolu_2', CALL_INPUT, BEFORE, { tool: 'PowerShell' });
  const text = (value) => ({ ...transcriptInterrupted(AFTER), message: { role: 'user', content: [{ type: 'text', text: value }] } });
  const cases = {
    'an empty transcript': [],
    'the call alone': [ownCall],
    'an older identical call': [ownCall, transcriptToolResult('toolu_1', BEFORE)],
    'a result of a call with another input': [otherCall, transcriptToolResult('toolu_2', AFTER)],
    'a result of the same input in another tool': [otherTool, transcriptToolResult('toolu_2', AFTER)],
    'a result of another id': [ownCall, transcriptToolResult('toolu_9', AFTER)],
    'a result with no call in the transcript': [transcriptToolResult('toolu_1', AFTER)],
    'an interrupted turn before the start': [transcriptInterrupted(BEFORE)],
    'a sidechain result': [ownCall, transcriptToolResult('toolu_1', AFTER, { isSidechain: true })],
    'a sidechain call': [{ ...ownCall, isSidechain: true }, transcriptToolResult('toolu_1', AFTER)],
    'a sidechain interrupted turn': [transcriptInterrupted(AFTER, { isSidechain: true })],
    'a text that only contains it': [text('zobacz [Request interrupted by user')],
    'another text': [text('[Request sent by user]')],
    'a result whose content starts with it': [transcriptToolResult('toolu_9', AFTER, { block: { content: '[Request interrupted by user' } })],
    'a result whose blocks start with it': [transcriptToolResult('toolu_9', AFTER, { block: { content: [{ type: 'text', text: '[Request interrupted by user' }] } })],
    'an assistant quoting it': [{ ...transcriptInterrupted(AFTER), type: 'assistant' }],
    'a blob holding it': [{ ...transcriptInterrupted(AFTER), type: 'api-request-blob' }],
    'a blob holding the result': [ownCall, { ...transcriptToolResult('toolu_1', AFTER), type: 'api-request-blob' }],
    'a call in a user record': [{ ...ownCall, type: 'user' }, transcriptToolResult('toolu_1', AFTER)],
    'a result with an unparseable time': [ownCall, transcriptToolResult('toolu_1', 'wczoraj')],
    'an interrupted turn with no time': [transcriptInterrupted(undefined)],
  };
  for (const [name, records] of Object.entries(cases)) assert.equal(answered(...records), null, name);
});

test('answeredInSession never throws', () => {
  const root = tempRoot();
  assert.equal(answeredInSession(join(root, 'none.jsonl'), pendingRecord()), null);
  assert.equal(answeredInSession(root, pendingRecord()), null);
  assert.equal(answeredInSession(null, pendingRecord()), null);
  assert.equal(answeredInSession(undefined, pendingRecord()), null);
  const path = transcript(ownCall, transcriptToolResult('toolu_1', AFTER));
  assert.equal(answeredInSession(path, null), null);
  assert.equal(answeredInSession(path, undefined), null);
  assert.equal(answeredInSession(path, pendingRecord({ startedAt: 'wczoraj' })), null);
  assert.equal(answeredInSession(path, pendingRecord({ startedAt: undefined })), null);
  const odd = [
    '{ broken', 'null', '7', '"text"', '[]', '{"type":"user"}', '{"type":"user","message":null}',
    { type: 'user', message: { content: null }, timestamp: AFTER },
    { type: 'user', message: { content: [null, 7, 'x', {}] }, timestamp: AFTER },
    { type: 'assistant', message: { content: [null, 7, 'x', {}, { type: 'tool_use' }] }, timestamp: BEFORE },
  ];
  assert.equal(answered(...odd), null);
  assert.equal(answered(...odd, ownCall, transcriptToolResult('toolu_1', AFTER)), 'tool-result');
});

test('answeredInSession reads only the tail of a 3 MB transcript', (t) => {
  const path = transcript(ownCall, transcriptInterrupted(AFTER));
  t.after(() => rmSync(dirname(path), { recursive: true, force: true }));
  appendFileSync(path, noiseLine(1000).repeat(3000));
  // Both records sit at the very start of the file, 3 MB back: outside the tail.
  assert.equal(answeredInSession(path, pendingRecord()), null);
  appendFileSync(path, jsonLines(ownCall, transcriptToolResult('toolu_1', AFTER)));
  assert.equal(answeredInSession(path, pendingRecord()), 'tool-result');
});

test('answeredInSession reaches 2 MB back, while the typed search stays at 512 KB', (t) => {
  // A call and its result can span 1,027 KB on real transcripts. Each noise line is about 1.1 KB.
  const near = transcript(typed(), ownCall);
  t.after(() => rmSync(dirname(near), { recursive: true, force: true }));
  appendFileSync(near, noiseLine(1000).repeat(1000));
  appendFileSync(near, jsonLines(transcriptToolResult('toolu_1', AFTER)));
  assert.equal(answeredInSession(near, pendingRecord()), 'tool-result');
  assert.deepEqual(found(near), []);

  const far = transcript(ownCall);
  t.after(() => rmSync(dirname(far), { recursive: true, force: true }));
  appendFileSync(far, noiseLine(1000).repeat(2000));
  appendFileSync(far, jsonLines(transcriptToolResult('toolu_1', AFTER)));
  assert.equal(answeredInSession(far, pendingRecord()), null);
});

test('sessionAnswerCheck reads the transcript again only when its size changed', () => {
  const answer = jsonLines(transcriptInterrupted(AFTER));
  const path = transcript(' '.repeat(answer.length - 1));
  const check = sessionAnswerCheck(pendingRecord({ transcriptPath: path }));
  assert.equal(check(), null);
  // The answer in place, at the same size: this round does not look.
  writeFileSync(path, answer);
  assert.equal(check(), null);
  appendFileSync(path, '\n');
  assert.equal(check(), 'interrupted');
});

test('sessionAnswerCheck: a transcript that appears later is read, and no path gives no signal', () => {
  const path = join(tempRoot(), 'later.jsonl');
  const check = sessionAnswerCheck(pendingRecord({ transcriptPath: path }));
  assert.equal(check(), null);
  writeFileSync(path, jsonLines(ownCall, transcriptToolResult('toolu_1', AFTER)));
  assert.equal(check(), 'tool-result');
  assert.equal(sessionAnswerCheck(pendingRecord({ transcriptPath: null }))(), null);
  assert.equal(sessionAnswerCheck(pendingRecord())(), null);
});

test('answeredInSession parses only the lines that can answer', (t) => {
  const prompt = { type: 'user', isSidechain: false, message: { role: 'user', content: 'zrób to' }, timestamp: AFTER };
  const path = transcript(prompt, noiseLine(100).trim(), ownCall, prompt, transcriptToolResult('toolu_1', AFTER), prompt);
  const parse = t.mock.method(JSON, 'parse');
  assert.equal(answeredInSession(path, pendingRecord()), 'tool-result');
  assert.equal(parse.mock.callCount(), 2);
  parse.mock.resetCalls();
  assert.equal(answeredInSession(transcript(prompt, transcriptInterrupted(AFTER)), pendingRecord()), 'interrupted');
  assert.equal(parse.mock.callCount(), 1);
});
