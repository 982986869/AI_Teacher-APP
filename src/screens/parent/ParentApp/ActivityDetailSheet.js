// src/screens/parent/ParentApp/ActivityDetailSheet.js
// Premium read-only detail for the Home "Recent activity" card. Springs up from the
// bottom (same pattern as ProfileSheet) and lists the child's REAL recent learning
// events from getParentReport().recentActivity — quiz / doubt / mistake / lesson /
// arena. No per-event backend page exists, so this is the read-only detail page.
import React, { useEffect, useRef } from 'react';
import { View, Modal, Animated, Pressable, ScrollView, StyleSheet } from 'react-native';
import { CheckCircle2, MessageCircle, AlertTriangle, BookOpen, Swords, Sparkles } from 'lucide-react-native';
import { C, T } from './constants';

const CFG = {
  quiz: { Icon: CheckCircle2, tint: C.greenSoft, ink: C.green, label: 'Practice quiz' },
  doubt: { Icon: MessageCircle, tint: C.blueSoft, ink: C.blue, label: 'Asked the AI teacher' },
  mistake: { Icon: AlertTriangle, tint: C.peach, ink: C.peachInk, label: 'Added to Mistake Book' },
  lesson: { Icon: BookOpen, tint: '#EFEAFE', ink: '#6D28D9', label: 'Watched a lesson' },
  arena: { Icon: Swords, tint: '#FDE8E8', ink: C.red, label: 'Arena match' },
};

function timeAgo(at) {
  if (!at) return '';
  const s = Math.max(0, Math.floor((Date.now() - new Date(at).getTime()) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); return d === 1 ? 'yesterday' : `${d}d ago`;
}

export default function ActivityDetailSheet({ visible, onClose, childName, items }) {
  const list = Array.isArray(items) ? items : [];
  const ty = useRef(new Animated.Value(700)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    ty.setValue(700); fade.setValue(0);
    Animated.parallel([
      Animated.spring(ty, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 190, mass: 0.9 }),
      Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [visible, ty, fade]);

  const close = () => {
    Animated.parallel([
      Animated.timing(ty, { toValue: 700, duration: 220, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(({ finished }) => { if (finished) onClose(); });
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close} statusBarTranslucent>
      <View style={{ flex: 1 }}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)', opacity: fade }]}>
          <Pressable style={{ flex: 1 }} onPress={close} accessibilityLabel="Close" />
        </Animated.View>
        <Animated.View style={[s.sheet, { transform: [{ translateY: ty }] }]}>
          <View style={s.grabber} />
          <T w="xbold" s={19} c={C.ink}>Recent activity</T>
          <T w="med" s={13} c={C.muted} style={{ marginTop: 2, marginBottom: 8 }}>{childName}'s latest learning</T>
          <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
            {list.length === 0 ? (
              <View style={s.empty}>
                <Sparkles size={22} color={C.faint} />
                <T w="med" s={13.5} c={C.muted} style={{ flex: 1 }}>No activity yet — it'll appear here as {childName} learns.</T>
              </View>
            ) : list.map((a, i) => {
              const cfg = CFG[a.type] || { Icon: Sparkles, tint: C.headerBg, ink: C.muted, label: 'Activity' };
              const where = a.chapter || a.subject || '';
              return (
                <View key={i}>
                  {i > 0 && <View style={s.divider} />}
                  <View style={s.row}>
                    <View style={[s.icon, { backgroundColor: cfg.tint }]}><cfg.Icon size={20} color={cfg.ink} strokeWidth={2.3} /></View>
                    <View style={{ flex: 1 }}>
                      <T w="bold" s={14.5} c={C.ink}>{cfg.label}{a.type === 'quiz' && a.correct != null ? (a.correct ? ' · correct' : ' · needs review') : ''}</T>
                      {!!where && <T w="med" s={12.5} c={C.muted} style={{ marginTop: 1 }}>{where}</T>}
                    </View>
                    <T w="semi" s={12} c={C.faint}>{timeAgo(a.at)}</T>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 18, paddingTop: 10, paddingBottom: 30,
    shadowColor: '#141420', shadowOpacity: 0.12, shadowRadius: 24, shadowOffset: { width: 0, height: -6 }, elevation: 16,
  },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: '#E2E2E6', marginBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, backgroundColor: C.border, marginLeft: 52 },
  empty: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 18 },
});
