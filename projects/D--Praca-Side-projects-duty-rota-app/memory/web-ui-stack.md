---
name: web-ui-stack
description: "Frontend web/ uses Tailwind v3 + hand-rolled UI primitives, NOT shadcn CLI"
metadata: 
  node_type: memory
  type: project
  originSessionId: 47abb027-2d0c-4f55-be55-045ed1b8b79f
---

Frontend `web/` (Vite + React 19 + TS 6 + Vitest 4) celowo używa **Tailwind v3**
z ręcznie napisanymi prymitywami UI w `web/src/components/ui/`
(Button, Input, Label, Dialog, sonner) zamiast komponentów z shadcn CLI.

**Why:** Plan zakładał shadcn na Tailwind v3 (Radix), ale `shadcn@4.x` instaluje
wariant pod Tailwind v4 + Base UI (`@import "shadcn/tailwind.css"`, `tw-animate-css`,
OKLCH, `@apply border-border`), który nie kompiluje się pod Tailwind v3. Użytkownik
wybrał trzymanie Tailwind v3 + własne mini-komponenty (deterministyczne w jsdom).

**How to apply:** NIE uruchamiaj `npx shadcn add ...` (brak `components.json`,
produkuje niezgodny kod). Dodawaj/edytuj komponenty ręcznie w `components/ui/`.
Testy: Vitest + RTL + MSW; globalny serwer MSW w `src/test/setup.ts`
(`onUnhandledRequest: "error"`) — wszystkie testy importują `{ server }` stamtąd.
