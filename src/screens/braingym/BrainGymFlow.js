import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { initSounds, play, stopAll } from '../../utils/sound';
import WorkoutWheel from '../WorkoutWheel';
import TimedNumericQuizScreen from './TimedNumericQuizScreen';
import ArenaScreen from './ArenaScreen';
import ArenaWheel from './ArenaWheel';
import ArenaBattle from './ArenaBattle';
import ArenaRectBattle from './ArenaRectBattle';
import ArenaFlipBattle from './ArenaFlipBattle';
import ArenaStickBattle from './ArenaStickBattle';
import PracticeDartboard from './PracticeDartboard';
import PracticeTileGame from './PracticeTileGame';
import PracticeReward from './PracticeReward';

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
  const [step, setStep] = useState('wheel'); // wheel|quiz|arena|sticky|leaderboard|practice|practiceGame|practiceReward
  const [skill, setSkill] = useState('reasoning');
  const [practicePts, setPracticePts] = useState(5);
  const [rewardTab, setRewardTab] = useState('practice'); // where the reward returns to

  // Preload the premium sound set once, play a soft transition on entering BrainGym,
  // and stop every sound automatically when the whole flow unmounts (screen exit).
  useEffect(() => {
    initSounds();
    play('whoosh');
    return () => { stopAll(); };
  }, []);

  // Tabs LOOP inside Brain Gym: Workout (wheel) · Practice (dartboard) · Arena (hub).
  const handleTab = (tab) => {
    if (tab === 'arena') setStep('arena');
    else if (tab === 'practice') setStep('practice');
    else setStep('wheel'); // workout
  };

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

  // Arena tab → the Cuemath-style game wheel. START → live 1v1 battle flow.
  if (step === 'arena') {
    return (
      <ArenaWheel
        onBack={() => setStep('wheel')}
        onStartGame={(gameKey) => {
          if (gameKey === 'strategy') setStep('rectbattle');     // dots → Rectangle It
          else if (gameKey === 'sticks') setStep('arenaSticks'); // Matchsticks puzzle
          else setStep('flipbattle');                            // logic → Flip It Up
        }}
        onTabPress={handleTab}
      />
    );
  }
  // Arena · STRATEGY → Rectangle It (best-of-3 dot duel vs a live opponent).
  if (step === 'rectbattle') {
    return <ArenaRectBattle onExit={() => setStep('arena')} onTabPress={handleTab} />;
  }
  // Arena · MATCHSTICKS → Cuemath-style stick puzzle (self-contained: how-to → game
  // → reward). Replaces the old falling-tiles game here; the tiles game still lives in
  // the Practice tab below.
  if (step === 'arenaSticks') {
    return <ArenaStickBattle onExit={() => setStep('arena')} onTabPress={handleTab} />;
  }
  // Arena · LOGIC → Flip It Up (Lights Out puzzle).
  if (step === 'flipbattle') {
    return <ArenaFlipBattle onExit={() => setStep('arena')} onTabPress={handleTab} />;
  }
  // (legacy) No Attack duel — kept for a future wheel segment.
  if (step === 'battle') {
    return <ArenaBattle onExit={() => setStep('arena')} />;
  }
  // Leaderboard is reached from the wheel's top trophy icon.
  if (step === 'leaderboard') {
    return <ArenaScreen onBack={() => setStep('wheel')} />;
  }

  // Practice tab → numbered dartboard landing → (tap centre) → math-tile game.
  if (step === 'practice') {
    return (
      <PracticeDartboard
        activeTab="practice"
        onTabPress={handleTab}
        onBack={() => setStep('wheel')}
        onPlay={() => setStep('practiceGame')}
      />
    );
  }
  if (step === 'practiceGame') {
    return (
      <PracticeTileGame
        skill="fluency"
        level={2}
        onExit={() => setStep('practice')}
        onGameOver={(score) => { setPracticePts(Math.max(5, score)); setRewardTab('practice'); setStep('reward'); }}
      />
    );
  }
  // Game over → +points burst → daily streak → back to the launching wheel (auto).
  if (step === 'reward') {
    return <PracticeReward points={practicePts} activeTab={rewardTab} onTabPress={handleTab} onDone={() => setStep(rewardTab)} />;
  }

  // step === 'wheel'
  return (
    <WorkoutWheel
      topic="Exponents Basics & Evaluation"
      user={{ name: user?.name || 'Learner', grade: user?.grade || 'G9' }}
      skills={[
        { key: 'reasoning',     label: 'REASONING',     progress: 0.4,  topic: 'Exponent Patterns & Logic' },
        { key: 'application',   label: 'APPLICATION',   progress: 0.2,  topic: 'Exponents in Word Problems' },
        { key: 'understanding', label: 'UNDERSTANDING', progress: 0.7,  topic: 'Laws of Exponents — Concepts' },
        { key: 'fluency',       label: 'FLUENCY',       progress: 0.55, topic: 'Exponents Basics & Evaluation' },
      ]}
      activeTab="workout"
      // Clean exit back to Home (works for the home-opened overlay too).
      onBack={() => onFinish && onFinish()}
      onLeaderboard={() => setStep('leaderboard')}
      // Tap a skill wedge to select it → centre START opens that skill's quiz.
      onStart={(s) => { setSkill(s?.key || 'reasoning'); setStep('quiz'); }}
      // Tabs LOOP inside Brain Gym (use the wheel's back button to exit to Home).
      onTabPress={handleTab}
    />
  );
};

export default BrainGymFlow;
