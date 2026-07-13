// src/screens/parent/ParentApp/calendar.js
// ── REAL device-calendar integration for the free demo class ──────────────────
// A small, reusable layer over expo-calendar. Every export is best-effort and
// returns a plain result object ({ ok, eventId?, reason }) — it never throws, so the
// UI can always react gracefully. Failure reasons:
//   • 'denied'      — calendar permission not granted (offer Settings)
//   • 'unavailable' — web / no writable calendar on the device
//   • 'error'       — an unexpected native error
//
// The event is a 45-min "Ailernova Demo Class" with a 30-min reminder and the
// student + parent + subject + link in the description. Reschedule updates the same
// event; cancel deletes it. No duplicate logic lives in the UI.
import { Platform } from 'react-native';
import * as Calendar from 'expo-calendar';

const CAL_TITLE = 'Ailernova';
const CAL_COLOR = '#1848F0';

// Ask once; if already granted, don't re-prompt. Returns true/false, never throws.
export async function ensureCalendarPermission() {
  if (Platform.OS === 'web') return false;
  try {
    const current = await Calendar.getCalendarPermissionsAsync();
    if (current.status === 'granted') return true;
    if (current.canAskAgain === false) return false;
    const asked = await Calendar.requestCalendarPermissionsAsync();
    return asked.status === 'granted';
  } catch (_) {
    return false;
  }
}

// Find a calendar we're allowed to write to, creating a dedicated "Ailernova" one if
// the device has none. Returns a calendar id, or null if impossible.
async function resolveWritableCalendarId() {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const writable = (calendars || []).filter((c) => c.allowsModifications);

  if (Platform.OS === 'ios') {
    try {
      const def = await Calendar.getDefaultCalendarAsync();
      if (def && def.allowsModifications) return def.id;
    } catch (_) { /* fall through */ }
  }
  if (writable.length) {
    const primary =
      writable.find((c) => c.isPrimary) ||
      writable.find((c) => c.accessLevel === Calendar.CalendarAccessLevel.OWNER) ||
      writable[0];
    return primary.id;
  }
  return createOwnCalendar(calendars);
}

// Create a local "Ailernova" calendar as a last resort (no writable calendar found).
async function createOwnCalendar(existing) {
  let source;
  if (Platform.OS === 'ios') {
    const def = await Calendar.getDefaultCalendarAsync().catch(() => null);
    source = def?.source || { isLocalAccount: true, name: CAL_TITLE };
  } else {
    const withSource = (existing || []).find((c) => c.source && c.source.name);
    source = withSource
      ? withSource.source
      : { isLocalAccount: true, name: CAL_TITLE, type: Calendar.SourceType.LOCAL };
  }
  return Calendar.createCalendarAsync({
    title: CAL_TITLE,
    color: CAL_COLOR,
    entityType: Calendar.EntityTypes.EVENT,
    sourceId: source.id,
    source,
    name: `${CAL_TITLE} Demo`,
    ownerAccount: 'personal',
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
  });
}

// Map a booking → the native event payload (single source of truth for add + update).
function toEvent(booking) {
  const start = new Date(booking.date);
  const durationMin = booking.durationMin || 45;
  const end = new Date(start.getTime() + durationMin * 60000);
  const st = booking.student || {};
  const pa = booking.parent || {};
  const notes = [
    `Student: ${st.name || '—'}`,
    st.className ? `Class: ${st.className}` : null,
    st.subject ? `Subject: ${st.subject}` : null,
    `Duration: ${durationMin} minutes`,
    pa.phone ? `Parent phone: ${pa.phone}` : null,
    pa.email ? `Parent email: ${pa.email}` : null,
    booking.meetingUrl ? `Join: ${booking.meetingUrl}` : 'Your join link will be shared before the class.',
    '',
    'Your free 1:1 live demo class with an Ailernova mentor. Please join 5 minutes early.',
  ].filter(Boolean).join('\n');

  return {
    title: 'Ailernova Demo Class',
    startDate: start,
    endDate: end,
    notes,
    location: 'Online · Ailernova',
    url: booking.meetingUrl || undefined,
    alarms: [{ relativeOffset: -30 }], // remind 30 minutes before
  };
}

// Create the calendar event. → { ok, eventId } | { ok:false, reason }
export async function addDemoToCalendar(booking) {
  if (Platform.OS === 'web') return { ok: false, reason: 'unavailable' };
  const granted = await ensureCalendarPermission();
  if (!granted) return { ok: false, reason: 'denied' };
  try {
    const calId = await resolveWritableCalendarId();
    if (!calId) return { ok: false, reason: 'unavailable' };
    const eventId = await Calendar.createEventAsync(calId, toEvent(booking));
    return { ok: true, eventId };
  } catch (_) {
    return { ok: false, reason: 'error' };
  }
}

// Update the existing event in place (reschedule). If the user deleted it in the
// meantime, transparently recreate it so the calendar stays in sync.
export async function updateDemoInCalendar(eventId, booking) {
  if (!eventId) return addDemoToCalendar(booking);
  if (Platform.OS === 'web') return { ok: false, reason: 'unavailable' };
  const granted = await ensureCalendarPermission();
  if (!granted) return { ok: false, reason: 'denied' };
  try {
    await Calendar.updateEventAsync(eventId, toEvent(booking));
    return { ok: true, eventId };
  } catch (_) {
    return addDemoToCalendar(booking); // recreate if it vanished
  }
}

// Delete the event (cancel). Idempotent — a missing event still resolves ok.
export async function removeDemoFromCalendar(eventId) {
  if (!eventId || Platform.OS === 'web') return { ok: true };
  try {
    const granted = await ensureCalendarPermission();
    if (!granted) return { ok: false, reason: 'denied' };
    await Calendar.deleteEventAsync(eventId);
    return { ok: true };
  } catch (_) {
    return { ok: true }; // already gone — treat as success
  }
}
