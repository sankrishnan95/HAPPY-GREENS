# Invoice Printing Fix

## Issue
When clicking "Print Invoice", the PDF opens in a new window but returns:
```json
{"message":"No token, authorization denied"}
```

## Root Cause
The `window.open()` method opens a new browser context that doesn't have access to the Authorization header. The backend requires JWT authentication for the invoice endpoint.

## Solution
Changed from `window.open()` to `fetch()` with Authorization header, then create a blob URL.

### Before (Broken):
```javascript
const url = `http://localhost:3000/api/admin/orders/${orderId}/invoice?format=a4`;
const printWindow = window.open(url, '_blank');  // ❌ No JWT header sent
```

### After (Fixed):
```javascript
// Fetch PDF with JWT token
const response = await fetch(`http://localhost:3000/api/admin/orders/${orderId}/invoice?format=a4`, {
  headers: {
    'Authorization': `Bearer ${token}`  // ✅ JWT included
  }
});

// Convert to blob and open
const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
window.open(url, '_blank');
```

## How It Works

1. **Fetch PDF** - Uses fetch API with Authorization header
2. **Get Blob** - Converts response to binary blob
3. **Create URL** - Creates temporary object URL from blob
4. **Open Window** - Opens PDF in new tab
5. **Auto Print** - Triggers print dialog
6. **Cleanup** - Revokes object URL after printing

## Testing

1. Login to admin dashboard
2. Navigate to Orders page
3. Click "Print" button on any paid order
4. PDF should open in new tab
5. Print dialog should appear automatically

## Console Logs

Success:
```
🖨️ Printing invoice for order: 1
✅ Invoice opened successfully
```

Error:
```
❌ Failed to print invoice: Error: HTTP 401: Unauthorized
```

## Files Modified

- `src/pages/Orders.jsx` - Updated `handlePrintInvoice` function

## Alternative Approaches Considered

### 1. Query Parameter Token (Rejected)
```javascript
const url = `...invoice?format=a4&token=${token}`;
```
**Why not:** Security risk - token exposed in URL, browser history, server logs

### 2. Cookie-based Auth (Rejected)
**Why not:** Would require backend changes to support cookies

### 3. Fetch + Blob (Selected) ✅
**Why:** Secure, no backend changes needed, works with existing JWT auth
