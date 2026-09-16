'use strict'
require('dotenv').config()

// Seeds two CURATED activities — the hand-written ones that show what assembly
// cannot produce (a theme, riddles with spelling aliases, "act it out" tiles, a
// pledge, a real-world task). Every other chapter assembles from its banks.
//
//   node scripts/activities-seed.js
//
// Idempotent: re-running replaces the same two rows.

const db = require('../src/config/database')
const { upsertCurated } = require('../src/services/activities.service')

// Class 8 · Old - Science · Ch 3 "Synthetic Fibres and Plastics"
const FIBRE_BOARD = {
  title: '🧵 Fibre & Plastic Challenge 🧪',
  sub: 'A team game for the whole class — project this on the screen!',
  board: {
    cats: ['🧵 Fibre Facts', '🧪 Plastic Power', '🔍 Guess the Material', '🌍 Save the Earth'],
    tiles: [
      [
        { p: 10, q: 'Fibres made by human beings from chemicals are called ______ fibres.', a: 'Synthetic fibres (man-made fibres)' },
        { p: 20, q: 'Big molecules made by joining many small units (monomers) are called ______.', a: 'Polymers — e.g. polythene is a polymer of ethene.' },
        { p: 30, q: 'Why should we NOT wear synthetic clothes while cooking in the kitchen?', a: 'Synthetic fibres MELT and shrink on catching fire — they can stick to the skin and cause serious burns.' },
        { p: 40, q: 'ACT IT OUT 🎭: One team member holds hands with others in a line. What does this "human chain" represent in chemistry?', a: 'A polymer! Each student = a monomer, the chain = a polymer (linear arrangement).' },
      ],
      [
        { p: 10, q: 'Plastics that become soft on heating and can be remoulded are called ______.', a: 'Thermoplastics — e.g. polythene and PVC.' },
        { p: 20, q: 'Plastics that once moulded can NEVER be softened again by heating are called ______.', a: 'Thermosetting plastics — e.g. bakelite and melamine.' },
        { p: 30, q: 'Why is bakelite used for electrical switches and handles of utensils?', a: 'Because bakelite is a poor conductor of heat and electricity — it keeps us safe!' },
        { p: 40, q: 'Name the special plastic on which oil and water do not stick. Where is it used?', a: 'Teflon — used as non-stick coating on kitchen utensils like frying pans.' },
      ],
      [
        { p: 10, q: 'I coat frying pans so your dosa never sticks. Who am I?', a: 'Teflon!' },
        { p: 20, q: 'I resist fire, tolerate heat, and become floor tiles and kitchenware. Who am I?', a: 'Melamine!' },
        { p: 30, q: 'I am the polymer of ethene and become the carry-bags in every market. Who am I?', a: 'Polythene!' },
        { p: 40, q: 'QUICK LIST ⚡: In 30 seconds, name 6 plastic things in this classroom!', a: 'Teacher judges! (e.g. pens, ruler, switchboard, chair, water bottle, lunch box, chart sleeve…)' },
      ],
      [
        { p: 10, q: 'Waste that rots naturally by the action of bacteria is called ______.', a: 'Biodegradable waste — e.g. food leftovers, fruit peels.' },
        { p: 20, q: 'Which colour bin is for plastics, metals and glass — blue or green?', a: 'BLUE bin (green is for kitchen/food waste that decomposes).' },
        { p: 30, q: 'Recite the 4R principle for handling plastic waste!', a: 'Reduce, Reuse, Recycle, Recover!' },
        { p: 40, q: 'TEAM PLEDGE 🌱: Suggest TWO real changes your team will make to reduce plastic use.', a: 'Teacher judges! (e.g. cotton/jute shopping bags, steel bottles, refuse straws, reuse containers…)' },
      ],
    ],
  },
}

// Class 8 · Old - Science · Ch 17 "Stars and the Solar System"
const SKY_MISSIONS = {
  title: '🔭 Sky Vision: Space Mission',
  sub: 'Complete all 5 missions to become a Star Commander! Every correct answer earns ⭐',
  missions: [
    {
      type: 'mcq', title: '🚀 Mission 1: Quick Fire Quiz', note: 'Tap the correct answer. One try per question!',
      items: [
        { q: 'A light year measures…', o: ['Time', 'Distance', 'Speed', 'Brightness'], a: 1, x: 'A light year = distance light travels in 1 year (9.46 × 10¹² km).' },
        { q: 'After the Sun, the nearest star to Earth is…', o: ['Sirius', 'Pole Star', 'Alpha Centauri', 'Venus'], a: 2, x: 'Alpha Centauri is about 4.3 light years away.' },
        { q: 'How many planets are in our solar system now?', o: ['7', '8', '9', '10'], a: 1, x: 'Pluto was removed, so only 8 remain.' },
        { q: 'The hottest planet, nearest to the Sun, is…', o: ['Venus', 'Mars', 'Mercury', 'Jupiter'], a: 2, x: 'Mercury has no atmosphere and is rocky like the Moon.' },
        { q: 'The "Morning Star" is actually the planet…', o: ['Venus', 'Mercury', 'Saturn', 'Neptune'], a: 0, x: 'Its thick clouds reflect ¾ of the sunlight falling on it!' },
        { q: 'Our solar system lives inside which galaxy?', o: ['Andromeda', 'Milky Way', 'Orion', 'Ursa Major'], a: 1, x: 'The Milky Way is one of lakhs of galaxies.' },
      ],
    },
    {
      type: 'tf', title: '🪐 Mission 2: True or False?', note: 'Is the space fact real… or fake news from Mars?',
      items: [
        { q: 'Planets emit their own light, just like stars.', a: false, x: 'They only reflect sunlight.' },
        { q: 'Jupiter and Saturn have more than one natural satellite.', a: true, x: 'They have many moons!' },
        { q: 'The Pole Star appears fixed while other stars seem to move.', a: true, x: "That's why sailors used it for direction." },
        { q: 'Sunlight takes 8.3 hours to reach the Earth.', a: false, x: 'It takes 8.3 MINUTES.' },
        { q: 'Orion is also called Kal Purush, the Hunter.', a: true, x: 'It has more bright stars than most constellations.' },
      ],
    },
    {
      type: 'typein', title: '🕵️ Mission 3: Who Am I?', note: 'Type your answer and press Check. Spelling hints allowed!',
      items: [
        { q: 'I am a group of 7 bright stars shaped like a saucepan. People call me the Big Dipper. Who am I?', a: ['saptarishi', 'ursa major', 'big dipper', 'big saptarishi'], show: 'Big Saptarishi (Ursa Major)' },
        { q: 'I stay fixed in the northern sky. Sailors find directions using me. Who am I?', a: ['pole star', 'dhruva', 'dhruv', 'polestar', 'dhruva tara'], show: 'The Pole Star (Dhruva Tara)' },
        { q: 'I am the brightest STAR in the night sky, 8.7 light years away. Who am I?', a: ['sirius'], show: 'Sirius' },
        { q: 'I was called a planet for 76 years, then scientists changed their minds! Who am I?', a: ['pluto'], show: 'Pluto' },
      ],
    },
    {
      type: 'match', title: '🔗 Mission 4: Cosmic Connections', note: 'Match each object with its clue — tap the right pair!',
      items: [
        { q: '☄️ Orion constellation', o: ['The Hunter / Kal Purush', 'A planet with rings', "Earth's satellite"], a: 0 },
        { q: '🌙 Moon', o: ['A star', 'Natural satellite of Earth', 'A comet'], a: 1 },
        { q: '⭐ Indicating Stars', o: ['They point to the Pole Star', 'They orbit Jupiter', 'They are meteors'], a: 0 },
        { q: '🌍 Distance of Sun from Earth', o: ['4.3 light years', '8.7 light years', 'About 8.3 light minutes'], a: 2 },
        { q: '💫 Milky Way', o: ['A constellation', 'Our galaxy', 'An asteroid belt'], a: 1 },
      ],
    },
    {
      type: 'task', title: '🌌 Mission 5: Real Star Watching (Homework in the Sky!)',
      steps: [
        "Tonight's mission: go outside on a clear night with an adult and face north.",
        'Find the Big Saptarishi (Big Dipper) — 7 bright stars shaped like a saucepan.',
        'Join the two stars at the pan\'s edge with an imaginary line and stretch it — it points to the Pole Star (Dhruva Tara)!',
        'Draw what you saw in your notebook with the date and time.',
      ],
    },
  ],
}

async function chapterId(classLevel, subject, nameLike) {
  const r = await db.$queryRawUnsafe(
    `SELECT c.id::text AS id, c.name FROM chapters c JOIN subjects s ON s.id = c.subject_id
      WHERE c.class_level = $1 AND s.name = $2 AND c.name ILIKE $3 AND c.deleted_at IS NULL LIMIT 1`,
    classLevel, subject, `%${nameLike}%`)
  return r[0] || null
}

;(async () => {
  const fibre = await chapterId(8, 'Old - Science', 'Synthetic Fibres')
  const sky = await chapterId(8, 'Old - Science', 'Stars and the Solar System')
  if (!fibre || !sky) { console.error('chapters not found', { fibre, sky }); process.exit(1) }

  await upsertCurated(fibre.id, FIBRE_BOARD)
  console.log(`✓ board    → ${fibre.name} (id ${fibre.id})`)
  await upsertCurated(sky.id, SKY_MISSIONS)
  console.log(`✓ missions → ${sky.name} (id ${sky.id})`)

  const n = await db.$queryRawUnsafe(`SELECT count(*)::int AS n FROM activities WHERE status = 'published'`)
  console.log(`${n[0].n} curated activities published`)
  await db.$disconnect()
})().catch((e) => { console.error(e.message); process.exit(1) })
