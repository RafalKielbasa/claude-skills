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
