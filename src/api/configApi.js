import axiosInstance from './axiosInstance';

// Public runtime configuration (feature flags + settings). No auth required — the axios
// instance attaches a token if one exists, which the endpoint simply ignores. Supports
// conditional requests: pass the last ETag to get a cheap 304 when nothing changed.
// Returns { data, etag, notModified }. Transient GET failures are retried by axios.
export async function fetchConfig(etag) {
  const headers = {};
  if (etag) headers['If-None-Match'] = etag;
  const res = await axiosInstance.get('/api/config', {
    headers,
    validateStatus: (s) => s === 200 || s === 304,
  });
  if (res.status === 304) return { data: null, etag, notModified: true };
  return {
    data: res.data?.data || null,
    etag: res.headers?.etag || res.headers?.ETag || null,
    notModified: false,
  };
}
