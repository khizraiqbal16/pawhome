import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({ baseURL: `${BASE}/api` });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const errorMessage = (err) => err?.response?.data?.message || err?.message || 'Something went wrong';

// Resolve uploaded image paths and external URLs
export const imgUrl = (src) => (!src ? '' : src.startsWith('http') ? src : `${BASE}${src}`);

export const SOCKET_URL = BASE || window.location.origin.replace(':5173', ':5000');

export default api;
