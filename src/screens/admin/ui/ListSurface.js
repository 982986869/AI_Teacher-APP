// src/screens/admin/ui/ListSurface.js
// The list body every Admin collection screen shares: a white rounded surface holding a
// FlatList, with loading / error / empty routed in one place. The skeleton lives inside
// the SAME surface as the rows (no layout jump), and the rows gently fade in over it.
import React from 'react';
import { View, FlatList, ActivityIndicator } from 'react-native';
import { AdminEmptyState, AdminErrorState, ListSkeleton, S } from './kit';
import { FadeIn } from '../../parent/ParentApp/anim';

const surface = {
  flex: 1, marginHorizontal: 16, marginTop: 12, backgroundColor: S.card,
  borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, borderColor: S.hair, overflow: 'hidden',
};

export function ListSurface({
  loading, loadingMore, error, onRetry, rows, renderItem, keyExtractor, onEndReached,
  emptyIcon, emptyTitle, emptyMessage, emptyAction,
}) {
  if (error) return <AdminErrorState message={error} onRetry={onRetry} />;
  if (!loading && !rows.length) {
    return <AdminEmptyState icon={emptyIcon} title={emptyTitle} message={emptyMessage} action={emptyAction} />;
  }

  return (
    <View style={surface}>
      {loading ? (
        <View style={{ paddingTop: 6 }}><ListSkeleton rows={8} /></View>
      ) : (
        <FadeIn y={8} duration={360} style={{ flex: 1 }}>
          <FlatList
            data={rows}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 120 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.4}
            ListFooterComponent={loadingMore ? <ActivityIndicator color={S.indigo} style={{ marginVertical: 18 }} /> : null}
          />
        </FadeIn>
      )}
    </View>
  );
}
