import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
  StatusBar, Platform, ActivityIndicator, TextInput,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getStudyPlan, startRevision, getMemorySummary, askAgent, getChapterProgress } from '../api/aiApi';
import { SP, R } from '../components/teacher/premiumTheme';
// Same design system as the rest of the app (and as AITeacherScreen / the live
// classroom): studentTheme tokens, Nunito, lucide. One rule runs through this
// screen — COLOUR LIVES IN GRAPHICS (bars, pills, icons, borders), TEXT STAYS
// INK/SUB/MUTED. A 10px label tinted emerald or orange cannot clear AA on white,
// so the semantic hue is carried by the thing next to the words, not the words.
import { S, shadow, shadowSm } from '../theme/studentTheme';
import { F } from './parent/ParentApp/constants';
import {
  ChevronLeft, Compass, Repeat, ChartNoAxesColumn, BookOpen, Brain, Bandage,
  Dumbbell, Clock, Check, CircleAlert, Minus, Sparkles, RotateCcw, Pencil,
  CircleQuestionMark, X, Flame, Target,
} from 'lucide-react-native';
import { PressableScale } from '../components/teacher/uiKit';
import { InkSurface } from '../theme/studentUI';

const SUBJECTS = ['All', 'Physics', 'Maths', 'Chemistry', 'Biology'];
const TABS = [
  { key: 'next', label: 'What next?', Icon: Compass },
  { key: 'revise', label: 'Revise', Icon: Repeat },
  { key: 'progress', label: 'Progress', Icon: ChartNoAxesColumn },
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
      <StatusBar barStyle="light-content" backgroundColor={S.heroB} />

      {/* ── hero header: back · title · pill tabs. Same InkSurface as the AI Teacher
          hero, so arriving here reads as the same product, not a second one. ── */}
      <View style={st.header}>
        <InkSurface radius={0} />
        {Platform.OS === 'android' && <View style={{ height: 24 }} />}
        <View style={st.headerTop}>
          <PressableScale onPress={onBack} style={st.hIcon} accessibilityLabel="Go back"><ChevronLeft size={20} color="#fff" strokeWidth={2.6} /></PressableScale>
          <Text style={st.headerTitle} accessibilityRole="header">Study Insights</Text>
          <View style={{ width: 38 }} />
        </View>

        <View style={st.tabs}>
          {TABS.map((t) => {
            const on = tab === t.key;
            return (
              <PressableScale key={t.key} style={[st.tab, on && st.tabOn]} onPress={() => setTab(t.key)}
                accessibilityLabel={t.label} accessibilityState={{ selected: on }}>
                <t.Icon size={14} color={on ? S.indigo : 'rgba(255,255,255,0.85)'} strokeWidth={2.4} />
                <Text style={[st.tabTxt, on && st.tabTxtOn]} numberOfLines={1}>{t.label}</Text>
              </PressableScale>
            );
          })}
        </View>
      </View>

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
  revise: { Icon: Repeat,   tag: 'REVISE FIRST', tint: S.orange,  tintBg: S.orangeSoft },
  learn:  { Icon: BookOpen, tag: 'LEARN NEXT',   tint: S.blue,    tintBg: S.blueSoft },
  review: { Icon: Target,   tag: 'KEEP SHARP',   tint: S.emerald, tintBg: S.emeraldSoft },
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
      <View style={[st.card, { borderColor: meta.tint }]}>
        <View style={st.recTagRow}>
          <View style={st.recTagChip}>
            <View style={[st.recTagIcon, { backgroundColor: meta.tintBg }]}>
              <meta.Icon size={13} color={meta.tint} strokeWidth={2.5} />
            </View>
            <Text style={st.recTag}>{meta.tag}</Text>
          </View>
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
          <CardHdr Icon={Brain}>CONCEPTS TO STRENGTHEN</CardHdr>
          {plan.weakConcepts.slice(0, 6).map((c, i) => (
            <ConceptRow key={`${c.concept}-${i}`} c={c} />
          ))}
        </View>
      )}

      {Array.isArray(plan.weakChapters) && plan.weakChapters.length > 0 && (
        <View style={st.card}>
          <CardHdr Icon={Bandage}>WEAKEST CHAPTERS</CardHdr>
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
          <Sparkles size={17} color="#fff" strokeWidth={2.4} />
          <Text style={st.ctaTxt}>Start revision</Text>
        </TouchableOpacity>
      </>
    );
  }

  // The verdict's hue lives on the icon and the box border; the words stay ink.
  const V = {
    correct: { Icon: Check, tint: S.emerald, label: 'Correct' },
    error: { Icon: CircleAlert, tint: S.red, label: 'Error' },
    partial: { Icon: Minus, tint: S.orange, label: 'Almost' },
  };
  const verdict = graded ? (V[graded.verdict] || V.partial) : V.partial;

  return (
    <>
      <View style={st.card}>
        <CardHdr Icon={Target}>FOCUS</CardHdr>
        <Text style={st.recTitle}>{rev.focus?.concept || rev.focus?.chapter || rev.focus?.subject || 'Revision'}</Text>
        {!!rev.focus?.concept && !!rev.focus?.chapter && <Text style={st.recSub}>{rev.focus.chapter} · {rev.focus.subject}</Text>}
        {typeof rev.focus?.masteryPct === 'number' && <MasteryBar pct={rev.focus.masteryPct} />}
        {!!rev.focus?.reason && <Text style={st.recReason}>{rev.focus.reason}</Text>}
      </View>

      <View style={st.card}>
        <CardHdr Icon={BookOpen}>QUICK RECAP</CardHdr>
        <Text style={st.recapTxt}>{rev.recap || rev.answer}</Text>
      </View>

      {rev.pending?.question && (
        <View style={st.card}>
          <CardHdr Icon={Target}>QUICK CHECK</CardHdr>
          <Text style={st.qText}>{rev.pending.question}</Text>

          {!graded ? (
            <>
              <TextInput
                style={st.input}
                placeholder="Type your answer…"
                placeholderTextColor={S.faint}
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
            <View style={[st.verdictBox, { borderColor: verdict.tint }]}>
              <View style={st.verdictTagRow}>
                <verdict.Icon size={15} color={verdict.tint} strokeWidth={2.8} />
                <Text style={st.verdictTag}>{verdict.label}</Text>
              </View>
              <Text style={st.verdictTxt}>{graded.feedback}</Text>
            </View>
          )}
        </View>
      )}

      <TouchableOpacity style={st.ctaGhost} onPress={run} activeOpacity={0.9}>
        <RotateCcw size={15} color={S.sub} strokeWidth={2.4} />
        <Text style={st.ctaGhostTxt}>Revise another topic</Text>
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
        <Stat n={String(streak)} l={'Day\nstreak'} Icon={Flame} tint={S.orange} />
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
          <CardHdr Icon={BookOpen}>CHAPTER PROGRESS</CardHdr>
          {chapters.slice(0, 12).map((c, i) => (
            <ChapterRow key={`${c.chapter}-${i}`} c={c} />
          ))}
        </View>
      )}

      <View style={st.card}>
        <CardHdr Icon={Dumbbell}>STRONG CHAPTERS</CardHdr>
        {Array.isArray(sum.strongChapters) && sum.strongChapters.length > 0 ? (
          sum.strongChapters.map((c, i) => (
            <View key={`${c.chapter}-${i}`} style={st.lineRow}>
              <Text style={st.lineTitle} numberOfLines={1}>{c.chapter || c.subject}</Text>
              <View style={[st.scorePill, { backgroundColor: S.emeraldSoft }]}>
                <Text style={st.scoreTxt}>{c.accuracy != null ? `${Math.round(c.accuracy * 100)}%` : '—'}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={st.emptyHint}>Keep taking quizzes to build strong chapters (80%+ accuracy).</Text>
        )}
      </View>

      <View style={st.card}>
        <CardHdr Icon={Bandage}>WEAK CHAPTERS</CardHdr>
        {Array.isArray(sum.weakChapters) && sum.weakChapters.length > 0 ? (
          sum.weakChapters.map((w, i) => <WeakRow key={`${w.chapter}-${i}`} w={w} />)
        ) : (
          <Text style={st.emptyHint}>No weak spots flagged yet. Nice!</Text>
        )}
      </View>

      <View style={st.card}>
        <CardHdr Icon={Clock}>RECENT ACTIVITY</CardHdr>
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
// Card header: a small lucide glyph + the label. Replaces the emoji that used to be
// baked into the header strings, so glyph size/weight/colour are actually controlled.
const CardHdr = ({ Icon, children }) => (
  <View style={st.cardHdrRow}>
    <Icon size={13} color={S.muted} strokeWidth={2.4} />
    <Text style={st.cardHdr}>{children}</Text>
  </View>
);

const Loader = ({ text }) => (
  <View style={st.loaderBox}>
    <ActivityIndicator color={S.indigo} size="large" />
    <Text style={st.loaderTxt}>{text}</Text>
  </View>
);

const ErrorCard = ({ text, onRetry }) => (
  <View style={st.errCard}>
    <CircleAlert size={17} color={S.red} strokeWidth={2.4} />
    <Text style={st.errTxt}>{text}</Text>
    {onRetry && <TouchableOpacity onPress={onRetry}><Text style={st.retryTxt}>Try again</Text></TouchableOpacity>}
  </View>
);

const Stat = ({ n, l, Icon, tint }) => (
  <View style={st.stat}>
    <View style={st.statNumRow}>
      {!!Icon && <Icon size={17} color={tint || S.indigo} strokeWidth={2.5} />}
      <Text style={st.statNum}>{n}</Text>
    </View>
    <Text style={st.statLbl}>{l}</Text>
  </View>
);

// Mastery as a 0–100 bar. Red < 40, amber < 70, green otherwise. The hue is on the
// BAR only — the percentage keeps S.sub, because S.emerald/S.orange at 11px would
// not clear AA on a white card.
const masteryTint = (pct) => (pct < 40 ? S.red : pct < 70 ? S.orange : S.emerald);
const MasteryBar = ({ pct }) => {
  const p = Math.max(0, Math.min(100, Math.round(pct || 0)));
  return (
    <View style={st.masteryWrap}>
      <View style={st.masteryTrack}><View style={[st.masteryFill, { width: `${p}%`, backgroundColor: masteryTint(p) }]} /></View>
      <Text style={st.masteryPct}>{p}%</Text>
    </View>
  );
};

// One chapter's progress row: name, status, completion bar, weak/strong tag.
const ChapterRow = ({ c }) => {
  const pct = Math.max(0, Math.min(100, c.percent || 0));
  const tint = c.completed ? S.emerald : c.weak ? S.red : S.indigo;
  const status = c.completed ? 'Completed' : c.inProgress ? 'In progress' : '—';
  return (
    <View style={st.chapterRow}>
      <View style={st.chapterTop}>
        <Text style={st.lineTitle} numberOfLines={1}>{c.chapter}</Text>
        <View style={st.chapterTags}>
          {/* weak / strong as tinted pills rather than tinted words — the fill can
              carry the hue at any contrast, the label cannot. */}
          {c.weak && <View style={[st.tagPill, { backgroundColor: S.redSoft }]}><Text style={st.tagPillTxt}>weak</Text></View>}
          {c.strong && <View style={[st.tagPill, { backgroundColor: S.emeraldSoft }]}><Text style={st.tagPillTxt}>strong</Text></View>}
          <Text style={st.chapterStatus}>{status}</Text>
        </View>
      </View>
      <View style={st.masteryWrap}>
        <View style={st.masteryTrack}><View style={[st.masteryFill, { width: `${pct}%`, backgroundColor: tint }]} /></View>
        <Text style={st.masteryPct}>{pct}%</Text>
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
      {w.weakness != null && (
        <View style={[st.scorePill, { backgroundColor: S.orangeSoft }]}>
          <Text style={st.scoreTxt}>{w.weakness}</Text>
        </View>
      )}
    </View>
  );
};

const ACT_META = {
  quiz: { Icon: Pencil, tint: S.blue, tintBg: S.blueSoft },
  doubt: { Icon: CircleQuestionMark, tint: S.purple, tintBg: S.purpleSoft },
  mistake: { Icon: X, tint: S.red, tintBg: S.redSoft },
};
const ActivityRow = ({ e }) => {
  const label = e.type === 'quiz'
    ? (e.correct === true ? 'Answered correctly' : e.correct === false ? 'Got it wrong' : 'Took a quiz')
    : e.type === 'doubt' ? 'Asked a doubt'
    : e.type === 'mistake' ? 'Made a mistake' : e.type;
  const m = ACT_META[e.type] || { Icon: Minus, tint: S.muted, tintBg: S.hair };
  return (
    <View style={st.actRow}>
      <View style={[st.actIcon, { backgroundColor: m.tintBg }]}><m.Icon size={14} color={m.tint} strokeWidth={2.5} /></View>
      <View style={{ flex: 1 }}>
        <Text style={st.actLabel}>{label}</Text>
        <Text style={st.actMeta} numberOfLines={1}>{[e.chapter, e.subject].filter(Boolean).join(' · ') || '—'}</Text>
      </View>
    </View>
  );
};

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: S.canvas },

  // ── hero header + pill tabs (InkSurface paints the deep indigo behind it) ──
  header: {
    paddingHorizontal: SP.md, paddingTop: SP.sm, paddingBottom: SP.lg,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: 'hidden',
    backgroundColor: S.heroB, ...shadow,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SP.lg },
  hIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontFamily: F.xbold, color: '#fff', letterSpacing: 0.2 },

  tabs: { flexDirection: 'row', gap: 4, backgroundColor: 'rgba(0,0,0,0.24)', borderRadius: R.pill, padding: 5 },
  tab: { flex: 1, flexDirection: 'row', gap: 5, paddingVertical: 9, borderRadius: R.pill, alignItems: 'center', justifyContent: 'center' },
  tabOn: { backgroundColor: '#fff', ...shadowSm },
  tabTxt: { fontSize: 11.5, fontFamily: F.bold, color: 'rgba(255,255,255,0.85)' },
  tabTxtOn: { color: S.indigo, fontFamily: F.xbold },

  subjRow: { paddingHorizontal: SP.md, paddingTop: SP.md },
  chip: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: R.pill, borderWidth: 1, borderColor: S.border, backgroundColor: S.card },
  chipOn: { backgroundColor: S.indigo, borderColor: S.indigo },
  chipTxt: { fontSize: 12.5, fontFamily: F.bold, color: S.sub },
  chipTxtOn: { color: '#fff' },

  body: { paddingHorizontal: SP.md, paddingTop: SP.md, paddingBottom: 44, gap: 12 },

  // ── cards ──
  card: { backgroundColor: S.card, borderWidth: 1, borderColor: S.hair, borderRadius: R.xl, padding: 18, gap: 4, ...shadowSm },
  cardHdrRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 },
  cardHdr: { fontSize: 10, fontFamily: F.xbold, color: S.muted, letterSpacing: 1, textTransform: 'uppercase' },

  recTagRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  recTagChip: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  recTagIcon: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  recTag: { fontSize: 10.5, fontFamily: F.xbold, color: S.sub, letterSpacing: 1 },
  recDriver: { fontSize: 9, fontFamily: F.xbold, color: S.indigo, letterSpacing: 0.6, textTransform: 'uppercase', backgroundColor: S.indigoSoft, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2, overflow: 'hidden' },
  recTitle: { fontSize: 20, fontFamily: F.black, color: S.ink, letterSpacing: -0.4, marginTop: 2 },
  recSub: { fontSize: 12, fontFamily: F.bold, color: S.muted, marginTop: 2 },
  recReason: { fontSize: 13.5, fontFamily: F.med, color: S.sub, lineHeight: 20, marginTop: 6 },
  recapTxt: { fontSize: 14, fontFamily: F.med, color: S.sub, lineHeight: 22 },

  qText: { fontSize: 15, fontFamily: F.xbold, color: S.ink, lineHeight: 22, marginBottom: 12 },
  input: { backgroundColor: S.canvas, borderWidth: 1, borderColor: S.border, borderRadius: R.md, paddingVertical: 12, paddingHorizontal: 14, fontSize: 14.5, fontFamily: F.med, color: S.ink, minHeight: 60, textAlignVertical: 'top' },

  verdictBox: { borderWidth: 1, borderRadius: R.md, padding: 14, backgroundColor: S.canvas },
  verdictTagRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  verdictTag: { fontSize: 13, fontFamily: F.xbold, color: S.ink },
  verdictTxt: { fontSize: 14, fontFamily: F.med, color: S.sub, lineHeight: 21 },

  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: S.indigo, borderRadius: R.md, paddingVertical: 15, marginTop: 12, ...shadowSm },
  ctaTxt: { color: '#fff', fontSize: 15, fontFamily: F.bold, letterSpacing: -0.2 },
  ctaGhost: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: S.border, borderRadius: R.md, paddingVertical: 14, backgroundColor: S.card },
  ctaGhostTxt: { color: S.sub, fontSize: 14, fontFamily: F.bold },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },

  // ── stats ──
  statRow: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, backgroundColor: S.card, borderWidth: 1, borderColor: S.hair, borderRadius: R.xl, paddingVertical: 18, alignItems: 'center', ...shadowSm },
  statNumRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statNum: { fontSize: 24, fontFamily: F.black, color: S.ink, letterSpacing: -0.6 },
  statLbl: { fontSize: 9.5, fontFamily: F.xbold, color: S.muted, textAlign: 'center', marginTop: 6, lineHeight: 13, letterSpacing: 0.6, textTransform: 'uppercase' },

  conceptRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: S.hair },
  chapterRow: { paddingVertical: 11, borderTopWidth: 1, borderTopColor: S.hair },
  chapterTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  chapterTags: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tagPill: { borderRadius: 7, paddingHorizontal: 7, paddingVertical: 2 },
  tagPillTxt: { fontSize: 9.5, fontFamily: F.xbold, color: S.sub, letterSpacing: 0.4, textTransform: 'uppercase' },
  chapterStatus: { fontSize: 11, fontFamily: F.bold, color: S.muted },
  masteryWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  masteryTrack: { flex: 1, height: 8, borderRadius: 6, backgroundColor: S.hair, overflow: 'hidden' },
  masteryFill: { height: '100%', borderRadius: 6 },
  masteryPct: { fontSize: 11, fontFamily: F.xbold, color: S.sub, minWidth: 34, textAlign: 'right' },

  lineRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderTopWidth: 1, borderTopColor: S.hair },
  lineTitle: { flex: 1, fontSize: 14, fontFamily: F.xbold, color: S.ink },
  lineMeta: { fontSize: 11, fontFamily: F.med, color: S.muted, marginTop: 2 },
  scorePill: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4, minWidth: 46, alignItems: 'center' },
  scoreTxt: { fontSize: 12, fontFamily: F.xbold, color: S.sub },
  emptyHint: { fontSize: 13, fontFamily: F.med, color: S.muted, lineHeight: 19 },

  actRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9, borderTopWidth: 1, borderTopColor: S.hair },
  actIcon: { width: 26, height: 26, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  actLabel: { fontSize: 13.5, fontFamily: F.xbold, color: S.ink },
  actMeta: { fontSize: 11, fontFamily: F.med, color: S.muted, marginTop: 1 },

  loaderBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 14 },
  loaderTxt: { fontSize: 13, fontFamily: F.bold, color: S.muted },

  errCard: { backgroundColor: S.redSoft, borderWidth: 1, borderColor: S.red, borderRadius: R.lg, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  errTxt: { flex: 1, color: S.ink, fontSize: 13, fontFamily: F.semi },
  retryTxt: { color: S.ink, fontSize: 13, fontFamily: F.xbold },
});

export default StudyInsightsScreen;
