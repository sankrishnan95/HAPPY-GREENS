import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
    getNotifications,
    getNotificationUnreadCount,
    readAllNotifications,
    readNotification,
} from '../controllers/notification.controller';

const router = Router();

router.use(authenticate);
router.get('/', getNotifications);
router.get('/unread-count', getNotificationUnreadCount);
router.patch('/read-all', readAllNotifications);
router.patch('/:id/read', readNotification);

export default router;
