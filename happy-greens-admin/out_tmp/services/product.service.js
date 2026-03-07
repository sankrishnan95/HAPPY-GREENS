import api from "./api";
export const getProducts = (params) => api.get("/products", { params: { ...params, admin: true } });
export const getProductById = (id) => api.get(`/products/${id}`);
export const createProduct = (productData) => api.post("/products", productData);
export const updateProduct = (id, productData) => api.put(`/products/${id}`, productData);
export const deleteProduct = (id) => api.delete(`/products/${id}`);
export const updateProductStatus = (id, isActive) => api.patch(`/products/${id}/status`, { isActive });
export const getCategories = () => api.get("/products/categories");
