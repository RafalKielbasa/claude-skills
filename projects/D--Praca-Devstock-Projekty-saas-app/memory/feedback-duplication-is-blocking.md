---
name: feedback-duplication-is-blocking
description: Zdublowana logika (drugi helper/hook/komponent robiący to samo) to w review zawsze uwaga BLOKUJĄCA; oczekiwany reuse istniejącego kodu
metadata:
  node_type: memory
  type: feedback
  originSessionId: ea153307-0bd7-48c2-86f5-a276b5d1a749
  modified: 2026-10-06T12:18:35.473Z
---

2026-10-06: Rafał chce, żeby redundancja kodu była zawsze uwagą **blokującą**, a nie
sugestią. Druga implementacja tej samej rzeczy blokuje merge także wtedy, gdy różni się
kształtem wejścia albo zachowaniem na brzegach: istniejącą trzeba rozszerzyć albo
sparametryzować, a nie kopiować. Reguła siedzi w `.claude/review/config.md`, w osi
`code-quality`, jako punkt `**blocking:**`.

**Why:** nie chce, żeby projekt rósł o kod robiący to samo. Przypadek wyzwalający: PR #198
(CP-100), `getInitials` w `hero-info.tsx:31` to trzecia kopia, obok `user-menu.tsx:30`
i `leaderboard-utils.ts:18`. Autor odbił uwagę ostrach1 argumentem „different input data”,
a `leaderboard-utils.getInitials` ma ten sam podpis `string | null`.

**How to apply:** w każdym review (code-review-master, `send`, review ręczne) duplikat
oznaczam jako Blocking i w uwadze podaję `plik:linia` istniejącej implementacji. Kiedy sam
piszę kod, przed nowym helperem przeszukuję repo (`git grep`). Argument „trochę inne
zachowanie” nie zdejmuje blokady. Powiązane: [[code-review-master-config-2026-09-07]].
