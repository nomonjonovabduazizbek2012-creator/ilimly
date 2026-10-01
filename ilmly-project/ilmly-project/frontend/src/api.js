import axios from "axios";

// Backend manzili. Agar backend boshqa portda/serverda bo'lsa shu yerni o'zgartiring.
export const API_BASE = "http://localhost:5000/api";

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ilmly_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Umumiy xato xabarini olish uchun yordamchi
export function errMsg(error, fallback = "Xatolik yuz berdi, qayta urinib ko'ring") {
  return error?.response?.data?.error || fallback;
}

export default api;
