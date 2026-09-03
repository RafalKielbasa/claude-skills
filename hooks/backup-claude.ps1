<#
    Mirrors every registered .claude directory into this repository, then
    commits and pushes. Runs as a SessionEnd hook and by hand.

    Once the repository is in service this is the sole producer of commits.
    The invariant it enforces is narrower than "never run git commit here":
    no commit is made whose staged set has not passed the secret scanner.
    A deliberate hand-made commit satisfies that by running Test-SecretContent
    over the staged files first - the same check this script performs.
#>
[CmdletBinding()]
param(
    [switch]$Rescan,
    [switch]$NoPush,
    [string]$Root,
    [string[]]$SearchRoot = @('D:\', 'C:\Users\rafal')
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# The default for -Root is resolved here, not as a param() default expression.
# Under `powershell.exe -File`, Windows PowerShell 5.1 has not yet populated
# $PSScriptRoot when param() defaults are evaluated - it is an empty string
# there, and Split-Path throws before the body ever runs. That is exactly how
# the SessionEnd hook invokes this script, so the param-default form would
# fail on every single run. By this line $PSScriptRoot is set correctly.
if (-not $Root) { $Root = Split-Path -Parent $PSScriptRoot }

Import-Module (Join-Path $PSScriptRoot 'lib\ClaudeBackup.psm1') -Force

$backupsDir   = Join-Path $Root 'backups'
$mirrorRoot   = Join-Path $backupsDir 'claude-dirs'
$registryPath = Join-Path $mirrorRoot 'registry.json'
$logPath      = Join-Path $backupsDir 'sync.log'
$lockPath     = Join-Path $backupsDir '.sync.lock'

foreach ($dir in @($backupsDir, $mirrorRoot)) {
    if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
}

function Write-Log {
    param([Parameter(Mandatory)][string]$Message)
    $line = '{0} {1}' -f (Get-Date).ToString('yyyy-MM-dd HH:mm:ss'), $Message
    Add-Content -LiteralPath $logPath -Value $line -Encoding UTF8
    Write-Verbose $line
}

# --- lock: two sessions ending at once must not share a git index ---
if (Test-Path -LiteralPath $lockPath) {
    $age = (Get-Date) - (Get-Item -LiteralPath $lockPath).LastWriteTime
    if ($age.TotalMinutes -lt 10) {
        Write-Log ('skip: lock held for {0}s' -f [int]$age.TotalSeconds)
        exit 0
    }
    Write-Log 'stale lock discarded'
}
New-Item -ItemType File -Path $lockPath -Force | Out-Null

$exitCode = 0
try {
    # --- registry ---
    $registry = Read-Registry -Path $registryPath

    # Captured before Update-Registry mutates missing in place: a value-type
    # snapshot, keyed by claudeDir, of what each entry's missing flag was
    # coming into this run. Used below to detect a flip even when it produces
    # no mirrored file diff at all (a vanished source mirrors nothing).
    $missingBefore = @{}
    foreach ($entry in @($registry.entries)) {
        $missingBefore[$entry.claudeDir.ToLowerInvariant()] = [bool]$entry.missing
    }

    $found = @()
    if ($Rescan -or -not (Test-Path -LiteralPath $registryPath)) {
        Write-Log 'rescanning for .claude directories'
        $found = Find-ClaudeDirs -SearchRoot $SearchRoot
    }
    $registry = Update-Registry -Registry $registry -FoundClaudeDir $found -SelfClaudeDir $Root

    $registryChanged = $false
    foreach ($entry in @($registry.entries)) {
        $key = $entry.claudeDir.ToLowerInvariant()
        if (-not $missingBefore.ContainsKey($key) -or $missingBefore[$key] -ne [bool]$entry.missing) {
            $registryChanged = $true
        }
    }

    foreach ($group in (Find-DuplicateSlug -Registry $registry)) {
        $paths = ($group | ForEach-Object { $_.claudeDir }) -join ', '
        Write-Log ("WARNING: {0} sources share the slug '{1}' and will overwrite each other's mirror: {2}" -f $group.Count, $group[0].slug, $paths)
    }

    # --- mirror ---
    $mirroredFiles = 0
    foreach ($entry in @($registry.entries)) {
        if ($entry.missing) {
            Write-Log ('source missing, mirror kept: {0}' -f $entry.claudeDir)
            continue
        }
        $mirrorDir = Join-Path $mirrorRoot $entry.slug
        $mirroredFiles += Sync-ClaudeMirror -SourceClaudeDir $entry.claudeDir -MirrorDir $mirrorDir
    }
    Write-Log ('mirrored {0} files from {1} sources' -f $mirroredFiles, @($registry.entries).Count)

    # --- stage, gate, commit ---
    Push-Location -LiteralPath $Root
    try {
        # A hand-started merge, cherry-pick, revert, rebase or bisect that hit
        # a conflict leaves the repository in exactly this state until a human
        # resolves it. `git add -A` would mark the conflict resolved and
        # `git commit` would finalize it - with the conflict markers baked
        # into the committed file - the moment any Claude Code session ends
        # anywhere on this machine, because this hook is global. A later
        # restore -Apply would then write those markers into a real .claude
        # directory. Never touch the index while one of these is in progress;
        # the next run tries again once the human has resolved it.
        foreach ($marker in @('MERGE_HEAD', 'CHERRY_PICK_HEAD', 'REVERT_HEAD', 'rebase-merge', 'rebase-apply', 'BISECT_LOG')) {
            if (Test-Path -LiteralPath (Join-Path $Root ".git\$marker")) {
                Write-Log ("skip: repository is mid-{0}; not committing over a hand operation" -f $marker)
                exit 0
            }
        }

        function Invoke-Git {
            <#
              Windows PowerShell 5.1 does not turn a native program's non-zero
              exit into a terminating error, so $ErrorActionPreference = 'Stop'
              would happily let a failed `git add` pass for success. Every call
              whose outcome matters goes through here.

              A second, sharper quirk sits on top of that one: still under
              $ErrorActionPreference = 'Stop', merging a native command's
              stderr with 2>&1 wraps each stderr line in an ErrorRecord and
              PROMOTES it to a terminating exception right at the invocation
              line - before $LASTEXITCODE is ever checked below. Left alone,
              that makes -AllowFailure a no-op for exactly the calls that need
              it most: a fetch or push against an unreachable remote throws
              here instead of returning a non-zero exit code. Confirmed with a
              minimal probe against a bad remote URL. The local 'Continue'
              override, scoped to the call and restored in the finally,
              neutralises the promotion while still capturing stderr as
              ordinary output.
            #>
            param([Parameter(Mandatory)][string[]]$GitArgs, [switch]$AllowFailure)
            $previousEap = $ErrorActionPreference
            $ErrorActionPreference = 'Continue'
            try {
                $output = & git @GitArgs 2>&1
            } finally {
                $ErrorActionPreference = $previousEap
            }
            if ($LASTEXITCODE -ne 0 -and -not $AllowFailure) {
                Write-Log ('git {0} failed ({1}): {2}' -f ($GitArgs -join ' '), $LASTEXITCODE, ($output -join ' '))
                throw ('git {0} failed' -f ($GitArgs -join ' '))
            }
            return $output
        }

        function Push-Pending {
            <#
              Pushes whatever is not on the remote yet. Called on both paths,
              including "no changes": that is precisely the path a retry after
              a failed push takes, and skipping it would strand the commit
              locally forever.
            #>
            if ($NoPush) { return }

            Invoke-Git -GitArgs @('fetch', '--quiet', 'origin', 'main') -AllowFailure | Out-Null
            Invoke-Git -GitArgs @('rev-parse', '--verify', '--quiet', 'origin/main') -AllowFailure | Out-Null

            if ($LASTEXITCODE -eq 0) {
                $ahead = (Invoke-Git -GitArgs @('rev-list', '--count', 'origin/main..HEAD') -AllowFailure |
                          Select-Object -First 1)
                if ($LASTEXITCODE -eq 0 -and [int]$ahead -eq 0) { return }
                Write-Log ('pushing {0} pending commit(s)' -f $ahead)
            } else {
                Write-Log 'origin/main does not exist yet; pushing to create it'
            }

            Invoke-Git -GitArgs @('push', 'origin', 'main') -AllowFailure |
                ForEach-Object { Write-Log ('push: {0}' -f $_) }
            if ($LASTEXITCODE -ne 0) {
                # A plain retry only resolves a transient failure - the
                # network was down, the remote was briefly unreachable. It
                # can NEVER resolve a genuine divergence: origin/main
                # carrying commits this machine does not have, typically
                # from editing a file directly on GitHub, or from a second
                # machine sharing this same repository. Distinguish the two
                # so the log does not promise a self-resolution a divergence
                # cannot have. This script never merges, rebases, or
                # force-pushes on its own - CLAUDE.md reserves
                # history-rewriting git operations for an explicit request,
                # and an unattended hook is the last place to run one
                # regardless of how convenient it would be here.
                $behind = (Invoke-Git -GitArgs @('rev-list', '--count', 'HEAD..origin/main') -AllowFailure |
                           Select-Object -First 1)
                if ($LASTEXITCODE -eq 0 -and [int]$behind -gt 0) {
                    Write-Log ('DIVERGED: origin/main has {0} commit(s) this machine does not have; a plain push cannot resolve this and will keep failing every run. Commits stay local. Resolve by hand: fetch, inspect origin/main..HEAD and HEAD..origin/main, then merge or push --force-with-lease as appropriate.' -f $behind)
                } else {
                    Write-Log 'push failed; commits stay local and the next run retries'
                }
            }
        }

        Invoke-Git -GitArgs @('add', '-A') | Out-Null
        $staged = @(Invoke-Git -GitArgs @('-c', 'core.quotepath=false', 'diff', '--cached', '--name-only'))

        # Write-Registry always stamps a fresh 'updated', and every synced
        # entry would get a fresh lastSync - doing that unconditionally on
        # every run would make registry.json differ byte for byte between two
        # otherwise identical runs, staging a phantom change and breaking the
        # "no changes -> no commit" contract this script exists to honor.
        # $staged above already reflects any real mirrored-content change
        # (the mirror was synced before this point; registry.json itself has
        # not been touched yet this run), so the registry is rewritten only
        # when that is non-empty or a source's missing flag flipped -
        # property 2 requires the flag to be persisted even when nothing was
        # mirrored for it.
        if ($staged.Count -gt 0 -or $registryChanged) {
            foreach ($entry in @($registry.entries)) {
                if (-not $entry.missing) { $entry.lastSync = (Get-Date).ToString('o') }
            }
            Write-Registry -Registry $registry -Path $registryPath
            Invoke-Git -GitArgs @('add', '-A') | Out-Null
            $staged = @(Invoke-Git -GitArgs @('-c', 'core.quotepath=false', 'diff', '--cached', '--name-only'))
        }

        if ($staged.Count -eq 0) {
            Write-Log 'no changes'
            Push-Pending
            exit 0
        }

        foreach ($relative in $staged) {
            $full = Join-Path $Root $relative
            if (-not (Test-Path -LiteralPath $full -PathType Leaf)) { continue }   # deletion
            $hit = Test-SecretContent -Path $full
            if ($hit) {
                Invoke-Git -GitArgs @('reset', '-q') -AllowFailure | Out-Null
                Write-Log ('ABORT: pattern "{0}" matched in {1}' -f $hit, $relative)
                $exitCode = 1
                exit 1
            }
        }

        $message = 'backup: sync .claude config ({0} files) {1}' -f `
            $staged.Count, (Get-Date).ToString('yyyy-MM-dd HH:mm')
        Invoke-Git -GitArgs @('commit', '-q', '-m', $message) | Out-Null
        Write-Log ('committed: {0}' -f $message)

        Push-Pending
    } finally {
        Pop-Location
    }
} finally {
    Remove-Item -LiteralPath $lockPath -Force -ErrorAction SilentlyContinue
}

exit $exitCode
