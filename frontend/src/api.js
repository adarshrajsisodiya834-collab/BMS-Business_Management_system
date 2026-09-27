import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:8000/api/v1",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("bms_access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing = null;
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status !== 401 ||
      original?._retry ||
      original?.url?.includes("/auth/")
    )
      throw error;
    const refreshToken = localStorage.getItem("bms_refresh_token");
    if (!refreshToken) throw error;
    original._retry = true;
    try {
      refreshing ||= axios.post(`${api.defaults.baseURL}/auth/refresh`, null, {
        params: { refresh_token: refreshToken },
      });
      const r = await refreshing;
      refreshing = null;
      localStorage.setItem("bms_access_token", r.data.access_token);
      localStorage.setItem("bms_refresh_token", r.data.refresh_token);
      original.headers.Authorization = `Bearer ${r.data.access_token}`;
      return api(original);
    } catch (refreshError) {
      refreshing = null;
      localStorage.removeItem("bms_access_token");
      localStorage.removeItem("bms_refresh_token");
      throw refreshError;
    }
  },
);
