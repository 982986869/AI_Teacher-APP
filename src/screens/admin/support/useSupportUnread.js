// src/screens/admin/support/useSupportUnread.js
// The number on the Support tab. It fetches its own count rather than reading the queue
// screen's, because the badge has to be right when that screen is not mounted at all —
// which is most of the time. The duplicate /queue call is the price of the badge being
// live from any tab, and it is one small request.
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { getSupportQueue } from '../../../api/supportApi';
import { connectSupportSocket, subscribeStaffQueue } from '../../../realtime/supportSocket';

// Reading a ticket is the one thing that lowers this count, and it is the one thing the
// hook cannot hear about. POST /tickets/:id/read only stamps staffReadAt (svc.markRead)
// — no socket event is emitted for it by the service or the controller — so the socket,
// mount and AppState triggers below all stay silent while the number they show goes
// stale. The thread screen calls this the moment its read receipt lands, which is the
// only point at which the count is known to have changed.
//
// A module-level set rather than context: the hook lives in AdminNavigator, several
// stacks above the thread screen, and threading a callback down through the tab and
// stack navigators to reach it would be far more machinery for a one-way ping.
const readListeners = new Set();

export function notifySupportTicketRead() {
  readListeners.forEach((fn) => fn());
}

export function useSupportUnread(enabled, token) {
  const [count, setCount] = useState(0);

  const load = useCallback(async () => {
    if (!enabled) return;
    try {
      // Counted off the same rows the Open tab lists — the server derives unreadCount from
      // that very query, so the badge and the list can never disagree.
      const d = await getSupportQueue({ status: 'open' });
      setCount(d.unreadCount);
    } catch (_) {
      // A badge is not worth an error in anyone's face; the count simply stays put.
    }
  }, [enabled]);

  useEffect(() => { load(); }, [load]);

  // This hook usually runs before the queue screen has ever mounted, so it cannot assume
  // somebody else opened the socket. connectSupportSocket is idempotent — it hands back
  // the live instance if there is one — so both callers doing it is safe and neither can
  // be the one that forgot.
  useEffect(() => {
    if (!enabled || !token) return undefined;
    connectSupportSocket(token);
    return subscribeStaffQueue({
      onTicketNew: load, onTicketTouched: load, onStatus: load, onReconnect: load,
    });
  }, [enabled, token, load]);

  useEffect(() => {
    if (!enabled) return undefined;
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') load(); });
    return () => sub.remove();
  }, [enabled, load]);

  // Refetch rather than decrementing locally: the server derives unreadCount from the same
  // query the Open tab lists, and a ticket the agent read may have been touched again in
  // the meantime. Guessing -1 here is exactly how the badge and the list start disagreeing.
  useEffect(() => {
    if (!enabled) return undefined;
    readListeners.add(load);
    return () => { readListeners.delete(load); };
  }, [enabled, load]);

  return enabled ? count : 0;
}
