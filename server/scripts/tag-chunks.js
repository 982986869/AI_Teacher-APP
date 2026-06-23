'use strict'
// Tags each chunk with its nearest concept (within the same chapter, by embedding)
// and a coarse contentType. Pure pgvector SQL — no LLM. Run from server/:
//   node scripts/tag-chunks.js [Subject]
require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const SUBJECT = process.argv[2] || 'Physics'

;(async () => {
  const n = await prisma.$executeRawUnsafe(
    `UPDATE knowledge_chunks c
     SET metadata = jsonb_set(
       jsonb_set(c.metadata, '{concept}', to_jsonb((
         SELECT k.name FROM concepts k
         WHERE k.subject = c.metadata->>'subject' AND k.chapter = c.metadata->>'chapter' AND k.embedding IS NOT NULL
         ORDER BY k.embedding <=> c.embedding LIMIT 1
       ))),
       '{contentType}', to_jsonb(CASE WHEN c.metadata->>'qNumber' IS NOT NULL THEN 'solved_problem' ELSE 'concept' END))
     WHERE c.metadata->>'subject' = $1 AND c.embedding IS NOT NULL`,
    SUBJECT
  )
  console.log(`tagged ${n} ${SUBJECT} chunks with concept + contentType`)

  const sample = await prisma.$queryRaw`
    SELECT metadata->>'chapter' chapter, metadata->>'concept' concept, count(*)::int n
    FROM knowledge_chunks WHERE metadata->>'subject' = ${SUBJECT} AND metadata->>'concept' IS NOT NULL
    GROUP BY 1, 2 ORDER BY 1, 3 DESC LIMIT 24`
  console.log(sample.map((x) => `  ${x.chapter} > ${x.concept}: ${x.n}`).join('\n'))
  await prisma.$disconnect()
})().catch((e) => { console.error(e); process.exit(1) })
