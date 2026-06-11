import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import SplashScreen from '../screens/SplashScreen';
import AuthNavigator from './AuthNavigator';
import BrainGymScreen from '../screens/BrainGymScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import MainNavigator from './MainNavigator';

const Stack = createNativeStackNavigator();
const SPLASH_FALLBACK = 4000;

const AppNavigator = () => {
  const { isAuthenticated, hasOnboarded, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [gymDone, setGymDone]       = useState(false);

  // Track previous auth so we can reset BrainGym exactly when login happens.
  const wasAuthed = useRef(isAuthenticated);

  // TEMP DEBUG — remove once confirmed.
  console.log('NAV STATE →', { loading, showSplash, isAuthenticated, hasOnboarded, gymDone });

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), SPLASH_FALLBACK);
    return () => clearTimeout(t);
  }, []);

  // Reset BrainGym on the false->true (login) transition AND on logout.
  useEffect(() => {
    if (isAuthenticated && !wasAuthed.current) {
      setGymDone(false); // just logged in -> show BrainGym
    }
    if (!isAuthenticated) {
      setGymDone(false); // logged out -> reset for next time
    }
    wasAuthed.current = isAuthenticated;
  }, [isAuthenticated]);

  if (loading || showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  let screen;
  if (!isAuthenticated) {
    screen = <Stack.Screen name="Auth" component={AuthNavigator} />;
  } else if (!gymDone) {
    screen = (
      <Stack.Screen name="BrainGym">
        {props => <BrainGymScreen {...props} onFinish={() => setGymDone(true)} />}
      </Stack.Screen>
    );
  } else if (!hasOnboarded) {
    screen = <Stack.Screen name="Onboarding" component={OnboardingScreen} />;
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