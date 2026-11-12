import { parseYamlLite } from './yaml-lite.mjs';

export const DEFAULT_SETTINGS = {
  budget: { slots: 5, max_files_per_axis: 40 },
  confidence_threshold: { blocking: 85, suggestion: 70, nitpick: 70 },
  gate: 'blocking',
  gate_on_disputed: true,
  // codex.find: codex also runs as a finder (not only as the verifier).
  codex: { enabled: true, timeout_s: 300, find: true, find_timeout_s: 600 },
  // The image is pinned on purpose: an unpinned scanner changes its rules
  // between runs, so a finding could appear or vanish without any code change.
  semgrep: { enabled: true, image: 'semgrep/semgrep:1.182.1', timeout_s: 300 },
  commands: {},
  // A review's own artefacts are never its subject: without this, a
  // repository whose config.md predates this default keeps spending its
  // budget reviewing state.json and its reports, which every run rewrites —
  // an otherwise-clean tree stays permanently non-empty because of the review
  // itself, not because of anything the repository's own history changed.
  exclude: ['.claude/review/**'],
  disable: [],
};

// The image lands in docker's argv right before the container command, so a
// value starting with `-` would be parsed as a docker option (`--privileged`).
// A tag or a digest at the end is what "pinned" means; the name before it is
// held to the lowercase characters Docker allows in a repository name.
const PINNED_IMAGE_SUFFIX = /(:[^:/@]+|@sha256:[0-9a-f]{64})$/;
const IMAGE_REFERENCE = /^[a-z0-9][a-z0-9._/:-]*(:[^:/@]+|@sha256:[0-9a-f]{64})$/;

const RANKS = new Set(['always', 'rotate']);
const SEVERITIES = new Set(['blocking', 'suggestion', 'nitpick']);

function splitFrontmatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n?---\r?\n?/.exec(text);
  if (!match) return { front: '', body: text };
  return { front: match[1], body: text.slice(match[0].length) };
}

// A section is an axis only when its first fenced block is yaml; anything else
// is prose that lives in the same document (title, rationale, links).
function sectionToAxis(heading, body) {
  const fence = /```ya?ml\r?\n([\s\S]*?)```/.exec(body);
  if (!fence) return null;
  const meta = parseYamlLite(fence[1]);
  const checklist = `${body.slice(0, fence.index)}${body.slice(fence.index + fence[0].length)}`.trim();
  return {
    id: meta.id,
    when: meta.when ?? 'always',
    rank: meta.rank ?? 'rotate',
    group: meta.group ?? null,
    severity_default: meta.severity_default ?? 'suggestion',
    max_files: meta.max_files ?? null,
    tools: meta.tools ?? [],
    semgrep: meta.semgrep ?? [],
    heading,
    checklist,
  };
}

export function parseConfigDoc(text) {
  const { front, body } = splitFrontmatter(text);
  const settings = front.trim() === '' ? {} : parseYamlLite(front);
  const axes = [];
  const ignoredSections = [];
  const parts = body.split(/^## +/m).slice(1);
  for (const part of parts) {
    const newline = part.indexOf('\n');
    const heading = (newline === -1 ? part : part.slice(0, newline)).trim();
    const rest = newline === -1 ? '' : part.slice(newline + 1);
    const axis = sectionToAxis(heading, rest);
    if (axis === null) continue;
    if (axis.id === undefined) { ignoredSections.push(heading); continue; }
    axes.push(axis);
  }
  return { settings, axes, ignoredSections };
}

export function mergeConfig(globalDoc, repoDoc) {
  const settings = {
    ...DEFAULT_SETTINGS,
    ...globalDoc.settings,
    ...repoDoc.settings,
    budget: { ...DEFAULT_SETTINGS.budget, ...globalDoc.settings.budget, ...repoDoc.settings.budget },
    confidence_threshold: {
      ...DEFAULT_SETTINGS.confidence_threshold,
      ...globalDoc.settings.confidence_threshold,
      ...repoDoc.settings.confidence_threshold,
    },
    codex: { ...DEFAULT_SETTINGS.codex, ...globalDoc.settings.codex, ...repoDoc.settings.codex },
    semgrep: { ...DEFAULT_SETTINGS.semgrep, ...globalDoc.settings.semgrep, ...repoDoc.settings.semgrep },
  };
  const disabled = new Set(settings.disable ?? []);
  const byId = new Map();
  for (const axis of globalDoc.axes) byId.set(axis.id, axis);
  for (const axis of repoDoc.axes) byId.set(axis.id, axis);
  const axes = [...byId.values()].filter((axis) => !disabled.has(axis.id));
  return { settings, axes };
}

export function validateConfig({ settings, axes }) {
  const problems = [];
  const seen = new Set();
  for (const axis of axes) {
    if (!axis.id) problems.push(`axis "${axis.heading}" has no id`);
    if (seen.has(axis.id)) problems.push(`duplicate axis id "${axis.id}"`);
    seen.add(axis.id);
    if (!RANKS.has(axis.rank)) problems.push(`axis "${axis.id}" has rank "${axis.rank}", expected always or rotate`);
    if (!SEVERITIES.has(axis.severity_default)) {
      problems.push(`axis "${axis.id}" has severity_default "${axis.severity_default}"`);
    }
    if (axis.when !== 'always' && !Array.isArray(axis.when)) {
      problems.push(`axis "${axis.id}" has a when that is neither "always" nor a list of globs`);
    }
    if (axis.checklist.trim() === '') problems.push(`axis "${axis.id}" has an empty checklist`);
    // A cap of 0 would be a third way to switch an axis off, next to `disable`
    // and deleting it — and the only one that is silent. Refuse it here so the
    // runtime never has to guess whether 0 meant "never" or was a typo.
    if (axis.max_files !== null && !(Number.isInteger(axis.max_files) && axis.max_files > 0)) {
      problems.push(`axis "${axis.id}" has max_files ${JSON.stringify(axis.max_files)}; use a positive integer, or omit it to inherit the default`);
    }
    if (!Array.isArray(axis.semgrep) || !axis.semgrep.every((p) => typeof p === 'string' && p.trim() !== '')) {
      problems.push(`axis "${axis.id}" has a semgrep value that is not a list of non-empty rule-pack strings`);
    } else {
      // Each pack follows `--config` in docker's argv; one starting with `-`
      // would be read by Semgrep as an option of its own, not as a rule pack.
      for (const pack of axis.semgrep.filter((p) => /^\s*-/.test(p))) {
        problems.push(`axis "${axis.id}" has a semgrep rule pack "${pack}" that starts with "-"; a rule pack is a registry id or a path`);
      }
    }
  }
  if (!['blocking', 'any', 'none'].includes(settings.gate)) {
    problems.push(`gate is "${settings.gate}", expected blocking, any or none`);
  }
  if (!Number.isInteger(settings.budget.slots) || settings.budget.slots < 1) {
    problems.push('budget.slots must be a positive integer');
  }
  if (!(Number.isInteger(settings.budget.max_files_per_axis) && settings.budget.max_files_per_axis > 0)) {
    problems.push('budget.max_files_per_axis must be a positive integer');
  }
  // A tag-less or :latest image drifts silently between runs (see DEFAULT_SETTINGS).
  const image = settings.semgrep.image;
  if (typeof image !== 'string' || !PINNED_IMAGE_SUFFIX.test(image) || image.endsWith(':latest')) {
    problems.push(`semgrep.image "${image}" must be pinned to a version tag, not latest or tag-less`);
  } else if (!IMAGE_REFERENCE.test(image)) {
    problems.push(`semgrep.image "${image}" is not an image reference: lowercase name starting with a letter or digit, then a tag or @sha256 digest`);
  }
  return problems;
}
