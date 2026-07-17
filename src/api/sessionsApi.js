// src/api/sessionsApi.js
// Student read of live sessions — the real rows an admin publishes. Class-scoped and
// active-only server-side, so students only ever see sessions meant for them.
import axiosInstance from './axiosInstance';

export const getStudentSessions = () =>
  axiosInstance.get('/api/sessions').then((r) => r.data?.data?.sessions || []);
