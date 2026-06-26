import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, StatusBar, Platform, Image, Dimensions, ActivityIndicator, Alert,
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { WebView } from 'react-native-webview';

import { getExemplarSolutions, getNcertChapters } from '../api/resourcesApi';
import { getPhysics12ExemplarHtml } from '../data/physics12Exemplar';
import { getPhysics12Ncert1Html } from '../data/physics12Ncert1';
import { getPhysics12Ncert2Html } from '../data/physics12Ncert2';
import { useAuth } from '../context/AuthContext';
import { ClassTabs } from '../components/ClassPicker';
import { getChapterNotes } from '../notes/index';
import Ch2Images from '../notes/images/Ch2Images';
import ChapterNotesScreen, { buildHTML } from './ChapterNotesScreen';
import ChapterEndScreen from './ChapterEndScreen';
import Ncert2Screen from './Ncert2Screen';
import { ch1ExemplarQuestions } from '../data/ch1ExemplarQuestions';
import { ch2ExemplarQuestions } from '../data/ch2ExemplarQuestions';
import { ch3ExemplarQuestions } from '../data/ch3ExemplarQuestions';
import { ch4ExemplarQuestions } from '../data/ch4ExemplarQuestions';
import { ch5ExemplarQuestions } from '../data/ch5ExemplarQuestions';
import { ch6ExemplarQuestions } from '../data/ch6ExemplarQuestions';
import { ch7ExemplarQuestions } from '../data/ch7ExemplarQuestions';
import { ch8ExemplarQuestions } from '../data/ch8ExemplarQuestions';
import { ch9ExemplarQuestions } from '../data/ch9ExemplarQuestions';
import { ch10ExemplarQuestions } from '../data/ch10ExemplarQuestions';
import { ch11ExemplarQuestions } from '../data/ch11ExemplarQuestions';
import { ch12ExemplarQuestions } from '../data/ch12ExemplarQuestions';
import { ch13ExemplarQuestions } from '../data/ch13ExemplarQuestions';
import { ch14ExemplarQuestions } from '../data/ch14ExemplarQuestions';
import { ch1ChemExemplarQuestions } from '../data/ch1ChemExemplarQuestions';
import { ch2ChemExemplarQuestions } from '../data/ch2ChemExemplarQuestions';
import { ch3ChemExemplarQuestions } from '../data/ch3ChemExemplarQuestions';
import { ch4ChemExemplarQuestions } from '../data/ch4ChemExemplarQuestions';
import { ch5ChemExemplarQuestions } from '../data/ch5ChemExemplarQuestions';
import { ch6ChemExemplarQuestions } from '../data/ch6ChemExemplarQuestions';
import { ch7ChemExemplarQuestions } from '../data/ch7ChemExemplarQuestions';
import { ch8ChemExemplarQuestions } from '../data/ch8ChemExemplarQuestions';
import { ch9ChemExemplarQuestions } from '../data/ch9ChemExemplarQuestions';
import { ch10ChemExemplarQuestions } from '../data/ch10ChemExemplarQuestions';
import { ch11ChemExemplarQuestions } from '../data/ch11ChemExemplarQuestions';
import { ch12ChemExemplarQuestions } from '../data/ch12ChemExemplarQuestions';
import { ch13ChemExemplarQuestions } from '../data/ch13ChemExemplarQuestions';
import { ch14ChemExemplarQuestions } from '../data/ch14ChemExemplarQuestions';
import { setsExercise13, setsExamples12 } from '../data/ch1MathsExemplarQuestions';
import { relExercise23, relExamples22 } from '../data/ch2MathsExemplarQuestions';
import { trigExercise33, trigExamples32 } from '../data/ch3MathsExemplarQuestions';
import { pmiExercise43, pmiExamples42 } from '../data/ch4MathsExemplarQuestions';
import { complexExercise53, complexExamples52 } from '../data/ch5MathsExemplarQuestions';
import { linEqExercise63, linEqExamples62 } from '../data/ch6MathsExemplarQuestions';
import { pncExercise73, pncExamples72 } from '../data/ch7MathsExemplarQuestions';
import { binomialExercise83, binomialExamples82 } from '../data/ch8MathsExemplarQuestions';
import { seqExercise93, seqExamples92 } from '../data/ch9MathsExemplarQuestions';
import { straightExercise103, straightExamples102 } from '../data/ch10MathsExemplarQuestions';
import { conicExercise113, conicExamples112 } from '../data/ch11MathsExemplarQuestions';
import { geo3dExercise123, geo3dExamples122 } from '../data/ch12MathsExemplarQuestions';
import { limitsExercise133, limitsExamples132 } from '../data/ch13MathsExemplarQuestions';
import { reasoningExercise141, reasoningExercise142, reasoningExercise143 } from '../data/ch14MathsExemplarQuestions';
import { statsExercise153, statsExamples152 } from '../data/ch15MathsExemplarQuestions';
import { probExercise163, probExamples162 } from '../data/ch16MathsExemplarQuestions';
import { ch1BioExemplarQuestions } from '../data/ch1BioExemplarQuestions';
import { ch2BioExemplarQuestions } from '../data/ch2BioExemplarQuestions';
import { ch3BioExemplarQuestions } from '../data/ch3BioExemplarQuestions';
import { ch4BioExemplarQuestions } from '../data/ch4BioExemplarQuestions';
import { ch5BioExemplarQuestions } from '../data/ch5BioExemplarQuestions';
import { ch6BioExemplarQuestions } from '../data/ch6BioExemplarQuestions';
import { ch7BioExemplarQuestions } from '../data/ch7BioExemplarQuestions';
import { ch8BioExemplarQuestions } from '../data/ch8BioExemplarQuestions';
import { ch9BioExemplarQuestions } from '../data/ch9BioExemplarQuestions';
import { ch10BioExemplarQuestions } from '../data/ch10BioExemplarQuestions';
import { ch11BioExemplarQuestions } from '../data/ch11BioExemplarQuestions';
import { ch12BioExemplarQuestions } from '../data/ch12BioExemplarQuestions';
import { ch13BioExemplarQuestions } from '../data/ch13BioExemplarQuestions';
import { ch14BioExemplarQuestions } from '../data/ch14BioExemplarQuestions';
import { ch15BioExemplarQuestions } from '../data/ch15BioExemplarQuestions';
import { ch16BioExemplarQuestions } from '../data/ch16BioExemplarQuestions';
import { ch17BioExemplarQuestions } from '../data/ch17BioExemplarQuestions';
import { ch18BioExemplarQuestions } from '../data/ch18BioExemplarQuestions';
import { ch19BioExemplarQuestions } from '../data/ch19BioExemplarQuestions';
import { ch20BioExemplarQuestions } from '../data/ch20BioExemplarQuestions';
import { ch21BioExemplarQuestions } from '../data/ch21BioExemplarQuestions';
import { ch22BioExemplarQuestions } from '../data/ch22BioExemplarQuestions';

// Exemplar Chapter-end question sets, scoped by subject then chapter name.
// Add more subjects/chapters here as you extract them.
const EXEMPLAR_QUESTIONS = {
  Physics: {
    'Units and Measurements': ch1ExemplarQuestions,
    'Motion in A Straight Line': ch2ExemplarQuestions,
    'Motion in A Plane': ch3ExemplarQuestions,
    'Laws of Motion': ch4ExemplarQuestions,
    'Work Energy and Power': ch5ExemplarQuestions,
    'System of Particles and Rotational Motion': ch6ExemplarQuestions,
    'Gravitation': ch7ExemplarQuestions,
    'Mechanical Properties of Solids': ch8ExemplarQuestions,
    'Mechanical Properties of Fluids': ch9ExemplarQuestions,
    'Thermal Properties of Matter': ch10ExemplarQuestions,
    'Thermodynamics': ch11ExemplarQuestions,
    'Kinetic Theory': ch12ExemplarQuestions,
    'Oscillations': ch13ExemplarQuestions,
    'Waves': ch14ExemplarQuestions,
  },
  Chemistry: {
    'Some Basic Concepts of Chemistry': ch1ChemExemplarQuestions,
    'Structure of Atom': ch2ChemExemplarQuestions,
    'Classification of Elements and Periodicity in Properties': ch3ChemExemplarQuestions,
    'Chemical Bonding and Molecular Structure': ch4ChemExemplarQuestions,
    'States of Matter - Gases and Liquids (FA ONLY)': ch5ChemExemplarQuestions,
    'Chemical Thermodynamics': ch6ChemExemplarQuestions,
    'Equilibrium': ch7ChemExemplarQuestions,
    'Redox Reactions': ch8ChemExemplarQuestions,
    'Hydrogen': ch9ChemExemplarQuestions,
    'The s-Block Elements (FA ONLY)': ch10ChemExemplarQuestions,
    'Organic Chemistry Some Basic Principles and Techniques': ch11ChemExemplarQuestions,
    'Some p-Block Elements (FA ONLY)': ch12ChemExemplarQuestions,
    'Hydrocarbons': ch13ChemExemplarQuestions,
    'Environmental Chemistry': ch14ChemExemplarQuestions,
    // ...add chapters as extracted
  },
  Mathematics: {
    'Sets': [
      { label: 'Exercise 1.3', questions: setsExercise13 },
      { label: 'Examples 1.2', questions: setsExamples12 },
    ],
    'Relations and Functions': [
      { label: 'Exercise 2.3', questions: relExercise23 },
      { label: 'Examples 2.2', questions: relExamples22 },
    ],
    'Trigonometric Functions': [
      { label: 'Exercise 3.3', questions: trigExercise33 },
      { label: 'Examples 3.2', questions: trigExamples32 },
    ],
    'Principle of Mathematical Induction': [
      { label: 'Exercise 4.3', questions: pmiExercise43 },
      { label: 'Examples 4.2', questions: pmiExamples42 },
    ],
    'Complex Numbers and Quadratic Equations': [
      { label: 'Exercise 5.3', questions: complexExercise53 },
      { label: 'Examples 5.2', questions: complexExamples52 },
    ],
    'Linear Inequalities': [
      { label: 'Exercise 6.3', questions: linEqExercise63 },
      { label: 'Examples 6.2', questions: linEqExamples62 },
    ],
    'Permutations and Combinations': [
      { label: 'Exercise 7.3', questions: pncExercise73 },
      { label: 'Examples 7.2', questions: pncExamples72 },
    ],
    'Binomial Theorem': [
      { label: 'Exercise 8.3', questions: binomialExercise83 },
      { label: 'Examples 8.2', questions: binomialExamples82 },
    ],
    'Sequences and Series': [
      { label: 'Exercise 9.3', questions: seqExercise93 },
      { label: 'Examples 9.2', questions: seqExamples92 },
    ],
    'Straight Lines': [
      { label: 'Exercise 10.3', questions: straightExercise103 },
      { label: 'Examples 10.2', questions: straightExamples102 },
    ],
    'Conic Sections': [
      { label: 'Exercise 11.3', questions: conicExercise113 },
      { label: 'Examples 11.2', questions: conicExamples112 },
    ],
    'Introduction to Three Dimensional Geometry': [
      { label: 'Exercise 12.3', questions: geo3dExercise123 },
      { label: 'Examples 12.2', questions: geo3dExamples122 },
    ],
    'Limits and Derivatives': [
      { label: 'Exercise 13.3', questions: limitsExercise133 },
      { label: 'Examples 13.2', questions: limitsExamples132 },
    ],
    'Mathematical Reasoning': [
      { label: 'Exercise 14.1', questions: reasoningExercise141 },
      { label: 'Exercise 14.2', questions: reasoningExercise142 },
      { label: 'Exercise 14.3', questions: reasoningExercise143 },
    ],
    'Statistics': [
      { label: 'Exercise 15.3', questions: statsExercise153 },
      { label: 'Examples 15.2', questions: statsExamples152 },
    ],
    'Probability': [
      { label: 'Exercise 16.3', questions: probExercise163 },
      { label: 'Examples 16.2', questions: probExamples162 },
    ],
  },
  Biology: {
    'The Living World': ch1BioExemplarQuestions,
    'Biological Classification': ch2BioExemplarQuestions,
    'Plant Kingdom': ch3BioExemplarQuestions,
    'Animal Kingdom': ch4BioExemplarQuestions,
    'Morphology of Flowering Plants': ch5BioExemplarQuestions,
    'Anatomy of Flowering Plants': ch6BioExemplarQuestions,
    'Structural Organisation in Animals': ch7BioExemplarQuestions,
    'Cell The Unit of Life': ch8BioExemplarQuestions,
    'Biomolecules': ch9BioExemplarQuestions,
    'Cell Cycle and Cell Division': ch10BioExemplarQuestions,
    'Transport in Plants': ch11BioExemplarQuestions,
    'Mineral Nutrition': ch12BioExemplarQuestions,
    'Photosynthesis in Higher Plants': ch13BioExemplarQuestions,
    'Respiration in Plants': ch14BioExemplarQuestions,
    'Plant Growth and Development': ch15BioExemplarQuestions,
    'Digestion and Absorption': ch16BioExemplarQuestions,
    'Breathing and Exchange of Gases': ch17BioExemplarQuestions,
    'Body Fluids and Circulation': ch18BioExemplarQuestions,
    'Excretory Products and their Elimination': ch19BioExemplarQuestions,
    'Locomotion and Movement': ch20BioExemplarQuestions,
    'Neural Control and Coordination': ch21BioExemplarQuestions,
    'Chemical Coordination and Integration': ch22BioExemplarQuestions,
    // ...add chapters as extracted
  },
};

// Returns the tappable rows for a chapter's Exemplar page.
//  • flat question array (Physics/Chemistry)        -> one "Chapter-end" row
//  • array of { label, questions } (e.g. Maths)     -> one row per section
//  • no data                                        -> one empty "Chapter-end" row
const getExemplarSections = (subjectName, chapterName) => {
  const data = (EXEMPLAR_QUESTIONS[subjectName] || {})[chapterName];
  if (Array.isArray(data) && data.length > 0 && data[0] && data[0].questions !== undefined) {
    return data;
  }
  const fallbackLabel = subjectName === 'Mathematics' ? 'Exercise' : 'Chapter-end';
  return [{ label: fallbackLabel, questions: Array.isArray(data) ? data : [] }];
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const NOTE_IMG_WIDTH = SCREEN_WIDTH - 32;
const NOTE_IMG_HEIGHT = NOTE_IMG_WIDTH * 0.75;

const BOARDS  = ['CBSE', 'ICSE', 'State Board'];
const CLASSES = ['Class 9', 'Class 10', 'Class 11', 'Class 12'];

const SUBJECTS = [
  {
    name: 'Physics', emoji: '⚛️', bg: '#1C1C1E',
    chapters: [
      { name: 'Units and Measurements' },
      { name: 'Motion in A Straight Line' },
      { name: 'Motion in A Plane' },
      { name: 'Laws of Motion' },
      { name: 'Work Energy and Power' },
      { name: 'System of Particles and Rotational Motion' },
      { name: 'Gravitation' },
      { name: 'Mechanical Properties of Solids' },
      { name: 'Mechanical Properties of Fluids' },
      { name: 'Thermal Properties of Matter' },
      { name: 'Thermodynamics' },
      { name: 'Kinetic Theory' },
      { name: 'Oscillations' },
      { name: 'Waves' },
    ],
    chaptersByClass: {
      'Class 12': [
        { name: 'Electric Charges and Fields' },
        { name: 'Electrostatic Potential and Capacitance' },
        { name: 'Current Electricity' },
        { name: 'Moving Charges and Magnetism' },
        { name: 'Magnetism and Matter' },
        { name: 'Electromagnetic Induction' },
        { name: 'Alternating Current' },
        { name: 'Electromagnetic Waves' },
        { name: 'Ray Optics and Optical Instruments' },
        { name: 'Wave Optics' },
        { name: 'Dual Nature of Radiation and Matter' },
        { name: 'Atoms' },
        { name: 'Nuclei' },
        { name: 'Electronic Devices' },
      ],
    },
  },
  {
    name: 'Chemistry', emoji: '🧪', bg: '#333',
    chapters: [
      { name: 'Some Basic Concepts of Chemistry' },
      { name: 'Structure of Atom' },
      { name: 'Classification of Elements and Periodicity in Properties' },
      { name: 'Chemical Bonding and Molecular Structure' },
      { name: 'States of Matter - Gases and Liquids (FA ONLY)' },
      { name: 'Chemical Thermodynamics' },
      { name: 'Equilibrium' },
      { name: 'Redox Reactions' },
      { name: 'Hydrogen' },
      { name: 'The s-Block Elements (FA ONLY)' },
      { name: 'Some p-Block Elements (FA ONLY)' },
      { name: 'Organic Chemistry Some Basic Principles and Techniques' },
      { name: 'Hydrocarbons' },
      { name: 'Environmental Chemistry' },
    ],
  },
  {
    name: 'Mathematics', emoji: '📐', bg: '#444',
    chapters: [
      { name: 'Sets' },
      { name: 'Relations and Functions' },
      { name: 'Trigonometric Functions' },
      { name: 'Complex Numbers and Quadratic Equations' },
      { name: 'Linear Inequalities' },
      { name: 'Permutations and Combinations' },
      { name: 'Binomial Theorem' },
      { name: 'Sequences and Series' },
      { name: 'Straight Lines' },
      { name: 'Conic Sections' },
      { name: 'Introduction to Three Dimensional Geometry' },
      { name: 'Limits and Derivatives' },
      { name: 'Statistics' },
      { name: 'Probability' },
    ],
  },
  {
    name: 'Biology', emoji: '🧬', bg: '#555',
    chapters: [
      { name: 'The Living World' },
      { name: 'Biological Classification' },
      { name: 'Plant Kingdom' },
      { name: 'Animal Kingdom' },
      { name: 'Morphology of Flowering Plants' },
      { name: 'Anatomy of Flowering Plants' },
      { name: 'Structural Organisation in Animals' },
      { name: 'Cell The Unit of Life' },
      { name: 'Biomolecules' },
      { name: 'Cell Cycle and Cell Division' },
      { name: 'Transport in Plants' },
      { name: 'Mineral Nutrition' },
      { name: 'Photosynthesis in Higher Plants' },
      { name: 'Respiration in Plants' },
      { name: 'Plant Growth and Development' },
      { name: 'Digestion and Absorption' },
      { name: 'Breathing and Exchange of Gases' },
      { name: 'Body Fluids and Circulation' },
      { name: 'Excretory Products and their Elimination' },
      { name: 'Locomotion and Movement' },
      { name: 'Neural Control and Coordination' },
      { name: 'Chemical Coordination and Integration' },
    ],
  },
];

const RESOURCE_TYPES = [
  { icon: '📋', name: 'Revision Notes',         sub: '835 items',          type: 'notes'    },
  { icon: '🔄', name: 'Exemplar Solutions',      sub: 'Textbook Solutions', type: 'exemplar' },
  { icon: '📘', name: 'NCERT Solutions Part-II', sub: 'Textbook Solutions', type: 'ncert2'   },
  { icon: '📗', name: 'NCERT Solutions Part-I',  sub: 'Textbook Solutions', type: 'ncert1'   },
];

// Resource types shown for a given subject. Maths and Biology NCERT are not
// split into Part-I / Part-II, so for those subjects we drop the Part-I entry
// and rename the Part-II entry to a single "NCERT Solutions" (it still uses the
// ncert2 flow via Ncert2Screen). All other subjects keep both.
const getResourceTypes = (subjectName) => {
  if (subjectName === 'Mathematics' || subjectName === 'Biology') {
    return RESOURCE_TYPES
      .filter((rt) => rt.type !== 'ncert1')
      .map((rt) => (rt.type === 'ncert2'
        ? { ...rt, name: 'NCERT Solutions', sub: 'Textbook Solutions' }
        : rt));
  }
  return RESOURCE_TYPES;
};

// ── Full chapter notes data ───────────────────────────────────────────────────
const CHAPTER_NOTES = {
  'Units and Measurements': {
    title: 'Units and Measurements',
    intro: 'The International System of Units',
    sections: [
      {
        title: 'Measurement and Units',
        content: "Measurement involves comparing a physical quantity with a reference standard called a unit. It's expressed as a number and a unit.",
      },
      {
        title: 'Fundamental and Derived Units',
        content: 'The fundamental or base units define other physical quantities. Derived units are combinations of base units.',
      },
      {
        title: 'System of Units',
        content: 'Coherent system combining both base and derived units is termed the system of units.',
        bullets: [
          'CGS: Centimeter, gram, and second.',
          'FPS: Foot, pound, and second.',
          'MKS: Metre, kilogram, and second.',
        ],
      },
      {
        title: 'The SI System',
        content: 'Internationally accepted system since 1971, defined by the Bureau International des Poids et Mesures. Seven base units form the foundation.',
      },
      {
        title: 'SI Base Units',
        bullets: [
          'Metre (m) for length',
          'Kilogram (kg) for mass',
          'Second (s) for time',
          'Ampere (A) for electric current',
          'Kelvin (K) for temperature',
          'Mole (mol) for the amount of substance',
          'Candela (cd) for luminous intensity',
        ],
      },
      {
        title: 'Defined Units for Angles',
        content: 'Both are dimensionless.',
        bullets: [
          'Plane Angle: Radian (rad)',
          'Solid Angle: Steradian (sr)',
        ],
      },
      {
        title: 'Significant Figures',
        content: 'Significant figures in a measurement include all reliably known digits plus the first uncertain digit.',
        bullets: [
          'Non-zero digits are always significant.',
          'Zeros between non-zero digits are significant.',
          'Numbers less than 1: Leading zeros are not significant.',
          'Trailing zeros without a decimal point are not significant.',
        ],
      },
      {
        title: 'Scientific Notation',
        content: 'Presenting numbers in scientific notation (a × 10ᵇ) helps eliminate ambiguity with significant figures. All digits in the base are significant.',
      },
      {
        title: 'Arithmetic Operations Rules',
        content: 'For multiplication/division, results retain the least number of significant figures from any operand. For addition/subtraction, results hold the least number of decimal places from any value.',
      },
      {
        title: 'Rounding Off',
        content: 'When rounding, if the digit to drop is > 5, increase the previous digit by 1, otherwise leave it. If exactly 5, round up if preceding digit is odd; leave unchanged if even.',
      },
      {
        title: 'Dimensions of Physical Quantities',
        content: 'The fundamental nature of every physical quantity is described by its dimensions. The seven base quantities are:',
        bullets: [
          'Length [L]',
          'Mass [M]',
          'Time [T]',
          'Electric Current [A]',
          'Temperature [K]',
          'Luminous Intensity [cd]',
          'Amount of Substance [mol]',
        ],
      },
      {
        title: 'Dimensional Formulae',
        bullets: [
          'Volume: [M⁰ L³ T⁰]',
          'Velocity: [M⁰ L T⁻¹]',
          'Acceleration: [M⁰ L T⁻²]',
          'Force: [M L T⁻²]',
          'Mass Density: [M L⁻³ T⁰]',
        ],
      },
      {
        title: 'Principle of Homogeneity',
        content: 'Physical quantities can be added or subtracted only if they are dimensionally homogeneous (e.g., velocity cannot add to force).',
      },
      {
        title: 'Limitations of Dimensional Analysis',
        content: "Dimensional analysis checks only dimensional validity. Correct dimensions don't always guarantee accurate equations.",
      },
      {
        title: 'Special Mathematical Functions',
        content: 'The arguments of functions like trigonometric, logarithmic, and exponential must be dimensionless.',
      },
      {
        title: 'Dimensionless Quantities',
        bullets: [
          'Ratios of similar quantities have no dimensions (e.g., angle = length/length).',
          'Refractive index: speed of light in vacuum/speed of light in medium.',
        ],
      },
      {
        title: 'The Dimensional Consistency Test',
        content: 'A successful test confirms consistency but not correctness; however, failing it indicates error.',
      },
    ],
  },
};

const RESOURCE_CARDS = [
  { id: 1, type: 'PDF',   emoji: '📄', title: 'Complete Chapter Notes',      size: '2.4 MB', pages: 18, isNotes: true },
  { id: 2, type: 'Video', emoji: '🎬', title: 'Concept Explanation Video',   duration: '32 min' },
  { id: 3, type: 'Notes', emoji: '📝', title: 'Quick Revision Mind Map',     size: '890 KB', pages: 6 },
  { id: 4, type: 'PDF',   emoji: '📄', title: 'Practice Questions — 50 Qs', size: '1.2 MB', pages: 10 },
  { id: 5, type: 'Video', emoji: '🎬', title: 'Solved Examples Walkthrough', duration: '18 min' },
  { id: 6, type: 'Notes', emoji: '📝', title: 'Formula Sheet',               size: '450 KB', pages: 2 },
];

const TYPE_BG  = { PDF: '#F0F0F0', Video: '#1C1C1E', Notes: '#E8E8E8' };
const TYPE_TXT = { PDF: '#1C1C1E', Video: '#fff',    Notes: '#555' };

// ── Breadcrumb ────────────────────────────────────────────────────────────────
const Breadcrumb = ({ parts }) => (
  <View style={s.breadcrumb}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {parts.map((part, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[s.breadPart, i === parts.length - 1 && s.breadPartActive]}>{part}</Text>
            {i < parts.length - 1 && <Text style={s.breadSep}>  /  </Text>}
          </View>
        ))}
      </View>
    </ScrollView>
  </View>
);

const BackHeader = ({ onBack }) => (
  <View style={s.header}>
    <TouchableOpacity onPress={onBack} style={s.backRow}>
      <Text style={s.backArrow}>←</Text>
      <Text style={s.backTxt}>Back</Text>
    </TouchableOpacity>
  </View>
);

// ── Main Screen ───────────────────────────────────────────────────────────────
const ResourcesScreen = () => {
  const [activeBoard,   setActiveBoard]   = useState('CBSE');
  // Class is the app-wide selection (synced with the Practice tab & Home).
  const { selectedClass: activeClass, setSelectedClass: setActiveClass } = useAuth();
  const [activeSubject, setActiveSubject] = useState(null);
  const [activeResType, setActiveResType] = useState(null);
  const [activeChapter, setActiveChapter] = useState(null);
  const [showCards,     setShowCards]     = useState(false);
  const [showNotes,     setShowNotes]     = useState(false);
  const [showChapterEnd, setShowChapterEnd] = useState(false);
  const [activeSectionQs, setActiveSectionQs] = useState([]);
  const [downloading,    setDownloading]    = useState(false);

  // Generate a PDF of the chapter notes and hand it to the OS share/save sheet.
  const handleDownloadNotes = async () => {
    if (downloading || !activeSubject || !activeChapter) return;
    setDownloading(true);
    try {
      const notes = getChapterNotes(activeSubject.name, activeChapter.name);
      const html = buildHTML(notes, activeChapter.name);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `${activeChapter.name} — Notes`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Saved', `Notes PDF created at:\n${uri}`);
      }
    } catch (e) {
      Alert.alert('Download failed', e?.message || 'Could not generate the notes PDF.');
    } finally {
      setDownloading(false);
    }
  };

  // Exemplar Solutions are now DB-backed: fetch the chapter's sections from the
  // API when the exemplar list (LEVEL 4a) is active. Same shape the static map
  // gave ([{ label, questions }]), so the rows render unchanged.
  const [exemplar, setExemplar] = useState({ loading: false, error: null, sections: [] });
  const [exemplarRetry, setExemplarRetry] = useState(0);
  // Class 12 Physics Exemplar ships locally (full MathJax HTML doc per chapter);
  // everything else is DB-backed. When local data exists we skip the API entirely.
  const localExemplarHtml =
    activeResType?.type === 'exemplar' && activeChapter &&
    activeClass === 'Class 12' && activeSubject?.name === 'Physics'
      ? getPhysics12ExemplarHtml(activeChapter.name)
      : null;
  const exemplarActive = !!(activeSubject && activeResType?.type === 'exemplar' && activeChapter && showCards && !localExemplarHtml);

  // Class 12 Physics NCERT Solutions Part-I also ships locally (full MathJax HTML
  // doc per chapter), mirroring the Exemplar local-first approach.
  const localNcert1Html =
    activeResType?.type === 'ncert1' && activeChapter &&
    activeClass === 'Class 12' && activeSubject?.name === 'Physics'
      ? getPhysics12Ncert1Html(activeChapter.name)
      : null;

  // Class 12 Physics NCERT Solutions Part-II also ships locally (full MathJax
  // HTML doc per chapter), overriding the DB-backed Ncert2Screen for these.
  const localNcert2Html =
    activeResType?.type === 'ncert2' && activeChapter &&
    activeClass === 'Class 12' && activeSubject?.name === 'Physics'
      ? getPhysics12Ncert2Html(activeChapter.name)
      : null;
  useEffect(() => {
    if (!exemplarActive) return undefined;
    let alive = true;
    setExemplar({ loading: true, error: null, sections: [] });
    getExemplarSolutions({ subject: activeSubject.name, className: activeClass, chapter: activeChapter.name })
      .then((d) => { if (alive) setExemplar({ loading: false, error: null, sections: (d && d.sections) || [] }); })
      .catch((e) => { if (alive) setExemplar({ loading: false, error: e?.response?.data?.error || e?.message || 'Could not load solutions.', sections: [] }); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exemplarActive, activeSubject?.name, activeResType?.type, activeChapter?.name, activeClass, exemplarRetry]);

  // NCERT Part-II chapter list is DB-backed too: fetch which chapters have
  // content (replaces the old static getNcert2Chapters()) when the Part-II
  // chapter list (LEVEL 3) is active. Section content is fetched in Ncert2Screen.
  const [ncert2, setNcert2] = useState({ loading: false, chapters: [] });
  const ncert2ListActive = !!(activeSubject && activeResType?.type === 'ncert2' && !showCards);
  useEffect(() => {
    if (!ncert2ListActive) return undefined;
    let alive = true;
    setNcert2({ loading: true, chapters: [] });
    getNcertChapters({ part: 2, subject: activeSubject.name, className: activeClass })
      .then((d) => { if (alive) setNcert2({ loading: false, chapters: (d && d.chapters) || [] }); })
      .catch(() => { if (alive) setNcert2({ loading: false, chapters: [] }); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ncert2ListActive, activeSubject?.name, activeClass]);


  // ── LEVEL 5: Chapter Notes — WebView with MathJax ────────────────────────
  if (activeSubject && activeResType && activeChapter && showNotes) {
    const notes = getChapterNotes(activeSubject.name, activeChapter.name);
    return (
      <ChapterNotesScreen
        chapterName={activeChapter.name}
        notes={notes}
        onBack={() => setShowNotes(false)}
      />
    );
  }


  // ── LEVEL 4b: Chapter-end content (exemplar questions, B&W template) ──────
  if (activeSubject && activeResType?.type === 'exemplar' && activeChapter && showCards && showChapterEnd) {
    return (
      <ChapterEndScreen
        chapterName={activeChapter.name}
        questions={activeSectionQs}
        onBack={() => setShowChapterEnd(false)}
      />
    );
  }

  // ── LEVEL 4 (local): Class 12 Physics Exemplar — MathJax cards in a WebView ──
  if (activeResType?.type === 'exemplar' && activeChapter && showCards && localExemplarHtml) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#fff' }} />}
        <BackHeader onBack={() => setShowCards(false)} />
        <Breadcrumb parts={['Home', activeClass, activeSubject.name, activeResType.name, activeChapter.name]} />
        <View style={s.pageTitleWrap}>
          <Text style={s.pageTitle}>{activeChapter.name}</Text>
          <Text style={s.pageSub}>NCERT Exemplar · Chapter-end</Text>
        </View>
        <WebView
          originWhitelist={['*']}
          source={{ html: localExemplarHtml }}
          style={{ flex: 1, backgroundColor: '#F4F4F5' }}
          javaScriptEnabled
          domStorageEnabled
          mixedContentMode="always"
          androidLayerType={Platform.OS === 'android' ? 'hardware' : undefined}
        />
      </SafeAreaView>
    );
  }

  // ── LEVEL 4 (local): Class 12 Physics NCERT Part-I — MathJax cards in a WebView ──
  if (activeResType?.type === 'ncert1' && activeChapter && showCards && localNcert1Html) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#fff' }} />}
        <BackHeader onBack={() => setShowCards(false)} />
        <Breadcrumb parts={['Home', activeClass, activeSubject.name, activeResType.name, activeChapter.name]} />
        <View style={s.pageTitleWrap}>
          <Text style={s.pageTitle}>{activeChapter.name}</Text>
          <Text style={s.pageSub}>NCERT Solutions · Part I</Text>
        </View>
        <WebView
          originWhitelist={['*']}
          source={{ html: localNcert1Html }}
          style={{ flex: 1, backgroundColor: '#F4F4F5' }}
          javaScriptEnabled
          domStorageEnabled
          mixedContentMode="always"
          androidLayerType={Platform.OS === 'android' ? 'hardware' : undefined}
        />
      </SafeAreaView>
    );
  }

  // ── LEVEL 4a: Exemplar Solutions — single "Chapter-end" entry (Image 1 layout) ──
  if (activeSubject && activeResType?.type === 'exemplar' && activeChapter && showCards) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#fff' }} />}
        <BackHeader onBack={() => setShowCards(false)} />
        <Breadcrumb parts={['Home', activeClass, activeSubject.name, activeResType.name, activeChapter.name]} />
        <View style={s.pageTitleWrap}>
          <Text style={s.pageTitle}>{activeChapter.name}</Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 32 }}>
          {exemplar.loading ? (
            <View style={{ paddingVertical: 48, alignItems: 'center', gap: 12 }}>
              <ActivityIndicator size="large" color="#1f8a93" />
              <Text style={{ color: '#64748b', fontSize: 13 }}>Loading solutions…</Text>
            </View>
          ) : exemplar.error ? (
            <View style={{ paddingVertical: 40, alignItems: 'center', gap: 12, paddingHorizontal: 24 }}>
              <Text style={{ color: '#b91c1c', fontSize: 14, textAlign: 'center' }}>{'⚠️'}  {exemplar.error}</Text>
              <TouchableOpacity
                style={{ borderWidth: 1.5, borderColor: '#1f8a93', borderRadius: 10, paddingVertical: 9, paddingHorizontal: 18 }}
                activeOpacity={0.8}
                onPress={() => setExemplarRetry((k) => k + 1)}
              >
                <Text style={{ color: '#1f8a93', fontWeight: '700' }}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : exemplar.sections.length === 0 ? (
            <View style={{ paddingVertical: 48, alignItems: 'center' }}>
              <Text style={{ color: '#94a3b8', fontSize: 14 }}>No solutions available for this chapter yet.</Text>
            </View>
          ) : (
            exemplar.sections.map((sec, i) => (
              <TouchableOpacity
                key={i}
                style={s.listRow}
                activeOpacity={0.8}
                onPress={() => { setActiveSectionQs(sec.questions || []); setShowChapterEnd(true); }}
              >
                <View style={s.listNum}><Text style={s.listNumTxt}>{i + 1}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.listRowTitle}>{sec.label}</Text>
                </View>
                <Text style={s.listArrow}>→</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── NCERT Part-II (local): Class 12 Physics — MathJax cards in a WebView ──
  if (activeResType?.type === 'ncert2' && activeChapter && showCards && localNcert2Html) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#fff' }} />}
        <BackHeader onBack={() => setShowCards(false)} />
        <Breadcrumb parts={['Home', activeClass, activeSubject.name, activeResType.name, activeChapter.name]} />
        <View style={s.pageTitleWrap}>
          <Text style={s.pageTitle}>{activeChapter.name}</Text>
          <Text style={s.pageSub}>NCERT Solutions · Part II</Text>
        </View>
        <WebView
          originWhitelist={['*']}
          source={{ html: localNcert2Html }}
          style={{ flex: 1, backgroundColor: '#F4F4F5' }}
          javaScriptEnabled
          domStorageEnabled
          mixedContentMode="always"
          androidLayerType={Platform.OS === 'android' ? 'hardware' : undefined}
        />
      </SafeAreaView>
    );
  }

  // ── NCERT Solutions Part-II — Ailernova-style solutions screen ────────────
  if (activeSubject && activeResType?.type === 'ncert2' && activeChapter && showCards) {
    return (
      <Ncert2Screen
        subjectName={activeSubject.name}
        chapterName={activeChapter.name}
        part={2}
        className={activeClass}
        onBack={() => setShowCards(false)}
        title={activeResType.name}
        breadcrumb={['Home', activeClass, activeSubject.name, activeResType.name]}
      />
    );
  }

  // ── LEVEL 4: Resource cards (PDF / Video / Notes) ─────────────────────────
  if (activeSubject && activeResType && activeChapter && showCards) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#fff' }} />}
        <BackHeader onBack={() => setShowCards(false)} />
        <Breadcrumb parts={['Home', activeClass, activeSubject.name, activeResType.name, activeChapter.name]} />
        <View style={s.pageTitleWrap}>
          <Text style={s.pageTitle}>{activeChapter.name}</Text>
          <Text style={s.pageSub}>{RESOURCE_CARDS.length} resources available</Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}>
          {RESOURCE_CARDS.map((res) => (
            <View key={res.id} style={s.resCard}>
              <View style={s.resCardTop}>
                <View style={[s.resIconWrap, { backgroundColor: TYPE_BG[res.type] }]}>
                  <Text style={{ fontSize: 22 }}>{res.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.resTitle}>{res.title}</Text>
                  <View style={s.resMetaRow}>
                    <View style={[s.typePill, { backgroundColor: TYPE_BG[res.type] }]}>
                      <Text style={[s.typePillTxt, { color: TYPE_TXT[res.type] }]}>{res.type}</Text>
                    </View>
                    <Text style={s.resMeta}>
                      {res.type === 'Video' ? `⏱ ${res.duration}` : `📄 ${res.pages} pages  •  ${res.size}`}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={s.resActions}>
                <TouchableOpacity
                  style={s.previewBtn}
                  onPress={res.isNotes ? () => setShowNotes(true) : undefined}
                >
                  <Text style={s.previewTxt}>Preview</Text>
                </TouchableOpacity>
                {res.isNotes ? (
                  <TouchableOpacity style={s.downloadBtn} onPress={handleDownloadNotes} disabled={downloading}>
                    <Text style={s.downloadTxt}>{downloading ? '⏳  Preparing…' : '⬇  Download'}</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={s.downloadBtn}>
                    <Text style={s.downloadTxt}>{res.type === 'Video' ? '▶  Watch' : '⬇  Download'}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── LEVEL 3: Chapters list ────────────────────────────────────────────────
  if (activeSubject && activeResType) {
    // For NCERT Solutions Part-II, show only chapters that have content (fetched
    // from the API — replaces the old static getNcert2Chapters()). Other resource
    // types keep showing the full chapter list.
    const isNcert2 = activeResType?.type === 'ncert2';
    // Chapters can vary by class (e.g. Physics Class 12 has its own list); fall
    // back to the subject's default chapters when there's no class-specific set.
    const subjectChapters =
      (activeSubject.chaptersByClass && activeSubject.chaptersByClass[activeClass]) ||
      activeSubject.chapters;
    const chaptersToShow =
      isNcert2 && ncert2.chapters.length > 0
        ? subjectChapters.filter((c) => ncert2.chapters.includes(c.name))
        : subjectChapters;
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#fff' }} />}
        <BackHeader onBack={() => setActiveResType(null)} />
        <Breadcrumb parts={['Home', activeClass, activeSubject.name, activeResType.name]} />
        <View style={s.pageTitleWrap}>
          <Text style={s.pageTitle}>Chapters</Text>
          <Text style={s.pageSub}>Select a chapter to explore</Text>
          <Text style={s.boardLabel}>{activeSubject.name} Chapters</Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 32 }}>
          {isNcert2 && ncert2.loading ? (
            <View style={{ paddingVertical: 48, alignItems: 'center', gap: 12 }}>
              <ActivityIndicator size="large" color="#1f8a93" />
              <Text style={{ color: '#64748b', fontSize: 13 }}>Loading chapters…</Text>
            </View>
          ) : isNcert2 && chaptersToShow.length === 0 ? (
            <View style={{ paddingVertical: 48, alignItems: 'center' }}>
              <Text style={{ color: '#94a3b8', fontSize: 14 }}>No chapters available yet.</Text>
            </View>
          ) : (
            chaptersToShow.map((chapter, i) => (
              <TouchableOpacity key={i} style={s.listRow}
                onPress={() => { setActiveChapter(chapter); setShowCards(true); setShowChapterEnd(false); }}
                activeOpacity={0.8}>
                <View style={s.listNum}><Text style={s.listNumTxt}>{i + 1}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.listRowTitle}>{chapter.name}</Text>
                  <Text style={s.listRowSub}>Tap to explore chapter</Text>
                </View>
                <Text style={s.listArrow}>→</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── LEVEL 2: Resource types ───────────────────────────────────────────────
  if (activeSubject) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#fff' }} />}
        <BackHeader onBack={() => setActiveSubject(null)} />
        <Breadcrumb parts={['Home', 'Student Subscription', 'Resources']} />
        <View style={s.pageTitleWrap}>
          <View style={s.pageTitleRow}>
            <View style={[s.subjectIconLg, { backgroundColor: activeSubject.bg }]}>
              <Text style={{ fontSize: 24 }}>{activeSubject.emoji}</Text>
            </View>
            <View>
              <Text style={s.pageTitle}>Resources</Text>
              <Text style={s.pageSub}>Select a resource to explore</Text>
            </View>
          </View>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 32 }}>
          {getResourceTypes(activeSubject.name).map((rt, i) => (
            <TouchableOpacity key={i} style={s.resTypeRow} onPress={() => setActiveResType(rt)} activeOpacity={0.8}>
              <View style={s.resTypeIconWrap}>
                <Text style={{ fontSize: 22 }}>{rt.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.resTypeName}>{rt.name}</Text>
                <Text style={s.resTypeSub}>{rt.sub}</Text>
              </View>
              <Text style={s.listArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── LEVEL 1: Subjects list ────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#fff' }} />}
      <View style={s.header}>
        <Text style={s.headerTitle}>Resources</Text>
      </View>
      <Breadcrumb parts={['Home', 'Student Subscription']} />
      <ClassTabs value={activeClass} onChange={setActiveClass} />
      <View style={s.pageTitleWrap}>
        <Text style={s.pageTitle}>Subjects</Text>
        <Text style={s.pageSub}>Select a subject to explore</Text>
        <Text style={s.boardLabel}>{activeClass}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}>
        {SUBJECTS.map((subject, i) => (
          <TouchableOpacity key={i} style={s.subjectRow} onPress={() => setActiveSubject(subject)} activeOpacity={0.8}>
            <View style={[s.subjectIconWrap, { backgroundColor: subject.bg }]}>
              <Text style={{ fontSize: 26 }}>{subject.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.subjectName}>{subject.name}</Text>
              <Text style={s.subjectSub}>Tap to view resources</Text>
            </View>
            <Text style={s.listArrow}>→</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: '#F7F7F7' },
  header:            { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1.5, borderBottomColor: '#F0F0F0' },
  headerTitle:       { fontSize: 22, fontWeight: '900', color: '#1C1C1E', letterSpacing: -0.5 },
  backRow:           { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backArrow:         { fontSize: 20, color: '#1C1C1E', fontWeight: '700' },
  backTxt:           { fontSize: 15, fontWeight: '700', color: '#1C1C1E' },
  breadcrumb:        { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  breadPart:         { fontSize: 12, color: '#8E8E93', fontWeight: '600' },
  breadPartActive:   { color: '#1C1C1E', fontWeight: '700' },
  breadSep:          { fontSize: 12, color: '#C7C7CC' },
  filterWrap:        { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1.5, borderBottomColor: '#F0F0F0' },
  filterRow:         { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  filterChip:        { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1.5, borderColor: '#E8E8E8', backgroundColor: '#F7F7F7' },
  filterChipActive:  { backgroundColor: '#1C1C1E', borderColor: '#1C1C1E' },
  filterChipTxt:     { fontSize: 13, fontWeight: '700', color: '#8E8E93' },
  filterChipTxtActive:{ color: '#fff' },
  pageTitleWrap:     { backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14, borderBottomWidth: 1.5, borderBottomColor: '#F0F0F0' },
  pageTitleRow:      { flexDirection: 'row', alignItems: 'center', gap: 14 },
  pageTitle:         { fontSize: 20, fontWeight: '900', color: '#1C1C1E', letterSpacing: -0.4 },
  pageSub:           { fontSize: 13, color: '#8E8E93', fontWeight: '600', marginTop: 3 },
  boardLabel:        { fontSize: 13, fontWeight: '800', color: '#1C1C1E', marginTop: 8 },
  subjectIconLg:     { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  subjectRow:        { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1.5, borderColor: '#F0F0F0', flexDirection: 'row', alignItems: 'center', gap: 16, padding: 14 },
  subjectIconWrap:   { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  subjectName:       { fontSize: 17, fontWeight: '900', color: '#1C1C1E', letterSpacing: -0.3 },
  subjectSub:        { fontSize: 12, color: '#8E8E93', fontWeight: '600', marginTop: 3 },
  resTypeRow:        { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1.5, borderColor: '#F0F0F0', flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16 },
  resTypeIconWrap:   { width: 52, height: 52, borderRadius: 16, backgroundColor: '#F0F0F0', borderWidth: 1.5, borderColor: '#E8E8E8', alignItems: 'center', justifyContent: 'center' },
  resTypeName:       { fontSize: 16, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.2, marginBottom: 3 },
  resTypeSub:        { fontSize: 12, color: '#8E8E93', fontWeight: '600' },
  listRow:           { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1.5, borderColor: '#F0F0F0', flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  listNum:           { width: 32, height: 32, borderRadius: 10, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
  listNumTxt:        { fontSize: 14, fontWeight: '900', color: '#1C1C1E' },
  listRowTitle:      { fontSize: 15, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.2 },
  listRowSub:        { fontSize: 12, color: '#8E8E93', fontWeight: '600', marginTop: 3 },
  listArrow:         { fontSize: 18, color: '#C7C7CC', fontWeight: '600' },

  // Resource card styles
  resCard:           { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1.5, borderColor: '#F0F0F0', padding: 14 },
  resCardTop:        { flexDirection: 'row', gap: 12, marginBottom: 12, alignItems: 'flex-start' },
  resIconWrap:       { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  resTitle:          { fontSize: 14, fontWeight: '800', color: '#1C1C1E', lineHeight: 20, marginBottom: 6 },
  resMetaRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  typePill:          { borderRadius: 7, paddingVertical: 3, paddingHorizontal: 9 },
  typePillTxt:       { fontSize: 10, fontWeight: '900' },
  resMeta:           { fontSize: 11, color: '#8E8E93', fontWeight: '600' },
  resActions:        { flexDirection: 'row', gap: 10 },
  previewBtn:        { flex: 1, backgroundColor: '#F7F7F7', borderWidth: 1.5, borderColor: '#F0F0F0', borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  previewTxt:        { fontSize: 13, fontWeight: '800', color: '#1C1C1E' },
  downloadBtn:       { flex: 1, backgroundColor: '#1C1C1E', borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  downloadTxt:       { fontSize: 13, fontWeight: '800', color: '#fff' },
  notesTable:         { marginLeft: 22, marginTop: 8, marginBottom: 4, borderWidth: 1, borderColor: '#D0D0D0', borderRadius: 8, overflow: 'hidden' },
  notesTableRow:      { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E8E8E8' },
  notesTableHeader:   { backgroundColor: '#1C1C1E' },
  notesTableRowAlt:   { backgroundColor: '#F9F9F9' },
  notesTableCell:     { padding: 8, borderRightWidth: 1, borderRightColor: '#E8E8E8' },
  notesTableHeaderTxt:{ fontSize: 12, fontWeight: '800', color: '#fff', lineHeight: 17 },
  notesTableCellTxt:  { fontSize: 12, color: '#333', lineHeight: 18 },
  notesImagesWrap:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingLeft: 22, marginTop: 8, marginBottom: 4 },
  notesImgCard:     { width: (SCREEN_WIDTH - 64) / 2, alignItems: 'center' },
  notesImg:         { width: (SCREEN_WIDTH - 64) / 2, height: (SCREEN_WIDTH - 64) / 2, borderRadius: 8, borderWidth: 1, borderColor: '#E8E8E8', backgroundColor: '#FAFAFA' },
  notesImgLabel:    { fontSize: 10, color: '#666', textAlign: 'center', marginTop: 4, lineHeight: 14 },
  // Notes view styles — matching image 2 exactly
  notesHeader:            { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0 },
  notesBackRow:           { flexDirection: 'row', alignItems: 'center', gap: 4 },
  notesBackArrow:         { fontSize: 18, color: '#1C1C1E', fontWeight: '600' },
  notesBackTxt:           { fontSize: 14, fontWeight: '600', color: '#1C1C1E' },
  notesChapterHdr:        { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 0 },
  notesChapterTitle:      { fontSize: 18, fontWeight: '700', color: '#1C1C1E', marginBottom: 10 },
  notesChapterDivider:    { height: 1, backgroundColor: '#E0E0E0', marginBottom: 0 },
  notesSec:               { paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#fff' },
  notesSecBorder:         { borderBottomWidth: 1, borderBottomColor: '#E8E8E8' },
  notesTitleRow:          { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 6 },
  notesBulletBlack:       { fontSize: 16, color: '#1C1C1E', fontWeight: '700', lineHeight: 22, marginTop: 1 },
  notesBoldTitle:         { fontSize: 14, fontWeight: '700', color: '#1C1C1E', flex: 1, lineHeight: 21 },
  notesBodyTxt:           { fontSize: 14, color: '#333', lineHeight: 22, fontWeight: '400', paddingLeft: 22, marginTop: 2 },
  subBulletRow:           { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingLeft: 22, marginTop: 4 },
  subBulletDot:           { fontSize: 14, color: '#555', marginTop: 3 },
  subBulletTxt:           { fontSize: 14, color: '#333', lineHeight: 21, flex: 1 },
});

export default ResourcesScreen;