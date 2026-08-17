// timedTestDark.js
// The timed-test frame, as one component the whole app renders.
//
// Online tests reach the student down two different code paths â€” Class 6/7/8/9 run
// the DB-backed testpapers inside OnlineTestScreen, every other class runs the
// offline bank through TestQuestionScreen â€” and the two grade, time and submit
// differently enough that merging them would be a real regression risk (per-question
// timing, optionId vs letter answers, server submit shape). What they must NOT
// differ on is the pixels. So the state and the grading stay in each screen and the
// entire visual frame lives here, rendered by both.
//
// Frame, top to bottom:
//   test-header (Exit Â· progress Â· timer) â†’ section tabs â†’ question â†’ rule line â†’
//   options â†’ clear-action â†’ nav-actions (Prev Â· palette Â· Next)
// It draws neither the OS status bar nor the app's bottom nav; both are already real
// on these screens (SafeAreaView and FloatingDock).
//
// SUBMIT: the header no longer carries it â€” the design's header is Exit Â· progress Â·
// timer and nothing else. It moved into the question-palette sheet (TTSheetButton),
// which the palette button in nav-actions opens from every question, so it stays as
// reachable as it was. Dropping it outright would have stranded OnlineTestScreen,
// whose Next is disabled on the last question: the header was its ONLY way to submit.

import React from 'react';
import { View, Text, Image, ScrollView, Pressable, StyleSheet, Modal } from 'react-native';
import { LayoutGrid } from 'lucide-react-native';
import { COLORS as DS, FONT_FAMILY } from '../theme/designSystem';
import MathText from './MathText';
import { hasMath, htmlToPlain, firstImg, stripImages } from '../utils/mathHtml';

// â”€â”€â”€ Palette â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Violet-forward: one accent carries the active section, the chosen option, the
// palette's current cell and Next, so "this is where you are" reads as one idea.
export const TT = {
  // ⚠ Was the dark timed-test palette; now the Cuemath light system. Keys are
  // preserved so the runner's ~40 call sites keep working, which means two names
  // now lie: TT.cyan is the YELLOW accent and TT.violet is the DARK button ink.
  // TT.onBright is the ink that sits on top of a yellow fill.
  canvas: DS.background,                // #FFFFFF
  card: DS.surface,                     // #F5F5F5 — option card, Previous, hamburger
  hair: DS.border,                      // every resting edge

  ink: DS.textPrimary,                  // #111111
  sub: DS.textSecondary,                // #666666
  onBright: '#111111',                  // a label sitting on a yellow fill

  // Timer badge + the picked option. Yellow is a FILL here, never text.
  cyan: DS.primary,                     // #FFC629
  cyanSoft: '#FFF4CC',
  cyanPick: '#FFEBA6',

  violet: DS.ink,                       // Next / info — dark, per the system
  violetSoft: '#F0F0F0',

  amber: '#8A6A00',                     // context banner text — darkened to pass
  amberSoft: '#FFF9E6',
  amberEdge: '#FFE9A8',

  red: DS.error,                        // under a minute
  redSoft: '#FDECEA',

  scrim: 'rgba(17,17,17,0.45)',
};

export const TTF = {
  head: FONT_FAMILY.display,        // Poppins_700Bold
  bold: FONT_FAMILY.interBold,      // Inter_700Bold
  semi: FONT_FAMILY.interSemibold,  // Inter_600SemiBold
  reg: FONT_FAMILY.interRegular,    // Inter_400Regular
};

// HH:MM:SS â€” an online test runs 60â€“180 minutes, so M:SS would read "97:14" and
// lose the hour at a glance.
export const fmtClock = (s) => {
  const t = Math.max(0, Math.floor(s || 0));
  const p = (n) => String(n).padStart(2, '0');
  return `${p(Math.floor(t / 3600))}:${p(Math.floor((t % 3600) / 60))}:${p(t % 60)}`;
};

/**
 * Question / option / banner content. Real math ({tex}â€¦{/tex}, $â€¦$, \(â€¦\)) goes to
 * MathText; everything else renders as Text â€” MathJaxSvg splits a plain string into
 * one <Text> per HTML node inside a wrapping row, which costs the screen its line
 * height for no gain when there is no formula to typeset. Both paths run the HTML
 * through mathHtml, so <sup>/<sub> and the caret notation the bank stores
 * ([ML^(5)T^(-2)], H_2O) become real characters instead of raw markup.
 *
 * Diagrams keep a WHITE plate: the source images are black line art, so on the
 * #0C0936 canvas they would otherwise render as an invisible black square.
 */
export function Rich({ value, fontSize = 15, lineHeight, color = TT.ink, family = TTF.reg, imgHeight = 150, align }) {
  if (value == null || !String(value).trim()) return null;
  const raw = String(value);
  const img = firstImg(raw);
  const textPart = stripImages(raw);
  const isMath = hasMath(textPart);
  const plain = isMath ? '' : htmlToPlain(textPart);
  const hasText = isMath ? !!textPart.trim() : plain.length > 0;
  const lh = lineHeight || fontSize * 1.45;
  const body = isMath
    ? <MathText value={textPart} fontSize={fontSize} color={color} textStyle={{ fontFamily: family, lineHeight: lh }} />
    : <Text style={{ fontSize, color, fontFamily: family, lineHeight: lh, textAlign: align }}>{plain}</Text>;
  if (!img) return body;
  return (
    <View>
      {hasText ? body : null}
      <Image source={{ uri: img }} style={[s.diagram, { height: imgHeight, marginTop: hasText ? 8 : 0 }]} resizeMode="contain" />
    </View>
  );
}

// A short, media-free option can sit in the 2-up grid the design shows (numeric and
// one-word answers). Prose, formulas and diagrams would be unreadable in a half-width
// tile, so those fall back to the full-width stack. Measured on the plain text so a
// wrapped <sup> or entity doesn't push a genuinely short answer out of the grid.
const isCompact = (o) => {
  const raw = String(o.label ?? '');
  if (firstImg(raw) || hasMath(raw)) return false;
  return htmlToPlain(raw).trim().length <= 14;
};

/**
 * The frame itself.
 *
 * `options` are `{ id, key, label }` â€” `id` is whatever the caller answers by
 * (a letter for the offline bank, an optionId for the DB-backed tests), so this
 * component never needs to know which.
 *
 * `sections` (optional) = [{ id, label }]. Two or more render the tab row; fewer
 * fall back to `badgeText`, which is what the DB-backed tests use for the per-question
 * mark value since they carry no sections.
 *
 * `children` render after `nav-actions`, which is where both callers put their
 * modals (palette sheet, submit guard).
 */
export function TimedTestFrame({
  onClose,
  secondsLeft,
  progressText, badgeText,
  sections = [], activeSection, onSectionChange,
  bannerText,
  questionHtml,
  options = [], selectedId, onSelect,
  onClear,                                   // null/undefined â†’ the row stays empty
  onPrev, prevDisabled = false,
  onMenu,
  onNext, nextLabel = 'Next', nextDisabled = false,
  children,
}) {
  const low = secondsLeft != null && secondsLeft <= 60;
  const twoUp = options.length === 4 && options.every(isCompact);
  const hasTabs = sections.length > 1;

  return (
    <View style={s.wrap}>
      {/* `test-header` â€” Exit Â· progress Â· timer, over a hairline. */}
      <View style={s.header}>
        <Pressable hitSlop={14} onPress={onClose} accessibilityRole="button" accessibilityLabel="Exit test">
          <Text style={s.exitLbl}>Exit</Text>
        </Pressable>
        <Text style={s.progress}>{progressText}</Text>
        <View style={s.timer}>
          <View style={[s.timerDot, low && { backgroundColor: TT.red }]} />
          <Text style={[s.timerTxt, low && { color: TT.red }]}>{fmtClock(secondsLeft)}</Text>
        </View>
      </View>

      <View style={s.body}>
        {/* Section tabs â€” one per section, or the caller's badge when there are none. */}
        {hasTabs ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.tabsRow}
            style={s.tabsScroll}
          >
            {sections.map((sec) => {
              const on = sec.id === activeSection;
              return (
                <Pressable
                  key={sec.id}
                  onPress={() => onSectionChange && onSectionChange(sec.id)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                  style={[s.tab, on && s.tabOn]}
                >
                  <Text style={[s.tabTxt, on && s.tabTxtOn]}>{sec.label || `Section ${sec.id}`}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : !!badgeText && (
          <View style={s.badgeRow}>
            <View style={s.badge}><Text style={s.badgeTxt}>{badgeText}</Text></View>
          </View>
        )}

        {/* flex:1 so `nav-actions` stays pinned â€” an unbounded ScrollView sizes to its
            content and would push the buttons off a long question. */}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={s.questionArea}>
            {/* Body copy, not a headline — TTF.head is Poppins 700 and set the whole
                stem in heavy display type, which fights the options below it. Carried
                over from origin/main's fix to the frame this replaced. */}
            <Rich value={questionHtml} fontSize={19} lineHeight={27} color={TT.ink} family={TTF.semi} imgHeight={170} />
            {!!bannerText && <Text style={s.ruleTxt}>{bannerText}</Text>}
          </View>

          <View style={twoUp ? s.optsGrid : s.optsStack}>
            {options.map((o) => {
              const active = selectedId != null && String(selectedId) === String(o.id);
              return (
                <Pressable
                  key={o.id}
                  onPress={() => onSelect && onSelect(o.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`Option ${o.key}`}
                  style={[
                    twoUp ? s.optTile : s.optRow,
                    active && { borderColor: TT.violet, backgroundColor: TT.violetSoft },
                  ]}
                >
                  {twoUp ? (
                    <>
                      <Text style={[s.tileLetter, active && { color: TT.pick }]}>{o.key}</Text>
                      <View style={s.tileValue}>
                        <Rich value={o.label} fontSize={26} lineHeight={32} color={TT.ink} family={TTF.head} align="center" imgHeight={60} />
                      </View>
                    </>
                  ) : (
                    <>
                      <View style={[s.letterBadge, active && { backgroundColor: TT.violet }]}>
                        <Text style={[s.letterTxt, active && { color: TT.ink }]}>{o.key}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Rich value={o.label} fontSize={15} lineHeight={20} color={TT.ink} family={TTF.reg} imgHeight={92} />
                      </View>
                    </>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* The row holds its height whether or not there is an answer to clear, so
              the options never shift under a tap. */}
          <View style={s.clearRow}>
            {!!onClear && (
              <Pressable hitSlop={10} onPress={onClear} accessibilityRole="button">
                <Text style={s.clearTxt}>Clear Answer</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>

        {/* `nav-actions` â€” Prev Â· palette Â· Next. */}
        <View style={s.navActions}>
          <Pressable
            style={[s.prevBtn, prevDisabled && s.btnOff]}
            disabled={prevDisabled}
            onPress={onPrev}
            accessibilityRole="button"
            hitSlop={10}
          >
            <Text style={s.prevLbl}>â† Prev</Text>
          </Pressable>

          <Pressable style={s.paletteBtn} onPress={onMenu} accessibilityRole="button" accessibilityLabel="Question palette">
            <LayoutGrid size={20} color={TT.ink} strokeWidth={2} />
          </Pressable>

          <Pressable
            style={[s.nextBtn, nextDisabled && s.btnOff]}
            disabled={nextDisabled}
            onPress={onNext}
            accessibilityRole="button"
          >
            <Text style={s.nextLbl}>{nextLabel} â†’</Text>
          </Pressable>
        </View>
      </View>

      {children}
    </View>
  );
}

// â”€â”€â”€ Modal furniture â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// The centred palette SHEET (TTScrim/TTSheet/TTTitle/TTSub) is gone â€” the palette is
// a full screen now, and it was the only thing those pieces dressed.

/**
 * The guard Submit opens, shared so both runners ask the same question the same way.
 *
 * The backdrop is OPAQUE, not a see-through scrim â€” it paints the composited result
 * (canvas under #000 @50% Ã— 60% â‰ˆ #080625) instead of layering it. That is also what
 * makes the missing backdrop blur a non-issue: with nothing showing through there is
 * nothing left to blur.
 */
export function TTConfirmDialog({
  visible, title, body, confirmLabel, cancelLabel = 'Keep Going', onConfirm, onCancel,
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={s.dialogScrim}>
        <View style={s.dialogBox}>
          <View style={s.dialogText}>
            <Text style={s.dialogTitle}>{title}</Text>
            <Text style={s.dialogBody}>{body}</Text>
          </View>
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

/**
 * The question palette â€” a FULL SCREEN under the same header, not a sheet.
 *
 * `groups` = [{ id, title, note, items: [{ key, label, answered, current }] }]. A
 * group renders its heading only when it has one, so the single-section tests (the
 * DB-backed papers) get a bare grid and the A/B/C mock tests get their sections.
 * Numbering is the caller's: it passes whatever label the student should see, which
 * is the paper-wide number, while `onPick(groupId, indexWithinGroup)` hands back the
 * coordinates the caller actually navigates by.
 *
 * Cell states: current is a violet fill, answered a violet ring, untouched a plain
 * card. That is the whole legend, so the old swatch row is gone â€” three shapes the
 * student can read directly beat a key they have to consult.
 */
export function TTPalette({
  visible,
  onClose,                     // Exit â€” same action as the test header's
  secondsLeft, progressText,
  groups = [],
  activeGroupId,
  onPick,
  onFinish, finishLabel = 'Finish Test',
  onBack,
}) {
  const low = secondsLeft != null && secondsLeft <= 60;
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onBack} transparent={false} statusBarTranslucent>
      <View style={s.paletteRoot}>
        <View style={s.header}>
          <Pressable hitSlop={14} onPress={onClose} accessibilityRole="button" accessibilityLabel="Exit test">
            <Text style={s.exitLbl}>Exit</Text>
          </Pressable>
          <Text style={s.progress}>{progressText}</Text>
          <View style={s.timer}>
            <View style={[s.timerDot, low && { backgroundColor: TT.red }]} />
            <Text style={[s.timerTxt, low && { color: TT.red }]}>{fmtClock(secondsLeft)}</Text>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.paletteBody} showsVerticalScrollIndicator={false}>
          <Text style={s.paletteTitle}>Question Palette</Text>

          {groups.map((g) => (
            <View key={g.id} style={s.group}>
              {!!g.title && (
                <Text style={[s.groupTitle, g.id === activeGroupId && { color: TT.violet }]}>
                  {g.title}{g.note ? ` Â· ${g.note}` : ''}
                </Text>
              )}
              <View style={s.cellRow}>
                {g.items.map((it, i) => (
                  <Pressable
                    key={it.key}
                    onPress={() => onPick && onPick(g.id, i)}
                    accessibilityRole="button"
                    accessibilityLabel={`Question ${it.label}${it.answered ? ', answered' : ''}${it.current ? ', current' : ''}`}
                    style={[s.cell, it.answered && s.cellDone, it.current && s.cellCur]}
                  >
                    <Text style={[s.cellTxt, (it.answered || it.current) && { color: TT.ink }]}>{it.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={s.paletteFoot}>
          <Pressable style={s.finishWide} onPress={onFinish} accessibilityRole="button">
            <Text style={s.finishWideLbl}>{finishLabel}</Text>
          </Pressable>
          <Pressable style={s.backLink} onPress={onBack} accessibilityRole="button" hitSlop={8}>
            <Text style={s.backLinkLbl}>Back to question</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1 },
  body: { flex: 1, paddingHorizontal: 20 },

  // â”€â”€ header â”€â”€
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: TT.hair,
  },
  exitLbl:  { fontSize: 16, lineHeight: 20, fontFamily: TTF.semi, color: TT.sub },
  progress: { fontSize: 15, lineHeight: 20, fontFamily: TTF.bold, color: TT.violet },
  timer:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: TT.red },
  timerTxt: { fontSize: 17, lineHeight: 22, fontFamily: TTF.bold, color: TT.ink },

  // â”€â”€ section tabs â”€â”€
  tabsScroll: { flexGrow: 0, marginHorizontal: -20 },
  tabsRow:    { gap: 10, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 2 },
  tab: {
    height: 52, paddingHorizontal: 24, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: TT.cardSoft, borderWidth: 1, borderColor: TT.hair,
  },
  tabOn:    { backgroundColor: TT.violet, borderColor: TT.violet },
  tabTxt:   { fontSize: 16, lineHeight: 20, fontFamily: TTF.semi, color: TT.sub },
  tabTxtOn: { color: TT.ink, fontFamily: TTF.bold },

  badgeRow: { paddingTop: 16 },
  badge: {
    alignSelf: 'flex-start', borderRadius: 8, borderWidth: 1,
    borderColor: TT.violetEdge, backgroundColor: TT.violetSoft,
    paddingVertical: 6, paddingHorizontal: 12,
  },
  badgeTxt: { fontSize: 12, lineHeight: 16, fontFamily: TTF.semi, color: TT.violet },

  // â”€â”€ question â”€â”€
  questionArea: { paddingTop: 28, paddingBottom: 32 },
  ruleTxt: { fontSize: 15, lineHeight: 21, fontFamily: TTF.reg, color: TT.sub, marginTop: 14 },
  diagram: { width: '100%', borderRadius: 8, backgroundColor: '#FFFFFF' },

  // â”€â”€ options â”€â”€
  optsGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  optTile: {
    width: '48%', flexGrow: 1, minHeight: 128, borderRadius: 18, borderWidth: 1.5,
    borderColor: TT.hair, backgroundColor: TT.card, paddingTop: 12, paddingBottom: 16, paddingHorizontal: 14,
  },
  tileLetter: { fontSize: 14, lineHeight: 18, fontFamily: TTF.semi, color: TT.dim },
  tileValue:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 4 },

  optsStack: { gap: 10 },
  optRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1.5,
    borderColor: TT.hair, backgroundColor: TT.card, padding: 14,
  },
  letterBadge: { width: 30, height: 30, borderRadius: 9, backgroundColor: TT.hair, alignItems: 'center', justifyContent: 'center' },
  letterTxt:   { fontSize: 13, lineHeight: 16, fontFamily: TTF.head, color: TT.sub },

  // â”€â”€ clear â”€â”€
  clearRow: { height: 62, alignItems: 'center', justifyContent: 'center' },
  clearTxt: { fontSize: 15, lineHeight: 20, fontFamily: TTF.semi, color: TT.sub },

  // â”€â”€ nav â”€â”€
  navActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16 },
  prevBtn: { paddingVertical: 10, paddingRight: 16 },
  prevLbl: { fontSize: 17, lineHeight: 22, fontFamily: TTF.semi, color: TT.sub },
  paletteBtn: {
    width: 56, height: 56, borderRadius: 28, borderWidth: 1, borderColor: TT.hair,
    backgroundColor: TT.cardSoft, alignItems: 'center', justifyContent: 'center',
  },
  nextBtn: {
    minWidth: 168, height: 56, borderRadius: 28, backgroundColor: TT.violet,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26,
  },
  nextLbl: { fontSize: 17, lineHeight: 22, fontFamily: TTF.bold, color: TT.ink },
  btnOff:  { opacity: 0.35 },

  // â”€â”€ finish dialog â”€â”€
  dialogScrim: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: TT.canvas },
  dialogBox: {
    width: '100%', maxWidth: 362, borderRadius: 24, borderWidth: 1,
    borderColor: TT.hair,
    backgroundColor: 'rgba(17,19,28,0.7529)',
    padding: 23, gap: 24,
    shadowColor: '#111111', shadowOpacity: 0.10, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 12,
  },
  dialogText: { gap: 12 },
  dialogTitle: { fontSize: 22, lineHeight: 28, fontFamily: TTF.head, color: TT.ink, textAlign: 'center' },
  dialogBody: { fontSize: 14, lineHeight: 20, fontFamily: TTF.reg, color: TT.sub, textAlign: 'center' },
  dialogButtons: { gap: 10 },
  finishBtn: {
    height: 42, borderRadius: 12, backgroundColor: TT.violet, alignItems: 'center', justifyContent: 'center',
    shadowColor: TT.violet, shadowOpacity: 0.1451, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  finishLbl: { fontSize: 14, lineHeight: 18, fontFamily: TTF.bold, color: TT.ink },
  keepBtn: {
    height: 42, borderRadius: 12, borderWidth: 1, borderColor: TT.hair,
    alignItems: 'center', justifyContent: 'center',
  },
  keepLbl: { fontSize: 14, lineHeight: 18, fontFamily: TTF.bold, color: TT.sub },

  // â”€â”€ palette screen â”€â”€
  paletteRoot:  { flex: 1, backgroundColor: TT.canvas },
  paletteBody:  { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 24 },
  paletteTitle: { fontSize: 30, lineHeight: 38, fontFamily: TTF.head, color: TT.ink, letterSpacing: -0.4 },
  group:        { marginTop: 30 },
  groupTitle:   { fontSize: 14, lineHeight: 18, fontFamily: TTF.bold, color: TT.sub, letterSpacing: 0.8, marginBottom: 14 },
  cellRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  // Circles, sized so seven fit a 360-wide screen with the 20 gutters and 10 gaps.
  cell: {
    width: 52, height: 52, borderRadius: 26, borderWidth: 1.5,
    borderColor: TT.hair, backgroundColor: TT.cardSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  cellDone: { borderColor: TT.violet, backgroundColor: 'transparent' },
  cellCur:  { backgroundColor: TT.violet, borderColor: TT.violet },
  cellTxt:  { fontSize: 16, lineHeight: 20, fontFamily: TTF.semi, color: TT.sub },

  paletteFoot:  { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24, gap: 6 },
  finishWide: {
    height: 62, borderRadius: 16, backgroundColor: TT.violet,
    alignItems: 'center', justifyContent: 'center',
  },
  finishWideLbl: { fontSize: 18, lineHeight: 24, fontFamily: TTF.bold, color: TT.ink },
  backLink:      { height: 48, alignItems: 'center', justifyContent: 'center' },
  backLinkLbl:   { fontSize: 16, lineHeight: 20, fontFamily: TTF.semi, color: TT.violet },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptySub: { fontSize: 13, fontFamily: TTF.reg, color: TT.sub, textAlign: 'center' },
});

export const ttStyles = s;
