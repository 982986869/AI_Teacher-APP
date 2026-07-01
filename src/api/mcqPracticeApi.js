import axiosInstance from './axiosInstance';

// MCQ Practice (DB-backed). Flow: list subtopics → start test → submit → score.
// classLevel (9–12) selects the grade; defaults to 11 for back-compat.

// Subtopics of a chapter: [{ id, name, questionCount }]
export const getMcqSubtopics = async (subjectSlug, chapterSlug, classLevel) =>
  (await axiosInstance.get(
    `/api/mcq-practice/${subjectSlug}/${chapterSlug}/subtopics`,
    { params: { class: classLevel } }
  )).data.data;

// Start a test: { subtopic:{id,name}, questions:[{ id, text, options:[{key,label,optionId}],
//   correctAnswer, correctOptionId, explanation, difficulty }] }
// subtopicId already pins the class — no class param needed.
export const getMcqSubtopicTest = async (subtopicId) =>
  (await axiosInstance.get(`/api/mcq-practice/subtopic/${subtopicId}`)).data.data;

// Chapter-level test: all MCQs of a chapter (across subtopics). Same question shape.
// Returns { questions:[...] } (empty if chapter has no MCQs, e.g. Physics).
export const getMcqChapterTest = async (subjectSlug, chapterSlug, classLevel) =>
  (await axiosInstance.get(`/api/mcq-practice/${subjectSlug}/${chapterSlug}/test`,
    { params: { class: classLevel } })).data.data;

// Submit answers → { total, attempted, correct, accuracy, completion, score, results }
// Also PERSISTS the attempt for the logged-in user (so progress updates).
// answers = [{ questionId, optionId }]
export const submitMcqTest = async (subtopicId, answers) =>
  (await axiosInstance.post('/api/mcq-practice/submit', { subtopicId, answers })).data.data;

// Per-user progress for a chapter:
//   { chapter:{ total, answered, score }, subtopics:[{ id, name, total, answered, score }] }
// answered>0 on a subtopic = show "Resume" instead of "Start".
export const getMcqProgress = async (subjectSlug, chapterSlug, classLevel) =>
  (await axiosInstance.get(`/api/mcq-practice/${subjectSlug}/${chapterSlug}/progress`,
    { params: { class: classLevel } })).data.data;
