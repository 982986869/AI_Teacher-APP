import React, { useState } from 'react';

// BrainGym intro sequencer.
// Plays your existing braingym screens in order, then calls onFinish():
//   BoosterSplash   (rocket animation, auto-advances via onDone)
//     -> BrainGymIntro (swipe slides; onDone after last slide)
//        -> onFinish() -> AppNavigator advances to WorkoutWheel -> Home
//
// AppNavigator renders <BrainGymScreen onFinish={() => setGymDone(true)} />.
//
// It used to open on ProfileSelectScreen as well, which asked "Select your
// profile" a SECOND time: AppNavigator only reaches this screen once activeView
// is set, and activeView is set by that same picker one branch earlier. The
// second answer went into a state whose getter was discarded — `const [,
// setRole]` — so it changed nothing either. Removed rather than wired up,
// because the question is already answered by the time we get here.
import BoosterSplash from './braingym/BoosterSplash';
import BrainGymIntro from './braingym/BrainGymIntro';

const STEPS = { SPLASH: 0, INTRO: 1 };

const BrainGymScreen = ({ onFinish }) => {
  const [step, setStep] = useState(STEPS.SPLASH);

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
      onDone={() => onFinish && onFinish()}   // last slide -> finish BrainGym
      // No onBack: with the profile step gone there is nothing before this. Backing
      // into the splash would replay the rocket and auto-advance straight back here,
      // and BrainGymIntro already treats a missing onBack as "no previous screen".
    />
  );
};

export default BrainGymScreen;
