'use strict'

// Register one person as the support agent for every routed team.
//
//   npm run support:setup -- saurabh@ailernova.com
//
// support_agents starts empty ON PURPOSE: with no rows, tickets are created unassigned
// and the app says "team ka member aapse contact karega" instead of naming somebody who
// does not exist. This script is how a REAL person gets named. Never seed a placeholder.

require('dotenv').config()
const db = require('../src/config/database')

// The teams that support categories actually route to (src/components/support/
// supportConfig.js). 'Billing team' is deliberately absent — it belonged to the
// placeholder DEFAULT_AGENT, not to any category.
const TEAMS = [
  'Sales team', 'Tutor operations', 'Accounts team', 'Class support',
  'Support team', 'Academic team', 'Assessment team', 'Tech support',
]

async function main() {
  const email = process.argv[2]
  if (!email) {
    console.error('Usage: npm run support:setup -- <email>')
    process.exit(1)
  }

  const rows = await db.$queryRawUnsafe(
    `SELECT id, name, admin_role FROM "users" WHERE lower(email) = lower($1) LIMIT 1`, email,
  )
  const user = rows && rows[0]
  if (!user) {
    console.error(`No user with email ${email}`)
    process.exit(1)
  }
  if (!user.admin_role) {
    console.error(`${email} has no admin_role — run "npm run admin:setup" first.`)
    process.exit(1)
  }

  for (const team of TEAMS) {
    await db.$executeRawUnsafe(
      `INSERT INTO "support_agents" ("team","userId","name","active")
       VALUES ($1, $2::uuid, $3, true)
       ON CONFLICT ("team","userId") DO UPDATE SET "name" = EXCLUDED."name", "active" = true`,
      team, user.id, user.name || 'Support',
    )
  }

  console.log(`✓ ${user.name} (${email}) is now the agent for all ${TEAMS.length} teams`)
  await db.$disconnect()
}

main().catch(async (err) => {
  console.error(err)
  await db.$disconnect()
  process.exit(1)
})
