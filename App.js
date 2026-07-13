import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold,
  Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black,
} from '@expo-google-fonts/nunito';
// TODO: replace mock with real package after running: npm install @react-native-google-signin/google-signin
import { GoogleSignin } from './src/utils/googleSigninMock';

import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { GOOGLE_WEB_CLIENT_ID } from './src/constants/config';


GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });

// Auto-logout on 401 wired via AuthContext + axiosInstance.
export default function App() {
  // Load Nunito app-wide so the Student and Parent experiences share one typographic
  // system. We do NOT block rendering on it — the `T` helper falls back to the system
  // font until Nunito is ready, then swaps in, so a font hiccup can never stall the app.
  useFonts({
    Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold,
    Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black,
  });

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}