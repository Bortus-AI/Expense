# PowerShell build script for the entire project
$env:PATH += ";C:\nvm4w\nodejs"

Write-Host "🚀 Building Expense Matcher for bunny.net deployment..." -ForegroundColor Green

# Install root dependencies
Write-Host "📦 Installing root dependencies..." -ForegroundColor Yellow
npm install

# Install backend dependencies
Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
cd backend
npm install
cd ..

# Install frontend dependencies
Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
cd frontend
npm install

# Build frontend
Write-Host "🔨 Building frontend..." -ForegroundColor Yellow
npm run build
cd ..

Write-Host "✅ Build completed successfully!" -ForegroundColor Green
Write-Host "📁 Frontend build is ready in: frontend/build/" -ForegroundColor Green 