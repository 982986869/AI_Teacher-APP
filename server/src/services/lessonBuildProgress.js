// src/services/lessonBuildProgress.js
// Live "how far along is my lesson" for POST /api/ai/lesson/generate.
//
// Generation is one long request (30–90 s). The client sends a random `progressId`
// with it and polls GET /api/ai/lesson-build/:progressId while it waits; the
// provider reports real milestones as the model streams (thinking started, slide N
// being written), and this module turns them into a monotonic percentage.
//
// In-memory on purpose: the value is only interesting for the minute a lesson is
// being built, and losing it on a restart just means the client falls back to its
// own checklist. It assumes ONE server process (true today — socket.io support chat
// has the same requirement); behind several processes a poll could land on one
// that never saw the build and would return 404, which the client also tolerates.

const TTL_MS = 5 * 60 * 1000 // a finished/abandoned build is forgotten after this
const MAX_ENTRIES = 5000     // hard cap so a misbehaving client cannot grow the map

// The prompt asks for 7–10 slides; 9 is the planning figure for "slide N of ~9".
const EXPECTED_SLIDES = 9

const builds = new Map() // key → { pct, phase, slide, slidesExpected, updatedAt, startedAt, timer }

const keyOf = (userId, progressId) => `${userId}:${progressId}`

function forget(key) {
  const b = builds.get(key)
  if (b && b.timer) clearTimeout(b.timer)
  builds.delete(key)
}

function touch(key, b) {
  b.updatedAt = Date.now()
  if (b.timer) clearTimeout(b.timer)
  b.timer = setTimeout(() => builds.delete(key), TTL_MS)
  if (b.timer.unref) b.timer.unref()
}

// Start tracking a build. Returns a reporter the generation pipeline calls with
// milestones; it is a no-op when no progressId was sent (old clients).
function start(userId, progressId) {
  if (!progressId) return () => {}
  const key = keyOf(userId, progressId)
  if (!builds.has(key) && builds.size >= MAX_ENTRIES) {
    // Drop the oldest entry rather than refuse — progress is best-effort.
    const oldest = builds.keys().next().value
    forget(oldest)
  }
  const b = { pct: 2, phase: 'preparing', slide: 0, slidesExpected: EXPECTED_SLIDES, startedAt: Date.now() }
  builds.set(key, b)
  touch(key, b)

  // pct only ever goes up, so a late or out-of-order event can never move the bar back.
  const raise = (to) => { b.pct = Math.max(b.pct, Math.min(100, Math.round(to))) }

  return function report(event, data = {}) {
    if (!builds.has(key)) return
    switch (event) {
      case 'context':   // learner profile / textbook source loaded, prompt built
        b.phase = 'preparing'; raise(5); break
      case 'thinking':  // model is reasoning before it writes (adaptive thinking)
        if (b.phase !== 'thinking' && b.phase !== 'writing') { b.phase = 'thinking'; b.thinkingAt = Date.now() }
        raise(8)
        break
      case 'slide': {   // the model has started writing slide `n`
        const n = Math.max(1, Number(data.n) || 1)
        b.phase = 'writing'
        b.slide = Math.max(b.slide, n)
        // A slide that has STARTED is not finished, hence (n - 0.5). 25% → 92%.
        raise(25 + 67 * Math.min(1, (b.slide - 0.5) / b.slidesExpected))
        break
      }
      case 'saving':    // JSON complete; validating + storing the lesson
        b.phase = 'saving'; raise(95); break
      case 'cached':    // identical textbook lesson already built — instant
        b.phase = 'saving'; raise(90); break
      case 'done':
        b.phase = 'done'; raise(100); break
      case 'failed':
        b.phase = 'failed'; break
      default:
        return
    }
    touch(key, b)
  }
}

function get(userId, progressId) {
  const b = builds.get(keyOf(userId, progressId))
  if (!b) return null
  // Thinking text is not returned, so its length is unknown. While the model thinks,
  // creep from 8% toward 25% (~1% every 1.8 s) so the bar visibly moves; the first
  // slide event then takes over with real counts. Stored, so it never moves back.
  if (b.phase === 'thinking' && b.thinkingAt) {
    b.pct = Math.max(b.pct, Math.min(25, Math.round(8 + (Date.now() - b.thinkingAt) / 1800)))
  }
  return {
    percent: b.pct,
    phase: b.phase,
    slide: b.slide,
    slidesExpected: b.slidesExpected,
    elapsedMs: Date.now() - b.startedAt,
  }
}

const PROGRESS_ID_RE = /^[A-Za-z0-9_-]{8,64}$/
const isProgressId = (v) => typeof v === 'string' && PROGRESS_ID_RE.test(v)

module.exports = { start, get, isProgressId, EXPECTED_SLIDES }
