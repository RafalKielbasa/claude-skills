---
name: n8n-expression-gotchas
description: n8n instance quirks — $guid/$randomString return null; Split Out keeps nesting
metadata: 
  node_type: memory
  type: reference
  originSessionId: 002fae55-d8c2-4da2-800a-c034ad1c61b1
---

On this local n8n instance (verified 2026-05-29 via test executions):

- `{{ $guid }}` and `{{ $randomString }}` evaluate to **null** (unsupported). For a unique id use `{{ $execution.id }}` or `{{ $now.toMillis() }}`. This bit `07_enrich_and_push_tasks` → `Set Session ID` which used `$guid`, silently producing `session_id: null`.
- `Split Out` (n8n-nodes-base.splitOut v1) **keeps array-of-object elements nested under the original field name** even WITHOUT `options.destinationFieldName`. So after splitting `tasks`, you reference `$json.tasks.category` (NOT flattened `$json.category`). `destinationFieldName` is a no-op when it equals the source field name.
- A sub-workflow error (e.g. `ask_knowledge_base`'s `Postgres Chat Memory` "Key parameter is empty" when `sessionKey`/`$json.session_id` is empty) surfaces in the caller as "Error in sub-node ... / AI Agent". Manual runs of an `executeWorkflowTrigger` workflow pass empty input `{}`, so test sub-workflows with real pinned trigger data, not bare manual runs.
