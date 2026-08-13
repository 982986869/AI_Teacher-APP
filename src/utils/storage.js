import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  AUTH_TOKEN:    '@ailernova_auth_token',
  USER:          '@ailernova_user',
  // Admin-portal permissions for the signed-in account, as the server computed them.
  // Persisted so a cold start can gate admin-only UI before /me has answered; listed in
  // KEYS so clearAll() drops it on logout and the next account can never inherit it.
  PERMISSIONS:   '@ailernova_permissions',
  ACTIVE_LESSON: '@ailernova_active_lesson',
  ACTIVE_MATCH:  '@ailernova_active_match',
  PRACTICE_STREAK: '@ailernova_practice_streak',
  STUDENT_MODEL: '@ailernova_student_model',
  ONLINE_TEST_ATTEMPTS: '@ailernova_online_test_attempts',
  PRACTICE_ATTEMPTS: '@ailernova_practice_attempts',
  HOME_STATE:    '@ailernova_home_state',
  PROFILE_EXTRAS: '@ailernova_profile_extras',
  WATCHED_RECORDINGS: '@ailernova_watched_recordings',
  RECORDING_PROGRESS: '@ailernova_recording_progress',
};

// Legacy token returned by the still-mocked Google/OTP auth paths. It is NOT a
// real JWT, so the backend rejects it with "Invalid authentication token".
const MOCK_TOKEN = 'mock-jwt-token-12345';

export const saveToken = async (token) => {
  await AsyncStorage.setItem(KEYS.AUTH_TOKEN, token);
};

export const getToken = async () => {
  const token = await AsyncStorage.getItem(KEYS.AUTH_TOKEN);
  // Defensively drop any old mock token so it can never be sent to the backend.
  if (token === MOCK_TOKEN) {
    await AsyncStorage.removeItem(KEYS.AUTH_TOKEN);
    return null;
  }
  return token;
};

export const removeToken = async () => {
  await AsyncStorage.removeItem(KEYS.AUTH_TOKEN);
};

export const saveUser = async (user) => {
  await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
};

export const getUser = async () => {
  const raw = await AsyncStorage.getItem(KEYS.USER);
  return raw ? JSON.parse(raw) : null;
};

export const savePermissions = async (perms) => {
  await AsyncStorage.setItem(KEYS.PERMISSIONS, JSON.stringify(perms || []));
};

// Falls back to "no permissions" on anything unreadable. Failing closed is the only safe
// direction here: a corrupted value must never hand somebody the admin console.
export const getPermissions = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEYS.PERMISSIONS);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
};

// Active AI-Teacher lesson, so a student who closes the app mid-lesson can resume
// it. We persist only the id + title (small, stable); the slides are re-fetched on
// resume via getLesson(). Best-effort — failures never block the UI.
export const saveActiveLesson = async (lesson) => {
  try {
    if (!lesson || !lesson.lessonId) return;
    await AsyncStorage.setItem(KEYS.ACTIVE_LESSON, JSON.stringify({
      lessonId: lesson.lessonId,
      title: lesson.title || '',
      subject: lesson.subject || '',
      // last position so resume returns to the same place (survives app restart).
      slideIndex: Number.isFinite(lesson.slideIndex) ? lesson.slideIndex : 0,
      ts: lesson.ts || null,
    }));
  } catch (_) { /* ignore */ }
};

export const getActiveLesson = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEYS.ACTIVE_LESSON);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
};

export const clearActiveLesson = async () => {
  try { await AsyncStorage.removeItem(KEYS.ACTIVE_LESSON); } catch (_) { /* ignore */ }
};

// Active Arena battle, so a student who closes the app mid-match can resume the SAME
// match (same opponent/puzzle/clock — so the result still counts). Server /active is
// the source of truth for the match; this just preserves local placements + identity.
// Best-effort — failures never block the UI.
export const saveActiveMatch = async (match) => {
  try {
    if (!match || !match.matchId) return;
    await AsyncStorage.setItem(KEYS.ACTIVE_MATCH, JSON.stringify({
      matchId: match.matchId,
      placed: Array.isArray(match.placed) ? match.placed : [],
      ts: match.startedAt || null,
    }));
  } catch (_) { /* ignore */ }
};

export const getActiveMatch = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEYS.ACTIVE_MATCH);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
};

export const clearActiveMatch = async () => {
  try { await AsyncStorage.removeItem(KEYS.ACTIVE_MATCH); } catch (_) { /* ignore */ }
};

// Daily practice streak. Bumps once per calendar day: same day → unchanged,
// consecutive day → +1, gap → reset to 1. Returns the current streak count.
const dayNumber = (d) => Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000);

export const bumpPracticeStreak = async () => {
  try {
    const today = dayNumber(new Date());
    const raw = await AsyncStorage.getItem(KEYS.PRACTICE_STREAK);
    const prev = raw ? JSON.parse(raw) : null;
    let streak = 1;
    if (prev && typeof prev.day === 'number') {
      if (prev.day === today) streak = prev.streak || 1;        // already counted today
      else if (today - prev.day === 1) streak = (prev.streak || 0) + 1; // consecutive
      else streak = 1;                                          // streak broken
    }
    await AsyncStorage.setItem(KEYS.PRACTICE_STREAK, JSON.stringify({ day: today, streak }));
    return streak;
  } catch (_) {
    return 1;
  }
};

// Peek the streak WITHOUT bumping. Used to show the "you lost your streak" nudge ONLY
// when the player is genuinely returning after a gap — i.e. they last played 2+ days
// ago so the streak actually broke. Played today or yesterday → { broken: false }.
export const peekPracticeStreak = async () => {
  try {
    const today = dayNumber(new Date());
    const raw = await AsyncStorage.getItem(KEYS.PRACTICE_STREAK);
    const prev = raw ? JSON.parse(raw) : null;
    if (!prev || typeof prev.day !== 'number' || typeof prev.streak !== 'number' || prev.streak < 1) {
      return { broken: false, streak: 0 };
    }
    const gap = today - prev.day;
    if (gap <= 1) return { broken: false, streak: prev.streak, gap }; // today or consecutive day
    return { broken: true, streak: prev.streak, gap, missedDays: gap - 1, lostPoints: prev.streak };
  } catch (_) {
    return { broken: false, streak: 0 };
  }
};

// ── AI-Teacher student memory ─────────────────────────────────────────────────
// The cross-lesson model the pedagogy engine remembers a student by (rolling
// confidence, accuracy, topics learned, what was tricky). Stored as a map keyed by
// student so several students on one device stay separate. This is LOCAL memory
// that complements the backend's lesson_progress/resume — it never replaces it.
// Best-effort — failures never block a lesson.
export const getStudentModel = async (studentKey) => {
  try {
    if (!studentKey) return null;
    const raw = await AsyncStorage.getItem(KEYS.STUDENT_MODEL);
    const all = raw ? JSON.parse(raw) : {};
    return (all && all[studentKey]) || null;
  } catch (_) { return null; }
};

export const saveStudentModel = async (studentKey, model) => {
  try {
    if (!studentKey || !model) return;
    const raw = await AsyncStorage.getItem(KEYS.STUDENT_MODEL);
    const all = raw ? JSON.parse(raw) : {};
    all[studentKey] = model;
    await AsyncStorage.setItem(KEYS.STUDENT_MODEL, JSON.stringify(all));
  } catch (_) { /* ignore */ }
};

// ── Local test attempts (online tests + MCQ practice) ─────────────────────────
// A local record of which chapter tests a student has attempted, so the Class-11
// card screens can mark cards "Completed" and drive the "Attempted" filter.
// Keyed by `${classLevel}:…`; each entry keeps the BEST attempt:
// { score, total, percent, attempts, lastDate }. Best-effort — never blocks UI.
const getAttemptsFor = async (storageKey, classLevel) => {
  try {
    const raw = await AsyncStorage.getItem(storageKey);
    const all = raw ? JSON.parse(raw) : {};
    if (classLevel == null) return all;
    const prefix = `${classLevel}:`;
    return Object.fromEntries(Object.entries(all).filter(([k]) => k.startsWith(prefix)));
  } catch (_) { return {}; }
};

const saveAttemptTo = async (storageKey, key, attempt) => {
  try {
    if (!key || !attempt) return;
    const raw = await AsyncStorage.getItem(storageKey);
    const all = raw ? JSON.parse(raw) : {};
    const prev = all[key];
    // Keep the best-scoring attempt, but always bump the count + last date.
    const keepNew = !prev || (attempt.percent ?? 0) >= (prev.percent ?? 0);
    const best = keepNew ? attempt : prev;
    all[key] = {
      score: best.score, total: best.total, percent: best.percent,
      attempts: ((prev && prev.attempts) || 0) + 1,
      lastDate: attempt.date || (prev && prev.lastDate) || null,
    };
    await AsyncStorage.setItem(storageKey, JSON.stringify(all));
  } catch (_) { /* ignore */ }
};

export const getOnlineTestAttempts = (classLevel) => getAttemptsFor(KEYS.ONLINE_TEST_ATTEMPTS, classLevel);
export const saveOnlineTestAttempt = (key, attempt) => saveAttemptTo(KEYS.ONLINE_TEST_ATTEMPTS, key, attempt);
export const getPracticeAttempts = (classLevel) => getAttemptsFor(KEYS.PRACTICE_ATTEMPTS, classLevel);
export const savePracticeAttempt = (key, attempt) => saveAttemptTo(KEYS.PRACTICE_ATTEMPTS, key, attempt);

// Stable key for a practice attempt, shared by the writer (McqLoader) and the
// reader (Class11PracticeTests) so they always match. Keyed by names (not slugs)
// since both sides have the subject/chapter names + subtopic id.
export const practiceAttemptKey = (classLevel, subject, chapter, subtopicId) =>
  `${classLevel}::${subject}::${chapter}::${subtopicId != null ? subtopicId : 'full'}`;

// Home "last seen" snapshot — lets the Home decide "just unlocked a badge" or
// "just completed this week's goal" by comparing against the previous visit. Small,
// best-effort; never blocks rendering. Shape: { seenUnlocked:number, celebratedGoalWeek:string }.
export const getHomeState = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEYS.HOME_STATE);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
};

export const saveHomeState = async (patch) => {
  try {
    if (!patch) return;
    const raw = await AsyncStorage.getItem(KEYS.HOME_STATE);
    const cur = raw ? JSON.parse(raw) : {};
    await AsyncStorage.setItem(KEYS.HOME_STATE, JSON.stringify({ ...cur, ...patch }));
  } catch (_) { /* ignore */ }
};

// Profile fields the CompleteProfile form collects that PATCH /api/auth/profile does
// NOT accept yet — it takes grade/board/stream/language/school/accountType only. Kept
// on-device so the answers aren't thrown away, and so the form can repopulate.
// Shape: { photoUri:string, displayName:string, favouriteSubject:string, goal:string }.
// Move these to the server when the profile route grows the columns.
export const getProfileExtras = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEYS.PROFILE_EXTRAS);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
};

export const saveProfileExtras = async (patch) => {
  try {
    if (!patch) return;
    const raw = await AsyncStorage.getItem(KEYS.PROFILE_EXTRAS);
    const cur = raw ? JSON.parse(raw) : {};
    await AsyncStorage.setItem(KEYS.PROFILE_EXTRAS, JSON.stringify({ ...cur, ...patch }));
  } catch (_) { /* ignore */ }
};

// Which recorded lectures this student has opened. Recordings play in the system
// browser/player via Linking.openURL, so we cannot observe playback position — the
// most we honestly know is "they opened it". Binary on purpose: do NOT extend this
// into a fake percent-watched. Shape: { [sessionId]: openedAtIso }.
export const getWatchedRecordings = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEYS.WATCHED_RECORDINGS);
    return raw ? JSON.parse(raw) : {};
  } catch (_) { return {}; }
};

export const markRecordingWatched = async (id) => {
  try {
    if (!id) return;
    const raw = await AsyncStorage.getItem(KEYS.WATCHED_RECORDINGS);
    const cur = raw ? JSON.parse(raw) : {};
    cur[id] = new Date().toISOString();
    await AsyncStorage.setItem(KEYS.WATCHED_RECORDINGS, JSON.stringify(cur));
  } catch (_) { /* ignore */ }
};

// How far into a recording the student actually got, 0-100. Separate from
// WATCHED_RECORDINGS (which records "opened", as a timestamp) so neither has to
// change shape. Only ever moves FORWARD — replaying from the start should not wipe
// out that you had already reached the end.
export const getRecordingProgress = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEYS.RECORDING_PROGRESS);
    return raw ? JSON.parse(raw) : {};
  } catch (_) { return {}; }
};

export const saveRecordingProgress = async (id, pct) => {
  try {
    if (!id || typeof pct !== 'number' || Number.isNaN(pct)) return;
    const next = Math.max(0, Math.min(100, Math.round(pct)));
    const raw = await AsyncStorage.getItem(KEYS.RECORDING_PROGRESS);
    const cur = raw ? JSON.parse(raw) : {};
    if ((cur[id] || 0) >= next) return;
    cur[id] = next;
    await AsyncStorage.setItem(KEYS.RECORDING_PROGRESS, JSON.stringify(cur));
  } catch (_) { /* ignore */ }
};

export const clearAll = async () => {
  await AsyncStorage.multiRemove(Object.values(KEYS));
};