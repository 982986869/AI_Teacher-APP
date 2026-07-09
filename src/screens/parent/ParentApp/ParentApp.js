// src/screens/parent/ParentApp/ParentApp.js
// Parent experience — routed by AppNavigator for role === 'parent'. Teammate's exact
// visuals (Poppins, Modal sheets, illustrations, 5 tabs) integrated into the app:
// loads Poppins, uses AuthContext, real getParentReport() + linkChild() gate, with
// skeleton/error/empty states. Sessions/tutor is a UI-only preview (no backend yet).
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, SafeAreaView, Alert, Modal } from 'react-native';
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
import ProfileSheet from './ProfileSheet';
import BrainGymFlow from '../../braingym/BrainGymFlow';
import ActivityRouter from './ActivityRouter';
import BookTrial from './BookTrial';
import { FadeIn } from './anim';

export default function ParentApp() {
  const { user, signOut, scope, setActiveView } = useAuth();
  // When a STUDENT is viewing this dashboard (same login), let them flip back to the
  // student app. Real parent accounts have no student view, so this stays undefined.
  const onSwitchToStudent = scope?.role === 'student' ? () => setActiveView('student') : undefined;
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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [gymOpen, setGymOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [trialOpen, setTrialOpen] = useState(false);

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
  // Header avatar opens the premium account bottom sheet (replaces the old Alert popup).
  const onAvatar = useCallback(() => setSheetOpen(true), []);
  const onGym = useCallback(() => setGymOpen(true), []);            // AI Gym → the real BrainGym
  const onActivity = useCallback(() => setActivityOpen(true), []);  // Recent activity detail
  const onBookTrial = useCallback(() => setTrialOpen(true), []);    // "Book a FREE trial" → in-app form
  const relink = useCallback(() => setReport({ linked: false }), []);
  const confirmDelete = useCallback(() => {
    Alert.alert(
      'Delete account',
      'This permanently removes your parent account and unlinks your child. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => flash('Account deletion — coming soon') },
      ],
    );
  }, [flash]);

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
    content = <LinkChild parentName={user?.name} onLinked={onLinked} onLogout={signOut} />;
  } else {
    const shared = { meta, childName, onAvatar, onGym, onActivity, onBookTrial, flash };
    content = (
      <View style={st.screen}>
        {/* Pure crossfade on tab switch — no layout movement, nav stays fixed. */}
        <FadeIn key={tab} y={0} duration={240} style={{ flex: 1 }}>
          {tab === 'home' && <HomeTab {...shared} report={report} refreshing={refreshing} onRefresh={onRefresh} />}
          {tab === 'progress' && <ProgressTab {...shared} report={report} refreshing={refreshing} onRefresh={onRefresh} />}
          {tab === 'sessions' && <SessionsTab {...shared} />}
          {tab === 'chat' && <ChatTab {...shared} />}
          {tab === 'classes' && <ClassesTab {...shared} />}
        </FadeIn>
        <BottomNav tab={tab} setTab={switchTab} />
        {!!toast && <View style={st.toast}><T w="semi" s={14} c="#fff" style={{ textAlign: 'center' }}>{toast}</T></View>}
      </View>
    );
  }

  return (
    <SafeAreaView style={st.safe}>
      <StatusBar style="dark" />
      {content}
      <ProfileSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        parentName={user?.name}
        parentEmail={user?.email}
        childName={child?.name}
        childClass={child?.className}
        onLinkAnother={relink}
        onLogout={signOut}
        onDeleteAccount={confirmDelete}
        onComingSoon={() => flash('Coming soon')}
        onSwitchToStudent={onSwitchToStudent}
      />
      {/* AI Gym → the actual student BrainGym experience, reused directly (not a copy). */}
      <Modal visible={gymOpen} animationType="slide" onRequestClose={() => setGymOpen(false)} statusBarTranslucent>
        <BrainGymFlow onFinish={() => setGymOpen(false)} />
      </Modal>
      <ActivityRouter visible={activityOpen} onClose={() => setActivityOpen(false)} childName={childName} items={report?.recentActivity} />
      {/* "Book a FREE trial" → in-app booking form (replaces the old external-app redirect). */}
      <BookTrial
        visible={trialOpen}
        onClose={() => setTrialOpen(false)}
        childName={childName}
        childList={child ? [child] : []}
        parentName={user?.name}
        onSubmit={({ phone, day }) => flash(`Trial booked${day ? ` for ${day}` : ''} — we'll call ${phone}`)}
      />
    </SafeAreaView>
  );
}
