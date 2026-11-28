'use strict'
// Prints what the teacher dashboard and the student's homework return, in plain words,
// by logging in to a RUNNING local server as the demo accounts (teacher-demo-seed.js).
//
//   node scripts/teacher-demo-check.js                      (server on :5055)
//   node scripts/teacher-demo-check.js --port 5000 --password Demo@1234
//   node scripts/teacher-demo-check.js --done               (also ticks the student's first homework)

const arg = (name, dflt) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : dflt }
const BASE = `http://localhost:${arg('port', '5055')}/api`
const PW = arg('password', 'Demo@1234')
const TEACHER = arg('teacher', 'demo.teacher@ailernova.test')
const STUDENT = arg('student', 'demo.student.a@ailernova.test')

const ist = (iso) => new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
const mins = (iso) => Math.round((new Date(iso) - Date.now()) / 60000)

async function call(path, token, opts = {}) {
  const r = await fetch(`${BASE}${path}`, { ...opts, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } })
  const body = await r.json().catch(() => ({}))
  return { status: r.status, body }
}
async function login(email) {
  const { status, body } = await call('/auth/login', null, { method: 'POST', body: JSON.stringify({ email, password: PW }) })
  const token = body.data && (body.data.token || body.data.accessToken)
  if (!token) throw new Error(`Login failed for ${email} (${status}): ${body.error || body.message || 'no token'}`)
  return token
}

async function main() {
  try { await fetch(`${BASE}/health`) } catch {
    throw new Error(`No server at ${BASE}. Start it first: in server/, run  $env:PORT=5055; node src/index.js`)
  }
  const t = await login(TEACHER)
  const s = await login(STUDENT)

  console.log(`\n=== TEACHER DASHBOARD  (${TEACHER})`)
  const { status, body } = await call('/teaching/dashboard', t)
  if (status !== 200) throw new Error(`dashboard answered ${status}: ${body.error}`)
  const d = body.data
  if (d.next) {
    const m = mins(d.next.startsAt)
    const when = m > 0 ? `in ${m} minutes` : 'started'
    const join = d.next.state === 'joinable' ? 'JOIN IS OPEN' : `Join opens ${ist(d.next.joinOpensAt)}`
    console.log(`Next lesson : ${d.next.studentName} · ${d.next.subject} · ${when}`)
    console.log(`              ${ist(d.next.startsAt)} – ${new Date(d.next.endsAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit' })} · Class ${d.next.classLevel} · ${join}`)
    console.log(`              room: ${d.next.roomLink || '(none)'}`)
  } else console.log('Next lesson : none')
  console.log('\nToday:')
  if (!d.today.length) console.log('  no lessons today')
  for (const l of d.today) console.log(`  ${ist(l.startsAt).padEnd(24)} ${l.studentName} · ${l.subject}  [${l.state}]`)
  console.log('\nMy students:')
  for (const p of d.students) console.log(`  ${p.studentName} · ${p.subject} · Class ${p.classLevel}  room: ${p.roomLink || '(none)'}  next: ${p.nextLessonAt ? ist(p.nextLessonAt) : '—'}`)
  console.log('\nThis week:')
  for (const w of d.week) console.log(`  ${w.label.padEnd(9)} ${w.lessons.length ? w.lessons.map((l) => `${new Date(l.startsAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit' })} ${l.studentName}`).join(', ') : '—'}`)

  console.log('\n=== MY CLASS (homework per student)')
  for (const c of (await call('/teaching/class', t)).body.data.students) {
    console.log(`  ${c.studentName} · ${c.subject}: given ${c.homework.given}, done ${c.homework.done}, overdue ${c.homework.overdue}`)
  }

  console.log(`\n=== STUDENT HOMEWORK  (${STUDENT})`)
  let hw = (await call('/homework', s)).body.data.homework
  for (const h of hw) console.log(`  [${h.status === 'done' ? 'x' : ' '}] ${h.title} — due ${h.dueOn}${h.overdue ? ' (OVERDUE)' : ''} — from ${h.teacherName}`)
  if (process.argv.includes('--done') && hw.find((h) => h.status !== 'done')) {
    const first = hw.find((h) => h.status !== 'done')
    await call(`/homework/${first.id}/done`, s, { method: 'POST' })
    console.log(`  → ticked "${first.title}" as done`)
  }

  console.log('\n=== SAFETY')
  console.log(`  student opens the teacher dashboard → ${(await call('/teaching/dashboard', s)).status} (should be 403)`)
  console.log(`  no login opens the teacher dashboard → ${(await call('/teaching/dashboard')).status} (should be 401)`)
  console.log('')
}

main().catch((e) => { console.error(`\n${e.message}\n`); process.exitCode = 1 })
