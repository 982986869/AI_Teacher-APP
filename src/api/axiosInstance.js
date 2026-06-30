 
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

// Retry transient failures for idempotent GET requests. The Supabase connection
// pooler occasionally resets a connection, which the server surfaces as a 503
// ("Service temporarily unavailable"); network blips/timeouts arrive with no
// response. A couple of quick retries smooth these over so they don't show up as
// "Could not load…" (e.g. Last Year Papers intermittently failing). POST/PUT are
// never auto-retried — that could double-submit (mock attempts, MCQ submits).
const MAX_RETRIES = 2;
const isTransient = (error) => {
  const status = error.response?.status;
  return !error.response || status === 503 || status === 502 || status === 504;
};

// Handle 401 globally + retry transient GET failures
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const config = error.config || {};
    const url = config.url || '';

    const method = (config.method || 'get').toLowerCase();
    if (method === 'get' && isTransient(error)) {
      config.__retryCount = (config.__retryCount || 0) + 1;
      if (config.__retryCount <= MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, 400 * config.__retryCount));
        return axiosInstance(config);
      }
    }

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