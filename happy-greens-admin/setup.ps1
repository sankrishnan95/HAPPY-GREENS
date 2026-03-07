# Happy Greens Admin Dashboard - Quick Start Script

Write-Host "=====================================" -ForegroundColor Green
Write-Host "Happy Greens Admin Dashboard Setup" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

$adminDir = "C:\Users\sankr\.gemini\antigravity\scratch\happy-greens-admin"

# Check if directory exists
if (-not (Test-Path $adminDir)) {
    Write-Host "✗ Admin directory not found" -ForegroundColor Red
    exit 1
}

Set-Location $adminDir

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
    Write-Host ""
    npm install
    Write-Host ""
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
}
else {
    Write-Host "✓ Dependencies already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Ensure backend is running on http://localhost:3000" -ForegroundColor White
Write-Host "2. Run: npm run dev" -ForegroundColor White
Write-Host "3. Open: http://localhost:5173" -ForegroundColor White
Write-Host "4. Login: admin@happygreens.com / admin123" -ForegroundColor White
Write-Host ""
Write-Host "Testing Guide: See TESTING.md" -ForegroundColor Yellow
Write-Host ""

# Ask if user wants to start dev server
$start = Read-Host "Start development server now? (y/n)"
if ($start -eq "y" -or $start -eq "Y") {
    Write-Host ""
    Write-Host "Starting development server..." -ForegroundColor Cyan
    Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
    Write-Host ""
    npm run dev
}
