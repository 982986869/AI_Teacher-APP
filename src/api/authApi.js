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

// Upload / change the profile photo — multipart, `file` is an RN file object
// { uri, name, type } from expo-image-picker. Used right after signup (if a photo
// was picked) and later from the Profile screen. → { user, scope }
export const uploadProfilePhoto = async (file) => {
  const form = new FormData();
  form.append('file', {
    uri: file.uri,
    name: file.fileName || file.name || `avatar-${Date.now()}.jpg`,
    type: file.mimeType || file.type || 'image/jpeg',
  });
  const res = await axiosInstance.post('/api/auth/photo', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
  return res.data.data; // { user, scope }
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