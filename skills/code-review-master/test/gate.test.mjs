import { test } from 'node:test';
import assert from 'node:assert/strict';
import { exitCode } from '../lib/gate.mjs';

const finding = (over = {}) => ({ severity: 'blocking', codex: null, ...over });

test('gate none always passes', () => {
  assert.equal(exitCode({ findings: [finding()], gate: 'none', gateOnDisputed: true }), 0);
});

test('gate blocking fails only on blocking findings', () => {
  assert.equal(exitCode({ findings: [finding({ severity: 'suggestion' })], gate: 'blocking', gateOnDisputed: true }), 0);
  assert.equal(exitCode({ findings: [finding()], gate: 'blocking', gateOnDisputed: true }), 1);
});

test('gate any fails on any finding', () => {
  assert.equal(exitCode({ findings: [finding({ severity: 'nitpick' })], gate: 'any', gateOnDisputed: true }), 1);
});

test('a codex-disputed blocking finding still fails by default', () => {
  const disputed = finding({ codex: { verdict: 'rejects', reason: 'r', fix: null } });
  assert.equal(exitCode({ findings: [disputed], gate: 'blocking', gateOnDisputed: true }), 1);
  assert.equal(exitCode({ findings: [disputed], gate: 'blocking', gateOnDisputed: false }), 0);
});
