import { Router } from 'express';
import { chat } from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth';
import { chatRateLimiter } from '../middleware/rateLimit';

const router = Router();

router.post('/', authenticate, chatRateLimiter, chat);

export default router;
