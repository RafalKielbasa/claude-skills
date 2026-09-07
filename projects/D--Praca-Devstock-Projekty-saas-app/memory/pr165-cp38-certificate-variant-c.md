---
name: pr165-cp38-certificate-variant-c
description: "PR #165 (CP-38 progress/certyfikaty) — 2026-09-07 ostatnia blokująca uwaga (certificateUrl) naprawiona wariantem C (PDF przez autoryzowany endpoint API, klucz obiektu w DB), commit de54059, zweryfikowane na żywo; PR czeka na re-review"
metadata: 
  node_type: memory
  type: project
  originSessionId: 55b252e5-61fa-4244-9e9a-407f59747a72
  modified: 2026-09-07T09:30:37.909Z
---

PR #165 (Miłosz, CP-38: lesson completion, progress, certyfikat) — stan 2026-09-07: wszystkie 6 blokujących uwag z review Rafała (2026-09-04) naniesione. Pięć naniósł Miłosz 2026-09-04 (BullMQ worker, `addPoints` nierzucający, jedno zapytanie w `requireEnrollment`, `select` w procesorze, quizzes bez regresji); ostatnią — `certificateUrl` niedostępny dla studenta — zaimplementowałem sam wariantem C, Rafał zacommitował jako `de54059` na gałęzi PR-a i wypchnął.

**Why:** ADC nie umie `signBlob`, więc signed URL wymagałby klucza SA albo `roles/iam.serviceAccountTokenCreator` — sprzeczne z decyzją „zero SA" z 2026-08-14 ([[gcs-adc-bucket-setup]]); publiczny managed folder na `certificates/` ujawniałby PII (imię, e-mail w PDF). Wariant C: `GET /courses/:id/certificate/download` czyta obiekt poświadczeniami API po `requireEnrollment` i oddaje `application/pdf` jako attachment; `Enrollment.certificatePath` (kolumna `certificate_path`, migracja `20260904150002_add_enrollment_certificate_path` — przemianowana z `…_certificate_url`); `certificateUrl` w odpowiedziach API to ścieżka względna na API, nie link do bucketa.

**How to apply:** przy re-review PR #165 — na GitHubie 19 wątków review nie jest resolved mimo pokrycia w kodzie (autorzy nie klikają resolve; stan poprawek czytać diffem od SHA review). W opisie PR należy się: `prisma migrate reset` dla tych z zaaplikowaną `…_certificate_url`, oraz `pnpm exec puppeteer browsers install chrome` — worker wymaga Chrome przypiętego przez puppeteera z repo (2026-09-07: 148.0.7778.97; lokalny cache miał 115/116/121/149 i worker padał). Test na żywo zostawił dane dev: 3 wiersze `progress` + `certificate_path` dla `student@kuznia.local` × „Praktyczny Git" w `course_platform`, obiekt `gs://edu-saas-dev/certificates/b1000000-0000-4000-8000-000000000002/0ca00c9f-5d37-45f1-97c8-5c814379650a.pdf`. Otwarte pytanie z review (darmowe lekcje bez enrollmentu nie dają się ukończyć) zamknięte jako decyzja w README, nie zmiana kodu.
