// Shared premium-dark "whiteboard/chalkboard" theme for the AI Teacher teaching
// experience. Kept in one place so WhiteboardCanvas, DiagramRenderer and the
// TeachingPlayer scenes stay visually consistent.

export const BOARD = {
  // Board surface
  bg: '#0E1116',
  bgInner: '#11161D',
  frame: 'rgba(255,255,255,0.08)',
  grid: 'rgba(255,255,255,0.04)',

  // Chalk / marker colors
  chalk: '#F4F1E8',
  white: '#F4F1E8',
  yellow: '#FFD66B',
  blue: '#6FB7FF',
  green: '#7BE0A4',
  pink: '#FF9CC2',
  orange: '#FF8A3D',
  purple: '#C4A3FF',

  // Cards / bubbles on the dark stage
  stage: '#0B0E13',
  card: '#161C25',
  cardBorder: 'rgba(255,255,255,0.10)',
  textDim: '#A7B0BE',
  textBright: '#F4F6FA',

  glow: '#FF8A3D',
};

// A small rotating palette so successive strokes/steps feel hand-drawn & lively.
export const CHALK_CYCLE = [BOARD.white, BOARD.yellow, BOARD.blue, BOARD.green, BOARD.pink];

export const chalkAt = (i) => CHALK_CYCLE[((i % CHALK_CYCLE.length) + CHALK_CYCLE.length) % CHALK_CYCLE.length];
