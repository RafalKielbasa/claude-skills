---
name: code-busters-worktree-bez-env-generated
description: "A fresh git worktree of code-busters-v2 lacks the untracked apps/codebusters/.env and apps/codebusters/__generated__, so app tsc shows ~451 errors and next build cannot run there"
metadata:
  node_type: memory
  type: project
  originSessionId: 7f23d848-4179-4042-9697-36f88592a6fa
  modified: 2026-10-21T12:18:51.636Z
---

A new worktree of `code-busters-v2` (e.g. `code-busters-v2-ds-components`, 2026-10-21) gets `node_modules` from `pnpm install`, but not the untracked `apps/codebusters/.env` nor the generated GraphQL client `apps/codebusters/__generated__`. In the worktree `cd apps/codebusters && pnpm tsc --noEmit` reports ~451 errors (unresolved `@devstock/api-client`), while the main checkout has 0.

**Why:** a stream's verification in the worktree read those errors as a regression; the base checkout on the same commit proved they are environment-only.

**How to apply:** in a worktree, judge app `tsc` only by errors in files the branch touched (e.g. `grep "__tests__/components/ds"`), and run `pnpm --filter @devstock/codebusters build` and the full app `tsc` in the main checkout after the local merge. Also known baseline there: `pnpm --filter @devstock/ui typecheck` has 71 pre-existing errors in old stories; mobile `pnpm lint:check` has 25 pre-existing errors. Related: [[dt37-galaz-biblioteki]].
