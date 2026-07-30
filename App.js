import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold,
  Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black,
} from '@expo-google-fonts/nunito';
import { AuthProvider } from './src/context/AuthContext';
import { RuntimeConfigProvider } from './src/context/RuntimeConfigContext';
import AppNavigator from './src/navigation/AppNavigator';

// Google Sign-In configures itself lazily on first use (see utils/googleSignin).
// Doing it here at module scope would run native code during app startup, which
// crashes in Expo Go before any screen renders.

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
        <RuntimeConfigProvider>
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
          <AppNavigator />
        </RuntimeConfigProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}