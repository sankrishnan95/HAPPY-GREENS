import api, { API_BASE_URL } from "./api";
import { getToken } from "../utils/auth";
export const getOrders = (status, extraParams = {}) => api.get("/admin/orders", { params: { status: status === "all" ? void 0 : status, ...extraParams } });
export const getOrderById = (id) => api.get(`/admin/orders/${id}`);
export const updateOrderStatus = (id, status, notes) => api.patch(`/admin/orders/${id}/status`, { status, notes });
export const deleteOrder = (id) => api.delete(`/admin/orders/${id}`);
export const getInvoiceUrl = (orderId, format = "a4") => {
  const token = getToken();
  return `${API_BASE_URL.replace("/api", "")}/api/admin/orders/${orderId}/invoice?format=${format}&token=${token}`;
};
