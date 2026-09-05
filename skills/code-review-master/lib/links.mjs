export function remoteToHttps(remote) {
  if (!remote) return null;
  const trimmed = remote.trim();
  const scp = /^git@github\.com:(.+?)(?:\.git)?$/.exec(trimmed);
  if (scp) return `https://github.com/${scp[1]}`;
  // `ssh://[user@]github.com[:port]/owner/repo(.git)?` — the URL form of the
  // same protocol the `git@host:path` shorthand above resolves; both must land
  // on the same https URL.
  const ssh = /^ssh:\/\/(?:[^@/]+@)?github\.com(?::\d+)?\/(.+?)(?:\.git)?$/.exec(trimmed);
  if (ssh) return `https://github.com/${ssh[1]}`;
  // `https://[user[:token]@]github.com/owner/repo(.git)?` — a userinfo prefix
  // shows up whenever a token or username is embedded in the remote URL (a CI
  // checkout, a credential helper) and must not stop the link from resolving.
  const https = /^https:\/\/(?:[^@/]+@)?github\.com\/(.+?)(?:\.git)?$/.exec(trimmed);
  if (https) return `https://github.com/${https[1]}`;
  return null;
}

export function blobLink(remote, sha, file, lines) {
  const base = remoteToHttps(remote);
  if (base === null) return null;
  const range = lines[0] === lines[1] ? `#L${lines[0]}` : `#L${lines[0]}-L${lines[1]}`;
  return `${base}/blob/${sha}/${file}${range}`;
}
