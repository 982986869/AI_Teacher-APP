// src/screens/parent/ParentApp/constants.js
// Design tokens, Poppins font map, the `T` text helper, shared atoms, config, the
// Sessions mock/config data, and the single StyleSheet. Exact visuals from the
// teammate's RN build, plus a few styles for the real-data states (link/error/stats).
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Svg, { Defs, LinearGradient as LG, Stop, Rect } from 'react-native-svg';
import { Home, BarChart3, MessageCircle, BookOpen, Video } from 'lucide-react-native';

export const C = {
  bg: '#FFFFFF', canvas: '#F1F3F7', headerBg: '#F6F6F7', ink: '#161616', muted: '#6C7179', faint: '#A6AAB2',
  border: '#ECECEE', hair: '#F0F1F4', black: '#111111',
  orange: '#F0501E', gold: '#F5B301', navy: '#001A66',
  blue: '#1848F0', blueSoft: '#EAEFFF', green: '#12924B', greenSoft: '#E4F4EA',
  red: '#D81818', peach: '#FDEBE2', peachInk: '#C2410C',
  chatBg: '#33AEE8', classBg: '#2FC65C',
  // Hero (Upcoming Demo) — deep ink surface + gradient stops that read premium on a
  // light dashboard. Text/accents sit on top of this.
  heroA: '#171A2E', heroB: '#0E1020', heroAccent: '#8FA6FF',
};
// Nunito — the rounded display font used by ailernova.in (and matching the reference
// events UI). Loaded in ParentApp; applies across the whole parent dashboard.
export const F = {
  reg: 'Nunito_400Regular', med: 'Nunito_500Medium', semi: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold', xbold: 'Nunito_800ExtraBold', black: 'Nunito_900Black',
};
export const WORDMARK = [['A', C.orange], ['I', C.gold], ['L', C.navy], ['E', C.blue], ['R', C.blue], ['N', C.navy], ['O', C.green], ['V', C.red], ['A', C.orange]];

/* Marketing / static content (config, not per-user data). Subject-neutral + global. */
export const CONTENT = {
  trial: { title: 'Learning that\nactually sticks', body: 'Every Ailernova lesson is built on proven memory science — recall, spacing and mixed practice — so what your child learns lasts.', cta: 'Book a FREE demo' },
  // Per-event data is DB-driven (offline_events → /api/parent/report). These are the
  // shared brand figures shown under every event card.
  event: {
    cta: 'Register Now', learn: 'Learn how it works',
    stats: [{ value: '200+', label: 'Events' }, { value: '22K+', label: 'Participants' }, { value: '50+', label: 'Cities' }],
    rating: { score: '4.9', count: '11K+ Reviews' },
    exploreTitle: 'Explore events by', regionCta: 'Select Region', exploreHint: 'Please select a region to show the events',
    storeTitle: "What's in store for you?",
    storeBody: 'Your child dives into a hands-on learning experience — building, solving and discovering how they learn best. They take home everything they make.',
    regions: [],
    skillsTitle: "Skills You'll Discover",
    skillsIntro: 'The activities and quizzes build the core skills behind confident learning — across every subject.',
    participantsTitle: 'Hear From Our Participants',
    community: {
      title: 'Join our community of\nAilernova parents', body: 'Get updates, learning resources, and celebrate every win ❤️',
      instagram: 'https://www.instagram.com/ai_lernova/', youtube: 'https://www.youtube.com/@ailernova',
      facebook: 'https://www.facebook.com/ailernova/', linkedin: 'https://www.linkedin.com/company/ailernova/',
    },
    become: {
      title: 'BECOME AILERNOVA™', body: 'Build skills with daily challenges and puzzles.',
      appCta: 'Download the app', appUrl: 'https://ailernova.com',
      categories: [{ emoji: '🧠', label: 'BRAIN GAMES' }, { emoji: '🧩', label: 'LOGIC PUZZLES' }, { emoji: '⚡', label: 'QUICK RECALL' }],
    },
    // Footer accordions expand into LINK LISTS. An item either opens a `url`, or
    // fires an in-app `action` — 'about' opens the About Us story page, 'impact' opens
    // Our Impact, 'tutors' opens Our Tutors.
    footer: {
      links: [
        { q: 'About Ailernova', items: [
          { label: 'About Us', action: 'about' },
          { label: 'Our Impact', action: 'impact' },
          { label: 'Our Tutors', action: 'tutors' },
          { label: 'Parent Reviews', url: 'https://ailernova.in/#video-section-review' },
          { label: 'FAQs', url: 'https://ailernova.in/#faq' },
          { label: 'Contact Us', url: 'https://wa.me/918905604773' },
        ] },
        { q: 'Our Programs', items: [
          { label: 'AI Teacher', url: 'https://ailernova.in/#about' },
          { label: 'Brain Gym', url: 'https://ailernova.in/#about' },
          { label: 'Practice & Tests', url: 'https://ailernova.in/#about' },
          { label: 'Offline Events', url: 'https://ailernova.in/' },
        ] },
        { q: 'Resources', items: [
          { label: 'NCERT Solutions', url: 'https://ailernova.in/' },
          { label: 'Revision Notes', url: 'https://ailernova.in/' },
          { label: 'Previous Year Papers', url: 'https://ailernova.in/' },
          { label: 'Chapter Practice', url: 'https://ailernova.in/' },
        ] },
        { q: 'Tutoring', items: [
          { label: '1-on-1 Tutoring', url: 'https://ailernova.in/#about' },
          { label: 'Book a Free Demo', url: 'https://wa.me/918905604773' },
          { label: 'Our Tutors', action: 'tutors' },
        ] },
        { q: 'Partner with Us', items: [
          { label: 'Schools & Institutions', url: 'https://wa.me/918905604773' },
          { label: 'Become a Tutor', url: 'https://wa.me/918905604773' },
          { label: 'Referral Program', url: 'https://ailernova.in/' },
        ] },
      ],
      offices: [
        { label: 'SUPPORT', lines: 'support@ailernova.com\nailernova.com' },
      ],
    },
  },
};
/* ── FAQ copy ─────────────────────────────────────────────────────────────────
   TWO sets. CONTENT.about.faqs picks one.
   • DEMO_FAQS — verbatim Cuemath reference copy. Dresses the demo, nothing else.
     NOT shippable: false of us (2013 / Google / 80 countries / 100% online) and uses
     their MathFit™ mark.
   • AILERNOVA_FAQS — true of us, same structure and tone. This is the release set.
   Switch with the single `faqs:` line below.                                    */
const DEMO_FAQS = [
  { q: 'Does Cuemath actually work?',
    a: 'Yes. A Stanford-led study measured a 24% increase in mathematical reasoning among Cuemath students. Across 200,000+ children in 80+ countries, parents consistently report better grades, stronger confidence, and improved attitude toward math — tracked session-by-session in the Cuemath app.' },
  { q: 'Is Cuemath worth the money?',
    a: 'Yes — and Cuemath lets parents verify it before paying. Every enrollment starts with a free trial class, so parents see the tutor and the method before committing. Once enrolled, children show measurable outcomes: a Stanford-verified 24% gain in reasoning, improved school grades, and a 4.9/5 rating from 10,000+ parents who have paid (#1 in its tutoring category on Trustpilot).' },
  { q: 'How effective is Cuemath for kids?',
    a: 'Cuemath is effective across every grade and starting point — from children building foundational skills to those preparing for competitions. A Stanford-led study found a 24% increase in mathematical reasoning among Cuemath students. 200,000+ students across 80+ countries have gone through the program, with parents consistently reporting improvements in confidence, grades, and attitude toward math.' },
  { q: 'Can Cuemath help with math anxiety?',
    a: 'Yes. Cuemath\'s 1-on-1 live sessions are designed to meet each child where they are — removing the pressure of group settings and replacing it with a tutor matched specifically to their learning style.' },
  { q: 'Do Cuemath students improve their school grades?',
    a: 'Yes — improved school grades are the most commonly reported outcome among Cuemath parents, alongside stronger problem-solving and reduced math anxiety. Cuemath sessions align with the child\'s school curriculum (Common Core in the US, the National Curriculum in the UK, CBSE/ICSE/IB in India, and equivalent national frameworks elsewhere), so the work in Cuemath class directly reinforces what\'s tested in school.' },
];

// The release set. Still needs the real founding year in the story answer.
const AILERNOVA_FAQS = [
  { q: 'What is the Ailernova story?',
    a: 'We started with one belief: almost no child is actually “bad at math” or “bad at science” — they were failed by how it was taught. Rules to memorise, steps to repeat, no room to ask why. Ailernova was built to undo that. Today 200,000+ learners across Grades 6–12 build strong math and science foundations with us, through live 1-on-1 tutoring, an AI teacher that never runs out of patience, and practice built on memory science.' },
  { q: 'How are Ailernova classes conducted?',
    a: 'Live, 1-on-1 and fully interactive. Your child and their tutor work through problems together in real time — active learning, not a passive video. Between classes, the in-app AI teacher explains any chapter, answers doubts and sets practice, so a question at 11pm doesn’t have to wait for the next session.' },
  { q: 'Does Ailernova offer offline classes?',
    a: 'Classes are online, so your child learns from home and is matched with the right tutor regardless of city. We also run in-person Ailernova events and workshops — hands-on sessions your child can attend and take their work home from.' },
  { q: 'What is the class frequency and duration?',
    a: 'Typically two classes per week for grades K–8, and three per week for high school.' },
  { q: 'Can your tutors teach my child’s school curriculum?',
    a: 'Yes. Our tutors are experienced with CBSE, ICSE, IB, IGCSE and various state curricula, so nothing in a session ever feels unfamiliar.' },
  { q: 'My child has specific learning requirements; is your program flexible?',
    a: 'Our tutors are trained to work with children of varying learning needs and styles, and the plan adapts to how your child actually learns.' },
  { q: 'What devices do we need, and can my child join anytime?',
    a: 'Any device with a stable internet connection works — laptop, tablet or smartphone. Enrollment is open throughout the year.' },
];

/* ── Research accordion rows (About Us → "Research-Proven Method") ────────────
   TWO sets, exactly like the FAQs above:

   • DEMO_RESEARCH — verbatim Cuemath reference copy, to dress the demo. These are
     CUEMATH'S studies and CUEMATH'S results (Stanford, Nielsen, the 24% figure). They
     are FALSE of Ailernova. The brand name is left as "Cuemath" on purpose — that makes
     the rows read as reference placeholder rather than as a false claim under our own
     name. `image`/`url` stay null until the real assets/links are put here.
   • AILERNOVA_RESEARCH — ships. Published findings about HOW LEARNING WORKS, which our
     teaching is actually built on. Every line is true and citable today.

   ► BEFORE RELEASE: point `research.items` at AILERNOVA_RESEARCH (one line, below). */
const DEMO_RESEARCH = [
  { headline: 'Backed by Stanford: Cuemath Sharpens Thinking Skills',
    image: null,
    body: 'A Stanford-led study found that Cuemath tutors improved students’ reasoning skills by 24% and fostered a more balanced, student-centered learning dialogue.',
    linkLabel: 'Know more', url: null },
  { headline: 'Cuemath’s Logic-First Approach Drives Better Learning',
    image: null,
    body: 'Cuemath’s logic-first, visual teaching method takes students beyond rote memorization, fostering true mathematical understanding and confidence.',
    linkLabel: 'Know more', url: null },
  { headline: 'Nielsen Study: Cuemath Is Closing the Learning Gap',
    image: null,
    body: 'A Cuemath–Nielsen study showed how Cuemath helped students overcome pandemic-related math anxiety and recover lost skills across India.',
    linkLabel: 'Know more', url: null },
  { headline: '82% of US Students Fear Math. Cuemath Is Breaking That Pattern',
    image: null,
    body: 'A Cuemath survey found that 82% of US students in Grades 7–10 are fearful of math — and that fear increases year on year. Cuemath’s method is specifically designed to break that pattern.',
    linkLabel: 'Know more', url: null },
];

const AILERNOVA_RESEARCH = [
  { headline: 'Recalling Beats Re-reading',
    image: null,
    body: 'Students who were tested on material remembered far more of it a week later than students who re-read it for the same amount of time — even though re-reading felt more productive at the time. This is why an Ailernova session pulls answers out of your child rather than talking at them, and why practice is built on recall.',
    source: 'Roediger & Karpicke, Psychological Science (2006)',
    linkLabel: 'Know more', url: null },
  { headline: 'Spacing Makes Learning Last',
    image: null,
    body: 'The same study time spread across days produces significantly better long-term retention than the same hours crammed together. Our practice deliberately brings a topic back after a gap, instead of finishing it once and moving on.',
    source: 'Cepeda et al., Psychological Bulletin (2006)',
    linkLabel: 'Know more', url: null },
  { headline: 'One-on-One Attention Changes Outcomes',
    image: null,
    body: 'Bloom found that students taught one-on-one with mastery-based feedback outperformed conventionally taught classmates by around two standard deviations — the finding that made individual tutoring the benchmark every other method is measured against.',
    source: 'Benjamin Bloom, Educational Researcher (1984)',
    linkLabel: 'Know more', url: null },
  { headline: 'Math Anxiety Is Learned — and It Can Be Unlearned',
    image: null,
    body: 'Math anxiety eats the working memory a child needs to actually do math, so it depresses performance in children who are perfectly capable. It is not a verdict on ability, and it responds to how a child is taught — which is why a patient tutor and a judgement-free AI teacher matter more than another worksheet.',
    source: 'Ramirez, Gunderson, Levine & Beilock, Journal of Cognition and Development (2013)',
    linkLabel: 'Know more', url: null },
];

/* ── About Us (long-scroll story page; see AboutScreen.js) ────────────────────
   Copy + figures are ours (ailernova.in). `founder`, `timeline` and `investors`
   are null/empty on purpose — those sections stay HIDDEN until real data is put
   here. Never fill them with placeholder claims; they are public-facing. */
CONTENT.about = {
  cta: 'Get Started',
  rating: { score: '4.9', label: 'Avg parent rating' },
  hero: {
    title: 'We Build Strong Math &\nScience Foundations',
    body: 'Ailernova helps every child see math and science as a way of thinking — not steps to memorise. Live 1-on-1 tutoring, an AI teacher that never runs out of patience, and practice built on memory science.',
  },
  // { image, url } → shows the play card. null → section hidden.
  video: null,
  marquee: ['200K+ students', '1-on-1 online sessions', 'Top 1% tutors', 'Math & Science', 'Grades 6–12', 'CBSE · ICSE · IB'],
  stats: [
    { value: '200K+',  color: C.orange, title: 'Students learning with us', body: 'Across grades 6–12, in India and beyond.' },
    { value: '4.9★',   color: C.green,  title: 'Average parent rating',     body: 'From parents who watched their child’s confidence grow.' },
    { value: 'Top 1%', color: C.blue,   title: 'Tutors on the platform',    body: 'Selected for how well they teach, not just what they know.' },
    { value: '100%',   color: '#C026D3', title: 'Satisfaction commitment',  body: 'If a session doesn’t land, we make it right.' },
  ],
  // "Our Impact" — the results wall (see AboutScreen.js). `achievers` EMPTY → the whole
  // section hides itself. `learnUrl` null → the ▶ "See how it works" link is not shown
  // (a play button that plays nothing is worse than none).
  impact: {
    title: 'Ailernova Works.\nThe Results Prove It.',
    body: 'Better grades. More confidence. Foundations that hold. Trusted by 200,000+ students learning math and science with us.',
    cta: 'Get Started',
    learn: 'See How Ailernova Works',
    learnUrl: null,
    // ⚠️ PLACEHOLDER achievers — these are NOT real students, and nothing here is a real
    // result. Replace each entry with a real winner (name · grade · what they actually
    // won), and only with the family's consent, since this is public-facing. `photo`
    // stays null until a real image URL exists — the card then shows a medal stub, so
    // the wall lays out exactly the same before and after the photos arrive.
    achievers: [
      { name: 'Student name', grade: 'G6',  achievement: 'Add the real result',      bg: '#C8F5D8', photo: null },
      { name: 'Student name', grade: 'G7',  achievement: 'Add the real result',      bg: '#FBE0CE', photo: null },
      { name: 'Student name', grade: 'G8',  achievement: 'Add the real result',      bg: '#D2ECFB', photo: null },
      { name: 'Student name', grade: 'G9',  achievement: 'Add the real result',      bg: '#FBEFC6', photo: null },
      { name: 'Student name', grade: 'G10', achievement: 'Add the real result',      bg: '#F9DCF3', photo: null },
      { name: 'Student name', grade: 'G12', achievement: 'Add the real result',      bg: '#C8F5D8', photo: null },
    ],
  },
  // Study accordion under the impact wall (see AboutScreen.js). Empty `items` → hidden.
  // ⚠️ DEMO ONLY — `title`/`body`/`items` below are the Cuemath reference copy (their
  // studies, their 24% figure). See the DEMO_RESEARCH note above.
  // ► BEFORE RELEASE: swap these three lines for the Ailernova versions:
  //     title: 'Built on What Actually\nMakes Learning Stick',
  //     body:  'Decades of learning-science research shape how an Ailernova session is built — here is what it found.',
  //     items: AILERNOVA_RESEARCH,
  research: {
    title: 'Research-Proven Method:\nSharper Thinking, Less Math Anxiety',
    body: 'Stanford, Nielsen, and independent edtech publications studied Cuemath’s methodology — here’s what they found.',
    items: DEMO_RESEARCH,
  },
  // ⚠️ PLACEHOLDER — swap name/role/photo/letter for the real founder before release.
  // `photo` stays null until a real image URL exists (the card just drops the image).
  founder: {
    photo: null,
    name: 'Founder Name',
    role: 'Founder & CEO',
    title: 'The Belief That\nStarted It All',
    letter: [
      'Too many children decide early that they are “bad at math” — or “bad at science”. They almost never are. They were failed by how it was taught: rules to memorise, steps to repeat, and no room to ask why.',
      'Ailernova exists to undo that. Strong foundations in math and science, built the way understanding actually forms — a tutor who matches how your child thinks, an AI teacher that never loses patience with a repeated question, and practice spaced the way memory really works.',
      'The goal was never a better score alone. It is a child who meets an unfamiliar problem and, instead of freezing, gets curious.',
    ],
  },
  pillarsTitle: 'How We Help Every Child\nDeliver Results',
  pillarsIntro: 'Tutors, teaching methods, class formats, and progress tracking — each is designed to reinforce the others, so your child keeps progressing.',
  // ⚠️ TWO of these tiles make CHECKABLE FACTUAL CLAIMS about Ailernova, not just
  // promises: "Top 1% Tutors · vetted subject specialists" and, above all, "Designed by
  // graduates of IIT, Stanford, and Cambridge". Verify both against who actually builds
  // our curriculum, or rewrite them, BEFORE this ships — a parent can hold us to them.
  pillars: [
    { emoji: '🏆',   title: 'Top 1% Tutors',              body: 'Vetted subject specialists with years of experience.',                  bg: '#D2ECFB' },
    { emoji: '📘',   title: 'School Curriculum Aligned',  body: 'Designed by graduates of IIT, Stanford, and Cambridge.',                 bg: '#F9DCF3' },
    { emoji: '🤝',   title: 'Same Tutor in Every Session', body: 'An expert tutor who understands how your child actually learns.',       bg: '#FBE0CE' },
    { emoji: '📊',   title: 'Consistent Progress',        body: 'Regular PTMs and progress tracking to plan next steps.',                 bg: '#D2ECFB' },
    { emoji: '🧑‍🏫', title: '1-on-1 Live Classes',         body: 'Same tutor every session. No groups, no recordings.',                    bg: '#D2ECFB' },
    { emoji: '🧠',   title: 'Logic-First Method',         body: 'Understand the “why” behind every concept, not rote steps.',             bg: '#FBEFC6' },
    { emoji: '🖥️',   title: 'Best Online Platform',       body: 'Hands-on math tools and manipulatives for interactive learning.',        bg: '#FBE0CE' },
    // ⚠️ TRADEMARK — "MathFit" is CUEMATH'S trademark, not ours. This tile is reference
    // copy; shipping it under the Ailernova name is a trademark problem, not just a
    // wording one. Rename it (e.g. "Mindset + Skill, Together") before release.
    { emoji: '🧠',   title: 'MathFit Pedagogy',           body: 'Every class builds math skills and growth mindset.',                     bg: '#C8F5D8' },
  ],
  // Student-story carousel under the pillars grid. Empty `items` → section hides.
  // ⚠️ DEMO — reference copy again (a real Cuemath student). Replace each card with a
  // real Ailernova story, WITH the family's consent, before release. `photo` null → the
  // card shows a stub of exactly the same size, so it lays out the same either way.
  stories: {
    title: 'Helping 200,000+ Students\nSucceed!',
    body: 'Medals at math olympiads. Jumps from grade-level to accelerated tracks. Fear, replaced by curiosity.',
    items: [
      { name: 'ELIN LUNA', photo: null, bg: '#C8F5D8',
        title: 'Thriving in School, State Tests, and Accelerated Math',
        body: 'Grade 8 Cuemath student, combines curiosity and dedication to excel in school, state tests and accelerated math.' },
      // ⚠️ The reference screenshots only ever showed this card half-scrolled, so the
      // copy below is a stand-in, not the reference text. Paste the real story in.
      { name: 'STUDENT NAME', photo: null, bg: '#FBE0CE',
        title: '5th Grade, Competing in the Math Competition',
        body: 'Add the real story for this card — the reference copy was never fully visible.' },
      { name: 'STUDENT NAME', photo: null, bg: '#D2ECFB',
        title: 'Add the third story',
        body: 'Add the real story for this card.' },
    ],
  },
  // Parent video testimonials. Empty `items` → hidden. A card with `url` null does NOT
  // draw a play button — it is a quote card, not a broken video.
  // ⚠️ DEMO — reference copy (real Cuemath parents), and the body line uses Cuemath's
  // MathFit™ trademark. Replace with our own parents' clips before release.
  parentVoices: {
    title: 'Don’t Take Our Word For It -\nListen to Real Parents!',
    body: 'These families chose to make their children MathFit with Cuemath. Here’s what happened next.',
    items: [
      { quote: 'My son can learn at his own speed', name: 'LINSEY', thumb: null, url: null },
      { quote: 'I love the personalised learning',  name: 'MARIA',  thumb: null, url: null },
    ],
  },
  // Dark trust bar that closes the proof run: score · reach · transformations · reviews.
  // ⚠️ DEMO — "80+ Countries", the 11K+ review count and both testimonials are Cuemath's
  // (the FAQ note above already flags 80 countries as FALSE of us). Put OUR verified
  // numbers and OUR parents' reviews here — with their consent — before release.
  trusted: {
    title: 'Trusted by Parents\nLoved by Students',
    score: '4.9/5',
    reviews: '11K+ Reviews',
    stats: [
      { value: '200K+', label: 'Students',  color: '#38BDF8' },
      { value: '80+',   label: 'Countries', color: '#E879F9' },
    ],
    pills: ['Math Hate → Math Love', 'Math Anxiety → Math Confidence', 'Rote Steps → Real Understanding'],
    testimonials: [
      { emoji: '🎯', title: 'Math now feels easy & fun', name: 'Francella', flag: '🇺🇸',
        body: '"Sharad\'s passion and clear explanations made me genuinely enjoy math while improving at school. He repeats concepts patiently until I fully understand. Cuemath\'s quality tutoring and…"' },
      { emoji: '❤️', title: 'Math made enjoyable', name: 'Rini George', flag: '🇶🇦',
        body: '"Ms. Santhoshi is an amazing teacher! She\'s patient, engaging, and has a great way of explaining complex topics. My daughter (5th grade) now loves and understands math much…"' },
    ],
  },
  // Awards / press rail. Empty `items` → hidden. `image` null → stub of the same size,
  // `url` null → no "Read more." link.
  // ⚠️ DEMO — these are CUEMATH'S awards. Listing another company's awards under our own
  // name is straightforwardly false. Replace with awards Ailernova has actually won, or
  // set `items: []` and the whole section disappears until we have one.
  awards: {
    title: 'What Parents See, the\nIndustry Recognizes',
    body: 'Awards, industry recognition, and press mentions recognizing our impact on math learning.',
    items: [
      { image: null, url: null,
        title: 'Math Learning Solution of the Year, EdTechReview Awards 2020',
        body: 'Recognized for our cutting-edge curriculum — built by graduates of IIT, Stanford & Cambridge — and its impact on learners of all levels.' },
      // ⚠️ Half-scrolled in the reference; this copy is a stand-in, not the real text.
      { image: null, url: null,
        title: 'Best Learning Science Education 2022',
        body: 'Recognized for problem-solving and learning science — add the real citation for this award.' },
    ],
  },
  reach: {
    title: 'From One Classroom to\nStudents Everywhere',
    body: 'Families choose Ailernova to help their children understand math and science — not just pass them.',
    image: null,
  },
  // ⚠️ PLACEHOLDER milestones — put the real years/story here (image: photo URL).
  timelineTitle: 'Shaping Confident\nMinds Since Day One',
  timeline: [
    { year: 'Year 1', body: 'Where it began — replace with the real milestone.', image: null },
    { year: 'Year 2', body: 'The first classrooms and the first believers.', image: null },
    { year: 'Year 3', body: 'Tutors, mentors and the platform take shape.', image: null },
    { year: 'Today',  body: '200K+ learners building strong foundations.',      image: null },
  ],
  // ⚠️ PLACEHOLDER — list ONLY real backers/partners. `logo` null → the name shows as
  // text. Leave this array EMPTY if there are none; the section then hides itself.
  investorsTitle: 'Backed By',
  investors: [
    { name: 'Your investor', logo: null }, { name: 'Your investor', logo: null },
    { name: 'Your partner',  logo: null }, { name: 'Your partner',  logo: null },
  ],
  knowMoreTitle: 'Know More About Ailernova',
  knowMore: [
    { label: 'FAQ',       url: 'https://ailernova.in/#faq',      bg: '#FBEFC6' },
    { label: 'Programs',  url: 'https://ailernova.in/#about',    bg: '#D2ECFB' },
    { label: 'Mentors',   url: 'https://ailernova.in/#mentors',  bg: '#F9DCF3' },
    { label: 'Contact',   url: 'https://wa.me/918905604773',     bg: '#C8F5D8' },
  ],
  faqTitle: 'FAQs',
  // ⚠️ DEMO ONLY. `faqs` currently points at DEMO_FAQS — verbatim reference copy from
  // Cuemath, kept ONLY to dress the demo. It states things that are FALSE of Ailernova
  // (founded 2013, backed by Google, 80 countries, 100% online) and uses their MathFit™
  // trademark. The brand names are left as "Cuemath" on purpose: that makes it read as
  // placeholder rather than as a false claim under our own name.
  // ► BEFORE RELEASE: change this one line to `faqs: AILERNOVA_FAQS`.
  faqs: DEMO_FAQS,
  seeMoreUrl: 'https://ailernova.in/#faq',
  // Dark closing on Our Impact: stills · the founder's trial letter · the founder strip ·
  // more stills. `photos`/`photosBottom` are session/event stills — null cells hold their
  // space until the real images land.
  // ⚠️ DEMO — the letter is Cuemath's founder speaking (2013, MathFit™). Rewrite it in
  // OUR founder's voice before release; the credits shown beside it come from
  // `movement.credits`, which are still placeholders.
  trialStrip: {
    photos: [null, null, null],
    title: 'Trial Is How Every\nSuccess Story Above\nStarted',
    body: 'I started Cuemath in 2013 so every child could experience what math feels like when it’s taught right.\n200,000 students later, the proof is on this page — in the research, the reviews, the kids who competed nationally, and the ones who simply stopped dreading class.\nThat’s MathFit™ in action.\n\nStart with a free trial class. See the difference yourself.',
    photosBottom: [null, null, null],
  },
  movement: {
    title: 'Join the Ailernova\nMovement',
    body: 'Every child is somewhere on the journey, and every child has a spark waiting to be lit. We have watched that spark catch — fear turning into joy, confusion into clarity, hesitation into confident thinking.\n\nDon’t let that hidden genius stay hidden. The best time to start was yesterday. The next best time is now.',
    // Founder strip under the letter: photo/video cell + credentials + CTA cell.
    // ⚠️ PLACEHOLDER credentials — replace with the real ones (or delete the lines).
    image: null,      // founder still/thumbnail
    videoUrl: null,   // tap the cell → opens this
    credits: ['Ailernova founder', 'Add a credential', 'Add a credential'],
  },
};

/* ── Our Tutors (long-scroll page; see AboutScreen.js → TutorsStack) ──────────
   Sits under ABOUT AILERNOVA → Our Tutors, beside About Us and Our Impact. Where
   About Us tells the story and Our Impact shows the results, this page answers the
   one question every parent actually asks: WHO will teach my child?

   Same rules as CONTENT.about: every section is data-driven and HIDES itself when
   its data is empty (`meet.items` [] → no tutor rail; `hero.image` null → the brand
   stub holds the hero; `hero.learnUrl` null → no ▶ row). Never dress an empty
   section with an invented tutor, face or figure — this is public-facing. */
CONTENT.tutors = {
  hero: {
    // Deliberately NOT "MathFit™" — that is Cuemath's trademark, not ours.
    title: 'Expert Tutors Who Make\nLearning Click',
    body: 'More than tutors. Coaches who genuinely care how your child thinks.',
    cta: 'Find the Right Tutor',
    image: null,      // full-bleed hero still (a real tutor mid-session). null → brand stub.
    learn: 'Learn How Ailernova Works',
    learnUrl: null,   // null → the ▶ row is not drawn
    // ⚠️ DEMO — "11K+ Reviews" is CUEMATH'S review count, carried over from the
    // reference page. Put our verified count here (or drop `count` and only the
    // score shows) before release.
    rating: { score: '4.9', count: '11K+ Reviews' },
  },
  // Dark globe trust bar — same component as Our Impact, but the reviews here are about
  // the TUTORS, not the product.
  // ⚠️ DEMO — "80+ Countries", the review count and both testimonials below are Cuemath's
  // (their tutors, their parents). Replace with OUR parents' words, with their consent.
  trusted: {
    title: 'Trusted by Parents\nLoved by Students',
    score: '4.9/5',
    reviews: '11K+ Reviews',
    stats: [
      { value: '200K+', label: 'Students',  color: '#38BDF8' },
      { value: '80+',   label: 'Countries', color: '#E879F9' },
    ],
    pills: ['Same Tutor Every Session', 'Matched to How Your Child Learns', 'Free to Switch, Anytime'],
    testimonials: [
      { emoji: '🎯', title: 'Passionate & adaptable', name: 'Praveen', flag: '🇮🇳',
        body: '"Dhivya adapts lessons to each student\'s pace, makes sessions engaging, and has helped my child improve grades and gain interest in math."' },
      { emoji: '❤️', title: 'Kind & patient', name: 'Vikram P.', flag: '🇮🇳',
        body: '"We are grateful to Ma\'am. Her patience and adaptability keep both my children engaged and learning happily."' },
    ],
  },
  // "Less Than 1% Make The Cut" — the hiring funnel, on graph paper. Each stage is a band
  // of the funnel and it narrows as it goes: the last band is who actually teaches.
  // ⚠️ CHECKABLE CLAIM. 100 → 50 → 20 → 5 → 1 is the REFERENCE funnel (Cuemath's), kept
  // only so the shape reads right. Put OUR real stage counts here before release, or set
  // `stages: []` — the funnel then hides and the headline + CTA still stand on their own.
  // `count` is free text: it can be a headcount ("100 tutors") or a share ("Top 5%").
  selection: {
    title: 'Less Than 1% Make The Cut',
    body: 'We choose tutors the way elite universities choose students.',
    // Light → dark as the funnel narrows, so the squeeze is something you SEE.
    stages: [
      { label: 'Tested for Subject Expertise', count: '100 TUTORS', bg: '#FDF0D8' },
      { label: 'Assessed for Pedagogy Skills', count: '50 TUTORS',  bg: '#FBDE9E' },
      // Not "the Cuemath Way" — that is their brand. This is ours.
      { label: 'Trained on the Ailernova Way', count: '20 TUTORS',  bg: '#FBCB5C' },
      { label: 'Evaluated in a Live Class',    count: '5 TUTORS',   bg: '#F7AF14' },
      { label: 'Certified to Teach',           count: '1 TUTOR',    bg: '#DE8506' },
    ],
    // What a certified tutor is certified FOR — hangs off the bottom of the funnel.
    // ⚠️ Only list bands we actually certify against. `items: []` → the card hides.
    certificationsTitle: 'CERTIFICATIONS',
    certifications: [
      { emoji: '🥉', label: 'Early Learners' },
      { emoji: '🥈', label: 'Elementary Students' },
      { emoji: '🥇', label: 'Middle Schoolers' },
      { emoji: '🏅', label: 'High Schoolers' },
    ],
    // The note under the funnel — hiring is the start, not the finish. null → hidden.
    ongoing: {
      title: 'But it doesn’t stop at hiring the best…',
      body: 'Our tutors receive ongoing training and monthly reviews to deliver the best learning experience.',
    },
  },
  // "How our tutors teach" — the horizontal card rail. Each card is a saturated art block
  // (a big glyph on `bg`, until a real illustration URL is put in `image`) over a tinted
  // body. Empty `items` → the whole section hides.
  teaching: {
    // Deliberately NOT "…Make Every Child MathFit™" — that is Cuemath's trademark.
    title: 'How Ailernova Tutors Make\nEvery Child Think for Themselves',
    items: [
      { emoji: '🧑‍🏫', bg: '#EE5FE6', tint: '#FBDCF7', image: null,
        title: 'All The Attention',
        body: 'One student. One teacher. And a full hour of live interaction — so they feel free to ask questions and learn at their own pace, without hesitation.' },
      { emoji: '💡', bg: '#F9B316', tint: '#FCEFCB', image: null,
        title: '100% Engagement',
        body: 'Our tutors let your child do most of the thinking — explore ideas, spot patterns, make mistakes — instead of watching the tutor do it.' },
      { emoji: '🏋️', bg: '#F97A3D', tint: '#FBDDCC', image: null,
        title: 'The Right Challenge',
        body: 'Tutors keep pushing the edge of what your child can do, while making sure they never tip over into feeling overwhelmed.' },
      { emoji: '🔍', bg: '#2FB6F2', tint: '#D3EEFB', image: null,
        title: 'In-Depth Understanding',
        body: 'Every learning gap gets found and closed, rather than rushing through topics with superficial coverage.' },
      { emoji: '📈', bg: '#3ECF6B', tint: '#D6F5E0', image: null,
        title: '360° Excellence',
        body: 'Tutors inspire your child to excel at school and in competitions, while building real-life confidence and a deeper love for problem-solving.' },
    ],
  },
  // What every tutor brings — the pastel grid (same tiles as About Us → Pillars).
  qualities: {
    title: 'What Every Ailernova\nTutor Brings',
    intro: 'The same tutor, every session — one who knows where your child got stuck last week and picks up exactly there.',
    items: [
      { emoji: '🎓', title: 'Subject Specialists',      body: 'Math and science experts who teach their own subject, not everything.', bg: '#D2ECFB' },
      { emoji: '🤝', title: 'Same Tutor Every Session', body: 'No rotating teachers, no starting over each week.',                      bg: '#FBE0CE' },
      { emoji: '🧠', title: 'Teach the “Why”',          body: 'Concepts built from first principles, not steps to copy.',                bg: '#FBEFC6' },
      { emoji: '💬', title: 'Patient With Questions',   body: 'The same doubt, asked five times, gets five calm answers.',               bg: '#C8F5D8' },
      { emoji: '📊', title: 'Progress You Can See',     body: 'Regular PTMs, honest feedback, and a plan for what is next.',             bg: '#F9DCF3' },
      { emoji: '🔄', title: 'Free to Switch',           body: 'If the match is not right, we change the tutor — no questions asked.',    bg: '#D2ECFB' },
    ],
  },
  // Meet the tutors — the rail of real people.
  // ⚠️ EMPTY ON PURPOSE. The section stays HIDDEN until real tutors are listed here, WITH
  // their consent. Shape: { name, subject, grades, experience, credential, photo, bg }.
  // `photo` null → the card draws a portrait stub of the same size, so the rail lays out
  // identically before the pictures land. Never invent a tutor.
  // ⚠️ The reference page heads this "Meet Our Community Of 4000+ Tutors". That count is
  // CUEMATH'S. Put our real tutor count in `title` when we have one — until then the
  // heading stays honest and countless.
  meet: {
    title: 'Meet Our Community\nOf Tutors',
    body: 'The people who will actually sit with your child, week after week.',
    items: [],
  },
  // How the matching works — the numbered steps to a tutor.
  match: {
    title: 'How We Find Your\nChild’s Tutor',
    body: 'A free demo class first — you meet the tutor, watch them teach your child, and only then decide.',
    steps: [
      { n: '1', title: 'Tell us about your child', body: 'Grade, board, subject, and where they are struggling right now.' },
      { n: '2', title: 'We match a specialist',    body: 'A tutor whose teaching style fits how your child actually learns.' },
      { n: '3', title: 'Watch a free demo class',  body: 'Sit in. See how your child responds before you commit to anything.' },
      { n: '4', title: 'Keep them — or switch',    body: 'Happy? They stay for every session. Not quite right? We rematch you.' },
    ],
  },
  faqTitle: 'Questions About Our Tutors',
  faqs: [
    { q: 'Will my child get the same tutor every session?',
      a: 'Yes. The tutor matched at the demo stays with your child for every session — they remember what was hard last week and pick up exactly there.' },
    { q: 'What if my child does not get along with the tutor?',
      a: 'Tell us and we rematch, free of charge. The match matters more than the schedule — a child who does not feel safe asking questions will not learn.' },
    { q: 'How do you select your tutors?',
      a: 'Every applicant clears a subject-mastery test, a live teaching demo with our academic team, and structured onboarding before they ever meet a student. We screen for how well they teach, not just what they know.' },
    { q: 'Are the classes 1-on-1 or in a group?',
      a: '1-on-1 and live. No recordings, no batches — the whole session is your child’s.' },
    { q: 'Which subjects and grades do your tutors cover?',
      a: 'Math and science across grades 6–12, aligned to CBSE, ICSE and IB.' },
  ],
};

export const ARENA_BASE_RATING = 1000;

export const DOWF = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONF = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const TABS = [
  { id: 'home', label: 'Home', Icon: Home, color: C.orange, title: 'Home' },
  { id: 'progress', label: 'Progress', Icon: BarChart3, color: C.green, title: 'Progress', sub: true },
  { id: 'sessions', label: 'Sessions', Icon: Video, color: C.blue, title: 'Sessions', sub: true },
  { id: 'chat', label: 'Chat', Icon: MessageCircle, color: C.red, title: 'Chat', sub: true },
  { id: 'classes', label: 'Classes', Icon: BookOpen, color: C.navy, title: 'Classes', sub: true },
];

/* ---------- shared text atoms ---------- */
export function T({ w = 'reg', s = 14, c = C.ink, style, children, ...rest }) {
  return <Text style={[{ fontFamily: F[w], fontSize: s, color: c }, style]} {...rest}>{children}</Text>;
}
// Editorial section header: an uppercase tracked label followed by a hairline rule.
export function Label({ children }) {
  return (
    <View style={st.labelRow}>
      <T w="xbold" s={11.5} c={C.muted} style={st.label} accessibilityRole="header">{children}</T>
      <View style={st.labelRule} />
    </View>
  );
}

// Subtle top-lit sheen for light cards — a layered, premium glass surface. Sits behind
// card content (parent card needs overflow:hidden). Reused across widgets.
// NOTE: we measure the card in pixels (onLayout) and paint with gradientUnits=
// "userSpaceOnUse". Percentage rects underfill on Android, and viewBox + non-uniform
// stretch skews the gradient vector diagonally — both leave a visible seam. Exact
// pixels + a top→bottom vector is the only artifact-free way in react-native-svg.
export function CardGradient({ from = '#FFFFFF', to = '#F1F4FB' }) {
  const [d, setD] = React.useState({ w: 0, h: 0 });
  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      onLayout={(e) => setD({ w: Math.round(e.nativeEvent.layout.width), h: Math.round(e.nativeEvent.layout.height) })}
    >
      {d.w > 0 && (
        <Svg width={d.w} height={d.h}>
          <Defs>
            <LG id="cardG" x1="0" y1="0" x2="0" y2={d.h} gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor={from} />
              <Stop offset="1" stopColor={to} />
            </LG>
          </Defs>
          <Rect x="0" y="0" width={d.w} height={d.h} fill="url(#cardG)" />
        </Svg>
      )}
    </View>
  );
}
export function Wordmark({ size = 18 }) {
  return <View style={{ flexDirection: 'row' }}>{WORDMARK.map(([c, col], i) => <T key={i} w="xbold" s={size} c={col}>{c}</T>)}</View>;
}

/* ---------- styles (exact from the teammate build + real-data states) ---------- */
// Premium soft elevation — larger, softer, lifted. Used by every card.
export const card = { shadowColor: '#0B1020', shadowOpacity: 0.08, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 4 };
export const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.canvas, paddingTop: Platform.OS === 'android' ? 28 : 0 },
  screen: { flex: 1, backgroundColor: C.canvas },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  header: { backgroundColor: C.canvas, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.orange, borderWidth: 2, borderColor: '#111', alignItems: 'center', justifyContent: 'center' },
  gymPill: { backgroundColor: C.gold, borderRadius: 24, paddingLeft: 15, paddingRight: 7, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 8 },
  gymIcon: { backgroundColor: '#fff', borderRadius: 13, width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, paddingHorizontal: 18 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 26, marginBottom: 14 },
  label: { letterSpacing: 1.4, textTransform: 'uppercase' },
  labelRule: { flex: 1, height: 1, backgroundColor: C.hair },

  updateCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.peach, borderRadius: 16, padding: 14, width: 270, marginRight: 10 },
  updateIcon: { width: 42, height: 42, borderRadius: 11, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' },
  piBadge: { position: 'absolute', right: -6, bottom: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  streakCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFF6E2', borderRadius: 16, padding: 14, width: 160 },
  streakIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center' },

  trialCard: { backgroundColor: '#F7C948', borderRadius: 20, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 20, ...card },
  trialArt: { marginTop: 16, backgroundColor: '#F4CC55', borderRadius: 16, height: 200, overflow: 'hidden', justifyContent: 'flex-end' },
  trialImg: { borderRadius: 16 },
  trialBtnWrap: { position: 'absolute', bottom: 16, left: 0, right: 0, alignItems: 'center' },
  trialBtn: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 26, paddingVertical: 13, shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  eventCard: { backgroundColor: '#1C1E26', borderRadius: 20, padding: 22, ...card },
  eventBtn: { backgroundColor: '#fff', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  trustStar: { width: 19, height: 19, backgroundColor: '#00B67A', borderRadius: 3, alignItems: 'center', justifyContent: 'center' },

  progHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 18, paddingBottom: 8, paddingHorizontal: 2 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, paddingBottom: 22, borderBottomWidth: 1, borderBottomColor: C.border, marginBottom: 22 },
  dowChip: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  dateCircle: { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  noActivity: { borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 22, flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#FAFAFB' },
  statCard: { borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 16, backgroundColor: '#fff', ...card },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { alignItems: 'center', flex: 1 },
  focusCard: { borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 16, backgroundColor: '#fff', ...card },

  emptyScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34, gap: 24 },
  chatBubble: { width: 70, height: 58, backgroundColor: '#BFE6FA', borderWidth: 2.5, borderColor: '#16202A', borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  chatTailOuter: { position: 'absolute', right: 14, bottom: -13, width: 0, height: 0, borderLeftWidth: 12, borderLeftColor: 'transparent', borderTopWidth: 14, borderTopColor: '#16202A' },
  chatTailInner: { position: 'absolute', right: 17, bottom: -8, width: 0, height: 0, borderLeftWidth: 8, borderLeftColor: 'transparent', borderTopWidth: 9, borderTopColor: '#BFE6FA' },
  emptyText: { textAlign: 'center', lineHeight: 28, maxWidth: 290 },
  exploreBtn: { backgroundColor: C.black, borderRadius: 10, paddingVertical: 16, alignItems: 'center', alignSelf: 'stretch' },
  checkBadge: { position: 'absolute', right: 18, bottom: 14, width: 30, height: 30, borderRadius: 15, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...card },

  tutorStrip: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.blueSoft, borderRadius: 18, padding: 14, marginTop: 12 },
  tutorAv: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center' },
  ratingPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  upcoming: { borderWidth: 1, borderColor: C.border, borderRadius: 20, padding: 16, backgroundColor: '#fff', ...card },
  dateBadge: { width: 60, borderRadius: 14, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  joinBtn: { backgroundColor: C.green, borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  ghost: { flex: 1, backgroundColor: '#F3F3F4', borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  emptyCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: C.hair, borderRadius: 18, padding: 16, backgroundColor: '#fff', ...card },
  bookCta: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 14, ...card },
  bookIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center' },
  pastRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 14 },
  pastCheck: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.greenSoft, alignItems: 'center', justifyContent: 'center' },
  notesTag: { backgroundColor: C.blueSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },

  // Docked navigation bar — full-width, anchored to the bottom edge (no side/bottom
  // gaps). Rounded top corners + upward shadow lift it off the content; the white fills
  // all the way down (paddingBottom = safe-area inset in BottomNav) so it covers the
  // system-nav strip completely.
  nav: { backgroundColor: '#FFFFFF', paddingTop: 10, paddingHorizontal: 10, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderColor: 'rgba(20,20,40,0.06)', shadowColor: '#0B1020', shadowOpacity: 0.10, shadowRadius: 18, shadowOffset: { width: 0, height: -4 }, elevation: 18 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '88%' },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 18, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F2F2F3', alignItems: 'center', justifyContent: 'center' },
  sheetBody: { paddingHorizontal: 18, paddingTop: 16 },
  chip: { borderWidth: 1.5, borderColor: C.border, borderRadius: 22, paddingHorizontal: 14, paddingVertical: 9 },
  chipOn: { backgroundColor: C.ink, borderColor: C.ink },
  dayCell: { width: 52, height: 62, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center', gap: 3, marginRight: 8 },
  dayCellOn: { backgroundColor: C.blue, borderColor: C.blue },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 10 },
  slot: { width: '31%', borderWidth: 1.5, borderColor: C.border, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginBottom: 10 },
  slotOn: { backgroundColor: C.blue, borderColor: C.blue },
  slotOff: { backgroundColor: '#F6F6F7' },
  sheetFoot: { padding: 16, borderTopWidth: 1, borderTopColor: C.border },
  confirm: { backgroundColor: C.black, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  confirmOff: { backgroundColor: '#E7E7E8' },
  summary: { backgroundColor: '#F7F7F8', borderRadius: 14, padding: 14, marginBottom: 14 },
  noteBlock: { borderRadius: 14, padding: 14, marginBottom: 12 },

  call: { flex: 1, backgroundColor: '#0E0E12' },
  callTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  callStage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  callAv: { width: 110, height: 110, borderRadius: 55, backgroundColor: C.blue, alignItems: 'center', justifyContent: 'center' },
  selfTile: { position: 'absolute', right: 18, bottom: 12, width: 84, height: 116, borderRadius: 16, backgroundColor: '#1E1E26', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  callControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, paddingBottom: 30 },
  callBtn: { width: 58, height: 58, borderRadius: 29, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  leave: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#F0343C', alignItems: 'center', justifyContent: 'center' },
  toast: { position: 'absolute', bottom: 96, left: 20, right: 20, backgroundColor: '#111', paddingVertical: 13, paddingHorizontal: 16, borderRadius: 14 },

  // real-data states
  errIcon: { width: 78, height: 78, borderRadius: 24, backgroundColor: C.headerBg, alignItems: 'center', justifyContent: 'center' },
  retryBtn: { marginTop: 6, backgroundColor: C.blue, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28, ...card },
  logoutBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, backgroundColor: '#fff' },
  linkArt: { alignItems: 'center', marginTop: 6, marginBottom: 10 },
  input: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: C.border, borderRadius: 14, color: C.ink, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, fontFamily: F.med },
  primaryBtn: { backgroundColor: C.blue, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 16, ...card },
  primaryBtnOff: { opacity: 0.45 },
  skelBlock: { backgroundColor: '#ECECEE' },
});
