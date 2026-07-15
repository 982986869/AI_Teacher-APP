import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { fetchConfig } from '../api/configApi';

// ─── Runtime configuration ──────────────────────────────────────────────────
// A SINGLE provider owns config for the whole app. It:
//   • loads the last valid config from AsyncStorage instantly on launch (offline-ready),
//   • fetches once at startup and refreshes silently when the app returns to foreground,
//   • de-duplicates concurrent/rapid requests and uses an ETag for cheap 304s,
//   • VALIDATES the response shape and never replaces a valid cache with an invalid one,
//   • falls open (all features on, no maintenance, no forced update) when nothing loads.
// No screen fetches config on its own — every screen reads this provider.

const STORAGE_KEY = '@ailernova_runtime_config';
const STALE_MS = 5 * 60 * 1000; // silent background refresh only if older than 5 min

const DEFAULTS = {
  featureFlags: {},
  maintenance: { enabled: false, message: '' },
  platformConfig: { signupsEnabled: true, leaderboardEnabled: true },
  supportedClasses: [],
  academicYear: '',
  defaultStudentExperience: 'standard',
  appVersion: '1.0.0',
  minAndroidVersion: '0.0.0',
  minIosVersion: '0.0.0',
  forceUpdate: false,
  androidStoreUrl: '',
  iosStoreUrl: '',
  releaseNotes: '',
  configVersion: '',
  updatedAt: null,
};

const RuntimeConfigContext = createContext(null);

// Semantic (not lexicographic) version compare — returns true when a < b.
export function semverLt(a, b) {
  const pa = String(a || '0').split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b || '0').split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) < (pb[i] || 0)) return true;
    if ((pa[i] || 0) > (pb[i] || 0)) return false;
  }
  return false;
}

// Guard against malformed / partial responses before we trust or persist them.
function isValidConfig(c) {
  return Boolean(
    c
    && typeof c === 'object'
    && c.featureFlags && typeof c.featureFlags === 'object' && !Array.isArray(c.featureFlags)
    && c.maintenance && typeof c.maintenance.enabled === 'boolean'
    && typeof c.configVersion === 'string'
    && Array.isArray(c.supportedClasses),
  );
}

export function RuntimeConfigProvider({ children }) {
  const [config, setConfig] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);       // have we ever loaded a valid config?
  const [error, setError] = useState(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null); // when we last got a fresh 200

  const mounted = useRef(true);
  const inFlight = useRef(null);      // de-dupe concurrent fetches
  const etag = useRef(null);          // last ETag for conditional requests
  const lastFetch = useRef(0);        // wall-clock of last network attempt
  const havePersisted = useRef(false);

  useEffect(() => () => { mounted.current = false; }, []);

  const safeSet = useCallback((fn) => { if (mounted.current) fn(); }, []);

  const load = useCallback(async ({ force = false } = {}) => {
    if (inFlight.current) return inFlight.current;                 // de-dupe
    const now = Date.now();
    if (!force && now - lastFetch.current < STALE_MS) return;      // staleness throttle
    lastFetch.current = now;
    const p = (async () => {
      try {
        const res = await fetchConfig(etag.current);
        if (res.notModified) {
          safeSet(() => { setError(null); setLastUpdatedAt(new Date()); });
          return;
        }
        if (isValidConfig(res.data)) {
          const next = { ...DEFAULTS, ...res.data };
          etag.current = res.etag || etag.current;
          safeSet(() => { setConfig(next); setLoaded(true); setError(null); setLastUpdatedAt(new Date()); });
          try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ config: next, etag: etag.current, savedAt: Date.now() })); } catch (_) {}
        } else if (res.data != null) {
          // Got a response, but it failed validation — keep the last valid config.
          if (__DEV__) console.warn('[RuntimeConfig] invalid config response ignored — keeping last valid config');
          safeSet(() => setError('invalid'));
        }
      } catch (e) {
        if (__DEV__) console.warn('[RuntimeConfig] fetch failed — using cached/defaults:', e?.message);
        safeSet(() => setError(e?.message || 'network'));
      } finally {
        safeSet(() => setLoading(false));
        inFlight.current = null;
      }
    })();
    inFlight.current = p;
    return p;
  }, [safeSet]);

  // Startup: hydrate from AsyncStorage instantly, then fetch fresh in the background.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw && alive) {
          const parsed = JSON.parse(raw);
          if (isValidConfig(parsed?.config)) {
            etag.current = parsed.etag || null;
            havePersisted.current = true;
            safeSet(() => { setConfig({ ...DEFAULTS, ...parsed.config }); setLoaded(true); setLoading(false); });
          }
        }
      } catch (_) { /* ignore corrupt cache */ }
      load({ force: true }); // always refresh once on startup
    })();
    return () => { alive = false; };
  }, [load, safeSet]);

  // Silent refresh when the app returns to the foreground (de-duped + staleness-throttled).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => { if (state === 'active') load(); });
    return () => sub.remove();
  }, [load]);

  // Missing flag → enabled (fail-open).
  const isFeatureEnabled = useCallback((key) => {
    const v = config.featureFlags[key];
    return v === undefined ? true : v === true;
  }, [config]);

  const installedVersion = Constants.expoConfig?.version || Constants.manifest?.version || '0.0.0';
  const isDevEnv = (typeof __DEV__ !== 'undefined' && __DEV__) || Constants.appOwnership === 'expo';
  const platformMin = Platform.OS === 'ios' ? config.minIosVersion : config.minAndroidVersion;
  const storeUrl = Platform.OS === 'ios' ? config.iosStoreUrl : config.androidStoreUrl;
  const belowMin = semverLt(installedVersion, platformMin);
  // Never block updates in dev/Expo Go (no real installed build to compare against).
  const forceUpdateRequired = !isDevEnv && config.forceUpdate === true && belowMin;
  const optionalUpdateAvailable = !isDevEnv && config.forceUpdate !== true && belowMin;

  const value = {
    config,
    loading,
    loaded,
    error,
    lastUpdatedAt,
    refresh: () => load({ force: true }),
    isFeatureEnabled,
    maintenance: config.maintenance,
    supportedClasses: config.supportedClasses,
    forceUpdateRequired,
    optionalUpdateAvailable,
    storeUrl,
    platformMin,
    installedVersion,
  };
  return <RuntimeConfigContext.Provider value={value}>{children}</RuntimeConfigContext.Provider>;
}

// Safe even outside a provider (fail-open defaults) so no screen ever crashes.
export function useRuntimeConfig() {
  return useContext(RuntimeConfigContext) || {
    config: DEFAULTS, loading: false, loaded: false, error: null, lastUpdatedAt: null,
    refresh: () => {}, isFeatureEnabled: () => true, maintenance: DEFAULTS.maintenance,
    supportedClasses: [], forceUpdateRequired: false, optionalUpdateAvailable: false,
    storeUrl: '', platformMin: '0.0.0', installedVersion: '0.0.0',
  };
}

export function useFeatureFlag(key) {
  return useRuntimeConfig().isFeatureEnabled(key);
}
