import axiosInstance from './axiosInstance';

// Brain Gym backend — results, progress, AND adaptive questions. The 400 local
// questions (src/data/brainGymQuestions.js) remain the OFFLINE fallback bank, so
// the quiz always works even if the backend is unreachable. Callers degrade
// gracefully on any failure.

// POST /api/brain-gym/questions → { questions:[{ id, seedId, source, category,
//   difficulty, q, answer(number), options }], difficulty, level, category }
// Returns null on any failure so the caller can fall back to the local seed bank.
export const getBrainGymQuestions = async ({ skill, count = 5 } = {}) => {
  try {
    const res = await axiosInstance.get('/api/brain-gym/adaptive/questions', { params: { category: skill, count } });
    const data = res.data?.data;
    console.log('[BrainGym] questions', { count: data?.questions?.length, difficulty: data?.difficulty });
    return data;
  } catch (err) {
    console.log('[BrainGym] questions fetch failed — using local seed', err.response?.status || err.message);
    return null;
  }
};

// POST /api/brain-gym/attempts — per-question telemetry feeding mastery + question
// performance. Fire-and-forget; never blocks the UX.
export const submitBrainGymAttempts = async (payload) => {
  try {
    const res = await axiosInstance.post('/api/brain-gym/attempts', payload);
    return res.data?.data;
  } catch (err) {
    console.log('[BrainGym] attempts submit failed', err.response?.status || err.message);
    return null;
  }
};

// POST /api/brain-gym/results → { session, xpEarned, progress }
export const submitBrainGymResult = async (payload) => {
  console.log('[BrainGym] submitting result', payload);
  try {
    const res = await axiosInstance.post('/api/brain-gym/results', payload);
    const data = res.data.data;
    console.log('[BrainGym] result saved', { xpEarned: data?.xpEarned, totalXp: data?.progress?.totalXp });
    return data;
  } catch (err) {
    const reason = err.response?.data?.error || err.response?.data?.message || err.message;
    console.log('[BrainGym] result save failed', err.response?.status, reason);
    throw err;
  }
};

// GET /api/brain-gym/progress → { totalXp, quizzesCompleted, accuracy, currentStreak, recent }
export const getBrainGymProgress = async () => {
  const res = await axiosInstance.get('/api/brain-gym/progress');
  console.log('[Arena] progress loaded', { totalXp: res.data.data?.totalXp, quizzes: res.data.data?.quizzesCompleted });
  return res.data.data;
};

// GET /api/brain-gym/leaderboard?period=all|weekly|monthly
// → { period, totalPlayers, me: { rank, xp, accuracy, quizzes, ... }, top: [...] }
export const getBrainGymLeaderboard = async (period = 'all') => {
  const res = await axiosInstance.get('/api/brain-gym/leaderboard', { params: { period } });
  console.log('[Arena] leaderboard loaded', { period, totalPlayers: res.data.data?.totalPlayers, myRank: res.data.data?.me?.rank });
  return res.data.data;
};
