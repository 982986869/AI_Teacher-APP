'use strict'

// Spaced-repetition schedule (pure). Standard expanding intervals; the interval
// grows with how many times a concept has been successfully revised. Combined
// with the forgetting curve in mastery.service.getRevisionCalendar (a concept is
// "due" when its scheduled date has passed OR its retention has decayed below the
// revision threshold).

const INTERVALS = [1, 3, 7, 14, 30] // days
const DAY = 86400000

// Interval (days) until the next review, given how many reviews are already done.
function intervalForCount(revisionCount = 0) {
  return INTERVALS[Math.min(Math.max(0, revisionCount), INTERVALS.length - 1)]
}

function nextDueDate(lastSeen, revisionCount = 0) {
  if (!lastSeen) return null
  return new Date(new Date(lastSeen).getTime() + intervalForCount(revisionCount) * DAY)
}

function isDue(lastSeen, revisionCount = 0, now = Date.now()) {
  const due = nextDueDate(lastSeen, revisionCount)
  return due ? now >= due.getTime() : false
}

// Whole days until due (negative = overdue), null when never practised.
function daysUntilDue(lastSeen, revisionCount = 0, now = Date.now()) {
  const due = nextDueDate(lastSeen, revisionCount)
  return due ? Math.ceil((due.getTime() - now) / DAY) : null
}

module.exports = { INTERVALS, DAY, intervalForCount, nextDueDate, isDue, daysUntilDue }
