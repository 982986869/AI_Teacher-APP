import Constants from 'expo-constants';

const API_PORT = 5000;

// Production / explicit override: set EXPO_PUBLIC_API_URL to a full URL (e.g. https://api.example.com)
const ENV_API_URL = process.env.EXPO_PUBLIC_API_URL;

// Resolve the API base URL. Priority:
//   1. EXPO_PUBLIC_API_URL — the ONLY thing a standalone build (APK/AAB) can use.
//      It is inlined at build time (eas.json env), so it must be set before `eas
//      build`; you cannot change it in an already-built binary.
//   2. In Expo Go / dev, derive the dev machine's LAN IP from the Metro host URI
//      (e.g. "10.166.188.99:8081") so we never have to hardcode it.
// A standalone build has NO Metro host URI. If EXPO_PUBLIC_API_URL is also unset
// there, every request would silently target localhost (the phone itself) and all
// network calls — including login — fail. So we surface that misconfiguration
// loudly instead of hiding it behind a dead localhost fallback.
function resolveApiUrl() {
  if (ENV_API_URL) return ENV_API_URL;

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) return `http://${hostUri.split(':')[0]}:${API_PORT}`;

  console.error(
    '[config] No API URL configured: EXPO_PUBLIC_API_URL is unset and there is no ' +
    'Metro dev server to derive one from. This is a broken standalone build — set ' +
    'EXPO_PUBLIC_API_URL (eas.json env) to your deployed https:// backend and rebuild. ' +
    'Falling back to localhost, which is unreachable from a device, so login WILL fail.'
  );
  return `http://localhost:${API_PORT}`;
}

export const API_BASE_URL = resolveApiUrl();

// Google OAuth client IDs. app.json → expo.extra.google is the primary source: unlike
// process.env it is present in standalone builds, which is where the old env-only
// lookup silently fell through to the placeholder. These are public identifiers, not
// secrets, so shipping them in the bundle is expected.
const googleExtra = Constants.expoConfig?.extra?.google || {};

const isPlaceholder = (v) => !v || v.startsWith('REPLACE_WITH') || v === 'YOUR_GOOGLE_WEB_CLIENT_ID';

const pickClientId = (...candidates) => candidates.find((c) => !isPlaceholder(c)) || '';

export const GOOGLE_WEB_CLIENT_ID = pickClientId(
  googleExtra.webClientId,
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  process.env.GOOGLE_WEB_CLIENT_ID,
);

export const GOOGLE_IOS_CLIENT_ID = pickClientId(
  googleExtra.iosClientId,
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
);

export const OTP_LENGTH = 6;

export const OTP_RESEND_TIMER = 30; // seconds