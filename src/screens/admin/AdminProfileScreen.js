// src/screens/admin/AdminProfileScreen.js
// Admin Profile — the Student Profile visual language. Admin identity + role, management
// shortcuts (student/parent records), support, and Logout (which lives HERE, not on Home).
import React, { useState, useCallback } from 'react';
import { View, ScrollView, Alert, Share, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
import { ChartColumn, Users, MessageCircle, Share2, LogOut, ChevronRight, ShieldCheck } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { getAdminMe } from '../../api/adminApi';
import { T } from '../parent/ParentApp/constants';
import { S, shadow, shadowSm, InkSurface, StudentScreenHeader } from '../../theme/studentUI';
import { FadeInOnce, PressableScale, Float } from '../parent/ParentApp/anim';

const APP_VERSION = Constants.expoConfig?.version || '1.0.0';

function Row({ icon: Icon, bg, tint, label, sub, onPress, last }) {
  return (
    <PressableScale onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 14, paddingHorizontal: 15, borderBottomWidth: last ? 0 : 1, borderBottomColor: S.hair }} accessibilityLabel={label}>
      <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}><Icon size={18} color={tint} strokeWidth={2.4} /></View>
      <View style={{ flex: 1 }}><T w="bold" s={14} c={S.ink}>{label}</T>{!!sub && <T w="semi" s={11} c={S.muted} style={{ marginTop: 1 }}>{sub}</T>}</View>
      <ChevronRight size={18} color={S.faint} strokeWidth={2.4} />
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
    <View style={{ flex: 1, backgroundColor: S.canvas }}>
      <StudentScreenHeader title="Profile" />
      <ScrollView style={{ flex: 1, paddingHorizontal: 18 }} contentContainerStyle={{ paddingBottom: 40, paddingTop: 6 }} showsVerticalScrollIndicator={false}>
        {/* Identity */}
        <FadeInOnce id="ap-id" delay={30} y={16}>
          <View style={{ borderRadius: 26, backgroundColor: '#241C55', marginTop: 8, shadowColor: '#241C55', shadowOpacity: 0.3, shadowRadius: 24, shadowOffset: { width: 0, height: 16 }, elevation: 11 }}>
            <View style={{ borderRadius: 26, overflow: 'hidden', padding: 22, alignItems: 'center' }}>
              <InkSurface a="#4A3AA6" b="#241C55" glow={S.heroGlow} radius={26} />
              <Float distance={7} duration={4200} style={{ position: 'absolute', top: -10, right: -6 }}><ShieldCheck size={104} color="rgba(255,255,255,0.08)" strokeWidth={1.4} /></Float>
              <View style={{ width: 78, height: 78, borderRadius: 39, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.25)' }}><T w="black" s={30} c={S.indigo}>{name[0].toUpperCase()}</T></View>
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, marginBottom: 12 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: S.indigo }} /><T w="black" s={16} c={S.ink} style={{ letterSpacing: -0.3 }}>Management</T>
        </View>
        <FadeInOnce id="ap-manage" delay={30} y={14}>
          <View style={{ backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: S.hair, overflow: 'hidden', ...shadow }}>
            <Row icon={ChartColumn} bg={S.blueSoft} tint={S.blue} label="Student results" sub="Search any student's progress" onPress={() => navigation.navigate('Results')} />
            <Row icon={Users} bg={S.emeraldSoft} tint={S.emerald} label="Parents" sub="Linked guardians" onPress={() => navigation.navigate('ParentsList')} last />
          </View>
        </FadeInOnce>

        {/* Support */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, marginBottom: 12 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: S.emerald }} /><T w="black" s={16} c={S.ink} style={{ letterSpacing: -0.3 }}>Support</T>
        </View>
        <FadeInOnce id="ap-support" delay={30} y={14}>
          <View style={{ backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: S.hair, overflow: 'hidden', ...shadow }}>
            <Row icon={Share2} bg={S.blueSoft} tint={S.blue} label="Share Ailernova" onPress={share} />
            <Row icon={MessageCircle} bg={S.purpleSoft} tint={S.purple} label="Help & support" onPress={help} last />
          </View>
        </FadeInOnce>

        {/* Logout */}
        <FadeInOnce id="ap-logout" delay={40} y={14}>
          <PressableScale style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, backgroundColor: S.redSoft, borderWidth: 1.5, borderColor: '#FAD1D1', borderRadius: 16, paddingVertical: 15, marginTop: 24 }} onPress={logout} accessibilityLabel="Log out">
            <LogOut size={17} color={S.red} strokeWidth={2.5} /><T w="bold" s={14.5} c={S.red}>Log out</T>
          </PressableScale>
        </FadeInOnce>
        <T w="semi" s={11.5} c={S.faint} style={{ textAlign: 'center', marginTop: 18 }}>Ailernova Admin · v{APP_VERSION}</T>
      </ScrollView>
    </View>
  );
}
