export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

export const validatePhone = (phone) => {
  return /^\d{10}$/.test(phone);
};

export const validatePassword = (password) => {
  if (!password || password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  return null;
};

export const validateName = (name) => {
  if (!name || name.trim().length < 2) {
    return 'Please enter your full name';
  }
  return null;
};

export const validateOTP = (otp) => {
  return /^\d{6}$/.test(otp);
};