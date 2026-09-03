---
name: fe-tenant-routing-decisions
description: "Routing FE tenantów — decyzje zapisane w specu content-without-enrollment (sekcja „Frontend — szkielet routingu\")"
metadata: 
  node_type: memory
  type: project
  originSessionId: 35c1bea2-1db0-4219-ab82-2ef4d0d6d8bc
  modified: 2026-08-10T14:01:21.257Z
---

Decyzje o routingu FE z 2026-08-10 są zapisane w
`docs/superpowers/specs/2026-08-10-content-without-enrollment-design.md`,
sekcja „Frontend — szkielet routingu (apps/web)" — tam jest źródło prawdy
(drzewo `app/tenant/[subdomain]`, rewrite w proxy, blokada `/tenant/*`,
guardy, definicja ukończenia).

Kontekst nie zapisany w repo:

- Nazwę segmentu `tenant` wybrał Rafał (odrzucone: `t`, `s`, `school`,
  `site`) — spójność z językiem backendu.
- 2026-08-10 Rafał usunął z projektu nagłówek `x-tenant-id`; jedynym
  nagłówkiem tenantowym jest `x-tenant-subdomain`. Historyczny spec BFF
  (2026-08-07) nadal wspomina `x-tenant-id` — celowo niezaktualizowany
  (zapis historyczny).
- Zakres specu content-without-enrollment rozszerzony z „tylko API" na
  „API + szkielet FE" (struktura katalogów, guard UI, placeholdery stron
  wołające prawdziwe endpointy).

Powiązane: [[cp26-free-content-deprioritized]], [[auth-multitenancy-audit-2026-08]].
