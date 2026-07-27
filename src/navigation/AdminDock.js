// src/navigation/AdminDock.js
// Admin bottom navigation — the SAME docked bar as the Student FloatingDock (rounded top,
// upward shadow, a soft indigo pill gliding behind the active tab, native-driven spring),
// just with the Admin's 5 tabs. Keeps Admin feeling like another mode of the same app.
import React from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { House, CalendarDays, Target, BookOpen, ChartColumn, User } from 'lucide-react-native';
import { S } from '../theme/studentTheme';
import { T } from '../screens/parent/ParentApp/constants';
import { PressableScale } from '../screens/parent/ParentApp/anim';

// The Admin dock mirrors the Student dock exactly — same component, motion and icons —
// so Admin reads as another mode of the same app.
const TABS = {
  Home:      { Icon: House,        label: 'Home' },
  Sessions:  { Icon: CalendarDays, label: 'Sessions' },
  Tests:     { Icon: Target,       label: 'Tests' },
  Resources: { Icon: BookOpen,     label: 'Resources' },
  Results:   { Icon: ChartColumn,  label: 'Results' },
  Profile:   { Icon: User,         label: 'Profile' },
};
const ACCENT = S.indigo;

// Deep create/edit/preview routes hide the dock — otherwise the docked bar overlaps sticky
// form action bars (the "coloured pills with no visible text" bug) and full-screen previews.
// Lists/detail screens keep the dock (with proper bottom clearance in the screens themselves).
const HIDE_DOCK_ON = new Set([
  'TestForm', 'QuestionForm', 'TestPreview',
  'SessionForm',
  'ChapterForm',
  'ChapterContent',
  'ChapterNotesEditor',
  'ChapterQuestionsEditor',
  'ChapterMcqEditor',
  'PaperEditor',
]);
// Walk the (possibly nested) navigation state to the deepest focused route name.
function deepestRouteName(state) {
  let s = state;
  while (s && s.routes && s.routes.length) {
    const r = s.routes[s.index != null ? s.index : s.routes.length - 1];
    if (!r || !r.state) return r ? r.name : null;
    s = r.state;
  }
  return null;
}

const NavTab = React.memo(function NavTab({ label, Icon, isFocused, onPress }) {
  const v = React.useRef(new Animated.Value(isFocused ? 1 : 0)).current;
  React.useEffect(() => {
    Animated.spring(v, { toValue: isFocused ? 1 : 0, useNativeDriver: true, damping: 12, stiffness: 220, mass: 0.7 }).start();
  }, [isFocused, v]);
  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  return (
    <View style={styles.slot}>
      <PressableScale style={styles.item} onPress={onPress} scaleTo={0.9} accessibilityRole="button" accessibilityLabel={label} accessibilityState={isFocused ? { selected: true } : {}}>
        <Animated.View style={[styles.iconBox, { transform: [{ scale }] }]}>
          <Icon size={22} color={isFocused ? ACCENT : S.muted} strokeWidth={isFocused ? 2.7 : 2.1} />
        </Animated.View>
        <T w={isFocused ? 'xbold' : 'semi'} s={9.5} c={isFocused ? ACCENT : S.muted} numberOfLines={1} style={styles.label}>{label}</T>
      </PressableScale>
    </View>
  );
});

export default function AdminDock({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const padBottom = Math.max(insets.bottom, 8) + 6;
  // Compute before hooks; the early return happens AFTER all hooks so hook order stays stable.
  const hidden = HIDE_DOCK_ON.has(deepestRouteName(state));
  const count = state.routes.length;
  const [trackW, setTrackW] = React.useState(0);
  const tabWidth = trackW ? trackW / count : 0;

  const slide = React.useRef(new Animated.Value(state.index)).current;
  React.useEffect(() => {
    Animated.spring(slide, { toValue: state.index, useNativeDriver: true, damping: 16, stiffness: 170, mass: 0.9 }).start();
  }, [state.index, slide]);
  const translateX = slide.interpolate({
    inputRange: state.routes.map((_, i) => i),
    outputRange: state.routes.map((_, i) => i * tabWidth || 0),
  });

  if (hidden) return null;

  return (
    <View style={[styles.nav, { paddingBottom: padBottom }]}>
      <View style={styles.track} onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}>
        {tabWidth > 0 && (
          <Animated.View pointerEvents="none" style={[styles.pill, { width: tabWidth, backgroundColor: ACCENT, transform: [{ translateX }] }]} />
        )}
        {state.routes.map((route, index) => {
          const cfg = TABS[route.name] || { Icon: House, label: route.name };
          const isFocused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };
          return <NavTab key={route.key} label={cfg.label} Icon={cfg.Icon} isFocused={isFocused} onPress={onPress} />;
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    backgroundColor: '#FFFFFF', paddingTop: 10, paddingHorizontal: 8,
    borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderColor: 'rgba(20,20,40,0.06)',
    shadowColor: '#0B1020', shadowOpacity: 0.10, shadowRadius: 18, shadowOffset: { width: 0, height: -4 }, elevation: 18,
  },
  track: { flexDirection: 'row', alignItems: 'center', position: 'relative', minHeight: 50 },
  slot: { flex: 1 },
  pill: { position: 'absolute', top: 0, bottom: 0, left: 0, borderRadius: 16, opacity: 0.12 },
  item: { alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 5 },
  iconBox: { height: 24, alignItems: 'center', justifyContent: 'center' },
  label: { letterSpacing: 0, textAlign: 'center' },
});
