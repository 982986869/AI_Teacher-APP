import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, StatusBar, Platform, ActivityIndicator, Modal } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { getQuestionsByPath, getChapters, getMcqByPath } from '../api/resourcesApi';
import McqTestScreen from './McqTestScreen';
import McqPracticeScreen from './McqPracticeScreen';
import TestQuestionScreen from './testQuestionScreen';
import MockResultScreen from './MockResultScreen';
import OnlineTestsScreen from './OnlineTestsScreen';
import { getMcqQuestions } from '../data/mcqQuestions';
import { getSubtopicTest } from '../data/subtopicBank';
import { listMockTests, getMockTestQuestions, listMockAttempts, submitMockTest } from '../api/mockTestsApi';
import { useAuth } from '../context/AuthContext';
import { ComingSoon, isClassReady } from '../components/ClassPicker';

// Subjects with DB-backed mock tests (served by mockTestsApi). The Mock Test
// button opens a subject -> mock list flow that runs each test through the
// shared (sectioned) McqTestScreen.
const DB_MOCK_SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];
const MOCK_QUIZ_COUNT = 10;

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
const slugify = (s) =>
  String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Build the .pyq-card HTML fragment from the structured questions the API returns.
function buildFragmentFromQuestions(questions) {
  return questions
    .map((q) => {
      const year = q.year ? `<span class="pyq-year">${q.year}</span>` : '';
      const header = `<div class="pyq-header"><span class="q-number">${q.qNumber || ''}</span>${year}</div>`;
      const question = `<div class="pyq-question">${q.questionHtml || ''}</div>`;
      let options = '';
      if (q.isMcq && Array.isArray(q.options) && q.options.length) {
        const opts = q.options
          .map(
            (o) =>
              `<div class="option${o.is_correct ? ' correct' : ''}">` +
              `<div class="option-index">${o.idx || ''}</div>` +
              `<div class="option-text">${o.html || ''}</div></div>`
          )
          .join('');
        options = `<div class="pyq-options">${opts}</div>`;
      }
      const solution = q.solutionHtml
        ? `<div class="solution-box"><div class="solution-title">Solution</div><div>${q.solutionHtml}</div></div>`
        : '';
      return `<div class="pyq-card">${header}${question}${options}${solution}</div>`;
    })
    .join('');
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
  .option.correct{ border-color:#16a34a; background:#e7f7ec; color:#15803d; font-weight:600; }
  .option.correct .option-index, .option.correct .option-text, .option.correct p{ color:#15803d; }
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
// Chapter lists mirror src/screens/ResourcesScreen.js SUBJECTS so the two stay
// consistent. Update both if the syllabus changes.
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

const QUESTION_TYPES = [
  { icon: '🎯', label: 'Practice Questions',    sub: 'Multiple choice questions',  count: '120+ Qs' },
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

// Renders question-cards with MathJax. If `html` is passed (e.g. Important
// Questions, from static files) it's shown directly; otherwise the PYQ for the
// given subject/chapter is fetched from the API.
const PyqWebView = ({ html, subject, chapter, sectionType = 'pyq' }) => {
  const [status, setStatus] = useState(
    html != null
      ? { loading: false, error: null, html }
      : { loading: true, error: null, html: null }
  );

  useEffect(() => {
    // Ready HTML provided (Important Questions) — no fetch needed.
    if (html != null) {
      setStatus({ loading: false, error: null, html });
      return;
    }
    // Otherwise fetch this chapter's questions from the API (PYQ).
    let alive = true;
    setStatus({ loading: true, error: null, html: null });
    getQuestionsByPath(slugify(subject), slugify(chapter), sectionType)
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
  }, [html, subject, chapter, sectionType]);

  if (status.loading) {
    return (
      <View style={[s.webLoading, { position: 'relative', flex: 1 }]}>
        <ActivityIndicator size="large" color="#1C1C1E" />
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
        source={{ html: buildPyqDocument(status.html) }}
        style={{ flex: 1, backgroundColor: '#f4f4f5' }}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        androidLayerType={Platform.OS === 'android' ? 'hardware' : undefined}
      />
    </View>
  );
};

// Chapter list for a subject — marks which chapters actually have data for the
// given section type (from API). Reused for PYQ and Important Questions.
const ChapterList = ({
  subject, onBack, onPick,
  sectionType = 'pyq',
  subtitle = 'Select a chapter',
  availableLabel = 'View previous year questions',
}) => {
  const [available, setAvailable] = useState(null); // Set<slug> | null while loading

  useEffect(() => {
    let alive = true;
    setAvailable(null);
    getChapters(slugify(subject.name), sectionType)
      .then((chs) => { if (alive) setAvailable(new Set((chs || []).map((c) => c.slug))); })
      .catch(() => { if (alive) setAvailable(new Set()); });
    return () => { alive = false; };
  }, [subject, sectionType]);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#fff' }} />}
      <BackHeader onBack={onBack} />
      <View style={s.pageTitleWrap}>
        <Text style={s.pageTitle}>{subject.name}</Text>
        <Text style={s.pageSub}>{subtitle}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 32 }}>
        {subject.chapters.map((chapter, i) => {
          const loading = available === null;
          const has = !loading && available.has(slugify(chapter));
          return (
            <TouchableOpacity key={i} style={s.listRow} activeOpacity={0.8}
              onPress={() => onPick(chapter)}>
              <View style={s.listNum}><Text style={s.listNumTxt}>{i + 1}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.listRowTitle}>{chapter}</Text>
                <Text style={s.listRowSub}>
                  {loading ? 'Loading…' : has ? availableLabel : 'Coming soon'}
                </Text>
              </View>
              <Text style={s.listArrow}>→</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

// Renders the MCQ test. If `preset` questions are supplied (a sub-topic's real
// questions from subtopicBank) they're used directly; otherwise it fetches the
// chapter's MCQs from the API, falling back to the local sample bank — so the
// flow is always playable.
const McqLoader = ({ subject, chapter, preset, onExit }) => {
  const hasPreset = Array.isArray(preset) && preset.length > 0;
  const [state, setState] = useState(
    hasPreset ? { loading: false, questions: preset } : { loading: true, questions: null }
  );

  useEffect(() => {
    if (hasPreset) { setState({ loading: false, questions: preset }); return; }
    let alive = true;
    setState({ loading: true, questions: null });
    getMcqByPath(slugify(subject), slugify(chapter))
      .then((qs) => {
        if (!alive) return;
        const list = Array.isArray(qs) && qs.length ? qs : getMcqQuestions(subject, chapter);
        setState({ loading: false, questions: list });
      })
      .catch(() => {
        if (!alive) return;
        setState({ loading: false, questions: getMcqQuestions(subject, chapter) });
      });
    return () => { alive = false; };
  }, [subject, chapter, hasPreset, preset]);

  if (state.loading) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#fff' }} />}
        <BackHeader onBack={onExit} />
        <View style={[s.webLoading, { flex: 1 }]}>
          <ActivityIndicator size="large" color="#0FA39A" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <McqTestScreen
      subject={subject}
      chapter={chapter}
      questions={state.questions}
      onExit={onExit}
    />
  );
};

const PracticeScreen = () => {
  const { selectedClass } = useAuth();
  const [activeSub, setActiveSub] = useState('Physics');

  // Previous Year Papers navigation
  const [pyqOpen, setPyqOpen]       = useState(false);   // showing the PYQ subject list
  const [pyqSubject, setPyqSubject] = useState(null);    // chosen subject (object)
  const [pyqChapter, setPyqChapter] = useState(null);    // chosen chapter (string)

  // Important Questions navigation (mirrors the PYQ flow)
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

  // Full-screen test: hide the bottom tab bar while a DB mock test is open.
  const navigation = useNavigation();
  useEffect(() => {
    const inTest = !!physMock;
    navigation.setOptions({ tabBarStyle: inTest ? { display: 'none' } : undefined });
    return () => navigation.setOptions({ tabBarStyle: undefined });
  }, [physMock, navigation]);

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
    if (sub && DB_MOCK_SUBJECTS.includes(sub)) refreshAttempts(sub);
  };

  // Leaving the Practice tab resets all sub-navigation so it opens fresh next
  // time (fixes the bug where returning re-opened the last mock test).
  useFocusEffect(useCallback(() => () => {
    setPyqOpen(false); setPyqSubject(null); setPyqChapter(null);
    setImpOpen(false); setImpSubject(null); setImpChapter(null);
    setMcqOpen(false); setMcqSel(null);
    setMockOpen(false); setMockOpenSub(null); setPhysMock(null); setRetest(null);
    setChOpen(false); setChSel(null); setChResult(null);
  }, []));

  const activeFull = SUBJECTS.find(s => s.name === activeSub) || SUBJECTS[0];
  const pct = Math.round((activeFull.done / activeFull.topics) * 100);

  // ── CLASS GATE: only Class 11 has practice content for now ──────────────────
  if (!isClassReady(selectedClass)) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#fff' }} />}
        <View style={s.header}>
          <Text style={s.headerTitle}>Practice</Text>
        </View>
        <ComingSoon className={selectedClass} />
      </SafeAreaView>
    );
  }

  // ── PYQ LEVEL 3: Previous-year questions for a chapter (fetched from API) ────
  if (pyqOpen && pyqSubject && pyqChapter) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#fff' }} />}
        <BackHeader onBack={() => setPyqChapter(null)} />
        <View style={s.pageTitleWrap}>
          <Text style={s.pageTitle}>{pyqChapter}</Text>
          <Text style={s.pageSub}>{pyqSubject.name}  •  Previous Year Questions</Text>
        </View>
        <PyqWebView subject={pyqSubject.name} chapter={pyqChapter} />
      </SafeAreaView>
    );
  }

  // ── PYQ LEVEL 2: Chapter list for the chosen subject ────────────────────────
  if (pyqOpen && pyqSubject) {
    return (
      <ChapterList
        subject={pyqSubject}
        sectionType="pyq"
        onBack={() => setPyqSubject(null)}
        onPick={(chapter) => setPyqChapter(chapter)}
      />
    );
  }

  // ── PYQ LEVEL 1: Subject list ───────────────────────────────────────────────
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
            <TouchableOpacity key={i} style={s.subjectRow} activeOpacity={0.8}
              onPress={() => setPyqSubject(subject)}>
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

  // ── IMPORTANT QUESTIONS LEVEL 3: questions for a chapter (from API) ──────────
  if (impOpen && impSubject && impChapter) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#fff' }} />}
        <BackHeader onBack={() => setImpChapter(null)} />
        <View style={s.pageTitleWrap}>
          <Text style={s.pageTitle}>{impChapter}</Text>
          <Text style={s.pageSub}>{impSubject.name}  •  Important Questions</Text>
        </View>
        <PyqWebView subject={impSubject.name} chapter={impChapter} sectionType="important_questions" />
      </SafeAreaView>
    );
  }

  // ── IMPORTANT QUESTIONS LEVEL 2: Chapter list for the chosen subject ─────────
  if (impOpen && impSubject) {
    return (
      <ChapterList
        subject={impSubject}
        sectionType="important_questions"
        subtitle="Select a chapter  •  Important Questions"
        availableLabel="View important questions"
        onBack={() => setImpSubject(null)}
        onPick={(chapter) => setImpChapter(chapter)}
      />
    );
  }

  // ── IMPORTANT QUESTIONS LEVEL 1: Subject list ───────────────────────────────
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
            <TouchableOpacity key={i} style={s.subjectRow} activeOpacity={0.8}
              onPress={() => setImpSubject(subject)}>
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

  // ── ONLINE TESTS: result / report screen (after submit) ────────────────────
  if (chOpen && chResult) {
    return (
      <MockResultScreen
        title={`${chResult.title} - Result`}
        result={chResult.data}
        onReview={() => { setChResult(null); }}
        onRetake={() => { setChResult(null); }}
        onClose={() => { setChResult(null); setChSel(null); setChOpen(false); }}
      />
    );
  }

  // ── ONLINE TESTS: attempt the chosen chapter (real questions) ──────────────
  if (chOpen && chSel) {
    return (
      <TestQuestionScreen
        bannerText={`${chSel.subject} · ${chSel.chapterName} • attempt the questions`}
        questions={chSel.questions}
        onExit={() => setChSel(null)}
        onSubmit={(payload) => {
          setChResult({ title: chSel.chapterName, data: computeMockResult(payload) });
          setChSel(null);
        }}
      />
    );
  }

  // ── ONLINE TESTS: subject -> chapter list (all 4 subjects, offline banks) ───
  if (chOpen) {
    return (
      <OnlineTestsScreen
        onBack={() => setChOpen(false)}
        onStartTest={(sel) => setChSel(sel)}
      />
    );
  }

  // ── MOCK TEST: the test itself (DB-backed, sectioned McqTestScreen) ──────────
  // physMock is set the moment a test is picked; show loading / error / the test.
  if (physMock) {
    if (physMock.status === 'loading') {
      return (
        <SafeAreaView style={s.safe}>
          <StatusBar barStyle="dark-content" backgroundColor="#fff" />
          {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#fff' }} />}
          <BackHeader onBack={closePhysMock} />
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <ActivityIndicator size="large" color="#0FA39A" />
            <Text style={s.pageSub}>Loading {physMock.label}…</Text>
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
              style={{ marginTop: 8, backgroundColor: '#0FA39A', borderRadius: 50, paddingVertical: 12, paddingHorizontal: 28 }}
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
        subject={physMock.subject}
        chapter={physMock.name || physMock.label}
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

  // ── MOCK TEST: subject sections, each with its DB-backed mock list ───────────
  if (mockOpen) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#fff' }} />}
        <BackHeader onBack={() => setMockOpen(false)} />
        <View style={s.pageTitleWrap}>
          <Text style={s.pageTitle}>Mock Test</Text>
          <Text style={s.pageSub}>Pick a subject, then a mock test to begin</Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          {PYQ_SUBJECTS.map((subject) => {
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
                        <ActivityIndicator color="#0FA39A" />
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
                    {sd && !sd.loading && !sd.error && tests.length === 0 ? (
                      <Text style={[s.mockRowSub, { textAlign: 'center', paddingVertical: 12 }]}>No mock tests yet.</Text>
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
                            <Ionicons
                              name={attempted ? 'checkmark-circle' : 'document-text-outline'}
                              size={20}
                              color="#0FA39A"
                            />
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

  // ── MCQ PRACTICE: the test itself (sub-topic preset, else chapter MCQs) ─────
  if (mcqOpen && mcqSel) {
    return (
      <McqLoader
        subject={mcqSel.subject}
        chapter={mcqSel.chapter}
        preset={mcqSel.preset}
        onExit={() => setMcqSel(null)}
      />
    );
  }

  // ── MCQ PRACTICE: progress picker (subject -> chapter/sub-topic) ────────────
  if (mcqOpen) {
    return (
      <McqPracticeScreen
        onBack={() => setMcqOpen(false)}
        onStartChapter={(subject, chapter) => setMcqSel({ subject, chapter })}
        onStartSubtopic={(subject, chapter, subtopic) => {
          // Use the sub-topic's real questions when fetched; otherwise fall back
          // to the chapter's MCQs (McqLoader fetches them when preset is empty).
          const preset = getSubtopicTest(chapter, subtopic);
          setMcqSel({ subject, chapter, subtopic, preset: preset.length ? preset : undefined });
        }}
      />
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
          <View style={s.impIconBox}>
            <Text style={{ fontSize: 24 }}>⭐</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.impTitle}>Important Questions</Text>
            <Text style={s.impSub}>Hand-picked must-do questions, chapter-wise</Text>
          </View>
          <Text style={s.impArrow}>→</Text>
        </TouchableOpacity>

        {/* Question types */}
        <Text style={s.sectionTitle}>Practice Modes</Text>
        <View style={s.qTypesGrid}>
          {QUESTION_TYPES.map((qt, i) => (
            <TouchableOpacity key={i} style={s.qTypeCard}
              activeOpacity={qt.label === 'Practice Questions' ? 0.7 : 1}
              onPress={qt.label === 'Practice Questions' ? () => setMcqOpen(true) : undefined}>
              <Text style={{ fontSize: 28, marginBottom: 8 }}>{qt.icon}</Text>
              <Text style={s.qTypeLabel}>{qt.label}</Text>
              <Text style={s.qTypeSub}>{qt.sub}</Text>
              <View style={s.qTypeBadge}><Text style={s.qTypeBadgeTxt}>{qt.count}</Text></View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Practice Tests */}
        <Text style={s.sectionTitle}>Practice Tests</Text>
        <View style={s.practiceTestsCard}>
          {[
            { icon: '⚡', label: 'Online Tests',  sub: 'Test one chapter at a time', count: '120+ Tests', onPress: () => setChOpen(true) },
            { icon: '📋', label: 'Mock Test',           sub: 'Subject-wise mock tests',     count: '10 each', onPress: () => setMockOpen(true) },
            { icon: '🎯', label: 'Previous Year Papers',sub: '10 years question bank',      count: '50 Papers', onPress: () => setPyqOpen(true) },
          ].map((item, i, arr) => (
            <TouchableOpacity key={i}
              style={[s.ptRow, i < arr.length - 1 && s.ptRowBorder]}
              activeOpacity={item.onPress ? 0.6 : 1}
              onPress={item.onPress}>
              <View style={s.ptIconBox}>
                <Text style={{ fontSize: 20 }}>{item.icon}</Text>
              </View>
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

  // Back header + page title (PYQ / Important sub-screens)
  backHeader:       { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1.5, borderBottomColor: '#F0F0F0' },
  backRow:          { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backArrow:        { fontSize: 20, color: '#1C1C1E', fontWeight: '700' },
  backTxt:          { fontSize: 15, fontWeight: '700', color: '#1C1C1E' },
  pageTitleWrap:    { backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14, borderBottomWidth: 1.5, borderBottomColor: '#F0F0F0' },
  pageTitle:        { fontSize: 20, fontWeight: '900', color: '#1C1C1E', letterSpacing: -0.4 },
  pageSub:          { fontSize: 13, color: '#8E8E93', fontWeight: '600', marginTop: 3 },

  // Subject rows (PYQ / Important level 1)
  subjectRow:       { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1.5, borderColor: '#F0F0F0', flexDirection: 'row', alignItems: 'center', gap: 16, padding: 14 },
  subjectIconWrap:  { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  subjectName:      { fontSize: 17, fontWeight: '900', color: '#1C1C1E', letterSpacing: -0.3 },
  subjectSub:       { fontSize: 12, color: '#8E8E93', fontWeight: '600', marginTop: 3 },

  // Generic list rows (chapters + papers)
  listRow:          { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1.5, borderColor: '#F0F0F0', flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  listNum:          { width: 32, height: 32, borderRadius: 10, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
  listNumTxt:       { fontSize: 14, fontWeight: '900', color: '#1C1C1E' },
  listRowTitle:     { fontSize: 15, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.2 },
  listRowSub:       { fontSize: 12, color: '#8E8E93', fontWeight: '600', marginTop: 3 },
  listArrow:        { fontSize: 18, color: '#C7C7CC', fontWeight: '600' },

  // Question WebView + empty state
  webLoading:       { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  emptyWrap:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  emptyTitle:       { fontSize: 16, fontWeight: '900', color: '#1C1C1E', marginBottom: 8 },
  emptySub:         { fontSize: 13, color: '#8E8E93', fontWeight: '600', textAlign: 'center', lineHeight: 19 },

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

  // Important Questions banner (main screen)
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

  // Mock Test — collapsible subject sections + DB-backed mock rows + retest modal
  mcqSection:       { marginBottom: 14 },
  mcqSectionHeader: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1.5, borderColor: '#F0F0F0', flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  mcqSectionIcon:   { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  mcqSectionTitle:  { fontSize: 16, fontWeight: '900', color: '#1C1C1E', letterSpacing: -0.3 },
  mcqSectionSub:    { fontSize: 12, color: '#8E8E93', fontWeight: '600', marginTop: 2 },
  mcqChevron:       { fontSize: 18, color: '#8E8E93', fontWeight: '700' },
  mockRow:          { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#EFF1F4', flexDirection: 'row', alignItems: 'center', gap: 14, padding: 15, shadowColor: '#2A2D3A', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  mockRowIcon:      { width: 42, height: 42, borderRadius: 12, backgroundColor: '#E1F5F3', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#C7E9E5' },
  mockRowIconDone:  { backgroundColor: '#E1F5F3', borderColor: '#C7E9E5' },
  mockRowTitle:     { fontSize: 15, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.2 },
  mockRowSub:       { fontSize: 12, color: '#8E8E93', fontWeight: '600', marginTop: 3 },
  mockRowChevron:   { fontSize: 20, color: '#C7C7CC', fontWeight: '600' },
  mockBadge:        { backgroundColor: '#E7F7EC', borderRadius: 8, paddingVertical: 5, paddingHorizontal: 10, borderWidth: 1, borderColor: '#CDEBD6' },
  mockBadgeTxt:     { fontSize: 11, fontWeight: '800', color: '#2C8C84' },
  mockRetryBtn:     { backgroundColor: '#0FA39A', borderRadius: 50, paddingVertical: 9, paddingHorizontal: 22 },
  mockRetryTxt:     { color: '#fff', fontSize: 13, fontWeight: '800' },
  retestOverlay:    { flex: 1, backgroundColor: 'rgba(20,30,30,0.5)', alignItems: 'center', justifyContent: 'center', padding: 28 },
  retestCard:       { width: '100%', backgroundColor: '#fff', borderRadius: 18, padding: 22, alignItems: 'center' },
  retestTitle:      { fontSize: 17, fontWeight: '900', color: '#2D3A3A', marginBottom: 6 },
  retestSub:        { fontSize: 13, fontWeight: '600', color: '#6B7B7B', textAlign: 'center', lineHeight: 19, marginBottom: 18 },
  retestPrimary:    { alignSelf: 'stretch', backgroundColor: '#0E9A93', borderRadius: 50, paddingVertical: 13, alignItems: 'center' },
  retestPrimaryTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },
  retestCancel:     { color: '#8A9A9A', fontSize: 13, fontWeight: '700', marginTop: 14 },
});

export default PracticeScreen;