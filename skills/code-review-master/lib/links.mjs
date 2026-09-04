export function remoteToHttps(remote) {
  if (!remote) return null;
  const ssh = /^git@github\.com:(.+?)(?:\.git)?$/.exec(remote.trim());
  if (ssh) return `https://github.com/${ssh[1]}`;
  const https = /^https:\/\/github\.com\/(.+?)(?:\.git)?$/.exec(remote.trim());
  if (https) return `https://github.com/${https[1]}`;
  return null;
}

export function blobLink(remote, sha, file, lines) {
  const base = remoteToHttps(remote);
  if (base === null) return null;
  const range = lines[0] === lines[1] ? `#L${lines[0]}` : `#L${lines[0]}-L${lines[1]}`;
  return `${base}/blob/${sha}/${file}${range}`;
}
