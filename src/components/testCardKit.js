// testCardKit.js
// Shared, artifact-style card UI for the Class-11 test screens (Online Tests,
// Mock Tests, Practice). Keeps all three visually identical and on the app theme
// (white headers, near-black ink, neutral greys, teal brand accent).
//
// Exports: TK (palette), scoreColor, ScreenHeader, FilterTabs, SubjectRow,
//          ChapterRow, TestCard, kitStyles.

import React from 'react';
import { View, Text, Pressable, StyleSheet, TextInput } from 'react-native';

export const TK = {
  bg: '#F7F7F7',
  card: '#FFFFFF',
  border: '#E8E8E8',
  text: '#1C1C1E',
  textMuted: '#6B6B70',
  mint: '#0FA39A',      // brand accent (teal)
  mintInk: '#0A7D75',   // darker teal for text on tints
  mintSoft: '#E1F5F3',  // accent tint
};

// Colour a completion percentage: green (strong) · amber (mid) · red (weak).
export const scoreColor = (pct) =>
  (pct >= 75 ? '#22B07A' : pct >= 40 ? '#F5A623' : '#F0564B');

// White header with a bottom border, back link, title + subtitle.
export function ScreenHeader({ title, subtitle, onBack }) {
  return (
    <View style={k.header}>
      <Pressable onPress={onBack} style={k.backRow} hitSlop={8}>
        <Text style={k.backArrow}>{'←'}</Text>
        <Text style={k.backText}>Back</Text>
      </Pressable>
      <Text style={k.title} numberOfLines={1}>{title}</Text>
      {!!subtitle && <Text style={k.subtitle}>{subtitle}</Text>}
    </View>
  );
}

// Optional search box (same look as Online Tests).
export function SearchBox({ value, onChangeText, placeholder }) {
  return (
    <View style={k.searchWrap}>
      <View style={k.search}>
        <Text style={k.searchIcon}>{'\u{1F50D}'}</Text>
        <TextInput
          style={k.searchInput}
          placeholder={placeholder}
          placeholderTextColor={TK.textMuted}
          value={value}
          onChangeText={onChangeText}
          returnKeyType="search"
        />
      </View>
    </View>
  );
}

// "All / Attempted"-style pill tabs. tabs = [{ id, label, count }].
export function FilterTabs({ tab, onChange, tabs, style }) {
  return (
    <View style={[k.tabs, style]}>
      {tabs.map((t) => {
        const on = tab === t.id;
        return (
          <Pressable key={t.id} onPress={() => onChange(t.id)} style={[k.tab, on && k.tabOn]}>
            <Text style={[k.tabTxt, on && k.tabTxtOn]}>{t.label}</Text>
            {t.count != null && <Text style={[k.tabCount, on && k.tabCountOn]}>{t.count}</Text>}
          </Pressable>
        );
      })}
    </View>
  );
}

// A subject navigation row (emoji tile + name + subtitle + chevron).
export function SubjectRow({ emoji, tile, name, sub, onPress }) {
  return (
    <Pressable style={k.subjectCard} onPress={onPress}>
      <View style={[k.subjectIcon, { backgroundColor: tile || TK.mintSoft }]}>
        <Text style={k.subjectEmoji}>{emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={k.subjectName}>{name}</Text>
        {!!sub && <Text style={k.subjectSub}>{sub}</Text>}
      </View>
      <Text style={k.chevron}>{'›'}</Text>
    </Pressable>
  );
}

// A chapter navigation row (index + name + subtitle + chevron).
export function ChapterRow({ index, name, sub, onPress }) {
  return (
    <Pressable style={k.chapterRow} onPress={onPress}>
      <View style={k.chapterNum}><Text style={k.chapterNumTxt}>{index}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={k.chapterName}>{name}</Text>
        {!!sub && <Text style={k.chapterSub}>{sub}</Text>}
      </View>
      <Text style={k.chevron}>{'›'}</Text>
    </Pressable>
  );
}

// A test card: status pill (+ inline score when done), title, meta, action btn.
// metas = array of strings; scoreText shown only when `done`.
export function TestCard({ done, statusLabel, title, metas = [], scoreText, scorePct, actionLabel, onPress, disabled }) {
  return (
    <View style={k.card}>
      <View style={k.cardMain}>
        <View style={k.cardHeadRow}>
          <View style={[k.status, done ? k.statusDone : k.statusOpen]}>
            <View style={[k.statusDot, { backgroundColor: done ? TK.textMuted : TK.mint }]} />
            <Text style={[k.statusTxt, { color: done ? TK.textMuted : TK.mintInk }]}>
              {statusLabel || (done ? 'Completed' : 'Available')}
            </Text>
          </View>
          {done && scoreText != null && (
            <View style={k.score}>
              <Text style={[k.scoreVal, scorePct != null && { color: scoreColor(scorePct) }]}>{scoreText}</Text>
            </View>
          )}
        </View>

        <Text style={k.cardTitle} numberOfLines={2}>{title}</Text>

        {metas.length > 0 && (
          <View style={k.metaRow}>
            {metas.map((m, i) => <Text key={i} style={k.meta}>{m}</Text>)}
          </View>
        )}
      </View>

      <Pressable
        style={[k.btn, done ? k.btnGhost : k.btnAttempt]}
        onPress={onPress}
        disabled={disabled}
      >
        <Text style={done ? k.btnGhostTxt : k.btnAttemptTxt}>{actionLabel || (done ? 'Retake' : 'Attempt')}</Text>
      </Pressable>
    </View>
  );
}

export const kitStyles = () => k;

const k = StyleSheet.create({
  header: { backgroundColor: TK.card, paddingTop: 48, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1.5, borderBottomColor: TK.border },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  backArrow: { fontSize: 20, color: TK.text, marginRight: 8, fontWeight: '700' },
  backText: { fontSize: 16, color: TK.text, fontWeight: '700' },
  title: { fontSize: 24, fontWeight: '900', color: TK.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 13.5, color: TK.textMuted, marginTop: 4, fontWeight: '600' },

  searchWrap: { paddingHorizontal: 16, paddingTop: 14 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: TK.card, borderWidth: 1, borderColor: TK.border, borderRadius: 15, paddingHorizontal: 14, height: 44 },
  searchIcon: { fontSize: 14, color: TK.textMuted },
  searchInput: { flex: 1, fontSize: 14, color: TK.text, fontWeight: '600', padding: 0 },

  tabs: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 2 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: TK.card, borderWidth: 1, borderColor: TK.border, borderRadius: 13, paddingVertical: 9, paddingHorizontal: 16 },
  tabOn: { backgroundColor: TK.text, borderColor: TK.text },
  tabTxt: { fontSize: 13.5, fontWeight: '800', color: TK.textMuted },
  tabTxtOn: { color: '#fff' },
  tabCount: { fontSize: 13, fontWeight: '800', color: '#9A9A9F' },
  tabCountOn: { color: '#8FE3DC' },

  subjectCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: TK.card, borderRadius: 18, borderWidth: 1, borderColor: TK.border, padding: 14, marginBottom: 12 },
  subjectIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  subjectEmoji: { fontSize: 26 },
  subjectName: { fontSize: 17, fontWeight: '800', color: TK.text },
  subjectSub: { fontSize: 12.5, color: TK.textMuted, marginTop: 2, fontWeight: '600' },

  chapterRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: TK.card, borderRadius: 14, borderWidth: 1, borderColor: TK.border, padding: 14, marginBottom: 10 },
  chapterNum: { width: 30, height: 30, borderRadius: 9, backgroundColor: TK.mintSoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  chapterNumTxt: { fontSize: 13, fontWeight: '800', color: TK.mintInk },
  chapterName: { fontSize: 14.5, fontWeight: '700', color: TK.text },
  chapterSub: { fontSize: 12, color: TK.textMuted, marginTop: 2, fontWeight: '600' },

  card: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: TK.card, borderWidth: 1, borderColor: TK.border, borderRadius: 18, padding: 16, marginBottom: 12 },
  cardMain: { flex: 1, gap: 9 },
  cardHeadRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingHorizontal: 9, borderRadius: 8 },
  statusOpen: { backgroundColor: TK.mintSoft },
  statusDone: { backgroundColor: '#F0F0F0' },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusTxt: { fontSize: 11, fontWeight: '800', letterSpacing: 0.2 },

  cardTitle: { fontSize: 16, fontWeight: '800', color: TK.text, letterSpacing: -0.2 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  meta: { fontSize: 12, fontWeight: '700', color: TK.textMuted },

  score: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  scoreVal: { fontSize: 15, fontWeight: '800', color: TK.text, letterSpacing: -0.3 },

  btn: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 12 },
  btnAttempt: { backgroundColor: TK.mint },
  btnAttemptTxt: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 0.2 },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: TK.border },
  btnGhostTxt: { color: TK.text, fontSize: 13, fontWeight: '800', letterSpacing: 0.2 },

  chevron: { fontSize: 24, color: '#C7C7CC', fontWeight: '400', marginLeft: 8 },
});
