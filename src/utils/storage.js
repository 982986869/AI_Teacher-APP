import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  AUTH_TOKEN: '@ailernova_auth_token',
  USER:       '@ailernova_user',
};

// Legacy fake token from the old mocked auth paths. It is NOT a valid JWT, so it
// is purged on read and can never reach the backend.
const MOCK_TOKEN = 'mock-jwt-token-12345';

export const saveToken = async (token) => {
  await AsyncStorage.setItem(KEYS.AUTH_TOKEN, token);
};

export const getToken = async () => {
  const token = await AsyncStorage.getItem(KEYS.AUTH_TOKEN);
  if (token === MOCK_TOKEN) {
    await AsyncStorage.removeItem(KEYS.AUTH_TOKEN);
    return null;
  }
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
