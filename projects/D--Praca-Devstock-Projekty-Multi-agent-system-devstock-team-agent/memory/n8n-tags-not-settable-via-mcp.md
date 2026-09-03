---
name: n8n-tags-not-settable-via-mcp
description: n8n workflow tags cannot be applied through the n8n-mcp server; only via n8n UI or REST API
metadata: 
  node_type: memory
  type: reference
  originSessionId: 6b36e150-5293-48c1-8612-b81458972031
---

Workflow **tags** cannot be set on the live n8n instance through the `n8n-mcp` server:
- there is no tag-management MCP tool (no create/assign tag),
- `update_workflow` has no `tags` parameter,
- the Workflow SDK `workflow('id','name')` has no tag primitive either.

`update_workflow` *does* accept a `description` param, but it requires full valid SDK code, so it effectively rebuilds the whole workflow — unsafe for existing complex workflows just to change metadata.

To apply tags to the live instance, use the n8n UI or the public REST API at `http://localhost:5678` (`POST /api/v1/tags` then `PUT /api/v1/workflows/{id}/tags`), which needs an `X-N8N-API-KEY` header. The repo `.env` does NOT contain an API key (only `N8N_ENCRYPTION_KEY` + webhook URLs); the key must be generated in n8n Settings → API.

Tags are also invisible on the **read** side: `get_workflow_details` returns `tags: []` for every workflow even when tags exist in the UI. So when syncing n8n → local files (n8n as source of truth), do NOT overwrite the local `tags` field from MCP output — it would wipe curated tags. Preserve local tags and sync everything else (nodes/connections/active/description). Confirmed in the 2026-06-13 full 24-workflow sync.

**`settings.availableInMCP` is also a curated repo-only flag:** the live DB/MCP often lacks it while the repo file sets `availableInMCP:true`. When syncing live→repo do NOT blindly copy `settings` from live — it drops `availableInMCP` and re-hides the workflow from MCP. Correct write-back rule (validated 2026-07-01 partial sync of 01/07/20/22/26/28): take **nodes/connections/active** from live (strip `credentials`), and **keep the repo's `tags`, `description`, and `settings`** (incl. `availableInMCP`). Skip workflows where the repo is the newer side (e.g. a refactor not yet imported) so the sync doesn't revert them.

The `n8n-mcp` server is HTTP (`http://localhost:5678/mcp-server/http`, Bearer token in `~/.claude.json` projects entry). Claude Code only connects it at session start, so if n8n (docker) isn't up when the session launches, the `mcp__n8n-mcp__*` tools never load. Workaround when that happens: drive the MCP endpoint directly over curl (POST JSON-RPC, `Accept: application/json, text/event-stream`, responses are SSE `data:` lines; server is stateless, no session-id needed).

Repo convention: workflows are stored as JSON in `workflows/` (see [[n8n-expression-gotchas]]). The JSON `tags` field carries full tag objects, but n8n import does not reliably re-attach them — the REST API or UI is the dependable path.

**Third option (validated 2026-07-02):** direct DB insert works and is the fastest path when deploying via CLI: `INSERT INTO workflows_tags ("workflowId","tagId") VALUES (...) ON CONFLICT DO NOTHING;` against `devstock-team-agent-postgres-1` (db `n8n`, user `n8n`). Tag IDs live in `tag_entity` (tasks=`i0skSY9AX152kJwd`, agent=`ULhXa6GnwNoUGTEY`, pipeline=`tCxYU2yATWodb675`). See [[n8n-cli-import-publish]] for the full CLI deployment procedure.
