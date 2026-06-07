import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, StatusBar, Dimensions, TextInput,
  Platform, KeyboardAvoidingView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');
const PAD = 14;

// ─────────────────────────────────────────────────────────────────────────────
// TAB: HOME
// ─────────────────────────────────────────────────────────────────────────────
const HomeTab = ({ firstName }) => (
  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>
    {/* Session card */}
    <View style={h.sessionCard}>
      <View style={h.sessionLeft}>
        <Text style={h.sessionTag}>UPCOMING 1:1 SESSION</Text>
        <Text style={h.sessionTitle}>Physics with Arjun Sir</Text>
        <Text style={h.sessionMeta}>📅  Today, 5:30 PM – 6:30 PM</Text>
        <View style={{ flexDirection: 'row' }}>
          <Text style={h.sessionMeta}>📹  Google Meet</Text>
          <Text style={[h.sessionMeta, { marginLeft: 10 }]}>⏰  15 min</Text>
        </View>
        <TouchableOpacity style={h.joinBtn}>
          <Text style={h.joinTxt}>Join Session  📹</Text>
        </TouchableOpacity>
      </View>
      <View style={{ alignItems: 'center', justifyContent: 'space-between', paddingTop: 10 }}>
        <TouchableOpacity><Text style={{ color: '#fff', fontSize: 18 }}>⋮</Text></TouchableOpacity>
        <Text style={{ fontSize: 46, marginBottom: -4 }}>👨‍🏫</Text>
      </View>
    </View>

    {/* Continue learning */}
    <View style={h.continueCard}>
      <View style={h.playCircle}>
        <Text style={{ fontSize: 13 }}>▶</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={h.continueLbl}>Continue Learning</Text>
        <Text style={h.continueTitle}>Laws of Motion</Text>
        <View style={h.progBg}>
          <View style={[h.progFill, { width: '60%' }]} />
        </View>
        <Text style={h.progTxt}>60% Completed</Text>
      </View>
      <TouchableOpacity style={h.resumeBtn}>
        <Text style={h.resumeTxt}>Resume ›</Text>
      </TouchableOpacity>
    </View>

    {/* Quick actions */}
    <View style={h.quickRow}>
      {[
        { e: '🎯', l: 'Practice' },
        { e: '📖', l: 'Resources' },
        { e: '📋', l: 'Tests' },
        { e: '📊', l: 'Results' },
        { e: '📅', l: 'Sessions' },
      ].map((item, i) => (
        <TouchableOpacity key={i} style={h.quickItem}>
          <View style={h.quickIconBox}>
            <Text style={{ fontSize: 18 }}>{item.e}</Text>
          </View>
          <Text style={h.quickLbl}>{item.l}</Text>
        </TouchableOpacity>
      ))}
    </View>

    {/* Today's tasks */}
    <Text style={h.sectionTitle}>Today's Tasks</Text>
    <View style={h.tasksCard}>
      {[
        { done: true,  label: 'Complete Laws of Motion quiz',  pts: '+20 XP' },
        { done: false, label: 'Watch: Electricity Chapter 3',  pts: '+15 XP' },
        { done: false, label: 'Practice: 10 Maths problems',   pts: '+25 XP' },
      ].map((t, i) => (
        <View key={i} style={[h.taskRow, i < 2 && { borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }]}>
          <View style={[h.taskCheck, t.done && h.taskCheckDone]}>
            {t.done && <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>✓</Text>}
          </View>
          <Text style={[h.taskLabel, t.done && { textDecorationLine: 'line-through', color: '#aaa' }]}>{t.label}</Text>
          <Text style={h.taskPts}>{t.pts}</Text>
        </View>
      ))}
    </View>
  </ScrollView>
);

// ─────────────────────────────────────────────────────────────────────────────
// TAB: PRACTICE (AI Teacher)
// ─────────────────────────────────────────────────────────────────────────────
const SUBJECTS = ['Physics', 'Maths', 'Chemistry', 'Biology', 'English'];
const SUGGESTIONS = ["Newton's 2nd Law", 'Photosynthesis', '2x + 5 = 15', 'Periodic table'];

const PracticeTab = ({ firstName }) => {
  const [activeSubject, setActiveSubject] = useState('Physics');
  const [messages, setMessages] = useState([{
    id: 1, from: 'ai',
    text: `👋 Hi ${firstName}! I'm your AI Teacher. Ask me anything about ${activeSubject}! 🧪`,
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const sendMessage = (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput('');
    setMessages(prev => [...prev, { id: Date.now(), from: 'user', text: msg }]);
    setLoading(true);
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 1, from: 'ai',
        text: `Great question! 💡 "${msg}" is a key concept in ${activeSubject}. Let me break it down step by step so it's crystal clear! 🚀`,
      }]);
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }, 1000);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={p.aiHeader}>
          <View style={p.aiAvatar}><Text style={{ fontSize: 18 }}>🎓</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={p.aiTitle}>AI Teacher</Text>
            <Text style={p.aiSub}>Ask anything about your subjects</Text>
          </View>
          <View style={p.onlineBadge}>
            <View style={p.onlineDot} />
            <Text style={p.onlineTxt}>Online</Text>
          </View>
        </View>
        {/* Subject chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={p.subjectsRow}>
          {SUBJECTS.map(s => (
            <TouchableOpacity key={s} onPress={() => setActiveSubject(s)}
              style={[p.subChip, activeSubject === s && p.subChipActive]}>
              <Text style={[p.subChipTxt, activeSubject === s && p.subChipTxtActive]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {/* Messages */}
        <ScrollView ref={scrollRef} style={p.chatArea}
          contentContainerStyle={{ gap: 10, padding: 12 }}
          showsVerticalScrollIndicator={false}>
          {messages.map(m => (
            <View key={m.id} style={[p.msgRow, m.from === 'user' && p.msgRowUser]}>
              {m.from === 'ai' && <View style={p.msgAvatar}><Text style={{ fontSize: 11 }}>🎓</Text></View>}
              <View style={[p.bubble, m.from === 'user' ? p.bubbleUser : p.bubbleAI]}>
                <Text style={[p.bubbleTxt, m.from === 'user' && { color: '#fff' }]}>{m.text}</Text>
              </View>
              {m.from === 'user' && <View style={p.msgAvatarUser}><Text style={{ fontSize: 11 }}>👤</Text></View>}
            </View>
          ))}
          {loading && (
            <View style={p.msgRow}>
              <View style={p.msgAvatar}><Text style={{ fontSize: 11 }}>🎓</Text></View>
              <View style={p.bubbleAI}><Text style={p.bubbleTxt}>Thinking...</Text></View>
            </View>
          )}
        </ScrollView>
        {/* Suggestions */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: PAD, paddingVertical: 6 }}>
          {SUGGESTIONS.map((s, i) => (
            <TouchableOpacity key={i} style={p.suggestChip} onPress={() => sendMessage(s)}>
              <Text style={p.suggestTxt}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {/* Input */}
        <View style={p.inputRow}>
          <TextInput style={p.input} placeholder={`Ask about ${activeSubject}...`}
            placeholderTextColor="#aaa" value={input} onChangeText={setInput}
            onSubmitEditing={() => sendMessage()} returnKeyType="send" />
          <TouchableOpacity style={p.sendBtn} onPress={() => sendMessage()}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>↑</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TAB: EXPLORE (Skills)
// ─────────────────────────────────────────────────────────────────────────────
const SKILLS = [
  { emoji: '💻', label: 'Coding',           sub: 'Build real-world skills' },
  { emoji: '🤖', label: 'AI & Robotics',    sub: 'Explore future technologies' },
  { emoji: '🎙', label: 'Public Speaking',  sub: 'Speak confidently & clearly' },
  { emoji: '👤', label: 'Leadership',       sub: 'Lead with confidence' },
  { emoji: '✍️', label: 'Creative Writing', sub: 'Express your ideas clearly' },
  { emoji: '📊', label: 'Data Science',     sub: 'Understand data & trends' },
];

const ExploreTab = () => (
  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>
    <Text style={e.sectionTitle}>Explore Skills Programs</Text>
    <View style={e.grid}>
      {SKILLS.map((item, i) => (
        <View key={i} style={e.skillCard}>
          <View style={e.skillIcon}>
            <Text style={{ fontSize: 26 }}>{item.emoji}</Text>
          </View>
          <Text style={e.skillLabel}>{item.label}</Text>
          <Text style={e.skillSub}>{item.sub}</Text>
          <TouchableOpacity style={e.registerBtn}>
            <Text style={e.registerTxt}>Register</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
    <Text style={e.sectionTitle}>Trending Topics</Text>
    {['Machine Learning Basics', 'Quantum Physics 101', 'Financial Literacy', 'Public Speaking Mastery'].map((t, i) => (
      <TouchableOpacity key={i} style={e.trendRow}>
        <View style={e.trendNum}><Text style={e.trendNumTxt}>{i + 1}</Text></View>
        <Text style={e.trendLabel}>{t}</Text>
        <Text style={{ fontSize: 16, color: '#aaa' }}>›</Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
);

// ─────────────────────────────────────────────────────────────────────────────
// TAB: PROGRESS
// ─────────────────────────────────────────────────────────────────────────────
const WEEK_BARS = [
  { day: 'M', mins: 20 }, { day: 'T', mins: 45 }, { day: 'W', mins: 30 },
  { day: 'T', mins: 60 }, { day: 'F', mins: 40 }, { day: 'S', mins: 25 }, { day: 'S', mins: 75 },
];
const SUBJECT_PROGRESS = [
  { label: 'Physics',   pct: 78 },
  { label: 'Maths',     pct: 91 },
  { label: 'Chemistry', pct: 55 },
  { label: 'Biology',   pct: 63 },
  { label: 'English',   pct: 84 },
];
const maxMins = Math.max(...WEEK_BARS.map(d => d.mins));

const ProgressTab = () => (
  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>
    {/* Stat pills */}
    <View style={pg.pillsRow}>
      {[
        { icon: '📚', val: '12',     lbl: 'Topics' },
        { icon: '⏱',  val: '8h 20m', lbl: 'Study Time' },
        { icon: '🎯', val: '85%',    lbl: 'Accuracy' },
        { icon: '🔥', val: '7',      lbl: 'Streak' },
      ].map((p, i) => (
        <View key={i} style={pg.pill}>
          <Text style={{ fontSize: 18 }}>{p.icon}</Text>
          <Text style={pg.pillVal}>{p.val}</Text>
          <Text style={pg.pillLbl}>{p.lbl}</Text>
        </View>
      ))}
    </View>

    {/* Bar chart */}
    <View style={pg.card}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
        <Text style={pg.cardTitle}>Study Time</Text>
        <Text style={{ fontSize: 11, color: '#aaa' }}>This Week</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 80 }}>
        {WEEK_BARS.map((d, i) => {
          const bh = Math.max(6, (d.mins / maxMins) * 72);
          const isToday = i === WEEK_BARS.length - 1;
          return (
            <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 8, color: isToday ? '#111' : '#bbb', fontWeight: isToday ? '700' : '400' }}>{d.mins}m</Text>
              <View style={{ width: '80%', height: bh, backgroundColor: isToday ? '#111' : '#e0e0e0', borderRadius: 4 }} />
              <Text style={{ fontSize: 9, color: isToday ? '#111' : '#bbb', fontWeight: isToday ? '700' : '400' }}>{d.day}</Text>
            </View>
          );
        })}
      </View>
    </View>

    {/* Subject breakdown */}
    <View style={pg.card}>
      <Text style={[pg.cardTitle, { marginBottom: 14 }]}>Subject Breakdown</Text>
      {SUBJECT_PROGRESS.map((sub, i) => (
        <View key={i} style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#111' }}>{sub.label}</Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#111' }}>{sub.pct}%</Text>
          </View>
          <View style={{ height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
            <View style={{ height: 8, width: `${sub.pct}%`, backgroundColor: '#111', borderRadius: 4 }} />
          </View>
        </View>
      ))}
    </View>

    {/* Heatmap */}
    <View style={pg.card}>
      <Text style={[pg.cardTitle, { marginBottom: 12 }]}>Activity This Month</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
        {Array.from({ length: 35 }).map((_, i) => {
          const v = Math.random();
          const bg = v > 0.7 ? '#111' : v > 0.4 ? '#555' : v > 0.2 ? '#bbb' : '#f0f0f0';
          return <View key={i} style={{ width: 16, height: 16, borderRadius: 3, backgroundColor: bg }} />;
        })}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, justifyContent: 'flex-end' }}>
        <Text style={{ fontSize: 9, color: '#aaa' }}>Less</Text>
        {['#f0f0f0', '#bbb', '#555', '#111'].map((c, i) => (
          <View key={i} style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: c }} />
        ))}
        <Text style={{ fontSize: 9, color: '#aaa' }}>More</Text>
      </View>
    </View>
  </ScrollView>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN HOME SCREEN
// ─────────────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'home',     label: 'Home' },
  { key: 'practice', label: 'AI Teacher' },
  { key: 'explore',  label: 'Explore' },
  { key: 'progress', label: 'Progress' },
];

const HomeScreen = () => {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] || 'Student';
  const [activeTab, setActiveTab] = useState('home');

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* ── Fixed Header ── */}
      <View style={styles.header}>
        <View style={styles.headerL}>
          <View style={styles.logoBox}><Text style={styles.logoTxt}>AL</Text></View>
          <Text style={styles.brand}>Ailernova</Text>
        </View>
        <View style={styles.headerR}>
          <TouchableOpacity>
            <Text style={{ fontSize: 20 }}>🔔</Text>
            <View style={styles.bellDot} />
          </TouchableOpacity>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarTxt}>{firstName[0].toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {/* ── Greeting row ── */}
      <View style={styles.greetRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greetName}>Hi, {firstName}! 👋</Text>
          <Text style={styles.greetSub}>Let's make today a great learning day.</Text>
        </View>
        <View style={styles.statsBox}>
          <View style={styles.statCol}>
            <Text style={{ fontSize: 16 }}>🔥</Text>
            <Text style={styles.statNum}>7</Text>
            <Text style={styles.statLbl}>Streak</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.statCol}>
            <Text style={{ fontSize: 16 }}>⭐</Text>
            <Text style={styles.statNum}>1250</Text>
            <Text style={styles.statLbl}>XP</Text>
          </View>
        </View>
      </View>

      {/* ── Inner Tab Bar ── */}
      <View style={styles.innerTabBar}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} style={[styles.innerTab, activeTab === t.key && styles.innerTabActive]}
            onPress={() => setActiveTab(t.key)}>
            <Text style={[styles.innerTabTxt, activeTab === t.key && styles.innerTabTxtActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Tab Content ── */}
      <View style={styles.content}>
        {activeTab === 'home'     && <HomeTab firstName={firstName} />}
        {activeTab === 'practice' && <PracticeTab firstName={firstName} />}
        {activeTab === 'explore'  && <ExploreTab />}
        {activeTab === 'progress' && <ProgressTab />}
      </View>

    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: '#fff' },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: PAD, paddingTop: 8, paddingBottom: 8 },
  headerL:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoBox:    { width: 32, height: 32, borderRadius: 7, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' },
  logoTxt:    { color: '#fff', fontSize: 10, fontWeight: '900' },
  brand:      { fontSize: 16, fontWeight: '700', color: '#111' },
  headerR:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bellDot:    { position: 'absolute', top: 0, right: 0, width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#111', borderWidth: 1.5, borderColor: '#fff' },
  avatarBox:  { width: 32, height: 32, borderRadius: 16, backgroundColor: '#e8e8e8', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#111' },
  avatarTxt:  { color: '#111', fontWeight: '800', fontSize: 13 },

  greetRow:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: PAD, paddingBottom: 10, gap: 10 },
  greetName:  { fontSize: 18, fontWeight: '800', color: '#111', marginBottom: 2 },
  greetSub:   { fontSize: 11, color: '#666' },
  statsBox:   { borderWidth: 1.5, borderColor: '#e8e8e8', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  statCol:    { alignItems: 'center', gap: 1 },
  statNum:    { fontSize: 13, fontWeight: '800', color: '#111' },
  statLbl:    { fontSize: 8, color: '#888' },
  statDiv:    { width: 1, height: 28, backgroundColor: '#e8e8e8' },

  innerTabBar:    { flexDirection: 'row', paddingHorizontal: PAD, gap: 6, marginBottom: 10 },
  innerTab:       { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.5, borderColor: '#e8e8e8', backgroundColor: '#fff' },
  innerTabActive: { backgroundColor: '#111', borderColor: '#111' },
  innerTabTxt:    { fontSize: 12, fontWeight: '600', color: '#888' },
  innerTabTxtActive: { color: '#fff' },

  content:    { flex: 1, paddingHorizontal: PAD },
});

// Home tab styles
const h = StyleSheet.create({
  sessionCard:   { backgroundColor: '#111', borderRadius: 18, flexDirection: 'row', padding: 16, marginBottom: 10, overflow: 'hidden' },
  sessionLeft:   { flex: 1 },
  sessionTag:    { fontSize: 9, color: '#ccc', fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  sessionTitle:  { fontSize: 17, fontWeight: '900', color: '#fff', marginBottom: 8, lineHeight: 22 },
  sessionMeta:   { fontSize: 11, color: '#ccc', marginBottom: 4 },
  joinBtn:       { marginTop: 8, backgroundColor: '#fff', borderRadius: 9, paddingVertical: 8, paddingHorizontal: 16, alignSelf: 'flex-start' },
  joinTxt:       { fontSize: 12, fontWeight: '700', color: '#111' },
  continueCard:  { borderWidth: 1.5, borderColor: '#e8e8e8', borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  playCircle:    { width: 38, height: 38, borderRadius: 19, backgroundColor: '#e8e8e8', alignItems: 'center', justifyContent: 'center' },
  continueLbl:   { fontSize: 9, color: '#555', fontWeight: '700', marginBottom: 2 },
  continueTitle: { fontSize: 13, fontWeight: '700', color: '#111', marginBottom: 5 },
  progBg:        { height: 4, backgroundColor: '#e8e8e8', borderRadius: 2, overflow: 'hidden', marginBottom: 3 },
  progFill:      { height: 4, backgroundColor: '#111', borderRadius: 2 },
  progTxt:       { fontSize: 9, color: '#888' },
  resumeBtn:     { backgroundColor: '#f0f0f0', borderRadius: 9, paddingVertical: 7, paddingHorizontal: 10 },
  resumeTxt:     { fontSize: 11, color: '#111', fontWeight: '600' },
  quickRow:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  quickItem:     { alignItems: 'center', gap: 5 },
  quickIconBox:  { width: 46, height: 46, borderRadius: 13, backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: '#e8e8e8', alignItems: 'center', justifyContent: 'center' },
  quickLbl:      { fontSize: 10, fontWeight: '600', color: '#111' },
  sectionTitle:  { fontSize: 13, fontWeight: '700', color: '#111', marginBottom: 8 },
  tasksCard:     { borderWidth: 1.5, borderColor: '#e8e8e8', borderRadius: 14, overflow: 'hidden' },
  taskRow:       { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  taskCheck:     { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: '#ccc', alignItems: 'center', justifyContent: 'center' },
  taskCheckDone: { backgroundColor: '#111', borderColor: '#111' },
  taskLabel:     { flex: 1, fontSize: 12, color: '#111', fontWeight: '500' },
  taskPts:       { fontSize: 10, color: '#888', fontWeight: '600' },
});

// Practice tab styles
const p = StyleSheet.create({
  aiHeader:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  aiAvatar:       { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0f0f0', borderWidth: 1.5, borderColor: '#111', alignItems: 'center', justifyContent: 'center' },
  aiTitle:        { fontSize: 14, fontWeight: '800', color: '#111' },
  aiSub:          { fontSize: 10, color: '#888' },
  onlineBadge:    { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.5, borderColor: '#111', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  onlineDot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: '#111' },
  onlineTxt:      { fontSize: 10, color: '#111', fontWeight: '600' },
  subjectsRow:    { gap: 8, marginBottom: 10 },
  subChip:        { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.5, borderColor: '#e0e0e0' },
  subChipActive:  { backgroundColor: '#111', borderColor: '#111' },
  subChipTxt:     { fontSize: 12, color: '#555', fontWeight: '500' },
  subChipTxtActive:{ color: '#fff' },
  chatArea:       { flex: 1, backgroundColor: '#f8f8f8', borderRadius: 14, marginBottom: 8 },
  msgRow:         { flexDirection: 'row', alignItems: 'flex-end', gap: 7 },
  msgRowUser:     { flexDirection: 'row-reverse' },
  msgAvatar:      { width: 26, height: 26, borderRadius: 13, backgroundColor: '#e8e8e8', borderWidth: 1.5, borderColor: '#111', alignItems: 'center', justifyContent: 'center' },
  msgAvatarUser:  { width: 26, height: 26, borderRadius: 13, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' },
  bubble:         { maxWidth: '75%', padding: 10, borderRadius: 14 },
  bubbleAI:       { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e8e8e8', borderBottomLeftRadius: 3 },
  bubbleUser:     { backgroundColor: '#111', borderBottomRightRadius: 3 },
  bubbleTxt:      { fontSize: 12, color: '#333', lineHeight: 18 },
  suggestChip:    { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12 },
  suggestTxt:     { fontSize: 11, color: '#555', fontWeight: '500' },
  inputRow:       { flexDirection: 'row', gap: 8, alignItems: 'center', paddingBottom: 8 },
  input:          { flex: 1, borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, color: '#111' },
  sendBtn:        { width: 38, height: 38, borderRadius: 11, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' },
});

// Explore tab styles
const e = StyleSheet.create({
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#111', marginBottom: 10, marginTop: 4 },
  grid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  skillCard:    { width: (width - PAD * 2 - 10) / 2, borderWidth: 1.5, borderColor: '#e8e8e8', borderRadius: 14, padding: 14, alignItems: 'center' },
  skillIcon:    { width: 50, height: 50, borderRadius: 13, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  skillLabel:   { fontSize: 13, fontWeight: '700', color: '#111', marginBottom: 3, textAlign: 'center' },
  skillSub:     { fontSize: 10, color: '#888', textAlign: 'center', marginBottom: 10, lineHeight: 14 },
  registerBtn:  { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 8, paddingVertical: 5, paddingHorizontal: 16 },
  registerTxt:  { fontSize: 11, fontWeight: '600', color: '#111' },
  trendRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  trendNum:     { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center' },
  trendNumTxt:  { fontSize: 12, fontWeight: '700', color: '#111' },
  trendLabel:   { flex: 1, fontSize: 13, fontWeight: '500', color: '#111' },
});

// Progress tab styles
const pg = StyleSheet.create({
  pillsRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  pill:     { flex: 1, borderWidth: 1.5, borderColor: '#e8e8e8', borderRadius: 12, paddingVertical: 10, alignItems: 'center', gap: 2 },
  pillVal:  { fontSize: 12, fontWeight: '800', color: '#111' },
  pillLbl:  { fontSize: 8, color: '#aaa' },
  card:     { borderWidth: 1.5, borderColor: '#e8e8e8', borderRadius: 14, padding: 14, marginBottom: 10 },
  cardTitle:{ fontSize: 13, fontWeight: '700', color: '#111' },
});

export default HomeScreen;