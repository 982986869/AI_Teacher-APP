// src/components/support/ResolvedScreen.js
// `chat-v3-resolved` — what the conversation becomes once the team closes the ticket.
//
// ⚠️ Measurements here are READ OFF THE MOCKUP, not a Figma properties panel (only a
// screenshot was supplied for this state). The proportions match the image and the
// tokens are the flow's own, but if you have the frame, check the tick size, the
// heading size and the two button heights against it.
//
// Reaching this screen is driven by data, not by anything the app decides: it renders
// when the ticket carries a `resolution`, set by an admin closing the ticket through
// server/src/routes/support.js. Nothing here can mark a ticket resolved on its own.
import React, { useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet, Linking, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircleCheck, Award, Mail } from 'lucide-react-native';

import { PressableScale, FadeIn } from '../../screens/parent/ParentApp/anim';
import { D, TX, fmtStamp } from './theme';
import { SUPPORT } from './supportConfig';

const RATING_MAX = 5;

export default function ResolvedScreen({
  agent,
  ticket,
  category,
  resolution,          // { summary, at, by }
  transcript = [],     // the user's own messages, for "Email this conversation"
  onNewConversation,
  onReopen,
  onRate,              // (1-5) → Promise; rejects if the score did not save
  savedRating,         // what the server already has, so a reopened thread is not blank
}) {
  const insets = useSafeAreaInsets();
  const [rating, setRating] = useState(savedRating || 0);
  const [saved, setSaved] = useState(!!savedRating);

  // Optimistic: the icons fill on tap, because waiting on a round trip to acknowledge a
  // tap feels broken. But a rating that failed to save must not keep claiming it did —
  // on rejection the previous value comes back rather than the tap standing.
  const rate = useCallback(async (n) => {
    const previous = rating;
    const wasSaved = saved;
    setRating(n);
    if (!onRate) return;
    try {
      await onRate(n);
      setSaved(true);
    } catch (_) {
      setRating(previous);
      setSaved(wasSaved);
      Alert.alert('Rating not saved', 'Check your connection and try again.');
    }
  }, [onRate, rating, saved]);

  const emailThread = useCallback(() => {
    const lines = [
      `Ticket: ${ticket}`,
      `Team: ${category ? category.team : 'Support team'}`,
      resolution && resolution.summary ? `Resolution: ${resolution.summary}` : null,
      '',
      transcript.length ? 'What I wrote:' : null,
      ...transcript,
    ].filter((l) => l !== null);
    const subject = `${ticket} · ${category ? category.label : 'Support'} — conversation`;
    const url = `mailto:${SUPPORT.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
    Linking.openURL(url).catch(() => Alert.alert('No mail app found', `Write to ${SUPPORT.email} and mention ${ticket}.`));
  }, [ticket, category, resolution, transcript]);

  const byline = [
    resolution && resolution.by ? `${resolution.by} resolved this.` : null,
    'Reopen anytime.',
  ].filter(Boolean).join(' ');

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
        <FadeIn y={12} duration={320}>
          <View style={s.tickWrap}>
            <CircleCheck size={40} color="#0C0936" strokeWidth={2.4} />
          </View>

          <TX w="bold" s={22} lh={28} c={D.success} style={s.center}>Resolved</TX>
          {/* `resolution.at` is the server's raw timestamp — printing it straight put
              "2026-08-11T06:31:12.345Z" under the tick. fmtStamp is the flow's own
              format, sharing its time half with every message bubble. */}
          <TX w="reg" s={13} lh={18} c={D.muted} style={[s.center, { marginTop: 2 }]}>
            {fmtStamp(resolution && resolution.at)}
          </TX>

          <View style={s.summary}>
            <TX w="bold" s={14} lh={20} c={D.ink} style={s.center}>
              {(resolution && resolution.summary) || 'Your ticket has been closed.'}
            </TX>
            <TX w="reg" s={11} lh={16} c={D.muted} style={[s.center, { marginTop: 8 }]}>{byline}</TX>
          </View>

          <TX w="bold" s={14} lh={20} c={D.ink} style={[s.center, { marginTop: 24 }]}>How was our support?</TX>
          <View
            style={s.ratingRow}
            accessibilityRole="adjustable"
            accessibilityLabel="Rate this support conversation"
            accessibilityValue={{ min: 0, max: RATING_MAX, now: rating }}
          >
            {Array.from({ length: RATING_MAX }, (_, i) => i + 1).map((n) => (
              <PressableScale
                key={n}
                style={s.ratingBtn}
                onPress={() => rate(n)}
                scaleTo={0.85}
                accessibilityRole="button"
                accessibilityLabel={`${n} out of ${RATING_MAX}`}
              >
                <Award size={26} color={n <= rating ? D.amber : D.muted} strokeWidth={n <= rating ? 2.4 : 1.8} />
              </PressableScale>
            ))}
          </View>
          {/* Only after the server has it. The old screen deliberately said nothing here
              because nothing was being logged; now something is, so it can say so. */}
          {saved ? (
            <TX w="reg" s={11} lh={16} c={D.muted} style={[s.center, { marginTop: 6 }]}>
              Thank you — your rating reached the team.
            </TX>
          ) : null}

          <View style={s.rule} />

          <PressableScale style={s.emailRow} onPress={emailThread} scaleTo={0.97} accessibilityRole="button" accessibilityLabel="Email this conversation">
            <Mail size={16} color={D.indigo} strokeWidth={2.2} />
            <TX w="semi" s={13} c={D.indigo}>Email this conversation</TX>
          </PressableScale>
        </FadeIn>
      </ScrollView>

      <View style={[s.actions, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <PressableScale style={s.primaryBtn} onPress={onNewConversation} scaleTo={0.97} accessibilityRole="button" accessibilityLabel="Start a new conversation">
          <TX w="bold" s={14.5} c="#FFFFFF">Start New Conversation</TX>
        </PressableScale>
        <PressableScale style={s.ghostBtn} onPress={onReopen} scaleTo={0.97} accessibilityRole="button" accessibilityLabel="Reopen this chat">
          <TX w="semi" s={14.5} c={D.ink}>Reopen This Chat</TX>
        </PressableScale>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: D.bg },
  body: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 24 },
  center: { textAlign: 'center' },

  tickWrap: {
    alignSelf: 'center', width: 64, height: 64, borderRadius: 32,
    backgroundColor: D.success, alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },

  summary: {
    marginTop: 22, padding: 16, borderRadius: 16,
    backgroundColor: D.card, borderWidth: 1, borderColor: D.border,
  },

  ratingRow: { flexDirection: 'row', justifyContent: 'center', gap: 2, marginTop: 12 },
  // 44×44 is the platform minimum for a touch target; a 26px icon with 4px of padding
  // around it was 34, and the taps that missed read as the rating being broken rather
  // than as a near miss. The icon size is unchanged — only the hit area grew.
  ratingBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },

  rule: { height: 1, backgroundColor: D.border, marginTop: 24, marginBottom: 20 },
  emailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },

  actions: { paddingHorizontal: 20, paddingTop: 12, gap: 12 },
  primaryBtn: {
    alignSelf: 'stretch', height: 50, borderRadius: 25,
    alignItems: 'center', justifyContent: 'center', backgroundColor: D.indigo,
  },
  ghostBtn: {
    alignSelf: 'stretch', height: 50, borderRadius: 25,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: D.border,
  },
});
