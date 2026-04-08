import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getNotifications, markAllNotificationsRead, markNotificationRead, type AppNotification } from '../services/notification.service';

const formatRelativeTime = (value: string) => {
    const createdAt = new Date(value).getTime();
    const diffMs = Date.now() - createdAt;
    const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
};

const NotificationBell = () => {
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const panelRef = useRef<HTMLDivElement | null>(null);
    const navigate = useNavigate();

    const loadNotifications = async () => {
        try {
            const data = await getNotifications();
            setItems(data.notifications);
            setUnreadCount(data.unreadCount);
        } catch (error) {
            console.error('Failed to load notifications', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNotifications();
        const intervalId = window.setInterval(loadNotifications, 30000);
        return () => window.clearInterval(intervalId);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const sortedItems = useMemo(
        () => [...items].sort((a, b) => Number(a.is_read) - Number(b.is_read)),
        [items]
    );

    const handleNotificationClick = async (notification: AppNotification) => {
        if (!notification.is_read) {
            try {
                const data = await markNotificationRead(notification.id);
                setUnreadCount(data.unreadCount);
                setItems((current) =>
                    current.map((item) =>
                        item.id === notification.id ? { ...item, is_read: true, read_at: new Date().toISOString() } : item
                    )
                );
            } catch (error) {
                console.error('Failed to mark notification as read', error);
            }
        }

        setOpen(false);
        if (notification.link) {
            navigate(notification.link);
        }
    };

    const handleReadAll = async () => {
        try {
            await markAllNotificationsRead();
            setUnreadCount(0);
            setItems((current) => current.map((item) => ({ ...item, is_read: true, read_at: item.read_at || new Date().toISOString() })));
        } catch (error) {
            console.error('Failed to mark all notifications as read', error);
        }
    };

    return (
        <div className="relative" ref={panelRef}>
            <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                className="safe-touch relative inline-flex items-center justify-center rounded-2xl border border-[#dbe7d0] bg-white text-slate-700 shadow-sm"
                aria-label="Notifications"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 ? (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-green-600 px-1 text-[10px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                ) : null}
            </button>

            {open ? (
                <div className="fixed inset-x-3 top-[6.25rem] z-[80] w-auto overflow-hidden rounded-[1.5rem] border border-[#e4ecda] bg-white shadow-[0_18px_42px_rgba(15,23,42,0.16)] md:absolute md:right-0 md:left-auto md:top-[calc(100%+0.65rem)] md:w-[24rem]">
                    <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3.5">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Inbox</p>
                            <p className="mt-1 text-base font-bold text-slate-900">Notifications</p>
                            <p className="text-xs text-slate-500">{unreadCount} unread</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleReadAll}
                            className="text-xs font-semibold text-green-700 transition hover:text-green-800"
                            disabled={unreadCount === 0}
                        >
                            Mark all read
                        </button>
                    </div>

                    <div className="max-h-[calc(100vh-12rem)] overflow-y-auto md:max-h-[24rem]">
                        {loading ? (
                            <div className="px-4 py-6 text-sm text-slate-500">Loading notifications...</div>
                        ) : sortedItems.length === 0 ? (
                            <div className="px-4 py-6 text-sm text-slate-500">You&apos;re all caught up.</div>
                        ) : (
                            sortedItems.map((notification) => (
                                <button
                                    key={notification.id}
                                    type="button"
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`w-full border-b border-slate-100 px-4 py-3 text-left last:border-b-0 transition hover:bg-[#f6faf1] ${
                                        notification.is_read ? 'bg-white' : 'bg-[#f3fbec]'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-[13px] font-semibold text-slate-800">{notification.title}</p>
                                            <p className="mt-1 text-sm leading-5 text-slate-600">{notification.message}</p>
                                        </div>
                                        {!notification.is_read ? <span className="mt-1 h-2.5 w-2.5 rounded-full bg-green-600" /> : null}
                                    </div>
                                    <p className="mt-2 text-xs font-medium text-slate-400">{formatRelativeTime(notification.created_at)}</p>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default NotificationBell;
