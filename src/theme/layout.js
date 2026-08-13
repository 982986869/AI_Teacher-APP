// src/theme/layout.js
// One shared bottom-clearance helper for Admin list screens, so scroll content always clears
// the floating dock (and, when present, the FAB). Use this instead of ad-hoc paddingBottom
// magic numbers — the last card must remain fully visible above both the dock and the FAB.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Rough heights of the shared chrome (kept here so every screen agrees).
const DOCK_HEIGHT = 70;   // AdminDock bar (track + paddings), excluding safe-area
const FAB_CLEARANCE = 88; // FAB height + its bottom margin above the dock

export function useBottomPad({ fab = false } = {}) {
  const insets = useSafeAreaInsets();
  const base = Math.max(insets.bottom, 8) + DOCK_HEIGHT;
  return fab ? base + FAB_CLEARANCE : base;
}

// ── Keeping a composer above the keyboard ────────────────────────────────────
// `KeyboardAvoidingView` cannot be configured correctly here without knowing something
// the app cannot know at build time. app.json asks for softwareKeyboardLayoutMode
// "resize", which on its own puts the composer above the keyboard and makes any extra
// padding a double-count — which is exactly why every screen in this app passes
// `behavior={undefined}` on Android. But app.json ALSO sets edgeToEdgeEnabled, and from
// Android 15 edge-to-edge stops the window resizing at all, so that same `undefined`
// leaves the composer under the keyboard. One config, two opposite correct answers,
// decided by the OS version on the phone in someone's hand.
//
// So this measures instead of guessing. It asks for two numbers — how tall the keyboard
// is, and how much the container ACTUALLY shrank — and pads by the difference. A window
// that fully resized shrinks by the keyboard's height and gets no padding; one that did
// not resize shrinks by nothing and gets all of it; a partial resize gets the remainder.
// No platform check, and nothing to revisit when the next Android changes its mind.
//
// Usage: spread `onLayout` onto the container whose height is being contested, and add
// `inset` to that container's own paddingBottom.
export function useKeyboardInset() {
  const [kbHeight, setKbHeight] = useState(0);
  const [shrink, setShrink] = useState(0);
  const openHeightRef = useRef(0);   // container height while the keyboard was closed
  const kbOpenRef = useRef(false);

  useEffect(() => {
    // iOS fires `Will` early enough to ride the keyboard's own animation; Android only
    // reports a usable height on `Did`.
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const show = Keyboard.addListener(showEvt, (e) => {
      kbOpenRef.current = true;
      setKbHeight((e && e.endCoordinates && e.endCoordinates.height) || 0);
    });
    const hide = Keyboard.addListener(hideEvt, () => {
      kbOpenRef.current = false;
      setKbHeight(0);
      setShrink(0);
    });
    return () => { show.remove(); hide.remove(); };
  }, []);

  const onLayout = useCallback((e) => {
    const h = e.nativeEvent.layout.height;
    // A layout while the keyboard is down is the baseline — including rotation, split
    // screen, or anything else that changes the container for reasons of its own.
    if (!kbOpenRef.current) {
      openHeightRef.current = h;
      setShrink(0);
      return;
    }
    if (openHeightRef.current) setShrink(Math.max(0, openHeightRef.current - h));
  }, []);

  return { inset: Math.max(0, kbHeight - shrink), onLayout };
}
