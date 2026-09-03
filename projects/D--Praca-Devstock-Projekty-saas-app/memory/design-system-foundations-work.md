---
name: design-system-foundations-work
description: "Design system foundations for apps/web — tokens from Figma udu-saas-v1, shadcn/ui, Roboto, dark default"
metadata: 
  node_type: memory
  type: project
  originSessionId: 813a9f9b-8133-4f84-8644-a8e583ec4130
---

The `apps/web` design system foundations were built on branch `feat/design-system-foundations` (spec: `docs/superpowers/specs/2026-06-05-design-system-foundations-design.md`).

- **Source of truth:** Figma `udu-saas-v1` (fileKey `BwdwVKDnvYwjY835CdufJA`) — a dark SaaS dashboard. The file has NO formal Figma variables; tokens were extracted by inspecting designs.
- **Tokens:** semantic shadcn-aligned CSS vars in `apps/web/src/app/globals.css`, light (`:root`) + dark (`.dark`), mapped via Tailwind v4 `@theme inline`. Exact hex/rgba from Figma (not OKLCH). Dark is the DEFAULT (`<html class="dark">`). Core dark values: bg `#101218`, card `#15171f`, primary `#7c8cff`, border `rgba(255,255,255,0.07)`, fg `#e6e8ee`.
- **Font:** Roboto / Roboto Mono (the Figma font — NOT Geist).
- **Components:** shadcn/ui style in `src/components/ui` (Button, Input), `cn()` in `src/lib/utils.ts`, `components.json` present.
- **Known follow-ups (out of foundations scope):** `destructive` + light theme are derived/provisional (verify in Figma); `apps/web/src/app/page.tsx` is still the starter (hardcoded hex, `dark:bg-black`) and contradicts the DS; pre-existing `@types/jest@30` vs `jest@29` mismatch.

Docs: `apps/web/docs/design-system.md`. Plans dir `docs/superpowers/plans/` is gitignored. Related: [[subagents-shared-worktree-checkout]]
