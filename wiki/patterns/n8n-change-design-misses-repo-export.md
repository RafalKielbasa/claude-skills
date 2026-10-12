# n8n-change-design-misses-repo-export

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
A design for an n8n change lists the prod workflows and the files of the current repo, gets approved,
and is carried out; only afterwards does it turn out that the workflows also live as JSON exports with
tests in `devstock-team-agent`, which now disagree with prod. Syncing them needs a second approval.

## Przyczyna źródłowa
The inventory is built from the n8n MCP (prod) and a grep of the working repo ("Baza wiedzy"). The
exports (`devstock-team-agent/workflows/*.json`) and their tests (`tests/*.test.js`) sit in another
repository that neither source reveals; the only pointer is a "Scope" line in a spec
(`2026-10-08-weekly-team-report-design.md`: "and its export `workflows/29_weekly_project_report.json`
in `devstock-team-agent`"), which the inventory did not read.

## Dowody
- 2026-10-12, sesja 53ceea80-28c7-4d63-82fc-8e569ddd025e (id claude.ai niedostępny): the approved design
  for moving Slack posts of `29`, `30`, `31` and `38` to `#ai_summary` covered n8n-prod, `kb-client`,
  two specs and a skill. After publishing, a grep of `devstock-team-agent` found `C05FB7MJBF1` still in
  `workflows/29_weekly_project_report.json`, `workflows/38_meeting_publish.json` and two tests; the
  sync went to Rafał as a separate question ("tak") and was done after the prod change.

## Rozwiązanie
When a change touches an n8n workflow, the inventory step greps `devstock-team-agent/workflows/` and
`devstock-team-agent/tests/` (path from `CLAUDE.local.md`) for the workflow name and the changed ids, and
the design lists the export and test updates next to the prod change. The exports in that repo stay
uncommitted unless Rafał says otherwise (code repo, commit rule `ask`).
