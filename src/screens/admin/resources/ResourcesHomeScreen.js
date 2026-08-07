// src/screens/admin/resources/ResourcesHomeScreen.js
// Admin Resources — organized by CLASS: Class → Subjects → (chapters/papers). A local class-chip
// row sits under the header; the subject list + chapter/hidden/paper counts are all scoped to the
// selected class (never a global 43-subject mix). The class is remembered per-tab and preserved
// on return. Stable icon per subject name (not index). Real data
// /api/admin/resources/subjects(+/classes); stale responses dropped via a sequence guard.
//
// Recoloured onto the AILERNOVA dark design system (src/theme/designSystem.js). The shared
// `testCardKit` (TK/ScreenHeader/SearchBox/SubjectRow) and `ClassSelector` are still light-themed
// and shared by other un-migrated screens, so this screen no longer uses them — it renders its
// own local dark Header/SearchField/ClassChips/SubjectRow instead (same pattern as
// AdminHomeScreen.js's local DK reskin).
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, SafeAreaView, StatusBar, ActivityIndicator, Pressable, RefreshControl, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAdminResourceSubjects, getAdminResourceClasses } from '../../../api/adminApi';
import { FONT } from '../../../constants/fonts';
import { getLastClass, setLastClass } from '../../../utils/lastClass';
import { useBottomPad } from '../../../theme/layout';
import { COLORS } from '../../../theme/designSystem';

// Local dark palette — this screen's own reskin onto the AILERNOVA design system's COLORS
// tokens, matching AdminHomeScreen.js's DK palette exactly for consistency across the two
// screens. Kept local (not added to the shared light `testCardKit`) since that kit is still
// what every un-migrated light admin/student test screen renders with.
const DK = {
  canvas: COLORS.background,
  card: 'rgba(255,255,255,0.05)',
  hair: 'rgba(255,255,255,0.10)',
  ink: COLORS.textPrimary,
  muted: COLORS.textSecondary,
  faint: 'rgba(241,240,245,0.45)',
  indigo: COLORS.primary, indigoSoft: 'rgba(124,58,237,0.18)',
  blue: '#60A5FA', blueSoft: 'rgba(96,165,250,0.16)',
  emerald: COLORS.success, emeraldSoft: 'rgba(16,185,129,0.16)',
  gold: COLORS.accent, goldSoft: 'rgba(245,158,11,0.16)',
  orange: COLORS.warning, orangeSoft: 'rgba(249,115,22,0.16)',
  purple: COLORS.primaryLight, purpleSoft: 'rgba(168,85,247,0.16)',
};

// Subject tiles cycle through the palette roles for a little visual variety (the old kit gave
// every subject the same flat teal tile).
const TINTS = [
  { tint: DK.indigo, soft: DK.indigoSoft },
  { tint: DK.blue, soft: DK.blueSoft },
  { tint: DK.emerald, soft: DK.emeraldSoft },
  { tint: DK.gold, soft: DK.goldSoft },
  { tint: DK.orange, soft: DK.orangeSoft },
  { tint: DK.purple, soft: DK.purpleSoft },
];

// Stable icon per subject (by name), never index-based. Order matters: more specific keys
// (e.g. "Social Science") MUST come before their substrings (e.g. "Science").
const SUBJ_EMOJI = {
  'Artificial Intelligence': '🤖', 'Information Technology': '💻', 'Computer': '💻',
  'Social Science': '🌐', 'सामाजिक': '🌐',
  Mathematics: '📐', Maths: '📐', Physics: '⚛️', Chemistry: '🧪', Biology: '🧬', Science: '🔬',
  English: '📖', Hindi: '📚', 'हिंदी': '📚', Sanskrit: '🕉️', 'संस्कृत': '🕉️', Reasoning: '🧠',
};
const iconForSubject = (name) => {
  const k = Object.keys(SUBJ_EMOJI).find((key) => (name || '').includes(key));
  return k ? SUBJ_EMOJI[k] : '📘';
};

function Header({ title, subtitle }) {
  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10 }}>
      <Text style={{ fontSize: 24, fontFamily: FONT.extrabold, color: DK.ink, letterSpacing: -0.5 }} numberOfLines={1}>{title}</Text>
      {!!subtitle && <Text style={{ fontSize: 13.5, fontFamily: FONT.semibold, color: DK.muted, marginTop: 4 }}>{subtitle}</Text>}
    </View>
  );
}

function SearchField({ value, onChangeText, placeholder }) {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: DK.card, borderWidth: 1, borderColor: DK.hair, borderRadius: 15, paddingHorizontal: 14, height: 44 }}>
        <Text style={{ fontSize: 14, color: DK.muted }}>{'\u{1F50D}'}</Text>
        <TextInput
          style={{ flex: 1, fontSize: 14, color: DK.ink, fontFamily: FONT.semibold, padding: 0 }}
          placeholder={placeholder}
          placeholderTextColor={DK.faint}
          value={value}
          onChangeText={onChangeText}
          returnKeyType="search"
        />
      </View>
    </View>
  );
}

// "Class N" chips, same behaviour as the shared ClassSelector (horizontal scroll, selected chip
// auto-scrolls into view) but styled onto the dark palette instead of ClassSelector's hardcoded
// white/black chip theme.
function ClassChips({ classes, value, onChange }) {
  // Horizontal ScrollView here was found to intermittently fail to paint its Pressable
  // children's Text on this RN/Android combo — background/border render fine, the label
  // just never paints (a real, reproducible platform quirk, not a color/font issue). A
  // plain wrapping row sidesteps it entirely and reads fine for a handful of classes.
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingVertical: 10 }}>
      {classes.map((n) => {
        const on = n === value;
        return (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            style={{ paddingVertical: 9, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1.5, borderColor: on ? DK.indigo : DK.hair, backgroundColor: on ? DK.indigo : DK.card }}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={`Class ${n}`}
          >
            <Text numberOfLines={1} style={{ fontSize: 13, fontFamily: FONT.extrabold, color: on ? '#fff' : DK.muted }}>Class {n}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// A subject navigation row (emoji tile + name + subtitle + chevron) — dark equivalent of
// testCardKit's SubjectRow, no box-shadow (doesn't read on a dark background).
function SubjectRow({ emoji, name, sub, tint, soft, onPress }) {
  return (
    <Pressable style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: DK.card, borderRadius: 18, borderWidth: 1, borderColor: DK.hair, padding: 14, marginBottom: 12 }} onPress={onPress}>
      <View style={{ width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14, backgroundColor: soft || DK.indigoSoft }}>
        <Text style={{ fontSize: 26 }}>{emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 17, fontFamily: FONT.extrabold, color: DK.ink }}>{name}</Text>
        {!!sub && <Text style={{ fontSize: 12.5, color: DK.muted, marginTop: 2, fontFamily: FONT.semibold }}>{sub}</Text>}
      </View>
      <Text style={{ fontSize: 24, color: DK.faint, fontWeight: '400', marginLeft: 8 }}>{'›'}</Text>
    </Pressable>
  );
}

export default function ResourcesHomeScreen({ navigation }) {
  const [classes, setClasses] = useState([]);
  const [cls, setCls] = useState(null);
  const [ready, setReady] = useState(false);
  const [search, setSearch] = useState('');
  const [data, setData] = useState({ loading: true, error: '', list: [] });
  const bottomPad = useBottomPad();
  const seq = useRef(0);

  const load = useCallback(async (klass) => {
    if (klass == null) { setData({ loading: false, error: '', list: [] }); return; }
    const my = ++seq.current;
    setData((d) => ({ ...d, loading: true, error: '' }));
    try { const d = await getAdminResourceSubjects({ class: klass }); if (my === seq.current) setData({ loading: false, error: '', list: d?.rows || [] }); }
    catch (e) { if (my === seq.current) setData({ loading: false, error: e?.response?.data?.error || e?.message || 'Could not load subjects', list: [] }); }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      let list = [];
      try { const d = await getAdminResourceClasses(); list = d?.classes || []; } catch { /* keep [] */ }
      const saved = await getLastClass('resources');
      if (!alive) return;
      setClasses(list);
      setCls(saved != null && list.includes(saved) ? saved : (list[0] ?? null));
      setReady(true);
    })();
    return () => { alive = false; };
  }, []);

  useFocusEffect(useCallback(() => { if (ready && cls != null) load(cls); }, [ready, cls, load]));

  const pickClass = (n) => { if (n === cls) return; setCls(n); setLastClass('resources', n); setSearch(''); load(n); };

  const q = search.trim().toLowerCase();
  const list = q ? data.list.filter((s) => (s.name || '').toLowerCase().includes(q)) : data.list;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: DK.canvas }}>
      <StatusBar barStyle="light-content" backgroundColor={DK.canvas} />
      <Header title="Resources" subtitle="Pick a class, then a subject" />
      {classes.length > 0 && <ClassChips classes={classes} value={cls} onChange={pickClass} />}
      <SearchField value={search} onChangeText={setSearch} placeholder={cls != null ? `Search Class ${cls} subjects…` : 'Search subjects…'} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: bottomPad }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => load(cls)} tintColor={DK.indigo} />}>
        {!ready || (data.loading && !data.list.length) ? (
          <View style={{ paddingVertical: 44, alignItems: 'center' }}><ActivityIndicator color={DK.indigo} /></View>
        ) : !classes.length ? (
          <View style={{ paddingVertical: 48, alignItems: 'center' }}><Text style={{ color: DK.muted, fontSize: 14, fontFamily: FONT.semibold, textAlign: 'center' }}>No resources yet.</Text></View>
        ) : data.error ? (
          <View style={{ paddingVertical: 40, alignItems: 'center', gap: 12 }}>
            <Text style={{ color: DK.muted, fontSize: 14, fontFamily: FONT.semibold, textAlign: 'center' }}>{data.error}</Text>
            <Pressable onPress={() => load(cls)} style={{ backgroundColor: DK.indigo, borderRadius: 13, paddingVertical: 10, paddingHorizontal: 24 }}><Text style={{ color: '#fff', fontFamily: FONT.extrabold, fontSize: 13 }}>Retry</Text></Pressable>
          </View>
        ) : !list.length ? (
          <View style={{ paddingVertical: 48, alignItems: 'center' }}>
            <Text style={{ color: DK.muted, fontSize: 14, fontFamily: FONT.semibold, textAlign: 'center' }}>{q ? `No Class ${cls} subjects match your search.` : `No resources for Class ${cls} yet.`}</Text>
          </View>
        ) : list.map((s, i) => {
          const c = TINTS[i % TINTS.length];
          return (
            <SubjectRow
              key={s.id}
              emoji={iconForSubject(s.name)}
              name={s.name}
              sub={`Class ${cls}  ·  ${s.chapterCount} ${s.chapterCount === 1 ? 'chapter' : 'chapters'}${s.paperCount ? `  ·  ${s.paperCount} papers` : ''}${s.hiddenCount ? `  ·  ${s.hiddenCount} hidden` : ''}`}
              tint={c.tint}
              soft={c.soft}
              onPress={() => navigation.navigate('SubjectResources', { slug: s.slug, name: s.name, classLevel: cls })}
            />
          );
        })}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
