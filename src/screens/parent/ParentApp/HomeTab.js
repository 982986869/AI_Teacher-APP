// src/screens/parent/ParentApp/HomeTab.js
import React, { memo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { C, s, CONTENT, Label } from './constants';
import { TrialHero } from './illustrations';

function HomeTab({ report, child, sidePad, refreshing, onRefresh, flash }) {
  const bg = report.brainGym || {};
  const streak = Number(bg.currentStreak) || 0;
  const quizzes = Number(bg.quizzesCompleted) || 0;
  const acc = Number(bg.accuracy) || 0;
  return (
    <ScrollView style={[s.body, { paddingHorizontal: sidePad }]} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.blue} />}>
      <Label style={{ marginTop: 14 }}>{child.name}'s updates</Label>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 4 }}>
        <View style={s.updateCard}>
          <View style={s.updateIcon}>
            <Ionicons name="pulse" size={20} color="#fff" />
            <View style={s.piBadge}><Text style={s.piBadgeTxt}>π</Text></View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.updTitle}>Recent activity</Text>
            <Text style={s.updSub}>{quizzes > 0 ? `${quizzes} quizzes · ${acc}% accuracy` : 'No activity yet'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={C.faint} />
        </View>
        <View style={s.streakCard}>
          <View style={s.streakIcon}><Ionicons name="flame" size={20} color="#fff" /></View>
          <View>
            <Text style={s.updTitle}>{streak > 0 ? `${streak}-day streak` : 'No streak yet'}</Text>
            <Text style={s.updSub}>{streak > 0 ? 'Keep going' : 'Practice daily'}</Text>
          </View>
        </View>
      </ScrollView>

      <Label>Book a trial</Label>
      <View style={s.trialCard}>
        <Text style={s.trialTitle}>{CONTENT.trial.title}</Text>
        <Text style={s.trialSub}>{CONTENT.trial.body}</Text>
        <View style={s.trialArt}>
          <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
            <Defs>
              <LinearGradient id="trialGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#FBDE82" /><Stop offset="100%" stopColor="#F3BE38" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" rx="16" fill="url(#trialGrad)" />
          </Svg>
          <TrialHero />
          <TouchableOpacity style={s.trialBtn} activeOpacity={0.9} onPress={() => flash('Trial booking — coming soon')}>
            <Text style={s.trialBtnTxt}>{CONTENT.trial.cta}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Label>Offline events</Label>
      <View style={s.eventCard}>
        <Text style={s.eventKicker}>{CONTENT.event.kicker}</Text>
        <View style={{ flexDirection: 'row', marginTop: 4, marginBottom: 2 }}>
          <Text style={s.eventBig}>{CONTENT.event.name} </Text>
          {[['F', C.gold], ['E', C.chatBg], ['S', C.red], ['T', C.green]].map(([c, col], i) => (
            <Text key={i} style={[s.eventBig, { color: col }]}>{c}</Text>
          ))}
          <Text style={s.eventBig}>{CONTENT.event.suffix}</Text>
        </View>
        <Text style={s.eventGrade}>{CONTENT.event.grades}</Text>
        <TouchableOpacity style={s.eventBtn} activeOpacity={0.9} onPress={() => flash("Math Fest '26 — coming soon")}>
          <Text style={s.eventBtnTxt}>{CONTENT.event.cta}</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', gap: 3, marginTop: 12, alignItems: 'center' }}>
          {Array.from({ length: CONTENT.event.stars }).map((_, i) => <View key={i} style={s.trustStar}><Ionicons name="star" size={11} color="#fff" /></View>)}
          <Text style={s.trustTxt}>{CONTENT.event.trust}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

export default memo(HomeTab);
