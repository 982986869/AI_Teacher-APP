'use strict'

// Minimal in-memory Prisma stand-in implementing only the query shapes the
// BrainGym pipeline uses. Lets us test retrieval/generation/mastery without a
// real Postgres. Not a general Prisma mock — intentionally narrow.

let SEQ = 0
// Monotonic, anchored near "now" so rows land inside the recency window the
// retrieval layer checks (last 30 days).
const nextCreatedAt = () => new Date(Date.now() - 1000 + (SEQ++))

function matchValue(field, cond) {
  if (cond && typeof cond === 'object' && !(cond instanceof Date)) {
    if ('in' in cond) return cond.in.includes(field)
    if ('notIn' in cond) return !cond.notIn.includes(field)
    if ('gte' in cond) return field >= cond.gte
    if ('lt' in cond) return field < cond.lt
    if ('not' in cond) return field !== cond.not
    if ('contains' in cond) {
      const f = String(field == null ? '' : field)
      const c = String(cond.contains)
      return cond.mode === 'insensitive' ? f.toLowerCase().includes(c.toLowerCase()) : f.includes(c)
    }
  }
  return field === cond
}
function matchWhere(row, where = {}) {
  return Object.entries(where).every(([k, v]) => {
    if (k === 'OR') return v.some((sub) => matchWhere(row, sub))
    if (k === 'AND') return v.every((sub) => matchWhere(row, sub))
    return matchValue(row[k], v)
  })
}
function applyOrder(rows, orderBy) {
  if (!orderBy) return rows
  const specs = Array.isArray(orderBy) ? orderBy : [orderBy]
  return [...rows].sort((a, b) => {
    for (const spec of specs) {
      const [field, dir] = Object.entries(spec)[0]
      const av = a[field], bv = b[field]
      if (av < bv) return dir === 'desc' ? 1 : -1
      if (av > bv) return dir === 'desc' ? -1 : 1
    }
    return 0
  })
}
function applyUpdate(row, data) {
  for (const [k, v] of Object.entries(data)) {
    if (v && typeof v === 'object' && 'increment' in v) row[k] = (row[k] || 0) + v.increment
    else row[k] = v
  }
}

function makeFakeDb() {
  const gq = []        // generated_questions
  const attempts = []  // question_attempts
  const mastery = new Map()
  const history = []
  let gid = 0

  return {
    _gq: gq, _attempts: attempts, _mastery: mastery, _history: history,

    generated_questions: {
      async findMany({ where = {}, orderBy, take } = {}) {
        let rows = gq.filter((r) => matchWhere(r, where))
        rows = applyOrder(rows, orderBy)
        return take ? rows.slice(0, take) : rows
      },
      async create({ data }) {
        // Enforce the (grade, subject, signature) unique constraint like Postgres,
        // so the concurrent-insert race path (P2002 → rejectedDuplicate) is tested.
        if (gq.some((r) => r.grade === data.grade && r.subject === data.subject && r.signature === data.signature)) {
          const err = new Error('Unique constraint failed')
          err.code = 'P2002'
          throw err
        }
        const row = {
          id: `gq-${++gid}`, timesServed: 0, timesCorrect: 0, timesWrong: 0,
          ambiguityFlag: false, status: 'ACTIVE', createdAt: nextCreatedAt(), ...data,
        }
        gq.push(row)
        return row
      },
      async count({ where = {} } = {}) { return gq.filter((r) => matchWhere(r, where)).length },
      async update({ where: { id }, data }) {
        const row = gq.find((r) => r.id === id)
        if (!row) throw new Error('record not found')
        applyUpdate(row, data)
        return row
      },
    },

    question_attempts: {
      async findMany({ where = {} } = {}) { return attempts.filter((a) => matchWhere(a, where)) },
      async createMany({ data }) {
        for (const d of data) attempts.push({ id: `a-${attempts.length}`, createdAt: nextCreatedAt(), ...d })
        return { count: data.length }
      },
    },

    student_mastery: {
      async findUnique({ where }) {
        // Match real Prisma: the compound-unique key is the field name.
        const k = where.userId_category_subject
        return mastery.get(`${k.userId}|${k.category}|${k.subject}`) || null
      },
      async upsert({ where, update, create }) {
        const k = where.userId_category_subject
        const key = `${k.userId}|${k.category}|${k.subject}`
        const existing = mastery.get(key)
        const row = existing ? { ...existing, ...update } : { ...create }
        mastery.set(key, row)
        return row
      },
      async findMany({ where = {} } = {}) {
        return [...mastery.values()].filter((r) => matchWhere(r, where))
      },
    },

    generation_history: { async create({ data }) { history.push(data); return data } },

    // Interactive transaction: run the callback with this same client as `tx`.
    // (The in-memory store is single-threaded, so this models atomicity faithfully.)
    async $transaction(arg) {
      if (typeof arg === 'function') return arg(this)
      return Promise.all(arg)
    },

    async $executeRawUnsafe() { return 0 },
  }
}

module.exports = { makeFakeDb }
