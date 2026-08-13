// Live support thread. The socket is an accelerator, never the source of truth — mobile
// connections drop on every network switch and every trip to the background. ChatScreen
// refetches the whole thread on mount and on each reconnect, so a missed event costs
// nothing.
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../constants/config';

let socket = null;
// The token the live `socket` was HANDSHAKEN with. Identity is fixed at handshake and
// there is no re-auth message: server/src/realtime/index.js reads the token once in
// io.use, stamps socket.data.user = { id, name, staff }, and joins `staff:queue` at
// connection time only. So a socket built for one account stays that account's socket —
// with that account's rooms — for as long as the process lives, however many times a
// different person signs in on the phone. Remembering the token is what lets
// connectSupportSocket tell "the same session asking again" (reuse) from "a different
// session" (rebuild), and it is not optional in either direction:
//   • reusing a signed-out AGENT's socket for the student who signs in next leaves that
//     device in staff:queue, still receiving every ticket:new and every private call note
//     over the wire;
//   • reusing a STUDENT's socket for the agent who signs in next hands the console a
//     socket that is in no staff room, so subscribeStaffQueue attaches listeners that can
//     never fire and the whole live layer is silently dead until the app is restarted.
let socketToken = null;

export function connectSupportSocket(token) {
  // No token, no socket. The server refuses an unauthenticated handshake anyway, and
  // building one here would park a permanently-dead instance in `socket` that every
  // later caller would get handed back.
  if (!token) return null;
  // Guard on the socket existing at all, not on it being connected: a previous instance
  // mid-handshake or mid-reconnect is not `connected` yet but is alive and will connect
  // on its own — socket.io's own reconnection logic handles that. Falling through here
  // would build a second socket and orphan the first with no way to close it, which is
  // exactly the transient state mobile networking produces (switch networks, background
  // the app) rather than an edge case.
  //
  // A DIFFERENT token is the one case where that reasoning does not hold: the live
  // instance can never become this token's socket, so it is closed rather than reused.
  // Callers re-subscribe on the same token change that brings them here (every
  // connect/subscribe pair is keyed on the token), so the new instance gets the listeners.
  if (socket) {
    if (socketToken === token) return socket;
    socket.close();
    socket = null;
    socketToken = null;
  }
  socket = io(API_BASE_URL, {
    auth: { token },
    path: '/socket.io',
    transports: ['websocket'],
    reconnection: true,
  });
  socketToken = token;
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

// The staff queue. The server puts a socket into the `staff:queue` room by itself when
// the user holds support.view (server/src/realtime/index.js), so there is no room to join
// from here — only events to listen for.
//
// Every handler is expected to REFETCH over REST rather than patch local state. A phone
// that switched networks mid-event heard nothing and nothing is ever replayed, so patching
// would leave the queue quietly disagreeing with the server.
export function subscribeStaffQueue({ onTicketNew, onTicketTouched, onStatus, onReconnect }) {
  if (!socket) return () => {};
  // Same reason as joinTicket: capture the instance rather than reading the module binding
  // later, or cleanup detaches listeners from a socket that has since been replaced.
  const s = socket;
  const handleConnect = () => { if (onReconnect) onReconnect(); };
  s.on('connect', handleConnect);
  if (onTicketNew) s.on('ticket:new', onTicketNew);
  if (onTicketTouched) s.on('ticket:touched', onTicketTouched);
  if (onStatus) s.on('status', onStatus);
  return () => {
    s.off('connect', handleConnect);
    if (onTicketNew) s.off('ticket:new', onTicketNew);
    if (onTicketTouched) s.off('ticket:touched', onTicketTouched);
    if (onStatus) s.off('status', onStatus);
  };
}

// Called on sign-out and on a 401 (src/context/AuthContext.js). Closing the transport is
// the only way to leave `staff:queue` — the server joins that room at connection time and
// offers no way to leave it — so a session that has ended must not leave the socket up.
export function disconnectSupportSocket() {
  if (socket) { socket.close(); socket = null; }
  socketToken = null;
}
