import axiosInstance from './axiosInstance';
import { reportError, reportWarn } from '../utils/errorLog';

// Arena battles — asynchronous matchmaking (vs bot/ghost), authoritative scoring.
// Network-robust: transient failures (network/timeout/5xx) are retried with backoff;
// 4xx are surfaced immediately. matchmake/result degrade gracefully (return null) so
// the caller can fall back to a fully-offline local match.

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Retry only what is safe to retry: no HTTP response (network/timeout) or a 5xx.
// A 4xx (validation, auth, conflict) is deterministic — never retried.
const isTransient = (err) => {
  const status = err?.response?.status;
  return status === undefined || status >= 500;
};

async function withRetry(fn, { retries = 2, baseDelay = 400 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === retries || !isTransient(err)) throw err;
      await sleep(baseDelay * (attempt + 1));
    }
  }
  throw lastErr;
}

// POST /api/arena/matchmake → { matchId, puzzle, opponent, rating, startedAt }
export const matchmakeArena = async (game = 'no_attack') => {
  try {
    const res = await withRetry(() => axiosInstance.post('/api/arena/matchmake', { game }));
    return res.data?.data;
  } catch (err) {
    // Warn, not error: the local match is a real fallback and the student plays on.
    reportWarn('api/arenaApi.js:matchmakeArena', err, { game, fallback: 'local match' });
    return null;
  }
};

// GET /api/arena/active → { active: {...} | null } — resume an in-progress match
export const fetchActiveMatch = async () => {
  try {
    const res = await withRetry(() => axiosInstance.get('/api/arena/active'), { retries: 1 });
    return res.data?.data?.active || null;
  } catch (err) {
    // Warn: the student simply starts a new match rather than resuming. Worth seeing
    // all the same — if this fails often, in-progress matches are being abandoned and
    // nothing else in the app would ever say so.
    reportWarn('api/arenaApi.js:fetchActiveMatch', err);
    return null;
  }
};

// POST /api/arena/result → { result, userScore, opponentScore, xpEarned, ratingDelta, ... }
// Turn-based duel sends `moves` (server replays to decide the winner); the legacy solo
// race sends `placements`. Server is idempotent: a retried submit replays the recorded
// result (duplicate:true).
export const submitArenaResult = async ({ matchId, placements, moves, rounds, timeMs }) => {
  try {
    const body = { matchId, timeMs };
    if (moves) body.moves = moves;
    if (rounds) body.rounds = rounds;
    if (placements) body.placements = placements;
    const res = await withRetry(() => axiosInstance.post('/api/arena/result', body));
    return res.data?.data;
  } catch (err) {
    // Error, not warn: the student sees a score but the server has no record of the
    // match, so their rating and XP silently diverge from what they were shown.
    reportError('api/arenaApi.js:submitArenaResult', err, { matchId });
    return null;
  }
};

// POST /api/arena/abandon → { abandoned } — safe cleanup of a pending match
export const abandonMatch = async (matchId) => {
  try {
    await axiosInstance.post('/api/arena/abandon', matchId ? { matchId } : {});
    return true;
  } catch (err) {
    return false;
  }
};

// GET /api/arena/history → { rating, played, wins, losses, matches }
export const getArenaHistory = async (limit = 20) => {
  try {
    const res = await axiosInstance.get('/api/arena/history', { params: { limit } });
    return res.data?.data;
  } catch (err) {
    return null;
  }
};

// GET /api/arena/leaderboard → { totalPlayers, me, top }
export const getArenaLeaderboard = async (limit = 50) => {
  try {
    const res = await axiosInstance.get('/api/arena/leaderboard', { params: { limit } });
    return res.data?.data;
  } catch (err) {
    return null;
  }
};
