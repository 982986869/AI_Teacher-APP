// chemistry12Papers.js
// Class 12 Chemistry — CBSE board "Last Year Papers" (2019–2025). Each source JSON
// holds one full paper: { name, year, code, set, question_paper_html,
// answer_key_html }. This module exposes the paper list for the Resources
// "Last Year Papers" screen and, per paper code, full self-contained HTML
// documents (MathJax) for the question paper (Questions tab) and the answer key
// (Solutions tab) — rendered in a WebView, the same local approach used for the
// Class 12 Chemistry Exemplar / NCERT content. Mirrors src/data/physics12Papers.js.

import p000 from './chemistry12Papers/01 2019 56_1_1 set1.json';
import p001 from './chemistry12Papers/02 2019 56_1_1 set1.json';
import p002 from './chemistry12Papers/03 2019 56_1_2 set2.json';
import p003 from './chemistry12Papers/04 2019 56_1_2 set2.json';
import p004 from './chemistry12Papers/05 2019 56_1_3 set3.json';
import p005 from './chemistry12Papers/06 2019 56_1_3 set3.json';
import p006 from './chemistry12Papers/07 2019 56_2_1 set1.json';
import p007 from './chemistry12Papers/08 2019 56_2_2 set2.json';
import p008 from './chemistry12Papers/09 2019 56_2_3 set3.json';
import p009 from './chemistry12Papers/10 2019 56_3_1 set1.json';
import p010 from './chemistry12Papers/11 2019 56_3_2 set2.json';
import p011 from './chemistry12Papers/12 2019 56_3_3 set3.json';
import p012 from './chemistry12Papers/13 2019 56_4_1 set1.json';
import p013 from './chemistry12Papers/14 2019 56_4_2 set2.json';
import p014 from './chemistry12Papers/15 2019 56_4_3 set3.json';
import p015 from './chemistry12Papers/16 2019 56_5_1 set1.json';
import p016 from './chemistry12Papers/17 2019 56_5_2 set2.json';
import p017 from './chemistry12Papers/18 2019 56_5_3 set3.json';
import p018 from './chemistry12Papers/19 2020 56_1_1 set1.json';
import p019 from './chemistry12Papers/20 2020 56_1_2 set2.json';
import p020 from './chemistry12Papers/21 2020 56_1_3 set3.json';
import p021 from './chemistry12Papers/22 2020 56_2_1 set1.json';
import p022 from './chemistry12Papers/23 2020 56_2_2 set2.json';
import p023 from './chemistry12Papers/24 2020 56_2_3 set3.json';
import p024 from './chemistry12Papers/25 2020 56_3_1 set1.json';
import p025 from './chemistry12Papers/26 2020 56_3_2 set2.json';
import p026 from './chemistry12Papers/27 2020 56_3_3 set3.json';
import p027 from './chemistry12Papers/28 2020 56_4_1 set1.json';
import p028 from './chemistry12Papers/29 2020 56_4_2 set2.json';
import p029 from './chemistry12Papers/30 2020 56_4_3 set3.json';
import p030 from './chemistry12Papers/31 2020 56_5_1 set1.json';
import p031 from './chemistry12Papers/32 2020 56_5_2 set2.json';
import p032 from './chemistry12Papers/33 2020 56_5_3 set3.json';
import p033 from './chemistry12Papers/34 2021 56_1_1 set1.json';
import p034 from './chemistry12Papers/35 2022 56_1_1 set1.json';
import p035 from './chemistry12Papers/36 2022 56_1_2 set2.json';
import p036 from './chemistry12Papers/37 2022 56_1_3 set3.json';
import p037 from './chemistry12Papers/38 2022 56_2_1 set1.json';
import p038 from './chemistry12Papers/39 2022 56_2_2 set2.json';
import p039 from './chemistry12Papers/40 2022 56_2_3 set3.json';
import p040 from './chemistry12Papers/41 2022 56_3_1 set1.json';
import p041 from './chemistry12Papers/42 2022 56_3_2 set2.json';
import p042 from './chemistry12Papers/43 2022 56_3_3 set3.json';
import p043 from './chemistry12Papers/44 2022 56_4_1 set1.json';
import p044 from './chemistry12Papers/45 2022 56_4_2 set2.json';
import p045 from './chemistry12Papers/46 2022 56_4_3 set3.json';
import p046 from './chemistry12Papers/47 2022 56_5_1 set1.json';
import p047 from './chemistry12Papers/48 2022 56_5_2 set2.json';
import p048 from './chemistry12Papers/49 2022 56_5_3 set3.json';
import p049 from './chemistry12Papers/50 2022 56_6_1 set1.json';
import p050 from './chemistry12Papers/51 2022 56_6_2 set2.json';
import p051 from './chemistry12Papers/52 2022 56_6_3 set3.json';
import p052 from './chemistry12Papers/53 2023 56_1_1 set1.json';
import p053 from './chemistry12Papers/54 2023 56_1_2 set2.json';
import p054 from './chemistry12Papers/55 2023 56_1_3 set3.json';
import p055 from './chemistry12Papers/56 2023 56_2_1 set1.json';
import p056 from './chemistry12Papers/57 2023 56_2_2 set2.json';
import p057 from './chemistry12Papers/58 2023 56_2_3 set3.json';
import p058 from './chemistry12Papers/59 2023 56_3_1 set1.json';
import p059 from './chemistry12Papers/60 2023 56_3_2 set2.json';
import p060 from './chemistry12Papers/61 2023 56_3_3 set3.json';
import p061 from './chemistry12Papers/62 2023 56_4_1 set1.json';
import p062 from './chemistry12Papers/63 2023 56_4_2 set2.json';
import p063 from './chemistry12Papers/64 2023 56_4_3 set3.json';
import p064 from './chemistry12Papers/65 2023 56_5_1 set1.json';
import p065 from './chemistry12Papers/66 2023 56_5_2 set2.json';
import p066 from './chemistry12Papers/67 2023 56_5_3 set3.json';
import p067 from './chemistry12Papers/68 2023 56_C_1 set1.json';
import p068 from './chemistry12Papers/69 2023 56_C_2 set2.json';
import p069 from './chemistry12Papers/70 2023 56_C_3 set3.json';
import p070 from './chemistry12Papers/71 2024 56_1_1 set1.json';
import p071 from './chemistry12Papers/72 2024 56_1_2 set2.json';
import p072 from './chemistry12Papers/73 2024 56_1_3 set3.json';
import p073 from './chemistry12Papers/74 2024 56_2_1 set1.json';
import p074 from './chemistry12Papers/75 2024 56_2_2 set2.json';
import p075 from './chemistry12Papers/76 2024 56_2_3 set3.json';
import p076 from './chemistry12Papers/77 2024 56_3_1 set1.json';
import p077 from './chemistry12Papers/78 2024 56_3_2 set2.json';
import p078 from './chemistry12Papers/79 2024 56_3_3 set3.json';
import p079 from './chemistry12Papers/80 2024 56_4_1 set1.json';
import p080 from './chemistry12Papers/81 2024 56_4_2 set2.json';
import p081 from './chemistry12Papers/82 2024 56_4_3 set3.json';
import p082 from './chemistry12Papers/83 2024 56_5_1 set1.json';
import p083 from './chemistry12Papers/84 2024 56_5_2 set2.json';
import p084 from './chemistry12Papers/85 2024 56_5_3 set3.json';
import p085 from './chemistry12Papers/86 2024 56_S_1 set1.json';
import p086 from './chemistry12Papers/87 2024 56_S_2 set2.json';
import p087 from './chemistry12Papers/88 2024 56_S_3 set3.json';
import p088 from './chemistry12Papers/89 2025 56_1_1 set1.json';
import p089 from './chemistry12Papers/90 2025 56_1_2 set2.json';
import p090 from './chemistry12Papers/91 2025 56_1_3 set3.json';
import p091 from './chemistry12Papers/92 2025 56_2_1 set1.json';
import p092 from './chemistry12Papers/93 2025 56_2_2 set2.json';
import p093 from './chemistry12Papers/94 2025 56_2_3 set3.json';
import p094 from './chemistry12Papers/95 2025 56_4_1 set1.json';
import p095 from './chemistry12Papers/96 2025 56_4_2 set2.json';
import p096 from './chemistry12Papers/97 2025 56_4_3 set3.json';
import p097 from './chemistry12Papers/98 2025 56_5_1 set1.json';
import p098 from './chemistry12Papers/99 2025 56_5_2 set2.json';
import p099 from './chemistry12Papers/100 2025 56_5_3 set3.json';
import p100 from './chemistry12Papers/101 2025 56_6_1 set1.json';
import p101 from './chemistry12Papers/102 2025 56_6_2 set2.json';
import p102 from './chemistry12Papers/103 2025 56_6_3 set3.json';
import p103 from './chemistry12Papers/104 2025 56_7_1 set1.json';
import p104 from './chemistry12Papers/105 2025 56_7_2 set2.json';
import p105 from './chemistry12Papers/106 2025 56_7_3 set3.json';
import p106 from './chemistry12Papers/107 2025 56_S_1 set1.json';
import p107 from './chemistry12Papers/108 2025 56_S_2 set2.json';
import p108 from './chemistry12Papers/109 2025 56_S_3 set3.json';

const RAW = [
  p000, p001, p002, p003, p004, p005, p006, p007, p008, p009, p010,
  p011, p012, p013, p014, p015, p016, p017, p018, p019, p020, p021,
  p022, p023, p024, p025, p026, p027, p028, p029, p030, p031, p032,
  p033, p034, p035, p036, p037, p038, p039, p040, p041, p042, p043,
  p044, p045, p046, p047, p048, p049, p050, p051, p052, p053, p054,
  p055, p056, p057, p058, p059, p060, p061, p062, p063, p064, p065,
  p066, p067, p068, p069, p070, p071, p072, p073, p074, p075, p076,
  p077, p078, p079, p080, p081, p082, p083, p084, p085, p086, p087,
  p088, p089, p090, p091, p092, p093, p094, p095, p096, p097, p098,
  p099, p100, p101, p102, p103, p104, p105, p106, p107, p108,
];

// Keyed by uuid — NOT code. The same CBSE code (e.g. 56/1/1) recurs every year
// (and twice within 2019), so code alone collides across the 109 papers; uuid is
// the only unique handle.
const BY_UUID = {};
RAW.forEach((p) => { if (p && p.uuid) BY_UUID[p.uuid] = p; });

// MathJax + light base styling. The paper HTML brings its own inline styles for
// the instruction box, section headers and question tables; this only adds the
// page font, responsive images and horizontally-scrollable wide math/tables.
const HEAD = `
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<script>
  window.MathJax = { startup: { ready: function () {
    window.MathJax.startup.defaultReady();
    window.MathJax.startup.promise.then(fitWideMath);
  } } };
  function fitWideMath(){ try{ var avail=document.body.clientWidth;
    var nodes=document.querySelectorAll('mjx-container');
    for(var i=0;i<nodes.length;i++){ var c=nodes[i];
      if(c.parentNode && c.parentNode.className==='math-scroll') continue;
      var w=c.scrollWidth||c.getBoundingClientRect().width;
      if(w>avail+1){ var b=document.createElement('span'); b.className='math-scroll';
        c.parentNode.insertBefore(b,c); b.appendChild(c); } } }catch(e){} }
</script>
<script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
<style>
  *{ -webkit-tap-highlight-color:transparent; box-sizing:border-box; }
  html,body{ margin:0; max-width:100%; overflow-x:hidden; }
  body{ padding:14px 12px; background:#F4F4F5; color:#1C1C1E;
        font-family:-apple-system,Roboto,"Segoe UI",sans-serif; font-size:15px; line-height:1.6;
        overflow-wrap:break-word; word-break:break-word; }
  img{ max-width:100%; height:auto; border-radius:6px; }
  h1{ font-size:22px; }
  .math-scroll{ display:block; max-width:100%; overflow-x:auto; -webkit-overflow-scrolling:touch; }
  mjx-container{ max-width:100% !important; }
  ol,ul{ padding-left:22px; } li{ margin:3px 0; }
  hr{ border:0; border-top:1px solid #ddd; }
  table{ max-width:100%; }
  .ques_text table{ display:block; overflow-x:auto; }
  strong,b{ font-weight:700; }
</style>
`;

// Wrap a paper's raw HTML fragment in a full MathJax document. {tex}…{/tex} ->
// \( … \) so MathJax (default inline delimiters) typesets every formula.
const buildDoc = (html) =>
  `<!DOCTYPE html><html><head>${HEAD}</head><body>` +
  String(html || '').replace(/\{tex\}/g, ' \\(').replace(/\{\/tex\}/g, '\\) ') +
  `</body></html>`;

// Set number from the QP code (e.g. 56/2/3 -> "3"); falls back to the set field.
const setOf = (p) => (p.set != null ? String(p.set) : String(p.code).split('/').pop());

// Paper list for the "Last Year Papers" screen, newest year first then by code.
// Each row carries its `uuid` — the stable handle the screen passes back to
// getChemistry12PaperDoc (code is for display only and is not unique).
export function getChemistry12Papers() {
  const rows = RAW
    .map((p) => ({ uuid: p.uuid, year: p.year, code: p.code, set: setOf(p), name: p.name }))
    .sort((a, b) =>
      (b.year - a.year) || a.code.localeCompare(b.code, undefined, { numeric: true }));
  // A few 2019 codes (56/1/1, 56/1/2, 56/1/3) each appear on two genuinely
  // different papers (different uuid + questions), so year+code+set alone yields
  // indistinguishable list rows. Tag every member of a collision group with
  // variant/variantCount so the screen can label them "Paper 1 / Paper 2"
  // instead of showing the same title twice. Singletons get no variant fields.
  const groups = {};
  rows.forEach((r) => {
    const k = `${r.year}|${r.code}|${r.set}`;
    (groups[k] = groups[k] || []).push(r);
  });
  Object.values(groups).forEach((g) => {
    if (g.length > 1) g.forEach((r, i) => { r.variant = i + 1; r.variantCount = g.length; });
  });
  return rows;
}

// Full HTML doc for a paper, looked up by uuid. which = 'solutions' returns the
// answer key, anything else the question paper. Null if no local paper / html.
export function getChemistry12PaperDoc(uuid, which) {
  const p = BY_UUID[uuid];
  if (!p) return null;
  const html = which === 'solutions' ? p.answer_key_html : p.question_paper_html;
  return html ? buildDoc(html) : null;
}

export default BY_UUID;
