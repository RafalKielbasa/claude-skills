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
    # The sibling also gets its OWN memory directory, on disk - without one,
    # the memory-rename loop's Get-ChildItem never even sees "D--Demoland-proj"
    # as a candidate, and this test cannot catch a missing boundary check in
    # that loop specifically (only in the per-entry .claude restore, which
    # already goes through Convert-MappedPath and was never the risk).
    $sibling = Join-Path $repo 'backups\claude-dirs\D--Demoland-proj'
    New-Item -ItemType Directory -Path $sibling -Force | Out-Null
    Set-Content -LiteralPath (Join-Path $sibling 'settings.json') -Value '{}' -Encoding UTF8
    New-Item -ItemType Directory -Path (Join-Path $repo 'projects\D--Demoland-proj\memory') -Force | Out-Null
    Set-Content -LiteralPath (Join-Path $repo 'projects\D--Demoland-proj\memory\MEMORY.md') -Value '- unrelated note' -Encoding UTF8
    $registry.entries = @($registry.entries) + @([pscustomobject]@{
        slug = 'D--Demoland-proj'; path = 'D:\Demoland\proj'; claudeDir = 'D:\Demoland\proj\.claude'
        missing = $false; lastSync = $null
    })
    Write-Registry -Registry $registry -Path (Join-Path $repo 'backups\claude-dirs\registry.json')

    $boundary = Invoke-Restore -ExtraArgs @('-Map', $map)
    Assert-True -Condition ($boundary.Output -notmatch 'restoredland') -Because 'D:\Demo does not capture D:\Demoland'

    # --- a stray file the mirror never claimed to contain survives ---
    # The restore's whole reason to exist is to never delete. The stray file
    # goes INSIDE the actual restore target, $target\.claude - not $target
    # itself, which the script never touches at all and would make this
    # assertion pass even against a version that wiped .claude clean first.
    # Verified: an earlier draft seeded the stray file in $target and a
    # mutation that cleared $target\.claude before copying went undetected.
    New-Item -ItemType Directory -Path (Join-Path $target '.claude') -Force | Out-Null
    Set-Content -LiteralPath (Join-Path $target '.claude\pre-existing-unrelated-file.txt') -Value 'do not touch me' -Encoding UTF8

    # --- apply writes the files ---
    $apply = Invoke-Restore -ExtraArgs @('-Apply', '-Map', $map)
    Assert-Equal -Expected 0 -Actual $apply.ExitCode -Because 'apply succeeds'
    Assert-True -Condition (Test-Path -LiteralPath (Join-Path $target '.claude\skills\demo\SKILL.md')) -Because 'skills are restored under the mapped path'
    Assert-True -Condition (Test-Path -LiteralPath (Join-Path $target '.claude\settings.json')) -Because 'settings are restored'
    Assert-True -Condition (Test-Path -LiteralPath (Join-Path $target '.claude\pre-existing-unrelated-file.txt')) -Because 'a file the mirror never claimed to contain survives the restore'

    # --- memory directories follow the same remap ---
    $newSlug = Get-ClaudeDirSlug -ProjectPath $target
    $renamed = Join-Path $repo "projects\$newSlug"
    Assert-True -Condition (Test-Path -LiteralPath $renamed) -Because 'the memory slug is renamed to match the new path'
    Assert-True -Condition (Test-Path -LiteralPath (Join-Path $renamed 'memory\MEMORY.md')) -Because 'memory content survives the rename'

    # --- the sibling's memory is untouched by the same -Apply ---
    # This is the assertion that actually exercises the boundary check inside
    # the memory-rename loop, not just the per-entry .claude restore.
    Assert-True -Condition (Test-Path -LiteralPath (Join-Path $repo 'projects\D--Demoland-proj\memory\MEMORY.md')) -Because 'D--Demo does not capture D--Demoland-proj in slug space either'

    # --- an unmapped, nonexistent target is reported, not created ---
    $unmapped = Invoke-Restore -ExtraArgs @('-Apply')
    Assert-Equal -Expected 0 -Actual $unmapped.ExitCode -Because 'an unreachable target does not fail the run'
    Assert-True -Condition ($unmapped.Output -match 'skip') -Because 'an unreachable target is reported as skipped'
} finally {
    Remove-Item -LiteralPath $sandbox -Recurse -Force -ErrorAction SilentlyContinue
}

exit (Get-AssertFailureCount)
