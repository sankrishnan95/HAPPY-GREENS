import api from './api';

export const getNotifications = async (limit = 20) => {
  const { data } = await api.get('/notifications', { params: { limit } });
  return data;
};

export const markNotificationRead = async (id) => {
  const { data } = await api.patch(`/notifications/${id}/read`);
  return data;
};

export const markAllNotificationsRead = async () => {
  const { data } = await api.patch('/notifications/read-all');
  return data;
};

export const registerPushSubscription = async (token) => {
  const { data } = await api.post('/notifications/push-subscriptions', {
    token,
    platform: 'admin-web',
  });
  return data;
};

export const unregisterPushSubscription = async (token) => {
  const { data } = await api.delete('/notifications/push-subscriptions', {
    data: { token },
  });
  return data;
};
