// src/navigation/SupportLauncher.js
// One way for any student screen to open the support chat.
//
// The sheet itself belongs to the Help bubble (components/support/HelpFab.js), which
// MainNavigator renders ONCE above the tabs and opens by bumping its `openSignal`. That
// signal is MainNavigator's own state, so a tab screen — the Profile screen's "Help &
// Support" row — cannot reach it. Rather than let a second SupportSheet exist in the
// tree (the thing MainNavigator's LockSheet wiring deliberately avoids), the bump is
// published here, the same way DockVisibility publishes the dock's measurements.
//
// The default is a no-op so a screen rendered outside the provider — a preview, a test —
// degrades to a dead row instead of throwing.
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const SupportLauncherContext = createContext({ openSupport: () => {} });

export function SupportLauncherProvider({ children }) {
  const [signal, setSignal] = useState(0);
  const openSupport = useCallback(() => setSignal((n) => n + 1), []);
  const value = useMemo(() => ({ openSupport, signal }), [openSupport, signal]);
  return <SupportLauncherContext.Provider value={value}>{children}</SupportLauncherContext.Provider>;
}

export function useSupportLauncher() {
  return useContext(SupportLauncherContext);
}

export default SupportLauncherContext;
