[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'assert.ps1')
Import-Module (Join-Path (Split-Path -Parent $PSScriptRoot) 'lib\ClaudeBackup.psm1') -Force
Reset-AssertFailureCount

Write-Host 'test-registry' -ForegroundColor Cyan

# --- slug ---
Assert-Equal -Expected 'D--Notatki-notatki' `
    -Actual (Get-ClaudeDirSlug -ProjectPath 'D:\Notatki\notatki') `
    -Because 'slug matches the convention Claude Code uses in projects/'
Assert-Equal -Expected 'D--Praca-Devstock-Baza-wiedzy' `
    -Actual (Get-ClaudeDirSlug -ProjectPath 'D:\Praca\Devstock\Baza wiedzy') `
    -Because 'spaces become dashes'
Assert-Equal -Expected 'D--Praca-Devstock-Projekty-saas-app-docs' `
    -Actual (Get-ClaudeDirSlug -ProjectPath 'D:\Praca\Devstock\Projekty\saas app\docs\') `
    -Because 'a trailing separator does not change the slug'

# --- discovery ---
$sandbox = Join-Path $env:TEMP ("claude-backup-test-" + [guid]::NewGuid().ToString('N'))
try {
    New-Item -ItemType Directory -Path (Join-Path $sandbox 'proj a\.claude\skills') -Force | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $sandbox 'proj a\node_modules\dep\.claude') -Force | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $sandbox 'proj b\nested\deep\.claude') -Force | Out-Null

    $found = Find-ClaudeDirs -SearchRoot @($sandbox) -MaxDepth 6
    Assert-Equal -Expected 2 -Actual $found.Count -Because 'both real .claude directories are found'
    Assert-True -Condition ($found -contains (Join-Path $sandbox 'proj a\.claude')) -Because 'top-level .claude is found'
    Assert-True -Condition (-not ($found | Where-Object { $_ -like '*node_modules*' })) -Because 'node_modules is pruned'

    # Depth semantics: a node at depth d has its children examined only while
    # d < MaxDepth. The root is depth 0, so MaxDepth 1 looks for a .claude
    # directly inside the root, and 'proj a\.claude' needs MaxDepth 2.
    $shallow = Find-ClaudeDirs -SearchRoot @($sandbox) -MaxDepth 1
    Assert-Equal -Expected 0 -Actual $shallow.Count -Because 'MaxDepth 1 inspects only the root children'

    $twoDeep = Find-ClaudeDirs -SearchRoot @($sandbox) -MaxDepth 2
    Assert-Equal -Expected 1 -Actual $twoDeep.Count -Because 'MaxDepth 2 reaches a .claude one project down'

    # --- registry round-trip ---
    $registryPath = Join-Path $sandbox 'registry.json'
    $empty = Read-Registry -Path $registryPath
    Assert-Equal -Expected 0 -Actual (@($empty.entries).Count) -Because 'a missing registry reads as empty'

    $merged = Update-Registry -Registry $empty -FoundClaudeDir $found -SelfClaudeDir 'C:\Users\rafal\.claude'
    Assert-Equal -Expected 2 -Actual (@($merged.entries).Count) -Because 'discovered directories become entries'
    Write-Registry -Registry $merged -Path $registryPath

    $reread = Read-Registry -Path $registryPath
    Assert-Equal -Expected 2 -Actual (@($reread.entries).Count) -Because 'the registry survives a write/read round-trip'
    Assert-True -Condition (@($reread.entries)[0].PSObject.Properties.Name -contains 'claudeDir') -Because 'entries keep the absolute source path'

    # --- a vanished source is marked, never dropped ---
    Remove-Item -LiteralPath (Join-Path $sandbox 'proj b\nested\deep\.claude') -Recurse -Force
    $after = Update-Registry -Registry $reread -FoundClaudeDir @() -SelfClaudeDir 'C:\Users\rafal\.claude'
    Assert-Equal -Expected 2 -Actual (@($after.entries).Count) -Because 'a vanished source keeps its entry'
    Assert-Equal -Expected 1 -Actual (@($after.entries | Where-Object { $_.missing }).Count) -Because 'the vanished source is flagged missing'

    # --- the global .claude is never mirrored into itself ---
    $self = Update-Registry -Registry (Read-Registry -Path 'nonexistent.json') `
        -FoundClaudeDir @('C:\Users\rafal\.claude') -SelfClaudeDir 'C:\Users\rafal\.claude'
    Assert-Equal -Expected 0 -Actual (@($self.entries).Count) -Because 'the repo root is excluded from its own mirror'
} finally {
    Remove-Item -LiteralPath $sandbox -Recurse -Force -ErrorAction SilentlyContinue
}

exit (Get-AssertFailureCount)
