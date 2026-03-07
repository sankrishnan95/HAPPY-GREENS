# Happy Greens Backend - Database Setup Guide

## PostgreSQL Connection Details

**Service Status:** ✓ Running (postgresql-x64-18)  
**Installation Path:** C:\Program Files\PostgreSQL\18\bin\

### Connection Details:
- **Host:** localhost
- **Port:** 5432
- **Database:** happy_greens
- **Username:** postgres
- **Password:** (set during PostgreSQL installation)

---

## Setup Steps

### 1. Create Database

Open PowerShell and run:

```powershell
# Set PostgreSQL bin path
$env:Path += ";C:\Program Files\PostgreSQL\18\bin"

# Connect to PostgreSQL (will prompt for password)
psql -U postgres

# Inside psql, create database:
CREATE DATABASE happy_greens;

# Verify database created:
\l

# Exit psql:
\q
```

### 2. Configure Environment Variables

The `.env` file has been created with template values. Update it with your actual credentials:

**Edit:** `C:\Users\sankr\.gemini\antigravity\scratch\happy-greens-backend\.env`

**Required changes:**
1. Replace `your_password` with your PostgreSQL password
2. Generate JWT secret:
   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Copy the output and replace `your_strong_jwt_secret_here_minimum_32_characters`

3. Add Razorpay credentials (get from Razorpay dashboard)

### 3. Run Migrations

```powershell
cd C:\Users\sankr\.gemini\antigravity\scratch\happy-greens-backend

# Install dependencies (if not done)
npm install

# Run migrations
npm run migrate
```

This will create all tables and views:
- Migration 001: Initial schema (users, products, categories, orders, etc.)
- Migration 002: Indexes for performance
- Migration 003: Power BI views

### 4. Seed Database (Optional)

```powershell
npm run seed
```

This will populate the database with sample data for testing.

### 5. Start Backend

```powershell
npm run dev
```

Server will start on http://localhost:3000

---

## Verify Connection

### Test database connection:
```powershell
psql -U postgres -d happy_greens -c "SELECT version();"
```

### Check tables:
```powershell
psql -U postgres -d happy_greens -c "\dt"
```

### Check views:
```powershell
psql -U postgres -d happy_greens -c "\dv"
```

---

## Troubleshooting

### Issue: "psql: command not found"
**Solution:** Add PostgreSQL to PATH:
```powershell
$env:Path += ";C:\Program Files\PostgreSQL\18\bin"
```

### Issue: "password authentication failed"
**Solution:** Use the password you set during PostgreSQL installation, or reset it:
```powershell
# As admin, connect to postgres
psql -U postgres

# Reset password
ALTER USER postgres PASSWORD 'new_password';
```

### Issue: "database does not exist"
**Solution:** Create the database first (see Step 1)

---

## Next Steps

1. ✓ PostgreSQL installed and running
2. ⚠️ Create `happy_greens` database
3. ⚠️ Update `.env` with your password and JWT secret
4. ⚠️ Run migrations: `npm run migrate`
5. ⚠️ (Optional) Seed data: `npm run seed`
6. ⚠️ Start server: `npm run dev`
