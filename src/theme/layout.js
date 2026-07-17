// src/theme/layout.js
// One shared bottom-clearance helper for Admin list screens, so scroll content always clears
// the floating dock (and, when present, the FAB). Use this instead of ad-hoc paddingBottom
// magic numbers — the last card must remain fully visible above both the dock and the FAB.
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Rough heights of the shared chrome (kept here so every screen agrees).
const DOCK_HEIGHT = 70;   // AdminDock bar (track + paddings), excluding safe-area
const FAB_CLEARANCE = 88; // FAB height + its bottom margin above the dock

export function useBottomPad({ fab = false } = {}) {
  const insets = useSafeAreaInsets();
  const base = Math.max(insets.bottom, 8) + DOCK_HEIGHT;
  return fab ? base + FAB_CLEARANCE : base;
}
