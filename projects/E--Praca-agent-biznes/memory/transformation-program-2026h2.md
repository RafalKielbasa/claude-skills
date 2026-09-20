---
name: transformation-program-2026h2
description: "Rafał's 26-week transformation program (2026-09-28 → 2027-03-28): flagship agentic service on GCP as the career proof, idea-engine used one step per cycle as the business track, six fundamentals axes; spec and cadence, and the rules every session must respect"
metadata:
  type: project
  originSessionId: 6240c354-4541-46c4-b208-2f1c4d09a4b6
  modified: 2026-09-20T06:15:02.391Z
---

On 2026-09-18/19 Rafał asked to be prepared for the AI shift on two fronts: (a) competences that keep him employable, (b) a business of his own built on AI agents and data. After eight clarifying questions and a section-by-section design he approved a program. Its spec is the source of truth:
`E:\Praca\agent-biznes\docs\superpowers\specs\2026-09-19-transformation-program-design.md` (English). The execution plan is `docs\superpowers\plans\2026-09-19-transformation-program.md` (41 tasks, codex review applied 2026-09-19). Execution mode chosen 2026-09-20: **session mode**, one task per session, Rafał types the domain logic, subagents only for scaffolding tasks and only when reached. First session: Task 1 (learning-file reset) on 2026-10-03.

Key decisions (D1–D12 in the spec):
- Goal of track A: employable anywhere as an engineer of agentic systems; the business stays the long-term goal, so every track-A element must also bring the business closer.
- Budget 5–10 h/week, plan sized at 8 h; start 2026-10-03 (Rafał is on vacation without a laptop before that; week 0 = 2026-10-03/04, week 1 from 2026-10-05), four 6-week cycles with checkpoints on 2026-11-15, 2026-12-27 (may be held 2027-01-03), 2027-02-07, 2027-03-21; buffer to 2027-04-04.
- Learning file reset (D15, 2026-09-19): the whole `nauka-z-claude.md` is archived to `archiwum/nauka-z-claude-2026-09-19.md` and a new file starts with only the six-axis registry; no old topics or review items carried over; every new review item must trace to an axis, a flagship topic or a lab wired into the flagship.
- Track A flagship: a new public NestJS/TypeScript service on Google Cloud (Cloud Run, Cloud SQL + pgvector, Cloud Tasks, Secret Manager, Cloud Trace, Terraform, GitHub Actions with Workload Identity Federation, Claude API tool use with a hand-written agent loop, Gemini embeddings) = "seed of the future company's operating system": ingestion → knowledge search → agent with tools → approval gate → evals and tracing → meeting/e-mail loop. Rafał writes the domain logic himself; Claude pairs and reviews; subagents only for scaffolding.
- Certification: Associate Cloud Engineer in weeks 16–18 (Jan 2027); the current Google Skills course cycle is stopped; labs only when wired into the flagship within 7 days.
- Track B: idea-engine gets NO new features this half-year; one engine step per cycle (config + screen → vision ×2 → validate + interviews → ingest + synthesize + decide); capital ceiling 300 000 PLN; decision on the business by 2027-06-30 at the latest, launch 2028.
- Foundation: the six axes of `## Koncepty do poznania` via `/nauka-z-claude wyjaśnij`, in the order Node model → TCP → OS resources → distributed guarantees → cryptography → HTTP actor; no review triage any more (superseded by the clean-slate reset above).
- Target role (D13, 2026-09-19): primary = backend / AI engineer in a product team (TypeScript/Node) owning agentic features in production, mid level with production proof; secondary = forward-deployed / solutions engineer at an AI vendor or integrator (opens after spoken English); niche door = AI engineer in foodservice technology (six years of kitchen experience). Not the target: n8n automation specialist, ML engineer, platform engineer.
- fit-fast-food: verdict only after a `vision` pass in cycle 2 (pivot to a hub-less micro-format is credible given his kitchen background; no-go possible on the demand side). Interviews only with operators of a similar concept or post-mortems, never generic owners.
- Out of scope: the father's ambulance-rota app, English for recruiting (spoken English is weak; Polish market first), real recruiting activity.

**Why:** without this note a new session sees only the idea-engine repo and does not know that a 26-week program with fixed rules governs what to propose (no engine features, no subagent-written flagship code, Opus agents only after an explicit yes).

**How to apply:** before proposing work in this repo, read the spec and the Polish program board `D:\Notatki\notatki\nauka\program-transformacji.md` (created in week 0, 2026-09-21..27); measure proposals against the cycle's minimum; keep Rafał's rule that a question with no answer is not consent. Related: [[ai-native-business-plan]], [[rafal-profile-2026]], [[specs-self-contained]].
