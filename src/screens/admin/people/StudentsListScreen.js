// src/screens/admin/people/StudentsListScreen.js
// The Results tab ROOT — search any student, then open their exact Student Results view.
// It's a tab root, so: no back button, titled "Results" (not "Students"). Class filter chips
// are CANONICAL ("Class 11", never a duplicate "11") via the normalized users/meta endpoint.
// Student rows are calm and two-line; a missing name falls back honestly (email prefix /
// "Unnamed student") — never an ellipsis.
import React, { useState, useEffect, useCallback } from 'react';
import { View } from 'react-native';
import { GraduationCap, ChevronRight } from 'lucide-react-native';
import { getAdminUsers, getAdminUsersMeta } from '../../../api/adminApi';
import { usePagedList } from '../ui/usePagedList';
import { ListSurface } from '../ui/ListSurface';
import { AdminSearchBar, AdminSegmented, ChipRow, Avatar, AdminBadge, GhostButton, S } from '../ui/kit';
import { StudentScreenHeader } from '../../../theme/studentUI';
import { timeAgo } from '../ui/format';
import { normalizeClassLabel } from '../../../utils/classNormalize';
import { T } from '../../parent/ParentApp/constants';
import { PressableScale } from '../../parent/ParentApp/anim';

// Honest display name — never an ellipsis. Falls back to the email prefix, then a neutral label.
const displayNameOf = (u) => (u.name && u.name.trim()) || (u.email ? u.email.split('@')[0] : '') || 'Unnamed student';

function StudentRow({ item, last, onPress }) {
  const name = displayNameOf(item);
  const classLabel = normalizeClassLabel(item.grade);
  return (
    <PressableScale onPress={onPress} scaleTo={0.98}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: last ? 0 : 1, borderBottomColor: S.hair }}
      accessibilityRole="button" accessibilityLabel={name}>
      <Avatar seed={item.id} name={name} size={46} />
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <T w="xbold" s={14.5} c={S.ink} numberOfLines={2}>{name}</T>
        <T w="semi" s={12} c={S.muted} numberOfLines={1}>{item.email || item.phone || 'No contact on file'}</T>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginTop: 2 }}>
          {classLabel ? <AdminBadge toneKey="indigo" dot={false}>{classLabel}</AdminBadge> : null}
          <AdminBadge toneKey={item.isActive ? 'emerald' : 'red'}>{item.isActive ? 'Active' : 'Inactive'}</AdminBadge>
          {item.createdAt ? <T w="semi" s={11} c={S.faint}>Joined {timeAgo(item.createdAt)}</T> : null}
        </View>
      </View>
      <ChevronRight size={18} color={S.faint} strokeWidth={2.2} />
    </PressableScale>
  );
}

export default function StudentsListScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [status, setStatus] = useState('');
  const [klass, setKlass] = useState('');
  const [classes, setClasses] = useState([]); // [{ value, label }] canonical

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { getAdminUsersMeta().then((m) => setClasses(m?.classes || [])).catch(() => {}); }, []);

  const fetcher = useCallback(
    (page, pageSize) => getAdminUsers({ search: debounced, role: 'student', status, class: klass, page, pageSize }),
    [debounced, status, klass],
  );
  const { rows, total, loading, loadingMore, error, loadMore, reload } = usePagedList(fetcher);

  const renderItem = ({ item, index }) => (
    <StudentRow item={item} last={index === rows.length - 1} onPress={() => navigation.navigate('StudentResults', { id: item.id, name: displayNameOf(item) })} />
  );

  // Canonical class options — meta already dedupes to numbers 1..12.
  const classOptions = [{ value: '', label: 'All classes' }, ...classes.map((c) => ({ value: String(c.value), label: c.label }))];
  const filtersActive = !!(debounced || status || klass);
  const clearFilters = () => { setSearch(''); setStatus(''); setKlass(''); };

  return (
    <View style={{ flex: 1, backgroundColor: S.canvas }}>
      <StudentScreenHeader title="Results" subtitle="Search a student to view complete progress" />

      <View style={{ paddingHorizontal: 16, gap: 10 }}>
        <AdminSearchBar value={search} onChangeText={setSearch} placeholder="Search name, email or phone…" />
        <AdminSegmented value={status} onChange={setStatus} options={[{ value: '', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'deactivated', label: 'Inactive' }]} />
        {classes.length ? <ChipRow value={klass} onChange={setKlass} options={classOptions} /> : null}
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
        emptyIcon={GraduationCap}
        emptyTitle={filtersActive ? 'No students match' : 'No students yet'}
        emptyMessage={filtersActive
          ? `No students match ${[debounced && 'your search', status && (status === 'active' ? 'Active' : 'Inactive'), klass && (classOptions.find((o) => o.value === klass)?.label)].filter(Boolean).join(' · ')}. Try widening the filters.`
          : 'New learners will appear here as they join.'}
        emptyAction={filtersActive ? <GhostButton label="Clear filters" onPress={clearFilters} /> : undefined}
      />
    </View>
  );
}
