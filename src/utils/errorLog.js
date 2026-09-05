// reportError — what the app's empty `catch {}` blocks call instead of nothing
// (bug list item 15). Errors are buffered in memory, flushed in batches to
// POST /api/logs/client, and read back by an admin in Profile → Error logs.
//
// THE RULES, in order of importance. Every one of them exists because this code runs
// on an error path, where a second failure is far worse than the first:
//
//   1. It never throws. Not on a bad argument, not with no network, not with a
//      circular object. A reporter that can throw is worse than `catch {}`.
//   2. It never reports itself. A failed flush is dropped, not re-queued as a new
//      error — otherwise one broken request becomes an unbounded loop.
//   3. It never blocks. Nothing awaits the flush; the buffer drains on a timer, on
//      backgrounding, and when it fills.
//   4. It is bounded. At most MAX_BUFFER entries are held, and the same fault is
//      reported once per session — a render loop must not fill the buffer or the
//      table.
//
// Deliberately NOT wired to a global ErrorUtils/unhandled-rejection handler: those
// fire during a crash, when the flush cannot complete anyway, and the noise would
// swamp the 5,000-row budget the server-side table lives inside.

import { AppState, Platform } from 'react-native';
import Constants from 'expo-constants';
import axiosInstance from '../api/axiosInstance';
import { getToken } from './storage';

const MAX_BUFFER = 50;     // hard ceiling; beyond this the oldest are dropped
const BATCH_SIZE = 10;     // flush early once this many are waiting
const FLUSH_MS = 30000;    // …otherwise every 30s
const MAX_MESSAGE = 500;
const MAX_STACK = 1200;

const DEVICE = {
  appVersion: Constants.expoConfig?.version || Constants.manifest?.version || null,
  platform: Platform.OS,
  osVersion: String(Platform.Version || ''),
};

let buffer = [];
// Fingerprints already reported this session. A failing render can call the same
// catch sixty times a second; the first one is the useful one.
const seen = new Set();
let timer = null;
let flushing = false;

const truncate = (s, n) => {
  if (s == null) return null;
  const t = String(s);
  return t.length <= n ? t : t.slice(0, n - 1) + '…';
};

// Pull a message out of anything a catch block can receive — an Error, a string, a
// rejected response object, undefined.
function describe(err) {
  if (err == null) return 'unknown error';
  if (typeof err === 'string') return err;
  if (err.message) return String(err.message);
  try { return JSON.stringify(err); } catch { return String(err); }
}

function scheduleFlush() {
  if (timer) return;
  timer = setTimeout(() => { timer = null; flush(); }, FLUSH_MS);
  // Never keep a JS timer alive for this in a test/node context.
  if (timer && typeof timer.unref === 'function') timer.unref();
}

/**
 * Report a swallowed error.
 *
 * @param {string} site    Where it happened — 'utils/sound.js:playTap'. Keep it
 *                         stable; this is what an admin scans the list by.
 * @param {*}      err     Whatever the catch block caught.
 * @param {object} [context] Small breadcrumb bag (screen, id, mode). Never a payload.
 * @param {'error'|'warn'} [level] 'warn' for a deliberate best-effort swallow that is
 *                         still worth seeing (a cache write that failed, say).
 */
export function reportError(site, err, context, level = 'error') {
  try {
    const message = truncate(describe(err), MAX_MESSAGE);
    // Digits vary between occurrences of the same fault (ids, indices, timestamps).
    const key = `${site}|${String(message).replace(/\d+/g, '#')}`;
    if (seen.has(key)) return;
    seen.add(key);
    if (seen.size > 500) seen.clear();

    buffer.push({
      site: truncate(site || 'unknown', 200),
      level: level === 'warn' ? 'warn' : 'error',
      message,
      stack: truncate(err?.stack, MAX_STACK),
      context: context && typeof context === 'object' ? context : undefined,
    });
    if (buffer.length > MAX_BUFFER) buffer = buffer.slice(-MAX_BUFFER);

    if (buffer.length >= BATCH_SIZE) flush();
    else scheduleFlush();
  } catch {
    // Rule 1. There is nowhere left to report this to.
  }
}

/** Convenience for the deliberate best-effort swallows. */
export const reportWarn = (site, err, context) => reportError(site, err, context, 'warn');

/**
 * Send whatever is buffered. Safe to call any time; resolves either way.
 * The entries are removed from the buffer BEFORE the request — a failed flush drops
 * them rather than retrying, because the alternative is a retry loop against a server
 * that is, by hypothesis, already having a bad time.
 */
export async function flush() {
  if (flushing || !buffer.length) return;
  flushing = true;
  const batch = buffer;
  buffer = [];
  try {
    // Signed out there is nothing to attribute the report to, and the endpoint
    // requires auth — drop rather than 401 on an error path.
    const token = await getToken();
    if (!token) return;
    await axiosInstance.post('/api/logs/client', { entries: batch, device: DEVICE });
  } catch {
    // Rule 2. Dropped on purpose.
  } finally {
    flushing = false;
  }
}

/**
 * Flush when the app leaves the foreground — the point at which a device that is
 * about to be backgrounded (or killed) still has a live network stack. Call once,
 * from App.js.
 */
export function startErrorLogFlusher() {
  const sub = AppState.addEventListener('change', (state) => {
    if (state !== 'active') flush();
  });
  return () => { try { sub.remove(); } catch { /* already gone */ } };
}

// Test/debug seam.
export const __buffer = () => buffer;
