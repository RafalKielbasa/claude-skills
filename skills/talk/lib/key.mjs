// Loads ELEVENLABS_API_KEY: the process env first, else the Windows User environment.
// The value is returned to the caller only; nothing here prints or logs it.
import { spawnSync } from 'node:child_process';

const NAME = 'ELEVENLABS_API_KEY';

// A session started before the key was set (VS Code not restarted) does not see it in process.env,
// but the User environment already holds it. TALK_USER_ENV_EMPTY=1 is a test hook: it simulates "not set".
function defaultReadUserEnv(name, env = process.env) {
  if (env.TALK_USER_ENV_EMPTY === '1') return '';
  const r = spawnSync(
    'powershell',
    ['-NoProfile', '-Command', `[Console]::Out.Write([Environment]::GetEnvironmentVariable('${name}','User'))`],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
  );
  return r.status === 0 && typeof r.stdout === 'string' ? r.stdout : '';
}

export function loadKey({ env = process.env, readUserEnv = (name) => defaultReadUserEnv(name, env) } = {}) {
  const fromEnv = (env[NAME] ?? '').trim();
  if (fromEnv) return fromEnv;
  const fromUser = (readUserEnv(NAME) ?? '').trim();
  return fromUser || null;
}
