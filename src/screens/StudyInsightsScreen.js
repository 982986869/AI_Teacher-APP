import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
  StatusBar, Platform, ActivityIndicator, TextInput,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getStudyPlan, startRevision, getMemorySummary, askAgent, getChapterProgress } from '../api/aiApi';
import { C, F, SP, R, GRAD } from '../components/teacher/premiumTheme';
import { PressableScale, Gradient } from '../components/teacher/uiKit';

const SUBJECTS = ['All', 'Physics', 'Maths', 'Chemistry', 'Biology'];
const TABS = [
  { key: 'next', label: '🧭 What next?' },
  { key: 'revise', label: '🔁 Revise' },
  { key: 'progress', label: '📊 Progress' },
];

// Connects three already-built backend endpoints to the UI:
//   • GET  /api/ai/plan            → planner.recommendNext   ("What next?")
//   • POST /api/ai/revision        → agent.startRevision     (weak-topic revision)
//   • GET  /api/ai/memory/summary  → memory.getSummary       (progress)
// No new agent logic — this screen only surfaces existing intelligence.
const StudyInsightsScreen = ({ initialSubject = 'Physics', initialTab = 'next', onBack }) => {
  const { user } = useAuth();
  const [tab, setTab] = useState(initialTab);
  const [subject, setSubject] = useState(SUBJECTS.includes(initialSubject) ? initialSubject : 'All');

  return (
    <SafeAreaView style={st.safe}>
      <StatusBar barStyle="light-content" backgroundColor={GRAD.mint[0]} />

      {/* ── gradient header: back · title · pill tabs ── */}
      <Gradient colors={GRAD.mint} style={st.header}>
        {Platform.OS === 'android' && <View style={{ height: 24 }} />}
        <View style={st.headerTop}>
          <PressableScale onPress={onBack} style={st.hIcon} accessibilityLabel="Go back"><Text style={st.hIconTxt}>‹</Text></PressableScale>
          <Text style={st.headerTitle} accessibilityRole="header">Study Insights</Text>
          <View style={{ width: 38 }} />
        </View>

        <View style={st.tabs}>
          {TABS.map((t) => (
            <PressableScale key={t.key} style={[st.tab, tab === t.key && st.tabOn]} onPress={() => setTab(t.key)}
              accessibilityLabel={t.label} accessibilityState={{ selected: tab === t.key }}>
              <Text style={[st.tabTxt, tab === t.key && st.tabTxtOn]} numberOfLines={1}>{t.label}</Text>
            </PressableScale>
          ))}
        </View>
      </Gradient>

      <View style={st.subjRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: SP.lg }}>
          {SUBJECTS.map((s) => (
            <PressableScale key={s} style={[st.chip, subject === s && st.chipOn]} onPress={() => setSubject(s)}
              accessibilityLabel={`Subject ${s}`} accessibilityState={{ selected: subject === s }}>
              <Text style={[st.chipTxt, subject === s && st.chipTxtOn]}>{s}</Text>
            </PressableScale>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={st.body} showsVerticalScrollIndicator={false}>
        {tab === 'next' && <NextTab subject={subject} />}
        {tab === 'revise' && <ReviseTab subject={subject} grade={user?.grade} />}
        {tab === 'progress' && <ProgressTab subject={subject} />}
      </ScrollView>
    </SafeAreaView>
  );
};

// Convert the "All" sentinel to undefined (the endpoints treat no subject as all-subjects).
const subjParam = (s) => (s && s !== 'All' ? s : undefined);

// Seconds → compact human duration ("0m", "45m", "2h 5m").
const fmtDuration = (secs) => {
  const s = Math.max(0, Math.round(Number(secs) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

// ─── Tab 1: What should I study next? (GET /api/ai/plan) ──────────────────────
const ACTION_META = {
  revise: { icon: '🔁', tag: 'REVISE FIRST', tint: C.orange },
  learn:  { icon: '📖', tag: 'LEARN NEXT',   tint: C.blue },
  review: { icon: '🎯', tag: 'KEEP SHARP',   tint: C.green },
};

const NextTab = ({ subject }) => {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [plan, setPlan] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  // cancelled-guard: a stale response from a previous subject must never overwrite
  // the current one (rapid subject switching).
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setErr(''); setPlan(null);
    getStudyPlan(subjParam(subject))
      .then((d) => { if (!cancelled) setPlan(d); })
      .catch((e) => { if (!cancelled) setErr(e?.response?.data?.error || e?.message || 'Could not load your plan.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [subject, reloadKey]);

  if (loading) return <Loader text="Looking at your progress…" />;
  if (err) return <ErrorCard text={err} onRetry={() => setReloadKey((k) => k + 1)} />;
  if (!plan) return null;

  const meta = ACTION_META[plan.action] || ACTION_META.review;
  return (
    <>
      <View style={[st.card, { borderColor: meta.tint + '66' }]}>
        <View style={st.recTagRow}>
          <Text style={[st.recTag, { color: meta.tint }]}>{meta.icon}  {meta.tag}</Text>
          {plan.driver === 'mastery' && <Text style={st.recDriver}>mastery-based</Text>}
        </View>
        <Text style={st.recTitle}>{plan.concept || plan.chapter || plan.subject || 'Keep going'}</Text>
        {!!plan.concept && !!plan.chapter && <Text style={st.recSub}>{plan.chapter} · {plan.subject}</Text>}
        {!plan.concept && !!plan.subject && !!plan.chapter && <Text style={st.recSub}>{plan.subject}</Text>}
        {typeof plan.masteryPct === 'number' && <MasteryBar pct={plan.masteryPct} />}
        <Text style={st.recReason}>{plan.reason}</Text>
      </View>

      {Array.isArray(plan.weakConcepts) && plan.weakConcepts.length > 0 && (
        <View style={st.card}>
          <Text style={st.cardHdr}>🧠 CONCEPTS TO STRENGTHEN</Text>
          {plan.weakConcepts.slice(0, 6).map((c, i) => (
            <ConceptRow key={`${c.concept}-${i}`} c={c} />
          ))}
        </View>
      )}

      {Array.isArray(plan.weakChapters) && plan.weakChapters.length > 0 && (
        <View style={st.card}>
          <Text style={st.cardHdr}>WEAKEST CHAPTERS</Text>
          {plan.weakChapters.slice(0, 5).map((w, i) => (
            <WeakRow key={`${w.subject}-${w.chapter}-${i}`} w={w} />
          ))}
        </View>
      )}
    </>
  );
};

// ─── Tab 2: Revise my weak topics (POST /api/ai/revision) ─────────────────────
const ReviseTab = ({ subject, grade }) => {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [rev, setRev] = useState(null);

  // Inline quick-check grading (reuses POST /api/ai/ask with the revision's pending).
  const [answer, setAnswer] = useState('');
  const [grading, setGrading] = useState(false);
  const [graded, setGraded] = useState(null); // { verdict, feedback }

  // Monotonic request token, bumped on every subject switch AND every run(). A
  // response that lands after the student has moved on is dropped, so a revision
  // built for Biology can never render under the Chemistry chip.
  const reqRef = useRef(0);

  // Switching subject invalidates the current revision — reset back to the intro card
  // for the new subject. Deliberately NOT auto-run: startRevision generates a recap
  // and a quiz via the LLM, so it stays an explicit tap.
  useEffect(() => {
    reqRef.current += 1;
    setRev(null); setGraded(null); setAnswer(''); setErr(''); setLoading(false);
  }, [subject]);

  const run = useCallback(async () => {
    const token = (reqRef.current += 1);
    setLoading(true); setErr(''); setRev(null); setGraded(null); setAnswer('');
    try {
      const data = await startRevision(subjParam(subject));
      if (reqRef.current !== token) return; // subject changed mid-flight — drop it
      setRev(data);
    } catch (e) {
      if (reqRef.current !== token) return;
      setErr(e?.response?.data?.error || e?.message || 'Could not build a revision.');
    } finally {
      if (reqRef.current === token) setLoading(false);
    }
  }, [subject]);

  const submitAnswer = async () => {
    const a = answer.trim();
    if (!a || grading || !rev?.pending) return;
    setGrading(true);
    try {
      const res = await askAgent({ text: a, subject: rev.focus?.subject, gradeLevel: grade || '8', pending: rev.pending });
      setGraded({ verdict: res.verdict || 'partial', feedback: res.answer || '' });
    } catch (e) {
      setGraded({ verdict: 'error', feedback: e?.response?.data?.error || e?.message || 'Could not grade that.' });
    } finally {
      setGrading(false);
    }
  };

  if (loading) return <Loader text="Preparing your revision…" />;

  if (!rev) {
    return (
      <>
        {err ? <ErrorCard text={err} onRetry={run} /> : (
          <View style={st.card}>
            <Text style={st.recTitle}>Revise your weak topics</Text>
            <Text style={st.recReason}>
              I’ll pick the chapter you’re struggling with most, give you a quick recap, then a one-question check.
            </Text>
          </View>
        )}
        <TouchableOpacity style={st.cta} onPress={run} activeOpacity={0.9}>
          <Text style={st.ctaTxt}>Start revision  ✨</Text>
        </TouchableOpacity>
      </>
    );
  }

  const verdictTint = graded
    ? (graded.verdict === 'correct' ? C.green : graded.verdict === 'error' ? C.pink : C.orange)
    : C.dim;

  return (
    <>
      <View style={st.card}>
        <Text style={st.recTagRow2}>📍 FOCUS</Text>
        <Text style={st.recTitle}>{rev.focus?.concept || rev.focus?.chapter || rev.focus?.subject || 'Revision'}</Text>
        {!!rev.focus?.concept && !!rev.focus?.chapter && <Text style={st.recSub}>{rev.focus.chapter} · {rev.focus.subject}</Text>}
        {typeof rev.focus?.masteryPct === 'number' && <MasteryBar pct={rev.focus.masteryPct} />}
        {!!rev.focus?.reason && <Text style={st.recReason}>{rev.focus.reason}</Text>}
      </View>

      <View style={st.card}>
        <Text style={st.cardHdr}>QUICK RECAP</Text>
        <Text style={st.recapTxt}>{rev.recap || rev.answer}</Text>
      </View>

      {rev.pending?.question && (
        <View style={st.card}>
          <Text style={st.cardHdr}>QUICK CHECK</Text>
          <Text style={st.qText}>{rev.pending.question}</Text>

          {!graded ? (
            <>
              <TextInput
                style={st.input}
                placeholder="Type your answer…"
                placeholderTextColor={C.faint}
                value={answer}
                onChangeText={setAnswer}
                multiline
                editable={!grading}
              />
              <TouchableOpacity
                style={[st.cta, (grading || !answer.trim()) && { opacity: 0.55 }]}
                onPress={submitAnswer}
                disabled={grading || !answer.trim()}
                activeOpacity={0.9}
              >
                {grading
                  ? <View style={st.rowCenter}><ActivityIndicator color="#fff" size="small" /><Text style={st.ctaTxt}>  Checking…</Text></View>
                  : <Text style={st.ctaTxt}>Check my answer</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <View style={[st.verdictBox, { borderColor: verdictTint + '66' }]}>
              <Text style={[st.verdictTag, { color: verdictTint }]}>
                {graded.verdict === 'correct' ? '✓ Correct' : graded.verdict === 'error' ? '⚠️ Error' : '~ Almost'}
              </Text>
              <Text style={st.verdictTxt}>{graded.feedback}</Text>
            </View>
          )}
        </View>
      )}

      <TouchableOpacity style={[st.ctaGhost]} onPress={run} activeOpacity={0.9}>
        <Text style={st.ctaGhostTxt}>↻  Revise another topic</Text>
      </TouchableOpacity>
    </>
  );
};

// ─── Tab 3: Progress summary (GET /api/ai/memory/summary) ─────────────────────
const ProgressTab = ({ subject }) => {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [sum, setSum] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setErr('');
    Promise.all([
      getMemorySummary(),
      getChapterProgress(subjParam(subject)).catch(() => ({ chapters: [] })),
    ])
      .then(([s, cp]) => {
        if (cancelled) return;
        setSum(s);
        setChapters(Array.isArray(cp && cp.chapters) ? cp.chapters : []);
      })
      .catch((e) => { if (!cancelled) setErr(e?.response?.data?.error || e?.message || 'Could not load your progress.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [subject, reloadKey]);

  if (loading) return <Loader text="Loading your progress…" />;
  if (err) return <ErrorCard text={err} onRetry={() => setReloadKey((k) => k + 1)} />;
  if (!sum) return null;

  const acc = sum.quizAccuracy != null ? `${Math.round(sum.quizAccuracy * 100)}%` : '—';
  const engaged = sum.chaptersEngaged || 0;
  const studyTime = fmtDuration(sum.studySeconds || 0);
  const lessonsDone = sum.lessonsCompleted || 0;
  const lessonsStarted = sum.lessonsStarted || 0;
  const streak = sum.learningStreak || 0;
  const chaptersCompleted = chapters.filter((c) => c.completed).length;
  const chaptersInProgress = chapters.filter((c) => c.inProgress).length;
  const hasAny = engaged > 0 || lessonsStarted > 0 || chapters.length > 0 || (sum.recentActivity && sum.recentActivity.length > 0);

  if (!hasAny) {
    return (
      <View style={st.card}>
        <Text style={st.recTitle}>No progress yet</Text>
        <Text style={st.recReason}>Start a lesson or ask the AI Teacher a few doubts — your study time, weak and strong areas will show up here.</Text>
      </View>
    );
  }

  return (
    <>
      <View style={st.statRow}>
        <Stat n={`${streak}🔥`} l={'Day\nstreak'} />
        <Stat n={studyTime} l={'Study\ntime'} />
        <Stat n={acc} l={'Quiz\naccuracy'} />
      </View>
      <View style={st.statRow}>
        <Stat n={String(lessonsDone)} l={'Lessons\ncompleted'} />
        <Stat n={String(chaptersCompleted)} l={'Chapters\ncompleted'} />
        <Stat n={String(chaptersInProgress)} l={'Chapters\nin progress'} />
      </View>

      {chapters.length > 0 && (
        <View style={st.card}>
          <Text style={st.cardHdr}>📚 CHAPTER PROGRESS</Text>
          {chapters.slice(0, 12).map((c, i) => (
            <ChapterRow key={`${c.chapter}-${i}`} c={c} />
          ))}
        </View>
      )}

      <View style={st.card}>
        <Text style={st.cardHdr}>💪 STRONG CHAPTERS</Text>
        {Array.isArray(sum.strongChapters) && sum.strongChapters.length > 0 ? (
          sum.strongChapters.map((c, i) => (
            <View key={`${c.chapter}-${i}`} style={st.lineRow}>
              <Text style={st.lineTitle} numberOfLines={1}>{c.chapter || c.subject}</Text>
              <View style={[st.scorePill, { backgroundColor: 'rgba(87,214,151,0.14)' }]}>
                <Text style={[st.scoreTxt, { color: C.green }]}>{c.accuracy != null ? `${Math.round(c.accuracy * 100)}%` : '—'}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={st.emptyHint}>Keep taking quizzes to build strong chapters (80%+ accuracy).</Text>
        )}
      </View>

      <View style={st.card}>
        <Text style={st.cardHdr}>🩹 WEAK CHAPTERS</Text>
        {Array.isArray(sum.weakChapters) && sum.weakChapters.length > 0 ? (
          sum.weakChapters.map((w, i) => <WeakRow key={`${w.chapter}-${i}`} w={w} />)
        ) : (
          <Text style={st.emptyHint}>No weak spots flagged yet. Nice!</Text>
        )}
      </View>

      <View style={st.card}>
        <Text style={st.cardHdr}>🕑 RECENT ACTIVITY</Text>
        {Array.isArray(sum.recentActivity) && sum.recentActivity.length > 0 ? (
          sum.recentActivity.map((e, i) => <ActivityRow key={i} e={e} />)
        ) : (
          <Text style={st.emptyHint}>Nothing yet.</Text>
        )}
      </View>
    </>
  );
};

// ─── Shared bits ──────────────────────────────────────────────────────────────
const Loader = ({ text }) => (
  <View style={st.loaderBox}>
    <ActivityIndicator color={C.accent} size="large" />
    <Text style={st.loaderTxt}>{text}</Text>
  </View>
);

const ErrorCard = ({ text, onRetry }) => (
  <View style={st.errCard}>
    <Text style={st.errTxt}>⚠️  {text}</Text>
    {onRetry && <TouchableOpacity onPress={onRetry}><Text style={st.retryTxt}>Try again ›</Text></TouchableOpacity>}
  </View>
);

const Stat = ({ n, l }) => (
  <View style={st.stat}>
    <Text style={st.statNum}>{n}</Text>
    <Text style={st.statLbl}>{l}</Text>
  </View>
);

// Mastery as a 0–100 bar. Red < 40, amber < 70, green otherwise.
const masteryTint = (pct) => (pct < 40 ? C.pink : pct < 70 ? C.orange : C.green);
const MasteryBar = ({ pct }) => {
  const p = Math.max(0, Math.min(100, Math.round(pct || 0)));
  const tint = masteryTint(p);
  return (
    <View style={st.masteryWrap}>
      <View style={st.masteryTrack}><View style={[st.masteryFill, { width: `${p}%`, backgroundColor: tint }]} /></View>
      <Text style={[st.masteryPct, { color: tint }]}>{p}%</Text>
    </View>
  );
};

// One chapter's progress row: name, status, completion bar, weak/strong tag.
const ChapterRow = ({ c }) => {
  const pct = Math.max(0, Math.min(100, c.percent || 0));
  const tint = c.completed ? C.green : c.weak ? C.pink : C.accent;
  const status = c.completed ? 'Completed' : c.inProgress ? 'In progress' : '—';
  return (
    <View style={st.chapterRow}>
      <View style={st.chapterTop}>
        <Text style={st.lineTitle} numberOfLines={1}>{c.chapter}</Text>
        <View style={st.chapterTags}>
          {c.weak && <Text style={[st.chapterTag, { color: C.pink }]}>weak</Text>}
          {c.strong && <Text style={[st.chapterTag, { color: C.green }]}>strong</Text>}
          <Text style={[st.chapterStatus, { color: tint }]}>{status}</Text>
        </View>
      </View>
      <View style={st.masteryWrap}>
        <View style={st.masteryTrack}><View style={[st.masteryFill, { width: `${pct}%`, backgroundColor: tint }]} /></View>
        <Text style={[st.masteryPct, { color: tint }]}>{pct}%</Text>
      </View>
    </View>
  );
};

const ConceptRow = ({ c }) => (
  <View style={st.conceptRow}>
    <View style={{ flex: 1 }}>
      <Text style={st.lineTitle} numberOfLines={1}>{c.concept}</Text>
      <Text style={st.lineMeta} numberOfLines={1}>{[c.chapter, c.subject].filter(Boolean).join(' · ')}</Text>
      <MasteryBar pct={c.masteryPct} />
    </View>
  </View>
);

const WeakRow = ({ w }) => {
  const quiz = w.quizTotal ? `${w.quizCorrect}/${w.quizTotal}` : '—';
  return (
    <View style={st.lineRow}>
      <View style={{ flex: 1 }}>
        <Text style={st.lineTitle} numberOfLines={1}>{w.chapter || w.subject}</Text>
        <Text style={st.lineMeta}>
          {[w.subject, w.mistakes ? `${w.mistakes} mistakes` : null, `quiz ${quiz}`, w.doubts ? `${w.doubts} doubts` : null]
            .filter(Boolean).join(' · ')}
        </Text>
      </View>
      <View style={[st.scorePill, { backgroundColor: 'rgba(242,161,92,0.14)' }]}>
        <Text style={[st.scoreTxt, { color: C.orange }]}>{w.weakness != null ? `⚠ ${w.weakness}` : ''}</Text>
      </View>
    </View>
  );
};

const ACT_ICON = { quiz: '📝', doubt: '❓', mistake: '✗' };
const ActivityRow = ({ e }) => {
  const label = e.type === 'quiz'
    ? (e.correct === true ? 'Answered correctly' : e.correct === false ? 'Got it wrong' : 'Took a quiz')
    : e.type === 'doubt' ? 'Asked a doubt'
    : e.type === 'mistake' ? 'Made a mistake' : e.type;
  return (
    <View style={st.actRow}>
      <Text style={st.actIcon}>{ACT_ICON[e.type] || '•'}</Text>
      <View style={{ flex: 1 }}>
        <Text style={st.actLabel}>{label}</Text>
        <Text style={st.actMeta} numberOfLines={1}>{[e.chapter, e.subject].filter(Boolean).join(' · ') || '—'}</Text>
      </View>
    </View>
  );
};

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.cream },

  // ── gradient header + pill tabs ──
  header: {
    paddingHorizontal: SP.md, paddingTop: SP.sm, paddingBottom: SP.lg,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: 'hidden',
    shadowColor: '#047857', shadowOpacity: 0.3, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 8,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SP.lg },
  hIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.14)', alignItems: 'center', justifyContent: 'center' },
  hIconTxt: { fontSize: 22, fontFamily: F.bold, color: '#fff', marginTop: -3 },
  headerTitle: { fontSize: 16, fontFamily: F.bold, color: '#fff', letterSpacing: 0.2 },

  tabs: { flexDirection: 'row', gap: 4, backgroundColor: 'rgba(0,0,0,0.20)', borderRadius: R.pill, padding: 5 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: R.pill, alignItems: 'center', justifyContent: 'center' },
  tabOn: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  tabTxt: { fontSize: 11.5, fontFamily: F.semi, color: 'rgba(255,255,255,0.85)' },
  tabTxtOn: { color: '#047857', fontFamily: F.bold },

  subjRow: { paddingHorizontal: SP.md, paddingTop: SP.md },
  chip: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: R.pill, borderWidth: 1, borderColor: C.line, backgroundColor: C.board },
  chipOn: { backgroundColor: C.accent, borderColor: C.accent },
  chipTxt: { fontSize: 12.5, fontFamily: F.semi, color: C.ink2 },
  chipTxtOn: { color: '#fff' },

  body: { paddingHorizontal: SP.md, paddingTop: SP.md, paddingBottom: 44, gap: 12 },

  // ── cards ──
  card: { backgroundColor: C.board, borderWidth: 1, borderColor: C.line, borderRadius: R.xl, padding: 18, gap: 4, shadowColor: '#0F172A', shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  cardHdr: { fontSize: 10, fontFamily: F.bold, color: C.dim, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },

  recTagRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  recDriver: { fontSize: 9, fontFamily: F.bold, color: C.accent, letterSpacing: 0.6, textTransform: 'uppercase', backgroundColor: C.accentSoft, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2, overflow: 'hidden' },
  recTagRow2: { fontSize: 10, fontFamily: F.bold, color: C.dim, letterSpacing: 1, marginBottom: 4 },
  recTag: { fontSize: 10.5, fontFamily: F.bold, letterSpacing: 1 },
  recTitle: { fontSize: 20, fontFamily: F.bold, color: C.ink, letterSpacing: -0.4, marginTop: 2 },
  recSub: { fontSize: 12, fontFamily: F.semi, color: C.dim, marginTop: 2 },
  recReason: { fontSize: 13.5, fontFamily: F.med, color: C.ink2, lineHeight: 20, marginTop: 6 },
  recapTxt: { fontSize: 14, fontFamily: F.med, color: C.ink2, lineHeight: 22 },

  qText: { fontSize: 15, fontFamily: F.bold, color: C.ink, lineHeight: 22, marginBottom: 12 },
  input: { backgroundColor: C.cream, borderWidth: 1, borderColor: C.line, borderRadius: R.md, paddingVertical: 12, paddingHorizontal: 14, fontSize: 14.5, fontFamily: F.med, color: C.ink, minHeight: 60, textAlignVertical: 'top' },

  verdictBox: { borderWidth: 1, borderRadius: R.md, padding: 14, backgroundColor: C.cream },
  verdictTag: { fontSize: 13, fontFamily: F.bold, marginBottom: 6 },
  verdictTxt: { fontSize: 14, fontFamily: F.med, color: C.ink2, lineHeight: 21 },

  cta: { backgroundColor: C.ink, borderRadius: R.md, paddingVertical: 15, alignItems: 'center', marginTop: 12, shadowColor: '#0F172A', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 5 },
  ctaTxt: { color: '#fff', fontSize: 15, fontFamily: F.bold, letterSpacing: -0.2 },
  ctaGhost: { borderWidth: 1, borderColor: C.line, borderRadius: R.md, paddingVertical: 14, alignItems: 'center', backgroundColor: C.board },
  ctaGhostTxt: { color: C.ink2, fontSize: 14, fontFamily: F.semi },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },

  // ── stats ──
  statRow: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, backgroundColor: C.board, borderWidth: 1, borderColor: C.line, borderRadius: R.xl, paddingVertical: 18, alignItems: 'center', shadowColor: '#0F172A', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
  statNum: { fontSize: 24, fontFamily: F.black, color: C.accent, letterSpacing: -0.6 },
  statLbl: { fontSize: 9.5, fontFamily: F.bold, color: C.dim, textAlign: 'center', marginTop: 6, lineHeight: 13, letterSpacing: 0.6, textTransform: 'uppercase' },

  conceptRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.line },
  chapterRow: { paddingVertical: 11, borderTopWidth: 1, borderTopColor: C.line },
  chapterTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  chapterTags: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chapterTag: { fontSize: 9.5, fontFamily: F.bold, letterSpacing: 0.4, textTransform: 'uppercase' },
  chapterStatus: { fontSize: 11, fontFamily: F.bold },
  masteryWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  masteryTrack: { flex: 1, height: 8, borderRadius: 6, backgroundColor: C.cream2, overflow: 'hidden' },
  masteryFill: { height: '100%', borderRadius: 6 },
  masteryPct: { fontSize: 11, fontFamily: F.bold, minWidth: 34, textAlign: 'right' },

  lineRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderTopWidth: 1, borderTopColor: C.line },
  lineTitle: { flex: 1, fontSize: 14, fontFamily: F.bold, color: C.ink },
  lineMeta: { fontSize: 11, fontFamily: F.med, color: C.dim, marginTop: 2 },
  scorePill: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4, minWidth: 46, alignItems: 'center' },
  scoreTxt: { fontSize: 12, fontFamily: F.bold },
  emptyHint: { fontSize: 13, fontFamily: F.med, color: C.dim, lineHeight: 19 },

  actRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9, borderTopWidth: 1, borderTopColor: C.line },
  actIcon: { fontSize: 16, width: 22, textAlign: 'center' },
  actLabel: { fontSize: 13.5, fontFamily: F.bold, color: C.ink },
  actMeta: { fontSize: 11, fontFamily: F.med, color: C.dim, marginTop: 1 },

  loaderBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 14 },
  loaderTxt: { fontSize: 13, fontFamily: F.semi, color: C.dim },

  errCard: { backgroundColor: 'rgba(244,63,94,0.08)', borderWidth: 1, borderColor: 'rgba(244,63,94,0.28)', borderRadius: R.lg, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  errTxt: { flex: 1, color: C.pink, fontSize: 13, fontFamily: F.semi },
  retryTxt: { color: C.ink, fontSize: 13, fontFamily: F.bold },
});

export default StudyInsightsScreen;
