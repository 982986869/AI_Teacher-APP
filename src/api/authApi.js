import axiosInstance from './axiosInstance';

const MOCK_MODE = true; // Set to false when your backend is running

// Demo user is a COMPLETE Class 11 PCM student. A complete scope (class + stream) makes
// AppNavigator skip Complete Profile — which can't be saved in a no-backend demo build —
// so a mock login lands straight in the app.
const mockResponse = (name, email, phone) => ({
  token: 'mock-jwt-token-12345',
  user: { id: '1', name: name || 'Demo User', email: email || '', phone: phone || '', grade: 'Class 11', stream: 'PCM' },
});

// ─── Email Auth (real backend) ──────────────────────────────────────────────────
// Backend wraps responses as { success, message, data } — unwrap to { token, user }.

export const loginWithEmail = async ({ email, password }) => {
  const res = await axiosInstance.post('/api/auth/login', { email, password });
  return res.data.data;
};

export const signupWithEmail = async ({ name, email, password, grade }) => {
  const res = await axiosInstance.post('/api/auth/register', { name, email, password, grade });
  return res.data.data;
};

// ─── Profile / personalization ──────────────────────────────────────────────────
// GET current user + derived scope (role, class, stream, subjects).
export const fetchMe = async () => {
  const res = await axiosInstance.get('/api/auth/me');
  return res.data.data; // { user, scope }
};

// PATCH profile (complete-profile / migration): grade, board, stream, language, school, accountType.
export const updateProfileApi = async (patch) => {
  const res = await axiosInstance.patch('/api/auth/profile', patch);
  return res.data.data; // { user, scope }
};

// ─── Password reset ───────────────────────────────────────────────────────────
// NOTE: the server does not implement this route yet — server/src/routes/auth.js
// currently mounts register/login/google/me/profile only. Until it does, a request
// 404s; translate that into a message the user can act on rather than a bare
// "Request failed with status code 404".
export const requestPasswordReset = async ({ email }) => {
  try {
    const res = await axiosInstance.post('/api/auth/forgot-password', { email });
    return res.data?.data ?? res.data;
  } catch (e) {
    if (e?.response?.status === 404) {
      throw new Error('Password reset isn’t available yet. Please sign in with a phone OTP or contact support.');
    }
    throw e;
  }
};

// ─── Google Auth ──────────────────────────────────────────────────────────────

// Real backend: the server verifies the idToken against Google's public keys, then
// creates or returns the matching account. Same { success, message, data } envelope as
// the email routes, so unwrap to { token, user, scope, isNewUser }.
export const loginWithGoogle = async ({ idToken }) => {
  const res = await axiosInstance.post('/api/auth/google', { idToken });
  return res.data.data;
};

// ─── Phone / OTP Auth ─────────────────────────────────────────────────────────

export const sendOTP = async ({ phone }) => {
  if (MOCK_MODE) return { message: 'OTP sent' };
  const res = await axiosInstance.post('/api/auth/send-otp', { phone });
  return res.data;
};

export const verifyOTP = async ({ phone, otp }) => {
  if (MOCK_MODE) {
    if (otp === '123456') return { ...mockResponse('User', '', phone), isNewUser: false };
    throw new Error('Invalid OTP');
  }
  const res = await axiosInstance.post('/api/auth/verify-otp', { phone, otp });
  return res.data;
};

export const completePhoneSignup = async ({ phone, name, grade, token }) => {
  if (MOCK_MODE) return mockResponse(name, '', phone);
  const res = await axiosInstance.post('/api/auth/complete-phone-signup', { phone, name, grade }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};