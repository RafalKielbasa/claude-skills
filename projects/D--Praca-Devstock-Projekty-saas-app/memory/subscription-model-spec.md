---
name: subscription-model-spec
description: "2026-08-21 spec modelu Subscription + StripeEvent + Payment (portal Stripe, dostęp do końca okresu, idempotencja od etapu 1); 2026-08-22 rozpisany na 3 plany wykonawcze po review codexa, zero implementacji, czeka na tryb egzekucji"
metadata:
  type: project
---

Spec `docs/superpowers/specs/2026-08-21-subscription-model-design.md`
(2026-08-21, 403 linie). **Status: spec napisany, 2026-08-22
rozpisany na 3 plany wykonawcze (po jednym na etap), zero implementacji.** Na gałęzi
`rk/user-tenant-membership-design`, wspólny wysiłek z [[user-tenant-membership-decisions]].

Decyzje (nie relitygować): osobny spec na tej samej gałęzi; zakres =
subskrypcje platformy + wspólny fundament (StripeEvent idempotencja po
event.id od ETAPU 1, Payment dla obu strumieni bez FK do user/course);
zmiana planu przez **Stripe Customer Portal** (własne UI odrzucone);
dostęp **do końca opłaconego okresu** (cancel_at_period_end), grace 3 dni
tylko dla failed renewals; fallback na zgubione webhooki = predykat
sprawdza `currentPeriodEnd + 1 dzień`, BEZ schedulera; Subscription 1:N
z historią, status = enum statusów Stripe wprost; partial unique index
„jedna otwarta subskrypcja na tenanta" (ten sam eksperyment driftu co w
membershipie). Poza zakresem: trials, limity planów, refundy (oba
strumienie), seaty.

3 etapy: (1) modele+backfill+dual write+idempotencja (jedyna zmiana
zachowania, jawna), (2) portal-sessions (w wyjątku 503, ranga owner) +
subscription.updated + handlery po stripeSubscriptionId + predykat na
Subscription (CP-87 WCHŁONIĘTY), (3) drop 5 kolumn Tenant (stripeCustomerId
zostaje), landing przechodzi na Subscription. currentPeriodEnd nullable po
backfillu — skrypt rekonsyliacji ze Stripe = zadanie planu etapu 1.

2026-08-21 po południu: audyt styku z modelem darmowych treści
(content-without-enrollment): ZERO zmian potrzebnych w obu specach;
jedyny brak — aktualizacja `docs/landing-visibility.md` przy zmianie
filtra landingu — dopisany do etapu 3 tego specu.

Rozwiązuje audyt [[tenant-subscription-model-audit-2026-08]]. Lustrzane
noty w specu membershipu (wyjątek 503 + wspólny middleware).

2026-08-22: trzy plany w `docs/superpowers/plans/` (katalog gitignorowany):
`2026-08-21-subscription-model-stage-1.md` (11 zadań), `-stage-2.md`
(12 zadań), `-stage-3.md` (7 zadań). Self-review + osobne review codexa na
każdy etap; wcielone wszystkie uwagi poza jedną błędną (rzekomy brak
obsługi `\|` w `grep -v` — GNU grep obsługuje).

Cztery rozstrzygnięcia planu **spoza specu**, ważne przy egzekucji:
(1) `/tenants/me` dostaje pole `subscription` + `canStartCheckout` już
w etapie 2, żeby front ruszał raz, nie dwa razy; (2) `mark*` w
`SubscriptionsService` zwracają **wiersz, nie boolean** — dzięki temu
`PaymentRecorderService` niczego nie czyta i granica „etap 1 zero odczytów"
jest szczelna; (3) warunek 409 i wybór „portal czy checkout" liczy wspólna
funkcja `blocksNewCheckout` (samo istnienie otwartego wiersza blokowałoby
checkout organizacji wygasłej przez zgubione webhooki); (4) dwa świadome
odstępstwa od specu w nagłówku etapu 1 — kasowanie znacznika `StripeEvent`
przy błędzie handlera i bramkowanie `Payment(course_purchase)` po
`session.payment_status`.

Next: wybór trybu egzekucji + kolejność względem planów membershipu
(stykają się na `TenantContextMiddleware` i `@Roles(owner)`). Przed etapem 2
konfiguracja Customer Portal w dashboardzie Stripe — kroki w zadaniu 10.
