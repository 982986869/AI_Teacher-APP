// Canonical, typed list of runtime feature-flag keys. The app references THESE
// constants — never raw strings scattered around — so a rename is a one-line change
// and a typo is caught immediately.
export const FEATURE_KEYS = {
  AI_TEACHER: 'aiTeacher',
  BRAIN_GYM: 'brainGym',
  ARENA: 'arena',
  PRACTICE: 'practice',
  RESOURCES: 'resources',
  PARENT_APP: 'parentApp',
  NOTIFICATIONS: 'notifications',
  EXPERIMENTAL: 'experimental',
};

export const ALL_FEATURE_KEYS = Object.values(FEATURE_KEYS);
