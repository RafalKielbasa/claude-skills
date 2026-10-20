// The bridge's closing report (spec §5.4): session X reads it from the background task's output.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const FILES = [['decisions', 'decisions.md'], ['openQuestions', 'open-questions.md'], ['prompt', 'prompt.md']];

export function readDialogFiles(dialogDir) {
  // A missing file, or a missing dialog directory, reads as not written.
  const read = (name) => (existsSync(join(dialogDir, name)) ? readFileSync(join(dialogDir, name), 'utf8') : undefined);
  return Object.fromEntries(FILES.map(([key, name]) => [key, read(name)]));
}

export function closingReport({ dialogDir, files, deletion, conversations }) {
  const section = ([key, name]) => {
    const body = files[key];
    return `--- ${name} ---\n${body === undefined ? '(not written)\n' : body.endsWith('\n') ? body : `${body}\n`}`;
  };
  const convs = conversations.length ? conversations.map(({ id, seconds }) => `${id} (${seconds === null ? 'unknown' : `${seconds} s`})`).join(', ') : 'none';
  return `TALK CLOSING REPORT\ndialog: ${dialogDir}\ndeletion: ${deletion}\nconversations: ${convs}\n${FILES.map(section).join('')}END OF REPORT\n`;
}
