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

function Repair-Registry {
    <#
      Rebuilds a parsed registry so every field this module reads or assigns is
      guaranteed to exist. Private; not exported.

      Two PowerShell behaviours make this necessary, and the second is the
      dangerous one:
        - Reading an absent property under Set-StrictMode -Version Latest throws
          PropertyNotFoundException.
        - ASSIGNING an absent property on an object produced by ConvertFrom-Json
          throws SetValueInvocationException *regardless of StrictMode* - such
          objects do not accept ad-hoc dot-assignment the way a Hashtable does.

      Either one aborts the whole run, every source directory and not merely the
      malformed entry, on a registry that was hand-edited or written by an older
      schema. Hand-editing is a realistic path: a user restoring onto a machine
      with different drive letters may well fix paths in the file directly.
    #>
    param($Registry)

    $empty = [pscustomobject]@{ version = 1; updated = $null; entries = @() }

    # ConvertFrom-Json turns the four-byte file `null` into $null, and $null has
    # no .PSObject to interrogate: the chained access below would throw the very
    # PropertyNotFoundException this function exists to prevent. A scalar root
    # (a bare number or string) is harmless by comparison - its
    # .PSObject.Properties['entries'] simply returns $null - but $null itself
    # must be caught here.
    if ($null -eq $Registry) { return $empty }

    $entriesProperty = $Registry.PSObject.Properties['entries']
    $rawEntries = @()
    if ($entriesProperty) { $rawEntries = @($entriesProperty.Value) }

    $entries = New-Object System.Collections.Generic.List[object]
    foreach ($rawEntry in $rawEntries) {
        if ($null -eq $rawEntry) { continue }
        $fields = $rawEntry.PSObject.Properties

        $claudeDir = ''
        if ($fields['claudeDir']) { $claudeDir = [string]$fields['claudeDir'].Value }
        $projectPath = ''
        if ($fields['path']) { $projectPath = [string]$fields['path'].Value }

        # An entry addressing nothing cannot be mirrored or restored; drop it
        # rather than carry a placeholder that later code would trip over.
        if (-not $claudeDir -and -not $projectPath) { continue }
        if (-not $claudeDir) { $claudeDir = Join-Path $projectPath '.claude' }
        if (-not $projectPath) { $projectPath = Split-Path -Parent $claudeDir }

        $slug = ''
        if ($fields['slug']) { $slug = [string]$fields['slug'].Value }
        if (-not $slug) { $slug = Get-ClaudeDirSlug -ProjectPath $projectPath }

        $missing = $false
        if ($fields['missing']) { $missing = [bool]$fields['missing'].Value }
        $lastSync = $null
        if ($fields['lastSync']) { $lastSync = $fields['lastSync'].Value }

        $entries.Add([pscustomobject]@{
            slug      = $slug
            path      = $projectPath
            claudeDir = $claudeDir
            missing   = $missing
            lastSync  = $lastSync
        })
    }

    $version = 1
    if ($Registry.PSObject.Properties['version']) {
        $version = $Registry.PSObject.Properties['version'].Value
    }
    $updated = $null
    if ($Registry.PSObject.Properties['updated']) {
        $updated = $Registry.PSObject.Properties['updated'].Value
    }

    return [pscustomobject]@{
        version = $version
        updated = $updated
        entries = @($entries.ToArray())
    }
}

function Read-Registry {
    param([Parameter(Mandatory)][string]$Path)

    $empty = [pscustomobject]@{ version = 1; updated = $null; entries = @() }
    if (-not (Test-Path -LiteralPath $Path)) { return $empty }

    $raw = Get-Content -LiteralPath $Path -Raw -Encoding UTF8
    if ([string]::IsNullOrWhiteSpace($raw)) { return $empty }

    return (Repair-Registry -Registry ($raw | ConvertFrom-Json))
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

# Only these names are copied out of a source .claude directory. Anything
# else there is cache, credentials or session state.
$script:MirrorFiles = @('CLAUDE.md', 'settings.json', 'settings.local.json')
$script:MirrorDirs  = @('skills', 'agents', 'commands', 'hooks', 'wiki', 'plans', 'specs')

function Get-MirrorFiles { return , $script:MirrorFiles }
function Get-MirrorDirs  { return , $script:MirrorDirs }

function Sync-Directory {
    <#
      One-way mirror of a single directory: copies every file from Source and
      removes files in Destination that Source no longer has. Returns the
      number of files copied.
    #>
    param(
        [Parameter(Mandatory)][string]$Source,
        [Parameter(Mandatory)][string]$Destination
    )
    if (-not (Test-Path -LiteralPath $Destination)) {
        New-Item -ItemType Directory -Path $Destination -Force | Out-Null
    }

    $seen = @{}
    foreach ($file in @(Get-ChildItem -LiteralPath $Source -Recurse -File -Force)) {
        $relative = $file.FullName.Substring($Source.Length).TrimStart('\', '/')
        $seen[$relative] = $true
        $target = Join-Path $Destination $relative
        $targetDir = Split-Path -Parent $target
        if (-not (Test-Path -LiteralPath $targetDir)) {
            New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
        }
        Copy-Item -LiteralPath $file.FullName -Destination $target -Force
    }

    foreach ($file in @(Get-ChildItem -LiteralPath $Destination -Recurse -File -Force)) {
        $relative = $file.FullName.Substring($Destination.Length).TrimStart('\', '/')
        if (-not $seen.ContainsKey($relative)) {
            Remove-Item -LiteralPath $file.FullName -Force
        }
    }

    return $seen.Count
}

function Sync-ClaudeMirror {
    param(
        [Parameter(Mandatory)][string]$SourceClaudeDir,
        [Parameter(Mandatory)][string]$MirrorDir
    )
    if (-not (Test-Path -LiteralPath $MirrorDir)) {
        New-Item -ItemType Directory -Path $MirrorDir -Force | Out-Null
    }

    $copied = 0

    foreach ($name in (Get-MirrorFiles)) {
        $src = Join-Path $SourceClaudeDir $name
        $dst = Join-Path $MirrorDir $name
        if (Test-Path -LiteralPath $src -PathType Leaf) {
            Copy-Item -LiteralPath $src -Destination $dst -Force
            $copied++
        } elseif (Test-Path -LiteralPath $dst -PathType Leaf) {
            Remove-Item -LiteralPath $dst -Force
        }
    }

    foreach ($name in (Get-MirrorDirs)) {
        $src = Join-Path $SourceClaudeDir $name
        $dst = Join-Path $MirrorDir $name
        if (Test-Path -LiteralPath $src -PathType Container) {
            $copied += Sync-Directory -Source $src -Destination $dst
        } elseif (Test-Path -LiteralPath $dst -PathType Container) {
            Remove-Item -LiteralPath $dst -Recurse -Force
        }
    }

    return $copied
}

# Every pattern requires a key body of minimum length, never a bare prefix.
# The spec, the plan and these tests all mention the prefixes as text; a
# prefix-only pattern would block commits of this project's own documentation.
$script:SecretPattern = @(
    'sk-ant-[A-Za-z0-9_\-]{24,}',
    'ghp_[A-Za-z0-9]{36}',
    'github_pat_[A-Za-z0-9_]{40,}',
    'AIza[0-9A-Za-z_\-]{35}',
    '-----BEGIN [A-Z ]*PRIVATE KEY-----',
    '"(accessToken|refreshToken)"\s*:\s*"[^"]{20,}"'
)

function Test-SecretContent {
    <#
      Returns the matched pattern, or $null when the file looks clean.

      Size is not an exemption. A large text file is read in 1MB chunks with a
      4KB overlap - far wider than the longest pattern - so a key cannot hide
      past an arbitrary cutoff. Only binary files are skipped: a NUL byte in
      the first 8KB means a regex over the content would yield noise, not
      findings.

      A read failure returns a descriptive "<could not scan: ...>" string
      instead of $null. This gate fails closed: a file locked by another
      process, denied by permissions, or deleted mid-scan has not been
      confirmed clean - it has not been scanned at all. Returning $null for
      that case would make "unreadable" indistinguishable from "read and
      found nothing," which is exactly the distinction a secret gate cannot
      blur. The caller already treats any non-null return as a match to
      abort on, so this needs no change on that side - the abort log line
      will show the sentinel in place of a pattern name, which is intended:
      it names the file and the reason in the same slot a real hit would.
    #>
    param([Parameter(Mandatory)][string]$Path)

    $item = Get-Item -LiteralPath $Path -ErrorAction SilentlyContinue
    if (-not $item) { return ('<could not scan: {0}>' -f 'file not found') }
    if ($item.Length -eq 0) { return $null }

    $stream = $null
    $reader = $null
    try {
        $stream = [System.IO.File]::Open($Path, 'Open', 'Read', 'ReadWrite')

        $probe = New-Object byte[] ([Math]::Min(8KB, $item.Length))
        $probeRead = $stream.Read($probe, 0, $probe.Length)
        for ($i = 0; $i -lt $probeRead; $i++) {
            if ($probe[$i] -eq 0) { return $null }
        }
        $stream.Position = 0

        $reader      = New-Object System.IO.StreamReader($stream)
        $chunkSize   = 1MB
        $overlapSize = 4KB
        $buffer      = New-Object char[] $chunkSize
        $carry       = ''

        while (($read = $reader.Read($buffer, 0, $chunkSize)) -gt 0) {
            $text = $carry + [System.String]::new($buffer, 0, $read)
            foreach ($pattern in $script:SecretPattern) {
                if ($text -cmatch $pattern) { return $pattern }
            }
            $carry = if ($text.Length -gt $overlapSize) {
                $text.Substring($text.Length - $overlapSize)
            } else {
                $text
            }
        }
        return $null
    } catch {
        return ('<could not scan: {0}: {1}>' -f $_.Exception.GetType().Name, $_.Exception.Message)
    } finally {
        if ($reader) { $reader.Dispose() } elseif ($stream) { $stream.Dispose() }
    }
}

Export-ModuleMember -Function Get-ClaudeDirSlug, Find-ClaudeDirs,
                              Read-Registry, Write-Registry, Update-Registry,
                              Get-MirrorFiles, Get-MirrorDirs, Sync-ClaudeMirror,
                              Test-SecretContent
