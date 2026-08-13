// src/screens/admin/support/SupportThreadScreen.js
// One ticket, from the team's side. The right pane of the web console
// (admin/components/support/Thread.tsx), as its own screen.
//
// This deliberately does NOT reuse the student ChatScreen's message mapper or its
// EventChip/CallChip. Those are shaped around keeping the agent's private call note away
// from the person who raised the ticket: the mapper structurally never reads `text` on a
// call row, and the chip has fixed copy addressed TO the user. The team needs the
// opposite — the note is the whole point of having logged the call — so sharing them
// would mean adding options that erode the property they exist to guarantee.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, ScrollView, TextInput, AppState, Alert, Linking,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { ChevronLeft, Phone, Send, CircleCheck, Paperclip } from 'lucide-react-native';
import { getTicket, markTicketRead, addTicketMessage, logCall, resolveTicket } from '../../../api/supportApi';
import { joinTicket } from '../../../realtime/supportSocket';
import { useAuth } from '../../../context/AuthContext';
import { T } from '../../parent/ParentApp/constants';
import { S, StudentErrorState, StudentSkeleton } from '../../../theme/studentUI';
import { PressableScale } from '../../parent/ParentApp/anim';
import { apiError } from '../ui/format';
import { CallLogSheet } from './CallLogSheet';
import { ResolveSheet } from './ResolveSheet';

const STATUS_TONE = {
  closed: S.emerald,
  pending_confirmation: S.gold,
  open: S.orange,
  assigned: S.orange,
};

// Staff-facing labels for a logged call — the outcome as the team recorded it, not the
// user-facing wording the student screen shows.
const OUTCOME_LABEL = {
  talked: 'Baat hui',
  no_answer: 'Uthaya nahi',
  callback: 'Callback',
};

const fmtClock = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

function CentreChip({ children, tone = S.muted, bg = '#fff', icon: Icon }) {
  return (
    <View style={{ alignItems: 'center', marginVertical: 9 }}>
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '88%',
        backgroundColor: bg, borderRadius: 999, borderWidth: 1, borderColor: S.hair,
        paddingHorizontal: 12, paddingVertical: 6,
      }}>
        {Icon ? <Icon size={11} color={tone} strokeWidth={2.4} /> : null}
        <T w="semi" s={11} c={tone} style={{ flexShrink: 1 }}>{children}</T>
      </View>
    </View>
  );
}

function Bubble({ m }) {
  const mine = m.authorRole === 'agent';
  return (
    <View style={{ flexDirection: 'row', justifyContent: mine ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
      <View style={{
        maxWidth: '78%', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 9,
        backgroundColor: mine ? S.indigo : '#fff',
        borderWidth: mine ? 0 : 1, borderColor: S.hair,
      }}>
        {!mine && m.authorName ? (
          <T w="xbold" s={10.5} c={S.muted} style={{ marginBottom: 2 }}>{m.authorName}</T>
        ) : null}
        <T w="reg" s={13.5} lh={18} c={mine ? '#fff' : S.ink}>{m.text}</T>
        <T w="semi" s={9.5} c={mine ? 'rgba(255,255,255,0.75)' : S.faint} style={{ marginTop: 3 }}>
          {fmtClock(m.createdAt)}
        </T>
      </View>
    </View>
  );
}

export default function SupportThreadScreen({ route, navigation }) {
  const { id } = route.params;
  const { can } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const scrollRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const d = await getTicket(id);
      setTicket(d);
      setError(null);
      // Clearing the unread mark is what decrements the tab badge, so it runs on every
      // load rather than only the first — a reply that arrives while this screen is open
      // must not leave the ticket looking unread.
      await markTicketRead(id);
    } catch (e) {
      setError(apiError(e, 'Ticket load nahi hua'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => joinTicket(id, { onMessage: load, onStatus: load, onReconnect: load }), [id, load]);

  // A backgrounded phone can hold a socket that is dead but never fires 'connect' again.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') load(); });
    return () => sub.remove();
  }, [load]);

  const msgCount = ticket && ticket.messages ? ticket.messages.length : 0;
  useEffect(() => {
    if (msgCount) setTimeout(() => scrollRef.current && scrollRef.current.scrollToEnd({ animated: true }), 60);
  }, [msgCount]);

  // Every write below surfaces its own failure and then RETHROWS. The caller — the
  // composer, or one of the two sheets — owns the text the user typed, so it decides
  // whether to stay open. Swallowing here is what leaves a sheet sitting inert after a
  // rejected write with the summary still in it and no explanation on screen.
  async function send(body) {
    try {
      await addTicketMessage(id, { text: body });
    } catch (e) {
      Alert.alert('Reply nahi bheja gaya', apiError(e));
      throw e;
    }
    await load();
  }

  async function onLogCall(outcome, note) {
    try {
      await logCall(id, { outcome, note });
    } catch (e) {
      Alert.alert('Call log nahi hua', apiError(e));
      throw e;
    }
    await load();
  }

  async function onResolve(summary) {
    try {
      await resolveTicket(id, { summary });
    } catch (e) {
      Alert.alert('Resolve nahi hua', apiError(e));
      throw e;
    }
    await load();
    Alert.alert('Ho gaya', 'User ko confirmation ke liye bhej diya.');
  }

  async function onSend() {
    const t = text.trim();
    if (!t) return;
    setSending(true);
    try {
      await send(t);
      setText('');
    } catch (_) {
      // send() has already shown the reason. The reply stays in the box so it can be sent
      // again rather than being cleared as though it went — and without this catch the
      // rethrow becomes an unhandled rejection, since nothing awaits onSend().
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: S.canvas, padding: 18, paddingTop: 60 }}>
        {[0, 1, 2].map((i) => <StudentSkeleton key={i} w="100%" h={64} r={16} mb={10} />)}
      </View>
    );
  }
  if (error || !ticket) {
    return (
      <View style={{ flex: 1, backgroundColor: S.canvas, paddingTop: 60 }}>
        <StudentErrorState title="Ticket load nahi hua" message={error || undefined} onRetry={load} />
      </View>
    );
  }

  const closed = ticket.status === 'closed';
  const pending = ticket.status === 'pending_confirmation';
  const canReply = can('support.reply') && !closed;
  const phone = ticket.raisedBy && ticket.raisedBy.phone;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: S.canvas }}
    >
      <View style={{ paddingTop: 52, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: S.hair }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <PressableScale onPress={() => navigation.goBack()} accessibilityLabel="Back" style={{ marginRight: 2 }}>
            <ChevronLeft size={22} color={S.ink} strokeWidth={2.4} />
          </PressableScale>
          <T w="black" s={15} c={S.ink}>{ticket.ref}</T>
          <View style={{ backgroundColor: S.purpleSoft, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 }}>
            <T w="xbold" s={10} c={S.purple}>{ticket.team}</T>
          </View>
          <View style={{ backgroundColor: (STATUS_TONE[ticket.status] || S.muted) + '1f', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 }}>
            <T w="xbold" s={10} c={STATUS_TONE[ticket.status] || S.muted}>{ticket.status.replace('_', ' ')}</T>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
          <T w="semi" s={12.5} c={S.sub}>
            {(ticket.raisedBy && ticket.raisedBy.name) || 'Unknown'}
            {ticket.childName ? ` · ${ticket.childName} ke liye` : ''}
          </T>
          {phone ? (
            <PressableScale
              onPress={() => Linking.openURL(`tel:${phone}`).catch(() => Alert.alert('Call nahi lag paya', phone))}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
              accessibilityRole="button"
              accessibilityLabel={`Call ${phone}`}
            >
              <Phone size={12} color={S.indigo} strokeWidth={2.6} />
              <T w="xbold" s={12.5} c={S.indigo}>{phone}</T>
            </PressableScale>
          ) : null}
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {(ticket.messages || []).map((m) => {
          if (m.kind === 'event' || m.authorRole === 'system') {
            return <CentreChip key={m.id}>{(m.text || '').toUpperCase()}</CentreChip>;
          }
          if (m.kind === 'call') {
            // The note IS shown here — this is the staff side, and a call with no record
            // of what was said is the reason call logging exists.
            const label = OUTCOME_LABEL[m.callOutcome] || 'Call';
            return (
              <CentreChip key={m.id} tone={S.orange} bg={S.orangeSoft} icon={Phone}>
                {m.text ? `${label} — ${m.text}` : label}
              </CentreChip>
            );
          }
          return <Bubble key={m.id} m={m} />;
        })}

        {/* Grouped rather than slotted between messages: the API does not expose an
            attachment's createdAt, so there is no honest position for them in the
            timeline, and a made-up one would be worse than a labelled shelf. */}
        {ticket.attachments && ticket.attachments.length ? (
          <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: S.hair }}>
            <T w="xbold" s={10.5} c={S.muted} style={{ letterSpacing: 0.4, marginBottom: 8 }}>
              ATTACHMENTS ({ticket.attachments.length})
            </T>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {ticket.attachments.map((a) => (
                <PressableScale
                  key={a.id}
                  onPress={() => Linking.openURL(a.url).catch(() => Alert.alert('File nahi khul payi', a.name))}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: 230,
                    backgroundColor: '#fff', borderRadius: 999, borderWidth: 1, borderColor: S.hair,
                    paddingHorizontal: 11, paddingVertical: 7,
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={a.name}
                >
                  <Paperclip size={12} color={S.indigo} strokeWidth={2.4} />
                  <T w="semi" s={12} c={S.indigo} numberOfLines={1} style={{ flexShrink: 1 }}>{a.name}</T>
                </PressableScale>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={{ borderTopWidth: 1, borderTopColor: S.hair, backgroundColor: '#fff', padding: 12, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 9 }}>
          <TextInput
            value={text}
            onChangeText={setText}
            editable={canReply}
            placeholder={closed ? 'Ticket band hai' : 'Reply likhein…'}
            placeholderTextColor={S.faint}
            multiline
            style={{
              flex: 1, backgroundColor: S.canvas, borderRadius: 14, borderWidth: 1, borderColor: S.hair,
              paddingHorizontal: 13, paddingVertical: 10, fontSize: 13.5, color: S.ink, maxHeight: 110,
            }}
            accessibilityLabel="Reply"
          />
          <PressableScale
            onPress={onSend}
            disabled={!canReply || sending || !text.trim()}
            style={{
              width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
              backgroundColor: S.indigo, opacity: (!canReply || sending || !text.trim()) ? 0.45 : 1,
            }}
            accessibilityRole="button"
            accessibilityLabel="Send reply"
          >
            <Send size={17} color="#fff" strokeWidth={2.4} />
          </PressableScale>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <PressableScale
            onPress={() => setCallOpen(true)}
            disabled={!can('support.reply')}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 12, borderWidth: 1,
              borderColor: S.hair, paddingHorizontal: 12, paddingVertical: 8,
              opacity: can('support.reply') ? 1 : 0.45,
            }}
            accessibilityRole="button"
            accessibilityLabel="Log a call"
          >
            <Phone size={13} color={S.sub} strokeWidth={2.4} />
            <T w="bold" s={12.5} c={S.sub}>Log a call</T>
          </PressableScale>

          {!closed && !pending && can('support.resolve') ? (
            <PressableScale
              onPress={() => setResolveOpen(true)}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 12, borderWidth: 1,
                borderColor: S.emerald, backgroundColor: S.emeraldSoft, paddingHorizontal: 12, paddingVertical: 8,
              }}
              accessibilityRole="button"
              accessibilityLabel="Mark resolved"
            >
              <CircleCheck size={13} color={S.emerald} strokeWidth={2.6} />
              <T w="xbold" s={12.5} c={S.emerald}>Mark Resolved</T>
            </PressableScale>
          ) : null}

          {pending ? (
            <T w="semi" s={11.5} c={S.gold} style={{ flex: 1 }}>
              User ki confirmation ka intezaar — 3 din baad apne aap band
            </T>
          ) : null}
        </View>
      </View>

      <CallLogSheet visible={callOpen} onClose={() => setCallOpen(false)} onSubmit={onLogCall} />
      <ResolveSheet visible={resolveOpen} onClose={() => setResolveOpen(false)} onSubmit={onResolve} />
    </KeyboardAvoidingView>
  );
}
