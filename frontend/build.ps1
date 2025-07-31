# PowerShell build script for React app
$env:PATH += ";C:\nvm4w\nodejs"

Write-Host "Building React app..." -ForegroundColor Green

# Install dependencies if needed
if (!(Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Build the app
Write-Host "Running react-scripts build..." -ForegroundColor Yellow
& "C:\nvm4w\nodejs\node.exe" ".\node_modules\.bin\react-scripts" build

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build completed successfully!" -ForegroundColor Green
} else {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
} 