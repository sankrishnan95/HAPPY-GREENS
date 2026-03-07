# Test Orders Endpoint

Write-Host "Testing GET /api/admin/orders endpoint..." -ForegroundColor Cyan
Write-Host ""

# First, login to get token
Write-Host "1. Logging in as admin..." -ForegroundColor Yellow
$loginBody = @{
    email    = "admin@happygreens.com"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "✓ Login successful" -ForegroundColor Green
    Write-Host "  Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
    Write-Host ""
}
catch {
    Write-Host "✗ Login failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Make sure backend is running on http://localhost:3000" -ForegroundColor Yellow
    exit 1
}

# Test orders endpoint
Write-Host "2. Fetching orders..." -ForegroundColor Yellow
try {
    $headers = @{
        Authorization = "Bearer $token"
    }
    
    $orders = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/orders" -Method Get -Headers $headers
    
    Write-Host "✓ Orders fetched successfully" -ForegroundColor Green
    Write-Host "  Total orders: $($orders.Count)" -ForegroundColor White
    Write-Host ""
    
    if ($orders.Count -gt 0) {
        Write-Host "Orders:" -ForegroundColor Cyan
        foreach ($order in $orders) {
            Write-Host "  Order #$($order.id)" -ForegroundColor White
            Write-Host "    Customer: $($order.customer_name)" -ForegroundColor Gray
            Write-Host "    Amount: ₹$($order.total_amount)" -ForegroundColor Gray
            Write-Host "    Status: $($order.status)" -ForegroundColor Gray
            Write-Host "    Date: $($order.created_at)" -ForegroundColor Gray
            Write-Host ""
        }
    }
    else {
        Write-Host "  No orders found in database" -ForegroundColor Yellow
        Write-Host "  Run seed script to create test data" -ForegroundColor Yellow
    }
    
}
catch {
    Write-Host "✗ Failed to fetch orders" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "  Status Code: $statusCode" -ForegroundColor Red
        
        if ($statusCode -eq 404) {
            Write-Host ""
            Write-Host "  Endpoint not found. Backend may need restart." -ForegroundColor Yellow
            Write-Host "  Stop backend (Ctrl+C) and run: npm run dev" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "Test complete!" -ForegroundColor Green
