// MathText.js
// Renders a string of HTML + LaTeX (the scraped question/option format) as
// inline SVG via react-native-mathjax-html-to-svg — no WebView/CDN needed.
// The data wraps math in {tex}…{/tex}; MathJax expects \( … \), so we convert.
// Plain text (no tags/math) just renders as text, so it's a safe drop-in.
//
// toMathJax does the conversion, and handles the parts this component used to
// get wrong:
//  · math reaches us as {tex}…{/tex} OR $…$ OR \(…\) depending on which seed
//    loaded the row; all three become \( … \) here.
//  · <sup>/<sub> and caret text (H<sub>2</sub>O, [ML^(5)T^(-2)]) are NOT TeX.
//    The library has no style for either tag, so it renders a<sup>2</sup> as the
//    flat "a2" — a wrong formula, not just an ugly one. They become a², H₂O,
//    [ML⁵T⁻²] before MathJax sees them.
// And MathJax's own text nodes carry no font family, so a screen with a display
// face gets system-default text next to its own headings. `textStyle` is
// forwarded to every <Text> the library emits; pass the caller's family and
// line height there (never fontSize — that would override the SVG scaling).

import React from 'react';
import { MathJaxSvg } from 'react-native-mathjax-html-to-svg';
import { toMathJax } from '../utils/mathHtml';

export default function MathText({ value, children, fontSize = 16, color = '#22222A', style, textStyle }) {
  const raw = String(value != null ? value : (children ?? ''));
  if (!raw.trim()) return null;
  const html = toMathJax(raw);
  return (
    <MathJaxSvg fontSize={fontSize} color={color} fontCache style={style} textStyle={textStyle}>
      {html}
    </MathJaxSvg>
  );
}
