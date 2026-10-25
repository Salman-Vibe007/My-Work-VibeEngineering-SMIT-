# Idempotent start script (Windows PowerShell). Usage: .\scripts\start_windows.ps1 [-Build]
param([switch]$Build)
Set-Location (Join-Path $PSScriptRoot "..")
if (-not (Test-Path .env)) { Write-Host "Missing .env - copy .env.example to .env first"; exit 1 }
docker image inspect finally *> $null
if ($Build -or $LASTEXITCODE -ne 0) { docker build -t finally . }
docker rm -f finally *> $null
docker run -d --name finally -v "${PWD}/db:/app/db" -p 8000:8000 --env-file .env finally | Out-Null
Write-Host "FinAlly is running at http://localhost:8000"
Start-Process "http://localhost:8000"
