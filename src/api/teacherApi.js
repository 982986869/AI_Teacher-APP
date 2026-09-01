import axiosInstance from './axiosInstance';

// The teacher identity overrides configured on the server: a name and hosted asset
// URLs per voice gender, so a second teacher can be added by uploading files rather
// than by shipping a new build.
//
// Every part of this is optional. No override configured, request failed, device
// offline — all resolve to {} and the app keeps its bundled Ms. Nova. Nothing here
// is worth interrupting a lesson for, so this never throws.
export async function fetchTeacherIdentity() {
  try {
    const res = await axiosInstance.get('/api/teacher/identity');
    const d = res?.data?.data;
    return d && typeof d === 'object' ? d : {};
  } catch (_) {
    return {};
  }
}
