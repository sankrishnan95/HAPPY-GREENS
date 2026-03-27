import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { createOrder, getOrders, getOrderById, cancelOrder } from '../controllers/order.controller';

const router = Router();

router.post('/', authenticate, createOrder);
router.get('/', authenticate, getOrders);
router.patch('/:id/cancel', authenticate, cancelOrder);
router.get('/:id', authenticate, getOrderById);

export default router;
