# Hub core — code glossary

**Project / part:** hub / hub-core
**Index:** [hub.md](../projects/hub.md)

Every code used in the hub-core files, with a name of a few words and the place that defines it.
File names are given without the `.claude/` prefix. Some codes mean different things in different
reports (`M1` of the Plan 3 final review is not `M1` of the Plan 4 final review; `I-3` is not
`I3`); such rows give each meaning.

| Code | Name | Defined in |
|---|---|---|
| Decision 1 | What the orchestrator is: a Claude Code session as the hub | `specs/2026-10-13-hub-core-design.md` §3 |
| Decision 2 | Where project sessions come from: adopted, and launched with `claude --bg` | `specs/2026-10-13-hub-core-design.md` §3 |
| Decision 3 | Only approved prompts are sent; gates are answered in the session | `specs/2026-10-13-hub-core-design.md` §3 |
| Decision 4 | State from a registry written by global hooks, plus the gate marker | `specs/2026-10-13-hub-core-design.md` §3 |
| Decision 5 | The analytical dialog runs in a fork of the project session | `specs/2026-10-13-hub-core-design.md` §3 |
| Decision 6 | Visibility in v1: text in the hub, "what it is doing" collected from day one | `specs/2026-10-13-hub-core-design.md` §3 |
| Decision 7 | Dialog artefacts: `decisions.md`, `open-questions.md`, `prompt.md`, send journal | `specs/2026-10-13-hub-core-design.md` §3 |
| Decision 8 | Isolation: project sessions do not message each other; the hub is the only channel | `specs/2026-10-13-hub-core-design.md` §3 |
| Decision 9 | How the hub runs: a permanent session in `~/.claude/hub/` | `specs/2026-10-13-hub-core-design.md` §3 |
| Decision 10 | The hub stays a Claude session, not an app with a panel | `specs/2026-10-13-hub-core-design.md` §3 |
| Decision 11 | What to borrow from Firehose | `specs/2026-10-13-hub-core-design.md` §3 |
| Decision 12 | Codex consultation as a thread per element | `specs/2026-10-13-hub-core-design.md` §3 |
| Decision 13 | Codex–Claude execution contract removed | `specs/2026-10-13-hub-core-design.md` §3 |
| Decision 14 | How many implementation plans: each written after its probes | `specs/2026-10-13-hub-core-design.md` §3 |
| Decision 15 | Probe decisions adopted (the D-series below) | `specs/2026-10-13-hub-core-design.md` §3 |
| Decision 16 | Plan 3 additions adopted (P1–P9 below) | `specs/2026-10-13-hub-core-design.md` §3 |
| Decision 17 | Plan 3 acceptance amendments adopted as a fourth plan (P10–P15 below) | `specs/2026-10-13-hub-core-design.md` §3 |
| S1 | Probe: hooks in a VS Code panel session and the payload fields | `specs/2026-10-13-hub-core-design.md` §9.2; results in `specs/2026-10-13-hub-core-probes.md` |
| S2 | Probe: cost of the `PostToolUse` hook | `specs/2026-10-13-hub-core-design.md` §9.2 |
| S3 | Probe: `fs.watch` reliability and `claude agents --json` poll time | `specs/2026-10-13-hub-core-design.md` §9.2 |
| S4 | Probe: `SendMessage` delivery, hold and refuse | `specs/2026-10-13-hub-core-design.md` §9.2 |
| S5 | Probe: a `Monitor` expiry wakes an idle hub | `specs/2026-10-13-hub-core-design.md` §9.2 |
| S6 | Probe: fork launch with `--bg --resume --fork-session` | `specs/2026-10-13-hub-core-design.md` §9.2 |
| S7 | Probe: fork write boundary, repository read-only and dialog directory writable | `specs/2026-10-13-hub-core-design.md` §9.2 |
| S8 | Probe: the hub role survives `/clear` | `specs/2026-10-13-hub-core-design.md` §9.2 |
| S9 | Probe: a Codex follow-up stays read-only in its directory | `specs/2026-10-13-hub-core-design.md` §9.2 |
| S10 | Probe: `claude --bg -w` worktree combination | `specs/2026-10-13-hub-core-design.md` §9.2 |
| S11 | Probe: gate marker smoke test | `specs/2026-10-13-hub-core-design.md` §9.2 |
| S12 | Probe: a fork writes into a dialog directory under `~/.claude/hub/` | `specs/2026-10-13-hub-core-design.md` §9.2 |
| D1 | One last-message file per `Stop` event | `specs/2026-10-13-hub-core-design.md` §13.2 |
| D2 | Permission wait cleared by `prompt_id` | `specs/2026-10-13-hub-core-design.md` §13.2 |
| D3 | Tool success is not delivery; state `held` | `specs/2026-10-13-hub-core-design.md` §13.2 |
| D4 | `UserPromptSubmit` records the sender name and the inner-text hash | `specs/2026-10-13-hub-core-design.md` §13.2 |
| D5 | No permission-mode rule for the hub | `specs/2026-10-13-hub-core-design.md` §13.2 |
| D6 | Fork source resolved by name; sends keep the approval baseline | `specs/2026-10-13-hub-core-design.md` §13.2 |
| D7 | A busy session may be forked | `specs/2026-10-13-hub-core-design.md` §13.2 |
| D8 | Fork command and fork settings file | `specs/2026-10-13-hub-core-design.md` §13.2 |
| D9 | Hub started with a role file flag (superseded by P10) | `specs/2026-10-13-hub-core-design.md` §13.2 |
| D10 | Workspace trust before `--bg`; worktree cleanup only proposed | `specs/2026-10-13-hub-core-design.md` §13.2 |
| D11 | Codex follow-ups read-only from their directory; stderr kept | `specs/2026-10-13-hub-core-design.md` §13.2 |
| D12 | Queued prompts recognised by a repeated `prompt_id` | `specs/2026-10-13-hub-core-design.md` §13.2 |
| D13 | `waitingFor` dropped; raw agents state shown, not ranked | `specs/2026-10-13-hub-core-design.md` §13.2 |
| D14 | Backup hook skips or debounces hub sessions | `specs/2026-10-13-hub-core-design.md` §13.2 |
| P1 | Project map | `specs/2026-10-13-hub-core-design.md` §13.3 |
| P2 | Conversation titles | `specs/2026-10-13-hub-core-design.md` §13.3 |
| P3 | New sessions launched from the map | `specs/2026-10-13-hub-core-design.md` §13.3 |
| P4 | Git snapshot in the dialog directory | `specs/2026-10-13-hub-core-design.md` §13.3 |
| P5 | Forks write into dialog directories under `~/.claude/hub/` | `specs/2026-10-13-hub-core-design.md` §13.3 |
| P6 | A fork ignores gates inherited from its source | `specs/2026-10-13-hub-core-design.md` §13.3 |
| P7 | Plan 2 findings on the id prefix and local time join Plan 3 | `specs/2026-10-13-hub-core-design.md` §13.3 |
| P8 | Plan 3 in five groups; acceptance grows to ten items | `specs/2026-10-13-hub-core-design.md` §13.3 |
| P9 | New sessions in a worktree by default | `specs/2026-10-13-hub-core-design.md` §13.3 |
| P10 | Hub in a VS Code panel, role from `~/.claude/hub/CLAUDE.md` | `specs/2026-10-13-hub-core-design.md` §13.4 |
| P11 | Unknown launch outcome; record `pending` before the spawn | `specs/2026-10-13-hub-core-design.md` §13.4 |
| P12 | Fork a given live id directly; refusals before anything is created | `specs/2026-10-13-hub-core-design.md` §13.4 |
| P13 | Codex calls isolated from Rafal's Codex hooks and MCP servers | `specs/2026-10-13-hub-core-design.md` §13.4 |
| P14 | The watcher stops with its hub session | `specs/2026-10-13-hub-core-design.md` §13.4 |
| P15 | Local time in the header line | `specs/2026-10-13-hub-core-design.md` §13.4 |
| A1 | Unique id prefix in `HUB last` and `HUB judge` | `specs/2026-10-14-hub-core-plan-2-acceptance.md`, Findings |
| A2 | Overview "Since" column shown in UTC | `specs/2026-10-14-hub-core-plan-2-acceptance.md`, Findings |
| A3 | A session messaged another session directly, past the hub | `specs/2026-10-14-hub-core-plan-2-acceptance.md`, Findings |
| A4 | Watcher events reach the hub as prompts without a sender name | `specs/2026-10-14-hub-core-plan-2-acceptance.md`, Findings |
| I-3 | A vanished session never ages out of the overview | `specs/2026-10-14-hub-core-plan-2-acceptance.md`, Open decisions |
| I-4 | A turn interrupted with Esc stays "working" | `specs/2026-10-14-hub-core-plan-2-acceptance.md`, Open decisions |
| M-2 | A decision wait survives a later turn without the marker | `specs/2026-10-14-hub-core-plan-2-acceptance.md`, Open decisions |
| B1 | The hub's Codex calls ran Rafal's Codex hooks and MCP servers | `specs/2026-10-14-hub-core-plan-3-acceptance.md`, Findings |
| B2 | Orphaned watcher after the hub panel closed | `specs/2026-10-14-hub-core-plan-3-acceptance.md`, Findings |
| B3 | `@` import of the role file not expanded in a panel session | `specs/2026-10-14-hub-core-plan-3-acceptance.md`, Findings |
| B4 | Starting the hub with flags failed in PowerShell 5.1 | `specs/2026-10-14-hub-core-plan-3-acceptance.md`, Findings |
| B5 | "wyslij" without diacritics accepted as "wyślij" | `specs/2026-10-14-hub-core-plan-3-acceptance.md`, Findings |
| B6 | Draft header shown in UTC | `specs/2026-10-14-hub-core-plan-3-acceptance.md`, Findings |
| B7 | Watcher re-arm noise in quiet hours | `specs/2026-10-14-hub-core-plan-3-acceptance.md`, Findings |
| B8 | Background sessions vanished overnight | `specs/2026-10-14-hub-core-plan-3-acceptance.md`, Findings |
| B9 | A fork refused to write by its own judgment | `specs/2026-10-14-hub-core-plan-3-acceptance.md`, Findings |
| B10 | The hub said a session had no conversation title | `specs/2026-10-14-hub-core-plan-3-acceptance.md`, Findings |
| B11 | Mistyped text folded into questionnaire answers | `specs/2026-10-14-hub-core-plan-3-acceptance.md`, Findings |
| B12 | Sessions started before the hooks have no event log | `specs/2026-10-14-hub-core-plan-3-acceptance.md`, Findings |
| C1 | "i wyślij" typed before the draft was shown is not approval | `specs/2026-10-16-hub-core-plan-4-acceptance.md`, Findings |
| C2 | The watcher's stop line cannot be observed | `specs/2026-10-16-hub-core-plan-4-acceptance.md`, Findings |
| C3 | The closing time of a panel hub is not recorded | `specs/2026-10-16-hub-core-plan-4-acceptance.md`, Findings |
| C4 | The Plan 4 acceptance draft was left unsent | `specs/2026-10-16-hub-core-plan-4-acceptance.md`, Findings |
| U1 | Change from use: one "wyślij" for a waiting session; check 6 is a notice in the `prepare` output, `--confirm-waiting` has no effect | `specs/2026-10-13-hub-core-design.md` §13.5 |
| T4 | Plan 3 ruling: unknown outcome of a new-session launch (group of P11) | `specs/2026-10-13-hub-core-design.md` §13.4, P11 |
| T6 | Plan 3 ruling: no fallback command for a fork with an unknown outcome (group of P11) | `specs/2026-10-13-hub-core-design.md` §13.4, P11 |
| I1 | Plan 3 final review: fork a given live id directly, list twins. Plan 4 final review: `HUB confirm` accepts the hub's sender names from the polls (fixed, part of P10) | `specs/2026-10-14-hub-core-plan-3-acceptance.md`, Open decisions (P12); `specs/2026-10-16-hub-core-plan-4-acceptance.md`, Deviations from the plan; hub spec §13.4, P10 |
| I2 | Plan 3 final review: unknown launch outcome (group of P11) | `specs/2026-10-13-hub-core-design.md` §13.4, P11 |
| I3 | Plan 3 final review: unknown launch outcome (group of P11) | `specs/2026-10-13-hub-core-design.md` §13.4, P11 |
| M1 | Plan 4 final review: installer test without CRLF normalisation (fixed). Plan 3 final review: a refusal before a fork is created (group of P12) | `specs/2026-10-13-hub-core-design.md` §13.4, "After Plan 4"; P12 |
| M2 | Plan 4 final review: quoted MCP server names (fixed) | `specs/2026-10-13-hub-core-design.md` §13.4, "After Plan 4" |
| M3 | Plan 4 final review: the owner-check watcher test rescans every second (fixed) | `specs/2026-10-13-hub-core-design.md` §13.4, "After Plan 4" |
| M4 | Plan 4 final review: watcher owner checked by PID only (accepted risk). Plan 3 final review: a refusal before a fork is created (group of P12) | `specs/2026-10-13-hub-core-design.md` §13.4, "After Plan 4"; P12 |
| M5 | Plan 4 final review: an unreadable `config.toml` no longer fails a Codex call (fixed). Plan 3 final review: a refusal before a fork is created (group of P12) | `specs/2026-10-13-hub-core-design.md` §13.4, "After Plan 4"; P12 |
| M6 | Plan 4 final review: a malformed `HUB_PROCESS_TABLE` gives an empty table (fixed) | `specs/2026-10-13-hub-core-design.md` §13.4, "After Plan 4" |

**Known only as a group.** T4, T6, I2 and I3, and the Plan 3 meanings of M1, M4 and M5, are cited
in the hub spec only together (P11: "Plan 3 rulings T4, T6, final review I2, I3"; P12: "Plan 3
final review I1, M1, M4, M5"). The Plan 3 ledger that described each one separately no longer
exists, so their names here are the names of their group; the T4 and T6 split between launch and
fork is inferred from Plan 3's task order (Task 4: new sessions, Task 6: dialog).
