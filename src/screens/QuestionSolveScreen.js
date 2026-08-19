// src/screens/QuestionSolveScreen.js
// One question at a time, with its options and worked explanation — where
// ChapterPracticeScreen's "Solve Question" and its rows land.
//
// Fetches the same GET /api/resources/progress/... payload the chapter screen uses,
// so the question, its options, its solution and this student's status all come from
// one place, and starts on whichever question was tapped.
//
// The design shows the ANSWERED state (correct option green, explanation open). It
// is reached by answering: options stay neutral until the student picks, then the key
// turns green, a wrong pick turns red, and the explanation opens. Revealing the answer
// on arrival would turn a practice question into a page of notes. A question with no
// options (most Important Questions are written Q&A) has nothing to pick, so its
// solution shows straight away.
//
// Advancing marks the question solved — that is what fills the chapter ring.
//
// Props: subject, chapter -> { name, slug }; sectionType; classLevel;
//        startQuestionId; onBack()
import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, StatusBar, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ArrowRight, Check, Lightbulb, Bookmark, Info } from 'lucide-react-native';
import { TT, TTF, Rich } from '../components/timedTestDark';
import { getChapterQuestionProgress, setQuestionProgress, setQuestionBookmark } from '../api/resourcesApi';

const C = {
  // Spreads TT (light). The locals below were picked against the old dark canvas —
  // C.panel in particular was a near-black card, i.e. invisible content on white.
  ...TT,
  amber: '#FFC629',
  green: '#0E9F6E',
  greenFill: '#D6F5E7',
  greenEdge: '#0E9F6E',
  slate: '#666666',
  wrong: '#E5484D',
  wrongFill: '#FDECEA',
  panel: '#F7F7F8',
};

// A "given" block — the configuration/formula a question is built on — is stored
// inside question_html as a leading <pre>/<code>/<blockquote>, because there is no
// separate column for it. Lifting it out lets it sit in its own card the way the
// design shows. Nothing is invented: a question without one renders as before.
const STEM_RE = /^\s*(?:<p[^>]*>\s*)?<(pre|code|blockquote)[^>]*>([\s\S]*?)<\/\1>\s*(?:<\/p>)?/i;
function splitStem(html) {
  const raw = String(html || '');
  const m = raw.match(STEM_RE);
  if (!m) return { stem: null, body: raw };
  const stem = m[2].replace(/<[^>]*>/g, '').trim();
  return stem ? { stem, body: raw.slice(m[0].length) } : { stem: null, body: raw };
}

// Solutions that were written as an ordered list become numbered steps; anything
// else stays one block. A step's leading "<b>Title</b>" becomes its heading.
const LI_RE = /<li[^>]*>([\s\S]*?)<\/li>/gi;
function splitSteps(html) {
  const raw = String(html || '');
  if (!/<ol[\s>]/i.test(raw)) return null;
  const out = [];
  let m;
  while ((m = LI_RE.exec(raw)) !== null) {
    const item = m[1];
    const head = item.match(/<(?:b|strong)[^>]*>([\s\S]*?)<\/(?:b|strong)>/i);
    const title = head ? head[1].replace(/<[^>]*>/g, '').trim() : null;
    const rest = head ? item.slice(item.indexOf(head[0]) + head[0].length) : item;
    out.push({ title, body: rest });
  }
  return out.length ? out : null;
}

export default function QuestionSolveScreen({
  subject = {}, chapter = {},
  sectionType = 'important_questions',
  classLevel,
  startQuestionId,
  onBack = () => {},
}) {
  const insets = useSafeAreaInsets();
  const [questions, setQuestions] = useState(null); // null = loading
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);       // option idx letter
  const [hintFor, setHintFor] = useState(null);     // option idx whose hint is open

  useEffect(() => {
    let alive = true;
    getChapterQuestionProgress(subject.slug, chapter.slug, sectionType, classLevel)
      .then((d) => {
        if (!alive) return;
        const qs = (d && d.questions) || [];
        setQuestions(qs);
        const at = startQuestionId != null ? qs.findIndex((q) => String(q.id) === String(startQuestionId)) : 0;
        setIdx(at >= 0 ? at : 0);
      })
      .catch(() => { if (alive) setQuestions([]); });
    return () => { alive = false; };
  }, [subject.slug, chapter.slug, sectionType, classLevel, startQuestionId]);

  const q = questions && questions[idx];
  // Options arrive as [{ idx:'A', html, is_correct }] — the shape the importer stores.
  const options = useMemo(() => (Array.isArray(q && q.options) ? q.options : []), [q]);
  const correctKey = q ? (q.correctOption || (options.find((o) => o.is_correct) || {}).idx || null) : null;
  // Two-up only while every label is short ("Na⁺", "K⁺"); a phrase like
  // "Period 4, group 6" needs the full width to stay on one line.
  const twoUp = options.length === 4
    && options.every((o) => String(o.html || '').replace(/<[^>]*>/g, '').trim().length <= 14);
  const answered = picked != null || options.length === 0;

  const advance = async () => {
    if (!q) return;
    // Best-effort: a failed write must not block the student from moving on.
    setQuestionProgress(q.id, 'solved').catch(() => {});
    setQuestions((qs) => (qs || []).map((x) => (x.id === q.id ? { ...x, status: 'solved' } : x)));
    setPicked(null);
    setIdx((i) => Math.min(i + 1, (questions || []).length - 1));
  };

  // Optimistic, then persist. A bookmark that survived a failed write would claim a
  // question is saved when the server never heard about it.
  const toggleBookmark = async () => {
    if (!q) return;
    const next = !q.bookmarked;
    setQuestions((qs) => (qs || []).map((x) => (x.id === q.id ? { ...x, bookmarked: next } : x)));
    try {
      await setQuestionBookmark(q.id, next);
    } catch (_) {
      setQuestions((qs) => (qs || []).map((x) => (x.id === q.id ? { ...x, bookmarked: !next } : x)));
    }
  };

  const isLast = questions && idx >= questions.length - 1;

  return (
    <View style={st.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.canvas} />
      <View style={{ height: insets.top }} />

      <View style={st.topRow}>
        <Pressable style={st.back} onPress={onBack} hitSlop={10} accessibilityRole="button">
          <ChevronLeft size={22} color={C.ink} strokeWidth={2.6} />
          <Text style={st.backLbl}>Back to List</Text>
        </Pressable>
        {!!q && (
          <Pressable
            onPress={toggleBookmark}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityState={{ selected: !!q.bookmarked }}
            accessibilityLabel={q.bookmarked ? 'Remove bookmark' : 'Bookmark this question'}
          >
            <Bookmark
              size={24}
              color={q.bookmarked ? '#8A6A00' : C.sub}
              fill={q.bookmarked ? '#8A6A00' : 'none'}
              strokeWidth={2}
            />
          </Pressable>
        )}
      </View>

      {questions === null ? (
        <View style={st.loading}><ActivityIndicator color={C.ink} /></View>
      ) : !q ? (
        <Text style={st.empty}>No questions in this chapter yet.</Text>
      ) : (
        <>
          <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
            {/* Question */}
            <View style={st.qCard}>
              <View style={st.qTop}>
                <View style={st.chip}>
                  <Text style={st.chipTxt}>
                    {options.length ? 'MCQ' : (q.questionType || 'Q&A')}
                    {q.qNumber ? ` · ${String(q.qNumber).replace(/^Q/i, 'Q')}` : ''}
                  </Text>
                </View>
                <Text style={st.chapterTxt} numberOfLines={1}>{chapter.name || subject.name || ''}</Text>
              </View>
              {(() => {
                const { stem, body } = splitStem(q.questionHtml);
                return (
                  <>
                    {!!stem && (
                      <View style={st.stemCard}>
                        <Text style={st.stemLbl}>{(q.questionType || 'GIVEN').toUpperCase()}</Text>
                        <Text style={st.stemTxt}>{stem}</Text>
                      </View>
                    )}
                    <View style={{ marginTop: 16 }}>
                      <Rich value={body} fontSize={21} lineHeight={29} color={C.ink} family={TTF.head} imgHeight={180} />
                    </View>
                  </>
                );
              })()}
              {q.marks != null && (
                <Text style={st.marks}>{q.marks} Mark{q.marks === 1 ? '' : 's'}</Text>
              )}
            </View>

            {/* Options */}
            {options.length > 0 && (
              <View style={st.opts}>
                {options.map((o) => {
                  const isKey = correctKey && String(o.idx) === String(correctKey);
                  const isPick = picked != null && String(o.idx) === String(picked);
                  const show = picked != null;
                  const tone = show && isKey ? 'right' : show && isPick ? 'wrong' : 'rest';
                  return (
                    <Pressable
                      key={o.idx}
                      disabled={picked != null}
                      onPress={() => setPicked(o.idx)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isPick, disabled: picked != null }}
                      accessibilityLabel={`Option ${o.idx}`}
                      style={[
                        st.opt,
                        twoUp ? st.optHalf : st.optFull,
                        tone === 'right' && st.optRight,
                        tone === 'wrong' && st.optWrong,
                      ]}
                    >
                      <View style={[
                        st.letter,
                        tone === 'right' && { backgroundColor: C.green },
                        tone === 'wrong' && { backgroundColor: C.wrong },
                      ]}>
                        <Text style={[st.letterTxt, tone !== 'rest' && { color: '#FFFFFF' }]}>{o.idx}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Rich
                          value={o.html}
                          fontSize={17}
                          lineHeight={23}
                          color={tone === 'right' ? '#0B3B2C' : C.ink}
                          family={TTF.bold}
                          imgHeight={80}
                        />
                      </View>
                      {/* Hint affordance — only on options the importer gave one.
                          The design says "swipe left"; a tap target is discoverable
                          and reachable, and does the same job. */}
                      {!!o.hint && (
                        <Pressable
                          onPress={() => setHintFor(hintFor === o.idx ? null : o.idx)}
                          hitSlop={10}
                          accessibilityRole="button"
                          accessibilityLabel={`Hint for option ${o.idx}`}
                        >
                          <Info size={20} color={tone === 'right' ? C.green : C.sub} strokeWidth={2.2} />
                        </Pressable>
                      )}
                      {tone === 'right' && <Check size={22} color={C.green} strokeWidth={3} />}
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* The open hint, and the line that says hints exist — both suppressed
                entirely when no option carries one, so the screen never advertises
                a feature this chapter has no data for. */}
            {options.some((o) => !!o.hint) && (
              <View style={st.hintWrap}>
                {hintFor
                  ? <Text style={st.hintTxt}>{String(options.find((o) => o.idx === hintFor)?.hint || '')}</Text>
                  : <Text style={st.hintCue}>Tap the ⓘ on an option to reveal its hint</Text>}
              </View>
            )}

            {/* Explanation — after the pick, or straight away when there is nothing
                to pick. Hidden entirely when the chapter shipped no solution. */}
            {answered && !!q.solutionHtml && (
              <View style={st.panel}>
                <View style={st.grab} />
                <View style={st.panelHead}>
                  <Lightbulb size={20} color={C.ink} strokeWidth={2.2} />
                  <Text style={st.panelTitle}>{splitSteps(q.solutionHtml) ? 'MATHEMATICAL PROOF' : 'EXPLANATION'}</Text>
                </View>
                {splitSteps(q.solutionHtml)
                  ? splitSteps(q.solutionHtml).map((s, i) => (
                    <View key={i} style={st.step}>
                      <View style={st.stepNum}><Text style={st.stepNumTxt}>{i + 1}</Text></View>
                      <View style={{ flex: 1 }}>
                        {!!s.title && <Text style={st.stepTitle}>{s.title}</Text>}
                        <Rich value={s.body} fontSize={16} lineHeight={24} color={C.sub} family={TTF.reg} imgHeight={160} />
                      </View>
                    </View>
                  ))
                  : <Rich value={q.solutionHtml} fontSize={17} lineHeight={26} color={C.sub} family={TTF.reg} imgHeight={200} />}
              </View>
            )}

            {answered && !q.solutionHtml && (
              <Text style={st.noSol}>No explanation was published for this question.</Text>
            )}
          </ScrollView>

          <View style={[st.foot, { paddingBottom: insets.bottom + 16 }]}>
            <Pressable
              style={[st.nextBtn, !answered && st.nextOff]}
              disabled={!answered}
              onPress={isLast ? onBack : advance}
              accessibilityRole="button"
            >
              <Text style={st.nextLbl}>{isLast ? 'Finish' : 'Next Question'}</Text>
              <ArrowRight size={20} color={C.ink} strokeWidth={2.6} />
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.canvas },

  back: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 16 },
  backLbl: { fontSize: 19, lineHeight: 24, fontFamily: TTF.semi, color: C.ink },

  loading: { paddingVertical: 60, alignItems: 'center' },
  empty: { textAlign: 'center', fontSize: 15, fontFamily: TTF.reg, color: C.sub, marginTop: 48 },

  qCard: {
    marginHorizontal: 18, padding: 20, borderRadius: 20,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.hair,
  },
  qTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  chip: { backgroundColor: '#FFF4CC', borderRadius: 10, paddingVertical: 7, paddingHorizontal: 12 },
  chipTxt: { fontSize: 13, lineHeight: 16, fontFamily: TTF.bold, color: '#8A6A00', letterSpacing: 0.6 },
  chapterTxt: { flexShrink: 1, fontSize: 15, lineHeight: 20, fontFamily: TTF.semi, color: C.sub, letterSpacing: 0.4 },
  marks: { fontSize: 14, lineHeight: 20, fontFamily: TTF.semi, color: '#8A6A00', marginTop: 12 },

  stemCard: {
    marginTop: 16, padding: 16, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: C.hair,
  },
  stemLbl: { fontSize: 13, lineHeight: 17, fontFamily: TTF.semi, color: C.sub, letterSpacing: 1.6 },
  stemTxt: { fontSize: 21, lineHeight: 30, fontFamily: TTF.bold, color: C.ink, marginTop: 10, letterSpacing: 0.5 },

  step: { flexDirection: 'row', gap: 14, marginBottom: 18 },
  stepNum: {
    width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: C.hair,
    alignItems: 'center', justifyContent: 'center',
  },
  stepNumTxt: { fontSize: 14, lineHeight: 18, fontFamily: TTF.semi, color: C.ink },
  stepTitle: { fontSize: 16, lineHeight: 22, fontFamily: TTF.bold, color: C.ink, marginBottom: 4 },

  opts: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 18, marginTop: 18 },
  hintWrap: { paddingHorizontal: 18, marginTop: 14 },
  hintCue: { fontSize: 14, lineHeight: 20, fontFamily: TTF.reg, color: C.dim, textAlign: 'center' },
  hintTxt: {
    fontSize: 15, lineHeight: 22, fontFamily: TTF.reg, color: C.sub,
    backgroundColor: 'rgba(245,194,76,0.10)', borderRadius: 12, padding: 14,
  },
  opt: {
    minHeight: 78,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 16, borderWidth: 2, borderColor: 'transparent',
    backgroundColor: C.slate, paddingHorizontal: 14, paddingVertical: 16,
  },
  optHalf: { width: '48%', flexGrow: 1, minHeight: 88 },
  optFull: { width: '100%' },
  optRight: { backgroundColor: C.greenFill, borderColor: C.greenEdge },
  optWrong: { backgroundColor: C.wrongFill, borderColor: C.wrong },
  letter: {
    width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  letterTxt: { fontSize: 15, lineHeight: 19, fontFamily: TTF.bold, color: 'rgba(255,255,255,0.75)' },

  panel: {
    marginTop: 24, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24,
    borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: C.panel,
  },
  grab: { width: 46, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.16)', alignSelf: 'center' },
  panelHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18, marginBottom: 16 },
  panelTitle: { fontSize: 17, lineHeight: 22, fontFamily: TTF.bold, color: C.ink, letterSpacing: 1 },
  noSol: { textAlign: 'center', fontSize: 14, fontFamily: TTF.reg, color: C.dim, marginTop: 28, paddingHorizontal: 24 },

  foot: { paddingHorizontal: 18, paddingTop: 10, alignItems: 'flex-end' },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    height: 60, borderRadius: 30, paddingHorizontal: 28, backgroundColor: C.violet,
  },
  nextOff: { opacity: 0.4 },
  nextLbl: { fontSize: 17, lineHeight: 22, fontFamily: TTF.bold, color: C.ink },
});



