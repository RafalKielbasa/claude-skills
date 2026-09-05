<#
.SYNOPSIS
  scripts/review.ps1 — unattended code-review-master runner (Windows / Task Scheduler).

.DESCRIPTION
  Runs the skill non-interactively against a repository, then asks
  `crm gate` for the verdict that run recorded and exits with THAT code —
  never with claude's own exit status. `crm finish` runs *inside* the
  claude session (SKILL.md Step 10), so `claude -p`'s own exit code only
  ever reflects whether the session process itself crashed, not whether
  the review found anything. A wrapper that just propagated claude's exit
  code would report success on every review that ran to completion,
  blocking findings included — see the $claudeExit handling below.

.PARAMETER Repo
  Repository to review. Required.

.PARAMETER Mode
  Review mode passed to /code-review-master (since|pr|branch|full). Default: since.

.PARAMETER Pr
  PR number, required when -Mode pr.

.PARAMETER Model
  Model alias forced on the session. Default: opus — one of the two models
  SKILL.md Step 0 calls out as what this skill is designed for ("Opus or Fable").

.PARAMETER LogDir
  Where the per-run log is written. Default: <Repo>\.claude\review\reports.

.NOTES
  Exit codes (from `crm gate`, see lib/gate.mjs):
    0 — the run recorded no gating findings.
    1 — the run recorded a gating finding: a real review failure.
    2 — the run itself broke (crm/gate error), not a review verdict.

  To register the nightly run in Task Scheduler — paste and run yourself,
  this script never registers itself:

    schtasks /Create /TN "code-review-master nightly" /SC DAILY /ST 02:00 /RU "%USERNAME%" /RL LIMITED /TR "powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File \"C:\Users\<you>\.claude\skills\code-review-master\scripts\review.ps1\" -Repo \"C:\path\to\repo\" -Mode since"

  To remove it again:

    schtasks /Delete /TN "code-review-master nightly" /F
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$Repo,

    [string]$Mode = "since",

    [string]$Pr,

    [string]$Model = "opus",

    [string]$LogDir
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SkillDir = Split-Path -Parent $ScriptDir

# [Console]::Error.WriteLine (not Write-Error, not Write-Host), deliberately:
# with $ErrorActionPreference = "Stop" (set above), Write-Error is a
# terminating error, so the `exit 2` below it would never run — the script
# would instead exit with PowerShell's own generic uncaught-exception code, 1,
# which is the code this script's own gate uses to mean "a blocking finding
# survived". A bad argument would then read as a failed review instead of a
# broken invocation. Write-Host avoids that, but writes to the host's
# information stream, not to stderr — so the message would silently miss the
# stream review.sh's equivalents still use (`>&2`). [Console]::Error.WriteLine
# writes straight to the real stderr handle without going through
# PowerShell's error stream at all, so it triggers neither problem.
if ($Mode -eq "pr" -and [string]::IsNullOrEmpty($Pr)) {
    [Console]::Error.WriteLine("review.ps1: -Mode pr requires -Pr <n>")
    exit 2
}

if (-not (Test-Path -LiteralPath $Repo -PathType Container)) {
    [Console]::Error.WriteLine("review.ps1: -Repo '$Repo' is not a directory")
    exit 2
}

if (-not $LogDir) { $LogDir = Join-Path $Repo ".claude\review\reports" }
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
# .ToUniversalTime() explicitly: Get-Date -Format alone renders local time,
# and Windows PowerShell 5.1 has no -AsUTC switch (that needs 7.1+) — a bare
# "Z" suffix on a local timestamp would falsely claim UTC.
$Timestamp = (Get-Date).ToUniversalTime().ToString("yyyyMMddTHHmmssZ")
$LogFile = Join-Path $LogDir "$Timestamp-nightly.log"

# Resolved here (not hardcoded to "claude"), so a test can substitute a stub
# that records its argv and returns a chosen exit code without invoking a
# real session — see test/wrapper.test.mjs (the .sh counterpart; this file
# has no automated harness on a machine without `sh`, see the checkpoint).
$ClaudeBin = if ($env:CRM_CLAUDE_BIN) { $env:CRM_CLAUDE_BIN } else { "claude" }

$Prompt = "/code-review-master $Mode"
if ($Mode -eq "pr") { $Prompt = "$Prompt $Pr" }

# Tool scope for the top-level session: it shells out to node (crm.mjs),
# git and gh (SKILL.md Steps 1-10), reads and searches files (Read, Grep,
# Glob), writes prose.json in Step 8 (Write, Edit), and dispatches the
# subagents those steps describe. Both Task and Agent are listed for the
# dispatch tool on purpose - its name differs across harness versions,
# listing both costs nothing and guessing wrong costs every run, the same
# reasoning SKILL.md's own tool-set phrasing uses. Under
# --permission-prompts none (below) a tool missing from this list is
# denied outright, so an incomplete list fails the session for a reason
# the exit code alone cannot express.
$AllowedTools = "Bash(node *) Bash(git *) Bash(gh *) Read Grep Glob Write Edit Task Agent"

"review.ps1: repo=$Repo mode=$Mode model=$Model log=$LogFile" |
    Tee-Object -FilePath $LogFile -Append | Write-Host

# PowerShell 5.1 quirk, verified against this build: with
# $ErrorActionPreference = "Stop" (the default set above), merging a native
# command's stderr into the pipeline (2>&1) wraps every stderr line in a
# terminating NativeCommandError - even on exit code 0 - which would abort
# this script and replace the real exit code below with PowerShell's own
# generic uncaught-exception code (1), corrupting the exact signal this
# script exists to propagate. "Continue" is restored once, after the last
# native call (crm gate, at the bottom), so a genuine cmdlet failure
# elsewhere (New-Item, Test-Path, above this point) still stops the script
# as intended.
$callEap = $ErrorActionPreference
$ErrorActionPreference = "Continue"

# Written before the session starts, removed by `crm finish` on the way
# out. It is how `crm gate` (below) tells "this run finished" from "this
# run died and the newest state.json entry belongs to a previous run" -
# without it, a session that crashes mid-review would have its exit code
# silently read as whatever the *last successful* run recorded. A wrapper
# that cannot even write its own sentinel cannot gate honestly, so this
# failure is fatal, not captured-and-continued like $claudeExit below.
node "$SkillDir\bin\crm.mjs" begin --repo $Repo 2>&1 | Tee-Object -FilePath $LogFile -Append
if ($LASTEXITCODE -ne 0) {
    $beginExit = $LASTEXITCODE
    "review.ps1: crm begin failed (exit $beginExit) - a run that cannot write its own sentinel cannot be gated honestly. See $LogFile" |
        Tee-Object -FilePath $LogFile -Append | Write-Host
    $ErrorActionPreference = $callEap
    exit 2
}

Push-Location -LiteralPath $Repo
try {
    # --permission-prompts none: a headless run has no host to answer a
    # prompt that falls outside --permission-mode/--allowedTools, so
    # anything not already allowed is denied outright instead of hanging.
    # No --slots and no --interactive here, ever: an unattended run must not
    # be able to raise its own agent budget or reach mode `fix`. `crm plan`
    # and `crm fixable` both refuse to do either without --interactive
    # anyway (bin/crm.mjs's readSlots and its `fixable` command), but this
    # script not passing the flag in the first place is the actual
    # enforcement, not a courtesy on top of it.
    & $ClaudeBin -p $Prompt `
        --model $Model `
        --output-format text `
        --permission-mode acceptEdits `
        --permission-prompts none `
        --allowedTools $AllowedTools `
        --add-dir $SkillDir `
        2>&1 | Tee-Object -FilePath $LogFile -Append
    $claudeExit = $LASTEXITCODE
} finally {
    Pop-Location
}

if ($claudeExit -ne 0) {
    $msg = "review.ps1: claude exited $claudeExit - that is only the session's own " +
           "exit status, not the review verdict (crm finish runs *inside* that " +
           "session - see SKILL.md Step 10). The .running sentinel crm begin wrote " +
           "above means the gate below will correctly report a broken run (exit 2) " +
           "if this session never reached finish, rather than inheriting whatever " +
           "an earlier, unrelated run decided. Full transcript: $LogFile"
    $msg | Tee-Object -FilePath $LogFile -Append | Write-Warning
}

node "$SkillDir\bin\crm.mjs" gate --repo $Repo 2>&1 | Tee-Object -FilePath $LogFile -Append
$gateExit = $LASTEXITCODE
$ErrorActionPreference = $callEap

"review.ps1: crm gate exited $gateExit - full log at $LogFile" |
    Tee-Object -FilePath $LogFile -Append | Write-Host

# Propagate the gate's exit code, not claude's, so a scheduled task records
# a real failure exactly when the review itself recorded one.
exit $gateExit
