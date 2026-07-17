// testCardKit.js  (re-saved to force Metro to re-read the FilterTabs fix)
// Shared, artifact-style card UI for the Class-11 test screens (Online Tests,
// Mock Tests, Practice). Keeps all three visually identical and on the app theme
// (white headers, near-black ink, neutral greys, teal brand accent).
//
// Exports: TK (palette), scoreColor, ScreenHeader, FilterTabs, SubjectRow,
//          ChapterRow, TestCard, kitStyles.

import React from 'react';
import { View, Text, Pressable, StyleSheet, TextInput, ScrollView } from 'react-native';

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
// `onBack` optional (omit for a root screen — the back link is hidden); `right` optional
// slot for a trailing control (e.g. an admin "+ Add") kept level with the title.
export function ScreenHeader({ title, subtitle, onBack, right }) {
  return (
    <View style={k.header}>
      {onBack ? (
        <Pressable onPress={onBack} style={k.backRow} hitSlop={8}>
          <Text style={k.backArrow}>{'←'}</Text>
          <Text style={k.backText}>Back</Text>
        </Pressable>
      ) : null}
      <View style={k.headRow}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={k.title} numberOfLines={1}>{title}</Text>
          {!!subtitle && <Text style={k.subtitle}>{subtitle}</Text>}
        </View>
        {right}
      </View>
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

// "All / Attempted"-style pill tabs. tabs = [{ id, label, count }]. Horizontally scrollable so
// later chips (e.g. Archived) are always reachable; the selected chip auto-scrolls into view;
// the count shows as a small badge (never a cramped "Published 191").
export function FilterTabs({ tab, onChange, tabs, style }) {
  const ref = React.useRef(null);
  const offs = React.useRef({});
  const scrollTo = (id) => { const x = offs.current[id]; if (x != null && ref.current) ref.current.scrollTo({ x: Math.max(0, x - 16), animated: true }); };
  React.useEffect(() => { const t = setTimeout(() => scrollTo(tab), 60); return () => clearTimeout(t); }, [tab]);
  return (
    <ScrollView ref={ref} horizontal showsHorizontalScrollIndicator={false} style={style} contentContainerStyle={k.tabsContent} keyboardShouldPersistTaps="handled">
      {tabs.map((t) => {
        const on = tab === t.id;
        return (
          <Pressable key={t.id} onLayout={(e) => { offs.current[t.id] = e.nativeEvent.layout.x; }} onPress={() => onChange(t.id)} style={[k.tab, on && k.tabOn]}>
            <Text numberOfLines={1} style={[k.tabTxt, on && k.tabTxtOn]}>{t.label}</Text>
            {t.count != null && <View style={[k.tabCountBadge, on && k.tabCountBadgeOn]}><Text style={[k.tabCount, on && k.tabCountOn]}>{t.count}</Text></View>}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// A subject navigation row (emoji tile + name + subtitle + chevron).
// Admin-only (optional): `onMenu` adds a trailing "⋯" for secondary actions; `dim` fades an
// archived row. No-ops for existing student callers.
export function SubjectRow({ emoji, tile, name, sub, onPress, onMenu, dim }) {
  return (
    <Pressable style={[k.subjectCard, dim && { opacity: 0.55 }]} onPress={onPress}>
      <View style={[k.subjectIcon, { backgroundColor: tile || TK.mintSoft }]}>
        <Text style={k.subjectEmoji}>{emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={k.subjectName}>{name}</Text>
        {!!sub && <Text style={k.subjectSub}>{sub}</Text>}
      </View>
      {onMenu ? <Pressable onPress={onMenu} hitSlop={10} style={k.rowMenu} accessibilityLabel="More actions"><Text style={k.rowMenuDots}>{'⋯'}</Text></Pressable> : null}
      <Text style={k.chevron}>{'›'}</Text>
    </Pressable>
  );
}

// A chapter navigation row (index + name + subtitle + chevron). Optional admin `onMenu`/`dim`.
export function ChapterRow({ index, name, sub, onPress, onMenu, dim }) {
  return (
    <Pressable style={[k.chapterRow, dim && { opacity: 0.55 }]} onPress={onPress}>
      <View style={k.chapterNum}><Text style={k.chapterNumTxt}>{index}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={k.chapterName}>{name}</Text>
        {!!sub && <Text style={k.chapterSub}>{sub}</Text>}
      </View>
      {onMenu ? <Pressable onPress={onMenu} hitSlop={10} style={k.rowMenu} accessibilityLabel="More actions"><Text style={k.rowMenuDots}>{'⋯'}</Text></Pressable> : null}
      <Text style={k.chevron}>{'›'}</Text>
    </Pressable>
  );
}

// Status pill tones for the admin browse (published/draft/archived). Absent → the student
// binary (done → grey "Completed", open → mint "Available") is used, unchanged.
const STATUS_TONE = {
  published: { soft: '#E7F3E4', ink: '#1F9D6B' },
  draft:     { soft: '#FBEED6', ink: '#B9820E' },
  archived:  { soft: '#EFEFF1', ink: '#6B6B70' },
};

// A test card: status pill (+ inline score when done), title, meta, action btn.
// metas = array of strings; scoreText shown only when `done`.
// Admin-only (optional, no-op for students): `statusTone` recolours the pill by lifecycle
// state; `onMenu` adds a trailing "⋯" overflow for secondary actions.
export function TestCard({ done, statusLabel, statusTone, title, metas = [], scoreText, scorePct, actionLabel, onPress, onMenu, disabled }) {
  const tone = statusTone ? STATUS_TONE[statusTone] : null;
  return (
    <View style={k.card}>
      <View style={k.cardMain}>
        <View style={k.cardHeadRow}>
          <View style={[k.status, done ? k.statusDone : k.statusOpen, tone && { backgroundColor: tone.soft }]}>
            <View style={[k.statusDot, { backgroundColor: tone ? tone.ink : (done ? TK.textMuted : TK.mint) }]} />
            <Text style={[k.statusTxt, { color: tone ? tone.ink : (done ? TK.textMuted : TK.mintInk) }]}>
              {statusLabel || (done ? 'Completed' : 'Available')}
            </Text>
          </View>
          {done && scoreText != null && (
            <View style={k.score}>
              <Text style={[k.scoreVal, scorePct != null && { color: scoreColor(scorePct) }]}>{scoreText}</Text>
            </View>
          )}
          {onMenu && (
            <Pressable onPress={onMenu} hitSlop={10} style={k.menuBtn} accessibilityRole="button" accessibilityLabel="More actions">
              <Text style={k.menuDots}>{'⋯'}</Text>
            </Pressable>
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
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  backArrow: { fontSize: 20, color: TK.text, marginRight: 8, fontWeight: '700' },
  backText: { fontSize: 16, color: TK.text, fontWeight: '700' },
  title: { fontSize: 24, fontWeight: '900', color: TK.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 13.5, color: TK.textMuted, marginTop: 4, fontWeight: '600' },

  searchWrap: { paddingHorizontal: 16, paddingTop: 14 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: TK.card, borderWidth: 1, borderColor: TK.border, borderRadius: 15, paddingHorizontal: 14, height: 44 },
  searchIcon: { fontSize: 14, color: TK.textMuted },
  searchInput: { flex: 1, fontSize: 14, color: TK.text, fontWeight: '600', padding: 0 },

  // Horizontal ScrollView content: NO flexDirection/flex here — that would constrain the chips
  // to the viewport width and squeeze their labels into vertical strips. Just spacing + padding.
  tabsContent: { gap: 10, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 2, alignItems: 'center' },
  tab: { flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: TK.card, borderWidth: 1, borderColor: TK.border, borderRadius: 13, paddingVertical: 9, paddingHorizontal: 15 },
  tabOn: { backgroundColor: TK.text, borderColor: TK.text },
  tabTxt: { flexShrink: 0, fontSize: 13.5, fontWeight: '800', color: TK.textMuted },
  tabTxtOn: { color: '#fff' },
  tabCountBadge: { minWidth: 18, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 9, backgroundColor: '#EEEEEF', alignItems: 'center', justifyContent: 'center' },
  tabCountBadgeOn: { backgroundColor: 'rgba(255,255,255,0.22)' },
  tabCount: { fontSize: 12, fontWeight: '800', color: '#8A8A8F' },
  tabCountOn: { color: '#fff' },

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
  menuBtn: { marginLeft: 'auto', width: 30, height: 26, alignItems: 'center', justifyContent: 'center' },
  menuDots: { fontSize: 22, lineHeight: 22, color: TK.textMuted, fontWeight: '800' },

  btn: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 12 },
  btnAttempt: { backgroundColor: TK.mint },
  btnAttemptTxt: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 0.2 },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: TK.border },
  btnGhostTxt: { color: TK.text, fontSize: 13, fontWeight: '800', letterSpacing: 0.2 },

  chevron: { fontSize: 24, color: '#C7C7CC', fontWeight: '400', marginLeft: 8 },
  rowMenu: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', marginLeft: 2 },
  rowMenuDots: { fontSize: 22, lineHeight: 22, color: TK.textMuted, fontWeight: '800' },
});
