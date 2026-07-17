// src/screens/admin/AdminSoonScreen.js
// A calm, honest interim for the Admin tabs being built next (Tests, Resources). Uses the
// Student UI kit so it belongs in the app; no CMS terminology, no dead buttons.
import React from 'react';
import { View, ScrollView } from 'react-native';
import { Target, BookOpen, Check } from 'lucide-react-native';
import { T } from '../parent/ParentApp/constants';
import { S, shadow, InkSurface, StudentScreenHeader, StudentSectionHeader } from '../../theme/studentUI';
import { FadeInOnce, Float, Breathe } from '../parent/ParentApp/anim';

const KIND = {
  tests: {
    Icon: Target, a: '#1E3A8A', b: '#0E1E4A', glow: '#5B8CFF', title: 'Tests', header: 'Manage tests',
    hero: 'The tests students practise with — soon you\'ll create, edit and publish them here.',
    items: ['See every published & draft test', 'Add tests and questions', 'Publish so they appear in Practice'],
  },
  resources: {
    Icon: BookOpen, a: '#155E45', b: '#0A3A2A', glow: '#4ADE9A', title: 'Resources', header: 'Manage resources',
    hero: 'The notes, papers and solutions students open — soon you\'ll add and organise them here.',
    items: ['The same subjects students see', 'Add notes, papers, solutions', 'Publish so they appear in Resources'],
  },
};

export default function AdminSoonScreen({ route }) {
  const k = KIND[route?.params?.kind] || KIND.tests;
  const Icon = k.Icon;
  return (
    <View style={{ flex: 1, backgroundColor: S.canvas }}>
      <StudentScreenHeader title={k.header} subtitle="Coming in the next update" />
      <ScrollView style={{ flex: 1, paddingHorizontal: 18 }} contentContainerStyle={{ paddingBottom: 40, paddingTop: 8 }} showsVerticalScrollIndicator={false}>
        <FadeInOnce id={`soon-${k.title}`} delay={40} y={16}>
          <View style={{ borderRadius: 26, backgroundColor: k.b, marginTop: 8, shadowColor: k.b, shadowOpacity: 0.3, shadowRadius: 24, shadowOffset: { width: 0, height: 16 }, elevation: 11 }}>
            <View style={{ borderRadius: 26, overflow: 'hidden', padding: 22, alignItems: 'center' }}>
              <InkSurface a={k.a} b={k.b} glow={k.glow} radius={26} />
              <Float distance={8} duration={4200}><Breathe><View style={{ width: 66, height: 66, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}><Icon size={30} color="#fff" strokeWidth={2.2} /></View></Breathe></Float>
              <T w="black" s={22} c="#fff" style={{ marginTop: 16, letterSpacing: -0.3 }}>{k.title}</T>
              <T w="semi" s={13} c="rgba(255,255,255,0.72)" style={{ marginTop: 8, lineHeight: 20, textAlign: 'center' }}>{k.hero}</T>
            </View>
          </View>
        </FadeInOnce>

        <StudentSectionHeader title="What you'll do here" accent={k.glow} />
        <FadeInOnce id={`soon-items-${k.title}`} delay={60} y={14}>
          <View style={{ backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: S.hair, padding: 6, ...shadow }}>
            {k.items.map((it, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 10, borderBottomWidth: i < k.items.length - 1 ? 1 : 0, borderBottomColor: S.hair }}>
                <View style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: S.emeraldSoft, alignItems: 'center', justifyContent: 'center' }}><Check size={16} color={S.emerald} strokeWidth={2.8} /></View>
                <T w="semi" s={13.5} c={S.sub} style={{ flex: 1, lineHeight: 19 }}>{it}</T>
              </View>
            ))}
          </View>
        </FadeInOnce>
      </ScrollView>
    </View>
  );
}
