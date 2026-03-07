import { Router } from 'express';
import { getCart, addToCart, updateCartItem, removeCartItem } from '../controllers/cart.controller';
// import { authenticate } from '../middleware/auth'; // Need to create this

const router = Router();

// router.use(authenticate); // Apply auth middleware to all cart routes

router.get('/', getCart);
router.post('/', addToCart);
router.put('/:id', updateCartItem);
router.delete('/:id', removeCartItem);

export default router;
