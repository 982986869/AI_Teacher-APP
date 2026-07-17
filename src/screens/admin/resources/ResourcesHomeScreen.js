// src/screens/admin/resources/ResourcesHomeScreen.js
// Admin Resources — organized by CLASS: Class → Subjects → (chapters/papers). A shared
// ClassSelector sits under the header; the subject list + chapter/hidden/paper counts are all
// scoped to the selected class (never a global 43-subject mix). The class is remembered per-tab
// and preserved on return. Built from the shared testCardKit (SubjectRow); stable icon per
// subject name (not index). Real data /api/admin/resources/subjects(+/classes); stale
// responses dropped via a sequence guard.
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ScrollView, SafeAreaView, StatusBar, ActivityIndicator, Pressable, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getAdminResourceSubjects, getAdminResourceClasses } from '../../../api/adminApi';
import { FONT } from '../../../constants/fonts';
import { TK, ScreenHeader, SearchBox, SubjectRow } from '../../../components/testCardKit';
import ClassSelector from '../../../components/ClassSelector';
import { getLastClass, setLastClass } from '../../../utils/lastClass';
import { useBottomPad } from '../../../theme/layout';

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
    <SafeAreaView style={{ flex: 1, backgroundColor: TK.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={TK.card} />
      <ScreenHeader title="Resources" subtitle="Pick a class, then a subject" />
      {classes.length > 0 && <ClassSelector classes={classes} value={cls} onChange={pickClass} />}
      <SearchBox value={search} onChangeText={setSearch} placeholder={cls != null ? `Search Class ${cls} subjects…` : 'Search subjects…'} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: bottomPad }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => load(cls)} tintColor={TK.mint} />}>
        {!ready || (data.loading && !data.list.length) ? (
          <View style={{ paddingVertical: 44, alignItems: 'center' }}><ActivityIndicator color={TK.mint} /></View>
        ) : !classes.length ? (
          <View style={{ paddingVertical: 48, alignItems: 'center' }}><Text style={{ color: TK.textMuted, fontSize: 14, fontFamily: FONT.semibold, textAlign: 'center' }}>No resources yet.</Text></View>
        ) : data.error ? (
          <View style={{ paddingVertical: 40, alignItems: 'center', gap: 12 }}>
            <Text style={{ color: TK.textMuted, fontSize: 14, fontFamily: FONT.semibold, textAlign: 'center' }}>{data.error}</Text>
            <Pressable onPress={() => load(cls)} style={{ borderWidth: 1.5, borderColor: TK.border, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 20 }}><Text style={{ color: TK.text, fontFamily: FONT.extrabold, fontSize: 13 }}>Retry</Text></Pressable>
          </View>
        ) : !list.length ? (
          <View style={{ paddingVertical: 48, alignItems: 'center' }}>
            <Text style={{ color: TK.textMuted, fontSize: 14, fontFamily: FONT.semibold, textAlign: 'center' }}>{q ? `No Class ${cls} subjects match your search.` : `No resources for Class ${cls} yet.`}</Text>
          </View>
        ) : list.map((s) => (
          <SubjectRow
            key={s.id}
            emoji={iconForSubject(s.name)}
            name={s.name}
            sub={`Class ${cls}  ·  ${s.chapterCount} ${s.chapterCount === 1 ? 'chapter' : 'chapters'}${s.paperCount ? `  ·  ${s.paperCount} papers` : ''}${s.hiddenCount ? `  ·  ${s.hiddenCount} hidden` : ''}`}
            onPress={() => navigation.navigate('SubjectResources', { slug: s.slug, name: s.name, classLevel: cls })}
          />
        ))}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
