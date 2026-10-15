// The dialog path (spec §6.5): the git snapshot a fork reads instead of a shell, the fork's
// permission rules and start prompt, and its command line in the argument order probe S7 fixed.
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { excludePathspecs } from './denylist.mjs';

export const PROMPT_READY = '⏸ Czeka na decyzję: prompt gotowy do przeglądu';

// Read-only git in the source session's cwd; --no-optional-locks keeps `git status` from
// refreshing the repository's index file (spec §6.5 step 2, §8.2).
export function takeSnapshot(cwd, contextDir, { at = new Date().toISOString(), run = spawnSync } = {}) {
  mkdirSync(contextDir, { recursive: true });
  const git = (...args) => run('git', ['--no-optional-locks', '-C', cwd, ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const inside = git('rev-parse', '--is-inside-work-tree');
  const snapshot = { at, cwd, git: inside.status === 0 && String(inside.stdout).trim() === 'true' };
  if (!snapshot.git) {
    writeFileSync(join(contextDir, 'NO-GIT.txt'), `${cwd} is not inside a git work tree (${at}); there is no snapshot.\n`, 'utf8');
  } else {
    const text = (result) => (result.status === 0 ? result.stdout : `git failed (exit ${result.status}): ${result.stderr}`);
    writeFileSync(join(contextDir, 'status.txt'), text(git('status', '--short', '--', ...excludePathspecs())), 'utf8');
    writeFileSync(join(contextDir, 'log.txt'), text(git('log', '--oneline', '-20')), 'utf8');
    writeFileSync(join(contextDir, 'diff.patch'), text(git('diff', 'HEAD', '--', ...excludePathspecs())), 'utf8');
  }
  writeFileSync(join(contextDir, 'snapshot.json'), `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  return snapshot;
}

// "Repository read-only, dialog directory writable" (spec §6.5 step 2, probes S7 and S12).
export function forkSettings(dialogDir) {
  const dir = resolve(dialogDir).replace(/\\/g, '/');
  return { permissions: { allow: [`Edit(//${dir}/**)`], deny: ['Edit(./**)', 'Bash', 'EnterWorktree'] } };
}

// `--settings` before the prompt and the prompt before the variadic `--add-dir` (probe S7).
export function forkArgs({ sessionId, name, settingsPath, prompt, dialogDir }) {
  return ['--bg', '--resume', sessionId, '--fork-session', '--name', name, '--settings', settingsPath, prompt, '--add-dir', dialogDir];
}

// The fork's role (spec §6.5 step 3), a fixed text; the fork talks to Rafal in Polish.
export function forkStartPrompt({ projectName, sourceName, sourceId, dialogDir, snapshot }) {
  const dir = resolve(dialogDir);
  const context = snapshot.git
    ? `${join(dir, 'context')} holds a git snapshot of ${snapshot.cwd} taken at ${snapshot.at}: status.txt, log.txt and diff.patch.`
    : `${snapshot.cwd} is not a git work tree, so ${join(dir, 'context')} holds only a note (${snapshot.at}).`;
  return [
    `You are a dialog fork of the session ${sourceName} (${String(sourceId).slice(0, 8)}) in the project ${projectName}. Rafal talks to you after \`claude attach\`; talk to him in Polish.`,
    '',
    'Your role:',
    '- You are an analytical partner. You change nothing in the repository: no edits, no commits, no other agents.',
    '- You read the repository and the history of this conversation with the read and search tools. You have no shell.',
    `- ${context} It goes stale while the source session works on; when that matters, ask Rafal to refresh it in the hub.`,
    '- Questions and gates left open in the history you inherited are not yours: do not answer them and never end a turn with a marker for one of them. Your only gate is the review of prompt.md.',
    `- Read every decision back to Rafal. Only after he confirms it, write it into ${join(dir, 'decisions.md')} with its rationale and source.`,
    `- Questions without an answer go into ${join(dir, 'open-questions.md')}.`,
    `- When Rafal asks for the prompt, write ${join(dir, 'prompt.md')} with the sections **Cel**, **Kontekst**, **Decyzje z uzasadnieniem**, **Ograniczenia** and **Oczekiwany rezultat**, without a header line (the hub adds it), and end that turn with the line`,
    `  ${PROMPT_READY}`,
    '',
    'Now say in one or two Polish sentences what you take the subject of this dialog to be, and wait for Rafal.',
  ].join('\n');
}

// The ready command for a new Git Bash tab when the background launch fails (spec §6.5 step 2, fallback).
export function fallbackCommand({ cwd, sessionId, name, settingsPath, promptPath, dialogDir }) {
  return `cd "${cwd}" && claude --resume ${sessionId} --fork-session --name "${name}" --settings "${settingsPath}" "$(cat "${promptPath}")" --add-dir "${dialogDir}"`;
}
