---
name: n8n-read-workflows-from-postgres
description: How to read full n8n workflow JSON (incl. MCP-disabled ones) directly from the Postgres DB
metadata: 
  node_type: memory
  type: reference
  originSessionId: 70274e0f-49f3-4c89-b2e3-d6698b537180
---

Full workflow JSON (nodes/connections/settings) can be read straight from Postgres, which is the only way to inspect workflows where `settings.availableInMCP` is false/unset (get_workflow_details rejects those with "Workflow is not available in MCP", and there is no N8N_API_KEY in .env — see [[n8n-tags-not-settable-via-mcp]]).

Container `devstock-team-agent-postgres-1`, db `n8n`, user `n8n` (password in .env `POSTGRES_PASSWORD`, exposed on localhost:5432). Table `workflow_entity`; columns `nodes` and `connections` are type **json** (not jsonb — use `json_array_length`, not `jsonb_array_length`). Archived scratch workflows have `"isArchived" = true` and are hidden from MCP `search_workflows`.

Export all live workflows as JSONL for diffing against the repo's `workflows/*.json`:
`cat export.sql | docker exec -i devstock-team-agent-postgres-1 psql -U n8n -d n8n -t -A > out.jsonl`
where export.sql = `select json_build_object('name',name,'nodes',nodes,'connections',connections,'settings',settings)::text from workflow_entity where "isArchived"=false order by name;`

Note: repo JSON files intentionally omit node `credentials` (they are `undefined` in files, bound in the DB), so credential-only diffs are expected, not drift.
