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
