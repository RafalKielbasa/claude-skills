---
name: n8n-cli-import-publish
description: "Full procedure to deploy repo workflow JSONs into the running n8n instance via container CLI (import → tags → publish → restart), with all gotchas"
metadata: 
  node_type: memory
  type: project
  originSessionId: 3dd4234d-157e-4d85-823b-1aaa8d3772db
---

Workflows can be deployed to the devstock n8n instance (n8n 2.21, publish model) without the UI, via CLI in `devstock-team-agent-n8n-1`:

1. **Build an import variant** of the repo JSON (repo convention: no `credentials` blocks): inject `credentials` per node (Gemini `nvVBe3JeIEjuacM3`, Slack `kqdHHIpW4ZniDnQK`, Postgres `uK39epbzUdX3QXk9`, HeaderAuth/ElevenLabs `NtVbclR0cWKXC2nL`), strip `tags`, and **add a top-level `id`** (16-char alnum; import fails with NOT NULL violation without it). When overwriting an existing workflow, graft its current credentials from the DB dump by node name — otherwise import wipes all bindings.
2. **Deliver the file via stdin**: `docker cp` into `/tmp` silently no-ops (tmpfs). Use `docker exec -i <c> sh -c 'cat > /tmp/x.json' < x.json`. In Git Bash set `MSYS2_ARG_CONV_EXCL='*'` or `--input=/tmp/...` gets rewritten to a host path.
3. `n8n import:workflow --input=/tmp/x.json --projectId=VQiOwpr5Raa1sDs0` (personal project of the owner). Default deactivates the workflow.
4. **Tags**: insert directly into DB: `INSERT INTO workflows_tags ("workflowId","tagId") VALUES (...)` (see [[n8n-tags-not-settable-via-mcp]]; tag IDs: tasks=`i0skSY9AX152kJwd`, agent=`ULhXa6GnwNoUGTEY`, pipeline=`tCxYU2yATWodb675`).
5. **Publish**: instance uses the 2.x publish model (`activeVersionId`) — an import only updates the draft; production keeps running the old published version. Run `n8n publish:workflow --id=<id>`, then `docker restart devstock-team-agent-n8n-1`.
6. `n8n execute --id=` does NOT work while the instance runs (task broker port 5679 conflict) — smoke tests must go through the UI.

psql quoting from PowerShell: single-quoted PS string, `\"` for identifiers, doubled `''` for SQL literals.
