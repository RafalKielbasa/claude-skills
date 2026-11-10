---
name: locale-loading-streams-status
description: "In apps/codebusters every page under [locale] streams because of [locale]/loading.tsx, so server redirect()/notFound() answer HTTP 200 (meta refresh / noindex), not 307/404"
metadata:
  node_type: memory
  type: project
  originSessionId: 73e150b5-4819-4e1d-82bc-df3ffdf3c8c3
  modified: 2026-11-10T19:18:11.770Z
---

`apps/codebusters/src/app/[locale]/loading.tsx` wraps every page under `[locale]` in Suspense, so pages stream. A `redirect()` or `notFound()` thrown in a page component then cannot change the status: `next start` answers **200**, with `<meta http-equiv="refresh" content="1;url=…">` plus `NEXT_REDIRECT;replace;…;307` in the RSC payload (the client router follows it at once) for redirect, and `<meta name="robots" content="noindex">` for notFound. Checked with `curl` on `next start` 2026-11-10 (DT-83, `/free-lesson`); unit tests that mock `redirect`/`notFound` cannot catch it. Also `/pl/…` gets a real 307 to the unprefixed path from next-intl.

**Why:** the DT-83 spec promised 307/404 for `/free-lesson`; Rafał accepted 200 (decision „Kody HTTP adresu darmowej lekcji (DT-83)”) and the spec was amended.

**How to apply:** when a spec or plan for a web page under `[locale]` promises a real HTTP 3xx/404, flag it at plan time: either accept the streamed behaviour or plan a route handler / middleware. Related: [[w2-gate-harness-lessons]].
