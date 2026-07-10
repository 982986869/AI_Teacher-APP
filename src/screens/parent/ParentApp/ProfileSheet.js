// src/screens/parent/ParentApp/ProfileSheet.js
// Premium account bottom sheet — springs up with a fading backdrop, using the app's
// existing tokens. Structure is now config-driven: the menu is a data array and each
// action is dispatched through one handler map, so future rows (edit profile,
// notification preferences, settings, …) are a one-line addition. Rows are rendered by
// the reusable <SheetRow>. Pure UI — actions come in via props. No visual change.
import React, { useEffect, useRef } from 'react';
import { View, Modal, Animated, Pressable, StyleSheet } from 'react-native';
import { Bell, Settings, UserPlus, LogOut, Trash2, GraduationCap, Pencil, ArrowLeftRight } from 'lucide-react-native';
import { C, T } from './constants';
import SheetRow from './SheetRow';

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

  const runClose = (after) => {
    Animated.parallel([
      Animated.timing(ty, { toValue: 700, duration: 210, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 0, duration: 170, useNativeDriver: true }),
    ]).start(({ finished }) => { if (finished) { onClose(); after && after(); } });
  };
  const close = () => runClose();

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

  const initial = (parentName || 'P').trim().charAt(0).toUpperCase();

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close} statusBarTranslucent>
      <View style={{ flex: 1 }}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)', opacity: fade }]}>
          <Pressable style={{ flex: 1 }} onPress={close} accessibilityLabel="Close" />
        </Animated.View>

        <Animated.View style={[s.sheet, { transform: [{ translateY: ty }] }]}>
          <View style={s.grabber} />
          <View style={s.head}>
            <View style={s.avatar}><T w="xbold" s={26} c="#fff">{initial}</T></View>
            <View style={{ flex: 1 }}>
              <T w="xbold" s={19} c={C.ink}>{parentName || 'Parent'}</T>
              <T w="med" s={13} c={C.muted}>{parentEmail || 'Parent account'}</T>
            </View>
          </View>

          {!!childName && (
            <View style={s.childCard}>
              <View style={s.childIcon}><GraduationCap size={20} color="#fff" strokeWidth={2.3} /></View>
              <View style={{ flex: 1 }}>
                <T w="bold" s={11} c={C.faint} style={{ letterSpacing: 0.6 }}>LINKED CHILD</T>
                <T w="bold" s={15.5} c={C.ink} style={{ marginTop: 2 }}>{childName}{childClass ? ` · ${childClass}` : ''}</T>
              </View>
            </View>
          )}

          <View style={{ marginTop: 6 }}>
            {menu.map((m) => (
              <SheetRow key={m.id} Icon={m.Icon} label={m.label} danger={m.danger} onPress={() => onSelect(m.id)} />
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 18, paddingTop: 10, paddingBottom: 34,
    shadowColor: '#141420', shadowOpacity: 0.12, shadowRadius: 24, shadowOffset: { width: 0, height: -6 }, elevation: 16,
  },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: '#E2E2E6', marginBottom: 14 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.orange, borderWidth: 2, borderColor: '#111', alignItems: 'center', justifyContent: 'center' },
  childCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.blueSoft, borderRadius: 16, padding: 14, marginTop: 16 },
  childIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center' },
});
