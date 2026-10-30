# licznik-regeneracji-wydany-przed-nieudanym-zadaniem-tts

- **Skill:** kurs-video
- **Typ:** porażka
- **Status:** otwarty

## Opis
In a lesson with a ticket, stage 1 spent `tts_regenerations`, deleted the old audio chunks, and stopped on the first
ElevenLabs request with `quota_exceeded`. The counter went down by one with no narration produced. That took away the
regeneration the G1 card had reserved for the narrator control.

## Przyczyna źródłowa
`przedRegeneracja` in `tools/course-pipeline/src/video.js` spends the counter (when `video/lektor/spis.md` exists)
before `wygenerujLancuch`. It runs before the chunk files are deleted and before the first paid request, whether or
not the request succeeds. The skill also does not ask for the credit need before a paid stage 1, and the API key has
no `user_read`, so the balance cannot be read.

## Dowody
- 2026-10-30, sesja 8c81b3d1-cb64-4c72-97ce-98d2b72ade56 (id claude.ai niedostępny), lesson agenty-ai 3.1.
  - The run printed: "This request exceeds your quota of 374851. You have 502 credits remaining, while 716 credits
    are required".
  - `spent.tts_regenerations` went 0 → 1 (commit `8416e9c1`).
  - Rafał topped up the credits and raised the budget 2 → 3 on a G1 card ("A, podnieś licznik do 3"). That cost a
    card and a turn.

## Rozwiązanie
- In the tool: spend `tts_regenerations` after the chain succeeds, or give it back when the chain fails before the
  first saved chunk.
- In `/kurs-video` step 3, a ticket lesson: before a paid stage 1, say the credit need in one line (about 0.44 credit
  per narration character on V4, double that when the narrator control may regenerate).
- After `quota_exceeded`, offer a G1 card with a counter top-up and do not repeat the render.
