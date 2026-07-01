// Client mirror of the server's "No Attack" rules. Used for live conflict + threat
// highlighting during play, and as a full OFFLINE fallback (local puzzle + bot +
// scoring) so an Arena battle still works with no network. Server stays authoritative
// whenever it is reachable.

const ATTACKS = {
  queen: (a, b) => a.r === b.r || a.c === b.c || Math.abs(a.r - b.r) === Math.abs(a.c - b.c),
  rook: (a, b) => a.r === b.r || a.c === b.c,
  bishop: (a, b) => { const dr = Math.abs(a.r - b.r), dc = Math.abs(a.c - b.c); return dr === dc && dr !== 0; },
  knight: (a, b) => {
    const dr = Math.abs(a.r - b.r), dc = Math.abs(a.c - b.c);
    return (dr === 1 && dc === 2) || (dr === 2 && dc === 1);
  },
  king: (a, b) => Math.max(Math.abs(a.r - b.r), Math.abs(a.c - b.c)) === 1,
};
export const DUEL_PIECES = ['queen', 'rook', 'bishop', 'knight'];
export const attacks = (a, b, piece = 'queen') => (ATTACKS[piece] || ATTACKS.queen)(a, b);

// Set of indices for every piece involved in at least one attack.
export const conflictSet = (cells, piece = 'queen') => {
  const atk = ATTACKS[piece] || ATTACKS.queen;
  const bad = new Set();
  for (let i = 0; i < cells.length; i++) {
    for (let j = i + 1; j < cells.length; j++) {
      if (atk(cells[i], cells[j])) { bad.add(i); bad.add(j); }
    }
  }
  return bad;
};

// Keys ("r,c") of every EMPTY cell currently threatened by a placed piece — drives
// the faint danger highlight so the player can see safe squares (Cuemath-style).
export const threatenedSet = (cells, gridN, piece = 'queen') => {
  const atk = ATTACKS[piece] || ATTACKS.queen;
  const occupied = new Set(cells.map((c) => `${c.r},${c.c}`));
  const out = new Set();
  for (let r = 0; r < gridN; r++) {
    for (let c = 0; c < gridN; c++) {
      const k = `${r},${c}`;
      if (occupied.has(k)) continue;
      if (cells.some((p) => atk(p, { r, c }))) out.add(k);
    }
  }
  return out;
};

// Turn-based duel: legal squares for the next piece (empty, not blocked, not
// attacking any placed piece). Drives both the player's highlights and the bot's
// random move.
export const legalMoves = (puzzle, placed) => {
  const atk = ATTACKS[puzzle.piece] || ATTACKS.queen;
  const blocked = new Set((puzzle.blocked || []).map((b) => `${b.r},${b.c}`));
  const occ = new Set((placed || []).map((p) => `${p.r},${p.c}`));
  const out = [];
  for (let r = 0; r < puzzle.gridN; r++) {
    for (let c = 0; c < puzzle.gridN; c++) {
      const k = `${r},${c}`;
      if (blocked.has(k) || occ.has(k)) continue;
      if ((placed || []).every((p) => !atk(p, { r, c }))) out.push({ r, c });
    }
  }
  return out;
};

// ── Rectangle It ───────────────────────────────────────────────────────────────
// Does this player's owned set contain an axis-aligned rectangle? Returns the four
// corners { r1, r2, c1, c2 } or null.
export const findRectangle = (cells) => {
  const byRow = new Map();
  for (const { r, c } of cells) {
    if (!byRow.has(r)) byRow.set(r, new Set());
    byRow.get(r).add(c);
  }
  const seen = new Map();
  for (const [r, colSet] of byRow) {
    const cols = [...colSet].sort((a, b) => a - b);
    for (let i = 0; i < cols.length; i++) {
      for (let j = i + 1; j < cols.length; j++) {
        const key = `${cols[i]},${cols[j]}`;
        if (seen.has(key)) return { r1: seen.get(key), r2: r, c1: cols[i], c2: cols[j] };
        seen.set(key, r);
      }
    }
  }
  return null;
};

// Bot move: win if possible → else block the opponent's winning dot → else build
// toward a rectangle (prefer dots sharing a row/column with its own), else random.
export const botRectMove = (claims, gridN) => {
  const occ = new Set(claims.map((c) => `${c.r},${c.c}`));
  const mine = claims.filter((c) => c.by === 'opp');
  const yours = claims.filter((c) => c.by === 'user');
  const empties = [];
  for (let r = 0; r < gridN; r++) for (let c = 0; c < gridN; c++) if (!occ.has(`${r},${c}`)) empties.push({ r, c });
  if (!empties.length) return null;

  for (const e of empties) if (findRectangle([...mine, e])) return e;       // win now
  for (const e of empties) if (findRectangle([...yours, e])) return e;      // block you

  let best = null, bestScore = -1;
  for (const e of empties) {
    let s = Math.random() * 0.5;
    for (const m of mine) { if (m.r === e.r) s += 1; if (m.c === e.c) s += 1; }
    if (s > bestScore) { bestScore = s; best = e; }
  }
  return best || empties[0];
};

// ── Flip It Up (Lights Out) ──────────────────────────────────────────────────
// Grid of booleans (true = coin up / magenta). Tapping a coin flips it AND its four
// orthogonal neighbours. Goal: every coin up.
export const FLIP_N = 3;

export const flipAt = (grid, idx, N = FLIP_N) => {
  const g = grid.slice();
  const r = Math.floor(idx / N), c = idx % N;
  [[r, c], [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].forEach(([rr, cc]) => {
    if (rr >= 0 && rr < N && cc >= 0 && cc < N) g[rr * N + cc] = !g[rr * N + cc];
  });
  return g;
};

export const allUp = (grid) => grid.every(Boolean);

// Minimum set of taps that solves the board (brute force over 2^(N²) — tiny for 3×3).
export const solveFlip = (grid, N = FLIP_N) => {
  const total = N * N; let best = null;
  for (let mask = 0; mask < (1 << total); mask++) {
    let g = grid; let taps = 0;
    for (let i = 0; i < total; i++) if (mask & (1 << i)) { g = flipAt(g, i, N); taps += 1; }
    if (g.every(Boolean)) { if (!best || taps < best.taps) best = { mask, taps }; }
  }
  return best;
};

// A solvable scramble (start all-up, apply k random taps) + its optimal move count.
export const scrambleFlip = (N = FLIP_N) => {
  const total = N * N;
  let grid;
  do {
    grid = new Array(total).fill(true);
    const k = 2 + Math.floor(Math.random() * 3); // 2–4 taps
    const used = new Set();
    while (used.size < k) used.add(Math.floor(Math.random() * total));
    used.forEach((i) => { grid = flipAt(grid, i, N); });
  } while (grid.every(Boolean));
  const sol = solveFlip(grid, N);
  return { grid, optimal: sol ? sol.taps : 3 };
};

// The next coin to tap on the optimal path (for hints), or -1 if solved/unsolvable.
export const hintCellFor = (grid, N = FLIP_N) => {
  const sol = solveFlip(grid, N);
  if (!sol) return -1;
  for (let i = 0; i < N * N; i++) if (sol.mask & (1 << i)) return i;
  return -1;
};

export const MAX_TIME_MS = 90000;

export const scoreOf = ({ solved, timeMs = 0, count = 0, target = 1 }) =>
  solved
    ? 100 + Math.round(Math.max(0, (MAX_TIME_MS - Math.min(timeMs, MAX_TIME_MS)) / MAX_TIME_MS) * 100)
    : Math.round((Math.min(count, target) / Math.max(1, target)) * 60);

const BOTS = ['Aarav', 'Zoya', 'Kabir', 'Mira', 'Anya', 'Ishaan', 'Diya', 'Arjun'];

// Offline duel match (matchId === null → resolve locally on finish). Random blocked
// board, same as the server generator.
export const localMatch = () => {
  const gridN = 5;
  const all = [];
  for (let r = 0; r < gridN; r++) for (let c = 0; c < gridN; c++) all.push({ r, c });
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  const piece = DUEL_PIECES[Math.floor(Math.random() * DUEL_PIECES.length)];
  return {
    matchId: null,
    game: 'no_attack',
    puzzle: { gridN, target: 5, blocked: all.slice(0, 4), piece, tier: 'easy', mode: 'duel' },
    opponent: { name: BOTS[Math.floor(Math.random() * BOTS.length)], isBot: true, rating: 1000 },
    rating: 1000,
  };
};

// Offline duel result — the board already decided the winner.
export const localDuelResult = ({ opponent, winner }) => {
  const result = winner === 'user' ? 'win' : 'loss';
  const xpEarned = (result === 'win' ? 50 : 15) + (result === 'win' ? 20 : 0);
  return {
    result,
    userScore: result === 'win' ? 1 : 0,
    opponentScore: result === 'win' ? 0 : 1,
    userSolved: result === 'win',
    xpEarned, ratingBefore: 1000, ratingAfter: 1000, ratingDelta: 0, opponent,
  };
};
