import React, { useState } from 'react';

// BrainGym intro sequencer.
// Plays your existing braingym screens in order, then calls onFinish():
//   ProfileSelectScreen  (Select your profile)
//     -> BoosterSplash   (rocket animation, auto-advances via onDone)
//        -> BrainGymIntro (swipe slides; onDone after last slide)
//           -> onFinish() -> AppNavigator advances to WorkoutWheel -> Home
//
// AppNavigator renders <BrainGymScreen onFinish={() => setGymDone(true)} />.
import ProfileSelectScreen from './braingym/ProfileSelectScreen';
import BoosterSplash from './braingym/BoosterSplash';
import BrainGymIntro from './braingym/BrainGymIntro';

const STEPS = { PROFILE: 0, SPLASH: 1, INTRO: 2 };

const BrainGymScreen = ({ onFinish }) => {
  const [step, setStep] = useState(STEPS.PROFILE);
  const [, setRole] = useState(null);

  if (step === STEPS.PROFILE) {
    return (
      <ProfileSelectScreen
        onSelect={(role) => {
          setRole(role);            // 'parent' | 'student'
          setStep(STEPS.SPLASH);    // -> rocket splash
        }}
      />
    );
  }

  if (step === STEPS.SPLASH) {
    return (
      <BoosterSplash
        onDone={() => setStep(STEPS.INTRO)}   // -> intro slides
      />
    );
  }

  // STEPS.INTRO
  return (
    <BrainGymIntro
      onDone={() => onFinish && onFinish()}    // last slide -> finish BrainGym
      onBack={() => setStep(STEPS.PROFILE)}     // back to profile select
    />
  );
};

export default BrainGymScreen;