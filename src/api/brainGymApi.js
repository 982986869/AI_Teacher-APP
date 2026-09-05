import axiosInstance from './axiosInstance';
import { reportError, reportWarn } from '../utils/errorLog';

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
    return res.data?.data;
  } catch (err) {
    reportWarn('api/brainGymApi.js:getBrainGymQuestions', err, { skill, fallback: 'local seed' });
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
    // Fire-and-forget telemetry, so a warn: nothing the student did is lost.
    reportWarn('api/brainGymApi.js:submitBrainGymAttempts', err);
    return null;
  }
};

// POST /api/brain-gym/results → { session, xpEarned, progress }
export const submitBrainGymResult = async (payload) => {
  try {
    const res = await axiosInstance.post('/api/brain-gym/results', payload);
    return res.data.data;
  } catch (err) {
    const reason = err.response?.data?.error || err.response?.data?.message || err.message;
    // Error: the quiz is finished but its XP never reached the server.
    reportError('api/brainGymApi.js:submitBrainGymResult', err, { reason });
    throw err;
  }
};

// GET /api/brain-gym/progress → { totalXp, quizzesCompleted, accuracy, currentStreak, recent }
export const getBrainGymProgress = async () => {
  const res = await axiosInstance.get('/api/brain-gym/progress');
  return res.data.data;
};

// GET /api/brain-gym/leaderboard?period=all|weekly|monthly
// → { period, totalPlayers, me: { rank, xp, accuracy, quizzes, ... }, top: [...] }
export const getBrainGymLeaderboard = async (period = 'all') => {
  const res = await axiosInstance.get('/api/brain-gym/leaderboard', { params: { period } });
  return res.data.data;
};
