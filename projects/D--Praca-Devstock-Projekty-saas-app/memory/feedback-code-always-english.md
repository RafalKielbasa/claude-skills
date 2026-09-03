---
name: feedback-code-always-english
description: "All code always in English, identifiers included; proper nouns from data may stay"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: aecb8c61-37a1-4399-a216-4b24c99f353a
  modified: 2026-08-12T06:58:20.573Z
---

All code must be written in English — identifiers, comments, tests, config, seeds. Stated 2026-08-12 after Polish variable names appeared in `prisma/seed/` ([[global-seed-2026-08-11]]).

**Why:** Rafał wants a uniformly English codebase; Polish descriptive identifiers (`zawieszona`, `nowy`, `szkic`, `foto`) crept into the seed. Rule is recorded in his global `~/.claude/CLAUDE.md` (section "Język kodu") and the repo `AGENTS.md` (section "Language").

**How to apply:** Translate descriptive names (`suspended`, `new`, `draft`, `photo`). Identifiers may quote proper nouns that exist in data (tenant subdomain `kuznia` stays `kuznia` in code). User-facing strings stay in the product language (Polish). Log/check labels citing actual data values (e.g. subdomain `'zawieszona'`) are data references and stay.
