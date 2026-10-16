---
name: hub-confirm-hub-name
description: "HUB confirm matches the sender name \"hub\" by default; a hub session named hub-<n> must pass --hub-name or delivery stays delivery-unknown"
metadata:
  node_type: memory
  type: project
  originSessionId: 4bd8c564-b370-43d3-aa7b-3d173fe69a18
  modified: 2026-10-16T04:59:56.330Z
---

`HUB confirm` (bin/hub.mjs:190) defaults `hubName` to `'hub'` and `findDelivery`/`findMismatch` (lib/confirm.mjs) require `event.fromName === hubName`. When the hub session runs under a suffixed name (ListAgents showed "This session is hub-12" on 2026-10-14), recipients record `fromName: "hub-12"`, so a delivered message stays `delivery-unknown` and a wrong text would not show as `mismatched` either.

**Why:** on 2026-10-14 record r20261014114950-446f to baza-wiedzy-bb was delivered (UserPromptSubmit 11:50:08Z, innerHash = textHash) but plain `confirm` returned nothing; `confirm --hub-name hub-12` confirmed it.

Still true on 2026-10-15 for a hub in the VS Code panel ("This session is hub-ba"): three records (questionnaire request/answers, dialog) confirmed only with `--hub-name hub-ba`; code unchanged at bin/hub.mjs:472, lib/confirm.mjs:14. New-session records (`HUB launch`) confirmed too, but plain `confirm` was not tried first.

**How to apply:** at hub start, read this session's name from ListAgents and run every `HUB confirm` with `--hub-name <that name>` when it is not exactly `hub`. Report it to Rafal as a hub defect (skill not edited from the hub, see [[hub-boundaries]]).
