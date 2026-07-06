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
import { useClassSubjects, toTile } from '../utils/classSubjects';
import { useAuth } from '../context/AuthContext';

// Slugify with a stable hash fallback for names with no ASCII (Devanagari), so
// Class 7 हिंदी resolves to the same slug the seed used. MUST stay byte-identical
// to scripts/seedClass7McqPractice.js.
const slugify = (s) => {
  const base = String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (base) return base;
  let h = 5381;
  const str = String(s);
  for (let i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0;
  return 'u' + h.toString(36);
};

// 'Class 8' → 8; null when unknown (the backend uses the student's saved class).
const classNum = (c) => parseInt(String(c || '').replace(/\D/g, ''), 10) || null;

// Subject → API slug. 'Old - हिंदी ए' and 'Old - हिंदी ब' both slugify to "old"
// (the ASCII "Old" prefix blocks the Devanagari hash fallback), so they need
// explicit slugs matching the seed (scripts/seedClass9OldPractice.js).
const SUBJECT_SLUG_OVERRIDES = { 'Old - हिंदी ए': 'old-hindi-a', 'Old - हिंदी ब': 'old-hindi-b' };
const subjectSlug = (name) => SUBJECT_SLUG_OVERRIDES[name] || slugify(name);

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

// Class 6 has a single combined Science (OLD) subject (DB-backed, class_level=6).
const SUBJECTS_CLASS6 = [
  { name: 'Science (OLD)', emoji: '🔬', bg: '#5AA84F' },
];

// Class 7 MCQ Practice — all DB-backed (class_level=7). Names must slugify to the
// same slugs the seed (scripts/seedClass7McqPractice.js) used.
const SUBJECTS_CLASS7 = [
  { name: 'Science (Curiosity)',                emoji: '🔬', bg: '#0F8A5F' },
  { name: 'Social Science (Exploring Society)', emoji: '🌍', bg: '#B0306B' },
  { name: 'हिंदी (मल्हार)',                      emoji: '📖', bg: '#D9822B' },
  { name: 'English (Poorvi)',                   emoji: '✍️', bg: '#26215C' },
  { name: 'Maths (Ganita Prakash)',             emoji: '📐', bg: '#0C8F88' },
  { name: 'Old - Science',                      emoji: '⚗️', bg: '#5AA84F' },
  { name: 'Reasoning & Mental Ability',         emoji: '🧠', bg: '#1C1C1E' },
  { name: 'Old - Maths',                        emoji: '➗', bg: '#0F6E56' },
  { name: 'Old - Social Sc',                    emoji: '🏛️', bg: '#8A5A2B' },
  { name: 'Old - हिंदी',                         emoji: '📚', bg: '#2F80ED' },
  { name: 'Old - English',                      emoji: '📖', bg: '#7A6FD0' },
];

// Class 8 MCQ Practice — DB-backed (class_level=8). Names must slugify to the
// slugs the seed (scripts/seedClass8McqPractice.js) used.
const SUBJECTS_CLASS8 = [
  { name: 'Science (Curiosity)',                emoji: '🔬', bg: '#0F8A5F' },
  { name: 'Social Science (Exploring Society)', emoji: '🌍', bg: '#B0306B' },
  { name: 'हिंदी (मल्हार)',                      emoji: '📖', bg: '#D9822B' },
  { name: 'English (Poorvi)',                   emoji: '✍️', bg: '#26215C' },
  { name: 'Maths (Ganita Prakash)',             emoji: '📐', bg: '#0C8F88' },
  { name: 'Old - Science',                      emoji: '⚗️', bg: '#5AA84F' },
  { name: 'Reasoning & Mental Ability',         emoji: '🧠', bg: '#1C1C1E' },
  { name: 'Old - Maths',                        emoji: '➗', bg: '#0F6E56' },
  { name: 'Old - Social Sc',                    emoji: '🏛️', bg: '#8A5A2B' },
  { name: 'Old - English',                      emoji: '📖', bg: '#7A6FD0' },
  { name: 'Old - हिंदी',                         emoji: '📚', bg: '#2F80ED' },
];

// Class 9 MCQ Practice — new-syllabus subjects, DB-backed (class_level=9). Social
// Science has no practice bank, so its MCQ Practice is sourced from important-questions.
const SUBJECTS_CLASS9 = [
  { name: 'Science (Exploration)',                  emoji: '🔬', bg: '#0F8A5F' },
  { name: 'Social Science (Understanding Society)', emoji: '🌍', bg: '#B0306B' },
  { name: 'हिंदी (गंगा)',                           emoji: '📖', bg: '#D9822B' },
  { name: 'English (Kaveri)',                       emoji: '✍️', bg: '#26215C' },
  { name: 'Maths (Ganita Manjari)',                 emoji: '📐', bg: '#0C8F88' },
  { name: 'Old - Maths',                            emoji: '➗', bg: '#0F6E56' },
  { name: 'Old - Science',                          emoji: '⚗️', bg: '#5AA84F' },
  { name: 'Old - Social Sc',                        emoji: '🏛️', bg: '#8A5A2B' },
  { name: 'Old - Eng Lang',                         emoji: '📖', bg: '#7A6FD0' },
  { name: 'Old - हिंदी ए',                           emoji: '📚', bg: '#2F80ED' },
  { name: 'Old - हिंदी ब',                           emoji: '📚', bg: '#26215C' },
];

const subjectsForClass = (classLevel) =>
  classLevel === 6 ? SUBJECTS_CLASS6
    : classLevel === 7 ? SUBJECTS_CLASS7
    : classLevel === 8 ? SUBJECTS_CLASS8
    : classLevel === 9 ? SUBJECTS_CLASS9
    : SUBJECTS;

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

function ChapterCard({ subject, chapter, classLevel, onStart, onStartSubtopic }) {
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
      apiMcqSubtopics(subjectSlug(subject), slugify(chapter), classLevel)
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
  // Class 9 practice subjects are DB-driven (no hardcoded list); other classes keep theirs.
  const isC9 = classLevel === 9;
  const c9 = useClassSubjects(9, isC9);
  const subjectOptions = isC9
    ? (c9 || []).filter((s) => s.practice).map((s) => toTile(s))
    : subjectsForClass(classLevel).filter((s) => !(classLevel === 12 && s.name === 'Biology'));
  const subjMeta = subjectOptions.find((s) => s.name === subject) || subjectOptions[0];
  // Keep the active subject valid for the selected class: Class 6 has only
  // Science (OLD); Class 12 drops Biology. Reset when the current pick isn't offered.
  useEffect(() => {
    if (subjectOptions.length && !subjectOptions.some((s) => s.name === subject)) setSubject(subjectOptions[0].name);
  }, [classLevel, subject, subjectOptions.length]); // eslint-disable-line react-hooks/exhaustive-deps
  // DB-backed practice: Class 12 Physics/Chemistry/Mathematics (class_level=12),
  // Class 6 Science (OLD) (class_level=6) and ALL Class 7 subjects (class_level=7)
  // → fetch chapters + subtopics from the API. Everything else keeps the static
  // MCQ_DATA bank.
  const isDbApi =
    (classLevel === 12 && (subject === 'Physics' || subject === 'Chemistry' || subject === 'Mathematics')) ||
    (classLevel === 6 && subject === 'Science (OLD)') ||
    classLevel === 7 ||
    classLevel === 8 ||
    classLevel === 9;
  const [apiChapters, setApiChapters] = useState(null); // null = loading
  useEffect(() => {
    if (!isDbApi) { setApiChapters(null); return undefined; }
    let alive = true;
    setApiChapters(null);
    getChapters(subjectSlug(subject), undefined, classLevel)
      .then((chs) => { if (alive) setApiChapters((chs || []).map((c) => c.name)); })
      .catch(() => { if (alive) setApiChapters([]); });
    return () => { alive = false; };
  }, [isDbApi, subject, classLevel]);
  const chaptersLoading = isDbApi && apiChapters == null;
  const chapters = isDbApi
    ? (apiChapters || [])
    : Object.keys(MCQ_DATA[subject] || {});

  // Hide chapters that have no MCQ content (no subtopics/questions in the DB).
  // `avail.slugs` = Set of chapter slugs that actually have questions. While
  // loading we show nothing yet; on error we fall back to showing all chapters.
  const [avail, setAvail] = useState({ loading: true, slugs: null });
  useEffect(() => {
    let alive = true;
    setAvail({ loading: true, slugs: null });
    getMcqChaptersWithContent(subjectSlug(subject), classLevel)
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

  // Class 9 subject list still loading from the DB (or none) — avoid subjMeta undefined.
  if (isC9 && (c9 === null || !subjMeta)) {
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
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: C.muted }}>{c9 === null ? 'Loading…' : 'No practice subjects yet.'}</Text>
        </View>
      </SafeAreaView>
    );
  }

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
