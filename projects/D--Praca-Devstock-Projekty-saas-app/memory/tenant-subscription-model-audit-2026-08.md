---
name: tenant-subscription-model-audit-2026-08
description: "Audyt modelu tenant→subskrypcja (2026-08-13): NIE ma modelu Subscription ani zapisu transakcji; zmiana planu niemożliwa; gating treści przy wygaśnięciu działa (fail-closed), ale predykat w 4 kopiach"
metadata:
  node_type: memory
  type: project
  originSessionId: 2eddfd6a-8a2f-4fe9-bf5b-3ac1cf4b28a2
  modified: 2026-08-13T16:29:54.207Z
---

**Update 2026-08-21: spec naprawczy NAPISANY** — zob.
[[subscription-model-spec]]; czeka na review Rafała. Notatka poniżej =
stan zastany, nadal aktualny w kodzie.

Audyt 2026-08-13 (subagent Explore, kluczowe fakty zweryfikowane w kodzie). Część audytu [[web-security-audit-concept-frozen]].

**Nie ma modelu Subscription.** Cały stan subskrypcji to 5 kolumn na `Tenant` (schema.prisma:58-77): `plan`, `stripeCustomerId` (@unique), `stripeSubscriptionId` (BEZ @unique), `isActive`, `paymentFailedAt`, `activatedAt`. Brak modeli Payment/Transaction/Invoice/StripeEvent — w schemacie i we wszystkich 19 migracjach. Brak enuma statusu; status wyliczany z krotki przez `resolveTenantAccess` (tenants/grace-period.ts:3-21, grace 3 dni na sztywno).

**Zapis transakcji: NIE MA (największa luka).** Nie zapisujemy event.id, sesji checkout, faktur, kwot, walut, refundów, timestampu anulowania. `handleEvent` (stripe-webhook.service.ts:67-99) weryfikuje podpis, switch po event.type, NIGDY nie dotyka event.id → zero idempotencji. Skutki (Stripe nie gwarantuje kolejności): powtórzone invoice.paid wskrzesza zadłużonego + psuje activatedAt; spóźnione payment_failed → 503 dla płacącego; handlery szukają tenanta po customerze, nie porównują subscription.id z tenant.stripeSubscriptionId → stary deleted ubija bieżącą subskrypcję. Pieniądze pobrane bez śladu jeśli kurs zniknął między checkoutem a webhookiem. Rekonsyliacja niewykonalna po stronie DB.

**Zmiana planu: niemożliwa.** `POST /payments/subscription` rzuca 409 dla aktywnego (payments.service.ts:64-66) — jedyna ścieżka. Brak `stripe.subscriptions.update`, proracji, handlera `customer.subscription.updated`. Plan czytany z metadata zamrożonych przy checkoucie → zmiana w dashboardzie Stripe cofana przy każdym invoice.paid. Enum TenantPlan (basic/pro/business) write-only — nic nie gate'uje po plan. Brak schedulera (@Cron) i currentPeriodEnd → jak padnie delivery webhooków, anulowany tenant zostaje isActive na zawsze.

**Gating treści przy wygaśnięciu: DZIAŁA (fail-closed).** TenantContextMiddleware na '*' (tenants.module.ts:17) → 503 całej subdomeny gdy resolveTenantAccess != 'ok'. Ale predykat „opłacony" w 4 kopiach, 2 się nie zgadzają z kanoniczną: tenants.service.ts:145 (samo isActive) i payments.service.ts:136 (samo isActive) vs grace-period.ts + landing.service.ts:54-59. Bug: subscription.deleted po payment_failed → isActive:false ale grace-branch zwraca 'ok' → anulowanie działa dopiero po 3 dniach (grace-period.ts:15-20).

**Braki modelu:** brak historii (resub nadpisuje w miejscu), brak seatów/triali/refundów (zrefundowany student ma dostęp na zawsze — brak charge.refunded), brak kwot (Course.price bez waluty, 'pln' na sztywno). Operacyjnie: return-URL-e Stripe 404 na FE (brak /creator/subscription, /payments/success|cancel), .env.example nie zbootuje API (brak STRIPE_PRICE_ID_BASIC/PRO/BUSINESS, STRIPE_WEBHOOK_SECRET). Rekomendacja: osobny Subscription (1:N, enum, currentPeriodEnd, historia) + StripeEvent (idempotencja) + tabela płatności.
