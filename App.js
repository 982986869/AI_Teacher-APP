import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold,
  Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black,
} from '@expo-google-fonts/nunito';
import {
  Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold,
  Manrope_700Bold, Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
// Sora (headings) + Inter (UI/body) — the pair the new dark "Ask the Material"
// screens are designed in (src/screens/KnowledgeAskScreen.js).
// Imported PER WEIGHT, not from the package root: the root index re-requires every
// weight (Inter ships 36 of them, italics included), so a barrel import bundles a
// megabyte of fonts we never render — and makes one unresolved weight break the
// whole app instead of just itself.
import { Sora_600SemiBold } from '@expo-google-fonts/sora/600SemiBold';
import { Sora_700Bold } from '@expo-google-fonts/sora/700Bold';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
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
  // Manrope (body/UI) + Poppins (headings) back the AILERNOVA design system
  // (src/theme/designSystem.js), which screens adopt one at a time — Splash and
  // Landing are on it so far.
  useFonts({
    Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold,
    Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black,
    Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold,
    Manrope_700Bold, Manrope_800ExtraBold,
    Poppins_600SemiBold, Poppins_700Bold,
    Sora_600SemiBold, Sora_700Bold,
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
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