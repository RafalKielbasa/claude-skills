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
# Keeps the test away from the directories recorded by real sessions.
$env:STATUSLINE_STATE_DIR = Join-Path $sandbox 'state'

function Remove-Ansi {
    # Most assertions are about what a line says; the colors have cases of their own.
    param([string]$Text)
    return $Text -replace "$([char]27)\[[0-9;]*m", ''
}

function Format-Colored {
    param([Parameter(Mandatory)][string]$Color, [Parameter(Mandatory)][string]$Text)
    return "$([char]27)[$($Color)m$Text$([char]27)[0m"
}

function Invoke-StatusLine {
    # Runs the script the way Claude Code does: session JSON on stdin, the status on stdout.
    param([Parameter(Mandatory)][string]$Dir)
    $json = @{ cwd = $Dir; workspace = @{ current_dir = $Dir; project_dir = $Dir } } | ConvertTo-Json -Compress
    $out = $json | & node $scriptPath
    return [pscustomobject]@{ ExitCode = $LASTEXITCODE; Output = (Remove-Ansi ($out -join "`n")) }
}

function Invoke-StatusLineWithContext {
    param([Parameter(Mandatory)][string]$Dir, [Parameter(Mandatory)][hashtable]$Context)
    return Invoke-StatusLineJson -Json (@{ workspace = @{ current_dir = $Dir }; context_window = $Context } | ConvertTo-Json -Compress)
}

function Invoke-StatusLineInDirs {
    param([Parameter(Mandatory)][string]$Terminal, [Parameter(Mandatory)][string]$Session, [string]$SessionId = 'no-edits')
    return Invoke-StatusLineJson -Json (@{ session_id = $SessionId; workspace = @{ current_dir = $Session; project_dir = $Terminal } } | ConvertTo-Json -Compress)
}

function Invoke-RecordEdit {
    # Runs the script the way the PostToolUse hook does.
    param([Parameter(Mandatory)][string]$SessionId, [Parameter(Mandatory)][hashtable]$ToolInput, [hashtable]$ToolResponse = @{})
    $json = @{ session_id = $SessionId; hook_event_name = 'PostToolUse'; tool_input = $ToolInput; tool_response = $ToolResponse } | ConvertTo-Json -Compress -Depth 4
    Invoke-StatusLineJson -Json $json -Arguments '--record-edit' | Out-Null
}

function Get-EditedLine {
    # The hook stores the path git prints, with forward slashes.
    param([Parameter(Mandatory)][string]$Repo)
    $top = git -C $Repo rev-parse --show-toplevel
    return Format-Colored -Color '33' -Text "main | staged 0 | unstaged 0 | untracked 0 | no remote | $top"
}

function Invoke-StatusLineJson {
    # Goes through ProcessStartInfo: the bar's block characters are UTF-8 on stdout, while a PowerShell
    # pipe decodes with the console code page, which depends on the machine.
    param([Parameter(Mandatory)][string]$Json, [string]$Arguments = '')
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($Json)
    $startInfo = New-Object System.Diagnostics.ProcessStartInfo
    $startInfo.FileName = 'node'
    $startInfo.Arguments = '"' + $scriptPath + '" ' + $Arguments
    $startInfo.UseShellExecute = $false
    $startInfo.RedirectStandardInput = $true
    $startInfo.RedirectStandardOutput = $true
    $startInfo.StandardOutputEncoding = [System.Text.Encoding]::UTF8
    $process = [System.Diagnostics.Process]::Start($startInfo)
    $process.StandardInput.BaseStream.Write($bytes, 0, $bytes.Length)
    $process.StandardInput.Close()
    $output = $process.StandardOutput.ReadToEnd().Trim()
    $process.WaitForExit()
    $script:LastNodeExit = $process.ExitCode
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
    Assert-Equal -Expected "main | staged 0 | unstaged 0 | untracked 0 | no remote | $repo" -Actual (Remove-Ansi ($out -join "`n")) -Because 'malformed stdin uses the working directory'

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
    Assert-Equal -Expected "main | staged 0 | unstaged 0 | untracked 0 | no remote | $repo" -Actual (Remove-Ansi $output) -Because 'a BOM before the JSON does not lose the session directory'

    # --- JSON that parses but holds no object falls back like malformed input ---
    Push-Location $repo
    try {
        $out = 'null' | & node $scriptPath
        $code = $LASTEXITCODE
    } finally {
        Pop-Location
    }
    Assert-Equal -Expected 0 -Actual $code -Because 'a JSON null on stdin exits 0'
    Assert-Equal -Expected "main | staged 0 | unstaged 0 | untracked 0 | no remote | $repo" -Actual (Remove-Ansi ($out -join "`n")) -Because 'a JSON null on stdin uses the working directory'

    # --- the context gauge: filled blocks are what is still available, and the color follows them ---
    $repo = New-Repo -Name 'context'
    Add-BaseCommit -Repo $repo -Files @('a')
    $git = Format-Colored -Color '38;5;28' -Text "main | staged 0 | unstaged 0 | untracked 0 | no remote | $repo"
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
    $expected = (Get-ExpectedContext -Filled 9 -Color '38;5;28' -Label '90% left of 1M') + "`n" + (Format-Colored -Color '38;5;28' -Text $plain)
    Assert-Equal -Expected $expected -Actual (Invoke-StatusLineWithContext -Dir $plain -Context @{ remaining_percentage = 90; context_window_size = 1000000 }) -Because 'the gauge also shows outside a repository'

    # --- a session away from the terminal: green for the terminal's working tree, yellow for the session's ---
    $terminalRepo = New-Repo -Name 'terminal'
    Add-BaseCommit -Repo $terminalRepo -Files @('a')
    Write-RepoFile -Repo $terminalRepo -Path 'new'
    $sessionRepo = New-Repo -Name 'session'
    Add-BaseCommit -Repo $sessionRepo -Files @('a')
    git -C $sessionRepo checkout -q -b feature
    Write-RepoFile -Repo $sessionRepo -Path 'a' -Text 'changed'
    git -C $sessionRepo add a
    $terminalLine = Format-Colored -Color '38;5;28' -Text "main | staged 0 | unstaged 0 | untracked 1 | no remote | $terminalRepo"
    $sessionLine = Format-Colored -Color '33' -Text "feature | staged 1 | unstaged 0 | untracked 0 | no remote | $sessionRepo"

    Assert-Equal -Expected $terminalLine -Actual (Invoke-StatusLineInDirs -Terminal $terminalRepo -Session $terminalRepo) -Because 'a session in the terminal directory is one green line'

    Assert-Equal -Expected "$terminalLine`n$sessionLine" -Actual (Invoke-StatusLineInDirs -Terminal $terminalRepo -Session $sessionRepo) -Because 'a session in another repository adds a yellow line below the green one'

    $worktree = Join-Path $sandbox 'linked worktree'
    git -C $terminalRepo worktree add -q -b linked $worktree
    $worktreeLine = Format-Colored -Color '33' -Text "linked | staged 0 | unstaged 0 | untracked 0 | no remote | $worktree"
    Assert-Equal -Expected "$terminalLine`n$worktreeLine" -Actual (Invoke-StatusLineInDirs -Terminal $terminalRepo -Session $worktree) -Because 'a linked worktree of the same repository is another working tree'

    # An empty directory: git does not see it, so the counters stay those of the repository.
    $subdir = Join-Path $terminalRepo 'tools'
    New-Item -ItemType Directory -Path $subdir -Force | Out-Null
    $subdirLine = Format-Colored -Color '38;5;28' -Text "main | staged 0 | unstaged 0 | untracked 1 | no remote | $subdir"
    Assert-Equal -Expected $subdirLine -Actual (Invoke-StatusLineInDirs -Terminal $terminalRepo -Session $subdir) -Because 'a subdirectory of the terminal repository has the same parameters, so it stays one green line'

    $otherDriveCase = $terminalRepo.Substring(0, 1).ToLower() + $terminalRepo.Substring(1)
    Assert-Equal -Expected $terminalLine -Actual (Invoke-StatusLineInDirs -Terminal $otherDriveCase -Session $terminalRepo) -Because 'a drive letter in the other case is the same directory'

    $plainTerminal = Join-Path $sandbox 'plain-terminal'
    New-Item -ItemType Directory -Path $plainTerminal -Force | Out-Null
    $expected = (Format-Colored -Color '38;5;28' -Text $plainTerminal) + "`n$sessionLine"
    Assert-Equal -Expected $expected -Actual (Invoke-StatusLineInDirs -Terminal $plainTerminal -Session $sessionRepo) -Because 'a terminal outside any repository shows its directory above the session line'

    $json = @{ workspace = @{ current_dir = $sessionRepo; project_dir = $terminalRepo }; context_window = @{ remaining_percentage = 90; context_window_size = 1000000 } } | ConvertTo-Json -Compress
    $expected = (Get-ExpectedContext -Filled 9 -Color '38;5;28' -Label '90% left of 1M') + "`n$terminalLine`n$sessionLine"
    Assert-Equal -Expected $expected -Actual (Invoke-StatusLineJson -Json $json) -Because 'the gauge stays on top of both git lines'

    # --- files the session edited by absolute path: workspace.current_dir does not follow them ---
    $editedA = New-Repo -Name 'edited-a'
    Add-BaseCommit -Repo $editedA -Files @('a')
    $editedB = New-Repo -Name 'edited-b'
    Add-BaseCommit -Repo $editedB -Files @('a')
    $editedC = New-Repo -Name 'edited-c'
    Add-BaseCommit -Repo $editedC -Files @('a')
    $editedD = New-Repo -Name 'edited-d'
    Add-BaseCommit -Repo $editedD -Files @('a')
    $lineA = Get-EditedLine -Repo $editedA
    $lineB = Get-EditedLine -Repo $editedB
    $lineC = Get-EditedLine -Repo $editedC
    $lineD = Get-EditedLine -Repo $editedD

    Invoke-RecordEdit -SessionId 'one' -ToolInput @{ file_path = (Join-Path $editedA 'a') }
    Assert-Equal -Expected "$terminalLine`n$lineA" -Actual (Invoke-StatusLineInDirs -Terminal $terminalRepo -Session $terminalRepo -SessionId 'one') -Because 'an edited file in another repository adds a yellow line'
    Assert-Equal -Expected $terminalLine -Actual (Invoke-StatusLineInDirs -Terminal $terminalRepo -Session $terminalRepo -SessionId 'other') -Because 'another session does not see the edits of this one'

    $nested = Join-Path $editedA 'nested\deep'
    New-Item -ItemType Directory -Path $nested -Force | Out-Null
    Invoke-RecordEdit -SessionId 'one' -ToolInput @{ file_path = (Join-Path $nested 'new.txt') }
    Assert-Equal -Expected "$terminalLine`n$lineA" -Actual (Invoke-StatusLineInDirs -Terminal $terminalRepo -Session $terminalRepo -SessionId 'one') -Because 'an edit in a subdirectory of the same repository adds no second line'
    Assert-Equal -Expected 1 -Actual @(Get-Content -LiteralPath (Join-Path $env:STATUSLINE_STATE_DIR 'one.txt')).Count -Because 'repeated edits of one repository do not grow the record'

    Invoke-RecordEdit -SessionId 'one' -ToolInput @{ file_path = (Join-Path $editedB 'a') }
    Assert-Equal -Expected "$terminalLine`n$lineB`n$lineA" -Actual (Invoke-StatusLineInDirs -Terminal $terminalRepo -Session $terminalRepo -SessionId 'one') -Because 'the most recently edited repository comes first'
    Invoke-RecordEdit -SessionId 'one' -ToolInput @{ file_path = (Join-Path $editedA 'a') }
    Assert-Equal -Expected "$terminalLine`n$lineA`n$lineB" -Actual (Invoke-StatusLineInDirs -Terminal $terminalRepo -Session $terminalRepo -SessionId 'one') -Because 'a new edit moves its repository back to the top'

    Invoke-RecordEdit -SessionId 'home' -ToolInput @{ file_path = (Join-Path $terminalRepo 'a') }
    Assert-Equal -Expected $terminalLine -Actual (Invoke-StatusLineInDirs -Terminal $terminalRepo -Session $terminalRepo -SessionId 'home') -Because 'an edit inside the terminal repository adds no line'

    Invoke-RecordEdit -SessionId 'away' -ToolInput @{ file_path = (Join-Path $editedB 'a') }
    $expected = $terminalLine + "`n" + (Format-Colored -Color '33' -Text "main | staged 0 | unstaged 0 | untracked 0 | no remote | $editedB")
    Assert-Equal -Expected $expected -Actual (Invoke-StatusLineInDirs -Terminal $terminalRepo -Session $editedB -SessionId 'away') -Because 'an edited repository the session already works in is not shown twice'

    Invoke-RecordEdit -SessionId 'notebook' -ToolInput @{ notebook_path = (Join-Path $editedC 'n.ipynb') }
    Assert-Equal -Expected "$terminalLine`n$lineC" -Actual (Invoke-StatusLineInDirs -Terminal $terminalRepo -Session $terminalRepo -SessionId 'notebook') -Because 'a notebook edit counts like a file edit'

    Invoke-RecordEdit -SessionId 'bash' -ToolInput @{ command = 'sed -i s/a/b/ a' } -ToolResponse @{ bashEditDiff = @{ changedFiles = @((Join-Path $editedC 'a')) } }
    Assert-Equal -Expected "$terminalLine`n$lineC" -Actual (Invoke-StatusLineInDirs -Terminal $terminalRepo -Session $terminalRepo -SessionId 'bash') -Because 'files a Bash command changed count like a file edit'

    Invoke-RecordEdit -SessionId 'read-only' -ToolInput @{ command = 'ls' }
    Assert-True -Condition (-not (Test-Path -LiteralPath (Join-Path $env:STATUSLINE_STATE_DIR 'read-only.txt'))) -Because 'a Bash command without changed files records nothing'

    Invoke-RecordEdit -SessionId 'no-repo' -ToolInput @{ file_path = (Join-Path $plainTerminal 'file.txt') }
    Assert-True -Condition (-not (Test-Path -LiteralPath (Join-Path $env:STATUSLINE_STATE_DIR 'no-repo.txt'))) -Because 'an edit outside any repository records nothing'

    foreach ($repoToEdit in @($editedA, $editedB, $editedC, $editedD)) {
        Invoke-RecordEdit -SessionId 'many' -ToolInput @{ file_path = (Join-Path $repoToEdit 'a') }
    }
    Assert-Equal -Expected "$terminalLine`n$lineD`n$lineC`n$lineB" -Actual (Invoke-StatusLineInDirs -Terminal $terminalRepo -Session $terminalRepo -SessionId 'many') -Because 'at most three yellow lines, the most recent ones'

    $gone = New-Repo -Name 'gone'
    Add-BaseCommit -Repo $gone -Files @('a')
    Invoke-RecordEdit -SessionId 'removed' -ToolInput @{ file_path = (Join-Path $gone 'a') }
    Remove-Item -LiteralPath $gone -Recurse -Force
    Assert-Equal -Expected $terminalLine -Actual (Invoke-StatusLineInDirs -Terminal $terminalRepo -Session $terminalRepo -SessionId 'removed') -Because 'a repository removed after the edit is not shown'

    Invoke-RecordEdit -SessionId '..\..\escape' -ToolInput @{ file_path = (Join-Path $editedA 'a') }
    Assert-True -Condition (-not (Test-Path -LiteralPath (Join-Path (Split-Path -Parent $sandbox) 'escape.txt'))) -Because 'a session id with a path in it writes nothing outside the state directory'

    $oldState = Join-Path $env:STATUSLINE_STATE_DIR 'old-session.txt'
    $recentState = Join-Path $env:STATUSLINE_STATE_DIR 'recent-session.txt'
    Set-Content -LiteralPath $oldState -Value $editedA -Encoding ASCII
    Set-Content -LiteralPath $recentState -Value $editedA -Encoding ASCII
    (Get-Item -LiteralPath $oldState).LastWriteTime = (Get-Date).AddDays(-31)
    (Get-Item -LiteralPath $recentState).LastWriteTime = (Get-Date).AddDays(-29)
    Invoke-RecordEdit -SessionId 'fresh' -ToolInput @{ file_path = (Join-Path $editedA 'a') }
    Assert-True -Condition (-not (Test-Path -LiteralPath $oldState)) -Because 'the first record of a session removes state older than 30 days'
    Assert-True -Condition (Test-Path -LiteralPath $recentState) -Because 'the first record of a session keeps newer state'

    Invoke-StatusLineJson -Json 'not json' -Arguments '--record-edit' | Out-Null
    Assert-Equal -Expected 0 -Actual $script:LastNodeExit -Because 'malformed hook input still exits 0, so the session never sees a hook error'

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
