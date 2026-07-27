import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useRuntimeConfig } from '../context/RuntimeConfigContext';
import SplashScreen from '../screens/SplashScreen';
import MaintenanceScreen from '../screens/MaintenanceScreen';
import ForceUpdateScreen from '../screens/ForceUpdateScreen';
import AuthNavigator from './AuthNavigator';
import BrainGymScreen from '../screens/BrainGymScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import BrainGymFlow from '../screens/braingym/BrainGymFlow';
import MainNavigator from './MainNavigator';
import CompleteProfileScreen from '../screens/CompleteProfileScreen';
import ParentApp from '../screens/parent/ParentApp/ParentApp';
import RoleHomeScreen from '../screens/RoleHomeScreen';
import AdminNavigator from './AdminNavigator';
import ProfileSelectScreen from '../screens/braingym/ProfileSelectScreen';

const Stack = createNativeStackNavigator();
const SPLASH_FALLBACK = 4000;

const AppNavigator = () => {
  const { isAuthenticated, hasOnboarded, loading, user, justLoggedIn, scope, activeView, setActiveView } = useAuth();
  const { maintenance, forceUpdateRequired, isFeatureEnabled } = useRuntimeConfig();
  const isAdmin = scope?.role === 'admin' || user?.role === 'ADMIN' || scope?.tester === true;
  const [showSplash, setShowSplash] = useState(true);
  const [gymDone, setGymDone]       = useState(false);   // BrainGym -> Onboarding
  const [workoutDone, setWorkoutDone] = useState(false); // WorkoutWheel -> Home

  const wasAuthed = useRef(isAuthenticated);

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

  // Flow (order matters — profile setup gates EVERYTHING):
  //   not signed in    -> Auth (Landing/Login/OTP)
  //   !scope.complete  -> CompleteProfile (role + class/stream/board/language)
  //   role parent      -> ParentApp (read-only dashboard)
  //   role teacher/admin -> RoleApp (teacher dashboard)
  //   student (same login, dual view via activeView):
  //     activeView null   -> RoleChooser (Student / Parent)
  //     activeView parent -> ParentApp (parent dashboard about their OWN progress)
  //     activeView student:
  //       !gymDone        -> BrainGym ("You're all set!")
  //       !hasOnboarded   -> Onboarding (survey)
  //       !workoutDone    -> WorkoutWheel
  //       else            -> Home
  let screen;
  if (forceUpdateRequired) {
    // Installed version is below the required minimum and force-update is on — block
    // everyone (even before auth) until they update.
    screen = <Stack.Screen name="ForceUpdate" component={ForceUpdateScreen} />;
  } else if (maintenance?.enabled && isAuthenticated && !isAdmin) {
    // Maintenance mode allows admins only. Logged-out users still reach Auth so an
    // admin can sign in; a signed-in non-admin gets the maintenance screen.
    screen = <Stack.Screen name="Maintenance" component={MaintenanceScreen} />;
  } else if (!isAuthenticated) {
    screen = <Stack.Screen name="Auth" component={AuthNavigator} />;
  } else if (!scope.complete) {
    // First-time / migration / Google or email signup: collect role + class/stream
    // before the user can enter ANY part of the app. New users default to `student`
    // with no class, so this also lets a parent/teacher declare their role up front.
    screen = <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} />;
  } else if (scope.role === 'parent') {
    // Dedicated parent accounts still go straight to their own parent app.
    screen = <Stack.Screen name="ParentApp" component={ParentApp} />;
  } else if (scope.role === 'admin') {
    // Admins get the native Admin mode of the app (a third navigator alongside Student
    // and Parent) — same design system, real /api/admin data. No WebView, no web portal.
    screen = <Stack.Screen name="AdminApp" component={AdminNavigator} />;
  } else if (scope.role === 'teacher') {
    // Teacher dashboard isn't built yet — a role-ready placeholder (never leaks into the
    // student app). Kept separate from the admin path above.
    screen = (
      <Stack.Screen name="RoleApp">
        {props => <RoleHomeScreen {...props} role="teacher" />}
      </Stack.Screen>
    );
  } else if (activeView == null) {
    // Student hasn't picked a view this login → the "Select your profile" picker
    // (same reusable Parent/Student chooser used before Home). Choice sets activeView.
    screen = (
      <Stack.Screen name="RoleChooser">
        {() => <ProfileSelectScreen onSelect={setActiveView} />}
      </Stack.Screen>
    );
  } else if (activeView === 'parent' && isFeatureEnabled('parentApp')) {
    // Student chose the parent view → parent dashboard about their own progress.
    // Gated by the Parent App feature flag; when off, this falls through to the
    // normal student flow (the parent portal is hidden for students).
    screen = <Stack.Screen name="ParentApp" component={ParentApp} />;
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