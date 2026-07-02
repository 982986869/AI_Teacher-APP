// src/screens/parent/ParentApp/ChatTab.js — teammate's exact empty state, real child name.
import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Hand } from 'lucide-react-native';
import { C, st, T } from './constants';
import Header from './Header';

export default function ChatTab({ meta, childName, onAvatar, flash }) {
  return (
    <View style={st.screen}>
      <Header meta={meta} childName={childName} onAvatar={onAvatar} />
      <View style={[st.emptyScreen, { backgroundColor: C.chatBg }]}>
        <View style={st.chatBubble}>
          <Hand size={30} color={C.ink} fill="#BFE6FA" />
          <View style={st.chatTailOuter} /><View style={st.chatTailInner} />
        </View>
        <T w="semi" s={20} c="#0E2A33" style={st.emptyText}>Chat with {childName}'s tutor once you enrol for AILERNOVA classes.</T>
        <TouchableOpacity style={st.exploreBtn} onPress={() => flash('Explore tutoring — coming soon')}><T w="bold" s={16} c="#fff">Explore Tutoring</T></TouchableOpacity>
      </View>
    </View>
  );
}
