import axiosInstance from './axiosInstance';

// Online Tests (DB-backed timed testpapers). Flow:
//   chapters (with test counts) → tests in a chapter → start test → grade client-side.
// classLevel selects the grade (defaults to 7 — the only class with online tests so far).

// Chapters of a subject that have online tests: [{ name, slug, testCount, chapterPos }]
export const getOnlineTestChapters = async (subjectSlug, classLevel = 7) =>
  (await axiosInstance.get(`/api/online-tests/${subjectSlug}/chapters`,
    { params: { class: classLevel } })).data.data;

// Tests within a chapter: [{ id, name, durationMin, questionCount, totalMarks, isPaid }]
export const getOnlineTests = async (subjectSlug, chapterSlug, classLevel = 7) =>
  (await axiosInstance.get(`/api/online-tests/${subjectSlug}/${chapterSlug}/tests`,
    { params: { class: classLevel } })).data.data;

// Full test: { id, name, instructionHtml, durationMin, totalMarks, questionCount,
//   questions:[{ id, text, options:[{key,label,optionId}], correctAnswer, correctOptionId,
//   explanation, marks }] }. The answer travels with the payload; grading + review are
// done client-side, like MCQ Practice.
export const getOnlineTest = async (testId) =>
  (await axiosInstance.get(`/api/online-tests/test/${testId}`)).data.data;
