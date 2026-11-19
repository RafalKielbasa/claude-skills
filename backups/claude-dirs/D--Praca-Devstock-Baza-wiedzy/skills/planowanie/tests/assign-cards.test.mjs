import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { assignCards } from '../assign-cards.mjs'

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assign-cards.mjs')

const project = over => ({ key: 'p', name: 'P', match: ['x'], kb: [], repos: [], web: '', ...over })
const card = (n, title, over = {}) => ({
  board: 'devstock-org#3', ref: `devstock-org/devstock-team#${n}`, title, url: '', status: 'Backlog',
  state: 'backlog', assignees: [], labels: [], createdAt: '2026-11-01T00:00:00Z', sprintStart: null, estimate: null, ...over,
})
const entry = (n, title, over = {}) => ({
  board: 'devstock-org#3', ref: `devstock-org/devstock-team#${n}`, title, url: '', status: 'Done', state: 'done',
  closed: true, stateReason: 'COMPLETED', closedAt: '2026-11-18T10:00:00Z', assignees: [], estimate: null, ...over,
})
const noReview = { planned: [], unplanned: [] }
const refsOf = cards => cards.map(c => c.ref.split('#')[1])

test('first project in registry order wins', () => {
  const registry = [project({ key: 'kodozercy', match: ['kodożerc'] }), project({ key: 'tresci', match: ['kurs'] })]
  const out = assignCards(registry, { items: [card(1, 'DT-109: Kodożercy: kursy AI i Pythona wyżej')] }, noReview)
  assert.deepEqual(refsOf(out.projects[0].open), ['1'])
  assert.deepEqual(out.projects[1].open, [])
  assert.deepEqual(out.projects.map(p => p.key), ['kodozercy', 'tresci'])
})

test('match is case-insensitive with Polish letters', () => {
  const out = assignCards([project({ key: 'rzesownia', match: ['rzęsowni'] })], { items: [card(2, 'RZĘSOWNIA: backup')] }, noReview)
  assert.deepEqual(refsOf(out.projects[0].open), ['2'])
})

test('exclude keeps a card out of a project', () => {
  const registry = [project({ key: 'kodozercy', match: ['subskrypc'], exclude: ['sas:'] })]
  const out = assignCards(registry, { items: [card(3, 'SAS: Implementacja modelu subskrypcji')] }, noReview)
  assert.deepEqual(out.projects[0].open, [])
  assert.deepEqual(refsOf(out.unassigned.open), ['3'])
})

test('unmatched card is unassigned', () => {
  const out = assignCards([project({ match: ['fud'] })], { items: [card(4, 'DT-58: Mapa obszarów firmy')] }, noReview)
  assert.deepEqual(refsOf(out.unassigned.open), ['4'])
  assert.deepEqual(out.projects[0].open, [])
})

test('done takes completed planned and all unplanned', () => {
  const review = {
    planned: [
      entry(10, 'x done'),
      entry(11, 'x in progress', { state: 'in_progress', closed: false, stateReason: null, closedAt: null }),
      entry(12, 'x dropped', { state: 'done', closed: true, stateReason: 'NOT_PLANNED' }),
      entry(13, 'x closed', { state: 'backlog', closed: true, stateReason: 'COMPLETED' }),
    ],
    unplanned: [entry(14, 'x unplanned')],
  }
  const out = assignCards([project()], { items: [] }, review)
  assert.deepEqual(refsOf(out.projects[0].done).sort(), ['10', '13', '14'])
  assert.equal(out.projects[0].done[0].sprintStart, null)
})

test('registry without match throws', () => {
  assert.throws(() => assignCards([project(), project({ match: [] })], { items: [] }, noReview), /project 1 lacks match/)
})

function writeInputs(bom) {
  const dir = mkdtempSync(join(tmpdir(), 'planowanie-'))
  const put = (name, value) => {
    const path = join(dir, name)
    writeFileSync(path, (bom ? '﻿' : '') + JSON.stringify(value), 'utf8')
    return path
  }
  return {
    registry: put('projects.json', [project({ key: 'fud', match: ['fud'] })]),
    candidates: put('candidates.json', { items: [card(5, 'FUD: credentiale MQTT')], projectWork: [] }),
    review: put('review.json', { sprint: '2026-11-16', end: '2026-11-22', boards: [], planned: [], unplanned: [], interns: [] }),
    dir,
  }
}

const run = args => spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' })

test('CLI reads files with a UTF-8 BOM', () => {
  const f = writeInputs(true)
  const res = run(['--registry', f.registry, '--candidates', f.candidates, '--review', f.review])
  assert.equal(res.status, 0, res.stderr)
  const out = JSON.parse(res.stdout)
  assert.equal(out.projects.length, 1)
  assert.deepEqual(refsOf(out.projects[0].open), ['5'])
})

test('CLI exits 1 on a missing file', () => {
  const f = writeInputs(false)
  const missing = join(f.dir, 'nope.json')
  const res = run(['--registry', f.registry, '--candidates', missing, '--review', f.review])
  assert.equal(res.status, 1)
  assert.match(res.stderr, /nope\.json/)
})
