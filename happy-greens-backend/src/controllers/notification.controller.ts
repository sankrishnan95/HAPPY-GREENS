import { Request, Response } from 'express';
import {
    getUnreadNotificationCount,
    listNotificationsForUser,
    markAllNotificationsAsRead,
    markNotificationAsRead,
    upsertAdminPushSubscription,
    deletePushSubscription,
} from '../services/notification.service';

const getAuthenticatedUserId = (req: Request) => {
    return Number((req as any).user?.id);
};

const isAuthenticatedAdmin = (req: Request) => {
    return (req as any).user?.role === 'admin';
};

export const getNotifications = async (req: Request, res: Response) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const notifications = await listNotificationsForUser(userId, req.query.limit);
        const unreadCount = await getUnreadNotificationCount(userId);

        res.json({
            notifications,
            unreadCount,
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getNotificationUnreadCount = async (req: Request, res: Response) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const unreadCount = await getUnreadNotificationCount(userId);
        res.json({ unreadCount });
    } catch (error) {
        console.error('Error fetching unread notification count:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const readNotification = async (req: Request, res: Response) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const notificationId = Number(req.params.id);

        if (!Number.isFinite(notificationId) || notificationId <= 0) {
            return res.status(400).json({ message: 'Invalid notification id' });
        }

        const updated = await markNotificationAsRead(userId, notificationId);
        if (!updated) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        const unreadCount = await getUnreadNotificationCount(userId);

        res.json({
            success: true,
            unreadCount,
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const readAllNotifications = async (req: Request, res: Response) => {
    try {
        const userId = getAuthenticatedUserId(req);
        await markAllNotificationsAsRead(userId);
        res.json({
            success: true,
            unreadCount: 0,
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const registerAdminPushSubscription = async (req: Request, res: Response) => {
    try {
        if (!isAuthenticatedAdmin(req)) {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const userId = getAuthenticatedUserId(req);
        const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
        const platform = typeof req.body?.platform === 'string' ? req.body.platform.trim().slice(0, 40) : 'admin-web';

        if (!token) {
            return res.status(400).json({ message: 'Push token is required' });
        }

        await upsertAdminPushSubscription(userId, token, platform || 'admin-web');
        res.json({ success: true });
    } catch (error) {
        console.error('Error registering admin push subscription:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const unregisterAdminPushSubscription = async (req: Request, res: Response) => {
    try {
        if (!isAuthenticatedAdmin(req)) {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const userId = getAuthenticatedUserId(req);
        const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';

        if (!token) {
            return res.status(400).json({ message: 'Push token is required' });
        }

        await deletePushSubscription(userId, token);
        res.json({ success: true });
    } catch (error) {
        console.error('Error unregistering admin push subscription:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
