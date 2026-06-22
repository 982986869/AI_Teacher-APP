import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, StatusBar, Platform, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { getQuestionsByPath, getChapters, getMcqByPath } from '../api/resourcesApi';
import McqTestScreen from './McqTestScreen';
import McqPracticeScreen from './McqPracticeScreen';
import MockTestScreen from './mockTestScreen';
import TestQuestionScreen from './testQuestionScreen';
import ChapterListScreen from './ChapterListScreen';
import { getMcqQuestions } from '../data/mcqQuestions';
import { getQuestions, allQuestions } from '../data/questionBank';

// A spread of ~20 questions across the whole bank for the full-syllabus mock.
const MOCK_QUESTIONS = (() => {
  const step = Math.max(1, Math.floor(allQuestions.length / 20));
  return allQuestions.filter((_, i) => i % step === 0).slice(0, 20);
})();

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

// Fetches real MCQs for a chapter from the API, then renders the test. Falls
// back to the local sample bank if the chapter has no MCQs (or the call fails),
// so the flow is always playable.
const McqLoader = ({ subject, chapter, onExit }) => {
  const [state, setState] = useState({ loading: true, questions: null });

  useEffect(() => {
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
  }, [subject, chapter]);

  if (state.loading) {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#fff' }} />}
        <BackHeader onBack={onExit} />
        <View style={[s.webLoading, { flex: 1 }]}>
          <ActivityIndicator size="large" color="#6C63FF" />
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

  // Mock Test navigation: null -> 'intro' (MockTestScreen) -> 'quiz' (TestQuestionScreen)
  const [mockStage, setMockStage] = useState(null);

  // Chapter-wise Tests: list chapters (ChapterListScreen) -> attempt (TestQuestionScreen)
  const [chOpen, setChOpen] = useState(false);  // showing the chapter list
  const [chSel, setChSel]   = useState(null);   // chosen chapter ({ id, name, count })

  const activeFull = SUBJECTS.find(s => s.name === activeSub) || SUBJECTS[0];
  const pct = Math.round((activeFull.done / activeFull.topics) * 100);

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

  // ── CHAPTER-WISE TEST: attempt the chosen chapter (real questions) ──────────
  if (chOpen && chSel) {
    return (
      <TestQuestionScreen
        bannerText={`${chSel.name} • attempt the questions`}
        questions={getQuestions(chSel.id)}
        onExit={() => setChSel(null)}
        onSubmit={() => { setChSel(null); setChOpen(false); }}
      />
    );
  }

  // ── CHAPTER-WISE TEST: chapter list (from the question bank) ────────────────
  if (chOpen) {
    return (
      <ChapterListScreen
        subject="Physics · Class 11"
        onBack={() => setChOpen(false)}
        onSelectChapter={(ch) => setChSel(ch)}
      />
    );
  }

  // ── MOCK TEST: question-attempt screen (after "Start Test") ─────────────────
  if (mockStage === 'quiz') {
    return (
      <TestQuestionScreen
        bannerText="Full Syllabus Mock • attempt any 20 questions"
        questions={MOCK_QUESTIONS}
        onExit={() => setMockStage('intro')}
        onSubmit={() => setMockStage(null)}
      />
    );
  }

  // ── MOCK TEST: intro / instructions screen ──────────────────────────────────
  if (mockStage === 'intro') {
    return (
      <MockTestScreen
        onBack={() => setMockStage(null)}
        onStartTest={() => setMockStage('quiz')}
      />
    );
  }

  // ── MCQ PRACTICE: the test itself (real MCQs from the API) ──────────────────
  if (mcqOpen && mcqSel) {
    return (
      <McqLoader
        subject={mcqSel.subject}
        chapter={mcqSel.chapter}
        onExit={() => setMcqSel(null)}
      />
    );
  }

  // ── MCQ PRACTICE: progress picker (subject -> chapter, from mcqPractice.js) ──
  if (mcqOpen) {
    return (
      <McqPracticeScreen
        onBack={() => setMcqOpen(false)}
        onStartChapter={(subject, chapter) => setMcqSel({ subject, chapter })}
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
              activeOpacity={qt.label === 'MCQ Practice' ? 0.7 : 1}
              onPress={qt.label === 'MCQ Practice' ? () => setMcqOpen(true) : undefined}>
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
            { icon: '⚡', label: 'Chapter-wise Tests',  sub: 'Test one chapter at a time', count: '120+ Tests', onPress: () => setChOpen(true) },
            { icon: '📋', label: 'Full Syllabus Test',  sub: 'Complete subject mock test',  count: '20 Tests', onPress: () => setMockStage('intro') },
            { icon: '🎯', label: 'Previous Year Papers',sub: '10 years question bank',      count: '50 Papers', onPress: () => setPyqOpen(true) },
            { icon: '⏱',  label: 'Timed Challenge',    sub: '30 sec per question',         count: '200+ Qs' },
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
});

export default PracticeScreen;