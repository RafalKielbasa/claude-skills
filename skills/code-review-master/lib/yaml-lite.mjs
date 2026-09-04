export class YamlLiteError extends Error {
  constructor(lineNo, text, why) {
    super(`yaml-lite: line ${lineNo}: ${why} — ${JSON.stringify(text)}`);
    this.lineNo = lineNo;
  }
}

function stripComment(line) {
  let quote = null;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quote) { if (ch === quote) quote = null; continue; }
    if (ch === "'" || ch === '"') { quote = ch; continue; }
    if (ch === '#') return line.slice(0, i);
  }
  return line;
}

function splitTop(body, sep) {
  const parts = [];
  let depth = 0, quote = null, current = '';
  for (const ch of body) {
    if (quote) { current += ch; if (ch === quote) quote = null; continue; }
    if (ch === "'" || ch === '"') { quote = ch; current += ch; continue; }
    if (ch === '[' || ch === '{') depth += 1;
    if (ch === ']' || ch === '}') depth -= 1;
    if (ch === sep && depth === 0) { parts.push(current); current = ''; continue; }
    current += ch;
  }
  if (current.trim() !== '') parts.push(current);
  return parts;
}

function scalar(raw, lineNo, text) {
  const t = raw.trim();
  if (t === '') return '';
  if ((t.startsWith("'") && t.endsWith("'")) || (t.startsWith('"') && t.endsWith('"'))) return t.slice(1, -1);
  if (t === 'true') return true;
  if (t === 'false') return false;
  if (t === 'null') return null;
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  if (t.startsWith('[') && t.endsWith(']')) {
    return splitTop(t.slice(1, -1), ',').map((item) => scalar(item, lineNo, text));
  }
  if (t.startsWith('{') && t.endsWith('}')) {
    const map = {};
    for (const entry of splitTop(t.slice(1, -1), ',')) {
      const at = entry.indexOf(':');
      if (at === -1) throw new YamlLiteError(lineNo, text, 'inline map entry without a colon');
      map[entry.slice(0, at).trim()] = scalar(entry.slice(at + 1), lineNo, text);
    }
    return map;
  }
  if (t === '|' || t === '>') throw new YamlLiteError(lineNo, text, 'block scalars are not supported');
  if (t.includes(': ')) throw new YamlLiteError(lineNo, text, 'unsupported nested syntax');

  // Reject unterminated quotes
  if ((t.startsWith("'") || t.startsWith('"')) && t.length >= 2) {
    const quote = t[0];
    if (!t.endsWith(quote)) {
      throw new YamlLiteError(lineNo, text, `unterminated ${quote === "'" ? 'single' : 'double'} quote`);
    }
  }

  // Reject unbalanced brackets or braces
  if ((t.startsWith('[') && !t.endsWith(']')) || (t.startsWith('{') && !t.endsWith('}'))) {
    throw new YamlLiteError(lineNo, text, 'unbalanced bracket or brace');
  }
  if ((t.endsWith(']') && !t.startsWith('[')) || (t.endsWith('}') && !t.startsWith('{'))) {
    throw new YamlLiteError(lineNo, text, 'unbalanced bracket or brace');
  }

  // Reject unsupported YAML constructs (anchors, tags, etc.)
  const firstChar = t[0];
  if (firstChar === '&' || firstChar === '!' || firstChar === '%' || firstChar === '@' || firstChar === '`') {
    throw new YamlLiteError(lineNo, text, 'unsupported YAML construct');
  }

  // Reject * as first character (but allow in plain values like **/*.tsx)
  if (firstChar === '*' && t.length === 1) {
    throw new YamlLiteError(lineNo, text, 'unsupported YAML construct');
  }

  return t;
}

export function parseYamlLite(text) {
  const out = {};
  const lines = text.split(/\r?\n/);
  let key = null;
  for (let i = 0; i < lines.length; i += 1) {
    const raw = stripComment(lines[i]);
    if (raw.trim() === '') continue;
    const indent = raw.length - raw.trimStart().length;
    const body = raw.trim();

    if (indent === 0) {
      const at = body.indexOf(':');
      if (at === -1) throw new YamlLiteError(i + 1, body, 'top-level line without a colon');
      key = body.slice(0, at).trim();
      const rest = body.slice(at + 1).trim();
      out[key] = rest === '' ? undefined : scalar(rest, i + 1, body);
      continue;
    }
    if (indent !== 2) throw new YamlLiteError(i + 1, body, 'only two-space indentation is supported');
    if (key === null) throw new YamlLiteError(i + 1, body, 'indented line without a parent key');

    if (body.startsWith('- ')) {
      if (out[key] === undefined) out[key] = [];
      if (!Array.isArray(out[key])) throw new YamlLiteError(i + 1, body, 'list item under a non-list key');
      out[key].push(scalar(body.slice(2), i + 1, body));
      continue;
    }
    const at = body.indexOf(':');
    if (at === -1) throw new YamlLiteError(i + 1, body, 'nested line without a colon');
    if (out[key] === undefined) out[key] = {};
    if (typeof out[key] !== 'object' || Array.isArray(out[key])) {
      throw new YamlLiteError(i + 1, body, 'map entry under a non-map key');
    }
    out[key][body.slice(0, at).trim()] = scalar(body.slice(at + 1), i + 1, body);
  }
  for (const [k, v] of Object.entries(out)) {
    if (v === undefined) throw new YamlLiteError(0, k, 'key has no value and no indented block');
  }
  return out;
}
