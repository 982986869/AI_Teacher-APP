import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, StatusBar, Platform, Image, Dimensions,
} from 'react-native';

import { getChapterNotes } from '../notes/index';
import Ch2Images from '../notes/images/Ch2Images';
import ChapterNotesScreen from './ChapterNotesScreen';

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
      { name: 'The s-Block Elements (FA ONLY)' },
      { name: 'Some p-Block Elements (FA ONLY)' },
      { name: 'Organic Chemistry Some Basic Principles and Techniques' },
      { name: 'Hydrocarbons' },
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
      { name: 'Binomial Theorem' },
      { name: 'Sequences and Series' },
      { name: 'Straight Lines' },
      { name: 'Conic Sections' },
      { name: 'Introduction to 3D Geometry' },
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
      { name: 'Cell: The Unit of Life' },
      { name: 'Biomolecules' },
      { name: 'Cell Cycle and Cell Division' },
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
  { icon: '📋', name: 'Revision Notes',         sub: '835 items',              type: 'notes'    },
  { icon: '🔄', name: 'Exemplar Solutions',      sub: 'Textbook Solutions',     type: 'exemplar' },
  { icon: '📘', name: 'NCERT Solutions Part-II', sub: 'Textbook Solutions',     type: 'ncert2'   },
  { icon: '📗', name: 'NCERT Solutions Part-I',  sub: 'Textbook Solutions',     type: 'ncert1'   },
  { icon: '📝', name: 'Previous Year Papers',    sub: '10 years question bank', type: 'pyq'      },
  { icon: '🎬', name: 'Video Lectures',           sub: '120+ concept videos',   type: 'video'    },
  { icon: '🗺',  name: 'Mind Maps',               sub: 'Visual summaries',      type: 'mindmap'  },
];

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
  const [activeClass,   setActiveClass]   = useState('Class 11');
  const [activeSubject, setActiveSubject] = useState(null);
  const [activeResType, setActiveResType] = useState(null);
  const [activeChapter, setActiveChapter] = useState(null);
  const [showCards,     setShowCards]     = useState(false);
  const [showNotes,     setShowNotes]     = useState(false);


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


  // ── LEVEL 4: Resource cards (PDF / Video / Notes) ─────────────────────────
  if (activeSubject && activeResType && activeChapter && showCards) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#fff' }} />}
        <BackHeader onBack={() => setShowCards(false)} />
        <Breadcrumb parts={['Home', activeBoard, activeClass, activeSubject.name, activeResType.name, activeChapter.name]} />
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
                <TouchableOpacity style={s.previewBtn}>
                  <Text style={s.previewTxt}>Preview</Text>
                </TouchableOpacity>
                {res.isNotes ? (
                  <TouchableOpacity style={s.downloadBtn} onPress={() => setShowNotes(true)}>
                    <Text style={s.downloadTxt}>⬇  Download</Text>
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
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#fff' }} />}
        <BackHeader onBack={() => setActiveResType(null)} />
        <Breadcrumb parts={['Home', activeBoard, activeClass, activeSubject.name, activeResType.name]} />
        <View style={s.pageTitleWrap}>
          <Text style={s.pageTitle}>Chapters</Text>
          <Text style={s.pageSub}>Select a chapter to explore</Text>
          <Text style={s.boardLabel}>{activeSubject.name} Chapters</Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 32 }}>
          {activeSubject.chapters.map((chapter, i) => (
            <TouchableOpacity key={i} style={s.listRow}
              onPress={() => { setActiveChapter(chapter); setShowCards(true); }}
              activeOpacity={0.8}>
              <View style={s.listNum}><Text style={s.listNumTxt}>{i + 1}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.listRowTitle}>{chapter.name}</Text>
                <Text style={s.listRowSub}>Tap to explore chapter</Text>
              </View>
              <Text style={s.listArrow}>→</Text>
            </TouchableOpacity>
          ))}
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
          {RESOURCE_TYPES.map((rt, i) => (
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
      <View style={s.filterWrap}>
        <View style={s.filterRow}>
          {BOARDS.map(b => (
            <TouchableOpacity key={b} style={[s.filterChip, activeBoard === b && s.filterChipActive]} onPress={() => setActiveBoard(b)}>
              <Text style={[s.filterChipTxt, activeBoard === b && s.filterChipTxtActive]}>{b}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={[s.filterRow, { marginTop: 8 }]}>
          {CLASSES.map(c => (
            <TouchableOpacity key={c} style={[s.filterChip, activeClass === c && s.filterChipActive]} onPress={() => setActiveClass(c)}>
              <Text style={[s.filterChipTxt, activeClass === c && s.filterChipTxtActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={s.pageTitleWrap}>
        <Text style={s.pageTitle}>Subjects</Text>
        <Text style={s.pageSub}>Select a subject to explore</Text>
        <Text style={s.boardLabel}>{activeBoard} &gt; {activeClass}</Text>
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