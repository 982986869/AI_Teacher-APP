// src/screens/parent/ParentApp/SessionsTab.js
// Same visual layout as the team's original (Wordmark · tutor strip · upcoming ·
// book · past) — but NO fake data. There is no tutor/session backend yet, so each
// existing card shows an honest empty state instead of a fabricated tutor, booking,
// past-session notes or live call. Card shells, labels and order are unchanged.
import React from 'react';
import { View, ScrollView } from 'react-native';
import { Video, Calendar, ChevronRight, CheckCircle2 } from 'lucide-react-native';
import { C, st, T, Label, Wordmark } from './constants';
import Header from './Header';
import { PressableScale } from './anim';

export default function SessionsTab({ meta, childName, onAvatar, onGym, flash }) {
  return (
    <View style={st.screen}>
      <Header meta={meta} childName={childName} onAvatar={onAvatar} onGym={onGym} />
      <ScrollView style={st.body} contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        <View style={{ marginTop: 6 }}><Wordmark size={16} /></View>

        {/* Tutor strip — same card shell, empty until a tutor is assigned */}
        <View style={st.tutorStrip}>
          <View style={st.tutorAv}><Video size={18} color="#fff" strokeWidth={2.4} /></View>
          <View style={{ flex: 1 }}>
            <T w="bold" s={15.5} c={C.ink}>Tutor sessions</T>
            <T w="med" s={13} c={C.muted}>Available after enrolment</T>
          </View>
        </View>

        <Label>Upcoming session</Label>
        <View style={st.emptyCard}>
          <Calendar size={22} color={C.faint} />
          <View style={{ flex: 1 }}>
            <T w="bold" s={14} c={C.ink}>No session yet</T>
            <T w="med" s={13} c={C.muted}>Your scheduled sessions will appear here.</T>
          </View>
        </View>

        <Label>Book a session</Label>
        <PressableScale style={st.bookCta} onPress={() => flash('Tutor sessions — coming soon')}>
          <View style={st.bookIcon}><Video size={20} color="#fff" strokeWidth={2.4} /></View>
          <View style={{ flex: 1 }}>
            <T w="bold" s={15} c={C.ink}>Talk to a tutor</T>
            <T w="med" s={13} c={C.muted}>1:1 tutoring is coming soon</T>
          </View>
          <ChevronRight size={20} color={C.faint} />
        </PressableScale>

        <Label>Past sessions</Label>
        <View style={st.emptyCard}>
          <CheckCircle2 size={22} color={C.faint} />
          <View style={{ flex: 1 }}>
            <T w="bold" s={14} c={C.ink}>No past sessions</T>
            <T w="med" s={13} c={C.muted}>Completed sessions will show here.</T>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
