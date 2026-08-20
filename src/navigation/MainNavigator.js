import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen      from '../screens/HomeScreen';
import SessionsScreen  from '../screens/SessionsScreen';
import PracticeScreen  from '../screens/PracticeScreen';
import ResourcesScreen from '../screens/ResourcesScreen';
import ResultsScreen   from '../screens/ResultsScreen';
import ProfileScreen   from '../screens/ProfileScreen';
import FloatingDock     from './FloatingDock';
import { DockVisibilityProvider, useDockVisibility } from './DockVisibility';
import { SupportLauncherProvider, useSupportLauncher } from './SupportLauncher';
import HelpFab from '../components/support/HelpFab';
import { useRuntimeConfig } from '../context/RuntimeConfigContext';
import { useAuth } from '../context/AuthContext';
import LockSheet from '../components/LockSheet';


const Tab = createBottomTabNavigator();

// The Help bubble floats over every student tab, just above the dock — so it has to sit
// outside the navigator and take its offset from the dock's measured height.
const StudentHelpFab = ({ openSignal }) => {
  const { hidden, height } = useDockVisibility();
  const { user } = useAuth();
  return (
    <HelpFab
      role="student"
      userName={user?.name}
      userPhone={user?.phone}
      hidden={hidden}
      bottom={(height || 66) + 14}
      openSignal={openSignal}
    />
  );
};

// Tabs a free account cannot open. Home and Profile stay reachable — a paywall that
// takes away logout is a trap — and the Brain Gym / Arena flows live outside the tabs
// entirely, so they are unaffected.
const PAID_TABS = ['Sessions', 'Practice', 'Resources', 'Results'];

const StudentTabs = () => {
  const { isFeatureEnabled } = useRuntimeConfig();
  const { isLocked, showLock } = useAuth();

  // Intercepted at the DOCK rather than inside each screen: one place to be right, and
  // the screen never mounts, so it cannot fire the request that the server would refuse
  // anyway. The server gate is still the enforcement — this only saves the round trip
  // and shows the sheet instantly.
  const gate = (name) => ({
    tabPress: (e) => {
      if (isLocked && PAID_TABS.includes(name)) {
        e.preventDefault();
        showLock();
      }
    },
  });

  return (
    <Tab.Navigator
      // A gentle cross-fade between tabs so moving Home → Practice → Results → Profile
      // feels like one continuous app, never a hard cut into "another module".
      screenOptions={{ headerShown: false, animation: 'fade' }}
      tabBar={(props) => <FloatingDock {...props} />}
    >
      <Tab.Screen name="Home"      component={HomeScreen} />
      <Tab.Screen name="Sessions"  component={SessionsScreen}  listeners={gate('Sessions')} />
      {/* Practice / Resources tabs are hidden when their feature flag is off. */}
      {isFeatureEnabled('practice')  && <Tab.Screen name="Practice"  component={PracticeScreen}  listeners={gate('Practice')} />}
      {isFeatureEnabled('resources') && <Tab.Screen name="Resources" component={ResourcesScreen} listeners={gate('Resources')} />}
      <Tab.Screen name="Results"   component={ResultsScreen}   listeners={gate('Results')} />
      <Tab.Screen name="Profile"   component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// Split out of MainNavigator so it can sit INSIDE SupportLauncherProvider and read the
// signal — a provider cannot be consumed by the component that renders it.
const StudentShell = () => {
  const { lockVisible, hideLock } = useAuth();
  // Bumping this opens the support sheet the Help bubble already owns, so there is one
  // support sheet in the tree rather than a second copy behind the lock. The Profile
  // screen's "Help & Support" row bumps the same signal, through the same provider.
  const { openSupport, signal } = useSupportLauncher();

  return (
    <View style={{ flex: 1 }}>
      <StudentTabs />
      <StudentHelpFab openSignal={signal} />
      <LockSheet
        visible={lockVisible}
        onClose={hideLock}
        onRequestAccess={() => { hideLock(); openSupport(); }}
      />
    </View>
  );
};

const MainNavigator = () => (
  <DockVisibilityProvider>
    <SupportLauncherProvider>
      <StudentShell />
    </SupportLauncherProvider>
  </DockVisibilityProvider>
);

export default MainNavigator;
