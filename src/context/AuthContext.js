import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { saveToken, getToken, saveUser, getUser, savePermissions, getPermissions, clearAll } from '../utils/storage';
import { setUnauthorizedHandler, setProfileIncompleteHandler } from '../api/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deriveScope } from '../utils/personalization';
import { fetchMe, updateProfileApi, uploadProfilePhoto } from '../api/authApi';
import { getContentClasses } from '../api/resourcesApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]                 = useState(null);
  const [token, setToken]               = useState(null);
  // What this account may do in the admin portal, straight from the server's role map
  // (server/src/services/admin/permissions.js) — never re-derived here, so regranting a
  // role never needs an app release. Persisted so a cold start gates admin-only UI
  // before /me answers; otherwise the Support tab flickers in on every launch.
  const [permissions, setPermissions]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  // true only for the session where the user actually logged in via the login screen.
  // A storage-restore on reload leaves this false, so post-login steps are skipped.
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  // App-wide selected class. This mirrors the user's SAVED class (scope.className) —
  // it is not a free class switcher. Starts null and is set from scope once the user
  // loads, so we never default anyone to Class 11.
  const [selectedClass, setSelClass]    = useState(null);
  // Classes that currently have content, fetched from the backend (which reads the DB).
  // null = not loaded yet. This replaces the old hardcoded READY map, so adding content
  // to the DB automatically makes a class "ready" — no code change needed.
  const [readyClasses, setReadyClasses] = useState(null);
  // Which view a STUDENT account is currently using: 'student' | 'parent' | null.
  // The same login can flip between the student app and the parent dashboard — null
  // means "not chosen yet this login", which routes to the Student/Parent chooser.
  // Persisted so a reload keeps the chosen view; cleared on logout.
  const [activeView, setActiveViewState] = useState(null);
  // Monotonic "user write" counter. Any authoritative setUser (login / updateProfile)
  // bumps it; an in-flight best-effort fetchMe only applies its result if nothing newer
  // has landed since — so a slow /me can never revert a role the user just changed
  // (e.g. reverting a fresh 'parent' back to the stale 'student' row).
  const userOp = useRef(0);

  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedUser, storedPerms, onboarded, storedClass, storedView] = await Promise.all([
          getToken(),
          getUser(),
          getPermissions(),
          AsyncStorage.getItem('@ailernova_onboarded'),
          AsyncStorage.getItem('@ailernova_class'),
          AsyncStorage.getItem('@ailernova_active_view'),
        ]);
        if (storedView === 'student' || storedView === 'parent') setActiveViewState(storedView);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
          setPermissions(storedPerms || []);
          // Best-effort refresh — but never clobber a newer authoritative write.
          const myOp = userOp.current;
          fetchMe().then((d) => {
            if (d && d.user && userOp.current === myOp) {
              setUser(d.user); saveUser(d.user);
              setPermissions(d.permissions || []); savePermissions(d.permissions || []);
            }
          }).catch(() => {});
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

  // Flip a student between the student app and the parent dashboard (same login).
  // Pass null to send them back to the chooser. Persisted so a reload keeps the view.
  const setActiveView = useCallback(async (view) => {
    const v = view === 'student' || view === 'parent' ? view : null;
    setActiveViewState(v);
    try {
      if (v) await AsyncStorage.setItem('@ailernova_active_view', v);
      else await AsyncStorage.removeItem('@ailernova_active_view');
    } catch (_) {}
  }, []);

  // `permissions` rides along on the login/register response (see auth.controller). Taking
  // it here rather than waiting for the next /me is what lets an agent who just logged in
  // see the Support tab on this launch instead of the next one.
  const signIn = useCallback(async ({ token: t, user: u, permissions: p }) => {
    userOp.current += 1; // authoritative write — invalidate any in-flight fetchMe
    await Promise.all([saveToken(t), saveUser(u), savePermissions(p || [])]);
    setToken(t);
    setUser(u);
    setPermissions(p || []);
    setJustLoggedIn(true);
    // Fresh login → clear any remembered view so the Student/Parent chooser shows.
    setActiveViewState(null);
    try { await AsyncStorage.removeItem('@ailernova_active_view'); } catch (_) {}
  }, []);

  const completeOnboarding = useCallback(async () => {
    await AsyncStorage.setItem('@ailernova_onboarded', 'true');
    setHasOnboarded(true);
  }, []);

  // Complete-profile / migration: persist grade/board/stream/language/school/accountType.
  const updateProfile = useCallback(async (patch) => {
    const data = await updateProfileApi(patch);
    if (data && data.user) { userOp.current += 1; setUser(data.user); await saveUser(data.user); }
    return data;
  }, []);

  // Upload/change the profile photo — used right after signup (if a photo was
  // picked) and later from the Profile screen's "change photo".
  const updatePhoto = useCallback(async (file) => {
    const data = await uploadProfilePhoto(file);
    if (data && data.user) { userOp.current += 1; setUser(data.user); await saveUser(data.user); }
    return data;
  }, []);

  // Derived scope (role, class, stream, subjects) — single source of truth for the UI.
  const scope = useMemo(() => deriveScope(user), [user]);

  // Mirrors the admin console's can(). '*' is how super_admin is stored, so it must be
  // honoured here or the most privileged account would see the least. Client-side gating
  // is presentation only — every admin route checks the same permission server-side.
  const can = useCallback(
    (p) => permissions.includes('*') || permissions.includes(p),
    [permissions],
  );

  // Load (and refresh on login) the set of classes that have content in the DB.
  useEffect(() => {
    if (!token) return;
    getContentClasses()
      .then((list) => { if (Array.isArray(list)) setReadyClasses(new Set(list)); })
      .catch(() => {});
  }, [token]);

  // Is a class ready to show content? Backend-driven; while it's still loading we stay
  // optimistic (show content, which has its own loaders) rather than flashing "coming soon".
  const isClassReady = useCallback(
    (cls) => (!cls ? false : (readyClasses ? readyClasses.has(cls) : true)),
    [readyClasses],
  );

  // Keep the legacy selectedClass aligned to the user's real class.
  useEffect(() => {
    if (scope.className) setSelClass(scope.className);
  }, [scope.className]);

  const signOut = useCallback(async () => {
    await clearAll();
    await AsyncStorage.removeItem('@ailernova_onboarded');
    await AsyncStorage.removeItem('@ailernova_active_view');
    setToken(null);
    setUser(null);
    setPermissions([]);
    setHasOnboarded(false);
    setJustLoggedIn(false);
    setActiveViewState(null);
  }, []);

  // Let the axios layer clear the session on a 401 (expired/invalid token).
  // Keeps onboarding so a quick re-login lands straight back on Home.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearAll();
      setToken(null);
      setUser(null);
      setPermissions([]);
      setJustLoggedIn(false);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  // On a PROFILE_INCOMPLETE from any content API, re-fetch the user so scope updates
  // (scope.complete → false) and AppNavigator routes into CompleteProfile.
  useEffect(() => {
    setProfileIncompleteHandler(() => {
      const myOp = userOp.current;
      fetchMe().then((d) => {
        if (d && d.user && userOp.current === myOp) {
          setUser(d.user); saveUser(d.user);
          setPermissions(d.permissions || []); savePermissions(d.permissions || []);
        }
      }).catch(() => {});
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
      permissions, can,            // admin-portal RBAC, straight from the server's role map
      readyClasses, isClassReady,  // backend-driven "which classes have content" gate
      activeView, setActiveView,   // student's chosen view: 'student' | 'parent' | null (chooser)
      updateProfile, updatePhoto,
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