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
import HelpFab from '../components/support/HelpFab';
import { useRuntimeConfig } from '../context/RuntimeConfigContext';
import { useAuth } from '../context/AuthContext';


const Tab = createBottomTabNavigator();

// The Help bubble floats over every student tab, just above the dock — so it has to sit
// outside the navigator and take its offset from the dock's measured height.
const StudentHelpFab = () => {
  const { hidden, height } = useDockVisibility();
  const { user } = useAuth();
  return (
    <HelpFab
      role="student"
      userName={user?.name}
      userPhone={user?.phone}
      hidden={hidden}
      bottom={(height || 66) + 14}
    />
  );
};

const StudentTabs = () => {
  const { isFeatureEnabled } = useRuntimeConfig();
  return (
    <Tab.Navigator
      // A gentle cross-fade between tabs so moving Home → Practice → Results → Profile
      // feels like one continuous app, never a hard cut into "another module".
      screenOptions={{ headerShown: false, animation: 'fade' }}
      tabBar={(props) => <FloatingDock {...props} />}
    >
      <Tab.Screen name="Home"      component={HomeScreen} />
      <Tab.Screen name="Sessions"  component={SessionsScreen} />
      {/* Practice / Resources tabs are hidden when their feature flag is off. */}
      {isFeatureEnabled('practice')  && <Tab.Screen name="Practice"  component={PracticeScreen} />}
      {isFeatureEnabled('resources') && <Tab.Screen name="Resources" component={ResourcesScreen} />}
      <Tab.Screen name="Results"   component={ResultsScreen} />
      <Tab.Screen name="Profile"   component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const MainNavigator = () => (
  <DockVisibilityProvider>
    <View style={{ flex: 1 }}>
      <StudentTabs />
      <StudentHelpFab />
    </View>
  </DockVisibilityProvider>
);

export default MainNavigator;
