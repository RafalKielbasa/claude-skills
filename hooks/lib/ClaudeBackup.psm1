# Shared helpers for backup-claude.ps1 and restore-claude.ps1.

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-ClaudeDirSlug {
    <#
      Mirrors the naming Claude Code itself uses under projects/:
      "D:\Praca\Devstock\Baza wiedzy" -> "D--Praca-Devstock-Baza-wiedzy"
      Takes the project path, not the .claude directory inside it.
    #>
    param([Parameter(Mandatory)][string]$ProjectPath)
    $trimmed = $ProjectPath.TrimEnd('\', '/')
    return ($trimmed -replace '[:\\/ ]', '-')
}

function Find-ClaudeDirs {
    <#
      Breadth-first walk that prunes noisy trees instead of recursing into
      them. Get-ChildItem -Recurse would walk every node_modules on the disk.
      A found .claude is not descended into.

      Depth semantics: the search roots are depth 0 and a node's children are
      examined only while its depth is below MaxDepth. So MaxDepth 1 finds a
      .claude sitting directly in a search root, and the deepest real target,
      "D:\Praca\Devstock\Projekty\Multi agent system\company-agent-chat\.claude",
      needs MaxDepth 6.
    #>
    param(
        [Parameter(Mandatory)][string[]]$SearchRoot,
        [int]$MaxDepth = 6,
        [string[]]$ExcludeSegment = @('node_modules', '.git', '.vscode', '.vs',
                                      'AppData', 'dist', 'build', '.next',
                                      'venv', '.venv', '__pycache__')
    )
    $found = New-Object System.Collections.Generic.List[string]
    $queue = New-Object System.Collections.Generic.Queue[object]

    foreach ($root in $SearchRoot) {
        if (Test-Path -LiteralPath $root) {
            $queue.Enqueue([pscustomobject]@{ Path = $root; Depth = 0 })
        }
    }

    while ($queue.Count -gt 0) {
        $node = $queue.Dequeue()
        if ($node.Depth -ge $MaxDepth) { continue }

        $children = @()
        try {
            $children = @(Get-ChildItem -LiteralPath $node.Path -Directory -Force -ErrorAction Stop)
        } catch {
            continue   # unreadable directory: skip it, do not abort the scan
        }

        foreach ($child in $children) {
            if ($ExcludeSegment -contains $child.Name) { continue }
            if ($child.Name -eq '.claude') { $found.Add($child.FullName); continue }
            $queue.Enqueue([pscustomobject]@{ Path = $child.FullName; Depth = $node.Depth + 1 })
        }
    }

    return , $found.ToArray()
}

function Read-Registry {
    param([Parameter(Mandatory)][string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) {
        return [pscustomobject]@{ version = 1; updated = $null; entries = @() }
    }
    $raw = Get-Content -LiteralPath $Path -Raw -Encoding UTF8
    if ([string]::IsNullOrWhiteSpace($raw)) {
        return [pscustomobject]@{ version = 1; updated = $null; entries = @() }
    }
    return ($raw | ConvertFrom-Json)
}

function Write-Registry {
    param(
        [Parameter(Mandatory)]$Registry,
        [Parameter(Mandatory)][string]$Path
    )
    $Registry.updated = (Get-Date).ToString('o')
    $dir = Split-Path -Parent $Path
    if ($dir -and -not (Test-Path -LiteralPath $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    ($Registry | ConvertTo-Json -Depth 6) | Out-File -LiteralPath $Path -Encoding utf8
}

function Update-Registry {
    <#
      Merges discovered directories into the registry. Entries are never
      removed: a source that disappeared is flagged missing so that deleting
      a project cannot delete its own backup.
    #>
    param(
        [Parameter(Mandatory)]$Registry,
        [string[]]$FoundClaudeDir = @(),
        [Parameter(Mandatory)][string]$SelfClaudeDir
    )
    $self = $SelfClaudeDir.TrimEnd('\', '/')
    $byPath = [ordered]@{}

    foreach ($entry in @($Registry.entries)) {
        $byPath[$entry.claudeDir.ToLowerInvariant()] = $entry
    }

    foreach ($dir in $FoundClaudeDir) {
        if ($dir.TrimEnd('\', '/') -ieq $self) { continue }
        $key = $dir.ToLowerInvariant()
        if (-not $byPath.Contains($key)) {
            $project = Split-Path -Parent $dir
            $byPath[$key] = [pscustomobject]@{
                slug      = (Get-ClaudeDirSlug -ProjectPath $project)
                path      = $project
                claudeDir = $dir
                missing   = $false
                lastSync  = $null
            }
        }
    }

    foreach ($entry in @($byPath.Values)) {
        $entry.missing = -not (Test-Path -LiteralPath $entry.claudeDir)
    }

    $Registry.entries = @($byPath.Values | Sort-Object slug)
    return $Registry
}

Export-ModuleMember -Function Get-ClaudeDirSlug, Find-ClaudeDirs,
                              Read-Registry, Write-Registry, Update-Registry
