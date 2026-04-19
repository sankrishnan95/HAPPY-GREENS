import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../services/notification.service';

const ENABLE_NOTIFICATION_POLLING = true;
const NOTIFICATION_POLL_INTERVAL_MS = 30000;
let notificationsRequest = null;

const formatRelativeTime = (value) => {
  const createdAt = new Date(value).getTime();
  const diffMs = Date.now() - createdAt;
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef(null);
  const isMountedRef = useRef(false);
  const hasLoadedInitiallyRef = useRef(false);
  const navigate = useNavigate();

  const loadNotifications = async () => {
    if (notificationsRequest) {
      const data = await notificationsRequest;
      if (isMountedRef.current) {
        setItems(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
        setLoading(false);
      }
      return;
    }

    notificationsRequest = getNotifications();

    try {
      const data = await notificationsRequest;
      if (!isMountedRef.current) return;
      setItems(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to load admin notifications', error);
    } finally {
      notificationsRequest = null;
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    if (!hasLoadedInitiallyRef.current) {
      hasLoadedInitiallyRef.current = true;
      void loadNotifications();
    }

    const intervalId = ENABLE_NOTIFICATION_POLLING
      ? window.setInterval(() => {
          void loadNotifications();
        }, NOTIFICATION_POLL_INTERVAL_MS)
      : null;

    return () => {
      isMountedRef.current = false;
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
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

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      try {
        const data = await markNotificationRead(notification.id);
        setUnreadCount(data.unreadCount || 0);
        setItems((current) =>
          current.map((item) =>
            item.id === notification.id ? { ...item, is_read: true, read_at: new Date().toISOString() } : item
          )
        );
      } catch (error) {
        console.error('Failed to mark admin notification as read', error);
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
      setItems((current) =>
        current.map((item) => ({ ...item, is_read: true, read_at: item.read_at || new Date().toISOString() }))
      );
    } catch (error) {
      console.error('Failed to mark all admin notifications as read', error);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(92vw,24rem)] overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_18px_42px_rgba(15,23,42,0.16)]">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3.5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Inbox</p>
              <p className="mt-1 text-base font-bold text-slate-900">Notifications</p>
              <p className="text-xs text-slate-500">{unreadCount} unread</p>
            </div>
            <button
              type="button"
              onClick={handleReadAll}
              className="text-xs font-semibold text-emerald-700 transition hover:text-emerald-800"
              disabled={unreadCount === 0}
            >
              Mark all read
            </button>
          </div>

          <div className="max-h-[24rem] overflow-y-auto">
            {loading ? (
              <div className="px-4 py-6 text-sm text-slate-500">Loading notifications...</div>
            ) : sortedItems.length === 0 ? (
              <div className="px-4 py-6 text-sm text-slate-500">No notifications yet.</div>
            ) : (
              sortedItems.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full border-b border-slate-100 px-4 py-3 text-left last:border-b-0 transition hover:bg-slate-50 ${
                    notification.is_read ? 'bg-white' : 'bg-emerald-50/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-slate-800">{notification.title}</p>
                      <p className="mt-1 text-sm leading-5 text-slate-600">{notification.message}</p>
                    </div>
                    {!notification.is_read ? <span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-600" /> : null}
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
}
