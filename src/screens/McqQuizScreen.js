// McqQuizScreen.js
// Per-question MCQ practice flow (DB-backed). Each question has its own timer;
// the user either Skips or Submits. On Submit the correct answer is highlighted
// (green), a wrong pick is shown (red), and the solution (explanation) is
// revealed. Then "Next" moves on. A short summary is shown at the end.
//
// Questions come from mcqPracticeApi (getMcqSubtopicTest / getMcqChapterTest):
//   { id, text, options:[{ key, label, optionId }], correctOptionId,
//     correctAnswer, explanation }
//
// UI: two Figma frames, both 402 wide on a #0C0936 canvas with a content wrapper
// padded 16 left/right — `mcq-question-dark` (asking) and `answer-result-dark`
// (revealed). Where the two disagree, the RESULT frame wins: it is the later
// draft, and the pieces they share (header, stats panel, option cards) have to be
// one component or they'd visibly jump the moment you hit Submit. Specifically:
//   · cards are a flat #16143F, not the question frame's two-fill composite
//   · option cards are 56 tall on 14 padding, not 60 on 16
//   · the timer moved out of the header into the stats panel's first row
//   · `done` moved the other way, out of that row and down into the stats bar

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, Image, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, StatusBar, Platform,
} from 'react-native';
import { ChevronLeft, Clock, Check, X, CircleAlert } from 'lucide-react-native';
import { COLORS, FONT_FAMILY, TYPE_SCALE, RADIUS, SPACING } from '../theme/designSystem';
import MathText from '../components/MathText';
import { hasMath, htmlToPlain, firstImg, stripImages } from '../utils/mathHtml';

const QUESTION_SECONDS = 60;

// ─── Dark practice palette ────────────────────────────────────────────────────
// Every value here is inspected off the two frames. The shared palette board can't
// supply them: its Dark Theme row is captioned with the LIGHT theme's hexes (a
// #F8F8FF caption under a near-black swatch), so those numbers are a copy/paste
// slip, not a spec. Only the canvas comes from a token — the frame's #0C0936 is
// the same value designSystem already carries as COLORS.background.
//
// Note the semantic hues are the FRAMES', not the board's: #00FF88 / #FF3366 are
// brighter and more saturated than COLORS.success / COLORS.error, which were
// picked for the light screens and go muddy on this canvas.
const C = {
  // ⚠ Light system. This was the dark quiz palette; keys are unchanged so the ~60
  // call sites below keep working, but every value moved. The old map had
  // ink: #FFFFFF over canvas: COLORS.background — once the base went white that
  // rendered every question and option as white-on-white, i.e. blank.
  canvas: COLORS.background,   // #FFFFFF
  card: '#F5F5F5',             // stats panel, resting option card, back button
  hair: 'rgba(17,17,17,0.10)',
  chip: 'rgba(17,17,17,0.06)', // letter badge + percent chip fill

  ink: '#111111',
  sub: '#666666',              // every muted label on both frames
  onBright: '#111111',         // letter sitting on a saturated badge — ink, not white

  // Timer badge + Next/Submit. Yellow is a FILL; onBright rides on top of it.
  violet: '#FFC629',
  violetSoft: '#FFF4CC',
  violetGlow: '#FFF9E6',

  // Pre-submit pick. Distinct from the reveal hues on purpose, so "chosen" never
  // reads as "graded".
  cyan: '#FFC629',        // the chosen-but-not-yet-graded option — yellow, per the frame
  cyanSoft: '#FFF4CC',

  green: '#0E9F6E',
  greenSoft: '#E6F6F0',
  red: '#D92D20',
  redSoft: '#FDECEA',
  redEdge: 'rgba(217,45,32,0.22)',
  // Skipped borrows the accent token so it cannot be mistaken for either graded state.
  amber: COLORS.accent,        // #8A6A00 — the darkened hue, legible on white
  amberSoft: '#FFF9E6',
  amberEdge: 'rgba(138,106,0,0.22)',
};

// The frames are drawn in two faces that are on neither of the board's sanctioned
// pairs — **Geist** (every label) and **Outfit** (headings and the option letters).
// Substituting Inter for Geist and Poppins for Outfit is a deliberate call
// (2026-08-05), not an oversight: the pairs are near-indistinguishable at these
// sizes on a phone (Geist/Inter are both neo-grotesque, Outfit/Poppins both
// geometric), and two more families app-wide isn't worth that at boot. Both are
// published on @expo-google-fonts if this is revisited — adopt them for the whole
// screen then, never node by node.
//
// SIZES and WEIGHTS below are the frames' exactly; only the family is substituted.
// Outfit 800 lands on Poppins 700 because that's the heaviest Poppins App.js loads,
// and it is only ever one capital letter inside a 28px badge.
const F = {
  head: FONT_FAMILY.display,        // Poppins_700Bold   <- Outfit 700 / 800
  bold: FONT_FAMILY.interBold,      // Inter_700Bold     <- Geist 700
  semi: FONT_FAMILY.interSemibold,  // Inter_600SemiBold <- Geist 600
  med: FONT_FAMILY.interMedium,     // Inter_500Medium   <- Geist 500
  reg: FONT_FAMILY.interRegular,    // Inter_400Regular  <- Geist 400
};

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// Renders real math ({tex}…{/tex}, $…$, \(…\), \[…\], $$…$$ — the bank uses all
// of them) via MathText, and everything else as Text: MathJaxSvg splits a plain
// string into one <Text> per HTML node inside a wrapping row, which costs the
// screen its line height for no gain when there's no formula to typeset. Both
// paths run the same HTML through mathHtml first, so a<sup>2</sup> is a² and
// [ML^(5)T^(-2)] is [ML⁵T⁻²] either way. If the content carries an image
// (diagram), it's shown below any text.
//
// Diagrams keep a WHITE plate on this dark page on purpose: the source images are
// black line art on transparent/white, so dropping them straight onto #0C0936
// would render them as an invisible black-on-black square.
function Rich({ value, fontSize = 15, lineHeight, color = C.ink, family = F.reg, imgHeight = 160 }) {
  if (value == null || !String(value).trim()) return null;
  const raw = String(value);
  const img = firstImg(raw);
  const textPart = stripImages(raw);
  const isMath = hasMath(textPart);
  const plain = isMath ? '' : htmlToPlain(textPart);
  const hasText = isMath ? !!textPart.trim() : plain.length > 0;
  // Figma reports "line height 100%" on every text node here, but each node's own
  // height contradicts it (`question-text` is 23 tall for one 18px line). Callers
  // pass the height the node actually measures; 1.45 is the fallback for text the
  // frames don't specify.
  const lh = lineHeight || fontSize * 1.45;
  const body = isMath
    // fontSize is MathJaxSvg's SVG scale as well as its text size, so it stays a
    // prop; only the family and line height ride along in textStyle.
    ? <MathText value={textPart} fontSize={fontSize} color={color} textStyle={{ fontFamily: family, lineHeight: lh }} />
    : <Text style={{ fontSize, color, fontFamily: family, lineHeight: lh }}>{plain}</Text>;
  if (!img) return body;
  return (
    <View>
      {hasText ? body : null}
      <Image source={{ uri: img }} style={[st.diagram, { height: imgHeight, marginTop: hasText ? 8 : 0 }]} resizeMode="contain" />
    </View>
  );
}

export default function McqQuizScreen({
  questions = [], subject = '', chapter = '', subtopicName = '', onExit = () => {}, onComplete = () => {},
}) {
  const qs = Array.isArray(questions) ? questions : [];
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);   // optionId
  const [submitted, setSubmitted] = useState(false);
  const [secs, setSecs] = useState(QUESTION_SECONDS);
  const [score, setScore] = useState({ correct: 0, wrong: 0, skipped: 0 });
  const [done, setDone] = useState(false);
  const timerRef = useRef(null);
  const scoredRef = useRef(false);   // has the CURRENT question already been counted?

  // { questionId: optionId } for every question actually answered — handed to
  // onComplete so the caller can persist the attempt server-side. Skipped questions
  // are simply absent, which is what the grading endpoint expects.
  const answersRef = useRef({});

  // reveal() is called from an interval created when the question LOADED, so calling it
  // directly closed over that render's `selected` — always null, because next() clears
  // it. An answer chosen during the countdown was therefore scored as "skipped" when
  // the timer ran out. revealRef always points at the latest reveal, which sees the
  // option the student actually picked.
  const revealRef = useRef(null);
  useEffect(() => { revealRef.current = reveal; });

  // Per-question countdown — resets each question, auto-reveals at 0.
  useEffect(() => {
    scoredRef.current = false;       // new question → scoreable again
    if (done) return undefined;
    setSecs(QUESTION_SECONDS);
    // The countdown lives in a local owned by this question's interval, so the tick is
    // a plain value set — no setState call inside a state updater (updaters must stay
    // pure), and no chance of the previous question's 0 leaking into the next one.
    let left = QUESTION_SECONDS;
    timerRef.current = setInterval(() => {
      left -= 1;
      setSecs(left > 0 ? left : 0);
      if (left <= 0) {
        clearInterval(timerRef.current);
        if (revealRef.current) revealRef.current();
      }
    }, 1000);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, done]);

  // Report the final score once, when the quiz finishes (for attempt tracking).
  useEffect(() => {
    if (done) onComplete({ correct: score.correct, total: qs.length, answers: answersRef.current });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  if (!qs.length) {
    return (
      <Page>
        <Header onExit={onExit} title={subtopicName || chapter} />
        <View style={st.center}>
          <Text style={st.emptyTitle}>No questions yet</Text>
          <Text style={st.emptySub}>Questions for this haven't been added yet.</Text>
        </View>
      </Page>
    );
  }

  const q = qs[idx];
  const correctId = q.correctOptionId;
  const doneCount = score.correct + score.wrong + score.skipped;
  const attemptedLive = score.correct + score.wrong;
  const liveAcc = attemptedLive ? Math.round((score.correct / attemptedLive) * 100) : 0;

  // scoredRef, not the `submitted` state, is the "already counted this question" guard:
  // the old code nested setScore inside a setSubmitted updater to read it, and React
  // may invoke an updater twice (StrictMode), which double-counted the score. A ref is
  // read synchronously, so the guard is exact. It resets per question (timer effect).
  function reveal() {
    clearInterval(timerRef.current);
    if (scoredRef.current) return;
    scoredRef.current = true;
    // Record the pick for server-side persistence before scoring (skipped questions
    // stay absent, which is what the grading endpoint expects).
    if (selected != null) answersRef.current[q.id] = selected;
    setSubmitted(true);
    setScore((s) => {
      if (selected == null) return { ...s, skipped: s.skipped + 1 };
      if (String(selected) === String(correctId)) return { ...s, correct: s.correct + 1 };
      return { ...s, wrong: s.wrong + 1 };
    });
  }

  function skip() {
    clearInterval(timerRef.current);
    if (scoredRef.current) return;   // a time-up reveal already counted this one
    scoredRef.current = true;
    setScore((s) => ({ ...s, skipped: s.skipped + 1 }));
    next();
  }

  function next() {
    clearInterval(timerRef.current);
    setSubmitted(false);
    setSelected(null);
    if (idx + 1 >= qs.length) setDone(true);
    else setIdx(idx + 1);
  }

  if (done) {
    const attempted = score.correct + score.wrong;
    const acc = attempted ? Math.round((score.correct / attempted) * 100) : 0;
    return (
      <Page>
        <Header onExit={onExit} title="Result" />
        <ScrollView contentContainerStyle={st.resScroll}>
          <View style={st.resHero}>
            <Text style={st.resEmoji}>{acc >= 80 ? '🏆' : acc >= 50 ? '👍' : '💪'}</Text>
            <Text style={st.resTitle}>{score.correct} / {qs.length} correct</Text>
            <Text style={st.resSub}>{subtopicName || chapter}</Text>
          </View>
          <View style={st.tiles}>
            <Tile bg={C.greenSoft} col={C.green} num={score.correct} label="Correct" />
            <Tile bg={C.redSoft} col={C.red} num={score.wrong} label="Wrong" />
            <Tile bg={C.amberSoft} col={C.amber} num={score.skipped} label="Skipped" />
          </View>
          <Text style={st.accTxt}>Accuracy: {acc}%</Text>
          <ActionBtn label="Back to Practice" onPress={onExit} filled />
        </ScrollView>
      </Page>
    );
  }

  // The revealed verdict drives the explanation box's whole colour story.
  const verdict = !submitted ? null
    : selected == null ? { hue: C.amber, fill: C.amberSoft, edge: C.amberEdge, Icon: CircleAlert, word: 'Skipped' }
      : String(selected) === String(correctId) ? { hue: C.green, fill: C.greenSoft, edge: 'rgba(0,255,136,0.1255)', Icon: Check, word: 'Correct' }
        : { hue: C.red, fill: C.redSoft, edge: C.redEdge, Icon: X, word: 'Incorrect' };

  return (
    <Page>
      <Header onExit={onExit} title={subtopicName || chapter} />

      {/* `stats-panel` — 78 tall: 12 pad · `progress-row` 22 · 10 gap ·
          `stats-bar` 22 · 12 pad. Both rows are space-between across 346. */}
      <View style={st.statsCard}>
        <View style={st.row22}>
          <Text style={st.progressTxt}>Question {idx + 1} / {qs.length}</Text>
          <TimerBadge secs={secs} />
        </View>
        <View style={st.row22}>
          <Text style={st.doneTxt}>Done {doneCount}/{qs.length}</Text>
          <Tally Icon={Check} col={C.green} n={score.correct} />
          <Tally Icon={X} col={C.red} n={score.wrong} />
          <View style={st.pctChip}><Text style={st.pctTxt}>{liveAcc}%</Text></View>
        </View>
      </View>

      <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
        {!!q.cat && <Text style={st.cat}>{q.cat}</Text>}
        {/* `question-box` — 78 tall: 16 pad · 46 `question-text` · 16 pad.
            The question is body copy, not a headline: at 18/Poppins-Bold it matched
            the screen title exactly and a long stem (van der Waals, 4 wrapped lines)
            swallowed the options below it. 15.5/Inter-SemiBold still outranks the
            14/Inter-Medium options, and the looser 22 line height makes a multi-line
            stem read as a paragraph instead of a wall. */}
        <View style={st.questionBox}>
          <Rich value={q.text} fontSize={15.5} lineHeight={22} color={C.ink} family={F.semi} />
        </View>

        <View style={st.opts}>
          {(q.options || []).map((o) => {
            const isSel = String(selected) === String(o.optionId);
            const isCorrect = String(o.optionId) === String(correctId);

            // One place decides a card's whole appearance. `dim` is the revealed
            // also-ran: the frame greys its label rather than leaving four equally
            // white rows once the answer is known.
            let tone = null;
            let dim = false;
            if (submitted) {
              if (isCorrect) tone = { edge: C.green, fill: C.greenSoft, ink: C.onBright, Mark: Check, weight: F.semi };
              else if (isSel) tone = { edge: C.red, fill: C.redSoft, ink: C.ink, Mark: X, weight: F.med };
              else dim = true;
            } else if (isSel) {
              tone = { edge: C.cyan, fill: C.cyanSoft, ink: C.onBright, weight: F.med };
            }

            return (
              <TouchableOpacity
                key={o.optionId}
                // No press fade: the card already answers the tap by turning
                // cyan, and a dip on the way there just reads as a flicker.
                activeOpacity={1}
                disabled={submitted}
                onPress={() => setSelected(o.optionId)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSel, disabled: submitted }}
                accessibilityLabel={`Option ${o.key}`}
                // Flat in every state. The frames put a cyan glow behind the
                // pre-submit pick, but `elevation` is the only half of that RN
                // honours on Android and it paints a grey halo, not a coloured
                // one — on #0C0936 that reads as a smudge under the card. The
                // border and fill carry the state on their own.
                style={[st.opt, tone && { borderColor: tone.edge, backgroundColor: tone.fill }]}
              >
                <View style={[st.badge, tone && { backgroundColor: tone.edge }]}>
                  <Text style={[st.badgeTxt, tone && { color: tone.ink }]}>{o.key}</Text>
                </View>
                <View style={st.optBody}>
                  <Rich
                    value={o.label}
                    fontSize={14}
                    lineHeight={18}
                    color={dim ? C.sub : C.ink}
                    family={tone ? tone.weight : F.med}
                    imgHeight={92}
                  />
                </View>
                {tone && tone.Mark && <tone.Mark size={16} color={tone.edge} strokeWidth={2} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* `explanation-box` — tinted with the verdict's own hue so the reveal and
            the graded card read as one statement. */}
        {submitted && verdict && (
          <View style={[st.explBox, { backgroundColor: verdict.fill, borderColor: verdict.edge }]}>
            <View style={st.titleRow}>
              <verdict.Icon size={14} color={verdict.hue} strokeWidth={2} />
              <Text style={[st.explTitle, { color: verdict.hue }]}>
                {verdict.word}{q.correctAnswer ? ` • Answer: ${q.correctAnswer}` : ''}
              </Text>
            </View>
            {!!q.explanation && <Rich value={q.explanation} fontSize={13} lineHeight={17} color={C.sub} family={F.reg} />}
          </View>
        )}

        {/* `mcq-actions` — 66 tall: the 42 buttons plus 24 below, gap 12. It sits
            IN the flow, starting where `options-stack` ends (the explanation only
            comes between the two once the answer is revealed) — not pinned to the
            bottom of the screen, so a short question leaves no dead band above it. */}
        <View style={st.actions}>
          {!submitted ? (
            <>
              <ActionBtn label="Skip" onPress={skip} style={st.grow} />
              <ActionBtn label="Submit" onPress={reveal} disabled={selected == null} filled style={st.grow} />
            </>
          ) : (
            <ActionBtn label={idx + 1 >= qs.length ? 'Finish' : 'Next'} onPress={next} filled style={st.grow} />
          )}
        </View>
      </ScrollView>
    </Page>
  );
}

// The frame's page shell: flat #0C0936 behind the status bar and the content.
function Page({ children }) {
  return (
    <SafeAreaView style={st.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.canvas} />
      {Platform.OS === 'android' && <View style={st.androidStatusPad} />}
      {children}
    </SafeAreaView>
  );
}

// `header-row` — 60 tall (12 · 36 · 12), gap 12. The title takes the rest of the
// row: the timer badge lives in the stats panel, not up here.
function Header({ onExit, title }) {
  return (
    <View style={st.header}>
      <TouchableOpacity onPress={onExit} hitSlop={10} style={st.backBtn} accessibilityRole="button" accessibilityLabel="Back">
        <ChevronLeft size={16} color={C.ink} strokeWidth={2} />
      </TouchableOpacity>
      <Text style={st.headerTitle} numberOfLines={1}>{title}</Text>
    </View>
  );
}

// `timer-badge` — 22 tall, 8 radius, violet at 12.55% behind a full-strength edge.
// Turns red under ten seconds; that state isn't in the frames, so it reuses the
// same recipe in the reveal red rather than inventing a treatment.
function TimerBadge({ secs }) {
  const low = secs <= 10;
  const hue = low ? C.red : C.violet;
  return (
    <View style={[st.timerBadge, low && { backgroundColor: C.redSoft, borderColor: C.red }]}>
      <Clock size={10} color={hue} strokeWidth={2} />
      <Text style={[st.timerTxt, { color: hue }]}>{fmt(secs)}</Text>
    </View>
  );
}

// `stat-correct` / `stat-incorrect` — a 16px mark and its count, 4 apart.
function Tally({ Icon, col, n }) {
  return (
    <View style={st.tally}>
      <Icon size={16} color={col} strokeWidth={2} />
      <Text style={[st.tallyTxt, { color: col }]}>{n}</Text>
    </View>
  );
}

/**
 * `submit-btn` / `next-btn`: 42 tall (12 · 18 label · 12), 14 radius, a FLAT
 * #9D4EDD with a y4/blur16 shadow of itself at 14.51%.
 *
 * Deliberately NOT the shared brand/PrimaryButton — that one is the 56-tall,
 * 28-radius, three-stop gradient CTA from the auth frames, and these frames draw
 * something else. Forcing PrimaryButton in here would silently overrule an
 * inspected node.
 */
function ActionBtn({ label, onPress, disabled = false, filled = false, style }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={[st.aBtn, filled ? st.aBtnFill : st.aBtnGhost, disabled && st.aBtnOff, style]}
    >
      <Text style={[st.aBtnTxt, filled && st.aBtnTxtFill]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Tile({ bg, col, num, label }) {
  return (
    <View style={[st.tile, { backgroundColor: bg, borderColor: col }]}>
      <Text style={[st.tileNum, { color: col }]}>{num}</Text>
      <Text style={st.tileLbl}>{label}</Text>
    </View>
  );
}

// The frames' content wrapper is padded 16 left/right; every block inherits it.
const PAD = SPACING.md;

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.canvas },
  androidStatusPad: { height: 24, backgroundColor: C.canvas },

  // ── `header-row` ──
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: PAD, paddingVertical: 12 },
  backBtn: { width: 36, height: 36, borderRadius: RADIUS.md, backgroundColor: C.card, borderWidth: 1, borderColor: C.hair, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, lineHeight: 23, fontFamily: F.head, color: C.ink },

  // ── `stats-panel` (borderless — the frames give it a fill, no stroke) ──
  statsCard: { marginHorizontal: PAD, backgroundColor: C.card, borderRadius: RADIUS.lg, padding: 12, gap: 10 },
  row22: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 22 },
  progressTxt: { fontSize: 13, lineHeight: 17, fontFamily: F.med, color: C.sub },
  doneTxt: { fontSize: 13, lineHeight: 17, fontFamily: F.semi, color: C.cyan },
  timerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 22, paddingHorizontal: 8, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: C.violet, backgroundColor: C.violetSoft },
  timerTxt: { fontSize: 11, lineHeight: 14, fontFamily: F.bold },
  tally: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tallyTxt: { fontSize: 13, lineHeight: 17, fontFamily: F.semi },
  // `stat-percent` is a chip, not bare text — 22 tall on the same 6.27% white.
  pctChip: { height: 22, paddingHorizontal: 8, borderRadius: RADIUS.sm, backgroundColor: C.chip, justifyContent: 'center' },
  pctTxt: { fontSize: 13, lineHeight: 17, fontFamily: F.semi, color: C.ink },

  // ── question + options ──
  // No gap on the container: `question-box` and `options-stack` carry the frames'
  // own padding, so a gap here would double-space them.
  // `mcq-actions` carries the 24 under the buttons, so the scroll adds none.
  scroll: { paddingHorizontal: PAD },
  cat: { fontSize: 12, lineHeight: 16, fontFamily: F.semi, color: '#8A6A00', letterSpacing: 0.4, marginTop: 16 },
  questionBox: { paddingTop: 16, paddingBottom: 16, gap: 12 },
  diagram: { width: '100%', borderRadius: RADIUS.sm, backgroundColor: '#FFFFFF' },

  // `options-stack`: 8 between cards, 16 under the last one.
  opts: { gap: 8, paddingBottom: 16 },
  // `option-card`: 56 tall (14 · 28 badge · 14), radius 16, gap 12.
  //
  // padding 13 + border 1, not padding 14 + border 0: the frames' borders are
  // INNER-aligned, so their 14 padding is measured from the card edge with the
  // stroke drawn inside it. RN adds borders outside the padding box, so 14+1 would
  // render a 58-tall card and shift the text 1px right the moment one is graded.
  // 13+1 lands the content on the same 14 inset either way, and the resting card
  // (which the frames draw with no stroke at all) carries its border transparent.
  opt: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderWidth: 1, borderColor: 'transparent', borderRadius: RADIUS.lg, padding: 13 },
  optBody: { flex: 1 },
  // `letter-badge`: a 28 rounded SQUARE at radius 8, not a circle.
  badge: { width: 28, height: 28, borderRadius: RADIUS.sm, backgroundColor: C.chip, alignItems: 'center', justifyContent: 'center' },
  badgeTxt: { fontSize: 13, lineHeight: 16, fontFamily: F.head, color: C.ink },

  // ── `explanation-box` ──
  explBox: { borderRadius: RADIUS.lg, borderWidth: 1, padding: 13, gap: 6, marginBottom: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 18 },
  explTitle: { fontSize: 14, lineHeight: 18, fontFamily: F.head },

  // ── `mcq-actions` ──
  // Inside the scroll, so it inherits the wrapper's 16 left/right; the frame gives
  // it no top padding at all (`options-stack`'s own 16 is the whole gap) and 24 below.
  actions: { flexDirection: 'row', gap: 12, paddingBottom: 24 },
  grow: { flex: 1 },
  aBtn: { height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  aBtnGhost: { borderWidth: 1, borderColor: C.hair, backgroundColor: 'transparent' },
  aBtnFill: {
    backgroundColor: C.violet,
    shadowColor: C.violet,
    shadowOpacity: 0.1451,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  aBtnOff: { opacity: 0.5, shadowOpacity: 0, elevation: 0 },
  aBtnTxt: { fontSize: 14, lineHeight: 18, fontFamily: F.bold, color: C.sub },
  aBtnTxtFill: { color: C.ink },

  // ── empty ──
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  emptyTitle: { fontSize: TYPE_SCALE.title, fontFamily: F.head, color: C.ink },
  emptySub: { fontSize: TYPE_SCALE.caption, fontFamily: F.reg, color: C.sub, marginTop: 6, textAlign: 'center' },

  // ── result summary (no frame of its own — follows the card recipe above) ──
  resScroll: { padding: PAD, gap: 14 },
  resHero: { backgroundColor: C.card, borderRadius: RADIUS.xl, alignItems: 'center', padding: 22, gap: 4 },
  resEmoji: { fontSize: 40 },
  resTitle: { fontSize: TYPE_SCALE.h3, fontFamily: F.head, color: C.ink },
  resSub: { fontSize: TYPE_SCALE.caption, fontFamily: F.reg, color: C.sub },
  tiles: { flexDirection: 'row', gap: 10 },
  tile: { flex: 1, borderRadius: RADIUS.lg, borderWidth: 1, alignItems: 'center', paddingVertical: 14 },
  tileNum: { fontSize: 22, fontFamily: F.bold },
  tileLbl: { fontSize: 12, fontFamily: F.med, color: C.sub, marginTop: 2 },
  accTxt: { fontSize: TYPE_SCALE.body, fontFamily: F.semi, color: C.ink, textAlign: 'center' },
});
