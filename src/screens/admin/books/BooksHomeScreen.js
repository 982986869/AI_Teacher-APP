// src/screens/admin/books/BooksHomeScreen.js
// Personalized section, admin side — the shelf.
//
// One row per uploaded book: what state it is in, how much has been generated,
// how much is live, and the master visibility switch. Tapping opens its chapters.
//
// Upload happens here too, through the phone's own file picker — a PDF already
// on the device or in Drive goes straight up. The web portal remains the easier
// place for a 40 MB textbook on a slow connection, but needing a laptop to start
// at all was the wrong constraint.
import React, { useCallback, useState } from 'react';
import { View, ScrollView, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BookUp, ChevronRight, CircleCheck, CircleAlert, Eye, EyeOff, Loader, Plus } from 'lucide-react-native';
import { T } from '../../parent/ParentApp/constants';
import { PressableScale } from '../../parent/ParentApp/anim';
import {
  AdminScreen, AdminHeader, AdminCard, AdminBadge, AdminEmptyState, AdminErrorState,
  ListSkeleton, S, tone,
} from '../ui/kit';
import { fmtDate } from '../ui/format';
import * as api from '../../../api/adminBooksApi';
import { Switch } from './BookBits';
import UploadBookSheet from './UploadBookSheet';

export default function BooksHomeScreen({ navigation }) {
  const [state, setState] = useState({ loading: true, error: null, books: [] });
  const [busy, setBusy] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async (quiet) => {
    if (!quiet) setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const books = await api.getBooks();
      setState({ loading: false, error: null, books: Array.isArray(books) ? books : [] });
    } catch (e) {
      setState({ loading: false, error: e?.message || 'Could not load books', books: [] });
    }
  }, []);

  useFocusEffect(useCallback(() => { load(true); }, [load]));

  const onRefresh = async () => { setRefreshing(true); await load(true); setRefreshing(false); };

  const togglePublished = async (book) => {
    // Releasing a book whose sections are all still draft shows students an empty
    // shelf, so say so rather than letting it look broken.
    if (!book.published && book.content_published === 0) {
      Alert.alert('Nothing published inside', 'Release a section inside a chapter first — otherwise students open this book and find nothing.');
      return;
    }
    setBusy(book.id);
    try {
      await api.setBookPublished(book.id, !book.published);
      await load(true);
    } catch (e) {
      Alert.alert('Could not update', e?.message || 'Please try again.');
    } finally { setBusy(null); }
  };

  return (
    <AdminScreen>
      <AdminHeader
        title="Personalized"
        subtitle="Books generated for students"
        right={
          <PressableScale
            onPress={() => setUploading(true)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Upload a PDF"
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 5,
              paddingHorizontal: 12, paddingVertical: 9, borderRadius: 11,
              backgroundColor: S.indigo,
            }}
          >
            <Plus size={15} color="#FFFFFF" strokeWidth={2.8} />
            <T w="xbold" s={12.5} c="#FFFFFF">Upload</T>
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
          {!state.books.length ? (
            <AdminCard>
              <AdminEmptyState
                icon={BookUp}
                title="No books yet"
                message="Upload a PDF and it is split into chapters automatically, ready to generate notes, practice and quizzes from."
                action={
                  <PressableScale
                    onPress={() => setUploading(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Upload a PDF"
                    style={{
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
                      paddingVertical: 13, paddingHorizontal: 20, borderRadius: 13, backgroundColor: S.indigo,
                    }}
                  >
                    <Plus size={16} color="#FFFFFF" strokeWidth={2.8} />
                    <T w="xbold" s={13.5} c="#FFFFFF">Upload a PDF</T>
                  </PressableScale>
                }
              />
            </AdminCard>
          ) : state.books.map((b) => {
            const ready = b.status === 'ready';
            const failed = b.status === 'failed';
            const live = !!b.published && b.content_published > 0;
            return (
              <AdminCard key={b.id} style={{ marginBottom: 12, padding: 0, overflow: 'hidden' }}>
                <PressableScale
                  onPress={() => navigation.navigate('BookChapters', { bookId: b.id, title: b.title })}
                  scaleTo={0.985}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${b.title}`}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}
                >
                  <View style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    alignItems: 'center', justifyContent: 'center',
                    backgroundColor: failed ? S.redSoft : ready ? S.indigoSoft : S.goldSoft,
                  }}>
                    {failed ? <CircleAlert size={21} color={S.red} strokeWidth={2.2} />
                      : ready ? <BookUp size={21} color={S.indigo} strokeWidth={2.2} />
                      : <Loader size={21} color={S.gold} strokeWidth={2.2} />}
                  </View>

                  <View style={{ flex: 1, minWidth: 0 }}>
                    <T w="xbold" s={14.5} c={S.ink} numberOfLines={2}>{b.title}</T>
                    <T w="semi" s={11.5} c={S.muted} numberOfLines={1} style={{ marginTop: 3 }}>
                      {[
                        b.class_level ? `Class ${b.class_level}` : 'All classes',
                        b.subject,
                        `${b.chapters} chapter${b.chapters === 1 ? '' : 's'}`,
                      ].filter(Boolean).join(' · ')}
                    </T>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 7, flexWrap: 'wrap' }}>
                      <AdminBadge toneKey={ready ? 'emerald' : failed ? 'red' : 'gold'}>{b.status}</AdminBadge>
                      <AdminBadge toneKey={live ? 'emerald' : 'gold'} dot={false}>
                        {b.content_published}/{b.content_total} live
                      </AdminBadge>
                    </View>
                  </View>

                  <ChevronRight size={17} color={S.faint} strokeWidth={2.2} />
                </PressableScale>

                {/* The master gate, on its own row so the tap target for "open the
                    book" and the one for "release it to students" can never be
                    confused for each other. */}
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 10,
                  paddingHorizontal: 14, paddingVertical: 11,
                  borderTopWidth: 1, borderTopColor: S.hair,
                  backgroundColor: live ? S.emeraldSoft : 'transparent',
                }}>
                  {live ? <Eye size={15} color={S.emerald} strokeWidth={2.3} />
                    : <EyeOff size={15} color={S.faint} strokeWidth={2.3} />}
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <T w="xbold" s={12.5} c={live ? S.emerald : S.muted} numberOfLines={1}>
                      {live ? 'Visible to students' : b.published ? 'On, but nothing inside is live' : 'Hidden from students'}
                    </T>
                    {!!b.created_at && (
                      <T w="semi" s={10.5} c={S.faint} numberOfLines={1}>Uploaded {fmtDate(b.created_at)}</T>
                    )}
                  </View>
                  <Switch
                    on={!!b.published}
                    disabled={!ready || busy === b.id}
                    onChange={() => togglePublished(b)}
                    label={`${b.title} visible to students`}
                  />
                </View>
              </AdminCard>
            );
          })}

          {!!state.books.length && (
            <T w="semi" s={11.5} c={S.faint} style={{ textAlign: 'center', marginTop: 6, lineHeight: 17 }}>
              A student sees a section only when all three switches are on:{'\n'}book · chapter · section.
            </T>
          )}
        </ScrollView>
      )}

      <UploadBookSheet
        open={uploading}
        onClose={() => setUploading(false)}
        onDone={(created) => {
          load(true);
          // Straight from "extracted" to "generating", which is the only reason
          // the PDF was uploaded. A duplicate has nothing new to generate, so it
          // just refreshes the shelf.
          if (created?.bookId) {
            navigation.navigate('BookAutoGenerate', { bookId: created.bookId, title: created.title });
          }
        }}
      />
    </AdminScreen>
  );
}
