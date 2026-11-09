// Spoken alerts: the sentence for a wait and the separate process that says it. The text reaches the
// process only through stdin, never through its command line, because a session title is untrusted
// (spec §6.3). HUB_SPEAK_CMD, a JSON array, replaces the default command, as HUB_CLAUDE_CMD does.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const SPEECH_LIMIT_MS = 30000;

const SCRIPT = fileURLToPath(new URL('../bin/speak.ps1', import.meta.url));

export function sentence(wait) {
  return `${wait.name}. ${wait.kind === 'permission' ? 'Uprawnienia do zaakceptowania.' : 'Decyzja do podjęcia.'}`;
}

export function speakCommand(env = process.env) {
  if (env.HUB_SPEAK_CMD) return JSON.parse(env.HUB_SPEAK_CMD);
  return ['powershell.exe', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', SCRIPT];
}

// Resolves when the process exits 0; rejects when it cannot start, exits non-zero or outlives the limit.
export function speak(text, { env = process.env, timeoutMs = SPEECH_LIMIT_MS } = {}) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve();
    };
    let child;
    let timer;
    try {
      const [command, ...args] = speakCommand(env);
      child = spawn(command, args, { stdio: ['pipe', 'ignore', 'pipe'], windowsHide: true, env });
    } catch (error) {
      reject(error);
      return;
    }
    let stderr = '';
    child.stderr.on('data', (chunk) => { if (stderr.length < 500) stderr += chunk; });
    child.on('error', (error) => finish(error));
    child.on('close', (code) => finish(code === 0 ? null : new Error(`speech process exited ${code}${stderr.trim() ? `: ${stderr.trim().slice(0, 200)}` : ''}`)));
    timer = setTimeout(() => {
      child.kill();
      finish(new Error(`speech process killed after ${timeoutMs} ms`));
    }, timeoutMs);
    // A process that exits without reading stdin must not crash the watcher with EPIPE.
    child.stdin.on('error', () => {});
    child.stdin.end(text, 'utf8');
  });
}
