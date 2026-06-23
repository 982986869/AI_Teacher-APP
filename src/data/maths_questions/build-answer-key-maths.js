/**
 * build-answer-key-maths.js
 * -----------------------------
 * Fetches the REAL correct answer for every MATHS question from your own API
 * (the /v1/practice/attempted/ endpoint) and writes offline answer files:
 *
 *   1) answer_key_maths.json        -> { questionId: { correctAnswer, correctOptionId, explanation } }
 *   2) <chapter>.with_answers.json      -> chapter questions, each with correctAnswer added
 *   3) answers_maths.txt            -> readable answer sheet, in question order, per chapter
 *
 * Same logic as the physics script — only the folder + output names differ.
 *
 * IMPORTANT: runs on YOUR machine. Needs your network + Authorization token + Cookie.
 * REQUIRES Node.js 18+ (built-in fetch).
 *
 * RUN:
 *   1. Put this file + your 12 maths chapter JSONs + index.json in one folder
 *      (the chemistry_questions folder).
 *   2. Paste AUTH_TOKEN and COOKIE below.
 *   3. Test:  node build-answer-key-maths.js --test
 *   4. Full:  node build-answer-key-maths.js
 *   Resumable: if it stops, just run it again (progress saved every 25).
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
  // Cookie-session + CSRF token auth (no Authorization header).
  CSRF_TOKEN: 'PASTE_X_CSRFTOKEN_HERE',
  COOKIE: 'PASTE_COOKIE_HEADER_VALUE_HERE',

  DIR: '.',                          // folder with maths index.json + chapter JSONs
  INDEX_FILE: 'index.json',
  ENDPOINT: 'https://web.examin8.com/v1/practice/attempted/',
  REFERER: 'https://web.examin8.com/i/376735/ailernova/batch/21884/resources/1340/practice-topic-list',

  KEY_FILE: 'answer_key_maths.json',
  TXT_FILE: 'answers_maths.txt',

  CONCURRENCY: 2,
  DELAY_MS: 350,
  MAX_RETRIES: 3,
  SAVE_EVERY: 25,
};

const LETTERS = 'ABCDEFGHIJ'.split('');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const loadJSON = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const saveJSON = (f, d) => fs.writeFileSync(f, JSON.stringify(d, null, 2));

function plain(s) {
  if (s == null) return '';
  return String(s)
    .replace(/\{tex\}([\s\S]*?)\{\/tex\}/g, '$1')
    .replace(/<sup[^>]*>([\s\S]*?)<\/sup>/g, '^($1)')
    .replace(/<sub[^>]*>([\s\S]*?)<\/sub>/g, '_($1)')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ').trim();
}

async function fetchCorrect(question, categoryId) {
  const opts = question.options || [];
  if (!opts.length) return { error: 'no options' };
  const body = {
    question: question.id,
    option: opts[0].id,                 // any valid option; server returns the true correct_option
    time_taken: 3 + Math.floor(Math.random() * 6),
    category: categoryId,
  };
  for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(CONFIG.ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, text/plain, */*',
          'X-CSRFToken': CONFIG.CSRF_TOKEN,
          Cookie: CONFIG.COOKIE,
          Origin: 'https://web.examin8.com',
          Referer: CONFIG.REFERER,
        },
        body: JSON.stringify(body),
      });
      if (res.status === 401 || res.status === 403)
        throw Object.assign(new Error('AUTH_FAILED'), { fatal: true, status: res.status });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      const correctId = j.correct_option;
      const idx = opts.findIndex((o) => String(o.id) === String(correctId));
      return {
        correctOptionId: correctId,
        correctAnswer: idx >= 0 ? LETTERS[idx] : null,
        explanation: j.explanation || '',
      };
    } catch (err) {
      if (err.fatal) throw err;
      if (attempt === CONFIG.MAX_RETRIES) return { error: err.message };
      await sleep(CONFIG.DELAY_MS * attempt * 2);
    }
  }
}

async function main() {
  const test = process.argv.includes('--test');
  if (!CONFIG.CSRF_TOKEN || !CONFIG.COOKIE || CONFIG.COOKIE.startsWith('PASTE_')) {
    console.error('\n  Set CSRF_TOKEN and COOKIE at the top first.\n');
    process.exit(1);
  }

  const index = loadJSON(path.join(CONFIG.DIR, CONFIG.INDEX_FILE));
  const chapters = index.chapters || [];

  const cache = {};
  const work = [];
  for (const ch of chapters) {
    const fp = path.join(CONFIG.DIR, ch.file);
    if (!fs.existsSync(fp)) { console.warn('missing:', ch.file); continue; }
    const data = loadJSON(fp);
    cache[ch.file] = data;
    for (const q of data.questions || []) work.push({ q, cat: ch.chapter_id });
  }

  const keyPath = path.join(CONFIG.DIR, CONFIG.KEY_FILE);
  const answerKey = fs.existsSync(keyPath) ? loadJSON(keyPath) : {};
  let queue = work.filter((w) => !(String(w.q.id) in answerKey));
  if (test) queue = queue.slice(0, 5);

  console.log(`Total: ${work.length} | done: ${Object.keys(answerKey).length} | this run: ${queue.length}${test ? ' (TEST)' : ''}`);

  let done = 0, ok = 0, fail = 0, cursor = 0;
  async function worker() {
    while (cursor < queue.length) {
      const { q, cat } = queue[cursor++];
      let r;
      try { r = await fetchCorrect(q, cat); }
      catch (e) {
        if (e.fatal) { console.error(`\n  Auth failed (HTTP ${e.status}). Re-copy token+cookie and run again.\n`); saveJSON(keyPath, answerKey); process.exit(1); }
        r = { error: e.message };
      }
      done++;
      if (r.error) { fail++; console.log(`  [${done}/${queue.length}] q${q.id} ERROR ${r.error}`); }
      else {
        ok++;
        answerKey[q.id] = { correctAnswer: r.correctAnswer, correctOptionId: r.correctOptionId, explanation: r.explanation };
        if (test) console.log(`  [${done}/${queue.length}] q${q.id} -> ${r.correctAnswer} (optId ${r.correctOptionId})`);
      }
      if (done % CONFIG.SAVE_EVERY === 0) { saveJSON(keyPath, answerKey); console.log(`  ...${done}/${queue.length} (ok ${ok}, fail ${fail})`); }
      await sleep(CONFIG.DELAY_MS);
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, CONFIG.CONCURRENCY) }, worker));
  saveJSON(keyPath, answerKey);
  console.log(`\nFetched. ok=${ok} fail=${fail}. ${CONFIG.KEY_FILE} written.`);

  if (test) { console.log('\nTest done. Re-run without --test for all questions.'); return; }

  const txt = [];
  for (const ch of chapters) {
    const data = cache[ch.file];
    if (!data) continue;
    txt.push('='.repeat(70), `CHAPTER ${ch.chapter_id}: ${ch.chapter_name}`, '='.repeat(70), '');
    (data.questions || []).forEach((q, i) => {
      const rec = answerKey[q.id];
      if (rec) { q.correctAnswer = rec.correctAnswer; q.correctOptionId = rec.correctOptionId; q.explanation = rec.explanation; }
      const ans = rec ? (rec.correctAnswer ?? '?') : '(not fetched)';
      txt.push(`Q${i + 1}. (id:${q.id})  ANSWER: ${ans}`);
      txt.push(`   ${plain(q.question).slice(0, 200)}`);
      (q.options || []).forEach((o, oi) => txt.push(`   (${LETTERS[oi]}) ${plain(o.option).slice(0, 120)}`));
      txt.push('');
    });
    const out = ch.file.replace(/\.json$/i, '') + '.with_answers.json';
    saveJSON(path.join(CONFIG.DIR, out), data);
    console.log(`  wrote ${out}`);
  }
  fs.writeFileSync(path.join(CONFIG.DIR, CONFIG.TXT_FILE), txt.join('\n'));
  console.log(`  wrote ${CONFIG.TXT_FILE}`);

  const unmatched = Object.values(answerKey).filter((r) => r.correctAnswer == null).length;
  console.log(`\nDone. Answers in ${CONFIG.KEY_FILE}, *.with_answers.json, and ${CONFIG.TXT_FILE}.`);
  if (unmatched) console.log(`Note: ${unmatched} answers had a correct_option id not found in the options list (saved as null).`);
}

main().catch((e) => { console.error('\nError:', e); process.exit(1); });