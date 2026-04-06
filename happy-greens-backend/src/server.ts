import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { pool } from './db';
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import cartRoutes from './routes/cart.routes';
import orderRoutes from './routes/order.routes';
import paymentRoutes from './routes/payment.routes';
import webhookRoutes from './routes/webhook.routes';
import adminRoutes from './routes/admin.routes';
import ordersManagementRoutes from './routes/orders.routes';
import deliveriesRoutes from './routes/deliveries.routes';
import couponsRoutes from './routes/coupons.routes';
import uploadRoutes from './routes/upload.routes';
import bannerRoutes from './routes/banner.routes';
import loyaltyRoutes from './routes/loyalty.routes';
import wishlistRoutes from './routes/wishlist.routes';
import chatRoutes from './routes/chat.routes';
import path from 'path';
import { authenticate } from './middleware/auth';
import { ensureAdminFromEnv } from './bootstrap/admin';
import { ensureProductImagesColumn, ensureBannerTextColumns, ensureAuthColumns, ensureOperationsSchema, ensureCategoriesAndProductCategoryBackfill, ensureAnalyticsSchema, ensureMultiUnitSchema, ensureNotificationsSchema, ensureAddressBookSchema, ensureProductCategoriesSchema, ensureCategoryHierarchySchema } from './bootstrap/schema';
import analyticsRoutes from './routes/analytics.routes';
import notificationRoutes from './routes/notification.routes';
import { analyticsRateLimiter, authRateLimiter, globalRateLimiter, paymentRateLimiter, uploadRateLimiter } from './middleware/rateLimit';
import { applySecurityHeaders, enforceHttps } from './middleware/security';

const app = express();
const port = process.env.PORT || 3000;
const debugHealthChecks = process.env.DEBUG_HEALTHCHECKS === 'true';

const normalizeOrigin = (origin: string) => origin.trim().replace(/\/+$/, '');

const configuredOrigins = [
  ...(process.env.CORS_ORIGINS?.split(',').map((o) => normalizeOrigin(o)).filter(Boolean) || []),
  ...(process.env.FRONTEND_URL ? [normalizeOrigin(process.env.FRONTEND_URL)] : []),
  ...(process.env.ADMIN_URL ? [normalizeOrigin(process.env.ADMIN_URL)] : []),
];

const productionFallbackOrigins = [
  'https://www.happygreensonline.com',
  'https://happygreensonline.com',
  'https://happy-greens.vercel.app',
  'https://happy-greens-store.vercel.app',
  'https://happy-greens-admin.vercel.app',
  'https://happygreensadmin.vercel.app',
].map(normalizeOrigin);

const allowedPreviewOriginPatterns = [
  /^https:\/\/happy-greens(?:-[a-z0-9-]+)?\.vercel\.app$/i,
  /^https:\/\/happy-greens-admin(?:-[a-z0-9-]+)?\.vercel\.app$/i,
  /^https:\/\/happygreensadmin(?:-[a-z0-9-]+)?\.vercel\.app$/i,
];

const allowedOrigins = new Set(
  process.env.NODE_ENV === 'production'
    ? [...productionFallbackOrigins, ...configuredOrigins]
    : [...productionFallbackOrigins, ...configuredOrigins, 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'].map(normalizeOrigin)
);

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = normalizeOrigin(origin);

    if (
      allowedOrigins.has(normalizedOrigin) ||
      allowedPreviewOriginPatterns.some((pattern) => pattern.test(normalizedOrigin))
    ) {
      return callback(null, true);
    }

    return callback(new Error(`Not allowed by CORS: ${normalizedOrigin}`));
  },
  credentials: true,
};

app.disable('x-powered-by');
app.use(applySecurityHeaders);
app.use(enforceHttps);
app.use(globalRateLimiter);
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use('/api/auth', authRateLimiter);
app.use('/api/payments', paymentRateLimiter);
app.use('/api/upload', uploadRateLimiter);
app.use('/api/analytics', analyticsRateLimiter);

// IMPORTANT: Webhook routes must be registered BEFORE express.json()
// Razorpay requires raw body for signature verification
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

// Regular JSON parsing for all other routes
app.use(express.json({ limit: '200kb' }));

// Expose the static uploads folder broadly
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Lightweight health endpoint for uptime monitors such as UptimeRobot.
// Ping https://your-backend.onrender.com/api/health every 10 minutes to reduce cold starts.
const sendHealthResponse = (req: Request, res: Response) => {
  if (debugHealthChecks) {
    console.log(`[health] ${req.method} ${req.originalUrl} @ ${new Date().toISOString()}`);
  }

  res.setHeader('Cache-Control', 'no-store');
  res.json({ status: 'ok', service: 'happy-greens-backend', timestamp: new Date().toISOString() });
};

app.get('/health', sendHealthResponse);
app.get('/api/health', sendHealthResponse);
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: "Happy Greens API running ðŸŒ±",
    health: "/api/health"
  });
});
// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', authenticate, cartRoutes);
app.use('/api/orders', authenticate, orderRoutes);
app.use('/api/payments', authenticate, paymentRoutes);

// Phase 6.5: Operations Routes (MUST be before /api/admin to take precedence)
app.use('/api/admin/orders', ordersManagementRoutes);
app.use('/api/admin/deliveries', deliveriesRoutes);
app.use('/api/admin/coupons', couponsRoutes);
app.use('/api/coupons', couponsRoutes); // Public coupon validation
app.use('/api/banners', bannerRoutes); // Banners management & storefront usage
app.use('/api/loyalty', loyaltyRoutes); // Loyalty points
app.use('/api/wishlist', authenticate, wishlistRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);

// Generic admin routes (MUST be after specific admin routes)
app.use('/api/admin', adminRoutes);

const startServer = async () => {
  try {
    await ensureAuthColumns();
    await ensureOperationsSchema();
    await ensureAnalyticsSchema();
    await ensureNotificationsSchema();
    await ensureAddressBookSchema();
    await ensureCategoriesAndProductCategoryBackfill();
    await ensureProductCategoriesSchema();
    await ensureCategoryHierarchySchema();
    await ensureProductImagesColumn();
    await ensureMultiUnitSchema();
    await ensureBannerTextColumns();
    await ensureAdminFromEnv();
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();









