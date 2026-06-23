// merge-export.js (one-off)
// Combines the complete examin8 chemistry export (questions + sub-topics, all
// 12 chapters) with answer_key_chemistry.json (answers by question id) and
// writes <chapter>.by_topic.json files in the shape subtopicBank.js expects.
//
// RUN: node merge-export.js
const fs = require('fs');
const path = require('path');

const EXPORT_DIR = 'C:/Users/komal jha/Downloads/examin8_chemistry_export (1)/examin8_chemistry_export';
const OUT_DIR = __dirname;
const LETTERS = 'ABCDEFGHIJ'.split('');

const all = JSON.parse(fs.readFileSync(path.join(EXPORT_DIR, 'ALL_Chemistry.json'), 'utf8'));
const ak = JSON.parse(fs.readFileSync(path.join(OUT_DIR, 'answer_key_chemistry.json'), 'utf8'));

// Map chapter id -> export json filename base (so output names match subtopicBank imports).
const jsonFiles = fs.readdirSync(path.join(EXPORT_DIR, 'json')).filter((f) => f.endsWith('.json'));
const baseById = {};
for (const f of jsonFiles) {
  const m = f.match(/^(\d+)_/);
  if (m) baseById[m[1]] = f.replace(/\.json$/i, '');
}

let totalQ = 0, answered = 0;
for (const ch of all.chapters) {
  const base = baseById[String(ch.id)] || `${ch.id}_${ch.name.replace(/[^A-Za-z0-9]+/g, '_')}`;
  const topics = (ch.subtopics || []).map((st) => {
    const questions = (st.questions || []).map((q) => {
      totalQ++;
      const rec = ak[String(q.id)] || {};
      const correctOptionId = rec.correctOptionId ?? null;
      const idx = correctOptionId != null
        ? (q.options || []).findIndex((o) => String(o.id) === String(correctOptionId))
        : -1;
      if (idx >= 0) answered++;
      return {
        id: q.id,
        question: q.question_raw ?? q.question ?? '',
        difficulty: q.difficulty ?? null,
        options: (q.options || []).map((o) => ({ id: o.id, option: o.text ?? '' })),
        topicId: st.id,
        topicName: st.name,
        correctOptionId,
        correctAnswer: idx >= 0 ? LETTERS[idx] : null,
        explanation: rec.explanation ?? '',
      };
    });
    return { topicId: st.id, topicName: st.name, count: questions.length, questions };
  });
  const out = { chapter_id: ch.id, chapter_name: ch.name, topics };
  fs.writeFileSync(path.join(OUT_DIR, `${base}.by_topic.json`), JSON.stringify(out));
  console.log(`wrote ${base}.by_topic.json — ${topics.length} sub-topics, ${topics.reduce((n, t) => n + t.count, 0)} questions`);
}
console.log(`\nDone. ${totalQ} questions total, ${answered} with answers (${Math.round(answered / totalQ * 100)}%).`);
