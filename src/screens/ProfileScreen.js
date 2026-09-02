// src/screens/ProfileScreen.js
// The Profile tab. This file is the CONTAINER — auth wiring, the photo picker, the sound
// setting, and which of the flow's three screens is currently showing. The drawing lives
// in src/screens/profile/: ProfileHome, EditProfileScreen, LearningPreferencesScreen,
// all on the shared light palette in profile/theme.js.
//
// Light reskin, from the Figma flow. It replaces the dark "profile-screen" version, and
// with it the 2x2 stats grid, the badges row and the "Almost there" milestone — the new
// design draws a settings list instead. Those numbers all came from GET
// /api/parent/report, which still serves them; the Achievements row is where they belong
// once there is a screen to draw them on.
//
// Edit Profile and Learning Preferences open as full-screen swaps rather than pushed
// routes — the same pattern HomeScreen uses for the AI Teacher flow, and it keeps
// MainNavigator untouched. The tab dock hides itself while either is open (both designs
// end in their own sticky footer, and two bars stacked would be one too many).
import React, { useCallback, useEffect, useState } from 'react';
import { View, Alert } from 'react-native';
import PolicyModal from '../components/brand/PolicyModal';
import { useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';

import { useAuth } from '../context/AuthContext';
import { deleteAccountApi } from '../api/authApi';
import { useDockVisibility } from '../navigation/DockVisibility';
import { useSupportLauncher } from '../navigation/SupportLauncher';
import { getSoundEnabledAsync, setSoundEnabled } from '../utils/sound';
import { P } from './profile/theme';
import ProfileHome from './profile/ProfileHome';
import EditProfileScreen from './profile/EditProfileScreen';
import LearningPreferencesScreen from './profile/LearningPreferencesScreen';

const APP_VERSION = Constants.expoConfig?.version || Constants.manifest?.version || '1.0.0';

const ProfileScreen = () => {
  const { user, scope, signOut, setActiveView, updateProfile, updatePhoto, isLocked, showLock } = useAuth();
  const navigation = useNavigation();
  // The dock reports its own measured height (see FloatingDock.js). 66 is the fallback
  // for the first frame, before that measurement has come back.
  const { height: dockHeight } = useDockVisibility();
  const { openSupport } = useSupportLauncher();

  // 'home' | 'edit' | 'prefs'
  const [view, setView] = useState('home');

  // The dock is hidden by the screen that wants it hidden — FloatingDock reads
  // tabBarStyle.display off the focused route's options (see FloatingDock.js).
  useEffect(() => {
    navigation.setOptions({ tabBarStyle: view === 'home' ? undefined : { display: 'none' } });
  }, [navigation, view]);

  // Re-tapping the Profile tab backs out of a sub-screen. The old dark screen scrolled
  // its list to the top on this gesture; with three screens behind one tab, "take me
  // back to Profile" is the more useful answer to the same tap.
  useEffect(() => {
    const unsub = navigation.addListener('tabPress', () => {
      if (navigation.isFocused()) setView('home');
    });
    return unsub;
  }, [navigation]);

  const [soundOn, setSoundOn] = useState(true);
  useEffect(() => { getSoundEnabledAsync().then(setSoundOn); }, []);
  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
  };

  // ── photo ──────────────────────────────────────────────────────────────────
  const applyPhoto = async (asset) => {
    try {
      await updatePhoto(asset);
    } catch (_) {
      Alert.alert('Couldn’t update photo', 'Please check your connection and try again.');
    }
  };
  const pickFromLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Photo access needed', 'Allow photo access to choose a picture.'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true, aspect: [1, 1] });
    if (!res.canceled && res.assets?.length) await applyPhoto(res.assets[0]);
  };
  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { Alert.alert('Camera access needed', 'Allow camera access to take a picture.'); return; }
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true, aspect: [1, 1] });
    if (!res.canceled && res.assets?.length) await applyPhoto(res.assets[0]);
  };
  // Resolves when the sheet is done, so the caller can show a spinner over the avatar
  // for as long as the upload actually takes.
  const changePhoto = useCallback(() => new Promise((resolve) => {
    Alert.alert('Profile photo', 'Change your profile photo', [
      { text: 'Take Photo', onPress: () => takePhoto().finally(resolve) },
      { text: 'Choose from Gallery', onPress: () => pickFromLibrary().finally(resolve) },
      { text: 'Cancel', style: 'cancel', onPress: resolve },
    ], { onDismiss: resolve });
  }), []);

  // ── actions ────────────────────────────────────────────────────────────────
  // Straight into the support chat the Help bubble owns, not a mailto — the ticket flow
  // is in the app, and handing the student off to their mail client would drop them out
  // of it. The sheet lives above the tabs, so this only bumps its signal.
  const handleHelp = () => openSupport();

  // Learning Progress IS the Results tab. Navigating there programmatically skips the
  // paywall check the dock does on tabPress (see MainNavigator's `gate`), so the same
  // check has to happen here — otherwise this row is a way around the lock.
  const handleLearningProgress = () => {
    if (isLocked) { showLock(); return; }
    navigation.navigate('Results');
  };
  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => signOut() },
    ]);
  };
  // Two steps on purpose. The outcome here is unusual enough that a single generic
  // "Are you sure?" would mislead: the student is not just signed out, they can never
  // sign in to this account again and have to build a new one. The first alert says
  // that in full; the second is the last chance to back out.
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      'You will be logged out and will not be able to log in to this account again. '
      + 'To use Ailernova later you will need to create a new account.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete account', style: 'destructive', onPress: confirmDeleteAccount },
      ],
    );
  };

  const confirmDeleteAccount = () => {
    Alert.alert('This cannot be undone', 'Delete your account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAccountApi();
          } catch (e) {
            // Nothing was deleted, so say so and stay put rather than signing out —
            // signing out here would look like it worked.
            Alert.alert('Could not delete account', 'Please check your connection and try again.');
            return;
          }
          // Every later request would 401 anyway; signOut also closes the support socket.
          signOut();
        },
      },
    ]);
  };

  // The rows the design draws that have no screen behind them yet. Saying so is the
  // honest answer; silently doing nothing reads as a broken row.
  // The same sheet the sign-up screen uses, so the policy reads identically
  // wherever it is opened from and there is one component to keep correct.
  const PRIVACY_URL = 'https://ailernova.in/privacy-policy/';
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const handlePlaceholder = (label) => {
    Alert.alert(label, 'This is on the way — it isn’t part of the app yet.');
  };

  const profileLine = [scope?.className, scope?.stream ? scope.stream.toUpperCase() : null, scope?.board]
    .filter(Boolean).join('  •  ') || 'Complete your profile';

  if (view === 'edit') {
    return (
      <View style={{ flex: 1, backgroundColor: P.page }}>
        <EditProfileScreen
          user={user}
          scope={scope}
          onBack={() => setView('home')}
          onSave={updateProfile}
          onPickPhoto={changePhoto}
        />
      </View>
    );
  }

  if (view === 'prefs') {
    return (
      <View style={{ flex: 1, backgroundColor: P.page }}>
        <LearningPreferencesScreen
          initial={user?.learningPrefs || null}
          onBack={() => setView('home')}
          onSave={(learningPrefs) => updateProfile({ learningPrefs })}
        />
      </View>
    );
  }

  return (
    <>
      <ProfileHome
        user={user}
        profileLine={profileLine}
        version={APP_VERSION}
        soundOn={soundOn}
        onToggleSound={toggleSound}
        onEditProfile={() => setView('edit')}
        onLearningPreferences={() => setView('prefs')}
        onLearningProgress={handleLearningProgress}
        onHelp={handleHelp}
        onSwitchToParent={() => setActiveView('parent')}
        onLogout={handleLogout}
        onDeleteAccount={handleDeleteAccount}
        onPrivacy={() => setPrivacyOpen(true)}
        onPlaceholder={handlePlaceholder}
        // The dock floats over the tab content, so the list has to end above it.
        bottomInset={(dockHeight || 66) + 8}
      />
      <PolicyModal
        visible={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
        url={PRIVACY_URL}
        title="Privacy Policy"
      />
    </>
  );
};

export default ProfileScreen;
