---
name: feedback-verify-issue-views-in-figma
description: "When an issue links Figma views, always check the code/fix against those nodes in Figma; never decide layout from issue text alone"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 8f459877-1d34-4e38-865f-117213b6a530
  modified: 2026-10-12T13:50:51.193Z
---

If an issue (or the issue behind a PR/regression) contains Figma views, always verify the work against Figma itself (`get_screenshot` / `get_metadata` on the linked nodes) before deciding layout or placement — also in reviews and bug fixes, not only in implementation.

**Why:** 2026-10-12, regression after CP-82 (#157): I proposed where the profile banner should sit relative to the course rail from issue text and code only; Rafał asked "what do the Figma views say?" and set this as a standing rule ("zawsze").

**How to apply:** read the issue's views table, open each node via the Figma MCP; if the connector needs auth, say so and ask Rafał to authorize (`/mcp`) instead of deciding without Figma. Related: [[feedback-unmet-issue-element-blocking]], [[figma-design-system-library]].
