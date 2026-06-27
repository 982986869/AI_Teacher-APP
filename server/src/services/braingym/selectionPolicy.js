'use strict'

// ─── BrainGym selection policy ──────────────────────────────────────────────
// BrainGym is a MIXED adaptive practice engine — it builds general thinking,
// speed, reasoning and application skill. It is NOT locked to what the AI Teacher
// taught. A round blends three modes:
//
//   random_general    (50%) broad class-appropriate practice in the wheel category
//   weak_area         (30%) the student's growth edge (harder band, still in class)
//   teacher_recommended(20%) a SOFT boost toward a lesson concept — optional
//
// When there is no teacher context (the student opened BrainGym directly), the
// teacher share is redistributed across random + weak (so practice is never
// blocked on a lesson). Teacher topics are a personalization signal, never a filter.

const RATIO = { random_general: 0.5, weak_area: 0.3, teacher_recommended: 0.2 }

// Largest-remainder (Hamilton) apportionment: integer counts that sum EXACTLY to
// `count` while staying as close as possible to the target fractions.
function hamilton(count, weights) {
  const keys = Object.keys(weights)
  const rows = keys.map((k) => {
    const v = count * weights[k]
    return { k, floor: Math.floor(v), rem: v - Math.floor(v) }
  })
  const res = {}
  let used = 0
  for (const r of rows) { res[r.k] = r.floor; used += r.floor }
  let left = count - used
  // Hand out the leftover to the largest fractional remainders first.
  rows.sort((a, b) => b.rem - a.rem)
  for (let i = 0; left > 0; i++, left--) res[rows[i % rows.length].k] += 1
  return res
}

// Plan how many questions of each mode a round of `count` should contain.
function planSelection({ count = 5, hasTeacherContext = false } = {}) {
  const n = Math.max(1, Math.floor(count))
  let weights
  if (hasTeacherContext) {
    weights = { ...RATIO }
  } else {
    // Redistribute the 20% teacher share across random+weak, keeping their 5:3 split.
    const base = RATIO.random_general + RATIO.weak_area // 0.8
    weights = {
      random_general: RATIO.random_general / base,   // 0.625
      weak_area: RATIO.weak_area / base,              // 0.375
      teacher_recommended: 0,
    }
  }
  const plan = hamilton(n, weights)
  return {
    random_general: plan.random_general,
    weak_area: plan.weak_area,
    teacher_recommended: plan.teacher_recommended,
    hasTeacherContext,
    ratio: weights,
  }
}

module.exports = { planSelection, RATIO }
