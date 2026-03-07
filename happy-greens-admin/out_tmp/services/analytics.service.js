import api from "./api";
export const getRevenueAnalytics = () => api.get("/admin/analytics/revenue");
export const getOrdersAnalytics = () => api.get("/admin/analytics/orders");
export const getCustomerAnalytics = () => api.get("/admin/analytics/customers");
export const getProductAnalytics = () => api.get("/admin/analytics/products");
export const getDashboardAnalytics = (timeFilter) => api.get("/admin/analytics/dashboard", { params: { timeFilter } });
