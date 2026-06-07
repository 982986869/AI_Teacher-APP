import React from 'react';
import { StatusBar } from 'react-native';
// TODO: replace mock with real package after running: npm install @react-native-google-signin/google-signin
import { GoogleSignin } from './src/utils/googleSigninMock';

import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { GOOGLE_WEB_CLIENT_ID } from './src/constants/config';

GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });

export default function App() {
  return (
    <AuthProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <AppNavigator />
    </AuthProvider>
  );
}