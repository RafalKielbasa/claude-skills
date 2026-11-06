---
name: intern-hours-in-discord-status
description: "Rafał's rule for interns — hours reported in the daily Discord status replace the time-log comment on the ticket; missing ticket time logs are not a violation"
metadata:
  node_type: memory
  type: project
  originSessionId: 5c87bf80-40a1-4712-b700-bccd693aeb32
  modified: 2026-11-06T09:34:34.206Z
---

Rafał (2026-10-22): interns who give their hours in the daily Discord status ("Łączny poświęcony
czas") do not have to log time as a comment on the board card. The regulation
(`Baza wiedzy/knowledge-base/praktyki/zasady-wspolpracy-praktyki.md:79-81`) has said the same
since `2d19fece` (2026-10-22). Other conventions (branch naming, `(CP-n)` in commits, demo
video) still count as errors when broken.

Checked 2026-11-06: the daily status duty (`zasady-wspolpracy-praktyki.md:18-19`, sanction at
`:141-143`) lives only in `devstock-org/devstock-team`, where all four interns have
`permission: none`. Nothing in `kodozercy/edu_saas` states or links it, and neither does the
start-message draft for Tomasz. #edu-saas had zero posts from Tomasz up to 2026-11-05. Other
channels (Circle, DMs, other Discord channels) were not readable.

**Why:** the 2026-10-15 report (`ocena-praktykantow-2026-10.md` in the vault) and the first
draft of Norbert's analysis flagged "no time on tickets" as a breach; Rafał corrected it —
Norbert does log hours, on Discord.

**How to apply:** never list missing ticket time logs as a finding for interns; verify hours
from the Discord statuses (read #edu-saas with [[discord-read-tool]]). Before calling a missing
status a breach, check that the intern was actually told the rule; the repo docs do not say it.
The vault report from 15.10 still carries the outdated claim ("Nikt nie loguje czasu na issue")
— fix only with Rafał's consent. Related: [[intern-evaluation-2026-10]], [[cp-intro-tomasz-pr212]].
