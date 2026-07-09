// src/screens/parent/ParentApp/HomeTab.js — teammate's exact Home, real BrainGym data.
import React, { memo } from 'react';
import { View, ScrollView, RefreshControl, ImageBackground } from 'react-native';
import { ChevronRight, Flame, Star } from 'lucide-react-native';
import { C, st, T, Label, CONTENT } from './constants';
import Header from './Header';
import { PressableScale } from './anim';
import EventsCarousel from './EventsCarousel';

// Trial card photo. Drop your own image at assets/trial-hero.jpg to change it.
const TRIAL_IMG = require('../../../../assets/trial-hero.jpg');

function HomeTab({ meta, childName, onAvatar, onGym, onActivity, onBookTrial, report, flash, refreshing, onRefresh }) {
  const bg = report.brainGym || {};
  const feat = report.features || {};
  const streak = Number(bg.currentStreak) || 0;
  const quizzes = Number(bg.quizzesCompleted) || 0;
  const acc = Number(bg.accuracy) || 0;
  return (
    <View style={st.screen}>
      <Header meta={meta} childName={childName} onAvatar={onAvatar} onGym={onGym} />
      <ScrollView style={st.body} contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.blue} />}>
        <Label>{childName}'s updates</Label>
        {/* Edge-to-edge horizontal row: cancels the body's 18px gutter so cards never
            clip at the screen edge, and adds vertical room so card shadows aren't cut. */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -18 }} contentContainerStyle={{ paddingHorizontal: 18, paddingVertical: 4 }}>
          <PressableScale style={st.updateCard} onPress={onActivity}>
            <View style={st.updateIcon}>
              <T w="xbold" s={20} c="#fff">+</T>
              <View style={st.piBadge}><T w="bold" s={12} c="#fff">π</T></View>
            </View>
            <View style={{ flex: 1 }}>
              <T w="bold" s={15} c={C.ink}>Recent activity</T>
              <T w="med" s={13} c={C.muted}>{quizzes > 0 ? `${quizzes} quizzes · ${acc}% accuracy` : 'No activity yet'}</T>
            </View>
            <ChevronRight size={18} color={C.faint} />
          </PressableScale>
          <PressableScale style={st.streakCard} onPress={onActivity}>
            <View style={st.streakIcon}><Flame size={20} color="#fff" fill="#fff" /></View>
            <View>
              <T w="bold" s={14} c={C.ink}>{streak > 0 ? `${streak}-day streak` : 'No streak yet'}</T>
              <T w="med" s={12} c={C.muted}>{streak > 0 ? 'Keep going' : 'Practice daily'}</T>
            </View>
          </PressableScale>
        </ScrollView>

        <Label>Book a trial</Label>
        <View style={st.trialCard}>
          <T w="xbold" s={21} c={C.ink} style={{ textAlign: 'center', lineHeight: 27 }}>{CONTENT.trial.title}</T>
          <T w="med" s={13.5} c="#5A4A2A" style={{ textAlign: 'center', marginTop: 10, lineHeight: 20 }}>{CONTENT.trial.body}</T>
          <ImageBackground source={TRIAL_IMG} style={st.trialArt} imageStyle={st.trialImg} resizeMode="cover">
            <View style={st.trialBtnWrap}>
              <PressableScale style={st.trialBtn} onPress={onBookTrial}>
                <T w="bold" s={15} c={C.ink}>{CONTENT.trial.cta}</T>
              </PressableScale>
            </View>
          </ImageBackground>
        </View>

        <Label>Offline events</Label>
        {feat.events && (report.events || []).length ? (
          <EventsCarousel events={report.events} store={report.eventStore} skills={report.eventSkills} gallery={report.eventGallery} />
        ) : (
          <View style={st.eventCard}>
            <T w="xbold" s={20} c="#fff">In-person workshops</T>
            <T w="med" s={13} c="rgba(255,255,255,0.7)" style={{ marginTop: 6, marginBottom: 16 }}>Hands-on math events near you — coming soon.</T>
            <PressableScale style={[st.eventBtn, { opacity: 0.6 }]} onPress={() => flash('Offline events — coming soon')}>
              <T w="bold" s={15} c={C.ink}>Coming soon</T>
            </PressableScale>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

export default memo(HomeTab);
