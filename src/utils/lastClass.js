// src/utils/lastClass.js
// Remembers the admin's last-selected class PER module (tests / resources) so returning to a
// tab restores the class they were working in (persists across app restarts via AsyncStorage).
import AsyncStorage from '@react-native-async-storage/async-storage';

const key = (module) => `admin.lastClass.${module}`;

export async function getLastClass(module) {
  try { const v = await AsyncStorage.getItem(key(module)); const n = parseInt(v, 10); return Number.isFinite(n) ? n : null; }
  catch { return null; }
}

export function setLastClass(module, n) {
  AsyncStorage.setItem(key(module), String(n)).catch(() => {});
}
