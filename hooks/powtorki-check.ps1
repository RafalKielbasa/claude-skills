# SessionStart hook: on the first Claude session of the day, count overdue
# spaced-repetition items in the nauka-z-claude progress file and, if any,
# emit context asking the model to propose a review (one sentence, then wait).
# Any output on stdout is appended to the session context by Claude Code.
$ErrorActionPreference = 'Stop'

$progressFile = 'D:\Notatki\notatki\nauka-z-claude.md'
$markerFile = Join-Path $PSScriptRoot 'powtorki-last-check.txt'

try {
    $today = Get-Date -Format 'yyyy-MM-dd'

    # Marker holds the date of the last check; same date -> not the first
    # session of the day, stay silent.
    if ((Test-Path $markerFile) -and ((Get-Content $markerFile -TotalCount 1) -eq $today)) {
        exit 0
    }
    Set-Content -Path $markerFile -Value $today -Encoding Ascii

    if (-not (Test-Path $progressFile)) { exit 0 }
    $content = Get-Content -Path $progressFile -Raw -Encoding UTF8

    # Matches the skill's review-item format: "[nastepna: YYYY-MM-DD, ...]".
    # The Polish e-ogonek is built from its code point to keep this file ASCII-only.
    $duePattern = "nast$([char]0x0119)pna: (\d{4}-\d{2}-\d{2})"
    $due = [regex]::Matches($content, $duePattern) | Where-Object { $_.Groups[1].Value -le $today }
    $count = ($due | Measure-Object).Count
    if ($count -eq 0) { exit 0 }

    Write-Output "First Claude session today: $count overdue spaced-repetition item(s) in $progressFile. Invoke the nauka-z-claude skill in review mode ('Powtorki' section): propose the review to the user in ONE short sentence and wait for their decision. Do not start quizzing without an explicit yes; if declined or ignored, proceed with the session's actual task."
} catch {
    # A broken hook must never block session startup; fail silently.
    exit 0
}
