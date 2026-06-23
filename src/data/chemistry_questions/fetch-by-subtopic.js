/**
 * fetch-by-subtopic.js
 * --------------------
 * Re-fetches questions PER SUB-TOPIC so each question gets tagged with its
 * topicId + topicName — which your offline files are currently missing.
 * Also grabs the correct answer for each question in the same pass.
 *
 * It reads the sub-topic ids that are ALREADY in your chapter files (the
 * `topics` array), calls the paginate endpoint once per sub-topic, and writes
 * new offline files where every question knows its sub-topic AND its answer.
 *
 * OUTPUT (per chapter): <chapter>.by_topic.json
 *   { chapter_id, chapter_name, topics: [ { topicId, topicName, questions: [
 *       { id, question, options:[{id,option}], topicId, topicName,
 *         correctOptionId, correctAnswer, explanation } ] } ] }
 *
 * REQUIRES Node 18+. Runs on YOUR machine with YOUR token.
 *
 * RUN:
 *   1. Put this file + your 12 chapter JSONs + index.json in one folder.
 *   2. Paste AUTH_TOKEN and COOKIE below.
 *   3. Test:  node fetch-by-subtopic.js --test   (one sub-topic only, to verify it works)
 *   4. Full:  node fetch-by-subtopic.js
 *   Resumable: progress saved to subtopic_progress.json; re-run to continue.
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
  // Cookie-session + CSRF token auth (no Authorization header).
  CSRF_TOKEN: 'PASTE_X_CSRFTOKEN_HERE',
  COOKIE: 'PASTE_COOKIE_HEADER_VALUE_HERE',

  DIR: '.',
  INDEX_FILE: 'index.json',
  REFERER: 'https://web.examin8.com/i/376735/ailernova/batch/21884/resources/1340/practice-topic-list',

  // questions per sub-topic come from paginate with the sub-topic id as the category:
  QUESTIONS_URL: (topicId, page) =>
    `https://web.examin8.com/v1/practice/question/category/${topicId}/paginate/?page=${page}`,
  // answers come from attempted/ (same as before):
  ATTEMPTED_URL: 'https://web.examin8.com/v1/practice/attempted/',

  FETCH_ANSWERS: true,   // set false to only tag by topic and skip answers (much faster)

  PAGE_PARAM: 'page',
  DELAY_MS: 350,
  MAX_RETRIES: 3,
  MAX_PAGES: 200,
};

const LETTERS = 'ABCDEFGHIJ'.split('');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const loadJSON = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const saveJSON = (f, d) => fs.writeFileSync(f, JSON.stringify(d, null, 2));

function headers(json) {
  const h = {
    Accept: 'application/json, text/plain, */*',
    'X-CSRFToken': CONFIG.CSRF_TOKEN,
    Cookie: CONFIG.COOKIE,
    Origin: 'https://web.examin8.com',
    Referer: CONFIG.REFERER,
  };
  if (json) h['Content-Type'] = 'application/json';
  return h;
}

async function getJSON(url) {
  for (let a = 1; a <= CONFIG.MAX_RETRIES; a++) {
    try {
      const res = await fetch(url, { headers: headers(false) });
      if (res.status === 401 || res.status === 403)
        throw Object.assign(new Error('AUTH'), { fatal: true, status: res.status });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) { if (e.fatal) throw e; if (a === CONFIG.MAX_RETRIES) throw e; await sleep(CONFIG.DELAY_MS * a * 2); }
  }
}

function pageItems(j) {
  for (const k of ['data', 'results', 'questions', 'items']) if (Array.isArray(j[k])) return j[k];
  return Array.isArray(j) ? j : [];
}

async function fetchTopicQuestions(topicId) {
  const all = [];
  const seen = new Set();
  let page = 1, size = null;
  while (page <= CONFIG.MAX_PAGES) {
    const j = await getJSON(CONFIG.QUESTIONS_URL(topicId, page));
    const items = pageItems(j);
    if (!items.length) break;
    if (size === null) size = items.length;
    for (const q of items) if (!seen.has(q.id)) { seen.add(q.id); all.push(q); }
    if (j.next === null || j.has_next === false) break;
    if (items.length < size) break;
    page++; await sleep(CONFIG.DELAY_MS);
  }
  return all;
}

async function fetchAnswer(q, topicId) {
  const opts = q.options || [];
  if (!opts.length) return {};
  const body = { question: q.id, option: opts[0].id, time_taken: 4, category: topicId };
  try {
    const res = await fetch(CONFIG.ATTEMPTED_URL, { method: 'POST', headers: headers(true), body: JSON.stringify(body) });
    if (res.status === 401 || res.status === 403) throw Object.assign(new Error('AUTH'), { fatal: true, status: res.status });
    if (!res.ok) return {};
    const j = await res.json();
    const idx = opts.findIndex((o) => String(o.id) === String(j.correct_option));
    return { correctOptionId: j.correct_option, correctAnswer: idx >= 0 ? LETTERS[idx] : null, explanation: j.explanation || '' };
  } catch (e) { if (e.fatal) throw e; return {}; }
}

async function main() {
  const test = process.argv.includes('--test');
  if (!CONFIG.CSRF_TOKEN || !CONFIG.COOKIE || CONFIG.COOKIE.startsWith('PASTE_')) {
    console.error('\n  Set CSRF_TOKEN and COOKIE at the top first.\n'); process.exit(1);
  }

  const index = loadJSON(path.join(CONFIG.DIR, CONFIG.INDEX_FILE));
  let chapters = index.chapters || [];

  const progPath = path.join(CONFIG.DIR, 'subtopic_progress.json');
  const progress = fs.existsSync(progPath) ? loadJSON(progPath) : {}; // { topicId: true }

  for (const ch of chapters) {
    const chData = loadJSON(path.join(CONFIG.DIR, ch.file));
    const topics = chData.topics || [];
    const outFile = ch.file.replace(/\.json$/i, '') + '.by_topic.json';
    const outPath = path.join(CONFIG.DIR, outFile);
    const out = fs.existsSync(outPath) ? loadJSON(outPath)
      : { chapter_id: ch.chapter_id, chapter_name: ch.chapter_name, topics: [] };

    let topicList = topics;
    if (test) topicList = topics.slice(0, 1); // just the first sub-topic in test mode

    for (const t of topicList) {
      if (progress[t.id]) { console.log(`= ${ch.chapter_name} / ${t.name}: done, skipping`); continue; }
      process.stdout.write(`> ${ch.chapter_name} / ${t.name} (id ${t.id}) ... `);
      let qs;
      try { qs = await fetchTopicQuestions(t.id); }
      catch (e) {
        if (e.fatal) { console.error(`\n  Auth failed (HTTP ${e.status}). Re-copy token+cookie, run again.\n`); saveJSON(outPath, out); saveJSON(progPath, progress); process.exit(1); }
        console.log(`FAILED (${e.message})`); continue;
      }

      const tagged = [];
      for (const q of qs) {
        const rec = { id: q.id, question: q.question ?? q.question_raw ?? '',
          difficulty: q.difficulty_label ?? q.difficulty ?? null,
          options: (q.options || []).map((o) => ({ id: o.id, option: o.option ?? o.text ?? '' })),
          topicId: t.id, topicName: t.name };
        if (CONFIG.FETCH_ANSWERS) {
          try { Object.assign(rec, await fetchAnswer(q, t.id)); }
          catch (e) { if (e.fatal) { console.error(`\n  Auth failed during answers. Re-copy token, run again.\n`); saveJSON(outPath, out); saveJSON(progPath, progress); process.exit(1); } }
          await sleep(CONFIG.DELAY_MS);
        }
        tagged.push(rec);
      }

      out.topics = out.topics.filter((x) => x.topicId !== t.id);
      out.topics.push({ topicId: t.id, topicName: t.name, count: tagged.length, questions: tagged });
      saveJSON(outPath, out);
      progress[t.id] = true; saveJSON(progPath, progress);
      console.log(`${tagged.length} questions  (expected ${t.total_questions})`);
    }

    if (test) { console.log('\nTEST done (one sub-topic). Check the .by_topic.json output, then run without --test.'); return; }
    console.log(`  wrote ${outFile}`);
  }
  console.log('\nAll done. Each <chapter>.by_topic.json has questions grouped by sub-topic, tagged + answered.');
}

main().catch((e) => { console.error('\nError:', e); process.exit(1); });