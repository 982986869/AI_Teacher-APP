// src/screens/admin/ui/format.js
// Small formatting helpers for the Admin screens — mirrors the web portal's lib/format
// so labels read identically. Pure functions, no deps.
import { S } from '../../../theme/studentTheme';

export function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

// Deterministic accent from a seed (id/email) — stable across renders.
const PALETTE = [S.indigo, S.blue, S.emerald, S.orange, S.purple, S.cyan, S.gold];
export function colorFor(seed) {
  const str = String(seed || '');
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0xffffffff;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

export function timeAgo(iso) {
  if (!iso) return '—';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '—';
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return fmtDate(iso);
}

export function fmtDate(iso) {
  if (!iso) return '—';
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function fmtNum(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '—';
  return Number(n).toLocaleString('en-IN');
}

export function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

// Compact plain-text preview of rich content — strip HTML tags, {tex} markers and entities so
// question/answer lists never show raw "<b>…</b>" or "{tex}\frac…" markup to the admin.
export function plainText(html) {
  return String(html || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\{\/?tex\}/gi, '')
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&#39;/gi, "'").replace(/&quot;/gi, '"')
    // LaTeX → readable text (best-effort; the WebView Preview always renders the real math).
    .replace(/\\d?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, '$1/$2')      // \frac{a}{b} → a/b
    .replace(/\\sqrt\s*\{([^{}]*)\}/g, '√($1)').replace(/\\sqrt\s*(\w+)/g, '√$1')  // \sqrt 3 → √3
    .replace(/\^\s*\{?\s*\\circ\s*\}?/g, '°').replace(/\\circ/g, '°')  // degree
    .replace(/\\times/gi, ' × ').replace(/\\div/gi, ' ÷ ').replace(/\\pm/gi, ' ± ').replace(/\\cdot/gi, ' · ')
    .replace(/\\leq/gi, ' ≤ ').replace(/\\geq/gi, ' ≥ ').replace(/\\neq/gi, ' ≠ ').replace(/\\approx/gi, ' ≈ ').replace(/\\infty/gi, '∞')
    .replace(/\\therefore/gi, ' ∴ ').replace(/\\because/gi, ' ∵ ')
    .replace(/\\(alpha|beta|gamma|delta|theta|lambda|mu|pi|rho|sigma|tau|phi|omega)/gi, (m, g) => ({ alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', theta: 'θ', lambda: 'λ', mu: 'μ', pi: 'π', rho: 'ρ', sigma: 'σ', tau: 'τ', phi: 'φ', omega: 'ω' }[g.toLowerCase()] || m))
    .replace(/[_^]\{([^{}]*)\}/g, '$1').replace(/[_^](\w)/g, '$1')     // v_{1} → v1, x^2 → x2
    .replace(/\\(left|right|quad|qquad|displaystyle|mathrm|text|,|;|!)\b/g, ' ')
    .replace(/\\[a-zA-Z]+/g, '')                                        // strip remaining commands
    .replace(/[{}]/g, '')                                               // strip leftover braces
    .replace(/\s+/g, ' ')
    .trim();
}

// Pull the friendliest message out of an axios/API error.
export function apiError(e, fallback = 'Something went wrong. Please try again.') {
  return e?.response?.data?.error || e?.response?.data?.message || e?.message || fallback;
}
