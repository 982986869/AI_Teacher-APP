'use strict'
// Seeds ncert_solutions from server/prisma/ncert-seed.json using RAW SQL, so it
// works with the EXISTING generated Prisma client (no `prisma generate` needed —
// avoids the Windows engine-DLL lock while the dev server is running). Idempotent:
// clears only Part-II / Class 11 rows first. Touches no other table or Part-I.
const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

;(async () => {
  const rows = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'prisma', 'ncert-seed.json'), 'utf8'))
  console.log('rows to seed:', rows.length)

  const del = await prisma.$executeRaw`DELETE FROM ncert_solutions WHERE part = 2 AND "className" = 'Class 11'`
  console.log('cleared existing Part-II rows:', del)

  let inserted = 0
  for (const r of rows) {
    await prisma.$executeRaw`
      INSERT INTO ncert_solutions
        (part, subject, "className", chapter, "sectionKey", "sectionLabel", html, "chapterPos", position)
      VALUES
        (${r.part}, ${r.subject}, ${r.className}, ${r.chapter}, ${r.sectionKey}, ${r.sectionLabel}, ${r.html}, ${r.chapterPos}, ${r.position})`
    inserted += 1
    process.stdout.write(`  inserted ${inserted}/${rows.length}\r`)
  }
  console.log('\nseeded total:', inserted)
  await prisma.$disconnect()
})().catch(async (e) => { console.error('SEED ERROR:', e.message); await prisma.$disconnect(); process.exit(1) })
