// Where the web Admin Portal (Next.js app in admin/) is served. Admin accounts open it
// embedded in a WebView inside this app. Resolution order:
//   1. EXPO_PUBLIC_ADMIN_URL — set for staging/production, e.g. https://admin.ailernova.in
//   2. Dev — reuse the Metro dev-server host IP with the portal's port :4000 (the same
//      machine runs Metro + the admin portal, so a physical device reaches it over LAN).
//   3. Fallback — http://localhost:4000 (works on a simulator/emulator only; a real
//      device cannot reach the machine's localhost).
import Constants from 'expo-constants';

export const ADMIN_PORTAL_PORT = 4000;

export function resolveAdminPortalUrl() {
  const env = process.env.EXPO_PUBLIC_ADMIN_URL;
  if (env && String(env).trim()) return String(env).trim().replace(/\/+$/, '');

  // Metro/Expo exposes the dev machine's host (ip:port) in a few shapes across SDKs.
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    Constants.manifest?.debuggerHost ||
    '';
  const host = String(hostUri).split(':')[0];
  if (host) return `http://${host}:${ADMIN_PORTAL_PORT}`;

  return `http://localhost:${ADMIN_PORTAL_PORT}`;
}
