const SEGMENT = '[^/]*';

export function globToRegExp(pattern) {
  let out = '';
  for (let i = 0; i < pattern.length; i += 1) {
    const ch = pattern[i];
    if (ch === '*' && pattern[i + 1] === '*') {
      // `**/` may also match nothing, so `**/a.ts` matches a top-level a.ts.
      if (pattern[i + 2] === '/') { out += '(?:.*/)?'; i += 2; } else { out += '.*'; i += 1; }
    } else if (ch === '*') {
      out += SEGMENT;
    } else if (ch === '?') {
      out += '[^/]';
    } else {
      out += ch.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    }
  }
  return new RegExp(`^${out}$`);
}

export function matchGlob(pattern, path) {
  return globToRegExp(pattern).test(path);
}

export function globSpecificity(pattern) {
  return pattern.split('/').filter((seg) => seg !== '' && !seg.includes('*') && !seg.includes('?')).length;
}
