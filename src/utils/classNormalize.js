// src/utils/classNormalize.js
// ONE canonical class representation for the whole app. Grades are stored in many raw forms
// ("11", "Class 11", "grade 11", "G11", "11 PCM", "Class 10"). Normalize to a single number
// (1–12) and a single label ("Class 11") so filters, chips and badges never show duplicates
// like "11" and "Class 11" side by side. Mirrors the server's normalizeClass (scope.js).

// First 1–2 digits → class number 1..12, else null.
export function normalizeClassNumber(value) {
  if (value == null) return null;
  const m = String(value).match(/\d{1,2}/);
  if (!m) return null;
  const n = parseInt(m[0], 10);
  return n >= 1 && n <= 12 ? n : null;
}

// Canonical label, e.g. "Class 11" (or null when there's no usable class).
export function normalizeClassLabel(value) {
  const n = normalizeClassNumber(value);
  return n == null ? null : `Class ${n}`;
}

// Distinct, sorted canonical class numbers from a list of raw grade values.
export function canonicalClassNumbers(values = []) {
  const set = new Set();
  for (const v of values) { const n = normalizeClassNumber(v); if (n != null) set.add(n); }
  return [...set].sort((a, b) => a - b);
}
