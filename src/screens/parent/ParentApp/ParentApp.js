// src/screens/parent/ParentApp/ParentApp.js
// Parent experience — routed by AppNavigator for role === 'parent'. Teammate's exact
// visuals (Poppins, Modal sheets, illustrations, 5 tabs) integrated into the app:
// loads Poppins, uses AuthContext, real getParentReport() + linkChild() gate, with
// skeleton/error/empty states. Sessions/tutor is a UI-only preview (no backend yet).
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, SafeAreaView, Alert, Modal, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold,
  Poppins_700Bold, Poppins_800ExtraBold, Poppins_900Black,
} from '@expo-google-fonts/poppins';
import {
  Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold,
  Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black,
} from '@expo-google-fonts/nunito';
import { useAuth } from '../../../context/AuthContext';
import { getParentReport, getUpcomingTrialBooking, cancelTrialBooking } from '../../../api/parentApi';
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
import HelpFab from '../../../components/support/HelpFab';
import BrainGymFlow from '../../braingym/BrainGymFlow';
import ActivityRouter from './ActivityRouter';
import TrialBookingFlow from './TrialBookingFlow';
import { addDemoToCalendar, removeDemoFromCalendar } from './calendar';
import { FadeIn } from './anim';

export default function ParentApp() {
  const { user, signOut, scope, setActiveView } = useAuth();
  // When a STUDENT is viewing this dashboard (same login), let them flip back to the
  // student app. Real parent accounts have no student view, so this stays undefined.
  const onSwitchToStudent = scope?.role === 'student' ? () => setActiveView('student') : undefined;
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold,
    Poppins_700Bold, Poppins_800ExtraBold, Poppins_900Black,
    Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold,
    Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black,
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
  const [relinking, setRelinking] = useState(false); // "Link another child" without discarding the loaded report
  const [booking, setBooking] = useState(null); // the parent's upcoming free-demo booking, from the server

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
      const [d, b] = await Promise.all([getParentReport(), getUpcomingTrialBooking()]);
      if (!mounted.current) return;
      setReport(d); setBooking(b); setErr(false);
    } catch (_) {
      if (!mounted.current) return;
      if (isRefresh) flash("Couldn't refresh — check your connection"); else setErr(true);
    } finally {
      if (mounted.current) { setLoading(false); setRefreshing(false); }
    }
  }, [flash]);
  useEffect(() => { load(false); }, [load]);

  // ── Free trial/demo booking ──────────────────────────────────────────────────
  // The server owns the booking (trial_bookings); this state mirrors the one
  // upcoming row. Cancel goes to the server first, then the device calendar.
  const handleBooked = useCallback(async (b) => {
    if (!mounted.current) return;
    setBooking(b);
    // Best effort — web has no calendar, a denied permission is fine.
    const r = await addDemoToCalendar(b);
    if (r.ok && mounted.current) setBooking((prev) => (prev && prev.id === b.id ? { ...prev, calendarEventId: r.eventId } : prev));
  }, []);
  const handleJoinDemo = useCallback((b) => {
    if (b && b.meetingUrl) Linking.openURL(b.meetingUrl);
    else flash('Your join link will be shared before the class');
  }, [flash]);
  const handleCancelDemo = useCallback((b) => {
    Alert.alert(
      'Cancel demo class?',
      'This frees up your slot. You can book another free demo anytime.',
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Cancel demo',
          style: 'destructive',
          onPress: async () => {
            const ok = await cancelTrialBooking(b.id);
            if (!mounted.current) return;
            if (!ok) { flash("Couldn't cancel — check your connection"); return; }
            if (b.calendarEventId) await removeDemoFromCalendar(b.calendarEventId);
            if (mounted.current) { setBooking(null); flash('Demo cancelled'); }
          },
        },
      ],
    );
  }, [flash]);

  const onRefresh = useCallback(() => { setRefreshing(true); load(true); }, [load]);
  const retry = useCallback(() => { setLoading(true); setErr(false); load(false); }, [load]);
  const switchTab = useCallback((id) => { setTab((prev) => (id === prev ? prev : id)); }, []);
  const onLinked = useCallback(() => { setRelinking(false); setLoading(true); load(false); }, [load]);
  // Header avatar opens the premium account bottom sheet (replaces the old Alert popup).
  const onAvatar = useCallback(() => setSheetOpen(true), []);
  const onGym = useCallback(() => setGymOpen(true), []);            // AI Gym → the real BrainGym
  const onActivity = useCallback(() => setActivityOpen(true), []);  // Recent activity detail
  const onBookTrial = useCallback(() => setTrialOpen(true), []); // "Book a FREE demo" → in-app flow
  const relink = useCallback(() => setRelinking(true), []); // keep report; show link screen without discarding data
  const confirmDelete = useCallback(() => {
    Alert.alert(
      'Delete account',
      'This permanently removes your parent account and unlinks your child. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => flash('Email support@ailernova.com and we’ll remove your account.') },
      ],
    );
  }, [flash]);

  const linked = !!(report && report.linked);
  const child = (report && report.child) || null;
  const childName = child?.name || user?.name || 'your child';
  const meta = TABS.find((t) => t.id === tab);

  let content;
  if (!fontsReady || loading) {
    content = <Skeleton />;
  } else if (err && !report) {
    content = <ErrorState onRetry={retry} />;
  } else if (!linked || relinking) {
    content = <LinkChild parentName={user?.name} onLinked={onLinked} onLogout={signOut} />;
  } else {
    const shared = {
      meta, childName, onAvatar, onGym, onActivity, onBookTrial, flash,
      parentPhoto: user?.photoUrl, parentName: user?.name,
      booking, onJoinDemo: handleJoinDemo, onCancelDemo: handleCancelDemo,
    };
    content = (
      <View style={st.screen}>
        {/* Gentle rise + fade on tab switch — content lifts into place, nav stays fixed. */}
        <FadeIn key={tab} y={12} duration={300} style={{ flex: 1 }}>
          {tab === 'home' && <HomeTab {...shared} report={report} refreshing={refreshing} onRefresh={onRefresh} />}
          {tab === 'progress' && <ProgressTab {...shared} refreshing={refreshing} onRefresh={onRefresh} />}
          {tab === 'sessions' && <SessionsTab {...shared} />}
          {tab === 'chat' && <ChatTab {...shared} />}
          {tab === 'classes' && <ClassesTab {...shared} />}
        </FadeIn>
        <BottomNav tab={tab} setTab={switchTab} />
        {/* Floating chat bubble → the topic-select screen. Parent name + child name feed
            the greeting ("Hi Meera 👋 Aarav ki learning ke baare mein…"). */}
        <HelpFab
          role="parent"
          userName={user?.name}
          userPhone={user?.phone}
          childName={child?.name}
          bottom={86}
        />
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
        parentPhoto={user?.photoUrl}
        parentEmail={user?.email}
        childName={child?.name}
        childClass={child?.className}
        onLinkAnother={relink}
        onLogout={signOut}
        onDeleteAccount={confirmDelete}
        onComingSoon={() => flash('Almost ready — we’re finishing this up.')}
        onSwitchToStudent={onSwitchToStudent}
      />
      {/* AI Gym → the actual student BrainGym experience, reused directly (not a copy). */}
      <Modal visible={gymOpen} animationType="slide" onRequestClose={() => setGymOpen(false)} statusBarTranslucent>
        <BrainGymFlow onFinish={() => setGymOpen(false)} />
      </Modal>
      <ActivityRouter visible={activityOpen} onClose={() => setActivityOpen(false)} childName={childName} items={report?.recentActivity} />
      {/* "Book a FREE trial" → slot, details, done. The server stores the row and
          emails the Meet link from kids@; `booking` mirrors it so the upcoming-demo
          card renders on Home and Sessions. */}
      <TrialBookingFlow
        visible={trialOpen}
        onClose={() => setTrialOpen(false)}
        onBooked={handleBooked}
        childName={child?.name}
      />
    </SafeAreaView>
  );
}
