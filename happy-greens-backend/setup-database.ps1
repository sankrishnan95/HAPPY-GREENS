# Database Setup Script for Happy Greens Backend
# Run this script to set up the PostgreSQL database

Write-Host "==================================" -ForegroundColor Green
Write-Host "Happy Greens Database Setup" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""

# Add PostgreSQL to PATH for this session
$env:Path += ";C:\Program Files\PostgreSQL\18\bin"

Write-Host "Step 1: Checking PostgreSQL service..." -ForegroundColor Cyan
$service = Get-Service -Name postgresql-x64-18 -ErrorAction SilentlyContinue
if ($service.Status -eq "Running") {
    Write-Host "✓ PostgreSQL service is running" -ForegroundColor Green
} else {
    Write-Host "✗ PostgreSQL service is not running" -ForegroundColor Red
    Write-Host "Please start the service and try again" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Step 2: Creating database 'happy_greens'..." -ForegroundColor Cyan
Write-Host "You will be prompted for the PostgreSQL password" -ForegroundColor Yellow
Write-Host ""

# Create database
$createDbCommand = @"
CREATE DATABASE happy_greens;
"@

$createDbCommand | psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname = 'happy_greens'" | Out-Null

if ($LASTEXITCODE -eq 0) {
    # Check if database already exists
    $dbExists = psql -U postgres -t -c "SELECT 1 FROM pg_database WHERE datname = 'happy_greens'"
    
    if ($dbExists -match "1") {
        Write-Host "✓ Database 'happy_greens' already exists" -ForegroundColor Yellow
    } else {
        # Create the database
        psql -U postgres -c "CREATE DATABASE happy_greens"
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Database 'happy_greens' created successfully" -ForegroundColor Green
        } else {
            Write-Host "✗ Failed to create database" -ForegroundColor Red
            exit 1
        }
    }
} else {
    Write-Host "✗ Failed to connect to PostgreSQL" -ForegroundColor Red
    Write-Host "Please check your password and try again" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Step 3: Generating JWT secret..." -ForegroundColor Cyan
$jwtSecret = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
Write-Host "✓ JWT secret generated" -ForegroundColor Green

Write-Host ""
Write-Host "Step 4: Updating .env file..." -ForegroundColor Cyan

# Read current .env
$envPath = ".env"
$envContent = Get-Content $envPath -Raw

# Replace JWT_SECRET placeholder
$envContent = $envContent -replace "JWT_SECRET=your_strong_jwt_secret_here_minimum_32_characters", "JWT_SECRET=$jwtSecret"

# Save updated .env
$envContent | Set-Content $envPath -NoNewline

Write-Host "✓ .env file updated with JWT secret" -ForegroundColor Green

Write-Host ""
Write-Host "==================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env and replace 'your_password' with your PostgreSQL password" -ForegroundColor White
Write-Host "2. Add your Razorpay credentials to .env" -ForegroundColor White
Write-Host "3. Run: npm install" -ForegroundColor White
Write-Host "4. Run: npm run migrate" -ForegroundColor White
Write-Host "5. Run: npm run seed (optional)" -ForegroundColor White
Write-Host "6. Run: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Connection details:" -ForegroundColor Cyan
Write-Host "  Host: localhost" -ForegroundColor White
Write-Host "  Port: 5432" -ForegroundColor White
Write-Host "  Database: happy_greens" -ForegroundColor White
Write-Host "  Username: postgres" -ForegroundColor White
Write-Host ""
