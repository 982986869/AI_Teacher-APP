import { useEffect } from 'react';
import { Platform } from 'react-native';

// The live lesson is a landscape board. Turn the phone sideways while the lesson is
// mounted and put it back upright when it leaves. Every failure is swallowed: on web
// (or a build without the module) the board simply lays out at whatever size it gets.
let SO = null;
try { SO = require('expo-screen-orientation'); } catch (e) { SO = null; }

const lock = (o) => {
  if (!SO || Platform.OS === 'web') return;
  try { SO.lockAsync(o).catch(() => {}); } catch (e) { /* no-op */ }
};

export function lockPortrait() {
  if (SO) lock(SO.OrientationLock.PORTRAIT_UP);
}

export default function useLandscape(on = true) {
  useEffect(() => {
    if (!on || !SO) return undefined;
    lock(SO.OrientationLock.LANDSCAPE);
    return () => lock(SO.OrientationLock.PORTRAIT_UP);
  }, [on]);
}
