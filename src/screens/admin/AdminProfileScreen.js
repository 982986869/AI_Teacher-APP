// src/screens/admin/AdminProfileScreen.js
// Admin Profile — AILERNOVA design system (dark violet), same layout as before. Admin
// identity + role, management shortcuts (student/parent records), support, and Logout
// (which lives HERE, not on Home).
import React, { useState, useCallback } from 'react';
import { View, ScrollView, Alert, Share, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
import { ChartColumn, Users, MessageCircle, Share2, LogOut, ChevronRight, ShieldCheck } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { getAdminMe } from '../../api/adminApi';
import { T } from '../parent/ParentApp/constants';
import { InkSurface } from '../../theme/studentUI';
import { COLORS, GRADIENTS } from '../../theme/designSystem';
import { FadeInOnce, PressableScale, Float } from '../parent/ParentApp/anim';

const APP_VERSION = Constants.expoConfig?.version || '1.0.0';

// Same local dark palette as AdminHomeScreen.js — kept local rather than shared so the
// light `studentUI` kit other un-migrated screens still use stays untouched.
const DK = {
  canvas: COLORS.background,
  card: 'rgba(255,255,255,0.05)',
  hair: 'rgba(255,255,255,0.10)',
  ink: COLORS.textPrimary,
  muted: COLORS.textSecondary,
  faint: 'rgba(241,240,245,0.45)',
  indigo: COLORS.primary,
  blue: '#60A5FA', blueSoft: 'rgba(96,165,250,0.16)',
  emerald: COLORS.success, emeraldSoft: 'rgba(16,185,129,0.16)',
  purple: COLORS.primaryLight, purpleSoft: 'rgba(168,85,247,0.16)',
  red: COLORS.error, redSoft: 'rgba(239,68,68,0.14)', redBorder: 'rgba(239,68,68,0.35)',
};

function Header({ title }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingHorizontal: 18, paddingBottom: 12, paddingTop: insets.top + 8 }}>
      <T w="black" s={22} c={DK.ink} style={{ letterSpacing: -0.5 }} numberOfLines={1}>{title}</T>
    </View>
  );
}

function SectionHeader({ title, accent }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, marginBottom: 12 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: accent }} />
      <T w="black" s={16} c={DK.ink} style={{ letterSpacing: -0.3 }}>{title}</T>
    </View>
  );
}

function Row({ icon: Icon, bg, tint, label, sub, onPress, last }) {
  return (
    <PressableScale onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 14, paddingHorizontal: 15, borderBottomWidth: last ? 0 : 1, borderBottomColor: DK.hair }} accessibilityLabel={label}>
      <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}><Icon size={18} color={tint} strokeWidth={2.4} /></View>
      <View style={{ flex: 1 }}><T w="bold" s={14} c={DK.ink}>{label}</T>{!!sub && <T w="semi" s={11} c={DK.muted} style={{ marginTop: 1 }}>{sub}</T>}</View>
      <ChevronRight size={18} color={DK.faint} strokeWidth={2.4} />
    </PressableScale>
  );
}

export default function AdminProfileScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const [admin, setAdmin] = useState(null);
  useFocusEffect(useCallback(() => { getAdminMe().then((d) => setAdmin(d?.admin || null)).catch(() => {}); }, []));

  const name = admin?.name || user?.name || 'Admin';
  const roleLabel = admin?.roleLabel || 'Administrator';
  const share = () => Share.share({ message: 'Ailernova — an AI teacher, practice and progress tracking in one app.' }).catch(() => {});
  const help = () => Linking.openURL('mailto:support@ailernova.com?subject=Admin%20support').catch(() => Alert.alert('Contact us', 'support@ailernova.com'));
  const logout = () => Alert.alert('Log out', 'Sign out of the admin app?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Log out', style: 'destructive', onPress: () => signOut() }]);

  return (
    <View style={{ flex: 1, backgroundColor: DK.canvas }}>
      <Header title="Profile" />
      <ScrollView style={{ flex: 1, paddingHorizontal: 18 }} contentContainerStyle={{ paddingBottom: 40, paddingTop: 6 }} showsVerticalScrollIndicator={false}>
        {/* Identity */}
        <FadeInOnce id="ap-id" delay={30} y={16}>
          <View style={{ borderRadius: 26, backgroundColor: COLORS.primary, marginTop: 8, shadowColor: COLORS.primary, shadowOpacity: 0.35, shadowRadius: 24, shadowOffset: { width: 0, height: 16 }, elevation: 11 }}>
            <View style={{ borderRadius: 26, overflow: 'hidden', padding: 22, alignItems: 'center' }}>
              <InkSurface a={GRADIENTS.primary[0]} b={GRADIENTS.primary[2]} glow={COLORS.primaryLight} radius={26} />
              <Float distance={7} duration={4200} style={{ position: 'absolute', top: -10, right: -6 }}><ShieldCheck size={104} color="rgba(255,255,255,0.08)" strokeWidth={1.4} /></Float>
              <View style={{ width: 78, height: 78, borderRadius: 39, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.25)' }}><T w="black" s={30} c={DK.indigo}>{name[0].toUpperCase()}</T></View>
              <T w="black" s={21} c="#fff" style={{ marginTop: 12, letterSpacing: -0.4 }}>{name}</T>
              <T w="semi" s={12.5} c="rgba(255,255,255,0.7)" style={{ marginTop: 3 }}>{admin?.email || user?.email || ''}</T>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }}><T w="xbold" s={11} c="#fff">{roleLabel}</T></View>
                <View style={{ backgroundColor: 'rgba(90,230,160,0.2)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }}><T w="xbold" s={11} c="#5AE6A0">Active</T></View>
              </View>
            </View>
          </View>
        </FadeInOnce>

        {/* Management */}
        <SectionHeader title="Management" accent={DK.indigo} />
        <FadeInOnce id="ap-manage" delay={30} y={14}>
          <View style={{ backgroundColor: DK.card, borderRadius: 20, borderWidth: 1, borderColor: DK.hair, overflow: 'hidden' }}>
            <Row icon={ChartColumn} bg={DK.blueSoft} tint={DK.blue} label="Student results" sub="Search any student's progress" onPress={() => navigation.navigate('Results')} />
            <Row icon={Users} bg={DK.emeraldSoft} tint={DK.emerald} label="Parents" sub="Linked guardians" onPress={() => navigation.navigate('ParentsList')} last />
          </View>
        </FadeInOnce>

        {/* Support */}
        <SectionHeader title="Support" accent={DK.emerald} />
        <FadeInOnce id="ap-support" delay={30} y={14}>
          <View style={{ backgroundColor: DK.card, borderRadius: 20, borderWidth: 1, borderColor: DK.hair, overflow: 'hidden' }}>
            <Row icon={Share2} bg={DK.blueSoft} tint={DK.blue} label="Share Ailernova" onPress={share} />
            <Row icon={MessageCircle} bg={DK.purpleSoft} tint={DK.purple} label="Help & support" onPress={help} last />
          </View>
        </FadeInOnce>

        {/* Logout */}
        <FadeInOnce id="ap-logout" delay={40} y={14}>
          <PressableScale style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, backgroundColor: DK.redSoft, borderWidth: 1.5, borderColor: DK.redBorder, borderRadius: 16, paddingVertical: 15, marginTop: 24 }} onPress={logout} accessibilityLabel="Log out">
            <LogOut size={17} color={DK.red} strokeWidth={2.5} /><T w="bold" s={14.5} c={DK.red}>Log out</T>
          </PressableScale>
        </FadeInOnce>
        <T w="semi" s={11.5} c={DK.faint} style={{ textAlign: 'center', marginTop: 18 }}>Ailernova Admin · v{APP_VERSION}</T>
      </ScrollView>
    </View>
  );
}
