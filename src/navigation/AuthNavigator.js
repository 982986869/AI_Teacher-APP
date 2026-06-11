import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// All four auth screens are flat in src/screens/ (per your project structure)
import LandingScreen from '../screens/LandingScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import OTPScreen from '../screens/OTPScreen';

const Stack = createNativeStackNavigator();

// ── AuthNavigator: the LOGGED-OUT flow only ─────────────────────────────
//
//   Landing ──Email──► Login ───────────────► login success → signIn()
//        │
//        └──Phone──► Signup ──► OTP ─────────► verify        → signIn()
//
// signIn() (from useAuth) flips isAuthenticated = true. AppNavigator then
// takes over and shows: BrainGym ("You're all set!") → Next → Onboarding
// (survey) → Get Started → completeOnboarding() → Home.
// logout() flips isAuthenticated back to false → AppNavigator returns here
// to LandingScreen.
//
// Note: BrainGym / Onboarding / Home are intentionally NOT registered here —
// they are rendered by AppNavigator based on auth + onboarding state, not by
// navigate(). Login/OTP must call signIn() on success (never navigate to Home).
const AuthNavigator = () => (
  <Stack.Navigator
    initialRouteName="LandingScreen"
    screenOptions={{ headerShown: false }}
  >
    <Stack.Screen name="LandingScreen" component={LandingScreen} />
    <Stack.Screen name="LoginScreen"   component={LoginScreen} />
    <Stack.Screen name="SignupScreen"  component={SignupScreen} />
    <Stack.Screen name="OTPScreen"     component={OTPScreen} />
  </Stack.Navigator>
);

export default AuthNavigator;