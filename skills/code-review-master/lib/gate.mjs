export function exitCode({ findings, gate, gateOnDisputed }) {
  if (gate === 'none') return 0;
  const counted = findings.filter((finding) => {
    if (finding.codex && finding.codex.verdict === 'rejects' && !gateOnDisputed) return false;
    return gate === 'any' || finding.severity === 'blocking';
  });
  return counted.length > 0 ? 1 : 0;
}
