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
  return res.data.data; // { user, scope, permissions }
};

// PATCH profile (complete-profile / migration): grade, board, stream, language, school, accountType.
export const updateProfileApi = async (patch) => {
  const res = await axiosInstance.patch('/api/auth/profile', patch);
  return res.data.data; // { user, scope }
};

// Delete the signed-in account. Soft delete on the server: the person is signed out
// and cannot sign in again — but for 30 days they can restore the account themselves
// from the address they deleted it with (see requestReactivation below). The server
// emails them that deadline. The caller MUST sign out on success — every later
// request would 401 anyway.
export const deleteAccountApi = async () => {
  const res = await axiosInstance.delete('/api/auth/me');
  return res.data;
};

// ─── Restoring a deleted account ────────────────────────────────────────────────
// Both of these are called while signed OUT — that is the whole situation they exist
// for — so neither carries a token.

// Ask for the restore email (a link and a six-digit code). Deliberately resolves the
// same way whether or not the address has a deactivated account: the server refuses to
// say, so that nobody can use this to discover who has an account. The screen must not
// claim otherwise either.
export const requestReactivation = async ({ email }) => {
  const res = await axiosInstance.post('/api/auth/reactivate/request', { email });
  return res.data;
};

// Spend the six-digit code from that email. On success the account is live again — but
// the caller is NOT signed in: a six-digit code is a weaker secret than the password,
// so the server will not mint a session from one. Send them back to sign in normally.
export const confirmReactivation = async ({ email, code }) => {
  const res = await axiosInstance.post('/api/auth/reactivate/confirm', { email, code });
  return res.data;
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

// ─── Password reset ───────────────────────────────────────────────────────────
// The server answers this identically whether or not the address is registered,
// so a caller cannot use it to discover who has an account. That means a success
// here is NOT evidence an email was sent — only that the request was accepted.
export const requestPasswordReset = async ({ email }) => {
  const res = await axiosInstance.post('/api/auth/forgot-password', { email });
  return res.data?.data ?? res.data;
};

// The six digits from that email, typed in the app. The email also carries a
// link for anyone reading it on a desktop; both point at the same one-time row,
// so whichever is used first ends the other.
//
// A wrong code comes back 400 with a message that deliberately does not say
// which part was wrong. Pass it through as-is: guessing on the user's behalf
// ("wrong code" vs "expired") would be inventing detail the server withheld.
export const resetPasswordWithCode = async ({ email, code, password }) => {
  const res = await axiosInstance.post('/api/auth/reset-password/code', {
    email, code, password,
  });
  return res.data?.data ?? res.data;
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