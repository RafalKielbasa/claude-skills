// CLI. Session X runs `check` and `start` (SKILL.md); `agent setup` and `agent sync` are run by hand.
//   node bin/talk.mjs check --cwd <dir>
//   node bin/talk.mjs start --session <id> --cwd <dir> [--subject <text>]
//   node bin/talk.mjs agent setup | agent sync
// Test hooks (env): TALK_CONFIG, TALK_FAKE_CLAUDE, TALK_ELEVEN_STUB=1, TALK_USER_ENV_EMPTY=1,
// TALK_FIRST_BEAT_MS, TALK_RAW_LOG, HUB_DATA.
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { loadProjectMap, projectOf } from '../../hub/lib/projects.mjs';
import { hubRoot } from '../../hub/lib/paths.mjs';
import { CONFIG_PATH, loadConfig, saveConfig } from '../lib/config.mjs';
import { dialogDirFor } from '../lib/dialog.mjs';
import { startBridge } from '../lib/bridge.mjs';
import { loadKey } from '../lib/key.mjs';
import { createElevenClient } from '../lib/eleven.mjs';
import { agentConfig, askClaudeToolConfig } from '../lib/agent-config.mjs';

const SKILL_DIR = resolve(fileURLToPath(new URL('../', import.meta.url)));
const NO_KEY = 'Brak klucza ELEVENLABS_API_KEY: ustaw go jako zmienną środowiskową użytkownika (User) w Windows i uruchom polecenie ponownie.';
const USAGE = 'Użycie: node bin/talk.mjs check --cwd <katalog> | start --session <id> --cwd <katalog> [--subject <tekst>] | agent setup | agent sync';
const notAllowed = (key, configPath) => `Projekt ${key} nie jest na liście dozwolonych dla /talk (${configPath}).`;
const noAgent = (configPath) => `Brak agenta ElevenLabs w ${configPath}: uruchom najpierw node bin/talk.mjs agent setup w katalogu ${SKILL_DIR}.`;
const noDir = (cwd) => `Katalog ${cwd} nie istnieje.`;
const STUB_NEEDS_CONFIG = `Z TALK_ELEVEN_STUB=1 polecenia agent wymagają TALK_CONFIG, bo bez niego identyfikatory zaślepki trafiłyby do prawdziwego ${CONFIG_PATH}.`;

const interruptionMode = (config) => (config.interruption === 'contextual-update' ? 'allow' : 'disable_during_tool');

// Resolves once the text is handed to the OS, so a line is out before the next step and before exit.
const writeStdout = (text) => new Promise((done) => { process.stdout.write(text, () => done()); });

// Creates the tool, then the agent that uses it, and saves both ids. Never creates a second agent.
export async function agentSetup({ eleven, configPath = CONFIG_PATH }) {
  const config = loadConfig(configPath);
  if (config.agent?.agentId) {
    return { code: 2, lines: [`Agent już istnieje (${config.agent.agentId}); użyj "agent sync", aby go zaktualizować.`] };
  }
  // A tool saved by an earlier run that failed before the agent was created is reused, not duplicated.
  let toolId = config.agent?.toolId;
  if (!toolId) {
    ({ id: toolId } = await eleven.createTool(askClaudeToolConfig({ interruptionMode: interruptionMode(config) })));
    saveConfig({ ...config, agent: { agentId: null, toolId } }, configPath);
  }
  const { agent_id: agentId } = await eleven.createAgent(agentConfig({ toolIds: [toolId] }));
  saveConfig({ ...config, agent: { agentId, toolId } }, configPath);
  return { code: 0, lines: [`agent: ${agentId}`, `tool: ${toolId}`] };
}

// Patches the saved tool and agent from the current definitions.
export async function agentSync({ eleven, configPath = CONFIG_PATH }) {
  const config = loadConfig(configPath);
  const { agentId, toolId } = config.agent ?? {};
  if (!agentId || !toolId) return { code: 2, lines: ['Brak zapisanego agenta; najpierw uruchom "agent setup".'] };
  await eleven.updateTool(toolId, askClaudeToolConfig({ interruptionMode: interruptionMode(config) }));
  const { conversation_config: c } = agentConfig({ toolIds: [toolId] });
  await eleven.updateAgent(agentId, {
    conversation_config: {
      agent: { prompt: { prompt: c.agent.prompt.prompt, tool_ids: c.agent.prompt.tool_ids, built_in_tools: c.agent.prompt.built_in_tools } },
      turn: c.turn,
    },
  });
  return { code: 0, lines: [`agent: ${agentId}`, `tool: ${toolId}`] };
}

// Test-only stub (TALK_ELEVEN_STUB=1): fixed answers, no network.
function stubClient() {
  const ok = async () => ({});
  return {
    createTool: async () => ({ id: 'tool_stub' }),
    createAgent: async () => ({ agent_id: 'agent_stub' }),
    updateTool: ok,
    updateAgent: ok,
    getConversationToken: async () => ({ token: 'stub' }),
    getConversation: async () => ({ metadata: { call_duration_secs: 0 } }),
    deleteConversation: async () => ({ ok: true, status: 200, text: '' }),
  };
}

// The checks of `check` and `start` (spec §5.1, Ruling R8), in this order: project on the allowlist,
// key, agent. They only read: a refusal creates nothing, starts no fork and calls no network.
function admit({ cwd, env, configPath }) {
  if (!existsSync(cwd)) return { ok: false, line: noDir(cwd) };
  const config = loadConfig(configPath);
  const { key } = projectOf(cwd, loadProjectMap(hubRoot(env)).projects);
  if (!(config.allow ?? []).includes(key)) return { ok: false, line: notAllowed(key, configPath) };
  if (env.TALK_ELEVEN_STUB === '1') return { ok: true, config, key, apiKey: null };
  const apiKey = loadKey({ env });
  if (!apiKey) return { ok: false, line: NO_KEY };
  if (!config.agent?.agentId) return { ok: false, line: noAgent(configPath) };
  return { ok: true, config, key, apiKey };
}

// Prints `dialog: <dir>` first (session X finds `.url` there while the task runs), runs the bridge
// for one conversation and prints its closing report, which wakes session X (spec §5.1, §5.4).
async function start({ values, cwd, admitted: { config, key, apiKey }, env, deps }) {
  const { startBridge: bridge = startBridge, createElevenClient: client = createElevenClient, write = writeStdout } = deps;
  const stub = env.TALK_ELEVEN_STUB === '1';
  const eleven = stub ? stubClient() : client({ apiKey });
  const dialogDir = dialogDirFor({ root: config.dialogRoot, projectKey: key, now: new Date() });
  await write(`dialog: ${dialogDir}\n`);
  const firstBeat = Number(env.TALK_FIRST_BEAT_MS);
  const { done } = await bridge({
    sessionId: values.session,
    cwd,
    dialogDir,
    agentId: config.agent?.agentId ?? 'agent_stub',
    eleven,
    command: env.TALK_FAKE_CLAUDE ? [process.execPath, env.TALK_FAKE_CLAUDE] : ['claude'],
    subject: values.subject,
    interruption: config.interruption,
    // A page served against the stub could never start an ElevenLabs session: no browser then.
    openBrowser: !stub,
    ...(firstBeat > 0 ? { firstBeatDeadlineMs: firstBeat } : {}),
    ...(env.TALK_RAW_LOG ? { rawLog: env.TALK_RAW_LOG } : {}),
  });
  await write(await done);
  return { code: 0, lines: [] };
}

const SESSION_COMMANDS = {
  check: { options: ['cwd'], required: ['cwd'], run: async ({ admitted }) => ({ code: 0, lines: [JSON.stringify({ ok: true, project: admitted.key })] }) },
  start: { options: ['session', 'cwd', 'subject'], required: ['session', 'cwd'], run: start },
};

const AGENT_COMMANDS = {
  'agent setup': agentSetup,
  'agent sync': agentSync,
};

function parseOptions(args, { options, required }) {
  try {
    const { values } = parseArgs({ args, options: Object.fromEntries(options.map((name) => [name, { type: 'string' }])), strict: true });
    return required.every((name) => values[name]) ? values : null;
  } catch {
    return null;
  }
}

// deps (tests only): startBridge, createElevenClient, write.
export async function main(argv, env = process.env, deps = {}) {
  const configPath = env.TALK_CONFIG || CONFIG_PATH;
  const session = SESSION_COMMANDS[argv[0]];
  if (session) {
    const values = parseOptions(argv.slice(1), session);
    if (!values) return { code: 2, lines: [USAGE] };
    const cwd = resolve(values.cwd);
    const admitted = admit({ cwd, env, configPath });
    if (!admitted.ok) return { code: 2, lines: [admitted.line] };
    return session.run({ values, cwd, admitted, env, deps });
  }
  const run = AGENT_COMMANDS[argv.slice(0, 2).join(' ')];
  if (!run) return { code: 2, lines: [USAGE] };
  let eleven;
  if (env.TALK_ELEVEN_STUB === '1') {
    // Stub ids saved to the real config would pass for a real agent.
    if (!env.TALK_CONFIG) return { code: 2, lines: [STUB_NEEDS_CONFIG] };
    eleven = stubClient();
  } else {
    const apiKey = loadKey({ env });
    if (!apiKey) return { code: 2, lines: [NO_KEY] };
    eleven = createElevenClient({ apiKey });
  }
  return run({ eleven, configPath });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { code, lines } = await main(process.argv.slice(2));
    if (lines.length) await writeStdout(`${lines.join('\n')}\n`);
    // A fork grandchild may still hold an inherited pipe open; once the report is out, nothing may keep the CLI alive.
    process.exit(code);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
