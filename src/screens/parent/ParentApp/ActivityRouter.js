// src/screens/parent/ParentApp/ActivityRouter.js
// Routing seam for parent activity taps. Given an activity (or the recent-activity
// list), it decides which detail view to show:
//
//   quiz     → quiz detail          (when available)
//   doubt    → AI Teacher detail    (when available)
//   arena    → Arena detail         (when available)
//   lesson   → lesson/resource      (when available)
//   mistake  → mistake detail       (when available)
//   otherwise→ read-only ActivityDetailSheet (fallback)
//
// Today no per-type parent detail pages exist, so DETAIL_BY_TYPE is empty and every
// tap falls back to the existing ActivityDetailSheet — nothing is broken. When a real
// detail view ships, register it here (one line) and routing happens automatically,
// with NO change to the tab UI or ParentApp wiring.
import React from 'react';
import ActivityDetailSheet from './ActivityDetailSheet';

// Future per-type detail components plug in here, e.g. `quiz: QuizDetailSheet`.
const DETAIL_BY_TYPE = {
  // quiz: undefined,
  // doubt: undefined,
  // arena: undefined,
  // lesson: undefined,
  // mistake: undefined,
};

export function hasActivityDetail(type) {
  return !!(type && DETAIL_BY_TYPE[type]);
}

export default function ActivityRouter({ visible, items, activity, childName, onClose }) {
  const Specific = activity ? DETAIL_BY_TYPE[activity.type] : null;
  if (Specific) {
    return <Specific visible={visible} activity={activity} childName={childName} onClose={onClose} />;
  }
  // Fallback: read-only detail. A single tapped activity shows just that item; the
  // recent-activity card (no `activity`) shows the full timeline.
  return (
    <ActivityDetailSheet
      visible={visible}
      items={activity ? [activity] : items}
      childName={childName}
      onClose={onClose}
    />
  );
}
