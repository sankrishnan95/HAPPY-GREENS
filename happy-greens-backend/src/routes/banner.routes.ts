import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import {
    getBanners,
    getActiveBanners,
    getBannerById,
    createBanner,
    updateBanner,
    deleteBanner
} from '../controllers/banner.controller';

const router = express.Router();

// Public routes (for storefront, though we aren't using them yet based on instructions)
router.get('/active', getActiveBanners);

// Admin routes
router.get('/', authenticate, requireAdmin, getBanners);
router.get('/:id', authenticate, requireAdmin, getBannerById);
router.post('/', authenticate, requireAdmin, createBanner);
router.put('/:id', authenticate, requireAdmin, updateBanner);
router.delete('/:id', authenticate, requireAdmin, deleteBanner);

export default router;
