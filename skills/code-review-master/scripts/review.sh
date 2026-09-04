#!/bin/sh
# scripts/review.sh — unattended code-review-master runner (POSIX-ish shell,
# tested against Git Bash's /bin/sh and Linux GitHub Actions runners).
#
# Runs the skill non-interactively against a repository, then asks
# `crm gate` for the verdict that run recorded and exits with THAT code —
# never with claude's own exit status. `crm finish` runs *inside* the
# claude session (SKILL.md Step 10), so `claude -p`'s own exit code only
# ever reflects whether the session process itself crashed, not whether
# the review found anything. A wrapper that just propagated `claude`'s
# exit code would report success on every review that ran to completion,
# blocking findings included — see the CLAUDE_EXIT handling below.
#
# Usage:
#   scripts/review.sh --repo <path> [--mode since|pr|branch|full]
#                      [--pr <n>] [--model <alias>] [--log-dir <dir>]
#
# Used by ci/code-review.yml on pull_request:
#   scripts/review.sh --repo . --mode pr --pr <PR number>
#
# Exit codes (from `crm gate`, see lib/gate.mjs):
#   0 — the run recorded no gating findings.
#   1 — the run recorded a gating finding: a real review failure.
#   2 — the run itself broke (crm/gate error), not a review verdict.
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
SKILL_DIR=$(cd "$SCRIPT_DIR/.." && pwd)

MODE="since"
REPO=""
PR=""
# "opus" is one of the two models SKILL.md Step 0 calls out as what this
# skill is designed for ("Opus or Fable") — override with --model.
MODEL="opus"
LOG_DIR=""

while [ $# -gt 0 ]; do
  case "$1" in
    --repo) REPO="$2"; shift 2 ;;
    --mode) MODE="$2"; shift 2 ;;
    --pr) PR="$2"; shift 2 ;;
    --model) MODEL="$2"; shift 2 ;;
    --log-dir) LOG_DIR="$2"; shift 2 ;;
    *) echo "review.sh: unknown argument '$1'" >&2; exit 2 ;;
  esac
done

if [ -z "$REPO" ]; then
  echo "review.sh: --repo is required" >&2
  exit 2
fi
if [ ! -d "$REPO" ]; then
  echo "review.sh: --repo '$REPO' is not a directory" >&2
  exit 2
fi
if [ "$MODE" = "pr" ] && [ -z "$PR" ]; then
  echo "review.sh: --mode pr requires --pr <n>" >&2
  exit 2
fi

LOG_DIR="${LOG_DIR:-$REPO/.claude/review/reports}"
mkdir -p "$LOG_DIR"
TIMESTAMP=$(date -u +%Y%m%dT%H%M%SZ)
LOG_FILE="$LOG_DIR/${TIMESTAMP}-nightly.log"

# Resolved here (not hardcoded to `claude`) so a test can substitute a stub
# that records its argv and returns a chosen exit code without invoking a
# real session — see test/wrapper.test.mjs.
CLAUDE_BIN="${CRM_CLAUDE_BIN:-claude}"

PROMPT="/code-review-master $MODE"
if [ "$MODE" = "pr" ]; then
  PROMPT="$PROMPT $PR"
fi

# Tool scope for the top-level session: it only ever shells out to node
# (crm.mjs), git and gh (SKILL.md Steps 1–10), reads files, and dispatches
# the subagents those steps describe. No Write/Edit — crm.mjs writes
# .claude/review/** itself via Node's fs, never through Claude's own file
# tools, so the session needs no standing write grant at all.
ALLOWED_TOOLS="Bash(node *) Bash(git *) Bash(gh *) Read Task"

{
  echo "review.sh: repo=$REPO mode=$MODE model=$MODEL log=$LOG_FILE"
} | tee -a "$LOG_FILE" >&2

CLAUDE_EXIT=0
# --permission-prompts none: a headless run has no host to answer a prompt
# that falls outside --permission-mode/--allowedTools, so anything not
# already allowed is denied outright instead of hanging forever.
# No --slots here, ever: an unattended run must not be able to raise its
# own agent budget. `crm plan` refuses --slots without a terminal anyway
# (bin/crm.mjs's readSlots), but this script does not even try.
(
  cd "$REPO" && "$CLAUDE_BIN" -p "$PROMPT" \
    --model "$MODEL" \
    --output-format text \
    --permission-mode acceptEdits \
    --permission-prompts none \
    --allowedTools "$ALLOWED_TOOLS" \
    --add-dir "$SKILL_DIR"
) 2>&1 | tee -a "$LOG_FILE" || CLAUDE_EXIT=$?

if [ "$CLAUDE_EXIT" -ne 0 ]; then
  {
    echo "review.sh: claude exited $CLAUDE_EXIT — that is only the session's own"
    echo "exit status, not the review verdict (crm finish runs *inside* that"
    echo "session — see SKILL.md Step 10). If the session crashed before finish"
    echo "ran, the gate result below may reflect a stale, earlier run's"
    echo "state.json rather than this one. Full transcript: $LOG_FILE"
  } | tee -a "$LOG_FILE" >&2
fi

GATE_EXIT=0
node "$SKILL_DIR/bin/crm.mjs" gate --repo "$REPO" 2>&1 | tee -a "$LOG_FILE" || GATE_EXIT=$?

echo "review.sh: crm gate exited $GATE_EXIT — full log at $LOG_FILE" | tee -a "$LOG_FILE" >&2

exit "$GATE_EXIT"
