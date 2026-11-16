# DT-104: throwaway prototypes of three web navigation variants

## Context

DT-104 (devstock-org/devstock-team#857) rebuilds the web navigation of Kodożercy and hides
not-ready features from regular users. Rafał is considering a two-level navigation built around
four domains (Dashboard, Nauka, Społeczność, Grywalizacja). Decision D1 "how domains reveal their
subpages" is open, and he asked for clickable prototypes of each variant before deciding.
The goal is maximum legibility: users must not get lost.

This is a brainstorming spike. It is throwaway: no product code, no tests, nothing in the repo.

## What gets built

One self-contained HTML file (inline CSS and JS, no dependencies, no network) at

`C:\Users\rafal\AppData\Local\Temp\claude\31b8a7c849435c38\e6a4423a-70a9-45b4-81c7-4764a7140fbd\scratchpad\dt-104-nav-prototypes\index.html`

The page shows a mock app shell (top bar, navigation, content area with the current page title
and a breadcrumb "Domain / Page") and a control strip with three switches:

1. **Variant**
   - A: one sidebar, domains as always-visible group headings.
   - B: icon rail with 4 domains plus a permanent second panel listing the active domain's pages;
     switching by click. Clicking a domain opens its first page.
   - C: icon rail with 4 domains; the pages panel flies out on hover (and on keyboard focus),
     closes on mouse leave. Rafał's original idea.
2. **Role**
   - Regular user: only ready pages.
   - User with the modules capability: adds "Moduły".
   - Admin: all pages; not-ready ones carry a "niegotowe" marker.
3. **Viewport**: desktop (1440) and phone (390), where every variant collapses into the drawer
   opened from the top bar menu button, so the touch behaviour of each variant is visible.

Navigation data (one shared array, so all variants show identical content):

| Domain | Regular user | Capability | Admin only, marked not ready |
|---|---|---|---|
| Dashboard | Panel główny | | |
| Nauka | Kursy, Baza wiedzy | Moduły | Aktywności |
| Społeczność | Czat (unread counter) | | Quiz na żywo |
| Grywalizacja | Ranking, Marketplace | | Program lojalnościowy, Kolekcja kart, Narzędziownik |

Clicking a page sets the active state in the navigation and updates the content area, so
"where am I" can be judged in each variant.

## Look

Approximate the ds dark theme so the prototypes read like the real app. Colour, radius and font
values are copied (read-only) from `packages/tokens/dist/theme.css` and the pixel-frame look from
`packages/ui/src/ds/navigation/navigation.tsx`. Labels come from
`apps/codebusters/src/messages/pl.json` (`sidebar.*`). No real ds components are imported.

## Not in scope

- No change to `apps/`, `packages/` or any file in the repo or the worktree.
- No decision on D1; the prototypes exist to make it.
- No publishing to an external service; the file is opened locally.

## Verification

- Open the file in a browser; switch through 3 variants x 3 roles x 2 viewports.
- Check with keyboard only (Tab, Enter, Escape) that variant C's flyout is reachable.
- Report the absolute path to Rafał and wait for the D1 decision.

## After the prototypes

Return to the brainstorming flow: D1 decision, remaining questions (skill levels meaning, cards on
podium and share page, modules capability key, mobile scope, Discord), then the design doc
`docs/superpowers/specs/2026-11-16-kodozercy-platform-web-navigation-design.md` and the project
index update.
