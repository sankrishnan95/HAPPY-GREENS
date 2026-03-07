import api from "./api";
export const getDeliveries = (status) => {
  const params = status && status !== "all" ? { status } : {};
  return api.get("/admin/deliveries", { params });
};
export const updateDeliveryStatus = (id, delivery_status, notes) => api.patch(`/admin/deliveries/${id}/status`, { delivery_status, notes });
