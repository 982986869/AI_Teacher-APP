// "Your learning" — the transparency layer for the AI Teacher's memory. It shows
// the student exactly what Ms. Nova remembers about them (per-concept mastery, weak
// spots, revision-due, strengths) — the same profile that now personalises every
// generated lesson (see server ai.service.generateLesson → learnerLine). Showing it
// back builds trust and gives the student a sense of a teacher who actually knows
// them. Graphite + Marigold + serif, matching the live teaching player.
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { X, Brain, TrendingUp, RotateCcw, Sparkles, Flame, SlidersHorizontal } from 'lucide-react-native';

import { PressableScale } from './uiKit';
import { D, C, F, SP, R, SERIF } from './premiumTheme';
import { getLearningProfile, getLearningAnalytics } from '../../api/learningApi';
import { loadLearnerPrefs, saveLearnerPrefs, EXPLANATION_STYLES, PACES, DEFAULT_PREFS } from '../../utils/learnerPrefs';

const GOLD = '#DBA53F';
const GOLD_DIM = '#B4863A';

// mastery % → a warm/cool bar colour
const barColor = (m) => (m >= 75 ? '#2DBB78' : m >= 45 ? GOLD : '#E9A23B');

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
        <View style={s.sectionHead}><Icon size={15} color={GOLD} strokeWidth={2.3} /><Text style={s.sectionTitle}>{title}</Text></View>
        <Text style={s.sectionEmpty}>{empty}</Text>
      </View>
    ) : null;
  }
  return (
    <View style={s.section}>
      <View style={s.sectionHead}><Icon size={15} color={GOLD} strokeWidth={2.3} /><Text style={s.sectionTitle}>{title}</Text></View>
      {!!subtitle && <Text style={s.sectionSub}>{subtitle}</Text>}
      {items.map((c) => <ConceptRow key={c.conceptId || c.concept} c={c} />)}
    </View>
  );
}

export default function YourLearning({ visible, onClose }) {
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
      <View style={s.wrap}>
        <View style={s.head}>
          <View>
            <Text style={s.title}>Your learning</Text>
            <Text style={s.subtitle}>What Ms. Nova remembers about you</Text>
          </View>
          <PressableScale onPress={onClose} style={s.x} accessibilityLabel="Close"><X size={20} color={D.textDim} strokeWidth={2.3} /></PressableScale>
        </View>

        {loading && <View style={s.center}><ActivityIndicator color={GOLD} /><Text style={s.loadTxt}>Loading your profile…</Text></View>}
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
              <View style={s.sectionHead}><SlidersHorizontal size={15} color={GOLD} strokeWidth={2.3} /><Text style={s.sectionTitle}>How you like to learn</Text></View>
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
              <TextInput style={s.prefInput} value={prefs.goal} onChangeText={(t) => setPref({ goal: t })} placeholder="e.g. Crack JEE 2027, or just understand the basics" placeholderTextColor={D.textFaint} maxLength={120} accessibilityLabel="Your long-term goal" />

              <Text style={s.prefLbl}>Exam date (optional)</Text>
              <TextInput style={s.prefInput} value={prefs.examDate} onChangeText={(t) => setPref({ examDate: t })} placeholder="e.g. March 2027" placeholderTextColor={D.textFaint} maxLength={40} accessibilityLabel="Your exam date" />
            </View>

            {cold ? (
              <View style={s.coldBox}>
                <Brain size={34} color={GOLD_DIM} strokeWidth={1.6} />
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
                    {streak > 0 && <View style={s.heroStat}><View style={s.streakRow}><Flame size={15} color={GOLD} strokeWidth={2.3} /><Text style={s.heroStatNum}>{streak}</Text></View><Text style={s.heroStatLbl}>day streak</Text></View>}
                  </View>
                </View>

                <View style={s.adaptNote}>
                  <Sparkles size={13} color={GOLD} strokeWidth={2.3} />
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
  wrap: { flex: 1, backgroundColor: '#0E1014', paddingHorizontal: SP.lg, paddingTop: 52, paddingBottom: SP.md },
  head: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: SP.lg },
  title: { fontSize: 26, fontFamily: SERIF, fontWeight: '600', color: D.text, letterSpacing: 0.2 },
  subtitle: { fontSize: 13, fontFamily: F.med, color: D.textDim, marginTop: 3 },
  x: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: SP.lg },
  loadTxt: { fontSize: 13, fontFamily: F.med, color: D.textDim },
  errTxt: { fontSize: 14, fontFamily: F.med, color: D.textDim, textAlign: 'center' },
  retry: { backgroundColor: GOLD, borderRadius: R.pill, paddingVertical: 11, paddingHorizontal: 26 },
  retryTxt: { fontSize: 14, fontFamily: F.bold, color: '#12141A' },
  coldBox: { alignItems: 'center', gap: 8, marginTop: SP.xl, paddingHorizontal: SP.md },
  coldTitle: { fontSize: 19, fontFamily: SERIF, fontWeight: '600', color: D.text, marginTop: 6 },
  coldTxt: { fontSize: 14, fontFamily: F.med, color: D.textDim, textAlign: 'center', lineHeight: 21 },

  prefLbl: { fontSize: 11, fontFamily: F.semi, color: D.textDim, letterSpacing: 0.4, marginTop: SP.md, marginBottom: 8 },
  prefChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  prefChip: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: R.pill, paddingVertical: 8, paddingHorizontal: 15 },
  prefChipOn: { backgroundColor: GOLD, borderColor: GOLD },
  prefChipTxt: { fontSize: 13, fontFamily: F.semi, color: D.textDim },
  prefChipTxtOn: { color: '#12141A', fontFamily: F.bold },
  prefInput: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: R.md, paddingVertical: 11, paddingHorizontal: 14, color: D.text, fontSize: 14, fontFamily: F.med },

  hero: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: R.xl, padding: SP.lg, gap: SP.lg },
  heroMain: { alignItems: 'center' },
  heroNum: { fontSize: 46, fontFamily: SERIF, fontWeight: '600', color: GOLD, letterSpacing: -0.5 },
  heroPct: { fontSize: 22, color: GOLD_DIM },
  heroLbl: { fontSize: 10.5, fontFamily: F.semi, color: D.textDim, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: -2 },
  heroStats: { flex: 1, gap: 14 },
  heroStat: {},
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroStatNum: { fontSize: 22, fontFamily: F.bold, color: D.text },
  heroStatLbl: { fontSize: 11, fontFamily: F.med, color: D.textDim, marginTop: 1 },

  adaptNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(219,165,63,0.08)', borderWidth: 1, borderColor: 'rgba(219,165,63,0.3)', borderRadius: R.md, padding: 12, marginTop: SP.md },
  adaptTxt: { flex: 1, fontSize: 12.5, fontFamily: F.med, color: '#E7D4A6', lineHeight: 18 },

  section: { marginTop: SP.xl },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontFamily: F.bold, color: D.text, letterSpacing: 0.2 },
  sectionSub: { fontSize: 12, fontFamily: F.med, color: D.textDim, marginTop: 3, marginBottom: 4 },
  sectionEmpty: { fontSize: 12.5, fontFamily: F.med, color: D.textFaint, marginTop: 6 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.035)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderRadius: R.lg, paddingVertical: 12, paddingHorizontal: 14, marginTop: 8 },
  rowName: { fontSize: 14.5, fontFamily: F.semi, color: D.text },
  rowChapter: { fontSize: 11.5, fontFamily: F.reg, color: D.textFaint, marginTop: 1 },
  barTrack: { height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.10)', marginTop: 8, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  rowPct: { fontSize: 14, fontFamily: F.bold, minWidth: 40, textAlign: 'right' },
});
