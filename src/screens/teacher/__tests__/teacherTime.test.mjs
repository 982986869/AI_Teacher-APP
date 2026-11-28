// node --test src/screens/teacher/__tests__/teacherTime.test.mjs
// India-time labels and Join timing on the teacher dashboard.
import test from 'node:test';
import assert from 'node:assert/strict';
import { timeIST, dateIST, longDateIST, greeting, lessonState, whenText } from '../teacherTime.js';

// 2026-11-28 15:30 IST
const NOW = Date.parse('2026-11-28T10:00:00Z');
const L = (startUtc, min = 60) => ({ startsAt: startUtc, endsAt: new Date(Date.parse(startUtc) + min * 60000).toISOString() });

test('times and dates read in India time', () => {
  assert.equal(timeIST('2026-11-28T10:00:00Z'), '3:30 PM');
  assert.equal(timeIST('2026-11-28T18:29:00Z'), '11:59 PM');
  assert.equal(timeIST('2026-11-28T18:30:00Z'), '12:00 AM');
  assert.equal(timeIST('2026-11-28T06:30:00Z'), '12:00 PM');
  assert.equal(dateIST('2026-11-28T18:30:00Z'), '29 Nov');
  assert.equal(longDateIST(NOW), 'Saturday, 28 Nov');
  assert.equal(greeting(NOW), 'Good afternoon');
  assert.equal(greeting(Date.parse('2026-11-28T03:00:00Z')), 'Good morning');
});

test('Join: closed until 10 minutes before, open until the end', () => {
  assert.equal(lessonState(L('2026-11-28T10:11:00Z'), NOW), 'upcoming');
  assert.equal(lessonState(L('2026-11-28T10:10:00Z'), NOW), 'joinable');
  assert.equal(lessonState(L('2026-11-28T09:30:00Z'), NOW), 'joinable');
  assert.equal(lessonState(L('2026-11-28T09:00:00Z'), NOW), 'over');
});

test('when-text: minutes, hours, later today, tomorrow, another day', () => {
  assert.equal(whenText(L('2026-11-28T10:25:00Z'), NOW), 'in 25 minutes');
  assert.equal(whenText(L('2026-11-28T10:01:00Z'), NOW), 'in 1 minute');
  assert.equal(whenText(L('2026-11-28T09:55:00Z'), NOW), 'started 5 min ago');
  assert.equal(whenText(L('2026-11-28T12:10:00Z'), NOW), 'in 2 h 10 min');
  assert.equal(whenText(L('2026-11-29T10:30:00Z'), NOW), 'tomorrow, 4:00 PM');
  assert.equal(whenText(L('2026-12-01T11:30:00Z'), NOW), 'Tue 1 Dec, 5:00 PM');
});

import { istKey, addDaysKey, shortDateKey, dueLabel } from '../teacherTime.js';

test('homework due labels, by India-time day', () => {
  assert.equal(istKey(NOW), '2026-11-28');
  assert.equal(istKey(Date.parse('2026-11-28T18:45:00Z')), '2026-11-29'); // 00:15 IST
  assert.equal(addDaysKey('2026-11-28', 3), '2026-12-01');
  assert.equal(shortDateKey('2026-11-30'), 'Mon 30 Nov');
  const due = (dueOn, status = 'assigned') => dueLabel({ dueOn, status }, NOW);
  assert.deepEqual(due('2026-11-26'), { text: 'Overdue · was due Thu 26 Nov', tone: 'overdue' });
  assert.deepEqual(due('2026-11-27'), { text: 'Overdue · was due yesterday', tone: 'overdue' });
  assert.deepEqual(due('2026-11-28'), { text: 'Due today', tone: 'today' });
  assert.deepEqual(due('2026-11-29'), { text: 'Due tomorrow', tone: 'soon' });
  assert.deepEqual(due('2026-12-01'), { text: 'Due Tue 1 Dec', tone: 'soon' });
  assert.deepEqual(due('2026-12-10'), { text: 'Due Thu 10 Dec', tone: 'later' });
  assert.deepEqual(due('2026-11-20', 'done'), { text: 'Done', tone: 'done' });
});
