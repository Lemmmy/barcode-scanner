# Build script for Electron desktop app
Write-Host "Building Barcode Scanner Desktop App..." -ForegroundColor Cyan

# Step 0: Clean up any running instances and old builds
Write-Host "`n[0/4] Cleaning up..." -ForegroundColor Yellow
Get-Process -Name "Barcode Scanner" -ErrorAction SilentlyContinue | Stop-Process -Force
if (Test-Path "electron\release") {
    Remove-Item -Path "electron\release" -Recurse -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 1

# Step 1: Build the web app for Electron
Write-Host "`n[1/4] Building web app for Electron..." -ForegroundColor Yellow
Set-Location web
pnpm run build:electron
if ($LASTEXITCODE -ne 0) {
    Write-Host "Web build failed!" -ForegroundColor Red
    exit 1
}
Set-Location ..

# Step 2: Install Electron dependencies
Write-Host "`n[2/4] Installing Electron dependencies..." -ForegroundColor Yellow
Set-Location electron
pnpm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Dependency installation failed!" -ForegroundColor Red
    exit 1
}
Set-Location ..

# Step 3: Build Electron main process
Write-Host "`n[3/4] Building Electron main process..." -ForegroundColor Yellow
Set-Location electron
pnpm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Electron build failed!" -ForegroundColor Red
    exit 1
}
Set-Location ..

# Step 4: Package the application
Write-Host "`n[4/4] Packaging Windows executable..." -ForegroundColor Yellow
Set-Location electron
pnpm run package:win
if ($LASTEXITCODE -ne 0) {
    Write-Host "Packaging failed!" -ForegroundColor Red
    exit 1
}
Set-Location ..

Write-Host "`nBuild complete! Executable is in electron/release/" -ForegroundColor Green
