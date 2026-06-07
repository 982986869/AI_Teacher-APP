import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import LoadingSpinner from '../components/LoadingSpinner';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { isAuthenticated, hasOnboarded, loading } = useAuth();

  if (loading) return <LoadingSpinner fullScreen />;

  // Show main app only after both authenticated AND onboarding done
  const showMainApp = isAuthenticated && hasOnboarded;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {showMainApp
          ? <Stack.Screen name="MainApp" component={MainNavigator} />
          : <Stack.Screen name="Auth"    component={AuthNavigator} />
        }
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;