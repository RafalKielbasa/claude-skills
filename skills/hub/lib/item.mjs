// The text of one queue item and of the queue section (spec §4.1, §4.3-4.5). What an item quotes comes
// from another session, so it is data: shown verbatim, never summarised. Pure functions; the only file
// access is loadItemContext.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pendingDir, safeId } from './paths.mjs';
import { readEvents, lastMessagePath } from './registry.mjs';
import { deriveSession } from './derive.mjs';
import { readPending } from './pending.mjs';
import { isAlive } from './owner.mjs';
import { codeEntry, itemByCode, openItems } from './queue.mjs';

export const QUOTE_MAX = 4000;
export const PREVIEW_MAX = 1500;
const TAIL_LINES = 12;
const HEADING = '### ❓ PYTANIE I WARIANTY';
const isMarker = (line) => line.trimStart().startsWith('⏸');
const isDetails = (line) => line.trimStart().startsWith('<details');

const trimBlank = (lines) => {
  let start = 0;
  let end = lines.length;
  while (start < end && !lines[start].trim()) start += 1;
  while (end > start && !lines[end - 1].trim()) end -= 1;
  return lines.slice(start, end);
};

// The gate of a message: from under the question heading up to <details> or the marker line, else the last
// 12 non-empty lines before the marker. The marker line is always included. A body over 4000 characters is
// cut (the end of a heading section, the start of a tail) and hiddenChars says how much.
export function gateQuote(message) {
  const lines = String(message ?? '').split(/\r?\n/);
  let markerAt = -1;
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    if (isMarker(lines[i])) {
      markerAt = i;
      break;
    }
  }
  const marker = markerAt >= 0 ? lines[markerAt].trim() : '';
  const heading = lines.findIndex((line) => line.trim() === HEADING);
  let body;
  let keepHead;
  if (heading >= 0) {
    keepHead = true;
    let end = lines.length;
    for (let i = heading + 1; i < lines.length; i += 1) {
      if (isDetails(lines[i]) || isMarker(lines[i])) {
        end = i;
        break;
      }
    }
    body = trimBlank(lines.slice(heading + 1, end)).join('\n');
  } else {
    keepHead = false;
    const before = markerAt >= 0 ? lines.slice(0, markerAt) : lines;
    body = before.filter((line) => line.trim()).slice(-TAIL_LINES).join('\n');
  }
  let hiddenChars = 0;
  if (body.length > QUOTE_MAX) {
    hiddenChars = body.length - QUOTE_MAX;
    body = keepHead ? body.slice(0, QUOTE_MAX) : body.slice(hiddenChars);
  }
  return { text: [body, marker].filter(Boolean).join('\n'), hiddenChars };
}

// The tool input as Rafal needs to judge it: the literal command for Bash, the path and sizes for Write
// and Edit, JSON for the rest. Beyond 1500 characters it is cut and says where the whole is.
export function inputPreview(tool, input, pendingPath) {
  const data = input && typeof input === 'object' ? input : {};
  let text;
  if (tool === 'Bash' && typeof data.command === 'string') text = data.command;
  else if (tool === 'Write') text = `${data.file_path ?? ''} (treść: ${String(data.content ?? '').length} znaków)`;
  else if (tool === 'Edit') text = `${data.file_path ?? ''} (zamiana: ${String(data.old_string ?? '').length} znaków na ${String(data.new_string ?? '').length})`;
  else text = JSON.stringify(input ?? null);
  if (text.length <= PREVIEW_MAX) return text;
  return `${text.slice(0, PREVIEW_MAX)}\n(ukryto ${text.length - PREVIEW_MAX} znaków, całość: ${pendingPath})`;
}

export const clock = (ms) => {
  const date = new Date(ms);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const headline = (item) => (item.kind === 'decision' ? 'Decyzja do podjęcia' : 'Uprawnienia do zaakceptowania');
const titleLine = (item) => `${item.code} · ${item.name} (${item.project}) · ${headline(item)} · czeka od ${clock(item.since)}`;

// ctx = { message, messagePath, pending, pendingPath }, as loadItemContext returns it.
export function renderItem(item, ctx = {}) {
  const answerThere = `Odpowiedz w sesji ${item.name}. \`dalej\` pomija.`;
  // An ask tool's question is not in the session's last message, so a quote would be false context.
  if (item.askTool) return [titleLine(item), answerThere].join('\n');
  const lines = [titleLine(item)];
  if (item.kind === 'decision') {
    if (ctx.message != null) {
      const quote = gateQuote(ctx.message);
      lines.push(quote.text);
      if (quote.hiddenChars) lines.push(`(ukryto ${quote.hiddenChars} znaków)`);
    } else lines.push('(nie udało się odczytać wiadomości sesji)');
    if (ctx.messagePath) lines.push(`Cała wiadomość: ${ctx.messagePath}`);
  } else if (ctx.pending) {
    lines.push(`${ctx.pending.tool}: ${inputPreview(ctx.pending.tool, ctx.pending.input, ctx.pendingPath)}`);
  }
  // A permission whose pending record is gone has no hook behind it, whatever the item says.
  const hookBehind = item.answerable && (item.kind === 'decision' || Boolean(ctx.pending));
  if (!hookBehind) lines.push(answerThere);
  else if (item.kind === 'decision') lines.push(`\`dawaj\` omawia głosem, \`${item.code} <tekst>\` idzie do sesji, \`dalej\` pomija`);
  else lines.push(`\`! ok ${item.code}\` zatwierdza, \`! nie ${item.code}\` odmawia, \`dalej\` pomija`);
  return lines.join('\n');
}

// The queue section of the overview: `pauza od <HH:MM>` when paused, in a walk the item that holds it, then one
// line per open item, oldest first.
export function renderQueue(state) {
  const lines = [];
  if (state.mode === 'paused' && state.pausedAt) lines.push(`pauza od ${clock(state.pausedAt)}`);
  const current = state.mode === 'walking' ? state.items[state.walkCurrent] : null;
  if (current?.code && !current.answeredAt && !current.skippedAt) lines.push(`przegląd: bieżąca ${current.code}`);
  for (const item of openItems(state)) lines.push(titleLine({ ...item, code: item.code ?? '?' }));
  return lines.join('\n');
}

const isClosed = (state, item) => Boolean(item.answeredAt || item.skippedAt || codeEntry(state, item.code)?.closedAt);

// The item a `HUB item [code]` names, or the sentence saying why there is none.
export function findItem(state, rawCode) {
  if (rawCode == null || rawCode === true) {
    const last = state.lastAnnounced;
    if (!last) return { error: 'Nic jeszcze nie ogłoszono. Podaj kod, np. „dawaj a3”.' };
    const item = itemByCode(state, last);
    if (!item || isClosed(state, item)) return { error: `Ostatnio ogłoszona pozycja (${last}) już nie czeka. Nic nie zrobiłem.` };
    return { item };
  }
  // A skipped item still waits, so its own code keeps naming it; only the bare form above has left it.
  const code = String(rawCode).toLowerCase();
  const item = itemByCode(state, code);
  const entry = codeEntry(state, code);
  if (!item && !entry) return { error: `${code}: nie ma takiej pozycji` };
  if (!item || item.answeredAt || entry?.closedAt) return { error: `${code}: ta pozycja już nie czeka` };
  return { item };
}

// The last message of the item's session and the pending record behind a permission, read from disk. A
// record whose pid is gone counts as closed (lib/pending.mjs), so it is no pending record here either.
export function loadItemContext(root, item) {
  const ctx = {};
  if (item.kind === 'decision') {
    try {
      const path = lastMessagePath(root, deriveSession(readEvents(root, item.sessionId).events).lastStop);
      if (path) {
        ctx.messagePath = path;
        ctx.message = readFileSync(path, 'utf8');
      }
    } catch {
      // no readable last message: the item still shows its first and last line
    }
  } else if (item.pendingId) {
    const pending = readPending(root, item.pendingId);
    ctx.pending = pending && isAlive(pending.pid) ? pending : null;
    ctx.pendingPath = join(pendingDir(root), `${safeId(item.pendingId)}.json`);
  }
  return ctx;
}
