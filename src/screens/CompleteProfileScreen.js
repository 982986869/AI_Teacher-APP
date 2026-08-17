// src/screens/CompleteProfileScreen.js
// Profile setup shown once after signup/login when the profile is incomplete
// (scope.complete === false). Single-page form on the shared night palette
// (src/theme/nightTheme.js), matching the auth screens:
//
//   header ("Complete Your Profile" + sub) → avatar uploader → one card holding
//   role · name · grade · [stream] · school · board · language · favourite subject
//   · learning goal → Continue.
//
// This replaced a five-step white wizard (role → class → stream → board → language).
// Same data, one screen. Fields kept from that wizard even though the mockup omits
// them, because dropping them would silently degrade the product:
//   • role       — this is the ONLY place in the app that sets accountType, so
//                  without it nobody can register as a parent or teacher.
//   • stream     — scope.complete is false for a class 11/12 student with no stream,
//                  so omitting it would trap those users on this screen forever.
//                  Shown only for 11/12, exactly when the server requires it.
//   • board      — drives syllabus/paper matching.
//   • language   — the language the AI Teacher explains in.
//
// The backend is the authority: PATCH /api/auth/profile accepts grade, board,
// stream, language, school and accountType. Name, photo, favourite subject and
// learning goal have NO server column yet, so they persist on-device via
// saveProfileExtras() — see the note there.
import React, { useMemo, useState, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, StatusBar, ScrollView,
  Image, Modal, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import {
  Camera, User, GraduationCap, School, BookOpen, Languages, Landmark,
  ChevronDown, Check,
} from 'lucide-react-native';
import {
  useFonts as useAuroraFonts,
  SpaceGrotesk_400Regular, SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';

import { useAuth } from '../context/AuthContext';
import { useRuntimeConfig } from '../context/RuntimeConfigContext';
import { normalizeClass, subjectsFor } from '../utils/personalization';
import { getProfileExtras, saveProfileExtras } from '../utils/storage';
import { N, NFONT } from '../theme/nightTheme';
import { NightBg, Appear } from '../theme/nightChrome';

const ROLES = [
  { key: 'student', label: 'Student' },
  { key: 'parent',  label: 'Parent' },
  { key: 'teacher', label: 'Teacher' },
];
const CLASSES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const STREAMS = [
  { key: 'PCM',      label: 'PCM',  sub: 'Physics · Chemistry · Maths' },
  { key: 'PCB',      label: 'PCB',  sub: 'Physics · Chemistry · Biology' },
  { key: 'PCMB',     label: 'PCMB', sub: 'All four subjects' },
  { key: 'Commerce', label: 'Commerce', sub: 'Accounts · Business · Eco' },
  { key: 'Arts',     label: 'Arts / Humanities', sub: 'History · Pol Sci · Geo' },
];
const BOARDS = ['CBSE', 'ICSE', 'State Board', 'Other'];
const LANGS = ['English', 'Hindi', 'Hinglish'];

// ── a tappable row that opens the option sheet ──────────────────────────────
function SelectRow({ icon, value, placeholder, onPress, F, error }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={value ? `${placeholder}: ${value}` : placeholder}
      style={({ pressed }) => [s.row, error && s.rowError, pressed && s.rowPressed]}
    >
      {icon}
      <Text
        numberOfLines={1}
        style={[s.rowText, { fontFamily: F.reg }, !value && s.rowPlaceholder]}
      >
        {value || placeholder}
      </Text>
      <ChevronDown size={20} color={N.inkSoft} strokeWidth={2} />
    </Pressable>
  );
}

// ── bottom sheet of options ─────────────────────────────────────────────────
function OptionSheet({ open, title, options, selected, onPick, onClose, F, insetBottom }) {
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.sheetBackdrop} onPress={onClose} accessibilityLabel="Close" />
      <View style={[s.sheet, { paddingBottom: insetBottom + 16 }]}>
        <View style={s.sheetGrab} />
        <Text style={[s.sheetTitle, { fontFamily: F.bold }]}>{title}</Text>
        <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
          {options.map((o) => {
            const sel = selected === o.key;
            return (
              <Pressable
                key={o.key}
                onPress={() => { onPick(o.key); onClose(); }}
                accessibilityRole="button"
                accessibilityState={{ selected: sel }}
                style={({ pressed }) => [s.sheetItem, sel && s.sheetItemSel, pressed && s.rowPressed]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[s.sheetItemText, { fontFamily: F.med }, sel && { color: N.ink }]}>{o.label}</Text>
                  {!!o.sub && <Text style={[s.sheetItemSub, { fontFamily: F.reg }]}>{o.sub}</Text>}
                </View>
                {sel && <Check size={18} color={N.violet} strokeWidth={2.5} />}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function CompleteProfileScreen() {
  const { scope, user, updateProfile } = useAuth();
  const { supportedClasses } = useRuntimeConfig();
  const [fontsLoaded] = useAuroraFonts({
    SpaceGrotesk_400Regular, SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold,
  });
  const F = fontsLoaded ? NFONT : { reg: undefined, med: undefined, semi: undefined, bold: undefined };
  const insets = useSafeAreaInsets();

  const [role, setRole]     = useState(ROLES.some(r => r.key === scope?.role) ? scope.role : 'student');
  const [name, setName]     = useState(user?.name || '');
  const [klass, setKlass]   = useState(scope?.classNum ? String(scope.classNum) : null);
  const [stream, setStream] = useState(scope?.stream ? scope.stream.toUpperCase() : null);
  const [school, setSchool] = useState(user?.school || '');
  const [board, setBoard]   = useState(user?.board || null);
  const [language, setLanguage] = useState(user?.language || null);
  const [subject, setSubject]   = useState(null);
  const [goal, setGoal]     = useState('');
  const [photo, setPhoto]   = useState(null);

  const [sheet, setSheet]   = useState(null); // 'grade' | 'stream' | 'board' | 'language' | 'subject'
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  // Repopulate the fields the server can't store yet.
  useEffect(() => {
    let alive = true;
    getProfileExtras().then((x) => {
      if (!alive || !x) return;
      if (x.photoUri) setPhoto(x.photoUri);
      if (x.favouriteSubject) setSubject(x.favouriteSubject);
      if (x.goal) setGoal(x.goal);
      if (x.displayName && !user?.name) setName(x.displayName);
    });
    return () => { alive = false; };
  }, [user?.name]);

  const isStudent = role === 'student';
  const classNum = normalizeClass(klass);
  const senior = isStudent && classNum >= 11;

  // Restrict the grade list to admin-configured supported classes. Fail-open (show
  // all) when config hasn't loaded, and always keep the current selection visible so
  // an already-chosen class is never hidden.
  const supportedSet = (supportedClasses && supportedClasses.length) ? supportedClasses : null;
  const shownClasses = supportedSet
    ? CLASSES.filter((c) => supportedSet.includes(parseInt(c, 10)) || c === klass)
    : CLASSES;

  const subjectOptions = useMemo(
    () => subjectsFor(classNum, stream).map((x) => ({ key: x, label: x })),
    [classNum, stream],
  );

  const pickPhoto = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Photos permission needed', 'Allow photo access to pick a profile picture.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!res.canceled && res.assets?.[0]?.uri) setPhoto(res.assets[0].uri);
    } catch (e) {
      Alert.alert('Could not open photos', e?.message || 'Please try again.');
    }
  };

  const missing = () => {
    if (!isStudent) return null;
    if (!klass) return 'Please select your grade.';
    if (senior && !stream) return 'Please select your stream — it decides your subjects for Class 11–12.';
    return null;
  };

  const save = async () => {
    if (saving) return;
    const m = missing();
    if (m) return setError(m);
    setError('');
    setSaving(true);
    try {
      const patch = { accountType: role };
      if (isStudent) {
        patch.grade = `Class ${classNum}`;
        patch.stream = senior ? stream : '';
        patch.board = board || undefined;
        patch.language = language || undefined;
        patch.school = school.trim() || undefined;
      }
      await updateProfile(patch);
      // Fields with no server column — keep them on-device rather than discarding.
      await saveProfileExtras({
        photoUri: photo || undefined,
        displayName: name.trim() || undefined,
        favouriteSubject: subject || undefined,
        goal: goal.trim() || undefined,
      });
      // Navigation re-evaluates automatically once scope.complete flips true.
    } catch (e) {
      setError(e?.response?.data?.error || e?.response?.data?.message || e.message || 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const sheets = {
    grade:    { title: 'Select Grade', options: shownClasses.map(c => ({ key: c, label: `Class ${c}` })), selected: klass,
                onPick: (c) => { setKlass(c); setError(''); if (normalizeClass(c) < 11) setStream(null); setSubject(null); } },
    stream:   { title: 'Select Stream', options: STREAMS, selected: stream,
                onPick: (v) => { setStream(v); setError(''); setSubject(null); } },
    board:    { title: 'Select Board', options: BOARDS.map(b => ({ key: b, label: b })), selected: board, onPick: setBoard },
    language: { title: 'Preferred Language', options: LANGS.map(l => ({ key: l, label: l })), selected: language, onPick: setLanguage },
    subject:  { title: 'Favourite Subject', options: subjectOptions, selected: subject, onPick: setSubject },
  };
  const activeSheet = sheet ? sheets[sheet] : null;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={N.bgTop} translucent={false} />
      <NightBg id="cp" />

      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Appear delay={40} style={s.center}>
            <Text style={[s.heading, { fontFamily: F.bold }]}>Complete Your Profile</Text>
            <Text style={[s.sub, { fontFamily: F.reg }]}>
              Tell us a bit about yourself to customize your tutor
            </Text>
          </Appear>

          {/* Avatar uploader */}
          <Appear delay={110} style={s.center}>
            <Pressable
              onPress={pickPhoto}
              accessibilityRole="button"
              accessibilityLabel={photo ? 'Change profile photo' : 'Upload profile photo'}
              style={({ pressed }) => [s.avatar, pressed && { opacity: 0.85 }]}
            >
              {photo
                ? <Image source={{ uri: photo }} style={s.avatarImg} />
                : <Camera size={38} color={N.violet} strokeWidth={1.6} />}
            </Pressable>
            <Text style={[s.uploadLabel, { fontFamily: F.med }]}>
              {photo ? 'Change Photo' : 'Upload Photo'}
            </Text>
          </Appear>

          {/* Form card */}
          <Appear delay={180}>
            <View style={s.card}>
              {/* Role — segmented. Not in the mockup, but the only place accountType is set. */}
              <View style={s.segment}>
                {ROLES.map((r) => {
                  const sel = role === r.key;
                  return (
                    <Pressable
                      key={r.key}
                      onPress={() => { setRole(r.key); setError(''); }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: sel }}
                      style={[s.segItem, sel && s.segItemSel]}
                    >
                      <Text style={[s.segText, { fontFamily: F.med }, sel && s.segTextSel]}>{r.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Name */}
              <View style={s.row}>
                <User size={20} color={N.inkSoft} strokeWidth={1.8} />
                <TextInput
                  style={[s.rowText, s.input, { fontFamily: F.reg }]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  placeholderTextColor={N.inkDim}
                  autoCapitalize="words"
                  keyboardAppearance="dark"
                  selectionColor={N.violet}
                  accessibilityLabel="Your name"
                />
              </View>

              {isStudent && (
                <>
                  <SelectRow
                    F={F}
                    icon={<GraduationCap size={20} color={N.inkSoft} strokeWidth={1.8} />}
                    value={klass ? `Class ${klass}` : ''}
                    placeholder="Select Grade"
                    error={!!error && !klass}
                    onPress={() => setSheet('grade')}
                  />

                  {/* Only for 11/12 — the server marks the profile incomplete without it. */}
                  {senior && (
                    <SelectRow
                      F={F}
                      icon={<BookOpen size={20} color={N.inkSoft} strokeWidth={1.8} />}
                      value={stream || ''}
                      placeholder="Select Stream"
                      error={!!error && !stream}
                      onPress={() => setSheet('stream')}
                    />
                  )}

                  {/* School */}
                  <View style={s.row}>
                    <School size={20} color={N.inkSoft} strokeWidth={1.8} />
                    <TextInput
                      style={[s.rowText, s.input, { fontFamily: F.reg }]}
                      value={school}
                      onChangeText={setSchool}
                      placeholder="School Name"
                      placeholderTextColor={N.inkDim}
                      autoCapitalize="words"
                      keyboardAppearance="dark"
                      selectionColor={N.violet}
                      accessibilityLabel="School name"
                    />
                  </View>

                  <SelectRow
                    F={F}
                    icon={<Landmark size={20} color={N.inkSoft} strokeWidth={1.8} />}
                    value={board || ''}
                    placeholder="Board"
                    onPress={() => setSheet('board')}
                  />

                  <SelectRow
                    F={F}
                    icon={<Languages size={20} color={N.inkSoft} strokeWidth={1.8} />}
                    value={language || ''}
                    placeholder="Preferred Language"
                    onPress={() => setSheet('language')}
                  />

                  <SelectRow
                    F={F}
                    icon={<BookOpen size={20} color={N.inkSoft} strokeWidth={1.8} />}
                    value={subject || ''}
                    placeholder="Favourite Subject"
                    onPress={() => klass
                      ? setSheet('subject')
                      : setError('Pick your grade first — subjects depend on it.')}
                  />

                  {/* Learning goal */}
                  <TextInput
                    style={[s.textarea, { fontFamily: F.reg }]}
                    value={goal}
                    onChangeText={setGoal}
                    placeholder="What is your primary learning goal?"
                    placeholderTextColor={N.inkDim}
                    multiline
                    textAlignVertical="top"
                    maxLength={280}
                    keyboardAppearance="dark"
                    selectionColor={N.violet}
                    accessibilityLabel="Primary learning goal"
                  />
                </>
              )}

              {!isStudent && (
                <Text style={[s.roleNote, { fontFamily: F.reg }]}>
                  {role === 'parent'
                    ? "You'll link your child's account after this step."
                    : 'Class and subject details are set per batch once you continue.'}
                </Text>
              )}

              {!!error && <Text style={[s.error, { fontFamily: F.med }]}>{error}</Text>}

              {/* Continue */}
              <Pressable
                onPress={save}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel="Continue"
                style={({ pressed }) => [
                  s.btnWrap,
                  pressed && { transform: [{ scale: 0.985 }] },
                  saving && { opacity: 0.7 },
                ]}
              >
                <LinearGradient
                  colors={missing() ? [N.violetLo, N.violet] : [N.violet, '#A855F7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.btn}
                >
                  {saving
                    ? <ActivityIndicator color={N.ink} size="small" />
                    : <Text style={[s.btnText, { fontFamily: F.bold }]}>Continue</Text>}
                </LinearGradient>
              </Pressable>
            </View>
          </Appear>
        </ScrollView>
      </KeyboardAvoidingView>

      <OptionSheet
        open={!!activeSheet}
        title={activeSheet?.title || ''}
        options={activeSheet?.options || []}
        selected={activeSheet?.selected}
        onPick={activeSheet?.onPick || (() => {})}
        onClose={() => setSheet(null)}
        F={F}
        insetBottom={insets.bottom}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: N.bg },
  flex:   { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 20 },
  center: { alignItems: 'center', alignSelf: 'stretch' },

  heading: { fontSize: 28, lineHeight: 36, color: N.ink, letterSpacing: -0.4, textAlign: 'center' },
  sub:     { fontSize: 15, lineHeight: 22, color: N.inkSoft, textAlign: 'center', marginTop: 8, marginBottom: 26 },

  avatar: {
    width: 116, height: 116, borderRadius: 58,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    backgroundColor: N.cardSoft,
    borderWidth: 2, borderStyle: 'dashed', borderColor: N.violet,
  },
  avatarImg:   { width: '100%', height: '100%' },
  uploadLabel: { fontSize: 15, color: N.violet, marginTop: 12, marginBottom: 22 },

  card: {
    backgroundColor: N.cardSoft,
    borderRadius: 28,
    borderWidth: 1, borderColor: N.cardEdge,
    padding: 16,
    gap: 12,
  },

  segment: {
    flexDirection: 'row', gap: 6, padding: 4,
    backgroundColor: N.cardSoft, borderRadius: 14,
  },
  segItem:    { flex: 1, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  segItemSel: { backgroundColor: N.violetSoft, borderWidth: 1, borderColor: N.violet },
  segText:    { fontSize: 14, color: N.inkSoft },
  segTextSel: { color: N.ink },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    height: 60, borderRadius: 14, paddingHorizontal: 16,
    backgroundColor: N.cardSoft,
    borderWidth: 1, borderColor: 'transparent',
  },
  rowPressed:     { opacity: 0.75 },
  rowError:       { borderColor: '#F0566E' },
  rowText:        { flex: 1, fontSize: 16, color: N.ink },
  rowPlaceholder: { color: N.inkSoft },
  input:          { padding: 0, height: '100%' },

  textarea: {
    minHeight: 130, borderRadius: 14, padding: 16,
    backgroundColor: N.cardSoft,
    fontSize: 16, color: N.ink, lineHeight: 22,
  },

  roleNote: { fontSize: 13, color: N.inkSoft, lineHeight: 19, paddingHorizontal: 4, paddingVertical: 6 },
  error:    { fontSize: 13, color: '#F0566E', lineHeight: 19, paddingHorizontal: 4 },

  btnWrap: {
    marginTop: 4, borderRadius: 30,
    shadowColor: N.violet, shadowOpacity: 0.45, shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 }, elevation: 10,
  },
  btn:     { height: 58, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 17, color: N.ink, letterSpacing: 0.2 },

  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(15,18,34,0.45)' },
  sheet: {
    backgroundColor: N.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1, borderColor: N.cardEdge,
    paddingHorizontal: 16, paddingTop: 10,
  },
  sheetGrab: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: N.track,
    alignSelf: 'center', marginBottom: 14,
  },
  sheetTitle: { fontSize: 18, color: N.ink, marginBottom: 12, paddingHorizontal: 4 },
  sheetItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: 14,
    borderRadius: 14, marginBottom: 8,
    backgroundColor: N.cardSoft,
    borderWidth: 1, borderColor: 'transparent',
  },
  sheetItemSel:  { backgroundColor: N.violetSoft, borderColor: N.violet },
  sheetItemText: { fontSize: 15.5, color: N.inkSoft },
  sheetItemSub:  { fontSize: 12.5, color: N.inkDim, marginTop: 3 },
});
