// src/api/teachingApi.js
// The human teacher's dashboard (/api/teaching, teachers only) and a student's homework
// from their teacher (/api/homework). Server: server/src/routes/teaching.js, homework.js.
import axiosInstance from './axiosInstance';

const data = (r) => r.data?.data || {};

// { now, timezone, next, today, week: [{ date, label, weekday, lessons }], students }
export const getTeacherDashboard = () => axiosInstance.get('/api/teaching/dashboard').then(data);

// [{ assignmentId, studentName, classLevel, subject, roomLink, nextLessonAt, homework: { given, done, overdue } }]
export const getMyClass = () => axiosInstance.get('/api/teaching/class').then((r) => data(r).students || []);

export const getTeacherHomework = (assignmentId) =>
  axiosInstance.get('/api/teaching/homework', { params: assignmentId ? { assignmentId } : {} }).then((r) => data(r).homework || []);

export const giveHomework = (body) => axiosInstance.post('/api/teaching/homework', body).then((r) => data(r).homework);
export const editHomework = (id, body) => axiosInstance.patch(`/api/teaching/homework/${id}`, body).then((r) => data(r).homework);
export const deleteHomework = (id) => axiosInstance.patch(`/api/teaching/homework/${id}`, { delete: true }).then(data);

// The student's side.
export const getMyHomework = () => axiosInstance.get('/api/homework').then((r) => data(r).homework || []);
export const markHomeworkDone = (id, done = true) =>
  axiosInstance.post(`/api/homework/${id}/${done ? 'done' : 'undo'}`).then((r) => data(r).homework);

// The student's live classes: [{ assignmentId, subject, classLevel, teacherName, roomLink,
//   next: { startsAt, endsAt, joinOpensAt, state } | null }]
export const getMyClasses = () => axiosInstance.get('/api/my-classes').then((r) => data(r).classes || []);

// ── homework photos ────────────────────────────────────────────────────────────
// One photo from expo-image-picker ({ uri, mimeType?, fileName? }) → its URL.
export async function uploadHomeworkPhoto(asset) {
  const mime = asset?.mimeType || 'image/jpeg';
  const name = asset?.fileName || `homework-${Date.now()}.${(mime.split('/')[1] || 'jpg').replace('jpeg', 'jpg')}`;
  const form = new FormData();
  form.append('file', { uri: asset.uri, name, type: mime });
  const r = await axiosInstance.post('/api/homework/upload', form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 90000 });
  return data(r).url;
}

// The student hands in work: { note, images: [url] }.
export const submitHomework = (id, body) => axiosInstance.post(`/api/homework/${id}/submit`, body).then((r) => data(r).homework);
// The teacher checks it: { comment } — or { uncheck: true }.
export const checkHomework = (id, body) => axiosInstance.post(`/api/teaching/homework/${id}/check`, body).then((r) => data(r).homework);
