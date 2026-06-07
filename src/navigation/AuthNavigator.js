import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen     from '../screens/SplashScreen';
import LandingScreen    from '../screens/LandingScreen';
import LoginScreen      from '../screens/LoginScreen';
import SignupScreen     from '../screens/SignupScreen';
import OTPScreen        from '../screens/OTPScreen';
import SuccessScreen    from '../screens/SuccessScreen';
import OnboardingScreen from '../screens/OnboardingScreen';

const Stack = createNativeStackNavigator();

const AuthNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
    <Stack.Screen name="SplashScreen"     component={SplashScreen}     />
    <Stack.Screen name="LandingScreen"    component={LandingScreen}    />
    <Stack.Screen name="LoginScreen"      component={LoginScreen}      options={{ animation: 'slide_from_right' }} />
    <Stack.Screen name="SignupScreen"     component={SignupScreen}     options={{ animation: 'slide_from_right' }} />
    <Stack.Screen name="OTPScreen"        component={OTPScreen}        options={{ animation: 'slide_from_right' }} />
    <Stack.Screen name="SuccessScreen"    component={SuccessScreen}    options={{ animation: 'slide_from_right' }} />
    <Stack.Screen name="OnboardingScreen" component={OnboardingScreen} options={{ animation: 'slide_from_right' }} />
  </Stack.Navigator>
);

export default AuthNavigator;