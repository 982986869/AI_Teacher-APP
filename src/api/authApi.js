import axiosInstance from './axiosInstance';

const MOCK_MODE = true; // Set to false when your backend is running

const mockResponse = (name, email, phone) => ({
  token: 'mock-jwt-token-12345',
  user: { id: '1', name: name || 'User', email: email || '', phone: phone || '', grade: '' },
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

// ─── Google Auth ──────────────────────────────────────────────────────────────

export const loginWithGoogle = async ({ idToken }) => {
  if (MOCK_MODE) return { ...mockResponse('Google User', 'google@gmail.com'), isNewUser: false };
  const res = await axiosInstance.post('/api/auth/google', { idToken });
  return res.data;
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