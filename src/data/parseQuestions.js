/**
 * parse-questions.js
 * ------------------
 * Converts the plain-text export (all_questions.txt) into structured data your
 * app can import: one JSON file per chapter (in the app's question shape) plus
 * a questionBank.js module that ties them together.
 *
 * Question shape produced (matches testQuestionScreen.js):
 *   {
 *     id: 229540,
 *     difficulty: "Hard",
 *     text: "In a car race ... $\\sqrt{...}$ ...",
 *     image: null,                         // or "images/xxxx.png" if the question is an image
 *     options: [
 *       { key: "A", label: "$\\sqrt{2 a_{1} a_{2}} t$", image: null },
 *       { key: "B", label: "", image: "images/16c887b63ae6aeed.png" },
 *       ...
 *     ],
 *     correctAnswer: null                  // text export has no answers (see notes at end)
 *   }
 *
 * RUN:
 *   node parse-questions.js                       (reads ./all_questions.txt)
 *   node parse-questions.js path/to/all_questions.txt path/to/outDir
 */

const fs = require('fs');
const path = require('path');

const INPUT = process.argv[2] || './all_questions.txt';
const OUTDIR = process.argv[3] || './physics_questions';

const reChapter = /^CHAPTER\s+(\d+):\s*(.+?)\s*$/;
const reCount = /^Questions:\s*(\d+)/i;
const reQuestion = /^Q\d+\.\s*\(id:\s*(\d+),\s*(.+?)\)\s*$/;
const reOption = /^\s*\(([A-E])\)\s?(.*)$/;
const reImage = /^\[IMAGE:\s*(.+?)\]$/i;

const safeName = (s) => s.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

function finishQuestion(q) {
  if (!q) return null;
  q.text = q._textLines.join(' ').replace(/\s+/g, ' ').trim();
  // Detect an image used as the question body
  const im = q.text.match(reImage);
  if (im) { q.image = im[1]; q.text = ''; }
  delete q._textLines;
  // Normalize options: split image vs text label
  q.options = q.options.map((o) => {
    const label = (o.label || '').trim();
    const m = label.match(reImage);
    return m ? { key: o.key, label: '', image: m[1] } : { key: o.key, label, image: null };
  });
  return q;
}

function parse(text) {
  const lines = text.split(/\r?\n/);
  const chapters = [];
  let chapter = null;
  let question = null;
  let lastOption = null;
  let mode = null; // 'qtext' | 'option'

  const pushQuestion = () => {
    if (question && chapter) chapter.questions.push(finishQuestion(question));
    question = null; lastOption = null; mode = null;
  };
  const pushChapter = () => { if (chapter) chapters.push(chapter); };

  for (const raw of lines) {
    const line = raw.replace(/\r$/, '');

    const ch = line.match(reChapter);
    if (ch) {
      pushQuestion(); pushChapter();
      chapter = { chapter_id: Number(ch[1]), chapter_name: ch[2], count: 0, questions: [] };
      continue;
    }
    if (reCount.test(line)) continue;      // "Questions: N" — informational
    if (/^=+$/.test(line.trim())) continue; // separator
    if (/^CBSE\s*>/.test(line)) continue;   // category breadcrumb

    const q = line.match(reQuestion);
    if (q) {
      pushQuestion();
      question = { id: Number(q[1]), difficulty: q[2].trim(), text: '', image: null, options: [], correctAnswer: null, _textLines: [] };
      mode = 'qtext';
      continue;
    }

    const op = line.match(reOption);
    if (op && question) {
      lastOption = { key: op[1], label: op[2] };
      question.options.push(lastOption);
      mode = 'option';
      continue;
    }

    // Continuation / blank lines
    if (line.trim() === '') continue;
    if (mode === 'option' && lastOption) {
      lastOption.label += ' ' + line.trim();
    } else if (mode === 'qtext' && question) {
      question._textLines.push(line.trim());
    }
  }
  pushQuestion(); pushChapter();
  return chapters;
}

// ---- run ----
if (!fs.existsSync(INPUT)) {
  console.error(`Input not found: ${INPUT}`);
  process.exit(1);
}
const chapters = parse(fs.readFileSync(INPUT, 'utf8'));
fs.mkdirSync(OUTDIR, { recursive: true });

let total = 0, withImageOpts = 0, missingOptions = 0;
const manifest = { subject: 'Physics (Class 11)', generated_from: 'all_questions.txt', total: 0, chapters: [] };

for (const ch of chapters) {
  ch.count = ch.questions.length;
  total += ch.count;
  for (const q of ch.questions) {
    if (q.options.some((o) => o.image)) withImageOpts++;
    if (q.options.length < 2) missingOptions++;
  }
  const file = `${ch.chapter_id}_${safeName(ch.chapter_name)}.json`;
  fs.writeFileSync(path.join(OUTDIR, file), JSON.stringify(ch, null, 2));
  manifest.chapters.push({ chapter_id: ch.chapter_id, chapter_name: ch.chapter_name, count: ch.count, file });
  console.log(`${ch.chapter_name}: ${ch.count} questions -> ${file}`);
}
manifest.total = total;
fs.writeFileSync(path.join(OUTDIR, 'index.json'), JSON.stringify(manifest, null, 2));

console.log(`\nTOTAL: ${total} questions in ${chapters.length} chapters`);
console.log(`Questions with image options: ${withImageOpts}`);
if (missingOptions) console.log(`WARNING: ${missingOptions} questions parsed with <2 options (check formatting)`);
console.log(`Output folder: ${path.resolve(OUTDIR)}`);