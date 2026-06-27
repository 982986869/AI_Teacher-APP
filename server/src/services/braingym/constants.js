'use strict'

// Shared constants for the BrainGym Adaptive Question Intelligence pipeline.

const CATEGORIES = ['reasoning', 'application', 'understanding', 'fluency']
const DIFFICULTIES = ['easy', 'medium', 'hard', 'challenge']

// The numeric quiz UI only has 3 level buckets. "challenge" is the hardest band
// of level 3 (still within the student's class) — it never escalates the syllabus.
const DIFFICULTY_LEVEL = { easy: 1, medium: 2, hard: 3, challenge: 3 }
const LEVEL_DIFFICULTY = { 1: 'easy', 2: 'medium', 3: 'hard' }

// Bloom's taxonomy default per wheel category (used when the LLM omits it).
const BLOOM_BY_CATEGORY = {
  understanding: 'understand',
  fluency: 'apply',
  reasoning: 'analyze',
  application: 'apply',
}

const SUBJECT_DEFAULT = 'Mental Math'
const PROMPT_VERSION = 'v1'

// Adaptive difficulty bands (rolling accuracy, 0..1) — difficulty is WITHIN class.
const ADAPT = {
  EASY_BELOW: 0.40,        // accuracy < 40%  → easy
  MEDIUM_BELOW: 0.70,      // 40–70%          → medium
  HARD_BELOW: 0.85,        // 70–85%          → hard
  // ≥85% sustained over CHALLENGE_SESSIONS sessions → challenge
  CHALLENGE_AT: 0.85,
  CHALLENGE_SESSIONS: 2,
  STRUGGLE_FAILS: 3,       // consecutive fails that force an automatic downgrade
  MIN_ATTEMPTS_TO_ADAPT: 4, // don't move difficulty before this much evidence
}

// Duplicate detection thresholds.
const DEDUP = {
  JACCARD_REJECT: 0.82,    // token-overlap similarity at/above this = duplicate
  COSINE_REJECT: 0.92,     // embedding cosine at/above this = duplicate
}

// Quality gate — only questions at/above this become permanently ACTIVE.
const QUALITY_MIN = 0.7
const VALIDATION_MIN = 0.7

// Retrieval policy.
const RECENT_WINDOW_DAYS = 30   // avoid repeating a question seen in the last N days
const MIN_POOL = 5              // a round needs this many questions

module.exports = {
  CATEGORIES, DIFFICULTIES, DIFFICULTY_LEVEL, LEVEL_DIFFICULTY,
  BLOOM_BY_CATEGORY, SUBJECT_DEFAULT, PROMPT_VERSION,
  ADAPT, DEDUP, QUALITY_MIN, VALIDATION_MIN, RECENT_WINDOW_DAYS, MIN_POOL,
}
