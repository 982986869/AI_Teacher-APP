// src/screens/admin/books/BookChaptersScreen.js
// Personalized section — one book's chapters, and the four sub-sections of each.
//
// This is where the work happens: generate what is missing, read it, release it.
// Clicking a filled section OPENS it rather than publishing it — a one-tap
// publish on a row is how wrong content reaches a class, and generated material
// is occasionally wrong. Publishing lives inside the review screen.

import React, { useCallback, useState } from 'react';
import { View, ScrollView, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  ChevronRight, ChevronDown, Sparkles, RefreshCw, CircleCheck, CircleDashed,
  Clock, TriangleAlert, Eye, EyeOff, Tags,
} from 'lucide-react-native';
import { T } from '../../parent/ParentApp/constants';
import { PressableScale } from '../../parent/ParentApp/anim';
import {
  AdminScreen, AdminHeader, AdminCard, AdminBadge, AdminErrorState,
  ListSkeleton, S, tone,
} from '../ui/kit';
import * as api from '../../../api/adminBooksApi';
import { Switch, SECTIONS, kChars, Hair } from './BookBits';

// Generation reads only the first 14,000 characters of a chapter, so a chapter
// far past that is mostly invisible to the model. Saying so is how an admin
// knows the chapter needs splitting rather than regenerating.
const GEN_CHAR_CAP = 14000;

export default function BookChaptersScreen({ route, navigation }) {
  const { bookId, title } = route.params || {};
  const [state, setState] = useState({ loading: true, error: null, chapters: [] });
  const [reads, setReads] = useState({});
  const [open, setOpen] = useState(null);
  const [busy, setBusy] = useState(null);         // chapterId being toggled
  const [working, setWorking] = useState({});     // `${chapterId}:${kind}` -> true
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (quiet) => {
    if (!quiet) setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const chapters = await api.getBookChapters(bookId);
      const list = Array.isArray(chapters) ? chapters : [];
      setState({ loading: false, error: null, chapters: list });
      if (open == null && list.length) setOpen(list[0].id);
      // Read counts are an enhancement — a failure must not cost the page.
      api.getBookReads(bookId)
        .then((rows) => setReads(Object.fromEntries((rows || []).map((r) => [r.content_id, r]))))
        .catch(() => {});
    } catch (e) {
      setState({ loading: false, error: e?.message || 'Could not load chapters', chapters: [] });
    }
  }, [bookId, open]);

  useFocusEffect(useCallback(() => { load(true); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(true); setRefreshing(false); };

  const toggleChapter = async (ch) => {
    setBusy(ch.id);
    try { await api.setChapterVisible(ch.id, !ch.visible); await load(true); }
    catch (e) { Alert.alert('Could not update', e?.message || 'Please try again.'); }
    finally { setBusy(null); }
  };

  const generate = async (ch, kind) => {
    const key = `${ch.id}:${kind}`;
    setWorking((w) => ({ ...w, [key]: true }));
    try {
      await api.generateSection(ch.id, kind);
      await load(true);
    } catch (e) {
      Alert.alert('Generation failed', e?.message || 'The model could not produce usable content for this section.');
    } finally {
      setWorking((w) => { const n = { ...w }; delete n[key]; return n; });
    }
  };

  // Everything this chapter is missing, one after another. Sequential on purpose:
  // four parallel model calls is a spend burst and a rate-limit risk, and a
  // failure marks its own row while the rest carry on.
  const generateAll = async (ch) => {
    const have = new Set((ch.content || []).map((c) => c.kind));
    const todo = SECTIONS.map((s) => s.kind).filter((k) => !have.has(k));
    if (!todo.length) return;
    let made = 0;
    for (const kind of todo) {
      const key = `${ch.id}:${kind}`;
      setWorking((w) => ({ ...w, [key]: true }));
      try { await api.generateSection(ch.id, kind); made += 1; } catch { /* row stays empty */ }
      setWorking((w) => { const n = { ...w }; delete n[key]; return n; });
    }
    await load(true);
    Alert.alert(
      made === todo.length ? 'Generated' : 'Partly generated',
      `${made} of ${todo.length} section${todo.length === 1 ? '' : 's'} created. Review each before publishing.`,
    );
  };

  return (
    <AdminScreen>
      <AdminHeader
        title={title || 'Book'}
        subtitle="Chapters and generated content"
        onBack={() => navigation.goBack()}
        right={
          <PressableScale
            onPress={() => navigation.navigate('BookAutoGenerate', { bookId, title })}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Generate everything missing in this book"
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 5,
              paddingHorizontal: 11, paddingVertical: 9, borderRadius: 11,
              backgroundColor: S.indigoSoft,
            }}
          >
            <Sparkles size={14} color={S.indigo} strokeWidth={2.5} />
            <T w="xbold" s={12} c={S.indigo}>Generate all</T>
          </PressableScale>
        }
      />

      {state.loading ? (
        <View style={{ paddingHorizontal: 16 }}><ListSkeleton rows={4} /></View>
      ) : state.error ? (
        <View style={{ padding: 16 }}><AdminErrorState message={state.error} onRetry={() => load()} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={S.indigo} />}
        >
          {state.chapters.map((ch) => {
            const expanded = open === ch.id;
            const byKind = (k) => (ch.content || []).find((c) => c.kind === k);
            const filled = SECTIONS.filter((s) => byKind(s.kind)).length;
            const oversized = (ch.char_count || 0) > GEN_CHAR_CAP * 1.4;

            return (
              <AdminCard key={ch.id} style={{ marginBottom: 12, padding: 0, overflow: 'hidden' }}>
                {/* header */}
                <PressableScale
                  onPress={() => setOpen(expanded ? null : ch.id)}
                  scaleTo={0.99}
                  accessibilityRole="button"
                  accessibilityState={{ expanded }}
                  accessibilityLabel={`Chapter ${ch.position}, ${ch.title}`}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 }}
                >
                  {expanded
                    ? <ChevronDown size={18} color={S.muted} strokeWidth={2.3} />
                    : <ChevronRight size={18} color={S.muted} strokeWidth={2.3} />}
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <T w="xbold" s={14} c={S.ink} numberOfLines={2}>{ch.position}. {ch.title}</T>
                    <T w="semi" s={11.5} c={S.muted} numberOfLines={1} style={{ marginTop: 2 }}>
                      {[
                        ch.page_from && ch.page_to ? `pages ${ch.page_from}–${ch.page_to}` : null,
                        kChars(ch.char_count),
                        `${filled}/4 generated`,
                      ].filter(Boolean).join(' · ')}
                    </T>
                  </View>
                </PressableScale>

                {oversized && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, paddingBottom: 10 }}>
                    <TriangleAlert size={13} color={S.gold} strokeWidth={2.4} />
                    <T w="semi" s={11} c={S.gold} style={{ flex: 1 }} numberOfLines={2}>
                      Only the first 14k characters are used — this chapter is much longer. Split it in the web portal.
                    </T>
                  </View>
                )}

                {/* chapter gate */}
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 10,
                  paddingHorizontal: 14, paddingVertical: 11,
                  borderTopWidth: 1, borderTopColor: S.hair,
                  backgroundColor: ch.visible ? S.emeraldSoft : 'transparent',
                }}>
                  {ch.visible ? <Eye size={15} color={S.emerald} strokeWidth={2.3} />
                    : <EyeOff size={15} color={S.faint} strokeWidth={2.3} />}
                  <T w="xbold" s={12.5} c={ch.visible ? S.emerald : S.muted} style={{ flex: 1 }} numberOfLines={1}>
                    {ch.visible ? 'Chapter visible' : 'Chapter hidden'}
                  </T>
                  <Switch
                    on={!!ch.visible}
                    disabled={busy === ch.id}
                    onChange={() => toggleChapter(ch)}
                    label={`Chapter ${ch.position} visible to students`}
                  />
                </View>

                {expanded && (
                  <View style={{ paddingHorizontal: 12, paddingBottom: 12, paddingTop: 4 }}>
                    <ConceptStrip chapterId={ch.id} />

                    {SECTIONS.map((meta) => {
                      const row = byKind(meta.kind);
                      const isWorking = !!working[`${ch.id}:${meta.kind}`];
                      const live = row?.status === 'published';
                      const t = tone(meta.toneKey);
                      const read = row ? reads[row.id] : null;

                      return (
                        <PressableScale
                          key={meta.kind}
                          scaleTo={0.985}
                          disabled={isWorking}
                          accessibilityRole="button"
                          accessibilityLabel={row
                            ? `Review ${meta.label}`
                            : `Generate ${meta.label} for chapter ${ch.position}`}
                          onPress={() => {
                            if (isWorking) return;
                            if (row) {
                              navigation.navigate('BookContent', {
                                contentId: row.id, kind: meta.kind, chapterTitle: ch.title,
                              });
                            } else {
                              generate(ch, meta.kind);
                            }
                          }}
                          style={{
                            flexDirection: 'row', alignItems: 'center', gap: 11,
                            padding: 12, marginTop: 8, borderRadius: 14,
                            borderWidth: 1,
                            borderColor: live ? S.emerald : row ? S.gold : S.hair,
                            backgroundColor: live ? S.emeraldSoft : row ? S.goldSoft : S.canvas,
                          }}
                        >
                          <View style={{
                            width: 36, height: 36, borderRadius: 11, flexShrink: 0,
                            alignItems: 'center', justifyContent: 'center', backgroundColor: t.s,
                          }}>
                            {isWorking
                              ? <ActivityIndicator size="small" color={t.c} />
                              : <meta.Icon size={17} color={t.c} strokeWidth={2.2} />}
                          </View>

                          <View style={{ flex: 1, minWidth: 0 }}>
                            <T w="xbold" s={13.5} c={S.ink} numberOfLines={1}>{meta.label}</T>
                            <T w="semi" s={11} c={S.muted} numberOfLines={1} style={{ marginTop: 1 }}>
                              {isWorking ? 'Writing this section…'
                                : row ? [
                                    row.units ? `${row.units} ${meta.unit}` : null,
                                    kChars(row.chars),
                                    live && read?.readers ? `${read.readers} reader${read.readers === 1 ? '' : 's'}` : null,
                                  ].filter(Boolean).join(' · ')
                                : meta.blurb}
                            </T>
                          </View>

                          <View style={{ alignItems: 'flex-end', gap: 3, flexShrink: 0, maxWidth: '34%' }}>
                            {isWorking ? null : row ? (
                              <AdminBadge toneKey={live ? 'emerald' : 'gold'} dot={false}>
                                {live ? 'Live' : 'Draft'}
                              </AdminBadge>
                            ) : (
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Sparkles size={13} color={S.indigo} strokeWidth={2.4} />
                                <T w="xbold" s={11.5} c={S.indigo}>Generate</T>
                              </View>
                            )}
                            {row && !isWorking && (
                              <T w="semi" s={10} c={S.faint} numberOfLines={1}>tap to review</T>
                            )}
                          </View>
                        </PressableScale>
                      );
                    })}

                    {filled < SECTIONS.length && (
                      <PressableScale
                        onPress={() => generateAll(ch)}
                        accessibilityRole="button"
                        accessibilityLabel="Generate every missing section for this chapter"
                        style={{
                          flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                          gap: 7, marginTop: 10, paddingVertical: 11, borderRadius: 12,
                          backgroundColor: S.indigoSoft,
                        }}
                      >
                        <Sparkles size={15} color={S.indigo} strokeWidth={2.4} />
                        <T w="xbold" s={12.5} c={S.indigo}>
                          Generate all {SECTIONS.length - filled} missing
                        </T>
                      </PressableScale>
                    )}
                  </View>
                )}
              </AdminCard>
            );
          })}

          {!state.chapters.length && (
            <AdminCard><T w="semi" s={13} c={S.muted}>No chapters were detected in this PDF.</T></AdminCard>
          )}
        </ScrollView>
      )}
    </AdminScreen>
  );
}

/**
 * What this chapter was matched to in the concept catalog.
 *
 * Visible because these links decide which chapters a student is shown first and
 * what the app tells them to practise — a wrong one should be findable, not an
 * unexplained reordering.
 */
function ConceptStrip({ chapterId }) {
  const [links, setLinks] = useState(null);
  const [busy, setBusy] = useState(false);

  useFocusEffect(useCallback(() => {
    let alive = true;
    api.getChapterConcepts(chapterId)
      .then((d) => alive && setLinks(d || []))
      .catch(() => alive && setLinks([]));
    return () => { alive = false; };
  }, [chapterId]));

  const relink = async () => {
    setBusy(true);
    try {
      await api.relinkConcepts(chapterId);
      setLinks(await api.getChapterConcepts(chapterId));
    } catch (e) {
      Alert.alert('Could not re-match', e?.message || 'Please try again.');
    } finally { setBusy(false); }
  };

  if (links === null) return null;

  return (
    <View style={{
      padding: 11, borderRadius: 13, backgroundColor: S.canvas,
      borderWidth: 1, borderColor: S.hair, marginTop: 4,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Tags size={13} color={S.muted} strokeWidth={2.3} />
        <T w="xbold" s={10.5} c={S.muted} style={{ letterSpacing: 0.5, flex: 1 }}>TEACHES</T>
        <PressableScale onPress={relink} disabled={busy} hitSlop={8}
          accessibilityRole="button" accessibilityLabel="Re-match concepts">
          {busy ? <ActivityIndicator size="small" color={S.indigo} />
            : <RefreshCw size={13} color={S.indigo} strokeWidth={2.4} />}
        </PressableScale>
      </View>

      {links.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {links.map((c) => (
            <View key={c.id} style={{
              flexDirection: 'row', alignItems: 'center', gap: 5,
              paddingHorizontal: 9, paddingVertical: 4, borderRadius: 99,
              backgroundColor: S.indigoSoft,
            }}>
              <T w="bold" s={11} c={S.indigo} numberOfLines={1} style={{ maxWidth: 160 }}>{c.name}</T>
              <T w="semi" s={9.5} c={S.indigo} style={{ opacity: 0.65 }}>
                {Number(c.similarity).toFixed(2)}
              </T>
            </View>
          ))}
        </View>
      ) : (
        <T w="semi" s={11} c={S.faint} style={{ marginTop: 6, lineHeight: 16 }}>
          No concept matched closely enough — students get no “practise this” hint for this chapter.
        </T>
      )}
    </View>
  );
}
