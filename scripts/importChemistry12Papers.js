'use strict'

// ───────────────────────────────────────────────────────────────────────────
// DEPRECATED — superseded by scripts/migrateChemistry12Papers.js
//
// This script imported only the 109 recent Chemistry papers and keyed them on
// (code, year), which (a) silently dropped 3 distinct same-code papers and
// (b) had no place for the 79 older PDF-only papers. The replacement loads the
// FULL 188-paper set (109 HTML + 79 PDF) keyed on a stable `ext_uid`.
//
//   node scripts/migrateChemistry12Papers.js          # dry run
//   node scripts/migrateChemistry12Papers.js --live    # delete old + insert 188
// ───────────────────────────────────────────────────────────────────────────

console.error(
  'importChemistry12Papers.js is DEPRECATED.\n' +
  'Use:  node scripts/migrateChemistry12Papers.js [--live]\n' +
  '(loads the full 188-paper Class-12 Chemistry set: 109 HTML + 79 PDF).'
)
process.exit(1)
