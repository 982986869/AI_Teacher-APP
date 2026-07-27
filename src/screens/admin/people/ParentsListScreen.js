// src/screens/admin/people/ParentsListScreen.js
// Parents list — real /api/admin/parents with search + link-status filter, paged. Shares
// the pagination + list surface with Students; each row opens the full parent profile.
import React, { useState, useEffect, useCallback } from 'react';
import { View } from 'react-native';
import { HeartHandshake, Link2 } from 'lucide-react-native';
import { getAdminParents } from '../../../api/adminApi';
import { usePagedList } from '../ui/usePagedList';
import { ListSurface } from '../ui/ListSurface';
import { AdminScreen, AdminHeader, AdminSearchBar, AdminSegmented, AdminListRow, AdminBadge, GhostButton, S } from '../ui/kit';
import { timeAgo } from '../ui/format';
import { T } from '../../parent/ParentApp/constants';

export default function ParentsListScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetcher = useCallback(
    (page, pageSize) => getAdminParents({ search: debounced, status, page, pageSize }),
    [debounced, status],
  );
  const { rows, total, loading, loadingMore, error, loadMore, reload } = usePagedList(fetcher);
  const filtersActive = !!(debounced || status);
  const clearFilters = () => { setSearch(''); setStatus(''); };

  const renderItem = ({ item, index }) => (
    <AdminListRow
      seed={item.id}
      name={item.name}
      sub={item.email || item.phone || '—'}
      when={timeAgo(item.createdAt)}
      last={index === rows.length - 1}
      right={
        item.childId ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Link2 size={13} color={S.emerald} strokeWidth={2.4} />
            <T w="bold" s={11.5} c={S.sub} numberOfLines={1} style={{ maxWidth: 92 }}>{item.childName}</T>
          </View>
        ) : (
          <AdminBadge toneKey="gold" dot={false}>Not linked</AdminBadge>
        )
      }
      onPress={() => navigation.navigate('ParentProfile', { id: item.id, name: item.name })}
    />
  );

  return (
    <AdminScreen>
      <AdminHeader title="Parents" subtitle={total ? `${total.toLocaleString('en-IN')} guardians` : 'Guardians'} onBack={() => navigation.goBack()} />

      <View style={{ paddingHorizontal: 16, gap: 12 }}>
        <AdminSearchBar value={search} onChangeText={setSearch} placeholder="Search parent or child…" />
        <AdminSegmented value={status} onChange={setStatus} options={[{ value: '', label: 'All' }, { value: 'linked', label: 'Linked' }, { value: 'unlinked', label: 'Unlinked' }]} />
      </View>

      <ListSurface
        loading={loading}
        loadingMore={loadingMore}
        error={error}
        onRetry={reload}
        rows={rows}
        keyExtractor={(it) => it.id}
        renderItem={renderItem}
        onEndReached={loadMore}
        emptyIcon={HeartHandshake}
        emptyTitle={filtersActive ? 'No parents match' : 'No parents yet'}
        emptyMessage={filtersActive ? 'Nobody matches these filters. Try widening your search.' : 'Guardians will appear here as they join.'}
        emptyAction={filtersActive ? <GhostButton label="Clear filters" onPress={clearFilters} /> : undefined}
      />
    </AdminScreen>
  );
}
