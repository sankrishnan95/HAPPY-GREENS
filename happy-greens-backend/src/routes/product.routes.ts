import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { getProducts, getCategories, createCategory, updateCategory, deleteCategory, getProductById, createProduct, updateProduct, deleteProduct, updateProductStatus } from '../controllers/product.controller';

const router = Router();

router.get('/', getProducts);
router.get('/categories', getCategories);
router.post('/categories', authenticate, requireAdmin, createCategory);
router.put('/categories/:id', authenticate, requireAdmin, updateCategory);
router.delete('/categories/:id', authenticate, requireAdmin, deleteCategory);
router.get('/:id', getProductById);
router.post('/', authenticate, requireAdmin, createProduct);
router.put('/:id', authenticate, requireAdmin, updateProduct);
router.patch('/:id/status', authenticate, requireAdmin, updateProductStatus);
router.delete('/:id', authenticate, requireAdmin, deleteProduct);
export default router;

