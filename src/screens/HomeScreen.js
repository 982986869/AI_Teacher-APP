import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, StatusBar, Dimensions, TextInput,
  Platform, KeyboardAvoidingView, Animated,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { ClassPicker } from '../components/ClassPicker';
import AITeacherScreen from './AITeacherScreen';

const { width } = Dimensions.get('window');
const PAD = 16;

// The spinning wheel is NOT a Practice feature — it's a standalone onboarding
// screen (AppNavigator: Onboarding → WorkoutWheel → Home). The Home quick
// actions just route to the matching bottom tab.
const TAB_FOR = { Practice: 'Practice', Resources: 'Resources', Results: 'Results', Sessions: 'Sessions' };

// ─── SVG-style character avatars using View shapes ───────────────────────────
const CHARS = [
  { name: 'The Explorer',  role: 'Curious Learner',  emoji: '🧭', color: '#1C1C1E' },
  { name: 'The Scientist', role: 'Problem Solver',   emoji: '🔬', color: '#333' },
  { name: 'The Artist',    role: 'Creative Thinker', emoji: '🎨', color: '#555' },
  { name: 'The Champion',  role: 'Goal Achiever',    emoji: '🏆', color: '#1C1C1E' },
  { name: 'The Dreamer',   role: 'Big Thinker',      emoji: '💭', color: '#444' },
  { name: 'The Ninja',     role: 'Speed Learner',    emoji: '⚡', color: '#222' },
];

const CharAvatar = ({ char, size = 52 }) => (
  <View style={{
    width: size, height: size, borderRadius: size / 2,
    backgroundColor: '#F0F0F0', borderWidth: 2, borderColor: '#1C1C1E',
    alignItems: 'center', justifyContent: 'center',
  }}>
    <Text style={{ fontSize: size * 0.42 }}>{char.emoji}</Text>
  </View>
);

// ─── Subject Questions Map ────────────────────────────────────────────────────
const SUBJECT_QS = {
  Physics:   ['Explain gravity 🌍', 'Laws of motion?', 'What is velocity?', 'What is energy?'],
  Maths:     ['Solve x²+5x+6=0', 'What is integration?', 'Pythagoras theorem?', 'What is a prime?'],
  Chemistry: ['What is pH?', 'Explain bonding', 'What are isotopes?', 'Periodic table tips?'],
  Biology:   ['How does DNA work?', 'Explain photosynthesis', 'What is osmosis?', 'How do cells divide?'],
  English:   ['Grammar tips?', 'How to write essay?', 'What is metaphor?', 'Improve vocabulary?'],
  History:   ['WW2 causes?', 'Industrial Revolution?', 'Who was Gandhi?', 'French Revolution?'],
};

// ─── Typing dots indicator ────────────────────────────────────────────────────
const TypingDots = () => {
  const anims = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  React.useEffect(() => {
    const animate = (a, delay) => Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(a, { toValue: -6, duration: 300, useNativeDriver: true }),
        Animated.timing(a, { toValue: 0,  duration: 300, useNativeDriver: true }),
        Animated.delay(600),
      ])
    ).start();
    anims.forEach((a, i) => animate(a, i * 150));
  }, []);
  return (
    <View style={{ flexDirection: 'row', gap: 5, paddingVertical: 4 }}>
      {anims.map((a, i) => (
        <Animated.View key={i} style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#C7C7CC', transform: [{ translateY: a }] }} />
      ))}
    </View>
  );
};

// ─── Main HomeScreen ──────────────────────────────────────────────────────────
const HomeScreen = ({ navigation }) => {
  const { user, selectedClass, setSelectedClass } = useAuth();
  const firstName = user?.name?.split(' ')[0] || 'Saurabh';

  const [charIdx, setCharIdx]           = useState(0);
  const [showCharModal, setShowCharModal] = useState(false);
  const [tempChar, setTempChar]         = useState(0);

  const [activeSubject, setActiveSubject] = useState('Physics');

  // The full AI Teacher experience (lesson generation + slide player + doubt
  // chat) lives in AITeacherScreen. The Home section is a preview only.
  const [showAITeacher, setShowAITeacher] = useState(false);
  const [seedTopic, setSeedTopic]         = useState('');

  const currentChar = CHARS[charIdx];

  const openAITeacher = (topic = '') => {
    setSeedTopic(topic);
    setShowAITeacher(true);
  };

  // ── Full AI Teacher experience (opened from the "Open AI Teacher" button) ──
  if (showAITeacher) {
    return (
      <AITeacherScreen
        initialSubject={activeSubject}
        initialTopic={seedTopic}
        onBack={() => setShowAITeacher(false)}
      />
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent={false} />

      {/* Status bar spacer for Android */}
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#fff' }} />}

      {/* ── TOP BAR ── */}
      <View style={s.topbar}>
        <View style={s.brand}>
          <View style={s.brandLogo}>
            <Text style={s.brandLogoTxt}>AL</Text>
          </View>
          <Text style={s.brandName}>Ailernova</Text>
        </View>
        <View style={s.topbarRight}>
          <ClassPicker value={selectedClass} onChange={setSelectedClass} />
          <TouchableOpacity style={s.bellBtn}>
            <Text style={{ fontSize: 17 }}>🔔</Text>
            <View style={s.bellDot} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowCharModal(true)} style={s.charRing}>
            <CharAvatar char={currentChar} size={38} />
            <View style={s.charEdit}><Text style={{ fontSize: 8, color: '#fff' }}>✏️</Text></View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={s.screen} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>

        {/* ── GREETING ── */}
        <View style={s.greetSection}>
          <View style={s.greetRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.greetName}>Hi, {firstName}! 👋</Text>
              <Text style={s.greetSub}>Let's make today a great{'\n'}learning day.</Text>
            </View>
            <View style={s.streakBox}>
              <View style={s.sItem}>
                <Text style={{ fontSize: 20 }}>🔥</Text>
                <View>
                  <Text style={s.sNum}>7</Text>
                  <Text style={s.sLbl}>Day Streak</Text>
                </View>
              </View>
              <View style={s.sDiv} />
              <View style={s.sItem}>
                <Text style={{ fontSize: 20 }}>⭐</Text>
                <View>
                  <Text style={s.sNum}>1250</Text>
                  <Text style={s.sLbl}>XP Points</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ── CHARACTER CARD ── */}
        <View style={s.charCard}>
          <CharAvatar char={currentChar} size={72} />
          <View style={s.charInfo}>
            <Text style={s.charName}>{currentChar.name}</Text>
            <Text style={s.charRole}>{currentChar.role} • Grade 9</Text>
            <View style={s.xpBarWrap}><View style={s.xpBarFill} /></View>
            <View style={s.xpRow}>
              <Text style={s.xpTxt}>1,250 XP</Text>
              <Text style={s.xpTxt}>Next: 1,500 XP</Text>
            </View>
          </View>
          <TouchableOpacity style={s.charChangeBtn} onPress={() => setShowCharModal(true)}>
            <Text style={s.charChangeTxt}>Change ✏️</Text>
          </TouchableOpacity>
        </View>

        {/* ── SESSION CARD ── */}
        <View style={s.sessCard}>
          <TouchableOpacity style={s.sessDotsBtn}>
            <View style={s.sessDot}/><View style={s.sessDot}/><View style={s.sessDot}/>
          </TouchableOpacity>
          <Text style={s.sessTag}>Upcoming 1:1 Session</Text>
          <Text style={s.sessTitle}>Physics with Arjun Sir</Text>
          <View style={s.sessMeta}>
            <Text style={{ fontSize: 12 }}>📅</Text>
            <Text style={s.sessMetaTxt}>Today, 5:30 PM – 6:30 PM</Text>
          </View>
          <View style={s.sessPills}>
            <View style={s.sessPill}>
              <Text style={s.sessPillTxt}>📹  Google Meet</Text>
            </View>
            <View style={s.sessPill}>
              <Text style={s.sessPillTxt}>⏰  15 min before</Text>
            </View>
          </View>
          <TouchableOpacity style={s.joinBtn}>
            <Text style={s.joinTxt}>Join Session  📹</Text>
          </TouchableOpacity>
          {/* Teacher placeholder */}
          <View style={s.sessImgPlaceholder}>
            <Text style={{ fontSize: 64, marginTop: 10 }}>👨‍🏫</Text>
            <View style={s.alBadge}><Text style={s.alBadgeTxt}>AL</Text></View>
          </View>
        </View>

        {/* ── CONTINUE LEARNING ── */}
        <View style={s.card}>
          <View style={s.clRow}>
            <View style={s.clPlay}>
              <View style={s.clInner}>
                <View style={s.tri} />
              </View>
            </View>
            <View style={s.clMid}>
              <Text style={s.clTag}>Continue Learning</Text>
              <Text style={s.clTitle}>Laws of Motion</Text>
              <View style={s.clBar}><View style={s.clFill} /></View>
              <Text style={s.clPct}>60% Completed</Text>
            </View>
            <TouchableOpacity style={s.clResume}>
              <Text style={s.clResumeTxt}>Resume ›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── QUICK ACTIONS ── */}
        <View style={s.qaCard}>
          <View style={s.qaRow}>
            {[
              { icon: '📋', label: 'Practice',  sub: 'AI Practice' },
              { icon: '📖', label: 'Resources', sub: 'Notes & Videos' },
              { icon: '📝', label: 'Tests',     sub: 'View & Attempt' },
              { icon: '📊', label: 'Results',   sub: 'Your Progress' },
              { icon: '📅', label: 'Sessions',  sub: 'My Schedule' },
            ].map((item, i) => (
              <TouchableOpacity
                key={i}
                style={s.qaItem}
                onPress={() => { const tab = TAB_FOR[item.label]; if (tab && navigation) navigation.navigate(tab); }}
              >
                <View style={s.qaBox}><Text style={{ fontSize: 20 }}>{item.icon}</Text></View>
                <Text style={s.qaLbl}>{item.label}</Text>
                <Text style={s.qaSub}>{item.sub}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── EXPLORE SKILLS ── */}
        <View style={s.secHdr}>
          <Text style={s.secTitle}>Explore Skills Programs</Text>
          <TouchableOpacity><Text style={s.secLink}>View all ›</Text></TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: PAD, gap: 12, paddingBottom: 6 }}>
          {[
            { icon: '💻', name: 'Coding',          desc: 'Build real-world skills' },
            { icon: '🤖', name: 'AI & Robotics',   desc: 'Explore future tech' },
            { icon: '🎤', name: 'Public Speaking', desc: 'Speak with confidence' },
            { icon: '🏆', name: 'Leadership',      desc: 'Lead & inspire others' },
          ].map((sk, i) => (
            <View key={i} style={s.skCard}>
              <View style={s.skIcon}><Text style={{ fontSize: 24 }}>{sk.icon}</Text></View>
              <Text style={s.skName}>{sk.name}</Text>
              <Text style={s.skDesc}>{sk.desc}</Text>
              <TouchableOpacity style={s.skBtn}><Text style={s.skBtnTxt}>Register</Text></TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {/* ── AI TEACHER (preview — full experience opens via the button) ── */}
        <View style={s.aiSection}>
          <Text style={s.aiSectionLabel}>AI Teacher 🎓</Text>

          {/* Header card */}
          <View style={s.aiHeaderCard}>
            <View style={s.aiTopRow}>
              <View style={s.aiLeft}>
                <View style={s.aiAvatar}><Text style={{ fontSize: 24 }}>🎓</Text></View>
                <View>
                  <Text style={s.aiName}>AI Teacher</Text>
                  <Text style={s.aiSub}>Powered by Ailernova AI</Text>
                </View>
              </View>
              <View style={s.aiOnline}>
                <View style={s.aiDot} />
                <Text style={s.aiOnlineTxt}>Always Online</Text>
              </View>
            </View>
            <Text style={s.aiDesc}>
              Ask anything about your subjects — get instant step-by-step explanations, concept clarity, and exam tips. Available 24/7! 🚀
            </Text>
          </View>

          {/* Subject Chips */}
          <View style={s.chipSection}>
            <Text style={s.chipLbl}>YOUR SUBJECTS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}>
              {Object.keys(SUBJECT_QS).map(subj => (
                <TouchableOpacity key={subj}
                  style={[s.chip, activeSubject === subj && s.chipOn]}
                  onPress={() => setActiveSubject(subj)}>
                  <Text style={[s.chipTxt, activeSubject === subj && s.chipTxtOn]}>{subj}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Quick questions + Open button (preview footer) */}
          <View style={s.previewCard}>
            <Text style={s.qsLbl}>QUICK QUESTIONS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}>
              {(SUBJECT_QS[activeSubject] || []).map((q, i) => {
                const p = QPILL_PASTELS[i % QPILL_PASTELS.length];
                return (
                  <TouchableOpacity key={i}
                    style={[s.qPill, { backgroundColor: p.bg, borderColor: p.border }]}
                    onPress={() => openAITeacher(q)}>
                    <Text style={[s.qPillTxt, { color: p.text }]}>{q}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={s.openAiBtn} onPress={() => openAITeacher()}>
              <Text style={s.openAiTxt}>Open AI Teacher  ↗</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── PROGRESS ── */}
        <View style={s.progCard}>
          <View style={s.progHead}>
            <Text style={s.progTitle}>Your Progress</Text>
            <Text style={s.progWeek}>This Week</Text>
          </View>
          {/* Bar chart */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 70, marginBottom: 6 }}>
            {[
              { d: 'M', v: 30 }, { d: 'T', v: 55 }, { d: 'W', v: 40 },
              { d: 'T', v: 65 }, { d: 'F', v: 40 }, { d: 'S', v: 25 }, { d: 'S', v: 75 },
            ].map((bar, i) => {
              const isToday = i === 6;
              return (
                <View key={i} style={{ flex: 1, alignItems: 'center', gap: 3 }}>
                  <View style={{ width: '80%', height: bar.v * 0.7, backgroundColor: isToday ? '#1C1C1E' : '#E0E0E0', borderRadius: 4 }} />
                  <Text style={{ fontSize: 9, color: isToday ? '#1C1C1E' : '#C7C7CC', fontWeight: isToday ? '800' : '600' }}>{bar.d}</Text>
                </View>
              );
            })}
          </View>
          <View style={s.progStats}>
            {[
              { n: '12',     l: 'Topics\nLearned' },
              { n: '8h 20m', l: 'Study\nTime' },
              { n: '85%',    l: 'Accuracy' },
            ].map((st, i) => (
              <View key={i} style={s.progStat}>
                <Text style={s.progNum}>{st.n}</Text>
                <Text style={s.progLbl}>{st.l}</Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>

      {/* ── CHARACTER MODAL ── */}
      {showCharModal && (
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1}
          onPress={() => setShowCharModal(false)}>
          <TouchableOpacity activeOpacity={1} style={s.modal}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Choose Your Character</Text>
            <Text style={s.modalSub}>Pick a unique identity that's all yours!</Text>
            <View style={s.charGrid}>
              {CHARS.map((c, i) => (
                <TouchableOpacity key={i}
                  style={[s.charOpt, tempChar === i && s.charOptSel]}
                  onPress={() => setTempChar(i)}>
                  <CharAvatar char={c} size={64} />
                  <Text style={s.charOptName}>{c.name}</Text>
                  <Text style={s.charOptDesc}>{c.role}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={s.modalBtn}
              onPress={() => { setCharIdx(tempChar); setShowCharModal(false); }}>
              <Text style={s.modalBtnTxt}>Save My Character ✓</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      )}

    </SafeAreaView>
  );
};

// Pastel palette cycled across the AI Teacher quick-question pills.
const QPILL_PASTELS = [
  { bg: '#E1F5F3', border: '#C7E9E5', text: '#0B7E78' }, // lavender
  { bg: '#E2FBEF', border: '#BCEFD7', text: '#1E9466' }, // mint
  { bg: '#FFF0E6', border: '#FFDCC2', text: '#D9712B' }, // peach
  { bg: '#E6F4FF', border: '#C5E4FF', text: '#2C7BD4' }, // sky
  { bg: '#FFE9F2', border: '#FFCCE0', text: '#D6478B' }, // pink
];

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#F7F7F7' },
  screen: { flex: 1 },

  // Topbar
  topbar:      { backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12, borderBottomWidth: 1.5, borderBottomColor: '#F0F0F0' },
  brand:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandLogo:   { width: 38, height: 38, backgroundColor: '#1C1C1E', borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  brandLogoTxt:{ color: '#fff', fontSize: 12, fontWeight: '900' },
  brandName:   { fontSize: 20, fontWeight: '900', color: '#1C1C1E', letterSpacing: -0.5 },
  topbarRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bellBtn:     { width: 38, height: 38, backgroundColor: '#F5F5F5', borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#EFEFEF', position: 'relative' },
  bellDot:     { position: 'absolute', top: 7, right: 7, width: 8, height: 8, backgroundColor: '#1C1C1E', borderRadius: 4, borderWidth: 2, borderColor: '#fff' },
  charRing:    { position: 'relative' },
  charEdit:    { position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, backgroundColor: '#1C1C1E', borderRadius: 8, borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },

  // Greeting
  greetSection: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 14, marginBottom: 8 },
  greetRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  greetName:    { fontSize: 26, fontWeight: '900', color: '#1C1C1E', letterSpacing: -0.5, lineHeight: 30 },
  greetSub:     { fontSize: 13, color: '#8E8E93', marginTop: 5, fontWeight: '600', lineHeight: 19 },
  streakBox:    { backgroundColor: '#F7F7F7', borderWidth: 1.5, borderColor: '#EBEBEB', borderRadius: 18, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  sItem:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sNum:         { fontSize: 17, fontWeight: '900', color: '#5A67E8' },
  sLbl:         { fontSize: 9, color: '#8E8E93', fontWeight: '700', marginTop: 1 },
  sDiv:         { width: 1, height: 30, backgroundColor: '#E8E8E8' },

  // Character card
  charCard:       { backgroundColor: '#fff', marginHorizontal: PAD, marginBottom: 10, borderRadius: 22, borderWidth: 1.5, borderColor: '#F0F0F0', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14 },
  charInfo:       { flex: 1 },
  charName:       { fontSize: 16, fontWeight: '900', color: '#1C1C1E', letterSpacing: -0.3 },
  charRole:       { fontSize: 11, color: '#8E8E93', fontWeight: '700', marginTop: 2 },
  xpBarWrap:      { height: 6, backgroundColor: '#F0F0F0', borderRadius: 10, marginTop: 10, overflow: 'hidden' },
  xpBarFill:      { height: '100%', backgroundColor: '#0FA39A', borderRadius: 10, width: '72%' },
  xpRow:          { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  xpTxt:          { fontSize: 10, color: '#8E8E93', fontWeight: '700' },
  charChangeBtn:  { borderWidth: 2, borderColor: '#1C1C1E', borderRadius: 11, paddingVertical: 8, paddingHorizontal: 12 },
  charChangeTxt:  { fontSize: 11, fontWeight: '800', color: '#1C1C1E' },

  // Session card
  sessCard:           { marginHorizontal: PAD, marginBottom: 10, backgroundColor: '#1C1C1E', borderRadius: 26, padding: 22, position: 'relative', overflow: 'hidden', minHeight: 200 },
  sessDotsBtn:        { position: 'absolute', top: 18, right: 18, width: 30, height: 30, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 15, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3 },
  sessDot:            { width: 3, height: 3, backgroundColor: '#888', borderRadius: 1.5 },
  sessTag:            { fontSize: 10, fontWeight: '800', color: '#8E8E93', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 },
  sessTitle:          { fontSize: 21, fontWeight: '900', color: '#fff', lineHeight: 26, maxWidth: 195, marginBottom: 12, letterSpacing: -0.3 },
  sessMeta:           { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  sessMetaTxt:        { color: '#AEAEB2', fontSize: 13, fontWeight: '600' },
  sessPills:          { flexDirection: 'row', gap: 8, marginBottom: 18 },
  sessPill:           { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 18, paddingVertical: 6, paddingHorizontal: 12 },
  sessPillTxt:        { fontSize: 11, color: '#C7C7CC', fontWeight: '700' },
  joinBtn:            { backgroundColor: '#fff', borderRadius: 13, paddingVertical: 12, paddingHorizontal: 22, alignSelf: 'flex-start' },
  joinTxt:            { fontSize: 14, fontWeight: '800', color: '#1C1C1E' },
  sessImgPlaceholder: { position: 'absolute', right: -10, bottom: 0, width: 150, height: 200, alignItems: 'center', justifyContent: 'flex-end' },
  alBadge:            { position: 'absolute', bottom: 14, right: 14, backgroundColor: '#fff', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3 },
  alBadgeTxt:         { fontSize: 10, fontWeight: '900', color: '#1C1C1E' },

  // Continue learning
  card:       { backgroundColor: '#fff', marginHorizontal: PAD, marginBottom: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#F0F0F0', padding: 14 },
  clRow:      { flexDirection: 'row', alignItems: 'center', gap: 14 },
  clPlay:     { width: 50, height: 50, backgroundColor: '#F0F0F0', borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  clInner:    { width: 32, height: 32, backgroundColor: '#1C1C1E', borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  tri:        { width: 0, height: 0, borderTopWidth: 6, borderBottomWidth: 6, borderLeftWidth: 11, borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: '#fff', marginLeft: 2 },
  clMid:      { flex: 1 },
  clTag:      { fontSize: 10, fontWeight: '800', color: '#1C1C1E', textTransform: 'uppercase', letterSpacing: 0.4 },
  clTitle:    { fontSize: 16, fontWeight: '900', color: '#1C1C1E', marginTop: 2, letterSpacing: -0.3 },
  clBar:      { height: 5, backgroundColor: '#F0F0F0', borderRadius: 10, marginTop: 8, overflow: 'hidden' },
  clFill:     { width: '60%', height: '100%', backgroundColor: '#1C1C1E', borderRadius: 10 },
  clPct:      { fontSize: 10, color: '#8E8E93', marginTop: 5, fontWeight: '600' },
  clResume:   { backgroundColor: '#F0F0F0', borderRadius: 11, paddingVertical: 9, paddingHorizontal: 13, borderWidth: 1.5, borderColor: '#E8E8E8' },
  clResumeTxt:{ fontSize: 13, fontWeight: '800', color: '#1C1C1E' },

  // Quick actions
  qaCard:  { backgroundColor: '#fff', marginHorizontal: PAD, marginBottom: 8, borderRadius: 20, borderWidth: 1.5, borderColor: '#F0F0F0', paddingVertical: 12, paddingHorizontal: 6 },
  qaRow:   { flexDirection: 'row', justifyContent: 'space-around' },
  qaItem:  { alignItems: 'center', gap: 5, flex: 1 },
  qaBox:   { width: 46, height: 46, backgroundColor: '#F7F7F7', borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#F0F0F0' },
  qaLbl:   { fontSize: 10, fontWeight: '800', color: '#1C1C1E', textAlign: 'center' },
  qaSub:   { fontSize: 9, color: '#8E8E93', textAlign: 'center', lineHeight: 12, fontWeight: '600' },

  // Skills
  secHdr:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 6 },
  secTitle:{ fontSize: 16, fontWeight: '900', color: '#1C1C1E', letterSpacing: -0.3 },
  secLink: { fontSize: 13, fontWeight: '800', color: '#1C1C1E', textDecorationLine: 'underline' },
  skCard:  { minWidth: 128, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#F0F0F0', borderRadius: 20, paddingVertical: 14, paddingHorizontal: 12, alignItems: 'center' },
  skIcon:  { width: 52, height: 52, borderRadius: 16, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', marginBottom: 10, borderWidth: 1.5, borderColor: '#EBEBEB' },
  skName:  { fontSize: 13, fontWeight: '900', color: '#1C1C1E', textAlign: 'center', lineHeight: 16 },
  skDesc:  { fontSize: 10, color: '#8E8E93', marginTop: 4, textAlign: 'center', lineHeight: 14, fontWeight: '600' },
  skBtn:   { marginTop: 12, borderWidth: 2, borderColor: '#1C1C1E', borderRadius: 10, paddingVertical: 7, paddingHorizontal: 0, width: '100%', alignItems: 'center' },
  skBtnTxt:{ fontSize: 12, fontWeight: '800', color: '#1C1C1E' },

  // Lesson player
  lpCard:         { backgroundColor: '#fff', borderRadius: 22, borderWidth: 1.5, borderColor: '#F0F0F0', padding: 16, marginBottom: 12 },
  lpTopRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 8 },
  lpCount:        { fontSize: 11, fontWeight: '800', color: '#1C1C1E', letterSpacing: 0.3 },
  lpTitleSm:      { flex: 1, fontSize: 11, fontWeight: '700', color: '#8E8E93', textAlign: 'right' },
  lpBar:          { height: 6, backgroundColor: '#F0F0F0', borderRadius: 10, overflow: 'hidden', marginBottom: 14 },
  lpBarFill:      { height: '100%', backgroundColor: '#1C1C1E', borderRadius: 10 },
  lpBody:         { maxHeight: 230 },
  lpSlideNo:      { fontSize: 10, fontWeight: '800', color: '#8E8E93', letterSpacing: 1, marginBottom: 4 },
  lpSlideTitle:   { fontSize: 18, fontWeight: '900', color: '#1C1C1E', letterSpacing: -0.3, lineHeight: 23, marginBottom: 8 },
  lpExplain:      { fontSize: 14, fontWeight: '600', color: '#1C1C1E', lineHeight: 21 },
  lpNarrBox:      { backgroundColor: '#F7F7F7', borderWidth: 1.5, borderColor: '#EBEBEB', borderRadius: 14, padding: 12, marginTop: 12 },
  lpNarrLbl:      { fontSize: 9, fontWeight: '800', color: '#8E8E93', letterSpacing: 0.8, marginBottom: 5 },
  lpNarr:         { fontSize: 13, fontWeight: '600', color: '#3A3A3C', lineHeight: 20, fontStyle: 'italic' },
  lpNav:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 14 },
  lpBtn:          { borderWidth: 2, borderColor: '#1C1C1E', borderRadius: 12, paddingVertical: 9, paddingHorizontal: 16, minWidth: 80, alignItems: 'center' },
  lpBtnDisabled:  { borderColor: '#E8E8E8' },
  lpBtnTxt:       { fontSize: 13, fontWeight: '800', color: '#1C1C1E' },
  lpBtnTxtDisabled: { color: '#C7C7CC' },
  lpDots:         { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 5, flex: 1 },
  lpDot:          { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#E0E0E0' },
  lpDotOn:        { width: 18, backgroundColor: '#1C1C1E' },

  // AI Teacher
  aiSection:      { marginHorizontal: PAD, marginBottom: 10, marginTop: 4 },
  aiSectionLabel: { fontSize: 16, fontWeight: '900', color: '#1C1C1E', letterSpacing: -0.3, marginBottom: 10, paddingHorizontal: 2 },
  aiHeaderCard:   { backgroundColor: '#E1F5F3', borderRadius: 26, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: 20, borderWidth: 1, borderBottomWidth: 0, borderColor: '#C7E9E5' },
  aiTopRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  aiLeft:         { flexDirection: 'row', alignItems: 'center', gap: 12 },
  aiAvatar:       { width: 48, height: 48, backgroundColor: '#fff', borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#C7E9E5', shadowColor: '#0FA39A', shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  aiName:         { fontSize: 17, fontWeight: '900', color: '#2C3043', letterSpacing: -0.3 },
  aiSub:          { fontSize: 10, color: '#9A93A6', fontWeight: '700', marginTop: 2 },
  aiOnline:       { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#E2FBEF', borderWidth: 1, borderColor: '#BCEFD7', borderRadius: 18, paddingVertical: 6, paddingHorizontal: 11 },
  aiDot:          { width: 7, height: 7, backgroundColor: '#27B07A', borderRadius: 3.5 },
  aiOnlineTxt:    { fontSize: 10, color: '#1E9466', fontWeight: '800' },
  aiDesc:         { color: '#6E6A82', fontSize: 12, fontWeight: '600', lineHeight: 18, marginTop: 12 },
  chipSection:    { backgroundColor: '#E1F5F3', paddingHorizontal: 20, paddingBottom: 16, borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#C7E9E5' },
  chipLbl:        { fontSize: 9, fontWeight: '800', color: '#ABA6B2', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 9 },
  chip:           { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 18, borderWidth: 2, borderColor: '#C7E9E5', backgroundColor: '#fff' },
  chipOn:         { backgroundColor: '#0FA39A', borderColor: '#0FA39A' },
  chipTxt:        { fontSize: 13, fontWeight: '800', color: '#8A8296' },
  chipTxtOn:      { color: '#fff' },
  previewCard:    { backgroundColor: '#fff', borderWidth: 1, borderTopWidth: 0, borderColor: '#C7E9E5', borderBottomLeftRadius: 26, borderBottomRightRadius: 26, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 14 },
  openAiBtn:      { backgroundColor: '#0FA39A', borderRadius: 14, paddingVertical: 13, alignItems: 'center', marginTop: 12, shadowColor: '#0FA39A', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  openAiTxt:      { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: -0.3 },
  chatWrap:       { borderLeftWidth: 1.5, borderRightWidth: 1.5, borderColor: '#F0F0F0', backgroundColor: '#F7F7F7' },
  chatMsgs:       { maxHeight: 220 },
  msgRow:         { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginBottom: 14 },
  msgRowMe:       { flexDirection: 'row-reverse' },
  msgAv:          { width: 30, height: 30, borderRadius: 15, backgroundColor: '#1C1C1E', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  msgAvUser:      { flexShrink: 0 },
  bubble:         { maxWidth: width * 0.6, padding: 12, borderRadius: 18 },
  bAi:            { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#EBEBEB', borderBottomLeftRadius: 4 },
  bMe:            { backgroundColor: '#1C1C1E', borderBottomRightRadius: 4 },
  bubbleTxt:      { fontSize: 13, fontWeight: '600', color: '#1C1C1E', lineHeight: 20 },
  quickQs:        { padding: 14, paddingTop: 8, backgroundColor: '#F7F7F7' },
  qsLbl:          { fontSize: 9, fontWeight: '800', color: '#ABA6B2', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  qPill:          { borderWidth: 1.5, borderRadius: 18, paddingVertical: 8, paddingHorizontal: 13 },
  qPillTxt:       { fontSize: 11, fontWeight: '700' },
  inputArea:      { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#F0F0F0', borderRadius: 0, borderBottomLeftRadius: 26, borderBottomRightRadius: 26, padding: 12, paddingBottom: 14 },
  inputRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  inp:            { flex: 1, backgroundColor: '#F7F7F7', borderWidth: 1.5, borderColor: '#EBEBEB', borderRadius: 22, paddingVertical: 11, paddingHorizontal: 17, fontSize: 13, fontWeight: '600', color: '#1C1C1E' },
  sendBtn:        { width: 42, height: 42, backgroundColor: '#1C1C1E', borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  voiceRow:       { flexDirection: 'row', gap: 10 },
  voiceBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#F7F7F7', borderWidth: 1.5, borderColor: '#EBEBEB', borderRadius: 14, padding: 11 },
  voiceLbl:       { fontSize: 13, fontWeight: '800', color: '#1C1C1E' },
  askBtn:         { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#F7F7F7', borderWidth: 1.5, borderColor: '#EBEBEB', borderRadius: 14, padding: 11 },
  askLbl:         { fontSize: 13, fontWeight: '800', color: '#1C1C1E' },

  // Progress
  progCard:  { backgroundColor: '#fff', marginHorizontal: PAD, marginBottom: 0, borderRadius: 22, borderWidth: 1.5, borderColor: '#F0F0F0', padding: 16 },
  progHead:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  progTitle: { fontSize: 15, fontWeight: '900', color: '#1C1C1E', letterSpacing: -0.3 },
  progWeek:  { fontSize: 11, color: '#8E8E93', fontWeight: '700' },
  progStats: { flexDirection: 'row', gap: 10, marginTop: 12 },
  progStat:  { flex: 1, backgroundColor: '#F7F7F7', borderRadius: 13, padding: 12, alignItems: 'center', borderWidth: 1.5, borderColor: '#F0F0F0' },
  progNum:   { fontSize: 16, fontWeight: '900', color: '#1C1C1E', letterSpacing: -0.3 },
  progLbl:   { fontSize: 9, color: '#8E8E93', fontWeight: '700', textAlign: 'center', marginTop: 4, lineHeight: 13 },

  // Modal
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end', zIndex: 999 },
  modal:        { backgroundColor: '#fff', borderRadius: 30, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: 22, paddingBottom: 36, maxHeight: '80%' },
  modalHandle:  { width: 38, height: 4, backgroundColor: '#E0E0E0', borderRadius: 10, alignSelf: 'center', marginBottom: 18 },
  modalTitle:   { fontSize: 19, fontWeight: '900', color: '#1C1C1E', marginBottom: 4 },
  modalSub:     { fontSize: 13, color: '#8E8E93', fontWeight: '600', marginBottom: 20 },
  charGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  charOpt:      { width: (width - 44 - 24) / 3, backgroundColor: '#F7F7F7', borderRadius: 18, padding: 13, alignItems: 'center', gap: 7, borderWidth: 2.5, borderColor: 'transparent' },
  charOptSel:   { borderColor: '#1C1C1E', backgroundColor: '#fff' },
  charOptName:  { fontSize: 12, fontWeight: '800', color: '#1C1C1E', textAlign: 'center' },
  charOptDesc:  { fontSize: 10, color: '#8E8E93', fontWeight: '600', textAlign: 'center', lineHeight: 14 },
  modalBtn:     { backgroundColor: '#1C1C1E', borderRadius: 15, padding: 15, alignItems: 'center', marginTop: 20 },
  modalBtnTxt:  { color: '#fff', fontSize: 15, fontWeight: '800' },
});

export default HomeScreen;