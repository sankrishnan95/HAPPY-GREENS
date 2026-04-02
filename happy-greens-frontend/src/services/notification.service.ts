import api from './api';

export type AppNotification = {
    id: number;
    type: string;
    title: string;
    message: string;
    link?: string | null;
    metadata?: Record<string, any>;
    is_read: boolean;
    read_at?: string | null;
    created_at: string;
};

export const getNotifications = async (limit = 20) => {
    const { data } = await api.get('/notifications', { params: { limit } });
    return data as { notifications: AppNotification[]; unreadCount: number };
};

export const markNotificationRead = async (id: number) => {
    const { data } = await api.patch(`/notifications/${id}/read`);
    return data as { success: boolean; unreadCount: number };
};

export const markAllNotificationsRead = async () => {
    const { data } = await api.patch('/notifications/read-all');
    return data as { success: boolean; unreadCount: number };
};
