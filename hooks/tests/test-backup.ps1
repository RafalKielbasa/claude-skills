[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'assert.ps1')
Reset-AssertFailureCount

Write-Host 'test-backup' -ForegroundColor Cyan

$scriptPath = Join-Path (Split-Path -Parent $PSScriptRoot) 'backup-claude.ps1'
$sandbox    = Join-Path $env:TEMP ("claude-backup-run-" + [guid]::NewGuid().ToString('N'))
$repo       = Join-Path $sandbox 'repo'
$project    = Join-Path $sandbox 'projects\demo'
$mirrorRoot = Join-Path $repo 'backups\claude-dirs'

function Invoke-Backup {
    param([string[]]$ExtraArgs = @())
    $argv = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $scriptPath,
              '-Root', $repo, '-NoPush', '-SearchRoot', $sandbox) + $ExtraArgs
    $out = & powershell.exe @argv 2>&1
    return [pscustomobject]@{ ExitCode = $LASTEXITCODE; Output = ($out -join "`n") }
}

function Invoke-BackupWithPush {
    param([string[]]$ExtraArgs = @())
    $argv = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $scriptPath,
              '-Root', $repo, '-SearchRoot', $sandbox) + $ExtraArgs
    $out = & powershell.exe @argv 2>&1
    return [pscustomobject]@{ ExitCode = $LASTEXITCODE; Output = ($out -join "`n") }
}

function Get-CommitCount {
    Push-Location $repo
    try { return @(git log --oneline).Count } finally { Pop-Location }
}

function Get-MirroredSkillCount {
    return @(Get-ChildItem -LiteralPath $mirrorRoot -Recurse -Filter 'SKILL.md' -ErrorAction SilentlyContinue).Count
}

try {
    New-Item -ItemType Directory -Path (Join-Path $repo 'backups') -Force | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $project '.claude\skills\demo') -Force | Out-Null
    Set-Content -LiteralPath (Join-Path $project '.claude\skills\demo\SKILL.md') -Value 'demo skill' -Encoding UTF8

    # a bare repository standing in for GitHub
    $remote = Join-Path $sandbox 'remote.git'
    git init -q --bare $remote

    Push-Location $repo
    git init -q
    git checkout -q -b main
    git config user.name 'test'; git config user.email 'test@example.com'
    git remote add origin $remote
    Set-Content -LiteralPath (Join-Path $repo '.gitignore') -Value "/backups/sync.log`n/backups/.sync.lock" -Encoding UTF8
    git add -A; git commit -q -m 'init'
    Pop-Location

    # --- first run discovers the project and commits ---
    $before = Get-CommitCount
    $first = Invoke-Backup -ExtraArgs @('-Rescan')
    Assert-Equal -Expected 0 -Actual $first.ExitCode -Because 'the first run succeeds'
    Assert-Equal -Expected 1 -Actual ((Get-CommitCount) - $before) -Because 'the first run creates exactly one commit'
    Assert-True -Condition (Test-Path -LiteralPath (Join-Path $mirrorRoot 'registry.json')) -Because 'the registry is written'
    Assert-Equal -Expected 1 -Actual (Get-MirroredSkillCount) -Because 'the discovered skill is mirrored'

    # --- second run with nothing changed creates no commit ---
    $before = Get-CommitCount
    $second = Invoke-Backup
    Assert-Equal -Expected 0 -Actual $second.ExitCode -Because 'a no-op run succeeds'
    Assert-Equal -Expected 0 -Actual ((Get-CommitCount) - $before) -Because 'an unchanged run adds no commit'

    # --- a fresh lock stops the run without committing ---
    Set-Content -LiteralPath (Join-Path $project '.claude\skills\demo\SKILL.md') -Value 'changed' -Encoding UTF8
    Set-Content -LiteralPath (Join-Path $repo 'backups\.sync.lock') -Value '' -Encoding UTF8
    $before = Get-CommitCount
    $locked = Invoke-Backup
    Assert-Equal -Expected 0 -Actual $locked.ExitCode -Because 'a locked run exits cleanly'
    Assert-Equal -Expected 0 -Actual ((Get-CommitCount) - $before) -Because 'a locked run adds no commit'

    # --- a lock older than 10 minutes is discarded, not obeyed ---
    (Get-Item -LiteralPath (Join-Path $repo 'backups\.sync.lock')).LastWriteTime = (Get-Date).AddMinutes(-30)
    $before = Get-CommitCount
    $stale = Invoke-Backup
    Assert-Equal -Expected 0 -Actual $stale.ExitCode -Because 'a stale lock does not block the run'
    Assert-Equal -Expected 1 -Actual ((Get-CommitCount) - $before) -Because 'a stale lock is discarded and the pending change is committed'
    Assert-True -Condition (-not (Test-Path -LiteralPath (Join-Path $repo 'backups\.sync.lock'))) -Because 'the lock is released when the run ends'

    # --- deleting one file in a live source removes it from the mirror ---
    New-Item -ItemType Directory -Path (Join-Path $project '.claude\skills\second') -Force | Out-Null
    Set-Content -LiteralPath (Join-Path $project '.claude\skills\second\SKILL.md') -Value 'second' -Encoding UTF8
    Invoke-Backup | Out-Null
    Assert-Equal -Expected 2 -Actual (Get-MirroredSkillCount) -Because 'a new skill in a live source is mirrored'
    Remove-Item -LiteralPath (Join-Path $project '.claude\skills\second') -Recurse -Force
    Invoke-Backup | Out-Null
    Assert-Equal -Expected 1 -Actual (Get-MirroredSkillCount) -Because 'deleting a skill in a live source removes it from the mirror'

    # --- a secret in a source file aborts before committing ---
    Set-Content -LiteralPath (Join-Path $project '.claude\skills\demo\SKILL.md') `
        -Value ('token = "' + 'sk-ant-' + 'api03-' + ('z' * 40) + '"') -Encoding UTF8
    $before = Get-CommitCount
    $blocked = Invoke-Backup
    Assert-Equal -Expected 1 -Actual $blocked.ExitCode -Because 'a secret aborts the run'
    Assert-Equal -Expected 0 -Actual ((Get-CommitCount) - $before) -Because 'no commit is made when a secret is found'
    Push-Location $repo
    $stagedAfterSecret = @(git diff --cached --name-only).Count
    Pop-Location
    Assert-Equal -Expected 0 -Actual $stagedAfterSecret -Because 'the index is reset after an abort'
    Assert-True -Condition ((Get-Content -LiteralPath (Join-Path $repo 'backups\sync.log') -Raw) -match 'ABORT') -Because 'the abort is logged'

    # --- a commit made while the remote was unreachable is pushed by a later run ---
    Set-Content -LiteralPath (Join-Path $project '.claude\skills\demo\SKILL.md') -Value 'clean again' -Encoding UTF8
    Push-Location $repo; git remote set-url origin (Join-Path $sandbox 'no-such-remote.git'); Pop-Location
    $failedPush = Invoke-BackupWithPush
    Assert-Equal -Expected 0 -Actual $failedPush.ExitCode -Because 'a failed push does not fail the run'
    Assert-True -Condition ((Get-Content -LiteralPath (Join-Path $repo 'backups\sync.log') -Raw) -match 'push failed') -Because 'the failed push is logged'

    Push-Location $repo; git remote set-url origin $remote; Pop-Location
    $retry = Invoke-BackupWithPush        # nothing changed since: this is the no-changes path
    Assert-Equal -Expected 0 -Actual $retry.ExitCode -Because 'the retry run succeeds'
    Push-Location $repo
    $remoteHead = @(git ls-remote origin refs/heads/main)
    Pop-Location
    Assert-True -Condition ($remoteHead.Count -gt 0) -Because 'the pending commit reaches the remote on a no-changes run'

    # --- a genuine divergence is diagnosed distinctly from a transient failure ---
    # Simulates a commit landing on origin from somewhere else - a second
    # machine, or an edit made directly on GitHub.com - while this machine
    # also has an unpushed local commit. A plain `git push` can never
    # resolve this; the log must say so rather than promising a retry will
    # succeed, since nothing here ever merges or rebases automatically.
    $otherClone = Join-Path $sandbox 'other-clone'
    git clone -q $remote $otherClone
    Push-Location $otherClone
    # A bare repo's HEAD symbolic ref is not updated by a push - it still
    # points at whatever git init picked as the default branch, which may
    # not exist. Left implicit, the clone lands on no checked-out branch at
    # all, and the commit below goes nowhere near `main`.
    git checkout -q -b main origin/main
    git config user.name 'other'; git config user.email 'other@example.com'
    # Two commits on the origin side, one on the local side: deliberately
    # asymmetric. $ahead and $behind must be computed from opposite ranges
    # (origin/main..HEAD vs HEAD..origin/main); with a symmetric 1-and-1
    # split, a copy-paste bug that computed $behind from the wrong range
    # would coincidentally land on the same value and this test would not
    # notice. With 2-vs-1, that mistake reports the wrong count, and the
    # assertion below checks the exact count, not just the word DIVERGED.
    Set-Content -LiteralPath (Join-Path $otherClone 'from-elsewhere-1.txt') -Value 'elsewhere' -Encoding UTF8
    git add -A; git commit -q -m 'from elsewhere 1'
    Set-Content -LiteralPath (Join-Path $otherClone 'from-elsewhere-2.txt') -Value 'elsewhere' -Encoding UTF8
    git add -A; git commit -q -m 'from elsewhere 2'
    git push -q origin main
    Pop-Location

    Set-Content -LiteralPath (Join-Path $project '.claude\skills\demo\SKILL.md') -Value 'local change during divergence' -Encoding UTF8
    $diverged = Invoke-BackupWithPush
    Assert-Equal -Expected 0 -Actual $diverged.ExitCode -Because 'a diverged push does not fail the run'
    Assert-True -Condition ((Get-Content -LiteralPath (Join-Path $repo 'backups\sync.log') -Raw) -match 'DIVERGED: origin/main has 2 commit\(s\)') -Because 'the diagnosis reports the correct, larger side of an asymmetric divergence - not $ahead mistaken for $behind'

    # --- a hand-started, conflicted merge is never finalized by the hook ---
    Push-Location $repo
    $before = Get-CommitCount
    git checkout -q -b conflict-side
    Set-Content -LiteralPath (Join-Path $repo 'CLAUDE.md') -Value 'side version' -Encoding UTF8
    git add -A; git commit -q -m 'side change'
    git checkout -q main
    Set-Content -LiteralPath (Join-Path $repo 'CLAUDE.md') -Value 'main version' -Encoding UTF8
    git add -A; git commit -q -m 'main change'
    git merge conflict-side -q 2>&1 | Out-Null
    $mergeHeadBefore = Test-Path -LiteralPath (Join-Path $repo '.git\MERGE_HEAD')
    Pop-Location
    Assert-True -Condition $mergeHeadBefore -Because 'the fixture really is mid-merge before the hook runs'

    $midMerge = Invoke-Backup
    Assert-Equal -Expected 0 -Actual $midMerge.ExitCode -Because 'a mid-merge run exits cleanly rather than erroring'
    Assert-True -Condition (Test-Path -LiteralPath (Join-Path $repo '.git\MERGE_HEAD')) -Because 'MERGE_HEAD survives - the conflict is not finalized'
    # +1, not +2: "side change" lands on the conflict-side branch, not on
    # main - git log on main only ever saw "main change" join its history.
    # The failed merge attempt never advanced main's ref, so this count is
    # exactly what proves the hook added nothing on top of it.
    Assert-Equal -Expected ($before + 1) -Actual (Get-CommitCount) -Because 'no merge commit is created on top of the one real setup commit on main'
    Assert-True -Condition ((Get-Content -LiteralPath (Join-Path $repo 'backups\sync.log') -Raw) -match 'mid-MERGE_HEAD') -Because 'the skip is logged with the reason'

    Push-Location $repo
    git merge --abort
    git checkout -q main
    git branch -q -D conflict-side
    Pop-Location

    # --- a vanished source keeps its mirror and is flagged in the registry ---
    Remove-Item -LiteralPath (Join-Path $project '.claude') -Recurse -Force
    Invoke-Backup -ExtraArgs @('-Rescan') | Out-Null
    Assert-Equal -Expected 1 -Actual (Get-MirroredSkillCount) -Because 'deleting the source does not delete the backup'
    $registry = Get-Content -LiteralPath (Join-Path $mirrorRoot 'registry.json') -Raw | ConvertFrom-Json
    Assert-Equal -Expected 1 -Actual @($registry.entries | Where-Object { $_.missing }).Count -Because 'the vanished source is flagged missing in the registry'
} finally {
    Remove-Item -LiteralPath $sandbox -Recurse -Force -ErrorAction SilentlyContinue
}

exit (Get-AssertFailureCount)
