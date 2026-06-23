 
import axios from 'axios';
import { API_BASE_URL } from '../constants/config';
import { getToken } from '../utils/storage';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// AuthContext registers a callback here so a 401 (expired/invalid token, e.g.
// after a JWT_SECRET change) can clear the session and route back to login.
let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

// Attach JWT to every request
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    console.log(
      '[AXIOS]', (config.method || 'get').toUpperCase(), config.url,
      '| Authorization:', config.headers.Authorization || '(none)'
    );
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    // Auto-logout on 401, but NOT for the auth endpoints themselves — a wrong
    // password there should surface on the login screen, not wipe the session.
    const isAuthRoute = url.includes('/api/auth/');
    if (status === 401 && !isAuthRoute && onUnauthorized) {
      console.warn('[AXIOS] 401 on', url, '— clearing stale session and routing to login.');
      onUnauthorized();
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;