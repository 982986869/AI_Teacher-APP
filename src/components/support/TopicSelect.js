// src/components/support/TopicSelect.js
// The `chat-v3-topic-select` screen — step 1 of the support flow. Built to the Figma
// spec (every number below is from the properties panel):
//
//   chat-v3-topic-select  360 × 800, radius 24, bg #0C0936, justify space-between
//     main-content  (fill, hug 636)
//       status-bar     44          → replaced by the real safe-area inset, see below
//       welcome-hero   hug 272     pad 24/20/32/20, gap 16
//         avatar-container 72×72
//         agent-info    gap 2      name Inter 700/18, status Inter 400/13
//         callout-bubble hug 72    radius 16, border 1 #30363D, pad 16, bg #171440
//       topics-section hug 320     pad 0/20, gap 10
//         topic-N        58        radius 16, border 1 #30363D, pad 0/16, gap 12
//           number-badge 28×28 r14 · topic-labels gap 2 · chevron 16
//     bottom-container (fill, hug 78)
//       team-info      hug 45      pad 16, Inter 400/11 centred
//       home-indicator hug 33      → replaced by the real safe-area inset, see below
//
// Two deviations from the file, both deliberate:
//  1. The mockup's `status-bar` ("9:41", signal/wifi/battery) and `home-indicator` bar
//     are OS chrome. The real ones are drawn by the phone on top of this screen, so we
//     reserve their space with safe-area insets instead of painting fakes underneath.
//  2. The design has no close affordance. Android's back button alone would strand iOS
//     users, so there's a small back control over the hero.
import React from 'react';
import { View, ScrollView, Image, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, ArrowLeft } from 'lucide-react-native';

import { PressableScale, FadeIn } from '../../screens/parent/ParentApp/anim';
import { D, TX } from './theme';
import { SUPPORT, buildGreeting } from './supportConfig';

// A real photo when the agent record carries one; initials otherwise. We don't stand in
// a stock portrait for a support rep — see TODO(support-agent) in supportConfig.
function Avatar({ agent }) {
  const initial = (Array.from((agent.name || 'A').trim())[0] || 'A').toUpperCase();
  return (
    <View style={s.avatarWrap}>
      {agent.photo ? (
        <Image
          source={typeof agent.photo === 'string' ? { uri: agent.photo } : agent.photo}
          style={s.avatarImg}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View style={[s.avatarImg, s.avatarFallback]}>
          <TX w="bold" s={26} c={D.ink}>{initial}</TX>
        </View>
      )}
      {!!agent.online && <View style={s.onlineDot} />}
    </View>
  );
}

function TopicRow({ item, index, onPress }) {
  // The last entry ("Something else") is the plain full-width button: no badge, no chevron.
  if (item.plain) {
    return (
      <PressableScale
        style={s.plainRow}
        onPress={onPress}
        scaleTo={0.985}
        accessibilityRole="button"
        accessibilityLabel={`${item.label}. ${item.desc}`}
      >
        <TX w="semi" s={14} c={D.ink}>{item.label}</TX>
      </PressableScale>
    );
  }
  return (
    <PressableScale
      style={s.topicRow}
      onPress={onPress}
      scaleTo={0.985}
      accessibilityRole="button"
      accessibilityLabel={`${item.label}. ${item.desc}. Connects you to ${item.team}`}
    >
      <View style={[s.badge, { backgroundColor: item.tint }]}>
        <TX w="bold" s={14} c={item.badgeInk || '#FFFFFF'}>{index + 1}</TX>
      </View>
      <View style={s.topicLabels}>
        <TX w="semi" s={14} c={D.ink} numberOfLines={1}>{item.label}</TX>
        <TX w="reg" s={11} c={D.muted} numberOfLines={1}>{item.desc}</TX>
      </View>
      <View style={s.chevronBox}>
        <ChevronRight size={16} color={D.muted} strokeWidth={2} />
      </View>
    </PressableScale>
  );
}

export default function TopicSelect({ categories, agent, role, userName, childName, greeting, onPick, onClose }) {
  const insets = useSafeAreaInsets();
  const hello = greeting || buildGreeting({ role, userName, childName });
  const statusLine = `${agent.team}${agent.online ? ' · online' : ''}`;

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <FadeIn y={10} duration={280}>
          {/* ── welcome-hero ───────────────────────────────────────────── */}
          <View style={s.hero}>
            <PressableScale
              style={s.backBtn}
              onPress={onClose}
              scaleTo={0.9}
              accessibilityRole="button"
              accessibilityLabel="Close help"
            >
              <ArrowLeft size={18} color={D.muted} strokeWidth={2.2} />
            </PressableScale>

            <Avatar agent={agent} />
            <View style={s.agentInfo}>
              <TX w="bold" s={18} lh={22} c={D.ink} style={s.center}>{agent.name}</TX>
              <TX w="reg" s={13} lh={16} c={D.muted} style={s.center}>{statusLine}</TX>
            </View>
            <View style={s.callout}>
              <TX w="med" s={14} lh={20} c={D.ink}>{hello}</TX>
            </View>
          </View>

          {/* ── topics-section ─────────────────────────────────────────── */}
          <View style={s.topics}>
            {categories.map((item, i) => (
              <TopicRow key={item.id} item={item} index={i} onPress={() => onPick(item, i)} />
            ))}
          </View>
        </FadeIn>
      </ScrollView>

      {/* ── bottom-container ─────────────────────────────────────────── */}
      <View style={[s.bottom, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={s.teamInfo}>
          <TX w="reg" s={11} lh={13} c={D.muted} style={s.center}>
            {`Team ${agent.online ? 'online' : 'offline'} · ${SUPPORT.hours} · ${SUPPORT.avgReply}`}
          </TX>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: D.bg, justifyContent: 'space-between' },
  center: { textAlign: 'center' },

  // welcome-hero — 24/20/32/20, gap 16, contents centred
  hero: { paddingTop: 24, paddingHorizontal: 20, paddingBottom: 32, gap: 16, alignItems: 'center' },
  backBtn: {
    position: 'absolute', top: 16, left: 12,
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },

  // avatar-container 72×72
  avatarWrap: { width: 72, height: 72 },
  avatarImg: { width: 72, height: 72, borderRadius: 36 },
  avatarFallback: { backgroundColor: '#2B2560', alignItems: 'center', justifyContent: 'center' },
  onlineDot: {
    position: 'absolute', right: 2, bottom: 2,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: D.online, borderWidth: 2.5, borderColor: D.bg,
  },

  agentInfo: { alignSelf: 'stretch', gap: 2, alignItems: 'center' },
  callout: { alignSelf: 'stretch', backgroundColor: D.card, borderRadius: 16, borderWidth: 1, borderColor: D.border, padding: 16 },

  // topics-section — pad 0/20, gap 10
  topics: { paddingHorizontal: 20, gap: 10 },
  topicRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    height: 58, paddingHorizontal: 16,
    backgroundColor: D.card, borderRadius: 16, borderWidth: 1, borderColor: D.border,
  },
  badge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  topicLabels: { flex: 1, gap: 2 },
  chevronBox: { width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  plainRow: {
    height: 48, alignItems: 'center', justifyContent: 'center',
    backgroundColor: D.card, borderRadius: 16, borderWidth: 1, borderColor: D.border,
  },

  // bottom-container — team-info pad 16 (home-indicator space comes from the inset)
  bottom: { backgroundColor: D.bg },
  teamInfo: { padding: 16 },
});
