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
// Photos live in assets/faculty/ as p1..p10.jpg. The FILENAME NUMBER MEANS NOTHING
// — do not assume the nth teacher owns pN. Danika and Mili were both filed against
// the wrong photograph until each sent her own picture (see the note at the bottom).
// Before attaching a name to a photo here, have that teacher confirm the picture.

export const FACULTY = [
  {
    id: 'danika',
    name: 'Danika Shringi',
    subject: 'English',
    subjects: 'English, Spoken English, Grammar, Creative Writing, Public Speaking, Communication Skills',
    qualification: 'B.A. (Hons.) English Literature',
    experience: '3+ years',
    bio: 'I specialize in teaching English language, literature, spoken English, and communication skills with a focus on clarity, confidence, and practical learning. My teaching approach is interactive, student-friendly, and designed to help learners improve both academic performance and real-life communication.',
    // p10, not p1. Danika confirmed her own photo and it is the one filed as p10;
    // p1 is a different person entirely.
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
    // p9, not p2 — confirmed by Mili's own photo. p2 is a different person.
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
    photo: require('../../assets/faculty/p3.jpg'),
  },
  {
    id: 'kirti',
    name: 'Kirti Sharma',
    subject: 'Maths & Science',
    subjects: 'Maths, Science',
    qualification: 'M.Sc. Mathematics',
    experience: '3 years',
    bio: 'I specialize in teaching Maths and Science to students of classes 8–12. My engaging, interactive and easy-to-understand approach helps learners build strong concepts and develop confidence.',
    photo: require('../../assets/faculty/p4.jpg'),
  },
  {
    id: 'gagana',
    name: 'Gagana V',
    subject: 'Chemistry',
    subjects: 'Science, Chemistry',
    qualification: 'M.Sc. Chemistry',
    experience: '2 years',
    bio: 'I have 2 years of online tutoring experience. My classes are engaging and student-friendly.',
    photo: require('../../assets/faculty/p5.jpg'),
  },
  {
    id: 'simarpreet',
    name: 'Simarpreet Kour',
    subject: 'Mathematics',
    subjects: 'Mathematics (Grades 3–12)',
    qualification: 'M.Sc. Mathematics, B.Ed., CTET Qualified',
    experience: '9 years offline · 3 years online',
    bio: 'Passionate Mathematics educator and World Record Holder with expertise in teaching Grades 3–12. I focus on concept-based learning, problem-solving, and making Mathematics simple, engaging, and enjoyable for every student.',
    photo: require('../../assets/faculty/p6.jpg'),
  },
  {
    id: 'simran',
    name: 'Simran',
    subject: 'Maths & Science',
    subjects: 'Maths, Science, English, Hindi (up to Class 10)',
    qualification: 'Graduation, D.El.Ed, CTET',
    experience: '5 years',
    bio: "I've been teaching online for the last 5 years, and am experienced in the Indian as well as USA, Australian and European curricula.",
    photo: require('../../assets/faculty/p7.jpg'),
  },

  // UNIDENTIFIED — photo-only until someone confirms who they are.
  //
  // p1 and p2 are here because they USED to carry Danika's and Mili's details.
  // Both teachers have since sent their own photographs, and neither matched:
  // Danika is the file saved as p10, Mili is p9. So p1 and p2 are two real people
  // whose names we do not currently know, and captioning them with somebody else's
  // name and qualifications is worse than leaving them unlabelled.
  //
  // ⚠ The two corrections were 1->10 and 2->9, which is what a REVERSED list looks
  // like. If that is what happened, then p3..p7 are wrong too and every remaining
  // teacher below is captioned with another colleague's face. Two confirmations is
  // not enough to rewrite five more people's attributions, so nothing else has been
  // touched — get one more photo confirmed (niveditha should be p8 if the reversal
  // theory holds) and the rest can be fixed in one pass.
  { id: 'p1', photo: require('../../assets/faculty/p1.jpg') },
  { id: 'p2', photo: require('../../assets/faculty/p2.jpg') },
  { id: 'p8', photo: require('../../assets/faculty/p8.jpg') },
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
