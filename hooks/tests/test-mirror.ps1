[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'assert.ps1')
Import-Module (Join-Path (Split-Path -Parent $PSScriptRoot) 'lib\ClaudeBackup.psm1') -Force
Reset-AssertFailureCount

Write-Host 'test-mirror' -ForegroundColor Cyan

$sandbox = Join-Path $env:TEMP ("claude-mirror-test-" + [guid]::NewGuid().ToString('N'))
$source  = Join-Path $sandbox 'proj\.claude'
$mirror  = Join-Path $sandbox 'mirror'
try {
    New-Item -ItemType Directory -Path (Join-Path $source 'skills\alpha') -Force | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $source 'agents') -Force | Out-Null
    Set-Content -LiteralPath (Join-Path $source 'skills\alpha\SKILL.md') -Value 'alpha' -Encoding UTF8
    Set-Content -LiteralPath (Join-Path $source 'agents\scan.md') -Value 'scan' -Encoding UTF8
    Set-Content -LiteralPath (Join-Path $source 'settings.json') -Value '{}' -Encoding UTF8
    Set-Content -LiteralPath (Join-Path $source 'history.jsonl') -Value 'noise' -Encoding UTF8
    New-Item -ItemType Directory -Path (Join-Path $source 'paste-cache') -Force | Out-Null
    Set-Content -LiteralPath (Join-Path $source 'paste-cache\blob.bin') -Value 'noise' -Encoding UTF8

    $copied = Sync-ClaudeMirror -SourceClaudeDir $source -MirrorDir $mirror

    Assert-True -Condition (Test-Path -LiteralPath (Join-Path $mirror 'skills\alpha\SKILL.md')) -Because 'skills are mirrored'
    Assert-True -Condition (Test-Path -LiteralPath (Join-Path $mirror 'agents\scan.md')) -Because 'agents are mirrored'
    Assert-True -Condition (Test-Path -LiteralPath (Join-Path $mirror 'settings.json')) -Because 'settings.json is mirrored'
    Assert-True -Condition (-not (Test-Path -LiteralPath (Join-Path $mirror 'history.jsonl'))) -Because 'transcripts are not mirrored'
    Assert-True -Condition (-not (Test-Path -LiteralPath (Join-Path $mirror 'paste-cache'))) -Because 'caches are not mirrored'
    Assert-Equal -Expected 3 -Actual $copied -Because 'the copy count reports mirrored files only'

    # --- deleting in the source deletes in the mirror ---
    Remove-Item -LiteralPath (Join-Path $source 'skills\alpha\SKILL.md') -Force
    Sync-ClaudeMirror -SourceClaudeDir $source -MirrorDir $mirror | Out-Null
    Assert-True -Condition (-not (Test-Path -LiteralPath (Join-Path $mirror 'skills\alpha\SKILL.md'))) -Because 'a deleted skill file leaves the mirror'

    # --- removing a whole whitelisted directory removes it from the mirror ---
    Remove-Item -LiteralPath (Join-Path $source 'agents') -Recurse -Force
    Sync-ClaudeMirror -SourceClaudeDir $source -MirrorDir $mirror | Out-Null
    Assert-True -Condition (-not (Test-Path -LiteralPath (Join-Path $mirror 'agents'))) -Because 'a deleted agents directory leaves the mirror'

    # --- removing a whitelisted top-level file removes it from the mirror ---
    Remove-Item -LiteralPath (Join-Path $source 'settings.json') -Force
    Sync-ClaudeMirror -SourceClaudeDir $source -MirrorDir $mirror | Out-Null
    Assert-True -Condition (-not (Test-Path -LiteralPath (Join-Path $mirror 'settings.json'))) -Because 'a deleted settings.json leaves the mirror'

    # --- content updates propagate ---
    Set-Content -LiteralPath (Join-Path $source 'settings.json') -Value '{"model":"opus"}' -Encoding UTF8
    Sync-ClaudeMirror -SourceClaudeDir $source -MirrorDir $mirror | Out-Null
    Assert-True -Condition ((Get-Content -LiteralPath (Join-Path $mirror 'settings.json') -Raw) -match 'opus') -Because 'changed content is refreshed'
} finally {
    Remove-Item -LiteralPath $sandbox -Recurse -Force -ErrorAction SilentlyContinue
}

exit (Get-AssertFailureCount)
