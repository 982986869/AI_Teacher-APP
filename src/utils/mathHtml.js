// mathHtml.js
// Normalising the scraped question/option/explanation HTML so formulas read
// correctly wherever they're rendered.
//
// The bank stores maths in THREE conventions, mixed inside the same string —
// which one you get depends on which seed loaded that row, so a renderer that
// only knows one of them shows raw markup to the student:
//   · {tex}\frac{p}{q}{/tex}            — the mycbseguide scrape, kept verbatim
//   · $\left(P+\frac{a}{V^{2}}\right)$  — seeds that rewrote {tex} to $ delimiters
//   · plain HTML / caret text           — a<sup>2</sup>, H<sub>2</sub>O, and the
//     server-flattened [ML^(5)T^(-2)], kmh^{-1}, 10^23 (resources.service.js
//     turns <sup>x</sup> into ^x on its way out)
//
// So: the first two are LaTeX and belong to MathJax; the third never reaches it
// and has to become real characters — [ML⁵T⁻²], H₂O — because "[ML^(5)T^(-2)]"
// is not a formula a student can read. Both jobs need the same split, since a
// caret INSIDE a {tex} island is TeX syntax and must not be touched.

// Unicode super/subscripts, deliberately limited to the glyphs every UI font
// ships. Modifier letters (ˣ ᵃ ⁿ) exist but are patchy in Poppins/Inter and fall
// back per-glyph to a different face, which looks worse than the plain marker —
// so anything outside these maps degrades to ^n / ^(-2/3) instead.
const SUP = {
  0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹',
  '+': '⁺', '-': '⁻', '−': '⁻', '–': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
};
const SUB = {
  0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉',
  '+': '₊', '-': '₋', '−': '₋', '–': '₋', '=': '₌', '(': '₍', ')': '₎',
};

const NAMED = {
  nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
  times: '×', divide: '÷', minus: '−', plusmn: '±', deg: '°', middot: '·', bull: '•',
  le: '≤', ge: '≥', ne: '≠', asymp: '≈', equiv: '≡', infin: '∞', radic: '√', prop: '∝',
  sum: '∑', prod: '∏', int: '∫', part: '∂', nabla: '∇', ang: '∠', perp: '⊥',
  rarr: '→', larr: '←', harr: '↔', darr: '↓', uarr: '↑', rArr: '⇒', hArr: '⇔',
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', theta: 'θ', lambda: 'λ',
  mu: 'μ', nu: 'ν', pi: 'π', rho: 'ρ', sigma: 'σ', tau: 'τ', phi: 'φ', omega: 'ω',
  Delta: 'Δ', Omega: 'Ω', Sigma: 'Σ', Pi: 'Π', Theta: 'Θ', Lambda: 'Λ',
  sup2: '²', sup3: '³', frac12: '½', frac13: '⅓', frac14: '¼', frac34: '¾',
  hellip: '…', mdash: '—', ndash: '–', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
};

// Named + decimal + hex entities. The scrape leaves plenty of &nbsp; and the odd
// &#8722; (minus) around the operators, and an undecoded one reads as literal markup.
export function decodeEntities(s) {
  return String(s == null ? '' : s)
    .replace(/&([a-zA-Z][a-zA-Z0-9]*);/g, (m, name) => {
      if (NAMED[name] != null) return NAMED[name];
      const lower = NAMED[name.toLowerCase()];
      return lower != null ? lower : m;
    })
    .replace(/&#(\d+);/g, (m, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-fA-F]+);/g, (m, h) => String.fromCodePoint(parseInt(h, 16)));
}

// ─── Splitting math islands off the prose ─────────────────────────────────────

// $$…$$ must be tried before $…$, so alternation order matters here.
const ISLAND = /\{tex\}[\s\S]*?\{\/tex\}|\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$|\$[^$\n]*\$/g;

// A `$…$` run only counts as math if its body carries TeX syntax. Without this,
// "the price rose from $5 to $10" makes " 5 to " a formula and eats the sentence.
const looksLikeTex = (body) => /[\\^_]/.test(body) || /\{[\s\S]*\}/.test(body);

/**
 * Split a string into alternating prose and math islands:
 * `[{ tex: false, s }, { tex: true, s }, …]`. Every transform below runs over
 * this so a `^` inside {tex} stays TeX and a `^` in prose becomes a superscript.
 */
export function segments(str) {
  const s = String(str == null ? '' : str);
  const out = [];
  const re = new RegExp(ISLAND.source, 'g');
  let last = 0;
  let m;
  while ((m = re.exec(s)) !== null) {
    const body = m[0];
    // A rejected `$…$` simply stays inside the prose run: `last` doesn't move,
    // so the text is emitted whole by the next push or the tail slice.
    if (body[0] === '$' && body[1] !== '$' && !looksLikeTex(body.slice(1, -1))) continue;
    if (m.index > last) out.push({ tex: false, s: s.slice(last, m.index) });
    out.push({ tex: true, s: body });
    last = m.index + body.length;
  }
  if (last < s.length) out.push({ tex: false, s: s.slice(last) });
  return out;
}

// Does this string carry math a TeX renderer should typeset?
export function hasMath(str) {
  return segments(str).some((seg) => seg.tex);
}

// ─── Caret / <sup> notation → real characters ─────────────────────────────────

const toScript = (raw, map, marker) => {
  const text = String(raw).trim();
  if (!text) return '';
  // ^(o) and ^{\circ} are degrees, not an exponent — the scrape uses both.
  if (/^(o|\\?circ|\\?degree)$/i.test(text)) return '°';
  const chars = Array.from(text);
  if (chars.every((ch) => map[ch] != null)) return chars.map((ch) => map[ch]).join('');
  // Unmappable (x^n, ^-2/3): keep the marker, and only bracket it when it's more
  // than one character so "x^n" doesn't become the noisier "x^(n)".
  return chars.length === 1 ? marker + text : `${marker}(${text})`;
};

// Caret/underscore notation in PROSE (never inside a math island). Braced and
// parenthesised forms first, then the bare ones.
//
// The bare forms are deliberately narrow. `^` only converts before digits, so a
// Java `a ^ b` (XOR) in a Computer Applications question is left alone; `_` only
// converts after a letter or bracket, which is what H_2O and p_(1) look like.
const applyCarets = (s) =>
  String(s)
    .replace(/\^\{([^{}]{1,16})\}/g, (m, inner) => toScript(inner, SUP, '^'))
    .replace(/\^\(([^()]{1,16})\)/g, (m, inner) => toScript(inner, SUP, '^'))
    .replace(/_\{([^{}]{1,16})\}/g, (m, inner) => toScript(inner, SUB, '_'))
    .replace(/_\(([^()]{1,16})\)/g, (m, inner) => toScript(inner, SUB, '_'))
    .replace(/\^([-−–]?\d{1,3})/g, (m, inner) => toScript(inner, SUP, '^'))
    .replace(/([A-Za-z)\]])_(\d{1,3})/g, (m, before, inner) => before + toScript(inner, SUB, '_'));

// Run fn only on the text between HTML tags, so `src="img_1.png"` and
// `class="math-tex"` can't be rewritten by the caret rules.
const outsideTags = (s, fn) =>
  String(s)
    .split(/(<[^>]+>)/g)
    .map((part) => (part.startsWith('<') && part.endsWith('>') ? part : fn(part)))
    .join('');

/**
 * <sup>/<sub> and caret notation → real characters, in prose only.
 * Exported for renderers that hand the string on to MathJax afterwards.
 */
export function mapSupSub(html) {
  return segments(html)
    .map((seg) => {
      if (seg.tex) return seg.s;
      const tagged = seg.s
        .replace(/<sup[^>]*>([\s\S]*?)<\/sup>/gi, (m, inner) => toScript(decodeEntities(inner.replace(/<[^>]+>/g, '')), SUP, '^'))
        .replace(/<sub[^>]*>([\s\S]*?)<\/sub>/gi, (m, inner) => toScript(decodeEntities(inner.replace(/<[^>]+>/g, '')), SUB, '_'));
      return outsideTags(tagged, applyCarets);
    })
    .join('');
}

/**
 * Every math island rewritten to the delimiters MathJax is configured for, and
 * the prose around them normalised. Feed this to MathJaxSvg.
 */
export function toMathJax(html) {
  return segments(html)
    .map((seg) => {
      if (!seg.tex) {
        const tagged = seg.s
          .replace(/<sup[^>]*>([\s\S]*?)<\/sup>/gi, (m, inner) => toScript(decodeEntities(inner.replace(/<[^>]+>/g, '')), SUP, '^'))
          .replace(/<sub[^>]*>([\s\S]*?)<\/sub>/gi, (m, inner) => toScript(decodeEntities(inner.replace(/<[^>]+>/g, '')), SUB, '_'));
        return outsideTags(tagged, applyCarets);
      }
      const s = seg.s;
      if (/^\{tex\}/i.test(s)) return ` \\(${s.replace(/^\{tex\}/i, '').replace(/\{\/tex\}$/i, '')}\\) `;
      if (s.startsWith('$$')) return ` \\[${s.slice(2, -2)}\\] `;
      if (s.startsWith('$')) return ` \\(${s.slice(1, -1)}\\) `;
      return ` ${s} `;   // already \( … \) or \[ … \]
    })
    .join('');
}

// ─── Plain-text fallback ──────────────────────────────────────────────────────

const GREEK = {
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', zeta: 'ζ', eta: 'η',
  theta: 'θ', iota: 'ι', kappa: 'κ', lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', pi: 'π',
  rho: 'ρ', sigma: 'σ', tau: 'τ', phi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω',
  Delta: 'Δ', Gamma: 'Γ', Theta: 'Θ', Lambda: 'Λ', Sigma: 'Σ', Phi: 'Φ', Omega: 'Ω', Pi: 'Π',
};

// Best-effort LaTeX → readable characters, for rows where a seed stripped the
// {tex} delimiters and left the commands bare (\times with nothing around it).
// Gated on an actual backslash command so ordinary prose — and the braces in a
// Java snippet — are never touched.
function latexToText(s) {
  if (!/\\[a-zA-Z]/.test(s)) return s;
  // Brackets only where they change the reading: (a+b)/2, not (a+b)/(2).
  const atom = (t) => (/^[\w.]+$/.test(String(t).trim()) ? String(t).trim() : `(${String(t).trim()})`);
  return s
    .replace(/\\d?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, (m, a, b) => `${atom(a)}/${atom(b)}`)
    .replace(/\{([^{}]*)\}\s*\\over\s*\{([^{}]*)\}/g, (m, a, b) => `${atom(a)}/${atom(b)}`)
    .replace(/([^\s{}]+)\s*\\over\s*([^\s{}]+)/g, '$1/$2')
    .replace(/\\sqrt\s*\{([^{}]*)\}/g, (m, a) => `√${atom(a)}`)
    .replace(/\\sqrt\s*(\w+)/g, '√$1')
    .replace(/\\(times|cdot|div|pm|mp|neq|leq|geq|approx|equiv|infty|therefore|because|rightarrow|leftarrow|Rightarrow|to|circ|degree|propto|angle|perp|sum|prod|int|partial)\b/g,
      (m, cmd) => ({
        times: ' × ', cdot: ' · ', div: ' ÷ ', pm: ' ± ', mp: ' ∓ ', neq: ' ≠ ',
        leq: ' ≤ ', geq: ' ≥ ', approx: ' ≈ ', equiv: ' ≡ ', infty: '∞',
        therefore: ' ∴ ', because: ' ∵ ', rightarrow: ' → ', leftarrow: ' ← ',
        Rightarrow: ' ⇒ ', to: ' → ', circ: '°', degree: '°', propto: ' ∝ ',
        angle: '∠', perp: '⊥', sum: '∑', prod: '∏', int: '∫', partial: '∂',
      }[cmd] || m))
    .replace(/\\([a-zA-Z]+)\b/g, (m, name) => (GREEK[name] != null ? GREEK[name] : m))
    .replace(/\\(left|right|displaystyle|mathrm|text|quad|qquad|,|;|!|\s)/g, '')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/[{}]/g, '');
}

/**
 * HTML → plain text, for content with no math a renderer needs to typeset.
 *
 * Block ends become real newlines rather than spaces: explanations are written
 * as "step<br />step<br />step", and folding those into one line is what makes a
 * three-line derivation unreadable.
 */
export function htmlToPlain(html) {
  const tagsGone = decodeEntities(
    segments(html)
      // A stray island here (caller didn't check hasMath) keeps its body, minus
      // the delimiters — latexToText below makes what it can of the commands.
      .map((seg) => (seg.tex ? seg.s.replace(/^\{tex\}|\{\/tex\}$/gi, '').replace(/^\$\$|\$\$$/g, '').replace(/^\$|\$$/g, '').replace(/^\\[([]|\\[)\]]$/g, '') : seg.s))
      .join('')
      .replace(/<sup[^>]*>([\s\S]*?)<\/sup>/gi, (m, inner) => toScript(decodeEntities(inner.replace(/<[^>]+>/g, '')), SUP, '^'))
      .replace(/<sub[^>]*>([\s\S]*?)<\/sub>/gi, (m, inner) => toScript(decodeEntities(inner.replace(/<[^>]+>/g, '')), SUB, '_'))
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|h[1-6]|tr|li)>/gi, '\n')
      .replace(/<li[^>]*>/gi, '• ')
      .replace(/<[^>]+>/g, '')
  );
  // Carets run after the tags are gone, so no attribute can be rewritten.
  return applyCarets(latexToText(tagsGone))
    .replace(/\r/g, '')
    .replace(/[^\S\n]+/g, ' ')     // collapse runs of spaces, but never newlines
    .replace(/[^\S\n]*\n[^\S\n]*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// First <img src> in an HTML string — some questions and options are diagrams
// (S3 imports or admin uploads) that every text path strips, so callers render
// them as a real <Image>.
export function firstImg(html) {
  const m = String(html || '').match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : null;
}

export default { decodeEntities, segments, hasMath, mapSupSub, toMathJax, htmlToPlain, firstImg };
