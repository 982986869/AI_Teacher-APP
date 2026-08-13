// src/components/support/ChatScreen.js
// The `chat-v3` conversation screen — step 2, reached by picking a department on
// TopicSelect. Built to the Figma spec (every number below is from a properties panel):
//
//   main-content (fill, hug 372 / 521 in the context variant)
//     status-bar      44        → replaced by the real safe-area inset
//     context-panel   hug 72    radius ⌐20 bottom, border-bottom 1 #30363D,
//                               pad 16/20, space-between, bg #171440
//       context-left  172×40 gap 12   avatar 40 r20 · name Inter 600/14 ·
//                                     tag Inter 400/12 · number-badge 28 r14
//       context-right 87×38 gap 6     ticket-badge 69×19 r8 pad 3/8 bg #21262D
//     compact-header  hug 56    the context variant: pad 12/20, avatar 32 r16, gap 10,
//                               ticket-badge 64×16 r6 pad 2/8 — no department/queue
//     messages-area   pad 20, gap 20
//       system-event  hug 20    event-chip r20 border 1 pad 4/10, Inter 600/10 upper
//       user-row               bubble 260 r16/16/4/16 pad 12 bg #6366F1
//       typing-row    hug 26 gap 8   peek 24 r12 · bubble r16/16/16/4 · 3 × 6px dots
//       receipt-card  280×220  r16, 1.5px #6366F1, space-between, pad 16
//       quick-replies hug 39   chips hug 31 (pad 8/14) r16 1px #30363D, gap 8
//   input-section (fill, hug 97)
//     input-bar       hug 64    pad 12/20 gap 12
//       paperclip 22 · text-field fill 234 h40 r20 (mic 20 inside, right)
//       send-btn 40 r20 bg #6366F1
//     home-indicator  33        → replaced by the real safe-area inset
//
// ── How sending actually works ───────────────────────────────────────────────
// Writing here raises a real ticket with the chosen department (src/api/supportApi.js).
// The first message creates the ticket; later ones append to it; attachments upload
// against it. A team member then picks it up and calls back — WhatsApp and email are
// the ALTERNATIVE contact routes, not the delivery mechanism.
//
// These routes are implemented in server/src/routes/support.js and deployed alongside
// the rest of the API. `notDeployed` (src/api/supportApi.js) is the fallback for when a
// request still can't reach them — a 404/405/501, a misconfigured build, a route that
// moved — not "the backend doesn't exist yet". When it fires the message is marked
// "Not sent" with a Retry — it is never shown as delivered — and that failed state is
// also what drives the prominent WhatsApp button below the thread. Nothing here
// fabricates delivery.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, ScrollView, TextInput, Image, StyleSheet, Animated, Easing,
  Linking, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, ArrowRight, Paperclip, Mic, Mail, MessageCircle, X, RotateCcw, FileText, Phone } from 'lucide-react-native';

import { PressableScale } from '../../screens/parent/ParentApp/anim';
import {
  createTicket, addTicketMessage, uploadTicketAttachment, getTicket, closeTicket, reopenTicket,
  rateTicket,
} from '../../api/supportApi';
import { connectSupportSocket, joinTicket } from '../../realtime/supportSocket';
import { getToken } from '../../utils/storage';
import { D, IF, TX, fmtClock } from './theme';
import { chooseAttachment, prettySize } from './pickAttachment';
import {
  SUPPORT, supportLinks, agentOpening, agentTicketRaised, agentSendFailed, DOUBT_REDIRECT,
} from './supportConfig';
import ConfirmCard from './ConfirmCard';
import ResolvedScreen from './ResolvedScreen';

// ── server thread → screen bubble shape ─────────────────────────────────────
// `getTicket` and the socket's `message` event both hand back the server's row shape
// (src/api/supportApi.js): { id, authorRole, authorName, kind, callOutcome, text,
// createdAt }. This is the one place that turns that into what the bubbles below
// render — so the mount fetch, the reconnect refetch and the live socket event all
// stay in agreement.
//
// `kind: 'call'` now DOES reach and render for the ticket owner — a missed call with no
// trace looks like nobody tried. What must never reach them is the agent's free-text
// note: the server already blanks `text` to '' for a non-staff caller (both the REST
// read in getOne and the socket payload callLog emits into the ticket room), and this
// mapping never reads `m.text` for a call row regardless — the note's absence is
// structural (the field is never consulted here), not merely incidental (a blank string
// that happens not to be shown). Only `callOutcome` drives what's displayed; see CallChip.
function mapServerMessage(m) {
  if (!m) return null;
  if (m.kind === 'call') {
    return { id: m.id, kind: 'call', callOutcome: m.callOutcome };
  }
  if (m.kind === 'event' || m.authorRole === 'system') {
    return { id: m.id, kind: 'event', text: m.text };
  }
  const time = m.createdAt ? fmtClock(new Date(m.createdAt)) : undefined;
  if (m.authorRole === 'agent') {
    return {
      id: m.id, kind: 'agent', text: m.text, time, authorName: m.authorName,
    };
  }
  // authorRole === 'user' (or anything unrecognised defaults to the user's own bubble
  // rather than being silently dropped).
  return {
    id: m.id, kind: 'user', text: m.text, files: [], time, status: 'sent',
  };
}

function mapServerMessages(messages) {
  return (messages || []).map(mapServerMessage).filter(Boolean);
}

// Beat timings for the scripted opening. Long enough to read as composed, short enough
// that nobody sits watching dots.
const OPEN_DELAY = 550;
const OPEN_TYPING = 1400;

// ── small pieces ─────────────────────────────────────────────────────────────

// 24×24 r12 peek avatar beside agent bubbles.
function Peek({ agent }) {
  const initial = (Array.from((agent.name || 'A').trim())[0] || 'A').toUpperCase();
  if (agent.photo) {
    return (
      <Image
        source={typeof agent.photo === 'string' ? { uri: agent.photo } : agent.photo}
        style={s.peek}
        accessibilityIgnoresInvertColors
      />
    );
  }
  return <View style={[s.peek, s.peekFallback]}><TX w="bold" s={11} c={D.ink}>{initial}</TX></View>;
}

function EventChip({ text }) {
  return (
    <View style={s.eventRow}>
      <View style={s.eventChip}>
        <TX w="semi" s={10} lh={12} c={D.muted} style={s.eventText}>{text.toUpperCase()}</TX>
      </View>
    </View>
  );
}

// Copy for a `kind: 'call'` row, keyed on the closed `callOutcome` enum — never on
// server-sent text. This is the ONLY thing a call row is allowed to say to the owner.
const CALL_COPY = {
  talked: '📞 Support ne aapse baat ki',
  no_answer: '📞 Support ne call kiya — aapne uthaya nahi',
  callback: '📞 Support aapko dobara call karegi',
};

// A call attempt, rendered as a neutral centred chip — same family as EventChip, NOT an
// agent bubble, so it never reads as the agent having said something. Deliberately takes
// only `callOutcome`: even if a payload somehow carried a `text` field on a call row,
// this component has no prop for it and cannot render it — the note's absence is
// structural here, not just something the caller happens not to pass.
function CallChip({ callOutcome }) {
  const text = CALL_COPY[callOutcome] || CALL_COPY.talked;
  return (
    <View style={s.eventRow}>
      <View style={[s.eventChip, s.callChip]}>
        <Phone size={11} color={D.muted} strokeWidth={2.2} />
        <TX w="semi" s={10} lh={12} c={D.muted}>{text}</TX>
      </View>
    </View>
  );
}

// A user message carries its own delivery state, because with a real ticket API "sent"
// is something we can be wrong about — and silently swallowing a failed message is the
// exact bug that made writing twice feel like nothing happened.
function UserBubble({ msg, onRetry }) {
  const failed = msg.status === 'failed';
  return (
    <View style={s.userRow}>
      <View style={s.userBubble}>
        {!!msg.text && <TX w="reg" s={14} lh={18} c="#FFFFFF">{msg.text}</TX>}
        {!!(msg.files && msg.files.length) && (
          <View style={s.bubbleFiles}>
            {msg.files.map((f) => (
              <View key={f.uri} style={s.bubbleFile}>
                <FileText size={13} color="#FFFFFF" strokeWidth={2.2} />
                <TX w="med" s={11.5} lh={15} c="#FFFFFF" numberOfLines={1} style={{ flexShrink: 1 }}>{f.name}</TX>
              </View>
            ))}
          </View>
        )}
        <View style={s.userMeta}>
          <TX w="reg" s={10} lh={12} c="#FFFFFF" style={s.userTime}>
            {msg.status === 'sending' ? 'Sending…' : msg.time}
          </TX>
        </View>
      </View>
      {failed && (
        <PressableScale style={s.retryRow} onPress={() => onRetry(msg)} scaleTo={0.96} accessibilityRole="button" accessibilityLabel="Retry sending this message">
          <RotateCcw size={12} color={D.amber} strokeWidth={2.4} />
          <TX w="semi" s={11} lh={14} c={D.amber}>Not sent · Retry</TX>
        </PressableScale>
      )}
    </View>
  );
}

// `authorName` is only passed for real thread rows (Step 1/2 — a live ticket can have
// more than one agent reply on it), so the scripted bubbles below render exactly as
// before when it's absent.
// `cta` + `onCta` back the doubt redirect (Step 3): a button under the bubble that sends
// the student to AI Teacher without closing off the thread — the composer stays live and
// anything they type still raises a real ticket.
function AgentBubble({ agent, text, time, authorName, cta, onCta }) {
  return (
    <View style={s.agentRow}>
      <Peek agent={agent} />
      <View style={s.agentCol}>
        {!!authorName && <TX w="semi" s={11} lh={14} c={D.muted} style={s.agentName}>{authorName}</TX>}
        <View style={s.agentBubble}>
          <TX w="reg" s={14} lh={18} c={D.ink}>{text}</TX>
          {!!time && <TX w="reg" s={10} lh={12} c={D.muted} style={{ marginTop: 4 }}>{time}</TX>}
        </View>
        {!!cta && (
          <PressableScale
            style={s.doubtCta}
            onPress={onCta}
            scaleTo={0.97}
            accessibilityRole="button"
            accessibilityLabel={cta}
          >
            <TX w="semi" s={13} c={D.indigo}>{cta}</TX>
          </PressableScale>
        )}
      </View>
    </View>
  );
}

// agent-typing-bubble — three 6px indigo dots, staggered fade.
function TypingRow({ agent }) {
  const a = useRef(new Animated.Value(0.3)).current;
  const b = useRef(new Animated.Value(0.3)).current;
  const c = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const dots = [a, b, c];
    const loops = dots.map((v, i) => Animated.loop(
      Animated.sequence([
        Animated.delay(i * 160),
        Animated.timing(v, { toValue: 1, duration: 340, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0.3, duration: 340, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.delay(320 - i * 160),
      ]),
    ));
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [a, b, c]);
  return (
    <View style={s.agentRow}>
      <Peek agent={agent} />
      <View style={s.typingBubble}>
        {[a, b, c].map((v, i) => <Animated.View key={i} style={[s.dot, { opacity: v }]} />)}
      </View>
    </View>
  );
}

// receipt-card — 280×220 fixed, radius 16, 1.5px #6366F1 border, space-between, pad 16,
// drop shadow 0/4/16 #6366F1 @30.2%. Only ever rendered from real ticket context.
// The badge amber, the confirm green and the link colour were read off the mockup —
// the properties panel gives the card's own tokens but not its children's.
function ContextCard({ ctx, onPrimary, onLink }) {
  return (
    <View style={s.receipt}>
      <View style={s.badgeRow}>
        <View style={[s.ctxBadge, { backgroundColor: ctx.badge.tint }]}>
          <TX w="bold" s={10} lh={12} c={ctx.badge.ink || '#0C0936'} style={s.ctxBadgeText}>
            {String(ctx.badge.label).toUpperCase()}
          </TX>
        </View>
      </View>

      <View style={s.amountRow}>
        <TX w="bold" s={28} lh={36} c={D.ink}>{ctx.amount}</TX>
        <TX w="reg" s={11} lh={16} c={D.muted}>{ctx.meta}</TX>
      </View>

      <PressableScale
        style={s.ctxPrimary}
        onPress={onPrimary}
        scaleTo={0.97}
        accessibilityRole="button"
        accessibilityLabel={`${ctx.primary.label}. ${ctx.amount}. ${ctx.meta}`}
      >
        <TX w="bold" s={14.5} c="#06281B">{ctx.primary.label}</TX>
      </PressableScale>

      {/* No dead links: the row only exists once there's a real URL to open. */}
      {!!(ctx.link && ctx.link.url) && (
        <PressableScale style={s.ctxLink} onPress={onLink} scaleTo={0.96} accessibilityRole="link" accessibilityLabel={ctx.link.label}>
          <TX w="med" s={12} c={D.indigo} style={s.underline}>{ctx.link.label}</TX>
        </PressableScale>
      )}
    </View>
  );
}

// ── the screen ───────────────────────────────────────────────────────────────
export default function ChatScreen({
  category,
  index = 0,
  agent,
  role = 'student',
  userName,
  userPhone,               // the number the team calls back on, sent with the ticket
  childName,
  liveChat = false,
  ticketContext,           // real case data → the compact-header + receipt-card variant
  existingTicket,          // { id, ref, status, topicId, team, … } — a ticket opened from
                            // TicketList (Task 12). Present → render its real thread
                            // instead of the scripted opening.
  onContextAction,
  onBack,
}) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const scroller = useRef(null);
  const timers = useRef([]);
  const seq = useRef(0);
  // Synchronous internal bookkeeping — `ensureTicket` reads this mid-async-call to avoid
  // racing itself, which a piece of state can't guarantee. `ticketId` (state, below) is
  // the reactive twin the socket effect and render use.
  const ticketIdRef = useRef(existingTicket ? existingTicket.id : null);
  const assignee = useRef(null);          // { name, team } the server routed it to, if any
  // An existing ticket already has a team on it — the scripted "reached the team" line
  // (said once inside `deliver`) is only for a ticket raised fresh in this session.
  const raised = useRef(!!existingTicket);
  const failureNoticed = useRef(false);   // the "couldn't send" explanation appears once

  const [draft, setDraft] = useState('');
  const [files, setFiles] = useState([]); // staged attachments, not yet sent
  const [typing, setTyping] = useState(false);
  // The ref comes from the server, so it is null until the ticket exists. The badge and
  // the "Ticket created" chip both wait for it rather than showing a number that is real
  // nowhere — which is what the old device-minted ref was.
  const [ref, setRef] = useState(existingTicket ? existingTicket.ref : null);
  const [thread, setThread] = useState([]);
  // Files already on the ticket, as the server has them. Kept in their own state rather
  // than read off `ticket`, because `ticket` is also written by the socket's status event
  // and by close/reopen — all of which hand back the bare ticket shape with no
  // `attachments` key, and would silently blank the list. Only a full REST read
  // (setThreadFromServer) ever touches this.
  const [attachments, setAttachments] = useState([]);

  // Reactive id for the socket effect below (a ref wouldn't re-trigger it once the
  // ticket exists). Mirrors `ticketIdRef` — set together, everywhere.
  const [ticketId, setTicketId] = useState(existingTicket ? existingTicket.id : null);
  // The full ticket row (status included) — kept in state so Task 14's
  // pending_confirmation card can read `ticket.status` off this screen's state without
  // another round trip. Nothing here renders off it yet.
  const [ticket, setTicket] = useState(existingTicket || null);
  // Task 14: the ONLY state a confirm/reopen action carries locally is "in flight" — the
  // resulting ticket status always comes from the server response (setTicket below), never
  // assumed. `confirmError` is surfaced once via Alert and doesn't otherwise gate render.
  const [confirmBusy, setConfirmBusy] = useState(false);
  // Same source axiosInstance uses (src/api/axiosInstance.js → src/utils/storage.js) —
  // no second storage key invented for the socket handshake.
  const [authToken, setAuthToken] = useState(null);
  useEffect(() => {
    let alive = true;
    getToken().then((t) => { if (alive) setAuthToken(t); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const later = useCallback((fn, ms) => { timers.current.push(setTimeout(fn, ms)); }, []);
  useEffect(() => () => { timers.current.forEach(clearTimeout); timers.current = []; }, []);

  // Raise the ticket as soon as the department is opened, so the ref on screen is the one
  // the team will see. Tickets with no message never reach the team's queue (the queue
  // query requires one), so browsing costs nobody anything.
  const ensureTicket = useCallback(async () => {
    if (ticketIdRef.current) return ticketIdRef.current;
    const created = await createTicket({
      topicId: category.id,
      topicLabel: category.label,
      team: category.team,
      role,
      phone: userPhone,
      childName,
    });
    ticketIdRef.current = created.id;
    setTicketId(created.id);
    if (created.ref) {
      setRef(created.ref);
      setThread((prev) => (prev.some((m) => m.id === 'ev-open') ? prev : [
        { id: 'ev-open', kind: 'event', text: `Ticket created · ${fmtClock()}` }, ...prev,
      ]));
    }
    assignee.current = created.assignedTo || null;
    return created.id;
  }, [category, role, userPhone, childName]);

  // Opening the screen tries to raise it. A failure here is silent: the user hasn't asked
  // for anything yet, and the agent's opening below still invites them to describe the
  // issue. The first send is where a failure has to be visible. For an existing ticket
  // this is a no-op — `ticketIdRef.current` is already set — so it never re-raises one.
  useEffect(() => { ensureTicket().catch(() => {}); }, [ensureTicket]);

  // Merges a fresh server read into `thread`. Used on mount (below) and on every socket
  // reconnect (Step 2) — the two moments a dropped connection could otherwise cost a
  // message. Server rows are authoritative; the only thing kept alongside them is a
  // message still `sending`/`failed` locally and not yet reflected on the server, so a
  // resync mid-send (or a send that never landed) doesn't wipe the "Not sent · Retry" row
  // out from under the user.
  const setThreadFromServer = useCallback((t) => {
    setTicket(t);
    if (t && t.ref) setRef(t.ref);
    setAttachments((t && t.attachments) || []);
    const serverMsgs = mapServerMessages(t && t.messages);
    const serverIds = new Set(serverMsgs.map((m) => m.id));
    setThread((prev) => {
      const pendingLocal = prev.filter((m) => m.kind === 'user'
        && (m.status === 'sending' || m.status === 'failed') && !serverIds.has(m.id));
      return [...serverMsgs, ...pendingLocal];
    });
  }, []);

  // Step 1: an existing ticket (opened from TicketList) renders its real history instead
  // of the scripted opening below. This is the mount half of "refetch on mount AND on
  // every reconnect" — a dropped socket is never the only way this thread gets loaded.
  useEffect(() => {
    if (!existingTicket) return undefined;
    let alive = true;
    getTicket(existingTicket.id)
      .then((t) => { if (alive) setThreadFromServer(t); })
      .catch(() => {});
    return () => { alive = false; };
    // existingTicket is fixed for the lifetime of this screen — SupportSheet mounts a
    // fresh ChatScreen per ticket (see its `key`-less but `picked`-gated render).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingTicket]);

  // The agent opens the conversation. Scripted while `liveChat` is false or a real ticket
  // is already loaded from the server; a real agent socket replaces it wholesale.
  //
  // `doubt` gets its own opening — the AI Teacher redirect — regardless of `liveChat`,
  // because that copy is about the category (study questions belong somewhere else),
  // not about whether an agent is on shift.
  //
  // ADDITION (authorised on top of Task 15's brief, not in it): `liveChat` now defaults
  // true everywhere this screen is actually mounted (see HelpFab.js), which made the
  // branch below a no-op for real conversations — a brand-new ticket opened with an
  // empty thread until either side wrote something, and read as broken. The fix is an
  // honest opening line for that case too, but as an EVENT CHIP (`EventChip`, same style
  // as "Ticket created"), not an agent bubble: it names no one, so nobody can mistake it
  // for a human having already replied.
  useEffect(() => {
    if (existingTicket) return undefined;

    if (category.id === 'doubt') {
      later(() => setTyping(true), OPEN_DELAY);
      later(() => {
        setTyping(false);
        setThread((prev) => (prev.some((m) => m.id === 'a-open') ? prev : [
          ...prev, {
            id: 'a-open', kind: 'agent', text: DOUBT_REDIRECT.text, time: fmtClock(), cta: DOUBT_REDIRECT.cta,
          },
        ]));
      }, OPEN_DELAY + OPEN_TYPING);
      return undefined;
    }

    if (liveChat) {
      setThread((prev) => (prev.some((m) => m.id === 'ev-welcome') ? prev : [
        { id: 'ev-welcome', kind: 'event', text: `Apna issue yahan likhiye — ${category.team} dekh kar aapse contact karegi.` },
        ...prev,
      ]));
      return undefined;
    }

    later(() => setTyping(true), OPEN_DELAY);
    later(() => {
      setTyping(false);
      const text = (ticketContext && ticketContext.opening) || agentOpening({ category, agent });
      setThread((prev) => (prev.some((m) => m.id === 'a-open') ? prev : [
        ...prev, { id: 'a-open', kind: 'agent', text, time: fmtClock() },
      ]));
    }, OPEN_DELAY + OPEN_TYPING);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Doubt redirect CTA: sends the student to AI Teacher without closing the thread — the
  // ticket keeps existing and the composer stays enabled underneath. AITeacherScreen has
  // no route of its own (it's local state inside HomeScreen, gated by the `aiTeacher`
  // feature flag); the nearest real, navigable thing is the Home tab it lives on, reached
  // via the root stack's "MainApp" screen → nested "Home" tab (src/navigation/
  // AppNavigator.js, src/navigation/MainNavigator.js). This lands the student one tap
  // away from AI Teacher rather than guessing at a screen name that doesn't exist.
  const goToAITeacher = useCallback(() => {
    try {
      navigation.navigate('MainApp', { screen: 'Home' });
    } catch (e) {
      // Navigation is best-effort here — the redirect copy already told the student what
      // to do, and the composer underneath still works either way.
    }
    if (onBack) onBack();
  }, [navigation, onBack]);

  // Step 2: subscribe to the live socket once a ticket id exists (fresh or existing) and
  // we actually have a token to authenticate with. Waiting on `authToken` — rather than
  // calling connectSupportSocket(null) immediately — matters because the socket module
  // is a singleton that only builds one connection ever (see supportSocket.js); dialling
  // in once with no token and letting a later render try again would find the same
  // (never-authenticated) socket already sitting there.
  useEffect(() => {
    if (!liveChat || !ticketId || !authToken) return undefined;
    connectSupportSocket(authToken);
    return joinTicket(ticketId, {
      onMessage: (m) => {
        if (m.ticketId && m.ticketId !== ticketId) return;
        // DO NOT "fix" this back to rendering the user's own messages. The server emits
        // into `ticket:<id>`, and this socket is IN that room, so everything the user
        // sends comes straight back as an echo. The id check below cannot catch it: the
        // optimistic bubble is `u-<seq>`, minted on the device by `send`, while the echo
        // carries the server's UUID — two ids that never match, so the user saw every
        // message they sent twice. Their own messages are already on screen optimistically
        // (with the delivery state the echo does not carry) and arrive authoritatively on
        // the next setThreadFromServer, so dropping the echo loses nothing.
        if (m.authorRole === 'user') return;
        const mapped = mapServerMessage(m);
        if (!mapped) return;
        setThread((prev) => (prev.some((x) => x.id === mapped.id) ? prev : [...prev, mapped]));
      },
      onStatus: (t) => { setTicket(t); if (t && t.ref) setRef(t.ref); },
      // THE SOCKET IS NOT THE SOURCE OF TRUTH. Anything that happened while the
      // connection was down (backgrounded app, dead network, etc.) is only recoverable
      // from REST, so every reconnect — not just the first join — refetches the thread.
      onReconnect: () => getTicket(ticketId).then(setThreadFromServer).catch(() => {}),
    });
  }, [liveChat, ticketId, authToken, setThreadFromServer]);

  const patch = useCallback((id, next) => {
    setThread((prev) => prev.map((m) => (m.id === id ? { ...m, ...next } : m)));
  }, []);

  // Anything that failed to reach the server. This is what makes WhatsApp go solid —
  // and what "2 messages ready" counts.
  const stuck = useMemo(() => thread.filter((m) => m.kind === 'user' && m.status === 'failed'), [thread]);
  const links = useMemo(
    () => supportLinks({
      category, role, name: userName, ticket: ref,
      transcript: stuck.length ? stuck.map((m) => m.text).filter(Boolean) : thread.filter((m) => m.kind === 'user').map((m) => m.text).filter(Boolean),
    }),
    [category, role, userName, ref, stuck, thread],
  );

  const open = useCallback((url, failTitle, failBody) => {
    Linking.openURL(url).catch(() => Alert.alert(failTitle, failBody));
  }, []);
  const openWhatsApp = useCallback(() => open(
    links.whatsapp, 'WhatsApp not available',
    `Message us at ${SUPPORT.whatsappDisplay} or write to ${links.mail}.`,
  ), [open, links]);
  const openEmail = useCallback(() => open(
    links.email, 'No mail app found',
    `Write to ${links.mail}${ref ? ` and mention ${ref}` : ''}.`,
  ), [open, links, ref]);

  // ── delivery ───────────────────────────────────────────────────────────────
  // First message creates the ticket; later ones append. Attachments upload against
  // whichever ticket id we end up with.
  const deliver = useCallback(async (msg) => {
    patch(msg.id, { status: 'sending' });
    try {
      const id = await ensureTicket();

      // `textSent` guards a partial success: if the text landed but an attachment upload
      // then failed, Retry must not post the text a second time and leave the team
      // reading the same complaint twice.
      if (msg.text && !msg.textSent) {
        await addTicketMessage(id, { text: msg.text });
        patch(msg.id, { textSent: true });
        msg.textSent = true;   // the retry path reuses this object
      }

      // Same idea per file — only upload what hasn't landed yet.
      const done = new Set(msg.sentFiles || []);
      for (const f of (msg.files || [])) {
        if (done.has(f.uri)) continue;
        await uploadTicketAttachment(id, f);
        done.add(f.uri);
        msg.sentFiles = Array.from(done);
        patch(msg.id, { sentFiles: msg.sentFiles });
      }
      patch(msg.id, { status: 'sent' });

      // Now the team genuinely has something in their queue, so the callback promise is
      // one we can keep. Said once.
      if (!raised.current) {
        raised.current = true;
        const who = assignee.current;
        setThread((prev) => [
          ...prev,
          {
            id: 'a-raised',
            kind: 'agent',
            time: fmtClock(),
            text: agentTicketRaised({
              ticket: ref,
              team: (who && who.team) || category.team,
              phone: userPhone,
              assignee: who && who.name,
            }),
          },
        ]);
      }
    } catch (err) {
      patch(msg.id, { status: 'failed' });
      // Explain once. Repeating it on every retry would bury the thread.
      if (!failureNoticed.current) {
        failureNoticed.current = true;
        setThread((prev) => [
          ...prev,
          { id: 'a-failed', kind: 'agent', text: agentSendFailed({ category }), time: fmtClock() },
        ]);
      }
      if (err && !err.notDeployed && err.response && err.response.status >= 500) {
        // A server error is worth surfacing beyond the inline state.
        Alert.alert('Could not send', 'Our support service did not respond. Please retry, or use WhatsApp.');
      }
    }
  }, [patch, ensureTicket, category, userPhone, ref]);

  const send = useCallback(() => {
    const text = draft.trim();
    if (!text && !files.length) return;
    seq.current += 1;
    const msg = {
      id: `u-${seq.current}`, kind: 'user', text, files, time: fmtClock(), status: 'sending',
    };
    setDraft('');
    setFiles([]);
    setThread((prev) => [...prev, msg]);
    deliver(msg);
  }, [draft, files, deliver]);

  const retry = useCallback((msg) => { deliver(msg); }, [deliver]);

  // ── Task 14: staff propose, the user closes ─────────────────────────────────
  // Both actions only ever move the UI once the server confirms — `setTicket` here always
  // comes from the response, never assumed locally. A failure surfaces the error and
  // leaves the card exactly where it was; ConfirmCard's `busy` disables both buttons while
  // the call is in flight so a slow network can't be double-tapped into two requests.
  // A 409 from either action means the server's answer is "that is not this ticket's
  // state any more" — almost always because autoCloseExpired closed it out from under a
  // screen that has been sitting on the ConfirmCard (auto-close emits no socket event, so
  // this screen has no other way to hear about it). Retrying cannot help, and an alert the
  // user can dismiss and re-tap forever is a dead end. Re-read the ticket and render what
  // is actually true — from there the closed thread offers Reopen, which does work.
  const resyncAfterConflict = useCallback(async (id) => {
    try {
      const fresh = await getTicket(id);
      setThreadFromServer(fresh);
      return true;
    } catch (_) {
      return false;
    }
  }, [setThreadFromServer]);

  const confirmResolved = useCallback(async () => {
    if (!ticket || confirmBusy) return;
    setConfirmBusy(true);
    try {
      const updated = await closeTicket(ticket.id);
      setTicket(updated);
      if (updated && updated.ref) setRef(updated.ref);
    } catch (err) {
      const conflict = err && err.response && err.response.status === 409;
      if (!conflict || !(await resyncAfterConflict(ticket.id))) {
        Alert.alert('Could not confirm', 'We could not close this ticket. Please try again.');
      }
    } finally {
      setConfirmBusy(false);
    }
  }, [ticket, confirmBusy, resyncAfterConflict]);

  // Also used as ResolvedScreen's `onReopen` (Step 2) — `reopenTicket` is valid from both
  // `pending_confirmation` and `closed` (auto-close can beat the user to it), so one
  // handler covers "abhi bhi problem hai" and "Reopen This Chat" alike.
  const stillBroken = useCallback(async () => {
    if (!ticket || confirmBusy) return;
    setConfirmBusy(true);
    try {
      const updated = await reopenTicket(ticket.id);
      setTicket(updated);
      if (updated && updated.ref) setRef(updated.ref);
    } catch (err) {
      const conflict = err && err.response && err.response.status === 409;
      if (!conflict || !(await resyncAfterConflict(ticket.id))) {
        Alert.alert('Could not reopen', 'We could not reopen this ticket. Please try again.');
      }
    } finally {
      setConfirmBusy(false);
    }
  }, [ticket, confirmBusy, resyncAfterConflict]);

  const attach = useCallback(() => {
    chooseAttachment((f) => setFiles((prev) => (prev.some((x) => x.uri === f.uri) ? prev : [...prev, f])));
  }, []);
  const dropFile = useCallback((uri) => setFiles((prev) => prev.filter((f) => f.uri !== uri)), []);

  // Voice notes need recording + an audio pipeline neither side has yet, so the mic
  // points at WhatsApp rather than sitting there doing nothing.
  const voice = useCallback(() => {
    Alert.alert(
      'Voice message',
      'Voice notes aren’t supported in the app yet. Send it on WhatsApp instead?',
      [{ text: 'Not now', style: 'cancel' }, { text: 'Open WhatsApp', onPress: openWhatsApp }],
    );
  }, [openWhatsApp]);

  const contextAction = useCallback(() => {
    const ctx = ticketContext;
    if (!ctx) return;
    if (onContextAction) { onContextAction(ctx); return; }
    seq.current += 1;
    const msg = {
      id: `u-${seq.current}`, kind: 'user', files: [], time: fmtClock(), status: 'sending',
      text: `${ctx.primary.label} — ${ctx.amount} · ${ctx.meta}`,
    };
    setThread((prev) => [...prev, msg]);
    deliver(msg);
  }, [ticketContext, onContextAction, deliver]);

  const openLink = useCallback(() => {
    const url = ticketContext && ticketContext.link && ticketContext.link.url;
    if (url) open(url, 'Could not open', url);
  }, [ticketContext, open]);

  useEffect(() => {
    const id = setTimeout(() => scroller.current && scroller.current.scrollToEnd({ animated: true }), 60);
    return () => clearTimeout(id);
  }, [thread, typing, files]);

  const canSend = draft.trim().length > 0 || files.length > 0;

  // The header/avatar identity. Before a ticket exists, or before anyone has picked it
  // up, this is `agent` — the honest TEAM placeholder SupportSheet passed in (teamAgent,
  // supportConfig.js). The moment the server hands back a real `assignedTo` — from
  // createTicket's response, a REST refetch, or the live socket's status event — that
  // name wins, because it is no longer a guess about who will answer; it is who did.
  // `online` is left false either way: presence isn't something either side reports.
  const assignedTo = (ticket && ticket.assignedTo) || assignee.current || null;
  const displayAgent = assignedTo
    ? {
      name: assignedTo.name, team: assignedTo.team || category.team, online: false, photo: agent.photo || null,
    }
    : agent;
  const tag = `${category.tag || category.label}${displayAgent.online ? ' · Active' : ''}`;
  const initial = (Array.from((displayAgent.name || 'A').trim())[0] || 'A').toUpperCase();

  // Task 14: once the SERVER says this ticket is closed with a resolution attached, hand
  // the whole screen to ResolvedScreen — driven off `ticket.status`/`ticket.resolution`
  // exactly as it already is from SupportSheet's demo path (see TODO(chat-backend) there),
  // just fed by the real ticket this screen loaded/subscribed to instead of a static
  // `ticketContexts` prop. `onReopen` reuses `stillBroken`: reopenTicket is valid from
  // `closed` too, so a ticket the server auto-closed after three days of silence is never
  // a dead end here either.
  if (ticket && ticket.status === 'closed' && ticket.resolution) {
    return (
      <ResolvedScreen
        agent={displayAgent}
        ticket={ref}
        category={category}
        resolution={ticket.resolution}
        transcript={thread.filter((m) => m.kind === 'user').map((m) => m.text).filter(Boolean)}
        onNewConversation={onBack}
        onReopen={stillBroken}
        savedRating={ticket.rating}
        // Rethrows on purpose: ResolvedScreen rolls its icons back if the score did not
        // save, rather than leaving them lit for a rating the server never received.
        onRate={(n) => rateTicket(ticket.id, { rating: n })}
      />
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[s.root, { paddingTop: insets.top }]}
    >
      {/* ── header ──────────────────────────────────────────────────────
          The context variant trades the department badge and queue line for height:
          compact-header, hug 56, flat bottom border, just avatar + name + ticket. */}
      {ticketContext ? (
        <View style={s.compactHeader}>
          <View style={s.agentLeft}>
            <PressableScale style={s.backBtn} onPress={onBack} scaleTo={0.9} accessibilityRole="button" accessibilityLabel="Back to topics">
              <ArrowLeft size={18} color={D.muted} strokeWidth={2.2} />
            </PressableScale>
            {displayAgent.photo ? (
              <Image source={typeof displayAgent.photo === 'string' ? { uri: displayAgent.photo } : displayAgent.photo} style={s.compactAvatar} accessibilityIgnoresInvertColors />
            ) : (
              <View style={[s.compactAvatar, s.headAvatarFallback]}><TX w="bold" s={13} c={D.ink}>{initial}</TX></View>
            )}
            <TX w="semi" s={14} lh={17} c={D.ink} numberOfLines={1}>{displayAgent.name}</TX>
          </View>
          {/* Hidden until the server has actually issued a ref. */}
          {!!ref && <View style={s.ticketBadgeSm}><TX w="bold" s={10} lh={12} c={D.indigo}>{ref}</TX></View>}
        </View>
      ) : (
        <View style={s.contextPanel}>
          <View style={s.contextLeft}>
            <PressableScale style={s.backBtn} onPress={onBack} scaleTo={0.9} accessibilityRole="button" accessibilityLabel="Back to topics">
              <ArrowLeft size={18} color={D.muted} strokeWidth={2.2} />
            </PressableScale>
            {displayAgent.photo ? (
              <Image source={typeof displayAgent.photo === 'string' ? { uri: displayAgent.photo } : displayAgent.photo} style={s.headAvatar} accessibilityIgnoresInvertColors />
            ) : (
              <View style={[s.headAvatar, s.headAvatarFallback]}><TX w="bold" s={15} c={D.ink}>{initial}</TX></View>
            )}
            <View style={s.contextAgent}>
              <View style={s.contextAgentNames}>
                <TX w="semi" s={14} lh={17} c={D.ink} numberOfLines={1}>{displayAgent.name}</TX>
                <TX w="reg" s={12} lh={15} c={D.muted} numberOfLines={1}>{tag}</TX>
              </View>
              {!category.plain && (
                <View style={[s.badge, { backgroundColor: category.tint }]}>
                  <TX w="bold" s={14} c={category.badgeInk || '#FFFFFF'}>{index + 1}</TX>
                </View>
              )}
            </View>
          </View>

          <View style={s.contextRight}>
            {!!ref && <View style={s.ticketBadge}><TX w="bold" s={11} lh={13} c={D.indigo}>{ref}</TX></View>}
            {/* queue-badge: the file gives its box (87×13, gap 4) but not its children,
                so this shows what we can stand behind — presence + the published average
                reply time — rather than inventing a live queue position. */}
            <View style={s.queueBadge}>
              <View style={[s.queueDot, { backgroundColor: displayAgent.online ? D.online : D.muted }]} />
              <TX w="reg" s={10} lh={13} c={D.muted}>{SUPPORT.avgReply}</TX>
            </View>
          </View>
        </View>
      )}

      {/* ── messages-area / content-space ───────────────────────────────── */}
      <ScrollView
        ref={scroller}
        style={{ flex: 1 }}
        contentContainerStyle={s.messages}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {thread.map((m) => {
          if (m.kind === 'event') return <EventChip key={m.id} text={m.text} />;
          if (m.kind === 'call') return <CallChip key={m.id} callOutcome={m.callOutcome} />;
          if (m.kind === 'agent') {
            return (
              <AgentBubble
                key={m.id}
                agent={displayAgent}
                text={m.text}
                time={m.time}
                authorName={m.authorName}
                cta={m.cta}
                onCta={m.cta ? goToAITeacher : undefined}
              />
            );
          }
          return <UserBubble key={m.id} msg={m} onRetry={retry} />;
        })}
        {typing && <TypingRow agent={displayAgent} />}

        {/* receipt-card + quick-replies land under the agent's opening, once it's said.
            Both come from real ticket context — nothing renders without it. */}
        {!!ticketContext && thread.some((m) => m.id === 'a-open') && (
          <>
            <ContextCard ctx={ticketContext} onPrimary={contextAction} onLink={openLink} />
            {!!(ticketContext.replies && ticketContext.replies.length) && (
              // The two design chips measure 157 + 8 + 162 = 327 against a 320 row, so
              // this scrolls rather than clipping the second one.
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={s.quickReplies}
                contentContainerStyle={s.quickRepliesInner}
                keyboardShouldPersistTaps="handled"
              >
                {ticketContext.replies.map((r) => (
                  <PressableScale
                    key={r}
                    style={s.replyChip}
                    onPress={() => { setDraft(r); }}
                    scaleTo={0.96}
                    accessibilityRole="button"
                    accessibilityLabel={r}
                  >
                    <TX w="med" s={12} lh={15} c={D.ink}>{r}</TX>
                  </PressableScale>
                ))}
              </ScrollView>
            )}
          </>
        )}

        {/* Files already on this ticket, as the server has them. Grouped under the thread
            rather than slotted between messages: the API returns no createdAt on an
            attachment, so there is no honest position for them, and a guessed one would
            be worse than a labelled shelf. A chip that opens the file is the whole job —
            this is not a gallery. */}
        {!!attachments.length && (
          <View style={s.attachGroup}>
            <TX w="semi" s={10} lh={12} c={D.muted} style={s.eventText}>
              {`${attachments.length} FILE${attachments.length > 1 ? 'S' : ''} IS TICKET PAR`}
            </TX>
            <View style={s.attachList}>
              {attachments.map((a) => (
                <PressableScale
                  key={a.id}
                  style={s.attachChip}
                  onPress={() => open(a.url, 'Could not open', `Open ${a.name} in your browser instead.`)}
                  scaleTo={0.96}
                  accessibilityRole="link"
                  accessibilityLabel={`Open attachment ${a.name}`}
                >
                  <FileText size={13} color={D.indigo} strokeWidth={2.2} />
                  <TX w="med" s={11.5} lh={15} c={D.indigo} numberOfLines={1} style={{ flexShrink: 1, maxWidth: 200 }}>
                    {a.name}
                  </TX>
                </PressableScale>
              ))}
            </View>
          </View>
        )}

        {/* Task 14: staff mark it resolved → the ticket moves to `pending_confirmation`,
            NOT closed. This card is what actually asks the user — it never implies the
            decision is already made, and it stays exactly where it is (busy-disabled,
            not swapped away) unless the server confirms one of the two actions. */}
        {!!ticket && ticket.status === 'pending_confirmation' && (
          <ConfirmCard
            resolution={ticket.resolution}
            onConfirm={confirmResolved}
            onStillBroken={stillBroken}
            busy={confirmBusy}
          />
        )}
      </ScrollView>

      {/* ── alternative contact ──────────────────────────────────────────────
          Not in the Figma file. The ticket is the delivery route; these two are how
          you reach a person directly — and the only route left when a send fails,
          which is why WhatsApp goes solid the moment something is stuck. */}
      <View style={s.connect}>
        <TX w="reg" s={10} lh={12} c={D.muted} style={s.connectLabel}>
          {stuck.length
            ? `${stuck.length} MESSAGE${stuck.length > 1 ? 'S' : ''} NOT SENT`
            : 'YA SEEDHA CONNECT KAREIN'}
        </TX>
        {/* The flex:1 lives on these wrappers, NOT on the pill style. PressableScale puts
            its style on an inner view, and flex:1 there means flexBasis:0 — which beats
            height:38 and collapses the pill to a hairline. Same `slot` pattern the nav
            bars use. */}
        <View style={s.connectRow}>
          <View style={s.slot}>
            <PressableScale
              style={[s.pill, stuck.length ? s.pillWaSolid : s.pillWa]}
              onPress={openWhatsApp}
              scaleTo={0.96}
              accessibilityRole="button"
              accessibilityLabel={stuck.length ? 'Send the unsent messages on WhatsApp' : 'Chat on WhatsApp'}
            >
              <MessageCircle size={15} color={stuck.length ? '#06281B' : D.wa} strokeWidth={2.4} />
              <TX w="semi" s={12.5} c={stuck.length ? '#06281B' : D.wa}>
                {stuck.length ? 'Send on WhatsApp' : 'Chat on WhatsApp'}
              </TX>
            </PressableScale>
          </View>
          <View style={s.slot}>
            <PressableScale style={[s.pill, s.pillMail]} onPress={openEmail} scaleTo={0.96} accessibilityRole="button" accessibilityLabel="Email the team">
              <Mail size={15} color={D.muted} strokeWidth={2.4} />
              <TX w="semi" s={12.5} c={D.ink}>Email</TX>
            </PressableScale>
          </View>
        </View>
      </View>

      {/* ── input-section ───────────────────────────────────────────────── */}
      <View style={[s.inputSection, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {/* Staged attachments sit above the composer so you can see — and drop — what
            is about to go with the message. */}
        {!!files.length && (
          <View style={s.staged}>
            {files.map((f) => (
              <View key={f.uri} style={s.stagedChip}>
                <FileText size={13} color={D.muted} strokeWidth={2.2} />
                <TX w="med" s={11.5} lh={15} c={D.ink} numberOfLines={1} style={{ flexShrink: 1, maxWidth: 150 }}>{f.name}</TX>
                {!!f.size && <TX w="reg" s={10} lh={14} c={D.muted}>{prettySize(f.size)}</TX>}
                <PressableScale onPress={() => dropFile(f.uri)} scaleTo={0.85} accessibilityRole="button" accessibilityLabel={`Remove ${f.name}`}>
                  <X size={13} color={D.muted} strokeWidth={2.4} />
                </PressableScale>
              </View>
            ))}
          </View>
        )}

        <View style={s.inputBar}>
          <PressableScale style={s.iconBtn} onPress={attach} scaleTo={0.88} accessibilityRole="button" accessibilityLabel="Attach a photo or file">
            <Paperclip size={20} color={files.length ? D.indigo : D.muted} strokeWidth={2} />
          </PressableScale>

          <View style={s.textField}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Message type karein..."
              placeholderTextColor={D.placeholder}
              style={s.input}
              returnKeyType="send"
              onSubmitEditing={send}
              accessibilityLabel="Message"
            />
            <PressableScale onPress={voice} scaleTo={0.88} accessibilityRole="button" accessibilityLabel="Voice message">
              <Mic size={18} color={D.muted} strokeWidth={2} />
            </PressableScale>
          </View>

          <PressableScale
            style={[s.sendBtn, !canSend && s.sendBtnOff]}
            onPress={send}
            disabled={!canSend}
            scaleTo={0.9}
            accessibilityRole="button"
            accessibilityLabel="Send"
          >
            <ArrowRight size={18} color="#FFFFFF" strokeWidth={2} />
          </PressableScale>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: D.bg },

  // context-panel — hug 72, pad 16/20, radius 20 on the bottom corners only
  contextPanel: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16, paddingHorizontal: 20,
    backgroundColor: D.card,
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
    borderBottomWidth: 1, borderBottomColor: D.border,
  },
  contextLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  backBtn: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  headAvatar: { width: 40, height: 40, borderRadius: 20 },
  headAvatarFallback: { backgroundColor: '#2B2560', alignItems: 'center', justifyContent: 'center' },
  contextAgent: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  contextAgentNames: { gap: 2, flexShrink: 1 },
  badge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },

  // compact-header — hug 56, pad 12/20, flat bottom hairline, avatar 32 r16, gap 10
  compactHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 20,
    backgroundColor: D.card, borderBottomWidth: 1, borderBottomColor: D.border,
  },
  agentLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  compactAvatar: { width: 32, height: 32, borderRadius: 16 },
  ticketBadgeSm: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 6, backgroundColor: D.ticketBg },

  contextRight: { alignItems: 'flex-end', gap: 6 },
  ticketBadge: {
    paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8,
    backgroundColor: D.ticketBg, borderWidth: 1, borderColor: D.border,
  },
  queueBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  queueDot: { width: 6, height: 6, borderRadius: 3 },

  // messages-area — pad 20, gap 20
  messages: { padding: 20, gap: 20 },

  eventRow: { alignItems: 'center' },
  eventChip: {
    paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20,
    backgroundColor: D.card, borderWidth: 1, borderColor: D.border,
  },
  // The panel reads "50%" tracking, which at 10px would be 5px per character and blows
  // the chip well past its measured 154px. 0.5px is the value that reproduces the file.
  eventText: { letterSpacing: 0.5 },
  // CallChip — same pill as eventChip, laid out as a row so the phone icon sits beside
  // the outcome copy instead of stacking above it.
  callChip: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  userRow: { alignItems: 'flex-end', gap: 6 },
  userBubble: {
    maxWidth: 260, padding: 12, backgroundColor: D.indigo,
    borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomRightRadius: 4, borderBottomLeftRadius: 16,
  },
  bubbleFiles: { marginTop: 8, gap: 6 },
  bubbleFile: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 10, paddingVertical: 6, paddingHorizontal: 8,
  },
  userMeta: { marginTop: 2 },
  userTime: { opacity: 0.7, textAlign: 'right' },
  retryRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },

  agentRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  peek: { width: 24, height: 24, borderRadius: 12 },
  peekFallback: { backgroundColor: '#2B2560', alignItems: 'center', justifyContent: 'center' },
  // Wraps the optional author label + the bubble, so a real thread's agent name sits
  // above the message without disturbing the scripted bubbles that never pass one.
  agentCol: { gap: 4, flexShrink: 1 },
  agentName: { marginLeft: 4 },
  agentBubble: {
    maxWidth: 260, padding: 12, backgroundColor: D.card, borderWidth: 1, borderColor: D.border,
    borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomRightRadius: 16, borderBottomLeftRadius: 4,
  },
  // The doubt-redirect CTA — a plain text button under the bubble, indigo like every
  // other in-flow link (ContextCard's "View Invoice", the WhatsApp/email pills).
  doubtCta: { alignSelf: 'flex-start', marginLeft: 4, paddingVertical: 4 },
  typingBubble: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 10, paddingHorizontal: 14,
    backgroundColor: D.card, borderWidth: 1, borderColor: D.border,
    borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomRightRadius: 16, borderBottomLeftRadius: 4,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: D.indigo },

  // Attachments already on the ticket — a labelled shelf under the thread, styled off the
  // staged-file chips below so the two read as the same kind of object.
  attachGroup: { gap: 8 },
  attachList: { gap: 8, alignItems: 'flex-start' },
  attachChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
    paddingVertical: 7, paddingHorizontal: 10, borderRadius: 12,
    backgroundColor: D.card, borderWidth: 1, borderColor: D.border,
  },

  // receipt-card — 280×220 fixed, r16, 1.5px indigo border, space-between, pad 16
  receipt: {
    width: 280, height: 220, alignSelf: 'flex-start',
    padding: 16, borderRadius: 16, borderWidth: 1.5, borderColor: D.indigo,
    backgroundColor: D.card, justifyContent: 'space-between',
    shadowColor: D.indigo, shadowOpacity: 0.302, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 10,
  },
  badgeRow: { flexDirection: 'row' },
  ctxBadge: { paddingVertical: 3, paddingHorizontal: 9, borderRadius: 9 },
  ctxBadgeText: { letterSpacing: 0.6 },
  amountRow: { gap: 4 },
  ctxPrimary: {
    alignSelf: 'stretch', height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', backgroundColor: D.success,
  },
  ctxLink: { alignSelf: 'center' },
  underline: { textDecorationLine: 'underline' },

  // quick-replies — chips hug 31 (pad 8/14), r16, 1px border, gap 8
  quickReplies: { flexGrow: 0 },
  quickRepliesInner: { gap: 8, paddingRight: 20 },
  replyChip: {
    height: 31, justifyContent: 'center', paddingHorizontal: 14,
    borderRadius: 16, borderWidth: 1, borderColor: D.border,
  },

  // alternative contact
  connect: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 2, gap: 10, borderTopWidth: 1, borderTopColor: D.border },
  connectLabel: { letterSpacing: 0.8 },
  connectRow: { flexDirection: 'row', gap: 10 },
  slot: { flex: 1 },
  pill: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 38, borderRadius: 20, borderWidth: 1 },
  pillWa: { backgroundColor: 'rgba(37,211,102,0.10)', borderColor: 'rgba(37,211,102,0.40)' },
  // Solid once something is stuck — the tinted outline reads as optional, and "optional"
  // is exactly the wrong signal when a message has not been delivered.
  pillWaSolid: { backgroundColor: D.wa, borderColor: D.wa },
  pillMail: { backgroundColor: D.card, borderColor: D.border },

  // input-section — input-bar hug 64 (pad 12/20, gap 12)
  inputSection: { backgroundColor: D.bg },
  staged: { paddingHorizontal: 20, paddingTop: 10, gap: 8 },
  stagedChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
    paddingVertical: 7, paddingHorizontal: 10, borderRadius: 12,
    backgroundColor: D.card, borderWidth: 1, borderColor: D.border,
  },
  inputBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 20 },
  iconBtn: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  textField: {
    flex: 1, height: 40, flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, borderRadius: 20,
    backgroundColor: D.card, borderWidth: 1, borderColor: D.border,
  },
  input: { flex: 1, color: D.ink, fontSize: 14, fontFamily: IF.reg, padding: 0 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: D.indigo, alignItems: 'center', justifyContent: 'center' },
  sendBtnOff: { opacity: 0.45 },
});
