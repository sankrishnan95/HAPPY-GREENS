import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import {
    createCoupon,
    getCoupons,
    getCouponById,
    updateCoupon,
    deleteCoupon,
    validateCoupon,
    getCouponUsage
} from '../controllers/coupons.controller';

const router = Router();

/**
 * ADMIN ROUTES
 */

/**
 * Create Coupon
 * POST /api/admin/coupons
 * 
 * Body: {
 *   code, description, discount_type, discount_value,
 *   min_order_amount, max_discount_amount, usage_limit,
 *   valid_from, valid_until
 * }
 * 
 * Auth: Admin only
 */
router.post('/', authenticate, requireAdmin, createCoupon);

/**
 * Get All Coupons
 * GET /api/admin/coupons?active=true
 * 
 * Auth: Admin only
 */
router.get('/', authenticate, requireAdmin, getCoupons);

/**
 * Get Coupon by ID
 * GET /api/admin/coupons/:id
 * 
 * Auth: Admin only
 */
router.get('/:id', authenticate, requireAdmin, getCouponById);

/**
 * Update Coupon
 * PUT /api/admin/coupons/:id
 * 
 * Auth: Admin only
 */
router.put('/:id', authenticate, requireAdmin, updateCoupon);

/**
 * Delete Coupon
 * DELETE /api/admin/coupons/:id
 * 
 * Auth: Admin only
 */
router.delete('/:id', authenticate, requireAdmin, deleteCoupon);

/**
 * Get Coupon Usage Stats
 * GET /api/admin/coupons/:id/usage
 * 
 * Auth: Admin only
 */
router.get('/:id/usage', authenticate, requireAdmin, getCouponUsage);

/**
 * PUBLIC ROUTES (Customer-facing)
 */

/**
 * Validate Coupon
 * POST /api/coupons/validate
 * 
 * Body: { code: 'WELCOME10', order_amount: 600 }
 * 
 * Auth: Optional (can be used by guests)
 */
router.post('/validate', validateCoupon);

export default router;
