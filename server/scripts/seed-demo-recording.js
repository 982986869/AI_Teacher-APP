'use strict'

// One-off: seed a demo RECORDED session so the student "Recordings" section is visible.
// class_level = NULL → shows for every class. Idempotent: clears prior demo rows first.
require('dotenv').config()
const db = require('../src/config/database')

const DEMO_TITLE = 'Pythagoras Theorem — Full Class (Demo)'
const DEMO_URL = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
const UPCOMING_TITLE = 'Live Doubt Session: Trigonometry (Demo)'
const MEETING_URL = 'https://meet.google.com/lookup/ailernova-demo'

;(async () => {
  try {
    // Remove any previous demo rows so re-running doesn't stack duplicates.
    await db.$executeRawUnsafe(`DELETE FROM "sessions" WHERE title IN ($1, $2)`, DEMO_TITLE, UPCOMING_TITLE)

    // 1) A past COMPLETED class with a recording → shows under "Recordings".
    const recStartsAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    await db.$executeRawUnsafe(
      `INSERT INTO "sessions"
        (title, subject, chapter, class_level, teacher_name, starts_at, duration_min, mode, recording_url, status, created_by_name)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      DEMO_TITLE, 'Maths', 'Triangles', null, 'Ms. Nova',
      recStartsAt, 45, 'online', DEMO_URL, 'completed', 'Demo',
    )

    // 2) A future SCHEDULED online class with a meeting link → shows under "Upcoming"
    //    with a "Join class" button.
    const upStartsAt = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) // tomorrow
    await db.$executeRawUnsafe(
      `INSERT INTO "sessions"
        (title, subject, chapter, class_level, teacher_name, starts_at, duration_min, mode, meeting_link, status, created_by_name)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      UPCOMING_TITLE, 'Maths', 'Trigonometry', null, 'Ms. Nova',
      upStartsAt, 60, 'online', MEETING_URL, 'scheduled', 'Demo',
    )

    const rows = await db.$queryRawUnsafe(
      `SELECT id::text AS id, title, status, starts_at AS "startsAt", recording_url AS "recordingUrl", meeting_link AS "meetingLink", class_level AS "classLevel"
         FROM "sessions" WHERE title IN ($1, $2) ORDER BY starts_at`, DEMO_TITLE, UPCOMING_TITLE,
    )
    console.log('Seeded demo sessions:', JSON.stringify(rows, null, 2))
    await db.$disconnect()
    process.exit(0)
  } catch (e) {
    console.error('Seed failed:', e.message)
    process.exit(1)
  }
})()
