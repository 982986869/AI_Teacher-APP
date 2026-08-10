// Live support thread. The socket is an accelerator, never the source of truth — mobile
// connections drop on every network switch and every trip to the background. ChatScreen
// refetches the whole thread on mount and on each reconnect, so a missed event costs
// nothing.
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../constants/config';

let socket = null;

export function connectSupportSocket(token) {
  if (socket && socket.connected) return socket;
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
  const join = () => socket.emit('ticket:join', ticketId);
  join();
  const handleConnect = () => { join(); if (onReconnect) onReconnect(); };
  socket.on('connect', handleConnect);
  if (onMessage) socket.on('message', onMessage);
  if (onStatus) socket.on('status', onStatus);
  return () => {
    socket.emit('ticket:leave', ticketId);
    socket.off('connect', handleConnect);
    if (onMessage) socket.off('message', onMessage);
    if (onStatus) socket.off('status', onStatus);
  };
}

export function disconnectSupportSocket() {
  if (socket) { socket.close(); socket = null; }
}
