---
name: stripe-payment-confirmation-pattern
description: "WDROŻONE: confirm-on-redirect + fulfil-on-webhook działa dla kursów (CP-31 #148) i subskrypcji (#149, spec 2026-08-20); async_payment_* obsłużone; reszta notatki to historia problemu"
metadata: 
  node_type: memory
  type: project
  originSessionId: cbf3d6d0-ffa3-443a-a798-d316b47ca2aa
  modified: 2026-08-21T10:21:15.652Z
---

Ustalone 2026-08-19 przy review PR-a CP-31. Powiązane: [[tenant-subscription-model-audit-2026-08]].

**Update 2026-08-21: wzorzec WDROŻONY w mainie.** Kursy: `POST /payments/checkout-sessions/:sessionId/confirm` (CP-31, #148). Subskrypcje: `POST /payments/subscription/checkout-sessions/:sessionId/confirm` + `TenantsService.activateSubscription` (#149, wg specu `2026-08-20-subscription-checkout-alignment-design.md`). Webhook obsługuje `checkout.session.async_payment_succeeded/failed`. Zmiana planu doraźnie zablokowana (409 przy `tenant.isActive`) — patrz `docs/subscription-plan-changes.md`. Poniższa treść to historia problemu.

**Stan obecny.** `/payments/success` po powrocie ze Stripe woła `GET /courses/:courseId/access` w pętli (5 prób × 2 s), bo enrollment tworzy dopiero webhook `checkout.session.completed`. Okno 10 s bywa za krótkie przy retry webhooków → użytkownik, którego właśnie obciążono, dostaje „Nie możemy potwierdzić dostępu".

**To NIE jest wpadka autora.** Polling zadany wprost w tickecie: `docs/superpowers/plans/2026-07-09-frontend-payments-jira-tasks.md:209-213` („ponów sprawdzenie kilka razy z odstępem") i w AC `:232`. Krytyka celuje w kontrakt CP-75, nie w wykonanie — poprawka wymaga zmiany ticketu, nie CR-a do PR-a.

**Dwie rzeczy, które to umożliwiają, a nie są używane:**

1. `success_url` już niesie `session_id={CHECKOUT_SESSION_ID}` (`apps/api/src/modules/payments/payments.service.ts:181`), a front czyta wyłącznie `courseId`.
2. Dokumentacja (`:103`) odsyła do `GET /payments/checkout/:sessionId` „dodanego w CP-28 (PR #111)" — **ten endpoint nie istnieje**. Zweryfikowane 2026-08-19: zero wystąpień `sessionId` w `apps/api/src`, `PaymentsController` ma tylko dwa `@Post`. Dokument wprowadza w błąd; ktokolwiek zaplanuje pracę w oparciu o niego, oprze się na czymś, czego nie ma.

**Proponowany wzorzec: confirm-on-redirect + fulfil-on-webhook, obie ścieżki idempotentne.**
Endpoint `POST /payments/checkout-sessions/:sessionId/confirm` → `stripe.checkout.sessions.retrieve`, potem `enrollments.enroll(...)`. Zwraca `paid` / `pending` / `failed` plus `courseId` z `metadata` (front przestaje być źródłem prawdy o tym, za co zapłacono). Webhook zostaje bez zmian jako ścieżka dla zamkniętej karty; kolizję łapie istniejące `P2002 → ConflictException` (`enrollments.service.ts:17-21`), na którym webhook już polega (`stripe-webhook.service.ts:141-147`).

Warunki, bez których to jest dziura, a nie poprawka:

- sprawdź `session.metadata.userId === userId` **i** `tenantId` — `session_id` jedzie w URL-u przeglądarki, bez tego dowolny posiadacz cudzego linku zapisze siebie;
- rzucaj `NotFoundException`, nie `ForbiddenException` (cudza sesja ma nie istnieć);
- odetnij `session.mode !== 'payment'`, inaczej ten sam endpoint zadziała na sesji subskrypcyjnej twórcy, gdzie nie ma `metadata.courseId`;
- `sessionId` NIE jest UUID-em (`cs_test_…`) — `ParseUUIDPipe` tu nie zadziała.

Wiring jest darmowy: `payments.module.ts:10` już importuje `EnrollmentsModule`, `enrollments.module.ts:20` już eksportuje `EnrollmentsService`.

**Niezależna dziura obok.** `handleEvent` (`stripe-webhook.service.ts:80-93`) nie obsługuje `checkout.session.async_payment_succeeded` ani `async_payment_failed`. Przy metodach z opóźnionym potwierdzeniem (przelew, część APM) enrollment nie powstanie **nigdy** — niezależnie od tego, czy zostanie polling, czy wejdzie `retrieve`. Stąd stan `pending` w propozycji.
