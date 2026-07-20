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
          { label: 'Parent Reviews', action: 'reviews', url: 'https://ailernova.in/#video-section-review' },
          { label: 'Pricing', action: 'pricing', url: 'https://ailernova.in/pricing/' },
          { label: 'FAQs', action: 'faqs', url: 'https://ailernova.in/#faq' },
          { label: 'Contact Us', action: 'contact', url: 'https://wa.me/918905604773' },
          { label: 'Refer a Friend', action: 'referral' },
          { label: 'Refund Policy', action: 'refund' },
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
/* ── FAQ copy (About Us → FAQs). CONTENT.about.faqs points here. All true of us. ── */
const AILERNOVA_FAQS = [
  { q: 'What is the Ailernova story?',
    a: 'We started with one belief: almost no child is actually “bad at math” or “bad at science” — they were failed by how it was taught. Rules to memorise, steps to repeat, no room to ask why. Ailernova was built to undo that. Today 200,000+ learners across Grades 1–12 build strong math and science foundations with us, through live 1-on-1 tutoring, an AI teacher that never runs out of patience, and practice built on memory science.' },
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

/* ── Research accordion rows (About Us → "Research-Proven Method").
   Real, citable learning-science findings that our teaching is actually built on. ── */
// Base for ailernova.in's own hosted photos. Only img_10..img_16 exist; 15 and 16 are
// marketing collages with baked-in copy and crop badly, so 10–14 are the usable set.
const SITE_IMG = 'https://ailernova.in/wp-content/themes/ailernova-theme/image';

const AILERNOVA_RESEARCH = [
  { headline: 'Recalling Beats Re-reading',
    image: `${SITE_IMG}/img_11.jpg`,
    body: 'Students who were tested on material remembered far more of it a week later than students who re-read it for the same amount of time — even though re-reading felt more productive at the time. This is why an Ailernova session pulls answers out of your child rather than talking at them, and why practice is built on recall.',
    source: 'Roediger & Karpicke, Psychological Science (2006)',
    linkLabel: 'Know more', url: null },
  { headline: 'Spacing Makes Learning Last',
    image: `${SITE_IMG}/img_13.jpg`,
    body: 'The same study time spread across days produces significantly better long-term retention than the same hours crammed together. Our practice deliberately brings a topic back after a gap, instead of finishing it once and moving on.',
    source: 'Cepeda et al., Psychological Bulletin (2006)',
    linkLabel: 'Know more', url: null },
  { headline: 'One-on-One Attention Changes Outcomes',
    image: `${SITE_IMG}/img_14.jpg`,
    body: 'Bloom found that students taught one-on-one with mastery-based feedback outperformed conventionally taught classmates by around two standard deviations — the finding that made individual tutoring the benchmark every other method is measured against.',
    source: 'Benjamin Bloom, Educational Researcher (1984)',
    linkLabel: 'Know more', url: null },
  { headline: 'Math Anxiety Is Learned — and It Can Be Unlearned',
    image: `${SITE_IMG}/img_12.jpg`,
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
  marquee: ['200K+ students', '1-on-1 online sessions', 'Top 1% tutors', 'Math & Science', 'Grades 1–12', 'CBSE · ICSE · IB · IGCSE'],
  stats: [
    { value: '200K+',  color: C.orange, title: 'Students learning with us', body: 'Across grades 1–12, in India and beyond.' },
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
    // ##########################################################################
    // # TODO(saurabh): PLACEHOLDER WALL — these are not real students.         #
    // #                                                                        #
    // # Deliberately NO invented child names and NO invented ranks. A fake     #
    // # "AARIT TRIPATHY, G2 — IMO Rank 1" is a fabricated award claim about a  #
    // # named minor, which is a worse thing to ship than a fake founding year: #
    // # it is unverifiable, it is about a child, and publishing a real child's #
    // # photo or result needs the parent's consent on file.                    #
    // #                                                                        #
    // # So each card below carries a generic role label and the photo is       #
    // # ailernova.in's OWN marketing image (already public on the site). The   #
    // # layout, stagger and reveal can be reviewed from this; swap in real     #
    // # students + results ONLY with signed parent consent, or set             #
    // # `achievers: []` to hide the wall again.                                #
    // ##########################################################################
    achievers: [
      { name: 'Olympiad Winner', grade: 'Grade 5', achievement: 'Placeholder — real result pending consent',
        bg: '#C8F5D8', photo: 'https://ailernova.in/wp-content/themes/ailernova-theme/image/img_10.jpg' },
      { name: 'Ailernova Student', grade: 'Grade 9', achievement: 'Placeholder — real result pending consent',
        bg: '#F9DCF3', photo: 'https://ailernova.in/wp-content/themes/ailernova-theme/image/img_13.jpg' },
      { name: 'Ailernova Student', grade: 'Grade 11', achievement: 'Placeholder — real result pending consent',
        bg: '#D2ECFB', photo: 'https://ailernova.in/wp-content/themes/ailernova-theme/image/img_14.jpg' },
      { name: 'Ailernova Family', grade: '', achievement: 'Placeholder — real result pending consent',
        bg: '#FBEFC6', photo: 'https://ailernova.in/wp-content/themes/ailernova-theme/image/img_12.jpg' },
    ],
  },
  // Study accordion under the impact wall (see AboutScreen.js). Empty `items` → hidden.
  // Real, citable learning-science findings our teaching is built on (AILERNOVA_RESEARCH).
  research: {
    title: 'Built on What Actually\nMakes Learning Stick',
    body: 'Decades of learning-science research shape how an Ailernova session is built — here is what it found.',
    items: AILERNOVA_RESEARCH,
  },
  // No public founder profile on ailernova.in yet, so the founder letter stays HIDDEN
  // (founder: null). Add a real name/role/letter here to bring it back.
  founder: null,
  pillarsTitle: 'How We Help Every Child\nDeliver Results',
  pillarsIntro: 'Tutors, teaching methods, class formats, and progress tracking — each is designed to reinforce the others, so your child keeps progressing.',
  // ⚠️ "Top 1% Tutors" is a checkable factual claim — make sure it matches reality
  // before shipping, since a parent can hold us to it.
  pillars: [
    { emoji: '🏆',   title: 'Top 1% Tutors',              body: 'Vetted subject specialists with years of experience.',                  bg: '#D2ECFB' },
    { emoji: '📘',   title: 'School Curriculum Aligned',  body: 'Aligned to CBSE, ICSE, IB and IGCSE — reinforcing what school tests.',    bg: '#F9DCF3' },
    { emoji: '🤝',   title: 'Same Tutor in Every Session', body: 'An expert tutor who understands how your child actually learns.',       bg: '#FBE0CE' },
    { emoji: '📊',   title: 'Consistent Progress',        body: 'Regular PTMs and progress tracking to plan next steps.',                 bg: '#D2ECFB' },
    { emoji: '🧑‍🏫', title: '1-on-1 Live Classes',         body: 'Same tutor every session. No groups, no recordings.',                    bg: '#D2ECFB' },
    { emoji: '🧠',   title: 'Logic-First Method',         body: 'Understand the “why” behind every concept, not rote steps.',             bg: '#FBEFC6' },
    { emoji: '🖥️',   title: 'Best Online Platform',       body: 'Hands-on math tools and manipulatives for interactive learning.',        bg: '#FBE0CE' },
    { emoji: '🧠',   title: 'Skill + Mindset Together',   body: 'Every class builds real skills and a growth mindset.',                   bg: '#C8F5D8' },
  ],
  // Student-story carousel under the pillars grid. Empty `items` → section hides.
  // ⚠️ DEMO PLACEHOLDERS — the cards below are OBVIOUS placeholders (name "STUDENT NAME",
  // photo null → portrait stub, placeholder text). Layout only, NOT real students.
  // ► BEFORE RELEASE: replace with real student stories (WITH the family's consent) or set
  // items: [] to hide. Never present a placeholder as a real child. And never title this
  // "MathFit™" — that is Cuemath's trademark, not ours.
  // Ailernova's own "Join 100,000+ Happy Ailernova Learners" cards, lifted from the home
  // page carousel (img_10…img_14) — our own published assets, not a stock library and not
  // a competitor's. Each `title` is the caption Ailernova baked into its own picture, and
  // each `bg` is sampled off that picture's real caption band, so the rail carries the
  // site's colours rather than invented ones.
  //
  // The pictures are bundled under assets/stories/ with the baked caption band cropped
  // away — the card re-sets that caption as `title` in the app's own type. Bundled, not
  // hot-linked: the site renaming a file must not empty this rail.
  //
  // ⚠️ READ BEFORE EDITING A `body`. Each body describes what Ailernova PROVIDES on that
  // card's theme, in Ailernova's own voice, and every claim traces to ailernova.in (the
  // olympiad track, adaptive worksheets, 1:1 sessions, 55-minute classes, the K-8 / high
  // school cadence, progress tracking). NOT ONE of them says what the child in the picture
  // did, felt, or scored — that would be a testimonial invented for a minor who never gave
  // one. Keep it that way: describe the programme, never the person.
  //
  // `name` stays empty because the site names none of these children, so no chip is drawn.
  // ► For a genuine story — the child's own name, words and results — get the family's
  //   written consent first (these are minors).
  stories: {
    title: 'Real Student Stories',
    // No subtitle — the cards carry the section. Put a line here and it draws itself back in.
    body: '',
    items: [
      { name: '', bg: '#FAE8C0',
        photo: require('../../../../assets/stories/olympiad-winner.jpg'),
        title: 'Grade 5 Math Olympiad Winner and Proud Ailernova Student',
        body: 'Olympiad support runs through every Ailernova plan rather than sitting beside it as an extra: foundation work first, then a challenge track for learners ready to push past their grade. Tutors set the harder problems, build speed and accuracy through guided drills, and keep the school syllabus moving at the same time.' },
      { name: '', bg: '#EBDEFC',
        photo: require('../../../../assets/stories/found-confidence.jpg'),
        title: 'Grade 7 Student Overcame Math Struggles and Found Confidence',
        body: 'Confidence is the change parents write about most. Sessions are 1:1, so a child can be wrong out loud without an audience, and tutors are trained to slow down and rebuild a shaky concept patiently instead of moving on with the class. The aim is a child who stops dreading the subject and starts asking questions in it.' },
      { name: '', bg: '#D8F7E8',
        photo: require('../../../../assets/stories/strong-concepts.jpg'),
        title: 'How Ailernova Helped Build Strong Concepts and Better Scores',
        body: 'Concepts first, marks after. Every session is built on your child’s own strengths and weak areas rather than a class average, with worksheets that adapt as they progress and targeted practice aimed at what school is actually testing that week — so the scores move because the understanding did.' },
      { name: '', bg: '#EBDEFC',
        photo: require('../../../../assets/stories/advanced-problems.jpg'),
        title: 'From Struggling with Basics to Solving Advanced Problems',
        body: 'The same plan that rebuilds the basics is the one that stretches a child past them. Tutors are trained to work with varying learning needs and styles: patient concept rebuilding where the ground is shaky, then harder problems and a challenge track once it is solid. Nobody is moved on before they are ready.' },
      { name: '', bg: '#FFEAC1',
        photo: require('../../../../assets/stories/concept-clarity.jpg'),
        title: 'How Regular Practice and Concept Clarity Improved My Scores',
        body: 'Regular practice only works when it is the right practice. Classes run twice a week for Classes K to 8 and three times for high school, 55 minutes each and extendable to an hour, with guided drills for speed and accuracy — and progress tracking that shows strengths and weak areas closing month by month.' },
    ],
  },
  // Parent video testimonials. Empty `items` → hidden. A card with `url` null does NOT
  // draw a play button — it is a quote card, not a broken video.
  // Real parent quotes from ailernova.in (url null → shown as a quote card, no video).
  parentVoices: {
    title: 'Real Parents. Real Stories.\nReal Results.',
    body: 'Families across India on what changed for their child with Ailernova.',
    items: [
      { quote: 'Excellent support for homework and tests', name: 'Ayesha Khan · Mumbai', thumb: null, url: null },
      { quote: 'A clear jump in grades and confidence',     name: 'Hari',                 thumb: null, url: null },
      { quote: 'She now solves word problems without fear', name: 'Deepti',               thumb: null, url: null },
    ],
  },
  // Dark trust bar that closes the proof run: score · reach · transformations · reviews.
  // Real figures and reviews from ailernova.in.
  trusted: {
    title: 'Trusted by Parents\nLoved by Students',
    score: '4.9/5',
    reviews: '4.9★ on Trustpilot',
    stats: [
      { value: '200K+', label: 'Students',     color: '#38BDF8' },
      { value: '100%',  label: 'Satisfaction', color: '#E879F9' },
    ],
    pills: ['Math Hate → Math Love', 'Math Anxiety → Math Confidence', 'Rote Steps → Real Understanding'],
    // `photo` is the reviewer's picture in the round avatar. These are the SAME parent
    // photos ailernova.in already publishes beside these same quotes in its home-page
    // review carousel — our own assets, paired with the quote they were published with.
    // Bundled under assets/reviews/ rather than hot-linked: the site renaming a file
    // must not blank the avatars. photo omitted/null → the initials chip is drawn
    // instead (see Trusted in AboutScreen.js), so a missing picture never breaks a card.
    testimonials: [
      { emoji: '🎯', title: 'From confusion to clarity', name: 'Priyanka Rao · Bengaluru', flag: '🇮🇳',
        photo: require('../../../../assets/reviews/priyanka-rao.png'),
        body: '"In 8 weeks, my son moved from confusion to clarity in fractions and algebra. His school scores improved from average to the top bracket."' },
      { emoji: '❤️', title: 'Looks forward to class now', name: 'Neha Sharma · Delhi', flag: '🇮🇳',
        photo: require('../../../../assets/reviews/neha-sharma.png'),
        body: '"My daughter now looks forward to both math and science classes. The explanations are clear and her confidence is clearly higher."' },
    ],
  },
  // Awards / press rail. Empty `items` → hidden. `image` null → stub of the same size,
  // `url` null → no "Read more." link.
  // ##########################################################################
  // # TODO(saurabh): PLACEHOLDER AWARDS — Ailernova has not won these.        #
  // # Same rule as the investors block: an award is a THIRD PARTY's statement #
  // # about us, so naming a real body ("EdTechReview Awards 2020") that never #
  // # gave us anything is a false claim about that body too. The entries      #
  // # below are generic on purpose so they read as placeholder, not as a lie  #
  // # about a real awarding organisation. Replace with real, verifiable       #
  // # awards, or set `items: []` to hide the rail again.                      #
  // ##########################################################################
  awards: {
    title: 'What Parents See, the\nIndustry Recognizes',
    body: 'Recognition for our impact on how children learn math and science.',
    items: [
      { title: 'Placeholder Award 2025', body: 'Sample recognition entry — replace with a real, verifiable award.', image: `${SITE_IMG}/img_10.jpg`, url: null },
      { title: 'Example Recognition', body: 'Sample recognition entry — replace with a real, verifiable award.', image: `${SITE_IMG}/img_12.jpg`, url: null },
      { title: 'Sample Industry Mention', body: 'Sample recognition entry — replace with a real, verifiable award.', image: `${SITE_IMG}/img_11.jpg`, url: null },
    ],
  },
  reach: {
    title: 'From One Classroom to\nStudents Everywhere',
    body: 'Families choose Ailernova to help their children understand math and science — not just pass them.',
    image: null,
  },
  // Milestones — dark coverflow carousel, sits directly under the world map.
  //
  // ############################################################################
  // # TODO(saurabh): THE YEARS AND MILESTONES BELOW ARE PLACEHOLDERS.          #
  // # They were invented to demo the carousel animation — ailernova.in has no  #
  // # published company history to source them from. This renders on the       #
  // # PUBLIC About Us page, where a wrong founding date is a false claim about #
  // # the company. Replace every `year` and `body` with the real story before  #
  // # this ships, or set `timeline: []` to hide the section again.             #
  // ############################################################################
  //
  // Images are hotlinked from ailernova.in, same as the tutor photos above. Each
  // source file has a caption bar baked into the bottom of the image; the card
  // renders with resizeMode="cover" at an aspect ratio that crops it away. If you
  // swap in portrait images, check that crop still holds.
  timelineTitle: 'Shaping Confident\nMinds Since Day One',
  timeline: [
    { year: '2021', caption: 'Where it started',
      body: 'Ailernova begins with a handful of students and one idea — teach the why, not the steps.',
      image: 'https://ailernova.in/wp-content/themes/ailernova-theme/image/img_13.jpg' },
    { year: '2023', caption: 'Live 1-on-1 sessions',
      body: 'Online 1-on-1 tutoring opens up, matching each child with a tutor who teaches at their pace.',
      image: 'https://ailernova.in/wp-content/themes/ailernova-theme/image/img_14.jpg' },
    { year: '2024', caption: 'Results that show up',
      body: 'Students start bringing home olympiad medals and report cards their parents did not expect.',
      image: 'https://ailernova.in/wp-content/themes/ailernova-theme/image/img_10.jpg' },
    { year: 'Today', caption: '200K+ learners',
      body: 'Math and science for grades 1–12, across India and beyond — with an AI teacher that never runs out of patience.',
      image: 'https://ailernova.in/wp-content/themes/ailernova-theme/image/img_12.jpg' },
  ],
  // ############################################################################
  // # TODO(saurabh): THESE INVESTORS ARE INVENTED PLACEHOLDERS. Nobody in this  #
  // # list has funded Ailernova.                                               #
  // #                                                                          #
  // # Read this before shipping: a fake year on the timeline is sloppy, but a   #
  // # fake BACKER is a different class of problem — "Backed By <firm>" is a     #
  // # statement about a real third party's business, and naming a real fund     #
  // # that never invested is a false claim both to parents and about that fund. #
  // # That is why the names below are deliberately generic and obviously not    #
  // # real VCs: if this slips to production it reads as placeholder, not as a   #
  // # lie about Sequoia. DO NOT swap them for real firms' names or logos to     #
  // # "make the demo look better" — only list a fund that actually invested,    #
  // # with their sign-off. Otherwise set `investors: []` and the section hides.  #
  // ############################################################################
  investorsTitle: 'Backed By',
  investors: [
    { name: 'Placeholder Ventures', logo: null },
    { name: 'Example Capital', logo: null },
    { name: 'Sample Growth Fund', logo: null },
    { name: 'Demo Partners', logo: null },
  ],
  // Know More — the same {key,title,body,bg,tint} card shape the Contact page's
  // "Helpful Links" uses, so the two read as one system. `action` routes to the
  // in-app page where one exists (no reason to throw a parent out to the website
  // for a page we already render); `url` is the fallback when it doesn't.
  knowMoreTitle: 'Know More About Ailernova',
  knowMoreBody: 'Everything else a parent usually asks before starting — in one place.',
  knowMore: [
    { key: 'faqs', action: 'faqs', title: 'FAQs', body: 'Answers to what parents ask us most before starting.',
      bg: '#FDF1D6', tint: '#F5B301', url: 'https://ailernova.in/#faq' },
    { key: 'pricing', action: 'pricing', title: 'Pricing', body: 'Plans, what each includes, and what a session costs.',
      bg: '#FDE4D3', tint: '#F0733F', url: 'https://ailernova.in/pricing/' },
    { key: 'tutors', action: 'tutors', title: 'Our Tutors', body: 'Who teaches your child, and how they are picked.',
      bg: '#D6F2E0', tint: '#12924B', url: 'https://ailernova.in/#mentors' },
    { key: 'reviews', action: 'reviews', title: 'Parent Reviews', body: 'What families already with us say about it.',
      bg: '#FBDDF2', tint: '#C21C93', url: 'https://ailernova.in/#video-section-review' },
    { key: 'refund', action: 'refund', title: 'Refund Policy', body: 'How refunds and cancellations actually work.',
      bg: '#DBF0FA', tint: '#1848F0', url: null },
    { key: 'contact', action: 'contact', title: 'Contact Us', body: 'Talk to a human on WhatsApp or over email.',
      bg: '#EDE9FE', tint: '#7C3AED', url: 'https://wa.me/918905604773' },
  ],
  faqTitle: 'FAQs',
  faqs: AILERNOVA_FAQS,
  seeMoreUrl: 'https://ailernova.in/#faq',
  // Dark closing on Our Impact: stills · the founder's trial letter · the founder strip ·
  // more stills. `photos`/`photosBottom` are session/event stills — null cells hold their
  // space until the real images land.
  // Stills are ailernova.in's own published photos. NOTE: the site only hosts five
  // usable learning photos (img_10..img_14 — img_15/16 are text-heavy collages that
  // crop badly), so the same faces recur across the wall, the research rows, the
  // awards rail and these bands. Shoot or licence more images and spread them out.
  trialStrip: {
    photos: [
      `${SITE_IMG}/img_13.jpg`,
      `${SITE_IMG}/img_14.jpg`,
      `${SITE_IMG}/img_11.jpg`,
    ],
    title: 'Trial Is How Every\nSuccess Story\nStarts',
    body: 'Every Ailernova journey begins with a free trial class — you meet the tutor, watch them teach your child, and only then decide.\n\nNo pressure and no commitment. Just see the difference for yourself.',
    photosBottom: [
      `${SITE_IMG}/img_12.jpg`,
      `${SITE_IMG}/img_10.jpg`,
      'https://ailernova.in/wp-content/themes/ailernova-theme/images/teachers/danika-shringi.jpg',
    ],
  },
  movement: {
    title: 'Join the Ailernova\nMovement',
    body: 'Every child is somewhere on the journey, and every child has a spark waiting to be lit. We have watched that spark catch — fear turning into joy, confusion into clarity, hesitation into confident thinking.\n\nDon’t let that hidden genius stay hidden. The best time to start was yesterday. The next best time is now.',
    // Founder strip under the letter: photo/video cell + credentials + CTA cell.
    // ⚠️ PLACEHOLDER credentials — replace with the real ones (or delete the lines).
    image: null,      // founder still/thumbnail
    videoUrl: null,   // tap the cell → opens this
    credits: ['Ailernova', 'Math & Science · Grades 1–12', '4.9★ · 200K+ learners'],
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
    rating: { score: '4.9', count: 'Avg parent rating' },
  },
  // Dark trust bar — the reviews here are about the TUTORS. Real figures/reviews from
  // ailernova.in.
  trusted: {
    title: 'Trusted by Parents\nLoved by Students',
    score: '4.9/5',
    reviews: '4.9★ on Trustpilot',
    stats: [
      { value: '200K+', label: 'Students',     color: '#38BDF8' },
      { value: '100%',  label: 'Satisfaction', color: '#E879F9' },
    ],
    pills: ['Same Tutor Every Session', 'Matched to How Your Child Learns', 'Free to Switch, Anytime'],
    testimonials: [
      { emoji: '🎯', title: 'Structured & consistent', name: 'Deepti', flag: '🇮🇳',
        photo: require('../../../../assets/reviews/deepti.jpg'),
        body: '"The class structure is strong and updates are regular. My child now solves word problems independently, without fear."' },
      // No published photo beside Ayesha's quote on the site → no `photo`, so this card
      // falls back to the "AK" initials chip. Do not fill it with someone else's face.
      { emoji: '❤️', title: 'Quick, easy support', name: 'Ayesha Khan · Mumbai', flag: '🇮🇳',
        body: '"Excellent support for homework and tests. Scheduling is easy and communication with the tutor is quick."' },
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
    // The real tutor promise, from ailernova.in.
    body: 'Every Ailernova tutor guides, challenges, and supports your child — helping them build the confidence, skills, and mindset needed for lifelong success.',
    // Real Ailernova tutors, sourced from ailernova.in (names, subjects, experience,
    // qualifications and photos). `photo` is a hosted URL — the card loads it remotely;
    // set it to null to fall back to a portrait stub. Never invent a tutor.
    items: [
      { name: 'Danika Shringi', subject: 'English', grades: 'Spoken & Written',
        experience: 'B.A. (Hons.) English Literature. Teaches English language & literature, spoken English, grammar, creative writing and public speaking — an interactive, student-friendly approach that builds clarity, confidence and real-life communication.',
        credential: '6+ Years Teaching', bg: '#FBE0CE',
        photo: 'https://ailernova.in/wp-content/themes/ailernova-theme/images/teachers/danika-shringi.jpg' },
      { name: 'Mili Verma', subject: 'Maths & Science', grades: 'Classes 1–12 · NEET',
        experience: 'B.Sc (Clinical Psychology). Teaches Maths, Science, Physics and Biology from Class 1 through 12 and NEET prep — patient, concept-first coaching.',
        credential: '10+ Years Teaching', bg: '#D3EEFB',
        photo: 'https://ailernova.in/wp-content/themes/ailernova-theme/images/teachers/mili-verma.jpg' },
      { name: 'Dr. Pooja Pandey', subject: 'Science & Maths', grades: '',
        experience: 'BHMS. A science and maths mentor who breaks concepts down to first principles and keeps every session engaging.',
        credential: '6+ Years Teaching', bg: '#FBEFC6',
        photo: 'https://ailernova.in/wp-content/themes/ailernova-theme/images/teachers/pooja-pandey.jpg' },
      { name: 'Niveditha Krishnan', subject: 'Physics & Maths', grades: '',
        experience: 'M.Sc Physics, M.Phil, M.Ed. A physics and maths specialist who turns tough problems into clear, step-by-step understanding.',
        credential: '7+ Years Teaching', bg: '#C8F5D8',
        photo: 'https://ailernova.in/wp-content/themes/ailernova-theme/images/teachers/niveditha-krishnan.jpg' },
      { name: 'Yogita Solanki', subject: 'Computer Science', grades: 'Python · C++',
        experience: 'M.Tech Computer Science. Teaches programming with Python and C++ — building real coding confidence from the fundamentals up.',
        credential: '6+ Years Teaching', bg: '#F9DCF3',
        photo: 'https://ailernova.in/wp-content/themes/ailernova-theme/images/teachers/yogita-solanki.jpg' },
      { name: 'Kirti Sharma', subject: 'Maths & Science', grades: '',
        experience: 'M.Sc Mathematics. A maths and science tutor focused on strong foundations and steady, visible progress.',
        credential: '6+ Years Teaching', bg: '#D2ECFB',
        photo: 'https://ailernova.in/wp-content/themes/ailernova-theme/images/teachers/kirti-sharma.jpg' },
      { name: 'Gagana V', subject: 'Chemistry & Science', grades: '',
        experience: 'M.Sc Chemistry. Makes chemistry click with clear explanations and patient, doubt-clearing sessions.',
        credential: '6+ Years Teaching', bg: '#FBE0CE',
        photo: 'https://ailernova.in/wp-content/themes/ailernova-theme/images/teachers/gagana-v.jpg' },
      { name: 'Simarpreet Kour', subject: 'Mathematics', grades: 'Grades 3–12',
        experience: 'M.Sc Mathematics, B.Ed., CTET-qualified. Twelve years of making maths approachable for students from Grade 3 to 12.',
        credential: '12+ Years Teaching', bg: '#FBEFC6',
        photo: 'https://ailernova.in/wp-content/themes/ailernova-theme/images/teachers/simarpreet-kour.jpg' },
      { name: 'Simran', subject: 'Maths · Science · English · Hindi', grades: '',
        experience: 'Graduate, D.El.Ed., CTET-qualified. A multi-subject tutor for Maths, Science, English and Hindi who meets each child at their level.',
        credential: '6+ Years Teaching', bg: '#C8F5D8',
        photo: 'https://ailernova.in/wp-content/themes/ailernova-theme/images/teachers/simran.jpg' },
      { name: 'Jayapriya K', subject: 'Science & Maths', grades: 'Higher Secondary',
        experience: 'B.Tech (Chemical Engineering), BBA & Diploma in Polymer. An adaptable, patient educator across multiple curricula — making learning engaging and stress-free, clearing doubts effectively and building personalized study planners that boost every student’s confidence.',
        credential: '7+ Years Teaching', bg: '#D3EEFB',
        photo: 'https://ailernova.in/wp-content/themes/ailernova-theme/images/teachers/jayapriya-k.jpg' },
    ],
  },
  // "Students ❤️ Our Tutors" — the wall of thank-you notes. Same honesty rule as `meet`:
  // ⚠️ EMPTY ON PURPOSE. Each item is a real note a child (or parent) sent, added WITH
  // consent — until then the section stays HIDDEN. Never invent a note.
  // Shape: { image, caption }. `image` is a URL (or bundled-asset URI) to the note photo;
  // `caption` is optional (e.g. 'Aarav, Class 6'). `image` null → the card draws an image
  // stub of the same size, so the rail lays out identically before the photos land.
  notes: {
    title: 'Students ❤️ Our Tutors',
    body: 'Every smile, doodle, and thank-you note tells a story of confidence, curiosity, and genuine connection.',
    items: [],
  },
  // "Ailernova Tutors Are Different" — the us-vs-others comparison table. `rows: []` → hides.
  // `us`/`them` are the column headers; each row pairs what we do (green tick) against the
  // usual alternative (red cross).
  different: {
    title: 'Ailernova Tutors Are Different',
    us: 'AILERNOVA',
    them: 'OTHERS',
    rows: [
      { us: 'Same tutor in every class.',                     them: 'A new tutor to re-explain everything to.' },
      { us: 'Teaching matches the student’s pace.',           them: 'One fixed pace for every student.' },
      { us: 'Regular updates and PTMs.',                      them: 'Little or no updates on progress.' },
      { us: 'Same tutor for school, tests, and enrichment.',  them: 'Different tutors for different needs.' },
      { us: 'Top-paid tutors, ensuring top quality.',         them: 'Lower pay, so quality varies.' },
      { us: 'Highly trained tutors with ongoing upskilling.', them: 'Basic or one-time training only.' },
    ],
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
    { q: 'How does Ailernova select and train its tutors?',
      a: 'We pair each student with a tutor who matches their learning style and goals. Every tutor is chosen for subject expertise and the ability to genuinely engage children, then trained on the Ailernova way of teaching — with ongoing upskilling and regular reviews so they keep improving.' },
    { q: 'Where are Ailernova tutors located?',
      a: 'Our tutors teach online, so your child learns from a subject expert no matter where you live. Every session is live and 1-on-1.' },
    { q: 'What qualifications do Ailernova tutors have?',
      a: 'Ailernova tutors hold strong academic degrees — B.Sc, M.Sc, M.Tech, B.Tech, B.Ed and more — and specialise in the subjects they teach, from Maths and Science to English and Computer Science.' },
    { q: 'Do Ailernova tutors have prior teaching experience?',
      a: 'Yes. Our tutors bring real teaching experience — typically 6 to 12+ years — across different grades, boards and learning needs.' },
    { q: 'How does Ailernova ensure tutor quality and consistency?',
      a: 'We keep quality high with regular progress updates and PTMs, continuous tutor training, and the same tutor every session — so learning stays consistent and you always know how your child is doing.' },
    { q: 'Will my child get the same tutor every session?',
      a: 'Yes. The tutor matched at the start stays with your child for every session — they remember what was hard last week and pick up exactly there.' },
    { q: 'What if my child does not get along with the tutor?',
      a: 'Tell us and we rematch, free of charge. The match matters more than the schedule — a child who does not feel safe asking questions will not learn.' },
  ],
};

/* ── Parent Reviews (long-scroll page; see AboutScreen.js → ReviewsStack) ──────
   Sits under ABOUT AILERNOVA → Parent Reviews. Every review below is a REAL parent
   review from ailernova.in — grouped by the themes families mention most. Never
   invent a review or a number; this is public-facing. Stats are the site's own
   figures. `themes[].reviews` empty → that theme hides; all empty → page still shows
   the hero and stats. */
CONTENT.reviews = {
  hero: {
    title: 'What Parents Say\nAbout Ailernova',
    body: 'Across parent reviews, families share how our expert tutors and flexible support help their child build a strong foundation and lasting confidence.',
    cta: 'Book a Free Trial Class',
    // The pill bolds the figure, so it is carried apart from the words around it.
    trustPre: 'Trusted by', trustNum: '200K+', trustPost: 'Learners',
    rating: { score: '4.9', label: 'on Trustpilot' },
    // image null → the dark ruled surface holds the photo's slot (same as Our Tutors).
    image: null,
    // learn/learnUrl null → no ▶ row is drawn. A play button over nothing is worse
    // than no play button.
    learn: 'Learn How Ailernova Works', learnUrl: null,
    // The accolade strip under the hero. EMPTY ON PURPOSE — add an entry only for an
    // award Ailernova has actually won; the strip hides itself until then.
    badges: [],
  },
  // The pinned CTA carries the whole page, so it stays the plain next step; the hero's
  // own button is the one that names the trial.
  stickyCta: 'Get Started',
  whyTitle: 'Why Parents Choose Ailernova',
  whyBody: 'Real reviews from parents, organized by the themes families mention most across grade levels.',
  // The score leads the proof line on its own; the pairs below it are split by a divider.
  whyRating: { score: '4.9', label: 'Trustpilot' },
  stats: [
    { value: '200K+', label: 'Students',     color: C.blue },
    { value: '100%',  label: 'Satisfaction', color: '#C026D3' },
  ],
  // The 9 real reviews on ailernova.in — 5 from the home page, 4 more from /review/ —
  // each quoted VERBATIM and placed in the ONE theme it fits best. No repetition, nothing
  // invented. The summaries are OUR editorial copy, but every claim in them is carried by
  // the reviews in that same theme; they must not outrun what the parents actually said.
  //
  // ⚠️ The site contradicts itself on ONE review: "Excellent support for homework and
  // tests…" is Ayesha Khan (Grade 5, Mumbai) on the home page but Deepti on /review/. The
  // home page's more specific attribution is used here. Worth fixing on the site.
  themes: [
    { title: 'Tutor Quality',
      summary: 'Parents highlight clear, patient tutors who explain concepts step by step and adapt to how each child learns. The same points recur across reviews: explanations are broken down until the child follows them, tutors stay patient through repeated questions, and mentors switch methods when the first approach does not land. Families describe fundamentals getting stronger, school tests starting to feel easier, and children who once avoided a subject now looking forward to class.',
      reviews: [
        // `photo` — the reviewer's picture in the round avatar, same contract as the
        // trust-bar testimonials: ailernova.in's own published photo, bundled under
        // assets/reviews/ and paired with the quote it was published beside. Omit it and
        // the card falls back to initials, so only the reviewers the site actually
        // pictures carry one. Never fill a blank with someone else's face.
        { name: 'Neha Sharma', place: 'Delhi', flag: '🇮🇳', grade: 'Grade 6',
          photo: require('../../../../assets/reviews/neha-sharma.png'),
          quote: 'My daughter now looks forward to both math and science classes. Explanations are clear and confidence is clearly higher.',
          tags: ['Clear explanations', 'More confidence'] },
        { name: 'Francella', place: '', flag: '', grade: '',
          quote: 'Our tutor explains step by step, very patiently. My child’s fundamentals are now strong and school tests feel easier.',
          tags: ['Step by step', 'Patient teaching', 'Strong fundamentals'] },
        { name: 'Sapna', place: '', flag: '', grade: '',
          quote: 'My son now enjoys math class. The mentor uses multiple methods and keeps practice adaptive.',
          tags: ['Adaptive practice', 'Enjoys class'] },
      ] },
    { title: 'Grades and Scores',
      summary: 'Families point to real, measurable gains — school scores moving up and children pulling ahead within weeks. Reviews describe movement in both directions of the report card: average marks climbing to the top bracket, C-grade anxiety settling into consistent A grades, and confusion in fractions and algebra turning into clarity in about eight weeks. Parents credit the structure — sessions aligned to school topics every week — and the one-to-one model for making the jump stick.',
      reviews: [
        { name: 'Priyanka Rao', place: 'Bengaluru', flag: '🇮🇳', grade: 'Grade 8',
          photo: require('../../../../assets/reviews/priyanka-rao.png'),
          quote: 'In 8 weeks, my son moved from confusion to clarity in fractions and algebra. School scores improved from average to top bracket.',
          tags: ['Higher scores', 'Fast progress'] },
        { name: 'Olga R', place: '', flag: '', grade: '',
          quote: 'My daughter moved from C grade anxiety to consistent A grades. The one-on-one model made the difference.',
          tags: ['Better grades', 'Less anxiety', '1-on-1'] },
        { name: 'Hari', place: '', flag: '', grade: '',
          quote: 'We saw a clear jump in grades and confidence. Classes are structured, and the tutor aligns with school topics every week.',
          tags: ['Better grades', 'Aligned to school'] },
      ] },
    { title: 'Curriculum Fit',
      summary: 'Reviews mention how closely sessions align with school — homework, tests and weekly topics all reinforced. Ailernova tutors teach across Indian and international curricula, covering CBSE, ICSE, State Boards and IGCSE for Classes 1 to 12, and sessions follow the topics your child is actually being taught that week rather than a syllabus of their own. Parents describe dedicated help with homework and doubt solving, targeted practice aimed at school performance, and exam preparation that arrives before the exam rather than after it.',
      reviews: [
        { name: 'Ayesha Khan', place: 'Mumbai', flag: '🇮🇳', grade: 'Grade 5',
          quote: 'Excellent support for homework and tests. Scheduling is easy and communication with tutor is quick.',
          tags: ['Homework & test help', 'Quick to reach'] },
      ] },
    { title: 'Consistency & Progress',
      summary: 'Parents value the steady structure — the same tutor, regular updates, and progress they can actually see. Ailernova pairs a child with a consistent mentor who stays with their learning journey year after year, so nobody restarts from scratch each term. Progress tracking is built into every plan: strengths and weak areas are mapped, sessions and schedules stay visible to parents, and reviews describe watching those weak areas close month by month rather than being told that they have.',
      reviews: [
        { name: 'Deepti', place: '', flag: '', grade: '',
          photo: require('../../../../assets/reviews/deepti.jpg'),
          quote: 'The class structure is strong and updates are regular. My child now solves word problems independently without fear.',
          tags: ['Structured classes', 'Regular updates'] },
        { name: 'Manjari', place: '', flag: '', grade: '',
          quote: 'Tutor quality and tracking are excellent. We can clearly see strengths and weak areas improving month by month.',
          tags: ['Progress tracking', 'Month by month'] },
      ] },
    // ⚠️ DEMO PLACEHOLDERS — the two themes below have NO real reviews yet. The summaries
    // are true of Ailernova, but the review cards are OBVIOUS placeholders (name "Sample
    // Parent", placeholder quote, "Demo only" tag) — layout only, NOT genuine testimonials.
    // ► BEFORE RELEASE: replace with real, consented reviews or delete these two themes.
    { title: 'Personalization',
      summary: 'Each student is paired with a tutor who matches their learning style, and lessons adapt to how your child actually learns. Every session is 1:1 and tailored to your child’s current level and pace, built on a path drawn from their own strengths and weak areas rather than a class average. Worksheets adapt as they progress, and tutors are trained for varying learning needs — the pace slows into patient concept rebuilding where a child is struggling, or opens into an olympiad track where they are already ahead.',
      reviews: [
        { name: 'Sample Parent', place: 'City', flag: '🇮🇳', grade: 'Grade X',
          quote: 'Placeholder review — replace with a real parent review before release.',
          tags: ['Placeholder', 'Demo only'] },
        { name: 'Sample Parent', place: 'City', flag: '🇮🇳', grade: 'Grade X',
          quote: 'Placeholder review — replace with a real parent review before release.',
          tags: ['Placeholder', 'Demo only'] },
      ] },
    { title: 'Engagement',
      summary: 'Live, 1-on-1 sessions keep children active and involved — asking questions, exploring ideas, and looking forward to class. Classes are teacher-led and real-time rather than recorded: your child asks a question and gets feedback in the moment, on any device with a stable connection and a camera. Each session runs 55 minutes, extendable to an hour — long enough to actually get somewhere, short enough to hold a child’s attention to the end of it.',
      reviews: [
        { name: 'Sample Parent', place: 'City', flag: '🇮🇳', grade: 'Grade X',
          quote: 'Placeholder review — replace with a real parent review before release.',
          tags: ['Placeholder', 'Demo only'] },
        { name: 'Sample Parent', place: 'City', flag: '🇮🇳', grade: 'Grade X',
          quote: 'Placeholder review — replace with a real parent review before release.',
          tags: ['Placeholder', 'Demo only'] },
      ] },
    { title: 'Confidence',
      summary: 'Parents describe children growing more confident and comfortable with math and science over time — less anxiety, more willingness to try. It is the thread running through every review on this page: a daughter who now looks forward to class, a son who enjoys math, a child solving word problems independently without fear, one who moved from C-grade anxiety to consistent A grades. Ailernova builds for it on purpose — every tutor guides, challenges and supports, so what a child keeps is the mindset, not just the marks.',
      reviews: [
        { name: 'Sample Parent', place: 'City', flag: '🇮🇳', grade: 'Grade X',
          quote: 'Placeholder review — replace with a real parent review before release.',
          tags: ['Placeholder', 'Demo only'] },
        { name: 'Sample Parent', place: 'City', flag: '🇮🇳', grade: 'Grade X',
          quote: 'Placeholder review — replace with a real parent review before release.',
          tags: ['Placeholder', 'Demo only'] },
      ] },
    { title: 'Test Prep',
      summary: 'Concept-driven preparation for school exams and beyond — aligned to CBSE, ICSE, State Boards, IGCSE and NEET. Preparation starts from concepts rather than question banks: fundamentals first, then targeted practice aimed at school performance, then guided drills that build speed and accuracy under time. Fast learners carry straight on into full olympiad and challenge-track support, so the same plan that rescues a difficult term also stretches a child who is already ahead of it.',
      reviews: [
        { name: 'Sample Parent', place: 'City', flag: '🇮🇳', grade: 'Grade X',
          quote: 'Placeholder review — replace with a real parent review before release.',
          tags: ['Placeholder', 'Demo only'] },
        { name: 'Sample Parent', place: 'City', flag: '🇮🇳', grade: 'Grade X',
          quote: 'Placeholder review — replace with a real parent review before release.',
          tags: ['Placeholder', 'Demo only'] },
      ] },
    { title: 'Flexibility',
      summary: 'Online, 1-on-1 classes fit around your family — book times that work for you, with easy rescheduling. Sessions can be booked any day of the week, weekends included, and the usual rhythm is two classes a week for Classes K to 8 and three for high school, adjusted to what your child needs and when they are free. Children can join at any point in the year. A flexible leave policy and easy refunds on unused classes mean a holiday or a hard month costs you the class, not the plan.',
      reviews: [
        { name: 'Sample Parent', place: 'City', flag: '🇮🇳', grade: 'Grade X',
          quote: 'Placeholder review — replace with a real parent review before release.',
          tags: ['Placeholder', 'Demo only'] },
        { name: 'Sample Parent', place: 'City', flag: '🇮🇳', grade: 'Grade X',
          quote: 'Placeholder review — replace with a real parent review before release.',
          tags: ['Placeholder', 'Demo only'] },
      ] },
    { title: 'Parent Support',
      summary: 'Regular updates and quick communication keep parents in the loop on exactly how their child is progressing. Parents track progress, manage schedules and reach the tutor directly, and dedicated support covers school homework and doubt solving between sessions. Academic counsellors are on hand before you start and after — reviews single out how easy the scheduling is and how quickly the tutor comes back to you when it matters.',
      reviews: [
        { name: 'Sample Parent', place: 'City', flag: '🇮🇳', grade: 'Grade X',
          quote: 'Placeholder review — replace with a real parent review before release.',
          tags: ['Placeholder', 'Demo only'] },
        { name: 'Sample Parent', place: 'City', flag: '🇮🇳', grade: 'Grade X',
          quote: 'Placeholder review — replace with a real parent review before release.',
          tags: ['Placeholder', 'Demo only'] },
      ] },
    { title: 'Value and Progress',
      summary: 'Simple pricing set against progress you can see. Plans run from an 8-class starter up to 52 and 104 classes at two sessions a week, with the longer commitments priced as the better value, and every plan carries the same contents — free learning plan setup, progress tracking, exam preparation and olympiad support. Easy refunds cover unused classes, and it opens with a free demo, so you watch the teaching and the platform before any of it is decided.',
      reviews: [
        { name: 'Sample Parent', place: 'City', flag: '🇮🇳', grade: 'Grade X',
          quote: 'Placeholder review — replace with a real parent review before release.',
          tags: ['Placeholder', 'Demo only'] },
        { name: 'Sample Parent', place: 'City', flag: '🇮🇳', grade: 'Grade X',
          quote: 'Placeholder review — replace with a real parent review before release.',
          tags: ['Placeholder', 'Demo only'] },
      ] },
  ],
  // ⚠️ DEMO — these article cards aren't wired yet: `url` is null (no navigation), so they
  // go nowhere. Titles/blurbs are real topics we COULD write, not Cuemath's (no "MathFit™").
  // ► BEFORE RELEASE: give each a real `url`, or delete this section.
  reads: {
    title: 'Related Reads',
    items: [
      { title: 'Choosing the Right Tutor for Your Child',           blurb: 'What to look for in a tutor, and how the right match changes how your child learns.', by: 'By Ailernova', url: null },
      { title: 'How 1-on-1 Online Tutoring Works',                  blurb: 'Inside a live one-on-one session — and why undivided attention makes the difference.', by: 'By Ailernova', url: null },
      { title: 'Building Strong Math & Science Foundations',        blurb: 'Why strong foundations matter more than shortcuts, and how they are built session by session.', by: 'By Ailernova', url: null },
      { title: 'How Much Does Online Tutoring Cost?',               blurb: 'A practical look at tutoring costs, personalization, and why 1-on-1 often delivers better value.', by: 'By Ailernova', url: null },
      { title: 'Why Understanding Beats Speed in Math',             blurb: 'Deep understanding leads to consistent grades and reliable test performance over time.', by: 'By Ailernova', url: null },
      { title: 'What Is Math Anxiety — and How to Overcome It',     blurb: 'If your child dreads tests or shuts down during homework, it may be math anxiety. Here is what helps.', by: 'By Ailernova', url: null },
      { title: 'Word Problems: A Step-by-Step Guide for Parents',   blurb: 'A simple approach to help your child break down and solve word problems with confidence.', by: 'By Ailernova', url: null },
      { title: 'Strengthening School Skills and Math Confidence',   blurb: 'How school-aligned instruction supports both performance and confidence.', by: 'By Ailernova', url: null },
    ],
  },
  // The questions a parent actually has while reading reviews — so they sit here rather
  // than in the shared AILERNOVA_FAQS set (which answers "how do classes work").
  // Answers 2 and 3 are Ailernova's own FAQ copy from ailernova.in, near-verbatim.
  // Answers 4 and 5 are carried by the real reviews on THIS page and nothing more — note
  // what 5 does NOT do: promise a timeline. One family reported eight weeks; that is one
  // family, not a guarantee, and it must never be written as one.
  //
  // ⚠️ Q1 says every review here is published on ailernova.in. That is NOT TRUE while the
  // seven demo themes above still carry "Sample Parent" cards — this answer only becomes
  // honest once those are removed or filled with real reviews.
  faqTitle: 'We Love Answering Your Questions',
  seeMoreUrl: 'https://ailernova.in/review/',
  faqs: [
    { q: 'Are these real Ailernova reviews? Where can I read more?',
      a: 'Yes. Every review on this page is one Ailernova publishes on its own site — nothing here is written on a parent’s behalf. You can read them in full at ailernova.in/review/ and on the home page, where families are quoted with their name and their child’s grade. Ailernova reports an average 4.9 rating across 200,000+ students.' },
    { q: 'Will tutoring be customized for my child’s pace and needs?',
      a: 'Absolutely. Our tutors are trained to work with children of varying learning needs and styles, and we adapt every session to your child’s unique requirements. Sessions are 1:1 and built on a path drawn from your child’s own strengths and weak areas, so the pace can slow down for patient concept rebuilding or open into an olympiad track for a fast learner.' },
    { q: 'Can Ailernova help with school curriculum and homework?',
      a: 'Yes. Our tutors are experienced across school curricula — just tell us your child’s school and grade level, and sessions follow the topics they are actually being taught that week. Every plan includes dedicated support for school homework and doubt solving, plus targeted practice and exam preparation.' },
    { q: 'Can Ailernova reduce my child’s math anxiety or confidence issues?',
      a: 'It is the change parents mention most. In their own words: a daughter who now looks forward to class, a son who enjoys math, a child solving word problems independently without fear, and one who moved from C-grade anxiety to consistent A grades. Every tutor is expected to guide, challenge and support — confidence is the point, not a side effect.' },
    { q: 'How quickly can I expect improvement?',
      a: 'That depends on your child, and we would rather not promise you a date. What parents report varies: one family saw their son move from confusion to clarity in fractions and algebra in eight weeks; another watched strengths and weak areas improve month by month. Progress tracking is included in every plan, so you can see where your child actually is rather than wait to be told.' },
  ],
};

/* ── Pricing (see AboutScreen.js → PricingStack) ───────────────────────────────
   Sits under ABOUT AILERNOVA → Pricing. Every figure below is lifted VERBATIM from
   ailernova.in/pricing/ and checked against that page's raw HTML — these are prices a
   parent will pay, so nothing here is rounded, guessed or "roughly". `was` is the
   struck-through ₹1000 the site itself shows on the discounted plans.
   ► If the site's prices change, this file is wrong until someone updates it. It does
     NOT read from the site at runtime. */
CONTENT.pricing = {
  hero: {
    title: 'Simple Pricing & Clear Value',
    body: 'Affordable tutoring for complete math mastery, with structured support moms can trust.',
    cta: 'Book Free Demo',
  },
  gradesLabel: 'GRADES',
  // Ailernova teaches Classes 1-12 (the site's mentors list NEET too), but it only
  // PUBLISHES a price for KG-Grade 8. The second bracket is real teaching with no public
  // price, so it is listed and its table is left null — see `tables` below.
  grades: ['KG to Grade 8', 'Grade 9 to Grade 12'],
  // The site publishes 2 classes/week pricing only. Its FAQ says high school usually runs
  // three a week — but names no price for it, so that column stays null too.
  cadences: [
    { id: '2', label: '2 classes/week', recommended: false },
    { id: '3', label: '3 classes/week', recommended: true },
  ],
  // ⚠️ PRICES. Keyed '<grade>|<cadence>'. A null table means Ailernova does not publish a
  // price for that combination — the page then says exactly that and points to a
  // counsellor. DO NOT fill a null in with an estimate, a scaled-up figure, or a number
  // from another plan: a parent books a demo off these, and a wrong price is a lie that
  // costs them money. Only real published figures go here.
  // The one real table below is verbatim from ailernova.in/pricing/, checked against that
  // page's raw HTML.
  tables: {
    'KG to Grade 8|2': [
      { name: '1 Month', per: '₹1000', was: null, unit: '/class', off: null,
        billed: '₹8,000 billed every 4 weeks', classes: '8 classes',
        head: '#66D9FF', tint: '#D6F5FF', badge: null,
        features: ['Free learning plan setup', 'Flexible leave policy', 'Progress tracking included'] },
      { name: '6 Months', per: '₹900', was: '₹1000', unit: '/class', off: '10% OFF',
        billed: '₹46,800 billed every 26 weeks', classes: '52 classes',
        head: '#FFAA80', tint: '#FFDDCC', badge: null,
        features: ['Free learning plan setup', 'Adjustable schedule', 'Exam preparation support'] },
      { name: '12 Months', per: '₹800', was: '₹1000', unit: '/class', off: '20% OFF',
        billed: '₹83,200 billed every 52 weeks', classes: '104 classes',
        head: '#A8E6A3', tint: '#DFF5DD', badge: 'Best value for committed learners',
        features: ['Free learning plan setup', 'Full olympiad support'] },
    ],
    'KG to Grade 8|3': null,
    'Grade 9 to Grade 12|2': null,
    'Grade 9 to Grade 12|3': null,
  },
  // What the page says instead of a price it does not have.
  noPrice: {
    title: 'We don’t publish a price for this yet',
    body: 'Ailernova teaches these classes, but the rate for this combination isn’t listed publicly. A counsellor will tell you exactly what it costs — no obligation.',
    cta: 'Talk to a counsellor',
    url: 'https://wa.me/918905604773',
  },
  // The site prints this under the plans. It must stay visible — a price that hides its
  // tax is a price that lies.
  note: '* All pricing is exclusive of 18% GST.',
  // The strip that sits under the plans. "55 minutes per class" is the site's own figure
  // (its FAQ: "each class runs for 55 minutes, extendable to an hour") — do not round it.
  assurances: [
    { emoji: '⏱️', label: '55 minutes\nper class' },
    { emoji: '🗓️', label: 'Flexible Leaves\n& Schedule' },
    { emoji: '💸', label: 'Easy\nRefunds' },
  ],
  includedTitle: 'All Plans Include',
  // A grid of names, no descriptions — the tile says WHAT you get; the eight together say
  // "everything". Each `tint` colours the glyph only; the cells stay white and are split
  // by hairlines, so the grid reads as one table rather than eight loose cards.
  included: [
    { glyph: 'Σ', title: 'Learning Plan',     tint: '#F5B301' },
    { glyph: '%', title: 'Exam Preparation',  tint: '#FF7E3B' },
    { glyph: '△', title: 'Homework Help',     tint: '#ED6CEF' },
    { glyph: '∞', title: 'Advanced Learning', tint: '#3DD771' },
    { glyph: 'λ', title: 'Smart Practice',    tint: '#33CCFF' },
    { glyph: '±', title: 'Mental Math',       tint: '#F5B301' },
    { glyph: '√', title: 'Remedial Support',  tint: '#3DD771' },
    // "Mom App" is what ailernova.in calls it. Not "Parent App" — that is someone else's.
    { glyph: 'U', title: 'Mom App',           tint: '#FF7E3B' },
  ],
  // The promise the free trial makes, in Ailernova's OWN words — lifted from the trial
  // letter in CONTENT.about.trialStrip, not from anybody else's page.
  promise: 'Watch them teach your child,\nand only then decide.',
  promiseSub: 'No pressure and no commitment.',
  // Titles and bodies are ailernova.in/pricing/'s own "Start in 4 Simple Steps" copy,
  // verbatim. The BANDS are the layout; the WORDS stay ours.
  steps: [
    { n: '1', title: 'Tell us about your child', emoji: '✏️', bg: '#FFBA07',
      body: 'Share class level and learning goals with us.' },
    { n: '2', title: 'Speak to a counsellor', emoji: '📞', bg: '#FF7E3B',
      body: 'We match your child with the right tutor for them.' },
    { n: '3', title: 'Attend free demo', emoji: '💻', bg: '#ED6CEF',
      body: 'Experience the teaching style and platform firsthand.' },
    { n: '4', title: 'Choose plan & start', emoji: '🎒', bg: '#3DD771',
      body: 'Book your slot and begin regular classes.' },
  ],
  stickyCta: 'Get Started',
};

/* ── FAQs page (see AboutScreen.js → FaqsStack) ────────────────────────────────
   Sits under ABOUT AILERNOVA → FAQs. Reuses the shared AILERNOVA_FAQS set (the site's
   own answers) rather than keeping a second copy to drift out of step. */
CONTENT.faqs = {
  hero: {
    title: 'We Love Answering\nYour Questions',
    body: 'Everything parents ask before their child’s first class — how sessions run, what they cost, and how we fit around your family.',
    cta: 'Book Free Demo',
  },
  faqTitle: 'FAQs',
  faqs: AILERNOVA_FAQS,
  seeMoreUrl: 'https://ailernova.in/#faq',
  askTitle: 'Still have a question?',
  askBody: 'Our academic counsellors are happy to guide you personally.',
  askCta: 'Talk to a counsellor',
  askUrl: 'https://wa.me/918905604773',
  stickyCta: 'Get Started',
};

/* ── Contact Us page (see AboutScreen.js → ContactStack) ───────────────────────
   Sits under ABOUT AILERNOVA → Contact Us. Every channel here is one we actually
   answer on: WhatsApp is the fastest, email is for anything that needs a trail.
   `offices` is a list — an empty list hides the whole "Our Offices" block. */
CONTENT.contact = {
  hero: { title: 'Every Question Matters.\nWe’re Here to Help' },
  cards: [
    {
      title: 'For Ailernova Families',
      body: 'Whether you have questions about classes, technical issues, pricing, or anything else, our team is ready to answer all your queries.',
      cta: 'Message us on WhatsApp',
      url: 'https://wa.me/918905604773',
    },
    {
      title: 'New to Ailernova?',
      body: 'Have questions before getting started? We’re happy to help you explore if Ailernova is the right fit for your child.',
      email: 'support@ailernova.com',
    },
  ],
  officesTitle: 'Our Offices',
  offices: [
    {
      flag: '🇮🇳',
      country: 'India',
      lines: 'Ailernova Private Limited\nP03-01A & P03-01B, 3rd Floor, Building 51D\nWTC Tower D, Zone-5, GIFT City\nGandhinagar, Gujarat 382050',
      map: 'https://maps.app.goo.gl/cBkkfNbiy6T15jpd8',
    },
    {
      flag: '🇺🇸',
      country: 'United States',
      lines: '100 Pine Street, Suite 1250\nSan Francisco, CA 94111\nUnited States',
      map: 'https://maps.app.goo.gl/3kuLH1pc5pZbeSfb9',
    },
  ],
  cta: {
    title: 'Wondering If Ailernova Is the Right Fit for Your Child?',
    body: 'No matter where your child is in their learning journey, the best way to know if Ailernova is right for them is to simply experience it.',
    button: 'Book a Free Demo Class',
    learn: 'Learn how it works',
    learnUrl: 'https://ailernova.in/how-it-works',
  },
  stickyCta: 'Book Free Demo',
  // Helpful links. Each `key` maps to an in-app page that already exists (FaqsStack,
  // PricingStack, TutorsStack, ReviewsStack) — a card whose handler isn't passed in
  // simply doesn't render, so this never shows a link that goes nowhere.
  linksTitle: 'Helpful Links',
  links: [
    { key: 'faqs', title: 'FAQs', body: 'Find answers to commonly asked questions.', bg: '#FDF1D6', tint: '#F5B301' },
    { key: 'pricing', title: 'Pricing', body: 'See our plans and what they include.', bg: '#FDE4D3', tint: '#F0733F' },
    { key: 'tutors', title: 'Our Tutors', body: 'Meet the tutors who teach your child.', bg: '#D6F2E0', tint: '#12924B' },
    { key: 'reviews', title: 'Parent Reviews', body: 'Hear from parents already with us.', bg: '#FBDDF2', tint: '#C21C93' },
  ],
};

/* ── Refund & Cancellation Policy (see AboutScreen.js → RefundStack) ───────────
   THIS IS A LEGAL DOCUMENT, NOT MARKETING COPY. Everything a parent reads here is a
   commitment we have to honour, so every field below starts empty and each section
   renders ONLY once it is filled in — a half-written refund policy must never ship
   looking complete. Do not invent a window, a processing time or an exclusion:
   fill these from the signed-off policy document.
   TODO(saurabh): supply the real terms — see the checklist in the PR/chat. */
CONTENT.refund = {
  // TRUE until the real policy is signed off. While it is true the page shows a Draft
  // strip at the top, so this placeholder text can never be mistaken for a live policy
  // by a parent or by whoever ships the build. Flip to false ONLY when every field
  // below has been replaced with the approved wording.
  draft: true,
  hero: {
    title: 'Refund & Cancellation Policy',
    scope: '(Applicable to India, the United States, and the Rest of the World)',
    answer: 'Yes — Ailernova offers refunds.',
    body: 'If you decide to stop, you can be refunded for classes you have paid for but not yet used, subject to the terms below. Here is exactly how it works.',
    docCta: 'Read the complete policy document',
    docUrl: null,        // link to the signed-off policy PDF/page once it exists
    effective: 'Not yet published',
  },
  howTitle: 'Three things to know about your refund',
  how: [
    { label: 'What you get back', tint: '#12924B', tintBg: '#D6F2E0',
      title: 'Unused classes only',
      body: 'A refund covers the classes you have paid for and not yet used at the time you ask. Classes already attended, missed, or expired are not included.' },
    { label: 'When to request', tint: '#1848F0', tintBg: '#E0EAFF',
      title: 'Within your refund window',
      body: 'You can raise a refund request within the window that applies to your plan, counted from your invoice date. Requests after that window closes cannot be processed.' },
    { label: 'How long it takes', tint: '#C21C93', tintBg: '#FBDDF2',
      title: 'A few business days',
      body: 'Once your refund is confirmed we process it back to your original payment method. How soon it appears depends on your bank or payment provider.' },
  ],
  notTitle: 'A few things are not refundable',
  notBody: 'Refunds apply to paid, unused classes. A few categories sit outside the scope of any refund.',
  not: [
    { title: 'Classes you have already attended', body: 'Completed classes, whether attended or missed, are not refunded.' },
    { title: 'Bonus or gifted classes', body: 'Classes added through rewards, promotions, referrals, sibling benefits, or as a goodwill gesture.' },
    { title: 'Transaction fees', body: 'Payment gateway charges, convenience fees, or bank charges are deducted from the eligible refund amount.' },
    { title: 'Taxes already paid', body: 'Taxes corresponding to classes already attended or completed are not refundable.' },
  ],
  note: 'Note on pausing your program: pausing your classes does not extend your refund window. The window is always counted from your original invoice date.',
  // How to reach us. These two ARE true today, so they are filled.
  requestTitle: 'How to Request a Refund',
  requestBody: 'You can reach out to us through',
  channels: [
    { key: 'whatsapp', title: 'WhatsApp', body: 'Message us at +91 89056 04773 and our support team will pick it up.', url: 'https://wa.me/918905604773' },
    { key: 'email', title: 'Email Support', body: 'Write to us at support@ailernova.com and our support team will get back to you.', url: 'mailto:support@ailernova.com' },
  ],
  faqTitle: 'Frequently Asked Questions',
  faqs: [
    { q: 'Is Ailernova refundable?',
      a: 'Yes. Ailernova offers a pro-rata refund on eligible unused classes, subject to the terms and conditions set out in this policy.' },
    { q: 'What is the deadline to request a refund?',
      a: 'A refund request must be raised within the refund window that applies to your plan, counted from the date of your invoice. Requests raised after that window closes are time-barred.' },
    { q: 'What charges are non-refundable?',
      a: 'Classes already attended, completed, missed or lapsed; classes granted as rewards, promotions, referrals or goodwill; payment gateway and transaction fees; EMI processing fees and interest; bank, forex and cross-border charges; and taxes on classes already consumed.' },
    { q: 'Does pausing my program extend my refund eligibility?',
      a: 'No. A pause or grace period does not extend or reset the refund window, which is always calculated from your original invoice date.' },
    { q: 'How will I receive my refund?',
      a: 'Refunds are returned to the original payment method used at the time of purchase.' },
    { q: 'How do I cancel and request a refund?',
      a: 'Message us on WhatsApp or write to support@ailernova.com. Our support team will confirm your eligible amount and take it from there.' },
  ],
  // The full legal text, rendered as numbered clauses. Shape:
  //   { n: '1', tint: '#FDF1D6', title: 'Eligibility of Refunds',
  //     clauses: [{ ref: '(i)', text: '…', sub: [{ ref: '(a)', text: '…' }] }] }
  // Paste the signed-off policy in verbatim — do not paraphrase legal text, and do not
  // fill this from any other company's policy.
  termsTitle: 'Refund Policy Terms and Conditions',
  termsIntro: [
    'This policy explains the terms and conditions under which refunds may be requested and processed for Ailernova programs.',
    'It applies to all customers enrolled in Ailernova programs and governs all refund and cancellation requests submitted on or after the effective date, regardless of the date of enrolment or payment.',
  ],
  termsNote: 'Please read these terms and conditions carefully before opting for our refund policy.',
  terms: [
    { n: '1', tint: '#FDF1D6', title: 'Eligibility of Refunds', clauses: [
      { ref: '(i)', text: 'Ailernova offers a pro-rata refund of the eligible fees paid for its programs, subject to the terms and conditions set out below.' },
      { ref: '(ii)', text: 'Refunds, where applicable, are calculated on a pro-rata basis, considering only the classes remaining out of the total number of paid classes at the time a valid refund request is processed, for the following reasons:',
        sub: [
          { ref: '(a)', text: 'any unused or remaining classes;' },
          { ref: '(b)', text: 'any class pauses, deferments or rescheduling;' },
          { ref: '(c)', text: 'any operational or personal delays in attending classes.' },
        ] },
      { ref: '(iii)', text: 'A refund request must be raised within the refund window applicable to your plan, counted from the date of issuance of the invoice. This timeline is a final and non-extendable cut-off for all refund eligibility.' },
    ] },
    { n: '2', tint: '#FDE4D3', title: 'Program Tenure, Pause, and Lapse', clauses: [
      { ref: '(i)', text: 'Each Ailernova program has a defined program tenure, commencing from the program start date.' },
      { ref: '(ii)', text: 'Ailernova may, at its discretion, permit temporary pauses or limited grace periods for completion of classes in accordance with its pause policy.' },
      { ref: '(iii)', text: 'Pauses or grace periods do not extend or modify the refund eligibility period specified in Clause 1(iii), and do not shift or reset the applicable trigger date for that period.' },
    ] },
    { n: '3', tint: '#D6F2E0', title: 'Non-Refundable Items', clauses: [
      { ref: '(i)', text: 'Classes already attended, completed, missed, or lapsed due to absenteeism where an approved pause was not applied.' },
      { ref: '(ii)', text: 'Classes added or granted as part of rewards, promotions, campaigns, referrals, sibling enrolment benefits, feedback initiatives, or as a goodwill gesture or service recovery.' },
      { ref: '(iii)', text: 'Payment gateway charges, transaction fees, or convenience fees, which are deducted from the eligible refund amount on a pro-rata basis.' },
      { ref: '(iv)', text: 'EMI processing fees, interest components, or pre-closure charges levied by banks or financial institutions.' },
      { ref: '(v)', text: 'Bank charges, forex conversion charges, or cross-border transaction fees.' },
      { ref: '(vi)', text: 'Any applicable taxes, duties, or levies corresponding to classes already attended, completed, missed, or lapsed.' },
    ] },
    { n: '4', tint: '#FBDDF2', title: 'Refund Mode and Processing', clauses: [
      { ref: '(i)', text: 'Refunds are processed to the original payment method, where technically feasible and permitted under applicable banking, payment gateway, or regulatory requirements.' },
      { ref: '(ii)', text: 'Where a refund to the original payment method is not feasible, Ailernova may, at its discretion, process the refund through a bank transfer in the name of the person who made the payment, to an account held with a scheduled bank.' },
      { ref: '(iii)', text: 'Refunds are processed within the timeline stated in this policy from the date of refund confirmation, subject to the timelines and policies of banks, payment gateways, and financial institutions.' },
    ] },
    { n: '5', tint: '#DBF0FA', title: 'EMI Transactions', clauses: [
      { ref: '(i)', text: 'Where payment has been made through an EMI facility using a credit card, debit card, or third-party lender:',
        sub: [
          { ref: '(a)', text: 'Ailernova processes the eligible refund amount in accordance with applicable banking and payment gateway mechanisms;' },
          { ref: '(b)', text: 'customers are solely responsible for coordinating with their card-issuing bank or lender for EMI cancellation or foreclosure;' },
          { ref: '(c)', text: 'processing fees; or' },
          { ref: '(d)', text: 'penalties imposed by the issuing bank or lender.' },
        ] },
    ] },
    { n: '6', tint: '#FDF1D6', title: 'Force Majeure and Program Discontinuation', clauses: [
      { ref: '(i)', text: 'Ailernova reserves the right to cancel, suspend, or terminate classes or programs due to events beyond its reasonable control, including force majeure events.' },
      { ref: '(ii)', text: 'In the event of a force majeure event that renders the continued provision of classes permanently or otherwise impossible, Ailernova may, at its discretion, either:',
        sub: [
          { ref: '(a)', text: 'reschedule or resume the affected classes when feasible; or' },
          { ref: '(b)', text: 'provide an appropriate extension of time for class completion; or' },
          { ref: '(c)', text: 'process a pro-rata refund for the un-availed portion of the program.' },
        ] },
    ] },
    { n: '7', tint: '#FDE4D3', title: 'Policy Modification', clauses: [
      { ref: '(i)', text: 'Ailernova reserves the right to modify, amend, or update this policy from time to time, and the same becomes effective on publication on the Ailernova website. Ailernova may, at its discretion and where practicable, notify enrolled customers of such changes through available customer communication channels.' },
      { ref: '(ii)', text: 'Unless expressly stated otherwise, any revised policy applies to all refund requests submitted on or after its effective date, irrespective of the date of purchase, enrolment or payment.' },
    ] },
  ],
  stickyCta: 'Talk to support',
  stickyUrl: 'https://wa.me/918905604773',
};

/* ── Referral Program (see AboutScreen.js → ReferralStack) ────────────────────
   A referral offer is a PROMISE OF MONEY. Every number here — the reward, the
   validation period, the credit timeline — is something a parent will hold us to,
   so this carries the same `draft` strip as the refund policy and every block is
   guarded: an unfilled field renders nothing rather than a placeholder.
   TODO(saurabh): confirm the reward size, the validation window, the effective date
   and the policy-document URL, then flip `draft` to false. */
CONTENT.referral = {
  // TRUE until the offer is signed off. Shows a Draft strip so this can never be
  // mistaken for a live, claimable offer by a parent or by whoever ships the build.
  draft: true,
  hero: {
    badge: 'For active Ailernova parents',
    title: 'Refer a friend.',
    // Rendered in italic, on its own line, exactly as the second line of the headline.
    titleAlt: 'You both get free classes.',
    emoji: '🎁',
    answer: 'One month of free classes — for you and for your friend.',
    body: 'Refer any parent new to Ailernova. Once they have been enrolled for 30 days, you each get one month of classes added to your account.',
    docCta: 'Read the complete referral policy document',
    docUrl: null,        // link to the signed-off referral policy once it exists
    effective: null,     // e.g. '30 April 2026' — leave null until published
    issuer: 'Ailernova',
  },
  rewardsLabel: 'What you get',
  rewardsTitle: 'The rewards at a glance.',
  rewards: [
    { key: 'you', emoji: '👤', label: 'You (the referrer)', value: '1 month',
      body: "One month of free classes added to your child's current plan. Credits extend your subscription, so you don't pay for that month." },
    { key: 'friend', emoji: '🤝', label: 'Your friend', value: '1 month',
      body: 'One month of free classes on their new plan, regardless of whether they sign up for 3, 6, or 12 months. Same reward either way.' },
    { key: 'when', emoji: '📅', label: "When it's credited", value: '~37 days',
      body: 'Within 7 days after your friend completes their 30-day validation period. Roughly 37 days after they enrol and pay.' },
  ],
  howLabel: 'How it works',
  howTitle: "Three steps. That's it.",
  how: [
    { n: '1', title: 'Share your referral link with a parent new to Ailernova',
      body: "You'll find your personal referral link in the Ailernova app. Share it over WhatsApp, email, or however you like. It tracks back to you automatically." },
    { n: '2', title: 'Your friend enrols and stays for 30 days',
      body: 'Your friend signs up for any Ailernova plan (3, 6, or 12 months) and makes their first payment. The 30-day validation period then begins. Their subscription must remain active and paid during this time.' },
    { n: '3', title: 'You both get credited automatically',
      body: "Within 7 days of the validation period ending, one month of class credits is added to both your account and your friend's account." },
  ],
  siblingLabel: 'Also available',
  siblingTitle: 'Enrolling a sibling? You get double.',
  sibling: {
    label: 'Sibling benefit',
    headline: "2 months of free classes for the sibling's plan",
    body: 'If you enrol a second child under your existing Ailernova parent account, you receive 2 months of class credits on the sibling’s plan — double the standard referral reward. This applies only to new sibling enrolments under the same account.',
    note: 'Credits are non-transferable and non-redeemable for cash.',
  },

  // Eligibility — the two lists a parent checks before they bother sharing a link:
  // what earns the reward, and what quietly disqualifies them. Kept as plain
  // yes/no cards rather than prose because this is the part people scan, not read.
  eligibility: {
    label: 'Eligibility',
    title: "What counts, and what doesn't.",
    yesLabel: 'A successful referral',
    yes: [
      { title: 'New to Ailernova', body: 'Your friend has never had an Ailernova account before. Re-enrolling a former customer does not count.' },
      { title: 'Enrolled and paid', body: 'They sign up for any Ailernova plan (3, 6, or 12 months) and make a successful payment.' },
      { title: 'Stays for 30 days', body: 'Their payment is not refunded, cancelled, or disputed within the 30-day validation period.' },
    ],
    noLabel: "What's not allowed",
    no: [
      { title: 'Self-referrals', body: 'Referring yourself or your own dependents.' },
      { title: 'Bulk sharing', body: 'Sharing referral links through paid ads, search marketing, bulk messages, or traffic-generating sites.' },
      { title: 'Fake accounts', body: 'Creating multiple accounts, fake identities, or any mechanism to artificially generate referrals.' },
      { title: 'Duplicate referrals', body: 'If two people refer the same friend, only the first referral received counts.' },
    ],
  },

  faqLabel: 'FAQ',
  faqTitle: 'Questions parents ask about the referral program.',
  faqs: [
    { q: 'What do I get for referring a friend?',
      a: 'One month of free classes added to your child’s current plan, credited after your friend completes their 30-day validation period.' },
    { q: 'What does my friend get?',
      a: 'One month of free classes on their new plan, regardless of whether they sign up for 3, 6, or 12 months.' },
    { q: 'When exactly will I receive my reward?',
      a: 'Within 7 days after your friend completes their 30-day validation period — roughly 37 days after they enrol and pay.' },
    { q: 'Can I refer more than one friend?',
      a: 'Yes. Each successful referral earns its own one-month reward, and there is no cap on how many friends you refer.' },
    { q: 'Can I refer someone who used to be an Ailernova parent?',
      a: 'No. The reward applies only to parents who are new to Ailernova. Re-enrolling a former customer does not qualify.' },
    { q: 'Can I use my referral credits toward a renewal payment?',
      a: 'Credits are added as class credits that extend your existing subscription. They are not applied as a discount on a renewal invoice, and they cannot be redeemed for cash.' },
    { q: 'How is the sibling benefit different from a referral?',
      a: 'A referral is for a parent new to Ailernova. The sibling benefit is for enrolling a second child under your own account, and it is worth two months instead of one. The two cannot be claimed on the same enrolment.' },
    { q: 'I referred a friend but have not received my reward. What should I do?',
      a: 'Check that your friend has completed the full 30-day validation period. If more than 7 days have passed since then, message us on WhatsApp and we will trace the referral.' },
  ],

  help: {
    title: 'Questions about your referral?',
    body: 'Reach us on WhatsApp or by email. We will sort it out.',
    cta: 'Contact us',
    url: 'https://wa.me/918905604773',
  },

  // The full terms, collapsed behind a toggle — the page above is the readable
  // summary, this is the binding version. Same rule as the refund policy: these are
  // PLACEHOLDER terms until the signed-off document exists (see `draft` above).
  termsCta: 'View complete referral program terms',
  terms: [
    { title: 'Eligibility and successful referrals',
      paras: [
        'Referral payouts will be considered only for unique referees (referred students) who are new to the Ailernova system.',
        'Referrals will not be considered if the referrer has referred themselves or their dependents.',
        'A successful referral is defined as a referred parent who:',
      ],
      bullets: [
        'has enrolled in an Ailernova course (for any duration: 3, 6, or 12 months),',
        'has completed 30 days post enrolment ("Validation Period"), and',
        'has made a successful payment which is not refunded, cancelled, or disputed during the Validation Period.',
      ],
      after: [
        'If these conditions are not met, the rewards will be subject to clawback.',
        'If multiple referrals are received for the same parent within the Validation Period, the referral benefit will be credited to the referrer whose referral was received first.',
        'Referrals will not be considered if a discontinued customer is referred again by an existing customer within the Validation Period.',
      ] },
    { title: 'Rewards and credits',
      paras: [
        'For every successful referral, one month of benefit will be provided to the referring parent (P1) and the newly referred parent (P2), irrespective of the duration of the new enrolment.',
        'One month benefit refers to one month of equivalent class value/credits as per the student’s active plan, and is non-transferable and non-redeemable for cash.',
        'A sibling enrolment refers to a second child enrolled under the same account, under which 2 months of class credits will be provided for the sibling’s plan; such credits are non-transferable, non-redeemable for cash, and applicable only on new sibling enrolments.',
        'Referral rewards will be credited within 7 days after the Validation Period and will extend the student’s current subscription validity as per the equivalent class credits added.',
        'Referral benefits are non-transferable and can only be used by the eligible parent account to which they are credited.',
      ] },
    { title: 'Program rules and restrictions',
      paras: [
        'Spamming referral links or promoting them via search engine marketing, advertising channels, bulk messaging, or traffic-generating websites is strictly prohibited.',
        'Creation of multiple accounts, fake identities, or any mechanism to artificially generate referrals will lead to disqualification and reversal of benefits.',
        'Ailernova reserves the right to disqualify any participant who earns referral benefits through fraud, abuse, or violation of these terms.',
        'Ailernova may modify, suspend, or withdraw the referral program at any time. Any revision takes effect on publication, and applies to referrals received on or after that date.',
      ] },
  ],

  stickyCta: 'Share your referral link',
  stickyUrl: 'https://wa.me/918905604773',
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
