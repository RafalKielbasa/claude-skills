[CmdletBinding()]
param([string]$Root)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
# NOTE: the default for -Root is resolved here, not as a param() default
# expression. Under `powershell.exe -File`, Windows PowerShell 5.1 has not
# yet populated $PSScriptRoot (or $MyInvocation.MyCommand.Path) at the point
# param() defaults are evaluated - both come back empty/null there, and
# `Split-Path -Parent $PSScriptRoot` throws before the script body ever
# runs. By the time execution reaches here, $PSScriptRoot is set correctly.
if (-not $Root) {
    $Root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
}
. (Join-Path $PSScriptRoot 'assert.ps1')
Reset-AssertFailureCount

Write-Host "test-gitignore ($Root)" -ForegroundColor Cyan

Push-Location $Root
try {
    # Everything git considers part of this repository: files already tracked
    # plus untracked, non-ignored ones.
    #
    # Not `git status --porcelain`: that lists only *changes*, so once these
    # files are committed and the tree is clean the positive assertions below
    # would all fail. This listing is stable across commit state, and it also
    # catches a secret that is already tracked - .gitignore does not untrack
    # anything that entered the index before the rule existed.
    $candidates = @(git -c core.quotepath=false ls-files --cached --others --exclude-standard)
} finally {
    Pop-Location
}

# --- nothing sensitive or generated may appear ---
Assert-NotContains -Collection $candidates -Pattern '.credentials.json' -Because 'OAuth credentials stay out'
Assert-NotContains -Collection $candidates -Pattern '*.jsonl'           -Because 'session transcripts stay out'
Assert-NotContains -Collection $candidates -Pattern '*.key'             -Because 'session keys stay out'
Assert-NotContains -Collection $candidates -Pattern 'plugins/cache/*'   -Because 'vendored plugin code stays out'
Assert-NotContains -Collection $candidates -Pattern 'plugins/marketplaces/*' -Because 'marketplace clones stay out'
Assert-NotContains -Collection $candidates -Pattern 'paste-cache/*'     -Because 'paste cache stays out'
Assert-NotContains -Collection $candidates -Pattern 'file-history/*'    -Because 'file history stays out'
Assert-NotContains -Collection $candidates -Pattern 'shell-snapshots/*' -Because 'shell snapshots stay out'
Assert-NotContains -Collection $candidates -Pattern 'telemetry/*'       -Because 'telemetry stays out'
Assert-NotContains -Collection $candidates -Pattern 'session-env/*'     -Because 'session env stays out'
Assert-NotContains -Collection $candidates -Pattern 'tasks/*'           -Because 'task state stays out'
Assert-NotContains -Collection $candidates -Pattern 'backups/sync.log'  -Because 'sync log stays out'

# --- everything the restore depends on must appear ---
Assert-Contains -Collection $candidates -Value 'CLAUDE.md'          -Because 'global rules are backed up'
Assert-Contains -Collection $candidates -Value 'settings.json'      -Because 'global settings are backed up'
Assert-Contains -Collection $candidates -Value '.gitignore'         -Because 'the allowlist backs itself up'
Assert-Contains -Collection $candidates -Value 'skills/podsumuj-sesja-claude/SKILL.md' -Because 'global skills are backed up'
Assert-Contains -Collection $candidates -Value 'wiki/index.md'      -Because 'wiki is backed up'
Assert-Contains -Collection $candidates -Value 'plugins/installed_plugins.json'  -Because 'plugin manifest is backed up'
Assert-Contains -Collection $candidates -Value 'plugins/known_marketplaces.json' -Because 'marketplace manifest is backed up'
Assert-Contains -Collection $candidates -Value 'projects/D--Praca-Devstock-Baza-wiedzy/memory/MEMORY.md' -Because 'memory is backed up'
Assert-Contains -Collection $candidates -Value 'docs/superpowers/specs/2026-09-03-backup-claude-config-design.md' -Because 'the spec is backed up'
Assert-Contains -Collection $candidates -Value 'docs/superpowers/plans/2026-09-03-backup-claude-config.md' -Because 'the plan is backed up'

# --- sanity: an allowlist that lets a thousand files through is not an allowlist ---
Assert-True -Condition ($candidates.Count -lt 300) -Because "candidate count stays small (got $($candidates.Count))"

# --- rule-level checks ---
# git check-ignore evaluates the rules against a path whether or not it exists,
# so these cover blocks that happen to have no matching file on disk today.
Push-Location $Root
try {
    function Test-Ignored {
        param([Parameter(Mandatory)][string]$Path)
        git check-ignore -q -- $Path
        return ($LASTEXITCODE -eq 0)
    }

    foreach ($blocked in @(
        '.credentials.json',
        'skills/x/.credentials.json',
        'skills/x/private.pem',
        'hooks/id_rsa.key',
        'skills/x/.env',
        'skills/x/.env.local',
        'wiki/transcript.jsonl',
        'skills/x/build.lock',
        'plugins/cache/superpowers/6.3.0/SKILL.md',
        'plugins/marketplaces/obsidian-skills/skills/a.md',
        'paste-cache/blob.bin',
        'projects/D--X/session.jsonl',
        'backups/sync.log',
        'backups/.sync.lock',
        'docs/loose-note.md',
        'some-future-claude-dir/state.json'
    )) {
        Assert-True -Condition (Test-Ignored $blocked) -Because "ignored: $blocked"
    }

    foreach ($allowed in @(
        'CLAUDE.md',
        'README.md',
        '.gitignore',
        'settings.json',
        'skills/x/SKILL.md',
        'hooks/backup-claude.ps1',
        'hooks/lib/ClaudeBackup.psm1',
        'agents/x.md',
        'commands/x.md',
        'wiki/patterns/x.md',
        'docs/superpowers/specs/x.md',
        'docs/superpowers/plans/x.md',
        'plans/x.md',
        'plugins/installed_plugins.json',
        'plugins/known_marketplaces.json',
        'projects/D--X/memory/MEMORY.md',
        'backups/claude-dirs/registry.json',
        'backups/claude-dirs/D--X/skills/y/SKILL.md'
    )) {
        Assert-True -Condition (-not (Test-Ignored $allowed)) -Because "allowed: $allowed"
    }
} finally {
    Pop-Location
}

exit (Get-AssertFailureCount)
