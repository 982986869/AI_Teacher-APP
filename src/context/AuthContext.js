import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { saveToken, getToken, saveUser, getUser, clearAll } from '../utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMe } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]               = useState(null);
  const [token, setToken]             = useState(null);
  const [loading, setLoading]         = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  // On app start: load the stored session, then validate the JWT against the
  // backend (/api/auth/me). Keep the user logged in only if the token is valid.
  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedUser, onboarded] = await Promise.all([
          getToken(),
          getUser(),
          AsyncStorage.getItem('@ailernova_onboarded'),
        ]);
        setHasOnboarded(onboarded === 'true');

        if (storedToken) {
          try {
            // The axios interceptor attaches the stored token to this request.
            const freshUser = await getMe();
            setToken(storedToken);
            setUser(freshUser);
            await saveUser(freshUser);
          } catch (e) {
            const status = e?.response?.status;
            if (status === 401 || status === 403) {
              // Token invalid/expired — clear it and fall back to login.
              await clearAll();
              setToken(null);
              setUser(null);
            } else if (storedUser) {
              // Transient error (offline / server down) — keep the last session.
              setToken(storedToken);
              setUser(storedUser);
            }
          }
        }
      } catch (_) {
        // ignore — fall through to the login screen
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signIn = useCallback(async ({ token: t, user: u }) => {
    await Promise.all([saveToken(t), saveUser(u)]);
    setToken(t);
    setUser(u);
  }, []);

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem('@ailernova_onboarded', 'true');
    setHasOnboarded(true);
  }, []);

  // Logout — clears the JWT and user from state and storage.
  const signOut = useCallback(async () => {
    await clearAll();
    await AsyncStorage.removeItem('@ailernova_onboarded');
    setToken(null);
    setUser(null);
    setHasOnboarded(false);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      isAuthenticated: !!token,
      hasOnboarded,
      signIn, signOut, logout: signOut, completeOnboarding,
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
