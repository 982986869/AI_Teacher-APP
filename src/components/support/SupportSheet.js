// src/components/support/SupportSheet.js
// Host for the support flow: a full-screen modal that shows the topic-select screen
// (`chat-v3-topic-select`) and, once a department is picked, the conversation screen
// (`chat-v3`) with that department's agent.
//
// The two screens live in TopicSelect.js and ChatScreen.js; this file owns only the
// modal, the step state and the per-conversation ticket ref.
import React, { useCallback, useEffect, useState } from 'react';
import { Modal, StatusBar } from 'react-native';

import TicketList from './TicketList';
import TopicSelect from './TopicSelect';
import ChatScreen from './ChatScreen';
import ResolvedScreen from './ResolvedScreen';
import { DEFAULT_AGENT } from './supportConfig';
import { listMyTickets, markTicketRead } from '../../api/supportApi';

export default function SupportSheet({
  visible,
  onClose,
  categories,
  role = 'student',      // stamped into the ticket so support knows who wrote in
  userName,
  userPhone,             // the number the assigned team member calls back on
  childName,
  agent = DEFAULT_AGENT,
  greeting,
  liveChat = false,      // see TODO(chat-backend) in ChatScreen.js
  // Real case data for the chosen department, keyed by topic id — e.g.
  // { billing: { amount, meta, primary, replies, … } }. Only the picked topic's entry
  // is used, and the receipt-card variant renders only when one exists. See
  // TODO(chat-backend) + DEMO_TICKET_CONTEXT in supportConfig.js.
  ticketContexts,
  onContextAction,
}) {
  // { category, index } once a department is chosen; null on the topic list.
  const [picked, setPicked] = useState(null);
  const [reopened, setReopened] = useState(false);

  // step governs what shows while `picked` is null: the user's existing tickets, or the
  // topic list to raise a new one. Stays 'list' for the whole ticket-list → chat → back
  // round trip, which is what makes plain `setPicked(null)` land back on the list.
  const [step, setStep] = useState('list');
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  // The ticket opened from the list, if any — handed to ChatScreen as `existingTicket`.
  const [openTicket, setOpenTicket] = useState(null);

  useEffect(() => {
    if (visible) { setPicked(null); setReopened(false); setOpenTicket(null); }
  }, [visible]);

  // Skip straight to the topic list when there is nothing to come back to — the extra
  // screen only earns its place once the user actually has a ticket.
  useEffect(() => {
    if (!visible) return;
    let alive = true;
    setLoadingTickets(true);
    listMyTickets()
      .then((rows) => {
        if (!alive) return;
        const live = rows.filter((t) => t.status !== 'closed');
        setTickets(live);
        setStep(live.length ? 'list' : 'topics');
      })
      .catch(() => { if (alive) { setTickets([]); setStep('topics'); } })
      .finally(() => { if (alive) setLoadingTickets(false); });
    return () => { alive = false; };
  }, [visible]);

  // ChatScreen raises the ticket itself and owns the server-issued ref — this only picks
  // the department.
  const pick = useCallback((category, index) => {
    setReopened(false);
    setOpenTicket(null);
    setPicked({ category, index });
  }, []);

  // Reopening an existing thread from the list: find the department it was raised under
  // (falling back to a plain synthetic one if that category no longer exists) so ChatScreen
  // renders exactly as it would mid-conversation, then hand the ticket itself through.
  const openExisting = useCallback((t) => {
    markTicketRead(t.id);
    const idx = categories.findIndex((c) => c.id === t.topicId);
    const category = idx >= 0
      ? categories[idx]
      : { id: t.topicId, label: t.topicLabel || t.team, team: t.team, plain: true };
    setReopened(false);
    setOpenTicket(t);
    setPicked({ category, index: idx >= 0 ? idx : 0 });
  }, [categories]);

  // Back on the conversation returns to wherever `step` says — the topic list when this
  // chat was raised fresh, the ticket list when it was opened from there, since `step`
  // never changes for that round trip. Back on the topic list closes the sheet, unless it
  // was reached via "Naya issue" from the ticket list, in which case it returns there.
  const back = useCallback(() => { setPicked(null); setOpenTicket(null); }, []);
  const backFromTopics = useCallback(() => {
    if (tickets.length) setStep('list');
    else onClose();
  }, [tickets.length, onClose]);

  // "Connect to the person of that department": a topic can name its own agent, and
  // falls back to the shared one. TODO(support-agent) — this should come from an
  // endpoint that returns whoever is actually on shift for the chosen department.
  const activeAgent = (picked && picked.category.agent) || agent;

  // The resolved state is data, never a local decision: it shows when the ticket the
  // backend handed us carries a `resolution`. "Reopen This Chat" drops back to the
  // conversation for this session only — the ticket's real status is the server's call.
  const ctx = (picked && ticketContexts && ticketContexts[picked.category.id]) || null;
  const showResolved = !!(ctx && ctx.resolution) && !reopened;

  const requestClose = picked ? back : (step === 'topics' ? backFromTopics : onClose);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={requestClose} statusBarTranslucent>
      {/* The app sets dark-content status-bar icons for its light screens; on #0C0936
          those vanish. RN's StatusBar is a stack, so this reverts on close by itself. */}
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      {picked && showResolved ? (
        <ResolvedScreen
          agent={activeAgent}
          ticket={ctx.ref || null}
          category={picked.category}
          resolution={ctx.resolution}
          onNewConversation={back}
          onReopen={() => setReopened(true)}
        />
      ) : picked ? (
        <ChatScreen
          category={picked.category}
          index={picked.index}
          agent={activeAgent}
          role={role}
          userName={userName}
          userPhone={userPhone}
          childName={childName}
          liveChat={liveChat}
          ticketContext={ctx}
          existingTicket={openTicket}
          onContextAction={onContextAction}
          onBack={back}
        />
      ) : step === 'list' ? (
        <TicketList
          tickets={tickets}
          loading={loadingTickets}
          onOpen={openExisting}
          onNew={() => setStep('topics')}
          onClose={onClose}
        />
      ) : (
        <TopicSelect
          categories={categories}
          agent={agent}
          role={role}
          userName={userName}
          childName={childName}
          greeting={greeting}
          onPick={pick}
          onClose={backFromTopics}
        />
      )}
    </Modal>
  );
}
