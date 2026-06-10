import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, Platform } from 'react-native';

import HomeScreen      from '../screens/HomeScreen';
import SessionsScreen  from '../screens/SessionsScreen';
import PracticeScreen  from '../screens/PracticeScreen';
import ResourcesScreen from '../screens/ResourcesScreen';
import ResultsScreen   from '../screens/ResultsScreen';
import ExploreScreen   from '../screens/ExploreScreen';
import ProfileScreen   from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const ICONS = {
  Home:      { emoji: '🏠' },
  Sessions:  { emoji: '📅' },
  Practice:  { emoji: '🎯' },
  Resources: { emoji: '📖' },
  Results:   { emoji: '📊' },
  Explore:   { emoji: '🔍' },
  Profile:   { emoji: '👤' },
};

const TabIcon = ({ name, focused }) => (
  <View style={{ alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ fontSize: 19, opacity: focused ? 1 : 0.4 }}>{ICONS[name]?.emoji}</Text>
  </View>
);

const MainNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
      tabBarActiveTintColor: '#1C1C1E',
      tabBarInactiveTintColor: '#C7C7CC',
      tabBarLabelStyle: {
        fontSize: 10,
        fontWeight: '700',
        marginBottom: Platform.OS === 'ios' ? 0 : 4,
      },
      tabBarStyle: {
        borderTopColor: '#F0F0F0',
        borderTopWidth: 1.5,
        height: Platform.OS === 'ios' ? 82 : 64,
        paddingBottom: Platform.OS === 'ios' ? 20 : 8,
        paddingTop: 8,
        backgroundColor: '#fff',
        elevation: 0,
        shadowOpacity: 0,
      },
    })}
  >
    <Tab.Screen name="Home"      component={HomeScreen} />
    <Tab.Screen name="Sessions"  component={SessionsScreen} />
    <Tab.Screen name="Practice"  component={PracticeScreen} />
    <Tab.Screen name="Resources" component={ResourcesScreen} />
    <Tab.Screen name="Results"   component={ResultsScreen} />
    <Tab.Screen name="Explore"   component={ExploreScreen} />
    <Tab.Screen name="Profile"   component={ProfileScreen} />
  </Tab.Navigator>
);

export default MainNavigator;