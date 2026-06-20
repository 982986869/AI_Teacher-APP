import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import SplashScreen from '../screens/SplashScreen';
import AuthNavigator from './AuthNavigator';
import BrainGymScreen from '../screens/BrainGymScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import BrainGymFlow from '../screens/braingym/BrainGymFlow';
import MainNavigator from './MainNavigator';

const Stack = createNativeStackNavigator();
const SPLASH_FALLBACK = 4000;

const AppNavigator = () => {
  const { isAuthenticated, hasOnboarded, loading, user, justLoggedIn } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [gymDone, setGymDone]       = useState(false);   // BrainGym -> Onboarding
  const [workoutDone, setWorkoutDone] = useState(false); // WorkoutWheel -> Home

  const wasAuthed = useRef(isAuthenticated);

  // TEMP DEBUG — remove once confirmed.
  console.log('NAV STATE →', { loading, showSplash, isAuthenticated, hasOnboarded, justLoggedIn, gymDone, workoutDone });

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), SPLASH_FALLBACK);
    return () => clearTimeout(t);
  }, []);

  // Reset the per-session steps ONLY on a fresh login (false -> true) and on logout.
  // On a plain reload, isAuthenticated is already true, so this won't re-trigger them.
  useEffect(() => {
    if (isAuthenticated && !wasAuthed.current) {
      setGymDone(false);
      setWorkoutDone(false);
    }
    if (!isAuthenticated) {
      setGymDone(false);
      setWorkoutDone(false);
    }
    wasAuthed.current = isAuthenticated;
  }, [isAuthenticated]);

  if (loading || showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // Flow:
  //   not signed in   -> Auth (Landing/Login/OTP)
  //   !gymDone         -> BrainGym ("You're all set!")
  //   !hasOnboarded    -> Onboarding (survey)
  //   !workoutDone     -> WorkoutWheel   <-- after Onboarding
  //   else             -> Home
  let screen;
  if (!isAuthenticated) {
    screen = <Stack.Screen name="Auth" component={AuthNavigator} />;
  } else if (justLoggedIn && !gymDone) {
    screen = (
      <Stack.Screen name="BrainGym">
        {props => <BrainGymScreen {...props} onFinish={() => setGymDone(true)} />}
      </Stack.Screen>
    );
  } else if (!hasOnboarded) {
    screen = <Stack.Screen name="Onboarding" component={OnboardingScreen} />;
  } else if (justLoggedIn && !workoutDone) {
    // Standalone Brain Gym step: Wheel → (Start) → Quiz → (submit/back) → Arena.
    // Leaving the flow advances to Home. Kept separate from the Practice tab.
    screen = (
      <Stack.Screen name="BrainGymFlow">
        {props => <BrainGymFlow {...props} onFinish={() => setWorkoutDone(true)} />}
      </Stack.Screen>
    );
  } else {
    screen = <Stack.Screen name="MainApp" component={MainNavigator} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {screen}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;