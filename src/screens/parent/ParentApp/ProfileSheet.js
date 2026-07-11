// src/screens/parent/ParentApp/ProfileSheet.js
// Premium account bottom sheet — springs up with a fading backdrop. iOS-style motion:
// the avatar pops in, the rows stagger, and the sheet is drag-to-dismiss with a
// rubber-band when pulled up. Config-driven menu (data array + one dispatcher), so new
// rows are a one-line addition. Pure UI — actions come in via props. Native-driven.
import React, { useEffect, useRef } from 'react';
import { View, Modal, Animated, Pressable, StyleSheet, PanResponder } from 'react-native';
import Svg, { Defs, LinearGradient as LG, Stop, Rect } from 'react-native-svg';
import { Bell, Settings, UserPlus, LogOut, Trash2, GraduationCap, Pencil, ArrowLeftRight } from 'lucide-react-native';
import { C, T, card } from './constants';
import SheetRow from './SheetRow';
import { FadeIn } from './anim';

const TRAVEL = 700; // off-screen distance for open/close/dismiss

// Menu config — order = display order. `id` maps to a handler in the dispatcher below.
const MENU = [
  { id: 'edit', Icon: Pencil, label: 'Edit profile' },
  { id: 'notifications', Icon: Bell, label: 'Notification preferences' },
  { id: 'settings', Icon: Settings, label: 'Settings' },
  { id: 'link', Icon: UserPlus, label: 'Link another child' },
  { id: 'logout', Icon: LogOut, label: 'Log out' },
  { id: 'delete', Icon: Trash2, label: 'Delete account', danger: true },
];

export default function ProfileSheet({
  visible, onClose, parentName, parentEmail, childName, childClass,
  onLinkAnother, onLogout, onDeleteAccount, onComingSoon, onSwitchToStudent,
}) {
  // A student viewing the parent dashboard (same login) can flip back to the student
  // app. In that mode we also drop "Link another child" (that action is parent-only on
  // the backend) and surface the switch row at the top.
  const menu = onSwitchToStudent
    ? [
        { id: 'switch', Icon: ArrowLeftRight, label: 'Switch to Student view' },
        ...MENU.filter((m) => m.id !== 'link'),
      ]
    : MENU;
  // Grouped into cards, iOS-style: account actions, then session actions.
  const primary = menu.filter((m) => m.id !== 'logout' && m.id !== 'delete');
  const account = menu.filter((m) => m.id === 'logout' || m.id === 'delete');

  const ty = useRef(new Animated.Value(TRAVEL)).current;  // open/close
  const fade = useRef(new Animated.Value(0)).current;     // backdrop
  const pan = useRef(new Animated.Value(0)).current;      // drag offset
  const pop = useRef(new Animated.Value(0)).current;      // avatar entrance
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const closing = useRef(false); // guard: backdrop-tap and drag-dismiss must not both fire onClose

  useEffect(() => {
    if (!visible) return;
    closing.current = false;
    ty.setValue(TRAVEL); fade.setValue(0); pan.setValue(0); pop.setValue(0);
    Animated.parallel([
      Animated.spring(ty, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 190, mass: 0.9 }),
      Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(pop, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 200 }),
    ]).start();
  }, [visible, ty, fade, pan, pop]);

  const runClose = (after) => {
    if (closing.current) return;
    closing.current = true;
    Animated.parallel([
      Animated.timing(ty, { toValue: TRAVEL, duration: 210, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 0, duration: 170, useNativeDriver: true }),
    ]).start(({ finished }) => { if (finished) { onClose(); after && after(); } });
  };
  const close = () => runClose();

  // Drag-to-dismiss: follow the finger down, rubber-band when pulled up, and either
  // spring back or dismiss on release depending on distance/velocity.
  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => g.dy > 8 && Math.abs(g.dy) > Math.abs(g.dx) * 1.5,
    onPanResponderMove: (_, g) => { pan.setValue(g.dy > 0 ? g.dy : g.dy * 0.16); },
    onPanResponderRelease: (_, g) => {
      if (g.dy > 130 || g.vy > 1.1) {
        if (closing.current) return;
        closing.current = true;
        Animated.parallel([
          Animated.timing(pan, { toValue: TRAVEL, duration: 220, useNativeDriver: true }),
          Animated.timing(fade, { toValue: 0, duration: 180, useNativeDriver: true }),
        ]).start(({ finished }) => { if (finished) { pan.setValue(0); onCloseRef.current && onCloseRef.current(); } });
      } else {
        Animated.spring(pan, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 240 }).start();
      }
    },
  })).current;

  // One dispatcher for every menu action — closes the sheet, then runs the handler.
  const HANDLERS = {
    switch: onSwitchToStudent,
    edit: onComingSoon,
    notifications: onComingSoon,
    settings: onComingSoon,
    link: onLinkAnother,
    logout: onLogout,
    delete: onDeleteAccount,
  };
  const onSelect = (id) => runClose(HANDLERS[id]);

  const initial = (Array.from((parentName || 'P').trim())[0] || 'P').toUpperCase();
  const avatarScale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close} statusBarTranslucent>
      <View style={{ flex: 1 }}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)', opacity: fade }]}>
          <Pressable style={{ flex: 1 }} onPress={close} accessibilityLabel="Close" />
        </Animated.View>

        <Animated.View
          style={[s.sheet, { transform: [{ translateY: Animated.add(ty, pan) }] }]}
          accessibilityViewIsModal
          {...panResponder.panHandlers}
        >
          <View style={s.grabber} />
          <FadeIn delay={40} y={8}>
            <View style={s.head}>
              <Animated.View style={[s.avatar, { transform: [{ scale: avatarScale }] }]}>
                <Svg style={StyleSheet.absoluteFill}>
                  <Defs>
                    <LG id="pavg" x1="0" y1="0" x2="1" y2="1">
                      <Stop offset="0" stopColor="#FF7A47" />
                      <Stop offset="1" stopColor="#EE4E1E" />
                    </LG>
                  </Defs>
                  <Rect x="0" y="0" width="100%" height="100%" fill="url(#pavg)" />
                </Svg>
                <T w="xbold" s={25} c="#fff">{initial}</T>
              </Animated.View>
              <View style={{ flex: 1 }}>
                <View style={s.nameRow}>
                  <T w="xbold" s={19} c={C.ink} numberOfLines={1} style={{ flexShrink: 1 }}>{parentName || 'Parent'}</T>
                  <View style={s.badge}><T w="xbold" s={9.5} c={C.blue} style={{ letterSpacing: 0.8 }}>PARENT</T></View>
                </View>
                <T w="med" s={13} c={C.muted} numberOfLines={1} ellipsizeMode="tail">{parentEmail || 'Parent account'}</T>
              </View>
            </View>
          </FadeIn>

          {!!childName && (
            <FadeIn delay={80} y={8}>
              <View style={s.childCard}>
                <View style={s.childIcon}><GraduationCap size={20} color="#fff" strokeWidth={2.3} /></View>
                <View style={{ flex: 1 }}>
                  <T w="bold" s={11} c={C.faint} style={{ letterSpacing: 0.6 }}>LINKED CHILD</T>
                  <T w="bold" s={15.5} c={C.ink} style={{ marginTop: 2 }} numberOfLines={1}>{childName}{childClass ? ` · ${childClass}` : ''}</T>
                </View>
              </View>
            </FadeIn>
          )}

          <View style={{ marginTop: 16, gap: 12 }}>
            <FadeIn delay={120} y={8}>
              <View style={s.group}>
                {primary.map((m, i) => (
                  <View key={m.id}>
                    {i > 0 && <View style={s.rowDivider} />}
                    <SheetRow Icon={m.Icon} label={m.label} danger={m.danger} onPress={() => onSelect(m.id)} />
                  </View>
                ))}
              </View>
            </FadeIn>
            <FadeIn delay={180} y={8}>
              <View style={s.group}>
                {account.map((m, i) => (
                  <View key={m.id}>
                    {i > 0 && <View style={s.rowDivider} />}
                    <SheetRow Icon={m.Icon} label={m.label} danger={m.danger} onPress={() => onSelect(m.id)} />
                  </View>
                ))}
              </View>
            </FadeIn>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: C.canvas, borderTopLeftRadius: 30, borderTopRightRadius: 30,
    paddingHorizontal: 18, paddingTop: 10, paddingBottom: 34,
    shadowColor: '#141420', shadowOpacity: 0.14, shadowRadius: 28, shadowOffset: { width: 0, height: -8 }, elevation: 18,
  },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: '#D7D9DE', marginBottom: 16 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingBottom: 18 },
  avatar: { width: 58, height: 58, borderRadius: 29, overflow: 'hidden', backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { backgroundColor: C.blueSoft, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  childCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.hair, ...card },
  childIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center' },
  group: { backgroundColor: '#fff', borderRadius: 18, paddingHorizontal: 14, borderWidth: 1, borderColor: C.hair, ...card },
  rowDivider: { height: 1, backgroundColor: C.hair, marginLeft: 52 },
});
