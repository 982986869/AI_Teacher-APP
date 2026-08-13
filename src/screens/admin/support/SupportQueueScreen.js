// src/screens/admin/support/SupportQueueScreen.js
// The support team's queue, in the app. Same job as the left pane of the web console
// (admin/app/(portal)/support) — the phone just splits it into two screens instead of two
// panes: this list, then SupportThreadScreen.
//
// The socket keeps this live; the refetches are what keep it CORRECT. Every event reloads
// from the server rather than patching state, so an event this phone never heard — and
// nothing is ever replayed — cannot leave the list disagreeing with the server.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, FlatList, TextInput, ScrollView, RefreshControl, AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Search } from 'lucide-react-native';
import { getSupportQueue } from '../../../api/supportApi';
import { connectSupportSocket, subscribeStaffQueue } from '../../../realtime/supportSocket';
import { useAuth } from '../../../context/AuthContext';
import { T } from '../../parent/ParentApp/constants';
import { S, StudentScreenHeader, StudentErrorState, StudentSkeleton } from '../../../theme/studentUI';
import { PressableScale } from '../../parent/ParentApp/anim';
import { apiError, timeAgo } from '../ui/format';
import { useBottomPad } from '../../../theme/layout';
import { STATUS_TABS, SUPPORT_TEAMS, isUnread, isStale, staleSince, matchesQuery } from './queueRules';

function Chip({ label, active, onPress, tint, small }) {
  return (
    <PressableScale
      onPress={onPress}
      style={{
        paddingHorizontal: small ? 9 : 11, paddingVertical: small ? 4 : 6, borderRadius: 999,
        borderWidth: 1, borderColor: active ? tint : S.hair,
        backgroundColor: active ? tint + '1f' : '#fff', marginRight: 6,
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={active ? { selected: true } : {}}
    >
      <T w={active ? 'xbold' : 'semi'} s={small ? 11 : 12} c={active ? tint : S.muted}>{label}</T>
    </PressableScale>
  );
}

function TicketRow({ t, onPress }) {
  const unread = isUnread(t);
  const stale = isStale(t);
  return (
    <PressableScale
      onPress={onPress}
      style={{
        backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: S.hair,
        padding: 13, marginBottom: 9,
      }}
      accessibilityLabel={`Ticket ${t.ref}`}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
        {unread ? <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: S.indigo }} /> : null}
        <T w="xbold" s={13} c={S.ink}>{t.ref}</T>
        <View style={{ backgroundColor: S.purpleSoft, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 }}>
          <T w="xbold" s={10} c={S.purple}>{t.team}</T>
        </View>
        {/* The timestamp and its colour are both read off staleSince(), so a red number
            always means "this long since anyone looked", never "this long since raised". */}
        <T
          w={stale ? 'xbold' : 'semi'}
          s={11}
          c={stale ? S.red : S.faint}
          style={{ marginLeft: 'auto' }}
        >
          {timeAgo(staleSince(t))}
        </T>
      </View>
      <T w="semi" s={12} c={S.sub} numberOfLines={1} style={{ marginTop: 4 }}>
        {(t.raisedBy && t.raisedBy.name) || 'Unknown'}
        {t.childName ? ` · ${t.childName} ke liye` : ''}
      </T>
      {t.status === 'pending_confirmation' ? (
        <T w="semi" s={11} c={S.gold} style={{ marginTop: 3 }}>User ki confirmation ka intezaar</T>
      ) : null}
    </PressableScale>
  );
}

export default function SupportQueueScreen({ navigation }) {
  const { token } = useAuth();
  const [status, setStatus] = useState('open');
  const [team, setTeam] = useState('');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const bottomPad = useBottomPad();

  const load = useCallback(async () => {
    try {
      const d = await getSupportQueue({ status, team: team || undefined });
      setRows(d.tickets);
      setError(null);
    } catch (e) {
      setError(apiError(e, 'Queue load nahi hui'));
    } finally {
      setLoading(false);
    }
  }, [status, team]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  // Idempotent — the module returns the existing socket if one is already alive. The badge
  // hook connects too, because whichever of the two runs first has to be the one that does.
  useEffect(() => { if (token) connectSupportSocket(token); }, [token]);

  useEffect(() => {
    if (!token) return undefined;
    return subscribeStaffQueue({
      onTicketNew: load,
      onTicketTouched: load,
      onStatus: load,
      // Fires on the first connect too. Events that arrived while this socket was down are
      // never replayed, so reconnecting without refetching would sit on pre-sleep state.
      onReconnect: load,
    });
  }, [token, load]);

  // A backgrounded phone can hold a socket that is dead but never fires 'connect' again.
  // This is the only trigger that catches that.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') load(); });
    return () => sub.remove();
  }, [load]);

  // Coming back from a thread must not leave a stale row for the ticket just answered.
  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Filtering ≤200 rows already in hand — no debounce, because there is no request to
  // save: the server's /queue takes no search parameter.
  const tickets = useMemo(() => rows.filter((t) => matchesQuery(t, search)), [rows, search]);

  return (
    <View style={{ flex: 1, backgroundColor: S.canvas }}>
      <StudentScreenHeader title="Support" subtitle="Tickets aur replies" />

      <View style={{ paddingHorizontal: 18, paddingTop: 6 }}>
        <View style={{ position: 'relative', marginBottom: 10 }}>
          <Search size={15} color={S.faint} strokeWidth={2.4} style={{ position: 'absolute', left: 12, top: 12, zIndex: 1 }} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Ref, naam ya number"
            placeholderTextColor={S.faint}
            style={{
              backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: S.hair,
              paddingVertical: 10, paddingLeft: 34, paddingRight: 12, fontSize: 13, color: S.ink,
            }}
            accessibilityLabel="Search tickets"
          />
        </View>

        <View style={{ flexDirection: 'row', marginBottom: 8 }}>
          {STATUS_TABS.map((t) => (
            <Chip key={t.k} label={t.l} active={status === t.k} tint={S.indigo} onPress={() => setStatus(t.k)} />
          ))}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
          {['', ...SUPPORT_TEAMS].map((tm) => (
            <Chip key={tm || 'all'} label={tm || 'All teams'} small active={team === tm} tint={S.purple} onPress={() => setTeam(tm)} />
          ))}
        </ScrollView>
      </View>

      {loading && !rows.length ? (
        <View style={{ paddingHorizontal: 18 }}>
          {[0, 1, 2, 3].map((i) => <StudentSkeleton key={i} w="100%" h={78} r={16} mb={9} />)}
        </View>
      ) : error ? (
        <StudentErrorState title="Queue load nahi hui" message={error} onRetry={load} />
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(t) => t.id}
          renderItem={({ item }) => (
            <TicketRow t={item} onPress={() => navigation.navigate('SupportThread', { id: item.id, ref: item.ref })} />
          )}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: bottomPad, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={S.indigo} />}
          ListEmptyComponent={(
            <View style={{ alignItems: 'center', paddingTop: 48 }}>
              <T w="xbold" s={14.5} c={S.ink}>Kuch nahi hai</T>
              <T w="semi" s={12.5} c={S.muted} style={{ marginTop: 4 }}>Is filter mein koi ticket nahi.</T>
            </View>
          )}
        />
      )}
    </View>
  );
}
