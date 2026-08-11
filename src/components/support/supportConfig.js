// src/components/support/supportConfig.js
// Who to contact about what. One config drives the Help & Support screen (the
// `chat-v3-topic-select` design) on both the student app and the parent dashboard.
//
// ⚠️ Contact routes: WhatsApp +91 89056 04773 and support@ailernova.com are the ONLY
// channels Ailernova actually publishes (they already back the refund + referral copy
// in src/screens/parent/ParentApp/constants.js). So every topic currently lands on
// those two, and the topic's `team` is stamped into the pre-filled message instead —
// support reads the tag and triages it to the right desk.
//
// ► TODO(support-routing): when a team gets its own WhatsApp number or inbox, add
//   `whatsapp` / `email` to that topic below and it overrides the shared route.
//   Do NOT invent numbers or inboxes here — a dead contact is worse than a slow one.

// The shared, verified company channels.
export const SUPPORT = {
  whatsapp: '918905604773',                 // digits only — wa.me format
  whatsappDisplay: '+91 89056 04773',
  email: 'support@ailernova.com',
  // TODO(support-routing): the number above is a WhatsApp line; we have not confirmed it
  // takes voice calls. Set this to a real helpline and a "Call" button appears by itself.
  phone: null,
  hours: 'Mon–Sat 9AM–9PM',
  // ⚠️ TODO(support-sla): "avg 4 min" comes from the design, not from measured data.
  // It reads as a response-time promise to the customer — confirm it against real
  // first-response times (or drop it) before this ships.
  avgReply: 'avg 4 min',
};

// Who the user is talking to. There is no hardcoded person here on purpose — this used
// to name a support rep, taken straight from the mockup, who does not exist at Ailernova.
// The real name arrives on the ticket as `assignedTo`, and until a ticket exists the
// screen shows the TEAM, which is true regardless of who picks it up.
export const teamAgent = (category) => ({
  name: (category && category.team) || 'Support team',
  team: (category && category.team) || 'Support team',
  online: false,
  photo: null,
});

// Back-compat default for callers that render the agent placeholder before any category
// is chosen (HelpFab.js, out of this task's scope) — same honest fallback as above, never
// an invented person.
export const DEFAULT_AGENT = teamAgent(null);

// ── Topics ───────────────────────────────────────────────────────────────────
// `tint` is the number-badge fill and `badgeInk` the numeral on top of it. Two of the
// four are specified in the Figma panels — topic 1 #FA4F07, and topic 3 #E8D14D with a
// #0C0936 numeral (a white "3" on that yellow would fail contrast, which is why the
// numeral colour is per-topic rather than always white). Topics 2 and 4 were read off
// the mockup — worth confirming against the file if exactness matters.
// `plain: true` renders the row as the full-width button at the bottom of the list
// (the "Kuch aur" row) — no badge, no chevron, centred label.

export const PARENT_CATEGORIES = [
  {
    id: 'sales',
    tint: '#FA4F07',
    badgeInk: '#FFFFFF',
    label: 'Sales',
    desc: 'Course plans & pricing',
    team: 'Sales team',
    tag: 'Sales',
    blurb: 'Plans, pricing, upgrades or starting a new course.',
  },
  {
    id: 'tutor',
    tint: '#2EA043',
    badgeInk: '#FFFFFF',
    label: 'Tutor',
    desc: 'Schedule or tutor changes',
    team: 'Tutor operations',
    tag: 'Tutor',
    blurb: 'Class timings, reschedules, or changing your child’s tutor.',
  },
  {
    id: 'billing',
    tint: '#E8D14D',
    badgeInk: '#0C0936',
    label: 'Billing',
    desc: 'Refunds, invoice & double charge',
    team: 'Accounts team',
    tag: 'Billing',
    blurb: 'Payments, receipts, refunds or a charge that looks wrong.',
  },
  {
    id: 'class',
    tint: '#A371F7',
    badgeInk: '#FFFFFF',
    label: 'Class related',
    desc: 'Zoom links & curriculum',
    team: 'Class support',
    tag: 'Class',
    blurb: 'Join links, missed classes, syllabus or learning material.',
  },
  {
    id: 'other',
    plain: true,
    tint: '#8B949E',
    badgeInk: '#0C0936',
    label: 'Kuch aur',
    desc: 'Something else',
    team: 'Support team',
    tag: 'General',
    blurb: 'Not sure where it fits? Start here and we’ll route it.',
  },
];

export const STUDENT_CATEGORIES = [
  {
    id: 'doubt',
    tint: '#FA4F07',
    badgeInk: '#FFFFFF',
    label: 'Doubt',
    desc: 'A topic or question you’re stuck on',
    team: 'Academic team',
    tag: 'Doubt',
    blurb: 'A concept, a solution or a question you’re stuck on.',
  },
  {
    id: 'class',
    tint: '#2EA043',
    badgeInk: '#FFFFFF',
    label: 'Class related',
    desc: 'Zoom links, timings & tutor',
    team: 'Class support',
    tag: 'Class',
    blurb: 'Missed a class, need a reschedule, or an issue with your tutor.',
  },
  {
    id: 'test',
    tint: '#E8D14D',
    badgeInk: '#0C0936',
    label: 'Test & results',
    desc: 'Answer keys, scores & submissions',
    team: 'Assessment team',
    tag: 'Tests',
    blurb: 'A wrong answer key, a score that looks off, or a test that didn’t submit.',
  },
  {
    id: 'tech',
    tint: '#A371F7',
    badgeInk: '#FFFFFF',
    label: 'App not working',
    desc: 'Login, video, audio or crashes',
    team: 'Tech support',
    tag: 'Tech',
    blurb: 'Login, video, audio, loading or crash problems.',
  },
  {
    id: 'other',
    plain: true,
    tint: '#8B949E',
    badgeInk: '#0C0936',
    label: 'Kuch aur',
    desc: 'Something else',
    team: 'Support team',
    tag: 'General',
    blurb: 'Not sure where it fits? Start here and we’ll route it.',
  },
];

// The ticket reference (AL-2291) is issued by the server from a Postgres sequence
// (prisma/sql/support_tickets.sql), not minted on the device. A device-minted ref
// collides across phones and names a ticket that exists nowhere, so ChatScreen leaves the
// badge empty until POST /api/support/tickets answers.

// The `doubt` category stays in support — students do occasionally ask study questions
// here, and the honest answer is to point them somewhere that can actually answer. It
// is a redirect, not a wall: the chat stays open and anything they write still becomes a
// real ticket.
export const DOUBT_REDIRECT = {
  text: 'Ye padhai ka sawaal lag raha hai — AI Teacher se turant jawab mil jayega. '
      + 'Phir bhi kuch aur poochna ho to yahin likhiye, team dekh legi.',
  cta: 'AI Teacher kholein',
};

// ── Copy ─────────────────────────────────────────────────────────────────────
// The design's greeting names the parent and the child ("Hi Meera 👋 Aarav ki learning
// ke baare mein kya help chahiye?"). We only interpolate names we actually have —
// otherwise the sentence drops that clause instead of printing an empty slot.
export function buildGreeting({ role, userName, childName }) {
  const hi = userName ? `Hi ${userName} 👋` : 'Hi 👋';
  if (role === 'parent') {
    const who = childName ? `${childName} ki` : 'aapke bacche ki';
    return `${hi} ${who} learning ke baare mein kya help chahiye?`;
  }
  return `${hi} aaj kis cheez mein help chahiye?`;
}

// ── Ticket context ───────────────────────────────────────────────────────────
// The richer conversation state: a ticket exists AND we already know something about
// the user's case (a duplicate payment, a missed class, a failed submission), so the
// agent opens with that context and offers an action instead of asking from scratch.
//
// ⚠️ This is rendered ONLY when a `ticketContext` is passed in — never by default.
// The card shows an amount, an invoice number and a "Confirm Refund" button. With no
// billing integration behind it, every one of those would be invented, and a parent
// who taps Confirm would reasonably believe money is moving. So: real data or nothing.
//
// Shape:
//   {
//     opening:  string            // what the agent says before the card
//     badge:    { label, tint, ink }
//     amount:   string            // pre-formatted, incl. currency
//     meta:     string            // invoice · date · instrument
//     primary:  { label }         // the action; see `onContextAction` in ChatScreen
//     link:     { label, url }    // omitted/urlless → not rendered, never a dead link
//     replies:  string[]          // quick-reply chips
//     resolution: { summary, at, by }  // present → the `chat-v3-resolved` screen
//   }
//
// ► TODO(chat-backend): populate this from the ticket/billing API. Until then the only
//   way to see it is to pass DEMO_TICKET_CONTEXT below, which is for design review on a
//   dev build — do not wire it into a shipped screen.
export const DEMO_TICKET_CONTEXT = {
  // Reworded from the Figma copy ("Duplicate wala refund kar deti hoon"), which promises
  // an action the app cannot perform and carries a gendered Hindi verb ending — the
  // agent on shift can be anyone.
  opening: 'Dekh rahe hain — 12 Aug ko do payments capture hui hain. INV-8841 duplicate lag raha hai. Confirm kar dijiye, refund request team tak chali jayegi.',
  badge: { label: 'Duplicate payment', tint: '#F5A623', ink: '#0C0936' },
  amount: '₹4,800.00',
  meta: 'INV-8841 · 12 Aug 2026 · UPI ···4471',
  primary: { label: 'Confirm Refund' },
  link: { label: 'View Invoice', url: null },   // no invoice endpoint yet → link hidden
  replies: ['Haan, refund kar dijiye', 'Ye meri payment nahi...'],
};

// Add `resolution` to a context and the conversation becomes the `chat-v3-resolved`
// screen instead. Demo only — a real one comes from the ticket's status.
export const DEMO_RESOLVED_CONTEXT = {
  ...DEMO_TICKET_CONTEXT,
  resolution: {
    summary: 'Duplicate August payment refunded — ₹4,800, 5–7 working days.',
    at: 'Today · 2:31 PM',
    by: 'Accounts team',
  },
};

// ── Agent replies ────────────────────────────────────────────────────────────
// ⚠️ TODO(chat-backend): this is a scripted auto-responder, NOT a person. Until a real
// agent socket exists it is the only thing that replies, so the copy is written so it
// never claims a human is reading: it acknowledges, names the team and the ticket, and
// points at the two channels that do reach someone. If you edit it, keep that property
// — a line like "team is looking into it" would be false today.
// Phrasing also avoids gendered Hindi verb endings, since the agent on shift can be
// anyone; only the name changes.
const firstName = (n) => String(n || '').trim().split(/\s+/)[0] || 'Support';

export function agentOpening({ category, agent }) {
  return `Namaste! Main ${firstName(agent && agent.name)}, ${category.team} se. Aapne “${category.label}” chuna hai — ${String(category.desc || '').toLowerCase()}. Zara detail mein likhiye kya hua?`;
}

// Said once the ticket is genuinely created on the server — so it can promise a callback,
// because a real team member now has it in their queue.
export function agentTicketRaised({ ticket, team, phone, assignee }) {
  const who = assignee ? `${assignee} (${team})` : `${team} ka member`;
  const how = phone
    ? `aapko ${phone} par call karega`
    : 'aapse jald contact karega';
  return `Ticket ${ticket} ${team} tak pahunch gaya hai. ${who} ${how}. Beech mein kuch aur batana ho to yahin likh dijiye — ya WhatsApp/Email se seedha bhi baat kar sakte hain.`;
}

// Said when the ticket could NOT be raised. It does not soften what happened: the
// message is still sitting on the phone, and the only routes that work are the two
// below it.
export function agentSendFailed({ category }) {
  return `Ye message abhi ${category.team} tak nahi pahunch paaya — request bheji nahi ja saki. Neeche “Send on WhatsApp” ya “Email” use kar lijiye, aapka likha hua saath chala jayega. Ya thodi der baad dobara try kariye.`;
}

// ── Message building ─────────────────────────────────────────────────────────
// The team tag is what makes shared-inbox routing work, so it goes on line one and we
// never drop it. `note` is whatever the user typed on the follow-up step (optional).
export function buildSupportMessage({ category, role, name, note, ticket, transcript }) {
  const lines = [
    `Hi Ailernova — I need help with: ${category.label}${category.desc ? ` (${category.desc})` : ''}`,
    `Team: ${category.team}`,
  ];
  if (ticket) lines.push(`Ref: ${ticket}`);
  lines.push(`I am a ${role === 'parent' ? 'parent' : 'student'}${name ? ` (${name})` : ''}`, '');
  // Anything already typed in the in-app thread travels with them, so the user never
  // retypes their problem just because they switched channel.
  const said = (transcript && transcript.length)
    ? transcript.join('\n')
    : ((note && note.trim()) ? note.trim() : '');
  lines.push(said || 'My issue: ');
  return lines.join('\n');
}

export function supportSubject(category, ticket) {
  return `${ticket ? `${ticket} · ` : ''}${category.team} — ${category.label}`;
}

// wa.me / mailto / tel URLs for a topic. Per-topic overrides win over SUPPORT.
export function supportLinks({ category, role, name, note, ticket, transcript }) {
  const body = buildSupportMessage({ category, role, name, note, ticket, transcript });
  const wa = category.whatsapp || SUPPORT.whatsapp;
  const mail = category.email || SUPPORT.email;
  const tel = category.phone || SUPPORT.phone;
  return {
    whatsapp: `https://wa.me/${wa}?text=${encodeURIComponent(body)}`,
    email: `mailto:${mail}?subject=${encodeURIComponent(supportSubject(category, ticket))}&body=${encodeURIComponent(body)}`,
    phone: tel ? `tel:${tel}` : null,
    body,
    mail,
    tel,
  };
}
