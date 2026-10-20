// Every request needs a local Host and the conversation's token (spec §6).
import { timingSafeEqual } from 'node:crypto';

export function authorize({ url, host }, { token, port }) {
  if (!host || ![`127.0.0.1:${port}`, `localhost:${port}`].includes(host)) return { ok: false, status: 403, reason: 'host' };
  let given;
  try {
    given = Buffer.from(new URL(url, 'http://local').searchParams.get('t') ?? '');
  } catch {
    return { ok: false, status: 403, reason: 'token' }; // a request target that is not a URL carries no token
  }
  const expected = Buffer.from(token);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return { ok: false, status: 403, reason: 'token' };
  return { ok: true };
}
