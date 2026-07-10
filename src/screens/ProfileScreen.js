import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, StatusBar, Platform, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getSoundEnabledAsync, setSoundEnabled } from '../utils/sound';

const BADGES = [
  { emoji: '🔥', name: '7-Day Streak',  earned: true },
  { emoji: '🏆', name: 'Top Scorer',    earned: true },
  { emoji: '⚡', name: 'Speed Learner', earned: true },
  { emoji: '🎯', name: 'Perfect Score', earned: false },
  { emoji: '📚', name: '50 Topics',     earned: false },
  { emoji: '🌟', name: 'All-Rounder',   earned: false },
];

const MENU_ITEMS = [
  { section: 'Learning', items: [
    { icon: '📚', label: 'My Subjects',       arrow: true },
    { icon: '🎯', label: 'Learning Goals',    arrow: true },
    { icon: '📊', label: 'Progress Reports',  arrow: true },
    { icon: '📅', label: 'Study Schedule',    arrow: true },
  ]},
  { section: 'Account', items: [
    { icon: '👤', label: 'Edit Profile',       arrow: true },
    { icon: '🔔', label: 'Notifications',      arrow: true, toggle: true },
    { icon: '🔊', label: 'Sound Effects',      toggle: true, sound: true },
    { icon: '🔒', label: 'Privacy & Security', arrow: true },
    { icon: '💬', label: 'Help & Support',     arrow: true },
  ]},
  { section: 'Other', items: [
    { icon: '⭐', label: 'Rate the App',       arrow: true },
    { icon: '📤', label: 'Share with Friends', arrow: true },
  ]},
];

const ProfileScreen = () => {
  const { user, signOut, scope, setActiveView } = useAuth();
  const firstName = user?.name?.split(' ')[0] || 'Student';
  const [notifs, setNotifs] = useState(true);
  // Global "Sound Effects" setting for BrainGym — loaded from & saved to local storage.
  const [soundOn, setSoundOn] = useState(true);
  useEffect(() => { getSoundEnabledAsync().then(setSoundOn); }, []);
  const toggleSound = () => { const next = !soundOn; setSoundOn(next); setSoundEnabled(next); };
  // Real profile line from the user's scope (no hardcoded grade).
  const profileLine = [
    scope?.className,
    scope?.stream ? scope.stream.toUpperCase() : null,
    scope?.board,
  ].filter(Boolean).join('  •  ') || 'Complete your profile';

  // Confirm, then clear token + user from AuthContext. AppNavigator swaps the
  // whole tree on `isAuthenticated`, so this returns to Login with no back-stack
  // into authenticated screens.
  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#fff' }} />}
      <View style={s.header}>
        <Text style={s.headerTitle}>Profile</Text>
        <TouchableOpacity style={s.editBtn}><Text style={s.editBtnTxt}>Edit ✏️</Text></TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={s.profileCard}>
          <View style={s.avatarWrap}>
            <View style={s.avatarCircle}><Text style={s.avatarTxt}>{firstName[0].toUpperCase()}</Text></View>
            <View style={s.avatarEdit}><Text style={{ fontSize: 10 }}>✏️</Text></View>
          </View>
          <Text style={s.profileName}>{user?.name || 'Student'}</Text>
          <Text style={s.profileRole}>{profileLine}</Text>
          <Text style={s.profileEmail}>{user?.email || user?.phone || 'student@ailernova.com'}</Text>
          <View style={s.statsRow}>
            {[{ n: '29', l: 'Tests' }, { n: '1250', l: 'XP Points' }, { n: '7', l: 'Day Streak' }, { n: '#3', l: 'Rank' }].map((st, i) => (
              <View key={i} style={[s.statBox, i < 3 && s.statBoxBorder]}>
                <Text style={s.statNum}>{st.n}</Text>
                <Text style={s.statLbl}>{st.l}</Text>
              </View>
            ))}
          </View>
        </View>
        <Text style={s.sectionTitle}>Badges Earned</Text>
        <View style={s.badgesCard}>
          <View style={s.badgesGrid}>
            {BADGES.map((b, i) => (
              <View key={i} style={[s.badge, !b.earned && s.badgeLocked]}>
                <Text style={[{ fontSize: 26 }, !b.earned && { opacity: 0.3 }]}>{b.emoji}</Text>
                <Text style={[s.badgeName, !b.earned && s.badgeNameLocked]}>{b.name}</Text>
                {!b.earned && <View style={s.lockIcon}><Text style={{ fontSize: 10 }}>🔒</Text></View>}
              </View>
            ))}
          </View>
        </View>
        <View style={s.xpCard}>
          <View style={s.xpHeader}>
            <View>
              <Text style={s.xpTitle}>Level Progress</Text>
              <Text style={s.xpSub}>1,250 XP  •  Next level: 1,500 XP</Text>
            </View>
            <View style={s.levelBadge}><Text style={s.levelTxt}>Lv. 7</Text></View>
          </View>
          <View style={s.xpBarBg}><View style={[s.xpBarFill, { width: '83%' }]} /></View>
          <Text style={s.xpPct}>83% to next level  •  250 XP needed</Text>
        </View>
        {MENU_ITEMS.map((section, si) => (
          <View key={si}>
            <Text style={s.sectionTitle}>{section.section}</Text>
            <View style={s.menuCard}>
              {section.items.map((item, ii) => (
                <TouchableOpacity key={ii}
                  style={[s.menuRow, ii < section.items.length - 1 && s.menuRowBorder]}
                  onPress={item.label === 'Log Out' ? signOut : undefined}>
                  <View style={[s.menuIcon, item.danger && s.menuIconDanger]}>
                    <Text style={{ fontSize: 17 }}>{item.icon}</Text>
                  </View>
                  <Text style={[s.menuLabel, item.danger && s.menuLabelDanger]}>{item.label}</Text>
                  {item.toggle ? (
                    item.sound ? (
                      <TouchableOpacity style={[s.toggle, soundOn && s.toggleOn]} onPress={toggleSound}>
                        <View style={[s.toggleThumb, soundOn && s.toggleThumbOn]} />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity style={[s.toggle, notifs && s.toggleOn]} onPress={() => setNotifs(n => !n)}>
                        <View style={[s.toggleThumb, notifs && s.toggleThumbOn]} />
                      </TouchableOpacity>
                    )
                  ) : item.arrow ? (
                    <Text style={s.menuArrow}>›</Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
        <TouchableOpacity style={s.parentBtn} onPress={() => setActiveView('parent')} activeOpacity={0.85}>
          <Text style={s.parentTxt}>👨‍👩‍👧  Switch to Parent view</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Text style={s.logoutTxt}>🚪  Log Out</Text>
        </TouchableOpacity>
        <Text style={s.versionTxt}>Ailernova v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: '#F7F7F7' },
  header:          { backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1.5, borderBottomColor: '#F0F0F0' },
  headerTitle:     { fontSize: 22, fontWeight: '900', color: '#1C1C1E', letterSpacing: -0.5 },
  editBtn:         { borderWidth: 1.5, borderColor: '#E8E8E8', borderRadius: 12, paddingVertical: 7, paddingHorizontal: 14 },
  editBtnTxt:      { fontSize: 13, fontWeight: '800', color: '#1C1C1E' },
  profileCard:     { margin: 16, backgroundColor: '#1C1C1E', borderRadius: 24, padding: 20, alignItems: 'center' },
  avatarWrap:      { position: 'relative', marginBottom: 14 },
  avatarCircle:    { width: 80, height: 80, borderRadius: 40, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.2)' },
  avatarTxt:       { fontSize: 32, fontWeight: '900', color: '#1C1C1E' },
  avatarEdit:      { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, backgroundColor: '#fff', borderRadius: 13, borderWidth: 2, borderColor: '#1C1C1E', alignItems: 'center', justifyContent: 'center' },
  profileName:     { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5, marginBottom: 4 },
  profileRole:     { fontSize: 13, color: '#888', fontWeight: '600', marginBottom: 4 },
  profileEmail:    { fontSize: 12, color: '#666', fontWeight: '600', marginBottom: 18 },
  statsRow:        { flexDirection: 'row', width: '100%', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' },
  statBox:         { flex: 1, alignItems: 'center', paddingVertical: 12 },
  statBoxBorder:   { borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.1)' },
  statNum:         { fontSize: 17, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  statLbl:         { fontSize: 9, color: '#888', fontWeight: '700', marginTop: 2 },
  sectionTitle:    { fontSize: 17, fontWeight: '900', color: '#1C1C1E', letterSpacing: -0.3, paddingHorizontal: 16, marginTop: 16, marginBottom: 12 },
  badgesCard:      { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1.5, borderColor: '#F0F0F0', padding: 16 },
  badgesGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badge:           { width: '30%', alignItems: 'center', backgroundColor: '#F7F7F7', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 8, borderWidth: 1.5, borderColor: '#F0F0F0', gap: 6, position: 'relative' },
  badgeLocked:     { opacity: 0.6 },
  badgeName:       { fontSize: 11, fontWeight: '800', color: '#1C1C1E', textAlign: 'center', lineHeight: 15 },
  badgeNameLocked: { color: '#C7C7CC' },
  lockIcon:        { position: 'absolute', top: 8, right: 8 },
  xpCard:          { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1.5, borderColor: '#F0F0F0', padding: 16 },
  xpHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  xpTitle:         { fontSize: 15, fontWeight: '900', color: '#1C1C1E', letterSpacing: -0.3 },
  xpSub:           { fontSize: 11, color: '#8E8E93', fontWeight: '600', marginTop: 3 },
  levelBadge:      { backgroundColor: '#1C1C1E', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 16 },
  levelTxt:        { fontSize: 14, fontWeight: '900', color: '#fff' },
  xpBarBg:         { height: 8, backgroundColor: '#F0F0F0', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  xpBarFill:       { height: 8, backgroundColor: '#1C1C1E', borderRadius: 4 },
  xpPct:           { fontSize: 11, color: '#8E8E93', fontWeight: '600' },
  menuCard:        { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1.5, borderColor: '#F0F0F0', overflow: 'hidden' },
  menuRow:         { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16 },
  menuRowBorder:   { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  menuIcon:        { width: 38, height: 38, backgroundColor: '#F7F7F7', borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#F0F0F0' },
  menuIconDanger:  { backgroundColor: '#FFF0F0', borderColor: '#FFE0E0' },
  menuLabel:       { flex: 1, fontSize: 14, fontWeight: '700', color: '#1C1C1E' },
  menuLabelDanger: { color: '#E53E3E' },
  menuArrow:       { fontSize: 20, color: '#C7C7CC' },
  toggle:          { width: 46, height: 26, borderRadius: 13, backgroundColor: '#E0E0E0', justifyContent: 'center', paddingHorizontal: 3 },
  toggleOn:        { backgroundColor: '#1C1C1E' },
  toggleThumb:     { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  toggleThumbOn:   { alignSelf: 'flex-end' },
  parentBtn:       { marginHorizontal: 16, marginTop: 22, backgroundColor: '#E7F7EC', borderWidth: 1.5, borderColor: '#B7E9C6', borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
  parentTxt:       { fontSize: 15, fontWeight: '900', color: '#15803D' },
  logoutBtn:       { marginHorizontal: 16, marginTop: 12, backgroundColor: '#FFF0F0', borderWidth: 1.5, borderColor: '#FFD4D4', borderRadius: 16, paddingVertical: 15, alignItems: 'center' },
  logoutTxt:       { fontSize: 15, fontWeight: '900', color: '#E53E3E' },
  versionTxt:      { textAlign: 'center', fontSize: 12, color: '#C7C7CC', fontWeight: '600', marginTop: 16 },
});

export default ProfileScreen;