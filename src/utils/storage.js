import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  AUTH_TOKEN: '@ailernova_auth_token',
  USER:       '@ailernova_user',
};

// Legacy token returned by the still-mocked Google/OTP auth paths. It is NOT a
// real JWT, so the backend rejects it with "Invalid authentication token".
const MOCK_TOKEN = 'mock-jwt-token-12345';

export const saveToken = async (token) => {
  console.log('[AUTH] saveToken -> stored token after login:', token);
  await AsyncStorage.setItem(KEYS.AUTH_TOKEN, token);
};

export const getToken = async () => {
  const token = await AsyncStorage.getItem(KEYS.AUTH_TOKEN);
  // Defensively drop any old mock token so it can never be sent to the backend.
  if (token === MOCK_TOKEN) {
    console.warn('[AUTH] Found legacy MOCK token in storage — clearing it. Log in with EMAIL to get a real JWT.');
    await AsyncStorage.removeItem(KEYS.AUTH_TOKEN);
    return null;
  }
  console.log('[AUTH] getToken <- token loaded from storage:', token);
  return token;
};

export const removeToken = async () => {
  await AsyncStorage.removeItem(KEYS.AUTH_TOKEN);
};

export const saveUser = async (user) => {
  await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
};

export const getUser = async () => {
  const raw = await AsyncStorage.getItem(KEYS.USER);
  return raw ? JSON.parse(raw) : null;
};

export const clearAll = async () => {
  await AsyncStorage.multiRemove(Object.values(KEYS));
};