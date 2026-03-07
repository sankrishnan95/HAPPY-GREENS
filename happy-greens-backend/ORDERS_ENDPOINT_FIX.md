# Orders Endpoint Troubleshooting

## Issue: Orders page showing empty

## Solution

The `GET /api/admin/orders` endpoint **already exists** in the backend at:
`src/routes/admin.routes.ts` (lines 86-107)

### Most Likely Cause: Backend Not Restarted

After adding the endpoint, the backend server needs to be restarted.

### Fix Steps:

**1. Restart Backend Server**
```bash
# In backend terminal, press Ctrl+C to stop
# Then restart:
cd C:\Users\sankr\.gemini\antigravity\scratch\happy-greens-backend
npm run dev
```

**2. Verify Endpoint Works**
```bash
cd C:\Users\sankr\.gemini\antigravity\scratch\happy-greens-backend
.\test-orders-endpoint.ps1
```

**3. Check Database Has Orders**
```sql
psql -U postgres -d happy_greens
SELECT COUNT(*) FROM orders;
```

If count is 0, run seed script:
```bash
npm run seed
```

**4. Test in Frontend**
- Refresh browser (Ctrl+F5)
- Login: admin@happygreens.com / admin123
- Navigate to Orders page
- Should see order #1 with John Doe

---

## Endpoint Details

**URL:** `GET /api/admin/orders`

**Auth:** JWT token required (admin role)

**Response:**
```json
[
  {
    "id": 1,
    "user_id": 2,
    "total_amount": 500.00,
    "status": "paid",
    "payment_method": "razorpay",
    "created_at": "2026-02-03T...",
    "customer_name": "John Doe",
    "customer_email": "customer@test.com"
  }
]
```

---

## Alternative: Check Backend Logs

When you access the Orders page, check backend terminal for:
- `GET /api/admin/orders 200` (success)
- `GET /api/admin/orders 404` (endpoint not found - restart needed)
- `GET /api/admin/orders 401` (auth issue - re-login)
- `GET /api/admin/orders 500` (database error - check logs)

---

## If Still Not Working

1. **Check CORS:** Backend must allow http://localhost:5173
2. **Check JWT:** Token must be valid and not expired
3. **Check Database:** Orders table must have data
4. **Check Network Tab:** Browser DevTools > Network > Look for /api/admin/orders request
