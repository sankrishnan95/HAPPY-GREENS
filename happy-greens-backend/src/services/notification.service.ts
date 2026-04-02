import { pool } from '../db';

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
        await createUserNotification(db, Number(admin.id), notification);
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
