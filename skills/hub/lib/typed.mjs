// Rafal's typed text in the hub tab (spec §4.1, §5): what a prompt means, whether he really typed it, and
// what it does to the queue. The hub model hands over his whole prompt and is trusted with nothing: the
// text must hash to a prompt event of a hub session, and only then is the code split from the text.
import { readFileSync, realpathSync, statSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { canonical, sha256 } from './text.mjs';
import { eventLogPath, ownedDir, safeName } from './paths.mjs';
import { deriveSession } from './derive.mjs';
import { listSessionIds, readEvents } from './registry.mjs';
import { readHubSessions } from './hubsessions.mjs';
import { loadProjectMap, projectFor, samePath } from './projects.mjs';
import { itemByCode, readQueue, withQueue } from './queue.mjs';
import { findItem, loadItemContext, renderItem } from './item.mjs';
import { cwdForTranscript, withAncestors } from './resolve.mjs';

export const COMMAND_AS_TEXT = 'Komenda się nie wykonała, nic nie zatwierdzono ani nie zmieniono: `!` trzeba wcisnąć ręcznie, potem wkleić resztę. W panelu VS Code `!` nie działa.';
export const HASH_MISMATCH = 'Tekst nie zgadza się z tym, co wpisałeś. Nic nie wysłano.';
export const MERGED_ANSWERS = 'Kolejna linia zaczyna się od kodu albo komendy, więc odpowiedzi mogły się zlać. Nic nie wysłano. Wpisz każdą osobno.';

const PROMPT_WINDOW_MS = 30 * 60 * 1000;
const PROMPT_RETRY_MS = 3000;
const PROMPT_POLL_MS = 100;
const USED_EVENTS_KEPT = 50;
// Each attempt waits for the lock up to 2 s, so three outlast a lock left by a killed process, stolen at 5 s.
const RELEASE_ATTEMPTS = 3;

// A code has no leading zero: `a03` is no code, here and in codeEntry.
const COMMAND = /^!?[ \t]*(?:(?:ok|nie)[ \t]+a[1-9]\d*|pauza|wracam)$/i;
const VOICE_OR_SKIP = /^(dawaj|dalej)(?:[ \t]+(a[1-9]\d*))?$/i;
const CODED = /^(a[1-9]\d*)(?:\s+([\s\S]+))?$/i;
// A line that would be a prompt of its own: a code with or without text, or exactly `dawaj` or `dalej`, with or without a code.
const LATER_ANSWER = /^[ \t]*(?:a[1-9]\d*(?:[ \t]|$)|(?:dawaj|dalej)(?:[ \t]+a[1-9]\d*)?[ \t]*$)/i;

export const refused = (message) => ({ action: 'refused', message });
const closed = (code) => `${code}: ta pozycja już nie czeka`;
const lastGone = (code) => `Ostatnio ogłoszona pozycja (${code}) już nie czeka. Nic nie zrobiłem.`;
const answerThere = (item) => `${item.code}: odpowiedz w sesji ${item.name}`;
const notThisTalk = (code) => `${code}: ten prompt.md nie pochodzi z tej rozmowy. Nic nie wysłano.`;

// Reads the canonical form the hash is taken of, so a heredoc's trailing newline changes neither. Leading
// blanks do count for the hash, but they do not turn an answer into conversation.
export function parseTyped(text) {
  const prompt = canonical(text).trimStart();
  if (COMMAND.test(prompt)) return { kind: 'command-as-text' };
  const walk = VOICE_OR_SKIP.exec(prompt);
  if (walk) return { kind: walk[1].toLowerCase(), code: walk[2]?.toLowerCase() ?? null };
  const coded = CODED.exec(prompt);
  if (!coded) return { kind: 'other' };
  // Two answers typed while the hub model works may arrive as one prompt, and the second would go to the first one's
  // session. A merge starts a new line, so `a3 a4 B` on one line stays in the body.
  if (prompt.split('\n').slice(1).some((line) => LATER_ANSWER.test(line))) return { kind: 'merged' };
  const code = coded[1].toLowerCase();
  return coded[2] ? { kind: 'answer', code, body: coded[2] } : { kind: 'show', code };
}

function writtenSince(path, since) {
  try {
    return statSync(path).mtimeMs >= since;
  } catch {
    return false;
  }
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

// The newest free prompt event carrying this hash. A session counts as the hub by the hub list, or by this
// event's own cwd: hub-sessions.json is refreshed only by the overview, and a session in a sub-directory is
// not the hub. An event inside the window lies in a log written inside it, so the old logs stay unread.
function freePromptEvent(root, hash, since) {
  const hubIds = new Set(readHubSessions(root).hub);
  const used = new Set(readQueue(root).usedPromptEvents ?? []);
  let newest = null;
  for (const sessionId of listSessionIds(root)) {
    if (!writtenSince(eventLogPath(root, sessionId), since)) continue;
    for (const event of readEvents(root, sessionId).events) {
      if (event.event !== 'UserPromptSubmit' || event.promptHash !== hash || used.has(event.id)) continue;
      if (!hubIds.has(sessionId) && !(event.cwd && samePath(event.cwd, root))) continue;
      const at = Date.parse(event.at);
      if (at >= since && (!newest || at > newest.at)) newest = { id: event.id, at };
    }
  }
  return newest;
}

// Read only: taking the event is `takeTyped`'s, under the lock. Claude Code's hooks run asynchronously, so
// the event can reach the registry just after the model ran the command.
export function verifyPrompt(root, text, { now = Date.now(), retryMs = PROMPT_RETRY_MS } = {}) {
  const hash = sha256(text);
  const since = now - PROMPT_WINDOW_MS;
  const deadline = Date.now() + retryMs;
  for (;;) {
    const found = freePromptEvent(root, hash, since);
    if (found) return { ok: true, eventId: found.id, at: found.at };
    if (Date.now() >= deadline) return { ok: false, eventId: null, at: null };
    sleep(PROMPT_POLL_MS);
  }
}

// Whether the wait the code was given for is the one in the session now. A newer gate in that session is
// another wait, so the times must be equal, and the registry's time is an ISO string where the item's is
// epoch ms. A hook's item is exempt: its `since` is the hook's start, not the Notification's time. An ask
// item is a decision by its tool, and the registry shows its wait as a permission.
function sameWait(root, item) {
  if (item.pendingId) return true;
  const { waiting } = deriveSession(readEvents(root, item.sessionId).events);
  if (!waiting || Date.parse(waiting.since) !== item.since) return false;
  return waiting.kind === (item.askTool ? 'permission' : item.kind);
}

// A permission whose pending record is gone has no hook behind it, whatever the item says.
function hookBehind(root, item) {
  if (!item.answerable) return false;
  return item.kind === 'decision' || Boolean(loadItemContext(root, item).pending);
}

function actOn(root, item, parsed, now) {
  if (parsed.kind === 'show') return { action: 'show', item };
  if (parsed.kind === 'dalej') {
    item.skippedAt ??= now;
    return { action: 'skipped', message: `${item.code} pominięte: ${item.name}. Zostaje w przeglądzie.` };
  }
  if (!hookBehind(root, item)) return refused(answerThere(item));
  if (parsed.kind === 'answer') {
    if (item.kind !== 'decision') return refused(`${item.code} to uprawnienia: wpisz \`! ok ${item.code}\` albo \`! nie ${item.code}\``);
    item.answeredAt = now;
    return { action: 'claimed', item };
  }
  if (item.kind !== 'decision') return { action: 'show', item };
  item.dawajAt = now;
  return { action: 'voice', code: item.code, sessionId: item.sessionId };
}

// The one withQueue call of a verified prompt: the event is used once, whatever follows, so a retry needs
// Rafal to type it again. An answer comes back as `claimed`, with answeredAt set, for the caller to send. An
// event older than the item's code was typed about something else: a code returns after 24 h, and an unused
// event stays findable for 30 min. The bare form binds when this runs, so one typed before the last announcement
// meant another item.
export function takeTyped(root, parsed, { eventId, at }, { now = Date.now() } = {}) {
  const outcome = withQueue(root, (state) => {
    const used = state.usedPromptEvents ?? [];
    if (used.includes(eventId)) return refused(HASH_MISMATCH);
    state.usedPromptEvents = [...used, eventId].slice(-USED_EVENTS_KEPT);
    const { item, error } = findItem(state, parsed.code);
    if (error) return refused(error);
    if (!parsed.code && at < item.announcedAt) return refused(`Od Twojej komendy ogłoszono nową pozycję (${item.code}). Nic nie zrobiłem. Podaj kod pozycji.`);
    if (at < item.codeAt) return refused(`${item.code}: w chwili wpisania ten kod należał do innej pozycji. Nic nie wysłano.`);
    if (!sameWait(root, item)) return refused(parsed.code ? closed(item.code) : lastGone(item.code));
    return actOn(root, item, parsed, now);
  });
  return outcome.action === 'show' ? { action: 'show', text: renderItem(outcome.item, loadItemContext(root, outcome.item)) } : outcome;
}

// The folder the talk CLI files a session's dialogs under. Its key comes from the cwd `HUB voice resolve` gives
// it, the one holding the session's transcript, because hook cwds follow `cd`; the folder name is that key as
// talk's dialogDirFor normalises it (~/.claude/skills/talk/lib/dialog.mjs:15), which the hub does not import.
function dialogProject(root, sessionId) {
  const { cwd, firstCwd, transcriptPath } = deriveSession(readEvents(root, sessionId).events);
  const source = cwdForTranscript([...(cwd ? withAncestors(cwd) : []), firstCwd], transcriptPath) ?? cwd;
  return safeName(projectFor(source, loadProjectMap(root).projects)).replace(/^\.+/, '');
}

// A dialog folder holds no session id on disk, so an order is matched to its item by what it does hold: its
// project, compared as paths are on Windows, and its time, at or after this item's `dawaj` with no other item's
// `dawaj` in between. An order belongs to the newest `dawaj` before it.
function orderFits(state, item, order, project) {
  if (order.project.toLowerCase() !== project?.toLowerCase()) return false;
  if (order.mtimeMs < item.dawajAt) return false;
  return !Object.values(state.items).some((other) => other.key !== item.key && other.dawajAt > item.dawajAt && other.dawajAt <= order.mtimeMs);
}

// The same claim for a voice order: no prompt event, and `dawaj` having opened the conversation instead. The
// project is read before the lock, because an unmapped project's key takes a git call.
export function claimVoice(root, rawCode, order, { now = Date.now() } = {}) {
  const code = String(rawCode).toLowerCase();
  const known = itemByCode(readQueue(root), code);
  const project = known ? dialogProject(root, known.sessionId) : null;
  return withQueue(root, (state) => {
    const { item, error } = findItem(state, code);
    if (error) return refused(error);
    if (!item.dawajAt) return refused(`${code}: rozmowy o tej pozycji nie zaczęto przez „dawaj”. Nic nie wysłano.`);
    if (!sameWait(root, item)) return refused(closed(code));
    if (!orderFits(state, item, order, project)) return refused(notThisTalk(code));
    item.answeredAt = now;
    return { action: 'claimed', item };
  });
}

// The order a voice conversation left: <dialogRoot>/projects/<project>/dialogs/<dir>/prompt.md, after links
// are resolved. { body, dirName, project, mtimeMs }, or { error }.
export function voiceOrder(file, dialogRoot) {
  const wrong = { error: `To nie jest prompt.md rozmowy głosowej: ${file}. Nic nie wysłano.` };
  if (!dialogRoot) return wrong;
  let real;
  try {
    real = realpathSync.native(resolve(String(file)));
  } catch {
    return wrong;
  }
  const dir = basename(real) === 'prompt.md' ? ownedDir(dialogRoot, dirname(real), 'dialogs') : null;
  if (!dir) return wrong;
  return { body: readFileSync(real, 'utf8'), dirName: basename(dir), project: basename(dirname(dirname(dir))), mtimeMs: statSync(real).mtimeMs };
}

function clearClaim(item) {
  item.answeredAt = null;
  item.answerRecordId = null;
}

// Gives a claim back. Null when done; when the queue stays out of reach, the one line that says what follows:
// the claim stays set, and the item hides until its wait ends.
export function releaseClaim(root, item, { attempts = RELEASE_ATTEMPTS } = {}) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      withQueue(root, (state) => {
        if (state.items[item.key]) clearClaim(state.items[item.key]);
      });
      return null;
    } catch (error) {
      if (attempt >= attempts) return `${item.code}: nie udało się zwolnić pozycji (${error.message}), więc nie wróci do kolejki. Odpowiedz w sesji ${item.name}.`;
    }
  }
}

export function storeAnswerRecord(root, key, recordId) {
  withQueue(root, (state) => {
    if (state.items[key]) state.items[key].answerRecordId = recordId;
  });
}

// A send that failed after the record was prepared: the item waits again. No item holds another record's id.
export function releaseRecord(root, recordId) {
  withQueue(root, (state) => {
    const item = Object.values(state.items).find((candidate) => candidate.answerRecordId === recordId);
    if (item) clearClaim(item);
  });
}
