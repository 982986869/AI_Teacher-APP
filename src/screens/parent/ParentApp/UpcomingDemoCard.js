// src/screens/parent/ParentApp/UpcomingDemoCard.js
// ── The "Upcoming demo" card shown on the Parent dashboard ────────────────────
// Reusable across Home + Sessions. Live countdown, tutor-assignment state, a
// calendar-synced badge, and a Join button that only unlocks inside the class
// window. Reschedule / Cancel are surfaced inline. Pure presentation — all the
// state changes (persist, calendar update/delete) are handled by the parent via
// the onJoin / onReschedule / onCancel callbacks.
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Video, RefreshCw, X, CheckCircle2, Bell, Radio, UserRound, Clock3,
} from 'lucide-react-native';
import { C, F, T } from './constants';
import { PressableScale, Shimmer } from './anim';
import { countdown, joinWindow, fmtTime, fmtDateLong, fmtDateShort } from './demoConfig';

export default function UpcomingDemoCard({ booking, onJoin, onReschedule, onCancel }) {
  const [now, setNow] = useState(() => new Date());
  // Tick every 30s so the countdown + join window stay live without churn.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  if (!booking) return null;
  const { canJoin, isLive, ended } = joinWindow(booking, now);
  const short = fmtDateShort(booking.date);
  const synced = !!booking.calendarEventId;
  const hasTutor = !!(booking.tutor && booking.tutor.name);

  const statusText = ended ? 'Completed' : isLive ? 'Live now' : hasTutor ? 'Tutor assigned' : 'Scheduled';
  const statusStyle = isLive ? st.pillLive : ended ? st.pillDone : st.pillSched;

  return (
    <View style={st.card}>
      {/* Top: date + time + status */}
      <View style={st.top}>
        <View style={st.dateBadge}>
          <T w="bold" s={11} c="#fff">{short.dow.toUpperCase()}</T>
          <T w="xbold" s={22} c="#fff">{short.day}</T>
          <T w="semi" s={10.5} c="rgba(255,255,255,0.85)">{short.month}</T>
        </View>
        <View style={{ flex: 1 }}>
          <View style={st.rowAc}>
            <View style={[st.pill, statusStyle]}>
              {isLive && <View style={st.liveDot} />}
              <T w="bold" s={10.5} c={isLive ? '#fff' : ended ? C.muted : C.blue}>{statusText.toUpperCase()}</T>
            </View>
          </View>
          <T w="xbold" s={19} c={C.ink} style={{ marginTop: 7 }}>{fmtTime(booking.date)}</T>
          <T w="med" s={13} c={C.muted}>{fmtDateLong(booking.date)} · {booking.durationMin} min</T>
          {!ended && (
            <View style={[st.rowAc, { gap: 5, marginTop: 5 }]}>
              <Clock3 size={13} color={C.blue} />
              <T w="bold" s={12.5} c={C.blue}>{isLive ? 'Happening now' : `Starts ${countdown(booking, now)}`}</T>
            </View>
          )}
        </View>
      </View>

      {/* Tutor strip — assigning (shimmer) until a mentor is matched */}
      <View style={st.tutor}>
        <View style={st.tutorAv}>
          {hasTutor ? <UserRound size={20} color="#fff" /> : <Video size={18} color="#fff" strokeWidth={2.3} />}
        </View>
        <View style={{ flex: 1 }}>
          {hasTutor ? (
            <>
              <T w="bold" s={14} c={C.ink}>{booking.tutor.name}</T>
              <T w="med" s={12.5} c={C.muted}>Your Ailernova mentor{booking.tutor.rating ? ` · ${booking.tutor.rating}★` : ''}</T>
            </>
          ) : (
            <>
              <T w="bold" s={14} c={C.ink}>Assigning your mentor</T>
              <Shimmer w={140} h={9} r={5} mt={5} />
            </>
          )}
        </View>
        <View style={st.type}><T w="bold" s={11} c={C.muted}>1:1 LIVE</T></View>
      </View>

      {/* Badges: calendar sync + reminder */}
      <View style={st.badges}>
        <View style={[st.badge, synced ? st.badgeOn : st.badgeOff]}>
          <CheckCircle2 size={13} color={synced ? C.green : C.faint} />
          <T w="bold" s={11.5} c={synced ? C.green : C.faint}>{synced ? 'Calendar synced' : 'Not in calendar'}</T>
        </View>
        <View style={[st.badge, st.badgeNeutral]}>
          <Bell size={13} color={C.peachInk} />
          <T w="bold" s={11.5} c={C.peachInk}>Reminder 30 min</T>
        </View>
      </View>

      {/* Primary: Join (only inside the window) */}
      <PressableScale
        style={[st.join, !canJoin && st.joinOff]}
        disabled={!canJoin}
        onPress={() => onJoin && onJoin(booking)}
      >
        {isLive && <Radio size={17} color="#fff" />}
        <T w="bold" s={15} c={canJoin ? '#fff' : C.muted}>
          {ended ? 'Class ended' : canJoin ? 'Join class' : `Join opens 10 min before`}
        </T>
      </PressableScale>

      {/* Reschedule / Cancel */}
      {!ended && (
        <View style={st.actions}>
          <PressableScale style={st.ghost} onPress={() => onReschedule && onReschedule(booking)}>
            <RefreshCw size={15} color={C.ink} />
            <T w="bold" s={13.5} c={C.ink}>Reschedule</T>
          </PressableScale>
          <PressableScale style={st.ghost} onPress={() => onCancel && onCancel(booking)}>
            <X size={15} color={C.red} />
            <T w="bold" s={13.5} c={C.red}>Cancel</T>
          </PressableScale>
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 22, padding: 16, shadowColor: '#141420', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  top: { flexDirection: 'row', gap: 14 },
  rowAc: { flexDirection: 'row', alignItems: 'center' },
  dateBadge: { width: 60, borderRadius: 16, backgroundColor: C.blue, alignItems: 'center', paddingVertical: 10, gap: 1 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start' },
  pillSched: { backgroundColor: C.blueSoft },
  pillLive: { backgroundColor: '#D81818' },
  pillDone: { backgroundColor: '#F1F1F3' },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },

  tutor: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F7F8FB', borderRadius: 16, padding: 12, marginTop: 14, borderWidth: 1, borderColor: '#EDEEF2' },
  tutorAv: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center' },
  type: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 6, borderWidth: 1, borderColor: C.border },

  badges: { flexDirection: 'row', gap: 8, marginTop: 12 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 },
  badgeOn: { backgroundColor: C.greenSoft },
  badgeOff: { backgroundColor: '#F5F5F7' },
  badgeNeutral: { backgroundColor: C.peach },

  join: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.green, borderRadius: 14, paddingVertical: 15, marginTop: 14 },
  joinOff: { backgroundColor: '#F1F1F3' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  ghost: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: '#F5F5F7', borderRadius: 12, paddingVertical: 12 },
});
