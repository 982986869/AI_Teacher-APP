import axiosInstance from './axiosInstance';

// Resources (PYQ & other sections) — backend wraps responses as
// { success, message, data }; we unwrap to the inner `data`.

export const getSubjects = async () =>
  (await axiosInstance.get('/api/resources/subjects')).data.data;

export const getChapters = async (subjectSlug) =>
  (await axiosInstance.get(`/api/resources/subjects/${subjectSlug}/chapters`)).data.data;

export const getSections = async (chapterId) =>
  (await axiosInstance.get(`/api/resources/chapters/${chapterId}/sections`)).data.data;

export const getQuestions = async (sectionId) =>
  (await axiosInstance.get(`/api/resources/sections/${sectionId}/questions`)).data.data;

// Convenience: questions straight from slugs (matches the screen navigation).
export const getQuestionsByPath = async (subjectSlug, chapterSlug, sectionType) =>
  (await axiosInstance.get(
    `/api/resources/content/${subjectSlug}/${chapterSlug}/${sectionType}`
  )).data.data;
