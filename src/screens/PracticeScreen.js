import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, StatusBar, Platform, ActivityIndicator, Modal } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { getQuestionsByPath, getChapters } from '../api/resourcesApi';
import { buildFragmentFromQuestions, buildPyqDocument } from '../utils/pyqDocument';
import { useClassSubjects, toTile } from '../utils/classSubjects';
import { getMcqChapterTest, getMcqSubtopicTest, submitMcqTest } from '../api/mcqPracticeApi';
// Class 12 Chemistry & Mathematics are DB/API-backed. We only keep the bundled
// chapter-name lists (their slugs match the DB) to drive the menus; all PYQ /
// Important / Practice / Mock content resolves through the API.
import McqTestScreen from './McqTestScreen';
import McqQuizScreen from './McqQuizScreen';
import TestQuestionScreen from './TestQuestionScreen';
import MockResultScreen from './MockResultScreen';
import ChapterListScreen from './ChapterListScreen';
import OnlineTestsScreen from './OnlineTestsScreen';
import OnlineTestScreen from './OnlineTestScreen';
import OnlineTestReview from './OnlineTestReview';
import ChapterPracticeScreen from './ChapterPracticeScreen';
import QuestionSolveScreen from './QuestionSolveScreen';
import { submitOfflineTest } from '../api/offlineTestApi';
import MockTestsCards from './Class11MockTests';
import PracticeTestsCards from './Class11PracticeTests';
import { getQuestions, allQuestions } from '../data/questionBank';
import { getMcqQuestions } from '../data/mcqQuestions';
import { getSubtopicTest } from '../data/subtopicBank';
import { listMockTests, getMockTestQuestions, listMockAttempts, submitMockTest } from '../api/mockTestsApi';
import { useAuth } from '../context/AuthContext';
import { saveOnlineTestAttempt, savePracticeAttempt, practiceAttemptKey } from '../utils/storage';
import { ClassTabs, ComingSoon } from '../components/ClassPicker';
import { S } from '../theme/studentUI';
import { COLORS } from '../theme/designSystem';
import { FONT } from '../constants/fonts';
import { ListChecks, Star, Timer, ClipboardList, History, ChevronRight, ChevronLeft } from 'lucide-react-native';

// The `mcq-question-dark` canvas, shared with McqQuizScreen so the loading state
// that precedes it doesn't flash a light screen. Same value as COLORS.background.
const MCQ_CANVAS = COLORS.background;

// Dark reskin of the Practice LANDING page + the PYQ / Important Questions subject
// and chapter lists (the "practice-home-dark" / "subject-selection-dark" /
// "chapter-tests-dark" references) â€” same opt-in-per-screen technique as
// Profile/KnowledgeAsk/Login/Signup/Class11PracticeTests. The subject cards keep
// each subject's own existing `bg` colour + emoji (already distinct per subject,
// reads fine on dark) â€” only the screen chrome around them changes. MCQ practice
// already lives in Class11PracticeTests.js (dark). Mock Tests, Online Tests and
// the actual question WebView content (PyqWebView) are untouched for now.
const D = {
  canvas: COLORS.background, card: 'rgba(255,255,255,0.05)',
  ink: COLORS.textPrimary, sub: COLORS.textSecondary, muted: COLORS.textSecondary,
  faint: 'rgba(255,255,255,0.38)', hair: 'rgba(255,255,255,0.10)',
  indigo: COLORS.primary, indigoSoft: 'rgba(124,58,237,0.16)',
  blue: '#60A5FA', blueSoft: 'rgba(96,165,250,0.16)',
  cyan: '#22D3EE', cyanSoft: 'rgba(34,211,238,0.16)',
  purple: '#C084FC', purpleSoft: 'rgba(192,132,252,0.16)',
  rose: '#FB7185', roseSoft: 'rgba(251,113,133,0.16)',
  gold: '#F5C451', goldSoft: 'rgba(245,196,81,0.16)',
};
const SUBJECT_TINTS = [{ tint: '#22D3EE', soft: 'rgba(34,211,238,0.16)' }, { tint: '#C084FC', soft: 'rgba(192,132,252,0.16)' }];

// Subjects with DB-backed mock tests (served by mockTestsApi). The Mock Test
// button opens a subject -> mock list flow that runs each test through the
// shared (sectioned) McqTestScreen.
const DB_MOCK_SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Science', 'Social Science',
  'à¤¹à¤¿à¤‚à¤¦à¥€ à¤', 'à¤¹à¤¿à¤‚à¤¦à¥€ à¤¬', 'Information Technology (402)', 'English Language and Literature'];
const MOCK_QUIZ_COUNT = 10;

// Class 10 mock-test subjects (DB-backed via mock_tests, class_level=10). The mock
// section shows these instead of the Class 11/12 science list when Class 10 is active.
const MOCK_SUBJECTS_CLASS10 = [
  { name: 'Mathematics',                     emoji: 'ðŸ“', bg: '#444' },
  { name: 'Science',                         emoji: 'ðŸ”¬', bg: '#5AA84F' },
  { name: 'Social Science',                  emoji: 'ðŸŒ', bg: '#2F80ED' },
  { name: 'à¤¹à¤¿à¤‚à¤¦à¥€ à¤',                          emoji: 'ðŸ“š', bg: '#2F80ED' },
  { name: 'à¤¹à¤¿à¤‚à¤¦à¥€ à¤¬',                          emoji: 'ðŸ“š', bg: '#0F6E56' },
  { name: 'Information Technology (402)',     emoji: 'ðŸ’»', bg: S.ink },
  { name: 'English Language and Literature', emoji: 'ðŸ“–', bg: '#5A67E8' },
];

// Compute a sectioned result from the test submission. Uses each question's
// correctAnswer when available; otherwise counts as unanswered/incorrect.
function computeMockResult(payload) {
  const qs = payload?.questions || [];
  const answers = payload?.answers || {};
  const SECT = ['A', 'B', 'C'];
  const blank = () => ({ correct: 0, incorrect: 0, unanswered: 0, total: 0 });
  const bySec = { A: blank(), B: blank(), C: blank() };
  let correct = 0, incorrect = 0, unanswered = 0;

  qs.forEach((q) => {
    const sec = SECT.includes(q.section) ? q.section : 'A';
    const picked = answers[q.id];
    const key = q.correctAnswer || q.correct || null; // letter A/B/C/D if present
    bySec[sec].total += 1;
    if (picked == null) { bySec[sec].unanswered += 1; unanswered += 1; }
    else if (key && picked === key) { bySec[sec].correct += 1; correct += 1; }
    else { bySec[sec].incorrect += 1; incorrect += 1; }
  });

  const sections = SECT.map((id) => ({ id, ...bySec[id] })).filter((s) => s.total > 0);
  return { correct, incorrect, unanswered, total: qs.length, sections };
}

// Slug must match how rows were inserted (scripts/importResources.js slugify).
// Slug for API lookups. Non-ASCII names (e.g. Devanagari "à¤¹à¤¿à¤‚à¤¦à¥€ (à¤®à¤²à¥à¤¹à¤¾à¤°)") produce
// an empty base, so fall back to a stable hash slug. MUST stay byte-identical to the
// seed's slugify (scripts/seedClass7IQPractice.js) so client lookups match DB slugs.
const slugify = (s) => {
  // Normalize dashes/curly-quotes to ASCII so a stray em-dash doesn't count as
  // non-ASCII; then, if real Devanagari remains, append a stable hash so
  // Devanagari-heavy names whose only ASCII is a marker like "(R1)" stay unique.
  const str = String(s).replace(/[\u2013\u2014\u00AD\u2011]/g, '-').replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
  const base = str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (base && !/[^\x00-\x7F]/.test(str)) return base;
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0;
  const hash = 'u' + h.toString(36);
  return base ? base + '-' + hash : hash;
};

// 'Class 8' â†’ 8; null when unknown (never defaults to a class â€” the backend uses the
// student's saved class regardless of what we send).
const classNum = (c) => parseInt(String(c || '').replace(/\D/g, ''), 10) || null;

// Subject â†’ API slug. 'Old - à¤¹à¤¿à¤‚à¤¦à¥€ à¤' and 'Old - à¤¹à¤¿à¤‚à¤¦à¥€ à¤¬' both slugify to "old"
// (the ASCII "Old" prefix blocks the Devanagari hash fallback), so they need
// explicit slugs matching the seed (scripts/seedClass9Old*.js).
// 'Old - à¤¹à¤¿à¤‚à¤¦à¥€' (Class 6) seeds to slug "old" (the seed's slugify returns the ASCII
// base immediately), but the client slugify appends a hash for Devanagari names â†’
// "old-uâ€¦". Pin it so navigation matches the DB. Class 9 à¤/à¤¬ likewise.
const SUBJECT_SLUG_OVERRIDES = { 'Old - à¤¹à¤¿à¤‚à¤¦à¥€': 'old', 'Old - à¤¹à¤¿à¤‚à¤¦à¥€ à¤': 'old-hindi-a', 'Old - à¤¹à¤¿à¤‚à¤¦à¥€ à¤¬': 'old-hindi-b' };
const subjectSlug = (name) => SUBJECT_SLUG_OVERRIDES[name] || slugify(name);

// Classes whose subject lists are derived from the DB (/api/resources/class-subjects)
// instead of hardcoded arrays. Class 6 & 9 "Old -" subjects live here.
const DYNAMIC_CLASSES = [6, 9];

// buildFragmentFromQuestions + buildPyqDocument now live in utils/pyqDocument so
// ResourcesScreen (Exemplar) can reuse the exact same card rendering.

// Biology is not offered in Class 12 (PCM stream) â€” drop it from any subject list
// when Class 12 is selected. Mirrors the same filter in ResourcesScreen. Works for
// both object lists ({ name }) and plain string lists.
const dropBioForClass = (list, cls) =>
  list.filter((sub) => !(cls === 'Class 12' && (sub.name || sub) === 'Biology'));

// â”€â”€ Previous Year Papers: 4 subjects, each with its chapter list â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Chapter lists mirror src/screens/ResourcesScreen.js SUBJECTS so the two stay
// consistent. Update both if the syllabus changes.
const PYQ_SUBJECTS = [
  {
    name: 'Physics', emoji: 'âš›ï¸', bg: S.ink,
    chapters: [
      'Units and Measurements',
      'Motion in A Straight Line',
      'Motion in A Plane',
      'Laws of Motion',
      'Work Energy and Power',
      'System of Particles and Rotational Motion',
      'Gravitation',
      'Mechanical Properties of Solids',
      'Mechanical Properties of Fluids',
      'Thermal Properties of Matter',
      'Thermodynamics',
      'Kinetic Theory',
      'Oscillations',
      'Waves',
    ],
  },
  {
    name: 'Chemistry', emoji: 'ðŸ§ª', bg: '#333',
    chapters: [
      'Some Basic Concepts of Chemistry',
      'Structure of Atom',
      'Classification of Elements and Periodicity in Properties',
      'Chemical Bonding and Molecular Structure',
      'States of Matter - Gases and Liquids (FA ONLY)',
      'Chemical Thermodynamics',
      'Equilibrium',
      'Redox Reactions',
      'Hydrogen',
      'The s-Block Elements (FA ONLY)',
      'Some p-Block Elements (FA ONLY)',
      'Organic Chemistry Some Basic Principles and Techniques',
      'Hydrocarbons',
      'Environmental Chemistry',
    ],
  },
  {
    name: 'Mathematics', emoji: 'ðŸ“', bg: '#444',
    chapters: [
      'Sets',
      'Relations and Functions',
      'Trigonometric Functions',
      'Complex Numbers and Quadratic Equations',
      'Linear Inequalities',
      'Permutations and Combinations',
      'Binomial Theorem',
      'Sequences and Series',
      'Straight Lines',
      'Conic Sections',
      'Introduction to Three Dimensional Geometry',
      'Limits and Derivatives',
      'Statistics',
      'Probability',
    ],
  },
  {
    name: 'Biology', emoji: 'ðŸ§¬', bg: '#555',
    chapters: [
      'The Living World',
      'Biological Classification',
      'Plant Kingdom',
      'Animal Kingdom',
      'Morphology of Flowering Plants',
      'Anatomy of Flowering Plants',
      'Structural Organisation in Animals',
      'Cell The Unit of Life',
      'Biomolecules',
      'Cell Cycle and Cell Division',
      'Photosynthesis in Higher Plants',
      'Respiration in Plants',
      'Plant Growth and Development',
      'Digestion and Absorption (FA ONLY)',
      'Breathing and Exchange of Gases',
      'Body Fluids and Circulation',
      'Excretory Products and their Elimination',
      'Locomotion and Movement',
      'Neural Control and Coordination',
      'Chemical Coordination and Integration',
    ],
  },
];

// Class 12 Physics chapters (NCERT order). PYQ / Important Questions are now
// served from the DB (class_level=12) via the same API as Class 11; the rest of
// Class 12 isn't added yet, so other subjects show "coming soon".
const PHYSICS12_IMP_CHAPTERS = [
  'Electric Charges and Fields',
  'Electrostatic Potential and Capacitance',
  'Current Electricity',
  'Moving Charges and Magnetism',
  'Magnetism and Matter',
  'Electromagnetic Induction',
  'Alternating Current',
  'Electromagnetic Waves',
  'Ray Optics and Optical Instruments',
  'Wave Optics',
  'Dual Nature of Radiation and Matter',
  'Atoms',
  'Nuclei',
  'Electronic Devices',
];

// Class 12 Chemistry chapters (NCERT order). DB/API-backed like Physics: the PYQ /
// Important question content is fetched from the API per chapter (data seeded at
// class_level=12). This hardcoded menu list mirrors the seeded chapters; their
// slugs match the DB so availability + questions resolve through the API.
const CHEMISTRY12_CHAPTERS = [
  'Solutions',
  'Electrochemistry',
  'Chemical Kinetics',
  'The d- and f- Block Elements',
  'Coordination Compounds',
  'Haloalkanes and Haloarenes',
  'Alcohols Phenols and Ethers',
  'Aldehydes Ketones and Carboxylic Acids',
  'Amines',
  'Biomolecules',
];

// Class 12 Mathematics PYQ / Important-Questions chapters (NCERT order). The
// actual chapter list shown is fetched from the DB by ChapterList; this inline
// list only drives the "N chapters" count on the subject card â€” same pattern as
// PHYSICS12_IMP_CHAPTERS / CHEMISTRY12_CHAPTERS (no local data-file dependency).
const MATHS12_CHAPTERS = [
  'Relations and Functions',
  'Inverse Trigonometric Functions',
  'Matrices',
  'Determinants',
  'Continuity and Differentiability',
  'Application of Derivatives',
  'Integrals',
  'Application of Integrals',
  'Differential Equations',
  'Vector Algebra',
  'Three Dimensional Geometry',
  'Linear Programming',
  'Probability',
];

// Class 7 Important-Questions subjects (DB-backed, class_level=7, type_key=
// 'important_questions'). Chapter lists mirror the seeded chapters; the ChapterList
// still confirms per-chapter availability via the API. à¤¹à¤¿à¤‚à¤¦à¥€ (à¤®à¤²à¥à¤¹à¤¾à¤°) is coming-soon
// because its Devanagari name has no ASCII slug (the API is slug-keyed).
const CLASS7_IMP_SUBJECTS = [
  { name: "Science (Curiosity)", emoji: "ðŸ”¬", bg: "#5AA84F", chapters: ["The Ever-Evolving World of Science","Light: Shadows and Reflections","Life Processes in Plants","Life Processes in Animals","Measurement of Time and Motion","Heat Transfer in Nature","Adolescence: A Stage of Growth and Change","Changes Around Us: Physical and Chemical","The World of Metals and Non-metals","Electricity: Circuits and their Components","Exploring Substances: Acidic, Basic, and Neutral","Earth, Moon, and the Sun"] },
  { name: "Social Science (Exploring Society)", emoji: "ðŸŒ", bg: "#2F80ED", chapters: ["Overall Map Questions","Geographical Diversity of India","From Barter to Money","The Constitution of India - An Introduction","From the Rulers to the Ruled: Types of Governments","How the Land Becomes Sacred","The Gupta Era: An Age of Tireless Creativity","The Age of Reorganisation","The Rise of Empires","New Beginnings: Cities and States","Climates of India","Understanding the Weather","Understanding Markets","The Story of Indian Farming","India and Her Neighbours","Empires and Kingdoms: 6th to 10th Centuries","Turning Tides: 11th and 12th Centuries","India, a Home to Many","The State, the Government, and You","Infrastructure: Engine of India's Development","Banks and the Magic of Finance"] },
  { name: "à¤¹à¤¿à¤‚à¤¦à¥€ (à¤®à¤²à¥à¤¹à¤¾à¤°)", emoji: "ðŸ“š", bg: "#2F80ED", chapters: ["à¤®à¤¾à¤, à¤•à¤¹ à¤à¤• à¤•à¤¹à¤¾à¤¨à¥€ (à¤•à¤µà¤¿à¤¤à¤¾)","à¤šà¤¿à¤¡à¤¼à¤¿à¤¯à¤¾ (à¤•à¤µà¤¿à¤¤à¤¾)","à¤¬à¤¿à¤°à¤œà¥‚ à¤®à¤¹à¤¾à¤°à¤¾à¤œ à¤¸à¥‡ à¤¸à¤¾à¤•à¥à¤·à¤¾à¤¤à¥à¤•à¤¾à¤° à¤¨à¥ƒà¤¤à¥à¤¯à¤¾à¤‚à¤—à¤¨à¤¾ à¤¸à¥à¤§à¤¾ à¤šà¤‚à¤¦à¥à¤°à¤¨","à¤µà¤°à¥à¤·à¤¾-à¤¬à¤¹à¤¾à¤° (à¤•à¤µà¤¿à¤¤à¤¾)","à¤—à¤¿à¤°à¤¿à¤§à¤° à¤•à¤µà¤¿à¤°à¤¾à¤¯ à¤•à¥€ à¤•à¥à¤‚à¤¡à¤²à¤¿à¤¯à¤¾ (à¤•à¤µà¤¿à¤¤à¤¾)","à¤¨à¤¹à¥€à¤‚ à¤¹à¥‹à¤¨à¤¾ à¤¬à¥€à¤®à¤¾à¤° (à¤•à¤¹à¤¾à¤¨à¥€)","à¤ªà¤¾à¤¨à¥€ à¤°à¥‡ à¤ªà¤¾à¤¨à¥€ (à¤¨à¤¿à¤¬à¤‚à¤§)","à¤«à¥‚à¤² à¤”à¤° à¤•à¤¾à¤à¤Ÿà¤¾ (à¤•à¤µà¤¿à¤¤à¤¾)","à¤¤à¥€à¤¨ à¤¬à¥à¤¦à¥à¤§à¤¿à¤®à¤¾à¤¨ (à¤²à¥‹à¤•à¤•à¤¥à¤¾)","à¤®à¥€à¤°à¤¾ à¤•à¥‡ à¤ªà¤¦ (à¤ªà¤¦)","à¤…à¤ªà¤ à¤¿à¤¤ à¤—à¤¦à¥à¤¯à¤¾à¤‚à¤¶","à¤…à¤ªà¤ à¤¿à¤¤ à¤•à¤¾à¤µà¥à¤¯à¤¾à¤‚à¤¶","à¤ªà¤¤à¥à¤° à¤²à¥‡à¤–à¤¨","à¤…à¤¨à¥à¤šà¥à¤›à¥‡à¤¦ à¤²à¥‡à¤–à¤¨","à¤­à¤¾à¤·à¤¾ à¤”à¤° à¤²à¤¿à¤ªà¤¿","à¤¸à¤‚à¤œà¥à¤žà¤¾ à¤¸à¤°à¥à¤µà¤¨à¤¾à¤® à¤”à¤° à¤µà¤¿à¤¶à¥‡à¤·à¤£","à¤²à¤¿à¤‚à¤— à¤”à¤° à¤µà¤šà¤¨","à¤•à¥à¤°à¤¿à¤¯à¤¾ à¤”à¤° à¤•à¥à¤°à¤¿à¤¯à¤¾-à¤µà¤¿à¤¶à¥‡à¤·à¤£","à¤®à¥à¤¹à¤¾à¤µà¤°à¥‡ à¤”à¤° à¤²à¥‹à¤•à¥‹à¤•à¥à¤¤à¤¿à¤¯à¤¾à¤","à¤¸à¤®à¤¾à¤¸ à¤”à¤° à¤µà¤¿à¤—à¥à¤°à¤¹","à¤µà¤¿à¤²à¥‹à¤® à¤¶à¤¬à¥à¤¦","à¤ªà¤°à¥à¤¯à¤¾à¤¯à¤µà¤¾à¤šà¥€ à¤¶à¤¬à¥à¤¦","à¤¸à¤‚à¤§à¤¿-à¤µà¤¿à¤šà¥à¤›à¥‡à¤¦","à¤µà¤°à¥à¤£-à¤µà¤¿à¤šà¥à¤›à¥‡à¤¦","à¤‰à¤ªà¤¸à¤°à¥à¤— à¤”à¤° à¤ªà¥à¤°à¤¤à¥à¤¯à¤¯","à¤…à¤¨à¥‡à¤• à¤•à¥‡ à¤²à¤¿à¤ à¤à¤• à¤¶à¤¬à¥à¤¦","à¤šà¤¿à¤¤à¥à¤° à¤µà¤°à¥à¤£à¤¨","à¤²à¤˜à¥ à¤•à¤¥à¤¾ à¤²à¥‡à¤–à¤¨","à¤¸à¤‚à¤µà¤¾à¤¦ à¤²à¥‡à¤–à¤¨","à¤µà¤¾à¤•à¥à¤¯ à¤•à¥‡ à¤ªà¥à¤°à¤•à¤¾à¤°","à¤¶à¤¬à¥à¤¦ à¤­à¥‡à¤¦","à¤¶à¥à¤°à¥à¤¤à¤¿à¤¸à¤® à¤­à¤¿à¤¨à¥à¤¨à¤¾à¤¤à¥à¤®à¤• à¤¶à¤¬à¥à¤¦","à¤•à¤¾à¤²","à¤•à¤¾à¤°à¤•","à¤µà¤°à¥à¤¤à¤¨à¥€","à¤µà¤¿à¤°à¤¾à¤® à¤šà¤¿à¤¹à¥à¤¨à¥‹à¤‚ à¤•à¤¾ à¤ªà¥à¤°à¤¯à¥‹à¤—"] },
  { name: "English (Poorvi)", emoji: "ðŸ“–", bg: "#7A6FD0", chapters: ["The Day the River Spoke","My Dear Soldiers","A Homage to Our Brave Soldiers","Conquering the Summit","Travel","The Tunnel","North, South, East, West","Paper Boats","My Brother's Great Invention","Say the Right Thing","A Funny Man","Animals, Birds, and Dr. Dolittle","Three Days to See","Try Again","Rani Abbakka","Reading - Unseen Passage","Reading - Unseen Poem","Grammar - Preposition","Grammar - Adverb","Grammar - Conjunction","Grammar - Synonyms and Antonyms","Grammar - One Word Substitution","Grammar - Fill in the Blanks","Grammar - Editing & Omitting","Grammar - Gap Filling","Grammar - Jumble Words","Grammar - Helping Verbs","Grammar - Verbs","Grammar - Articles","Grammar - Adjectives","Grammar - Pronoun","Grammar - Noun","Grammar - Tenses","Grammar - Sentence Transformation","Grammar - Non-Finite Verbs","Grammar - Question Tags","Grammar - Sentence (parts and types)","Writing - Article","Writing - Letter","Writing - Short Story","Writing - Paragraph","Writing - Notice","Writing - Message","Writing - Application to Principal"] },
  { name: "Maths (Ganita Prakash)", emoji: "ðŸ“", bg: "#E8703A", chapters: ["Large Numbers Around Us","Arithmetic Expressions","A Peek Beyond the Point","Expressions using Letter-Numbers","Parallel and Intersecting Lines","Number Play","A Tale of Three Intersecting Lines","Working with Fractions","Geometric Twins","Operations with Integers","Finding Common Ground","Another Peek Beyond the Point","Connecting the Dots","Constructions and Tilings","Finding the Unknown"] },
  { name: "Old - Science", emoji: "ðŸ”¬", bg: "#5AA84F", chapters: ["Nutrition in Plants","Nutrition in Animals","Fibre to Fabric (Deleted)","Heat","Acids Bases and Salts","Physical and Chemical Changes","Weather Climate and Adaptations of Animals to Climate (Deleted)","Winds Storms and Cyclones (Deleted)","Soil (Deleted)","Respiration in Organisms","Transportation in Animals and Plants","Reproduction in Plants","Motion and Time","Electric Current and its Effects","Light","Water A Precious Resource (Deleted)","Forests Our Lifeline","Waste water Story"] },
  { name: "Reasoning & Mental Ability", emoji: "ðŸ§ ", bg: "#E8703A", chapters: ["Non Verbal - Analytical Reasoning","Non Verbal - Dot Situation","Non Verbal - Embedded Images","Verbal - Series","Verbal - Classification","Verbal - Blood Relation Test","Verbal - Directions","Verbal - Days and Dates","Verbal - Coding-Decoding","Verbal - Puzzles","Verbal - Arithmetic Reasoning","Non Verbal - Series","Non Verbal - Classification","Non Verbal - Patterns","Non Verbal - Analogy","Non Verbal - Mirror Images","Non Verbal - Paper Cutting","Non Verbal - Figure Matrix","Non Verbal - Cubes and Dice"] },
  { name: "Old - English", emoji: "ðŸ“–", bg: "#7A6FD0", chapters: ["Three Questions","A Gift of Chappals","Gopal and The Hilsa Fish","The Ashes That Made Trees Bloom","Quality","Expert Detectives","The Invention of Vita Wonk","The Squirrel","The Rebel","The shed","Chivvy","Trees","Mystery of the Talking Fan","Dad and The Cat and The Tree","Meadow Surprise","Garden Snake","The Tiny Teacher","Bringing Up Kari","Golu Grows a Nose","Chandni","The Bear Story","A Tiger in the House","An Alien Hand","Grammar - Editing","Grammar - Gap Filling","Grammar - Jumble Words","Grammar - Helping Verbs","Grammar - Verbs","Grammar - Adjectives","Grammar - Pronoun","Grammar - Noun","Grammar - Tenses","Grammar - Articles","Grammar - Sentence Transformation","Grammar - Active Passive Voice"] },
  { name: "Old - à¤¹à¤¿à¤‚à¤¦à¥€", emoji: "ðŸ“š", bg: "#2F80ED", chapters: ["à¤…à¤ªà¤ à¤¿à¤¤ à¤—à¤¦à¥à¤¯à¤¾à¤‚à¤¶","à¤…à¤ªà¤ à¤¿à¤¤ à¤•à¤¾à¤µà¥à¤¯à¤¾à¤‚à¤¶","à¤ªà¤¤à¥à¤° à¤²à¥‡à¤–à¤¨","à¤¨à¤¿à¤¬à¤‚à¤§ à¤²à¥‡à¤–à¤¨","à¤¸à¤‚à¤œà¥à¤žà¤¾ à¤¸à¤°à¥à¤µà¤¨à¤¾à¤® à¤”à¤° à¤µà¤¿à¤¶à¥‡à¤·à¤£","à¤­à¤¾à¤·à¤¾ à¤”à¤° à¤²à¤¿à¤ªà¤¿","à¤²à¤¿à¤‚à¤— à¤”à¤° à¤µà¤šà¤¨","à¤•à¥à¤°à¤¿à¤¯à¤¾ à¤”à¤° à¤•à¥à¤°à¤¿à¤¯à¤¾-à¤µà¤¿à¤¶à¥‡à¤·à¤£","à¤®à¥à¤¹à¤¾à¤µà¤°à¥‡ à¤”à¤° à¤²à¥‹à¤•à¥‹à¤•à¥à¤¤à¤¿à¤¯à¤¾à¤","à¤¸à¤®à¤¾à¤¸ à¤”à¤° à¤µà¤¿à¤—à¥à¤°à¤¹","à¤µà¤¿à¤²à¥‹à¤® à¤¶à¤¬à¥à¤¦","à¤ªà¤°à¥à¤¯à¤¾à¤¯à¤µà¤¾à¤šà¥€ à¤¶à¤¬à¥à¤¦","à¤¸à¤‚à¤§à¤¿-à¤µà¤¿à¤šà¥à¤›à¥‡à¤¦","à¤µà¤°à¥à¤£-à¤µà¤¿à¤šà¥à¤›à¥‡à¤¦","à¤‰à¤ªà¤¸à¤°à¥à¤— à¤”à¤° à¤ªà¥à¤°à¤¤à¥à¤¯à¤¯","à¤…à¤¨à¥‡à¤• à¤•à¥‡ à¤²à¤¿à¤ à¤à¤• à¤¶à¤¬à¥à¤¦","à¤¹à¤® à¤ªà¤‚à¤›à¥€ à¤‰à¤¨à¥à¤®à¥à¤•à¥à¤¤ à¤—à¤—à¤¨ à¤•à¥‡","à¤¹à¤¿à¤®à¤¾à¤²à¤¯ à¤•à¥€ à¤¬à¥‡à¤Ÿà¤¿à¤¯à¤¾à¤","à¤•à¤ à¤ªà¥à¤¤à¤²à¥€","à¤®à¤¿à¤ à¤¾à¤ˆà¤µà¤¾à¤²à¤¾","à¤ªà¤¾à¤ªà¤¾ à¤–à¥‹ à¤—à¤","à¤¶à¤¾à¤®-à¤à¤• à¤•à¤¿à¤¸à¤¾à¤¨","à¤…à¤ªà¥‚à¤°à¥à¤µ à¤…à¤¨à¥à¤­à¤µ","à¤°à¤¹à¥€à¤® à¤•à¥‡ à¤¦à¥‹à¤¹à¥‡","à¤à¤• à¤¤à¤¿à¤¨à¤•à¤¾","à¤–à¤¾à¤¨à¤ªà¤¾à¤¨ à¤•à¥€ à¤¬à¤¦à¤²à¤¤à¥€ à¤¤à¤¸à¥à¤µà¥€à¤°","à¤¨à¥€à¤²à¤•à¤‚à¤ ","à¤­à¥‹à¤° à¤”à¤° à¤¬à¤°à¤–à¤¾","à¤µà¥€à¤° à¤•à¥à¤à¤µà¤°à¤¸à¤¿à¤‚à¤¹","à¤¸à¤‚à¤˜à¤°à¥à¤· à¤•à¥‡ à¤•à¤¾à¤°à¤£ à¤§à¤¨à¤°à¤¾à¤œ","à¤†à¤¶à¥à¤°à¤® à¤•à¤¾ à¤†à¤¨à¥à¤®à¤¾à¤¨à¤¿à¤¤ à¤µà¥à¤¯à¤¯","à¤¬à¤¾à¤² à¤®à¤¹à¤¾à¤­à¤¾à¤°à¤¤ à¤•à¤¥à¤¾"] },
  { name: "Old - Maths", emoji: "ðŸ“", bg: "#E8703A", chapters: ["Integers","Fractions and Decimals","Data Handling","Simple Equations","Lines and Angles","The Triangle and its Properties","Comparing Quantities","Rational Numbers","Perimeter and Area","Algebraic Expressions","Exponents and Powers","Symmetry","Visualising Solid Shapes"] },
  { name: "Old - Social Sc", emoji: "ðŸŒ", bg: "#2F80ED", chapters: ["Tracing Changes Through a Thousand Years","Kings and Kingdoms","Delhi: 12th to 15th Century","The Mughal (16th to 17th Century)","Tribes Nomads and Settled Communities","Devotional Paths to the Divine","The Making of Regional Cultures","Eighteenth Century Political Formations","Environment","Inside our Earth","Our Changing Earth","Air","Water","Human Environment Interactions the Tropical and the Subtropical Region","Life in the Deserts","On Equality","Role of the Government in Health","How the State Government Works","Growing up as Boys and Girls","Women Change the world","Understanding Media","Market Around Us","A shirt in the market"] },
];

// Class 8 Important-Questions subjects (chapter lists mirror the seeded chapters at
// class_level=8; the ChapterList still confirms per-chapter availability via the API).
const CLASS8_IMP_SUBJECTS = [
  { name: "Science (Curiosity)", emoji: "ðŸ”¬", bg: "#5AA84F", chapters: ["Exploring the Investigative World of Science","The Invisible Living World: Beyond Our Naked Eye","Health: The Ultimate Treasure","Electricity: Magnetic and Heating Effects","Exploring Forces","Pressure, Winds, Storms, and Cyclones","Particulate Nature of Matter","Nature of Matter: Elements, Compounds, and Mixtures","The Amazing World of Solutes, Solvents, and Solutions","Light: Mirrors and Lenses","Keeping Time with the Skies","How Nature Works in Harmony","Our Home: Earth, a Unique Life Sustaining Planet"] },
  { name: "Social Science (Exploring Society)", emoji: "ðŸŒ", bg: "#2F80ED", chapters: ["Natural Resources and Their Use","Reshaping India's Political Map","The Rise of the Marathas","The Colonial Era in India","Universal Franchise and India's Electoral System","The Parliamentary System: Legislature and Executive","Factors of Production","Overall Map Questions"] },
  { name: "à¤¹à¤¿à¤‚à¤¦à¥€ (à¤®à¤²à¥à¤¹à¤¾à¤°)", emoji: "ðŸ“š", bg: "#2F80ED", chapters: ["à¤¸à¥à¤µà¤¦à¥‡à¤¶ (à¤•à¤µà¤¿à¤¤à¤¾)","à¤¦à¥‹ à¤—à¥Œà¤°à¥‡à¤¯à¤¾ (à¤•à¤¹à¤¾à¤¨à¥€)","à¤à¤• à¤†à¤¶à¥€à¤°à¥à¤µà¤¾à¤¦ (à¤•à¤µà¤¿à¤¤à¤¾)","à¤¹à¤°à¤¿à¤¦à¥à¤µà¤¾à¤° (à¤ªà¤¤à¥à¤°)","à¤•à¤¬à¥€à¤° à¤•à¥‡ à¤¦à¥‹à¤¹à¥‡","à¤à¤• à¤Ÿà¥‹à¤•à¤°à¥€ à¤­à¤° à¤®à¤¿à¤Ÿà¥à¤Ÿà¥€ (à¤•à¤¹à¤¾à¤¨à¥€)","à¤®à¤¤ à¤¬à¤¾à¤à¤§à¥‹ (à¤•à¤µà¤¿à¤¤à¤¾)","à¤¨à¤ à¤®à¥‡à¤¹à¤®à¤¾à¤¨ (à¤à¤•à¤¾à¤‚à¤•à¥€)","à¤†à¤¦à¤®à¥€ à¤•à¤¾ à¤…à¤¨à¥à¤ªà¤¾à¤¤ (à¤•à¤µà¤¿à¤¤à¤¾)","à¤¤à¤°à¥à¤£ à¤•à¥‡ à¤¸à¥à¤µà¤ªà¥à¤¨ (à¤‰à¤¦à¥à¤¬à¥‹à¤§à¤¨)","à¤²à¤¿à¤‚à¤— à¤”à¤° à¤µà¤šà¤¨","à¤¸à¤‚à¤œà¥à¤žà¤¾, à¤¸à¤°à¥à¤µà¤¨à¤¾à¤® à¤”à¤° à¤µà¤¿à¤¶à¥‡à¤·à¤£","à¤…à¤¨à¥à¤šà¥à¤›à¥‡à¤¦ à¤²à¥‡à¤–à¤¨","à¤ªà¤¤à¥à¤° à¤²à¥‡à¤–à¤¨","à¤…à¤ªà¤ à¤¿à¤¤ à¤•à¤¾à¤µà¥à¤¯à¤¾à¤‚à¤¶","à¤…à¤ªà¤ à¤¿à¤¤ à¤—à¤¦à¥à¤¯à¤¾à¤‚à¤¶","à¤¶à¤¬à¥à¤¦-à¤­à¥‡à¤¦","à¤­à¤¾à¤·à¤¾ à¤”à¤° à¤²à¤¿à¤ªà¤¿","à¤µà¤¾à¤•à¥à¤¯ à¤•à¥‡ à¤ªà¥à¤°à¤•à¤¾à¤°","à¤…à¤¨à¥‡à¤• à¤•à¥‡ à¤²à¤¿à¤ à¤à¤• à¤¶à¤¬à¥à¤¦","à¤‰à¤ªà¤¸à¤°à¥à¤— à¤”à¤° à¤ªà¥à¤°à¤¤à¥à¤¯à¤¯","à¤µà¤°à¥à¤£-à¤µà¤¿à¤šà¥à¤›à¥‡à¤¦","à¤¸à¤‚à¤§à¤¿-à¤µà¤¿à¤šà¥à¤›à¥‡à¤¦","à¤ªà¤°à¥à¤¯à¤¾à¤¯à¤µà¤¾à¤šà¥€ à¤¶à¤¬à¥à¤¦","à¤µà¤¿à¤²à¥‹à¤® à¤¶à¤¬à¥à¤¦","à¤®à¥à¤¹à¤¾à¤µà¤°à¥‡ à¤”à¤° à¤²à¥‹à¤•à¥‹à¤•à¥à¤¤à¤¿à¤¯à¤¾à¤","à¤šà¤¿à¤¤à¥à¤° à¤µà¤°à¥à¤£à¤¨","à¤²à¤˜à¥ à¤•à¤¥à¤¾ à¤²à¥‡à¤–à¤¨","à¤¸à¤‚à¤µà¤¾à¤¦ à¤²à¥‡à¤–à¤¨","à¤¶à¥à¤°à¥à¤¤à¤¿à¤¸à¤® à¤­à¤¿à¤¨à¥à¤¨à¤¾à¤¤à¥à¤®à¤• à¤¶à¤¬à¥à¤¦","à¤•à¥à¤°à¤¿à¤¯à¤¾ à¤”à¤° à¤•à¥à¤°à¤¿à¤¯à¤¾-à¤µà¤¿à¤¶à¥‡à¤·à¤£","à¤•à¤¾à¤²","à¤•à¤¾à¤°à¤•","à¤¸à¤®à¤¾à¤¸","à¤µà¤°à¥à¤¤à¤¨à¥€","à¤µà¤¿à¤°à¤¾à¤® à¤šà¤¿à¤¹à¥à¤¨à¥‹à¤‚ à¤•à¤¾ à¤ªà¥à¤°à¤¯à¥‹à¤—"] },
  { name: "English (Poorvi)", emoji: "ðŸ“–", bg: "#7A6FD0", chapters: ["Reading - Unseen Passage","Reading - Unseen Poem","The Wit that Won Hearts","A Concrete Example","Wisdom Paves the Way","A Tale of Valour: Major Somnath Sharma and the Battle of Badgam","Somebody's Mother","Verghese Kurien-I Too Had A Dream","The Case of the Fifth Word","The Magic Brush of Dreams","Spectacular Wonders","The Cherry Tree","Harvest Hymn","Waiting for the Rain","Feathered Friend","Magnifying Glass","Bibha Chowdhuri: Women in Indian Science","Grammar - Synonyms and Antonyms","Writing - Application to Principal","Grammar - Editing and Omitting","Grammar - Fill in the blanks","Grammar - Jumble Words","Grammar - Sentence Transformation","Grammar - Tenses","Grammar - Noun","Grammar - Pronoun","Grammar - Adjectives","Grammar - Verbs","Grammar - Articles","Grammar - Helping Verbs","Grammar - Preposition","Grammar - Adverb","Grammar - Conjunction","Grammar - Reported speech","Grammar - Gap Filling","Grammar - One Word Substitution","Grammar - Non-Finite Verbs","Grammar - Question Tags","Grammar - Sentence (parts and types)","Conditional Clause (If Clause)","Writing - Article","Writing - Letter","Writing - Short Story","Writing - Paragraph","Writing - Notice","Writing - Message"] },
  { name: "Maths (Ganita Prakash)", emoji: "ðŸ“", bg: "#E8703A", chapters: ["A Square and A Cube","Power Play","A Story of Numbers","Quadrilaterals","Number Play","We Distribute Yet Things Multiply","Proportional Reasoning-1","Fractions in Disguise","The Baudhayana-Pythagoras Theorem","Proportional Reasoning-2","Exploring Some Geometric Themes","Tales by Dots and Lines","Algebra Play","Area"] },
  { name: "Old - Science", emoji: "ðŸ”¬", bg: "#5AA84F", chapters: ["Crop Production and Management","Microorganisms Friend And Foe","Synthetic Fibres and Plastics (Delete)","Materials Metals and Non Metals (Delete)","Coal and Petroleum","Combustion and Flame","Conservation of Plants and Animals","Cell Structure and Functions (Delete)","Reproduction in Animals","Reaching the Age of Adolescence","Force and Pressure","Friction","Sound","Chemical Effects of Electric Current","Some Natural Phenomena","Light","Stars and the Solar System (Delete)","Pollution of Air and Water (Delete)"] },
  { name: "Reasoning & Mental Ability", emoji: "ðŸ§ ", bg: "#E8703A", chapters: ["Verbal - Series","Verbal - Classification","Verbal - Blood Relation Test","Verbal - Directions","Verbal - Days and Dates","Verbal - Coding-Decoding","Verbal - Puzzles","Verbal - Arithmetic Reasoning","Non Verbal - Series","Non Verbal - Classification","Non Verbal - Patterns","Non Verbal - Analogy","Non Verbal - Mirror Images","Non Verbal - Paper Cutting","Non Verbal - Figure Matrix","Non Verbal - Cubes and Dice","Non Verbal - Analytical Reasoning","Non Verbal - Dot Situation","Non Verbal - Embedded Images"] },
  { name: "Old - English", emoji: "ðŸ“–", bg: "#7A6FD0", chapters: ["The Best Christmas Present in the World","The Tsunami","Glimpses of the Past","Bepin Choudhurys Lapse of Memory","The Summit Within","This is Jodys Fawn","A Visit to Cambridge","A Short Monsoon Diary","The Ant and the Cricket","Geography Lesson","The Last Bargain","The School Boy","On the Grasshopper and Cricket","How the Camel got his hump","Children at Work","The Selfish Giant","The Treasure Within","Princess September","The Fight","Jalebis","Ancient Education System of India","Grammar - Editing and Omitting","Grammar -  Fill in the blanks","Grammar - Jumble Words","Grammar - Verbs","Grammar - Adjectives","Grammar - Pronoun","Grammar - Tenses","Grammar - Articles","Grammar - Helping Verbs","Grammar - Noun","Grammar - Sentence Transformation","Grammar - Idioms Phrases and Proverbs","Writing - Article","Writing - Letter","Writing - Short Story","Writing - Paragraph","Writing - Notice","Writing - Message","Reading - Unseen Passage","Reading - Unseen Poem","Grammar - Preposition","Grammar - Adverb","Grammar - Conjunction","Grammar - Reported speech","Grammar - Other Topics"] },
  { name: "Old - à¤¹à¤¿à¤‚à¤¦à¥€", emoji: "ðŸ“š", bg: "#2F80ED", chapters: ["à¤µà¤¸à¤‚à¤¤ à¤²à¤¾à¤– à¤•à¥€ à¤šà¥‚à¤¡à¤¼à¤¿à¤¯à¤¾à¤","à¤µà¤¸à¤‚à¤¤ à¤¬à¤¸ à¤•à¥€ à¤¯à¤¾à¤¤à¥à¤°à¤¾","à¤µà¤¸à¤‚à¤¤ à¤¦à¥€à¤µà¤¾à¤¨à¥‹à¤‚ à¤•à¥€ à¤¹à¤¸à¥à¤¤à¥€","à¤µà¤¸à¤‚à¤¤ à¤­à¤—à¤µà¤¾à¤¨ à¤•à¥‡ à¤¡à¤¾à¤•à¤¿à¤¯à¥‡","à¤µà¤¸à¤‚à¤¤ à¤•à¥à¤¯à¤¾ à¤¨à¤¿à¤°à¤¾à¤¶ à¤¹à¥à¤† à¤œà¤¾à¤","à¤µà¤¸à¤‚à¤¤ à¤¯à¤¹ à¤¸à¤¬à¤¸à¥‡ à¤•à¤ à¤¿à¤¨ à¤¸à¤®à¤¯ à¤¨à¤¹à¥€à¤‚","à¤µà¤¸à¤‚à¤¤ à¤•à¤¬à¥€à¤° à¤•à¥€ à¤¸à¤¾à¤–à¤¿à¤¯à¤¾à¤","à¤µà¤¸à¤‚à¤¤ à¤¸à¥à¤¦à¤¾à¤®à¤¾ à¤šà¤°à¤¿à¤¤","à¤µà¤¸à¤‚à¤¤ à¤œà¤¹à¤¾à¤ à¤ªà¤¹à¤¿à¤¯à¤¾ à¤¹à¥ˆ","à¤µà¤¸à¤‚à¤¤ à¤…à¤•à¤¬à¤°à¥€ à¤²à¥‹à¤Ÿà¤¾","à¤µà¤¸à¤‚à¤¤ à¤¸à¥‚à¤°à¤¦à¤¾à¤¸ à¤•à¥‡ à¤ªà¤¦","à¤µà¤¸à¤‚à¤¤ à¤ªà¤¾à¤¨à¥€ à¤•à¥€ à¤•à¤¹à¤¾à¤¨à¥€","à¤µà¤¸à¤‚à¤¤ à¤¬à¤¾à¤œ à¤”à¤° à¤¸à¤¾à¤à¤ª","à¤­à¤¾à¤°à¤¤ à¤•à¥€ à¤–à¥‹à¤œ à¤…à¤¹à¤®à¤¦à¤¨à¤—à¤° à¤•à¤¾ à¤•à¤¿à¤²à¤¾","à¤­à¤¾à¤°à¤¤ à¤•à¥€ à¤–à¥‹à¤œ à¤¤à¤²à¤¾à¤¶","à¤­à¤¾à¤°à¤¤ à¤•à¥€ à¤–à¥‹à¤œ à¤¸à¤¿à¤‚à¤§à¥ à¤˜à¤¾à¤Ÿà¥€ à¤¸à¤­à¥à¤¯à¤¤à¤¾","à¤­à¤¾à¤°à¤¤ à¤•à¥€ à¤–à¥‹à¤œ à¤¯à¥à¤—à¥‹à¤‚ à¤•à¤¾ à¤¦à¥Œà¤°","à¤­à¤¾à¤°à¤¤ à¤•à¥€ à¤–à¥‹à¤œ à¤¨à¤¯à¥€ à¤¸à¤®à¤¸à¥à¤¯à¤¾à¤à¤","à¤­à¤¾à¤°à¤¤ à¤•à¥€ à¤–à¥‹à¤œ à¤…à¤‚à¤¤à¤¿à¤® à¤¦à¥Œà¤° à¤à¤•","à¤­à¤¾à¤°à¤¤ à¤•à¥€ à¤–à¥‹à¤œ à¤…à¤‚à¤¤à¤¿à¤® à¤¦à¥Œà¤° à¤¦à¥‹","à¤­à¤¾à¤°à¤¤ à¤•à¥€ à¤–à¥‹à¤œ à¤¤à¤¨à¤¾à¤µ","à¤­à¤¾à¤°à¤¤ à¤•à¥€ à¤–à¥‹à¤œ à¤¦à¥‹ à¤ªà¥ƒà¤·à¥à¤ à¤­à¥‚à¤®à¤¿à¤¯à¤¾à¤ à¤­à¤¾à¤°à¤¤à¥€à¤¯ à¤”à¤° à¤…à¤‚à¤—à¥à¤°à¥‡à¤œà¤¼à¥€","à¤¸à¤‚à¤œà¥à¤žà¤¾, à¤¸à¤°à¥à¤µà¤¨à¤¾à¤® à¤”à¤° à¤µà¤¿à¤¶à¥‡à¤·à¤£","à¤²à¤¿à¤‚à¤— à¤”à¤° à¤µà¤šà¤¨","à¤µà¤¿à¤²à¥‹à¤® à¤¶à¤¬à¥à¤¦","à¤ªà¤°à¥à¤¯à¤¾à¤¯à¤µà¤¾à¤šà¥€ à¤¶à¤¬à¥à¤¦","à¤¸à¤‚à¤§à¤¿-à¤µà¤¿à¤šà¥à¤›à¥‡à¤¦","à¤µà¤¾à¤•à¥à¤¯ à¤•à¥‡ à¤ªà¥à¤°à¤•à¤¾à¤°","à¤µà¤°à¥à¤£-à¤µà¤¿à¤šà¥à¤›à¥‡à¤¦","à¤­à¤¾à¤·à¤¾ à¤”à¤° à¤²à¤¿à¤ªà¤¿","à¤‰à¤ªà¤¸à¤°à¥à¤— à¤”à¤° à¤ªà¥à¤°à¤¤à¥à¤¯à¤¯","à¤…à¤¨à¥‡à¤• à¤•à¥‡ à¤²à¤¿à¤ à¤à¤• à¤¶à¤¬à¥à¤¦","à¤¶à¤¬à¥à¤¦-à¤­à¥‡à¤¦","à¤®à¥à¤¹à¤¾à¤µà¤°à¥‡ à¤”à¤° à¤²à¥‹à¤•à¥‹à¤•à¥à¤¤à¤¿à¤¯à¤¾à¤","à¤…à¤ªà¤ à¤¿à¤¤ à¤—à¤¦à¥à¤¯à¤¾à¤‚à¤¶","à¤…à¤ªà¤ à¤¿à¤¤ à¤•à¤¾à¤µà¥à¤¯à¤¾à¤‚à¤¶","à¤ªà¤¤à¥à¤° à¤²à¥‡à¤–à¤¨","à¤¨à¤¿à¤¬à¤‚à¤§ à¤²à¥‡à¤–à¤¨"] },
  { name: "Old - Maths", emoji: "ðŸ“", bg: "#E8703A", chapters: ["Rational Numbers","Linear Equations in One Variable","Understanding Quadrilaterals","Data Handling","Squares and Square Roots","Cubes and Cube Roots","Comparing Quantities","Algebraic Expressions and Identities","Visualising Solid Shapes","Mensuration","Exponents and Powers","Direct and Inverse Proportions","Factorisation","Introduction to Graphs","Playing with Numbers"] },
  { name: "Old - Social Sc", emoji: "ðŸŒ", bg: "#2F80ED", chapters: ["How When and Where","From Trade to Territory The Company Establishes Power","Ruling the Countryside","Tribals Dikus and the Vision of a Golden Age","When People Rebel 1857 and After","Civilising the Native Educating the Nation","Women Caste and Reform","The Making of the National Movement 1870 to 1947","Resources","Land Soil Water Natural Vegetation and Wildlife Resources","Agriculture","Industries","Human Resources","The Indian Constitution","Understanding Secularism","Parliament and the Making of Laws","Judiciary","Understanding Marginalisation","Confronting Marginalisation","Public Facilities","Law and Social Justice"] },
];

// Class 9 new-syllabus Important-Questions subjects (chapter lists mirror the seeded
// chapters at class_level=9; ChapterList confirms per-chapter availability via the API).
const CLASS9_IMP_SUBJECTS = [
  { name: "Science (Exploration)", emoji: "ðŸ”¬", bg: "#5AA84F", chapters: ["Exploration: Entering the World of Secondary Science","Cell: The Building Block of Life","Tissues in Action","Describing Motion Around Us","Exploring Mixtures and Their Separation","How Forces Affect Motion","Work, Energy and Simple Machines","Journey Inside Atom","Atomic Foundation of Matter","Sound Waves: Characteristics and Applications","Reproduction: How Life Continues","Patterns in Life: Diversity and Classification","Earth as a System: Energy, Matter and Life"] },
  { name: "Social Science (Understanding Society)", emoji: "ðŸŒ", bg: "#2F80ED", chapters: ["Understanding Social Science","Shaping of the Earth's Surface","Atmosphere and Climate","Early Humans and Beginning of Civilisation","State and Society upto 1000 CE","Democracy in India","Elections","Building Blocks in Economics","The Price Puzzle: What Drives the Market","Oceans and Life","Life on Earth","Resistance and Resilience","India and the World-I","Authority","From Ideas to Startups","Smart Ways to Manage Your Finances"] },
  { name: "à¤¹à¤¿à¤‚à¤¦à¥€ (à¤—à¤‚à¤—à¤¾)", emoji: "ðŸ“š", bg: "#2F80ED", chapters: ["à¤¦à¥‹ à¤¬à¥ˆà¤²à¥‹à¤‚ à¤•à¥€ à¤•à¤¥à¤¾","à¤•à¥à¤¯à¤¾ à¤²à¤¿à¤–à¥‚à¤‚?","à¤¸à¤‚à¤µà¤¾à¤¦à¤¹à¥€à¤¨","à¤à¤¸à¥€ à¤­à¥€ à¤¬à¤¾à¤¤à¥‡à¤‚ à¤¹à¥‹à¤¤à¥€ à¤¹à¥ˆà¤‚ (à¤²à¤¤à¤¾ à¤®à¤‚à¤—à¥‡à¤¶à¤•à¤° à¤¸à¥‡ à¤¸à¤¾à¤•à¥à¤·à¤¾à¤¤à¥à¤•à¤¾à¤°)","à¤†à¤–à¤¿à¤°à¥€ à¤šà¤Ÿà¥à¤Ÿà¤¾à¤¨ à¤¤à¤•","à¤°à¥€à¤¢à¤¼ à¤•à¥€ à¤¹à¤¡à¥à¤¡à¥€","à¤®à¥ˆà¤‚ à¤”à¤° à¤®à¥‡à¤°à¤¾ à¤¦à¥‡à¤¶","â à¤°à¥ˆà¤¦à¤¾à¤¸ à¤•à¥‡ à¤ªà¤¦","à¤°à¤¾à¤®-à¤²à¤•à¥à¤·à¥à¤®à¤£-à¤ªà¤°à¤¶à¥à¤°à¤¾à¤® à¤¸à¤‚à¤µà¤¾à¤¦","à¤­à¤¾à¤°à¤¤à¤¿, à¤œà¤¯, à¤µà¤¿à¤œà¤¯à¤•à¤°à¥‡!","à¤à¤¾à¤à¤¸à¥€ à¤•à¥€ à¤°à¤¾à¤¨à¥€","à¤˜à¤° à¤•à¥€ à¤¯à¤¾à¤¦","à¤…à¤ªà¤ à¤¿à¤¤ à¤—à¤¦à¥à¤¯à¤¾à¤‚à¤¶ (R1, R2)","à¤…à¤ªà¤ à¤¿à¤¤ à¤•à¤¾à¤µà¥à¤¯à¤¾à¤‚à¤¶ (R1)","à¤µà¥à¤¯à¤¾à¤•à¤°à¤£ - à¤‰à¤ªà¤¸à¤°à¥à¤— à¤”à¤° à¤ªà¥à¤°à¤¤à¥à¤¯à¤¯ (R1, R2)","à¤²à¥‡à¤–à¤¨ - à¤…à¤¨à¥à¤šà¥à¤›à¥‡à¤¦ (R1, R2)","à¤µà¥à¤¯à¤¾à¤•à¤°à¤£ - à¤…à¤°à¥à¤¥ à¤•à¥€ à¤¦à¥ƒà¤·à¥à¤Ÿà¤¿ à¤¸à¥‡ à¤µà¤¾à¤•à¥à¤¯ à¤­à¥‡à¤¦ (R1)","à¤²à¥‡à¤–à¤¨ - à¤…à¤¨à¥Œà¤ªà¤šà¤¾à¤°à¤¿à¤• à¤ªà¤¤à¥à¤° (R1, R2)","à¤µà¥à¤¯à¤¾à¤•à¤°à¤£ - à¤…à¤²à¤‚à¤•à¤¾à¤° (à¤…à¤¨à¥à¤ªà¥à¤°à¤¾à¤¸, à¤¯à¤®à¤•, à¤¶à¥à¤²à¥‡à¤·) (R1)","à¤²à¥‡à¤–à¤¨ - à¤¸à¤‚à¤µà¤¾à¤¦ (R1, R2)","à¤µà¥à¤¯à¤¾à¤•à¤°à¤£ - à¤¸à¤®à¤¾à¤¨à¤¾à¤°à¥à¤¥à¥€ à¤¶à¤¬à¥à¤¦ (R2)","à¤²à¥‡à¤–à¤¨ - à¤¸à¥‚à¤šà¤¨à¤¾ (R1)","à¤µà¥à¤¯à¤¾à¤•à¤°à¤£ - à¤®à¥à¤¹à¤¾à¤µà¤°à¥‡ (R2)","à¤²à¥‡à¤–à¤¨ - à¤šà¤¿à¤¤à¥à¤° à¤µà¤°à¥à¤£à¤¨ (R2)","à¤µà¥à¤¯à¤¾à¤•à¤°à¤£ - à¤¸à¤‚à¤œà¥à¤žà¤¾, à¤¸à¤°à¥à¤µà¤¨à¤¾à¤®, à¤µà¤¿à¤¶à¥‡à¤·à¤£, à¤•à¥à¤°à¤¿à¤¯à¤¾ (R1)","à¤µà¥à¤¯à¤¾à¤•à¤°à¤£ - à¤µà¤¿à¤°à¤¾à¤® à¤šà¤¿à¤¹à¥à¤¨ (R2)","à¤µà¥à¤¯à¤¾à¤•à¤°à¤£ - à¤¸à¤‚à¤œà¥à¤žà¤¾, à¤¸à¤°à¥à¤µà¤¨à¤¾à¤®, à¤¨à¤¿à¤ªà¤¾à¤¤ (R2)"] },
  { name: "English (Kaveri)", emoji: "ðŸ“–", bg: "#7A6FD0", chapters: ["How I Taught My Grandmother to Read","The Pot Maker","Winds of Change","Vitamin-M","The World of Limitless Possibilities","Twin Melodies","Carrier of Words","Follow That Dream","Bharat Our Land","Gifts of Grace: Honouring Our Vocations","Canvas of Soil","I Cannot Remember My Mother","Nine Gold Medals","A Friend Found in Music","Words","Believe in Yourself","Reading - Case Based Passage","Reading - Discursive Passage","Writing - Diary Entry","Writing - Descriptive Paragraph","Writing - Short Story","Grammar - Gap Filling","Grammar - Editing","Grammar - Tenses","Grammar - Modals","Grammar - Subject Verb Concord","Grammar - Reported speech","Grammar - Determiners","Writing - Notice","Writing - Informal Invitation","Writing-Letter to Editor","Writing - E-Mail","Writing - Article","Writing - Factual Description","Writing - Descriptive Essay"] },
  { name: "Maths (Ganita Manjari)", emoji: "ðŸ“", bg: "#E8703A", chapters: ["The use of Coordinates","Introduction to Linear Polynomials","The World of Numbers","Exploring Algebraic Identities","I'm Up and Down, and Round and Round","Mensuration: Area and Perimeter","Introduction to Probability","Exploring Sequences and Progressions","Triangles: Congruence Theorems","4-gons (Quadrilaterals)","Mensuration Surface Area and Volume","Statistics","Lines and Angles","Introduction to Euclid's Geometry","Linear Equations in Two Variables"] },
  { name: "Computer Applications (165)", emoji: "ðŸ’»", bg: "#1C1C1E", chapters: ["Basics of IT","Cyber safety","Office tools","Scratch"] },
  { name: "Information Technology (402)", emoji: "ðŸ’»", bg: "#0F6E56", chapters: ["Introduction to IT-ITeS","Data Entry and Keyboarding Skills","Digital Documentation","Electronic Spreadsheet","Digital Presentation","Communication Skills - I","Self Management Skills - I","Basic ICT Skills - I","Entrepreneurship Skills - I","Green Skills - I"] },
  { name: "JSTSE Scholarship", emoji: "ðŸ†", bg: "#B0306B", chapters: ["GK - Current Affairs (2019-20)","GK - General Awareness","Physics","Chemistry","Biology","Mathematics"] },
  { name: "Science (Advanced)", emoji: "ðŸ§ª", bg: "#0F6E56", chapters: ["Measurement â€“ Foundation of Science","Understanding Motion through Experience","Newton's Laws of Motion","The Geometry of Power â€“ Advanced Simple Machines","Work and Energy","Structure of Atom","Chemical Bonding","Mixtures and their Separation","Microscope and Microscopy","Engineering Life: Miracles in Biotechnology"] },
  { name: "à¤¸à¤‚à¤¸à¥à¤•à¥ƒà¤¤ (à¤¶à¤¾à¤°à¤¦à¤¾)", emoji: "ðŸ•‰ï¸", bg: "#E8703A", chapters: ["à¤¸à¤¤à¥à¤¯à¤‚ à¤¶à¤¿à¤µà¤‚ à¤¸à¥à¤¨à¥à¤¦à¤°à¤‚ à¤¸à¤‚à¤¸à¥à¤•à¥ƒà¤¤à¤®à¥","à¤¸à¥à¤–à¤¸à¥à¤¯ à¤®à¥‚à¤²à¤‚ à¤§à¤°à¥à¤®: à¤§à¤°à¥à¤®à¤¸à¥à¤¯ à¤®à¥‚à¤²à¤®à¥ à¤…à¤°à¥à¤¥à¤ƒ"] },
  { name: "Maths (Advanced)", emoji: "ðŸ“", bg: "#0C8F88", chapters: ["Sets","Logarithms","Coordinate Geometry","Combinatorics","Exploring Some more Progressions","Relations and Functions"] },
];

// Important-Questions subject list for the chosen class. Class 11 keeps the
// API-backed PYQ_SUBJECTS. Class 12 swaps Physics for its 14 chapters (API-backed,
// data in the DB at class_level=12) and Chemistry for its 10 chapters (bundled
// locally); the other subjects are marked "coming soon" so they don't hit the
// API with Class-11 chapter names. Class 7 â†’ the 6 new-syllabus subjects above.
// Class 10 â€” Resources has DB-backed Revision Notes, but no Practice content
// (PYQ / Important Qs) is imported yet, so Practice lists the real Class-10
// subjects as "coming soon" rather than falling back to Class-11's subjects.
const CLASS10_PRACTICE_SUBJECTS = [
  { name: 'Mathematics',                   emoji: 'ðŸ“', bg: '#444',    chapters: [], comingSoon: true },
  { name: 'Science',                       emoji: 'ðŸ”¬', bg: '#5AA84F', chapters: [], comingSoon: true },
  { name: 'Social Science',                emoji: 'ðŸŒ', bg: '#2F80ED', chapters: [], comingSoon: true },
  { name: 'English Communicative (101)',   emoji: 'ðŸ“–', bg: '#7A6FD0', chapters: [], comingSoon: true },
  { name: 'Artificial Intelligence (417)', emoji: 'ðŸ¤–', bg: S.ink, chapters: [], comingSoon: true },
];

const impSubjectsForClass = (cls) => {
  if (cls === 'Class 10') return CLASS10_PRACTICE_SUBJECTS;
  if (cls === 'Class 12') {
    return PYQ_SUBJECTS.filter((sub) => sub.name !== 'Biology').map((sub) => {
      if (sub.name === 'Physics') return { ...sub, chapters: PHYSICS12_IMP_CHAPTERS };
      if (sub.name === 'Chemistry') return { ...sub, chapters: CHEMISTRY12_CHAPTERS };
      if (sub.name === 'Mathematics') return { ...sub, chapters: MATHS12_CHAPTERS };
      return { ...sub, chapters: [], comingSoon: true };
    });
  }
  if (cls === 'Class 7') return CLASS7_IMP_SUBJECTS;
  if (cls === 'Class 8') return CLASS8_IMP_SUBJECTS;
  if (cls === 'Class 9') return CLASS9_IMP_SUBJECTS;
  return PYQ_SUBJECTS;
};

// Previous-Year-Questions subject list for the chosen class. Class 11 keeps the
// API-backed PYQ_SUBJECTS. Class 12 swaps Physics for its 14 chapters (API-backed
// too â€” chapter availability comes from the API) and Chemistry for its 10 chapters
// (bundled locally); the other subjects are marked "coming soon" so they don't hit
// the API with Class-11 chapter names.
const pyqSubjectsForClass = (cls) => {
  if (cls === 'Class 10') return CLASS10_PRACTICE_SUBJECTS;
  if (cls === 'Class 12') {
    return PYQ_SUBJECTS.filter((sub) => sub.name !== 'Biology').map((sub) => {
      if (sub.name === 'Physics') return { ...sub, chapters: PHYSICS12_IMP_CHAPTERS };
      if (sub.name === 'Chemistry') return { ...sub, chapters: CHEMISTRY12_CHAPTERS };
      if (sub.name === 'Mathematics') return { ...sub, chapters: MATHS12_CHAPTERS };
      return { ...sub, chapters: [], comingSoon: true };
    });
  }
  // Class 9 â€” Previous Year Questions are DB-backed (sections type_key='pyq',
  // class_level=9) for JSTSE Scholarship + Computer Applications. Chapter
  // availability is still confirmed via the API per chapter.
  if (cls === 'Class 9') {
    return [
      { name: 'JSTSE Scholarship', emoji: 'ðŸ†', bg: '#B0306B', chapters: ['GK - Current Affairs (2019-20)', 'GK - General Awareness', 'Physics', 'Chemistry', 'Biology', 'Mathematics'] },
      { name: 'Computer Applications (165)', emoji: 'ðŸ’»', bg: S.ink, chapters: ['Basics of IT', 'Office tools'] },
    ];
  }
  return PYQ_SUBJECTS;
};

// Mock-test subject list, class-aware. Class 9 has DB-backed mocks for Old - Maths
// (examin8 resource 1234, class_level=9); other classes keep the senior PCMB list.
const MOCK_SUBJECTS_CLASS9 = [
  { name: 'Old - Maths',     emoji: 'âž—', bg: '#0F6E56', chapters: [] },
  { name: 'Old - Science',   emoji: 'âš—ï¸', bg: '#5AA84F', chapters: [] },
  { name: 'Old - Social Sc', emoji: 'ðŸ›ï¸', bg: '#8A5A2B', chapters: [] },
  { name: 'Old - Eng Lang',  emoji: 'ðŸ“–', bg: '#7A6FD0', chapters: [] },
  { name: 'Old - à¤¹à¤¿à¤‚à¤¦à¥€ à¤',    emoji: 'ðŸ“š', bg: '#2F80ED', chapters: [] },
  { name: 'Old - à¤¹à¤¿à¤‚à¤¦à¥€ à¤¬',    emoji: 'ðŸ“š', bg: '#26215C', chapters: [] },
];
const mockSubjectsForClass = (cls) =>
  classNum(cls) === 9 ? MOCK_SUBJECTS_CLASS9
  : classNum(cls) === 10 ? MOCK_SUBJECTS_CLASS10
  : dropBioForClass(PYQ_SUBJECTS, cls);
// A subject whose mocks come from the DB (mockTestsApi) rather than the static bank.
const isDbMockSubject = (subjectName, cls) =>
  DB_MOCK_SUBJECTS.includes(subjectName) || (classNum(cls) === 9 && subjectName.startsWith('Old - '));

const BackHeader = ({ onBack }) => (
  <View style={s.backHeader}>
    <TouchableOpacity onPress={onBack} style={s.backRow} activeOpacity={0.7}>
      <Text style={s.backArrow}>â†</Text>
      <Text style={s.backTxt}>Back</Text>
    </TouchableOpacity>
  </View>
);

// Dark header for the PYQ / Important Questions subject + chapter lists â€” same
// circular back-badge + title/subtitle pattern as the Practice landing page and
// Chapter Practice flow (Class11PracticeTests.js).
const DarkPageHeader = ({ title, subtitle, onBack }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[d.pageHeader, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity onPress={onBack} style={d.backBtn} activeOpacity={0.7} accessibilityLabel="Go back">
        <ChevronLeft size={19} color={D.ink} strokeWidth={2.6} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={d.pageTitle} numberOfLines={1}>{title}</Text>
        <Text style={d.pageSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
};

// Renders question-cards with MathJax. If `html` is passed (e.g. Important
// Questions, from static files) it's shown directly; otherwise the PYQ for the
// given subject/chapter is fetched from the API.
const PyqWebView = ({ html, subject, chapter, sectionType = 'pyq' }) => {
  const { selectedClass } = useAuth();
  const classLevel = classNum(selectedClass);
  const [status, setStatus] = useState(
    html != null
      ? { loading: false, error: null, html }
      : { loading: true, error: null, html: null }
  );

  useEffect(() => {
    // Ready HTML provided (Important Questions) â€” no fetch needed.
    if (html != null) {
      setStatus({ loading: false, error: null, html });
      return;
    }
    // Otherwise fetch this chapter's questions from the API (PYQ).
    let alive = true;
    setStatus({ loading: true, error: null, html: null });
    getQuestionsByPath(subjectSlug(subject), slugify(chapter), sectionType, classLevel)
      .then((questions) => {
        if (!alive) return;
        const h = questions && questions.length ? buildFragmentFromQuestions(questions) : '';
        setStatus({ loading: false, error: null, html: h });
      })
      .catch((err) => {
        if (!alive) return;
        const msg = err?.response?.data?.error || err?.message || 'Could not load questions';
        setStatus({ loading: false, error: msg, html: null });
      });
    return () => { alive = false; };
  }, [html, subject, chapter, sectionType, classLevel]);

  if (status.loading) {
    return (
      <View style={[s.webLoading, { position: 'relative', flex: 1 }]}>
        <ActivityIndicator size="large" color={S.indigo} />
      </View>
    );
  }
  if (status.error) {
    return (
      <View style={s.emptyWrap}>
        <Text style={s.emptyTitle}>Couldn't load</Text>
        <Text style={s.emptySub}>{status.error}</Text>
      </View>
    );
  }
  if (!status.html) {
    return (
      <View style={s.emptyWrap}>
        <Text style={s.emptyTitle}>Coming soon</Text>
        <Text style={s.emptySub}>
          Questions for this chapter haven't been added yet.
        </Text>
      </View>
    );
  }
  return (
    <View style={{ flex: 1, backgroundColor: '#f4f4f5' }}>
      <WebView
        originWhitelist={['*']}
        source={{ html: buildPyqDocument(status.html, { collapsible: sectionType === 'important_questions' }) }}
        style={{ flex: 1, backgroundColor: '#f4f4f5' }}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        androidLayerType={Platform.OS === 'android' ? 'hardware' : undefined}
      />
    </View>
  );
};

// Chapter list for a subject â€” marks which chapters actually have data for the
// given section type (from API). Reused for PYQ and Important Questions.
const ChapterList = ({
  subject, onBack, onPick,
  sectionType = 'pyq',
  subtitle = 'Select a chapter',
  availableLabel = 'View previous year questions',
  localChapters = null, // Set<slug> with content â†’ skip the API (local data)
}) => {
  const { selectedClass } = useAuth();
  const classLevel = classNum(selectedClass);
  // localChapters (Set<slug>) â†’ bundled-data mode: filter the candidate list.
  // Otherwise â†’ API mode: the chapter names + order come straight from the DB, so
  // no local chapter list is needed (the DB is the single source of truth).
  const [chapters, setChapters] = useState(
    localChapters ? subject.chapters.filter((ch) => localChapters.has(slugify(ch))) : null
  );

  useEffect(() => {
    if (localChapters) { setChapters(subject.chapters.filter((ch) => localChapters.has(slugify(ch)))); return; }
    let alive = true;
    setChapters(null);
    getChapters(subjectSlug(subject.name), sectionType, classLevel)
      .then((chs) => { if (alive) setChapters((chs || []).map((c) => c.name)); })
      .catch(() => { if (alive) setChapters([]); });
    return () => { alive = false; };
  }, [subject, sectionType, localChapters, classLevel]);

  return (
    <View style={d.safe}>
      <StatusBar barStyle="light-content" backgroundColor={D.canvas} />
      <DarkPageHeader title={subject.name} subtitle={subtitle} onBack={onBack} />
      {/* Only show chapters that actually have data for this section; hide the rest
          (no more "Coming soon" rows). `available` is null while loading. */}
      {chapters === null ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 }}>
          <ActivityIndicator size="large" color={D.cyan} />
          <Text style={{ fontSize: 13, color: D.muted, fontFamily: FONT.semibold, textAlign: 'center', marginTop: 12 }}>Loadingâ€¦</Text>
        </View>
      ) : (() => {
        const visible = chapters;
        if (visible.length === 0) {
          return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 }}>
              <Text style={{ fontSize: 16, fontFamily: FONT.black, color: D.ink, marginBottom: 8 }}>Coming soon</Text>
              <Text style={{ fontSize: 13, color: D.muted, fontFamily: FONT.semibold, textAlign: 'center', lineHeight: 19 }}>
                {subject.name} content for this section hasn't been added for this class yet.
              </Text>
            </View>
          );
        }
        return (
          <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 32 }}>
            {visible.map((chapter, i) => {
              const { tint, soft } = SUBJECT_TINTS[i % SUBJECT_TINTS.length];
              return (
                <TouchableOpacity key={i} style={d.chapterRow} activeOpacity={0.8}
                  onPress={() => onPick(chapter)}>
                  <View style={[d.chapterNum, { backgroundColor: soft }]}><Text style={[d.chapterNumTxt, { color: tint }]}>{i + 1}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={d.chapterName} numberOfLines={2}>{chapter}</Text>
                    <Text style={d.chapterSub}>{availableLabel}</Text>
                  </View>
                  <ChevronRight size={19} color={D.faint} strokeWidth={2.2} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        );
      })()}
    </View>
  );
};

// Renders the MCQ test. Questions come from the DB-backed API (per chapter,
// across its subtopics). Empty list (e.g. Physics â€” no MCQ data) â†’ McqQuizScreen
// shows its "No questions" state. No local sample fallback.
const McqLoader = ({ subject, chapter, subtopicId, onExit }) => {
  const { selectedClass } = useAuth();
  const classLevel = classNum(selectedClass);
  const [state, setState] = useState({ loading: true, questions: null });

  useEffect(() => {
    let alive = true;
    setState({ loading: true, questions: null });
    // Subtopic selected â†’ that subtopic's questions; else the whole chapter.
    const req = subtopicId != null
      ? getMcqSubtopicTest(subtopicId)
      : getMcqChapterTest(subjectSlug(subject), slugify(chapter), classLevel);
    req
      .then((data) => {
        if (!alive) return;
        setState({
          loading: false,
          questions: (data && data.questions) || [],
          subtopicName: data && data.subtopic && data.subtopic.name,
        });
      })
      .catch(() => {
        if (!alive) return;
        setState({ loading: false, questions: [] });
      });
    return () => { alive = false; };
  }, [subject, chapter, subtopicId, classLevel]);

  if (state.loading) {
    // Dark, because this hands straight off to McqQuizScreen's dark
    // `mcq-question-dark` frame â€” a light spinner in between reads as a flash.
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: MCQ_CANVAS }}>
        <StatusBar barStyle="light-content" backgroundColor={MCQ_CANVAS} />
        {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: MCQ_CANVAS }} />}
        {/* A way out stays on screen â€” the fetch can be slow on a bad connection. */}
        <TouchableOpacity onPress={onExit} hitSlop={10} style={s.mcqLoadBack} accessibilityRole="button" accessibilityLabel="Back">
          <ChevronLeft size={20} color="#FFFFFF" strokeWidth={2.4} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primaryLight} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <McqQuizScreen
      subject={subject}
      chapter={chapter}
      subtopicName={state.subtopicName}
      questions={state.questions}
      onExit={onExit}
      onComplete={({ correct, total, answers }) => {
        // Record the practice attempt locally so the Class-11 Practice cards can
        // mark this test "Completed" and power its "Attempted" filter.
        if (!total) return;
        const percent = Math.round((correct / total) * 100);
        savePracticeAttempt(practiceAttemptKey(classLevel, subject, chapter, subtopicId), {
          score: correct, total, percent, date: new Date().toISOString(),
        });
        // Also persist server-side, so the attempt reaches the parent's progress
        // view. Fire-and-forget â€” the local record above is what this screen reads,
        // so a failed sync must never block or alter the result the student sees.
        if (subtopicId != null && answers && Object.keys(answers).length) {
          submitMcqTest(subtopicId, answers).catch(() => {});
        }
      }}
    />
  );
};

const PracticeScreen = () => {
  const { selectedClass, setSelectedClass, scope, isClassReady } = useAuth();
  const insets = useSafeAreaInsets();

  // Class 6 & 9 subject lists are DB-driven (no hardcoded arrays) â€” filter the
  // fetched list by feature. Other classes keep their existing hardcoded lists.
  const dynClass = classNum(selectedClass);
  const isDyn = DYNAMIC_CLASSES.includes(dynClass);
  const dynSubjects = useClassSubjects(dynClass, isDyn);
  const dynBy = (flag) => (dynSubjects || []).filter((s) => s[flag]).map((s) => toTile(s, { chapters: [] }));
  const impSubjects = isDyn ? dynBy('importantQuestions') : impSubjectsForClass(selectedClass);
  const pyqSubjects = isDyn ? dynBy('pyq') : pyqSubjectsForClass(selectedClass);
  const mockSubjects = isDyn ? dynBy('mock') : mockSubjectsForClass(selectedClass);

  // Previous Year Papers navigation
  const [pyqOpen, setPyqOpen]       = useState(false);   // showing the PYQ subject list
  const [pyqSubject, setPyqSubject] = useState(null);    // chosen subject (object)
  const [pyqChapter, setPyqChapter] = useState(null);    // chosen chapter (string)

  // Important Questions navigation (mirrors the PYQ flow)
  const [impReader, setImpReader]   = useState(false);   // chapter screen -> question reader
  const [impOpen, setImpOpen]       = useState(false);   // showing the Important Q subject list
  const [impSubject, setImpSubject] = useState(null);    // chosen subject (object)
  const [impChapter, setImpChapter] = useState(null);    // chosen chapter (string)

  // MCQ Practice navigation: McqPracticeScreen (progress picker) -> McqLoader (test)
  const [mcqOpen, setMcqOpen] = useState(false);         // showing the practice picker
  const [mcqSel, setMcqSel]   = useState(null);          // { subject, chapter } once chosen

  // Mock Test (DB-backed): subject list -> mock list -> McqTestScreen.
  const [mockOpen, setMockOpen]       = useState(false);  // showing the Mock Test subject list
  const [mockOpenSub, setMockOpenSub] = useState(null);   // which subject section is expanded
  // DB-backed list + attempt data per subject:
  // { [subject]: { loading, error, tests:[{id,name,durationMin,questionCount}], attempts:{ [testId]: {bestScore,total,attempts} } } }
  const [mockData, setMockData]       = useState({});
  // Active DB test: { subject, label, testId, status:'loading'|'ready'|'error', questions, sections, durationMin, name, error }
  const [physMock, setPhysMock]       = useState(null);
  // Retest confirmation when re-opening an already-attempted test: { subject, test, att }
  const [retest, setRetest]           = useState(null);

  // Online Tests: subject -> chapter list (OnlineTestsScreen) -> attempt (TestQuestionScreen)
  const [chOpen, setChOpen] = useState(false);  // showing the chapter list
  const [chSel, setChSel]   = useState(null);   // chosen { subject, chapterId, chapterName, questions }
  const [chResult, setChResult] = useState(null);  // computed report after an online test
  const [chReview, setChReview] = useState(false); // showing the per-question review
  // When the current online test was opened â€” TestQuestionScreen only counts down,
  // it never reports elapsed time, so time-taken is measured here.
  const chStartRef = useRef(null);
  useEffect(() => { if (chSel && !chStartRef.current) chStartRef.current = Date.now(); }, [chSel]);

  // Full-screen test: hide the bottom tab bar while a DB mock test is open.
  const navigation = useNavigation();
  useEffect(() => {
    const inTest = !!physMock;
    navigation.setOptions({ tabBarStyle: inTest ? { display: 'none' } : undefined });
    return () => navigation.setOptions({ tabBarStyle: undefined });
  }, [physMock, navigation]);

  // Re-tapping the active Practice tab scrolls the landing back to top (F8).
  const scrollRef = useRef(null);
  useEffect(() => {
    const unsub = navigation.addListener('tabPress', () => {
      if (navigation.isFocused()) scrollRef.current?.scrollTo({ y: 0, animated: true });
    });
    return unsub;
  }, [navigation]);

  // Mock lists/attempts are keyed by subject only, but differ by class. Clear the
  // cache and collapse any open section when the class changes so the right rows
  // load on next open (Class 12 mocks are seeded at class_level=12).
  useEffect(() => {
    setMockData({});
    setMockOpenSub(null);
  }, [selectedClass]);

  // Fetch the DB mock-test list + this user's attempt summary for a subject.
  const loadSubjectTests = async (subject) => {
    const classLevel = classNum(selectedClass);
    setMockData(prev => ({
      ...prev,
      [subject]: { loading: true, error: '', tests: (prev[subject] && prev[subject].tests) || [], attempts: (prev[subject] && prev[subject].attempts) || {} },
    }));
    try {
      const [listRes, attRes] = await Promise.all([
        listMockTests(subject, classLevel),
        listMockAttempts(subject, classLevel).catch(() => ({ attempts: [] })),
      ]);
      const attempts = {};
      for (const a of (attRes.attempts || [])) attempts[a.testId] = a;
      setMockData(prev => ({ ...prev, [subject]: { loading: false, error: '', tests: (listRes.tests || []), attempts } }));
    } catch (e) {
      setMockData(prev => ({ ...prev, [subject]: { loading: false, error: e?.response?.data?.error || e?.message || 'Could not load tests.', tests: [], attempts: {} } }));
    }
  };

  // Refresh just the attempt summary (after a test is submitted) so badges update.
  const refreshAttempts = async (subject) => {
    try {
      const res = await listMockAttempts(subject, classNum(selectedClass));
      const attempts = {};
      for (const a of (res.attempts || [])) attempts[a.testId] = a;
      setMockData(prev => ({ ...prev, [subject]: { ...(prev[subject] || { tests: [], loading: false, error: '' }), attempts } }));
    } catch (e) { /* non-fatal */ }
  };

  // Toggle a subject section open/closed; lazy-load its DB tests on first open.
  const openSubjectSection = (subjectName) => {
    const willOpen = mockOpenSub !== subjectName;
    setMockOpenSub(willOpen ? subjectName : null);
    if (willOpen && isDbMockSubject(subjectName, selectedClass) && !mockData[subjectName]) loadSubjectTests(subjectName);
  };

  // Launch a test â€” fetch the questions from the DB (all subjects/classes).
  const startDbMock = (subject, test) => {
    setPhysMock({ subject, label: test.name, testId: test.id, status: 'loading' });
    getMockTestQuestions(test.id)
      .then((data) => setPhysMock({
        subject, label: test.name, testId: test.id, status: 'ready',
        questions: (data && data.questions) || [],
        sections: (data && data.sections) || [],
        durationMin: test.durationMin || 90,
        name: test.name,
      }))
      .catch((e) => setPhysMock({ subject, label: test.name, testId: test.id, status: 'error', error: e?.response?.data?.error || e?.message || 'Could not load this test.' }));
  };

  // Tapping a test: if already attempted, confirm a retest first; else start it.
  const onPickTest = (subject, test, att) => {
    if (att) setRetest({ subject, test, att });
    else startDbMock(subject, test);
  };

  const retryDbMock = () => {
    if (!physMock) return;
    const sub = physMock.subject;
    const list = (mockData[sub] && mockData[sub].tests) || [];
    const test = list.find(t => t.id === physMock.testId) || list.find(t => t.name === physMock.label);
    if (test) startDbMock(sub, test);
  };

  // Exit the test and return to the subject's mock list; refresh attempt badges.
  const closePhysMock = () => {
    const sub = physMock && physMock.subject;
    setPhysMock(null);
    // Local Class 12 Mathematics mocks have no server-side attempt summary to refresh.
    if (sub && isDbMockSubject(sub, selectedClass)) refreshAttempts(sub);
  };

  // Leaving the Practice tab resets all sub-navigation so it opens fresh next
  // time (fixes the bug where returning re-opened the last mock test).
  useFocusEffect(useCallback(() => () => {
    setPyqOpen(false); setPyqSubject(null); setPyqChapter(null);
    setImpOpen(false); setImpSubject(null); setImpChapter(null); setImpReader(false);
    setMcqOpen(false); setMcqSel(null);
    setMockOpen(false); setMockOpenSub(null); setPhysMock(null); setRetest(null);
    setChOpen(false); setChSel(null); setChResult(null);
  }, []));

  // â”€â”€ PYQ LEVEL 3: Previous-year questions for a chapter (fetched from API) â”€â”€â”€â”€
  if (pyqOpen && pyqSubject && pyqChapter) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={S.canvas} />
        {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: S.canvas }} />}
        <BackHeader onBack={() => setPyqChapter(null)} />
        <View style={s.pageTitleWrap}>
          <Text style={s.pageTitle}>{pyqChapter}</Text>
          <Text style={s.pageSub}>{pyqSubject.name}  â€¢  Previous Year Questions</Text>
        </View>
        <PyqWebView
          subject={pyqSubject.name}
          chapter={pyqChapter}
        />
      </SafeAreaView>
    );
  }

  // â”€â”€ PYQ LEVEL 2: Chapter list for the chosen subject â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (pyqOpen && pyqSubject) {
    // "Coming soon" subjects pass an empty set so none show as available; every
    // other subject (incl. Class 12 Physics, Chemistry & Maths) queries the API
    // for per-chapter availability.
    const localChapters = pyqSubject.comingSoon ? new Set() : null;
    return (
      <ChapterList
        subject={pyqSubject}
        sectionType="pyq"
        localChapters={localChapters}
        onBack={() => setPyqSubject(null)}
        onPick={(chapter) => setPyqChapter(chapter)}
      />
    );
  }

  // â”€â”€ PYQ LEVEL 1: Subject list â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (pyqOpen) {
    return (
      <View style={d.safe}>
        <StatusBar barStyle="light-content" backgroundColor={D.canvas} />
        <DarkPageHeader title="Previous Year Papers" subtitle="Select a subject  â€¢  10 years question bank" onBack={() => setPyqOpen(false)} />
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}>
          {pyqSubjects.map((subject, i) => (
            <TouchableOpacity key={i} style={d.subjectCard} activeOpacity={0.8}
              onPress={() => setPyqSubject(subject)}>
              <View style={[d.subjectIcon, { backgroundColor: subject.bg }]}>
                <Text style={{ fontSize: 26 }}>{subject.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={d.subjectName}>{subject.name}</Text>
                <Text style={d.subjectSub}>
                  {subject.comingSoon ? 'Coming soon' : (subject.chapters?.length ? `${subject.chapters.length} chapters` : 'View chapters')}
                </Text>
              </View>
              <ChevronRight size={19} color={D.faint} strokeWidth={2.2} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  // â”€â”€ IMPORTANT QUESTIONS LEVEL 3: the chapter screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // The progress card, the recommended-next question and the question series, all
  // from GET /api/resources/progress/... Opening any question hands off to the
  // reader below, which is the same MathJax WebView as before â€” the chapter view
  // changed, how a question is read did not.
  if (impOpen && impSubject && impChapter && !impReader) {
    return (
      <ChapterPracticeScreen
        subject={{ name: impSubject.name, slug: subjectSlug(impSubject.name) }}
        chapter={{ name: impChapter, slug: slugify(impChapter) }}
        sectionType="important_questions"
        classLevel={classNum(selectedClass)}
        tabs={[{ key: 'important_questions', label: 'Important Qs' }]}
        activeTab="important_questions"
        onOpenQuestion={(q) => setImpReader(q && q.id != null ? q.id : true)}
        onBack={() => setImpChapter(null)}
      />
    );
  }

  // â”€â”€ IMPORTANT QUESTIONS LEVEL 3b: the question reader â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (impOpen && impSubject && impChapter && impReader) {
    return (
      <QuestionSolveScreen
        subject={{ name: impSubject.name, slug: subjectSlug(impSubject.name) }}
        chapter={{ name: impChapter, slug: slugify(impChapter) }}
        sectionType="important_questions"
        classLevel={classNum(selectedClass)}
        startQuestionId={typeof impReader === 'number' ? impReader : null}
        onBack={() => setImpReader(false)}
      />
    );
  }

  // â”€â”€ IMPORTANT QUESTIONS LEVEL 2: Chapter list for the chosen subject â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (impOpen && impSubject) {
    // "Coming soon" subjects pass an empty set so none show as available; every
    // other subject (incl. Class 12 Physics, Chemistry & Maths) queries the API
    // for per-chapter availability.
    const localChapters = impSubject.comingSoon ? new Set() : null;
    return (
      <ChapterList
        subject={impSubject}
        sectionType="important_questions"
        subtitle="Select a chapter  â€¢  Important Questions"
        availableLabel="View important questions"
        localChapters={localChapters}
        onBack={() => setImpSubject(null)}
        onPick={(chapter) => setImpChapter(chapter)}
      />
    );
  }

  // â”€â”€ IMPORTANT QUESTIONS LEVEL 1: Subject list â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (impOpen) {
    return (
      <View style={d.safe}>
        <StatusBar barStyle="light-content" backgroundColor={D.canvas} />
        <DarkPageHeader title="Important Questions" subtitle="Select a subject  â€¢  Hand-picked must-do questions" onBack={() => setImpOpen(false)} />
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}>
          {impSubjects.map((subject, i) => (
            <TouchableOpacity key={i} style={d.subjectCard} activeOpacity={0.8}
              onPress={() => setImpSubject(subject)}>
              <View style={[d.subjectIcon, { backgroundColor: subject.bg }]}>
                <Text style={{ fontSize: 26 }}>{subject.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={d.subjectName}>{subject.name}</Text>
                <Text style={d.subjectSub}>
                  {subject.comingSoon ? 'Coming soon' : (subject.chapters?.length ? `${subject.chapters.length} chapters` : 'View chapters')}
                </Text>
              </View>
              <ChevronRight size={19} color={D.faint} strokeWidth={2.2} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  // â”€â”€ ONLINE TESTS: question-by-question review â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Driven off the raw submit payload kept on chResult, since the computed report
  // holds totals only.
  if (chOpen && chResult && chReview) {
    return (
      <OnlineTestReview
        title={`${chResult.title} â€” Review`}
        questions={chResult.questions}
        answers={chResult.answers}
        onBack={() => setChReview(false)}
        // The pinned button leaves the test for the practice list, the same exit
        // MockResultScreen's "Back to Practice" takes.
        onExit={() => { setChReview(false); setChResult(null); setChSel(null); setChOpen(false); }}
      />
    );
  }

  // â”€â”€ ONLINE TESTS: result / report screen (after submit) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (chOpen && chResult) {
    return (
      <MockResultScreen
        title={`${chResult.title} - Result`}
        result={chResult.data}
        onReview={() => setChReview(true)}
        // Retake really retakes, the way the Class 6â€“9 runner's does
        // (OnlineTestScreen sends its Result straight back to `running`). Dropping
        // chResult falls through to the `chOpen && chSel` branch below, which
        // remounts TestQuestionScreen â€” so answers, index and the countdown all
        // start over. The clock this screen keeps for timeTakenSec has to be
        // restarted by hand, since chSel doesn't change and its effect won't refire.
        onRetake={() => { setChReview(false); setChResult(null); chStartRef.current = Date.now(); }}
        onClose={() => { setChReview(false); setChResult(null); setChSel(null); setChOpen(false); }}
      />
    );
  }

  // â”€â”€ ONLINE TESTS: attempt the chosen chapter (real questions) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (chOpen && chSel) {
    return (
      <TestQuestionScreen
        bannerText={`${chSel.subject} Â· ${chSel.chapterName} â€¢ attempt the questions`}
        questions={chSel.questions}
        onExit={() => setChSel(null)}
        onSubmit={(payload) => {
          const data = computeMockResult(payload);
          // Record the attempt locally so the Class-11 Online Tests list can mark
          // this chapter "Completed" and power its "Attempted" filter. Keyed by
          // class:subject:chapterId; score = correct answers (1 mark each).
          const cls = classNum(selectedClass);
          if (cls != null && chSel.chapterId != null) {
            const total = data.total || 0;
            const percent = total ? Math.round((data.correct / total) * 100) : 0;
            // Include the test index (chSel.testId) so each of a chapter's tests
            // is tracked separately (Class 11 splits a chapter into many tests).
            const testPart = chSel.testId != null ? `:${chSel.testId}` : '';
            saveOnlineTestAttempt(`${cls}:${chSel.subject}:${chSel.chapterId}${testPart}`, {
              score: data.correct, total, percent, date: new Date().toISOString(),
            });
          }
          // Also record it server-side so it reaches the parent's progress view.
          // The server re-grades from offline_answer_keys â€” the local result above
          // is what this screen shows. Fire-and-forget: a failed sync must never
          // change what the student sees.
          const qs = payload?.questions || chSel.questions || [];
          submitOfflineTest({
            classLevel: cls,
            subject: chSel.subject,
            chapter: chSel.chapterName,
            testLabel: chSel.testId != null ? String(chSel.testId) : null,
            answers: payload?.answers || {},
            questionIds: qs.map((q) => q.id).filter((id) => id != null),
            timeTakenSec: chStartRef.current ? Math.round((Date.now() - chStartRef.current) / 1000) : 0,
          }).catch(() => {});
          chStartRef.current = null;

          // Keep the questions + answers, not just the totals â€” the review screen
          // needs the per-question detail that computeMockResult throws away.
          setChResult({
            title: chSel.chapterName,
            data,
            questions: payload?.questions || chSel.questions || [],
            answers: payload?.answers || {},
          });
          // chSel is deliberately KEPT: chResult is set, and the result branch is
          // checked before the attempt branch, so the runner stays hidden â€” but the
          // selection has to survive for Retake to have a test to re-open. It is
          // cleared when the student leaves (onClose / list back / tab focus).
        }}
      />
    );
  }

  // â”€â”€ ONLINE TESTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Class 7 & 8 â†’ DB-backed, timed testpapers from examin8 (OnlineTestScreen manages
  // its own subjects â†’ chapters â†’ tests â†’ instruction â†’ runner â†’ result â†’ review).
  // Other classes keep the offline-bank flow (OnlineTestsScreen).
  if (chOpen && [6, 7, 8, 9].includes(classNum(selectedClass))) {
    return <OnlineTestScreen onExit={() => setChOpen(false)} />;
  }
  if (chOpen) {
    return (
      <OnlineTestsScreen
        selectedClass={selectedClass}
        // chSel now outlives a submitted test (so Retake can re-open it), so it has
        // to be dropped on the way out â€” otherwise reopening Online Tests would
        // land straight back inside the last test instead of on this list.
        onBack={() => { setChOpen(false); setChSel(null); }}
        onStartTest={(sel) => setChSel(sel)}
      />
    );
  }

  // â”€â”€ MOCK TEST: the test itself (DB-backed, sectioned McqTestScreen) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // physMock is set the moment a test is picked; show loading / error / the test.
  if (physMock) {
    if (physMock.status === 'loading') {
      return (
        <SafeAreaView style={s.safe}>
          <StatusBar barStyle="dark-content" backgroundColor={S.canvas} />
          {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: S.canvas }} />}
          <BackHeader onBack={closePhysMock} />
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <ActivityIndicator size="large" color={S.indigo} />
            <Text style={s.pageSub}>Loading {physMock.label}â€¦</Text>
          </View>
        </SafeAreaView>
      );
    }
    if (physMock.status === 'error') {
      return (
        <SafeAreaView style={s.safe}>
          <StatusBar barStyle="dark-content" backgroundColor={S.canvas} />
          {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: S.canvas }} />}
          <BackHeader onBack={closePhysMock} />
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 30 }}>
            <Text style={{ fontSize: 40 }}>âš ï¸</Text>
            <Text style={[s.pageTitle, { textAlign: 'center' }]}>Couldn't load this test</Text>
            <Text style={[s.pageSub, { textAlign: 'center' }]}>{physMock.error}</Text>
            <TouchableOpacity
              style={{ marginTop: 8, backgroundColor: '#0FA39A', borderRadius: 50, paddingVertical: 12, paddingHorizontal: 28 }}
              activeOpacity={0.85}
              onPress={retryDbMock}>
              <Text style={{ color: '#fff', fontFamily: FONT.extrabold, fontSize: 14 }}>Retry</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }
    return (
      <McqTestScreen
        subject={physMock.subject}
        chapter={physMock.name || physMock.label}
        questions={physMock.questions}
        sections={physMock.sections}
        durationMin={physMock.durationMin}
        pointsPerCorrect={1}
        negative={0}
        onExit={closePhysMock}
        onSubmit={(payload) => {
          // Persist the attempt to the DB (scored authoritatively server-side).
          if (physMock.testId != null) {
            submitMockTest(physMock.testId, payload).catch(() => {});
          }
        }}
      />
    );
  }

  // â”€â”€ MOCK TEST: subject â†’ that subject's mock tests as cards (all classes) â”€â”€â”€â”€
  if (mockOpen) {
    return (
      <MockTestsCards
        subjects={mockSubjects}
        classLevel={classNum(selectedClass)}
        onBack={() => setMockOpen(false)}
        onStart={(subjectName, test) => startDbMock(subjectName, test)}
      />
    );
  }

  // â”€â”€ MCQ PRACTICE: the test itself (sub-topic preset, else chapter MCQs) â”€â”€â”€â”€â”€
  if (mcqOpen && mcqSel) {
    return (
      <McqLoader
        subject={mcqSel.subject}
        chapter={mcqSel.chapter}
        subtopicId={mcqSel.subtopicId}
        onExit={() => setMcqSel(null)}
      />
    );
  }

  // â”€â”€ MCQ PRACTICE: subject â†’ chapter â†’ tests card UI (all classes) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (mcqOpen) {
    return (
      <PracticeTestsCards
        onBack={() => setMcqOpen(false)}
        onStartChapter={(subject, chapter) => setMcqSel({ subject, chapter })}
        onStartSubtopic={(subject, chapter, subtopicId) => setMcqSel({ subject, chapter, subtopicId })}
      />
    );
  }

  // Real, working practice types â€” grouped by intent (practise vs assess). No fake data.
  const PRACTICE_GROUP = [
    { Icon: ListChecks, tint: D.indigo, soft: D.indigoSoft, label: 'Chapter practice',    sub: 'Multiple-choice questions, chapter by chapter', onPress: () => setMcqOpen(true) },
    { Icon: Star,       tint: D.cyan,   soft: D.cyanSoft,   label: 'Important questions', sub: 'Hand-picked must-do questions',                 onPress: () => setImpOpen(true) },
  ];
  const TEST_GROUP = [
    // Online tests clears any finished attempt on the way in: chSel now outlives a
    // submitted test so Retake can re-open it, and without this the entry point
    // would drop straight back inside the last one.
    { Icon: Timer,         tint: D.purple, soft: D.purpleSoft, label: 'Online tests',         sub: 'Timed tests, one chapter at a time', onPress: () => { setChSel(null); setChResult(null); setChReview(false); setChOpen(true); } },
    { Icon: ClipboardList, tint: D.rose,   soft: D.roseSoft,   label: 'Mock tests',           sub: 'Full subject-wise mock papers',       onPress: () => setMockOpen(true) },
    { Icon: History,       tint: D.gold,   soft: D.goldSoft,   label: 'Previous year papers', sub: 'Last 10 years, chapter-wise',          onPress: () => setPyqOpen(true) },
  ];
  const renderType = (t, i, arr) => (
    <TouchableOpacity
      key={t.label}
      style={[d.typeRow, i < arr.length - 1 && d.typeRowBorder]}
      activeOpacity={0.6}
      onPress={t.onPress}
    >
      <View style={[d.typeIcon, { backgroundColor: t.soft }]}><t.Icon size={19} color={t.tint} strokeWidth={2.2} /></View>
      <View style={{ flex: 1 }}>
        <Text style={d.typeTitle}>{t.label}</Text>
        <Text style={d.typeSub}>{t.sub}</Text>
      </View>
      <ChevronRight size={19} color={D.faint} strokeWidth={2.2} />
    </TouchableOpacity>
  );

  // â”€â”€ MAIN PRACTICE SCREEN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <View style={d.safe}>
      <StatusBar barStyle="light-content" backgroundColor={D.canvas} />
      <View style={[d.header, { paddingTop: insets.top + 8 }]}>
        <Text style={d.headerTitle}>Practice</Text>
        <Text style={d.headerSub}>Test yourself, chapter by chapter</Text>
      </View>

      {/* Students are locked to their own class; the switcher only shows if no class is set yet. */}
      {!scope?.classNum && <ClassTabs value={selectedClass} onChange={setSelectedClass} />}

      {/* No content seeded for the selected class (e.g. Class 7) â†’ premium empty
          state for everyone, never another class's content. selectedClass is the
          class being viewed (a tester's picked class, or a normal student's locked
          saved class), so this gates the exact class on screen. isClassReady is
          optimistic while its backend list loads, so this never flashes early. */}
      {selectedClass && !isClassReady(selectedClass) ? (
        <ComingSoon label="Practice" className={selectedClass} />
      ) : (
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <Text style={d.listLabel}>Practise</Text>
        <View style={d.typeList}>{PRACTICE_GROUP.map(renderType)}</View>
        <Text style={d.listLabel}>Tests</Text>
        <View style={d.typeList}>{TEST_GROUP.map(renderType)}</View>
      </ScrollView>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: S.canvas },
  // Practice-type list (landing)
  listLabel:        { fontSize: 12, fontFamily: FONT.extrabold, color: S.muted, letterSpacing: 0.6, textTransform: 'uppercase', marginHorizontal: 18, marginTop: 22, marginBottom: 10 },
  typeList:         { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: S.hair, overflow: 'hidden' },
  typeRow:          { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 17, paddingHorizontal: 16 },
  typeRowBorder:    { borderBottomWidth: 1, borderBottomColor: S.hair },
  typeIcon:         { width: 42, height: 42, borderRadius: 13, backgroundColor: S.canvas, alignItems: 'center', justifyContent: 'center' },
  typeTitle:        { fontSize: 15, fontFamily: FONT.bold, color: S.ink, letterSpacing: -0.2 },
  typeSub:          { fontSize: 12, fontFamily: FONT.semibold, color: S.muted, marginTop: 2 },
  header:           { backgroundColor: S.canvas, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1.5, borderBottomColor: S.hair },
  headerTitle:      { fontSize: 22, fontFamily: FONT.black, color: S.ink, letterSpacing: -0.5 },
  headerRight:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  xpBadge:          { backgroundColor: S.hair, borderRadius: 12, paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1.5, borderColor: S.border },
  xpTxt:            { fontSize: 12, fontFamily: FONT.extrabold, color: S.ink },

  // Back header + page title (PYQ / Important sub-screens)
  backHeader:       { backgroundColor: S.canvas, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1.5, borderBottomColor: S.hair },
  backRow:          { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backArrow:        { fontSize: 20, color: S.ink, fontFamily: FONT.bold },
  backTxt:          { fontSize: 15, fontFamily: FONT.bold, color: S.ink },
  pageTitleWrap:    { backgroundColor: S.canvas, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14, borderBottomWidth: 1.5, borderBottomColor: S.hair },
  pageTitle:        { fontSize: 20, fontFamily: FONT.black, color: S.ink, letterSpacing: -0.4 },
  pageSub:          { fontSize: 13, color: S.muted, fontFamily: FONT.semibold, marginTop: 3 },

  // Subject rows (PYQ / Important level 1)
  subjectRow:       { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1.5, borderColor: S.hair, flexDirection: 'row', alignItems: 'center', gap: 16, padding: 14 },
  subjectIconWrap:  { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  subjectName:      { fontSize: 17, fontFamily: FONT.black, color: S.ink, letterSpacing: -0.3 },
  subjectSub:       { fontSize: 12, color: S.muted, fontFamily: FONT.semibold, marginTop: 3 },

  // Generic list rows (chapters + papers)
  listRow:          { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1.5, borderColor: S.hair, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  listNum:          { width: 32, height: 32, borderRadius: 10, backgroundColor: S.hair, alignItems: 'center', justifyContent: 'center' },
  listNumTxt:       { fontSize: 14, fontFamily: FONT.black, color: S.ink },
  listRowTitle:     { fontSize: 15, fontFamily: FONT.extrabold, color: S.ink, letterSpacing: -0.2 },
  listRowSub:       { fontSize: 12, color: S.muted, fontFamily: FONT.semibold, marginTop: 3 },
  listArrow:        { fontSize: 18, color: S.faint, fontFamily: FONT.semibold },

  // Back affordance on the dark MCQ loading state (see McqLoader).
  mcqLoadBack:      { width: 34, height: 34, borderRadius: 12, marginTop: 6, marginLeft: 16, backgroundColor: '#141033', borderWidth: 1, borderColor: '#2B2F3A', alignItems: 'center', justifyContent: 'center' },

  // Question WebView + empty state
  webLoading:       { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  emptyWrap:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  emptyTitle:       { fontSize: 16, fontFamily: FONT.black, color: S.ink, marginBottom: 8 },
  emptySub:         { fontSize: 13, color: S.muted, fontFamily: FONT.semibold, textAlign: 'center', lineHeight: 19 },

  subChip:          { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.5, borderColor: S.border, backgroundColor: '#fff' },
  subChipActive:    { backgroundColor: S.ink, borderColor: S.ink },
  subChipTxt:       { fontSize: 13, fontFamily: FONT.extrabold, color: S.muted },
  subChipTxtActive: { color: '#fff' },
  subjectCard:      { marginHorizontal: 16, backgroundColor: S.ink, borderRadius: 22, padding: 18, marginBottom: 8 },
  subjectCardTop:   { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  subjectIconBig:   { width: 60, height: 60, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  subjectCardTitle: { fontSize: 18, fontFamily: FONT.black, color: '#fff', letterSpacing: -0.3 },
  subjectCardSub:   { fontSize: 12, color: '#888', fontFamily: FONT.semibold, marginTop: 3, marginBottom: 8 },
  progBarBg:        { height: 5, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 3, overflow: 'hidden' },
  progBarFill:      { height: 5, backgroundColor: '#fff', borderRadius: 3 },
  pctCircle:        { width: 48, height: 48, borderRadius: 24, borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  pctTxt:           { fontSize: 13, fontFamily: FONT.black, color: '#fff' },
  startBtn:         { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  startBtnTxt:      { fontSize: 15, fontFamily: FONT.black, color: S.ink, letterSpacing: -0.3 },
  sectionTitle:     { fontSize: 17, fontFamily: FONT.black, color: S.ink, letterSpacing: -0.3, paddingHorizontal: 16, marginTop: 16, marginBottom: 12 },

  // Important Questions banner (main screen)
  impBanner:        { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1.5, borderColor: S.goldSoft, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  impIconBox:       { width: 48, height: 48, borderRadius: 14, backgroundColor: S.goldSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: S.goldSoft },
  impTitle:         { fontSize: 15, fontFamily: FONT.black, color: S.ink, letterSpacing: -0.2 },
  impSub:           { fontSize: 12, color: S.muted, fontFamily: FONT.semibold, marginTop: 3 },
  impArrow:         { fontSize: 18, color: S.gold, fontFamily: FONT.bold },

  qTypesGrid:       { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10 },
  qTypeCard:        { width: '47%', backgroundColor: '#fff', borderRadius: 18, borderWidth: 1.5, borderColor: S.hair, padding: 16 },
  qTypeLabel:       { fontSize: 14, fontFamily: FONT.black, color: S.ink, letterSpacing: -0.3, marginBottom: 4 },
  qTypeSub:         { fontSize: 11, color: S.muted, fontFamily: FONT.semibold, lineHeight: 16, marginBottom: 10 },
  qTypeBadge:       { backgroundColor: S.hair, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10, alignSelf: 'flex-start' },
  qTypeBadgeTxt:    { fontSize: 10, fontFamily: FONT.extrabold, color: S.ink },
  practiceTestsCard:{ marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1.5, borderColor: S.hair, overflow: 'hidden', marginBottom: 4 },
  ptRow:            { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  ptRowBorder:      { borderBottomWidth: 1, borderBottomColor: S.hair },
  ptIconBox:        { width: 44, height: 44, backgroundColor: S.hair, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: S.border },
  ptLabel:          { fontSize: 14, fontFamily: FONT.extrabold, color: S.ink },
  ptSub:            { fontSize: 11, color: S.muted, fontFamily: FONT.semibold, marginTop: 2 },
  ptBadge:          { backgroundColor: S.hair, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10 },
  ptBadgeTxt:       { fontSize: 10, fontFamily: FONT.extrabold, color: S.ink },
  ptArrow:          { fontSize: 18, color: S.faint },
  recentCard:       { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1.5, borderColor: S.hair, overflow: 'hidden' },
  recentRow:        { flexDirection: 'row', alignItems: 'center', padding: 14, justifyContent: 'space-between' },
  recentRowBorder:  { borderBottomWidth: 1, borderBottomColor: S.hair },
  recentLeft:       {},
  recentSubject:    { fontSize: 14, fontFamily: FONT.extrabold, color: S.ink },
  recentTopic:      { fontSize: 12, color: S.muted, fontFamily: FONT.semibold, marginTop: 2 },
  recentRight:      { alignItems: 'flex-end', gap: 4 },
  scoreBadge:       { backgroundColor: S.hair, borderRadius: 10, paddingVertical: 5, paddingHorizontal: 12 },
  scoreBadgeHigh:   { backgroundColor: S.ink },
  scoreBadgeLow:    { backgroundColor: S.border },
  scoreTxt:         { fontSize: 13, fontFamily: FONT.black, color: '#fff' },
  recentDate:       { fontSize: 10, color: S.muted, fontFamily: FONT.semibold },

  // Mock Test â€” collapsible subject sections + DB-backed mock rows + retest modal
  mcqSection:       { marginBottom: 14 },
  mcqSectionHeader: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1.5, borderColor: S.hair, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  mcqSectionIcon:   { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  mcqSectionTitle:  { fontSize: 16, fontFamily: FONT.black, color: S.ink, letterSpacing: -0.3 },
  mcqSectionSub:    { fontSize: 12, color: S.muted, fontFamily: FONT.semibold, marginTop: 2 },
  mcqChevron:       { fontSize: 18, color: S.muted, fontFamily: FONT.bold },
  mockRow:          { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#EFF1F4', flexDirection: 'row', alignItems: 'center', gap: 14, padding: 15, shadowColor: '#2A2D3A', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  mockRowIcon:      { width: 42, height: 42, borderRadius: 12, backgroundColor: '#E1F5F3', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#C7E9E5' },
  mockRowIconDone:  { backgroundColor: '#E1F5F3', borderColor: '#C7E9E5' },
  mockRowTitle:     { fontSize: 15, fontFamily: FONT.extrabold, color: S.ink, letterSpacing: -0.2 },
  mockRowSub:       { fontSize: 12, color: S.muted, fontFamily: FONT.semibold, marginTop: 3 },
  mockRowChevron:   { fontSize: 20, color: S.faint, fontFamily: FONT.semibold },
  mockBadge:        { backgroundColor: '#E7F7EC', borderRadius: 8, paddingVertical: 5, paddingHorizontal: 10, borderWidth: 1, borderColor: '#CDEBD6' },
  mockBadgeTxt:     { fontSize: 11, fontFamily: FONT.extrabold, color: '#2C8C84' },
  mockRetryBtn:     { backgroundColor: '#0FA39A', borderRadius: 50, paddingVertical: 9, paddingHorizontal: 22 },
  mockRetryTxt:     { color: '#fff', fontSize: 13, fontFamily: FONT.extrabold },
  retestOverlay:    { flex: 1, backgroundColor: 'rgba(20,30,30,0.5)', alignItems: 'center', justifyContent: 'center', padding: 28 },
  retestCard:       { width: '100%', backgroundColor: '#fff', borderRadius: 18, padding: 22, alignItems: 'center' },
  retestTitle:      { fontSize: 17, fontFamily: FONT.black, color: S.ink, marginBottom: 6 },
  retestSub:        { fontSize: 13, fontFamily: FONT.semibold, color: S.muted, textAlign: 'center', lineHeight: 19, marginBottom: 18 },
  retestPrimary:    { alignSelf: 'stretch', backgroundColor: '#0E9A93', borderRadius: 50, paddingVertical: 13, alignItems: 'center' },
  retestPrimaryTxt: { color: '#fff', fontSize: 15, fontFamily: FONT.extrabold },
  retestCancel:     { color: S.muted, fontSize: 13, fontFamily: FONT.bold, marginTop: 14 },
});

// Dark styles for the Practice landing page + PYQ/Important-Questions subject and
// chapter lists (see the `D` palette above). Mock Tests, Online Tests and the
// question-content WebView stay on the light `s` StyleSheet above.
const d = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: D.canvas },
  header:        { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 16 },
  headerTitle:   { fontSize: 24, fontFamily: FONT.black, color: D.ink, letterSpacing: -0.5 },
  headerSub:     { fontSize: 13, fontFamily: FONT.semibold, color: D.sub, marginTop: 4 },

  listLabel:     { fontSize: 12, fontFamily: FONT.extrabold, color: D.indigo, letterSpacing: 0.6, textTransform: 'uppercase', marginHorizontal: 18, marginTop: 20, marginBottom: 10 },
  typeList:      { marginHorizontal: 16, backgroundColor: D.card, borderRadius: 18, borderWidth: 1, borderColor: D.hair, overflow: 'hidden' },
  typeRow:       { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16, paddingHorizontal: 16 },
  typeRowBorder: { borderBottomWidth: 1, borderBottomColor: D.hair },
  typeIcon:      { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  typeTitle:     { fontSize: 15, fontFamily: FONT.bold, color: D.ink, letterSpacing: -0.2 },
  typeSub:       { fontSize: 12, fontFamily: FONT.semibold, color: D.muted, marginTop: 2 },

  // Sub-screen header (PYQ / Important Questions subject + chapter lists) â€” a
  // back-badge + title/subtitle row, distinct from the landing header above.
  pageHeader:    { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingBottom: 16 },
  backBtn:       { width: 36, height: 36, borderRadius: 18, backgroundColor: D.card, borderWidth: 1, borderColor: D.hair, alignItems: 'center', justifyContent: 'center' },
  pageTitle:     { fontSize: 19, fontFamily: FONT.black, color: D.ink, letterSpacing: -0.4 },
  pageSubtitle:  { fontSize: 12.5, fontFamily: FONT.semibold, color: D.sub, marginTop: 2 },

  subjectCard:   { backgroundColor: D.card, borderRadius: 18, borderWidth: 1, borderColor: D.hair, flexDirection: 'row', alignItems: 'center', gap: 16, padding: 14 },
  subjectIcon:   { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  subjectName:   { fontSize: 17, fontFamily: FONT.black, color: D.ink, letterSpacing: -0.3 },
  subjectSub:    { fontSize: 12, color: D.muted, fontFamily: FONT.semibold, marginTop: 3 },

  chapterRow:    { backgroundColor: D.card, borderRadius: 16, borderWidth: 1, borderColor: D.hair, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  chapterNum:    { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  chapterNumTxt: { fontSize: 14, fontFamily: FONT.black },
  chapterName:   { fontSize: 15, fontFamily: FONT.extrabold, color: D.ink, letterSpacing: -0.2 },
  chapterSub:    { fontSize: 12, color: D.muted, fontFamily: FONT.semibold, marginTop: 3 },
});

export default PracticeScreen;
