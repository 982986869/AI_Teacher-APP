// src/screens/MyBooksScreen.js
// "For You" — books an admin uploaded and published for this student's class, and
// the four kinds of content generated from each chapter.
//
//   Notes      summary, sections, key terms — read
//   Resources  formulae, diagrams, definitions — reference cards
//   Practice   written questions, answer revealed on tap
//   Quiz       multiple choice, auto-graded, scored
//
// Read-only by construction: the API has no student write endpoint, so there is
// nothing here to upload or edit. What appears is entirely an admin's decision —
// each section is published individually, and the book carries its own switch.
//
// Opens full-screen from Home the way Activities and the AI Teacher do: inside the
// tab, no route, so it inherits the dock's paid gate without wiring of its own.
// Motion follows ActivitiesScreen — Animated only, since LayoutAnimation is a no-op
// under the New Architecture.
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, Pressable, StyleSheet, StatusBar, ScrollView,
  ActivityIndicator, Dimensions, Animated, Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft, BookOpen, NotebookPen, ListChecks, PencilRuler, Library,
  Check, X, RotateCcw, Sparkles,
} from 'lucide-react-native';

import { useAuth } from '../context/AuthContext';
import { DAY, DFONT as F } from '../theme/dayTheme';
import { getBooks, getBookChapters, getBookContent } from '../api/booksApi';
import { reportWarn } from '../utils/errorLog';

const { width: W } = Dimensions.get('window');
const PAD = 16;

const T = ({ w = 'reg', s = 14, c = DAY.ink, style, children, ...rest }) => (
  <Text {...rest} style={[{ fontFamily: F[w] || F.reg, fontSize: s, color: c }, style]}>{children}</Text>
);

// The four sub-sections, in the order a student uses them: read, reference, then test.
const SECTIONS = [
  { kind: 'notes',    label: 'Notes',     Icon: NotebookPen, tint: DAY.violetSoft, color: DAY.violet, blurb: 'Summary and key terms' },
  { kind: 'resource', label: 'Resources', Icon: Library,     tint: DAY.greenSoft,  color: DAY.green,  blurb: 'Formulae and definitions' },
  { kind: 'practice', label: 'Practice',  Icon: PencilRuler, tint: DAY.blueSoft,   color: DAY.blue,   blurb: 'Questions with answers' },
  { kind: 'quiz',     label: 'Quiz',      Icon: ListChecks,  tint: DAY.amberSoft,  color: DAY.amber,  blurb: 'Multiple choice, scored' },
];
const sectionFor = (kind) => SECTIONS.find((s) => s.kind === kind) || SECTIONS[0];

// ─── Motion ──────────────────────────────────────────────────────────────────

function Appear({ delay = 0, y = 14, style, children }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 360, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [v, delay]);
  return (
    <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [y, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

function Squeeze({ onPress, disabled, style, children, to = 0.97, ...rest }) {
  const s = useRef(new Animated.Value(1)).current;
  const go = (v) => Animated.spring(s, { toValue: v, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  return (
    <Pressable onPress={onPress} disabled={disabled} onPressIn={() => !disabled && go(to)} onPressOut={() => go(1)} {...rest}>
      <Animated.View style={[style, { transform: [{ scale: s }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

function useShake() {
  const v = useRef(new Animated.Value(0)).current;
  const shake = useCallback(() => {
    v.setValue(0);
    Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 55, useNativeDriver: true }),
      Animated.timing(v, { toValue: -1, duration: 55, useNativeDriver: true }),
      Animated.timing(v, { toValue: 0.6, duration: 55, useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration: 55, useNativeDriver: true }),
    ]).start();
  }, [v]);
  return [{ transform: [{ translateX: v.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] }) }] }, shake];
}

// ─── Chrome ──────────────────────────────────────────────────────────────────

function Header({ onBack, kicker, title, sub }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[st.header, { paddingTop: insets.top + 8 }]}>
      <Squeeze onPress={onBack} hitSlop={12} style={st.backBtn} accessibilityRole="button" accessibilityLabel="Back">
        <ChevronLeft size={22} color={DAY.inkSoft} />
      </Squeeze>
      <Appear delay={40} y={6} style={{ flex: 1, paddingTop: 4 }}>
        {!!kicker && <T w="bold" s={10} c={DAY.inkSoft} style={st.kicker}>{String(kicker).toUpperCase()}</T>}
        <T w="xbold" s={20} c={DAY.ink} style={{ marginTop: 2 }} numberOfLines={2}>{title}</T>
        {!!sub && <T w="reg" s={13} c={DAY.inkSoft} style={{ marginTop: 3 }}>{sub}</T>}
      </Appear>
    </View>
  );
}

const Centered = ({ children }) => <View style={st.centered}>{children}</View>;
const Card = ({ style, children }) => <View style={[st.card, style]}>{children}</View>;

// ─── 1 · The shelf ───────────────────────────────────────────────────────────

function Shelf({ classLevel, onPick, onBack }) {
  const [state, setState] = useState({ loading: true, books: [] });
  useEffect(() => {
    let alive = true;
    getBooks(classLevel).then((books) => alive && setState({ loading: false, books }));
    return () => { alive = false; };
  }, [classLevel]);

  return (
    <View style={st.root}>
      <Header onBack={onBack} kicker={classLevel || 'For you'} title="For You"
        sub="Books your teacher has shared, with notes, practice and quizzes" />
      {state.loading ? <Centered><ActivityIndicator color={DAY.violet} /></Centered>
        : !state.books.length ? (
          <Centered>
            <T s={38}>📚</T>
            <T w="bold" s={16} c={DAY.ink} style={{ marginTop: 10, textAlign: 'center' }}>Nothing shared yet</T>
            <T w="reg" s={13} c={DAY.inkSoft} style={{ marginTop: 6, textAlign: 'center', lineHeight: 19 }}>
              When your teacher shares a book, its notes and quizzes appear here.
            </T>
          </Centered>
        ) : (
          <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
            {state.books.map((b, i) => (
              <Appear key={b.id} delay={60 + i * 55} y={12}>
                <Squeeze onPress={() => onPick(b)} accessibilityRole="button" accessibilityLabel={b.title} style={[st.card, st.bookRow]}>
                  <View style={st.bookSpine}><BookOpen size={20} color={DAY.violet} strokeWidth={2} /></View>
                  <View style={{ flex: 1 }}>
                    <T w="bold" s={15} c={DAY.ink} numberOfLines={2}>{b.title}</T>
                    <T w="reg" s={11.5} c={DAY.inkSoft} style={{ marginTop: 3 }}>
                      {[b.subject, b.chapters ? `${b.chapters} chapter${b.chapters === 1 ? '' : 's'}` : null,
                        b.page_count ? `${b.page_count} pages` : null].filter(Boolean).join(' · ')}
                    </T>
                  </View>
                </Squeeze>
              </Appear>
            ))}
          </ScrollView>
        )}
    </View>
  );
}

// ─── 2 · Chapters ────────────────────────────────────────────────────────────

function Chapters({ book, onOpen, onBack }) {
  const [state, setState] = useState({ loading: true, list: [], error: '' });
  useEffect(() => {
    let alive = true;
    getBookChapters(book.id)
      .then((list) => alive && setState({ loading: false, list: list || [], error: '' }))
      .catch(() => alive && setState({ loading: false, list: [], error: 'Could not load this book.' }));
    return () => { alive = false; };
  }, [book.id]);

  return (
    <View style={st.root}>
      <Header onBack={onBack} kicker={book.subject || 'Book'} title={book.title} sub="Choose a chapter" />
      {state.loading ? <Centered><ActivityIndicator color={DAY.violet} /></Centered>
        : state.error ? <Centered><T c={DAY.red}>{state.error}</T></Centered>
        : !state.list.length ? <Centered><T c={DAY.inkSoft}>Nothing has been shared from this book yet.</T></Centered>
        : (
          <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
            {state.list.map((c, i) => (
              <Appear key={c.id} delay={Math.min(i, 10) * 40} y={10}>
                <Card style={{ marginBottom: 12 }}>
                  <T w="semi" s={14} c={DAY.ink} numberOfLines={2}>{c.position}. {c.title}</T>
                  <View style={st.kinds}>
                    {(c.kinds || []).map((kind) => {
                      const s = sectionFor(kind);
                      return (
                        <Squeeze key={kind} onPress={() => onOpen(c, kind)} accessibilityRole="button"
                          accessibilityLabel={`${s.label} for chapter ${c.position}`} style={[st.kindBtn, { backgroundColor: s.tint }]}>
                          <s.Icon size={14} color={s.color} strokeWidth={2.2} />
                          <T w="bold" s={12} c={s.color}>{s.label}</T>
                        </Squeeze>
                      );
                    })}
                  </View>
                </Card>
              </Appear>
            ))}
          </ScrollView>
        )}
    </View>
  );
}

// ─── 3 · Content ─────────────────────────────────────────────────────────────

function Content({ chapter, kind, onBack }) {
  const s = sectionFor(kind);
  const [state, setState] = useState({ loading: true, data: null, error: '' });
  useEffect(() => {
    let alive = true;
    getBookContent(chapter.id, kind)
      .then((row) => alive && setState({ loading: false, data: row && row.payload, error: '' }))
      .catch((e) => {
        reportWarn('screens/MyBooksScreen.js:Content', e, { chapterId: chapter.id, kind });
        alive && setState({ loading: false, data: null, error: 'This section is not available.' });
      });
    return () => { alive = false; };
  }, [chapter.id, kind]);

  return (
    <View style={st.root}>
      <Header onBack={onBack} kicker={`${chapter.position}. ${chapter.title}`} title={s.label} sub={s.blurb} />
      {state.loading ? <Centered><ActivityIndicator color={s.color} /></Centered>
        : state.error || !state.data ? <Centered><T c={DAY.inkSoft}>{state.error || 'Nothing here yet.'}</T></Centered>
        : kind === 'notes' ? <Notes data={state.data} />
        : kind === 'resource' ? <Resources data={state.data} />
        : kind === 'practice' ? <Practice data={state.data} />
        : <Quiz data={state.data} />}
    </View>
  );
}

function Notes({ data }) {
  return (
    <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
      {!!data.summary && (
        <Appear delay={40}>
          <View style={st.summary}>
            <T w="bold" s={11} c={DAY.violet} style={st.kicker}>IN SHORT</T>
            <T w="reg" s={14} c={DAY.ink} style={{ marginTop: 6, lineHeight: 21 }}>{data.summary}</T>
          </View>
        </Appear>
      )}
      {(data.sections || []).map((sec, i) => (
        <Appear key={i} delay={90 + i * 60} y={10}>
          <Card style={{ marginBottom: 12 }}>
            <T w="xbold" s={15} c={DAY.ink}>{sec.heading}</T>
            {(sec.points || []).map((p, j) => (
              <View key={j} style={st.bullet}>
                <View style={st.dot} />
                <T w="reg" s={13.5} c={DAY.ink} style={{ flex: 1, lineHeight: 20 }}>{p}</T>
              </View>
            ))}
          </Card>
        </Appear>
      ))}
      {!!(data.keyTerms || []).length && (
        <Appear delay={200} y={10}>
          <Card>
            <T w="xbold" s={15} c={DAY.ink} style={{ marginBottom: 8 }}>Key terms</T>
            {data.keyTerms.map((t, i) => (
              <View key={i} style={[st.term, i && st.termGap]}>
                <T w="bold" s={13} c={DAY.violet}>{t.term}</T>
                <T w="reg" s={13} c={DAY.inkSoft} style={{ marginTop: 2, lineHeight: 19 }}>{t.meaning}</T>
              </View>
            ))}
          </Card>
        </Appear>
      )}
    </ScrollView>
  );
}

function Resources({ data }) {
  return (
    <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
      {(data.items || []).map((it, i) => (
        <Appear key={i} delay={50 + i * 55} y={10}>
          <Card style={[{ marginBottom: 12 }, st.resCard]}>
            <View style={st.row}>
              <T w="xbold" s={14.5} c={DAY.ink} style={{ flex: 1 }}>{it.title}</T>
              {!!it.type && <View style={st.chip}><T w="bold" s={10} c={DAY.green}>{String(it.type).toUpperCase()}</T></View>}
            </View>
            <T w="reg" s={13.5} c={DAY.ink} style={{ marginTop: 6, lineHeight: 20 }}>{it.body}</T>
          </Card>
        </Appear>
      ))}
    </ScrollView>
  );
}

// Written questions. The answer is hidden until asked for — seeing it immediately
// turns practice into reading.
function Practice({ data }) {
  const [open, setOpen] = useState({});
  return (
    <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
      {(data.questions || []).map((q, i) => (
        <Appear key={i} delay={50 + i * 55} y={10}>
          <Card style={{ marginBottom: 12 }}>
            <View style={st.row}>
              <T w="bold" s={12} c={DAY.blue}>Q{i + 1}</T>
              {q.marks != null && <T w="med" s={11} c={DAY.inkSoft}>{q.marks} mark{q.marks === 1 ? '' : 's'}</T>}
              {!!q.difficulty && <View style={[st.chip, { backgroundColor: DAY.cardSoft }]}><T w="bold" s={10} c={DAY.inkSoft}>{String(q.difficulty).toUpperCase()}</T></View>}
            </View>
            <T w="semi" s={14} c={DAY.ink} style={{ marginTop: 6, lineHeight: 20 }}>{q.q}</T>
            {open[i] ? (
              <Appear y={6}>
                <View style={st.answerBox}>
                  <T w="bold" s={11} c={DAY.green} style={st.kicker}>ANSWER</T>
                  <T w="reg" s={13.5} c={DAY.ink} style={{ marginTop: 4, lineHeight: 20 }}>{q.answer}</T>
                </View>
              </Appear>
            ) : (
              <Squeeze onPress={() => setOpen((o) => ({ ...o, [i]: true }))} accessibilityRole="button"
                accessibilityLabel={`Show the answer to question ${i + 1}`} style={st.revealBtn}>
                <T w="bold" s={13} c={DAY.blue}>Show answer</T>
              </Squeeze>
            )}
          </Card>
        </Appear>
      ))}
    </ScrollView>
  );
}

function QuizItem({ item, index, onAnswer }) {
  const [picked, setPicked] = useState(null);
  const [shakeStyle, shake] = useShake();
  const choose = (i) => {
    if (picked != null) return;
    setPicked(i);
    if (i !== item.answer) shake();
    onAnswer(i === item.answer);
  };
  return (
    <Card style={{ marginBottom: 12 }}>
      <T w="bold" s={12} c={DAY.amber}>Q{index + 1}</T>
      <T w="semi" s={14} c={DAY.ink} style={{ marginTop: 4, lineHeight: 20 }}>{item.q}</T>
      <Animated.View style={[st.opts, shakeStyle]}>
        {(item.options || []).map((o, i) => {
          const right = picked != null && i === item.answer;
          const wrong = picked === i && i !== item.answer;
          return (
            <Squeeze key={i} onPress={() => choose(i)} disabled={picked != null} accessibilityRole="button" accessibilityLabel={String(o)}
              style={[st.opt, right && st.optRight, wrong && st.optWrong]}>
              <T w="med" s={13} c={right ? DAY.green : wrong ? DAY.red : DAY.ink}>{o}</T>
            </Squeeze>
          );
        })}
      </Animated.View>
      {picked != null && !!item.explanation && (
        <Appear y={4}>
          <T w="reg" s={12.5} c={DAY.inkSoft} style={{ marginTop: 8, lineHeight: 18 }}>{item.explanation}</T>
        </Appear>
      )}
    </Card>
  );
}

function Quiz({ data }) {
  const questions = data.questions || [];
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(0);
  const [run, setRun] = useState(0);   // remount to retake
  const finished = done >= questions.length && questions.length > 0;
  const pct = questions.length ? Math.round((score / questions.length) * 100) : 0;

  return (
    <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
      <Appear delay={40} y={-8}>
        <View style={st.hud}>
          <T w="bold" s={14} c={DAY.amber}>⭐ {score}/{questions.length}</T>
          <View style={st.track}>
            <View style={[st.fill, { width: `${questions.length ? (done / questions.length) * 100 : 0}%` }]} />
          </View>
          <T s={18}>{finished ? (pct >= 70 ? '🏆' : '📘') : '✏️'}</T>
        </View>
      </Appear>

      {questions.map((q, i) => (
        <Appear key={`${run}-${i}`} delay={80 + i * 50} y={10}>
          <QuizItem item={q} index={i} onAnswer={(ok) => { if (ok) setScore((s) => s + 1); setDone((d) => d + 1); }} />
        </Appear>
      ))}

      {finished && (
        <Appear y={12}>
          <Card style={st.result}>
            <T s={34}>{pct >= 70 ? '🏆' : pct >= 40 ? '📘' : '🌱'}</T>
            <T w="xbold" s={18} c={DAY.ink} style={{ marginTop: 6 }}>{score} / {questions.length}</T>
            <T w="reg" s={13} c={DAY.inkSoft} style={{ marginTop: 4, textAlign: 'center' }}>
              {pct >= 70 ? 'Strong — you know this chapter.' : pct >= 40 ? 'Getting there. Re-read the notes and try again.' : 'Start with the notes, then come back.'}
            </T>
            <Squeeze onPress={() => { setScore(0); setDone(0); setRun((r) => r + 1); }} accessibilityRole="button"
              accessibilityLabel="Try the quiz again" style={st.retake}>
              <RotateCcw size={16} color={DAY.ctaFg} strokeWidth={2.2} />
              <T w="bold" s={15} c={DAY.ctaFg}>Try again</T>
            </Squeeze>
          </Card>
        </Appear>
      )}
    </ScrollView>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────────

const MyBooksScreen = ({ onBack }) => {
  const { selectedClass } = useAuth();
  const [book, setBook] = useState(null);
  const [open, setOpen] = useState(null);   // { chapter, kind }

  let body;
  if (open) body = <Content chapter={open.chapter} kind={open.kind} onBack={() => setOpen(null)} />;
  else if (book) body = <Chapters book={book} onOpen={(chapter, kind) => setOpen({ chapter, kind })} onBack={() => setBook(null)} />;
  else body = <Shelf classLevel={selectedClass} onPick={setBook} onBack={onBack} />;

  return (
    <View style={st.root}>
      <StatusBar barStyle="dark-content" backgroundColor={DAY.bgTop} translucent={false} />
      <Appear key={open ? `c-${open.kind}` : book ? `b-${book.id}` : 'shelf'} y={14} style={{ flex: 1 }}>{body}</Appear>
    </View>
  );
};

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: DAY.bg },
  scroll: { paddingHorizontal: PAD, paddingBottom: 100, paddingTop: 4 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kicker: { letterSpacing: 1.2 },

  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: PAD, paddingBottom: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: DAY.cardSoft, borderWidth: 1, borderColor: DAY.cardEdge },

  card: {
    backgroundColor: DAY.card, borderRadius: 18, borderWidth: 1, borderColor: DAY.cardEdge, padding: 16,
    shadowColor: DAY.shadow, shadowOpacity: DAY.shadowOpacity, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },

  bookRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  bookSpine: { width: 46, height: 46, borderRadius: 12, backgroundColor: DAY.violetSoft, alignItems: 'center', justifyContent: 'center' },

  kinds: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  kindBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 13 },

  summary: { backgroundColor: DAY.bannerBg, borderLeftWidth: 4, borderLeftColor: DAY.violet, borderRadius: 12, padding: 14, marginBottom: 14 },
  bullet: { flexDirection: 'row', gap: 10, marginTop: 9 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: DAY.violet, marginTop: 8 },
  term: { paddingVertical: 2 },
  termGap: { marginTop: 10, borderTopWidth: 1, borderTopColor: DAY.divider, paddingTop: 10 },

  resCard: { borderLeftWidth: 4, borderLeftColor: DAY.green },
  chip: { backgroundColor: DAY.greenSoft, borderRadius: 6, paddingVertical: 3, paddingHorizontal: 7 },

  revealBtn: { alignSelf: 'flex-start', marginTop: 10, backgroundColor: DAY.blueSoft, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 16 },
  answerBox: { marginTop: 10, backgroundColor: DAY.greenSoft, borderRadius: 12, padding: 12, borderLeftWidth: 3, borderLeftColor: DAY.green },

  hud: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: DAY.card, borderWidth: 1, borderColor: DAY.cardEdge, borderRadius: 14, paddingVertical: 8, paddingHorizontal: 14, marginBottom: 12 },
  track: { flex: 1, height: 9, borderRadius: 5, backgroundColor: DAY.track, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5, backgroundColor: DAY.heroA },
  opts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  opt: { backgroundColor: DAY.cardSoft, borderWidth: 1.5, borderColor: DAY.cardEdge, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  optRight: { backgroundColor: DAY.greenSoft, borderColor: DAY.green },
  optWrong: { backgroundColor: DAY.redSoft, borderColor: DAY.red },
  result: { alignItems: 'center', paddingVertical: 22, borderWidth: 2, borderColor: DAY.heroA },
  retake: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: DAY.ctaBg, borderRadius: 999, paddingVertical: 13, paddingHorizontal: 24, marginTop: 16, alignSelf: 'stretch' },
});

export default MyBooksScreen;
