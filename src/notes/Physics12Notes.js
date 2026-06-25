// src/notes/Physics12Notes.js
// Class 12 Physics revision-notes flashcards → notes format.
//
// The raw flashcards live in ./physics12/*.json (one file per chapter). Each card
// has { chapter, topic, text, text_html }. We group cards by topic and emit one
// section per topic, rendering each card's HTML inside it. The flashcards use
// {tex}…{/tex} math delimiters which we convert to $…$ so MathJax (in
// ChapterNotesScreen) can typeset them.

import ch01 from './physics12/01 Electric Charges and Fields.json';
import ch02 from './physics12/02 Electrostatic Potential and Capacitance.json';
import ch03 from './physics12/03 Current Electricity.json';
import ch04 from './physics12/04 Moving Charges and Magnetism.json';
import ch05 from './physics12/05 Magnetism and Matter.json';
import ch06 from './physics12/06 Electromagnetic Induction.json';
import ch07 from './physics12/07 Alternating Current.json';
import ch08 from './physics12/08 Electromagnetic Waves.json';
import ch09 from './physics12/09 Ray Optics and Optical Instruments.json';
import ch10 from './physics12/10 Wave Optics.json';
import ch11 from './physics12/11 Dual Nature of Radiation and Matter.json';
import ch12 from './physics12/12 Atoms.json';
import ch13 from './physics12/13 Nuclei.json';
import ch14 from './physics12/14 Electronic Devices.json';

import Physics12Images from './physics12/Physics12Images';

const RAW_CHAPTERS = [
  ch01, ch02, ch03, ch04, ch05, ch06, ch07,
  ch08, ch09, ch10, ch11, ch12, ch13, ch14,
];

// Convert {tex}…{/tex} → $…$ for MathJax. Display blocks already using $$…$$
// in the source are left untouched.
const convertTex = (s = '') =>
  s.replace(/\{tex\}/g, '$').replace(/\{\/tex\}/g, '$');

// Swap remote <img src="…media-mycbseguide…/X.jpg"> for the bundled base64 data
// URI so images render offline. Inline width/height styles are dropped so the
// stylesheet controls sizing.
const localiseImages = (s = '') =>
  s.replace(/<img\b[^>]*?>/gi, (tag) => {
    const m = tag.match(/src="([^"]+)"/i);
    if (!m) return tag;
    const base = m[1].split('/').pop();
    const data = Physics12Images[base];
    if (!data) return tag; // unknown image — leave original (falls back to network)
    return `<img src="${data}" class="note-img" />`;
  });

const clean = (s = '') => localiseImages(convertTex(s));

// Turn a flat list of flashcards into { intro, sections } grouped by topic.
const cardsToNotes = (cards) => {
  const order = [];
  const byTopic = {};

  cards.forEach((card) => {
    const topic = (card.topic && card.topic.trim()) || 'Notes';
    if (!byTopic[topic]) {
      byTopic[topic] = [];
      order.push(topic);
    }
    byTopic[topic].push(card);
  });

  const sections = order.map((topic) => ({
    title: topic,
    html: byTopic[topic]
      .map((card) => `<div class="card">${clean(card.text_html || card.text || '')}</div>`)
      .join(''),
  }));

  return { intro: 'Revision Notes — Flashcards', sections };
};

// Build a map keyed by the exact chapter name (matches SUBJECTS chapter names).
const Physics12Notes = {};
RAW_CHAPTERS.forEach((cards) => {
  if (Array.isArray(cards) && cards.length > 0 && cards[0].chapter) {
    Physics12Notes[cards[0].chapter] = cardsToNotes(cards);
  }
});

export default Physics12Notes;
