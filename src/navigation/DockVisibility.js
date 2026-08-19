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
import React, { createContext, useContext, useMemo, useState } from 'react';

const DockVisibilityContext = createContext({ hidden: false, height: 0, report: () => {} });

export function DockVisibilityProvider({ children }) {
  const [state, setState] = useState({ hidden: false, height: 0 });
  const value = useMemo(() => ({
    ...state,
    report: (next) => setState((prev) => (
      (prev.hidden === next.hidden && prev.height === next.height) ? prev : { ...prev, ...next }
    )),
  }), [state]);
  return <DockVisibilityContext.Provider value={value}>{children}</DockVisibilityContext.Provider>;
}

export function useDockVisibility() {
  return useContext(DockVisibilityContext);
}

export default DockVisibilityContext;
