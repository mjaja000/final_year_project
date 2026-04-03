param(
  [int]$Port = 5000
)

$ErrorActionPreference = 'Continue'

Write-Host "[restart-backend] Checking listeners on port $Port..."

$listeners = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue

if ($listeners) {
  $listeners | ForEach-Object {
    $pidToStop = $_.OwningProcess
    if ($pidToStop) {
      Write-Host "[restart-backend] Stopping process on port $Port (PID: $pidToStop)"
      Stop-Process -Id $pidToStop -Force -ErrorAction SilentlyContinue
    }
  }
  Start-Sleep -Milliseconds 500
} else {
  Write-Host "[restart-backend] No listener found on port $Port"
}

Write-Host "[restart-backend] Starting backend..."
Set-Location (Join-Path $PSScriptRoot "..")
pnpm start
