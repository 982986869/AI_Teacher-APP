// src/screens/admin/ComingSoonScreen.js
// A designed "coming next" landing (never a bare "Coming Soon"). Each module says what it
// will do, WHY it matters, and previews its planned capabilities as tasteful disabled
// cards — so the screen reads as intentional and in-progress, not unfinished.
import React from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  GraduationCap, ChartColumn, Settings as SettingsIcon, ShieldCheck, Sparkles, Lock,
  BookOpen, Bot, Megaphone, ScrollText, SlidersHorizontal, Smartphone, ToggleRight, KeyRound,
} from 'lucide-react-native';
import { AdminScreen, AdminHeader, AdminCard, IconChip, Section, S } from './ui/kit';
import { T } from '../parent/ParentApp/constants';
import { Float, FadeIn, Stagger } from '../parent/ParentApp/anim';

const KINDS = {
  learning: {
    title: 'Learning', tone: 'purple', icon: GraduationCap,
    blurb: 'Everything students learn — content, AI Teacher and Brain Gym — in one place.',
    why: 'Content quality is what students feel every single day. Managing it from inside the app means a fix ships the moment you spot it — no laptop, no separate tool.',
    previews: [
      { icon: BookOpen, name: 'Content library', desc: 'Boards → classes → subjects → chapters' },
      { icon: Bot, name: 'AI Teacher', desc: 'Monitor generation and review lessons' },
      { icon: Sparkles, name: 'Brain Gym', desc: 'Review and approve generated questions' },
    ],
  },
  operations: {
    title: 'Operations', tone: 'blue', icon: ChartColumn,
    blurb: 'Understand and run the platform — insights, broadcasts and the change log.',
    why: 'The numbers that tell you whether learning is working — and the tools to act on them — belong right next to each other.',
    previews: [
      { icon: ChartColumn, name: 'Reports', desc: 'Engagement and learning outcomes' },
      { icon: Megaphone, name: 'Announcements', desc: 'Broadcast to students and parents' },
      { icon: ScrollText, name: 'Audit logs', desc: 'Every admin change — who and when' },
    ],
  },
  settings: {
    title: 'Settings', tone: 'orange', icon: SettingsIcon,
    blurb: 'Configure the platform — academics, releases, maintenance and feature flags.',
    why: 'Release controls, maintenance windows and feature flags decide what every user sees. They deserve a calm, deliberate place to live.',
    previews: [
      { icon: SlidersHorizontal, name: 'General & academic', desc: 'Session, supported classes, defaults' },
      { icon: Smartphone, name: 'App release', desc: 'Versions and maintenance mode' },
      { icon: ToggleRight, name: 'Feature flags', desc: 'Toggle features per product area' },
    ],
  },
  team: {
    title: 'Team', tone: 'purple', icon: ShieldCheck,
    blurb: 'Manage the admins and staff who run the platform.',
    why: 'As the team grows, who can do what starts to matter. Roles and access will live here — clear and auditable.',
    previews: [
      { icon: ShieldCheck, name: 'Admins', desc: 'Accounts with portal access' },
      { icon: KeyRound, name: 'Roles', desc: 'Role-based permissions' },
      { icon: Lock, name: 'Access', desc: 'Invite and deactivate' },
    ],
  },
};

function PreviewCard({ icon: Icon, name, desc, tone }) {
  return (
    <View style={{ opacity: 0.72, marginBottom: 10 }} accessible accessibilityLabel={`${name}, coming soon. ${desc}`}>
      <AdminCard style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <IconChip icon={Icon} toneKey={tone} size={42} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <T w="xbold" s={14} c={S.ink} numberOfLines={1}>{name}</T>
          <T w="semi" s={12} c={S.muted} numberOfLines={1} style={{ marginTop: 1 }}>{desc}</T>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: S.hair, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
          <Lock size={11} color={S.faint} strokeWidth={2.5} />
          <T w="xbold" s={10} c={S.faint} style={{ letterSpacing: 0.4 }}>SOON</T>
        </View>
      </AdminCard>
    </View>
  );
}

export default function ComingSoonScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const kind = KINDS[route?.params?.kind] || KINDS.learning;
  const Icon = kind.icon;
  const canBack = navigation?.canGoBack?.();

  return (
    <AdminScreen>
      <AdminHeader title={kind.title} subtitle="Admin module" onBack={canBack ? () => navigation.goBack() : undefined} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: insets.bottom + 120 }} showsVerticalScrollIndicator={false}>
        <FadeIn>
          <AdminCard style={{ alignItems: 'center', paddingVertical: 26 }}>
            <Float><IconChip icon={Icon} toneKey={kind.tone} size={72} /></Float>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 }}>
              <Sparkles size={13} color={S.gold} strokeWidth={2.6} />
              <T w="xbold" s={10.5} c={S.gold} style={{ letterSpacing: 0.9, textTransform: 'uppercase' }}>Coming next</T>
            </View>
            <T w="black" s={23} c={S.ink} style={{ marginTop: 8, letterSpacing: -0.5 }} accessibilityRole="header">{kind.title}</T>
            <T w="semi" s={13.5} c={S.muted} style={{ textAlign: 'center', lineHeight: 20, marginTop: 8, maxWidth: 320 }}>{kind.blurb}</T>
          </AdminCard>
        </FadeIn>

        <Section label="Why it matters" card>
          <T w="semi" s={13.5} c={S.sub} style={{ lineHeight: 21 }}>{kind.why}</T>
        </Section>

        <Section label="What's coming">
          <Stagger base={40} step={70}>
            {kind.previews.map((p) => <PreviewCard key={p.name} icon={p.icon} name={p.name} desc={p.desc} tone={kind.tone} />)}
          </Stagger>
        </Section>

        <T w="med" s={12} c={S.faint} style={{ textAlign: 'center', marginTop: 20, lineHeight: 17 }}>
          These flows already exist in the backend — they're being built natively into the app, one module at a time.
        </T>
      </ScrollView>
    </AdminScreen>
  );
}
