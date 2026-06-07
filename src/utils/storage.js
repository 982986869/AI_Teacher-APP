import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  AUTH_TOKEN: '@ailernova_auth_token',
  USER:       '@ailernova_user',
};

export const saveToken = async (token) => {
  await AsyncStorage.setItem(KEYS.AUTH_TOKEN, token);
};

export const getToken = async () => {
  return await AsyncStorage.getItem(KEYS.AUTH_TOKEN);
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