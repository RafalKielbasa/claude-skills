---
name: gemini-avoid-flash-lite
description: "gemini-2.5-flash-lite is frequently unavailable in this project's Gemini API calls — avoid it when picking a model for n8n Gemini nodes"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 9d79363d-2978-427a-8a6a-7e2ce8d3f0a7
  modified: 2026-07-28T15:29:24.870Z
---

Avoid `gemini-2.5-flash-lite` when configuring Gemini model calls (e.g. n8n `@n8n/n8n-nodes-langchain.googleGemini` nodes in this project's workflows).

**Why:** user reported the model is often unavailable, causing call failures — despite being listed as stable/GA in Google's docs, it has practical availability issues.

**How to apply:** when adding or editing a Gemini node/model reference in `workflows/*.json`, don't default to `gemini-2.5-flash-lite`. Prefer `gemini-2.5-flash` (stable, already used in `07_enrich_and_push_tasks.json` and `24_deep_research.json`) or `gemini-2.5-pro` for heavier reasoning.

Known usage to watch/fix: `workflows/01_process_meeting.json` node "Classify Meeting (Gemini)" (~line 245) currently calls `gemini-2.5-flash-lite` — runs on every processed meeting, so if it's unavailable the whole classification step fails.

Per Google docs checked 2026-07-28, current Gemini model stability landscape:
- Stable/GA: `gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-2.5-flash-lite` (avoid per above despite GA label), `gemini-3.6-flash`, `gemini-3.5-flash`, `gemini-3.5-flash-lite`, `gemini-3.1-flash-lite`, `gemini-embedding-001`, `gemini-embedding-002`.
- Preview/experimental (avoid for production reliability): `gemini-3-pro-preview`, `gemini-3-flash-preview`, `gemini-3.1-pro-preview`, `gemini-3.5-live-translate-preview`.
- Deprecated/being retired: `gemini-2.0-flash`, `gemini-2.0-flash-lite`.

This project's workflows currently also lean on preview models: `01_process_meeting.json` uses `gemini-3-pro-preview` in 6 places, `30_daily_pipeline.json` uses `gemini-3-flash-preview` in 2 places — worth revisiting if those preview IDs get retired.
