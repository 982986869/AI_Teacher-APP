// src/components/support/SupportSheet.js
// Host for the support flow: a full-screen modal that shows the topic-select screen
// (`chat-v3-topic-select`) and, once a department is picked, the conversation screen
// (`chat-v3`) with that department's agent.
//
// The two screens live in TopicSelect.js and ChatScreen.js; this file owns only the
// modal, the step state and the per-conversation ticket ref.
import React, { useCallback, useEffect, useState } from 'react';
import { Modal, StatusBar } from 'react-native';

import TopicSelect from './TopicSelect';
import ChatScreen from './ChatScreen';
import ResolvedScreen from './ResolvedScreen';
import { DEFAULT_AGENT } from './supportConfig';

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

  useEffect(() => { if (visible) { setPicked(null); setReopened(false); } }, [visible]);

  // ChatScreen raises the ticket itself and owns the server-issued ref — this only picks
  // the department.
  const pick = useCallback((category, index) => {
    setReopened(false);
    setPicked({ category, index });
  }, []);

  // Back on the conversation returns to the topic list; back on the list closes.
  const back = useCallback(() => setPicked(null), []);

  // "Connect to the person of that department": a topic can name its own agent, and
  // falls back to the shared one. TODO(support-agent) — this should come from an
  // endpoint that returns whoever is actually on shift for the chosen department.
  const activeAgent = (picked && picked.category.agent) || agent;

  // The resolved state is data, never a local decision: it shows when the ticket the
  // backend handed us carries a `resolution`. "Reopen This Chat" drops back to the
  // conversation for this session only — the ticket's real status is the server's call.
  const ctx = (picked && ticketContexts && ticketContexts[picked.category.id]) || null;
  const showResolved = !!(ctx && ctx.resolution) && !reopened;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={picked ? back : onClose} statusBarTranslucent>
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
          onContextAction={onContextAction}
          onBack={back}
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
          onClose={onClose}
        />
      )}
    </Modal>
  );
}
