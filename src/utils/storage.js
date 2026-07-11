import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  AUTH_TOKEN:    '@ailernova_auth_token',
  USER:          '@ailernova_user',
  ACTIVE_LESSON: '@ailernova_active_lesson',
  ACTIVE_MATCH:  '@ailernova_active_match',
  PRACTICE_STREAK: '@ailernova_practice_streak',
  ONLINE_TEST_ATTEMPTS: '@ailernova_online_test_attempts',
  PRACTICE_ATTEMPTS: '@ailernova_practice_attempts',
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

export const clearAll = async () => {
  await AsyncStorage.multiRemove(Object.values(KEYS));
};