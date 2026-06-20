'use strict'
// Seeds exemplar_solutions from prisma/exemplar-seed.json (produced by
// extract-exemplar.js). Idempotent: clears existing Class 11 rows first, then
// re-inserts. Run from server/:  node scripts/seed-exemplar.js
const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')

;(async () => {
  const file = path.join(__dirname, '..', 'prisma', 'exemplar-seed.json')
  const rows = JSON.parse(fs.readFileSync(file, 'utf8'))
  console.log('loaded', rows.length, 'rows from', path.basename(file))

  const prisma = new PrismaClient()
  try {
    const del = await prisma.exemplar_solutions.deleteMany({ where: { className: 'Class 11' } })
    console.log('cleared existing Class 11 rows:', del.count)

    const CHUNK = 500
    let inserted = 0
    for (let i = 0; i < rows.length; i += CHUNK) {
      const r = await prisma.exemplar_solutions.createMany({ data: rows.slice(i, i + CHUNK) })
      inserted += r.count
      console.log(`  inserted ${inserted}/${rows.length}`)
    }
    const total = await prisma.exemplar_solutions.count()
    console.log('DONE. exemplar_solutions total rows now:', total)
  } catch (e) {
    console.error('SEED ERROR:', e.message)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
})()
