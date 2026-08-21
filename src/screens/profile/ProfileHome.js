// src/screens/profile/ProfileHome.js
// The Profile tab's landing, on the light design: identity block, three bands of rows,
// then Log Out and the version line.
//
// PRESENTATION ONLY — every action is a prop. The state, the API calls and the choice
// of which sub-screen is showing all live in src/screens/ProfileScreen.js, which renders
// this. That split is what lets Edit Profile and Learning Preferences open as full-screen
// swaps without this file knowing they exist.
//
// Three of the design's eight rows are not drawn: Achievements, AI Teacher Settings and
// Notifications. They were cut on request rather than shipped as dead rows — none has a
// screen behind it (achievements data exists in GET /api/parent/report but nothing draws
// it; AI Teacher settings live inside that flow; notifications have no backend at all).
// Privacy & Security is the one row still standing on a placeholder.
//
// Values marked "Figma" are lifted verbatim from the design's property panels.
import React from 'react';
import { View, StyleSheet, ScrollView, Pressable, StatusBar, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';

import { P, PAD, TRACK } from './theme';
import { T } from './ui';

// Figma: setting-item — fill, h52, padding 16, space-between, 1px #E5E7EB bottom border,
// on #FFFFFF. The row label has no panel of its own; 15/600 matches the drawing.
// Always a Pressable, disabled when there is nothing to press: a View would be handed a
// style FUNCTION here, which only Pressable understands — it would drop the row's
// styling entirely. The App Settings row is exactly that case (its switch is the
// pressable part, the row itself is not).
function Row({ emoji, label, onPress, right, last }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [s.row, last && { borderBottomWidth: 0 }, pressed && { opacity: 0.6 }]}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? label : undefined}
    >
      <T w="reg" s={18} style={s.rowEmoji}>{emoji}</T>
      <T w="semi" s={15} style={{ flex: 1 }}>{label}</T>
      {right !== undefined ? right : <ChevronRight size={18} color={P.inkFaint} strokeWidth={2.2} />}
    </Pressable>
  );
}

// Figma: profile-body — the bands, gap 16 between them; inside a band the eyebrow sits 8
// above its rows. With the design's full eight rows that arithmetic came to its panel's
// hug 520 (3 x 16 eyebrow + 3 x 8 + 8 x 52 rows + 2 x 16 gap); three rows are gone now,
// so the band is shorter — the spacing rules are what carried over, not the total.
function Band({ title, children }) {
  return (
    <View style={{ gap: 8 }}>
      <T w="semi" s={13} c={P.inkSoft} style={s.eyebrow}>{title}</T>
      <View>{children}</View>
    </View>
  );
}

// Figma: the toggle has no panel — the design draws a chevron here. It replaces the
// chevron in the App Settings row's right-hand slot (the row is space-between, so the
// layout is unchanged) because the sound switch is a real, working setting and dropping
// it to match the drawing exactly would delete a feature.
function Switch({ on, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.toggle, on && s.toggleOn, pressed && { opacity: 0.8 }]}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      accessibilityLabel="Sound effects"
    >
      <View style={[s.thumb, on && s.thumbOn]} />
    </Pressable>
  );
}

export default function ProfileHome({
  user,
  profileLine,
  version,
  soundOn,
  onToggleSound,
  onEditProfile,
  onLearningProgress,
  onLearningPreferences,
  onHelp,
  onSwitchToParent,
  onLogout,
  onPlaceholder,
  bottomInset = 0,
}) {
  const insets = useSafeAreaInsets();
  const initial = (user?.name || '?').trim().charAt(0).toUpperCase();

  return (
    <View style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={P.page} />
      <View style={{ paddingTop: insets.top }} />

      {/* Figma: scrollable-content — vertical, gap 20. */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.scroll, { paddingBottom: 24 + bottomInset }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Figma: profile-header-container — padding L/R 24, gap 16 (82 ring + 16 +
            45 meta + 16 + 32 pill = the panel's 191). */}
        <View style={s.header}>
          <View style={s.ring}>
            {user?.photoUrl
              ? <Image source={{ uri: user.photoUrl }} style={s.avatar} />
              : <T w="bold" s={26} c={P.inkSoft}>{initial}</T>}
          </View>

          {/* Figma: profile-meta — vertical, gap 4. */}
          <View style={s.meta}>
            <T w="bold" s={20}>{user?.name || 'Student'}</T>
            <T w="reg" s={14} c={P.inkSoft}>{profileLine}</T>
          </View>

          {/* Figma: edit-profile-pill — hug, h32, radius 20, 1px #E5E7EB, padding 8/16. */}
          <Pressable
            onPress={onEditProfile}
            style={({ pressed }) => [s.pill, pressed && { opacity: 0.6 }]}
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
          >
            <T w="semi" s={13}>Edit Profile</T>
          </Pressable>
        </View>

        <View style={s.body}>
          <Band title="My Learning">
            <Row emoji="📊" label="Learning Progress" onPress={onLearningProgress} last />
          </Band>

          <Band title="Settings">
            <Row emoji="📚" label="Learning Preferences" onPress={onLearningPreferences} last />
          </Band>

          <Band title="Account">
            {/* TODO: no privacy/data screen yet. */}
            <Row emoji="🔒" label="Privacy & Security" onPress={() => onPlaceholder('Privacy & Security')} />
            <Row emoji="⚙️" label="App Settings" right={<Switch on={soundOn} onPress={onToggleSound} />} />
            <Row emoji="❓" label="Help & Support" onPress={onHelp} />
            {/* NOT in the design. It is the only route a student has back to the parent
                view — without it the way out is to log out and back in. */}
            <Row emoji="👨‍👩‍👦" label="Switch to Parent view" onPress={onSwitchToParent} last />
          </Band>
        </View>

        {/* Figma: the 44px tail below profile-body — Log Out over the version line. */}
        <View style={s.tail}>
          <Pressable
            onPress={onLogout}
            style={({ pressed }) => [{ alignItems: 'center' }, pressed && { opacity: 0.6 }]}
            accessibilityRole="button"
            accessibilityLabel="Log out"
          >
            <T w="semi" s={16} c={P.danger}>Log Out</T>
          </Pressable>
          <T w="reg" s={12} c={P.inkFaint} style={{ textAlign: 'center' }}>Ailernova v{version}</T>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: P.page },
  scroll: { paddingTop: 12, gap: 20 },

  header: { paddingHorizontal: PAD, gap: 16, alignItems: 'center' },
  // Figma: avatar-ring 82x82 radius 41, 3px #FFC629; avatar 72x72 radius 36. The 3px
  // border plus a 1px breathing gap is what leaves the inner image at 72.
  ring: {
    width: 82, height: 82, borderRadius: 41,
    borderWidth: 3, borderColor: P.ring, backgroundColor: P.fieldBg,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  meta: { alignItems: 'center', gap: 4 },
  pill: {
    height: 32, borderRadius: 20, paddingHorizontal: 16,
    borderWidth: 1, borderColor: P.hair, backgroundColor: P.page,
    alignItems: 'center', justifyContent: 'center',
  },

  body: { paddingHorizontal: PAD, gap: 16 },
  eyebrow: { letterSpacing: TRACK, textTransform: 'uppercase' },

  row: {
    flexDirection: 'row', alignItems: 'center',
    height: 52, paddingHorizontal: 16, backgroundColor: P.page,
    borderBottomWidth: 1, borderBottomColor: P.hair,
  },
  // A fixed box so the labels line up whether the emoji renders wide or narrow.
  rowEmoji: { width: 28, lineHeight: 22 },

  toggle: { width: 44, height: 26, borderRadius: 13, backgroundColor: P.hair, justifyContent: 'center', paddingHorizontal: 3 },
  toggleOn: { backgroundColor: P.ring },
  thumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: P.page },
  thumbOn: { alignSelf: 'flex-end' },

  tail: { gap: 10, alignItems: 'center' },
});
