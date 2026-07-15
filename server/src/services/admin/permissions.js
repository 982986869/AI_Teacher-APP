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

module.exports = {
  PERMISSIONS,
  ROLES,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
  isAdminRole,
  hasPermission,
  permissionsFor,
}
