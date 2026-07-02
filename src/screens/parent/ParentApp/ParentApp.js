// src/screens/parent/ParentApp/ParentApp.js
// Parent experience — routed by AppNavigator for role === 'parent'. Teammate's exact
// visuals (Poppins, Modal sheets, illustrations, 5 tabs) integrated into the app:
// loads Poppins, uses AuthContext, real getParentReport() + linkChild() gate, with
// skeleton/error/empty states. Sessions/tutor is a UI-only preview (no backend yet).
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, SafeAreaView, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold,
  Poppins_700Bold, Poppins_800ExtraBold, Poppins_900Black,
} from '@expo-google-fonts/poppins';
import { useAuth } from '../../../context/AuthContext';
import { getParentReport } from '../../../api/parentApi';
import { st, T, TABS } from './constants';
import HomeTab from './HomeTab';
import ProgressTab from './ProgressTab';
import SessionsTab from './SessionsTab';
import ChatTab from './ChatTab';
import ClassesTab from './ClassesTab';
import LinkChild from './LinkChild';
import ErrorState from './ErrorState';
import Skeleton from './Skeleton';
import BottomNav from './BottomNav';

export default function ParentApp() {
  const { user, signOut } = useAuth();
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold,
    Poppins_700Bold, Poppins_800ExtraBold, Poppins_900Black,
  });
  const fontsReady = fontsLoaded || fontError;

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('home');
  const [toast, setToast] = useState('');

  const mounted = useRef(true);
  const toastRef = useRef(null);
  useEffect(() => () => { mounted.current = false; if (toastRef.current) clearTimeout(toastRef.current); }, []);

  const flash = useCallback((m) => {
    setToast(m);
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => { if (mounted.current) setToast(''); }, 2600);
  }, []);

  const load = useCallback(async (isRefresh = false) => {
    try {
      const d = await getParentReport();
      if (!mounted.current) return;
      setReport(d); setErr(false);
    } catch (_) {
      if (!mounted.current) return;
      if (isRefresh) flash("Couldn't refresh — check your connection"); else setErr(true);
    } finally {
      if (mounted.current) { setLoading(false); setRefreshing(false); }
    }
  }, [flash]);
  useEffect(() => { load(false); }, [load]);

  const onRefresh = useCallback(() => { setRefreshing(true); load(true); }, [load]);
  const retry = useCallback(() => { setLoading(true); setErr(false); load(false); }, [load]);
  const switchTab = useCallback((id) => { setTab((prev) => (id === prev ? prev : id)); }, []);
  const onLinked = useCallback(() => { setLoading(true); load(false); }, [load]);
  const onAvatar = useCallback(() => {
    Alert.alert('Account', undefined, [
      { text: 'Link a different child', onPress: () => setReport({ linked: false }) },
      { text: 'Log out', style: 'destructive', onPress: () => signOut() },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [signOut]);

  const linked = !!(report && report.linked);
  const child = (report && report.child) || null;
  const childName = child?.name || 'your child';
  const meta = TABS.find((t) => t.id === tab);

  let content;
  if (!fontsReady || loading) {
    content = <Skeleton />;
  } else if (err && !report) {
    content = <ErrorState onRetry={retry} />;
  } else if (!linked) {
    content = <LinkChild parentName={user?.name} onLinked={onLinked} onLogout={onAvatar} />;
  } else {
    const shared = { meta, childName, onAvatar, flash };
    content = (
      <View style={st.screen}>
        {tab === 'home' && <HomeTab {...shared} report={report} refreshing={refreshing} onRefresh={onRefresh} />}
        {tab === 'progress' && <ProgressTab {...shared} report={report} refreshing={refreshing} onRefresh={onRefresh} />}
        {tab === 'sessions' && <SessionsTab {...shared} />}
        {tab === 'chat' && <ChatTab {...shared} />}
        {tab === 'classes' && <ClassesTab {...shared} />}
        <BottomNav tab={tab} setTab={switchTab} />
        {!!toast && <View style={st.toast}><T w="semi" s={14} c="#fff" style={{ textAlign: 'center' }}>{toast}</T></View>}
      </View>
    );
  }

  return (
    <SafeAreaView style={st.safe}>
      <StatusBar style="dark" />
      {content}
    </SafeAreaView>
  );
}
