// McqPracticeScreen.js
// MCQ Practice landing: pick a subject, then a chapter. Each chapter card shows
// per-chapter progress (answered / total + a green-red score bar) from
// mcqPractice.js, with "Show more" to reveal sub-topic progress. Tapping
// Start/Continue launches the MCQ test for that chapter.

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, StatusBar, SafeAreaView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MCQ_DATA, { getMcqSubtopics } from '../data/mcqPractice';
import { getMcqSubtopics as apiMcqSubtopics, getMcqChaptersWithContent } from '../api/mcqPracticeApi';
import { getChapters } from '../api/resourcesApi';
import { useAuth } from '../context/AuthContext';

const slugify = (s) =>
  String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// 'Class 11' → 11; defaults to 11.
const classNum = (c) => parseInt(String(c).replace(/\D/g, ''), 10) || 11;

const C = {
  purple: '#0C8F88', purpleDeep: '#26215C', purpleLight: '#EEEDFE',
  green: '#0F8A5F', greenSoft: '#1FB07A', red: '#F0564B', track: '#ECECF3',
  text: '#22222A', muted: '#7A7A8C', border: '#ECECEC', white: '#FFFFFF',
  pageBg: '#F4F5FB',
};

const SUBJECTS = [
  { name: 'Physics',     emoji: '⚛️', bg: '#1C1C1E' },
  { name: 'Mathematics', emoji: '📐', bg: '#0C8F88' },
  { name: 'Chemistry',   emoji: '🧪', bg: '#0F6E56' },
  { name: 'Biology',     emoji: '🧬', bg: '#B0306B' },
];

const pct = (n) => `${Math.round((n + Number.EPSILON) * 100) / 100}`;

// A track with the answered portion split into green (correct) and red (wrong).
function ProgressBar({ answered, total, score }) {
  const ans = total > 0 ? answered / total : 0;
  const greenFlex = ans * (score / 100);
  const redFlex = ans * (1 - score / 100);
  const restFlex = Math.max(0, 1 - ans);
  return (
    <View style={st.barTrack}>
      {greenFlex > 0 && <View style={{ flex: greenFlex, backgroundColor: C.greenSoft }} />}
      {redFlex > 0 && <View style={{ flex: redFlex, backgroundColor: C.red }} />}
      <View style={{ flex: restFlex, backgroundColor: 'transparent' }} />
    </View>
  );
}

function ChapterCard({ subject, chapter, classLevel = 11, onStart, onStartSubtopic }) {
  const [open, setOpen] = useState(false);
  const [subtopics, setSubtopics] = useState(null); // [{ id, name, questionCount }] | null
  const data = (MCQ_DATA[subject] && MCQ_DATA[subject][chapter]) || {};
  // Class 12 (DB-backed) chapters have no stored attempt progress yet.
  const p = data.progress || { answered: 0, total: 50, score: 0 };
  const started = p.answered > 0;

  const toggle = () => {
    setOpen((v) => !v);
    if (subtopics == null) {
      // DB-backed (incl. Class 12 Physics, Chemistry & Mathematics, at class_level=12).
      apiMcqSubtopics(slugify(subject), slugify(chapter), classLevel)
        .then((list) => setSubtopics(Array.isArray(list) ? list : []))
        .catch(() => setSubtopics([]));
    }
  };

  return (
    <View style={st.card}>
      <View style={st.cardTopRow}>
        <Text style={st.chapName}>{chapter}</Text>
      </View>

      <ProgressBar answered={p.answered} total={p.total} score={p.score} />

      <View style={st.metaRow}>
        <Text style={st.metaTxt}>{p.answered}/{p.total} Answered</Text>
        <Text style={st.metaTxt}>Score: {pct(p.score)}%</Text>
      </View>

      <Pressable style={st.showMore} onPress={toggle}>
        <Text style={st.showMoreTxt}>{open ? 'Hide sub-topics' : 'Show sub-topics'}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={14} color={C.muted} />
      </Pressable>

      {open && subtopics == null && <Text style={st.subMeta}>Loading…</Text>}
      {open && subtopics != null && subtopics.length === 0 && (
        <Text style={st.subMeta}>No sub-topics yet.</Text>
      )}
      {open && (subtopics || []).map((s) => (
        <View key={s.id} style={st.subRow}>
          <View style={st.subTopRow}>
            <Text style={st.subName} numberOfLines={2}>{s.name}</Text>
            <Pressable
              onPress={() => onStartSubtopic(subject, chapter, s.id)}
              style={[st.subStartBtn, st.actionBtnOutline]}
            >
              <Text style={[st.subStartTxt, st.actionTxtOutline]}>Start</Text>
            </Pressable>
          </View>
          <Text style={st.subMeta}>{s.questionCount} questions</Text>
        </View>
      ))}
    </View>
  );
}

export default function McqPracticeScreen({ onBack = () => {}, onStartChapter = () => {}, onStartSubtopic = () => {} }) {
  const [subject, setSubject] = useState('Physics');
  const [picker, setPicker] = useState(false);
  const { selectedClass } = useAuth();
  const classLevel = classNum(selectedClass);
  const subjMeta = SUBJECTS.find((s) => s.name === subject) || SUBJECTS[0];
  // Biology isn't offered in Class 12 — hide it from the picker there, and fall
  // back to Physics if it was the active subject when the class switched.
  const subjectOptions = SUBJECTS.filter((s) => !(classLevel === 12 && s.name === 'Biology'));
  useEffect(() => {
    if (classLevel === 12 && subject === 'Biology') setSubject('Physics');
  }, [classLevel, subject]);
  // Class 12 Physics, Chemistry & Mathematics practice are DB-backed (imported at
  // class_level=12) → fetch their chapters from the API and use API subtopics.
  // Every other subject/class keeps the DB-backed MCQ_DATA static bank.
  const isDb12 = classLevel === 12 && (subject === 'Physics' || subject === 'Chemistry' || subject === 'Mathematics');
  const [apiChapters, setApiChapters] = useState(null); // null = loading
  useEffect(() => {
    if (!isDb12) { setApiChapters(null); return undefined; }
    let alive = true;
    setApiChapters(null);
    getChapters(slugify(subject), undefined, 12)
      .then((chs) => { if (alive) setApiChapters((chs || []).map((c) => c.name)); })
      .catch(() => { if (alive) setApiChapters([]); });
    return () => { alive = false; };
  }, [isDb12, subject]);
  const chaptersLoading = isDb12 && apiChapters == null;
  const chapters = isDb12
    ? (apiChapters || [])
    : Object.keys(MCQ_DATA[subject] || {});

  // Hide chapters that have no MCQ content (no subtopics/questions in the DB).
  // `avail.slugs` = Set of chapter slugs that actually have questions. While
  // loading we show nothing yet; on error we fall back to showing all chapters.
  const [avail, setAvail] = useState({ loading: true, slugs: null });
  useEffect(() => {
    let alive = true;
    setAvail({ loading: true, slugs: null });
    getMcqChaptersWithContent(slugify(subject), classLevel)
      .then((chs) => {
        if (alive) setAvail({ loading: false, slugs: new Set((chs || []).map((c) => c.slug)) });
      })
      .catch(() => { if (alive) setAvail({ loading: false, slugs: null }); });
    return () => { alive = false; };
  }, [subject, classLevel]);

  const visibleChapters = avail.slugs
    ? chapters.filter((ch) => avail.slugs.has(slugify(ch)))
    : chapters;
  const listLoading = chaptersLoading || avail.loading;

  return (
    <SafeAreaView style={st.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.white} />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: C.white }} />}

      <View style={st.header}>
        <Pressable onPress={onBack} hitSlop={12} style={st.backRow}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
          <Text style={st.backTxt}>Back</Text>
        </Pressable>
        <Text style={st.title}>MCQ Practice</Text>
        <Text style={st.subtitle}>Pick a subject, then a chapter to begin</Text>
      </View>

      <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
        {/* Subject selector */}
        <Pressable style={st.subjCard} onPress={() => setPicker((v) => !v)}>
          <View style={[st.subjIcon, { backgroundColor: subjMeta.bg }]}>
            <Text style={{ fontSize: 24 }}>{subjMeta.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.subjName}>{subject}</Text>
            <Text style={st.subjSub}>{visibleChapters.length} chapters</Text>
          </View>
          <Ionicons name={picker ? 'chevron-up' : 'chevron-down'} size={20} color={C.muted} />
        </Pressable>

        {picker && (
          <View style={st.subjList}>
            {subjectOptions.map((s) => (
              <Pressable key={s.name} style={st.subjOption}
                onPress={() => { setSubject(s.name); setPicker(false); }}>
                <Text style={{ fontSize: 18 }}>{s.emoji}</Text>
                <Text style={[st.subjOptionTxt, s.name === subject && { color: C.purple, fontWeight: '700' }]}>
                  {s.name}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {listLoading ? (
          <Text style={st.subMeta}>Loading chapters…</Text>
        ) : visibleChapters.length === 0 ? (
          <Text style={st.subMeta}>No chapters available yet.</Text>
        ) : (
          visibleChapters.map((ch) => (
            <ChapterCard key={ch} subject={subject} chapter={ch} classLevel={classLevel}
              onStart={onStartChapter} onStartSubtopic={onStartSubtopic} />
          ))
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.pageBg },
  header: {
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 14, backgroundColor: C.white,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border,
  },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  backTxt: { fontSize: 16, fontWeight: '600', color: C.text, marginLeft: 6 },
  title: { fontSize: 24, fontWeight: '800', color: C.text },
  subtitle: { fontSize: 13.5, color: C.muted, marginTop: 3 },
  scroll: { padding: 16, gap: 14 },

  subjCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 16,
    padding: 14, gap: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: C.border,
  },
  subjIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  subjName: { fontSize: 18, fontWeight: '700', color: C.text },
  subjSub: { fontSize: 13, color: C.muted, marginTop: 2 },
  subjList: {
    backgroundColor: C.white, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border, overflow: 'hidden', marginTop: -4,
  },
  subjOption: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  subjOptionTxt: { fontSize: 15, color: C.text },

  card: {
    backgroundColor: C.white, borderRadius: 16, padding: 16,
    borderWidth: StyleSheet.hairlineWidth, borderColor: C.border, gap: 10,
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  chapName: { flex: 1, fontSize: 16, fontWeight: '700', color: C.text },
  actionBtn: { paddingVertical: 10, paddingHorizontal: 22, borderRadius: 12, minWidth: 96, alignItems: 'center' },
  actionBtnFilled: { backgroundColor: C.green },
  actionBtnOutline: { borderWidth: 1.5, borderColor: C.green, backgroundColor: C.white },
  actionTxt: { fontSize: 14.5, fontWeight: '700' },
  actionTxtFilled: { color: C.white },
  actionTxtOutline: { color: C.green },

  barTrack: {
    flexDirection: 'row', height: 7, borderRadius: 4, backgroundColor: C.track, overflow: 'hidden',
  },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaTxt: { fontSize: 12.5, color: C.muted },

  showMore: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingTop: 4 },
  showMoreTxt: { fontSize: 13, color: C.muted, fontWeight: '600' },

  subRow: {
    gap: 6, paddingTop: 12, marginTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border,
  },
  subTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  subName: { flex: 1, fontSize: 13.5, fontWeight: '600', color: C.text },
  subStartBtn: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 10, minWidth: 74, alignItems: 'center' },
  subStartTxt: { fontSize: 13, fontWeight: '700' },
  subMeta: { fontSize: 11.5, color: C.muted },
});
