import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';

import HomeScreen      from '../screens/HomeScreen';
import DashboardScreen from '../screens/DashboardScreen';
import CourseScreen    from '../screens/CourseScreen';
import ProfileScreen   from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home:     { active: '🏠', inactive: '🏠' },
  Sessions: { active: '📅', inactive: '📅' },
  Practice: { active: '🎯', inactive: '🎯' },
  Results:  { active: '📊', inactive: '📊' },
  Explore:  { active: '🔍', inactive: '🔍' },
  Profile:  { active: '👤', inactive: '👤' },
};

const tabIcon = (name) => ({ focused, color }) => (
  <Text style={{ fontSize: 20 }}>{TAB_ICONS[name]?.active}</Text>
);

const MainNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#7c3aed',
      tabBarInactiveTintColor: '#aaa',
      tabBarLabelStyle: { fontSize: 11, fontWeight: '500', marginBottom: 2 },
      tabBarStyle: {
        borderTopColor: '#f0f0f0',
        height: 64,
        paddingBottom: 8,
        paddingTop: 6,
        backgroundColor: '#fff',
      },
    }}
  >
    <Tab.Screen name="Home"     component={HomeScreen}      options={{ tabBarIcon: tabIcon('Home') }} />
    <Tab.Screen name="Sessions" component={DashboardScreen} options={{ tabBarIcon: tabIcon('Sessions') }} />
    <Tab.Screen name="Practice" component={CourseScreen}    options={{ tabBarIcon: tabIcon('Practice') }} />
    <Tab.Screen name="Results"  component={DashboardScreen} options={{ tabBarIcon: tabIcon('Results') }} />
    <Tab.Screen name="Explore"  component={CourseScreen}    options={{ tabBarIcon: tabIcon('Explore') }} />
    <Tab.Screen name="Profile"  component={ProfileScreen}   options={{ tabBarIcon: tabIcon('Profile') }} />
  </Tab.Navigator>
);

export default MainNavigator;