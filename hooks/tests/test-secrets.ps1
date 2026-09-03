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

    # --- size is not an exemption: a key past the first megabytes is still caught ---
    $large  = Join-Path $sandbox 'large.md'
    $filler = ('lorem ipsum ' * 100) + "`n"
    $writer = New-Object System.IO.StreamWriter($large)
    for ($i = 0; $i -lt 2000; $i++) { $writer.Write($filler) }
    $writer.Write('key = "' + 'sk-ant-' + 'api03-' + ('q' * 40) + '"')
    $writer.Close()
    Assert-True -Condition ((Get-Item -LiteralPath $large).Length -gt 2MB) -Because 'the fixture really is over 2MB'
    Assert-True -Condition ($null -ne (Test-SecretContent -Path $large)) -Because 'a key beyond the first chunk is still caught'

    # --- binary files are skipped rather than regexed ---
    $binary = Join-Path $sandbox 'blob.bin'
    [System.IO.File]::WriteAllBytes($binary, ([byte[]](0, 1, 2, 0, 255) * 100))
    Assert-True -Condition ($null -eq (Test-SecretContent -Path $binary)) -Because 'binary content is skipped'
} finally {
    Remove-Item -LiteralPath $sandbox -Recurse -Force -ErrorAction SilentlyContinue
}

exit (Get-AssertFailureCount)
