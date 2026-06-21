// App.js — boots Splash -> Home, and every screen is reached from Home via navigation.
//
// REQUIRES React Navigation. If it's not installed yet, run:
//   npx expo install @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context
//
// Adjust the imports below to match YOUR actual screen files/names.


import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// --- your existing screens (rename/add to match your project) ---
import SplashScreen from './src/screens/SplashScreen';
import HomeScreen from './src/screens/HomeScreen';        // <-- your real home screen
import SessionsScreen from './src/screens/SessionsScreen';
import ResourcesScreen from './src/screens/ResourcesScreen';
import ResultsScreen from './src/screens/ResultsScreen';

// --- new screens for the physics question bank ---
import ChapterListScreen from './src/screens/ChapterListScreen';
import TestQuestionScreen from './src/screens/testQuestionScreen';
import { getQuestions } from './src/data/questionBank';

const Stack = createNativeStackNavigator();

// Chapter list -> navigates to the Test screen with the picked chapter
function PracticeScreen({ navigation }) {
  return (
    <ChapterListScreen
      subject="Physics · Class 11"
      onSelectChapter={(ch) => navigation.navigate('Test', { chapter: ch })}
    />
  );
}

// Test screen -> reads the chosen chapter and loads its questions
function TestScreen({ route, navigation }) {
  const { chapter } = route.params;
  return (
    <TestQuestionScreen
      title={chapter.name}
      bannerText={`Physics · ${chapter.name}`}
      questions={getQuestions(chapter.id)}
      durationSeconds={chapter.count * 60}
      onExit={() => navigation.goBack()}
      onSubmit={(result) => {
        console.log('Test finished:', result);
        navigation.goBack();
      }}
    />
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        {/* Entry */}
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />

        {/* Everything below is reachable from Home via navigation.navigate('Name') */}
        <Stack.Screen name="Practice" component={PracticeScreen} />
        <Stack.Screen name="Test" component={TestScreen} />
        <Stack.Screen name="Sessions" component={SessionsScreen} />
        <Stack.Screen name="Resources" component={ResourcesScreen} />
        <Stack.Screen name="Results" component={ResultsScreen} />
        {/* add any other screens you have the same way */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}