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
