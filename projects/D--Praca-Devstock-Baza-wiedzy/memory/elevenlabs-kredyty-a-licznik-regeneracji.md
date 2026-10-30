---
name: elevenlabs-kredyty-a-licznik-regeneracji
description: "Ticket lessons: the render spends tts_regenerations before the TTS chain runs, so an ElevenLabs quota failure (HTTP 401 quota_exceeded) burns the counter without producing narration; V4 bills about 0.44 credit per character (lesson 3.1, 2026-10-30)"
metadata:
  node_type: memory
  type: project
  originSessionId: 8c81b3d1-cb64-4c72-97ce-98d2b72ade56
  modified: 2026-10-30T15:03:14.182Z
---

On 2026-10-30 the full stage 1 render of lesson 3.1 agenty-ai stopped on its first TTS request. The error was "HTTP 401 quota_exceeded … You have 502 credits remaining, while 716 credits are required" (account quota 374851). The request was the first chunk, segment 1, 1628 characters, so V4 costs about 0.44 credit per character. The lesson's narration is about 17.6k characters, roughly 7.8k credits per full generation.

`przedRegeneracja` in `tools/course-pipeline/src/video.js` spends one `tts_regenerations` whenever `video/lektor/spis.md` exists. It runs before the chain, and the chain also deletes the old chunk files first. A quota failure therefore leaves `spent.tts_regenerations` higher and no audio at all.

**Why:** the counter is a G1 budget. Losing a regeneration to a failed request takes away the one the narrator control was meant to use.

**How to apply:**
- Before a paid stage 1 in a ticket lesson, mention the credit need: roughly 0.44 × the narration characters, doubled when a narrator-control regeneration is possible.
- After a quota failure, offer Rafał a G1 top-up of `tts_regenerations` instead of silently going on with one fewer.

Related: [[elevenlabs-klucz-systemowy-wygrywa-z-env]], [[elevenlabs-klucz-bez-user-read]].
