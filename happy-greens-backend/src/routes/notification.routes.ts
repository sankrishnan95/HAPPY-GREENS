import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
    getNotifications,
    getNotificationUnreadCount,
    readAllNotifications,
    readNotification,
    registerAdminPushSubscription,
    unregisterAdminPushSubscription,
} from '../controllers/notification.controller';

const router = Router();

router.use(authenticate);
router.get('/', getNotifications);
router.get('/unread-count', getNotificationUnreadCount);
router.post('/push-subscriptions', registerAdminPushSubscription);
router.delete('/push-subscriptions', unregisterAdminPushSubscription);
router.patch('/read-all', readAllNotifications);
router.patch('/:id/read', readNotification);

export default router;
