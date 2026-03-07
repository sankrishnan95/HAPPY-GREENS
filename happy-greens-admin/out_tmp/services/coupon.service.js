import api from "./api";
export const getCoupons = () => api.get("/admin/coupons");
export const createCoupon = (data) => api.post("/admin/coupons", data);
export const updateCoupon = (id, data) => api.put(`/admin/coupons/${id}`, data);
export const deleteCoupon = (id) => api.delete(`/admin/coupons/${id}`);
