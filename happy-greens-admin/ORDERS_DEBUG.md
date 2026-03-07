# Orders Page Debugging Checklist

## Issue: Orders page is empty

Follow these steps in order:

---

## Step 1: Check Browser Console

Open browser DevTools (F12) → Console tab

Look for these logs when Orders page loads:

### ✅ Expected Good Logs:
```
🔄 Loading orders from /admin/orders...
📍 API Base URL: http://localhost:3000/api
🔑 JWT Token exists: true
🔐 API Request: GET /admin/orders (JWT attached)
✅ API Response: GET /admin/orders - Status 200
✅ Orders API Response: {data: Array(1), status: 200, ...}
📦 Orders data: [{id: 1, customer_name: "John Doe", ...}]
📊 Orders count: 1
```

### ❌ Error Scenarios:

**Scenario A: Network Error**
```
❌ API Error: GET /admin/orders
🔴 Network error - backend may not be running
```
**Fix:** Start backend server
```bash
cd happy-greens-backend
npm run dev
```

**Scenario B: 404 Not Found**
```
❌ API Error: GET /admin/orders - Status 404
🔴 Endpoint not found - backend may need restart
```
**Fix:** Restart backend server (Ctrl+C, then npm run dev)

**Scenario C: 401 Unauthorized**
```
❌ API Error: GET /admin/orders - Status 401
🔴 401 Unauthorized - Redirecting to login
```
**Fix:** Re-login to get fresh JWT token

**Scenario D: Empty Response**
```
✅ Orders API Response: {data: [], ...}
📊 Orders count: 0
⚠️ No orders returned from API
```
**Fix:** Database has no orders - run seed script

---

## Step 2: Check Network Tab

DevTools → Network tab → Reload page

Look for request to `/admin/orders`:

### Check Request:
- **URL:** `http://localhost:3000/api/admin/orders`
- **Method:** GET
- **Status:** 200 (green)
- **Headers → Authorization:** `Bearer eyJhbGc...` (JWT token present)

### Check Response:
- **Preview tab:** Should show array of orders
- **Response tab:** Should show JSON like:
```json
[
  {
    "id": 1,
    "customer_name": "John Doe",
    "total_amount": 500,
    "status": "paid",
    "created_at": "2026-02-03T..."
  }
]
```

---

## Step 3: Verify Backend is Running

In backend terminal, you should see:
```
Server running on port 3000
```

Test endpoint directly:
```powershell
cd happy-greens-backend
.\test-orders-endpoint.ps1
```

Expected output:
```
✓ Login successful
✓ Orders fetched successfully
  Total orders: 1
```

---

## Step 4: Verify Database Has Orders

```bash
psql -U postgres -d happy_greens
```

```sql
SELECT COUNT(*) FROM orders;
```

If count is 0:
```bash
cd happy-greens-backend
npm run seed
```

---

## Step 5: Check CORS Configuration

Backend must allow requests from `http://localhost:5173`

In `happy-greens-backend/src/server.ts`, verify:
```typescript
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
```

If missing, add it and restart backend.

---

## Step 6: Verify JWT Token

In browser console:
```javascript
localStorage.getItem('adminToken')
```

Should return a long string starting with `eyJ...`

If null or undefined:
1. Logout
2. Login again with admin@happygreens.com / admin123
3. Check token is saved

---

## Step 7: Check Frontend Environment

In `happy-greens-admin/.env`:
```
VITE_API_BASE_URL=http://localhost:3000/api
```

After changing .env, restart frontend:
```bash
# Ctrl+C to stop
npm run dev
```

---

## Step 8: Hard Refresh Frontend

Sometimes browser cache causes issues:

- **Chrome/Edge:** Ctrl+Shift+R or Ctrl+F5
- **Firefox:** Ctrl+Shift+R
- **Clear cache:** DevTools → Application → Clear storage

---

## Quick Fix Summary

Most common fixes in order:

1. **Restart backend server** (Ctrl+C, npm run dev)
2. **Hard refresh browser** (Ctrl+F5)
3. **Re-login** to get fresh JWT token
4. **Run seed script** if database is empty
5. **Check backend terminal** for errors

---

## Still Not Working?

Share these details:

1. **Browser console logs** (copy all logs when loading Orders page)
2. **Network tab screenshot** (showing /admin/orders request)
3. **Backend terminal output** (any errors?)
4. **Database order count:** `SELECT COUNT(*) FROM orders;`
5. **JWT token exists:** `localStorage.getItem('adminToken')` (first 20 chars only)

---

## Test Script

Run this to verify everything:

```powershell
# Test backend endpoint
cd happy-greens-backend
.\test-orders-endpoint.ps1

# If successful, frontend should work
# If not, fix backend first
```
