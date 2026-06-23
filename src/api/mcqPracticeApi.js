import axiosInstance from './axiosInstance';

// MCQ Practice (DB-backed). Flow: list subtopics → start test → submit → score.

// Subtopics of a chapter: [{ id, name, questionCount }]
export const getMcqSubtopics = async (subjectSlug, chapterSlug) =>
  (await axiosInstance.get(
    `/api/mcq-practice/${subjectSlug}/${chapterSlug}/subtopics`
  )).data.data;

// Start a test: { subtopic:{id,name}, questions:[{ id, text, options:[{key,label,optionId}],
//   correctAnswer, correctOptionId, explanation, difficulty }] }
export const getMcqSubtopicTest = async (subtopicId) =>
  (await axiosInstance.get(`/api/mcq-practice/subtopic/${subtopicId}`)).data.data;

// Submit answers → { total, attempted, correct, accuracy, completion, score, results }
// answers = [{ questionId, optionId }]
export const submitMcqTest = async (subtopicId, answers) =>
  (await axiosInstance.post('/api/mcq-practice/submit', { subtopicId, answers })).data.data;
