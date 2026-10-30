---
name: n8n-cloud-drive-limit-zapytan
description: "Google Drive Tool in n8n Cloud can fail with Forbidden 'Quota exceeded ... Requests per minute' for drive.googleapis.com - a transient per-minute limit of the OAuth app's Google project, not a model or automat fault (lesson 3.1 agenty-ai, 2026-10-30)"
metadata:
  node_type: memory
  type: project
  originSessionId: 8c81b3d1-cb64-4c72-97ce-98d2b72ade56
  modified: 2026-10-30T11:03:38.351Z
---

In the final take `lekcja-v1` of lesson 3.1 agenty-ai (2026-10-30, run 948, step 22) the Google Drive Tool returned
"Forbidden - perhaps check your credentials? Quota exceeded for quota metric 'Queries' and limit 'Previous quota:
Requests per minute' of service 'drive.googleapis.com' for consumer 'project_number:498586711441'". The agent then
answered that it hit an access error. The automat reported it as step 23 "run has no call of … with folder" (class
`INNY`), which reads like model variance until you look at the frame.

Assumption (not verified): the consumer project is the Google project of n8n Cloud's managed "Sign in with Google" OAuth
app, so the limit is shared and outside our control. The course's own GCP is not involved.

**Why:** a step-23-style failure in a chat step can be a quota error, a model choice (pass 11 asked for confirmation
instead of descending), or an automat fault. Each needs a different response.

**How to apply:** when a chat step check fails on a missing tool call, extract the frame (`ffmpeg -ss <t>` on
`surowe.mp4`, or the pass screenshot) and read the tool's output panel before blaming the model. A quota error is
handled like `LIMIT_SIEC`: a later retry, no automat fix. Related: [[agenty-ai-3-1-cofniecie-przed-proba]].
