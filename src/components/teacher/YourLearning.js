// "Your learning" — the transparency layer for the AI Teacher's memory, and the sheet
// behind the AI Teacher home's "Customize Coach Settings" link. It shows the student
// exactly what Ms. Nova remembers about them (per-concept mastery, weak spots,
// revision-due, strengths) — the same profile that personalises every generated lesson
// (see server ai.service.generateLesson → learnerLine) — and lets them edit the
// preferences that ride along with it.
//
// LIGHT RESKIN. It used to be the graphite-and-serif sheet that matches the live
// teaching player (#0E1014, Georgia). It opens from the AI Teacher home, which is white
// and set in Inter, so a dark serif sheet sliding up out of it read as a different app.
// It now draws on that page's own tokens (src/theme/aiTeacherTheme.js) — nothing else
// changed: same data, same layout, same preference writes.
//
// Only SP and R still come from premiumTheme; they are plain spacing and radius scales
// with no palette in them. The dark `D`, the Poppins `F` and SERIF are gone.
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Modal, ScrollView, ActivityIndicator, TextInput, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Brain, TrendingUp, RotateCcw, Sparkles, Flame, SlidersHorizontal } from 'lucide-react-native';

import { PressableScale } from './uiKit';
import { SP, R } from './premiumTheme';
import { AIT, AFONT as F } from '../../theme/aiTeacherTheme';
import { getLearningProfile, getLearningAnalytics } from '../../api/learningApi';
import { loadLearnerPrefs, saveLearnerPrefs, EXPLANATION_STYLES, PACES, DEFAULT_PREFS } from '../../utils/learnerPrefs';

// The page's amber accent carries the small glyphs and eyebrows, exactly as it does on
// the AI Teacher home. It is NOT used for text small enough to strain against white —
// filled chips and the big mastery figure take the page's ink instead, which is what its
// own selected teaching-style chip already does.
const ACCENT = AIT.accent;

// mastery % → bar colour. Derived: the design never drew this sheet light, and the old
// dark values (#2DBB78 / #E9A23B) were picked to glow on #0E1014. These are darkened
// until the same hue holds as the small bold percentage beside the bar on white.
const MASTERY = { strong: '#0E9F6E', mid: '#7C3AED', weak: '#C2740B' };
const barColor = (m) => (m >= 75 ? MASTERY.strong : m >= 45 ? MASTERY.mid : MASTERY.weak);

function ConceptRow({ c }) {
  const m = Math.max(0, Math.min(100, Number(c.mastery) || 0));
  return (
    <View style={s.row}>
      <View style={{ flex: 1 }}>
        <Text style={s.rowName} numberOfLines={1}>{c.concept}</Text>
        {!!c.chapter && <Text style={s.rowChapter} numberOfLines={1}>{c.chapter}</Text>}
        <View style={s.barTrack}><View style={[s.barFill, { width: `${m}%`, backgroundColor: barColor(m) }]} /></View>
      </View>
      <Text style={[s.rowPct, { color: barColor(m) }]}>{m}%</Text>
    </View>
  );
}

function Section({ Icon, title, subtitle, items, empty }) {
  if (!items || items.length === 0) {
    return empty ? (
      <View style={s.section}>
        <View style={s.sectionHead}><Icon size={15} color={ACCENT} strokeWidth={2.3} /><Text style={s.sectionTitle}>{title}</Text></View>
        <Text style={s.sectionEmpty}>{empty}</Text>
      </View>
    ) : null;
  }
  return (
    <View style={s.section}>
      <View style={s.sectionHead}><Icon size={15} color={ACCENT} strokeWidth={2.3} /><Text style={s.sectionTitle}>{title}</Text></View>
      {!!subtitle && <Text style={s.sectionSub}>{subtitle}</Text>}
      {items.map((c) => <ConceptRow key={c.conceptId || c.concept} c={c} />)}
    </View>
  );
}

export default function YourLearning({ visible, onClose }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [profile, setProfile] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);

  const load = useCallback(async () => {
    setLoading(true); setErr('');
    setPrefs(await loadLearnerPrefs());
    try {
      const [p, a] = await Promise.all([
        getLearningProfile().catch(() => null),
        getLearningAnalytics().catch(() => null),
      ]);
      setProfile(p); setAnalytics(a);
      if (!p) setErr('Could not load your learning right now.');
    } catch (e) { setErr(e?.message || 'Could not load your learning right now.'); }
    setLoading(false);
  }, []);
  useEffect(() => { if (visible) load(); }, [visible, load]);

  // Edit a preference → update state + persist immediately (rides along with the next lesson).
  const setPref = (patch) => setPrefs((prev) => { const next = { ...prev, ...patch }; saveLearnerPrefs(next); return next; });

  const total = profile?.totalConcepts || 0;
  const avg = profile?.averageMastery ?? 0;
  const streak = analytics?.streak ?? analytics?.currentStreak ?? 0;
  const cold = !loading && !err && total === 0;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      {/* Was a hardcoded 52pt top pad for the dark sheet. On the light one the real inset
          is used, so the title does not sit under the clock on a notched phone. */}
      <View style={[s.wrap, { paddingTop: Math.max(insets.top, 16) + 8, paddingBottom: Math.max(insets.bottom, SP.md) }]}>
        {visible && <StatusBar barStyle="dark-content" backgroundColor={AIT.bg} />}
        <View style={s.head}>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>Your learning</Text>
            <Text style={s.subtitle}>What Ms. Nova remembers about you</Text>
          </View>
          <PressableScale onPress={onClose} style={s.x} accessibilityLabel="Close"><X size={20} color={AIT.inkSoft} strokeWidth={2.3} /></PressableScale>
        </View>

        {loading && <View style={s.center}><ActivityIndicator color={AIT.ink} /><Text style={s.loadTxt}>Loading your profile…</Text></View>}
        {!!err && !loading && (
          <View style={s.center}>
            <Text style={s.errTxt}>{err}</Text>
            <PressableScale style={s.retry} onPress={load}><Text style={s.retryTxt}>Try again</Text></PressableScale>
          </View>
        )}

        {!loading && !err && (
          <ScrollView contentContainerStyle={{ paddingBottom: SP.xxl }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* ── Preferences — how the student likes to learn (edited here, sent with
                 every lesson so it adapts) ── */}
            <View style={s.section}>
              <View style={s.sectionHead}><SlidersHorizontal size={15} color={ACCENT} strokeWidth={2.3} /><Text style={s.sectionTitle}>How you like to learn</Text></View>
              <Text style={s.sectionSub}>Your lessons adapt to these</Text>

              <Text style={s.prefLbl}>Explanation style</Text>
              <View style={s.prefChips}>
                {EXPLANATION_STYLES.map((o) => {
                  const on = prefs.explanationStyle === o.key;
                  return <PressableScale key={o.key} onPress={() => setPref({ explanationStyle: o.key })} style={[s.prefChip, on && s.prefChipOn]} accessibilityState={{ selected: on }}><Text style={[s.prefChipTxt, on && s.prefChipTxtOn]}>{o.label}</Text></PressableScale>;
                })}
              </View>

              <Text style={s.prefLbl}>Pace</Text>
              <View style={s.prefChips}>
                {PACES.map((o) => {
                  const on = prefs.pace === o.key;
                  return <PressableScale key={o.key} onPress={() => setPref({ pace: o.key })} style={[s.prefChip, on && s.prefChipOn]} accessibilityState={{ selected: on }}><Text style={[s.prefChipTxt, on && s.prefChipTxtOn]}>{o.label}</Text></PressableScale>;
                })}
              </View>

              <Text style={s.prefLbl}>Your goal</Text>
              <TextInput style={s.prefInput} value={prefs.goal} onChangeText={(t) => setPref({ goal: t })} placeholder="e.g. Crack JEE 2027, or just understand the basics" placeholderTextColor={AIT.inkMuted} maxLength={120} accessibilityLabel="Your long-term goal" />

              <Text style={s.prefLbl}>Exam date (optional)</Text>
              <TextInput style={s.prefInput} value={prefs.examDate} onChangeText={(t) => setPref({ examDate: t })} placeholder="e.g. March 2027" placeholderTextColor={AIT.inkMuted} maxLength={40} accessibilityLabel="Your exam date" />
            </View>

            {cold ? (
              <View style={s.coldBox}>
                <Brain size={34} color={ACCENT} strokeWidth={1.6} />
                <Text style={s.coldTitle}>I’m just getting to know you</Text>
                <Text style={s.coldTxt}>As you learn and answer checks, I build a picture of what you know here — and every new lesson quietly adapts to it and your preferences above.</Text>
              </View>
            ) : (
              <>
                <View style={[s.hero, { marginTop: SP.xl }]}>
                  <View style={s.heroMain}>
                    <Text style={s.heroNum}>{avg}<Text style={s.heroPct}>%</Text></Text>
                    <Text style={s.heroLbl}>overall mastery</Text>
                  </View>
                  <View style={s.heroStats}>
                    <View style={s.heroStat}><Text style={s.heroStatNum}>{total}</Text><Text style={s.heroStatLbl}>concepts tracked</Text></View>
                    {streak > 0 && <View style={s.heroStat}><View style={s.streakRow}><Flame size={15} color={ACCENT} strokeWidth={2.3} /><Text style={s.heroStatNum}>{streak}</Text></View><Text style={s.heroStatLbl}>day streak</Text></View>}
                  </View>
                </View>

                <View style={s.adaptNote}>
                  <Sparkles size={13} color={ACCENT} strokeWidth={2.3} />
                  <Text style={s.adaptTxt}>I reinforce your weak spots, refresh what’s due, and teach the way you prefer.</Text>
                </View>

                <Section Icon={TrendingUp} title="Focus areas" subtitle="I’ll reinforce these in your lessons" items={profile?.weak} empty="No weak spots flagged yet." />
                <Section Icon={RotateCcw} title="Due for revision" subtitle="Worth a refresh before it fades" items={profile?.needsRevision} />
                <Section Icon={Brain} title="Strong" subtitle="You’ve got these — I’ll build on them" items={profile?.strong} />
              </>
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: AIT.bg, paddingHorizontal: SP.lg },
  head: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: SP.md, marginBottom: SP.lg },
  title: { fontSize: 24, fontFamily: F.bold, color: AIT.ink, letterSpacing: -0.2 },
  subtitle: { fontSize: 13, fontFamily: F.reg, color: AIT.inkSoft, marginTop: 4 },
  // The AI Teacher home's own round controls: white, 1px edge — not a translucent
  // white fill, which is invisible on a white page.
  x: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: AIT.surface, borderWidth: 1, borderColor: AIT.edge },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: SP.lg },
  loadTxt: { fontSize: 13, fontFamily: F.med, color: AIT.inkSoft },
  errTxt: { fontSize: 14, fontFamily: F.med, color: AIT.inkSoft, textAlign: 'center' },
  retry: { backgroundColor: AIT.chipOnBg, borderRadius: R.pill, paddingVertical: 12, paddingHorizontal: 28 },
  retryTxt: { fontSize: 14, fontFamily: F.bold, color: AIT.chipOnInk },
  coldBox: { alignItems: 'center', gap: 8, marginTop: SP.xl, paddingHorizontal: SP.md },
  coldTitle: { fontSize: 18, fontFamily: F.bold, color: AIT.ink, marginTop: 6 },
  coldTxt: { fontSize: 14, fontFamily: F.reg, color: AIT.inkSoft, textAlign: 'center', lineHeight: 21 },

  prefLbl: { fontSize: 11, fontFamily: F.semi, color: AIT.inkMuted, letterSpacing: 0.6, textTransform: 'uppercase', marginTop: SP.md, marginBottom: 8 },
  prefChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  // Deliberately identical to the teaching-style chips on the AI Teacher home
  // (sections/TeachingStyle.js): filled ink when on, outlined white when off.
  prefChip: { backgroundColor: AIT.chipOffBg, borderWidth: 1, borderColor: AIT.chipEdge, borderRadius: R.pill, paddingVertical: 9, paddingHorizontal: 15 },
  prefChipOn: { backgroundColor: AIT.chipOnBg, borderColor: AIT.chipOnBg },
  prefChipTxt: { fontSize: 13, fontFamily: F.semi, color: AIT.chipOffInk },
  prefChipTxtOn: { color: AIT.chipOnInk, fontFamily: F.bold },
  prefInput: { backgroundColor: AIT.field, borderWidth: 1, borderColor: AIT.edge, borderRadius: R.md, paddingVertical: 12, paddingHorizontal: 14, color: AIT.ink, fontSize: 14, fontFamily: F.med },

  hero: { flexDirection: 'row', alignItems: 'center', backgroundColor: AIT.surface, borderWidth: 1, borderColor: AIT.surfaceEdge, borderRadius: R.xl, padding: SP.lg, gap: SP.lg },
  heroMain: { alignItems: 'center' },
  // F.bold, not F.xbold: App.js loads Inter 400/500/600/700 app-wide, and the 800 is
  // registered only by AITeacherHome's own useInterFonts. Leaning on that would make
  // this number silently fall back to the system face if the sheet ever opened from
  // anywhere else.
  heroNum: { fontSize: 44, fontFamily: F.bold, color: AIT.ink, letterSpacing: -1 },
  heroPct: { fontSize: 22, color: AIT.inkMuted },
  heroLbl: { fontSize: 10.5, fontFamily: F.semi, color: AIT.inkMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: -2 },
  heroStats: { flex: 1, gap: 14 },
  heroStat: {},
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroStatNum: { fontSize: 22, fontFamily: F.bold, color: AIT.ink },
  heroStatLbl: { fontSize: 11, fontFamily: F.med, color: AIT.inkSoft, marginTop: 1 },

  // The one tinted panel on the sheet — the pale yellow the home already uses behind its
  // search sparkle, so the accent appears as a wash rather than as unreadable small text.
  adaptNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: AIT.sparkleChip, borderRadius: R.md, padding: 12, marginTop: SP.md },
  adaptTxt: { flex: 1, fontSize: 12.5, fontFamily: F.med, color: AIT.ink, lineHeight: 18 },

  section: { marginTop: SP.xl },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontFamily: F.bold, color: AIT.ink, letterSpacing: -0.1 },
  sectionSub: { fontSize: 12, fontFamily: F.reg, color: AIT.inkSoft, marginTop: 3, marginBottom: 4 },
  sectionEmpty: { fontSize: 12.5, fontFamily: F.med, color: AIT.inkMuted, marginTop: 6 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: AIT.surface, borderWidth: 1, borderColor: AIT.surfaceEdge, borderRadius: R.lg, paddingVertical: 12, paddingHorizontal: 14, marginTop: 8 },
  rowName: { fontSize: 14.5, fontFamily: F.semi, color: AIT.ink },
  rowChapter: { fontSize: 11.5, fontFamily: F.reg, color: AIT.inkMuted, marginTop: 1 },
  barTrack: { height: 5, borderRadius: 3, backgroundColor: AIT.track, marginTop: 8, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  rowPct: { fontSize: 14, fontFamily: F.bold, minWidth: 40, textAlign: 'right' },
});
