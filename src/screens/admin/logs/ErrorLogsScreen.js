// src/screens/admin/logs/ErrorLogsScreen.js
// Error Logs — everything the app's `catch {}` blocks used to eat, plus every 5xx the
// API returned (bug list item 15). Reached from Admin → Profile, and only by a role
// holding `logs.view`: these rows carry stack traces naming internal files and routes.
//
// Two states here are NOT the usual list states and matter more than the list itself:
//   • tableMissing — prisma/sql/error_logs.sql was never run by hand, so nothing has
//     been written. Without this banner that is indistinguishable from "no errors",
//     which is exactly the false negative this whole feature exists to remove.
//   • the capacity meter — the table is hard-capped (the database has ~17 MB of free
//     tier headroom), so an admin needs to see when rows are being trimmed away.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, FlatList, TextInput, ScrollView, RefreshControl, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Search, TriangleAlert, Smartphone, Server, Trash2 } from 'lucide-react-native';
import { getAdminErrorLogs, getAdminErrorLogFacets, purgeAdminErrorLogs } from '../../../api/adminApi';
import { useAuth } from '../../../context/AuthContext';
import { T } from '../../parent/ParentApp/constants';
import { S, StudentScreenHeader, StudentErrorState, StudentSkeleton } from '../../../theme/studentUI';
import { PressableScale } from '../../parent/ParentApp/anim';
import { apiError, timeAgo } from '../ui/format';
import { useBottomPad } from '../../../theme/layout';

const PAGE_SIZE = 25;

const SOURCE_TABS = [
  { key: '', label: 'All' },
  { key: 'app', label: 'App' },
  { key: 'server', label: 'Server' },
];
const LEVEL_TABS = [
  { key: '', label: 'All levels' },
  { key: 'error', label: 'Errors' },
  { key: 'warn', label: 'Warnings' },
];

function Chip({ label, active, onPress, tint = S.indigo }) {
  return (
    <PressableScale
      onPress={onPress}
      style={{
        paddingHorizontal: 11, paddingVertical: 6, borderRadius: 999,
        borderWidth: 1, borderColor: active ? tint : S.hair,
        backgroundColor: active ? tint + '1f' : '#fff', marginRight: 6,
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={active ? { selected: true } : {}}
    >
      <T w={active ? 'xbold' : 'semi'} s={12} c={active ? tint : S.muted}>{label}</T>
    </PressableScale>
  );
}

function LogRow({ row, onPress }) {
  const isWarn = row.level === 'warn';
  const tone = isWarn ? S.orange : S.red;
  const SourceIcon = row.source === 'server' ? Server : Smartphone;
  return (
    <PressableScale
      onPress={onPress}
      style={{
        backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: S.hair,
        padding: 13, marginBottom: 9,
      }}
      accessibilityLabel={`${row.level} at ${row.site}`}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: tone }} />
        <SourceIcon size={13} color={S.faint} strokeWidth={2.4} />
        {/* The site is what you scan by, so it wins the row even when it is long. */}
        <T w="xbold" s={12.5} c={S.ink} numberOfLines={1} style={{ flexShrink: 1 }}>{row.site}</T>
        <T w="semi" s={11} c={S.faint} style={{ marginLeft: 'auto' }}>{timeAgo(row.createdAt)}</T>
      </View>
      <T w="semi" s={12} c={S.sub} numberOfLines={2} style={{ marginTop: 4 }}>
        {row.message || '(no message)'}
      </T>
      {row.appVersion || row.platform ? (
        <T w="semi" s={10.5} c={S.faint} style={{ marginTop: 3 }}>
          {[row.platform, row.appVersion && `v${row.appVersion}`].filter(Boolean).join(' · ')}
        </T>
      ) : null}
    </PressableScale>
  );
}

// The forgotten-migration state. Loud on purpose: an empty list would read as good news.
function MissingTableBanner() {
  return (
    <View style={{
      backgroundColor: S.redSoft, borderRadius: 14, borderWidth: 1, borderColor: S.red + '40',
      padding: 13, marginBottom: 12, flexDirection: 'row', gap: 10,
    }}>
      <TriangleAlert size={18} color={S.red} strokeWidth={2.6} />
      <View style={{ flex: 1 }}>
        <T w="xbold" s={13} c={S.red}>Logging is not switched on</T>
        <T w="semi" s={12} c={S.sub} style={{ marginTop: 3 }}>
          The `error_logs` table does not exist, so nothing is being recorded. This is an
          empty screen because of a missing migration, not because nothing has gone wrong.
        </T>
        <T w="semi" s={11.5} c={S.muted} style={{ marginTop: 6 }}>
          Fix: run server/prisma/sql/error_logs.sql against the database.
        </T>
      </View>
    </View>
  );
}

// How full the capped table is. The cap is real — the database has very little free
// space — so "oldest entry" is the honest answer to "how far back can I look?".
function CapacityBar({ facets }) {
  if (!facets || !facets.maxRows) return null;
  const pct = Math.min(100, Math.round((facets.total / facets.maxRows) * 100));
  const tone = pct >= 90 ? S.red : pct >= 70 ? S.orange : S.emerald;
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <T w="semi" s={11.5} c={S.muted}>
          {facets.total.toLocaleString()} of {facets.maxRows.toLocaleString()} rows · kept {facets.retentionDays} days
        </T>
        <T w="xbold" s={11.5} c={tone} style={{ marginLeft: 'auto' }}>{pct}%</T>
      </View>
      <View style={{ height: 4, borderRadius: 2, backgroundColor: S.hair, marginTop: 5, overflow: 'hidden' }}>
        <View style={{ width: `${pct}%`, height: 4, backgroundColor: tone }} />
      </View>
      {facets.oldest ? (
        <T w="semi" s={11} c={S.faint} style={{ marginTop: 4 }}>
          Oldest entry {timeAgo(facets.oldest)} — anything older has been trimmed
        </T>
      ) : null}
    </View>
  );
}

export default function ErrorLogsScreen({ navigation }) {
  const { permissions } = useAuth();
  const canPurge = (permissions || []).includes('logs.manage') || (permissions || []).includes('*');

  const [source, setSource] = useState('');
  const [level, setLevel] = useState('');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [facets, setFacets] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tableMissing, setTableMissing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const bottomPad = useBottomPad();

  // Filters change faster than the network answers. Same race, and same fix, as the
  // support queue: only the newest request is allowed to write state, so tapping
  // App → Server on a slow link cannot leave the Server tab rendering app rows.
  const reqSeq = useRef(0);

  const load = useCallback(async (nextPage = 1) => {
    const seq = reqSeq.current + 1;
    reqSeq.current = seq;
    if (nextPage === 1) setLoading(true); else setLoadingMore(true);
    try {
      const res = await getAdminErrorLogs({ page: nextPage, pageSize: PAGE_SIZE, source, level, search });
      if (reqSeq.current !== seq) return;
      setRows((prev) => (nextPage === 1 ? res.rows : [...prev, ...res.rows]));
      setPage(res.page);
      setTotalPages(res.totalPages);
      setTableMissing(!!res.tableMissing);
      setError(null);
    } catch (e) {
      if (reqSeq.current !== seq) return;
      setError(apiError(e, 'Could not load the error logs.'));
    } finally {
      if (reqSeq.current === seq) { setLoading(false); setLoadingMore(false); }
    }
  }, [source, level, search]);

  const loadFacets = useCallback(async () => {
    try { setFacets(await getAdminErrorLogFacets()); } catch { /* the meter is decoration; the list is the screen */ }
  }, []);

  useEffect(() => { load(1); }, [load]);
  useFocusEffect(useCallback(() => { loadFacets(); }, [loadFacets]));

  const onEndReached = () => {
    if (loading || loadingMore || page >= totalPages) return;
    load(page + 1);
  };

  const confirmPurge = () => {
    Alert.alert(
      'Delete every log entry?',
      'This cannot be undone. The deletion itself is recorded in the audit log.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete all',
          style: 'destructive',
          onPress: async () => {
            try {
              await purgeAdminErrorLogs();
              await Promise.all([load(1), loadFacets()]);
            } catch (e) {
              Alert.alert('Could not delete', apiError(e));
            }
          },
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: S.canvas }}>
      <StudentScreenHeader
        title="Error logs"
        subtitle="Failures the app and API swallowed"
        right={canPurge && rows.length ? (
          <PressableScale onPress={confirmPurge} accessibilityLabel="Delete all log entries">
            <Trash2 size={19} color={S.red} strokeWidth={2.4} />
          </PressableScale>
        ) : null}
      />

      <View style={{ paddingHorizontal: 16 }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff',
          borderRadius: 14, borderWidth: 1, borderColor: S.hair, paddingHorizontal: 12, height: 42,
        }}>
          <Search size={16} color={S.faint} strokeWidth={2.4} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search a file, screen or message"
            placeholderTextColor={S.faint}
            style={{ flex: 1, fontSize: 13.5, color: S.ink }}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel="Search error logs"
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
          {SOURCE_TABS.map((t) => (
            <Chip key={`s-${t.key}`} label={t.label} active={source === t.key} onPress={() => setSource(t.key)} />
          ))}
          <View style={{ width: 8 }} />
          {LEVEL_TABS.map((t) => (
            <Chip key={`l-${t.key}`} label={t.label} active={level === t.key} onPress={() => setLevel(t.key)} tint={S.purple} />
          ))}
        </ScrollView>
      </View>

      {error ? (
        <StudentErrorState message={error} onRetry={() => load(1)} />
      ) : loading ? (
        <View style={{ padding: 16 }}>
          {[0, 1, 2, 3].map((i) => <StudentSkeleton key={i} w="100%" h={78} r={16} style={{ marginBottom: 9 }} />)}
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ padding: 16, paddingBottom: bottomPad }}
          refreshControl={<RefreshControl refreshing={false} onRefresh={() => { load(1); loadFacets(); }} />}
          ListHeaderComponent={
            <View>
              {tableMissing ? <MissingTableBanner /> : <CapacityBar facets={facets} />}
            </View>
          }
          renderItem={({ item }) => (
            <LogRow row={item} onPress={() => navigation.navigate('ErrorLogDetail', { row: item })} />
          )}
          ListEmptyComponent={tableMissing ? null : (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <T w="xbold" s={14} c={S.ink}>Nothing logged</T>
              <T w="semi" s={12.5} c={S.muted} style={{ marginTop: 4, textAlign: 'center' }}>
                {search || source || level
                  ? 'No entries match these filters.'
                  : 'No errors have been recorded in the retention window.'}
              </T>
            </View>
          )}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          ListFooterComponent={loadingMore ? <StudentSkeleton w="100%" h={78} r={16} /> : null}
        />
      )}
    </View>
  );
}
