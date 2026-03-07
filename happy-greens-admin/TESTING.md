# Phase 6 Testing Guide - Admin Dashboard

## Prerequisites

✓ Backend running on http://localhost:3000
✓ Database seeded with test data
✓ Admin credentials: admin@happygreens.com / admin123

---

## Setup Steps

### 1. Install Dependencies

```bash
cd C:\Users\sankr\.gemini\antigravity\scratch\happy-greens-admin
npm install
```

**Expected:** Install React, Vite, Tailwind, Axios, Recharts, Lucide-react

### 2. Start Development Server

```bash
npm run dev
```

**Expected:** 
```
VITE v5.x.x ready in xxx ms
➜  Local:   http://localhost:5173/
```

### 3. Open Browser

Navigate to: http://localhost:5173

---

## Testing Checklist

### ✓ Login Page

**Test 1: Invalid Credentials**
- Email: wrong@email.com
- Password: wrongpass
- **Expected:** Error message "Invalid credentials"

**Test 2: Valid Admin Login**
- Email: admin@happygreens.com
- Password: admin123
- **Expected:** Redirect to dashboard, JWT token stored

**Test 3: Protected Route**
- Logout
- Try to access http://localhost:5173/orders directly
- **Expected:** Redirect to login page

---

### ✓ Dashboard Page

**Test 4: Stats Cards Display**
- **Expected:** 4 cards showing:
  - Today's Revenue (₹500.00 or actual)
  - Today's Orders (1 or actual count)
  - Total Customers (1 or actual count)
  - Low Stock Items (count from inventory)

**Test 5: Quick Actions**
- Click "Manage Orders"
- **Expected:** Navigate to /orders

---

### ✓ Orders Page

**Test 6: Orders Table**
- **Expected:** Table showing:
  - Order #1
  - Customer: John Doe
  - Amount: ₹500.00
  - Status: Paid (green badge)
  - Date: Today's date

**Test 7: Search Functionality**
- Search: "John"
- **Expected:** Filter to show only John Doe's orders

**Test 8: Status Filter**
- Select "Paid" from dropdown
- **Expected:** Show only paid orders

**Test 9: View Order**
- Click "View" button
- **Expected:** Alert showing order details

**Test 10: Print Invoice**
- Click "Print" button on paid order
- **Expected:** 
  - New tab opens with PDF
  - PDF shows Happy Greens invoice
  - Contains order items, total, payment info
  - Razorpay transaction ID visible

---

### ✓ Products Page

**Test 11: Products Table**
- **Expected:** Table showing 30 products with:
  - Product name
  - Category
  - Price
  - Stock quantity
  - Total sold
  - Days of stock left
  - Status badge

**Test 12: Low Stock Highlighting**
- **Expected:** Products with stock < 10 show:
  - Red "Low Stock" badge
  - Alert triangle icon

**Test 13: Search Products**
- Search: "Apple"
- **Expected:** Filter to show only Apple products

**Test 14: Category Filter**
- Select "Fruits" from dropdown
- **Expected:** Show only fruit products

---

### ✓ Reports Page

**Test 15: Revenue Chart**
- **Expected:** Line chart showing revenue over last 30 days

**Test 16: Top Products Chart**
- **Expected:** Bar chart showing top 10 products by revenue

**Test 17: Category Performance**
- **Expected:** Pie chart showing revenue by category

**Test 18: Top Customers Table**
- **Expected:** Table showing customers with:
  - Name: John Doe
  - Orders: 1
  - Total Spent: ₹500.00

**Test 19: Low Stock Alerts**
- **Expected:** Table showing products with stock < 10

---

### ✓ Navigation & UI

**Test 20: Sidebar Navigation**
- Click each menu item
- **Expected:** Navigate to correct page, active state highlighted

**Test 21: Logout**
- Click "Logout" button in header
- **Expected:** 
  - JWT token removed
  - Redirect to login page
  - Cannot access protected routes

**Test 22: Responsive Design**
- Resize browser window
- **Expected:** Layout adjusts appropriately

---

## Common Issues & Fixes

### Issue 1: CORS Error
**Error:** "Access to XMLHttpRequest blocked by CORS policy"

**Fix:** Ensure backend has CORS enabled for http://localhost:5173

Add to backend `server.ts`:
```typescript
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

### Issue 2: 401 Unauthorized
**Error:** All API calls return 401

**Fix:** 
- Check JWT token in localStorage
- Verify backend is running
- Re-login to get fresh token

### Issue 3: Orders API Missing
**Error:** Cannot GET /api/admin/orders

**Fix:** Add orders endpoint to backend:
```typescript
router.get('/orders', authenticate, requireAdmin, async (req, res) => {
  const result = await pool.query(`
    SELECT o.*, u.full_name as customer_name
    FROM orders o
    JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
  `);
  res.json(result.rows);
});
```

### Issue 4: Inventory API Missing
**Error:** Cannot GET /api/admin/inventory

**Fix:** Add inventory endpoint to backend:
```typescript
router.get('/inventory', authenticate, requireAdmin, async (req, res) => {
  const result = await pool.query('SELECT * FROM bi_inventory');
  res.json(result.rows);
});
```

### Issue 5: Charts Not Rendering
**Error:** Recharts components not displaying

**Fix:** 
- Check browser console for errors
- Verify data format matches chart requirements
- Ensure ResponsiveContainer has parent with defined height

---

## Expected Results Summary

✅ **Login:** Secure authentication with JWT
✅ **Dashboard:** 4 stat cards with real data
✅ **Orders:** Table with search, filter, view, print
✅ **Products:** Inventory tracking with low stock alerts
✅ **Reports:** 4 charts + 2 tables with analytics
✅ **Navigation:** Sidebar, protected routes, logout
✅ **UI:** Green grocery theme, responsive layout

---

## Backend Endpoints Required

Ensure these endpoints exist:

```
POST   /api/auth/login
GET    /api/admin/analytics/revenue
GET    /api/admin/analytics/orders
GET    /api/admin/analytics/customers
GET    /api/admin/analytics/products
GET    /api/admin/orders
GET    /api/admin/orders/:id/invoice?format=a4
GET    /api/admin/inventory (optional, uses bi_inventory view)
```

---

## Screenshots to Verify

1. Login page with Happy Greens branding
2. Dashboard with 4 stat cards
3. Orders table with print button
4. Products table with low stock highlighting
5. Reports page with charts
6. Invoice PDF in new tab

---

## Performance Checks

- [ ] Page loads in < 2 seconds
- [ ] API calls complete in < 500ms
- [ ] Charts render smoothly
- [ ] No console errors
- [ ] Invoice PDF generates in < 3 seconds

---

## Next Steps After Verification

Once all tests pass:
1. Document any issues found
2. Fix critical bugs
3. Optimize performance if needed
4. Ready for Phase 7 (if applicable)

---

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify backend is running and accessible
3. Check network tab for failed API calls
4. Ensure database has test data
5. Verify JWT token is being sent with requests
