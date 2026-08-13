// src/components/support/SupportSheet.js
// Host for the support flow: a full-screen modal that shows the topic-select screen
// (`chat-v3-topic-select`) and, once a department is picked, the conversation screen
// (`chat-v3`) with that department's agent.
//
// The two screens live in TopicSelect.js and ChatScreen.js; this file owns only the
// modal, the step state and the per-conversation ticket ref.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, StatusBar, View } from 'react-native';

import TicketList from './TicketList';
import TopicSelect from './TopicSelect';
import ChatScreen from './ChatScreen';
import ResolvedScreen from './ResolvedScreen';
import { D } from './theme';
import { teamAgent } from './supportConfig';
import { listMyTickets, markTicketRead } from '../../api/supportApi';

// How long a closed ticket stays on the list. Closed used to be filtered out entirely,
// which made a ticket the server auto-closed after three silent days vanish from the app
// — the user who was away for a week lost the thread outright, and `reopenTicket` (which
// works from `closed` precisely so that never happens, see src/api/supportApi.js) had no
// button left to reach it from. A window rather than "forever" because the list is a
// to-do, not an archive: an issue settled a month ago is not something to come back to,
// and every real conversation is still one "Naya issue" away.
const CLOSED_VISIBLE_DAYS = 14;

function visibleTickets(rows) {
  const cutoff = Date.now() - CLOSED_VISIBLE_DAYS * 24 * 60 * 60 * 1000;
  return (rows || []).filter((t) => {
    if (t.status !== 'closed') return true;
    const at = new Date(t.updatedAt || t.createdAt).getTime();
    // An unparseable date keeps the ticket rather than hiding it. Losing the way back
    // into a thread is the failure this window exists to prevent.
    return Number.isNaN(at) || at >= cutoff;
  });
}

export default function SupportSheet({
  visible,
  onClose,
  categories,
  role = 'student',      // stamped into the ticket so support knows who wrote in
  userName,
  userPhone,             // the number the assigned team member calls back on
  childName,
  agent = teamAgent(),
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

  // step governs what shows while `picked` is null: null while the first ticket fetch is
  // still in flight (nothing renders yet — an account with zero tickets should never
  // flash "Your tickets" on its way to the topic list), then 'list' or 'topics'. Once
  // set by the user or the fetch, it stays put for the whole round trip into chat and
  // back, which is what makes plain `setPicked(null)` land back on the right screen.
  const [step, setStep] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  // The ticket opened from the list, if any — handed to ChatScreen as `existingTicket`.
  const [openTicket, setOpenTicket] = useState(null);

  // Whether the user has navigated away from the list/topics choice since the sheet
  // opened. The ticket fetch below only gets to pick the initial `step` while this is
  // false — otherwise a late-resolving fetch can yank the user off a screen they already
  // moved past (e.g. tapping "Naya issue" while the fetch is still in flight).
  const navigatedRef = useRef(false);

  useEffect(() => {
    if (visible) {
      setPicked(null);
      setReopened(false);
      setOpenTicket(null);
      setStep(null);
      navigatedRef.current = false;
    }
  }, [visible]);

  // Skip straight to the topic list when there is nothing to come back to — the extra
  // screen only earns its place once the user actually has a ticket. Guarded by
  // navigatedRef so this never overrides a step the user already chose.
  useEffect(() => {
    if (!visible) return;
    let alive = true;
    setLoadingTickets(true);
    listMyTickets()
      .then((rows) => {
        if (!alive) return;
        const shown = visibleTickets(rows);
        setTickets(shown);
        if (!navigatedRef.current) setStep(shown.length ? 'list' : 'topics');
      })
      .catch(() => {
        if (!alive) return;
        setTickets([]);
        if (!navigatedRef.current) setStep('topics');
      })
      .finally(() => { if (alive) setLoadingTickets(false); });
    return () => { alive = false; };
  }, [visible]);

  // ChatScreen raises the ticket itself and owns the server-issued ref — this only picks
  // the department.
  const pick = useCallback((category, index) => {
    navigatedRef.current = true;
    setReopened(false);
    setOpenTicket(null);
    setPicked({ category, index });
  }, []);

  // "+ Naya issue" from the ticket list.
  const goToTopics = useCallback(() => {
    navigatedRef.current = true;
    setStep('topics');
  }, []);

  // Reopening an existing thread from the list: find the department it was raised under
  // (falling back to a plain synthetic one if that category no longer exists) so ChatScreen
  // renders exactly as it would mid-conversation, then hand the ticket itself through.
  // Clearing `unread` locally (alongside the fire-and-forget `markTicketRead` call) is
  // what makes the dot disappear the moment the user opens the ticket, not just the next
  // time the sheet is reopened.
  const openExisting = useCallback((t) => {
    navigatedRef.current = true;
    markTicketRead(t.id);
    setTickets((prev) => prev.map((x) => (x.id === t.id ? { ...x, unread: false } : x)));
    const idx = categories.findIndex((c) => c.id === t.topicId);
    const category = idx >= 0
      ? categories[idx]
      : { id: t.topicId, label: t.topicLabel || t.team, team: t.team, plain: true };
    setReopened(false);
    setOpenTicket({ ...t, unread: false });
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

  // "Connect to the person of that department": before a ticket exists there's nobody to
  // name, so this shows the TEAM (teamAgent, supportConfig.js) — true regardless of who
  // eventually picks it up. Reopening an existing ticket from the list already carries
  // the server's real `assignedTo`, so that wins the moment it's known. A ticket raised
  // fresh in this session becomes ChatScreen's own state instead (it owns the socket/
  // refetch that keeps `assignedTo` current) — see `displayAgent` in ChatScreen.js.
  const openAssignee = openTicket && openTicket.assignedTo;
  const activeAgent = openAssignee
    ? {
      name: openAssignee.name,
      team: openAssignee.team || (picked && picked.category.team) || 'Support team',
      online: false,
      photo: null,
    }
    : (picked && picked.category.agent) || teamAgent(picked && picked.category);

  // The resolved state is data, never a local decision: it shows when the ticket the
  // backend handed us carries a `resolution`. "Reopen This Chat" drops back to the
  // conversation for this session only — the ticket's real status is the server's call.
  //
  // ⚠️ This whole branch is a design-preview path, not a production one: `ticketContexts`
  // (and the `DEMO_TICKET_CONTEXT`/`DEMO_RESOLVED_CONTEXT` it's meant to carry — see
  // supportConfig.js) is never passed by any real mount site. HelpFab.js forwards a
  // `ticketContexts` prop but neither of its two callers (src/navigation/
  // MainNavigator.js's StudentHelpFab, src/screens/parent/ParentApp/ParentApp.js) sets
  // one, so `ctx` is always null and `showResolved` always false in the shipped app —
  // every real conversation falls through to ChatScreen below, whose OWN resolved check
  // (`ticket.status === 'closed' && ticket.resolution`) is what actually fires, driven
  // by the real ticket. Checked as part of Task 15: if a future dev build ever DOES pass
  // `ticketContexts` for design review, this branch would render first and ChatScreen
  // (with its real-status check) would never mount for that pick — so still don't wire
  // `ticketContexts` into any real screen, and never enable the two DEMO_* constants.
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
          onNew={goToTopics}
          onClose={onClose}
        />
      ) : step === 'topics' ? (
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
      ) : (
        // step is still null: the first ticket fetch hasn't settled. Nothing applies yet
        // — not the ticket list, not the topic list — so hold the sheet's own dark
        // background rather than flashing a screen the user will immediately leave.
        <View style={{ flex: 1, backgroundColor: D.bg }} />
      )}
    </Modal>
  );
}
