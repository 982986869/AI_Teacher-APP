// src/screens/aiteacher/AITeacherHome.js
// The AI Teacher home, rebuilt light from the Figma design:
//
//   header → greeting row → search hero → action cards
//
// PARTIAL BY DESIGN. The design frame is 1639px tall and the specs so far cover the top
// of it, so this file stops after the action cards. It is NOT yet wired in place of
// src/screens/AITeacherScreen.js, which still carries the whole working feature —
// lesson generation, the lesson library, Ask-the-Material, Study Insights, cross-lesson
// memory and the live classroom handoff. Swapping before those have somewhere to live
// would take them off the screen.
//
// Palette is src/theme/aiTeacherTheme.js. Everything here is Inter; the Student Home's
// Plus Jakarta Sans does not appear on this page.
import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, Image, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Settings, Search, Sparkles, BookOpen, ArrowUpRight } from 'lucide-react-native';
import {
  useFonts as useInterFonts,
  Inter_400Regular, Inter_500Medium, Inter_600SemiBold,
  Inter_700Bold, Inter_800ExtraBold,
} from '@expo-google-fonts/inter';

import { AIT, AFONT as F } from '../../theme/aiTeacherTheme';

// ── type helper ──────────────────────────────────────────────────────────────
const FAM = { xbold: F.xbold, bold: F.bold, semi: F.semi, med: F.med, reg: F.reg };
function T({ w = 'reg', s = 14, c = AIT.ink, style, children, ...rest }) {
  return <Text {...rest} style={[{ fontFamily: FAM[w] || F.reg, fontSize: s, color: c }, style]}>{children}</Text>;
}

// ── header ───────────────────────────────────────────────────────────────────
// The title is centred in the FRAME, not between its two neighbours: the back arrow is
// 16px and the settings button 36px, so centring it in the leftover space would push it
// off-centre by ten pixels. It is absolutely positioned instead, and the row keeps
// space-between for the two controls.
function Header({ onBack, onSettings }) {
  return (
    <View style={s.header}>
      <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back">
        <ArrowLeft size={16} color={AIT.ink} strokeWidth={2} />
      </Pressable>

      <View pointerEvents="none" style={s.headerTitleWrap}>
        <T w="bold" s={16} style={s.headerTitle}>AI TEACHER</T>
      </View>

      <Pressable
        onPress={onSettings}
        style={s.settingsBtn}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Settings"
      >
        <Settings size={16} color={AIT.ink} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

// ── greeting ─────────────────────────────────────────────────────────────────
// The presence dot is drawn with a 2px border in the page's near-black rather than a
// gap, which is how the design punches it out of the avatar ring behind it.
function Greeting({ name, photoUrl, subtitle }) {
  return (
    <View style={s.greetingRow}>
      <View style={s.avatarRing}>
        <View style={s.avatarInner}>
          {photoUrl
            ? <Image source={{ uri: photoUrl }} style={s.avatarImg} />
            : <T w="xbold" s={22} c={AIT.inkSoft}>{(name || '?').trim().charAt(0).toUpperCase()}</T>}
        </View>
        <View style={s.onlineBadge} />
      </View>

      <View style={s.greetingText}>
        <T w="xbold" s={24} numberOfLines={1}>Hey {name || 'there'}</T>
        <T w="reg" s={14} c={AIT.inkSoft} numberOfLines={2}>{subtitle}</T>
      </View>
    </View>
  );
}

// ── search ───────────────────────────────────────────────────────────────────
// A Pressable, not a TextInput. The design draws a resting field with placeholder copy;
// what happens when it is tapped — inline typing or a push to a search screen — is not
// specified yet, so this raises onPress and does not fake an input that cannot submit.
function SearchHero({ onPress }) {
  return (
    <View style={s.searchHero}>
      <View style={s.searchGlowWrap}>
        <Pressable
          onPress={onPress}
          style={s.searchBar}
          accessibilityRole="search"
          accessibilityLabel="Search for a topic"
        >
          <Search size={20} color={AIT.inkMuted} strokeWidth={2} />
          <T w="reg" s={14} c={AIT.inkMuted} numberOfLines={1} style={{ flex: 1 }}>
            e.g. Pythagoras Theorem
          </T>
          <View style={s.sparkleChip}>
            <Sparkles size={16} color={AIT.ink} strokeWidth={2} />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

// ── action cards ─────────────────────────────────────────────────────────────
function ActionCard({ tint, Icon, title, description, onPress, accessibilityLabel }) {
  return (
    <Pressable
      onPress={onPress}
      style={[s.card, { backgroundColor: tint }]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
    >
      <View style={s.cardIconHeader}>
        <View style={s.cardIconBg}>
          <Icon size={18} color={AIT.ink} strokeWidth={1.5} />
        </View>
        <ArrowUpRight size={14} color={AIT.ink} strokeWidth={2} />
      </View>
      <View style={s.cardText}>
        <T w="bold" s={16} numberOfLines={1}>{title}</T>
        <T w="reg" s={11} c={AIT.inkSoft} numberOfLines={2} style={{ lineHeight: 14 }}>{description}</T>
      </View>
    </Pressable>
  );
}

// ── screen ───────────────────────────────────────────────────────────────────
export default function AITeacherHome({
  userName,
  photoUrl,
  onBack = () => {},
  onSettings = () => {},
  onSearch = () => {},
  onLearnTopic = () => {},
  onSecondAction = () => {},
}) {
  useInterFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold,
  });
  const insets = useSafeAreaInsets();

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={AIT.bg} translucent={false} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 32 }}
      >
        <Header onBack={onBack} onSettings={onSettings} />

        <Greeting
          name={userName}
          photoUrl={photoUrl}
          subtitle="Ready to continue your learning?"
        />

        <SearchHero onPress={onSearch} />

        <View style={s.actionCardsRow}>
          <ActionCard
            tint={AIT.cardMint}
            Icon={BookOpen}
            title="Learn a Topic"
            description="Explore deep bite-sized lessons"
            onPress={onLearnTopic}
          />
          {/* TODO(design): the row is exactly two 169px cards wide and Figma gives the
              amber fill for the second, but no icon, title or description for it yet.
              The copy below is a PLACEHOLDER and must be replaced when that panel
              arrives — do not ship it as final wording. */}
          <ActionCard
            tint={AIT.cardAmber}
            Icon={Sparkles}
            title="Second action"
            description="Placeholder — awaiting design"
            onPress={onSecondAction}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: AIT.bg },

  // header — Fill, hug 68, space-between, 16/24 padding
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16, paddingHorizontal: 24,
  },
  headerTitleWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  // Figma reports 120% letter spacing — 19px at 16px type, which would run "AI TEACHER"
  // to roughly 300px against its stated 97px width. Same contradiction the Student Home's
  // eyebrows carry; the width wins and this keeps a display-sized 1.6.
  headerTitle: { letterSpacing: 1.6, textTransform: 'uppercase', textAlign: 'center' },
  settingsBtn: {
    width: 36, height: 36, borderRadius: 100, padding: 10,
    borderWidth: 1, borderColor: AIT.edge, backgroundColor: AIT.bg,
    alignItems: 'center', justifyContent: 'center',
  },

  // greeting — hug 80, 8/24 padding, 16 gap
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 8, paddingHorizontal: 24 },
  avatarRing: {
    width: 64, height: 64, borderRadius: 32, padding: 3,
    borderWidth: 2, borderColor: AIT.avatarRing,
  },
  avatarInner: {
    flex: 1, borderRadius: 100, overflow: 'hidden',
    backgroundColor: AIT.field, alignItems: 'center', justifyContent: 'center',
  },
  avatarImg: { width: '100%', height: '100%' },
  onlineBadge: {
    position: 'absolute', right: 0, bottom: 2,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: AIT.online, borderWidth: 2, borderColor: AIT.onlineEdge,
  },
  greetingText: { flex: 1, minWidth: 0, gap: 4 },

  // search — hero 12/24 padding, a 2px wrap around a 54px field
  searchHero: { paddingVertical: 12, paddingHorizontal: 24 },
  searchGlowWrap: { borderRadius: 16, padding: 2, backgroundColor: AIT.field },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    height: 54, borderRadius: 14, paddingHorizontal: 16,
    borderWidth: 1.5, borderColor: AIT.edge, backgroundColor: AIT.field,
  },
  sparkleChip: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: AIT.sparkleChip, alignItems: 'center', justifyContent: 'center',
  },

  // action cards — row 12/24 padding, 16 gap; each card 16 radius, 16 padding, 12 gap
  actionCardsRow: { flexDirection: 'row', gap: 16, paddingVertical: 12, paddingHorizontal: 24 },
  card: {
    flex: 1, minHeight: 129, borderRadius: 16, padding: 16, gap: 12,
    borderWidth: 1, borderColor: AIT.edge,
  },
  cardIconHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardIconBg: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: AIT.cardIconBg,
    alignItems: 'center', justifyContent: 'center',
  },
  cardText: { gap: 4 },
});
