# Starts all 10 NovaGen backend services natively (no Docker) on Windows.
# Run from the repo root in PowerShell:
#   .\deployment\native\start-all.ps1
#
# Unlike the previous version, this does NOT open 10 separate windows.
# Every service runs hidden in the background with its output captured to
# deployment\native\logs\<service>.log and deployment\native\logs\<service>.err.log
# (stdout and stderr, separately, since uvicorn's startup banner and real
# tracebacks land in different streams). Use check-all.ps1 afterwards to get
# a single readable summary instead of clicking through windows.

$ErrorActionPreference = "Continue"
$RepoRoot = Resolve-Path "$PSScriptRoot\..\.."
$BackendDir = Join-Path $RepoRoot "backend"
$EnvFile = Join-Path $RepoRoot ".env"
$LogDir = Join-Path $PSScriptRoot "logs"
$PidDir = Join-Path $PSScriptRoot "pids"

if (-not (Test-Path $EnvFile)) {
    Write-Host "No .env found at repo root ($EnvFile)." -ForegroundColor Red
    Write-Host "Copy deployment\native\.env.native.example to .env first and fill in real passwords."
    exit 1
}

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
New-Item -ItemType Directory -Force -Path $PidDir | Out-Null

# Load .env into THIS process's environment so child uvicorn processes inherit it.
Get-Content $EnvFile | ForEach-Object {
    if ($_ -match '^\s*([^#=\s][^=]*)\s*=\s*(.*)\s*$') {
        [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
    }
}

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

foreach ($svc in $Services) {
    $name = $svc.Name
    $port = $svc.Port
    $svcDir = Join-Path $BackendDir $name
    $venvDir = Join-Path $svcDir "venv"
    $pythonExe = Join-Path $venvDir "Scripts\python.exe"
    $uvicornExe = Join-Path $venvDir "Scripts\uvicorn.exe"

    Write-Host "=== $name (port $port) ===" -ForegroundColor Cyan

    if (-not (Test-Path $venvDir)) {
        Write-Host "  creating venv..."
        python -m venv $venvDir
    }

    Write-Host "  installing dependencies..."
    $installLog = Join-Path $LogDir "$name.install.log"
    $failMarker = Join-Path $LogDir "$name.install-failed"
    Remove-Item $failMarker -ErrorAction SilentlyContinue
    & $pythonExe -m pip install -r "$svcDir\requirements.txt" *> $installLog
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  DEPENDENCY INSTALL FAILED - see $installLog" -ForegroundColor Red
        New-Item -ItemType File -Path $failMarker | Out-Null
        continue
    }

    Write-Host "  starting on :$port (backgrounded, logging to $LogDir\$name.log)..."
    $stdout = Join-Path $LogDir "$name.log"
    $stderr = Join-Path $LogDir "$name.err.log"
    $env:PYTHONPATH = $BackendDir

    $proc = Start-Process -FilePath $uvicornExe `
        -ArgumentList "app.main:app", "--host", "0.0.0.0", "--port", "$port" `
        -WorkingDirectory $svcDir `
        -RedirectStandardOutput $stdout `
        -RedirectStandardError $stderr `
        -WindowStyle Hidden `
        -PassThru

    $proc.Id | Out-File (Join-Path $PidDir "$name.pid")
}

Write-Host ""
Write-Host "All services launched in the background. Give them 10-15 seconds to boot, then run:" -ForegroundColor Yellow
Write-Host "  .\deployment\native\check-all.ps1"
Write-Host ""
Write-Host "Stop everything with: .\deployment\native\stop-all.ps1"
