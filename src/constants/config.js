import Constants from 'expo-constants';

const API_PORT = 5000;

// Production / explicit override: set EXPO_PUBLIC_API_URL to a full URL (e.g. https://api.example.com)
const ENV_API_URL = process.env.EXPO_PUBLIC_API_URL;

// In Expo Go / dev, derive the dev machine's LAN IP from the Metro host URI
// (e.g. "10.166.188.99:8081") so we never have to hardcode it again.
function resolveDevApiUrl() {
  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri ? hostUri.split(':')[0] : 'localhost';
  return `http://${host}:${API_PORT}`;
}

export const API_BASE_URL = ENV_API_URL || resolveDevApiUrl();

export const GOOGLE_WEB_CLIENT_ID = process.env.GOOGLE_WEB_CLIENT_ID || 'YOUR_GOOGLE_WEB_CLIENT_ID';

export const OTP_LENGTH = 6;

export const OTP_RESEND_TIMER = 30; // seconds