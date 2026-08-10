// Live support thread. The socket is an accelerator, never the source of truth — mobile
// connections drop on every network switch and every trip to the background. ChatScreen
// refetches the whole thread on mount and on each reconnect, so a missed event costs
// nothing.
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../constants/config';

let socket = null;

export function connectSupportSocket(token) {
  // Guard on the socket existing at all, not on it being connected: a previous instance
  // mid-handshake or mid-reconnect is not `connected` yet but is alive and will connect
  // on its own — socket.io's own reconnection logic handles that. Falling through here
  // would build a second socket and orphan the first with no way to close it, which is
  // exactly the transient state mobile networking produces (switch networks, background
  // the app) rather than an edge case.
  if (socket) return socket;
  socket = io(API_BASE_URL, {
    auth: { token },
    path: '/socket.io',
    transports: ['websocket'],
    reconnection: true,
  });
  return socket;
}

// Returns an unsubscribe function. `onReconnect` is how the caller re-syncs over REST.
export function joinTicket(ticketId, { onMessage, onStatus, onReconnect }) {
  if (!socket) return () => {};
  // Capture the instance once. `connectSupportSocket()` can reassign the module-level
  // `socket` binding later (e.g. after a full disconnect/reconnect cycle); every closure
  // below must keep talking to the instance it actually attached its listeners to, or the
  // cleanup silently detaches nothing and `ticket:leave` goes to the wrong socket.
  const s = socket;
  const join = () => s.emit('ticket:join', ticketId);
  join();
  const handleConnect = () => { join(); if (onReconnect) onReconnect(); };
  s.on('connect', handleConnect);
  if (onMessage) s.on('message', onMessage);
  if (onStatus) s.on('status', onStatus);
  return () => {
    s.emit('ticket:leave', ticketId);
    s.off('connect', handleConnect);
    if (onMessage) s.off('message', onMessage);
    if (onStatus) s.off('status', onStatus);
  };
}

export function disconnectSupportSocket() {
  if (socket) { socket.close(); socket = null; }
}
