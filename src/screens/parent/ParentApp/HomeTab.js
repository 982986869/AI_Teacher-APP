// src/screens/parent/ParentApp/HomeTab.js — teammate's exact Home, real BrainGym data.
import React, { memo } from 'react';
import { View, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { ChevronRight, Flame, Star } from 'lucide-react-native';
import { C, st, T, Label, CONTENT } from './constants';
import Header from './Header';
import { TrialHero } from './illustrations';

function HomeTab({ meta, childName, onAvatar, report, flash, refreshing, onRefresh }) {
  const bg = report.brainGym || {};
  const streak = Number(bg.currentStreak) || 0;
  const quizzes = Number(bg.quizzesCompleted) || 0;
  const acc = Number(bg.accuracy) || 0;
  return (
    <View style={st.screen}>
      <Header meta={meta} childName={childName} onAvatar={onAvatar} />
      <ScrollView style={st.body} contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.blue} />}>
        <Label>{childName}'s updates</Label>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={st.updateCard}>
            <View style={st.updateIcon}>
              <T w="xbold" s={20} c="#fff">+</T>
              <View style={st.piBadge}><T w="bold" s={12} c="#fff">π</T></View>
            </View>
            <View style={{ flex: 1 }}>
              <T w="bold" s={15} c={C.ink}>Recent activity</T>
              <T w="med" s={13} c={C.muted}>{quizzes > 0 ? `${quizzes} quizzes · ${acc}% accuracy` : 'No activity yet'}</T>
            </View>
            <ChevronRight size={18} color={C.faint} />
          </View>
          <View style={st.streakCard}>
            <View style={st.streakIcon}><Flame size={20} color="#fff" fill="#fff" /></View>
            <View>
              <T w="bold" s={14} c={C.ink}>{streak > 0 ? `${streak}-day streak` : 'No streak yet'}</T>
              <T w="med" s={12} c={C.muted}>{streak > 0 ? 'Keep going' : 'Practice daily'}</T>
            </View>
          </View>
        </ScrollView>

        <Label>Book a trial</Label>
        <View style={st.trialCard}>
          <T w="xbold" s={21} c={C.ink} style={{ textAlign: 'center', lineHeight: 27 }}>{CONTENT.trial.title}</T>
          <T w="med" s={13.5} c="#5A4A2A" style={{ textAlign: 'center', marginTop: 10, lineHeight: 20 }}>{CONTENT.trial.body}</T>
          <View style={st.trialArt}>
            <TrialHero />
            <View style={st.trialBtnWrap}>
              <TouchableOpacity style={st.trialBtn} onPress={() => flash('Trial booking — coming soon')}>
                <T w="bold" s={15} c={C.ink}>{CONTENT.trial.cta}</T>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Label>Offline events</Label>
        <View style={st.eventCard}>
          <T w="semi" s={12.5} c="rgba(255,255,255,0.75)">{CONTENT.event.kicker}</T>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', marginTop: 4, marginBottom: 2 }}>
            <T w="xbold" s={26} c="#fff">{CONTENT.event.name} </T>
            {[['F', C.gold], ['E', C.chatBg], ['S', C.red], ['T', C.green]].map(([c, col], i) => <T key={i} w="xbold" s={26} c={col}>{c}</T>)}
            <T w="xbold" s={26} c="#fff">{CONTENT.event.suffix}</T>
          </View>
          <T w="med" s={12.5} c="rgba(255,255,255,0.7)" style={{ marginBottom: 16 }}>{CONTENT.event.grades}</T>
          <TouchableOpacity style={st.eventBtn} onPress={() => flash("Math Fest '26 — coming soon")}>
            <T w="bold" s={15} c={C.ink}>{CONTENT.event.cta}</T>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 12 }}>
            {Array.from({ length: CONTENT.event.stars }).map((_, i) => <View key={i} style={st.trustStar}><Star size={11} fill="#fff" color="#fff" /></View>)}
            <T w="semi" s={11} c="rgba(255,255,255,0.7)" style={{ marginLeft: 6 }}>{CONTENT.event.trust}</T>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export default memo(HomeTab);
