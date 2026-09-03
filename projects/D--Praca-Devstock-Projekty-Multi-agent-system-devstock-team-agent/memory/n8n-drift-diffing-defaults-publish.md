---
name: n8n-drift-diffing-defaults-publish
description: "How to tell real repo↔server workflow drift from n8n default-stripping noise, and how to check what production actually runs (workflow_history + activeVersionId); 14_github_create_issue is newer on the server than in repo"
metadata: 
  node_type: memory
  type: project
  originSessionId: 2a3f8476-b404-4a61-b2c5-a46af6ab56b7
---

When diffing repo `workflows/*.json` against the live instance (see [[n8n-read-workflows-from-postgres]]), two classes of false positives:

1. **Default-stripping**: n8n UI save removes parameters equal to their node-definition defaults. Repo files (hand-authored) keep them explicit. Diffs showing ONLY things like `operation: insert` (Postgres), `operation: upload` + `binaryPropertyName: data` (Slack file), `operation: getIssues` (GitHub, default for resource=repository — verified in container source), `operation: textToSpeech` (ElevenLabs), `inputSource: workflowInputs`, `triggerAtMinute: 0`, `weeksInterval: 1`, `mode: append` (Merge), `leftValue: ""`, instance-assigned `webhookId`, or empty `"main": [[]]` connection stubs are **not drift** — semantically identical.
2. **Publish-model noise**: `versionId <> activeVersionId` on active workflows often means only version churn (autosave). What production runs = `workflow_history` row where `versionId = workflow_entity."activeVersionId"` (json `nodes`/`connections` columns). Diff that against the draft before concluding production is stale. Inactive workflows have `activeVersionId IS NULL` (never published) — normal.

**Why:** on 2026-07-15 a full audit flagged 17/31 workflows; after these two filters, every one was semantically in sync — zero deployments needed.

**Real drift found (direction: server → repo!):** `14_github_create_issue` was redesigned in the UI on 2026-06-16 (after last repo commit 06-13): executeWorkflowTrigger + "Code in JavaScript" JSON-parsing replaced by a direct `POST create-task` Webhook feeding Create Issue via `$json.body.title/description`. **Never deploy repo→server for 14 without first backporting the webhook design to the repo.**

**How to apply:** before any [[n8n-cli-import-publish]] run, diff normalized (drop `credentials`, `position`, node `id`) repo vs server nodes AND server draft vs published version; also compare `workflow_entity."updatedAt"` with `git log -1` per file to establish drift direction.
