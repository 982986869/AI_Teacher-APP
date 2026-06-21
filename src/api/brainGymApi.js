import axiosInstance from './axiosInstance';

// Brain Gym backend — results + progress ONLY. Questions are local
// (see src/data/brainGymQuestions.js). Callers handle failures gracefully.

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
