// src/screens/admin/resources/ChapterContentScreen.js
// A chapter's Content hub — the drill-down that lets an admin add/edit the actual content
// students read: Revision Notes, Important Questions, Previous-Year Questions. Each row opens
// its own editor. (Practice MCQs, NCERT and paper uploads come next.)
import React from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, FileText, Star, FileClock, ListChecks } from 'lucide-react-native';
import { S, shadow } from '../../../theme/studentUI';
import { T } from '../../parent/ParentApp/constants';

const TYPES = [
  { key: 'notes', name: 'Revision Notes', sub: 'Chapter notes & flashcards', icon: FileText, tint: S.emerald, bg: S.emeraldSoft, screen: 'ChapterNotesEditor', params: {} },
  { key: 'practice', name: 'Practice MCQs', sub: 'Multiple-choice questions students practise', icon: ListChecks, tint: '#0EA5E9', bg: '#E0F2FE', screen: 'ChapterMcqEditor', params: { type: 'practice', typeLabel: 'Practice MCQs' } },
  { key: 'important_questions', name: 'Important Questions', sub: 'Questions with answers to revise', icon: Star, tint: S.gold, bg: S.goldSoft, screen: 'ChapterQuestionsEditor', params: { type: 'important_questions', typeLabel: 'Important Questions' } },
  { key: 'pyq', name: 'Previous Year Questions', sub: 'PYQ with solutions', icon: FileClock, tint: S.indigo, bg: S.indigoSoft, screen: 'ChapterQuestionsEditor', params: { type: 'pyq', typeLabel: 'Previous Year Questions' } },
];

export default function ChapterContentScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { id, name } = route.params || {};
  return (
    <View style={{ flex: 1, backgroundColor: S.canvas }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingRight: 18, paddingBottom: 10, paddingTop: insets.top + 8 }}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} style={{ padding: 4 }}>
          <ChevronLeft size={26} color={S.ink} strokeWidth={2.5} />
        </Pressable>
        <View style={{ flex: 1, minWidth: 0 }}>
          <T w="black" s={20} c={S.ink} numberOfLines={1}>{name || 'Chapter'}</T>
          <T w="semi" s={12.5} c={S.muted}>Content students read</T>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: insets.bottom + 30 }} showsVerticalScrollIndicator={false}>
        {TYPES.map((t) => (
          <Pressable key={t.key} onPress={() => navigation.navigate(t.screen, { id, name, ...t.params })}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: S.hair, padding: 15, marginBottom: 12, ...shadow }}>
            <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}><t.icon size={22} color={t.tint} strokeWidth={2.3} /></View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <T w="xbold" s={15} c={S.ink}>{t.name}</T>
              <T w="semi" s={12} c={S.muted} numberOfLines={1} style={{ marginTop: 2 }}>{t.sub}</T>
            </View>
            <ChevronRight size={20} color={S.faint} strokeWidth={2.4} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
