import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import WorkoutWheel from '../WorkoutWheel';
import TimedNumericQuizScreen from './TimedNumericQuizScreen';
import ArenaScreen from './ArenaScreen';

// Self-contained Brain Gym flow: Wheel → (Start) → Quiz → (back) → Wheel, with an
// Arena/leaderboard branch. This is the SAME wiring the old HomeScreen used, but
// extracted into its own component so it stays separate from the team's Practice
// screen. `onFinish` advances the host (AppNavigator's onboarding step → Home).
//
//   class ≤ 5 → Level 1 · class 6–8 → Level 2 · class ≥ 9 → Level 3
const gradeToLevel = (grade) => {
  const n = parseInt(String(grade || '').replace(/\D/g, ''), 10);
  if (!n) return 1;
  if (n <= 5) return 1;
  if (n <= 8) return 2;
  return 3;
};

const BrainGymFlow = ({ onFinish }) => {
  const { user } = useAuth();
  const [step, setStep] = useState('wheel'); // 'wheel' | 'quiz' | 'arena'
  const [skill, setSkill] = useState('reasoning');

  if (step === 'quiz') {
    return (
      <TimedNumericQuizScreen
        level={gradeToLevel(user?.grade)}
        skill={skill}
        onComplete={() => setStep('wheel')}     // finished a quiz → back to the wheel
        onExit={() => onFinish && onFinish()}    // leave Brain Gym → continue to Home
        onViewArena={() => setStep('arena')}     // see leaderboard
      />
    );
  }

  if (step === 'arena') {
    return <ArenaScreen onBack={() => setStep('wheel')} />;
  }

  // step === 'wheel'
  return (
    <WorkoutWheel
      topic="Exponents Basics & Evaluation"
      user={{ name: user?.name || 'Learner', grade: user?.grade || 'G9' }}
      skills={[
        { key: 'reasoning',     label: 'REASONING',     progress: 0.4 },
        { key: 'application',   label: 'APPLICATION',   progress: 0.2 },
        { key: 'understanding', label: 'UNDERSTANDING', progress: 0.7 },
        { key: 'fluency',       label: 'FLUENCY',       progress: 0.55 },
      ]}
      activeTab="workout"
      // Start the spin → land on a skill → open the question/quiz screen.
      onStart={(s) => { setSkill(s?.key || 'reasoning'); setStep('quiz'); }}
      onSelectSkill={() => {}}
      // ARENA tab → leaderboard; any other tab → finish to Home.
      onTabPress={(tab) => {
        if (tab === 'arena') setStep('arena');
        else if (tab !== 'workout') onFinish && onFinish();
      }}
    />
  );
};

export default BrainGymFlow;
