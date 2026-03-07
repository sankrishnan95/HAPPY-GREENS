# Happy Greens API Test Script
# Tests admin login, analytics, and invoice generation

Write-Host "=====================================" -ForegroundColor Green
Write-Host "Happy Greens Backend API Testing" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

$baseUrl = "http://localhost:3000"
$adminEmail = "admin@happygreens.com"
$adminPassword = "admin123"

# Test 1: Health Check
Write-Host "Test 1: Health Check" -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "✓ Server is running" -ForegroundColor Green
    Write-Host "  Status: $($health.status)" -ForegroundColor White
}
catch {
    Write-Host "✗ Server is not running" -ForegroundColor Red
    Write-Host "  Please start the server with: npm run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Test 2: Admin Login
Write-Host "Test 2: Admin Login" -ForegroundColor Cyan
try {
    $loginBody = @{
        email    = $adminEmail
        password = $adminPassword
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $adminToken = $loginResponse.token
    
    Write-Host "✓ Admin login successful" -ForegroundColor Green
    Write-Host "  Email: $($loginResponse.user.email)" -ForegroundColor White
    Write-Host "  Role: $($loginResponse.user.role)" -ForegroundColor White
    Write-Host "  Token: $($adminToken.Substring(0, 20))..." -ForegroundColor White
}
catch {
    Write-Host "✗ Admin login failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "  Please seed the database first" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Test 3: Revenue Analytics
Write-Host "Test 3: Revenue Analytics" -ForegroundColor Cyan
try {
    $headers = @{
        Authorization = "Bearer $adminToken"
    }
    
    $revenue = Invoke-RestMethod -Uri "$baseUrl/api/admin/analytics/revenue" -Method Get -Headers $headers
    
    Write-Host "✓ Revenue analytics retrieved" -ForegroundColor Green
    Write-Host "  Total Revenue: ₹$($revenue.total_revenue)" -ForegroundColor White
    Write-Host "  Total Payments: $($revenue.total_payments)" -ForegroundColor White
    Write-Host "  Avg Order Value: ₹$($revenue.avg_order_value)" -ForegroundColor White
}
catch {
    Write-Host "✗ Revenue analytics failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# Test 4: Orders Analytics
Write-Host "Test 4: Orders Analytics" -ForegroundColor Cyan
try {
    $orders = Invoke-RestMethod -Uri "$baseUrl/api/admin/analytics/orders" -Method Get -Headers $headers
    
    Write-Host "✓ Orders analytics retrieved" -ForegroundColor Green
    Write-Host "  Total Orders: $($orders.total_orders)" -ForegroundColor White
    if ($orders.orders_by_status.Count -gt 0) {
        foreach ($status in $orders.orders_by_status) {
            Write-Host "  - $($status.status): $($status.count) orders (₹$($status.total_value))" -ForegroundColor White
        }
    }
}
catch {
    Write-Host "✗ Orders analytics failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# Test 5: Customer Analytics
Write-Host "Test 5: Customer Analytics" -ForegroundColor Cyan
try {
    $customers = Invoke-RestMethod -Uri "$baseUrl/api/admin/analytics/customers" -Method Get -Headers $headers
    
    Write-Host "✓ Customer analytics retrieved" -ForegroundColor Green
    Write-Host "  Total Customers: $($customers.total_customers)" -ForegroundColor White
    if ($customers.top_customers.Count -gt 0) {
        Write-Host "  Top Customer: $($customers.top_customers[0].full_name) (₹$($customers.top_customers[0].total_spent))" -ForegroundColor White
    }
}
catch {
    Write-Host "✗ Customer analytics failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# Test 6: Product Analytics
Write-Host "Test 6: Product Analytics" -ForegroundColor Cyan
try {
    $products = Invoke-RestMethod -Uri "$baseUrl/api/admin/analytics/products" -Method Get -Headers $headers
    
    Write-Host "✓ Product analytics retrieved" -ForegroundColor Green
    Write-Host "  Top Products by Revenue:" -ForegroundColor White
    $topProducts = $products.top_products_by_revenue | Select-Object -First 3
    foreach ($product in $topProducts) {
        Write-Host "  - $($product.name): ₹$($product.total_revenue) ($($product.total_sold) sold)" -ForegroundColor White
    }
    Write-Host "  Low Stock Products: $($products.low_stock_products.Count)" -ForegroundColor White
}
catch {
    Write-Host "✗ Product analytics failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# Test 7: Invoice PDF Generation
Write-Host "Test 7: Invoice PDF Generation" -ForegroundColor Cyan
try {
    $invoiceUrl = "$baseUrl/api/admin/orders/1/invoice?format=a4"
    $outputPath = "test_invoice.pdf"
    
    Invoke-WebRequest -Uri $invoiceUrl -Headers $headers -OutFile $outputPath
    
    if (Test-Path $outputPath) {
        $fileSize = (Get-Item $outputPath).Length
        Write-Host "✓ Invoice PDF generated successfully" -ForegroundColor Green
        Write-Host "  File: $outputPath" -ForegroundColor White
        Write-Host "  Size: $fileSize bytes" -ForegroundColor White
        Write-Host "  Opening PDF..." -ForegroundColor White
        Start-Process $outputPath
    }
}
catch {
    Write-Host "✗ Invoice generation failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# Test 8: Thermal Receipt
Write-Host "Test 8: Thermal Receipt Generation" -ForegroundColor Cyan
try {
    $receiptUrl = "$baseUrl/api/admin/orders/1/invoice?format=thermal"
    $receiptPath = "test_receipt.pdf"
    
    Invoke-WebRequest -Uri $receiptUrl -Headers $headers -OutFile $receiptPath
    
    if (Test-Path $receiptPath) {
        $fileSize = (Get-Item $receiptPath).Length
        Write-Host "✓ Thermal receipt generated successfully" -ForegroundColor Green
        Write-Host "  File: $receiptPath" -ForegroundColor White
        Write-Host "  Size: $fileSize bytes" -ForegroundColor White
    }
}
catch {
    Write-Host "✗ Thermal receipt generation failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "Testing Complete!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  Admin Email: $adminEmail" -ForegroundColor White
Write-Host "  Admin Password: $adminPassword" -ForegroundColor White
Write-Host "  Test Order ID: 1" -ForegroundColor White
Write-Host "  Invoice PDF: test_invoice.pdf" -ForegroundColor White
Write-Host "  Receipt PDF: test_receipt.pdf" -ForegroundColor White
Write-Host ""
