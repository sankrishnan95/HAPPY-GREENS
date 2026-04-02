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
