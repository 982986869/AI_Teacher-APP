// useTeacherIdentity.js
// The teacher to render RIGHT NOW, matched to the voice the student is hearing.
//
// The server voice is female. When it is unreachable the app falls back to the
// device's speech engine, which on many Android builds only offers a male English
// voice — and a woman on screen with a man's voice reads as a bug rather than as
// a graceful fallback. This hook follows that change so the face can follow it too.
//
// It is driven by the VOICE ACTUALLY SELECTED, not by "did the server fail": a
// device fallback that finds a female voice keeps the female teacher, and only a
// genuinely male voice swaps the identity.
import { useState, useEffect } from 'react';
import { getTeacherVoiceGender, onTeacherVoiceGenderChange } from '../../utils/teacherVoice';
import { teacherFor } from './teacherIdentity';

export default function useTeacherIdentity() {
  const [gender, setGender] = useState(() => getTeacherVoiceGender());

  useEffect(() => {
    // Read once on mount as well: the fallback may have already happened on a
    // previous screen, and the subscription only reports future changes.
    setGender(getTeacherVoiceGender());
    return onTeacherVoiceGenderChange(setGender);
  }, []);

  return teacherFor(gender);
}
