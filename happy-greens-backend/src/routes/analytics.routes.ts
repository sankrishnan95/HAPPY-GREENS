import { Router } from 'express';
import { trackAnalyticsEvent } from '../controllers/analytics.controller';

const router = Router();

router.post('/track', trackAnalyticsEvent);

export default router;
