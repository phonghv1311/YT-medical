import axios from 'axios';
import { store } from '../store';
import { logout, setTokens } from '../store/authSlice';
import { showGlobalError } from '../utils/toastBridge';

// API base: backend uses setGlobalPrefix('api'), so requests must end at /api/...
// If VITE_API_URL is set (e.g. https://example.com), use it and ensure /api path.
function getApiBaseURL(): string {
  const env = import.meta.env.VITE_API_URL;
  if (!env || env === '') return '/api';
  const base = env.replace(/\/+$/, '');
  return base.endsWith('/api') ? base : `${base}/api`;
}

const api = axios.create({
  baseURL: getApiBaseURL(),
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = store.getState().auth.refreshToken;
      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${api.defaults.baseURL}/auth/refresh-token`,
            { refreshToken },
          );
          store.dispatch(setTokens(data.data || data));
          original.headers.Authorization = `Bearer ${(data.data || data).accessToken}`;
          return api(original);
        } catch {
          store.dispatch(logout());
        }
      }
    }
    if (error.code === 'ERR_CANCELED' || error.name === 'AbortError') return Promise.reject(error);
    const status = error.response?.status;
    const message = error.response?.data?.message ?? error.message ?? 'Something went wrong';
    if (status && status >= 500) {
      showGlobalError(message || 'Server error. Please try again.');
    } else if (status === 400 || status === 404) {
      showGlobalError(message);
    }
    return Promise.reject(error);
  },
);

export default api;
