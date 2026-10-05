# Reports recordings that have no note in the repo. Runs its real work once a day.
# Silent on any failure: a session must never be blocked by this hook.
$ErrorActionPreference = 'Stop'
try {
  $repo = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
  $stateDir = Join-Path $repo '.claude\state'
  $marker = Join-Path $stateDir ("nagrania-check-" + (Get-Date -Format 'yyyy-MM-dd') + '.txt')
  if (Test-Path $marker) { exit 0 }

  # Write the marker before the risky call, so a failed attempt still counts as today's attempt.
  if (-not (Test-Path $stateDir)) { New-Item -ItemType Directory -Path $stateDir | Out-Null }
  Set-Content -Path $marker -Value (Get-Date -Format 'o') -Encoding utf8

  $json = $env:NAGRANIA_CHECK_JSON
  if ($json) {
    $raw = Get-Content -Raw -Path $json
  } else {
    $raw = & npm --prefix (Join-Path $repo 'tools\kb-client') run --silent kb -- pending --json 2>$null
  }
  $transcripts = $raw | ConvertFrom-Json

  # A whole-day (offsite) or working-session (robocze) note can merge several transcripts into
  # one; the note records which ones it consumed in a bolded metadata line whose Polish heading
  # ("Zrodla:", i.e. "Sources:") carries diacritics. Built from character codes, not typed
  # literally, so this script's own encoding/codepage on disk can never corrupt the match.
  # Collect every such line once, from every note under planning/, so each transcript's file name
  # can be checked against all of them below - this is the only signal for a merged note, since a
  # date-only path (an offsite's own key) would otherwise silence every recording of that date.
  $zrodlaHeading = [string][char]0x179 + 'r' + [string][char]0xF3 + 'd' + [string][char]0x142 + 'a'
  $sourceLines = @()
  $planningDir = Join-Path $repo 'planning'
  if (Test-Path $planningDir) {
    # '*notatka.md' matches both the daily/robocze exact name ('notatka.md') and the offsite
    # name ('<date>-notatka.md'), which the plain 'notatka.md' filter used to miss entirely.
    $notes = Get-ChildItem -Path $planningDir -Recurse -Filter '*notatka.md' -ErrorAction SilentlyContinue
    foreach ($note in $notes) {
      $found = Select-String -Path $note.FullName -SimpleMatch -Pattern ('**' + $zrodlaHeading + ':**') -ErrorAction SilentlyContinue
      if ($found) { $sourceLines += ($found | ForEach-Object { $_.Line }) }
    }
  }

  $lines = @()
  foreach ($t in $transcripts) {
    # The artifact key is date and time - one day can have several recordings.
    $key = if ($t.time) { $t.date + '-' + $t.time } else { $t.date }
    $daily = Join-Path $repo ("planning\daily\" + $key + "\notatka.md")
    $roboczeHit = $false
    if ($t.time) {
      # Only meaningful when the transcript itself carries a time: without it, the "<key>-*"
      # filter below would match any robocze directory from that date, time-keyed or not.
      $roboczeDirs = Get-ChildItem -Path (Join-Path $repo 'planning\robocze') -Filter ($key + '-*') -Directory -ErrorAction SilentlyContinue
      foreach ($dir in $roboczeDirs) {
        # The directory alone does not count - a run interrupted before the note was written
        # still leaves the recording unprocessed.
        if (Test-Path (Join-Path $dir.FullName 'notatka.md')) { $roboczeHit = $true; break }
      }
    }
    $namedAsSource = $sourceLines | Where-Object { $_ -like ("*" + $t.name + "*") }
    if ((Test-Path $daily) -or $roboczeHit -or $namedAsSource) { continue }
    $cmd = if ($t.time) { "/daily " + $t.date + " " + $t.time } else { "/daily " + $t.date }
    $lines += "nieprzetworzone nagranie: " + $key + " (" + $t.name + ") - " + $cmd + " albo /spotkanie transkrypt " + $t.date
  }

  if ($lines.Count -gt 0) { $lines | ForEach-Object { Write-Output $_ } }
} catch {
  exit 0
}
