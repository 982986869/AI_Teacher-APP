// src/data/faculty.js
// The faculty roster shown to BOTH parents (ParentApp → Home) and teachers (RoleHomeScreen).
// One source of truth so the two surfaces can never drift apart.
//
// Shape:
//   id           stable key
//   name         full name, as shown to parents. Omit for a photo-only card.
//   subject      headline subject for the accent pill (keep it short — it's a chip)
//   subjects     optional full list
//   qualification / experience   quiet lines under the name
//   bio          their own introduction, in their words
//   photo        static require() — Metro resolves these at build time, so a variable
//                path will NOT work. null falls back to an initials monogram.
//
// ─── THE PHOTO NUMBERS ARE NOT THE ROSTER ORDER ──────────────────────────────
// Every teacher here was previously attached to the wrong photograph. The files
// p1..p10 had been filed in REVERSE of the order the roster lists people in, so
// the first teacher owned p10, the second p9, and so on — which meant nine of the
// ten cards showed one colleague's face above another colleague's name,
// qualification and years of experience.
//
// The mapping below is not a guess. Danika and Mili each confirmed their own
// photograph, Niveditha's was matched by eye against the site, and the rest were
// resolved by exact pixel dimensions against the NAMED files published at
//   ailernova.in/wp-content/themes/ailernova-theme/images/teachers/<name>.jpg
// Each of the ten has a distinct size, so the match is unambiguous:
//
//   p1  969x1280   Yogita Solanki        p6  460x610    Gagana V
//   p2  1242x1280  Dr. Pooja Pandey      p7  1166x1280  Kirti Sharma
//   p3  494x629    Jayapriya K           p8  413x591    Niveditha Krishnan
//   p4  1280x1052  Simran                p9  1056x1280  Mili Verma
//   p5  413x531    Simarpreet Kour       p10 960x1280   Danika Shringi
//
// Before attaching a name to a photo here, verify it the same way. Do not assume
// the nth teacher owns pN — that assumption is what caused this.
//
// Where a teacher sent us her own introduction, those words are kept verbatim in
// preference to the shorter marketing line on the website: it is her description of
// her own teaching. The three added last (Pooja, Jayapriya, Yogita) had no such
// submission, so their details are the website's, unchanged.

export const FACULTY = [
  {
    id: 'danika',
    name: 'Danika Shringi',
    subject: 'English',
    subjects: 'English, Spoken English, Grammar, Creative Writing, Public Speaking, Communication Skills',
    qualification: 'B.A. (Hons.) English Literature',
    experience: '3+ years',
    bio: 'I specialize in teaching English language, literature, spoken English, and communication skills with a focus on clarity, confidence, and practical learning. My teaching approach is interactive, student-friendly, and designed to help learners improve both academic performance and real-life communication.',
    photo: require('../../assets/faculty/p10.jpg'),
  },
  {
    id: 'mili',
    name: 'Mili Verma',
    subject: 'Science & Maths',
    subjects: 'Maths, Science, Social Studies, English, Biology, Chemistry, Physics',
    qualification: 'B.Sc. Clinical Psychology',
    experience: '10 years',
    bio: 'I have been teaching students from Class 1–5 since 2015, then senior students (6–12) from 2018. Since 2020 I have taken both online and offline classes in Dehradun, plus special classes for NEET.',
    photo: require('../../assets/faculty/p9.jpg'),
  },
  {
    id: 'niveditha',
    name: 'Niveditha Krishnan',
    subject: 'Physics',
    subjects: 'Physics (and Maths where needed)',
    qualification: 'M.Sc. (Physics), M.Phil, M.Ed.',
    experience: '5+ years offline · 2 years online',
    bio: 'I have the patience to deal with any sort of student, solving their doubts and making them confident to learn the subject with ease. I teach in a fun way, so students never feel bored.',
    photo: require('../../assets/faculty/p8.jpg'),
  },
  {
    id: 'kirti',
    name: 'Kirti Sharma',
    subject: 'Maths & Science',
    subjects: 'Maths, Science',
    qualification: 'M.Sc. Mathematics',
    experience: '3 years',
    bio: 'I specialize in teaching Maths and Science to students of classes 8–12. My engaging, interactive and easy-to-understand approach helps learners build strong concepts and develop confidence.',
    photo: require('../../assets/faculty/p7.jpg'),
  },
  {
    id: 'gagana',
    name: 'Gagana V',
    subject: 'Chemistry',
    subjects: 'Science, Chemistry',
    qualification: 'M.Sc. Chemistry',
    experience: '2 years',
    bio: 'I have 2 years of online tutoring experience. My classes are engaging and student-friendly.',
    photo: require('../../assets/faculty/p6.jpg'),
  },
  {
    id: 'simarpreet',
    name: 'Simarpreet Kour',
    subject: 'Mathematics',
    subjects: 'Mathematics (Grades 3–12)',
    qualification: 'M.Sc. Mathematics, B.Ed., CTET Qualified',
    experience: '9 years offline · 3 years online',
    bio: 'Passionate Mathematics educator and World Record Holder with expertise in teaching Grades 3–12. I focus on concept-based learning, problem-solving, and making Mathematics simple, engaging, and enjoyable for every student.',
    photo: require('../../assets/faculty/p5.jpg'),
  },
  {
    id: 'simran',
    name: 'Simran',
    subject: 'Maths & Science',
    subjects: 'Maths, Science, English, Hindi (up to Class 10)',
    qualification: 'Graduation, D.El.Ed, CTET',
    experience: '5 years',
    bio: "I've been teaching online for the last 5 years, and am experienced in the Indian as well as USA, Australian and European curricula.",
    photo: require('../../assets/faculty/p4.jpg'),
  },

  // The three who were rendering as blank photo-only cards. Identified by the
  // dimension match above; details are the website's own copy, verbatim.
  {
    id: 'pooja',
    name: 'Dr. Pooja Pandey',
    subject: 'Science & Maths',
    subjects: 'Science, Mathematics',
    qualification: 'BHMS',
    experience: '6+ years',
    bio: 'Helping students build strong fundamentals through engaging and interactive learning.',
    photo: require('../../assets/faculty/p2.jpg'),
  },
  {
    id: 'jayapriya',
    name: 'Jayapriya K',
    subject: 'Science & Maths',
    subjects: 'Science, Mathematics',
    qualification: 'B.Tech Chemical Engineering, BBA',
    experience: '7+ years',
    bio: 'Adaptable educator creating personalized study plans and stress-free learning.',
    photo: require('../../assets/faculty/p3.jpg'),
  },
  {
    id: 'yogita',
    name: 'Yogita Solanki',
    subject: 'Computer Science',
    subjects: 'Computer Science, Python, C++',
    qualification: 'M.Tech Computer Science',
    experience: '6+ years',
    bio: 'Experienced coding mentor for school students and competitive learners.',
    photo: require('../../assets/faculty/p1.jpg'),
  },
];

// Initials for the monogram fallback ("Anita Sharma" → "AS").
export function initialsOf(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}
