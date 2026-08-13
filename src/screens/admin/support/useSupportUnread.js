// src/screens/admin/support/useSupportUnread.js
// The number on the Support tab. It fetches its own count rather than reading the queue
// screen's, because the badge has to be right when that screen is not mounted at all —
// which is most of the time. The duplicate /queue call is the price of the badge being
// live from any tab, and it is one small request.
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { getSupportQueue } from '../../../api/supportApi';
import { connectSupportSocket, subscribeStaffQueue } from '../../../realtime/supportSocket';

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

  return enabled ? count : 0;
}
