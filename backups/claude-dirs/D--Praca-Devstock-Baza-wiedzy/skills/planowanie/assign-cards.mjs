// Assigns the main board's cards to the projects of `projects.json` for /planowanie.
// Usage: node .claude/skills/planowanie/assign-cards.mjs --registry <path> --candidates <path> --review <path>
// Inputs are the board-tracker outputs of `sprint-candidates` and `sprint-review`; prints the Assignment as JSON.
import { readFileSync } from 'node:fs'
import { parseArgs } from 'node:util'
import { pathToFileURL } from 'node:url'

const CARD_FIELDS = ['ref', 'title', 'status', 'state', 'assignees', 'labels', 'createdAt', 'sprintStart', 'estimate']
const UNDONE = new Set(['NOT_PLANNED', 'DUPLICATE'])

const toCard = source => Object.fromEntries(CARD_FIELDS.map(f => [f, source[f] ?? null]))

function validate(registry) {
  if (!Array.isArray(registry)) throw new Error('projects.json: not an array')
  registry.forEach((p, i) => {
    for (const field of ['key', 'name', 'match']) {
      const value = p?.[field]
      if (!value || (Array.isArray(value) && value.length === 0)) throw new Error(`projects.json: project ${i} lacks ${field}`)
    }
  })
}

// The first project, in registry order, with a `match` fragment in the title and no `exclude` fragment.
function projectOf(registry, title) {
  const t = String(title).toLowerCase()
  const hit = fragments => (fragments ?? []).some(f => t.includes(String(f).toLowerCase()))
  return registry.find(p => hit(p.match) && !hit(p.exclude)) ?? null
}

const isDone = e => (e.state === 'done' || e.closed === true) && !UNDONE.has(e.stateReason)

// A project with `outside: true` is not part of the Friday planning (a client runs it, or it is
// out of scope): its cards go to `outside`, never to `projects` or `unassigned`.
export function assignCards(registry, candidates, review) {
  validate(registry)
  const projects = registry.filter(p => !p.outside).map(p => ({ key: p.key, name: p.name, open: [], done: [] }))
  const byKey = new Map(projects.map(p => [p.key, p]))
  const unassigned = { open: [], done: [] }
  const outside = { open: [], done: [] }
  const place = (source, list) => {
    const project = projectOf(registry, source.title)
    const target = !project ? unassigned : project.outside ? outside : byKey.get(project.key)
    target[list].push(toCard(source))
  }
  for (const item of candidates.items ?? []) place(item, 'open')
  for (const e of review.planned ?? []) if (isDone(e)) place(e, 'done')
  for (const e of review.unplanned ?? []) place(e, 'done')
  return { projects, unassigned, outside }
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8').replace(/^﻿/, ''))
  } catch (err) {
    throw new Error(`${path}: ${err.message}`)
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { values } = parseArgs({ options: { registry: { type: 'string' }, candidates: { type: 'string' }, review: { type: 'string' } } })
    for (const name of ['registry', 'candidates', 'review']) if (!values[name]) throw new Error(`missing --${name}`)
    const out = assignCards(readJson(values.registry), readJson(values.candidates), readJson(values.review))
    process.stdout.write(JSON.stringify(out, null, 2) + '\n')
  } catch (err) {
    process.stderr.write(`assign-cards: ${err.message}\n`)
    process.exit(1)
  }
}
