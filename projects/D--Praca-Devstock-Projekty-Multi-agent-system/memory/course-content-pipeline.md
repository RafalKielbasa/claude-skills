---
name: course-content-pipeline
description: "Pipeline treści kursowych dla platformy code-busters-v2 — spec zacommitowany 2026-07-13 w repo Bazy wiedzy, czeka na review Rafała"
metadata: 
  node_type: memory
  type: project
  originSessionId: 31b5b72a-ff5a-4848-b108-3c071ced707f
---

Nowa inicjatywa (obok [[roadmap-h2-2026]]): cykl produkcji komercyjnych kursów
o AI/automatyzacji (3–6 kursów do końca 2026, PL potem EN). Spec:
`D:\Praca\Devstock\Baza wiedzy\docs\superpowers\specs\2026-07-13-pipeline-tresci-kursowych-design.md`
(commit 5ef8663, repo Bazy wiedzy).

Kluczowe decyzje: treści jako pliki w `kursy/` w repo Bazy wiedzy (jedyne źródło
prawdy); skille Claude Code per etap (`/kurs-nowy`, `/kurs-lekcja`, `/kurs-nagranie`,
`/kurs-video`, `/kurs-zadania`, `/kurs-publikuj`); bramki: Rafał zatwierdza treść
każdej lekcji (artykuł+scenariusz) PRZED renderingiem video; zadania (quizy/ćwiczenia)
dopiero po dopracowaniu treści; avatar HeyGen tylko w segmentach `ekran: avatar`
(koszty); video: tor A prezentacja-automat / tor B screencast Rafała + lektor TTS
(ElevenLabs, jeden głos); niezależny review AI (inny model) przed review Rafała;
publikacja GraphQL do Keystone CMS idempotentnie, staging przed prod, video na Vimeo.
Etapy: 1a treść → 1b video → 1c zadania+publikacja → 2 EN/n8n.

**Stan (2026-07-14):** etap 1a ZMERGOWANY do main w repo Bazy wiedzy (main = 407b655,
45/45 testów, gałąź feature usunięta; main ~20 commitów przed origin — niepushowane).
Dostarczone: tools/course-pipeline (validate + review-ai przez Gemini, klucz w .env
wg .env.example), kursy/_wspolne (styleguide + 4 szablony), skille
.claude/skills/kurs-nowy i kurs-lekcja. Ledger + lista DEFER na etap 1b:
.superpowers/sdd/progress.md. Pozostało z etapu 1a: Task 12 kroki 2–5 z Rafałem
(GEMINI_API_KEY w tools/course-pipeline/.env, pierwszy kurs przez /kurs-nowy
i /kurs-lekcja W SESJI W REPO BAZY WIEDZY, retrospektywa → poprawki styleguide/skilli).
Dalej: plan etapu 1b (video: TTS ElevenLabs, avatar HeyGen, montaż ffmpeg). Odrzucone: pipeline w n8n (słaby do iteracyjnego pisania).
Powiązane: [[user-rafal-profile]]
