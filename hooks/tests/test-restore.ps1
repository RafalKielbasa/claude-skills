[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'assert.ps1')
Import-Module (Join-Path (Split-Path -Parent $PSScriptRoot) 'lib\ClaudeBackup.psm1') -Force
Reset-AssertFailureCount

Write-Host 'test-restore' -ForegroundColor Cyan

$scriptPath = Join-Path (Split-Path -Parent $PSScriptRoot) 'restore-claude.ps1'
$sandbox    = Join-Path $env:TEMP ("claude-restore-test-" + [guid]::NewGuid().ToString('N'))
$repo       = Join-Path $sandbox 'repo'
$slug       = 'D--Demo-proj'

function Invoke-Restore {
    param([string[]]$ExtraArgs = @())
    $argv = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $scriptPath, '-Root', $repo) + $ExtraArgs
    $out = & powershell.exe @argv 2>&1
    return [pscustomobject]@{ ExitCode = $LASTEXITCODE; Output = ($out -join "`n") }
}

try {
    $mirror = Join-Path $repo "backups\claude-dirs\$slug"
    New-Item -ItemType Directory -Path (Join-Path $mirror 'skills\demo') -Force | Out-Null
    Set-Content -LiteralPath (Join-Path $mirror 'skills\demo\SKILL.md') -Value 'demo' -Encoding UTF8
    Set-Content -LiteralPath (Join-Path $mirror 'settings.json') -Value '{}' -Encoding UTF8

    New-Item -ItemType Directory -Path (Join-Path $repo "projects\$slug\memory") -Force | Out-Null
    Set-Content -LiteralPath (Join-Path $repo "projects\$slug\memory\MEMORY.md") -Value '- note' -Encoding UTF8

    $target = Join-Path $sandbox 'restored\proj'
    New-Item -ItemType Directory -Path $target -Force | Out-Null

    $registry = [pscustomobject]@{
        version = 1; updated = $null
        entries = @([pscustomobject]@{
            slug = $slug; path = 'D:\Demo\proj'; claudeDir = 'D:\Demo\proj\.claude'
            missing = $false; lastSync = $null
        })
    }
    Write-Registry -Registry $registry -Path (Join-Path $repo 'backups\claude-dirs\registry.json')

    $map = "D:\Demo=$(Join-Path $sandbox 'restored')"

    # --- dry run changes nothing ---
    $dry = Invoke-Restore -ExtraArgs @('-Map', $map)
    Assert-Equal -Expected 0 -Actual $dry.ExitCode -Because 'a dry run succeeds'
    Assert-True -Condition (-not (Test-Path -LiteralPath (Join-Path $target '.claude'))) -Because 'a dry run writes nothing'
    Assert-True -Condition ($dry.Output -match 'would') -Because 'a dry run says what it would do'

    # --- prefix matching respects segment boundaries ---
    # "D:\Demo=..." must not capture "D:\Demoland". With a naive StartsWith the
    # entry below would be reported against a path containing 'restoredland'.
    $sibling = Join-Path $repo 'backups\claude-dirs\D--Demoland-proj'
    New-Item -ItemType Directory -Path $sibling -Force | Out-Null
    Set-Content -LiteralPath (Join-Path $sibling 'settings.json') -Value '{}' -Encoding UTF8
    $registry.entries = @($registry.entries) + @([pscustomobject]@{
        slug = 'D--Demoland-proj'; path = 'D:\Demoland\proj'; claudeDir = 'D:\Demoland\proj\.claude'
        missing = $false; lastSync = $null
    })
    Write-Registry -Registry $registry -Path (Join-Path $repo 'backups\claude-dirs\registry.json')

    $boundary = Invoke-Restore -ExtraArgs @('-Map', $map)
    Assert-True -Condition ($boundary.Output -notmatch 'restoredland') -Because 'D:\Demo does not capture D:\Demoland'

    # --- apply writes the files ---
    $apply = Invoke-Restore -ExtraArgs @('-Apply', '-Map', $map)
    Assert-Equal -Expected 0 -Actual $apply.ExitCode -Because 'apply succeeds'
    Assert-True -Condition (Test-Path -LiteralPath (Join-Path $target '.claude\skills\demo\SKILL.md')) -Because 'skills are restored under the mapped path'
    Assert-True -Condition (Test-Path -LiteralPath (Join-Path $target '.claude\settings.json')) -Because 'settings are restored'

    # --- memory directories follow the same remap ---
    $newSlug = Get-ClaudeDirSlug -ProjectPath $target
    $renamed = Join-Path $repo "projects\$newSlug"
    Assert-True -Condition (Test-Path -LiteralPath $renamed) -Because 'the memory slug is renamed to match the new path'
    Assert-True -Condition (Test-Path -LiteralPath (Join-Path $renamed 'memory\MEMORY.md')) -Because 'memory content survives the rename'

    # --- an unmapped, nonexistent target is reported, not created ---
    $unmapped = Invoke-Restore -ExtraArgs @('-Apply')
    Assert-Equal -Expected 0 -Actual $unmapped.ExitCode -Because 'an unreachable target does not fail the run'
    Assert-True -Condition ($unmapped.Output -match 'skip') -Because 'an unreachable target is reported as skipped'
} finally {
    Remove-Item -LiteralPath $sandbox -Recurse -Force -ErrorAction SilentlyContinue
}

exit (Get-AssertFailureCount)
