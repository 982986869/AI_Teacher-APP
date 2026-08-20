// src/screens/aiteacher/AITeacherHome.js
// The AI Teacher landing, on the light design:
//
//   header → greeting → search (topic) → action cards → teaching style →
//   your dedicated instructor → your subjects → welcome back → jump back in →
//   my lessons → personalized for you → footer
//
// PRESENTATION ONLY. Every piece of state and every network call lives in
// src/screens/AITeacherScreen.js, which renders this as its landing and keeps the rest —
// lesson generation, Ask-the-Material, Study Insights, the live classroom, the date-range
// sheet and the "Your learning" memory sheet. This file holds no state of its own beyond
// the input ref, so the whole landing can be re-laid-out without touching that logic.
//
// Three sections here are NOT in the design — WelcomeBack, MyLessons and the voice-off
// note. They carry features the old landing had, and the design is a resting screen that
// never drew them. Dropping them to match the mockup exactly would take the student's
// whole lesson library off the app.
//
// Values eyeballed from the design screenshots rather than inspected in Figma (the file
// needs a login this workspace does not have) are marked TODO(figma) in
// src/theme/aiTeacherTheme.js.
//
// The bottom tab bar in the design is src/navigation/FloatingDock.js. It is not rendered
// here — AI Teacher opens as a full-screen flow out of HomeScreen, above the dock — but
// the scroll reserves a comfortable tail so the last row is never jammed to the edge.
import React from 'react';
import {
  View, StyleSheet, ScrollView, StatusBar, Image, Pressable, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft, Settings, Search, Sparkles, FileText, CircleAlert, VolumeX,
} from 'lucide-react-native';
import {
  useFonts as useInterFonts,
  Inter_400Regular, Inter_500Medium, Inter_600SemiBold,
  Inter_700Bold, Inter_800ExtraBold,
} from '@expo-google-fonts/inter';

import { AIT } from '../../theme/aiTeacherTheme';
import { T, PAD } from './sections/ui';
import TeachingStyle from './sections/TeachingStyle';
import InstructorList from './sections/InstructorList';
import SubjectsRow from './sections/SubjectsRow';
import WelcomeBack from './sections/WelcomeBack';
import JumpBackIn from './sections/JumpBackIn';
import MyLessons from './sections/MyLessons';
import PersonalizedList from './sections/PersonalizedList';

// ── header ───────────────────────────────────────────────────────────────────
// The title is centred in the FRAME, not between its two neighbours: the back arrow is
// 16px and the settings button 36px, so centring it in the leftover space would push it
// off-centre by ten pixels. It is absolutely positioned instead, and the row keeps
// space-between for the two controls.
function Header({ onBack, onSettings }) {
  return (
    <View style={s.header}>
      <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back">
        <ArrowLeft size={16} color={AIT.ink} strokeWidth={2} />
      </Pressable>

      <View pointerEvents="none" style={s.headerTitleWrap}>
        <T w="bold" s={16} style={s.headerTitle}>AI TEACHER</T>
      </View>

      {/* The design gives the header one control on the right. It opens "Your learning" —
          what the teacher remembers about this student — which is the only settings-shaped
          surface the feature actually has. */}
      <Pressable
        onPress={onSettings}
        style={s.settingsBtn}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Your learning — what the teacher remembers about you"
      >
        <Settings size={16} color={AIT.ink} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

// ── greeting ─────────────────────────────────────────────────────────────────
// The presence dot is drawn with a 2px border in the page's own surface rather than a
// gap, which is how the design punches it out of the avatar ring behind it.
function Greeting({ name, photoUrl, subtitle }) {
  return (
    <View style={s.greetingRow}>
      <View style={s.avatarRing}>
        <View style={s.avatarInner}>
          {photoUrl
            ? <Image source={{ uri: photoUrl }} style={s.avatarImg} />
            : <T w="xbold" s={22} c={AIT.inkSoft}>{(name || '?').trim().charAt(0).toUpperCase()}</T>}
        </View>
        <View style={s.onlineBadge} />
      </View>

      <View style={s.greetingText}>
        <T w="xbold" s={24} numberOfLines={1}>Hey {name || 'there'}</T>
        <T w="reg" s={14} c={AIT.inkSoft} numberOfLines={2}>{subtitle}</T>
      </View>
    </View>
  );
}

// ── action cards ─────────────────────────────────────────────────────────────
// Two fills, and the ink follows the fill: the amber card keeps the page's near-black
// type, the near-black card inverts. Both are passed in rather than derived from a
// luminance test, so each card's contrast stays a design decision.
function ActionCard({ fill, ink, inkSoft, Icon, title, description, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.card, { backgroundColor: fill }, pressed && { opacity: 0.9 }]}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${description}`}
    >
      <View style={s.cardIconBg}>
        <Icon size={18} color={ink} strokeWidth={1.8} />
      </View>
      <View style={s.cardText}>
        <T w="bold" s={16} c={ink} numberOfLines={1}>{title}</T>
        <T w="reg" s={11} c={inkSoft} numberOfLines={2} style={{ lineHeight: 14 }}>{description}</T>
      </View>
    </Pressable>
  );
}

// ── screen ───────────────────────────────────────────────────────────────────
export default function AITeacherHome({
  // identity
  userName,
  photoUrl,
  greetingLine = 'Ready to continue your learning?',

  // topic composer
  topic = '',
  onChangeTopic = () => {},
  onGenerate = () => {},
  generating = false,
  error = '',

  // subject + register for the next lesson
  subjects,
  subject,
  onSelectSubject = () => {},
  teachingStyles,
  teachingStyle,
  onSelectTeachingStyle = () => {},

  // the teacher
  instructors,
  onCustomizeCoach = () => {},

  // continuity
  welcomeBack = null,
  onRevise = () => {},
  onRelearn = () => {},
  onDismissWelcome = () => {},
  currentLesson = null,
  resuming = false,
  onContinueLesson = () => {},

  // the library
  lessons = null,
  librarySubjects = [],
  librarySubject = 'All',
  libraryView = 'list',
  rangeLabel = 'All time',
  filtersActive = false,
  onSelectLibrarySubject = () => {},
  onToggleLibraryView = () => {},
  onOpenRange = () => {},
  onOpenLesson = () => {},

  // the rest
  personalized,
  onSelectPersonalized = () => {},
  emptyHint = '',
  voiceOff = false,

  onBack = () => {},
  onSettings = () => {},
  onAskMaterial = () => {},
}) {
  useInterFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold,
  });
  const insets = useSafeAreaInsets();
  const topicRef = React.useRef(null);

  const canGenerate = !!topic.trim() && !generating;

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={AIT.bg} translucent={false} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 40 }}
        >
          <Header onBack={onBack} onSettings={onSettings} />

          <Greeting name={userName} photoUrl={photoUrl} subtitle={greetingLine} />

          {/* Search — a real input, because this IS the topic the lesson is generated
              from. The design draws it as a resting field with placeholder copy; the
              placeholder here is that same copy, so the resting state matches and the
              field still submits. */}
          <View style={s.searchHero}>
            <View style={s.searchGlowWrap}>
              <View style={s.searchBar}>
                <Search size={20} color={AIT.inkMuted} strokeWidth={2} />
                <TextInput
                  ref={topicRef}
                  style={s.searchInput}
                  placeholder="e.g. Pythagoras Theorem"
                  placeholderTextColor={AIT.inkMuted}
                  value={topic}
                  onChangeText={onChangeTopic}
                  onSubmitEditing={onGenerate}
                  returnKeyType="go"
                  editable={!generating}
                  selectionColor={AIT.accent}
                  accessibilityLabel="Topic to learn"
                />
                <Pressable
                  onPress={onGenerate}
                  disabled={!canGenerate}
                  style={({ pressed }) => [
                    s.sparkleChip,
                    !canGenerate && { opacity: 0.5 },
                    pressed && { transform: [{ scale: 0.94 }] },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Start lesson"
                  accessibilityState={{ disabled: !canGenerate }}
                >
                  {generating
                    ? <ActivityIndicator size="small" color={AIT.ink} />
                    : <Sparkles size={16} color={AIT.ink} strokeWidth={2} />}
                </Pressable>
              </View>
            </View>
          </View>

          {!!error && (
            <View style={s.errCard}>
              <CircleAlert size={16} color={AIT.danger} strokeWidth={2.2} />
              <T w="med" s={12.5} c={AIT.danger} style={s.errText} accessibilityLiveRegion="polite">
                {error}
              </T>
              <Pressable onPress={onGenerate} hitSlop={8} accessibilityRole="button" accessibilityLabel="Try again">
                <T w="bold" s={12.5}>Retry</T>
              </Pressable>
            </View>
          )}

          {/* The design draws two cards here. "Learn a Topic" was cut on request: all it
              did was move the caret into the topic field directly above it, so it was a
              large amber shortcut to something already on screen. Ask Material has no
              other entry point, and takes the row on its own — the card is flex:1, so it
              widens to fill it without a style change. */}
          <View style={s.actionCardsRow}>
            <ActionCard
              fill={AIT.cardInk}
              ink={AIT.inkInv}
              inkSoft={AIT.inkInvSoft}
              Icon={FileText}
              title="Ask Material"
              description="Upload & query your study files"
              onPress={onAskMaterial}
            />
          </View>

          <TeachingStyle
            styles={teachingStyles}
            selected={teachingStyle}
            onSelect={onSelectTeachingStyle}
          />

          <InstructorList instructors={instructors} onCustomize={onCustomizeCoach} />

          <SubjectsRow subjects={subjects} selected={subject} onSelect={onSelectSubject} />

          <WelcomeBack
            snapshot={welcomeBack}
            onRevise={onRevise}
            onRelearn={onRelearn}
            onDismiss={onDismissWelcome}
          />

          <JumpBackIn lesson={currentLesson} busy={resuming} onContinue={onContinueLesson} />

          <MyLessons
            lessons={lessons}
            subjects={librarySubjects}
            subject={librarySubject}
            view={libraryView}
            rangeLabel={rangeLabel}
            filtersActive={filtersActive}
            busy={resuming}
            onSelectSubject={onSelectLibrarySubject}
            onToggleView={onToggleLibraryView}
            onOpenRange={onOpenRange}
            onOpenLesson={onOpenLesson}
          />

          <PersonalizedList items={personalized} onSelect={onSelectPersonalized} />

          {/* Shown only to a student with no history yet — the three rows above have
              nothing behind them until they have studied something. */}
          {!!emptyHint && (
            <T w="reg" s={12.5} c={AIT.inkSoft} style={s.hint}>{emptyHint}</T>
          )}

          <T w="reg" s={11} c={AIT.inkMuted} style={s.footnote}>
            A live, voice-narrated lesson with a teacher and whiteboard,
            and doubts you can ask anytime.
          </T>

          {voiceOff && (
            <View style={s.voiceNote}>
              <VolumeX size={14} color={AIT.inkSoft} strokeWidth={2.2} />
              <T w="reg" s={12} c={AIT.inkSoft} style={{ flex: 1 }}>
                Voice off — run “npx expo install expo-speech” to enable narration.
              </T>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: AIT.bg },

  // header — Fill, hug 68, space-between, 16/24 padding
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16, paddingHorizontal: PAD,
  },
  headerTitleWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  // Figma reports 120% letter spacing — 19px at 16px type, which would run "AI TEACHER"
  // to roughly 300px against its stated 97px width. Same contradiction the Student Home's
  // eyebrows carry; the width wins and this keeps a display-sized 1.6.
  headerTitle: { letterSpacing: 1.6, textTransform: 'uppercase', textAlign: 'center' },
  settingsBtn: {
    width: 36, height: 36, borderRadius: 100, padding: 10,
    borderWidth: 1, borderColor: AIT.edge, backgroundColor: AIT.bg,
    alignItems: 'center', justifyContent: 'center',
  },

  // greeting — hug 80, 8/24 padding, 16 gap
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 8, paddingHorizontal: PAD },
  avatarRing: {
    width: 64, height: 64, borderRadius: 32, padding: 3,
    borderWidth: 2, borderColor: AIT.avatarRing,
  },
  avatarInner: {
    flex: 1, borderRadius: 100, overflow: 'hidden',
    backgroundColor: AIT.field, alignItems: 'center', justifyContent: 'center',
  },
  avatarImg: { width: '100%', height: '100%' },
  onlineBadge: {
    position: 'absolute', right: 0, bottom: 2,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: AIT.online, borderWidth: 2, borderColor: AIT.onlineEdge,
  },
  greetingText: { flex: 1, minWidth: 0, gap: 4 },

  // search — hero 12/24 padding, a 2px wrap around a 54px field
  searchHero: { paddingVertical: 12, paddingHorizontal: PAD },
  searchGlowWrap: { borderRadius: 16, padding: 2, backgroundColor: AIT.field },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    height: 54, borderRadius: 14, paddingHorizontal: 16,
    borderWidth: 1.5, borderColor: AIT.edge, backgroundColor: AIT.field,
  },
  // The input carries the type styling itself — T cannot wrap a TextInput.
  searchInput: {
    flex: 1, minWidth: 0, padding: 0,
    fontFamily: 'Inter_400Regular', fontSize: 14, color: AIT.ink,
  },
  sparkleChip: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: AIT.sparkleChip, alignItems: 'center', justifyContent: 'center',
  },

  errCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: PAD, marginBottom: 4,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11,
    backgroundColor: AIT.dangerBg,
  },
  errText: { flex: 1, lineHeight: 17 },

  // action cards — row 12/24 padding, 16 gap; each card 16 radius, 16 padding, 12 gap.
  // No border: these two carry their own fill, unlike the white panels further down.
  actionCardsRow: { flexDirection: 'row', gap: 16, paddingVertical: 12, paddingHorizontal: PAD },
  card: { flex: 1, minHeight: 129, borderRadius: 16, padding: 16, gap: 12 },
  cardIconBg: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: AIT.cardIconBg,
    alignItems: 'center', justifyContent: 'center',
  },
  cardText: { gap: 4 },

  hint: { paddingHorizontal: PAD, paddingTop: 14, lineHeight: 18 },
  footnote: { textAlign: 'center', lineHeight: 17, paddingHorizontal: PAD + 12, paddingTop: 26 },
  voiceNote: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: PAD, marginTop: 14,
    borderRadius: 12, padding: 12, backgroundColor: AIT.field,
  },
});
