'use strict'

// socket.io on the same HTTP server as the API — no second service, nothing new to
// deploy. Sockets make the thread feel live; they are NOT the source of truth. Every
// client refetches over REST on open and on reconnect, so a dropped socket costs
// latency and never a message.
//
// Rooms:
//   ticket:<id>   the ticket's owner plus any support.view holder who opened it
//   staff:queue   support.view holders only — new tickets and status changes for
//                 the console list. Not "any admin_role" — a content_manager IS an
//                 admin role but was deliberately not granted support.view (Task 4),
//                 and must never see ticket payloads over the socket either.

const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')
const db = require('../config/database')
const { config } = require('../config/env')
const { hasPermission } = require('../services/admin/permissions')

let io = null

// Same verification the HTTP middleware does, minus the Express plumbing. An invalid
// token never establishes a connection, so no room join can be attempted without one.
async function identify(token) {
  if (!token) return null
  let decoded
  try {
    decoded = jwt.verify(token, config.auth.jwtSecret)
  } catch (_) {
    return null
  }
  const rows = await db.$queryRawUnsafe(
    `SELECT id, name, admin_role FROM "users" WHERE id = $1::uuid LIMIT 1`, decoded.sub,
  )
  const user = rows && rows[0]
  if (!user) return null
  // `staff` here means "may see support tickets" — support.view, not merely "carries
  // some admin_role". A content_manager IS an admin role but was deliberately NOT
  // granted support.view (Task 4), so isAdminRole alone would let their socket join
  // staff:queue and receive every ticket:new payload despite the console hiding the
  // nav item from them. hasPermission is the same gate the HTTP admin routes use.
  return { id: user.id, name: user.name, staff: hasPermission(user.admin_role, 'support.view') }
}

function attachRealtime(httpServer) {
  io = new Server(httpServer, {
    path: '/socket.io',
    cors: { origin: config.cors.origins, credentials: true },
  })

  io.use(async (socket, next) => {
    const token = socket.handshake.auth && socket.handshake.auth.token
    const who = await identify(token)
    if (!who) return next(new Error('unauthorized'))
    socket.data.user = who
    next()
  })

  io.on('connection', (socket) => {
    const me = socket.data.user
    if (me.staff) socket.join('staff:queue')

    // Joining is authorised exactly like loadOwned: your own ticket, or any ticket if
    // you are staff. Without this check a ticket id — which is a UUID, but still — would
    // be enough to eavesdrop on another family's thread.
    socket.on('ticket:join', async (ticketId, ack) => {
      try {
        const rows = await db.$queryRawUnsafe(
          `SELECT "userId" FROM "support_tickets" WHERE id = $1::uuid LIMIT 1`, ticketId,
        )
        const t = rows && rows[0]
        if (!t || (t.userId !== me.id && !me.staff)) {
          if (typeof ack === 'function') ack({ ok: false })
          return
        }
        socket.join(`ticket:${ticketId}`)
        if (typeof ack === 'function') ack({ ok: true })
      } catch (_) {
        if (typeof ack === 'function') ack({ ok: false })
      }
    })

    socket.on('ticket:leave', (ticketId) => socket.leave(`ticket:${ticketId}`))

    // Relay only into a room this socket actually joined — ticket:join already proved
    // ownership/staff status for that room, so re-checking membership here (instead of
    // hitting the DB again on every keystroke) is enough to stop a spoofed indicator on
    // a thread this socket has nothing to do with.
    socket.on('typing', ({ ticketId }) => {
      if (!socket.rooms.has(`ticket:${ticketId}`)) return
      socket.to(`ticket:${ticketId}`).emit('typing', { from: me.staff ? 'agent' : 'user' })
    })
  })
}

// No-ops before attachRealtime runs (e.g. under `node --test`, which imports the
// controller without booting the server). Calling code never has to guard.
function emitToTicket(ticketId, event, payload) {
  if (io) io.to(`ticket:${ticketId}`).emit(event, payload)
}
function emitToStaffQueue(event, payload) {
  if (io) io.to('staff:queue').emit(event, payload)
}

module.exports = { attachRealtime, emitToTicket, emitToStaffQueue }
