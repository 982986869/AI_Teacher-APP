import axiosInstance from './axiosInstance';

// Email + Phone(OTP) are production-ready (real backend JWT). Google is not
// implemented yet — its stub throws a clear "coming soon" error.
const COMING_SOON = 'This sign-in method is coming soon. Please use email or phone for now.';

// ─── Email Auth ────────────────────────────────────────────────────────────────
// Backend wraps responses as { success, message, data } — unwrap to the payload.

export const loginWithEmail = async ({ email, password }) => {
  const res = await axiosInstance.post('/api/auth/login', { email, password });
  return res.data.data;
};

export const signupWithEmail = async ({ name, email, password, grade }) => {
  const res = await axiosInstance.post('/api/auth/register', { name, email, password, grade });
  return res.data.data;
};

// Validate the stored JWT and fetch the current user. 401 => token invalid.
export const getMe = async () => {
  const res = await axiosInstance.get('/api/auth/me');
  return res.data.data.user;
};

// ─── Phone OTP Auth (real backend) ──────────────────────────────────────────────

// Request a 6-digit OTP for a phone number.
// Returns { phone, purpose, expiresInSeconds, devOtp? } (devOtp only in dev).
export const requestPhoneOtp = async ({ phone }) => {
  const res = await axiosInstance.post('/api/auth/phone/request-otp', { phone });
  return res.data.data;
};

// Verify the OTP. Logs in if the phone exists, otherwise creates the account.
// Returns { token, user, isNewUser }.
export const verifyPhoneOtp = async ({ phone, otp, name, grade }) => {
  const res = await axiosInstance.post('/api/auth/phone/verify-otp', { phone, otp, name, grade });
  return res.data.data;
};

// ─── Not available yet (no mock tokens) ─────────────────────────────────────────

export const loginWithGoogle = async () => {
  throw new Error(COMING_SOON);
};
