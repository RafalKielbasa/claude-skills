// Messages the hub sends (spec §6.1, §6.4): the origin header line, the fixed questionnaire request
// and the prompt template check. User-facing text stays in Polish.
import { canonical } from './text.mjs';

export const PATHS = ['direct', 'questionnaire-request', 'questionnaire-answers', 'dialog', 'new-session'];
// Every composed message carries the five sections (spec §6.1); questionnaire answers also carry
// the block with the questions and Rafal's answers (§6.1, §6.4 step 5).
export const SECTIONS = ['Cel', 'Kontekst', 'Decyzje z uzasadnieniem', 'Ograniczenia', 'Oczekiwany rezultat'];
export const ANSWERS_SECTION = 'Pytania i odpowiedzi';
const HEADER_PREFIX = '[hub · ';

// `target` names the recipient: the first 8 characters of its sessionId, or the name of a session
// still to be launched (spec §6.6).
export function headerLine({ path, project, sessionId, target, at }) {
  return `${HEADER_PREFIX}${path} · ${project} · ${target ?? String(sessionId).slice(0, 8)} · ${at.slice(0, 16).replace('T', ' ')}]`;
}

// The fixed wording of spec §6.4 step 2, laid out in the five sections.
export function questionnaireRequest({ topic, max }) {
  return [
    '**Cel**',
    `Zebrać moje decyzje o: ${topic}, zanim zaczniesz pracę.`,
    '',
    '**Kontekst**',
    'Przeczytaj projekt w zakresie potrzebnym do pytań.',
    '',
    '**Decyzje z uzasadnieniem**',
    'Jeszcze żadnych: zapadną po moich odpowiedziach.',
    '',
    '**Ograniczenia**',
    `- Liczba pytań: najwyżej ${max}.`,
    '- Pytaj tylko o to, co zmienia pracę.',
    '- Rekomendację podawaj tylko wtedy, gdy masz realny powód.',
    '- Nie edytuj plików.',
    '',
    '**Oczekiwany rezultat**',
    'Lista pytań. Zakończ turę znacznikiem bramki i nie zaczynaj pracy.',
  ].join('\n');
}

export function composeMessage({ path, project, sessionId, target, at, body }) {
  if (!PATHS.includes(path)) throw new Error(`unknown path ${path}; expected one of ${PATHS.join(', ')}`);
  return `${headerLine({ path, project, sessionId, target, at })}\n\n${canonical(body)}\n`;
}

function normalizeHeading(line) {
  return line.replace(/^[#*\s]+/, '').replace(/[*:\s]+$/, '').toLowerCase();
}

// A new session's prompt carries the project from the map (spec §6.6 step 3): one line right under
// the **Kontekst** heading. Throws when the body has no such heading.
export function withProjectContext(body, entry) {
  const lines = canonical(body).split('\n');
  const at = lines.findIndex((line) => normalizeHeading(line) === 'kontekst');
  if (at === -1) throw new Error('missing section Kontekst');
  lines.splice(at + 1, 0, `Projekt: ${entry.name} (${entry.dir}). ${entry.description}`);
  return lines.join('\n');
}

export function templateProblems(text, path) {
  const lines = canonical(text).split('\n');
  const problems = [];
  if (!lines[0]?.startsWith(HEADER_PREFIX)) problems.push('missing header line');
  const headings = new Set(lines.map(normalizeHeading));
  const required = path === 'questionnaire-answers' ? [...SECTIONS, ANSWERS_SECTION] : SECTIONS;
  for (const section of required) if (!headings.has(section.toLowerCase())) problems.push(`missing section ${section}`);
  return problems;
}
