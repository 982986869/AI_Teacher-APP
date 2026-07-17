// src/screens/admin/learning/LearningHomeScreen.js
// The Learning workspace landing — a calm, Student-style page with REAL actions. Coverage
// counts, a review queue, recently edited content, and an entry into the content library.
// Everything reads /api/admin/cms; publishing from here reaches the Student app.
import React, { useState, useCallback } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Plus, Library, ChevronRight, CircleCheck } from 'lucide-react-native';
import { getCmsMeta, getCmsNodes } from '../../../api/adminApi';
import {
  AdminScreen, AdminCard, MetricGrid, Section, IconChip, AdminErrorState, ListSkeleton, S,
} from '../ui/kit';
import { apiError } from '../ui/format';
import { T } from '../../parent/ParentApp/constants';
import { PressableScale, Wave, Stagger } from '../../parent/ParentApp/anim';
import { NodeRow } from './parts';
import { LEVEL_ICON, LEVEL_TONE, LEVEL_LABEL } from './levels';

export default function LearningHomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [meta, setMeta] = useState(null);
  const [review, setReview] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [m, r, rec] = await Promise.all([
        getCmsMeta(),
        getCmsNodes({ status: 'review', sort: 'updatedAt', dir: 'desc', pageSize: 5 }),
        getCmsNodes({ sort: 'updatedAt', dir: 'desc', pageSize: 6 }),
      ]);
      setMeta(m); setReview(r?.rows || []); setRecent(rec?.rows || []);
    } catch (e) { setError(apiError(e, 'Could not load the content workspace.')); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const countFor = (level) => (meta?.counts || []).reduce((s, c) => (c.level === level ? s + Number(c.n || 0) : s), 0);
  const openNode = (n) => navigation.navigate('NodeDetail', { id: n.id });
  const browse = () => navigation.navigate('NodeList', { parentId: null, parentName: null, parentLevel: null });

  return (
    <AdminScreen>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 130 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={S.indigo} />}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <T w="semi" s={13.5} c={S.muted}>Learning content</T>
              <Wave><T s={14}>📚</T></Wave>
            </View>
            <T w="black" s={26} c={S.ink} style={{ letterSpacing: -0.6, marginTop: 2 }} accessibilityRole="header">Content library</T>
            <T w="semi" s={13} c={S.muted} style={{ marginTop: 3, lineHeight: 18 }}>Build what students learn — publish to make it live.</T>
          </View>
          <PressableScale onPress={() => navigation.navigate('NodeForm', { mode: 'add', parentId: null, childLevel: 'board' })} hitSlop={8}
            accessibilityRole="button" accessibilityLabel="Add board"
            style={{ width: 42, height: 42, borderRadius: 13, backgroundColor: S.indigo, alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={20} color="#fff" strokeWidth={2.6} />
          </PressableScale>
        </View>

        <View style={{ marginTop: 20 }}>
          {loading && !meta ? (
            <View>
              <View style={{ backgroundColor: S.card, borderRadius: 20, borderWidth: 1, borderColor: S.hair, paddingVertical: 6 }}><ListSkeleton rows={5} /></View>
            </View>
          ) : error && !meta ? (
            <AdminErrorState message={error} onRetry={load} />
          ) : (
            <Stagger base={30} step={70}>
              {/* Browse */}
              <AdminCard onPress={browse} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <IconChip icon={Library} toneKey="indigo" size={48} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <T w="black" s={15.5} c={S.ink}>Browse content library</T>
                  <T w="semi" s={12.5} c={S.muted} numberOfLines={1} style={{ marginTop: 2 }}>Boards → classes → subjects → chapters → topics → lessons</T>
                </View>
                <ChevronRight size={20} color={S.faint} />
              </AdminCard>

              {/* Coverage */}
              <Section label="Coverage">
                <MetricGrid items={[
                  { icon: LEVEL_ICON.subject, toneKey: LEVEL_TONE.subject, value: countFor('subject'), label: 'Subjects' },
                  { icon: LEVEL_ICON.chapter, toneKey: LEVEL_TONE.chapter, value: countFor('chapter'), label: 'Chapters' },
                  { icon: LEVEL_ICON.topic, toneKey: LEVEL_TONE.topic, value: countFor('topic'), label: 'Topics' },
                  { icon: LEVEL_ICON.lesson, toneKey: LEVEL_TONE.lesson, value: countFor('lesson'), label: 'Lessons' },
                ]} />
              </Section>

              {/* Needs review */}
              {review.length ? (
                <Section label="Needs review" card>
                  {review.map((n, i) => <NodeRow key={n.id} node={n} onPress={() => openNode(n)} last={i === review.length - 1} />)}
                </Section>
              ) : null}

              {/* Recently edited */}
              <Section label="Recently edited" card>
                {recent.length
                  ? recent.map((n, i) => <NodeRow key={n.id} node={n} onPress={() => openNode(n)} last={i === recent.length - 1} />)
                  : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }}>
                      <CircleCheck size={17} color={S.emerald} />
                      <T w="bold" s={13} c={S.muted}>No content yet — add a board to begin.</T>
                    </View>
                  )}
              </Section>
            </Stagger>
          )}
        </View>
      </ScrollView>
    </AdminScreen>
  );
}
