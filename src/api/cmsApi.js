// src/api/cmsApi.js
// Student-side read of the CMS content tree. The admin authors + publishes content into
// cms_nodes; this is the ONLY thing the student app should read from that tree. The
// endpoint is public and hard-filters to status='published' AND visibility='visible', so
// drafts/archived content can never leak to a student. Published-only, cache-friendly.
import axiosInstance from './axiosInstance';

// Fetch published children of a node (or the published roots when neither arg is given).
//   getPublishedNodes()                       → published board roots
//   getPublishedNodes({ parentId })           → published children of a node
//   getPublishedNodes({ level: 'subject' })   → all published nodes at a level
export const getPublishedNodes = async ({ parentId, level } = {}) => {
  const params = new URLSearchParams();
  if (parentId) params.set('parentId', parentId);
  if (level) params.set('level', level);
  const q = params.toString();
  const res = await axiosInstance.get(`/api/cms/published${q ? `?${q}` : ''}`);
  return res.data?.data?.nodes || [];
};
