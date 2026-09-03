<#
    Fans the mirrored .claude directories back out to their source paths.

    Dry by default: restoring overwrites someone's working files, so it must
    never happen by accident. -Apply performs the writes.

    Overwrites, never deletes. A file present in the target .claude but absent
    from the mirror is left alone. On a clean machine the target is empty, so
    this changes nothing; over a populated directory it means a stale file can
    survive. Deleting someone's working files during a restore is the worse
    failure, so the destructive variant is not implemented.

    -Map rewrites path prefixes for a machine whose layout differs, e.g.
        -Map "D:\Praca=E:\Praca"
    The same remap is applied to projects/<slug>/memory, whose directory names
    are derived from the project path: without it Claude would not find its
    memory after a drive letter change.
#>
[CmdletBinding()]
param(
    [switch]$Apply,
    [string[]]$Map = @(),
    [string]$Root
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Same reason as in backup-claude.ps1: under `powershell.exe -File`, Windows
# PowerShell 5.1 leaves $PSScriptRoot empty while param() defaults are being
# evaluated, so this cannot be a param default. The README tells the user to
# run this script with -File.
if (-not $Root) { $Root = Split-Path -Parent $PSScriptRoot }

Import-Module (Join-Path $PSScriptRoot 'lib\ClaudeBackup.psm1') -Force

$mirrorRoot   = Join-Path $Root 'backups\claude-dirs'
$registryPath = Join-Path $mirrorRoot 'registry.json'
$projectsRoot = Join-Path $Root 'projects'

function Convert-MappedPath {
    <#
      Rewrites a path prefix. The old prefix must either be the entire path or
      be followed by a separator, so "D:\Praca=E:\Praca" does not silently
      capture "D:\Pracownia" as well.
    #>
    param([Parameter(Mandatory)][string]$Path, [string[]]$Map = @())
    foreach ($rule in $Map) {
        $parts = $rule -split '=', 2
        if ($parts.Count -ne 2) { continue }

        $old = $parts[0].TrimEnd('\', '/')
        $new = $parts[1].TrimEnd('\', '/')
        if (-not $Path.StartsWith($old, [StringComparison]::OrdinalIgnoreCase)) { continue }

        $rest = $Path.Substring($old.Length)
        if ($rest.Length -gt 0 -and $rest[0] -ne '\' -and $rest[0] -ne '/') { continue }

        return ($new + $rest)
    }
    return $Path
}

$verb = if ($Apply) { 'restoring' } else { 'would restore' }
$registry = Read-Registry -Path $registryPath

if (@($registry.entries).Count -eq 0) {
    Write-Host "No registry at $registryPath - nothing to restore." -ForegroundColor Yellow
    exit 0
}

foreach ($entry in @($registry.entries)) {
    $mirror = Join-Path $mirrorRoot $entry.slug
    if (-not (Test-Path -LiteralPath $mirror)) {
        Write-Host "skip $($entry.slug): no mirror directory" -ForegroundColor Yellow
        continue
    }

    $targetProject = Convert-MappedPath -Path $entry.path -Map $Map
    if (-not (Test-Path -LiteralPath $targetProject)) {
        Write-Host "skip $($entry.slug): target $targetProject does not exist (use -Map)" -ForegroundColor Yellow
        continue
    }

    $targetClaude = Join-Path $targetProject '.claude'
    Write-Host "$verb $($entry.slug) -> $targetClaude" -ForegroundColor Cyan
    if (-not $Apply) { continue }

    if (-not (Test-Path -LiteralPath $targetClaude)) {
        New-Item -ItemType Directory -Path $targetClaude -Force | Out-Null
    }
    foreach ($name in (Get-MirrorFiles)) {
        $src = Join-Path $mirror $name
        if (Test-Path -LiteralPath $src -PathType Leaf) {
            Copy-Item -LiteralPath $src -Destination (Join-Path $targetClaude $name) -Force
        }
    }
    foreach ($name in (Get-MirrorDirs)) {
        $src = Join-Path $mirror $name
        if (Test-Path -LiteralPath $src -PathType Container) {
            Copy-Item -LiteralPath $src -Destination $targetClaude -Recurse -Force
        }
    }
}

# --- memory directory names encode the project path, so they follow the map ---
foreach ($rule in $Map) {
    $parts = $rule -split '=', 2
    if ($parts.Count -ne 2) { continue }
    $oldPrefix = Get-ClaudeDirSlug -ProjectPath $parts[0]
    $newPrefix = Get-ClaudeDirSlug -ProjectPath $parts[1]
    if ($oldPrefix -eq $newPrefix) { continue }
    if (-not (Test-Path -LiteralPath $projectsRoot)) { continue }

    foreach ($dir in @(Get-ChildItem -LiteralPath $projectsRoot -Directory)) {
        if (-not $dir.Name.StartsWith($oldPrefix, [StringComparison]::OrdinalIgnoreCase)) { continue }

        # Slug space has already collapsed every path separator - : \ / and
        # even a literal space - into '-', so the boundary check here mirrors
        # Convert-MappedPath's but checks for '-' rather than '\' or '/':
        # the character right after the matched prefix must be a separator or
        # end-of-string, or "D--Demo" would also capture "D--Demoland-proj".
        $memRest = $dir.Name.Substring($oldPrefix.Length)
        if ($memRest.Length -gt 0 -and $memRest[0] -ne '-') { continue }

        $newName = $newPrefix + $memRest
        Write-Host "$verb memory $($dir.Name) -> $newName" -ForegroundColor Cyan
        if ($Apply) { Rename-Item -LiteralPath $dir.FullName -NewName $newName -Force }
    }
}

if (-not $Apply) {
    Write-Host ''
    Write-Host 'Dry run. Re-run with -Apply to write these changes.' -ForegroundColor Yellow
}
exit 0
