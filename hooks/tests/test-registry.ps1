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

    # --- a hand-edited registry does not take the whole run down with it ---
    # Assigning an absent property on a ConvertFrom-Json object throws
    # SetValueInvocationException even without StrictMode, so an entry lacking
    # `missing`, or a root object lacking `updated`, would otherwise abort the
    # sync for every source directory rather than just the malformed one.
    $handEdited = Join-Path $sandbox 'hand-edited.json'
    @'
{
  "version": 1,
  "entries": [
    { "slug": "D--Hand-Edited", "path": "D:\\Hand\\Edited", "claudeDir": "D:\\Hand\\Edited\\.claude" }
  ]
}
'@ | Out-File -LiteralPath $handEdited -Encoding utf8

    $repaired = Read-Registry -Path $handEdited
    Assert-Equal -Expected 1 -Actual (@($repaired.entries).Count) -Because 'a hand-edited entry survives the read'
    Assert-True -Condition (@($repaired.entries)[0].PSObject.Properties.Name -contains 'missing') -Because 'the absent missing field is materialised'
    Assert-True -Condition (@($repaired.entries)[0].PSObject.Properties.Name -contains 'lastSync') -Because 'the absent lastSync field is materialised'
    Assert-True -Condition ($repaired.PSObject.Properties.Name -contains 'updated') -Because 'the absent updated field is materialised'

    $survived = $true
    try {
        $merged2 = Update-Registry -Registry $repaired -FoundClaudeDir @() -SelfClaudeDir 'C:\Users\rafal\.claude'
        Write-Registry -Registry $merged2 -Path (Join-Path $sandbox 'rewritten.json')
    } catch {
        $survived = $false
    }
    Assert-True -Condition $survived -Because 'update and write both succeed on a hand-edited registry'

    # --- an entry addressing nothing is dropped rather than carried forward ---
    $junk = Join-Path $sandbox 'junk.json'
    '{ "version": 1, "entries": [ { "slug": "orphan" } ] }' | Out-File -LiteralPath $junk -Encoding utf8
    Assert-Equal -Expected 0 -Actual (@((Read-Registry -Path $junk).entries).Count) -Because 'an entry with neither path nor claudeDir is dropped'

    # --- a registry that is valid JSON but not an object reads as empty ---
    # ConvertFrom-Json accepts all three of these. The `null` case is the sharp
    # one: it yields $null, which has no .PSObject, so an unguarded property
    # chain throws the exact exception Repair-Registry exists to prevent.
    $notAnObject = @{
        'root-null.json'   = 'null'
        'root-array.json'  = '[1, 2, 3]'
        'root-string.json' = '"hello"'
    }
    foreach ($name in $notAnObject.Keys) {
        $file = Join-Path $sandbox $name
        Set-Content -LiteralPath $file -Value $notAnObject[$name] -Encoding UTF8
        $readBack = $null
        $threw = $false
        try { $readBack = Read-Registry -Path $file } catch { $threw = $true }
        Assert-True -Condition (-not $threw) -Because "$name does not throw"
        if (-not $threw) {
            Assert-Equal -Expected 0 -Actual (@($readBack.entries).Count) -Because "$name reads as an empty registry"
        }
    }

    # --- the same source twice, cased differently, merges to one entry ---
    $dupes = Update-Registry -Registry (Read-Registry -Path 'nonexistent.json') `
        -FoundClaudeDir @((Join-Path $sandbox 'proj a\.claude'), (Join-Path $sandbox 'PROJ A\.CLAUDE')) `
        -SelfClaudeDir 'C:\Users\rafal\.claude'
    Assert-Equal -Expected 1 -Actual (@($dupes.entries).Count) -Because 'case-insensitive keying merges a duplicate source'

    # --- a slug collision is detected, not silently accepted ---
    $colliding = [pscustomobject]@{
        version = 1; updated = $null
        entries = @(
            [pscustomobject]@{ slug = 'D--Same'; path = 'D:\A'; claudeDir = 'D:\A\.claude'; missing = $false; lastSync = $null },
            [pscustomobject]@{ slug = 'D--Same'; path = 'D:\B'; claudeDir = 'D:\B\.claude'; missing = $false; lastSync = $null },
            [pscustomobject]@{ slug = 'D--Unique'; path = 'D:\C'; claudeDir = 'D:\C\.claude'; missing = $false; lastSync = $null }
        )
    }
    # Named slugDupes, not dupes - test-registry.ps1 already uses $dupes for
    # Update-Registry's case-insensitive-merge assertion earlier in this file.
    $slugDupes = Find-DuplicateSlug -Registry $colliding
    Assert-Equal -Expected 1 -Actual (@($slugDupes)).Count -Because 'exactly one collision group is found'
    Assert-Equal -Expected 2 -Actual (@($slugDupes)[0]).Count -Because 'the collision group has both colliding entries'

    $clean = [pscustomobject]@{
        version = 1; updated = $null
        entries = @(
            [pscustomobject]@{ slug = 'D--One'; path = 'D:\A'; claudeDir = 'D:\A\.claude'; missing = $false; lastSync = $null },
            [pscustomobject]@{ slug = 'D--Two'; path = 'D:\B'; claudeDir = 'D:\B\.claude'; missing = $false; lastSync = $null }
        )
    }
    # Capture to a variable before wrapping in @() - wrapping the function
    # call itself in @() double-wraps an empty return , @(...) result into a
    # one-element array containing an empty array, since the call site's own
    # @() re-triggers pipeline unwrapping on top of the function's already-
    # correct comma-protection. Wrapping an already-captured variable in
    # @() afterward is safe; wrapping the call expression directly is not.
    # Verified empirically: @(Find-DuplicateSlug ...) reported count=1 for a
    # registry with zero collisions, plain capture then @($var) reported the
    # correct 0.
    $noDupes = Find-DuplicateSlug -Registry $clean
    Assert-Equal -Expected 0 -Actual (@($noDupes)).Count -Because 'no collision is reported when every slug is unique'
} finally {
    Remove-Item -LiteralPath $sandbox -Recurse -Force -ErrorAction SilentlyContinue
}

exit (Get-AssertFailureCount)
