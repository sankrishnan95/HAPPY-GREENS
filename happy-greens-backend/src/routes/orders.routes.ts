import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import {
    updateOrderStatus,
    getOrderStatusHistory,
    getOrdersByStatus,
    getOrderById
} from '../controllers/orders.controller';

const router = Router();

/**
 * Get Orders (with optional status filter)
 * GET /api/admin/orders?status=pending
 * 
 * Auth: Admin only
 */
router.get('/', authenticate, requireAdmin, getOrdersByStatus);

/**
 * Get Order By ID
 * GET /api/admin/orders/:id
 * 
 * Returns full detailed order with line items
 * 
 * Auth: Admin only
 */
router.get('/:id', authenticate, requireAdmin, getOrderById);

/**
 * Update Order Status
 * PATCH /api/admin/orders/:id/status
 * 
 * Body: { status: 'accepted', notes: 'Optional notes' }
 * 
 * Auth: Admin only
 */
router.patch('/:id/status', authenticate, requireAdmin, updateOrderStatus);

/**
 * Get Order Status History
 * GET /api/admin/orders/:id/history
 * 
 * Returns all status changes for an order
 * 
 * Auth: Admin only
 */
router.get('/:id/history', authenticate, requireAdmin, getOrderStatusHistory);

export default router;
