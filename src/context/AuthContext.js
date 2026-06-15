import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { saveToken, getToken, saveUser, getUser, clearAll } from '../utils/storage';
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

  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedUser, onboarded] = await Promise.all([
          getToken(),
          getUser(),
          AsyncStorage.getItem('@ailernova_onboarded'),
        ]);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
        }
        setHasOnboarded(onboarded === 'true');
      } catch (_) {
      } finally {
        setLoading(false);
      }
    })();
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

  const signOut = useCallback(async () => {
    await clearAll();
    await AsyncStorage.removeItem('@ailernova_onboarded');
    setToken(null);
    setUser(null);
    setHasOnboarded(false);
    setJustLoggedIn(false);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      isAuthenticated: !!token,
      hasOnboarded,
      justLoggedIn,
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