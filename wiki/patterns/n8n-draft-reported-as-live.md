# n8n-draft-reported-as-live

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
A session changes n8n workflows through the MCP, does not publish them, and still describes the change
as live in a commit, a spec amendment or a report. Production keeps running the previous version while
the repo says the new behaviour is in force.

## Przyczyna źródłowa
`update_workflow` writes only the draft (`versionId`); the running version (`activeVersionId`) changes
only with a separate `publish_workflow`, which needs Rafał's consent. `get_workflow_details` returns the
draft as the top-level `nodes` and the live version under `activeVersion`, so reading `nodes` after an
edit shows the new state as if it were deployed. A session that stops at the consent gate, or forgets
the publish step, leaves a draft that every later reading of `nodes` mistakes for production.

## Dowody
- 2026-10-12, sesja 53ceea80-28c7-4d63-82fc-8e569ddd025e (id claude.ai niedostępny): a morning session
  saved drafts of `30_daily_pipeline` (`372a841b`), `31_daily_trends_digest` (`a32a5f9a`) and
  `38_meeting_publish` (`a8fea2eb`) moving Slack posts to `#ai_summary` and committed `8af0ac45`
  "38_meeting_publish now routes type daily to #ai_summary"; none of the drafts was published, so the
  live versions still posted to `#core-team`. Found by comparing `versionId` with `activeVersionId` and
  the Slack nodes of `nodes` with `activeVersion.nodes`, with read-only subagents returning a table
  per workflow, draft against active.

## Rozwiązanie
After any n8n change, read the workflow again and report from `activeVersion` and `activeVersionId`,
never from the top-level `nodes`. Describe a change as live (commit message, spec, report, journal)
only when `activeVersionId == versionId` and the active nodes carry it. When publication waits for
Rafał's consent, say "draft, not published" with the draft `versionId` in the commit and the report.
Before building on an earlier session's n8n work, compare draft and active first.
