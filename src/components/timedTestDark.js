// timedTestDark.js
// The `timed-test-dark` Figma frame, as one component the whole app renders.
//
// Online tests reach the student down two different code paths — Class 6/7/8/9 run
// the DB-backed testpapers inside OnlineTestScreen, every other class runs the
// offline bank through TestQuestionScreen — and the two grade, time and submit
// differently enough that merging them would be a real regression risk (per-question
// timing, optionId vs letter answers, server submit shape). What they must NOT
// differ on is the pixels. So the state and the grading stay in each screen and the
// entire visual frame lives here, rendered by both.
//
// Frame: 402 wide on a #0C0936 canvas, with a `content-wrapper` padded 16 left/right
// that every block Fills to 370:
//   test-header (close · timer-badge · Submit) → info-strip (progress · badge) →
//   context-banner → question-area → options-stack → clear-action → nav-actions
// It draws neither the OS status bar nor the app's bottom nav; both are already real
// on these screens (SafeAreaView and FloatingDock).

import React from 'react';
import { View, Text, Image, ScrollView, Pressable, StyleSheet, Modal } from 'react-native';
import { X, Clock, Menu } from 'lucide-react-native';
import { COLORS as DS, FONT_FAMILY } from '../theme/designSystem';
import MathText from './MathText';
import { hasMath, htmlToPlain, firstImg } from '../utils/mathHtml';

// ─── Palette ──────────────────────────────────────────────────────────────────
// Inspected off the frame. Only the canvas comes from a token — the frame's
// #0C0936 is the value designSystem already carries as COLORS.background.
export const TT = {
  canvas: DS.background,                // #0C0936
  card: '#16143F',                      // option card, Previous, hamburger
  hair: 'rgba(255,255,255,0.0627)',     // 6.27% — every resting edge, and the letter badge

  ink: '#FFFFFF',
  sub: '#8F95B2',                       // progress, Clear Answer, ← Previous
  onBright: '#08090C',                  // a label sitting on a saturated fill

  cyan: '#00F0FF',                      // timer badge + header Submit
  cyanSoft: 'rgba(0,240,255,0.0627)',
  // The chosen option has no frame of its own; it borrows the badge accent rather
  // than inventing a hue, so "picked" reads as the same idea as "time left".
  cyanPick: 'rgba(0,240,255,0.1255)',

  violet: '#9D4EDD',                    // info badge + Next
  violetSoft: 'rgba(157,78,221,0.1255)',

  amber: '#FFE082',                     // context banner
  amberSoft: 'rgba(255,242,204,0.0627)',
  amberEdge: 'rgba(255,242,204,0.1255)',

  red: '#FF3366',                       // under a minute — not in the frame
  redSoft: 'rgba(255,51,102,0.102)',

  scrim: 'rgba(4,3,18,0.72)',
};

// The frame is drawn in Geist (labels) and Outfit (the question). The app loads
// neither; Inter and Poppins are the same classifications and are indistinguishable
// at these sizes on a phone. Sizes and weights everywhere below are the frame's.
export const TTF = {
  head: FONT_FAMILY.display,        // Poppins_700Bold   <- Outfit 700
  bold: FONT_FAMILY.interBold,      // Inter_700Bold     <- Geist 700
  semi: FONT_FAMILY.interSemibold,  // Inter_600SemiBold <- Geist 600
  reg: FONT_FAMILY.interRegular,    // Inter_400Regular  <- Geist 400
};

// HH:MM:SS — an online test runs 60–180 minutes, so M:SS would read "97:14" and
// lose the hour at a glance.
export const fmtClock = (s) => {
  const t = Math.max(0, Math.floor(s || 0));
  const p = (n) => String(n).padStart(2, '0');
  return `${p(Math.floor(t / 3600))}:${p(Math.floor((t % 3600) / 60))}:${p(t % 60)}`;
};

/**
 * Question / option / banner content. Real math ({tex}…{/tex}, $…$, \(…\)) goes to
 * MathText; everything else renders as Text — MathJaxSvg splits a plain string into
 * one <Text> per HTML node inside a wrapping row, which costs the screen its line
 * height for no gain when there is no formula to typeset. Both paths run the HTML
 * through mathHtml, so <sup>/<sub> and the caret notation the bank stores
 * ([ML^(5)T^(-2)], H_2O) become real characters instead of raw markup.
 *
 * Diagrams keep a WHITE plate: the source images are black line art, so on the
 * #0C0936 canvas they would otherwise render as an invisible black square.
 */
export function Rich({ value, fontSize = 15, lineHeight, color = TT.ink, family = TTF.reg, imgHeight = 150 }) {
  if (value == null || !String(value).trim()) return null;
  const raw = String(value);
  const img = firstImg(raw);
  const textPart = raw.replace(/<img[^>]*>/gi, '').replace(/<p[^>]*>\s*<\/p>/gi, '');
  const isMath = hasMath(textPart);
  const plain = isMath ? '' : htmlToPlain(textPart);
  const hasText = isMath ? !!textPart.trim() : plain.length > 0;
  const lh = lineHeight || fontSize * 1.45;
  const body = isMath
    ? <MathText value={textPart} fontSize={fontSize} color={color} textStyle={{ fontFamily: family, lineHeight: lh }} />
    : <Text style={{ fontSize, color, fontFamily: family, lineHeight: lh }}>{plain}</Text>;
  if (!img) return body;
  return (
    <View>
      {hasText ? body : null}
      <Image source={{ uri: img }} style={[s.diagram, { height: imgHeight, marginTop: hasText ? 8 : 0 }]} resizeMode="contain" />
    </View>
  );
}

/**
 * The frame itself.
 *
 * `options` are `{ id, key, label }` — `id` is whatever the caller answers by
 * (a letter for the offline bank, an optionId for the DB-backed tests), so this
 * component never needs to know which.
 *
 * `children` render after `nav-actions`, which is where both callers put their
 * modals (palette sheet, submit guard).
 */
export function TimedTestFrame({
  onClose,
  secondsLeft, onSubmit,
  progressText, badgeText,
  bannerText,
  questionHtml,
  options = [], selectedId, onSelect,
  onClear,                                   // null/undefined → the row stays empty
  onPrev, prevDisabled = false,
  onMenu,
  onNext, nextLabel = 'Next →', nextDisabled = false,
  children,
}) {
  const low = secondsLeft != null && secondsLeft <= 60;
  return (
    <View style={s.wrap}>
      {/* `test-header` — 56 hug (12 · 32 · 12), space-between. */}
      <View style={s.header}>
        <Pressable hitSlop={14} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close test">
          <X size={14} color={TT.ink} strokeWidth={2} />
        </Pressable>
        <View style={s.headerRight}>
          {/* `timer-badge` — 29 tall, radius 12, cyan at 6.27% behind a full-strength
              edge. Under a minute it swaps to red; that state isn't in the frame, so
              it reuses the same recipe rather than inventing a treatment. */}
          <View style={[s.timerBadge, low && { backgroundColor: TT.redSoft, borderColor: TT.red }]}>
            <Clock size={12} color={low ? TT.red : TT.cyan} strokeWidth={2} />
            <Text style={[s.timerTxt, low && { color: TT.red }]}>{fmtClock(secondsLeft)}</Text>
          </View>
          <Pressable style={s.submitBtn} onPress={onSubmit} accessibilityRole="button">
            <Text style={s.submitLbl}>Submit</Text>
          </Pressable>
        </View>
      </View>

      {/* `info-strip` — space-between, 12 below. */}
      <View style={s.infoStrip}>
        <Text style={s.qProgress}>{progressText}</Text>
        {!!badgeText && (
          <View style={s.infoBadge}><Text style={s.infoBadgeTxt}>{badgeText}</Text></View>
        )}
      </View>

      {/* `context-banner` */}
      {!!bannerText && (
        <View style={s.banner}>
          <Text style={s.bannerTxt} numberOfLines={2}>{bannerText}</Text>
        </View>
      )}

      {/* flex:1 so `nav-actions` stays pinned — an unbounded ScrollView sizes to its
          content and would push the buttons off a long question. */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* `question-area` — 16 above and below. */}
        <View style={s.questionArea}>
          <Rich value={questionHtml} fontSize={15} lineHeight={22} color={TT.ink} family={TTF.head} imgHeight={170} />
        </View>

        {/* `options-stack` — 8 between cards. */}
        <View style={s.opts}>
          {options.map((o) => {
            const active = selectedId != null && String(selectedId) === String(o.id);
            return (
              <Pressable
                key={o.id}
                onPress={() => onSelect && onSelect(o.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`Option ${o.key}`}
                style={[s.opt, active && { borderColor: TT.cyan, backgroundColor: TT.cyanPick }]}
              >
                <View style={[s.letterBadge, active && { backgroundColor: TT.cyan }]}>
                  <Text style={[s.letterTxt, active && { color: TT.onBright }]}>{o.key}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Rich value={o.label} fontSize={14} lineHeight={18} color={TT.ink} family={TTF.reg} imgHeight={92} />
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* `clear-action` — 12 above, 16 below, left aligned (the frame lists no
            justify, so it keeps the default). The row holds its height whether or
            not there is an answer to clear, so the options never shift under a tap. */}
        <View style={s.clearRow}>
          {!!onClear && (
            <Pressable hitSlop={8} onPress={onClear} accessibilityRole="button">
              <Text style={s.clearTxt}>Clear Answer</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* `nav-actions` — Previous · hamburger · Next split 156 · 42 · 156 on gap 8. */}
      <View style={s.navActions}>
        <Pressable style={[s.prevBtn, prevDisabled && s.btnOff]} disabled={prevDisabled} onPress={onPrev}
          accessibilityRole="button">
          <Text style={s.prevLbl}>← Previous</Text>
        </Pressable>
        <Pressable style={s.hamburger} onPress={onMenu} accessibilityRole="button" accessibilityLabel="Question palette">
          <Menu size={18} color={TT.ink} strokeWidth={2} />
        </Pressable>
        <Pressable style={[s.nextBtn, nextDisabled && s.btnOff]} disabled={nextDisabled} onPress={onNext}
          accessibilityRole="button">
          <Text style={s.nextLbl}>{nextLabel}</Text>
        </Pressable>
      </View>

      {children}
    </View>
  );
}

// ─── Modal furniture ──────────────────────────────────────────────────────────
// The frame draws no palette sheet and no submit guard, so these are built from
// the tokens above — shared for the same reason the frame is.

export const TTScrim = ({ onPress, children }) => (
  onPress
    ? <Pressable style={s.scrim} onPress={onPress}>{children}</Pressable>
    : <View style={s.scrim}>{children}</View>
);

export const TTSheet = ({ children }) => <Pressable style={s.sheet} onPress={() => {}}>{children}</Pressable>;
export const TTTitle = ({ children }) => <Text style={s.sheetTitle}>{children}</Text>;
export const TTSub = ({ children }) => <Text style={s.sheetSub}>{children}</Text>;

/**
 * `finish-test-dialog-dark` — the guard Submit opens, shared so both runners ask
 * the same question the same way.
 *
 * The backdrop is OPAQUE, not a see-through scrim. The frame's `blurred-underlay`
 * leaves the test screen unreadable behind `dim-bg`, so this paints the composited
 * result (canvas under #000 @50% × 60% ≈ #080625) instead of layering it. That is
 * also what makes the missing backdrop blur a non-issue — expo-blur isn't installed,
 * but with nothing showing through there is nothing left to blur, and the dialog can
 * keep the frame's exact 75.29% fill.
 *
 * Outfit 800 lands on Poppins 700 — the heaviest Poppins App.js loads.
 *
 * `modal-wrapper` lists no vertical alignment, which in Figma means top. It is
 * centred here instead, which is where the frame renders it.
 */
export function TTConfirmDialog({
  visible, title, body, confirmLabel, cancelLabel = 'Keep Going', onConfirm, onCancel,
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      {/* `dim-bg` — #000 at 50% behind a 60% layer, plus `modal-wrapper`'s 20 pad. */}
      <View style={s.dialogScrim}>
        {/* `dialog-box` — 362 wide, Hug 246 (24 · 80 text · 24 gap · 94 buttons · 24). */}
        <View style={s.dialogBox}>
          {/* `dialog-text` — gap 12, both lines centred. */}
          <View style={s.dialogText}>
            <Text style={s.dialogTitle}>{title}</Text>
            <Text style={s.dialogBody}>{body}</Text>
          </View>
          {/* `dialog-buttons` — STACKED, gap 10, each Fill 314. Finish sits above
              Keep Going, which is the order the frame lists them in. */}
          <View style={s.dialogButtons}>
            <Pressable style={s.finishBtn} onPress={onConfirm} accessibilityRole="button">
              <Text style={s.finishLbl}>{confirmLabel}</Text>
            </Pressable>
            <Pressable style={s.keepBtn} onPress={onCancel} accessibilityRole="button">
              <Text style={s.keepLbl}>{cancelLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/** A question-palette grid. `items` = [{ key, label, answered, current }]. */
export const TTGrid = ({ items, onPick }) => (
  <ScrollView contentContainerStyle={s.grid}>
    {items.map((it, i) => (
      <Pressable key={it.key} onPress={() => onPick(i)}
        style={[s.cell, it.answered && s.cellDone, it.current && s.cellCur]}>
        <Text style={[s.cellTxt, (it.answered || it.current) && { color: TT.onBright }]}>{it.label}</Text>
      </Pressable>
    ))}
  </ScrollView>
);

export const TTLegend = ({ items }) => (
  <View style={s.legendRow}>
    {items.map((it) => (
      <View key={it.label} style={s.legendItem}>
        <View style={[s.legendSwatch, { backgroundColor: it.color }]} />
        <Text style={s.legendTxt}>{it.label}</Text>
      </View>
    ))}
  </View>
);

const s = StyleSheet.create({
  // `content-wrapper` — padded 16 left/right; every block below Fills its 370.
  wrap: { flex: 1, paddingHorizontal: 16 },

  // ── `test-header` ──
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  // `timer-badge` — 29 tall (6 · 17 · 6), radius 12, gap 6.
  timerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 12, borderWidth: 1,
    borderColor: TT.cyan, backgroundColor: TT.cyanSoft, paddingVertical: 6, paddingHorizontal: 12,
  },
  timerTxt: { fontSize: 13, lineHeight: 17, fontFamily: TTF.bold, color: TT.cyan },
  // `submit-btn` — 28 tall (6 · 16 · 6), radius 8, a flat cyan.
  submitBtn: { borderRadius: 8, backgroundColor: TT.cyan, paddingVertical: 6, paddingHorizontal: 14 },
  submitLbl: { fontSize: 12, lineHeight: 16, fontFamily: TTF.bold, color: TT.onBright },

  // ── `info-strip` ──
  infoStrip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, minHeight: 34 },
  qProgress: { fontSize: 13, lineHeight: 17, fontFamily: TTF.semi, color: TT.sub },
  // `section-badge` — 22 tall (4 · 14 · 4), radius 6.
  infoBadge: {
    borderRadius: 6, borderWidth: 1, borderColor: TT.violet, backgroundColor: TT.violetSoft,
    paddingVertical: 4, paddingHorizontal: 8,
  },
  infoBadgeTxt: { fontSize: 11, lineHeight: 14, fontFamily: TTF.semi, color: TT.violet },

  // ── `context-banner` ──
  // padding 11 + a 1px border, not 12 + 0: the frame's strokes are INNER-aligned so
  // its 12 padding is measured from the edge with the stroke drawn inside it. RN
  // puts borders outside the padding box, so 12 + 1 would render a 58-tall banner.
  banner: { borderRadius: 12, borderWidth: 1, borderColor: TT.amberEdge, backgroundColor: TT.amberSoft, padding: 11 },
  bannerTxt: { fontSize: 12, lineHeight: 16, fontFamily: TTF.reg, color: TT.amber },

  // ── question + options ──
  questionArea: { paddingTop: 16, paddingBottom: 16, gap: 12 },
  diagram: { width: '100%', borderRadius: 8, backgroundColor: '#FFFFFF' },
  opts: { gap: 8 },
  // `option-card` — 56 hug (14 · 28 badge · 14), radius 16, gap 12. Padding 13 + a
  // 1px border for the same inner-alignment reason as the banner.
  opt: {
    flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1,
    borderColor: TT.hair, backgroundColor: TT.card, padding: 13,
  },
  // `letter-badge` — a 28 rounded SQUARE at radius 8, not a circle.
  letterBadge: { width: 28, height: 28, borderRadius: 8, backgroundColor: TT.hair, alignItems: 'center', justifyContent: 'center' },
  letterTxt: { fontSize: 13, lineHeight: 16, fontFamily: TTF.head, color: TT.ink },

  // ── `clear-action` ──
  clearRow: { height: 45, paddingTop: 12, paddingBottom: 16, justifyContent: 'center' },
  clearTxt: { fontSize: 13, lineHeight: 17, fontFamily: TTF.semi, color: TT.sub },

  // ── `nav-actions` ──
  navActions: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 20 },
  prevBtn: {
    flex: 1, height: 41, borderRadius: 12, borderWidth: 1, borderColor: TT.hair,
    backgroundColor: TT.card, alignItems: 'center', justifyContent: 'center',
  },
  prevLbl: { fontSize: 13, lineHeight: 17, fontFamily: TTF.bold, color: TT.sub },
  nextBtn: { flex: 1, height: 41, borderRadius: 12, backgroundColor: TT.violet, alignItems: 'center', justifyContent: 'center' },
  nextLbl: { fontSize: 13, lineHeight: 17, fontFamily: TTF.bold, color: TT.ink },
  // `hamburger-menu` — 42 square (12 · 18 icon · 12), radius 12.
  hamburger: {
    width: 42, height: 42, borderRadius: 12, borderWidth: 1, borderColor: TT.hair,
    backgroundColor: TT.card, alignItems: 'center', justifyContent: 'center',
  },
  btnOff: { opacity: 0.4 },

  // ── sheets ──
  scrim: { flex: 1, backgroundColor: TT.scrim, alignItems: 'center', justifyContent: 'center', padding: 24 },
  sheet: { width: '100%', maxHeight: '76%', backgroundColor: TT.card, borderRadius: 16, borderWidth: 1, borderColor: TT.hair, padding: 16, gap: 4 },
  sheetTitle: { fontSize: 15, lineHeight: 22, fontFamily: TTF.head, color: TT.ink },
  sheetSub: { fontSize: 12, lineHeight: 18, fontFamily: TTF.reg, color: TT.sub },

  // ── `finish-test-dialog-dark` ──
  // `modal-wrapper` pads 20. The backdrop is OPAQUE: the frame renders the test
  // screen behind it as unreadable, so this is the canvas with `dim-bg`'s #000 @50%
  // under a 60% layer already composited in — #0C0936 × 0.7 ≈ #080625. Painting the
  // result rather than layering it is also what removes the need for a backdrop
  // blur: with nothing showing through, there is nothing left to blur.
  dialogScrim: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#080625' },
  // `dialog-box` — radius 24, padding 23 + a 1px inner-aligned border, gap 24.
  // The frame's exact 75.29% is safe now: it sits on the flat backdrop above, so
  // there is no card edge behind it to bleed through and read as a rendering fault.
  dialogBox: {
    width: '100%', maxWidth: 362, borderRadius: 24, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.0824)',    // #FFFFFF @ 8.24%
    backgroundColor: 'rgba(17,19,28,0.7529)',   // #11131C @ 75.29%
    padding: 23, gap: 24,
    shadowColor: '#000000', shadowOpacity: 0.3137, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 12,
  },
  // `dialog-text` — Hug 80 (28 title · 12 gap · 40 body).
  dialogText: { gap: 12 },
  // Outfit 800 → Poppins 700, the heaviest face App.js loads.
  dialogTitle: { fontSize: 22, lineHeight: 28, fontFamily: TTF.head, color: TT.ink, textAlign: 'center' },
  dialogBody: { fontSize: 14, lineHeight: 20, fontFamily: TTF.reg, color: TT.sub, textAlign: 'center' },
  // `dialog-buttons` — Hug 94 (42 · 10 gap · 42), stacked.
  dialogButtons: { gap: 10 },
  // `finish-btn` — 42 tall (12 · 18 · 12), radius 12, flat violet under its own glow.
  finishBtn: {
    height: 42, borderRadius: 12, backgroundColor: TT.violet, alignItems: 'center', justifyContent: 'center',
    shadowColor: TT.violet, shadowOpacity: 0.1451, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  finishLbl: { fontSize: 14, lineHeight: 18, fontFamily: TTF.bold, color: TT.ink },
  // `keep-going-btn` — same box, no fill, a 6.27% edge. Padding 12 + 1px inner border.
  keepBtn: {
    height: 42, borderRadius: 12, borderWidth: 1, borderColor: TT.hair,
    alignItems: 'center', justifyContent: 'center',
  },
  keepLbl: { fontSize: 14, lineHeight: 18, fontFamily: TTF.bold, color: TT.sub },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 12 },
  cell: { width: 42, height: 42, borderRadius: 12, borderWidth: 1, borderColor: TT.hair, backgroundColor: TT.canvas, alignItems: 'center', justifyContent: 'center' },
  cellDone: { backgroundColor: TT.cyan, borderColor: TT.cyan },
  cellCur: { backgroundColor: TT.violet, borderColor: TT.violet },
  cellTxt: { fontSize: 13, lineHeight: 17, fontFamily: TTF.semi, color: TT.sub },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, paddingTop: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: { width: 12, height: 12, borderRadius: 4, borderWidth: 1, borderColor: TT.hair },
  legendTxt: { fontSize: 11, lineHeight: 14, fontFamily: TTF.reg, color: TT.sub },

  // ── empty ──
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptySub: { fontSize: 13, fontFamily: TTF.reg, color: TT.sub, textAlign: 'center' },
});

export const ttStyles = s;
