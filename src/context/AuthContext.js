import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { saveToken, getToken, saveUser, getUser, clearAll } from '../utils/storage';
import { setUnauthorizedHandler } from '../api/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]                 = useState(null);
  const [token, setToken]               = useState(null);
  const [loading, setLoading]           = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  // true only for the session where the user actually logged in via the login screen.
  // A storage-restore on reload leaves this false, so post-login steps are skipped.
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  // App-wide selected class (Class 9–12). Drives which content the user sees.
  const [selectedClass, setSelClass]    = useState('Class 11');

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
    console.log('[AUTH] signIn — token received from backend:', t);
    await Promise.all([saveToken(t), saveUser(u)]);
    setToken(t);
    setUser(u);
    setJustLoggedIn(true);
  }, []);

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem('@ailernova_onboarded', 'true');
    setHasOnboarded(true);
  }, []);

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

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      isAuthenticated: !!token,
      hasOnboarded,
      justLoggedIn,
      selectedClass, setSelectedClass,
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