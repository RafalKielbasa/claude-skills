# Claude Configuration Backup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `C:\Users\rafal\.claude` into the private `claude-skills` repository, holding the configuration, 17 skills from eight `.claude` directories and 80 memory files, syncing after every session and restorable onto a clean machine.

**Architecture:** An allowlist `.gitignore` (`*` + `!*/` + explicit exceptions) decides what git can see at all. Shared logic lives in the module `hooks/lib/ClaudeBackup.psm1`; two scripts use it — `backup-claude.ps1` (registry, mirror, secret gate, commit, push) wired into the `SessionEnd` hook, and `restore-claude.ps1` (restore with path remapping). Every `.claude` directory other than the global one is mirrored one-way into `backups/claude-dirs/<slug>/`.

**Tech Stack:** Windows PowerShell 5.1, git 2.x with `credential.helper=manager-core`, `gh` (already authenticated). No external PowerShell modules — tests are plain scripts with a hand-rolled assertion helper.

**Spec:** `docs/superpowers/specs/2026-09-03-backup-claude-config-design.md`

## Global Constraints

- **Shell:** Windows PowerShell 5.1 (`powershell.exe`). No `&&`, `||`, `?:` or `??` operators. Conditional chaining is `A; if ($?) { B }`.
- **No external dependencies.** No `Install-Module`. The system's Pester is 3.4.0 and is not used; tests are standalone `.ps1` scripts.
- **All code in English** — identifiers, comments, tests, script output, commit messages.
- **Commit messages are ASCII only.** PowerShell 5.1 passes arguments to `git.exe` in the ANSI codepage; non-ASCII characters land in history mangled.
- **Every script starts with** `Set-StrictMode -Version Latest` and `$ErrorActionPreference = 'Stop'`.
- **Always use `-LiteralPath`.** Source paths contain spaces (`Baza wiedzy`, `saas app`, `Multi agent system`).
- **Committing and pushing are permitted in this repository** — an exception granted explicitly by the user, valid only for `C:\Users\rafal\.claude`. Do not commit in any other directory.
- **No commit without the secret gate.** The invariant is not "only `backup-claude.ps1` may commit" — this plan itself commits by hand eight times, and a rule broken by its own plan is not a rule. It is: nothing is committed here whose staged set has not been scanned. From Task 4 onward, run this immediately before every hand-made `git commit`:

  ```powershell
  Import-Module C:\Users\rafal\.claude\hooks\lib\ClaudeBackup.psm1 -Force
  git diff --cached --name-only | ForEach-Object {
      $hit = Test-SecretContent -Path (Join-Path 'C:\Users\rafal\.claude' $_)
      if ($hit) { Write-Host "BLOCKED $_ : $hit" -ForegroundColor Red }
  }
  ```

  No output means the gate passed. In Tasks 1-3 the scanner does not exist yet; there the guard is Task 1 Step 7, which inspects the staged list by hand.
- **Target branch:** `main`. Remote: `origin` → `https://github.com/RafalKielbasa/claude-skills.git`.
- **Repository root in scripts:** a `-Root` parameter defaulting to the script's grandparent directory. Without it the tests have no fixture to run against.
- **Never put `$PSScriptRoot` in a `param()` default.** Verified on this machine: under `powershell.exe -File`, Windows PowerShell 5.1 evaluates `param()` defaults *before* `$PSScriptRoot` is populated, so `param([string]$Root = (Split-Path -Parent $PSScriptRoot))` dies with `Cannot bind argument to parameter 'Path' because it is an empty string` before the body runs. `-File` is how the `SessionEnd` hook, the test runner and the README all invoke these scripts. Declare `[string]$Root` bare and resolve it on the first line of the body:

  ```powershell
  if (-not $Root) { $Root = Split-Path -Parent $PSScriptRoot }
  ```

  In the body `$PSScriptRoot` is correct, so `Import-Module (Join-Path $PSScriptRoot ...)` and similar are fine as written.
- **Never merge a native command's stderr with `2>&1` while `$ErrorActionPreference = 'Stop'` is in effect, without scoping the merge.** Verified on this machine against a real remote: under the combination, PowerShell 5.1 wraps every stderr line from the native process in an `ErrorRecord` and promotes it to a *terminating exception* at the invocation line itself — before `$LASTEXITCODE` is ever checked. This fires not only on real failures but on ordinary success: a genuinely successful `git fetch --verbose` against a valid remote throws this way too, because git routinely writes progress text to stderr regardless of outcome. Left unguarded, this makes any `-AllowFailure`-style retry mechanism dead code for exactly the calls that need it, and can crash the whole script on its first real network operation. Fix: scope `$ErrorActionPreference = 'Continue'` around the single native call, restore it in a `finally`, and check `$LASTEXITCODE` only after that scope closes:

  ```powershell
  $previousEap = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
      $output = & git @GitArgs 2>&1
  } finally {
      $ErrorActionPreference = $previousEap
  }
  if ($LASTEXITCODE -ne 0 -and -not $AllowFailure) { ... }
  ```

---

## File Structure

| File | Responsibility |
|---|---|
| `.gitignore` | the allowlist — the single place deciding what git sees |
| `README.md` | restore procedure for a clean machine |
| `hooks/lib/ClaudeBackup.psm1` | shared logic: slug, discovery, registry, mirror, secret scanner |
| `hooks/backup-claude.ps1` | sync orchestration: lock, registry, mirror, gate, commit, push |
| `hooks/restore-claude.ps1` | fan mirrors back out to their target paths, with remapping |
| `hooks/tests/assert.ps1` | assertion helper shared by every test |
| `hooks/tests/test-gitignore.ps1` | the allowlist admits what it must and nothing else |
| `hooks/tests/test-registry.ps1` | slug, directory discovery, registry read/write/merge |
| `hooks/tests/test-mirror.ps1` | allowlisted copying and deletion propagation |
| `hooks/tests/test-secrets.ps1` | secret scanner: real hits, no false alarms |
| `hooks/tests/test-backup.ps1` | orchestration against a fixture repository |
| `hooks/tests/test-restore.ps1` | restore with `-Apply` and `-Map` |
| `hooks/tests/run-all.ps1` | runs every test, returns the failure count as its exit code |
| `backups/claude-dirs/registry.json` | slug to absolute path map |

---

### Task 1: The allowlist and repository bootstrap

**Files:**
- Create: `.gitignore`
- Create: `hooks/tests/assert.ps1`
- Create: `hooks/tests/test-gitignore.ps1`

**Interfaces:**
- Consumes: nothing
- Produces: `hooks/tests/assert.ps1` exposing `Assert-True`, `Assert-Equal`, `Assert-Contains`, `Assert-NotContains`, `Get-AssertFailureCount`, `Reset-AssertFailureCount`. Every later test dot-sources this file.

- [ ] **Step 1: Write the assertion helper**

File `hooks/tests/assert.ps1`:

```powershell
# Minimal assertion helper. No external test framework: every dependency
# would have to be reinstalled on the machine this repo is meant to rescue.

$script:AssertFailures = 0

function Reset-AssertFailureCount { $script:AssertFailures = 0 }
function Get-AssertFailureCount { return $script:AssertFailures }

function Assert-True {
    param([Parameter(Mandatory)]$Condition, [Parameter(Mandatory)][string]$Because)
    if ($Condition) {
        Write-Host "  ok   $Because" -ForegroundColor Green
    } else {
        Write-Host "  FAIL $Because" -ForegroundColor Red
        $script:AssertFailures++
    }
}

function Assert-Equal {
    param($Expected, $Actual, [Parameter(Mandatory)][string]$Because)
    if ($Expected -eq $Actual) {
        Write-Host "  ok   $Because" -ForegroundColor Green
    } else {
        Write-Host "  FAIL $Because" -ForegroundColor Red
        Write-Host "       expected: $Expected" -ForegroundColor Red
        Write-Host "       actual:   $Actual" -ForegroundColor Red
        $script:AssertFailures++
    }
}

function Assert-Contains {
    param([string[]]$Collection, [Parameter(Mandatory)][string]$Value, [Parameter(Mandatory)][string]$Because)
    Assert-True -Condition ($Collection -contains $Value) -Because $Because
}

function Assert-NotContains {
    param([string[]]$Collection, [Parameter(Mandatory)][string]$Pattern, [Parameter(Mandatory)][string]$Because)
    $hits = @($Collection | Where-Object { $_ -like $Pattern })
    if ($hits.Count -eq 0) {
        Write-Host "  ok   $Because" -ForegroundColor Green
    } else {
        Write-Host "  FAIL $Because" -ForegroundColor Red
        Write-Host "       matched: $($hits -join ', ')" -ForegroundColor Red
        $script:AssertFailures++
    }
}
```

- [ ] **Step 2: Write the failing test**

File `hooks/tests/test-gitignore.ps1`:

```powershell
[CmdletBinding()]
param([string]$Root = (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)))

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'assert.ps1')
Reset-AssertFailureCount

Write-Host "test-gitignore ($Root)" -ForegroundColor Cyan

Push-Location $Root
try {
    # Everything git considers part of this repository: files already tracked
    # plus untracked, non-ignored ones.
    #
    # Not `git status --porcelain`: that lists only *changes*, so once these
    # files are committed and the tree is clean the positive assertions below
    # would all fail. This listing is stable across commit state, and it also
    # catches a secret that is already tracked - .gitignore does not untrack
    # anything that entered the index before the rule existed.
    $candidates = @(git -c core.quotepath=false ls-files --cached --others --exclude-standard)
} finally {
    Pop-Location
}

# --- nothing sensitive or generated may appear ---
Assert-NotContains -Collection $candidates -Pattern '.credentials.json' -Because 'OAuth credentials stay out'
Assert-NotContains -Collection $candidates -Pattern '*.jsonl'           -Because 'session transcripts stay out'
Assert-NotContains -Collection $candidates -Pattern '*.key'             -Because 'session keys stay out'
Assert-NotContains -Collection $candidates -Pattern 'plugins/cache/*'   -Because 'vendored plugin code stays out'
Assert-NotContains -Collection $candidates -Pattern 'plugins/marketplaces/*' -Because 'marketplace clones stay out'
Assert-NotContains -Collection $candidates -Pattern 'paste-cache/*'     -Because 'paste cache stays out'
Assert-NotContains -Collection $candidates -Pattern 'file-history/*'    -Because 'file history stays out'
Assert-NotContains -Collection $candidates -Pattern 'shell-snapshots/*' -Because 'shell snapshots stay out'
Assert-NotContains -Collection $candidates -Pattern 'telemetry/*'       -Because 'telemetry stays out'
Assert-NotContains -Collection $candidates -Pattern 'session-env/*'     -Because 'session env stays out'
Assert-NotContains -Collection $candidates -Pattern 'tasks/*'           -Because 'task state stays out'
Assert-NotContains -Collection $candidates -Pattern 'backups/sync.log'  -Because 'sync log stays out'

# --- everything the restore depends on must appear ---
Assert-Contains -Collection $candidates -Value 'CLAUDE.md'          -Because 'global rules are backed up'
Assert-Contains -Collection $candidates -Value 'settings.json'      -Because 'global settings are backed up'
Assert-Contains -Collection $candidates -Value '.gitignore'         -Because 'the allowlist backs itself up'
Assert-Contains -Collection $candidates -Value 'skills/podsumuj-sesja-claude/SKILL.md' -Because 'global skills are backed up'
Assert-Contains -Collection $candidates -Value 'wiki/index.md'      -Because 'wiki is backed up'
Assert-Contains -Collection $candidates -Value 'plugins/installed_plugins.json'  -Because 'plugin manifest is backed up'
Assert-Contains -Collection $candidates -Value 'plugins/known_marketplaces.json' -Because 'marketplace manifest is backed up'
Assert-Contains -Collection $candidates -Value 'projects/D--Praca-Devstock-Baza-wiedzy/memory/MEMORY.md' -Because 'memory is backed up'
Assert-Contains -Collection $candidates -Value 'docs/superpowers/specs/2026-09-03-backup-claude-config-design.md' -Because 'the spec is backed up'
Assert-Contains -Collection $candidates -Value 'docs/superpowers/plans/2026-09-03-backup-claude-config.md' -Because 'the plan is backed up'

# --- sanity: an allowlist that lets a thousand files through is not an allowlist ---
Assert-True -Condition ($candidates.Count -lt 300) -Because "candidate count stays small (got $($candidates.Count))"

# --- rule-level checks ---
# git check-ignore evaluates the rules against a path whether or not it exists,
# so these cover blocks that happen to have no matching file on disk today.
Push-Location $Root
try {
    function Test-Ignored {
        param([Parameter(Mandatory)][string]$Path)
        git check-ignore -q -- $Path
        return ($LASTEXITCODE -eq 0)
    }

    foreach ($blocked in @(
        '.credentials.json',
        'skills/x/.credentials.json',
        'skills/x/private.pem',
        'hooks/id_rsa.key',
        'skills/x/.env',
        'skills/x/.env.local',
        'wiki/transcript.jsonl',
        'skills/x/build.lock',
        'plugins/cache/superpowers/6.3.0/SKILL.md',
        'plugins/marketplaces/obsidian-skills/skills/a.md',
        'paste-cache/blob.bin',
        'projects/D--X/session.jsonl',
        'backups/sync.log',
        'backups/.sync.lock',
        'docs/loose-note.md',
        'hooks/powtorki-last-check.txt',
        'some-future-claude-dir/state.json'
    )) {
        Assert-True -Condition (Test-Ignored $blocked) -Because "ignored: $blocked"
    }

    foreach ($allowed in @(
        'CLAUDE.md',
        'README.md',
        '.gitignore',
        'settings.json',
        'skills/x/SKILL.md',
        'hooks/backup-claude.ps1',
        'hooks/lib/ClaudeBackup.psm1',
        'agents/x.md',
        'commands/x.md',
        'wiki/patterns/x.md',
        'docs/superpowers/specs/x.md',
        'docs/superpowers/plans/x.md',
        'plans/x.md',
        'plugins/installed_plugins.json',
        'plugins/known_marketplaces.json',
        'projects/D--X/memory/MEMORY.md',
        'backups/claude-dirs/registry.json',
        'backups/claude-dirs/D--X/skills/y/SKILL.md'
    )) {
        Assert-True -Condition (-not (Test-Ignored $allowed)) -Because "allowed: $allowed"
    }
} finally {
    Pop-Location
}

exit (Get-AssertFailureCount)
```

- [ ] **Step 3: Run the test to verify it fails**

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Users\rafal\.claude\hooks\tests\test-gitignore.ps1"
```

Expected: a dozen or so `FAIL` lines, among them `OAuth credentials stay out` and `session transcripts stay out`, because without `.gitignore` git sees everything. Exit code above 0.

- [ ] **Step 4: Write the allowlist**

File `.gitignore`:

```gitignore
# Allowlist. Everything is ignored by default; git still descends into
# directories, so the exceptions below can re-include individual paths.
#
# Rationale: Claude Code adds new state directories on every update.
# A denylist would let each new one into the repo on the day it appears.
*
!*/

# --- heavy or volatile trees: excluded as directories so git never descends ---
/cache/
/daemon/
/debug/
/downloads/
/file-history/
/ide/
/jobs/
/paste-cache/
/plugins/cache/
/plugins/marketplaces/
/session-env/
/sessions/
/shell-snapshots/
/tasks/
/telemetry/

# --- repository's own files ---
!/.gitignore
!/README.md

# --- global configuration ---
!/CLAUDE.md
!/settings.json

# --- skills, hooks, agents, commands ---
!/skills/**
!/hooks/**
!/agents/**
!/commands/**

# --- accumulated knowledge ---
!/wiki/**
!/docs/superpowers/specs/**
!/docs/superpowers/plans/**
!/plans/**

# --- plugin manifest (versions and commit SHAs, not the code) ---
!/plugins/installed_plugins.json
!/plugins/known_marketplaces.json

# --- memory, per project ---
!/projects/*/memory/**

# --- mirrored .claude directories from other locations ---
!/backups/claude-dirs/**

# --- generated by backup-claude.ps1 ---
/backups/sync.log
/backups/.sync.lock

# --- generated state that lives inside an allowlisted directory ---
# powtorki-check.ps1 rewrites this with today's date on the first session of
# each day. Allowlisted by /hooks/** and worthless to restore, it would
# manufacture one backup commit a day out of nothing.
/hooks/powtorki-last-check.txt

# --- hard blocks: these override every exception above ---
.credentials.json
*.key
*.pem
.env
.env.*
*.jsonl
*.lock
```

- [ ] **Step 5: Run the test to verify it passes**

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Users\rafal\.claude\hooks\tests\test-gitignore.ps1"
```

Expected: all `ok`, exit code 0.

If `candidate count` exceeds 300, do not raise the threshold. Find what leaked:
`git ls-files --cached --others --exclude-standard | ForEach-Object { ($_ -split '/')[0] } | Group-Object | Sort-Object Count -Descending | Select-Object -First 10`.

- [ ] **Step 6: Point the repository at main and origin**

```powershell
cd C:\Users\rafal\.claude
git branch -M main
git remote add origin https://github.com/RafalKielbasa/claude-skills.git
git remote -v
```

Expected: two lines, `origin ... (fetch)` and `(push)`.

- [ ] **Step 7: Inspect the first commit before making it**

```powershell
git add -A
git -c core.quotepath=false diff --cached --name-only | Measure-Object -Line
git -c core.quotepath=false diff --cached --name-only | Select-String -Pattern 'credentials|\.jsonl|\.key$'
```

Expected: the second command prints **nothing**. If it prints anything: `git reset`, fix `.gitignore`, return to Step 5. Do not commit.

- [ ] **Step 8: Commit and push**

```bash
git commit -m "chore: bootstrap claude config backup with allowlist gitignore

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0115YBg2ri1ajCfG8GNynEsZ"
git push -u origin main
```

Verify: `git log origin/main --oneline -1` shows this commit.

---

### Task 2: Shared module — slug, directory discovery, registry

**Files:**
- Create: `hooks/lib/ClaudeBackup.psm1`
- Create: `hooks/tests/test-registry.ps1`

**Interfaces:**
- Consumes: `hooks/tests/assert.ps1` from Task 1.
- Produces:
  - `Get-ClaudeDirSlug -ProjectPath <string> -> [string]` — replaces `:`, `\`, `/` and space with `-`. `D:\Praca\Devstock\Baza wiedzy` → `D--Praca-Devstock-Baza-wiedzy`.
  - `Find-ClaudeDirs -SearchRoot <string[]> [-MaxDepth <int>] [-ExcludeSegment <string[]>] -> [string[]]` — absolute paths of discovered `.claude` directories.
  - `Read-Registry -Path <string> -> [pscustomobject]` shaped `@{ version; updated; entries }`, where each entry has `slug`, `path`, `claudeDir`, `missing`, `lastSync`.
  - `Write-Registry -Registry <object> -Path <string> -> void`.
  - `Update-Registry -Registry <object> -FoundClaudeDir <string[]> -SelfClaudeDir <string> -> [pscustomobject]`.

- [ ] **Step 1: Write the failing test**

File `hooks/tests/test-registry.ps1`:

```powershell
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
} finally {
    Remove-Item -LiteralPath $sandbox -Recurse -Force -ErrorAction SilentlyContinue
}

exit (Get-AssertFailureCount)
```

- [ ] **Step 2: Run the test to verify it fails**

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Users\rafal\.claude\hooks\tests\test-registry.ps1"
```

Expected: `Import-Module` aborts — `hooks\lib\ClaudeBackup.psm1` does not exist.

- [ ] **Step 3: Write the module**

File `hooks/lib/ClaudeBackup.psm1`:

```powershell
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

Export-ModuleMember -Function Get-ClaudeDirSlug, Find-ClaudeDirs,
                              Read-Registry, Write-Registry, Update-Registry
```

- [ ] **Step 4: Run the test to verify it passes**

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Users\rafal\.claude\hooks\tests\test-registry.ps1"
```

Expected: all `ok`, exit code 0.

- [ ] **Step 5: Commit**

```bash
git add hooks/lib/ClaudeBackup.psm1 hooks/tests/test-registry.ps1
git commit -m "feat: add slug, discovery and registry helpers

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0115YBg2ri1ajCfG8GNynEsZ"
```

---

### Task 3: The mirror — allowlisted copying and deletion propagation

**Files:**
- Modify: `hooks/lib/ClaudeBackup.psm1` (append the functions before `Export-ModuleMember` and extend the export list)
- Create: `hooks/tests/test-mirror.ps1`

**Interfaces:**
- Consumes: `Get-ClaudeDirSlug` from Task 2.
- Produces:
  - `Get-MirrorFiles -> [string[]]` — `@('CLAUDE.md','settings.json','settings.local.json')`
  - `Get-MirrorDirs -> [string[]]` — `@('skills','agents','commands','hooks','wiki','plans','specs')`
  - `Sync-ClaudeMirror -SourceClaudeDir <string> -MirrorDir <string> -> [int]` — returns the number of files copied.

- [ ] **Step 1: Write the failing test**

File `hooks/tests/test-mirror.ps1`:

```powershell
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

    # --- the deletion pass reaches nested files and spares their siblings ---
    # This is the block that actually exercises Sync-Directory's second loop.
    # The two assertions further down remove a whole directory and a top-level
    # file, which Sync-ClaudeMirror handles in its own elseif branches without
    # ever calling Sync-Directory - delete the relative-path diff entirely and
    # they still pass. Only a deletion inside a source directory that still
    # exists reaches that code, and only a surviving sibling proves it removes
    # selectively rather than wholesale.
    New-Item -ItemType Directory -Path (Join-Path $source 'skills\beta\nested') -Force | Out-Null
    Set-Content -LiteralPath (Join-Path $source 'skills\beta\SKILL.md') -Value 'beta' -Encoding UTF8
    Set-Content -LiteralPath (Join-Path $source 'skills\beta\nested\doomed.md') -Value 'doomed' -Encoding UTF8
    Set-Content -LiteralPath (Join-Path $source 'skills\beta\nested\survivor.md') -Value 'survivor' -Encoding UTF8
    Sync-ClaudeMirror -SourceClaudeDir $source -MirrorDir $mirror | Out-Null
    Assert-True -Condition (Test-Path -LiteralPath (Join-Path $mirror 'skills\beta\nested\doomed.md')) -Because 'a file two levels deep is mirrored'

    Remove-Item -LiteralPath (Join-Path $source 'skills\beta\nested\doomed.md') -Force
    Sync-ClaudeMirror -SourceClaudeDir $source -MirrorDir $mirror | Out-Null
    Assert-True -Condition (-not (Test-Path -LiteralPath (Join-Path $mirror 'skills\beta\nested\doomed.md'))) -Because 'the deletion pass removes a file two levels deep'
    Assert-True -Condition (Test-Path -LiteralPath (Join-Path $mirror 'skills\beta\nested\survivor.md')) -Because 'the deletion pass spares a sibling still present at the source'
    Assert-True -Condition (Test-Path -LiteralPath (Join-Path $mirror 'skills\beta\SKILL.md')) -Because 'the deletion pass spares a file in the parent directory'

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
```

- [ ] **Step 2: Run the test to verify it fails**

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Users\rafal\.claude\hooks\tests\test-mirror.ps1"
```

Expected: `The term 'Sync-ClaudeMirror' is not recognized`.

- [ ] **Step 3: Add the mirror functions to the module**

Insert before `Export-ModuleMember` in `hooks/lib/ClaudeBackup.psm1`:

```powershell
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
```

Change the export line to:

```powershell
Export-ModuleMember -Function Get-ClaudeDirSlug, Find-ClaudeDirs,
                              Read-Registry, Write-Registry, Update-Registry,
                              Get-MirrorFiles, Get-MirrorDirs, Sync-ClaudeMirror
```

- [ ] **Step 4: Run the test to verify it passes**

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Users\rafal\.claude\hooks\tests\test-mirror.ps1"
```

Expected: all `ok`, exit code 0.

- [ ] **Step 5: Commit**

```bash
git add hooks/lib/ClaudeBackup.psm1 hooks/tests/test-mirror.ps1
git commit -m "feat: mirror whitelisted files from source .claude directories

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0115YBg2ri1ajCfG8GNynEsZ"
```

---

### Task 4: The secret gate

**Files:**
- Modify: `hooks/lib/ClaudeBackup.psm1`
- Create: `hooks/tests/test-secrets.ps1`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `Test-SecretContent -Path <string> -> [string] | $null` — returns the matched pattern, or `$null`.

**Design note this task is wrong without:** every pattern requires a key body of minimum length. The spec, this plan and the tests all mention the prefixes `sk-ant-`, `ghp_` and `AIza` as text. A pattern matching a bare prefix would block commits of the project's own documentation — the gate would shut down the project it protects.

- [ ] **Step 1: Write the failing test**

File `hooks/tests/test-secrets.ps1`:

```powershell
[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'assert.ps1')
Import-Module (Join-Path (Split-Path -Parent $PSScriptRoot) 'lib\ClaudeBackup.psm1') -Force
Reset-AssertFailureCount

Write-Host 'test-secrets' -ForegroundColor Cyan

$sandbox = Join-Path $env:TEMP ("claude-secret-test-" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $sandbox -Force | Out-Null

function New-Fixture {
    param([string]$Name, [string]$Content)
    $path = Join-Path $sandbox $Name
    Set-Content -LiteralPath $path -Value $Content -Encoding UTF8
    return $path
}

try {
    # --- must be caught: keys with a plausible body ---
    $anthropic = New-Fixture 'a.txt' ('key = "' + 'sk-ant-' + 'api03-' + ('x' * 40) + '"')
    Assert-True -Condition ($null -ne (Test-SecretContent -Path $anthropic)) -Because 'an Anthropic-shaped key is caught'

    $github = New-Fixture 'b.txt' ('token: ' + 'ghp_' + 'A1b2C3d4E5f6G7h8I9j0' + 'K1l2M3n4O5p6Q7r8')
    Assert-True -Condition ($null -ne (Test-SecretContent -Path $github)) -Because 'a GitHub-shaped token is caught'

    # Every pattern needs at least one fixture that actually matches it. A
    # pattern exercised only by a negative fixture (documentation naming the
    # prefix, followed by "...") proves nothing about what it accepts - a
    # typo in the quantifier or character class would pass every existing
    # assertion silently.
    $ghPat = New-Fixture 'b2.txt' ('cred: ' + 'github_pat_' + ('A1' * 21))
    Assert-True -Condition ($null -ne (Test-SecretContent -Path $ghPat)) -Because 'a fine-grained GitHub PAT is caught'

    $gcp = New-Fixture 'b3.txt' ('key=' + 'AIza' + (('Sy' * 17) + 'D'))
    Assert-True -Condition ($null -ne (Test-SecretContent -Path $gcp)) -Because 'a Google API key is caught'

    # Every fixture below is assembled from fragments on purpose. A contiguous
    # literal here would sit inside this plan file, which the allowlist commits
    # and the scanner then reads - the gate would abort every future sync on
    # its own documentation. The runtime values are the real thing; the source
    # text is not.
    $pem = New-Fixture 'c.txt' (('-----BEGIN ' + 'RSA PRIVATE KEY-----') +
        "`nMIIEow==`n-----END RSA PRIVATE KEY-----")
    Assert-True -Condition ($null -ne (Test-SecretContent -Path $pem)) -Because 'a PEM private key is caught'

    $oauth = New-Fixture 'd.json' ('{"access' + 'Token":"' + ('a' * 30) + '"}')
    Assert-True -Condition ($null -ne (Test-SecretContent -Path $oauth)) -Because 'an OAuth access token is caught'

    # --- must NOT be caught: documentation naming the patterns ---
    $doc = New-Fixture 'e.md' @'
The scanner matches these prefixes when followed by a key body:
sk-ant-..., ghp_..., github_pat_..., AIza..., and "accessToken": "...".
'@
    Assert-True -Condition ($null -eq (Test-SecretContent -Path $doc)) -Because 'documentation naming prefixes is not a secret'

    $regex = New-Fixture 'f.ps1' "`$pattern = 'sk-ant-[A-Za-z0-9_\-]{24,}'"
    Assert-True -Condition ($null -eq (Test-SecretContent -Path $regex)) -Because 'the pattern definition itself is not a secret'

    $plain = New-Fixture 'g.md' '# A skill about nothing in particular'
    Assert-True -Condition ($null -eq (Test-SecretContent -Path $plain)) -Because 'ordinary prose is clean'

    # --- a key straddling a chunk boundary is still caught ---
    # Test-SecretContent reads in 1MB chunks with a 4KB carry between reads.
    # An earlier version of this fixture put its key at the very end of a
    # 2MB+ file - comfortably inside the final Read() call and nowhere near a
    # chunk boundary. That proved the scan does not stop after the first
    # chunk, but it never actually exercised the carry: deleting the carry
    # mechanism entirely would not have failed it. This fixture places the
    # key so it starts just before the first 1MB boundary and ends just
    # after it - half of it is visible only through the carry, half only in
    # the next chunk's read.
    $chunkChars = 1MB
    $straddleKey = 'key = "' + 'sk-ant-' + 'api03-' + ('r' * 40) + '"'
    $straddle    = Join-Path $sandbox 'straddle.md'
    $prefixLen   = $chunkChars - 20
    $writer = New-Object System.IO.StreamWriter($straddle)
    $writer.Write('x' * $prefixLen)
    $writer.Write($straddleKey)
    $writer.Write('y' * 1000)
    $writer.Close()
    Assert-True -Condition ((Get-Item -LiteralPath $straddle).Length -gt $chunkChars) -Because 'the fixture spans more than one chunk'
    Assert-True -Condition ($null -ne (Test-SecretContent -Path $straddle)) -Because 'a key straddling a chunk boundary is still caught'

    # --- size is not an exemption: a key well past the first chunk is still caught ---
    $large  = Join-Path $sandbox 'large.md'
    $filler = ('lorem ipsum ' * 100) + "`n"
    $writer2 = New-Object System.IO.StreamWriter($large)
    for ($i = 0; $i -lt 2000; $i++) { $writer2.Write($filler) }
    $writer2.Write('key = "' + 'sk-ant-' + 'api03-' + ('q' * 40) + '"')
    $writer2.Close()
    Assert-True -Condition ((Get-Item -LiteralPath $large).Length -gt 2MB) -Because 'the fixture really is over 2MB'
    Assert-True -Condition ($null -ne (Test-SecretContent -Path $large)) -Because 'a key well past the first chunk is still caught'

    # --- binary files are skipped rather than regexed ---
    $binary = Join-Path $sandbox 'blob.bin'
    [System.IO.File]::WriteAllBytes($binary, ([byte[]](0, 1, 2, 0, 255) * 100))
    Assert-True -Condition ($null -eq (Test-SecretContent -Path $binary)) -Because 'binary content is skipped'

    # --- a read failure fails closed, not open ---
    # The gate's whole job is to distinguish "clean" from "not confirmed
    # clean." A file that cannot be opened must never look the same as one
    # that was scanned and found nothing.
    $locked = New-Fixture 'locked.txt' 'irrelevant content'
    $lockStream = [System.IO.File]::Open($locked, 'Open', 'Read', 'None')
    try {
        $result = Test-SecretContent -Path $locked
        Assert-True -Condition ($null -ne $result) -Because 'an unreadable file returns non-null rather than silently passing'
        Assert-True -Condition ($result -like '*could not scan*') -Because 'the sentinel names the failure rather than mimicking a pattern match'
    } finally {
        $lockStream.Dispose()
    }
} finally {
    Remove-Item -LiteralPath $sandbox -Recurse -Force -ErrorAction SilentlyContinue
}

exit (Get-AssertFailureCount)
```

- [ ] **Step 2: Run the test to verify it fails**

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Users\rafal\.claude\hooks\tests\test-secrets.ps1"
```

Expected: `The term 'Test-SecretContent' is not recognized`.

- [ ] **Step 3: Add the scanner to the module**

Insert before `Export-ModuleMember`:

```powershell
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
```

Add `Test-SecretContent` to the `Export-ModuleMember` list.

- [ ] **Step 4: Run the test to verify it passes**

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Users\rafal\.claude\hooks\tests\test-secrets.ps1"
```

Expected: all `ok`, exit code 0.

- [ ] **Step 5: Prove the scanner does not block this repository**

```powershell
Import-Module C:\Users\rafal\.claude\hooks\lib\ClaudeBackup.psm1 -Force
Get-ChildItem C:\Users\rafal\.claude\docs -Recurse -File |
    ForEach-Object { $hit = Test-SecretContent -Path $_.FullName; if ($hit) { "$($_.Name): $hit" } }
```

Expected: **no output**. The spec and the plan both name key prefixes; if anything prints, the pattern is too loose and needs a body requirement — not a path exemption.

- [ ] **Step 6: Commit**

```bash
git add hooks/lib/ClaudeBackup.psm1 hooks/tests/test-secrets.ps1
git commit -m "feat: add secret scanner requiring key bodies, not bare prefixes

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0115YBg2ri1ajCfG8GNynEsZ"
```

---

### Task 5: Orchestration — `backup-claude.ps1`

**Files:**
- Create: `hooks/backup-claude.ps1`
- Create: `hooks/tests/test-backup.ps1`

**Interfaces:**
- Consumes: `Find-ClaudeDirs`, `Read-Registry`, `Write-Registry`, `Update-Registry`, `Sync-ClaudeMirror`, `Test-SecretContent`.
- Produces: a script invocable as
  `backup-claude.ps1 [-Rescan] [-NoPush] [-Root <path>] [-SearchRoot <string[]>]`.
  Exit codes: `0` — synced or nothing to do; `1` — the secret gate stopped the commit.

- [ ] **Step 1: Write the failing test**

File `hooks/tests/test-backup.ps1`:

```powershell
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
```

- [ ] **Step 2: Run the test to verify it fails**

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Users\rafal\.claude\hooks\tests\test-backup.ps1"
```

Expected: failures — `hooks\backup-claude.ps1` does not exist and `powershell.exe -File` exits non-zero.

- [ ] **Step 3: Write the orchestrator**

File `hooks/backup-claude.ps1`:

```powershell
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
              here instead of returning a non-zero exit code. Verified against
              a real remote: even a fully successful `git fetch --verbose`
              against this repository's own origin throws under the unscoped
              form, because git routinely writes progress text to stderr on
              success, not only on failure. The local 'Continue' override,
              scoped to the call and restored in the finally, neutralises the
              promotion while still capturing stderr as ordinary output.
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
        # persisting the flag even when nothing was mirrored for it.
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
```

- [ ] **Step 4: Run the test to verify it passes**

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Users\rafal\.claude\hooks\tests\test-backup.ps1"
```

Expected: all `ok`, exit code 0.

- [ ] **Step 5: Gate, commit and push the source**

The source commit comes **before** the live run, not after. A live run stages everything uncommitted: run it first and it would sweep these two files into a generic `backup: sync` commit, leaving the `git commit` below with nothing staged and a non-zero exit.

```powershell
git add hooks/backup-claude.ps1 hooks/tests/test-backup.ps1
Import-Module C:\Users\rafal\.claude\hooks\lib\ClaudeBackup.psm1 -Force
git diff --cached --name-only | ForEach-Object {
    $hit = Test-SecretContent -Path (Join-Path 'C:\Users\rafal\.claude' $_)
    if ($hit) { Write-Host "BLOCKED $_ : $hit" -ForegroundColor Red }
}
```

No output from the loop means the gate passed.

```bash
git commit -m "feat: add backup orchestrator with lock, secret gate and push

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0115YBg2ri1ajCfG8GNynEsZ"
git push origin main
```

- [ ] **Step 6: Run it against the live repository**

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Users\rafal\.claude\hooks\backup-claude.ps1" -Rescan -NoPush -Verbose
Get-Content C:\Users\rafal\.claude\backups\sync.log -Tail 20
(Get-Content C:\Users\rafal\.claude\backups\claude-dirs\registry.json -Raw | ConvertFrom-Json).entries |
    Format-Table slug, missing, path
```

Expected: the registry holds **7 entries**, all with `missing = False`, slugs matching the table in the spec. This run legitimately has something to commit — the mirrors it just created — so check `git log -1 --stat` to confirm they landed under `backups/claude-dirs/`.

---

### Task 6: Restore — `restore-claude.ps1`

**Files:**
- Create: `hooks/restore-claude.ps1`
- Create: `hooks/tests/test-restore.ps1`
- Create: `hooks/tests/run-all.ps1`

**Interfaces:**
- Consumes: `Read-Registry`, `Write-Registry`, `Get-MirrorFiles`, `Get-MirrorDirs`, `Get-ClaudeDirSlug`.
- Produces: `restore-claude.ps1 [-Apply] [-Map <string[]>] [-Root <path>]`. Without `-Apply` it only prints the planned operations. `-Map` takes `old=new` entries, e.g. `-Map "D:\Praca=E:\Praca"`.

- [ ] **Step 1: Write the failing test**

File `hooks/tests/test-restore.ps1`:

```powershell
[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'assert.ps1')
Import-Module (Join-Path (Split-Path -Parent $PSScriptRoot) 'lib\ClaudeBackup.psm1') -Force
Reset-AssertFailureCount

Write-Host 'test-restore' -ForegroundColor Cyan

$scriptPath = Join-Path (Split-Path -Parent $PSScriptRoot) 'restore-claude.ps1'
$sandbox    = Join-Path $env:TEMP ("claude-restore-test-" + [guid]::NewGuid().ToString('N'))
$repo       = Join-Path $sandbox 'repo'
$slug       = 'D--Demo-proj'

function Invoke-Restore {
    param([string[]]$ExtraArgs = @())
    $argv = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $scriptPath, '-Root', $repo) + $ExtraArgs
    $out = & powershell.exe @argv 2>&1
    return [pscustomobject]@{ ExitCode = $LASTEXITCODE; Output = ($out -join "`n") }
}

try {
    $mirror = Join-Path $repo "backups\claude-dirs\$slug"
    New-Item -ItemType Directory -Path (Join-Path $mirror 'skills\demo') -Force | Out-Null
    Set-Content -LiteralPath (Join-Path $mirror 'skills\demo\SKILL.md') -Value 'demo' -Encoding UTF8
    Set-Content -LiteralPath (Join-Path $mirror 'settings.json') -Value '{}' -Encoding UTF8

    New-Item -ItemType Directory -Path (Join-Path $repo "projects\$slug\memory") -Force | Out-Null
    Set-Content -LiteralPath (Join-Path $repo "projects\$slug\memory\MEMORY.md") -Value '- note' -Encoding UTF8

    $target = Join-Path $sandbox 'restored\proj'
    New-Item -ItemType Directory -Path $target -Force | Out-Null

    $registry = [pscustomobject]@{
        version = 1; updated = $null
        entries = @([pscustomobject]@{
            slug = $slug; path = 'D:\Demo\proj'; claudeDir = 'D:\Demo\proj\.claude'
            missing = $false; lastSync = $null
        })
    }
    Write-Registry -Registry $registry -Path (Join-Path $repo 'backups\claude-dirs\registry.json')

    $map = "D:\Demo=$(Join-Path $sandbox 'restored')"

    # --- dry run changes nothing ---
    $dry = Invoke-Restore -ExtraArgs @('-Map', $map)
    Assert-Equal -Expected 0 -Actual $dry.ExitCode -Because 'a dry run succeeds'
    Assert-True -Condition (-not (Test-Path -LiteralPath (Join-Path $target '.claude'))) -Because 'a dry run writes nothing'
    Assert-True -Condition ($dry.Output -match 'would') -Because 'a dry run says what it would do'

    # --- prefix matching respects segment boundaries ---
    # "D:\Demo=..." must not capture "D:\Demoland". With a naive StartsWith the
    # entry below would be reported against a path containing 'restoredland'.
    # The sibling also gets its OWN memory directory, on disk - without one,
    # the memory-rename loop's Get-ChildItem never even sees "D--Demoland-proj"
    # as a candidate, and this test cannot catch a missing boundary check in
    # that loop specifically (only in the per-entry .claude restore, which
    # already goes through Convert-MappedPath and was never the risk).
    $sibling = Join-Path $repo 'backups\claude-dirs\D--Demoland-proj'
    New-Item -ItemType Directory -Path $sibling -Force | Out-Null
    Set-Content -LiteralPath (Join-Path $sibling 'settings.json') -Value '{}' -Encoding UTF8
    New-Item -ItemType Directory -Path (Join-Path $repo 'projects\D--Demoland-proj\memory') -Force | Out-Null
    Set-Content -LiteralPath (Join-Path $repo 'projects\D--Demoland-proj\memory\MEMORY.md') -Value '- unrelated note' -Encoding UTF8
    $registry.entries = @($registry.entries) + @([pscustomobject]@{
        slug = 'D--Demoland-proj'; path = 'D:\Demoland\proj'; claudeDir = 'D:\Demoland\proj\.claude'
        missing = $false; lastSync = $null
    })
    Write-Registry -Registry $registry -Path (Join-Path $repo 'backups\claude-dirs\registry.json')

    $boundary = Invoke-Restore -ExtraArgs @('-Map', $map)
    Assert-True -Condition ($boundary.Output -notmatch 'restoredland') -Because 'D:\Demo does not capture D:\Demoland'

    # --- a stray file the mirror never claimed to contain survives ---
    # The restore's whole reason to exist is to never delete. The stray file
    # goes INSIDE the actual restore target, $target\.claude - not $target
    # itself, which the script never touches at all and would make this
    # assertion pass even against a version that wiped .claude clean first.
    # Verified: an earlier draft seeded the stray file in $target and a
    # mutation that cleared $target\.claude before copying went undetected.
    New-Item -ItemType Directory -Path (Join-Path $target '.claude') -Force | Out-Null
    Set-Content -LiteralPath (Join-Path $target '.claude\pre-existing-unrelated-file.txt') -Value 'do not touch me' -Encoding UTF8

    # --- apply writes the files ---
    $apply = Invoke-Restore -ExtraArgs @('-Apply', '-Map', $map)
    Assert-Equal -Expected 0 -Actual $apply.ExitCode -Because 'apply succeeds'
    Assert-True -Condition (Test-Path -LiteralPath (Join-Path $target '.claude\skills\demo\SKILL.md')) -Because 'skills are restored under the mapped path'
    Assert-True -Condition (Test-Path -LiteralPath (Join-Path $target '.claude\settings.json')) -Because 'settings are restored'
    Assert-True -Condition (Test-Path -LiteralPath (Join-Path $target '.claude\pre-existing-unrelated-file.txt')) -Because 'a file the mirror never claimed to contain survives the restore'

    # --- memory directories follow the same remap ---
    $newSlug = Get-ClaudeDirSlug -ProjectPath $target
    $renamed = Join-Path $repo "projects\$newSlug"
    Assert-True -Condition (Test-Path -LiteralPath $renamed) -Because 'the memory slug is renamed to match the new path'
    Assert-True -Condition (Test-Path -LiteralPath (Join-Path $renamed 'memory\MEMORY.md')) -Because 'memory content survives the rename'

    # --- the sibling's memory is untouched by the same -Apply ---
    # This is the assertion that actually exercises the boundary check inside
    # the memory-rename loop, not just the per-entry .claude restore.
    Assert-True -Condition (Test-Path -LiteralPath (Join-Path $repo 'projects\D--Demoland-proj\memory\MEMORY.md')) -Because 'D--Demo does not capture D--Demoland-proj in slug space either'

    # --- an unmapped, nonexistent target is reported, not created ---
    $unmapped = Invoke-Restore -ExtraArgs @('-Apply')
    Assert-Equal -Expected 0 -Actual $unmapped.ExitCode -Because 'an unreachable target does not fail the run'
    Assert-True -Condition ($unmapped.Output -match 'skip') -Because 'an unreachable target is reported as skipped'
} finally {
    Remove-Item -LiteralPath $sandbox -Recurse -Force -ErrorAction SilentlyContinue
}

exit (Get-AssertFailureCount)
```

- [ ] **Step 2: Run the test to verify it fails**

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Users\rafal\.claude\hooks\tests\test-restore.ps1"
```

Expected: failures — `hooks\restore-claude.ps1` does not exist.

- [ ] **Step 3: Write the restore script**

File `hooks/restore-claude.ps1`:

```powershell
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
```

- [ ] **Step 4: Run the test to verify it passes**

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Users\rafal\.claude\hooks\tests\test-restore.ps1"
```

Expected: all `ok`, exit code 0.

- [ ] **Step 5: Write the test runner and run everything**

File `hooks/tests/run-all.ps1`:

```powershell
[CmdletBinding()]
param()
Set-StrictMode -Version Latest

$failures = 0
foreach ($test in @(Get-ChildItem -LiteralPath $PSScriptRoot -Filter 'test-*.ps1' | Sort-Object Name)) {
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $test.FullName
    if ($LASTEXITCODE -ne 0) {
        Write-Host "$($test.Name): $LASTEXITCODE failure(s)" -ForegroundColor Red
        $failures += $LASTEXITCODE
    }
}

if ($failures -eq 0) { Write-Host 'all tests passed' -ForegroundColor Green }
exit $failures
```

Run: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Users\rafal\.claude\hooks\tests\run-all.ps1"`

Expected: `all tests passed`, exit code 0.

- [ ] **Step 6: Commit**

```bash
git add hooks/restore-claude.ps1 hooks/tests/test-restore.ps1 hooks/tests/run-all.ps1
git commit -m "feat: add restore script with dry-run default and path remapping

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0115YBg2ri1ajCfG8GNynEsZ"
git push origin main
```

---

### Task 7: Wiring the `SessionEnd` hook

**Files:**
- Modify: `settings.json`

**Interfaces:**
- Consumes: `hooks/backup-claude.ps1` from Task 5.
- Produces: a hook Claude Code runs after every session, in every directory.

- [ ] **Step 1: Confirm SessionEnd exists in this Claude Code version**

```powershell
claude --version
```

Then, inside a Claude Code session, run `/hooks` and check whether `SessionEnd` is among the listed events. If it is **not**, use `Stop` instead of `SessionEnd` in every following step and record the substitution in `README.md`.

- [ ] **Step 2: Register the hook through the update-config skill**

**REQUIRED SUB-SKILL:** `update-config`. That skill owns `settings.json` — do not hand-edit the file.

Target shape of the entry, added alongside the existing `SessionStart`:

```json
"SessionEnd": [
  {
    "hooks": [
      {
        "type": "command",
        "command": "powershell.exe -NoProfile -ExecutionPolicy Bypass -File \"C:\\Users\\rafal\\.claude\\hooks\\backup-claude.ps1\"",
        "timeout": 120
      }
    ]
  }
]
```

- [ ] **Step 3: Verify the file still parses and keeps the old hook**

```powershell
$s = Get-Content C:\Users\rafal\.claude\settings.json -Raw | ConvertFrom-Json
$s.hooks.PSObject.Properties.Name
$s.hooks.SessionEnd[0].hooks[0].command
$s.hooks.SessionEnd[0].hooks[0].timeout
```

Expected: the names include both `SessionStart` and `SessionEnd`; the command points at `backup-claude.ps1`; the timeout is `120`. Losing `SessionStart` would kill `powtorki-check.ps1`.

- [ ] **Step 4: Gate, commit and push `settings.json`**

Before running anything, so that the run below has nothing of ours left to sweep into a generic sync commit.

```powershell
git add settings.json
Import-Module C:\Users\rafal\.claude\hooks\lib\ClaudeBackup.psm1 -Force
git diff --cached --name-only | ForEach-Object {
    $hit = Test-SecretContent -Path (Join-Path 'C:\Users\rafal\.claude' $_)
    if ($hit) { Write-Host "BLOCKED $_ : $hit" -ForegroundColor Red }
}
```

No output means the gate passed.

```bash
git commit -m "chore: run backup-claude on SessionEnd in every directory

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0115YBg2ri1ajCfG8GNynEsZ"
git push origin main
```

- [ ] **Step 5: Run the hook command line exactly as Claude Code will run it**

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Users\rafal\.claude\hooks\backup-claude.ps1"
"exit=$LASTEXITCODE"
Get-Content C:\Users\rafal\.claude\backups\sync.log -Tail 5
```

Expected: `exit=0` and a log entry reading `no changes` — Step 4 already committed everything. A `committed:` entry here is not a failure, but check what it swept in.

- [ ] **Step 6: Verify the hook fires from another directory**

A log entry alone would only prove the hook ran, not that it carried a change across. Make a real, verifiable change instead.

Open a Claude Code session in `D:\Praca\Devstock\Baza wiedzy` and append a marker line to a skill:

```powershell
Add-Content -LiteralPath "D:\Praca\Devstock\Baza wiedzy\.claude\skills\spotkanie\SKILL.md" `
    -Value "`n<!-- backup-hook-probe -->"
```

End the session, then check from anywhere:

```powershell
$mirror = "C:\Users\rafal\.claude\backups\claude-dirs\D--Praca-Devstock-Baza-wiedzy\skills\spotkanie\SKILL.md"
(Get-Content -LiteralPath $mirror -Raw) -match 'backup-hook-probe'
cd C:\Users\rafal\.claude; git log --oneline -3
Get-Content backups\sync.log -Tail 5
```

Expected: `True`, plus a `backup: sync .claude config` commit timestamped to that session.

Now remove the marker and confirm the deletion travels too:

```powershell
$src = "D:\Praca\Devstock\Baza wiedzy\.claude\skills\spotkanie\SKILL.md"
(Get-Content -LiteralPath $src -Raw) -replace "`r?`n<!-- backup-hook-probe -->", '' |
    Set-Content -LiteralPath $src -NoNewline
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Users\rafal\.claude\hooks\backup-claude.ps1"
(Get-Content -LiteralPath $mirror -Raw) -match 'backup-hook-probe'
```

Expected: `False`. This is the only step proving the backup actually covers the 13 skills living outside this directory; without it, everything else is unverified.

Both syncs in this step commit and push on their own — that is the hook doing its job, and no further commit is needed to close the task.

---

### Task 8: `README.md` and a full restore rehearsal

**Files:**
- Create: `README.md`

**Interfaces:**
- Consumes: everything from Tasks 1-7.
- Produces: the document the user restores from, unaided.

- [ ] **Step 1: Rehearse the restore into a scratch directory**

Rehearse before the README describes the procedure as working:

```powershell
$stage = Join-Path $env:TEMP 'claude-restore-rehearsal'
Remove-Item -LiteralPath $stage -Recurse -Force -ErrorAction SilentlyContinue
git clone https://github.com/RafalKielbasa/claude-skills.git $stage

# every mirrored source must be present in the clone
(Get-Content (Join-Path $stage 'backups\claude-dirs\registry.json') -Raw | ConvertFrom-Json).entries |
    ForEach-Object { "{0}  mirror={1}" -f $_.slug, (Test-Path (Join-Path $stage "backups\claude-dirs\$($_.slug)")) }

# the clone must carry skills and memory
# Lower bounds, not exact counts: skills get added over time, and an
# assertion that fails on a correct system teaches the reader to ignore it.
# The named files are the real check - they catch a mirror that silently
# stopped covering a location.
@(Get-ChildItem (Join-Path $stage 'backups\claude-dirs') -Recurse -Filter 'SKILL.md').Count
@(Get-ChildItem (Join-Path $stage 'projects') -Recurse -Directory -Filter 'memory').Count
@(Get-ChildItem (Join-Path $stage 'skills') -Directory).Count
@(Get-ChildItem (Join-Path $stage 'projects') -Recurse -File -Filter '*.md' |
    Where-Object { $_.DirectoryName -like '*\memory' }).Count

Test-Path (Join-Path $stage 'skills\podsumuj-sesja-claude\SKILL.md')
Test-Path (Join-Path $stage 'backups\claude-dirs\D--Praca-Devstock-Baza-wiedzy\skills\spotkanie\SKILL.md')
Test-Path (Join-Path $stage 'backups\claude-dirs\D--Notatki-notatki\CLAUDE.md')
Test-Path (Join-Path $stage 'backups\claude-dirs\D--Praca-Devstock-Baza-wiedzy\agents\kb-scan.md')

# and must not carry anything it should not
@(Get-ChildItem $stage -Recurse -File -Include '*.jsonl','*.key','.credentials.json' -Force).Count
```

Expected: every registry entry reports `mirror=True`; mirrored `SKILL.md` files **at least 13**; `memory` directories **12**; `skills/` directories **at least 5**; memory files **exactly 80** — that set is closed rather than growing, so a smaller number means real loss, not drift. All four `Test-Path` calls return `True`. The final count is **0**.

- [ ] **Step 2: Rehearse the fan-out with a remap**

```powershell
$fake = Join-Path $env:TEMP 'claude-fake-drive'
New-Item -ItemType Directory -Path (Join-Path $fake 'Notatki\notatki') -Force | Out-Null
powershell.exe -NoProfile -ExecutionPolicy Bypass `
    -File (Join-Path $stage 'hooks\restore-claude.ps1') `
    -Root $stage -Apply -Map "D:\=$fake\"
@(Get-ChildItem (Join-Path $fake 'Notatki\notatki\.claude') -Recurse -File).Count
```

Expected: the files from `D:\Notatki\notatki\.claude` appear under `$fake\Notatki\notatki\.claude`, with a count matching the source. Clean up: `Remove-Item $fake, $stage -Recurse -Force`.

- [ ] **Step 3: Write README.md**

File `README.md`, using exactly the commands rehearsed in Steps 1-2:

````markdown
# claude-skills - Claude Code configuration backup

This repository is also the directory `C:\Users\rafal\.claude`. It holds the
configuration, the skills from every `.claude` directory on the machine, and the
project memory.

Syncing is automatic: `hooks/backup-claude.ps1` is wired in as a `SessionEnd` hook, so it
runs after every Claude Code session in every directory. When nothing changed, it exits
without a commit.

## Restoring onto a new machine

1. Install Claude Code and sign in. Credentials are not here: `.credentials.json` is
   deliberately outside the repository.

2. Attach the repository to the existing `~/.claude`:

   ```powershell
   git clone https://github.com/RafalKielbasa/claude-skills.git "$env:TEMP\claude-skills"
   Move-Item "$env:TEMP\claude-skills\.git" "$env:USERPROFILE\.claude\.git"
   cd "$env:USERPROFILE\.claude"; git checkout -- .
   ```

   Moving just `.git`, rather than cloning into the directory, is necessary because
   Claude Code creates files in `~/.claude` on first launch and `git clone` refuses to
   work in a non-empty directory. The side effect is the one we want: the directory is a
   repository straight away and keeps committing.

3. Fan the other `.claude` directories back out to their paths:

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\.claude\hooks\restore-claude.ps1"
   ```

   Without a flag the script only prints what it would do. Once the list looks right:

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\.claude\hooks\restore-claude.ps1" -Apply
   ```

   If the paths changed (different drive letter, different layout), add a mapping:

   ```powershell
   ... -Apply -Map "D:\Praca=E:\Praca"
   ```

   The mapping also covers the `projects/<slug>/memory` directories: their names derive
   from the project path, so without it Claude will not find its memory.

4. Reinstall the plugins:

   ```
   /plugin marketplace add anthropics/claude-plugins-official
   /plugin marketplace add kepano/obsidian-skills
   /plugin install superpowers@claude-plugins-official
   /plugin install figma@claude-plugins-official
   /plugin install obsidian@obsidian-skills
   ```

   You get the latest versions. The state from before the failure is recorded in
   `plugins/installed_plugins.json` - go there if a new version breaks something.

5. Check that it came back:

   ```powershell
   powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\.claude\hooks\tests\run-all.ps1"
   ```

   And inside a Claude Code session: `/skills` lists the global skills, `/hooks` shows
   `SessionEnd`.

## What is deliberately absent

| Missing | Why |
|---|---|
| `.credentials.json` | OAuth tokens; sign in again |
| `projects/**/*.jsonl` | session transcripts, hundreds of megabytes, growing daily |
| `history.jsonl` | prompt history, generated |
| `paste-cache/`, `file-history/`, `cache/`, `shell-snapshots/` | caches |
| `sessions/`, `daemon/`, `jobs/`, `tasks/`, `session-env/`, `ide/` | runtime state |
| `plugins/cache/`, `plugins/marketplaces/` | third-party code, reinstallable from the manifest (step 4) |

If you are looking here for something in that table: it was never backed up and it is not
coming back.

## Day-to-day

| Situation | Command |
|---|---|
| Sync by hand | `hooks\backup-claude.ps1` |
| A new `.claude` directory appeared | `hooks\backup-claude.ps1 -Rescan` |
| Find out what went wrong | `Get-Content backups\sync.log -Tail 30` |
| Run the tests | `hooks\tests\run-all.ps1` |

`backups/claude-dirs/` holds **one-way** copies. Editing a file there does not change the
source and will be overwritten by the next sync. Edit skills in their original locations.
````

- [ ] **Step 4: Verify the README commands are real**

```powershell
Select-String -Path C:\Users\rafal\.claude\README.md -Pattern 'hooks\\(backup|restore|tests)' |
    ForEach-Object { $_.Line.Trim() }
Test-Path C:\Users\rafal\.claude\hooks\backup-claude.ps1
Test-Path C:\Users\rafal\.claude\hooks\restore-claude.ps1
Test-Path C:\Users\rafal\.claude\hooks\tests\run-all.ps1
```

Expected: `True` three times. The README must not point at a script that does not exist.

- [ ] **Step 5: Gate, commit and push the README**

```powershell
git add README.md
Import-Module C:\Users\rafal\.claude\hooks\lib\ClaudeBackup.psm1 -Force
git diff --cached --name-only | ForEach-Object {
    $hit = Test-SecretContent -Path (Join-Path 'C:\Users\rafal\.claude' $_)
    if ($hit) { Write-Host "BLOCKED $_ : $hit" -ForegroundColor Red }
}
```

No output means the gate passed.

```bash
git commit -m "docs: add restore procedure and daily operations

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0115YBg2ri1ajCfG8GNynEsZ"
git push origin main
```

- [ ] **Step 6: Full test run and a final live sync**

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Users\rafal\.claude\hooks\tests\run-all.ps1"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Users\rafal\.claude\hooks\backup-claude.ps1" -Rescan -Verbose
Get-Content C:\Users\rafal\.claude\backups\sync.log -Tail 10
```

Expected: `all tests passed`, then either `no changes` or a clean commit and push. Anything the sync sweeps up here is state the earlier steps left behind — look at `git log -1 --stat` before accepting it.

---

## Final verification

After Task 8 every one of these must hold. Note what is deliberately *not* asserted: a commit count. Task 5 and Task 7 each run a live sync that may commit on its own, so the total is not fixed — assert content, not arithmetic.

- [ ] `git log origin/main --oneline -1` — the remote carries the latest local commit; `git status --porcelain` is empty.
- [ ] `git ls-files | Measure-Object -Line` — under 300 files.
- [ ] `git ls-files | Select-String 'credentials|\.jsonl|\.key$|plugins/cache'` — no output.
- [ ] `git ls-files 'backups/claude-dirs/**/SKILL.md' | Measure-Object -Line` — at least 13.
- [ ] `git ls-files 'skills/**/SKILL.md' | Measure-Object -Line` — at least 5.
- [ ] `git ls-files 'projects/*/memory/*' | Measure-Object -Line` — exactly 80; a closed set, so a smaller number is loss rather than drift.
- [ ] `git ls-files` contains `backups/claude-dirs/D--Notatki-notatki/CLAUDE.md` and `backups/claude-dirs/D--Praca-Devstock-Baza-wiedzy/agents/kb-scan.md` — both mirrored locations are actually covered.
- [ ] `hooks\tests\run-all.ps1` exits 0.
- [ ] A Claude Code session in `D:\Notatki\notatki` appends an entry to `backups/sync.log`.
