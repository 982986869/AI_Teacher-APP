// src/api/announcementsApi.js
// Announcements an admin published from the portal. The server decides who sees what
// (audience, class, schedule); the app only renders what it is given.
import axiosInstance from './axiosInstance';

// [{ id, title, body, pinned, publishedAt }] — already filtered and ordered, pinned
// first. Never throws: an announcement banner is the last thing that should break a
// screen, so a failure is an empty list.
export const getAnnouncements = async () => {
  try {
    const res = await axiosInstance.get('/api/announcements');
    const list = res.data?.data ?? res.data;
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};
