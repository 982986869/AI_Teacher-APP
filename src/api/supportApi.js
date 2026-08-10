// src/api/supportApi.js
// Support tickets — raising an issue from the in-app chat so it lands with the right
// team, exactly like any other ticketing system: the ticket is created server-side, a
// member of that team picks it up and calls the user back. WhatsApp and email stay as
// the alternative contact routes, not as the delivery mechanism.
//
// ⚠️ THE BACKEND FOR THIS IS NOT DEPLOYED YET. The service lives in a separate repo,
// so this file is the contract the app codes against. Until those routes exist every
// call here fails with `notDeployed`, and the chat says so plainly instead of showing
// a message as delivered. Nothing pretends to have been sent.
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
