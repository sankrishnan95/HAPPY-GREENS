# Happy Greens Deployment Guide

This project has 3 deployable apps:
- `happy-greens-backend` (Node + Express + PostgreSQL)
- `happy-greens-frontend` (storefront, React + Vite)
- `happy-greens-admin` (admin dashboard, React + Vite)

Recommended stack:
- Backend: Render Web Service
- Database: Neon PostgreSQL
- Frontend + Admin: Vercel

## 1) Database (Neon)
1. Create a Neon project and database.
2. Copy the connection string.
3. Set this as `DATABASE_URL` in Render backend env vars.

## 2) Backend (Render)
Use the included `render.yaml` blueprint at repo root.

### Option A: Blueprint deploy
1. Push repo to GitHub.
2. In Render, choose **New +** -> **Blueprint**.
3. Select repo.
4. Render reads `render.yaml` and creates `happy-greens-backend`.
5. Fill required secret env vars in Render dashboard.

### Option B: Manual service setup
- Root directory: `happy-greens-backend`
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Health check path: `/health`

### Required backend env vars
- `DATABASE_URL`
- `JWT_SECRET`
- `CORS_ORIGINS` (comma-separated URLs)
- `FRONTEND_URL`
- `GOOGLE_CLIENT_ID`
- `FAST2SMS_API_KEY`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (optional if mocking emails)

## 3) Storefront (Vercel)
1. Import repo in Vercel.
2. Set root directory to `happy-greens-frontend`.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Add env vars:
   - `VITE_API_URL=https://<your-backend-domain>`
   - `VITE_API_BASE_URL=https://<your-backend-domain>/api`
   - `VITE_GOOGLE_CLIENT_ID=<same as backend GOOGLE_CLIENT_ID>`

`happy-greens-frontend/vercel.json` is included for SPA route rewrites.

## 4) Admin (Vercel)
1. Import repo in Vercel (second project).
2. Set root directory to `happy-greens-admin`.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Add env vars:
   - `VITE_API_BASE_URL=https://<your-backend-domain>/api`
   - `VITE_GOOGLE_CLIENT_ID=<same Google client id>`

`happy-greens-admin/vercel.json` is included for SPA route rewrites.

## 5) CORS setup
Set backend `CORS_ORIGINS` to include deployed URLs, for example:
`https://happy-greens-store.vercel.app,https://happy-greens-admin.vercel.app,http://localhost:5173,http://localhost:5174,http://localhost:5175`

## 6) Post-deploy smoke test
- `GET https://<backend-domain>/health` returns `{ status: 'ok' }`.
- Storefront loads products and can log in.
- Google login works in storefront and admin.
- Wishlist add/load works.
- OTP send endpoint works.
- Admin can fetch orders and products.

## 7) Notes
- Render filesystem is ephemeral. Do not rely on local `uploads/` for long-term production storage. Move media to object storage (S3/Cloudinary) when ready.
- If DB migrations are out-of-sync in an existing environment, fix migration history before enabling automated migration execution in CI/CD.
