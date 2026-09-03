// src/navigation/DockVisibility.js
// The student tab dock publishes its own measured height and whether it's currently
// hidden, so anything that floats above it — today, the Help bubble — can sit at the
// right offset and disappear during immersive screens (an AI Teacher lesson, an MCQ
// quiz) instead of hovering over them.
//
// A context rather than reading the dock's layout from outside: React Navigation renders
// the tab bar itself, and on Android a child that overflows the tab bar's bounds stops
// receiving touches — so the floating button has to live outside the dock and be told
// where the dock ends.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const DockVisibilityContext = createContext({
  hidden: false, height: 0, immersive: false, report: () => {}, pushImmersive: () => () => {},
});

export function DockVisibilityProvider({ children }) {
  const [state, setState] = useState({ hidden: false, height: 0 });
  // Immersive screens that open INSIDE a tab (the AI Teacher classroom, an MCQ quiz)
  // never touch the navigator's options, so the dock keeps rendering and `hidden` stays
  // false. They claim immersion here instead. A counter, not a boolean: two overlays can
  // be mounted at once (a quiz opened from a lesson), and the inner one unmounting must
  // not un-hide the bubble while the outer one is still up.
  const [claims, setClaims] = useState(0);

  const report = useCallback((next) => setState((prev) => (
    (prev.hidden === next.hidden && prev.height === next.height) ? prev : { ...prev, ...next }
  )), []);

  // Returns its own release function so a caller can only ever give back its own claim,
  // even if it releases twice (StrictMode double-invokes effect cleanups).
  const pushImmersive = useCallback(() => {
    setClaims((n) => n + 1);
    let released = false;
    return () => {
      if (released) return;
      released = true;
      setClaims((n) => Math.max(0, n - 1));
    };
  }, []);

  const value = useMemo(
    () => ({ ...state, immersive: claims > 0, report, pushImmersive }),
    [state, claims, report, pushImmersive],
  );
  return <DockVisibilityContext.Provider value={value}>{children}</DockVisibilityContext.Provider>;
}

export function useDockVisibility() {
  return useContext(DockVisibilityContext);
}

// Call from a full-screen experience that owns the bottom of the screen (its own action
// bar, composer, or timer) so the floating Help bubble gets out of the way for as long
// as it is mounted. Safe outside the provider — the default context no-ops.
export function useImmersiveScreen(active = true) {
  const { pushImmersive } = useContext(DockVisibilityContext);
  useEffect(() => {
    if (!active) return undefined;
    return pushImmersive();
  }, [active, pushImmersive]);
}

export default DockVisibilityContext;
