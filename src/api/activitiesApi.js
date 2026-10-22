// src/api/activitiesApi.js
// Chapter activities: a team board game for the classroom and solo missions.
// Everything is class-scoped server-side; `classLevel` is the any-class picker's
// choice and is optional — omitted, the server uses the student's own class.
import axiosInstance from './axiosInstance';

const unwrap = (res) => res.data?.data ?? res.data;
const classParam = (classLevel) => {
  const n = parseInt(String(classLevel || '').replace(/\D/g, ''), 10);
  return n ? { class: n } : {};
};

// [{ name, slug, chapters, done, emoji, theme }]
export const getActivitySubjects = async (classLevel) =>
  unwrap(await axiosInstance.get('/api/activities/subjects', { params: classParam(classLevel) }));

// [{ id, name, position, available, curated, best: {score,total}|null, attempts }]
export const getActivityChapters = async (subjectSlug, classLevel) =>
  unwrap(await axiosInstance.get(`/api/activities/${encodeURIComponent(subjectSlug)}/chapters`, { params: classParam(classLevel) }));

// mode: 'board' | 'missions'. Assembled activities differ on every call — that is
// the point, so a chapter can be played more than once — so never cache this.
export const getActivity = async (chapterId, mode = 'missions') =>
  unwrap(await axiosInstance.get(`/api/activities/chapter/${chapterId}`, { params: { mode } }));

// Solo runs only. Board games are a whole-class event and are not anyone's score.
export const submitActivityResult = async (chapterId, { score, total }) =>
  unwrap(await axiosInstance.post(`/api/activities/chapter/${chapterId}/result`, { score, total }));
