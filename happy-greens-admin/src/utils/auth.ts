export const getToken = (): string | null => {
  return localStorage.getItem('adminToken');
};

export const setToken = (token: string): void => {
  localStorage.setItem('adminToken', token);
};

export const removeToken = (): void => {
  localStorage.removeItem('adminToken');
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};
