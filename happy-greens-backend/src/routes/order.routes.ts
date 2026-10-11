import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { createOrder, getOrders, getOrderById } from '../controllers/order.controller';

const router = Router();

router.post('/', authenticate, createOrder);
router.get('/', authenticate, getOrders);
router.get('/:id', authenticate, getOrderById);

export default router;
