import { useCallback, useEffect } from 'react';
import { Platform } from 'react-native';

// The live lesson's board works both ways up. While a lesson is open the screen
// follows the phone (upright → portrait board, sideways → landscape board); every
// other screen stays portrait. Every failure is swallowed: on web (or a build without
// the module) the board simply lays out at whatever size it gets.
let SO = null;
try { SO = require('expo-screen-orientation'); } catch (e) { SO = null; }

const call = (fn) => {
  if (!SO || Platform.OS === 'web') return;
  try { const p = fn(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* no-op */ }
};

export function lockPortrait() {
  call(() => SO.lockAsync(SO.OrientationLock.PORTRAIT_UP));
}

// Returns rotate(isPortraitNow): turns the board the other way and holds it there —
// for phones with auto-rotate switched off, where tilting does nothing.
export default function useLessonOrientation() {
  useEffect(() => {
    call(() => SO.unlockAsync());
    return () => lockPortrait();
  }, []);
  return useCallback((isPortraitNow) => {
    call(() => SO.lockAsync(isPortraitNow ? SO.OrientationLock.LANDSCAPE : SO.OrientationLock.PORTRAIT_UP));
  }, []);
}
