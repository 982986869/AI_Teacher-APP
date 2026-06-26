// src/notes/Chemistry12Notes.js
// Class 12 Chemistry revision-notes flashcards → notes format.
//
// The raw flashcards live in ./chemistry12/*.json (one file per chapter). Each
// card has { chapter, topic, text, text_html }. We group cards by topic and emit
// one section per topic, rendering each card's HTML inside it. The flashcards use
// {tex}…{/tex} math delimiters which we convert to $…$ so MathJax (in
// ChapterNotesScreen) can typeset them.

import ch01 from './chemistry12/01 Solutions.json';
import ch02 from './chemistry12/02 Electrochemistry.json';
import ch03 from './chemistry12/03 Chemical Kinetics.json';
import ch04 from './chemistry12/04 The d- and f- Block Elements.json';
import ch05 from './chemistry12/05 Coordination Compounds.json';
import ch06 from './chemistry12/06 Haloalkanes and Haloarenes.json';
import ch07 from './chemistry12/07 Alcohols Phenols and Ethers.json';
import ch08 from './chemistry12/08 Aldehydes Ketones and Carboxylic Acids.json';
import ch09 from './chemistry12/09 Amines.json';
import ch10 from './chemistry12/10 Biomolecules.json';

const RAW_CHAPTERS = [
  ch01, ch02, ch03, ch04, ch05, ch06, ch07, ch08, ch09, ch10,
];

// Some source cards have corrupted LaTeX where the leading "\\lef"/"\\r" was
// stripped, leaving bare " ight[" / " ight]" / " ight)" (for \left[ / \right] /
// \right)) and " ext{" (for \text{). The real word "right" always keeps its "r"
// (" right"), so the space-prefixed " ight<bracket>" form is unambiguous to fix.
const fixArtifacts = (s = '') =>
  s
    .replace(/ ight\[/g, ' \\left[')
    .replace(/ ight\(/g, ' \\left(')
    .replace(/ ight\]/g, ' \\right]')
    .replace(/ ight\)/g, ' \\right)')
    .replace(/ ext\{/g, ' \\text{');

// Convert {tex}…{/tex} → \(…\) for MathJax, matching MathText.js. Display blocks
// already using $$…$$ in the source are left untouched (the notes WebView's
// MathJax is configured for both $…$/$$…$$ and \(…\)/\[…\] delimiters).
const convertTex = (s = '') =>
  s.replace(/\{tex\}/g, ' \\(').replace(/\{\/tex\}/g, '\\) ');

const clean = (s = '') => convertTex(fixArtifacts(s));

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
const Chemistry12Notes = {};
RAW_CHAPTERS.forEach((cards) => {
  if (Array.isArray(cards) && cards.length > 0 && cards[0].chapter) {
    Chemistry12Notes[cards[0].chapter] = cardsToNotes(cards);
  }
});

export default Chemistry12Notes;
