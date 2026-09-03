---
name: api-boot-env-requirements
description: "API boots only with MUX_TOKEN_ID/SECRET, GCS_BUCKET, STRIPE_SECRET_KEY set; Rafał's local .env has placeholders (2026-07-14)"
metadata: 
  node_type: memory
  type: project
  originSessionId: ba27da44-b6af-4d07-855f-ce4edb556fcb
  modified: 2026-07-22T09:06:57.045Z
---

The NestJS API (`apps/api`) fails at bootstrap unless these env keys exist: `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET` (video.module factory), `GCS_BUCKET` (StorageService constructor), `STRIPE_SECRET_KEY` (PaymentsService constructor), and `STRIPE_WEBHOOK_SECRET` (StripeWebhookService constructor, `stripe-webhook.service.ts:59-61` — throws `Error: Stripe webhook secret not found`). `JWT_SECRET` is also required but was already present.

2026-07-22: hit the `STRIPE_WEBHOOK_SECRET` boot crash (it was absent from `.env` entirely, unlike the other placeholders). Appended `STRIPE_WEBHOOK_SECRET=whsec_local_dev_placeholder` to `apps/api/.env` to unblock boot — the constructor only checks truthiness; real signature verification runs only when a Stripe webhook POST actually arrives.

**Why:** modules use `getOrThrow`/throw in constructors, so a single missing key kills the whole app even for unrelated endpoints. `.env.example` had drifted (no Mux/GCS/Stripe/PORT keys) — updated in working tree on 2026-07-14 along with `enableCors` + `dev` script fixes.

**How to apply:** On Rafał's machine `apps/api/.env` now has `local-dev-placeholder` values for Mux/GCS and `sk_test_placeholder` for Stripe — video/storage/payment endpoints will fail at request time until real credentials replace them. `PORT=3001` was also added (default was 3000, colliding with web). Request-time-only keys not in .env: `NEXT_PUBLIC_APP_DOMAIN` (read by video.service.ts — likely a misnamed key, `APP_DOMAIN` exists), `MUX_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`. Also note: stale pnpm installs (dangling symlinks after lockfile bumps) show up as `Cannot find type definition file for 'node'` — fix with `pnpm install` from root.
