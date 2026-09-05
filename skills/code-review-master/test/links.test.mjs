import { test } from 'node:test';
import assert from 'node:assert/strict';
import { remoteToHttps, blobLink } from '../lib/links.mjs';

test('ssh and https remotes both resolve', () => {
  assert.equal(remoteToHttps('git@github.com:RafalKielbasa/app.git'), 'https://github.com/RafalKielbasa/app');
  assert.equal(remoteToHttps('https://github.com/RafalKielbasa/app.git'), 'https://github.com/RafalKielbasa/app');
});

test('ssh:// URLs and https URLs carrying userinfo also resolve', () => {
  assert.equal(remoteToHttps('ssh://git@github.com/RafalKielbasa/app.git'), 'https://github.com/RafalKielbasa/app');
  assert.equal(remoteToHttps('https://user@github.com/RafalKielbasa/app.git'), 'https://github.com/RafalKielbasa/app');
  assert.equal(remoteToHttps('https://user:token@github.com/RafalKielbasa/app'), 'https://github.com/RafalKielbasa/app');
  assert.equal(remoteToHttps('ssh://git@github.com:22/RafalKielbasa/app.git'), 'https://github.com/RafalKielbasa/app');
});

test('a non-github remote yields no link', () => {
  assert.equal(remoteToHttps('git@gitlab.com:x/y.git'), null);
  assert.equal(blobLink('git@gitlab.com:x/y.git', 'abc', 'a.ts', [1, 2]), null);
});

test('a single-line finding gets a single-line anchor', () => {
  assert.equal(blobLink('git@github.com:R/app.git', 'sha1', 'a.ts', [88, 88]),
    'https://github.com/R/app/blob/sha1/a.ts#L88');
});

test('blob links carry the sha and the line range', () => {
  assert.equal(
    blobLink('git@github.com:RafalKielbasa/app.git', 'a1f2e30', 'apps/api/a.ts', [88, 94]),
    'https://github.com/RafalKielbasa/app/blob/a1f2e30/apps/api/a.ts#L88-L94',
  );
});
