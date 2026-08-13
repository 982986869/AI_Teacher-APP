// src/api/supportApi.js
// Support tickets — raising an issue from the in-app chat so it lands with the right
// team, exactly like any other ticketing system: the ticket is created server-side, a
// member of that team picks it up and calls the user back. WhatsApp and email stay as
// the alternative contact routes, not as the delivery mechanism.
//
// Contract (matches the app's usual `{ data: … }` envelope):
//
//   POST /api/support/tickets
//     body { topicId, topicLabel, team, role, message, phone?, childName? }
//     201  { data: { id, ref, status, assignedTo: { name, team, phone? } | null } }
//
//   POST /api/support/tickets/:id/messages
//     body { text }
//     201  { data: { id, at } }
//
//   POST /api/support/tickets/:id/attachments        (multipart, field `file`)
//     201  { data: { id, name, url } }
//
//   GET  /api/support/tickets/:id
//     200  { data: { ref, status, resolution: { summary, at, by } | null, messages: [] } }
//
//   GET  /api/support/queue?status=open&team=Sales%20team          (staff only)
//     200  { data: { tickets: [ { id, ref, team, status, createdAt, updatedAt,
//                                staffReadAt, childName,
//                                raisedBy: { name, phone } } ], unreadCount } }
//
//   POST /api/support/tickets/:id/call-log                          (staff only)
//     body { outcome: 'talked' | 'no_answer' | 'callback', note? }
//
//   PATCH /api/support/tickets/:id/resolve                          (staff only)
//     body { summary }
//
// `status` is the server's word, never the app's: 'open' | 'assigned' | 'resolved'.
import axiosInstance from './axiosInstance';

// A 404/405/501 means the route isn't there — a deployment gap, not a user problem.
// Callers use this to fall back to WhatsApp/email instead of showing "something went
// wrong", which would send people to a dead end.
function tag(err) {
  const status = err && err.response && err.response.status;
  if (status === 404 || status === 405 || status === 501) err.notDeployed = true;
  return err;
}

export const createTicket = async ({ topicId, topicLabel, team, role, message, phone, childName }) => {
  try {
    const res = await axiosInstance.post('/api/support/tickets', {
      topicId, topicLabel, team, role, message, phone, childName,
    });
    return res.data.data;
  } catch (err) {
    throw tag(err);
  }
};

export const addTicketMessage = async (ticketId, { text }) => {
  try {
    const res = await axiosInstance.post(`/api/support/tickets/${ticketId}/messages`, { text });
    return res.data.data;
  } catch (err) {
    throw tag(err);
  }
};

// `file` is a React Native file object: { uri, name, mimeType }. Same multipart shape
// the profile-photo and knowledge-document uploads already use.
export const uploadTicketAttachment = async (ticketId, file) => {
  const form = new FormData();
  form.append('file', {
    uri: file.uri,
    name: file.name || 'attachment',
    type: file.mimeType || 'application/octet-stream',
  });
  try {
    const res = await axiosInstance.post(`/api/support/tickets/${ticketId}/attachments`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return res.data.data;
  } catch (err) {
    throw tag(err);
  }
};

export const getTicket = async (ticketId) => {
  try {
    const res = await axiosInstance.get(`/api/support/tickets/${ticketId}`);
    return res.data.data;
  } catch (err) {
    throw tag(err);
  }
};

export const listMyTickets = async () => {
  try {
    const res = await axiosInstance.get('/api/support/tickets');
    return res.data.data.tickets || [];
  } catch (err) {
    throw tag(err);
  }
};

// "Issue Resolved" — the user's confirmation is what actually closes a ticket. Staff
// only ever propose a resolution.
export const closeTicket = async (ticketId) => {
  try {
    const res = await axiosInstance.post(`/api/support/tickets/${ticketId}/close`);
    return res.data.data;
  } catch (err) {
    throw tag(err);
  }
};

// "Abhi bhi problem hai" — works after auto-close too, so a user who was away for four
// days is never locked out of their own thread.
export const reopenTicket = async (ticketId) => {
  try {
    const res = await axiosInstance.post(`/api/support/tickets/${ticketId}/reopen`);
    return res.data.data;
  } catch (err) {
    throw tag(err);
  }
};

export const markTicketRead = async (ticketId) => {
  try {
    await axiosInstance.post(`/api/support/tickets/${ticketId}/read`);
  } catch (_) {
    // A read receipt is not worth an error in the user's face.
  }
};

// ─── Staff side ───────────────────────────────────────────────────────────────
// These sit on the same /api/support mount as everything above and take the same token;
// the server decides what a caller may see from their admin_role. A student token that
// reaches them gets a 403, never somebody else's ticket.

// `status: 'open'` is the SERVER's word for work-not-yet-resolved and matches both `open`
// and `assigned`. Tickets are born `assigned` as soon as their team has anybody on it, so
// filtering for the literal string would return an empty queue forever.
export const getSupportQueue = async ({ status = 'open', team } = {}) => {
  try {
    const res = await axiosInstance.get('/api/support/queue', {
      params: { status, ...(team ? { team } : {}) },
    });
    const d = res.data.data || {};
    return { tickets: d.tickets || [], unreadCount: d.unreadCount || 0 };
  } catch (err) {
    throw tag(err);
  }
};

// The note is for the team's record only — the server blanks it for a non-staff reader.
export const logCall = async (ticketId, { outcome, note }) => {
  try {
    const res = await axiosInstance.post(
      `/api/support/tickets/${ticketId}/call-log`, { outcome, note },
    );
    return res.data.data;
  } catch (err) {
    throw tag(err);
  }
};

// Staff only ever PROPOSE a resolution: this moves the ticket to pending_confirmation.
// The user's own confirmation — or a 3-day timeout — is what actually closes it.
export const resolveTicket = async (ticketId, { summary }) => {
  try {
    const res = await axiosInstance.patch(
      `/api/support/tickets/${ticketId}/resolve`, { summary },
    );
    return res.data.data;
  } catch (err) {
    throw tag(err);
  }
};
