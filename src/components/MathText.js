// MathText.js
// Renders a string of HTML + LaTeX (the scraped question/option format) as
// inline SVG via react-native-mathjax-html-to-svg — no WebView/CDN needed.
// The data wraps math in {tex}…{/tex}; MathJax expects \( … \), so we convert.
// Plain text (no tags/math) just renders as text, so it's a safe drop-in.

import React from 'react';
import { MathJaxSvg } from 'react-native-mathjax-html-to-svg';

export default function MathText({ value, children, fontSize = 16, color = '#22222A', style }) {
  const raw = String(value != null ? value : (children ?? ''));
  if (!raw.trim()) return null;
  const html = raw
    .replace(/\{tex\}/g, ' \\(')
    .replace(/\{\/tex\}/g, '\\) ');
  return (
    <MathJaxSvg fontSize={fontSize} color={color} fontCache style={style}>
      {html}
    </MathJaxSvg>
  );
}
