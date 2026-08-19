'use strict'

// Admin RBAC. `admin_role` on the user row is the single source of truth for portal
// access; it is deliberately separate from the STUDENT/TEACHER/ADMIN UserRole enum so
// elevating a person never disturbs their learner data. Every admin API route declares
// the permission it needs; the middleware checks it against the role's grant list.

const PERMISSIONS = [
  'dashboard.view',
  'users.view', 'users.edit', 'users.delete', 'users.role', 'users.password',
  'admins.manage',
  'content.view', 'content.edit', 'content.publish',
  'reports.view',
  'aiteacher.view', 'aiteacher.edit',
  'announcements.view', 'announcements.edit',
  'settings.view', 'settings.edit',
  'flags.view', 'flags.edit',
  'audit.view',
  'support.view', 'support.reply', 'support.resolve',
]

// '*' = every permission. Ordered from most to least privileged.
const ROLE_PERMISSIONS = {
  super_admin: ['*'],

  admin: [
    'dashboard.view',
    'users.view', 'users.edit', 'users.delete', 'users.role', 'users.password',
    'content.view', 'content.edit', 'content.publish',
    'reports.view',
    'aiteacher.view', 'aiteacher.edit',
    'announcements.view', 'announcements.edit',
    'settings.view', 'settings.edit',
    'flags.view', 'flags.edit',
    'audit.view',
    'support.view', 'support.reply', 'support.resolve',
  ],

  // Curriculum / question-bank / AI-Teacher configuration. No user administration.
  content_manager: [
    'dashboard.view',
    'content.view', 'content.edit',
    'aiteacher.view', 'aiteacher.edit',
    'announcements.view', 'announcements.edit',
    'reports.view',
  ],

  // Front-line support: can read users, reset a password, deactivate — but never
  // delete accounts, change roles, or touch content/settings.
  support: [
    'dashboard.view',
    'users.view', 'users.edit', 'users.password',
    'reports.view',
    'announcements.view',
    'audit.view',
    'support.view', 'support.reply', 'support.resolve',
  ],
}

const ROLES = Object.keys(ROLE_PERMISSIONS)

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  content_manager: 'Content Manager',
  support: 'Support',
}

function isAdminRole(role) {
  return typeof role === 'string' && ROLES.includes(role)
}

function hasPermission(role, permission) {
  const grants = ROLE_PERMISSIONS[role]
  if (!grants) return false
  return grants.includes('*') || grants.includes(permission)
}

// The flat permission list for a role — handy for the client to hide/disable UI.
function permissionsFor(role) {
  const grants = ROLE_PERMISSIONS[role]
  if (!grants) return []
  return grants.includes('*') ? [...PERMISSIONS] : [...grants]
}

// Deactivation is the OTHER half of the answer, and it lives on the user row rather than
// in the role map: admin/users.controller.js `setStatus` flips is_active and deliberately
// leaves admin_role intact, so that a reactivated account gets its old access back. That
// means the role map alone still says "support" for somebody who was locked out weeks
// ago. The web portal enforces this at its own login (admin/auth.controller.js) — which a
// phone already holding a valid app JWT never passes through again — so anything deriving
// access from a user row has to check the switch itself.
//
// Both spellings are accepted because both exist in this codebase: the raw selects that
// feed req.user use the column name (`is_active`), while the admin controllers alias it to
// `isActive` for the portal. Only an explicit `false` revokes — a row selected without the
// column at all must not silently read as deactivated.
function isDeactivated(user) {
  return !!user && (user.is_active === false || user.isActive === false)
}

// What a user (not merely a role) may do. This is what /me, login, register and googleAuth
// hand the app.
function permissionsForUser(user) {
  if (!user || isDeactivated(user)) return []
  return permissionsFor(user.admin_role)
}

// Does this user hold `permission` right now? The server-side gate that matches the list
// above — use this, not hasPermission(user.admin_role, …), wherever a whole user row is
// in hand.
function userHasPermission(user, permission) {
  if (!user || isDeactivated(user)) return false
  return hasPermission(user.admin_role, permission)
}

module.exports = {
  PERMISSIONS,
  ROLES,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
  isAdminRole,
  hasPermission,
  permissionsFor,
  isDeactivated,
  permissionsForUser,
  userHasPermission,
}
