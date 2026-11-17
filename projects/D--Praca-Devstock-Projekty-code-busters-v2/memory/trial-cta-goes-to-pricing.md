---
name: trial-cta-goes-to-pricing
description: "Product decision — the \"Wypróbuj/Zacznij N dni za 0 zł\" CTA in the hero and public bar leads to /pricing; the OfferPanel CTA (which has its own \"Porównaj plany\" link) goes straight to the monthly checkout"
metadata:
  node_type: memory
  type: project
  originSessionId: 499e4954-0059-40fc-9c03-81804572b93a
  modified: 2026-11-17T08:15:24.153Z
---

Where the trial CTA „Zacznij N dni za 0 zł” leads on the public screens (Rafał, 2026-11-17, while reviewing DT-122 / #879, "fewer clicks"):

- Hero (`HeroCtas.tsx`) and public bar (`PublicBar.tsx`): `/pricing`. They have no plan context, so the visitor sees the plans first: „user powinien widzieć możliwości przed dokonaniem wyboru”.
- OfferPanel (`OfferPanel.tsx`, used on catalog, timeline, free-lesson end and course view): `/checkout/<monthly plan id>` (login step for guests). Its „Porównaj plany” link is the way to /pricing: „Do tego służy porównaj plany”.
- Plan cards (`PlanCards.tsx`, `/pricing` tier cards) were always `/checkout/<planId>`.

**Why:** a CTA that already shows a concrete plan and price should buy it in one click; a CTA without plan context should show the options first.

**How to apply:** do not shorten the hero/bar CTA to checkout in click-reduction or funnel work; a new panel that shows a specific plan plus a compare link follows the OfferPanel rule. Logged-in subscribers never see these CTAs (`buildOffer` returns null on access), otherwise `/checkout/<id>` answers 409 `alreadySubscribed`.
