'use strict'

// ───────────────────────────────────────────────────────────────────────────
// Thin forwarder → scripts/migratePapers.js --subject=chemistry
// Kept for back-compat; the generic migrator handles all subjects (Chemistry
// = 109 HTML + 79 PDF = 188). Extra flags (e.g. --live) are passed through.
//
//   node scripts/migrateChemistry12Papers.js [--live]
// ───────────────────────────────────────────────────────────────────────────

const path = require('path')
const { spawnSync } = require('child_process')

const r = spawnSync(
  process.execPath,
  [path.join(__dirname, 'migratePapers.js'), '--subject=chemistry', ...process.argv.slice(2)],
  { stdio: 'inherit' },
)
process.exit(r.status || 0)
