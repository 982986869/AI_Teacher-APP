// src/screens/parent/ParentApp/ParentApp.js
// Parent experience orchestrator. Routed by AppNavigator for role === 'parent'.
// Loads getParentReport(), gates on linkChild(), and composes the tab components.
// Visuals/behaviour are unchanged from the pre-refactor single-file version.
import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import {
  View, Text, SafeAreaView, StatusBar, Platform, Animated, Alert, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { getParentReport } from '../../../api/parentApi';
import { C, s, TABS } from './constants';
import Header from './Header';
import HomeTab from './HomeTab';
import ProgressTab from './ProgressTab';
import LinkChild from './LinkChild';
import ErrorState from './ErrorState';
import Skeleton from './Skeleton';
import BottomNav from './BottomNav';

// No backend yet for sessions/chat/classes → elegant empty state (kept local; only used here).
const ComingSoonTab = memo(function ComingSoonTab({ bg, icon, title, text }) {
  return (
    <View style={[s.emptyScreen, { backgroundColor: bg }]}>
      <View style={s.emptyIcon}><Ionicons name={icon} size={34} color="#fff" /></View>
      <Text style={s.emptyTitle}>{title}</Text>
      <Text style={s.emptyText}>{text}</Text>
      <View style={s.comingPill}><Text style={s.comingPillTxt}>Coming soon</Text></View>
    </View>
  );
});

export default function ParentApp() {
  const { user, signOut } = useAuth();
  const { width } = useWindowDimensions();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('home');
  const [toast, setToast] = useState('');

  const mounted = useRef(true);
  const toastRef = useRef(null);
  const fade = useRef(new Animated.Value(1)).current;

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

  // Fade the active tab content in on every tab change (and first paint).
  useEffect(() => {
    fade.setValue(0);
    const anim = Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true });
    anim.start();
    return () => anim.stop();
  }, [tab, fade]);

  const onAvatar = useCallback(() => {
    Alert.alert('Account', undefined, [
      { text: 'Link a different child', onPress: () => setReport({ linked: false }) },
      { text: 'Log out', style: 'destructive', onPress: () => signOut() },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [signOut]);

  const onLinked = useCallback(() => { setLoading(true); load(false); }, [load]);

  // Tablet/large screens: cap content to a comfortable column instead of stretching.
  const sidePad = width > 620 ? Math.max(18, Math.round((width - 560) / 2)) : 18;

  const linked = !!(report && report.linked);
  const child = (report && report.child) || null;
  const meta = TABS.find((t) => t.id === tab);

  let content;
  if (loading) {
    content = <Skeleton />;
  } else if (err && !report) {
    content = <ErrorState onRetry={retry} />;
  } else if (!linked) {
    content = <LinkChild parentName={user?.name} onLinked={onLinked} onLogout={onAvatar} />;
  } else {
    content = (
      <View style={s.flexFill}>
        <Header meta={meta} child={child} onAvatar={onAvatar} />
        <Animated.View style={[s.flexFill, { opacity: fade }]}>
          {tab === 'home' && <HomeTab report={report} child={child} sidePad={sidePad} refreshing={refreshing} onRefresh={onRefresh} flash={flash} />}
          {tab === 'progress' && <ProgressTab report={report} sidePad={sidePad} refreshing={refreshing} onRefresh={onRefresh} />}
          {tab === 'sessions' && <ComingSoonTab bg={C.blue} icon="videocam" title="1-on-1 sessions" text={`Book live tutoring sessions for ${child.name} — coming soon.`} />}
          {tab === 'chat' && <ComingSoonTab bg={C.chatBg} icon="chatbubbles" title="Chat" text={`Chat with ${child.name}'s tutor once tutoring is enabled.`} />}
          {tab === 'classes' && <ComingSoonTab bg={C.classBg} icon="calendar" title="Classes" text={`Manage ${child.name}'s class schedule — coming soon.`} />}
        </Animated.View>
        <BottomNav tab={tab} setTab={switchTab} />
        {!!toast && <View style={s.toast}><Text style={s.toastTxt}>{toast}</Text></View>}
      </View>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.headerBg} />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: C.headerBg }} />}
      {content}
    </SafeAreaView>
  );
}
