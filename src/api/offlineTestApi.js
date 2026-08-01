import axiosInstance from './axiosInstance';

// Online tests taken from the app's BUNDLED question bank (Classes 10/11/12).
// Those questions are not in the DB, so only the answer key is mirrored server-side
// and the server re-grades from it — the score it stores is therefore consistent
// with the answers it stores, rather than being whatever the client reported.
//
// payload: { classLevel, subject, chapter, testLabel,
//            answers: { "<questionId>": "A" },   // letters, absent = skipped
//            questionIds: [...],                  // every question, so `total` is right
//            timeTakenSec }
export const submitOfflineTest = async (payload) =>
  (await axiosInstance.post('/api/offline-tests/submit', payload)).data.data;
