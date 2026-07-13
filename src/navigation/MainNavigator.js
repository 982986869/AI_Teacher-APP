import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen      from '../screens/HomeScreen';
import SessionsScreen  from '../screens/SessionsScreen';
import PracticeScreen  from '../screens/PracticeScreen';
import ResourcesScreen from '../screens/ResourcesScreen';
import ResultsScreen   from '../screens/ResultsScreen';
import ProfileScreen   from '../screens/ProfileScreen';
import FloatingDock     from './FloatingDock';


const Tab = createBottomTabNavigator();

const MainNavigator = () => {
  return (
    <Tab.Navigator
      // A gentle cross-fade between tabs so moving Home → Practice → Results → Profile
      // feels like one continuous app, never a hard cut into "another module".
      screenOptions={{ headerShown: false, animation: 'fade' }}
      tabBar={(props) => <FloatingDock {...props} />}
    >
      <Tab.Screen name="Home"      component={HomeScreen} />
      <Tab.Screen name="Sessions"  component={SessionsScreen} />
      <Tab.Screen name="Practice"  component={PracticeScreen} />
      <Tab.Screen name="Resources" component={ResourcesScreen} />
      <Tab.Screen name="Results"   component={ResultsScreen} />
      <Tab.Screen name="Profile"   component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default MainNavigator;
