// src/screens/parent/ParentApp/ClassesTab.js — teammate's exact empty state, real child name.
import React from 'react';
import { View } from 'react-native';
import { C, st, T } from './constants';
import Header from './Header';
import { CalendarArt } from './illustrations';
import { PressableScale } from './anim';

export default function ClassesTab({ meta, childName, onAvatar, onGym, flash }) {
  return (
    <View style={st.screen}>
      <Header meta={meta} childName={childName} onAvatar={onAvatar} onGym={onGym} />
      <View style={[st.emptyScreen, { backgroundColor: C.classBg }]}>
        <CalendarArt />
        <T w="semi" s={20} c="#0E2A33" style={st.emptyText}>Manage {childName}'s classes once you enrol for AILERNOVA classes.</T>
        <PressableScale style={st.exploreBtn} onPress={() => flash('Explore tutoring — coming soon')}><T w="bold" s={16} c="#fff">Explore Tutoring</T></PressableScale>
      </View>
    </View>
  );
}
