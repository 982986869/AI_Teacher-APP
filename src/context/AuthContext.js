import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { saveToken, getToken, saveUser, getUser, clearAll } from '../utils/storage';
import { setUnauthorizedHandler, setProfileIncompleteHandler } from '../api/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deriveScope } from '../utils/personalization';
import { fetchMe, updateProfileApi } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]                 = useState(null);
  const [token, setToken]               = useState(null);
  const [loading, setLoading]           = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  // true only for the session where the user actually logged in via the login screen.
  // A storage-restore on reload leaves this false, so post-login steps are skipped.
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  // App-wide selected class. This mirrors the user's SAVED class (scope.className) —
  // it is not a free class switcher. Starts null and is set from scope once the user
  // loads, so we never default anyone to Class 11.
  const [selectedClass, setSelClass]    = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedUser, onboarded, storedClass] = await Promise.all([
          getToken(),
          getUser(),
          AsyncStorage.getItem('@ailernova_onboarded'),
          AsyncStorage.getItem('@ailernova_class'),
        ]);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
          // Best-effort refresh so we get the latest personalization fields/scope.
          fetchMe().then((d) => { if (d && d.user) { setUser(d.user); saveUser(d.user); } }).catch(() => {});
        }
        setHasOnboarded(onboarded === 'true');
        if (storedClass) setSelClass(storedClass);
      } catch (_) {
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setSelectedClass = useCallback(async (cls) => {
    setSelClass(cls);
    try { await AsyncStorage.setItem('@ailernova_class', cls); } catch (_) {}
  }, []);

  const signIn = useCallback(async ({ token: t, user: u }) => {
    await Promise.all([saveToken(t), saveUser(u)]);
    setToken(t);
    setUser(u);
    setJustLoggedIn(true);
  }, []);

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem('@ailernova_onboarded', 'true');
    setHasOnboarded(true);
  }, []);

  // Complete-profile / migration: persist grade/board/stream/language/school/accountType.
  const updateProfile = useCallback(async (patch) => {
    const data = await updateProfileApi(patch);
    if (data && data.user) { setUser(data.user); await saveUser(data.user); }
    return data;
  }, []);

  // Derived scope (role, class, stream, subjects) — single source of truth for the UI.
  const scope = useMemo(() => deriveScope(user), [user]);

  // Keep the legacy selectedClass aligned to the user's real class.
  useEffect(() => {
    if (scope.className) setSelClass(scope.className);
  }, [scope.className]);

  const signOut = useCallback(async () => {
    await clearAll();
    await AsyncStorage.removeItem('@ailernova_onboarded');
    setToken(null);
    setUser(null);
    setHasOnboarded(false);
    setJustLoggedIn(false);
  }, []);

  // Let the axios layer clear the session on a 401 (expired/invalid token).
  // Keeps onboarding so a quick re-login lands straight back on Home.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearAll();
      setToken(null);
      setUser(null);
      setJustLoggedIn(false);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  // On a PROFILE_INCOMPLETE from any content API, re-fetch the user so scope updates
  // (scope.complete → false) and AppNavigator routes into CompleteProfile.
  useEffect(() => {
    setProfileIncompleteHandler(() => {
      fetchMe().then((d) => { if (d && d.user) { setUser(d.user); saveUser(d.user); } }).catch(() => {});
    });
    return () => setProfileIncompleteHandler(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      isAuthenticated: !!token,
      hasOnboarded,
      justLoggedIn,
      selectedClass, setSelectedClass,
      scope,                       // { role, classNum, className, stream, board, language, subjects, complete }
      updateProfile,
      signIn, signOut, completeOnboarding,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};

export default AuthContext;