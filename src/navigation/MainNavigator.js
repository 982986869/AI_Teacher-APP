import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen      from '../screens/HomeScreen';
import SessionsScreen  from '../screens/SessionsScreen';
import PracticeScreen  from '../screens/PracticeScreen';
import ResourcesScreen from '../screens/ResourcesScreen';
import ResultsScreen   from '../screens/ResultsScreen';
import ProfileScreen   from '../screens/ProfileScreen';


const Tab = createBottomTabNavigator();

const ICONS = {
  Home:      { emoji: '🏠' },
  Sessions:  { emoji: '📅' },
  Practice:  { emoji: '🎯' },
  Resources: { emoji: '📖' },
  Results:   { emoji: '📊' },
  Profile:   { emoji: '👤' },
};

// Active tab gets a filled pill behind the icon (emoji can't be tinted), plus a
// fuller icon; inactive icons are dimmed but still clearly readable.
const TabIcon = ({ name, focused }) => (
  <View style={[st.iconPill, focused && st.iconPillActive]}>
    <Text style={{ fontSize: 19, opacity: focused ? 1 : 0.55 }}>{ICONS[name]?.emoji}</Text>
  </View>
);

const MainNavigator = () => {
  const insets = useSafeAreaInsets();
  // Always clear the device bottom area (home indicator / Android gesture bar).
  const bottomPad = Math.max(insets.bottom, 10);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarActiveTintColor: '#1C1C1E',
        tabBarInactiveTintColor: '#8A8A8E', // darker than before → readable labels
        tabBarLabelStyle: { fontSize: 11, fontWeight: '800', marginTop: 2 },
        tabBarItemStyle: { paddingTop: 6 },
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#E5E5EA',
          borderTopWidth: 1,
          height: 58 + bottomPad,
          paddingBottom: bottomPad,
          paddingTop: 6,
          // lift the bar off the content so it reads as a distinct surface
          elevation: 12,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -2 },
        },
      })}
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

const st = StyleSheet.create({
  iconPill: { width: 46, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  iconPillActive: { backgroundColor: '#F0F0F2' }, // active highlight behind the icon
});

export default MainNavigator;