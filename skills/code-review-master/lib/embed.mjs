// `</script>` inside a JSON string closes the block that holds it. Evidence is
// copied verbatim out of the repository, so any file containing that string
// would otherwise inject markup into a page the user may share.
//
// The Unicode line separator and paragraph separator characters (code points
// 0x2028 and 0x2029) are legal inside a JSON string but are themselves line
// terminators inside a JavaScript source file — a browser parsing this file's
// own script block as JS, not just handing its text to JSON.parse, would
// otherwise choke on them, so they are escaped the same way `<`, `>` and `&`
// are. They are built here from character codes, never typed literally, for
// the same reason: a raw line separator inside a comment silently truncates
// that comment where it stands, corrupting whatever code follows on the
// same source line.
const BACKSLASH = String.fromCharCode(0x5c);
const LINE_SEPARATOR = String.fromCharCode(0x2028);
const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029);

const ESCAPES = new Map([
  ['<', BACKSLASH + 'u003c'],
  ['>', BACKSLASH + 'u003e'],
  ['&', BACKSLASH + 'u0026'],
  [LINE_SEPARATOR, BACKSLASH + 'u2028'],
  [PARAGRAPH_SEPARATOR, BACKSLASH + 'u2029'],
]);

const PATTERN = new RegExp('[<>&' + LINE_SEPARATOR + PARAGRAPH_SEPARATOR + ']', 'g');

export function embedJson(value) {
  return JSON.stringify(value).replace(PATTERN, (ch) => ESCAPES.get(ch));
}
