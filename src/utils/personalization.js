// src/utils/personalization.js
// Client mirror of server/src/services/personalization/{subjects,scope}.js — keep in
// sync. Lets screens personalize/filter instantly without a round-trip; the BACKEND
// is still the authority that enforces access.

const PRIMARY = ['Mathematics', 'English', 'EVS', 'Hindi'];
const MIDDLE = ['Mathematics', 'Science', 'Social Science', 'English', 'Hindi'];
const STREAMS = {
  pcm: ['Physics', 'Chemistry', 'Mathematics'],
  pcb: ['Physics', 'Chemistry', 'Biology'],
  pcmb: ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
  commerce: ['Accountancy', 'Business Studies', 'Economics', 'Mathematics', 'English'],
  arts: ['History', 'Political Science', 'Geography', 'Economics', 'English'],
};
const SENIOR_DEFAULT = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];
const ROLES = new Set(['student', 'parent', 'teacher', 'admin']);

// QA/tester accounts can browse every class from one login (mirror of the server list
// in scope.js — keep in sync). The backend still enforces this; this only unlocks the
// class switcher + gates in the UI.
const TESTER_EMAILS = new Set(['kjha70455@gmail.com', 'pathakarpita867@gmail.com', 'kadhalakumkum@gmail.com']);
const isTester = (user) => !!(user && user.email && TESTER_EMAILS.has(String(user.email).toLowerCase()));

export const normalizeClass = (grade) => {
  if (grade == null) return null;
  const m = String(grade).match(/\d{1,2}/);
  if (!m) return null;
  const n = parseInt(m[0], 10);
  return n >= 1 && n <= 12 ? n : null;
};

export const normalizeStream = (s) => {
  if (!s) return null;
  const t = String(s).toLowerCase().replace(/[^a-z]/g, '');
  if (!t) return null;
  if (t.includes('pcmb')) return 'pcmb';
  if (t.includes('pcm')) return 'pcm';
  if (t.includes('pcb')) return 'pcb';
  if (t.includes('commerce') || t.includes('comm')) return 'commerce';
  if (t.includes('art') || t.includes('human')) return 'arts';
  return null;
};

export const subjectsFor = (classNum, stream) => {
  if (!classNum) return [];
  if (classNum <= 5) return PRIMARY;
  if (classNum <= 10) return MIDDLE;
  const st = normalizeStream(stream);
  return st && STREAMS[st] ? STREAMS[st] : SENIOR_DEFAULT;
};

export const isAllowedSubject = (subject, classNum, stream) => {
  if (!classNum || !subject) return true;
  return subjectsFor(classNum, stream).map((s) => s.toLowerCase()).includes(String(subject).trim().toLowerCase());
};

export const deriveScope = (user) => {
  if (!user) return { role: 'student', classNum: null, className: null, stream: null, board: null, language: null, school: null, subjects: [], complete: false };
  // The DB auth-role is authoritative for ADMIN: an admin is ALWAYS an admin, even if a
  // stale account_type ('student'/'teacher') lingers from an earlier session. Every other
  // role still honours account_type first, so the student↔parent dual-view (which flips
  // account_type without touching the auth-role) keeps working unchanged.
  // Mirror of server/src/services/personalization/scope.js roleOf() — keep in sync.
  const dbRole = String(user.role || '').toLowerCase();
  const a = String(user.account_type || user.accountType || '').toLowerCase();
  const role = dbRole === 'admin' ? 'admin'
    : (ROLES.has(a) ? a : (ROLES.has(dbRole) ? dbRole : 'student'));
  const classNum = normalizeClass(user.grade);
  const stream = normalizeStream(user.stream) || normalizeStream(user.grade);
  const needsStream = classNum != null && classNum >= 11;
  const tester = isTester(user);
  let complete;
  if (role === 'teacher' || role === 'admin' || role === 'parent') complete = true;
  else complete = tester || (!!classNum && (!needsStream || !!stream));
  return {
    role,
    tester,
    classNum,
    className: classNum ? `Class ${classNum}` : null,
    stream: needsStream ? stream : null,
    board: user.board || null,
    language: user.language || null,
    school: user.school || null,
    subjects: subjectsFor(classNum, stream),
    complete,
  };
};

export const STREAM_OPTIONS = [
  { key: 'PCM', label: 'PCM (Physics · Chemistry · Maths)' },
  { key: 'PCB', label: 'PCB (Physics · Chemistry · Biology)' },
  { key: 'PCMB', label: 'PCMB (all four)' },
  { key: 'Commerce', label: 'Commerce' },
  { key: 'Arts', label: 'Arts / Humanities' },
];
