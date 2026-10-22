import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { agentSetup, agentSync, main } from '../bin/talk.mjs';
import { CONFIG_PATH } from '../lib/config.mjs';

const BIN = fileURLToPath(new URL('../bin/talk.mjs', import.meta.url));
const base = { allow: ['notatki'], dialogRoot: 'x', agent: { agentId: null, toolId: null }, interruption: 'contextual-update' };

function tmpConfig(config) {
  const path = join(mkdtempSync(join(tmpdir(), 'talk-cli-')), 'config.json');
  writeFileSync(path, JSON.stringify(config), 'utf8');
  return path;
}
function recordingClient() {
  const calls = [];
  return {
    calls,
    createTool: async (b) => { calls.push(['createTool', b]); return { id: `tool_${calls.filter((c) => c[0] === 'createTool').length}` }; },
    createAgent: async (b) => { calls.push(['createAgent', b]); return { agent_id: 'agent_1' }; },
    updateTool: async (id, b) => { calls.push(['updateTool', id, b]); return {}; },
    updateAgent: async (id, b) => { calls.push(['updateAgent', id, b]); return {}; },
  };
}

test('agent setup creates both tools, then the agent with both, and saves three ids', async () => {
  const path = tmpConfig(base);
  const eleven = recordingClient();
  const out = await agentSetup({ eleven, configPath: path });
  assert.equal(out.code, 0);
  assert.deepEqual(out.lines, ['agent: agent_1', 'tool: tool_1']);
  assert.deepEqual(eleven.calls.map((c) => c[0]), ['createTool', 'createTool', 'createAgent']);
  assert.equal(eleven.calls[1][1].tool_config.name, 'end_conversation');
  assert.deepEqual(eleven.calls[2][1].conversation_config.agent.prompt.tool_ids, ['tool_1', 'tool_2']);
  assert.equal(eleven.calls[0][1].tool_config.interruption_mode, 'allow');
  assert.deepEqual(JSON.parse(readFileSync(path, 'utf8')).agent, { agentId: 'agent_1', toolId: 'tool_1', endToolId: 'tool_2' });
});

test('agent setup uses disable_during_tool for that interruption strategy', async () => {
  const eleven = recordingClient();
  await agentSetup({ eleven, configPath: tmpConfig({ ...base, interruption: 'disable-during-tool' }) });
  assert.equal(eleven.calls[0][1].tool_config.interruption_mode, 'disable_during_tool');
});

test('agent setup refuses when an agent already exists, without any API call', async () => {
  const eleven = recordingClient();
  const out = await agentSetup({ eleven, configPath: tmpConfig({ ...base, agent: { agentId: 'a', toolId: 't' } }) });
  assert.equal(out.code, 2);
  assert.equal(eleven.calls.length, 0);
});

test('agent sync creates end_conversation once, saves its id and gives the agent both tools', async () => {
  const eleven = recordingClient();
  const path = tmpConfig({ ...base, agent: { agentId: 'a', toolId: 't' } });
  const out = await agentSync({ eleven, configPath: path, env: {} });
  assert.equal(out.code, 0);
  assert.deepEqual(eleven.calls.map((c) => c.slice(0, 2).map((x, i) => (i === 1 && typeof x === 'object' ? x.tool_config.name : x))),
    [['createTool', 'end_conversation'], ['updateTool', 't'], ['updateTool', 'tool_1'], ['updateAgent', 'a']]);
  assert.equal(JSON.parse(readFileSync(path, 'utf8')).agent.endToolId, 'tool_1');
  const body = eleven.calls[3][2];
  const patch = body.conversation_config;
  assert.deepEqual(patch.agent.prompt.tool_ids, ['t', 'tool_1']);
  assert.ok(patch.agent.prompt.prompt && patch.agent.prompt.built_in_tools.end_call && patch.turn.turn_timeout === 20);
  assert.equal(patch.agent.max_conversation_duration_message, 'Kończy się czas tego połączenia, zaraz łączę ponownie.');
  assert.equal(patch.conversation.max_duration_seconds, 1800);
  assert.equal(body.platform_settings.overrides.conversation_config_override.agent.first_message, true);
  const again = recordingClient();
  await agentSync({ eleven: again, configPath: path, env: {} });
  assert.deepEqual(again.calls.map((c) => c.slice(0, 2)), [['updateTool', 't'], ['updateTool', 'tool_1'], ['updateAgent', 'a']]);
});

test('agent sync takes TALK_MAX_DURATION_SECONDS and refuses a value outside 60-7200 without any API call', async () => {
  const config = { ...base, agent: { agentId: 'a', toolId: 't', endToolId: 'e' } };
  const ok = recordingClient();
  await agentSync({ eleven: ok, configPath: tmpConfig(config), env: { TALK_MAX_DURATION_SECONDS: '60' } });
  assert.equal(ok.calls.at(-1)[2].conversation_config.conversation.max_duration_seconds, 60);
  for (const bad of ['59', '7201', 'x']) {
    const eleven = recordingClient();
    const out = await agentSync({ eleven, configPath: tmpConfig(config), env: { TALK_MAX_DURATION_SECONDS: bad } });
    assert.equal(out.code, 2);
    assert.deepEqual(out.lines, ['TALK_MAX_DURATION_SECONDS musi być liczbą całkowitą od 60 do 7200.']);
    assert.deepEqual(eleven.calls, []);
  }
});

test('agent sync without saved ids exits 2 without any API call', async () => {
  const eleven = recordingClient();
  const out = await agentSync({ eleven, configPath: tmpConfig(base) });
  assert.equal(out.code, 2);
  assert.equal(eleven.calls.length, 0);
});

function runCli(args, config, env = {}) {
  const path = tmpConfig(config);
  const r = spawnSync(process.execPath, [BIN, ...args], {
    encoding: 'utf8',
    env: { ...process.env, ELEVENLABS_API_KEY: '', TALK_USER_ENV_EMPTY: '1', TALK_CONFIG: path, ...env },
  });
  return { ...r, path };
}

test('without a key the CLI exits 2 naming ELEVENLABS_API_KEY and the User environment', () => {
  const r = runCli(['agent', 'setup'], base);
  assert.equal(r.status, 2);
  assert.match(r.stdout, /ELEVENLABS_API_KEY/);
  assert.match(r.stdout, /zmienn/);
});

test('the CLI creates the agent against a stub client and saves ids to TALK_CONFIG', () => {
  const r = runCli(['agent', 'setup'], base, { TALK_ELEVEN_STUB: '1' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^agent: \S+\ntool: \S+/);
  const saved = JSON.parse(readFileSync(r.path, 'utf8')).agent;
  assert.ok(saved.agentId && saved.toolId);
});

test('agent setup and agent sync under the stub refuse to run without TALK_CONFIG, leaving the real config untouched', async () => {
  const before = readFileSync(CONFIG_PATH, 'utf8');
  try {
    for (const env of [{ TALK_ELEVEN_STUB: '1' }, { TALK_ELEVEN_STUB: '1', TALK_CONFIG: '' }]) {
      for (const args of [['agent', 'setup'], ['agent', 'sync']]) {
        const out = await main(args, env);
        assert.equal(out.code, 2);
        assert.equal(out.lines.length, 1);
        assert.match(out.lines[0], /^Z TALK_ELEVEN_STUB=1 polecenia agent wymagają TALK_CONFIG/);
      }
    }
    assert.equal(readFileSync(CONFIG_PATH, 'utf8'), before);
  } finally {
    // Should the refusal ever regress, the real config is put back as it was.
    if (readFileSync(CONFIG_PATH, 'utf8') !== before) writeFileSync(CONFIG_PATH, before, 'utf8');
  }
});

test('an unknown command exits 2 with usage', () => {
  const r = runCli(['nope'], base);
  assert.equal(r.status, 2);
});

// --- check and start (Task 8) ---

const CLI = BIN;
const FAKE = fileURLToPath(new URL('../fakes/claude.mjs', import.meta.url));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(fn, ms) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    if (await fn()) return;
    await sleep(50);
  }
  assert.fail(`condition not met within ${ms} ms`);
}

const fixtures = mkdtempSync(join(tmpdir(), 'talk-cli-start-'));
const dialogRoot = join(fixtures, 'dialogRoot');
const hubData = join(fixtures, 'hub');
mkdirSync(hubData);
// Repositories named `allowed` and `outside`: with an empty project map the hub falls back to these names.
function gitRepo(name) {
  const dir = join(fixtures, name);
  mkdirSync(dir);
  assert.equal(spawnSync('git', ['init', dir]).status, 0);
  return dir;
}
const allowedRepo = gitRepo('allowed');
const outsideRepo = gitRepo('outside');
const startBase = { allow: ['allowed'], dialogRoot, agent: { agentId: 'agent_test', toolId: 'tool_test' }, interruption: 'contextual-update' };
const testConfig = join(fixtures, 'config.json');
writeFileSync(testConfig, JSON.stringify(startBase), 'utf8');
// The hooks a developer's shell might carry are cleared, so each test sets only what it needs.
const testEnv = { TALK_CONFIG: testConfig, HUB_DATA: hubData, TALK_USER_ENV_EMPTY: '1', TALK_ELEVEN_STUB: '', TALK_FAKE_CLAUDE: '', TALK_RAW_LOG: '', TALK_FIRST_BEAT_MS: '' };

function run(args, env = {}) {
  return spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', env: { ...process.env, ...testEnv, ...env } });
}

// A running `start` child is always ended, so a failed assertion never leaves a bridge and fork behind.
function startChild(args, env) {
  const child = spawn(process.execPath, [CLI, 'start', ...args], { env: { ...process.env, ...testEnv, ...env } });
  let out = '';
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', (c) => { out += c; });
  child.stderr.resume();
  const closed = new Promise((resolve) => child.on('close', resolve));
  return { child, out: () => out, closed };
}
const stop = ({ child }) => { if (child.exitCode === null && child.signalCode === null) child.kill(); };
const escape = (text) => text.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');

test('check refuses a project outside the allowlist in Polish, with no dialog directory created', () => {
  const r = run(['check', '--cwd', outsideRepo], { ELEVENLABS_API_KEY: 'k' });
  assert.equal(r.status, 2);
  assert.match(r.stdout, /^Projekt .+ nie jest na liście dozwolonych dla \/talk \(.+config\.json\)\.$/m);
  assert.equal(existsSync(join(dialogRoot, 'projects')), false);
});

test('check without a key tells Rafal where to set it', () => {
  const r = run(['check', '--cwd', allowedRepo], { ELEVENLABS_API_KEY: '', TALK_USER_ENV_EMPTY: '1' });
  assert.equal(r.status, 2);
  assert.match(r.stdout, /ELEVENLABS_API_KEY/);
});

test('check without a saved agent names agent setup, in one Polish sentence', () => {
  const r = run(['check', '--cwd', allowedRepo], { ELEVENLABS_API_KEY: 'k', TALK_CONFIG: tmpConfig({ ...startBase, agent: { agentId: null, toolId: null } }) });
  assert.equal(r.status, 2);
  assert.match(r.stdout, /node bin\/talk\.mjs agent setup/);
  assert.match(r.stdout, /config\.json/);
  assert.doesNotMatch(r.stdout, /^Użycie/);
  assert.equal(r.stdout.trim().split('\n').length, 1);
});

test('check accepts an allowed project with a key and an agent, and creates nothing', () => {
  const r = run(['check', '--cwd', allowedRepo], { ELEVENLABS_API_KEY: 'k' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.deepEqual(JSON.parse(r.stdout), { ok: true, project: 'allowed' });
  assert.equal(existsSync(join(dialogRoot, 'projects')), false);
});

test('a refused check or start starts no bridge, builds no client and makes no network call', async () => {
  const calls = [];
  const deps = {
    startBridge: async () => { calls.push('startBridge'); throw new Error('no bridge'); },
    createElevenClient: () => { calls.push('createElevenClient'); return {}; },
    write: async (text) => { calls.push(`write ${text}`); },
  };
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => { calls.push('fetch'); throw new Error('no network'); };
  try {
    const env = { ...process.env, ...testEnv, ELEVENLABS_API_KEY: '' };
    for (const args of [['check'], ['start', '--session', 's']]) {
      const out = await main([...args, '--cwd', outsideRepo], env, deps);
      assert.equal(out.code, 2);
      // The project is checked first: without a key it is still the project that is refused.
      assert.match(out.lines.join('\n'), /^Projekt outside nie jest na liście dozwolonych dla \/talk/);
    }
    const noAgent = { ...env, ELEVENLABS_API_KEY: 'k', TALK_CONFIG: tmpConfig({ ...startBase, agent: { agentId: null, toolId: null } }) };
    assert.equal((await main(['start', '--session', 's', '--cwd', allowedRepo], noAgent, deps)).code, 2);
    const noKey = await main(['start', '--session', 's', '--cwd', allowedRepo], env, deps);
    assert.equal(noKey.code, 2);
    assert.match(noKey.lines[0], /ELEVENLABS_API_KEY/);
  } finally {
    globalThis.fetch = realFetch;
  }
  assert.deepEqual(calls, []);
  assert.equal(existsSync(join(dialogRoot, 'projects')), false);
});

test('start without --session or --cwd, and check without --cwd, exit 2 with usage', () => {
  for (const args of [['start', '--cwd', allowedRepo], ['start', '--session', 's'], ['check']]) {
    const r = run(args, { TALK_ELEVEN_STUB: '1' });
    assert.equal(r.status, 2);
    assert.match(r.stdout, /^Użycie: /);
  }
});

test('start names its dialog directory first, serves .url there, and prints the closing report after /api/end', async () => {
  const s = startChild(['--session', 's', '--cwd', allowedRepo], { ELEVENLABS_API_KEY: 'k', TALK_ELEVEN_STUB: '1', TALK_FAKE_CLAUDE: FAKE });
  try {
    await waitFor(() => /^dialog: .+\n/.test(s.out()), 5000);
    const dialogDir = s.out().match(/^dialog: (.+)\n/)[1];
    assert.ok(dialogDir.startsWith(join(dialogRoot, 'projects')));
    await waitFor(() => existsSync(join(dialogDir, '.url')), 5000);
    const url = new URL(readFileSync(join(dialogDir, '.url'), 'utf8'));
    await fetch(new URL(`/api/end${url.search}`, url), { method: 'POST', body: '{}', headers: { 'content-type': 'application/json' } });
    const code = await s.closed;
    assert.equal(code, 0);
    assert.match(s.out(), /END OF REPORT\n$/);
    assert.match(s.out(), new RegExp(`\\nTALK CLOSING REPORT\\ndialog: ${escape(dialogDir)}\\n`));
    assert.ok(existsSync(join(dialogDir, 'transcript.md')));
  } finally {
    stop(s);
  }
});

test('start passes the subject and TALK_RAW_LOG to the fork and ends by itself after TALK_FIRST_BEAT_MS', async () => {
  const rawLog = join(fixtures, 'raw.jsonl');
  const s = startChild(['--session', 's', '--cwd', allowedRepo, '--subject', 'temat próbny'],
    { TALK_ELEVEN_STUB: '1', TALK_FAKE_CLAUDE: FAKE, TALK_RAW_LOG: rawLog, TALK_FIRST_BEAT_MS: '300' });
  try {
    const code = await s.closed;
    assert.equal(code, 0);
    assert.match(s.out(), /^dialog: .+\n/);
    assert.match(s.out(), /END OF REPORT\n$/);
    const raw = readFileSync(rawLog, 'utf8');
    assert.match(raw, /"subtype":"init"/);
    assert.match(raw, /temat próbny/);
  } finally {
    stop(s);
  }
});
