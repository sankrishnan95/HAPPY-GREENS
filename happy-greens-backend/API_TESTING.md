# Happy Greens Backend - API Testing Guide

## Test Credentials

### Admin User
- **Email:** admin@happygreens.com
- **Password:** admin123
- **Role:** admin

### Test Customer
- **Email:** customer@test.com
- **Password:** customer123
- **Role:** customer

---

## Test Data Summary

- **Categories:** 6 (Fruits, Vegetables, Dairy, Staples, Snacks, Beverages)
- **Products:** 30 grocery items
- **Test Order ID:** 1 (paid status)
- **Payment:** Razorpay UPI (succeeded)

---

## API Testing Steps

### 1. Admin Login
```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@happygreens.com",
  "password": "admin123"
}
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "admin@happygreens.com",
    "role": "admin"
  }
}
```

**Save the JWT token for subsequent requests.**

---

### 2. Test Admin Analytics

#### Revenue Analytics
```bash
GET http://localhost:3000/api/admin/analytics/revenue
Authorization: Bearer <your_jwt_token>
```

#### Orders Analytics
```bash
GET http://localhost:3000/api/admin/analytics/orders
Authorization: Bearer <your_jwt_token>
```

#### Customer Analytics
```bash
GET http://localhost:3000/api/admin/analytics/customers
Authorization: Bearer <your_jwt_token>
```

#### Product Analytics
```bash
GET http://localhost:3000/api/admin/analytics/products
Authorization: Bearer <your_jwt_token>
```

---

### 3. Test Power BI Views

```bash
# Connect to database
psql -U postgres -d happy_greens

# Test bi_sales view
SELECT * FROM bi_sales;

# Test bi_products view
SELECT * FROM bi_products ORDER BY total_revenue DESC LIMIT 10;

# Test bi_customers view
SELECT * FROM bi_customers ORDER BY total_spent DESC;

# Test bi_inventory view
SELECT * FROM bi_inventory WHERE days_of_stock_left < 30;
```

---

### 4. Generate Invoice PDF

#### A4 Invoice
```bash
GET http://localhost:3000/api/admin/orders/1/invoice?format=a4
Authorization: Bearer <your_jwt_token>
```

**Expected:** PDF file download with professional invoice

#### Thermal Receipt
```bash
GET http://localhost:3000/api/admin/orders/1/invoice?format=thermal
Authorization: Bearer <your_jwt_token>
```

**Expected:** 80mm thermal receipt PDF

---

## Using cURL

### Admin Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@happygreens.com\",\"password\":\"admin123\"}"
```

### Get Revenue Analytics
```bash
curl -X GET http://localhost:3000/api/admin/analytics/revenue \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Download Invoice PDF
```bash
curl -X GET "http://localhost:3000/api/admin/orders/1/invoice?format=a4" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -o invoice.pdf
```

---

## Using Postman

1. **Import Collection:**
   - Create new collection "Happy Greens API"
   - Add environment variable `base_url` = `http://localhost:3000`
   - Add environment variable `admin_token` (will be set after login)

2. **Login Request:**
   - Method: POST
   - URL: `{{base_url}}/api/auth/login`
   - Body (JSON):
     ```json
     {
       "email": "admin@happygreens.com",
       "password": "admin123"
     }
     ```
   - Test Script:
     ```javascript
     pm.environment.set("admin_token", pm.response.json().token);
     ```

3. **Analytics Requests:**
   - Method: GET
   - URL: `{{base_url}}/api/admin/analytics/revenue`
   - Headers: `Authorization: Bearer {{admin_token}}`

4. **Invoice Request:**
   - Method: GET
   - URL: `{{base_url}}/api/admin/orders/1/invoice?format=a4`
   - Headers: `Authorization: Bearer {{admin_token}}`
   - Send and Download: Click "Send and Download"

---

## Expected Test Results

### ✓ Admin Login
- Returns JWT token
- User object with admin role

### ✓ Revenue Analytics
- Total revenue: ₹500.00
- 1 successful payment
- Average order value: ₹500.00

### ✓ Orders Analytics
- Total orders: 1
- Orders by status: 1 paid

### ✓ Customer Analytics
- Total customers: 1
- John Doe with ₹500 spent

### ✓ Product Analytics
- 30 products listed
- Top products by revenue
- Low stock alerts

### ✓ Power BI Views
- bi_sales: 1 row (order #1)
- bi_products: 30 rows
- bi_customers: 1 row (John Doe)
- bi_inventory: 30 rows with stock calculations

### ✓ Invoice PDF
- **A4 Format:**
  - Happy Greens header
  - Invoice #HG-1-XXXXXX
  - Customer: John Doe
  - 5 items listed
  - Total: ₹500.00
  - Payment: Razorpay (UPI)
  - Transaction ID: pay_test_1234567890

- **Thermal Format:**
  - Compact 80mm receipt
  - All order details
  - Payment information

---

## Troubleshooting

### "Invalid credentials"
- Check email and password
- Ensure database is seeded

### "Token is not valid"
- Token may have expired
- Login again to get new token

### "Order not found"
- Ensure order ID 1 exists
- Check database: `SELECT * FROM orders;`

### "Admin access required"
- Ensure using admin JWT token
- Check user role in database

---

## Next Steps

1. Test all endpoints
2. Verify PDF generation
3. Check Power BI views
4. Test with real Razorpay credentials (optional)
5. Deploy to production
