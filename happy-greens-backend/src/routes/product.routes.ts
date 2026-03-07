import { Router } from 'express';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct, updateProductStatus } from '../controllers/product.controller';

const router = Router();

router.get('/', getProducts);
router.get('/:id', getProductById);
// Add auth middleware for admin routes later
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.patch('/:id/status', updateProductStatus);
router.delete('/:id', deleteProduct);

export default router;
