// frontend/src/api/client.js
import axios from 'axios';

export const TOKEN_KEY = 'joineazy_token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
});

// Attach the JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Turn server errors into a simple message string
export const getErrorMessage = (err) =>
  err.response?.data?.message || 'Something went wrong. Please try again.';

export default api;