import React, { useContext, useMemo } from 'react';

// How much bigger a board draws itself than the card layout it was designed for.
// 1 = the original in-card size; the immersive full-bleed stage raises it.
//
// The scale is applied at DRAW time, not with a parent transform: react-native-svg
// renders each board into a native layer, so scaling that layer would blur every
// line the teacher draws. Instead the SVGs grow their own pixel height (`h`) and the
// text boards grow their own type (`f`), which stays crisp at any size.
const BoardSizeContext = React.createContext(1);

export const BoardSizeProvider = BoardSizeContext.Provider;

export function useBoardSize() {
  const scale = useContext(BoardSizeContext) || 1;
  return useMemo(() => ({
    scale,
    // SVG boards: their viewBox is fixed, so growing the height grows the drawing
    // uniformly (preserveAspectRatio defaults to "meet").
    h: (base) => Math.round(base * scale),
    // Text boards: type grows more slowly than the box. At 1.8× a 15px point would
    // hit 27px and read as a poster; damped it lands near 22px, which is what a
    // full-screen board actually wants.
    f: (base) => Math.round(base * (1 + (scale - 1) * 0.6) * 10) / 10,
  }), [scale]);
}
