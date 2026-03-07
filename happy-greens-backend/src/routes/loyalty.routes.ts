import { Router } from 'express';
import { getLoyaltyInfo, getLoyaltyHistory } from '../controllers/loyalty.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getLoyaltyInfo);
router.get('/history', authenticate, getLoyaltyHistory);

export default router;
