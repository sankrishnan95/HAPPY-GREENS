# Run Phase 6.5 Migration

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Phase 6.5: Operations Migration" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$env:PGPASSWORD = "postgres"
$dbName = "happy_greens"
$user = "postgres"
$migrationFile = "src\db\migrations\004_operations.sql"

Write-Host "Running migration: 004_operations.sql" -ForegroundColor Yellow
Write-Host ""

try {
    & "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U $user -d $dbName -f $migrationFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Migration completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Tables created:" -ForegroundColor Cyan
        Write-Host "  - order_status_history" -ForegroundColor White
        Write-Host "  - deliveries" -ForegroundColor White
        Write-Host "  - delivery_status_history" -ForegroundColor White
        Write-Host "  - coupons" -ForegroundColor White
        Write-Host "  - coupon_usage" -ForegroundColor White
        Write-Host ""
    }
    else {
        Write-Host "✗ Migration failed" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "✗ Error running migration: $_" -ForegroundColor Red
    exit 1
}

Remove-Item Env:\PGPASSWORD
