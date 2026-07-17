// src/navigation/AdminNavigator.js
// The Admin mode of the Ailernova app — the SAME shape as the Student app: a 6-tab dock
// (Home · Sessions · Tests · Resources · Results · Profile) using the shared FloatingDock
// style, each tab its own native stack. Admin is "the Student app with controls on top",
// not a separate dashboard. Student/parent records live under Results + Profile, not as
// their own primary tabs.
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AdminDock from './AdminDock';
import AdminHomeScreen from '../screens/admin/AdminHomeScreen';
import AdminProfileScreen from '../screens/admin/AdminProfileScreen';
import AdminSoonScreen from '../screens/admin/AdminSoonScreen';
import AdminSessionsScreen from '../screens/admin/sessions/SessionsScreen';
import SessionFormScreen from '../screens/admin/sessions/SessionFormScreen';
import TestsHomeScreen from '../screens/admin/tests/TestsHomeScreen';
import TestDetailScreen from '../screens/admin/tests/TestDetailScreen';
import TestFormScreen from '../screens/admin/tests/TestFormScreen';
import QuestionFormScreen from '../screens/admin/tests/QuestionFormScreen';
import TestPreviewScreen from '../screens/admin/tests/TestPreviewScreen';
import ResourcesHomeScreen from '../screens/admin/resources/ResourcesHomeScreen';
import SubjectResourcesScreen from '../screens/admin/resources/SubjectResourcesScreen';
import ChapterFormScreen from '../screens/admin/resources/ChapterFormScreen';
import ChapterNotesEditor from '../screens/admin/resources/ChapterNotesEditor';
import ChapterContentScreen from '../screens/admin/resources/ChapterContentScreen';
import ChapterQuestionsEditor from '../screens/admin/resources/ChapterQuestionsEditor';
import ChapterMcqEditor from '../screens/admin/resources/ChapterMcqEditor';
import PaperEditorScreen from '../screens/admin/resources/PaperEditorScreen';
import StudentsListScreen from '../screens/admin/people/StudentsListScreen';
import StudentResultsScreen from '../screens/admin/results/StudentResultsScreen';
import ParentsListScreen from '../screens/admin/people/ParentsListScreen';
import ParentProfileScreen from '../screens/admin/people/ParentProfileScreen';

const Tab = createBottomTabNavigator();
const stackOpts = { headerShown: false, animation: 'slide_from_right' };

const HomeStack = createNativeStackNavigator();
function HomeStackNav() {
  return (
    <HomeStack.Navigator screenOptions={stackOpts}>
      <HomeStack.Screen name="AdminHome" component={AdminHomeScreen} />
    </HomeStack.Navigator>
  );
}

const SessionsStack = createNativeStackNavigator();
function SessionsStackNav() {
  return (
    <SessionsStack.Navigator screenOptions={stackOpts}>
      <SessionsStack.Screen name="AdminSessions" component={AdminSessionsScreen} />
      <SessionsStack.Screen name="SessionForm" component={SessionFormScreen} />
    </SessionsStack.Navigator>
  );
}

const TestsStack = createNativeStackNavigator();
function TestsStackNav() {
  return (
    <TestsStack.Navigator screenOptions={stackOpts}>
      <TestsStack.Screen name="TestsHome" component={TestsHomeScreen} />
      <TestsStack.Screen name="TestDetail" component={TestDetailScreen} />
      <TestsStack.Screen name="TestForm" component={TestFormScreen} />
      <TestsStack.Screen name="QuestionForm" component={QuestionFormScreen} />
      <TestsStack.Screen name="TestPreview" component={TestPreviewScreen} />
    </TestsStack.Navigator>
  );
}

const ResourcesStack = createNativeStackNavigator();
function ResourcesStackNav() {
  return (
    <ResourcesStack.Navigator screenOptions={stackOpts}>
      <ResourcesStack.Screen name="ResourcesHome" component={ResourcesHomeScreen} />
      <ResourcesStack.Screen name="SubjectResources" component={SubjectResourcesScreen} />
      <ResourcesStack.Screen name="ChapterForm" component={ChapterFormScreen} />
      <ResourcesStack.Screen name="ChapterContent" component={ChapterContentScreen} />
      <ResourcesStack.Screen name="ChapterNotesEditor" component={ChapterNotesEditor} />
      <ResourcesStack.Screen name="ChapterQuestionsEditor" component={ChapterQuestionsEditor} />
      <ResourcesStack.Screen name="ChapterMcqEditor" component={ChapterMcqEditor} />
      <ResourcesStack.Screen name="PaperEditor" component={PaperEditorScreen} />
    </ResourcesStack.Navigator>
  );
}

// Results = search any student → the EXACT student Results page for that student (the shared
// <ResultsView>, reused verbatim). No separate admin analytics page.
const ResultsStack = createNativeStackNavigator();
function ResultsStackNav() {
  return (
    <ResultsStack.Navigator screenOptions={stackOpts}>
      <ResultsStack.Screen name="ResultsSearch" component={StudentsListScreen} />
      <ResultsStack.Screen name="StudentResults" component={StudentResultsScreen} />
    </ResultsStack.Navigator>
  );
}

const ProfileStack = createNativeStackNavigator();
function ProfileStackNav() {
  return (
    <ProfileStack.Navigator screenOptions={stackOpts}>
      <ProfileStack.Screen name="AdminProfile" component={AdminProfileScreen} />
      <ProfileStack.Screen name="ParentsList" component={ParentsListScreen} />
      <ProfileStack.Screen name="ParentProfile" component={ParentProfileScreen} />
    </ProfileStack.Navigator>
  );
}

export default function AdminNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <AdminDock {...props} />}>
      <Tab.Screen name="Home" component={HomeStackNav} />
      <Tab.Screen name="Sessions" component={SessionsStackNav} />
      <Tab.Screen name="Tests" component={TestsStackNav} />
      <Tab.Screen name="Resources" component={ResourcesStackNav} />
      <Tab.Screen name="Results" component={ResultsStackNav} />
      <Tab.Screen name="Profile" component={ProfileStackNav} />
    </Tab.Navigator>
  );
}
