# Kodożercy public landing redesign

## Context

The public landing (`apps/codebusters/src/app/[locale]/page.tsx` → `features/publicLanding`) was
built four weeks ago on the `ds` design system with the claim „Nauka, która wciąga jak gra”.
Rafał wants to reposition the platform as a way to stay current with technology
(„Twój partner w cyfrowym świecie”, „Bądź na bieżąco z technologią”), rebuild the whole page
around that message, and add a section holding a video that demonstrates platform mechanics.
The video does not exist yet.

## Decisions made in brainstorming

| Code | Decision | Choice |
|---|---|---|
| D1 | Reason for the change | New positioning: staying current with technology, wider audience |
| D2 | Hero visual | Two columns: claim, lead, CTAs on the left; live panel with newest feed posts and course updates on the right. No crew image. |
| D3 | Section order | Eight: Hero, Video, Who it is for, What's new, Courses, Community, Pricing, Closing CTA |
| D4 | Old claim | „Nauka, która wciąga jak gra” becomes the video section heading; new claim goes to hero, `meta.homeTitle`, OG image texts |
| D5 | Delivery | In place in `features/publicLanding`, one branch, one PR |
| D6 | Video frame | New `ds` component in `packages/ui/src/ds`, no mobile contract (same as `CourseCover`); Vimeo player stays in the app |
| – | Video | Slot now, film later; separate section right under the hero |
| – | Copy | 2–3 sets of copy offered in the spec for Rafał to choose |

## Design summary (to be expanded in the spec)

- **Hero** (`HeroSection.tsx`): two-column from `lg`, stacked below. Right column is a new
  "latest on the platform" panel (`Panel variant='highlight'`) fed by data already loaded in
  `page.tsx`: `loadFeedPosts` and released/planned items from `loadTimeline`. Needs an empty
  state when both are empty. CTAs unchanged: trial → `/pricing` with
  `trial_cta_clicked {placement:'hero'}`, free lesson → `/free-lesson`.
- **Video section**: heading „Nauka, która wciąga jak gra”. A single config value
  (`features/publicLanding/lib`, Vimeo id or `null`). `null` → the existing `LearningScene`
  animation plays inside the frame; set → poster + play button, Vimeo iframe loaded on click via
  `getVimeoEmbedUrl` (`src/utils/vimeo.ts`). E2E blocks `player.vimeo.com`
  (`e2e/gate/network.ts:172-177`), so tests assert the poster state only.
- **Video frame `ds` component**: pixel frame, scan-line surface, poster slot, play button with
  `PixelIcon name='play'`; every label is a prop. Story with `ThemeSheet`, test in
  `apps/codebusters/__tests__/components/ds/`.
- **`LearningPanel` / `FeedStrip`** are shared with the login/register aside: keep them working
  there; the hero stops using `layout='hero'` (remove that layout only if nothing else uses it).
- **What's new, Courses, Pricing**: reordered, new headings, existing data and components
  (`TimelineColumn`, `CatalogTile`, `SampleLessonCard`, `PlanCards`).
- **New sections**: Who it is for (three audience cards), Community (feed, ranking, chat
  described without live numbers — my call, no public source verified), Closing CTA (claim and
  the same two buttons, `placement:'closing'`).
- **Copy**: all strings in `pl.json` under `publicScreens.landing.*`; `meta.homeTitle`,
  `meta.homeDescription`, `meta.ogDefault*` updated. `en.json` untouched (`/en` redirects to `/pl`).
- **Repo rules to honour**: no arbitrary Tailwind bracket values in new or changed code (add
  steps to `packages/tailwind-config/tokens/` and cover them in `tailwindWorkspace.test.ts`),
  `dsCn` for class merging, no JSX in variables, English comments, `type` not `interface`,
  per-file `npx prettier --write`.

## Steps after approval

1. **Board**: bind the session with the `board-tracker` skill; propose a new issue on the main
   board (creation waits for Rafał's "tak"). #879 (DT-122) covers a different scope.
2. **Worktree**: create a worktree on `feat/rafal-kielbasa/<issue>-landing-redesign` from `main`
   (`superpowers:using-git-worktrees`); apply the known worktree lessons (own `.env`, codegen,
   ports; git only inside the worktree).
3. **Spec**: write
   `D:\Praca\Devstock\Baza wiedzy\docs\superpowers\specs\2026-11-17-kodozercy-platform-landing-redesign-design.md`
   (English) with the decisions above, the Approaches part, 2–3 copy sets per section, and
   wireframes; run the builder check; update `projects/kodozercy-platform.md` via the
   `project-index` skill in the same commit (that repo commits without asking, no push).
4. **Gate**: Rafał approves the spec and picks the copy set.
5. **Plan**: `superpowers:writing-plans` → plan file `…-landing-redesign-plan-1.md`, self-review,
   independent `codex exec --sandbox read-only` review, table of remarks, execution handoff.
6. **Implementation** in the worktree, TDD, one PR. No commits or push in `code-busters-v2`
   unless Rafał says so; a Conventional Commits message is proposed at the review gate.

## Critical files

- `apps/codebusters/src/app/[locale]/page.tsx` (loaders, metadata)
- `apps/codebusters/src/features/publicLanding/components/{PublicLanding,HeroSection,HeroCtas,LearningPanel,LearningScene,FeedStrip,CoursesSection,WhatsNewSection,PricingSection}.tsx`
- `apps/codebusters/src/features/publicScreens/` (shell, bar, footer, loaders, `PlanCards`)
- `apps/codebusters/src/messages/pl.json` (`publicScreens.landing.*`, `meta.*`)
- `packages/ui/src/ds/<video-frame>/`, `packages/ui/src/ds/index.ts`
- `apps/codebusters/__tests__/features/publicLanding/*`, `__tests__/pages/Home.test.tsx`,
  `e2e/smoke/visitor.spec.ts`, `e2e/homepage.spec.ts`

## Verification

- `pnpm --filter @devstock/codebusters test:run` (landing, `ds` component, `tailwindWorkspace`)
- `pnpm lint`; `npx prettier --check` on changed files
- `pnpm --filter @devstock/ui storybook` → new component story in dark and light
- Run the app from the worktree and check `/pl` as a guest at phone, tablet and desktop widths,
  with feed/timeline data and with empty data, with the video id `null` and set; reduced motion
- `pnpm --filter @devstock/codebusters test:e2e` for `homepage` and `smoke/visitor`
- Report the two known CMS env-dependent test failures if the CMS suite is run
