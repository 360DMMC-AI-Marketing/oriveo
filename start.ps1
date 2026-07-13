# Start Oriveo - Backend + Frontend
Write-Host "Starting Oriveo..." -ForegroundColor Cyan

# Kill only the backend node process on port 5000
$existing = netstat -ano | Select-String ":5000 " | ForEach-Object { ($_ -split '\s+')[-1] } | Select-Object -Unique
foreach ($pid in $existing) { if ($pid -and $pid -ne "0") { Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue } }
Start-Sleep -Seconds 2

# Start backend with PM2
$serverDir = Join-Path $PSScriptRoot "server"
Set-Location $serverDir
$pm2 = Join-Path $serverDir "node_modules\.bin\pm2.cmd"
if (Test-Path $pm2) {
  Start-Process powershell -ArgumentList "-NoProfile -Command `"& '$pm2' start pm2.config.cjs`"" -WindowStyle Hidden
} else {
  Start-Process powershell -ArgumentList "-NoProfile -Command `"Set-Location '$serverDir'; node index.js`"" -WindowStyle Hidden
}
Write-Host "  Backend started" -ForegroundColor Green

# Start frontend
$clientDir = Join-Path $PSScriptRoot "client"
Start-Process powershell -ArgumentList "-NoProfile -Command `"Set-Location '$clientDir'; npx vite --host`"" -WindowStyle Hidden
Write-Host "  Frontend started" -ForegroundColor Green

Write-Host "Oriveo is running!" -ForegroundColor Cyan
Write-Host "  Backend:  http://localhost:5000" -ForegroundColor Yellow
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor Yellow
