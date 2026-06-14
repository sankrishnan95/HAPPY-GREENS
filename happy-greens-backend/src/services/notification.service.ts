import { pool } from '../db';
import { sendFirebasePushToTokens } from './firebase-admin.service';

type DbClient = {
    query: (text: string, params?: any[]) => Promise<any>;
};

type NotificationInput = {
    type: string;
    title: string;
    message: string;
    link?: string | null;
    metadata?: Record<string, any>;
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const normalizeLimit = (value: unknown): number => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT;
    return Math.min(Math.floor(parsed), MAX_LIMIT);
};

export const createUserNotification = async (
    db: DbClient,
    recipientUserId: number,
    notification: NotificationInput
) => {
    await db.query(
        `INSERT INTO notifications (recipient_user_id, type, title, message, link, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
            recipientUserId,
            notification.type,
            notification.title,
            notification.message,
            notification.link || null,
            JSON.stringify(notification.metadata || {}),
        ]
    );
};

export const upsertAdminPushSubscription = async (userId: number, token: string, platform = 'admin-web') => {
    await pool.query(
        `INSERT INTO push_subscriptions (user_id, token, platform, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (token)
         DO UPDATE SET user_id = EXCLUDED.user_id, platform = EXCLUDED.platform, updated_at = NOW()`,
        [userId, token, platform]
    );
};

export const deletePushSubscription = async (userId: number, token: string) => {
    await pool.query(
        `DELETE FROM push_subscriptions
         WHERE user_id = $1
           AND token = $2`,
        [userId, token]
    );
};

const sendPushNotificationToUser = async (userId: number, notification: NotificationInput) => {
    try {
        const tokenResult = await pool.query(
            `SELECT token
             FROM push_subscriptions
             WHERE user_id = $1`,
            [userId]
        );
        const tokens = tokenResult.rows.map((row: any) => String(row.token)).filter(Boolean);
        if (tokens.length === 0) return;

        const result = await sendFirebasePushToTokens(tokens, {
            title: notification.title,
            body: notification.message,
            link: notification.link || '/',
            data: {
                type: notification.type,
            },
        });

        if (result.invalidTokens.length > 0) {
            await pool.query(
                `DELETE FROM push_subscriptions
                 WHERE token = ANY($1::text[])`,
                [result.invalidTokens]
            );
        }
    } catch (error) {
        console.warn('[Push] Failed to send push notification:', error);
    }
};

export const createAdminNotifications = async (
    db: DbClient,
    notification: NotificationInput
) => {
    const adminResult = await db.query(
        `SELECT id
         FROM users
         WHERE role = 'admin'`
    );

    for (const admin of adminResult.rows) {
        const adminId = Number(admin.id);
        await createUserNotification(db, adminId, notification);
        void sendPushNotificationToUser(adminId, notification);
    }
};

export const listNotificationsForUser = async (userId: number, limitValue?: unknown) => {
    const limit = normalizeLimit(limitValue);
    const result = await pool.query(
        `SELECT id, type, title, message, link, metadata, is_read, read_at, created_at
         FROM notifications
         WHERE recipient_user_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [userId, limit]
    );

    return result.rows;
};

export const getUnreadNotificationCount = async (userId: number) => {
    const result = await pool.query(
        `SELECT COUNT(*)::int AS unread_count
         FROM notifications
         WHERE recipient_user_id = $1
           AND is_read = FALSE`,
        [userId]
    );

    return Number(result.rows[0]?.unread_count || 0);
};

export const markNotificationAsRead = async (userId: number, notificationId: number) => {
    const result = await pool.query(
        `UPDATE notifications
         SET is_read = TRUE,
             read_at = COALESCE(read_at, NOW())
         WHERE id = $1
           AND recipient_user_id = $2
         RETURNING id`,
        [notificationId, userId]
    );

    return result.rows[0] || null;
};

export const markAllNotificationsAsRead = async (userId: number) => {
    await pool.query(
        `UPDATE notifications
         SET is_read = TRUE,
             read_at = COALESCE(read_at, NOW())
         WHERE recipient_user_id = $1
           AND is_read = FALSE`,
        [userId]
    );
};
