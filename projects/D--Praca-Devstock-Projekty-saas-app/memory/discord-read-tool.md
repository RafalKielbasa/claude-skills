---
name: discord-read-tool
description: "Read-only Discord channel export script at ~/.claude/tools/discord-read (bot token in DISCORD_BOT_TOKEN), built 2026-10-22 to sum interns' status hours; no Discord MCP on purpose"
metadata:
  node_type: memory
  type: reference
  originSessionId: 5c87bf80-40a1-4712-b700-bccd693aeb32
  modified: 2026-10-22T10:29:43.497Z
---

`C:\Users\rafal\.claude\tools\discord-read\read-channel.mjs` — Node 24, zero dependencies, GET
only, exports one channel's history to JSON (`--channel <id> --after YYYY-MM-DD [--before …]
--out <file>`). Token from `DISCORD_BOT_TOKEN`, falling back to `HKCU\Environment` so a fresh
`setx` works without restarting Claude Code. 6 offline tests (`node --test read-channel.test.mjs`).
Setup steps (bot, Message Content Intent, View Channels + Read Message History) in its README.

Chosen by Rafał 2026-10-22 over the `mcp-discord` MCP server (45 tools incl. destructive ones,
README suggests Administrator). Not under git (`~/.claude` is no repo).

Status 2026-10-22: script written and tested; bot not created yet, channel ID of the status
channel unknown — Rafał does setup steps 1–6, then hours go into Norbert's analysis, section 2.
Related: [[intern-hours-in-discord-status]], [[intern-evaluation-2026-10]].
