import express from 'express';
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
router.get('/', getBanners);
router.get('/:id', getBannerById);
router.post('/', createBanner);
router.put('/:id', updateBanner);
router.delete('/:id', deleteBanner);

export default router;
