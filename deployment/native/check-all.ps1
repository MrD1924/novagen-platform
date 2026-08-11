# Checks all 10 services in one shot. For anything not responding, prints the
# last lines of its error log automatically - no manual window-hunting needed.
# Run from the repo root:
#   .\deployment\native\check-all.ps1

$LogDir = Join-Path $PSScriptRoot "logs"

$Services = @(
    @{ Name = "gateway"; Port = 8000 },
    @{ Name = "auth-service"; Port = 8001 },
    @{ Name = "drug-service"; Port = 8002 },
    @{ Name = "prediction-service"; Port = 8003 },
    @{ Name = "analytics-service"; Port = 8004 },
    @{ Name = "experiment-service"; Port = 8005 },
    @{ Name = "report-service"; Port = 8006 },
    @{ Name = "notification-service"; Port = 8007 },
    @{ Name = "workflow-service"; Port = 8008 },
    @{ Name = "automation-service"; Port = 8009 }
)

$failures = @()

foreach ($svc in $Services) {
    $name = $svc.Name
    $port = $svc.Port
    Write-Host -NoNewline "$name (:$port) ... "

    try {
        # Force IPv4 explicitly. On some Windows machines "localhost" resolves to
        # the IPv6 loopback (::1) first, and requests to that address can hang
        # indefinitely even when the service is listening and healthy on IPv4 -
        # this bit us for real during development, so 127.0.0.1 here is deliberate,
        # not a style choice.
        $resp = Invoke-WebRequest -Uri "http://127.0.0.1:$port/health" -UseBasicParsing -TimeoutSec 3
        Write-Host "OK ($($resp.StatusCode))" -ForegroundColor Green
    } catch {
        Write-Host "FAILED" -ForegroundColor Red
        $failures += $name
    }
}

if ($failures.Count -eq 0) {
    Write-Host ""
    Write-Host "All 10 services are up." -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "===== DIAGNOSTICS FOR FAILED SERVICES =====" -ForegroundColor Yellow

foreach ($name in $failures) {
    Write-Host ""
    Write-Host "----- $name -----" -ForegroundColor Cyan

    $installLog = Join-Path $LogDir "$name.install.log"
    $failMarker = Join-Path $LogDir "$name.install-failed"
    $errLog = Join-Path $LogDir "$name.err.log"

    if (Test-Path $failMarker) {
        Write-Host "Dependency install failed - last 20 lines of $($name).install.log:"
        Get-Content $installLog -Tail 20
    } elseif (Test-Path $errLog) {
        $errContent = Get-Content $errLog -Tail 25
        if ($errContent) {
            Write-Host "Last 25 lines of $($name).err.log:"
            $errContent
        } else {
            Write-Host "Error log is empty - service may still be starting, or crashed with no output. Try re-running check-all.ps1 in a few seconds."
        }
    } else {
        Write-Host "No logs found at all for $name - it may never have started. Re-run start-all.ps1."
    }
}

Write-Host ""
Write-Host "Copy everything above (from '===== DIAGNOSTICS' down) and send it back for help." -ForegroundColor Yellow
