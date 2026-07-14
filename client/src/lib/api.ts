import axios from "axios";
import { toast } from "sonner";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("oriveo_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("oriveo_token");
      localStorage.removeItem("oriveo_user");
      window.location.href = "/login";
    }
    if (error.response?.status === 403) {
      toast.error(error.response?.data?.message || "Access denied");
    }
    return Promise.reject(error);
  }
);

export default api;
