// utils/api.js
import axios from "axios";

const API_BASE_URL = process.env.VITE_API_URL || "https://task-manage-back1.vercel.app";


const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // ✅ send cookies automatically
});

// No need for token headers since we’re using cookies
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = "/login"; // redirect to login
    }
    return Promise.reject(error);
  }
);

export default api;




