import api from "./api";
export const getCustomers = (params) => api.get("/admin/customers", { params });
export const getCustomerById = (id) => api.get(`/admin/customers/${id}`);
export const getCustomerOrders = (id) => api.get(`/admin/customers/${id}/orders`);
