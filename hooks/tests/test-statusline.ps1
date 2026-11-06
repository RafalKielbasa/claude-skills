[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'assert.ps1')
Reset-AssertFailureCount

Write-Host 'test-statusline' -ForegroundColor Cyan

$scriptPath = Join-Path (Split-Path -Parent $PSScriptRoot) 'statusline-git.mjs'
# The space mirrors real repositories such as "D:\Praca\Devstock\Baza wiedzy".
$sandbox = Join-Path $env:TEMP ('claude statusline ' + [guid]::NewGuid().ToString('N'))

function Invoke-StatusLine {
    # Runs the script the way Claude Code does: session JSON on stdin, one line on stdout.
    param([Parameter(Mandatory)][string]$Dir)
    $json = @{ cwd = $Dir; workspace = @{ current_dir = $Dir; project_dir = $Dir } } | ConvertTo-Json -Compress
    $out = $json | & node $scriptPath
    return [pscustomobject]@{ ExitCode = $LASTEXITCODE; Output = ($out -join "`n") }
}

function Invoke-StatusLineWithContext {
    # Goes through ProcessStartInfo: the bar's block characters are UTF-8 on stdout, while a PowerShell
    # pipe decodes with the console code page, which depends on the machine.
    param([Parameter(Mandatory)][string]$Dir, [Parameter(Mandatory)][hashtable]$Context)
    $json = @{ workspace = @{ current_dir = $Dir }; context_window = $Context } | ConvertTo-Json -Compress
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
    $startInfo = New-Object System.Diagnostics.ProcessStartInfo
    $startInfo.FileName = 'node'
    $startInfo.Arguments = '"' + $scriptPath + '"'
    $startInfo.UseShellExecute = $false
    $startInfo.RedirectStandardInput = $true
    $startInfo.RedirectStandardOutput = $true
    $startInfo.StandardOutputEncoding = [System.Text.Encoding]::UTF8
    $process = [System.Diagnostics.Process]::Start($startInfo)
    $process.StandardInput.BaseStream.Write($bytes, 0, $bytes.Length)
    $process.StandardInput.Close()
    $output = $process.StandardOutput.ReadToEnd().Trim()
    $process.WaitForExit()
    return $output
}

function Get-ExpectedContext {
    # Code points, not literals: Windows PowerShell reads a .ps1 without a BOM in the ANSI code page.
    param([Parameter(Mandatory)][int]$Filled, [Parameter(Mandatory)][string]$Color, [Parameter(Mandatory)][string]$Label)
    $esc = [char]27
    $block = [string][char]0x2586
    return "$esc[$($Color)mcontext [" + ($block * $Filled) + "$esc[38;5;240m" + ($block * (10 - $Filled)) + "$esc[$($Color)m] $Label$esc[0m"
}

function New-Repo {
    param([Parameter(Mandatory)][string]$Name, [string]$Branch = 'main')
    $dir = Join-Path $sandbox $Name
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
    git -C $dir init -q -b $Branch
    git -C $dir config user.email 'test@example.invalid'
    git -C $dir config user.name 'test'
    git -C $dir config core.autocrlf false
    return $dir
}

function Write-RepoFile {
    param([Parameter(Mandatory)][string]$Repo, [Parameter(Mandatory)][string]$Path, [string]$Text = 'base')
    $full = Join-Path $Repo $Path
    New-Item -ItemType Directory -Path (Split-Path -Parent $full) -Force | Out-Null
    Set-Content -LiteralPath $full -Value $Text -Encoding ASCII
}

function Add-BaseCommit {
    param([Parameter(Mandatory)][string]$Repo, [Parameter(Mandatory)][string[]]$Files)
    foreach ($file in $Files) { Write-RepoFile -Repo $Repo -Path $file }
    git -C $Repo add -A
    git -C $Repo commit -q -m 'base'
}

try {
    New-Item -ItemType Directory -Path $sandbox -Force | Out-Null

    # --- each of the three counters, with values that differ so a swap shows ---
    $repo = New-Repo -Name 'counts'
    Add-BaseCommit -Repo $repo -Files @('a', 'b', 'c', 'd')
    Write-RepoFile -Repo $repo -Path 'a' -Text 'changed'
    git -C $repo add a
    git -C $repo rm -q b
    # Different content, or git pairs this file with the deletion of b and reports one rename.
    Write-RepoFile -Repo $repo -Path 'added' -Text 'unrelated to any committed file'
    git -C $repo add added
    Write-RepoFile -Repo $repo -Path 'c' -Text 'changed'
    Remove-Item -LiteralPath (Join-Path $repo 'd')
    # Three of the untracked files share a directory: the counter is files, not git's collapsed entries.
    Write-RepoFile -Repo $repo -Path 'dir\one'
    Write-RepoFile -Repo $repo -Path 'dir\two'
    Write-RepoFile -Repo $repo -Path 'dir\sub\three'
    Write-RepoFile -Repo $repo -Path 'top'
    $result = Invoke-StatusLine -Dir $repo
    Assert-Equal -Expected 0 -Actual $result.ExitCode -Because 'a repository with changes exits 0'
    Assert-Equal -Expected "main | staged 3 | unstaged 2 | untracked 4 | no remote | $repo" -Actual $result.Output -Because 'staged, unstaged and untracked are counted per file'

    # --- a file staged and then edited again belongs to both counters ---
    $repo = New-Repo -Name 'both'
    Add-BaseCommit -Repo $repo -Files @('a')
    Write-RepoFile -Repo $repo -Path 'a' -Text 'staged edit'
    git -C $repo add a
    Write-RepoFile -Repo $repo -Path 'a' -Text 'second edit'
    Assert-Equal -Expected "main | staged 1 | unstaged 1 | untracked 0 | no remote | $repo" -Actual (Invoke-StatusLine -Dir $repo).Output -Because 'a file changed in both index and worktree counts in both'

    # --- a rename is reported on its own porcelain line type ---
    $repo = New-Repo -Name 'rename'
    Add-BaseCommit -Repo $repo -Files @('old')
    git -C $repo mv old new
    Assert-Equal -Expected "main | staged 1 | unstaged 0 | untracked 0 | no remote | $repo" -Actual (Invoke-StatusLine -Dir $repo).Output -Because 'a staged rename counts as one staged file'

    # --- branch naming ---
    $repo = New-Repo -Name 'branch'
    Add-BaseCommit -Repo $repo -Files @('a')
    git -C $repo checkout -q -b feature/status-line
    Assert-Equal -Expected "feature/status-line | staged 0 | unstaged 0 | untracked 0 | no remote | $repo" -Actual (Invoke-StatusLine -Dir $repo).Output -Because 'the current branch name is shown whole, also when it is clean'

    git -C $repo checkout -q --detach
    $sha = (git -C $repo rev-parse --short=7 HEAD)
    Assert-Equal -Expected "detached $sha | staged 0 | unstaged 0 | untracked 0 | no remote | $repo" -Actual (Invoke-StatusLine -Dir $repo).Output -Because 'a detached HEAD shows the short commit instead of a branch'

    $repo = New-Repo -Name 'unborn' -Branch 'trunk'
    Write-RepoFile -Repo $repo -Path 'staged'
    git -C $repo add staged
    Write-RepoFile -Repo $repo -Path 'loose'
    Assert-Equal -Expected "trunk | staged 1 | unstaged 0 | untracked 1 | no remote | $repo" -Actual (Invoke-StatusLine -Dir $repo).Output -Because 'a repository without commits still shows its branch and counts'

    # --- a merge conflict must not read as a clean tree ---
    $repo = New-Repo -Name 'conflict'
    Add-BaseCommit -Repo $repo -Files @('a')
    git -C $repo checkout -q -b side
    Write-RepoFile -Repo $repo -Path 'a' -Text 'side'
    git -C $repo commit -q -am 'side'
    git -C $repo checkout -q main
    Write-RepoFile -Repo $repo -Path 'a' -Text 'main'
    git -C $repo commit -q -am 'main'
    git -C $repo merge -q side | Out-Null
    Assert-Equal -Expected "main | staged 0 | unstaged 1 | untracked 0 | no remote | $repo" -Actual (Invoke-StatusLine -Dir $repo).Output -Because 'an unmerged file counts as unstaged'

    # --- the remote shows as owner/name, whatever form its URL takes ---
    $repo = New-Repo -Name 'remote'
    Add-BaseCommit -Repo $repo -Files @('a')
    git -C $repo remote add origin 'https://github.com/placeholder/placeholder.git'
    $remoteCases = @(
        @{ Url = 'git@github.com:devstock-org/devstock-team.git'; Want = 'devstock-org/devstock-team'; Because = 'an scp-like URL' }
        @{ Url = 'https://github.com/owner/name.git'; Want = 'owner/name'; Because = 'an https URL' }
        @{ Url = 'https://github.com/owner/name'; Want = 'owner/name'; Because = 'a URL without the .git suffix' }
        @{ Url = 'https://github.com/owner/name.git/'; Want = 'owner/name'; Because = 'a URL with a trailing slash' }
        @{ Url = 'ssh://git@example.com:2222/owner/name.git'; Want = 'owner/name'; Because = 'an ssh URL with a port' }
        @{ Url = 'https://user:s3cret@github.com/owner/name.git'; Want = 'owner/name'; Because = 'a URL with credentials' }
        @{ Url = 'https://user:s3cret@example.com/name.git'; Want = 'name'; Because = 'a one-segment path after credentials' }
        @{ Url = 'C:/repos/team/name.git'; Want = 'team/name'; Because = 'a local path' }
    )
    foreach ($case in $remoteCases) {
        git -C $repo remote set-url origin $case.Url
        Assert-Equal -Expected "main | staged 0 | unstaged 0 | untracked 0 | $($case.Want) | $repo" -Actual (Invoke-StatusLine -Dir $repo).Output -Because "$($case.Because) shows as $($case.Want)"
    }

    # --- the remote the branch tracks wins over origin ---
    git -C $repo remote set-url origin 'https://github.com/origin-owner/name.git'
    git -C $repo remote add fork 'https://github.com/fork-owner/name.git'
    git -C $repo config branch.main.remote fork
    git -C $repo config branch.main.merge refs/heads/main
    Assert-Equal -Expected "main | staged 0 | unstaged 0 | untracked 0 | fork-owner/name | $repo" -Actual (Invoke-StatusLine -Dir $repo).Output -Because 'the remote tracked by the branch is shown'

    # --- no repository: the directory is still known ---
    $plain = Join-Path $sandbox 'plain'
    New-Item -ItemType Directory -Path $plain -Force | Out-Null
    $result = Invoke-StatusLine -Dir $plain
    Assert-Equal -Expected 0 -Actual $result.ExitCode -Because 'a directory outside any repository exits 0'
    Assert-Equal -Expected $plain -Actual $result.Output -Because 'a directory outside any repository shows only the directory'

    # --- unreadable input falls back to the working directory ---
    $repo = New-Repo -Name 'badinput'
    Add-BaseCommit -Repo $repo -Files @('a')
    Push-Location $repo
    try {
        $out = 'not json' | & node $scriptPath
        $code = $LASTEXITCODE
    } finally {
        Pop-Location
    }
    Assert-Equal -Expected 0 -Actual $code -Because 'malformed stdin exits 0'
    Assert-Equal -Expected "main | staged 0 | unstaged 0 | untracked 0 | no remote | $repo" -Actual ($out -join "`n") -Because 'malformed stdin uses the working directory'

    # --- a BOM before the JSON: a PowerShell pipe adds one only under a UTF-8 console, so the bytes are explicit ---
    $repo = New-Repo -Name 'bom'
    Add-BaseCommit -Repo $repo -Files @('a')
    $json = @{ workspace = @{ current_dir = $repo } } | ConvertTo-Json -Compress
    $bytes = (New-Object System.Text.UTF8Encoding($true)).GetPreamble() + [System.Text.Encoding]::UTF8.GetBytes($json)
    $startInfo = New-Object System.Diagnostics.ProcessStartInfo
    $startInfo.FileName = 'node'
    $startInfo.Arguments = '"' + $scriptPath + '"'
    $startInfo.UseShellExecute = $false
    $startInfo.RedirectStandardInput = $true
    $startInfo.RedirectStandardOutput = $true
    $process = [System.Diagnostics.Process]::Start($startInfo)
    $process.StandardInput.BaseStream.Write($bytes, 0, $bytes.Length)
    $process.StandardInput.Close()
    $output = $process.StandardOutput.ReadToEnd().Trim()
    $process.WaitForExit()
    Assert-Equal -Expected "main | staged 0 | unstaged 0 | untracked 0 | no remote | $repo" -Actual $output -Because 'a BOM before the JSON does not lose the session directory'

    # --- JSON that parses but holds no object falls back like malformed input ---
    Push-Location $repo
    try {
        $out = 'null' | & node $scriptPath
        $code = $LASTEXITCODE
    } finally {
        Pop-Location
    }
    Assert-Equal -Expected 0 -Actual $code -Because 'a JSON null on stdin exits 0'
    Assert-Equal -Expected "main | staged 0 | unstaged 0 | untracked 0 | no remote | $repo" -Actual ($out -join "`n") -Because 'a JSON null on stdin uses the working directory'

    # --- the context gauge: filled blocks are what is still available, and the color follows them ---
    $repo = New-Repo -Name 'context'
    Add-BaseCommit -Repo $repo -Files @('a')
    $git = "main | staged 0 | unstaged 0 | untracked 0 | no remote | $repo"
    $contextCases = @(
        @{ Remaining = 100; Filled = 10; Color = '38;5;28'; Percent = '100%'; Because = 'an untouched window is a full green bar' }
        @{ Remaining = 51; Filled = 5; Color = '38;5;28'; Percent = '51%'; Because = 'just above half stays green' }
        @{ Remaining = 50; Filled = 5; Color = '33'; Percent = '50%'; Because = 'half turns yellow' }
        @{ Remaining = 21; Filled = 2; Color = '33'; Percent = '21%'; Because = 'just above a fifth stays yellow' }
        @{ Remaining = 20; Filled = 2; Color = '31'; Percent = '20%'; Because = 'a fifth turns red' }
        @{ Remaining = 0; Filled = 0; Color = '31'; Percent = '0%'; Because = 'a used-up window is an empty red bar' }
        @{ Remaining = 90.4; Filled = 9; Color = '38;5;28'; Percent = '90%'; Because = 'a fractional percentage is rounded' }
        @{ Remaining = 150; Filled = 10; Color = '38;5;28'; Percent = '100%'; Because = 'a percentage above the range is clamped, so the bar width holds' }
        @{ Remaining = -3; Filled = 0; Color = '31'; Percent = '0%'; Because = 'a percentage below the range is clamped, so the bar width holds' }
    )
    foreach ($case in $contextCases) {
        $expected = (Get-ExpectedContext -Filled $case.Filled -Color $case.Color -Label "$($case.Percent) left of 1M") + "`n$git"
        Assert-Equal -Expected $expected -Actual (Invoke-StatusLineWithContext -Dir $repo -Context @{ remaining_percentage = $case.Remaining; context_window_size = 1000000 }) -Because $case.Because
    }

    $expected = (Get-ExpectedContext -Filled 9 -Color '38;5;28' -Label '90% left of 200k') + "`n$git"
    Assert-Equal -Expected $expected -Actual (Invoke-StatusLineWithContext -Dir $repo -Context @{ remaining_percentage = 90; context_window_size = 200000 }) -Because 'a window below a million shows in thousands'

    $expected = (Get-ExpectedContext -Filled 9 -Color '38;5;28' -Label '90% left') + "`n$git"
    Assert-Equal -Expected $expected -Actual (Invoke-StatusLineWithContext -Dir $repo -Context @{ remaining_percentage = 90 }) -Because 'an unknown window size leaves only the percentage'

    Assert-Equal -Expected $git -Actual (Invoke-StatusLineWithContext -Dir $repo -Context @{ remaining_percentage = $null; context_window_size = 1000000 }) -Because 'a null percentage early in a session shows no gauge rather than a false full bar'

    $plain = Join-Path $sandbox 'plain-context'
    New-Item -ItemType Directory -Path $plain -Force | Out-Null
    $expected = (Get-ExpectedContext -Filled 9 -Color '38;5;28' -Label '90% left of 1M') + "`n$plain"
    Assert-Equal -Expected $expected -Actual (Invoke-StatusLineWithContext -Dir $plain -Context @{ remaining_percentage = 90; context_window_size = 1000000 }) -Because 'the gauge also shows outside a repository'

    # --- the script runs every few seconds next to commits made by other tools ---
    $repo = New-Repo -Name 'index'
    Add-BaseCommit -Repo $repo -Files @('a')
    # A new mtime with the same content is what makes a plain `git status` rewrite the index.
    (Get-Item -LiteralPath (Join-Path $repo 'a')).LastWriteTime = (Get-Date).AddMinutes(-5)
    $indexPath = Join-Path $repo '.git\index'
    $before = (Get-FileHash -LiteralPath $indexPath).Hash
    Invoke-StatusLine -Dir $repo | Out-Null
    Assert-Equal -Expected $before -Actual (Get-FileHash -LiteralPath $indexPath).Hash -Because 'reading the status leaves the index untouched'

    # --- porcelain output above 1 MiB, the default output limit of spawnSync ---
    $repo = New-Repo -Name 'many'
    $prefix = 'x' * 140
    foreach ($i in 1..7500) {
        [System.IO.File]::WriteAllBytes((Join-Path $repo "$prefix$i"), [byte[]]@())
    }
    Assert-Equal -Expected "main | staged 0 | unstaged 0 | untracked 7500 | no remote | $repo" -Actual (Invoke-StatusLine -Dir $repo).Output -Because 'a very long status is still counted'
} finally {
    Remove-Item -LiteralPath $sandbox -Recurse -Force -ErrorAction SilentlyContinue
}

exit (Get-AssertFailureCount)
