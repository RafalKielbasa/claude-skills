// CLI. Session X runs `check`, `start` and `reopen` (SKILL.md), and so does the hub, with --origin hub;
// `agent setup` and `agent sync` are run by hand.
//   node bin/talk.mjs check --cwd <dir> [--session <id>]
//   node bin/talk.mjs start --session <id> --cwd <dir> [--subject <text>] [--origin session|hub] [--name <text>]
//   node bin/talk.mjs reopen --session <id>
//   node bin/talk.mjs agent setup | agent sync
// Test hooks (env): TALK_CONFIG, TALK_FAKE_CLAUDE, TALK_ELEVEN_STUB=1, TALK_USER_ENV_EMPTY=1,
// TALK_FIRST_BEAT_MS, TALK_PAUSE_LIMIT_MS, TALK_RAW_LOG, TALK_CLAUDE_PROJECTS, HUB_DATA.
import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { loadProjectMap, projectOf } from '../../hub/lib/projects.mjs';
import { hubRoot } from '../../hub/lib/paths.mjs';
import { readEvents } from '../../hub/lib/registry.mjs';
import { deriveSession } from '../../hub/lib/derive.mjs';
import { cwdForTranscript, findTranscript, withAncestors } from '../../hub/lib/resolve.mjs';
import { CONFIG_PATH, loadConfig, saveConfig } from '../lib/config.mjs';
import { dialogDirFor } from '../lib/dialog.mjs';
import { startBridge } from '../lib/bridge.mjs';
import { findLiveDialog } from '../lib/live.mjs';
import { loadKey } from '../lib/key.mjs';
import { createElevenClient } from '../lib/eleven.mjs';
import { agentConfig, askClaudeToolConfig, endConversationToolConfig } from '../lib/agent-config.mjs';

const SKILL_DIR = resolve(fileURLToPath(new URL('../', import.meta.url)));
const NO_KEY = 'Brak klucza ELEVENLABS_API_KEY: ustaw go jako zmienną środowiskową użytkownika (User) w Windows i uruchom polecenie ponownie.';
const USAGE = 'Użycie: node bin/talk.mjs check --cwd <katalog> [--session <id>] | start --session <id> --cwd <katalog> [--subject <tekst>] [--origin session|hub] [--name <nazwa>] | reopen --session <id> | agent setup | agent sync';
const notAllowed = (key, configPath) => `Projekt ${key} nie jest na liście dozwolonych dla /talk (${configPath}).`;
const noAgent = (configPath) => `Brak agenta ElevenLabs w ${configPath}: uruchom najpierw node bin/talk.mjs agent setup w katalogu ${SKILL_DIR}.`;
const noDir = (cwd) => `Katalog ${cwd} nie istnieje.`;
const noTranscript = (sessionId, path) => `Sesja ${sessionId.slice(0, 8)} nie ma pliku transkryptu (${path}), więc nie da się z niej uruchomić rozmowy głosowej.`;
const alreadyLive = (dir, sessionId) => `Rozmowa głosowa tej sesji już trwa (${dir}): otwórz ją poleceniem node bin/talk.mjs reopen --session ${sessionId}.`;
const NO_LIVE = 'Ta sesja nie ma otwartej rozmowy głosowej.';
const ORIGINS = ['session', 'hub'];
const STUB_NEEDS_CONFIG = `Z TALK_ELEVEN_STUB=1 polecenia agent wymagają TALK_CONFIG, bo bez niego identyfikatory zaślepki trafiłyby do prawdziwego ${CONFIG_PATH}.`;

const interruptionMode = (config) => (config.interruption === 'contextual-update' ? 'allow' : 'disable_during_tool');

// Resolves once the text is handed to the OS, so a line is out before the next step and before exit.
const writeStdout = (text) => new Promise((done) => { process.stdout.write(text, () => done()); });

// Creates both tools, then the agent that uses them, and saves the ids. Never creates a second agent.
export async function agentSetup({ eleven, configPath = CONFIG_PATH }) {
  const config = loadConfig(configPath);
  if (config.agent?.agentId) {
    return { code: 2, lines: [`Agent już istnieje (${config.agent.agentId}); użyj "agent sync", aby go zaktualizować.`] };
  }
  // Tools saved by an earlier run that failed before the agent was created are reused, not duplicated.
  let { toolId, endToolId } = config.agent ?? {};
  if (!toolId) {
    ({ id: toolId } = await eleven.createTool(askClaudeToolConfig({ interruptionMode: interruptionMode(config) })));
    saveConfig({ ...config, agent: { agentId: null, toolId, endToolId } }, configPath);
  }
  if (!endToolId) {
    ({ id: endToolId } = await eleven.createTool(endConversationToolConfig()));
    saveConfig({ ...config, agent: { agentId: null, toolId, endToolId } }, configPath);
  }
  const { agent_id: agentId } = await eleven.createAgent(agentConfig({ toolIds: [toolId, endToolId] }));
  saveConfig({ ...config, agent: { agentId, toolId, endToolId } }, configPath);
  return { code: 0, lines: [`agent: ${agentId}`, `tool: ${toolId}`] };
}

const BAD_DURATION = 'TALK_MAX_DURATION_SECONDS musi być liczbą całkowitą od 60 do 7200.';

// Patches the saved tools and agent from the current definitions; creates end_conversation if it is missing.
// env.TALK_MAX_DURATION_SECONDS sets the call limit (probes only).
export async function agentSync({ eleven, configPath = CONFIG_PATH, env = {} }) {
  const config = loadConfig(configPath);
  const { agentId, toolId } = config.agent ?? {};
  if (!agentId || !toolId) return { code: 2, lines: ['Brak zapisanego agenta; najpierw uruchom "agent setup".'] };
  let maxDurationSeconds;
  if (env.TALK_MAX_DURATION_SECONDS !== undefined && env.TALK_MAX_DURATION_SECONDS !== '') {
    maxDurationSeconds = Number(env.TALK_MAX_DURATION_SECONDS);
    if (!Number.isInteger(maxDurationSeconds) || maxDurationSeconds < 60 || maxDurationSeconds > 7200) {
      return { code: 2, lines: [BAD_DURATION] };
    }
  }
  let endToolId = config.agent.endToolId;
  if (!endToolId) {
    ({ id: endToolId } = await eleven.createTool(endConversationToolConfig()));
    saveConfig({ ...config, agent: { ...config.agent, endToolId } }, configPath);
  }
  await eleven.updateTool(toolId, askClaudeToolConfig({ interruptionMode: interruptionMode(config) }));
  await eleven.updateTool(endToolId, endConversationToolConfig());
  const { conversation_config: c, platform_settings: p } = agentConfig({ toolIds: [toolId, endToolId], maxDurationSeconds });
  await eleven.updateAgent(agentId, {
    conversation_config: {
      agent: {
        prompt: { prompt: c.agent.prompt.prompt, tool_ids: c.agent.prompt.tool_ids, built_in_tools: c.agent.prompt.built_in_tools },
        max_conversation_duration_message: c.agent.max_conversation_duration_message,
      },
      turn: c.turn,
      conversation: c.conversation,
    },
    platform_settings: { overrides: p.overrides, privacy: p.privacy },
  });
  return { code: 0, lines: [`agent: ${agentId}`, `tool: ${toolId}`] };
}

// Test-only stub (TALK_ELEVEN_STUB=1): fixed answers, no network.
function stubClient() {
  const ok = async () => ({});
  const deleted = new Set();
  return {
    createTool: async () => ({ id: 'tool_stub' }),
    createAgent: async () => ({ agent_id: 'agent_stub' }),
    updateTool: ok,
    updateAgent: ok,
    getConversationToken: async () => ({ token: 'stub' }),
    readConversation: async (id) => (deleted.has(id) ? { ok: false, status: 404, text: '' }
      : { ok: true, status: 200, conversation: { status: 'done', metadata: { call_duration_secs: 0 } }, text: '' }),
    deleteConversation: async (id) => { deleted.add(id); return { ok: true, status: 200, text: '' }; },
  };
}

// The fork resumes the session from its transcript (spec §19.2, finding F1): the path in the
// session's latest hook event in the hub registry, or, when no event names one, a file
// <projects root>/*/<id>.jsonl. The path that is missing, or null.
function missingTranscript(sessionId, env) {
  const { transcriptPath } = deriveSession(readEvents(hubRoot(env), sessionId).events);
  if (transcriptPath) return existsSync(transcriptPath) ? null : transcriptPath;
  const projects = env.TALK_CLAUDE_PROJECTS || join(homedir(), '.claude', 'projects');
  let found = false;
  try {
    found = readdirSync(projects, { withFileTypes: true })
      .some((entry) => entry.isDirectory() && existsSync(join(projects, entry.name, `${sessionId}.jsonl`)));
  } catch { /* no projects root, so no transcript */ }
  return found ? null : `${projects}/*/${sessionId}.jsonl`;
}

// A session's hook cwd follows `cd`, so a --cwd taken from it can be a subdirectory, while the fork's
// --resume finds the transcript only from the directory the session started in (spec §19.2,
// amendment of 2026-10-22). With --session, an existing --cwd becomes its nearest ancestor (itself
// first) whose Claude project folder holds the session's transcript, as in `HUB voice resolve`;
// without a known transcript or a match it stays as given. The transcript guard runs after this.
function sessionCwd(cwd, sessionId, env) {
  if (sessionId === undefined || !existsSync(cwd)) return cwd;
  const { transcriptPath } = findTranscript({
    sessionId,
    transcriptPath: deriveSession(readEvents(hubRoot(env), sessionId).events).transcriptPath,
    projectsDir: env.TALK_CLAUDE_PROJECTS || join(homedir(), '.claude', 'projects'),
  });
  return cwdForTranscript(withAncestors(cwd), transcriptPath) ?? cwd;
}

// The checks of `check` and `start` (spec §5.1, Ruling R8), in this order: project on the allowlist,
// key, agent, and, whenever a session is named, its transcript (spec §19.2). They only read: a
// refusal creates nothing, starts no fork and calls no network.
function admit({ cwd, sessionId, env, configPath }) {
  if (!existsSync(cwd)) return { ok: false, line: noDir(cwd) };
  const config = loadConfig(configPath);
  const { key } = projectOf(cwd, loadProjectMap(hubRoot(env)).projects);
  if (!(config.allow ?? []).includes(key)) return { ok: false, line: notAllowed(key, configPath) };
  let apiKey = null;
  if (env.TALK_ELEVEN_STUB !== '1') {
    apiKey = loadKey({ env });
    if (!apiKey) return { ok: false, line: NO_KEY };
    if (!config.agent?.agentId) return { ok: false, line: noAgent(configPath) };
  }
  const missing = sessionId === undefined ? null : missingTranscript(sessionId, env);
  if (missing) return { ok: false, line: noTranscript(sessionId, missing) };
  return { ok: true, config, key, apiKey };
}

// With --session, `live` names the session's live dialog, which `reopen` opens (spec §18.5).
async function check({ values, admitted: { config, key } }) {
  const live = values.session === undefined ? null : await findLiveDialog({ root: config.dialogRoot, sessionId: values.session });
  return { code: 0, lines: [JSON.stringify({ ok: true, project: key, ...(live ? { live: { dir: live.dir, origin: live.origin } } : {}) })] };
}

// Refuses a second dialog of a session whose dialog lives (spec §18.5). Otherwise prints
// `dialog: <dir>` first (bridge.json is there while the bridge runs), runs the bridge for one dialog
// and prints its closing report, which wakes the task's owner: session X, or the hub with --origin hub
// (spec §5.1, §5.4, §19.2).
async function start({ values, cwd, admitted: { config, key, apiKey }, env, deps }) {
  const { startBridge: bridge = startBridge, createElevenClient: client = createElevenClient, write = writeStdout } = deps;
  const live = await findLiveDialog({ root: config.dialogRoot, sessionId: values.session });
  if (live) return { code: 2, lines: [alreadyLive(live.dir, values.session)] };
  const stub = env.TALK_ELEVEN_STUB === '1';
  const eleven = stub ? stubClient() : client({ apiKey });
  const dialogDir = dialogDirFor({ root: config.dialogRoot, projectKey: key, now: new Date() });
  await write(`dialog: ${dialogDir}\n`);
  const firstBeat = Number(env.TALK_FIRST_BEAT_MS);
  const pauseLimit = Number(env.TALK_PAUSE_LIMIT_MS);
  const { done } = await bridge({
    sessionId: values.session,
    cwd,
    dialogDir,
    agentId: config.agent?.agentId ?? 'agent_stub',
    eleven,
    command: env.TALK_FAKE_CLAUDE ? [process.execPath, env.TALK_FAKE_CLAUDE] : ['claude'],
    subject: values.subject,
    interruption: config.interruption,
    origin: values.origin ?? 'session',
    label: `${key} · ${values.name ?? values.session.slice(0, 8)}`,
    pauseLimitMs: pauseLimit > 0 ? pauseLimit : (config.pauseLimitMinutes ?? 60) * 60000,
    agentHangup: config.agentHangup ?? 'pause',
    rejoinFirstMessage: config.rejoinFirstMessage ?? true,
    // A page served against the stub could never start an ElevenLabs session: no browser then.
    openBrowser: !stub,
    ...(firstBeat > 0 ? { firstBeatDeadlineMs: firstBeat } : {}),
    ...(env.TALK_RAW_LOG ? { rawLog: env.TALK_RAW_LOG } : {}),
  });
  await write(await done);
  return { code: 0, lines: [] };
}

// The bridge's own way to open its page: `cmd /c start "" <url>`, detached.
function openInBrowser(url) {
  const browser = spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' });
  browser.on('error', () => {});
  browser.unref();
}

// Opens the page of the session's live dialog (spec §18.5). The URL carries the token, so it is
// handed to the browser and never printed.
async function reopen({ values, configPath, deps }) {
  const { openUrl = openInBrowser } = deps;
  const live = await findLiveDialog({ root: loadConfig(configPath).dialogRoot, sessionId: values.session });
  if (!live) return { code: 2, lines: [NO_LIVE] };
  await openUrl(live.url);
  return { code: 0, lines: [JSON.stringify({ ok: true, dialog: live.dir, origin: live.origin })] };
}

const SESSION_COMMANDS = {
  check: { options: ['cwd', 'session'], required: ['cwd'], run: check },
  start: { options: ['session', 'cwd', 'subject', 'origin', 'name'], required: ['session', 'cwd'], choices: { origin: ORIGINS }, run: start },
};
const REOPEN = { options: ['session'], required: ['session'] };

const AGENT_COMMANDS = {
  'agent setup': agentSetup,
  'agent sync': agentSync,
};

// The values, or null for an unknown option, a missing required one, or a value outside its choices.
function parseOptions(args, { options, required, choices = {} }) {
  try {
    const { values } = parseArgs({ args, options: Object.fromEntries(options.map((name) => [name, { type: 'string' }])), strict: true });
    const chosen = Object.entries(choices).every(([name, allowed]) => values[name] === undefined || allowed.includes(values[name]));
    return required.every((name) => values[name]) && chosen ? values : null;
  } catch {
    return null;
  }
}

// deps (tests only): startBridge, createElevenClient, write, openUrl.
export async function main(argv, env = process.env, deps = {}) {
  const configPath = env.TALK_CONFIG || CONFIG_PATH;
  const session = SESSION_COMMANDS[argv[0]];
  if (session) {
    const values = parseOptions(argv.slice(1), session);
    if (!values) return { code: 2, lines: [USAGE] };
    const cwd = sessionCwd(resolve(values.cwd), values.session, env);
    const admitted = admit({ cwd, sessionId: values.session, env, configPath });
    if (!admitted.ok) return { code: 2, lines: [admitted.line] };
    return session.run({ values, cwd, admitted, env, deps });
  }
  if (argv[0] === 'reopen') {
    const values = parseOptions(argv.slice(1), REOPEN);
    return values ? reopen({ values, configPath, deps }) : { code: 2, lines: [USAGE] };
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
  return run({ eleven, configPath, env });
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
