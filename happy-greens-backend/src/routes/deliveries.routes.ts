import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import {
    createDelivery,
    getDeliveries,
    getDeliveryById,
    updateDeliveryStatus,
    getDeliveryStatusHistory
} from '../controllers/deliveries.controller';

const router = Router();

/**
 * Create Delivery
 * POST /api/admin/deliveries
 * 
 * Body: {
 *   order_id, delivery_address, courier_name, courier_contact,
 *   pickup_address, estimated_delivery, notes
 * }
 * 
 * Auth: Admin only
 */
router.post('/', authenticate, requireAdmin, createDelivery);

/**
 * Get All Deliveries
 * GET /api/admin/deliveries?status=in_transit
 * 
 * Auth: Admin only
 */
router.get('/', authenticate, requireAdmin, getDeliveries);

/**
 * Get Delivery by ID
 * GET /api/admin/deliveries/:id
 * 
 * Auth: Admin only
 */
router.get('/:id', authenticate, requireAdmin, getDeliveryById);

/**
 * Update Delivery Status
 * PATCH /api/admin/deliveries/:id/status
 * 
 * Body: { delivery_status: 'out_for_delivery', notes: 'Optional' }
 * 
 * Auth: Admin only
 */
router.patch('/:id/status', authenticate, requireAdmin, updateDeliveryStatus);

/**
 * Get Delivery Status History
 * GET /api/admin/deliveries/:id/history
 * 
 * Auth: Admin only
 */
router.get('/:id/history', authenticate, requireAdmin, getDeliveryStatusHistory);

export default router;
