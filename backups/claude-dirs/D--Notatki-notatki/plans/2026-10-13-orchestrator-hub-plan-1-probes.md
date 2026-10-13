# Orchestrator hub — Plan 1: contract removal and probes

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the Codex–Claude execution contract and answer probes S1–S11 of the orchestrator hub spec with recorded, literal evidence, so that Plan 2 (core) and Plan 3 (dialog, Codex, new sessions) are written on verified mechanisms.

**Architecture:** A throwaway sandbox at `C:/Users/rafal/hub-probes/` holds two git repositories (one with a space in its name), Node probe tools without dependencies, and recorded data. Project-level hooks in the sandbox record every raw hook input; small scripts measure, count and summarise. The executing session itself plays the hub for the probes that need one (`SendMessage`, `Monitor`). Every result lands in a probe report next to the spec.

**Tech Stack:** Node v24 (checked: `v24.20.0`), Git Bash on Windows 11, Claude Code CLI, Codex CLI `0.147.0`.

**Spec:** `D:/Notatki/notatki/.claude/specs/2026-10-13-orchestrator-hub-design.md` (§9.2 probes, §10 rollout, §13 approved items).

## Global Constraints

- Platform: Windows 11; shell commands are Git Bash; Node scripts use only the standard library.
- Probes run only in `C:/Users/rafal/hub-probes/` (the sandbox), never in a real project.
- This plan does not create `~/.claude/hub/` and does not install global hooks; probe hooks live in the sandbox repositories' `.claude/settings.json`.
- No commit and no push in any real repository (`D:/Notatki/notatki`, `C:/Users/rafal/.claude`): changes stay uncommitted and the final task proposes commit messages. The only commits are the initial commits of the two throwaway sandbox repositories, because `claude -w` (probe S10) needs a commit.
- Every probe result is quoted verbatim in the report; no paraphrase where Rafal decides on it.
- A negative result switches to the fallback written in spec §9.2. A result that would change the spec (scope or an approved decision) stops the plan at that task and goes to Rafal.
- Every background session launched by a probe is stopped or removed by the end of the plan.
- Code, comments and the report are in English; prompts typed into probe sessions may be Polish.

## Review Focus

1. **Hooks not loaded mistaken for hooks not firing.** If the sandbox workspace or its hooks are not trusted, no event is recorded and S1 would wrongly conclude "hooks do not fire in VS Code". Expected: the hook list is confirmed with `/hooks` before any S1 result is interpreted (Task 3, step 2).
2. **Working directory with a space** (like `D:/Praca/Devstock/Baza wiedzy`). Expected: hook input `cwd` and recorded file names survive the space. Pinned by the `repo with space` session in Task 3 and the self-check in Task 2.
3. **Polish diacritics through stdin** (hooks and Codex). Expected: `zażółć gęślą jaźń` arrives intact. Pinned by the Task 2 self-check, the Task 3 prompt and the Task 11 prompt.
4. **Two sessions emitting hooks at the same time.** Expected: no lost or broken line. Pinned by the parallel sessions in Task 3 and the shared-file burst in Task 5.
5. **A failing hook must never block a session.** Expected: unreadable input or an unwritable data directory ends the hook with exit code 0 and no output. Pinned by the Task 2 self-check.

---

## File Structure

| Path | Responsibility |
|---|---|
| `C:/Users/rafal/hub-probes/tools/percentile.js` | Nearest-rank percentile shared by the measuring tools |
| `C:/Users/rafal/hub-probes/tools/probe-hook.js` | Records one raw hook input per line into `data/events/<session_id>.jsonl` |
| `C:/Users/rafal/hub-probes/tools/stats.js` | Per-event count, sessions, field inventory, uptime percentiles |
| `C:/Users/rafal/hub-probes/tools/spawn-bench.js` | S2: wall-clock cost of starting the hook process |
| `C:/Users/rafal/hub-probes/tools/transcript-latency.js` | S2: tool-call latency from a session transcript |
| `C:/Users/rafal/hub-probes/tools/burst.js` | S3: parallel appends and renames |
| `C:/Users/rafal/hub-probes/tools/watch-probe.js` | S3, S5: catch-up scan plus `fs.watch`, optional event stream with state |
| `C:/Users/rafal/hub-probes/tools/count-lines.js` | S3: well-formed and broken lines, leftover temp files |
| `C:/Users/rafal/hub-probes/tools/time-agents.js` | S3: timing and shape of `claude agents --json` |
| `C:/Users/rafal/hub-probes/tools/codex-commands.js` | S9: thread id and commands from a `codex exec --json` stream |
| `C:/Users/rafal/hub-probes/tools/marker-check.js` | S11: gate marker on every `Stop` of a session |
| `C:/Users/rafal/hub-probes/tools/sanitize.js` | Content-free fixtures for Plan 2 tests |
| `C:/Users/rafal/hub-probes/tools/remove-contract.js` | Task 1: removes the marked contract block from one file |
| `C:/Users/rafal/hub-probes/tools/self-check.js`, `self-check-2.js` | Self-checks of the tools |
| `C:/Users/rafal/hub-probes/repo/`, `C:/Users/rafal/hub-probes/repo with space/` | Throwaway git repositories with probe hooks and the marker rule |
| `C:/Users/rafal/hub-probes/data/` | Recorded events, burst data, Codex streams, fixtures |
| `D:/Notatki/notatki/.claude/specs/2026-10-13-orchestrator-hub-probes.md` | Probe report |
| `C:/Users/rafal/.claude/CLAUDE.md:210-293`, `C:/Users/rafal/.codex/AGENTS.md:215-298` | Contract blocks removed in Task 1 |

The tool sources below were run during plan writing (self-checks and dry runs in a scratch directory); see "Preliminary findings" in the report skeleton.

---

### Task 1: Sandbox tools and contract removal

The contract removal uses `remove-contract.js`, so the tools directory is created first.

**Files:**
- Create: every file under `C:/Users/rafal/hub-probes/tools/` listed in File Structure
- Modify: `C:/Users/rafal/.claude/CLAUDE.md:210-293` (block removed)
- Modify: `C:/Users/rafal/.codex/AGENTS.md:215-298` (block removed; backup first, the directory is not a git repository)
- Move: `C:/Users/rafal/.codex/automations/powiadomienie-o-pracy-claude-nad-planem-i-agentem/` → `C:/Users/rafal/.codex/automations-removed-2026-10-13/`

**Interfaces:**
- Produces: the tools with the command lines documented in each file's header comment; later tasks call them exactly as written there.

- [ ] **Step 1: Create the tools directory and write the tool files**

```bash
mkdir -p C:/Users/rafal/hub-probes/tools C:/Users/rafal/hub-probes/data
```

Write each file with exactly this content.

`tools/percentile.js`:

```js
// Nearest-rank percentile of an ascending array of numbers; null for an empty array.
module.exports = function percentile(sorted, p) {
  if (sorted.length === 0) return null;
  const rank = Math.ceil((p / 100) * sorted.length);
  return sorted[Math.min(sorted.length, Math.max(1, rank)) - 1];
};
```

`tools/probe-hook.js`:

```js
// Records one raw Claude Code hook input per line for the orchestrator hub probes.
// Never blocks the session: every failure ends with exit code 0 and no output.
const fs = require("fs");
const path = require("path");

const dataDir = process.env.PROBE_DATA || path.join(__dirname, "..", "data", "events");

function record(raw) {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    input = { unparsed: raw };
  }
  const sessionId = String(input.session_id || "unknown").replace(/[^A-Za-z0-9-]/g, "_");
  const line = JSON.stringify({
    at: new Date().toISOString(),
    event: input.hook_event_name || "unknown",
    uptimeMs: Math.round(process.uptime() * 1000),
    input,
  });
  fs.mkdirSync(dataDir, { recursive: true });
  fs.appendFileSync(path.join(dataDir, `${sessionId}.jsonl`), line + "\n", "utf8");
}

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  raw += chunk;
});
process.stdin.on("end", () => {
  try {
    record(raw);
  } catch {
    // never block the session
  }
  process.exit(0);
});
process.stdin.on("error", () => process.exit(0));
```

`tools/stats.js`:

```js
// Summarises recorded hook events: count, sessions, field inventory and uptime percentiles per event.
const fs = require("fs");
const path = require("path");
const percentile = require("./percentile");

const dir = process.argv[2] || path.join(__dirname, "..", "data", "events");
const byEvent = {};
for (const file of fs.readdirSync(dir).filter((name) => name.endsWith(".jsonl"))) {
  for (const line of fs.readFileSync(path.join(dir, file), "utf8").split("\n")) {
    if (!line.trim()) continue;
    const rec = JSON.parse(line);
    const entry = (byEvent[rec.event] ||= { count: 0, sessions: new Set(), fields: new Set(), uptimes: [] });
    entry.count += 1;
    entry.sessions.add(file.replace(/\.jsonl$/, ""));
    for (const key of Object.keys(rec.input || {})) entry.fields.add(key);
    entry.uptimes.push(rec.uptimeMs);
  }
}
for (const name of Object.keys(byEvent).sort()) {
  const entry = byEvent[name];
  const uptimes = entry.uptimes.sort((a, b) => a - b);
  console.log(JSON.stringify({
    event: name,
    count: entry.count,
    sessions: entry.sessions.size,
    fields: [...entry.fields].sort(),
    uptimeP50: percentile(uptimes, 50),
    uptimeP95: percentile(uptimes, 95),
  }));
}
```

`tools/spawn-bench.js`:

```js
// Probe S2: spawns probe-hook.js N times with a fixture input and reports wall-clock percentiles.
const { spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const percentile = require("./percentile");

const runs = Number(process.argv[2] || 50);
const fixture = JSON.stringify({
  hook_event_name: "PostToolUse",
  session_id: "bench",
  tool_name: "Bash",
  tool_input: { command: "echo 1", description: "bench" },
});
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "hub-bench-"));
const times = [];
for (let i = 0; i < runs; i += 1) {
  const start = process.hrtime.bigint();
  const result = spawnSync(process.execPath, [path.join(__dirname, "probe-hook.js")], {
    input: fixture,
    env: { ...process.env, PROBE_DATA: dataDir },
  });
  times.push(Number(process.hrtime.bigint() - start) / 1e6);
  if (result.status !== 0) {
    console.error(`run ${i} exited with ${result.status}`);
    process.exit(1);
  }
}
times.sort((a, b) => a - b);
console.log(JSON.stringify({
  runs,
  p50Ms: Math.round(percentile(times, 50)),
  p95Ms: Math.round(percentile(times, 95)),
  maxMs: Math.round(times[times.length - 1]),
}));
```

`tools/transcript-latency.js`:

```js
// Probe S2: tool-call latency (tool_use timestamp -> tool_result timestamp) from a session transcript.
// Usage: node transcript-latency.js <session-id>
// The transcript is looked up as ~/.claude/projects/*/<session-id>.jsonl.
const fs = require("fs");
const os = require("os");
const path = require("path");
const percentile = require("./percentile");

const sessionId = process.argv[2];
const projectsDir = path.join(os.homedir(), ".claude", "projects");
const match = fs
  .readdirSync(projectsDir)
  .map((dir) => path.join(projectsDir, dir, `${sessionId}.jsonl`))
  .find((file) => fs.existsSync(file));
if (!match) {
  console.error(`transcript for ${sessionId} not found under ${projectsDir}`);
  process.exit(1);
}
const uses = new Map();
const latencies = [];
for (const line of fs.readFileSync(match, "utf8").split("\n")) {
  if (!line.trim()) continue;
  let entry;
  try {
    entry = JSON.parse(line);
  } catch {
    continue;
  }
  const content = Array.isArray(entry.message?.content) ? entry.message.content : [];
  for (const block of content) {
    if (block.type === "tool_use") uses.set(block.id, Date.parse(entry.timestamp));
    if (block.type === "tool_result" && uses.has(block.tool_use_id)) {
      latencies.push(Date.parse(entry.timestamp) - uses.get(block.tool_use_id));
    }
  }
}
latencies.sort((a, b) => a - b);
console.log(JSON.stringify({
  transcript: match,
  toolCalls: latencies.length,
  p50Ms: percentile(latencies, 50),
  p95Ms: percentile(latencies, 95),
}));
```

`tools/burst.js`:

```js
// Probe S3: parallel writer processes append events and rename .last.md files within a time window.
// Usage: node burst.js --dir=<dir> [--writers=5] [--events=20] [--window-ms=1000] [--shared=1]
// With --shared=1 every writer appends to one file, as concurrent hooks of one session would.
// A failed rename is counted, not fatal, so it cannot hide append losses.
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, "").split("=");
    return [key, rest.join("=")];
  }),
);
const dir = args.dir;
const writers = Number(args.writers || 5);
const events = Number(args.events || 20);
const windowMs = Number(args["window-ms"] || 1000);
const shared = args.shared === "1";

function runWriter(writer) {
  const session = shared ? "shared" : `session-${writer}`;
  const file = path.join(dir, `${session}.events.jsonl`);
  const renameErrors = [];
  let index = 0;
  const timer = setInterval(() => {
    fs.appendFileSync(file, JSON.stringify({ id: `${writer}-${index}`, at: Date.now() }) + "\n");
    if (index % 4 === 0) {
      const tmp = path.join(dir, `${session}.last.md.${process.pid}.${index}.tmp`);
      fs.writeFileSync(tmp, `last ${writer}-${index}\n`);
      try {
        fs.renameSync(tmp, path.join(dir, `${session}.last.md`));
      } catch (error) {
        renameErrors.push(error.code);
        fs.rmSync(tmp, { force: true });
      }
    }
    index += 1;
    if (index >= events) {
      clearInterval(timer);
      process.stdout.write(JSON.stringify({ writer, appended: index, renameErrors }) + "\n");
    }
  }, windowMs / events);
}

if (args.child !== undefined) {
  runWriter(args.child);
} else {
  fs.mkdirSync(dir, { recursive: true });
  const reports = [];
  const children = [];
  for (let writer = 0; writer < writers; writer += 1) {
    const childArgs = [__filename, `--dir=${dir}`, `--events=${events}`, `--window-ms=${windowMs}`, `--child=${writer}`];
    if (shared) childArgs.push("--shared=1");
    const child = spawn(process.execPath, childArgs, { stdio: ["ignore", "pipe", "inherit"] });
    let out = "";
    child.stdout.on("data", (chunk) => {
      out += chunk;
    });
    children.push(new Promise((resolve) => child.on("exit", () => {
      if (out.trim()) reports.push(JSON.parse(out));
      resolve();
    })));
  }
  Promise.all(children).then(() => {
    const renameErrors = reports.flatMap((report) => report.renameErrors);
    console.log(JSON.stringify({
      generated: writers * events,
      appended: reports.reduce((sum, report) => sum + report.appended, 0),
      shared,
      renameErrors: renameErrors.length,
      renameErrorCodes: [...new Set(renameErrors)],
    }));
  });
}
```

`tools/watch-probe.js`:

```js
// Probes S3 and S5: collects event ids from *.events.jsonl through a catch-up scan and fs.watch.
// Usage: node watch-probe.js --dir=<dir> [--seconds=5] [--out=<result.json>] [--emit=1] [--state=<file>]
// --emit=1 prints "catch-up <id>" or "watch <id>" for every event not reported before (a Monitor
// event stream); --state keeps the reported ids across watcher restarts.
const fs = require("fs");
const path = require("path");

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, "").split("=");
    return [key, rest.join("=")];
  }),
);
const dir = args.dir;
const seconds = Number(args.seconds || 5);
const emit = args.emit === "1";
const statePath = args.state;
const reported = new Set(statePath && fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, "utf8")) : []);
const seen = new Map();
let fsEvents = 0;

function report(id, source) {
  if (!emit || reported.has(id)) return;
  reported.add(id);
  console.log(`${source} ${id}`);
  if (statePath) fs.writeFileSync(statePath, JSON.stringify([...reported]));
}

function scan(file, source) {
  let text;
  try {
    text = fs.readFileSync(path.join(dir, file), "utf8");
  } catch {
    return;
  }
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    let id;
    try {
      id = JSON.parse(line).id;
    } catch {
      continue;
    }
    if (!seen.has(id)) {
      seen.set(id, source);
      report(id, source);
    }
  }
}

fs.mkdirSync(dir, { recursive: true });
for (const file of fs.readdirSync(dir)) if (file.endsWith(".events.jsonl")) scan(file, "catch-up");
const watcher = fs.watch(dir, (type, file) => {
  fsEvents += 1;
  if (file && file.endsWith(".events.jsonl")) scan(file, "watch");
});
setTimeout(() => {
  watcher.close();
  const bySource = { "catch-up": 0, watch: 0 };
  for (const source of seen.values()) bySource[source] += 1;
  const summary = { seen: seen.size, bySource, fsEvents };
  if (args.out) fs.writeFileSync(args.out, JSON.stringify({ ...summary, ids: [...seen.keys()] }));
  if (!emit) console.log(JSON.stringify(summary));
}, seconds * 1000);
```

`tools/count-lines.js`:

```js
// Probe S3: counts well-formed and broken lines in every *.events.jsonl of a directory.
const fs = require("fs");
const path = require("path");

const dir = process.argv[2];
let wellFormed = 0;
let broken = 0;
for (const file of fs.readdirSync(dir).filter((name) => name.endsWith(".events.jsonl"))) {
  for (const line of fs.readFileSync(path.join(dir, file), "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      JSON.parse(line);
      wellFormed += 1;
    } catch {
      broken += 1;
    }
  }
}
const leftoverTmp = fs.readdirSync(dir).filter((name) => name.endsWith(".tmp")).length;
console.log(JSON.stringify({ wellFormed, broken, leftoverTmp }));
```

`tools/time-agents.js`:

```js
// Probe S3: times `claude agents --json` and records the shape of its output.
// Usage: node time-agents.js [runs=10]
const { spawnSync } = require("child_process");
const percentile = require("./percentile");

const runs = Number(process.argv[2] || 10);
const times = [];
const failures = [];
let last = null;
for (let i = 0; i < runs; i += 1) {
  const start = process.hrtime.bigint();
  const result = spawnSync("claude", ["agents", "--json"], { encoding: "utf8" });
  times.push(Number(process.hrtime.bigint() - start) / 1e6);
  if (result.status !== 0 || result.error) {
    failures.push({ run: i, status: result.status, error: String(result.error || result.stderr).slice(0, 200) });
    continue;
  }
  try {
    last = JSON.parse(result.stdout);
  } catch (error) {
    failures.push({ run: i, status: result.status, error: `unparsable: ${error.message}` });
  }
}
times.sort((a, b) => a - b);
const sessions = Array.isArray(last) ? last : [];
const keys = [...new Set(sessions.flatMap((session) => Object.keys(session)))].sort();
const values = (key) => [...new Set(sessions.map((session) => session[key]).filter((v) => v !== undefined))];
console.log(JSON.stringify({
  runs,
  p50Ms: Math.round(percentile(times, 50)),
  p95Ms: Math.round(percentile(times, 95)),
  failures,
  sessionCount: sessions.length,
  keys,
  kinds: values("kind"),
  states: values("state"),
  statuses: values("status"),
}));
```

`tools/codex-commands.js`:

```js
// Probe S9: thread id, every command Codex ran, and every other tool-like item, from a
// `codex exec --json` stream.
// agentLaunches: commands whose first word is claude or codex (not --help).
// otherToolItems: completed items of any type other than plain messages, reasoning, plans and
// commands (for example MCP tool calls); each needs a manual look before a probe can pass.
// Usage: node codex-commands.js <stream.jsonl>
const fs = require("fs");

const NON_TOOL_ITEMS = new Set(["agent_message", "reasoning", "todo_list", "error", "command_execution"]);
const lines = fs.readFileSync(process.argv[2], "utf8").split("\n").filter((line) => line.trim());
let threadId = null;
const commands = [];
const otherToolItems = [];
const itemTypes = {};
const eventTypes = {};
for (const line of lines) {
  let event;
  try {
    event = JSON.parse(line);
  } catch {
    continue;
  }
  eventTypes[event.type] = (eventTypes[event.type] || 0) + 1;
  if (event.type === "thread.started") threadId = event.thread_id;
  if (event.type !== "item.completed" || !event.item) continue;
  const item = event.item;
  itemTypes[item.type] = (itemTypes[item.type] || 0) + 1;
  if (item.type === "command_execution") {
    commands.push({ exitCode: item.exit_code, command: String(item.command) });
  } else if (!NON_TOOL_ITEMS.has(item.type)) {
    otherToolItems.push({ type: item.type, summary: JSON.stringify(item).slice(0, 200) });
  }
}

// A command segment launches an agent when its first word is claude or codex (any path, .exe or
// .cmd) and the segment does not ask for --help. A leading "powershell -Command" is skipped.
function launchesAgent(command) {
  return command
    .replace(/["']/g, " ")
    .split(/[;|&]+/)
    .some((segment) => {
      let words = segment.trim().split(/\s+/).filter(Boolean);
      const base = (word) => (word || "").split(/[\\/]/).pop().toLowerCase();
      if (/^(powershell|pwsh)(\.exe)?$/.test(base(words[0])) && /^-command$/i.test(words[1] || "")) {
        words = words.slice(2);
      }
      return /^(claude|codex)(\.exe|\.cmd)?$/.test(base(words[0])) && !words.includes("--help");
    });
}
const agentLaunches = commands.filter((entry) => launchesAgent(entry.command));
console.log(JSON.stringify({ threadId, eventTypes, itemTypes, commandCount: commands.length, agentLaunches, otherToolItems, commands }, null, 2));
```

`tools/marker-check.js`:

```js
// Probe S11: for every Stop event of one session, shows the last line of the assistant message and
// whether it carries the gate marker.
// Usage: node marker-check.js <events-dir> <session-id>
const fs = require("fs");
const path = require("path");

const [dir, sessionId] = process.argv.slice(2);
const MARKER = "⏸ Czeka na decyzję:";
const rows = [];
for (const line of fs.readFileSync(path.join(dir, `${sessionId}.jsonl`), "utf8").split("\n")) {
  if (!line.trim()) continue;
  const rec = JSON.parse(line);
  if (rec.event !== "Stop") continue;
  const message = String(rec.input.last_assistant_message || "");
  const lastLine = message.trimEnd().split("\n").pop().trim();
  rows.push({ at: rec.at, marker: lastLine.startsWith(MARKER), lastLine: lastLine.slice(0, 160) });
}
console.log(JSON.stringify({ stops: rows.length, withMarker: rows.filter((row) => row.marker).length, rows }, null, 2));
```

`tools/sanitize.js`:

```js
// Turns recorded hook events into content-free fixtures, one file per event variant, and checks
// them against the fixture matrix Plan 2 needs. Every string value becomes "<string>" except the
// keys that identify the event, kept verbatim.
// Variant name: <event>[-<tool_name>][-<notification_type>][-marker|-plain for Stop].
// Usage: node sanitize.js <events-dir> <fixtures-dir>
const fs = require("fs");
const path = require("path");

const KEEP = new Set(["hook_event_name", "tool_name", "notification_type", "matcher", "permission_mode", "source", "reason"]);
const MARKER = "⏸ Czeka na decyzję:";
const REQUIRED = [
  "UserPromptSubmit",
  "PostToolUse-Read",
  "PostToolUse-Bash",
  "Notification-permission_prompt",
  "Stop-marker",
  "Stop-plain",
  "SessionEnd",
  "StopFailure",
];
const [eventsDir, fixturesDir] = process.argv.slice(2);

function strip(value, key) {
  if (typeof value === "string") return KEEP.has(key) ? value : "<string>";
  if (Array.isArray(value)) return value.map((item) => strip(item, key));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, strip(v, k)]));
  }
  return value;
}

function variant(rec) {
  const input = rec.input || {};
  let name = rec.event;
  if (input.tool_name) name += `-${input.tool_name}`;
  if (input.notification_type) name += `-${input.notification_type}`;
  if (rec.event === "Stop") {
    const lastLine = String(input.last_assistant_message || "").trimEnd().split("\n").pop().trim();
    name += lastLine.startsWith(MARKER) ? "-marker" : "-plain";
  }
  return name;
}

fs.mkdirSync(fixturesDir, { recursive: true });
const written = new Set();
for (const file of fs.readdirSync(eventsDir).filter((name) => name.endsWith(".jsonl"))) {
  for (const line of fs.readFileSync(path.join(eventsDir, file), "utf8").split("\n")) {
    if (!line.trim()) continue;
    const rec = JSON.parse(line);
    const name = variant(rec);
    if (written.has(name)) continue;
    written.add(name);
    fs.writeFileSync(path.join(fixturesDir, `${name}.json`), JSON.stringify(strip(rec.input), null, 2) + "\n");
  }
}
const fixtures = [...written].sort();
console.log(JSON.stringify({ fixtures, missing: REQUIRED.filter((name) => !written.has(name)) }));
```

`tools/remove-contract.js`:

```js
// Removes the block between the codex-claude-execution-contract markers from one file.
// Aborts without writing unless exactly one BEGIN and one END marker are found, in that order.
// Usage: node remove-contract.js <file>
const fs = require("fs");

const file = process.argv[2];
const text = fs.readFileSync(file, "utf8");
const begin = "<!-- BEGIN codex-claude-execution-contract";
const end = "<!-- END codex-claude-execution-contract -->";
const beginCount = text.split(begin).length - 1;
const endCount = text.split(end).length - 1;
const beginAt = text.indexOf(begin);
const endAt = text.indexOf(end);
if (beginCount !== 1 || endCount !== 1 || endAt < beginAt) {
  console.error(`${file}: expected one BEGIN before one END, found BEGIN=${beginCount} END=${endCount}`);
  process.exit(1);
}
const before = text.slice(0, beginAt).replace(/\s+$/, "");
const after = text.slice(endAt + end.length).replace(/^\s+/, "");
const result = after ? `${before}\n\n${after}` : `${before}\n`;
fs.writeFileSync(file, result, "utf8");
const removedLines = text.split("\n").length - result.split("\n").length;
console.log(JSON.stringify({ file, removedLines }));
```

`tools/self-check.js`:

```js
// Self-check of probe-hook.js: valid input with Windows paths and Polish diacritics is preserved,
// and broken input or an unwritable data directory never makes the hook fail.
const assert = require("assert");
const { spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const hook = path.join(__dirname, "probe-hook.js");
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "probe-check-"));

function runHook(input, dir) {
  return spawnSync(process.execPath, [hook], { input, env: { ...process.env, PROBE_DATA: dir } });
}

const valid = {
  hook_event_name: "UserPromptSubmit",
  session_id: "check-1",
  prompt: "zażółć gęślą jaźń",
  cwd: "D:\\Praca\\Devstock\\Baza wiedzy",
};
let result = runHook(JSON.stringify(valid), dataDir);
assert.strictEqual(result.status, 0);
const rec = JSON.parse(fs.readFileSync(path.join(dataDir, "check-1.jsonl"), "utf8").trim());
assert.strictEqual(rec.event, "UserPromptSubmit");
assert.strictEqual(rec.input.prompt, valid.prompt);
assert.strictEqual(rec.input.cwd, valid.cwd);

result = runHook("not json", dataDir);
assert.strictEqual(result.status, 0);
assert.strictEqual(result.stdout.length, 0);

result = runHook(JSON.stringify(valid), "Z:\\nonexistent\\dir");
assert.strictEqual(result.status, 0);
assert.strictEqual(result.stdout.length, 0);

console.log("probe-hook self-check: ok");
```

`tools/self-check-2.js`:

```js
// Self-check of watch-probe.js (emit + state across restarts), marker-check.js and codex-commands.js.
const assert = require("assert");
const { spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "probe-check2-"));
const node = (script, args) => spawnSync(process.execPath, [path.join(__dirname, script), ...args], { encoding: "utf8" });

// watch-probe: an event written while no watcher runs is reported once by the next watcher's catch-up.
const dir = path.join(tmp, "s5");
const state = path.join(tmp, "s5-state.json");
fs.mkdirSync(dir);
fs.appendFileSync(path.join(dir, "a.events.jsonl"), JSON.stringify({ id: "old-1" }) + "\n");
let out = node("watch-probe.js", [`--dir=${dir}`, "--seconds=0.3", "--emit=1", `--state=${state}`]).stdout;
assert.strictEqual(out.trim(), "catch-up old-1");
fs.appendFileSync(path.join(dir, "a.events.jsonl"), JSON.stringify({ id: "gap-1" }) + "\n");
out = node("watch-probe.js", [`--dir=${dir}`, "--seconds=0.3", "--emit=1", `--state=${state}`]).stdout;
assert.strictEqual(out.trim(), "catch-up gap-1");

// marker-check: only a last line starting with the marker counts.
const events = path.join(tmp, "events");
fs.mkdirSync(events);
const stop = (msg) => JSON.stringify({ at: "t", event: "Stop", input: { last_assistant_message: msg } });
fs.writeFileSync(path.join(events, "s1.jsonl"), [
  stop("Pytanie?\n\n⏸ Czeka na decyzję: wybierz A albo B"),
  stop("Gotowe."),
  JSON.stringify({ at: "t", event: "PostToolUse", input: {} }),
].join("\n") + "\n");
const marker = JSON.parse(node("marker-check.js", [events, "s1"]).stdout);
assert.strictEqual(marker.stops, 2);
assert.strictEqual(marker.withMarker, 1);

// codex-commands: thread id, --help calls are not agent launches, a real claude call is.
const stream = path.join(tmp, "codex.jsonl");
fs.writeFileSync(stream, [
  JSON.stringify({ type: "thread.started", thread_id: "th-1" }),
  JSON.stringify({ type: "item.completed", item: { type: "command_execution", exit_code: 0, command: "powershell -Command 'claude --help'" } }),
  JSON.stringify({ type: "item.completed", item: { type: "command_execution", exit_code: 1, command: "powershell -Command 'claude -p \"review\"'" } }),
  JSON.stringify({ type: "item.completed", item: { type: "command_execution", exit_code: 0, command: "rg -n foo" } }),
  JSON.stringify({ type: "item.completed", item: { type: "command_execution", exit_code: 0, command: "powershell -Command 'Get-Command claude -All'" } }),
  JSON.stringify({ type: "item.completed", item: { type: "mcp_tool_call", server: "x", tool: "y" } }),
  JSON.stringify({ type: "item.completed", item: { type: "agent_message", text: "done" } }),
].join("\n") + "\n");
const codex = JSON.parse(node("codex-commands.js", [stream]).stdout);
assert.strictEqual(codex.threadId, "th-1");
assert.strictEqual(codex.commandCount, 4);
assert.strictEqual(codex.agentLaunches.length, 1);
assert.ok(codex.agentLaunches[0].command.includes("claude -p"));
assert.strictEqual(codex.otherToolItems.length, 1);
assert.strictEqual(codex.otherToolItems[0].type, "mcp_tool_call");

// sanitize: variants per notification type and marker, content stripped, missing matrix entries listed.
const rec = (event, input) => JSON.stringify({ at: "t", event, input: { hook_event_name: event, session_id: "s", ...input } });
const sanEvents = path.join(tmp, "san-events");
const sanFixtures = path.join(tmp, "san-fixtures");
fs.mkdirSync(sanEvents);
fs.writeFileSync(path.join(sanEvents, "s.jsonl"), [
  rec("Notification", { notification_type: "idle_prompt", message: "secret text" }),
  rec("Notification", { notification_type: "permission_prompt", message: "secret text" }),
  rec("Stop", { last_assistant_message: "Done.\n⏸ Czeka na decyzję: A albo B" }),
  rec("Stop", { last_assistant_message: "Done." }),
  rec("PostToolUse", { tool_name: "Read", tool_input: { file_path: "C:\\secret.txt" } }),
].join("\n") + "\n");
const san = JSON.parse(node("sanitize.js", [sanEvents, sanFixtures]).stdout);
assert.ok(san.fixtures.includes("Notification-permission_prompt"));
assert.ok(san.fixtures.includes("Notification-idle_prompt"));
assert.ok(san.fixtures.includes("Stop-marker") && san.fixtures.includes("Stop-plain"));
assert.deepStrictEqual(san.missing, ["UserPromptSubmit", "PostToolUse-Bash", "SessionEnd", "StopFailure"]);
const fixtureText = fs.readdirSync(sanFixtures).map((f) => fs.readFileSync(path.join(sanFixtures, f), "utf8")).join("");
assert.ok(!fixtureText.includes("secret"));
assert.ok(fixtureText.includes('"notification_type": "permission_prompt"'));

console.log("watch-probe, marker-check, codex-commands, sanitize self-check: ok");
```

- [ ] **Step 2: Run the self-checks**

```bash
cd C:/Users/rafal/hub-probes/tools && node self-check.js && node self-check-2.js
```

Expected:

```
probe-hook self-check: ok
watch-probe, marker-check, codex-commands, sanitize self-check: ok
```

- [ ] **Step 3: Confirm the contract blocks**

```bash
grep -n "codex-claude-execution-contract" C:/Users/rafal/.claude/CLAUDE.md C:/Users/rafal/.codex/AGENTS.md
```

Expected: exactly four lines — BEGIN at `CLAUDE.md:210`, END at `CLAUDE.md:293`, BEGIN at `AGENTS.md:215`, END at `AGENTS.md:298`. Any other result: stop and show Rafal the output.

- [ ] **Step 4: Back up `AGENTS.md` and remove both blocks**

```bash
B=C:/Users/rafal/.codex/AGENTS.md.bak-2026-10-13
if [ -e "$B" ]; then echo "backup exists, keeping it: $B"; else cp C:/Users/rafal/.codex/AGENTS.md "$B" && echo "backup written: $B"; fi
node C:/Users/rafal/hub-probes/tools/remove-contract.js C:/Users/rafal/.claude/CLAUDE.md
node C:/Users/rafal/hub-probes/tools/remove-contract.js C:/Users/rafal/.codex/AGENTS.md
```

Expected: `backup written`, then two JSON lines, each with `"removedLines":85` (measured on copies during plan writing). On a re-run the backup is kept and `remove-contract.js` exits 1 with `found BEGIN=0 END=0`, which means "already removed": go on with step 5.

- [ ] **Step 5: Verify the removal**

```bash
grep -c "codex-claude-execution-contract" C:/Users/rafal/.claude/CLAUDE.md C:/Users/rafal/.codex/AGENTS.md
git -C C:/Users/rafal/.claude diff --stat
diff <(head -n 208 C:/Users/rafal/.codex/AGENTS.md.bak-2026-10-13) <(head -n 208 C:/Users/rafal/.codex/AGENTS.md) && echo "AGENTS.md head unchanged"
tail -n 3 C:/Users/rafal/.claude/CLAUDE.md
```

Expected: both counts `0`; the diff stat lists only `CLAUDE.md` with about 85 deletions; `AGENTS.md head unchanged`; the tail of `CLAUDE.md` is the end of the "Raport po zadaniu" list (`commita w Conventional Commits (patrz „Git").`).

- [ ] **Step 6: Move the paused Codex automation out of the active directory**

```bash
NAME=powiadomienie-o-pracy-claude-nad-planem-i-agentem
SRC=C:/Users/rafal/.codex/automations/$NAME
DST=C:/Users/rafal/.codex/automations-removed-2026-10-13
if [ -d "$SRC" ] && [ ! -e "$DST/$NAME" ]; then mkdir -p "$DST" && mv "$SRC" "$DST/" && echo "moved"
elif [ ! -e "$SRC" ] && [ -d "$DST/$NAME" ]; then echo "already moved"
else echo "unexpected state, stop and show Rafal"; ls -la "$SRC" "$DST" 2>&1; fi
ls C:/Users/rafal/.codex/automations
```

Expected: `moved` (or `already moved` on a re-run), and the `ls` output no longer lists `powiadomienie-o-pracy-claude-nad-planem-i-agentem`. On `unexpected state` stop the task. If the Codex desktop app still shows the automation after a restart, tell Rafal; do not edit `.codex-global-state.json`.

- [ ] **Step 7: Checkpoint** — no commit (`~/.claude` is in no-commit mode, `~/.codex` is not a repository). Note for the final report: the current session still carries the contract in its loaded instructions; new sessions do not.

---

### Task 2: Sandbox repositories and the report skeleton

**Files:**
- Create: `C:/Users/rafal/hub-probes/repo/{README.md,CLAUDE.md,.claude/settings.json}`
- Create: `C:/Users/rafal/hub-probes/repo with space/{README.md,CLAUDE.md,.claude/settings.json}`
- Create: `D:/Notatki/notatki/.claude/specs/2026-10-13-orchestrator-hub-probes.md`

**Interfaces:**
- Consumes: `tools/probe-hook.js` (Task 1).
- Produces: hooks writing to `C:/Users/rafal/hub-probes/data/events/<session_id>.jsonl`; the report sections `## S1` … `## S11` that later tasks fill.

- [ ] **Step 1: Create both repositories with the same content**

```bash
for R in "C:/Users/rafal/hub-probes/repo" "C:/Users/rafal/hub-probes/repo with space"; do
  mkdir -p "$R/.claude"
  git init -q "$R"
done
```

Write `README.md` in both repositories:

```markdown
# Probe sandbox

Throwaway repository for the orchestrator hub probes (spec 2026-10-13-orchestrator-hub-design.md).
Nothing here is real work.
```

Write `CLAUDE.md` in both repositories (the marker rule of spec §5.3, needed by S11):

```markdown
# Probe sandbox

Throwaway repository for the orchestrator hub probes. Nothing here is real work.

## Gate marker

A turn that ends waiting for the user's decision ends with the line

⏸ Czeka na decyzję: <one sentence>
```

Write `.claude/settings.json` in both repositories:

```json
{
  "hooks": {
    "UserPromptSubmit": [{ "hooks": [{ "type": "command", "command": "node C:/Users/rafal/hub-probes/tools/probe-hook.js", "async": true }] }],
    "PostToolUse": [{ "matcher": "*", "hooks": [{ "type": "command", "command": "node C:/Users/rafal/hub-probes/tools/probe-hook.js", "async": true }] }],
    "Notification": [{ "hooks": [{ "type": "command", "command": "node C:/Users/rafal/hub-probes/tools/probe-hook.js", "async": true }] }],
    "Stop": [{ "hooks": [{ "type": "command", "command": "node C:/Users/rafal/hub-probes/tools/probe-hook.js", "async": true }] }],
    "StopFailure": [{ "hooks": [{ "type": "command", "command": "node C:/Users/rafal/hub-probes/tools/probe-hook.js", "async": true }] }],
    "SessionEnd": [{ "hooks": [{ "type": "command", "command": "node C:/Users/rafal/hub-probes/tools/probe-hook.js", "async": true }] }]
  }
}
```

- [ ] **Step 2: Initial commits of the throwaway repositories** (the only commits of this plan; S10 needs one)

```bash
for R in "C:/Users/rafal/hub-probes/repo" "C:/Users/rafal/hub-probes/repo with space"; do
  git -C "$R" add -A && git -C "$R" commit -q -m "chore: probe sandbox" && git -C "$R" log --oneline -1
done
```

Expected: one commit line per repository.

- [ ] **Step 3: Write the report skeleton**

Create `D:/Notatki/notatki/.claude/specs/2026-10-13-orchestrator-hub-probes.md`:

```markdown
# Orchestrator hub — probe report

**Spec:** `2026-10-13-orchestrator-hub-design.md` §9.2
**Plan:** `.claude/plans/2026-10-13-orchestrator-hub-plan-1-probes.md`
**Sandbox:** `C:/Users/rafal/hub-probes/`

Each section: question, method, raw result (verbatim), verdict (pass / fail / partial),
fallback taken, spec impact.

## Preliminary findings (plan writing, 2026-10-13, scratch directory)

- Five processes appending 20 lines each to one file within one second: 100 well-formed lines,
  0 broken, in 3 of 3 runs.
- A watcher stopped mid-burst and a second watcher with a catch-up scan: the second saw 100 of
  100 ids, in 3 of 3 runs.
- Concurrent `renameSync` of temp files onto the same `.last.md`: 5–6 of 25 renames per run
  failed with `EPERM`. Spec §5.1 writes `.last.md` by temp file and rename, so this needs a
  decision (retry with backoff, or one last-message file per `Stop` event).
- `claude agents --json`: p50 164 ms, p95 173 ms over 3 runs; keys `cwd, id, kind, name, pid,
  sessionId, startedAt, state, status`; `status` values seen `idle`, `busy`; `state` seen
  `blocked`; no `waitingFor` key in that output.
- `codex exec --json` emits `thread.started` with `thread_id`; with a reviewer instruction in the
  prompt Codex ran no agent while the contract was still in place.

## S1 — hooks in a VS Code panel session, payload fields
## S2 — cost of the PostToolUse hook
## S3 — fs.watch reliability, concurrent writes, claude agents --json
## S4 — SendMessage and the recipient
## S5 — Monitor expiry wakes an idle hub
## S6 — fork launch
## S7 — write boundary of the fork
## S8 — role file survives /clear
## S9 — Codex follow-up sandbox and working directory
## S10 — background session in a new worktree
## S11 — gate marker smoke test

## Summary

| Probe | Verdict | Fallback taken | Spec impact |
|---|---|---|---|
```

- [ ] **Step 4: Checkpoint** — no commit in the vault.

---

### Task 3: S1 — hooks in a VS Code panel session and payload fields

Needs Rafal for the interactive sessions.

**Files:**
- Modify: report section `## S1`

**Interfaces:**
- Consumes: sandbox hooks (Task 2), `tools/stats.js`.
- Produces: the field inventory per event (session name present or not, tool call id in `PostToolUse` and `Notification`, `prompt` in `UserPromptSubmit`), used by Plan 2 and by Task 14 fixtures.

- [ ] **Step 1: Ask Rafal to open the two sessions**

Tell Rafal:
1. VS Code: open the folder `C:/Users/rafal/hub-probes/repo` in a new window and start Claude Code in the panel; accept the workspace and hook trust prompts if shown; switch the panel's permission mode to the default mode (not auto, not accept edits).
2. Terminal: `cd "C:/Users/rafal/hub-probes/repo with space" && claude --name probe-space --permission-mode default`.

- [ ] **Step 2: Confirm the hooks are loaded and prompts will appear** (Review Focus 1)

Ask Rafal to run `/hooks` and `/permissions` in both sessions and read back the results. Expected: `UserPromptSubmit`, `PostToolUse`, `Notification`, `Stop`, `StopFailure`, `SessionEnd` from the project settings; default permission mode; no allow rule covering `node -e` (the global `~/.claude/settings.json` had none when the plan was written). If hooks are missing, fix trust before going on; record what was needed.

- [ ] **Step 3: Drive the events in both sessions, back to back** (Review Focus 4)

Ask Rafal to send in both sessions, one after the other without waiting:
1. `Przeczytaj README.md i odpowiedz jednym zdaniem.` (Read → `PostToolUse`, `Stop`)
2. `Uruchom: node -e "require('fs').writeFileSync('probe.txt','x')"` — wait at least 10 s at the permission prompt before approving (→ `Notification` with `permission_prompt` after about 6 s). If no permission prompt appeared in the UI, the attempt is invalid: record it, re-check the mode from step 2, and repeat; never judge the `Notification` hook from an attempt without a visible prompt.
3. `Napisz jedno zdanie: zażółć gęślą jaźń.` (diacritics in `UserPromptSubmit.prompt`, Review Focus 3)
4. End both sessions with `/exit` (→ `SessionEnd`)

- [ ] **Step 4: Summarise**

```bash
node C:/Users/rafal/hub-probes/tools/stats.js C:/Users/rafal/hub-probes/data/events
```

Expected: JSON lines for at least `UserPromptSubmit`, `PostToolUse`, `Notification`, `Stop`, `SessionEnd`, each with `"sessions":2`. `StopFailure` appears only on an API error; if absent, record "not triggered".

- [ ] **Step 5: Check the details the spec depends on**

```bash
cd C:/Users/rafal/hub-probes/data/events
grep -h '"event":"Notification"' *.jsonl | head -n 2
grep -h '"event":"UserPromptSubmit"' *.jsonl | grep -c "zażółć gęślą jaźń"
grep -h '"cwd"' *.jsonl | grep -o '"cwd":"[^"]*"' | sort -u
```

Expected: the `Notification` payload shows its `notification_type` (or equivalent) value; the diacritics count is `2`; one of the `cwd` values contains `repo with space`.

- [ ] **Step 6: Record in the report**

Under `## S1` paste verbatim: the `/hooks` answers, the `stats.js` output, the three `grep` outputs. Verdict per spec criterion "every event reaches the event log". Write down explicitly: session name present in payloads (yes/no), tool call id field name in `PostToolUse` and in `Notification` (or "absent"), `prompt` present in `UserPromptSubmit`. Fallback if the VS Code session recorded no `Notification`: spec fallback "waiting for permission only for terminal and background sessions" — that changes visible behaviour, so mark it for Rafal.

---

### Task 4: S2 — cost of the PostToolUse hook

**Files:**
- Modify: report section `## S2`

**Interfaces:**
- Consumes: `tools/spawn-bench.js`, `tools/transcript-latency.js`.

- [ ] **Step 1: Hook process cost**

```bash
node C:/Users/rafal/hub-probes/tools/spawn-bench.js 50
```

Expected: one JSON line with `p50Ms`, `p95Ms`, `maxMs` (plan-writing dry run: `p50Ms` 39, `p95Ms` 42 for 10 runs).

- [ ] **Step 2: Tool-call latency with hooks**

```bash
cd C:/Users/rafal/hub-probes/repo
claude -p "Run the Bash command node -e 0 exactly 50 times, one tool call at a time, then reply only DONE." --model haiku --allowedTools "Bash(node -e 0)" --output-format json > C:/Users/rafal/hub-probes/data/s2-with.json
node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).session_id)' C:/Users/rafal/hub-probes/data/s2-with.json
```

Then, with the printed id:

```bash
node C:/Users/rafal/hub-probes/tools/transcript-latency.js <session_id>
grep -c '"event":"PostToolUse"' C:/Users/rafal/hub-probes/data/events/<session_id>.jsonl
```

Expected: `"toolCalls":50` and a `PostToolUse` count of `50`.

- [ ] **Step 3: Tool-call latency without the project hooks**

```bash
cd C:/Users/rafal/hub-probes/repo
mv .claude/settings.json .claude/settings.json.off
claude -p "Run the Bash command node -e 0 exactly 50 times, one tool call at a time, then reply only DONE." --model haiku --allowedTools "Bash(node -e 0)" --output-format json > C:/Users/rafal/hub-probes/data/s2-without.json
mv .claude/settings.json.off .claude/settings.json
node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).session_id)' C:/Users/rafal/hub-probes/data/s2-without.json
```

Then `node C:/Users/rafal/hub-probes/tools/transcript-latency.js <session_id>` with that id. Confirm `ls .claude/settings.json` exists again.

- [ ] **Step 4: Record**

Paste the outputs under `## S2`. Criterion (spec §9.2): `p95Ms` of step 1 below 500, and median latency with hooks minus median without below 100 ms. The latency comparison counts only with exactly 50 paired tool calls in both runs and 50 `PostToolUse` events in the run with hooks; otherwise repeat the short run once, and if it is still short the verdict is `partial` with no threshold comparison. Fallback on failure: record only Edit/Write/Bash, or drop "what it is doing now" — a scope change, mark it for Rafal.

---

### Task 5: S3 — concurrent writes, fs.watch, claude agents --json

**Files:**
- Modify: report section `## S3`

**Interfaces:**
- Consumes: `tools/burst.js`, `tools/watch-probe.js`, `tools/count-lines.js`, `tools/time-agents.js`.

- [ ] **Step 1: Separate files, one watcher, three runs**

```bash
cd C:/Users/rafal/hub-probes/tools
for run in 1 2 3; do
  D=C:/Users/rafal/hub-probes/data/burst/a$run; rm -rf "$D"; mkdir -p "$D"
  node watch-probe.js --dir="$D" --seconds=4 --out="$D.json" & W=$!
  sleep 0.3; node burst.js --dir="$D"; wait $W; node count-lines.js "$D"
done
```

Expected per run: `burst.js` prints `"generated":100,"appended":100`; `watch-probe.js` prints `"seen":100`; `count-lines.js` prints `"wellFormed":100,"broken":0,"leftoverTmp":0`.

- [ ] **Step 2: One shared file (one session's concurrent hooks), watcher restarted mid-burst, three runs**

```bash
cd C:/Users/rafal/hub-probes/tools
for run in 1 2 3; do
  D=C:/Users/rafal/hub-probes/data/burst/b$run; rm -rf "$D"; mkdir -p "$D"
  node burst.js --dir="$D" --shared=1 & P=$!
  node watch-probe.js --dir="$D" --seconds=0.6 --out="$D-first.json" > /dev/null
  node watch-probe.js --dir="$D" --seconds=3 --out="$D-second.json" > /dev/null
  wait $P; node count-lines.js "$D"
  node -e 'const r=JSON.parse(require("fs").readFileSync(process.argv[1]));console.log("second watcher:",r.seen,JSON.stringify(r.bySource))' "$D-second.json"
done
```

Expected per run: `"appended":100`, `"wellFormed":100,"broken":0`, `second watcher: 100`. `renameErrors` is recorded as measured (plan-writing dry run: 5–6 `EPERM`).

- [ ] **Step 3: Timing and shape of `claude agents --json`**

```bash
node C:/Users/rafal/hub-probes/tools/time-agents.js 10
```

Expected: `"failures":[]`, `p50Ms`, `p95Ms`, `keys`, `kinds`, `states`, `statuses`.

- [ ] **Step 4: Record**

Paste all outputs under `## S3`. Criteria: received after catch-up equals generated; broken lines 0. Separately, the `EPERM` rename result: spec §5.1 writes `.last.md` by temp file and rename, so a non-zero `renameErrors` is a spec impact — write both options for Rafal (retry the rename with backoff; one last-message file per `Stop` event referenced from the event) and stop for his decision at Task 14.

---

### Task 6: S4 — SendMessage and the recipient

The executing session sends; Rafal runs the recipient.

**Files:**
- Create/modify/delete: `C:/Users/rafal/hub-probes/repo/.claude/settings.local.json` (temporary)
- Modify: report section `## S4`

**Interfaces:**
- Consumes: sandbox hooks; the `SendMessage` and `ListAgents` tools of the executing session (load them with ToolSearch `select:SendMessage,ListAgents`).

- [ ] **Step 1: Recipient up**

Ask Rafal: `cd C:/Users/rafal/hub-probes/repo && claude --name probe-recipient`, then leave it idle.

- [ ] **Step 2: Send with the default inbound setting**

Run `ListAgents`, find `probe-recipient`, then `SendMessage` to it with the text `Probe S4: reply with the single word RECEIVED.` Record the tool result verbatim.

- [ ] **Step 3: Did the message trigger `UserPromptSubmit`, and is it marked?**

```bash
cd C:/Users/rafal/hub-probes/data/events
grep -l "probe-recipient\|Probe S4" *.jsonl
grep -h '"event":"UserPromptSubmit"' $(grep -l "Probe S4" *.jsonl) | tail -n 1
```

Expected: either a `UserPromptSubmit` line whose `prompt` contains `Probe S4` (record the exact wrapper text around it), or no such line (record "not triggered").

- [ ] **Step 4: `hold` and `refuse`**

For each value `hold`, then `refuse`:
1. Write `C:/Users/rafal/hub-probes/repo/.claude/settings.local.json` with `{ "crossSessionInbound": "<value>" }`.
2. Ask Rafal to exit and restart the recipient with the same command as step 1.
3. `SendMessage` to `probe-recipient` with `Probe S4 <value>: reply RECEIVED.`; record the tool result verbatim and what Rafal sees in the recipient.

Then delete `settings.local.json`. If the setting has no visible effect, record that literally — the key name comes from documentation and is itself under test.

- [ ] **Step 5: Record**

Under `## S4`: all tool results and the `UserPromptSubmit` line verbatim. Criterion: the three behaviours written down. Fallback: the hub sets "working" itself after sending; an unconfirmed delivery stays `delivery-unknown`.

---

### Task 7: S5 — Monitor expiry wakes an idle hub

Runs in the executing session; it must end its turn and receive no other input while waiting.

**Files:**
- Modify: report section `## S5`

**Interfaces:**
- Consumes: `tools/watch-probe.js` with `--emit=1 --state=…`; the `Monitor` tool (load with ToolSearch `select:Monitor`).

- [ ] **Step 1: Prepare**

```bash
mkdir -p C:/Users/rafal/hub-probes/data/s5 && rm -f C:/Users/rafal/hub-probes/data/s5-state.json
node -e 'require("fs").appendFileSync("C:/Users/rafal/hub-probes/data/s5/s5.events.jsonl", JSON.stringify({id:"before-1",at:Date.now()})+"\n")'
```

- [ ] **Step 2: Arm a quiet monitor with a short timeout and go idle**

Start `Monitor` with `timeout_ms: 60000`, `description: "S5 probe watcher"` and the command
`node C:/Users/rafal/hub-probes/tools/watch-probe.js --dir=C:/Users/rafal/hub-probes/data/s5 --seconds=3600 --emit=1 --state=C:/Users/rafal/hub-probes/data/s5-state.json`.
Expected first event: `catch-up before-1`. Note the time, tell Rafal not to type anything for two minutes, and end the turn.

- [ ] **Step 3: On the expiry notice**

When the expiry notice arrives (a new turn without user input), note its time, then:
1. append a gap event (written while no watcher runs):
   `node -e 'require("fs").appendFileSync("C:/Users/rafal/hub-probes/data/s5/s5.events.jsonl", JSON.stringify({id:"gap-1",at:Date.now()})+"\n")'`
2. re-arm the same `Monitor` command with `timeout_ms: 60000`;
3. expect the event `catch-up gap-1` and no repeat of `before-1`;
4. stop the monitor with TaskStop.

- [ ] **Step 4: Record**

Under `## S5`: the arm time, the expiry notice time and text verbatim, the re-arm time, the events received. Criterion: the expiry woke the idle session, a new monitor ran within one minute, the catch-up reported `gap-1`. If no notice arrived within two minutes, Rafal types `status` and the result is "expiry does not wake an idle session"; fallback per spec: a reminder in the hub tab.

---

### Task 8: S6 — fork launch

Needs Rafal for `claude attach`.

**Files:**
- Modify: report section `## S6`

**Interfaces:**
- Consumes: the recipient session `probe-recipient` from Task 6 (restart it with the step 1 command of Task 6 if it was closed).
- Produces: the final fork command for spec §6.5 step 2.

- [ ] **Step 1: Recipient id, recipient idle**

```bash
claude agents --json | node -e 'let s="";process.stdin.on("data",c=>s+=c).on("end",()=>{for(const a of JSON.parse(s))if(a.name==="probe-recipient")console.log(a.sessionId,a.status)})'
```

Expected: one line `<sessionId> idle`.

- [ ] **Step 2: Launch a background fork with a start prompt**

```bash
cd C:/Users/rafal/hub-probes/repo
claude --bg --resume <sessionId> --fork-session --name dlg-probe "Probe S6: you are a read-only analytical partner. Reply with ROLE OK and quote the last user message you remember."
```

Record stdout and stderr verbatim (expected: a printed id). Then:

```bash
claude agents --json | node -e 'let s="";process.stdin.on("data",c=>s+=c).on("end",()=>{for(const a of JSON.parse(s))if(/dlg-probe/.test(a.name||""))console.log(JSON.stringify(a))})'
claude logs dlg-probe
```

Expected: the fork is listed with its own `sessionId`; the log shows `ROLE OK` and a message from the recipient's history.

- [ ] **Step 3: Dialog directory access**

```bash
mkdir -p C:/Users/rafal/hub-probes/data/dialogs/probe
```

Ask Rafal: `claude attach <fork id>`, then type `Zapisz plik C:/Users/rafal/hub-probes/data/dialogs/probe/decisions.md z jedną linią: test` and report whether a permission prompt appeared and what it said; then detach.

- [ ] **Step 4: Fork of a busy session**

Ask Rafal to send to `probe-recipient`: `Uruchom: node -e "setTimeout(()=>{},30000)"` and approve it. While it runs (within 30 s):

```bash
cd C:/Users/rafal/hub-probes/repo
claude --bg --resume <sessionId> --fork-session --name dlg-busy "Probe S6 busy: quote the last user message you remember."
sleep 20; claude logs dlg-busy
```

Record verbatim whether it started and which message it quotes.

- [ ] **Step 5: Stop the forks**

```bash
claude stop <dlg-probe id>; claude stop <dlg-busy id>
```

- [ ] **Step 6: Record**

Under `## S6`: all outputs. Write the final fork command that worked. Criterion: the four behaviours written down. Fallback: a ready command to paste; forks only of idle sessions.

---

### Task 9: S7 — write boundary of the fork

**Files:**
- Create: `C:/Users/rafal/hub-probes/tools/fork-settings.json`
- Modify: report section `## S7`

**Interfaces:**
- Consumes: `probe-recipient` session id (Task 8 step 1).

- [ ] **Step 1: Settings variant A (`//C:/` form)**

Write `C:/Users/rafal/hub-probes/tools/fork-settings.json`:

```json
{
  "permissions": {
    "allow": ["Edit(//C:/Users/rafal/hub-probes/data/dialogs/probe/**)"],
    "deny": ["Edit(./**)", "Bash"]
  }
}
```

- [ ] **Step 2: Launch a fork with the settings and a write task**

```bash
cd C:/Users/rafal/hub-probes/repo
claude --bg --resume <sessionId> --fork-session --name dlg-s7 --settings C:/Users/rafal/hub-probes/tools/fork-settings.json --add-dir C:/Users/rafal/hub-probes/data/dialogs/probe "Probe S7: write C:/Users/rafal/hub-probes/data/dialogs/probe/s7-inside.md containing inside, then try to write ./s7-outside.md containing outside, then report literally what happened to each."
sleep 60
claude logs dlg-s7
claude agents --json | node -e 'let s="";process.stdin.on("data",c=>s+=c).on("end",()=>{for(const a of JSON.parse(s))if(a.name==="dlg-s7")console.log(JSON.stringify(a))})'
ls C:/Users/rafal/hub-probes/data/dialogs/probe/ C:/Users/rafal/hub-probes/repo/s7-outside.md
```

Expected for a pass: `s7-inside.md` exists, `repo/s7-outside.md` does not, the fork is not `blocked` on a permission prompt for the inside write.

- [ ] **Step 3: Variant B if the inside write failed**

If the inside write was refused or blocked: stop the fork (`claude stop <dlg-s7 id>`), change the allow rule to `Edit(//c/Users/rafal/hub-probes/data/dialogs/probe/**)`, delete any created files, and repeat step 2 with the name `dlg-s7b`.

- [ ] **Step 4: Variant C if the outside file appeared**

`Edit` rules are documented to cover every file-editing tool; if `repo/s7-outside.md` exists anyway (for example created through `Write`), stop the fork, delete the file, add `"Write(//C:/Users/rafal/hub-probes/data/dialogs/probe/**)"` to `allow` and `"Write(./**)"` to `deny` (keeping the path form that worked for the inside write), and repeat step 2 with the name `dlg-s7c`. The verdict always rests on the `ls` result, never on the fork's own report.

- [ ] **Step 5: Clean up and record**

`claude stop` every `dlg-s7*` fork; delete `repo/s7-outside.md` if it exists. Under `## S7`: the settings variant used, all outputs verbatim, the verdict. Fallback: default mode, Rafal approves each fork write himself.

---

### Task 10: S8 — role file survives /clear

**Files:**
- Create: `C:/Users/rafal/hub-probes/tools/role.md`
- Modify: report section `## S8`

- [ ] **Step 1: Role file**

Write `C:/Users/rafal/hub-probes/tools/role.md`:

```markdown
You are the probe hub. When the user asks "kim jesteś?", answer exactly: HUB ROLE ACTIVE
```

- [ ] **Step 2: Session with the role file**

Ask Rafal:
1. `cd C:/Users/rafal/hub-probes/repo && claude --name probe-role --append-system-prompt-file C:/Users/rafal/hub-probes/tools/role.md`
2. type `kim jesteś?` and read back the answer;
3. type `/clear`, then `kim jesteś?` again and read back the answer;
4. `/exit`.

If the CLI rejects the flag, record its message verbatim.

- [ ] **Step 3: Record**

Under `## S8`: both answers verbatim. Criterion: `HUB ROLE ACTIVE` both times. Fallback: invoke the skill `hub` again after `/clear`.

---

### Task 11: S9 — Codex follow-up sandbox and working directory

Runs after Task 1 (contract removed).

**Files:**
- Create: `C:/Users/rafal/hub-probes/data/codex/{s9-first.md,s9-follow.md,s9-1.jsonl,s9-2.jsonl,s9-3.jsonl,s9-*.md}`
- Modify: report section `## S9`

**Interfaces:**
- Consumes: `tools/codex-commands.js`.

- [ ] **Step 1: Prompts**

Write `C:/Users/rafal/hub-probes/data/codex/s9-first.md`:

```markdown
Probe S9, first call. Quote the first line of README.md in the current directory. Then try to create
the file s9-write-1.txt containing x and report literally whether it succeeded. Then print the
current working directory. Finally repeat this phrase exactly: zażółć gęślą jaźń. Do not start any
other agent.
```

Write `C:/Users/rafal/hub-probes/data/codex/s9-follow.md`:

```markdown
Probe S9, follow-up. Try to create the file s9-write-2.txt containing x and report literally
whether it succeeded. Print the current working directory. Then say in one sentence what I asked
you in the first message. Do not start any other agent.
```

- [ ] **Step 2: First call**

```bash
cd C:/Users/rafal/hub-probes/repo
codex exec -s read-only -C C:/Users/rafal/hub-probes/repo --json -o C:/Users/rafal/hub-probes/data/codex/s9-1.md - < C:/Users/rafal/hub-probes/data/codex/s9-first.md > C:/Users/rafal/hub-probes/data/codex/s9-1.jsonl
node C:/Users/rafal/hub-probes/tools/codex-commands.js C:/Users/rafal/hub-probes/data/codex/s9-1.jsonl
cat C:/Users/rafal/hub-probes/data/codex/s9-1.md
```

Expected: a `threadId`; `agentLaunches: []` and `otherToolItems: []`; the answer quotes `# Probe sandbox`, reports the write as refused, prints the repo path, and repeats `zażółć gęślą jaźń` intact. Every entry in `otherToolItems` (for example an MCP tool call) is inspected by hand; one that could delegate to an agent, or whose purpose is unclear, makes the verdict `partial`.

- [ ] **Step 3: Follow-up with the read-only override**

```bash
cd C:/Users/rafal/hub-probes/repo
codex exec resume <threadId> -c sandbox_mode="read-only" --json -o C:/Users/rafal/hub-probes/data/codex/s9-2.md - < C:/Users/rafal/hub-probes/data/codex/s9-follow.md > C:/Users/rafal/hub-probes/data/codex/s9-2.jsonl
node C:/Users/rafal/hub-probes/tools/codex-commands.js C:/Users/rafal/hub-probes/data/codex/s9-2.jsonl
cat C:/Users/rafal/hub-probes/data/codex/s9-2.md
ls C:/Users/rafal/hub-probes/repo/s9-write-*.txt
```

Expected for a pass: the write refused, `ls` finds no `s9-write-*.txt`, the working directory is the repo, the answer recalls the first message, `agentLaunches: []` and `otherToolItems: []` (or each one inspected as in step 2).

- [ ] **Step 4: Follow-up without the override (informational)**

Repeat step 3 with `-o …/s9-3.md`, stream `s9-3.jsonl`, and without `-c sandbox_mode="read-only"`. Record whether `s9-write-2.txt` appears. Delete any `s9-write-*.txt` afterwards.

- [ ] **Step 5: Record**

Under `## S9`: the three `codex-commands.js` outputs (commands may be shortened to the first 200 characters each), the three answers verbatim, the `ls` results. Criterion: a write attempt in the follow-up is refused, the working directory is the repo, no agent launch. Fallback: a new `codex exec -s read-only -C <dir>` call per follow-up with `thread.md` as context.

---

### Task 12: S10 — background session in a new worktree

**Files:**
- Modify: report section `## S10`

- [ ] **Step 1: Launch**

```bash
cd C:/Users/rafal/hub-probes/repo
claude --bg -w probe-wt --name probe-wt --allowedTools "Bash(git rev-parse:*)" "Bash(git branch:*)" -- "Probe S10: run git rev-parse --show-toplevel and git branch --show-current, then reply with both outputs."
```

Record stdout and stderr verbatim. If the CLI rejects `--` or the tool list, drop `--allowedTools` and approve the commands after `claude attach`; record what happened.

- [ ] **Step 2: Inspect**

```bash
sleep 30
claude agents --json | node -e 'let s="";process.stdin.on("data",c=>s+=c).on("end",()=>{for(const a of JSON.parse(s))if(a.name==="probe-wt")console.log(JSON.stringify(a))})'
git -C C:/Users/rafal/hub-probes/repo worktree list
claude logs probe-wt
```

Expected for a pass: the session `cwd` is a worktree path different from the repo; `git worktree list` shows it; the log shows a branch other than the repo's default branch.

Before removing, check where the worktree is: its absolute path (from the session `cwd` and `git worktree list`) must lie under `C:/Users/rafal/hub-probes/`. If it lies anywhere else, do not run `claude rm`: stop the task, record the path, and ask Rafal.

- [ ] **Step 3: Remove**

```bash
claude rm <probe-wt id>
git -C C:/Users/rafal/hub-probes/repo worktree list
```

Record the `claude rm` output verbatim; expected: the worktree is gone from the list.

- [ ] **Step 4: Record**

Under `## S10`: all outputs. Fallback: the hub creates the worktree with `git worktree add` and starts the session in it.

---

### Task 13: S11 — gate marker smoke test

Needs Rafal.

**Files:**
- Modify: report section `## S11`

**Interfaces:**
- Consumes: the marker rule in `repo/CLAUDE.md` (Task 2), `tools/marker-check.js`.

- [ ] **Step 1: Session**

Ask Rafal: `cd C:/Users/rafal/hub-probes/repo && claude --name probe-marker`, then send these five prompts one at a time, answering each gate with `ok`:
1. `Chcę dodać plik notes.md. Zanim cokolwiek zrobisz, zadaj mi jedno pytanie doprecyzowujące.`
2. `Zaproponuj strukturę notes.md w jednej sekcji i poproś mnie o akceptację.`
3. `Napisz krótki spec w spec.md i poproś mnie o review.`
4. `Daj mi wybór: wariant A albo B dla nazwy pliku, i poczekaj na decyzję.`
5. `/compact`, then `Zaproponuj następny krok i poczekaj na moją zgodę.`

Then `/exit`.

- [ ] **Step 2: Check**

```bash
cd C:/Users/rafal/hub-probes/data/events
S=$(grep -l '"Chcę dodać plik notes.md' *.jsonl | head -n 1 | sed 's/\.jsonl$//')
node C:/Users/rafal/hub-probes/tools/marker-check.js C:/Users/rafal/hub-probes/data/events "$S"
```

Expected: the `Stop` rows answering the five gate prompts each have `"marker": true`.

- [ ] **Step 3: Record**

Under `## S11`: the `marker-check.js` output. Criterion: 5 of 5 gates. A lower count keeps the spec as written (the marker is auxiliary and the hub judges the last message), but record which gate kind missed it.

---

### Task 14: Fixtures, cleanup, summary and gate

**Files:**
- Create: `C:/Users/rafal/hub-probes/data/fixtures/*.json`
- Modify: report `## Summary`

- [ ] **Step 1: Fixtures without content**

```bash
node C:/Users/rafal/hub-probes/tools/sanitize.js C:/Users/rafal/hub-probes/data/events C:/Users/rafal/hub-probes/data/fixtures
grep -rl "zażółć\|Probe S4\|README" C:/Users/rafal/hub-probes/data/fixtures || echo "no content leaked"
```

Expected: `no content leaked`, and `missing` contains at most `StopFailure` (triggered only by an API error). Plan 2 builds its `StopFailure` fixture by hand from the documented fields; record that in the report. Any other entry in `missing` means the matching S1 step did not happen as planned: repeat it, then rerun this step.

- [ ] **Step 2: No probe session left running**

```bash
claude agents --json | node -e 'let s="";process.stdin.on("data",c=>s+=c).on("end",()=>{for(const a of JSON.parse(s))if(/^(probe-|dlg-)/.test(a.name||""))console.log(a.id,a.name,a.kind,a.state||a.status)})'
```

For each listed background session run `claude stop <id>` (or `claude rm <id>` for a worktree session); ask Rafal to close listed interactive ones. Re-run until nothing is listed.

- [ ] **Step 3: Summary table**

Fill `## Summary` with one row per probe: verdict, fallback taken, spec impact (section, or "none"). The sandbox `C:/Users/rafal/hub-probes/` stays: Plan 2 uses `data/fixtures/`.

- [ ] **Step 4: Gate**

Stop and show Rafal the summary table. List every spec impact as a decision for him (at least the `EPERM` rename finding of S3 if confirmed). Plan 2 is written only after those decisions. Propose commit messages:

```
docs(specs): orchestrator hub probe report

Results of probes S1-S11 with verbatim evidence, fallbacks taken and
spec impacts for plans 2 and 3.
```

```
chore(claude): remove Codex-Claude execution contract

The contract was a remnant of coordinating Claude sessions from the
Codex desktop app; the orchestrator hub replaces it (decision 13).
```
