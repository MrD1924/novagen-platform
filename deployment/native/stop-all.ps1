# Stops all services started by start-all.ps1, using the PID files it wrote.
# Run from the repo root:
#   .\deployment\native\stop-all.ps1

$PidDir = Join-Path $PSScriptRoot "pids"

if (-not (Test-Path $PidDir)) {
    Write-Host "No pids\ directory found - nothing appears to be running via start-all.ps1."
    exit 0
}

Get-ChildItem $PidDir -Filter "*.pid" | ForEach-Object {
    $name = $_.BaseName
    $procId = Get-Content $_.FullName
    try {
        Stop-Process -Id $procId -ErrorAction Stop
        Write-Host "Stopped $name (pid $procId)"
    } catch {
        Write-Host "$name (pid $procId) was not running"
    }
    Remove-Item $_.FullName
}

Write-Host ""
Write-Host "Done. PostgreSQL/MongoDB/Neo4j/Redis are Windows services - leave them running, or stop individually via Get-Service / services.msc if you want."
