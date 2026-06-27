'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const S = require('../src/services/revisionSchedule')

const DAY = 86400000
const ago = (days) => new Date(Date.now() - days * DAY)

test('intervals expand 1 → 3 → 7 → 14 → 30 and cap', () => {
  assert.deepEqual(S.INTERVALS, [1, 3, 7, 14, 30])
  assert.equal(S.intervalForCount(0), 1)
  assert.equal(S.intervalForCount(1), 3)
  assert.equal(S.intervalForCount(2), 7)
  assert.equal(S.intervalForCount(3), 14)
  assert.equal(S.intervalForCount(4), 30)
  assert.equal(S.intervalForCount(9), 30) // capped at the last interval
})

test('nextDueDate adds the right interval to last practice', () => {
  const last = ago(0)
  const due0 = S.nextDueDate(last, 0)
  assert.equal(Math.round((due0 - last) / DAY), 1)
  const due3 = S.nextDueDate(last, 3)
  assert.equal(Math.round((due3 - last) / DAY), 14)
  assert.equal(S.nextDueDate(null, 0), null)
})

test('isDue true once the interval has elapsed, false before', () => {
  assert.equal(S.isDue(ago(2), 0), true)   // 2d ago, 1d interval → due
  assert.equal(S.isDue(ago(0.2), 0), false) // just practised → not due
  assert.equal(S.isDue(ago(10), 2), true)  // 10d ago, 7d interval → due
  assert.equal(S.isDue(ago(3), 2), false)  // 3d ago, 7d interval → not yet
})

test('daysUntilDue is negative when overdue, positive when upcoming', () => {
  assert.ok(S.daysUntilDue(ago(20), 2) < 0) // overdue (7d interval)
  assert.ok(S.daysUntilDue(ago(1), 2) > 0)  // upcoming
  assert.equal(S.daysUntilDue(null, 0), null)
})
