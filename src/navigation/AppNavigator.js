import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useRuntimeConfig } from '../context/RuntimeConfigContext';
// SplashScreen is the ONE screen that must be ready before anything else, so it is the
// only eager import here.
import SplashScreen from '../screens/SplashScreen';

// Everything below is deferred for the same reason as the tab screens (see
// MainNavigator.js): a top-level import runs while the bundle loads, so importing all
// thirteen destinations meant every cold start paid for the parent app, the admin
// console and the Brain Gym flow — even though this navigator only ever renders ONE of
// them. react-navigation calls getComponent() when the scene renders, so each branch
// now costs nothing until it is actually taken.
const SCREENS = {
  Maintenance:     () => require('../screens/MaintenanceScreen').default,
  ForceUpdate:     () => require('../screens/ForceUpdateScreen').default,
  Auth:            () => require('./AuthNavigator').default,
  Onboarding:      () => require('../screens/OnboardingScreen').default,
  MainApp:         () => require('./MainNavigator').default,
  CompleteProfile: () => require('../screens/CompleteProfileScreen').default,
  ParentApp:       () => require('../screens/parent/ParentApp/ParentApp').default,
  AdminApp:        () => require('./AdminNavigator').default,
};

const Stack = createNativeStackNavigator();

// Hard ceiling on the splash, in case readiness never resolves. This is a safety net,
// NOT the normal path — see SPLASH_MIN_MS below for what actually times a healthy launch.
const SPLASH_FALLBACK = 4000;

// Floor on the splash so a warm start doesn't flash the logo for one frame. The splash
// used to run for a fixed 2.45s (a 2200ms progress sweep plus a 250ms hold) regardless of
// whether the app was ready in 200ms, which put an unconditional ~2.4s in front of every
// launch. Now the bar sweeps for this long and then waits on real readiness.
const SPLASH_MIN_MS = 600;

const AppNavigator = () => {
  const { isAuthenticated, hasOnboarded, loading, user, justLoggedIn, scope, activeView, setActiveView } = useAuth();
  const { maintenance, forceUpdateRequired, isFeatureEnabled } = useRuntimeConfig();
  const isAdmin = scope?.role === 'admin' || user?.role === 'ADMIN' || scope?.tester === true;
  const [showSplash, setShowSplash] = useState(true);
  const [minSplashDone, setMinSplashDone] = useState(false);
  const [gymDone, setGymDone]       = useState(false);   // BrainGym -> Onboarding
  const [workoutDone, setWorkoutDone] = useState(false); // WorkoutWheel -> Home

  const wasAuthed = useRef(isAuthenticated);

  useEffect(() => {
    const min = setTimeout(() => setMinSplashDone(true), SPLASH_MIN_MS);
    const max = setTimeout(() => setShowSplash(false), SPLASH_FALLBACK);
    return () => { clearTimeout(min); clearTimeout(max); };
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

  // The splash now ends on READINESS, not on a fixed animation length: the session has
  // been restored from AsyncStorage (`loading` false) and the floor has passed. `ready`
  // is handed to SplashScreen so the progress bar can finish in step with the app
  // instead of pacing it. SPLASH_FALLBACK above still bounds the worst case.
  if (showSplash) {
    return (
      <SplashScreen
        ready={!loading && minSplashDone}
        onFinish={() => setShowSplash(false)}
      />
    );
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
    screen = <Stack.Screen name="ForceUpdate" getComponent={SCREENS.ForceUpdate} />;
  } else if (maintenance?.enabled && isAuthenticated && !isAdmin) {
    // Maintenance mode allows admins only. Logged-out users still reach Auth so an
    // admin can sign in; a signed-in non-admin gets the maintenance screen.
    screen = <Stack.Screen name="Maintenance" getComponent={SCREENS.Maintenance} />;
  } else if (!isAuthenticated) {
    screen = <Stack.Screen name="Auth" getComponent={SCREENS.Auth} />;
  } else if (!scope.complete) {
    // First-time / migration / Google or email signup: collect role + class/stream
    // before the user can enter ANY part of the app. New users default to `student`
    // with no class, so this also lets a parent/teacher declare their role up front.
    screen = <Stack.Screen name="CompleteProfile" getComponent={SCREENS.CompleteProfile} />;
  } else if (scope.role === 'parent') {
    // Dedicated parent accounts still go straight to their own parent app.
    screen = <Stack.Screen name="ParentApp" getComponent={SCREENS.ParentApp} />;
  } else if (scope.role === 'admin') {
    // Admins get the native Admin mode of the app (a third navigator alongside Student
    // and Parent) — same design system, real /api/admin data. No WebView, no web portal.
    screen = <Stack.Screen name="AdminApp" getComponent={SCREENS.AdminApp} />;
  } else if (scope.role === 'teacher') {
    // Teacher dashboard isn't built yet — a role-ready placeholder (never leaks into the
    // student app). Kept separate from the admin path above.
    screen = (
      <Stack.Screen name="RoleApp">
        {props => {
          const RoleHomeScreen = require('../screens/RoleHomeScreen').default;
          return <RoleHomeScreen {...props} role="teacher" />;
        }}
      </Stack.Screen>
    );
  } else if (activeView == null) {
    // Student hasn't picked a view this login → the "Select your profile" picker
    // (same reusable Parent/Student chooser used before Home). Choice sets activeView.
    screen = (
      <Stack.Screen name="RoleChooser">
        {() => {
          const ProfileSelectScreen = require('../screens/braingym/ProfileSelectScreen').default;
          return <ProfileSelectScreen onSelect={setActiveView} />;
        }}
      </Stack.Screen>
    );
  } else if (activeView === 'parent' && isFeatureEnabled('parentApp')) {
    // Student chose the parent view → parent dashboard about their own progress.
    // Gated by the Parent App feature flag; when off, this falls through to the
    // normal student flow (the parent portal is hidden for students).
    screen = <Stack.Screen name="ParentApp" getComponent={SCREENS.ParentApp} />;
  } else if (justLoggedIn && !gymDone) {
    screen = (
      <Stack.Screen name="BrainGym">
        {props => {
          const BrainGymScreen = require('../screens/BrainGymScreen').default;
          return <BrainGymScreen {...props} onFinish={() => setGymDone(true)} />;
        }}
      </Stack.Screen>
    );
  } else if (!hasOnboarded) {
    screen = <Stack.Screen name="Onboarding" getComponent={SCREENS.Onboarding} />;
  } else if (justLoggedIn && !workoutDone) {
    // Standalone Brain Gym step: Wheel → (Start) → Quiz → (submit/back) → Arena.
    // Leaving the flow advances to Home. Kept separate from the Practice tab.
    screen = (
      <Stack.Screen name="BrainGymFlow">
        {props => {
          const BrainGymFlow = require('../screens/braingym/BrainGymFlow').default;
          return <BrainGymFlow {...props} onFinish={() => setWorkoutDone(true)} />;
        }}
      </Stack.Screen>
    );
  } else {
    screen = <Stack.Screen name="MainApp" getComponent={SCREENS.MainApp} />;
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