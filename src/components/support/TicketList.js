// src/components/support/TicketList.js
// Step 0 of the support sheet — the tickets this person already has open.
//
// Before this screen existed the ref lived in per-session state, so closing the sheet
// lost the thread for good. That was survivable while the conversation was one-way. Now
// that support actually replies, this is the way back in.
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, ChevronRight } from 'lucide-react-native';

import { PressableScale } from '../../screens/parent/ParentApp/anim';
import { D, TX } from './theme';

const LABEL = {
  open: 'Team dekh rahi hai',
  assigned: 'Team dekh rahi hai',
  pending_confirmation: 'Aapke jawab ka intezaar',
  closed: 'Band',
};

export default function TicketList({ tickets, loading, onOpen, onNew, onClose }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.wrap, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}>
      <View style={s.head}>
        <TX w="bold" s={18} c={D.ink}>Aapke tickets</TX>
        <PressableScale onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close help">
          <TX w="semi" s={14} c={D.muted}>Band karein</TX>
        </PressableScale>
      </View>

      <ScrollView contentContainerStyle={s.list}>
        {loading && <TX s={13} c={D.muted}>Load ho raha hai…</TX>}

        {/* Closed tickets are listed too — a ticket the server auto-closed after three
            silent days must not be a dead end, and Reopen only exists if there is still a
            way in. They are dimmed and carry a "Band" pill so the list still reads at a
            glance as "what is live", and they never show an unread dot: there is nothing
            waiting on the user in a thread that is already finished. */}
        {!loading && tickets.map((t) => {
          const closed = t.status === 'closed';
          return (
            <PressableScale
              key={t.id}
              onPress={() => onOpen(t)}
              style={[s.row, closed && s.rowClosed]}
              accessibilityRole="button"
              accessibilityLabel={`Ticket #${t.ref}, ${t.topicLabel || t.team}, ${LABEL[t.status] || t.status}${t.unread && !closed ? ', unread' : ''}`}
            >
              <View style={s.rowLeft}>
                <View style={s.rowTop}>
                  {t.unread && !closed && <View style={s.dot} />}
                  <TX w="semi" s={14} c={closed ? D.muted : D.ink}>{t.topicLabel || t.team}</TX>
                  {closed && (
                    <View style={s.closedPill}>
                      <TX w="semi" s={10} lh={12} c={D.muted}>Band</TX>
                    </View>
                  )}
                </View>
                <TX s={12} c={D.muted}>#{t.ref} · {LABEL[t.status] || t.status}</TX>
              </View>
              <ChevronRight size={18} color={D.muted} />
            </PressableScale>
          );
        })}

        <PressableScale onPress={onNew} style={s.newBtn} accessibilityRole="button" accessibilityLabel="Naya issue raise karein">
          <Plus size={18} color={D.ink} />
          <TX w="semi" s={14} c={D.ink}>Naya issue</TX>
        </PressableScale>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: D.bg, paddingHorizontal: 20 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  list: { gap: 10, paddingBottom: 24 },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, borderRadius: 14, borderWidth: 1, borderColor: D.border, backgroundColor: D.card,
  },
  // Finished work, still reachable: dimmed rather than hidden, and never mistakable for
  // something that still needs the user.
  rowClosed: { opacity: 0.62, backgroundColor: 'transparent' },
  closedPill: {
    paddingVertical: 2, paddingHorizontal: 7, borderRadius: 8,
    backgroundColor: D.ticketBg, borderWidth: 1, borderColor: D.border,
  },
  rowLeft: { flex: 1, gap: 4 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: D.indigo },
  newBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: D.border, marginTop: 6,
  },
});
