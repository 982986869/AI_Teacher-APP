// src/navigation/FloatingDock.js
// Student bottom navigation — DOCKED to the bottom edge (mirroring the Parent app's nav):
// a full-width surface with rounded top corners and an upward shadow, its background
// filling down through the safe-area so it covers the system-nav strip while the tabs stay
// clear of the phone's back/home/recents buttons. The selected tab is a white outlined
// icon on a heavier stroke with a bold white label; the other five are lighter greys.
// The active icon scales up on selection — that spring is the only motion left in the bar.
//
// On the DAY palette (src/theme/dayTheme.js), matching the design: a BLACK bar with a
// white selected tab and grey unselected ones, square corners, no top border.
//
// The bar staying dark while Home went light is the design's choice, not an oversight
// — it anchors the bottom of a white page. It also means this bar is the one part of
// the re-skin that still sits happily under the five tabs that have NOT been migrated
// (Sessions is still on the night palette; Practice / Profile still set a light-content
// status bar). Whatever those tabs become, they meet the same black bar Home does.
import React from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { House, Video, Target, BookOpen, ChartColumn, User } from 'lucide-react-native';

import { DAY as N } from '../theme/dayTheme';
import { T } from '../screens/parent/ParentApp/constants';
import { PressableScale } from '../screens/parent/ParentApp/anim';
import { useDockVisibility } from './DockVisibility';

// Per-route icon + label. One shared accent keeps the bar calm and professional.
const TABS = {
  Home:      { Icon: House,       label: 'Home' },
  // A video camera, not a calendar — the design draws sessions as the thing you join,
  // not the day it sits on.
  Sessions:  { Icon: Video,       label: 'Sessions' },
  Practice:  { Icon: Target,      label: 'Practice' },
  Resources: { Icon: BookOpen,    label: 'Resources' },
  Results:   { Icon: ChartColumn, label: 'Results' },
  Profile:   { Icon: User,        label: 'Profile' },
};
// White on black for the selected tab, grey for the rest — the design's render, where
// "Home" is white and the other five sit back.
const ACCENT = N.dockFg;
const IDLE   = N.dockIdle;

// ---- one tab cell -----------------------------------------------------------
const NavTab = React.memo(function NavTab({ route, label, Icon, isFocused, onPress }) {
  const v = React.useRef(new Animated.Value(isFocused ? 1 : 0)).current;
  React.useEffect(() => {
    Animated.spring(v, { toValue: isFocused ? 1 : 0, useNativeDriver: true, damping: 12, stiffness: 220, mass: 0.7 }).start();
  }, [isFocused, v]);
  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });

  return (
    <View style={styles.slot}>
      <PressableScale
        style={styles.item}
        onPress={onPress}
        scaleTo={0.9}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={isFocused ? { selected: true } : {}}
      >
        {/* The selected icon stays an OUTLINE and is highlighted instead: white, a
            heavier stroke, the scale spring and the xbold label carry the selection.
            Filling it turned every glyph into a solid white blob — Target in particular
            read as a plain white disc with no icon left in it — so the tab you were on
            was the one you could no longer identify. */}
        <Animated.View style={[styles.iconBox, { transform: [{ scale }] }]}>
          <Icon
            size={22}
            color={isFocused ? ACCENT : IDLE}
            fill="none"
            strokeWidth={isFocused ? 2.6 : 2.1}
          />
        </Animated.View>
        <T w={isFocused ? 'xbold' : 'semi'} s={11} c={isFocused ? ACCENT : IDLE} numberOfLines={1} style={styles.label}>
          {label}
        </T>
      </PressableScale>
    </View>
  );
});

// ---- the docked bar ---------------------------------------------------------
export default function FloatingDock({ state, descriptors, navigation }) {
  // Let a screen hide the dock for an immersive full-screen mode (e.g. an AI Teacher
  // lesson) by setting tabBarStyle:{display:'none'} on itself. Computed before hooks;
  // the actual early-return happens after all hooks run (rules of hooks).
  const focusedKey = state.routes[state.index] && state.routes[state.index].key;
  const dockHidden = !!(focusedKey && descriptors[focusedKey]
    && descriptors[focusedKey].options
    && descriptors[focusedKey].options.tabBarStyle
    && descriptors[focusedKey].options.tabBarStyle.display === 'none');

  const insets = useSafeAreaInsets();
  // Fill the white surface down through the safe-area, but keep the tap targets above
  // the system nav buttons.
  const padBottom = Math.max(insets.bottom, 8) + 6;

  // Tell the floating Help bubble where this bar ends, and when to get out of the way.
  const { report } = useDockVisibility();
  const [dockH, setDockH] = React.useState(0);
  React.useEffect(() => { report({ hidden: dockHidden, height: dockH }); }, [dockHidden, dockH, report]);

  if (dockHidden) return null; // immersive screen (AI Teacher lesson) — no bottom nav

  return (
    // Two layers on purpose. The outer one paints the bar colour BEHIND the inner one,
    // so the strip below the tabs — the safe area over the system nav — is the same
    // black rather than showing React Navigation's white container through it.
    <View style={styles.navOuter} onLayout={(e) => setDockH(e.nativeEvent.layout.height)}>
      <View style={[styles.nav, { paddingBottom: padBottom }]}>
        {/* No sliding pill behind the active tab: the design shows nothing there, just a
            white icon and label against the bar. Its whole apparatus went with it — the
            track width measurement, the per-tab width, and the spring that drove the
            translate. What survives is the per-icon scale spring inside NavTab, which
            never depended on any of it. */}
        <View style={styles.track}>
          {state.routes.map((route, index) => {
            const cfg = TABS[route.name] || { Icon: House, label: route.name };
            const { options } = descriptors[route.key];
            const label = options.title || cfg.label;
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
            };

            return (
              <NavTab key={route.key} route={route} label={label} Icon={cfg.Icon} isFocused={isFocused} onPress={onPress} />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Backdrop below the bar — the same white, so the safe-area strip under the tabs reads
  // as part of the bar rather than showing the navigator's own container through it.
  navOuter: { backgroundColor: N.dockBg },
  // Figma: 85px tall, #FFFFFF, a 1px #000000 border on the TOP SIDE ONLY, 22.28 left /
  // 20.83 right padding, 12px gap. The night version's 24px rounded top corners and its
  // upward shadow are both gone — the design draws a plain hairline instead, and a
  // shadow tuned to lift a dark bar off a dark page only smudges a white one.
  nav: {
    backgroundColor: N.dockBg,
    paddingTop: 10,
    paddingLeft: 22.28,
    paddingRight: 20.83,
    // Figma (Bottom Navigation Bar:shadow): X0 Y4, blur 6, spread -4, #000000.
    //
    // Two things do not survive the trip. React Native has no shadow SPREAD, and -4 is
    // most of what makes this shadow tight — dropping it and keeping #000000 at full
    // strength would paint a heavy black halo instead of a hairline lift, so the opacity
    // carries the difference at 0.12.
    //
    // The offset also points DOWN (+4), away from the content, and this bar is pinned to
    // the bottom edge. On iOS almost none of it will be visible; on Android `elevation`
    // spreads all round, so there it reads as a faint lift under the whole bar. That is
    // the design's geometry, not a mistake in translating it.
    shadowColor: N.dockShadow,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  track: { flexDirection: 'row', alignItems: 'center', position: 'relative', minHeight: 50, gap: 12 },
  slot: { flex: 1 },
  item: { alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 5 },
  iconBox: { height: 24, alignItems: 'center', justifyContent: 'center' },
  label: { letterSpacing: 0, textAlign: 'center' },
});
