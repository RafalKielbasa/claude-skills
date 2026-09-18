---
name: codebusters-publish-diagnoza-500
description: "Jak diagnozować BŁĄD 500 z publish na CodeBusters — klient dostaje okrojony komunikat, pełny ślad tylko w logach Fly."
metadata: 
  node_type: memory
  type: reference
  originSessionId: 6e0b20bd-df8c-4ac2-b15b-4daaa3471f0f
  modified: 2026-09-16T12:11:39.587Z
---

Gdy `npm run publish` (tools/course-pipeline) zwraca `BŁĄD 500: <cokolwiek>`, komunikat u klienta
jest bezużyteczny — endpoint odsyła samo `error.message`, a pełny stack z nazwą modelu i kodem
Prismy leci do `console.error` i widać go wyłącznie w logach deploya:

- staging: `fly logs -a codebusters-cms-main`
- prod: `fly logs -a codebusters-cms-production`

Szukaj linii `course-pipeline: lesson upsert failed`. Log czyta się od dołu — pierwszy błąd jest
prawdziwy, kolejne to kaskada po nieudanym zagnieżdżonym create (typowo `connect: { id: undefined }`,
a potem `KS_ACCESS_DENIED` z `connectToLesson`).

Baza CMS-a to **MySQL**, więc każde gołe `String` w `apps/cms/schema.prisma` to `varchar(191)` —
tam mieszkają niespodzianki typu P2000. Pola z zapasem mają jawne `@mysql.VarChar(…)` albo `LongText`.

Rafał sam wkleja wynik `fly logs` — nie mam dostępu do Fly.

Powiązane: [[tryb-commitow-per-repo]]
