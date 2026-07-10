// Shared "whiteboard" theme for the AI Teacher teaching experience. Kept in one
// place so WhiteboardCanvas, DiagramRenderer and the TeachingPlayer scenes stay
// visually consistent. Light peach & mint look (markers tuned to read on white).

export const BOARD = {
  // Board surface (clean white)
  bg: '#FFFFFF',
  bgInner: '#FFFBF7',
  frame: 'rgba(44,48,67,0.10)',
  grid: 'rgba(44,48,67,0.05)',

  // Marker colors (dark ink + accents that read on a white board)
  chalk: '#2C3043',
  white: '#2C3043',
  yellow: '#E0A52E',
  blue: '#3C9DF0',
  green: '#0FA39A',
  pink: '#EE6F96',
  orange: '#EF8A43',
  purple: '#8E93DE',

  // Cards / bubbles on the light stage
  stage: '#F6F7F9',
  card: '#FFFFFF',
  cardBorder: 'rgba(44,48,67,0.10)',
  textDim: '#5E6473',
  textBright: '#2C3043',

  glow: '#0FA39A',
};

// A small rotating palette so successive strokes/steps feel hand-drawn & lively.
export const CHALK_CYCLE = [BOARD.white, BOARD.yellow, BOARD.blue, BOARD.green, BOARD.pink];

export const chalkAt = (i) => CHALK_CYCLE[((i % CHALK_CYCLE.length) + CHALK_CYCLE.length) % CHALK_CYCLE.length];
