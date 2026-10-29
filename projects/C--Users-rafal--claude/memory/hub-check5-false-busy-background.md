---
name: hub-check5-false-busy-background
description: "HUB prepare check 5 reports \"busy (turn-ended)\" for a background session blocked at a gate, because claude agents gives `state` and checks.mjs reads `status`"
metadata:
  node_type: memory
  type: project
  originSessionId: 0fdd3e93-315f-473f-aa53-b9a0e8bf7948
  modified: 2026-10-29T15:13:28.009Z
---

On 2026-10-29, `HUB prepare` for a direct message to a background session (00434ebc) waiting at its gate failed with `check 5: the session is busy (turn-ended)`. `claude agents --json` listed that session with `"kind": "background"`, `"state": "blocked"` and no `status` field, while `~/.claude/skills/hub/lib/checks.mjs:69` tests `entry.status !== 'idle'`, so any background entry counts as busy. Waiting for a turn end never clears it: the turn had ended hours earlier.

**Why:** the rule [[hub-busy-after-wyslij-waits]] (wait, no question) assumes a real busy session; here waiting stalls forever.

**How to apply:** when check 5 says busy but the overview shows `waiting for decision`/`turn ended` and `claude agents` shows `state: blocked` or `idle`, tell Rafal the check is false and ask once whether to send with `--confirm-busy`. Do not edit the hub skill; report the bug to Rafal instead.
