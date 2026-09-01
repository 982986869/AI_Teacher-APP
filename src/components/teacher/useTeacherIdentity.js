// useTeacherIdentity.js
// The teacher to render RIGHT NOW, matched to the voice the student is hearing.
//
// The server voice is female (ElevenLabs). When it is unreachable the app falls
// back to the device's speech engine, which on many Android builds only offers a
// male English voice — and a woman on screen with a man's voice reads as a bug
// rather than as a graceful fallback. This hook follows that change so the face
// can follow it too.
//
// It is driven by the VOICE ACTUALLY SELECTED, not by "did the server fail": a
// device fallback that finds a female voice keeps the female teacher, and only a
// genuinely male voice swaps the identity.
import { useState, useEffect } from 'react';
import { getTeacherVoiceGender, onTeacherVoiceGenderChange } from '../../utils/teacherVoice';
import { teacherFor } from './teacherIdentity';
import { fetchTeacherIdentity } from '../../api/teacherApi';

// Server-configured overrides, fetched once per app run and shared by every
// mount. A lesson can mount this hook several times (hero, badge, stage) and the
// answer changes about as often as an admin uploads a file, so re-requesting per
// mount would be pure noise. `null` means "not fetched yet", not "none set".
let cache = null;
let inflight = null;
const subs = new Set();

function loadRemote() {
  if (cache) return;
  if (!inflight) {
    inflight = fetchTeacherIdentity().then((r) => {
      cache = r || {};
      inflight = null;
      subs.forEach((fn) => { try { fn(cache); } catch (_) {} });
    });
  }
}

export default function useTeacherIdentity() {
  const [gender, setGender] = useState(() => getTeacherVoiceGender());
  const [remote, setRemote] = useState(cache);

  useEffect(() => {
    // Read once on mount as well: the fallback may have already happened on a
    // previous screen, and the subscription only reports future changes.
    setGender(getTeacherVoiceGender());
    return onTeacherVoiceGenderChange(setGender);
  }, []);

  useEffect(() => {
    if (cache) return undefined;
    // Resolve after unmount is fine — setRemote on an unmounted component is a
    // no-op in React 18+, and the subscription is dropped either way.
    subs.add(setRemote);
    loadRemote();
    return () => subs.delete(setRemote);
  }, []);

  return teacherFor(gender, remote);
}
