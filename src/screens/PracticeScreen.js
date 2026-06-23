import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, StatusBar, Platform, ActivityIndicator, Modal } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { getPyqHtml } from '../data/allPyq';
import { getImportantHtml } from '../data/importantQuestions';
import { getMcqProgress, getMcqSubtopics } from '../data/mcqPractice';
import { getMcqQuestions } from '../data/mcqQuestions';
import McqTestScreen from './McqTestScreen';
import { listMockTests, getMockTestQuestions, listMockAttempts, submitMockTest } from '../api/mockTestsApi';

// All subjects resolve through allPyq.js (Physics from pyqContent.js,
// Maths/Chemistry/Biology from their own files).
function pyqHtmlFor(subject, chapter) {
  return getPyqHtml(subject, chapter);
}

// Important Questions resolve through importantQuestions.js.
function impHtmlFor(subject, chapter) {
  return getImportantHtml(subject, chapter);
}

// Format a percent: integers stay whole (60 -> "60"), decimals trim (70.97 -> "70.97").
function fmtPct(n) {
  const num = Number(n) || 0;
  return Number.isInteger(num) ? String(num) : String(Math.round(num * 100) / 100);
}

// Wraps a question-card fragment in a full HTML doc with MathJax (renders
// {tex}...{/tex}) and the black-&-white card styling used elsewhere in the app.
function buildPyqDocument(fragmentHtml) {
  return `<!DOCTYPE html><html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<script>
  window.MathJax = { tex: { inlineMath: [['{tex}', '{/tex}']], displayMath: [] },
    startup: { ready: function () { window.MathJax.startup.defaultReady();
      window.MathJax.startup.promise.then(fitWideMath); } } };
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
  body{ padding:12px; background:#f4f4f5; font-family:-apple-system,Roboto,"Segoe UI",sans-serif;
        color:#1C1C1E; overflow-wrap:break-word; word-break:break-word; }
  img{ max-width:100%; height:auto; border-radius:8px; filter:grayscale(100%); }
  .pyq-card,.question-card{ background:#fff; border:1px solid #e3e3e6; border-radius:16px;
                  padding:16px; margin-bottom:16px; max-width:100%; overflow:hidden; }
  .pyq-header,.question-header{ display:flex; justify-content:space-between; align-items:center;
                    gap:8px; margin-bottom:10px; }
  .q-number{ background:#1C1C1E; color:#fff; padding:4px 10px; border-radius:20px;
             font-size:12px; font-weight:600; white-space:nowrap; }
  .pyq-year,.years{ font-size:11px; font-weight:600; color:#6b7280; text-align:right; }
  .pyq-question,.question-text{ font-size:16px; line-height:1.7; margin-bottom:10px; max-width:100%; }
  .answer-section{ margin-top:12px; max-width:100%; }
  .label{ font-size:12px; font-weight:600; color:#555; margin-bottom:4px; }
  .solution-box,.solution-block{ background:#f5f5f6; padding:10px 12px; border-radius:10px; margin-top:12px;
                   border:1px solid #ededed; max-width:100%; }
  .solution-title{ font-size:12px; font-weight:600; color:#555; margin-bottom:4px; }
  .solution-box p{ margin:4px 0; }
  .pyq-options,.options{ display:flex; flex-direction:column; gap:6px; margin-top:12px; }
  .option{ display:flex; gap:10px; align-items:flex-start;
           border:1px solid #e3e3e6; border-radius:10px; padding:8px 12px; font-size:15px; }
  .option.correct{ border-color:#1C1C1E; background:#1C1C1E; color:#fff; font-weight:600; }
  .option-index{ font-weight:700; min-width:18px; }
  .option-text{ flex:1; max-width:100%; overflow:hidden; }
  .option-text p{ margin:0; }
  .tick{ font-weight:700; }
  .math-scroll{ display:block; max-width:100%; overflow-x:auto; -webkit-overflow-scrolling:touch; }
  mjx-container{ max-width:100% !important; }
  table{ display:block; max-width:100%; overflow-x:auto; border-collapse:collapse; margin:8px 0; }
  th,td{ border:1px solid #e3e3e6; padding:4px 8px; font-size:14px; text-align:left; }
  ol,ul{ margin:8px 0; padding-left:22px; }
  li{ margin:3px 0; line-height:1.6; }
  strong,b{ font-weight:700; }
  em,i{ font-style:italic; }
</style></head>
<body>${fragmentHtml}</body></html>`;
}

const SUBJECTS = [
  { name: 'Physics',     emoji: '⚛️', topics: 24, done: 18 },
  { name: 'Mathematics', emoji: '📐', topics: 32, done: 28 },
  { name: 'Chemistry',   emoji: '🧪', topics: 20, done: 11 },
  { name: 'Biology',     emoji: '🧬', topics: 18, done: 10 },
  { name: 'English',     emoji: '📝', topics: 15, done: 13 },
];

// ── Previous Year Papers: 4 subjects, each with its chapter list ───────────────
const PYQ_SUBJECTS = [
  {
    name: 'Physics', emoji: '⚛️', bg: '#1C1C1E',
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
    name: 'Chemistry', emoji: '🧪', bg: '#333',
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
    name: 'Mathematics', emoji: '📐', bg: '#444',
    chapters: [
      'Sets',
      'Relations and Functions',
      'Trigonometric Functions',
      'Principle of Mathematical Induction (Deleted)',
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
    name: 'Biology', emoji: '🧬', bg: '#555',
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

// Subject order for the MCQ Practice sections (4 sections, one per subject).
const MCQ_SUBJECT_ORDER = ['Physics', 'Mathematics', 'Chemistry', 'Biology'];

// How many numbered mock quizzes each subject shows under Mock Test.
const MOCK_QUIZ_COUNT = 10;

const QUESTION_TYPES = [
  { icon: '🎯', label: 'MCQ Practice',    sub: 'Multiple choice questions',  count: '120+ Qs' },
  { icon: '✍️', label: 'Short Answer',    sub: 'Written response questions', count: '80+ Qs' },
  { icon: '🧩', label: 'Fill in Blanks',  sub: 'Complete the statement',     count: '60+ Qs' },
  { icon: '⚡', label: 'Speed Round',     sub: '30 sec per question',        count: '50 Qs' },
];

const RECENT = [
  { subject: 'Physics', topic: 'Laws of Motion', score: 85, date: 'Today' },
  { subject: 'Maths',   topic: 'Quadratic Eq.',  score: 92, date: 'Yesterday' },
  { subject: 'Chemistry', topic: 'Periodic Table', score: 74, date: '2 days ago' },
];

const BackHeader = ({ onBack }) => (
  <View style={s.backHeader}>
    <TouchableOpacity onPress={onBack} style={s.backRow} activeOpacity={0.7}>
      <Text style={s.backArrow}>←</Text>
      <Text style={s.backTxt}>Back</Text>
    </TouchableOpacity>
  </View>
);

// WebView that renders a question-card fragment with MathJax.
const PyqWebView = ({ html }) => {
  const [loading, setLoading] = useState(true);
  return (
    <View style={{ flex: 1, backgroundColor: '#f4f4f5' }}>
      {loading && (
        <View style={s.webLoading} pointerEvents="none">
          <ActivityIndicator size="large" color="#1C1C1E" />
        </View>
      )}
      <WebView
        originWhitelist={['*']}
        source={{ html: buildPyqDocument(html) }}
        onLoadEnd={() => setLoading(false)}
        style={{ flex: 1, backgroundColor: '#f4f4f5' }}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        androidLayerType={Platform.OS === 'android' ? 'hardware' : undefined}
      />
    </View>
  );
};

// A single MCQ chapter card (pastel template: name, progress bar, stats,
// Start/Continue button, and a Show more dropdown for sub-topics).
const McqChapterCard = ({ subject, chapter, expanded, onToggle, onStart }) => {
  const prog = getMcqProgress(subject, chapter);
  const subtopics = getMcqSubtopics(subject, chapter);
  const total = prog.total || 50;
  const answered = prog.answered || 0;
  const score = prog.score || 0;
  const correct = Math.round((answered * score) / 100);
  const wrong = Math.max(0, answered - correct);
  const greenPct = total ? (correct / total) * 100 : 0;
  const redPct = total ? (wrong / total) * 100 : 0;
  const started = answered > 0;

  return (
    <View style={s.mcqCard}>
      <View style={s.mcqCardRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.mcqChapName}>{chapter}</Text>
          <View style={s.mcqBarBg}>
            <View style={[s.mcqBarSeg, { width: `${greenPct}%`, backgroundColor: '#77DD77' }]} />
            <View style={[s.mcqBarSeg, { width: `${redPct}%`, backgroundColor: '#FF6961' }]} />
          </View>
          <View style={s.mcqMetaRow}>
            <Text style={s.mcqMeta}>{answered}/{total} Answered</Text>
            <Text style={s.mcqMeta}>Score: {fmtPct(score)}%</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[s.mcqBtn, started && s.mcqBtnActive]}
          activeOpacity={0.8}
          onPress={() => onStart(subject, chapter)}>
          <Text style={[s.mcqBtnTxt, started && s.mcqBtnTxtActive]}>
            {started ? 'Continue' : 'Start'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={s.mcqToggle} activeOpacity={0.7} onPress={onToggle}>
        <Text style={s.mcqToggleTxt}>{expanded ? 'Show less ▲' : 'Show more ▼'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={s.mcqSubWrap}>
          {subtopics.length > 0 ? (
            subtopics.map((st, i) => {
              const sTotal = st.total || 1;
              const sCorrect = Math.round((st.answered * st.score) / 100);
              const sWrong = Math.max(0, st.answered - sCorrect);
              const sGreen = (sCorrect / sTotal) * 100;
              const sRed = (sWrong / sTotal) * 100;
              return (
                <View key={i} style={s.mcqSubCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.mcqSubCardName}>{st.name}</Text>
                    <View style={s.mcqBarBg}>
                      <View style={[s.mcqBarSeg, { width: `${sGreen}%`, backgroundColor: '#77DD77' }]} />
                      <View style={[s.mcqBarSeg, { width: `${sRed}%`, backgroundColor: '#FF6961' }]} />
                    </View>
                    <View style={s.mcqMetaRow}>
                      <Text style={s.mcqMeta}>{st.answered}/{st.total}</Text>
                      <Text style={s.mcqMeta}>{fmtPct(st.score)}%</Text>
                    </View>
                  </View>
                  {st.answered >= st.total && st.total > 0 ? (
                    <View style={s.mcqSubBtnRow}>
                      <TouchableOpacity style={s.mcqSubBtnAlt} activeOpacity={0.8}
                        onPress={() => onStart(subject, chapter)}>
                        <Text style={s.mcqSubBtnAltTxt}>Retake</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.mcqSubBtn} activeOpacity={0.8}
                        onPress={() => onStart(subject, chapter)}>
                        <Text style={s.mcqSubBtnTxt}>Continue</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity style={s.mcqSubBtn} activeOpacity={0.8}
                      onPress={() => onStart(subject, chapter)}>
                      <Text style={s.mcqSubBtnTxt}>{st.answered === 0 ? 'Start' : 'Continue'}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          ) : (
            <Text style={s.mcqSubEmpty}>Sub-topics coming soon</Text>
          )}
        </View>
      )}
    </View>
  );
};

const PracticeScreen = () => {
  const [activeSub, setActiveSub] = useState('Physics');

  // Previous Year Papers navigation
  const [pyqOpen, setPyqOpen]       = useState(false);
  const [pyqSubject, setPyqSubject] = useState(null);
  const [pyqChapter, setPyqChapter] = useState(null);

  // Important Questions navigation
  const [impOpen, setImpOpen]       = useState(false);
  const [impSubject, setImpSubject] = useState(null);
  const [impChapter, setImpChapter] = useState(null);

  // MCQ Practice navigation
  const [mcqOpen, setMcqOpen]               = useState(false);   // showing the MCQ screen
  const [mcqOpenSub, setMcqOpenSub]         = useState('Physics');// which subject section is expanded
  const [mcqShowMore, setMcqShowMore]       = useState({});      // { 'Subject||Chapter': true }
  const [mcqChapSubject, setMcqChapSubject] = useState(null);    // chosen subject (placeholder)
  const [mcqChapter, setMcqChapter]         = useState(null);    // chosen chapter (placeholder)
  // Physics mock tests are DB-backed: { label, status:'loading'|'ready'|'error', questions, durationMin, name, error }
  const [physMock, setPhysMock]             = useState(null);

  // Mock Test navigation (subjects -> numbered mock quizzes)
  const [mockOpen, setMockOpen]           = useState(false);    // showing the Mock Test screen
  const [mockOpenSub, setMockOpenSub]     = useState(null);     // which subject section is expanded
  // DB-backed list + attempt data per subject:
  // { [subject]: { loading, error, tests:[{id,name,durationMin,questionCount}], attempts:{ [testId]: {bestScore,total,attempts} } } }
  const [mockData, setMockData]           = useState({});
  // Retest confirmation when re-opening an already-attempted test: { subject, test, att }
  const [retest, setRetest]               = useState(null);

  // Full-screen test: hide the bottom tab bar while a test (McqTestScreen) is open.
  const navigation = useNavigation();
  useEffect(() => {
    const inTest = !!mcqChapter;
    navigation.setOptions({ tabBarStyle: inTest ? { display: 'none' } : undefined });
    return () => navigation.setOptions({ tabBarStyle: undefined });
  }, [mcqChapter, navigation]);

  // DB-backed subjects use the DB mock tests; others keep the static source.
  // Same flow + same McqTestScreen either way.
  const DB_MOCK_SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];

  // Fetch the DB mock-test list + this user's attempt summary for a subject.
  const loadSubjectTests = async (subject) => {
    setMockData(prev => ({
      ...prev,
      [subject]: { loading: true, error: '', tests: (prev[subject] && prev[subject].tests) || [], attempts: (prev[subject] && prev[subject].attempts) || {} },
    }));
    try {
      const [listRes, attRes] = await Promise.all([
        listMockTests(subject),
        listMockAttempts(subject).catch(() => ({ attempts: [] })),
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
      const res = await listMockAttempts(subject);
      const attempts = {};
      for (const a of (res.attempts || [])) attempts[a.testId] = a;
      setMockData(prev => ({ ...prev, [subject]: { ...(prev[subject] || { tests: [], loading: false, error: '' }), attempts } }));
    } catch (e) { /* non-fatal */ }
  };

  // Toggle a subject section open/closed; lazy-load its DB tests on first open.
  const openSubjectSection = (subjectName) => {
    const willOpen = mockOpenSub !== subjectName;
    setMockOpenSub(willOpen ? subjectName : null);
    if (willOpen && DB_MOCK_SUBJECTS.includes(subjectName) && !mockData[subjectName]) loadSubjectTests(subjectName);
  };

  // Launch a DB-backed test (we already have the test object from the list).
  const startDbMock = (subject, test) => {
    setMcqChapSubject(subject);
    setMcqChapter(test.name);                                   // triggers the McqTestScreen branch
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
    setMcqChapter(null);
    setPhysMock(null);
    if (sub && DB_MOCK_SUBJECTS.includes(sub)) refreshAttempts(sub);
  };

  // Leaving the Practice tab resets all sub-navigation so it opens fresh next time
  // (fixes the bug where returning re-opened the last mock test).
  useFocusEffect(useCallback(() => () => {
    setPyqOpen(false); setPyqSubject(null); setPyqChapter(null);
    setImpOpen(false); setImpSubject(null); setImpChapter(null);
    setMcqOpen(false); setMcqChapter(null); setMcqChapSubject(null);
    setPhysMock(null);
    setMockOpen(false); setMockOpenSub(null);
  }, []));

  const activeFull = SUBJECTS.find(s => s.name === activeSub) || SUBJECTS[0];
  const pct = Math.round((activeFull.done / activeFull.topics) * 100);

  const mcqSubjects = MCQ_SUBJECT_ORDER
    .map(n => PYQ_SUBJECTS.find(sub => sub.name === n))
    .filter(Boolean);

  const openMcqChapter = (subject, chapter) => {
    setMcqChapSubject(subject);
    setMcqChapter(chapter);
  };

  const toggleShowMore = (subject, chapter) => {
    const key = subject + '||' + chapter;
    setMcqShowMore(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ── PYQ LEVEL 3 ─────────────────────────────────────────────────────────────
  if (pyqOpen && pyqSubject && pyqChapter) {
    const html = pyqHtmlFor(pyqSubject.name, pyqChapter);
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#fff' }} />}
        <BackHeader onBack={() => setPyqChapter(null)} />
        <View style={s.pageTitleWrap}>
          <Text style={s.pageTitle}>{pyqChapter}</Text>
          <Text style={s.pageSub}>{pyqSubject.name}  •  Previous Year Questions</Text>
        </View>
        {html ? (
          <PyqWebView html={html} />
        ) : (
          <View style={s.emptyWrap}>
            <Text style={s.emptyTitle}>Papers coming soon</Text>
            <Text style={s.emptySub}>Previous year questions for this chapter haven't been added yet.</Text>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // ── PYQ LEVEL 2 ─────────────────────────────────────────────────────────────
  if (pyqOpen && pyqSubject) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#fff' }} />}
        <BackHeader onBack={() => setPyqSubject(null)} />
        <View style={s.pageTitleWrap}>
          <Text style={s.pageTitle}>{pyqSubject.name}</Text>
          <Text style={s.pageSub}>Select a chapter</Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 32 }}>
          {pyqSubject.chapters.map((chapter, i) => {
            const hasPyq = !!pyqHtmlFor(pyqSubject.name, chapter);
            return (
              <TouchableOpacity key={i} style={s.listRow} activeOpacity={0.8} onPress={() => setPyqChapter(chapter)}>
                <View style={s.listNum}><Text style={s.listNumTxt}>{i + 1}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.listRowTitle}>{chapter}</Text>
                  <Text style={s.listRowSub}>{hasPyq ? 'View previous year questions' : 'Coming soon'}</Text>
                </View>
                <Text style={s.listArrow}>→</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── PYQ LEVEL 1 ─────────────────────────────────────────────────────────────
  if (pyqOpen) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#fff' }} />}
        <BackHeader onBack={() => setPyqOpen(false)} />
        <View style={s.pageTitleWrap}>
          <Text style={s.pageTitle}>Previous Year Papers</Text>
          <Text style={s.pageSub}>Select a subject  •  10 years question bank</Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}>
          {PYQ_SUBJECTS.map((subject, i) => (
            <TouchableOpacity key={i} style={s.subjectRow} activeOpacity={0.8} onPress={() => setPyqSubject(subject)}>
              <View style={[s.subjectIconWrap, { backgroundColor: subject.bg }]}>
                <Text style={{ fontSize: 26 }}>{subject.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.subjectName}>{subject.name}</Text>
                <Text style={s.subjectSub}>{subject.chapters.length} chapters</Text>
              </View>
              <Text style={s.listArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── IMPORTANT QUESTIONS LEVEL 3 ─────────────────────────────────────────────
  if (impOpen && impSubject && impChapter) {
    const html = impHtmlFor(impSubject.name, impChapter);
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#fff' }} />}
        <BackHeader onBack={() => setImpChapter(null)} />
        <View style={s.pageTitleWrap}>
          <Text style={s.pageTitle}>{impChapter}</Text>
          <Text style={s.pageSub}>{impSubject.name}  •  Important Questions</Text>
        </View>
        {html ? (
          <PyqWebView html={html} />
        ) : (
          <View style={s.emptyWrap}>
            <Text style={s.emptyTitle}>Coming soon</Text>
            <Text style={s.emptySub}>Important questions for this chapter haven't been added yet.</Text>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // ── IMPORTANT QUESTIONS LEVEL 2 ─────────────────────────────────────────────
  if (impOpen && impSubject) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#fff' }} />}
        <BackHeader onBack={() => setImpSubject(null)} />
        <View style={s.pageTitleWrap}>
          <Text style={s.pageTitle}>{impSubject.name}</Text>
          <Text style={s.pageSub}>Select a chapter  •  Important Questions</Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 32 }}>
          {impSubject.chapters.map((chapter, i) => {
            const hasImp = !!impHtmlFor(impSubject.name, chapter);
            return (
              <TouchableOpacity key={i} style={s.listRow} activeOpacity={0.8} onPress={() => setImpChapter(chapter)}>
                <View style={s.listNum}><Text style={s.listNumTxt}>{i + 1}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.listRowTitle}>{chapter}</Text>
                  <Text style={s.listRowSub}>{hasImp ? 'View important questions' : 'Coming soon'}</Text>
                </View>
                <Text style={s.listArrow}>→</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── IMPORTANT QUESTIONS LEVEL 1 ─────────────────────────────────────────────
  if (impOpen) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#fff' }} />}
        <BackHeader onBack={() => setImpOpen(false)} />
        <View style={s.pageTitleWrap}>
          <Text style={s.pageTitle}>Important Questions</Text>
          <Text style={s.pageSub}>Select a subject  •  Hand-picked must-do questions</Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}>
          {PYQ_SUBJECTS.map((subject, i) => (
            <TouchableOpacity key={i} style={s.subjectRow} activeOpacity={0.8} onPress={() => setImpSubject(subject)}>
              <View style={[s.subjectIconWrap, { backgroundColor: subject.bg }]}>
                <Text style={{ fontSize: 26 }}>{subject.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.subjectName}>{subject.name}</Text>
                <Text style={s.subjectSub}>{subject.chapters.length} chapters</Text>
              </View>
              <Text style={s.listArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── MCQ PRACTICE / MOCK TEST: chapter test (McqTestScreen) ──────────────────
  // Shared by both MCQ Practice and Mock Test: whenever a chapter is chosen, run it.
  if (mcqChapter) {
    // Physics/Chemistry mock tests are DB-backed (physMock set by startMockTest);
    // everything else keeps the existing static questions. Same McqTestScreen either way.
    const usingDb = physMock && physMock.label === mcqChapter;
    if (usingDb) {
      if (physMock.status === 'loading') {
        return (
          <SafeAreaView style={s.safe}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#fff' }} />}
            <BackHeader onBack={closePhysMock} />
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <ActivityIndicator size="large" color="#6C63FF" />
              <Text style={s.pageSub}>Loading {mcqChapter}…</Text>
            </View>
          </SafeAreaView>
        );
      }
      if (physMock.status === 'error') {
        return (
          <SafeAreaView style={s.safe}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#fff' }} />}
            <BackHeader onBack={closePhysMock} />
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 30 }}>
              <Text style={{ fontSize: 40 }}>⚠️</Text>
              <Text style={[s.pageTitle, { textAlign: 'center' }]}>Couldn't load this test</Text>
              <Text style={[s.pageSub, { textAlign: 'center' }]}>{physMock.error}</Text>
              <TouchableOpacity
                style={{ marginTop: 8, backgroundColor: '#6C63FF', borderRadius: 50, paddingVertical: 12, paddingHorizontal: 28 }}
                activeOpacity={0.85}
                onPress={retryDbMock}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>Retry</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        );
      }
      return (
        <McqTestScreen
          subject={physMock.subject || mcqChapSubject}
          chapter={physMock.name || mcqChapter}
          questions={physMock.questions}
          sections={physMock.sections}
          durationMin={physMock.durationMin}
          pointsPerCorrect={1}
          negative={0}
          onExit={closePhysMock}
          onSubmit={(payload) => {
            if (physMock.testId != null) submitMockTest(physMock.testId, payload).catch(() => {});
          }}
        />
      );
    }

    return (
      <McqTestScreen
        subject={mcqChapSubject}
        chapter={mcqChapter}
        questions={getMcqQuestions(mcqChapSubject, mcqChapter)}
        onExit={() => setMcqChapter(null)}
      />
    );
  }

  // ── MCQ PRACTICE: 4 subject sections ────────────────────────────────────────
  if (mcqOpen) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#fff' }} />}
        <BackHeader onBack={() => setMcqOpen(false)} />
        <View style={s.pageTitleWrap}>
          <Text style={s.pageTitle}>MCQ Practice</Text>
          <Text style={s.pageSub}>Choose a chapter to begin</Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          {mcqSubjects.map((subject) => {
            const isOpen = mcqOpenSub === subject.name;
            return (
              <View key={subject.name} style={s.mcqSection}>
                <TouchableOpacity
                  style={s.mcqSectionHeader}
                  activeOpacity={0.8}
                  onPress={() => setMcqOpenSub(isOpen ? null : subject.name)}>
                  <View style={[s.mcqSectionIcon, { backgroundColor: subject.bg }]}>
                    <Text style={{ fontSize: 20 }}>{subject.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.mcqSectionTitle}>{subject.name}</Text>
                    <Text style={s.mcqSectionSub}>{subject.chapters.length} chapters</Text>
                  </View>
                  <Text style={s.mcqChevron}>{isOpen ? '▾' : '▸'}</Text>
                </TouchableOpacity>

                {isOpen && (
                  <View style={{ marginTop: 10, gap: 10 }}>
                    {subject.chapters.map((chapter, i) => {
                      const key = subject.name + '||' + chapter;
                      return (
                        <McqChapterCard
                          key={i}
                          subject={subject.name}
                          chapter={chapter}
                          expanded={!!mcqShowMore[key]}
                          onToggle={() => toggleShowMore(subject.name, chapter)}
                          onStart={openMcqChapter}
                        />
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── MOCK TEST: 4 subject sections, each with a numbered mock-quiz list ───────
  if (mockOpen) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#fff' }} />}
        <BackHeader onBack={() => setMockOpen(false)} />
        <View style={s.pageTitleWrap}>
          <Text style={s.pageTitle}>Mock Test</Text>
          <Text style={s.pageSub}>Pick a subject, then a mock quiz to begin</Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          {mcqSubjects.map((subject) => {
            const isOpen = mockOpenSub === subject.name;
            const sd = mockData[subject.name];
            const tests = (sd && sd.tests) || [];
            const subSub = sd && sd.tests.length ? `${sd.tests.length} mock tests` : `${MOCK_QUIZ_COUNT} mock tests`;
            return (
              <View key={subject.name} style={s.mcqSection}>
                <TouchableOpacity
                  style={s.mcqSectionHeader}
                  activeOpacity={0.8}
                  onPress={() => openSubjectSection(subject.name)}>
                  <View style={[s.mcqSectionIcon, { backgroundColor: subject.bg }]}>
                    <Text style={{ fontSize: 20 }}>{subject.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.mcqSectionTitle}>{subject.name}</Text>
                    <Text style={s.mcqSectionSub}>{subSub}</Text>
                  </View>
                  <Text style={s.mcqChevron}>{isOpen ? '▾' : '▸'}</Text>
                </TouchableOpacity>

                {isOpen && (
                  <View style={{ marginTop: 10, gap: 10 }}>
                    {sd && sd.loading && (
                      <View style={{ paddingVertical: 18, alignItems: 'center' }}>
                        <ActivityIndicator color="#6C63FF" />
                      </View>
                    )}
                    {sd && !sd.loading && sd.error ? (
                      <View style={{ paddingVertical: 14, alignItems: 'center', gap: 8 }}>
                        <Text style={s.mockRowSub}>{sd.error}</Text>
                        <TouchableOpacity style={s.mockRetryBtn} onPress={() => loadSubjectTests(subject.name)}>
                          <Text style={s.mockRetryTxt}>Retry</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                    {!sd || (!sd.loading && !sd.error && tests.length === 0 && !sd.error) ? (
                      sd && !sd.loading ? <Text style={[s.mockRowSub, { textAlign: 'center', paddingVertical: 12 }]}>No mock tests yet.</Text> : null
                    ) : null}
                    {tests.map((t) => {
                      const att = sd.attempts && sd.attempts[t.id];
                      const attempted = !!att;
                      const scoreTxt = att && att.total != null ? `Score: ${att.bestScore}/${att.total}` : null;
                      return (
                        <TouchableOpacity
                          key={t.id}
                          style={s.mockRow}
                          activeOpacity={0.8}
                          onPress={() => onPickTest(subject.name, t, att)}>
                          <View style={[s.mockRowIcon, attempted && s.mockRowIconDone]}>
                            <Text style={{ fontSize: 18 }}>{attempted ? '✅' : '📄'}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={s.mockRowTitle}>{t.name}</Text>
                            <Text style={s.mockRowSub}>
                              {attempted ? (scoreTxt || 'Attempted') : `${t.questionCount || ''} Qs · ${t.durationMin || 90} min`}
                            </Text>
                          </View>
                          {attempted ? (
                            <View style={s.mockBadge}>
                              <Text style={s.mockBadgeTxt}>Attempted</Text>
                            </View>
                          ) : (
                            <Text style={s.mockRowChevron}>›</Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>

        {/* Retest confirmation for an already-attempted test */}
        <Modal visible={!!retest} transparent animationType="fade" onRequestClose={() => setRetest(null)}>
          <View style={s.retestOverlay}>
            <View style={s.retestCard}>
              <Text style={s.retestTitle}>{retest?.test?.name}</Text>
              <Text style={s.retestSub}>
                You've already attempted this test{retest?.att && retest.att.total != null ? ` (best score ${retest.att.bestScore}/${retest.att.total})` : ''}. Retake it? Your new score will be saved.
              </Text>
              <TouchableOpacity
                style={s.retestPrimary}
                activeOpacity={0.85}
                onPress={() => { const r = retest; setRetest(null); if (r) startDbMock(r.subject, r.test); }}>
                <Text style={s.retestPrimaryTxt}>🔄 Retake Test</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setRetest(null)}>
                <Text style={s.retestCancel}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // ── MAIN PRACTICE SCREEN ────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#fff' }} />}

      <View style={s.header}>
        <Text style={s.headerTitle}>Practice</Text>
        <View style={s.headerRight}>
          <View style={s.xpBadge}><Text style={s.xpTxt}>🔥 7 day streak</Text></View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* Subject selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 14, gap: 10 }}>
          {SUBJECTS.map(sub => (
            <TouchableOpacity key={sub.name}
              style={[s.subChip, activeSub === sub.name && s.subChipActive]}
              onPress={() => setActiveSub(sub.name)}>
              <Text style={{ fontSize: 16 }}>{sub.emoji}</Text>
              <Text style={[s.subChipTxt, activeSub === sub.name && s.subChipTxtActive]}>{sub.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Active subject card */}
        <View style={s.subjectCard}>
          <View style={s.subjectCardTop}>
            <View style={s.subjectIconBig}>
              <Text style={{ fontSize: 34 }}>{activeFull.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.subjectCardTitle}>{activeFull.name}</Text>
              <Text style={s.subjectCardSub}>{activeFull.done} / {activeFull.topics} topics completed</Text>
              <View style={s.progBarBg}>
                <View style={[s.progBarFill, { width: `${pct}%` }]} />
              </View>
            </View>
            <View style={s.pctCircle}>
              <Text style={s.pctTxt}>{pct}%</Text>
            </View>
          </View>
          <TouchableOpacity style={s.startBtn}>
            <Text style={s.startBtnTxt}>Start Practice Session  →</Text>
          </TouchableOpacity>
        </View>

        {/* Important Questions */}
        <Text style={s.sectionTitle}>Important Questions</Text>
        <TouchableOpacity style={s.impBanner} activeOpacity={0.85} onPress={() => setImpOpen(true)}>
          <View style={s.impIconBox}><Text style={{ fontSize: 24 }}>⭐</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.impTitle}>Important Questions</Text>
            <Text style={s.impSub}>Hand-picked must-do questions, chapter-wise</Text>
          </View>
          <Text style={s.impArrow}>→</Text>
        </TouchableOpacity>

        {/* Question types */}
        <Text style={s.sectionTitle}>Practice Modes</Text>
        <View style={s.qTypesGrid}>
          {QUESTION_TYPES.map((qt, i) => {
            const isMcq = qt.label === 'MCQ Practice';
            return (
              <TouchableOpacity key={i} style={s.qTypeCard}
                activeOpacity={isMcq ? 0.6 : 1}
                onPress={isMcq ? () => setMcqOpen(true) : undefined}>
                <Text style={{ fontSize: 28, marginBottom: 8 }}>{qt.icon}</Text>
                <Text style={s.qTypeLabel}>{qt.label}</Text>
                <Text style={s.qTypeSub}>{qt.sub}</Text>
                <View style={s.qTypeBadge}><Text style={s.qTypeBadgeTxt}>{qt.count}</Text></View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Practice Tests */}
        <Text style={s.sectionTitle}>Practice Tests</Text>
        <View style={s.practiceTestsCard}>
          {[
            { icon: '⚡', label: 'Chapter-wise Tests',  sub: 'Test one chapter at a time', count: '120+ Tests' },
            { icon: '📋', label: 'Mock Test',           sub: 'Subject-wise mock tests',    count: '20 Tests', onPress: () => setMockOpen(true) },
            { icon: '🎯', label: 'Previous Year Papers',sub: '10 years question bank',      count: '50 Papers', onPress: () => setPyqOpen(true) },
            { icon: '⏱',  label: 'Timed Challenge',    sub: '30 sec per question',         count: '200+ Qs' },
          ].map((item, i, arr) => (
            <TouchableOpacity key={i}
              style={[s.ptRow, i < arr.length - 1 && s.ptRowBorder]}
              activeOpacity={item.onPress ? 0.6 : 1}
              onPress={item.onPress}>
              <View style={s.ptIconBox}><Text style={{ fontSize: 20 }}>{item.icon}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.ptLabel}>{item.label}</Text>
                <Text style={s.ptSub}>{item.sub}</Text>
              </View>
              <View style={s.ptBadge}><Text style={s.ptBadgeTxt}>{item.count}</Text></View>
              <Text style={s.ptArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent attempts */}
        <Text style={s.sectionTitle}>Recent Attempts</Text>
        <View style={s.recentCard}>
          {RECENT.map((r, i) => (
            <View key={i} style={[s.recentRow, i < RECENT.length - 1 && s.recentRowBorder]}>
              <View style={s.recentLeft}>
                <Text style={s.recentSubject}>{r.subject}</Text>
                <Text style={s.recentTopic}>{r.topic}</Text>
              </View>
              <View style={s.recentRight}>
                <View style={[s.scoreBadge, r.score >= 85 && s.scoreBadgeHigh, r.score < 75 && s.scoreBadgeLow]}>
                  <Text style={s.scoreTxt}>{r.score}%</Text>
                </View>
                <Text style={s.recentDate}>{r.date}</Text>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: '#F7F7F7' },
  header:           { backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1.5, borderBottomColor: '#F0F0F0' },
  headerTitle:      { fontSize: 22, fontWeight: '900', color: '#1C1C1E', letterSpacing: -0.5 },
  headerRight:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  xpBadge:          { backgroundColor: '#F0F0F0', borderRadius: 12, paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1.5, borderColor: '#E8E8E8' },
  xpTxt:            { fontSize: 12, fontWeight: '800', color: '#1C1C1E' },

  backHeader:       { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1.5, borderBottomColor: '#F0F0F0' },
  backRow:          { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backArrow:        { fontSize: 20, color: '#1C1C1E', fontWeight: '700' },
  backTxt:          { fontSize: 15, fontWeight: '700', color: '#1C1C1E' },
  pageTitleWrap:    { backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14, borderBottomWidth: 1.5, borderBottomColor: '#F0F0F0' },
  pageTitle:        { fontSize: 20, fontWeight: '900', color: '#1C1C1E', letterSpacing: -0.4 },
  pageSub:          { fontSize: 13, color: '#8E8E93', fontWeight: '600', marginTop: 3 },

  subjectRow:       { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1.5, borderColor: '#F0F0F0', flexDirection: 'row', alignItems: 'center', gap: 16, padding: 14 },
  subjectIconWrap:  { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  subjectName:      { fontSize: 17, fontWeight: '900', color: '#1C1C1E', letterSpacing: -0.3 },
  subjectSub:       { fontSize: 12, color: '#8E8E93', fontWeight: '600', marginTop: 3 },

  listRow:          { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1.5, borderColor: '#F0F0F0', flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  listNum:          { width: 32, height: 32, borderRadius: 10, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
  listNumTxt:       { fontSize: 14, fontWeight: '900', color: '#1C1C1E' },
  listRowTitle:     { fontSize: 15, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.2 },
  listRowSub:       { fontSize: 12, color: '#8E8E93', fontWeight: '600', marginTop: 3 },
  listArrow:        { fontSize: 18, color: '#C7C7CC', fontWeight: '600' },

  webLoading:       { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  emptyWrap:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  emptyTitle:       { fontSize: 16, fontWeight: '900', color: '#1C1C1E', marginBottom: 8 },
  emptySub:         { fontSize: 13, color: '#8E8E93', fontWeight: '600', textAlign: 'center', lineHeight: 19 },

  // MCQ Practice
  mcqSection:       { marginBottom: 14 },
  mcqSectionHeader: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1.5, borderColor: '#F0F0F0', flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  mcqSectionIcon:   { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  mcqSectionTitle:  { fontSize: 16, fontWeight: '900', color: '#1C1C1E', letterSpacing: -0.3 },
  mcqSectionSub:    { fontSize: 12, color: '#8E8E93', fontWeight: '600', marginTop: 2 },
  mcqChevron:       { fontSize: 18, color: '#8E8E93', fontWeight: '700' },
  mcqCard:          { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1.5, borderColor: '#EEF0F5', padding: 16 },
  mcqCardRow:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mcqChapName:      { fontSize: 15, fontWeight: '800', color: '#1E293B', letterSpacing: -0.2 },
  mcqBarBg:         { flexDirection: 'row', height: 6, borderRadius: 4, backgroundColor: '#E2E8F1', overflow: 'hidden', marginTop: 10 },
  mcqBarSeg:        { height: 6 },
  mcqMetaRow:       { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  mcqMeta:          { fontSize: 11, color: '#94A3B8', fontWeight: '700' },
  mcqBtn:           { borderRadius: 12, paddingVertical: 10, paddingHorizontal: 18, borderWidth: 1.5, borderColor: '#CBE3E0', backgroundColor: '#fff' },
  mcqBtnActive:     { backgroundColor: '#2C8C84', borderColor: '#2C8C84' },
  mcqBtnTxt:        { fontSize: 14, fontWeight: '800', color: '#2C8C84' },
  mcqBtnTxtActive:  { color: '#fff' },
  mcqToggle:        { alignItems: 'center', paddingTop: 12, marginTop: 4 },
  mcqToggleTxt:     { fontSize: 13, fontWeight: '700', color: '#94A3B8' },
  mcqSubWrap:       { marginTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 12, gap: 8 },
  mcqSubCard:       { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#EEF2F7', padding: 12 },
  mcqSubCardName:   { fontSize: 14, fontWeight: '800', color: '#1E293B', letterSpacing: -0.2 },
  mcqSubBtn:        { borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, borderWidth: 1.5, borderColor: '#CBE3E0', backgroundColor: '#fff' },
  mcqSubBtnTxt:     { fontSize: 13, fontWeight: '800', color: '#2C8C84' },
  mcqSubBtnRow:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mcqSubBtnAlt:     { borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1.5, borderColor: '#CBE3E0', backgroundColor: '#ECF6F5' },
  mcqSubBtnAltTxt:  { fontSize: 13, fontWeight: '800', color: '#2C8C84' },
  mcqSubRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, paddingHorizontal: 4 },
  mcqSubDot:        { fontSize: 16, color: '#C7A85A', fontWeight: '900' },
  mcqSubName:       { flex: 1, fontSize: 14, color: '#334155', fontWeight: '600' },
  mcqSubArrow:      { fontSize: 14, color: '#C7C7CC', fontWeight: '700' },
  mcqSubEmpty:      { fontSize: 13, color: '#94A3B8', fontWeight: '600', fontStyle: 'italic', paddingVertical: 8, textAlign: 'center' },

  // Mock Test — numbered mock-quiz rows
  mockRow:          { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#F0F0F0', flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  mockRowIcon:      { width: 40, height: 40, borderRadius: 11, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#E0E7FF' },
  mockRowIconDone:  { backgroundColor: '#E7F7EC', borderColor: '#CDEBD6' },
  mockRowTitle:     { fontSize: 15, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.2 },
  mockRowSub:       { fontSize: 12, color: '#8E8E93', fontWeight: '600', marginTop: 3 },
  mockRowChevron:   { fontSize: 20, color: '#C7C7CC', fontWeight: '600' },
  mockBadge:        { backgroundColor: '#E7F7EC', borderRadius: 8, paddingVertical: 5, paddingHorizontal: 10, borderWidth: 1, borderColor: '#CDEBD6' },
  mockBadgeTxt:     { fontSize: 11, fontWeight: '800', color: '#2C8C84' },
  mockRetryBtn:     { backgroundColor: '#6C63FF', borderRadius: 50, paddingVertical: 9, paddingHorizontal: 22 },
  mockRetryTxt:     { color: '#fff', fontSize: 13, fontWeight: '800' },
  retestOverlay:    { flex: 1, backgroundColor: 'rgba(20,30,30,0.5)', alignItems: 'center', justifyContent: 'center', padding: 28 },
  retestCard:       { width: '100%', backgroundColor: '#fff', borderRadius: 18, padding: 22, alignItems: 'center' },
  retestTitle:      { fontSize: 17, fontWeight: '900', color: '#2D3A3A', marginBottom: 6 },
  retestSub:        { fontSize: 13, fontWeight: '600', color: '#6B7B7B', textAlign: 'center', lineHeight: 19, marginBottom: 18 },
  retestPrimary:    { alignSelf: 'stretch', backgroundColor: '#0E9A93', borderRadius: 50, paddingVertical: 13, alignItems: 'center' },
  retestPrimaryTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },
  retestCancel:     { color: '#8A9A9A', fontSize: 13, fontWeight: '700', marginTop: 14 },

  subChip:          { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 9, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.5, borderColor: '#E8E8E8', backgroundColor: '#fff' },
  subChipActive:    { backgroundColor: '#1C1C1E', borderColor: '#1C1C1E' },
  subChipTxt:       { fontSize: 13, fontWeight: '800', color: '#8E8E93' },
  subChipTxtActive: { color: '#fff' },
  subjectCard:      { marginHorizontal: 16, backgroundColor: '#1C1C1E', borderRadius: 22, padding: 18, marginBottom: 8 },
  subjectCardTop:   { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  subjectIconBig:   { width: 60, height: 60, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  subjectCardTitle: { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: -0.3 },
  subjectCardSub:   { fontSize: 12, color: '#888', fontWeight: '600', marginTop: 3, marginBottom: 8 },
  progBarBg:        { height: 5, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 3, overflow: 'hidden' },
  progBarFill:      { height: 5, backgroundColor: '#fff', borderRadius: 3 },
  pctCircle:        { width: 48, height: 48, borderRadius: 24, borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  pctTxt:           { fontSize: 13, fontWeight: '900', color: '#fff' },
  startBtn:         { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  startBtnTxt:      { fontSize: 15, fontWeight: '900', color: '#1C1C1E', letterSpacing: -0.3 },
  sectionTitle:     { fontSize: 17, fontWeight: '900', color: '#1C1C1E', letterSpacing: -0.3, paddingHorizontal: 16, marginTop: 16, marginBottom: 12 },

  impBanner:        { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1.5, borderColor: '#F0E6C8', flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  impIconBox:       { width: 48, height: 48, borderRadius: 14, backgroundColor: '#FBF3DA', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#F0E6C8' },
  impTitle:         { fontSize: 15, fontWeight: '900', color: '#1C1C1E', letterSpacing: -0.2 },
  impSub:           { fontSize: 12, color: '#8E8E93', fontWeight: '600', marginTop: 3 },
  impArrow:         { fontSize: 18, color: '#C7A85A', fontWeight: '700' },

  qTypesGrid:       { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10 },
  qTypeCard:        { width: '47%', backgroundColor: '#fff', borderRadius: 18, borderWidth: 1.5, borderColor: '#F0F0F0', padding: 16 },
  qTypeLabel:       { fontSize: 14, fontWeight: '900', color: '#1C1C1E', letterSpacing: -0.3, marginBottom: 4 },
  qTypeSub:         { fontSize: 11, color: '#8E8E93', fontWeight: '600', lineHeight: 16, marginBottom: 10 },
  qTypeBadge:       { backgroundColor: '#F0F0F0', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10, alignSelf: 'flex-start' },
  qTypeBadgeTxt:    { fontSize: 10, fontWeight: '800', color: '#1C1C1E' },
  practiceTestsCard:{ marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1.5, borderColor: '#F0F0F0', overflow: 'hidden', marginBottom: 4 },
  ptRow:            { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  ptRowBorder:      { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  ptIconBox:        { width: 44, height: 44, backgroundColor: '#F0F0F0', borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#E8E8E8' },
  ptLabel:          { fontSize: 14, fontWeight: '800', color: '#1C1C1E' },
  ptSub:            { fontSize: 11, color: '#8E8E93', fontWeight: '600', marginTop: 2 },
  ptBadge:          { backgroundColor: '#F0F0F0', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10 },
  ptBadgeTxt:       { fontSize: 10, fontWeight: '800', color: '#1C1C1E' },
  ptArrow:          { fontSize: 18, color: '#C7C7CC' },
  recentCard:       { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1.5, borderColor: '#F0F0F0', overflow: 'hidden' },
  recentRow:        { flexDirection: 'row', alignItems: 'center', padding: 14, justifyContent: 'space-between' },
  recentRowBorder:  { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  recentLeft:       {},
  recentSubject:    { fontSize: 14, fontWeight: '800', color: '#1C1C1E' },
  recentTopic:      { fontSize: 12, color: '#8E8E93', fontWeight: '600', marginTop: 2 },
  recentRight:      { alignItems: 'flex-end', gap: 4 },
  scoreBadge:       { backgroundColor: '#F0F0F0', borderRadius: 10, paddingVertical: 5, paddingHorizontal: 12 },
  scoreBadgeHigh:   { backgroundColor: '#1C1C1E' },
  scoreBadgeLow:    { backgroundColor: '#E8E8E8' },
  scoreTxt:         { fontSize: 13, fontWeight: '900', color: '#fff' },
  recentDate:       { fontSize: 10, color: '#8E8E93', fontWeight: '600' },
});

export default PracticeScreen;