import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  AUTH_TOKEN:    '@ailernova_auth_token',
  USER:          '@ailernova_user',
  ACTIVE_LESSON: '@ailernova_active_lesson',
  ACTIVE_MATCH:  '@ailernova_active_match',
  PRACTICE_STREAK: '@ailernova_practice_streak',
  STUDENT_MODEL: '@ailernova_student_model',
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

export const clearAll = async () => {
  await AsyncStorage.multiRemove(Object.values(KEYS));
};