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
import path from 'path';
import { authenticate } from './middleware/auth';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://localhost:5175').split(',').map(o => o.trim()),
  credentials: true
}));

// IMPORTANT: Webhook routes must be registered BEFORE express.json()
// Razorpay requires raw body for signature verification
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);

// Regular JSON parsing for all other routes
app.use(express.json());

// Expose the static uploads folder broadly
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Basic health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date() });
});
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: "Happy Greens API running 🌱",
    health: "/health"
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

// Generic admin routes (MUST be after specific admin routes)
app.use('/api/admin', adminRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
