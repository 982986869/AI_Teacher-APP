// Real Google Sign-In, wrapped so the rest of the app never touches the native
// module directly.
//
// @react-native-google-signin/google-signin is native code, so it does not exist in
// Expo Go — importing it there throws at module load. The guarded require below keeps
// the app booting in Expo Go and lets screens show a useful message instead of
// crashing on a button press. In a dev build / APK it resolves normally.

import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

import { GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID } from '../constants/config';

export const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Resolved in one place (constants/config) so App.js and this module can never
// disagree about which client ID is in effect.
const webClientId = GOOGLE_WEB_CLIENT_ID;
const iosClientId = GOOGLE_IOS_CLIENT_ID;

let GoogleSignin = null;
let statusCodes = {};

if (!isExpoGo) {
  try {
    const mod = require('@react-native-google-signin/google-signin');
    GoogleSignin = mod.GoogleSignin;
    statusCodes = mod.statusCodes || {};
  } catch (e) {
    // Native module missing (e.g. an older build made before the plugin was added).
    GoogleSignin = null;
  }
}

export const isGoogleSigninAvailable = Boolean(GoogleSignin && webClientId);

// Thrown when the user backs out of the Google sheet. Screens swallow this instead of
// showing an error — a deliberate dismissal is not a failure.
export class GoogleSignInCancelled extends Error {
  constructor() {
    super('Google sign-in cancelled');
    this.name = 'GoogleSignInCancelled';
  }
}

export const googleUnavailableReason = () => {
  if (isExpoGo) {
    return 'Google sign-in needs the installed app — it does not work in Expo Go. Use email or phone here, or run a development build.';
  }
  if (!GoogleSignin) {
    return 'Google sign-in is unavailable in this build. Rebuild the app to include the Google module.';
  }
  if (!webClientId) {
    return 'Google sign-in is not configured yet. Add your webClientId to app.json.';
  }
  return null;
};

let configured = false;
const ensureConfigured = () => {
  if (configured) return;
  GoogleSignin.configure({
    // webClientId is required on Android too: Android issues an idToken audienced to
    // the *web* client, not the Android one.
    webClientId,
    ...(iosClientId ? { iosClientId } : {}),
    scopes: ['profile', 'email'],
    offlineAccess: false,
  });
  configured = true;
};

/**
 * Opens the native Google account picker.
 * @returns {Promise<{ idToken: string, profile: object|null }>}
 * @throws {GoogleSignInCancelled} when the user dismisses the sheet.
 */
export const signInWithGoogle = async () => {
  const reason = googleUnavailableReason();
  if (reason) throw new Error(reason);

  ensureConfigured();

  if (Platform.OS === 'android') {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  }

  // Without this, a previously-signed-in account is reused silently and the user can
  // never switch accounts.
  try {
    await GoogleSignin.signOut();
  } catch (e) {
    // Nothing was signed in — fine.
  }

  let response;
  try {
    response = await GoogleSignin.signIn();
  } catch (e) {
    if (e?.code === statusCodes.SIGN_IN_CANCELLED) throw new GoogleSignInCancelled();
    throw e;
  }

  // v13+ returns { type: 'success' | 'cancelled', data }. Older versions returned the
  // user object flat, so both shapes are read.
  if (response?.type === 'cancelled') throw new GoogleSignInCancelled();

  const payload = response?.data || response || {};
  const idToken = payload.idToken;

  if (!idToken) {
    throw new Error('Google did not return an ID token. Check the webClientId in app.json.');
  }

  return { idToken, profile: payload.user || null };
};

export const signOutFromGoogle = async () => {
  if (!GoogleSignin) return;
  try {
    await GoogleSignin.signOut();
  } catch (e) {
    // Not signed in — nothing to do.
  }
};
