// src/screens/ChapterListScreen.js
// Lists every chapter from the question bank. Tap one to start it.

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { chapterList } from '../data/questionBank';

const COLORS = {
  purple: '#534AB7',
  purpleLight: '#EEEDFE',
  purpleDeep: '#26215C',
  text: '#2C2C2A',
  textMuted: '#5F5E5A',
  textTertiary: '#9A9A9A',
  border: '#ECECEC',
  white: '#FFFFFF',
  pageBg: '#F4F5FB',
};

export default function ChapterListScreen({ subject = 'Physics · Class 11', onSelectChapter = () => {}, onBack }) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <View style={styles.header}>
        {onBack && (
          <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </Pressable>
        )}
        <Text style={styles.title}>Practice</Text>
        <Text style={styles.subtitle}>{subject}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {chapterList.map((ch) => (
          <Pressable
            key={ch.id}
            onPress={() => onSelectChapter(ch)}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <View style={styles.cardLeft}>
              <Text style={styles.cardName}>{ch.name}</Text>
              <Text style={styles.cardCount}>{ch.count} questions</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
          </Pressable>
        ))}
        <View style={{ height: 16 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.pageBg },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: COLORS.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  backBtn: { marginBottom: 6 },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.purpleDeep },
  subtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  list: { padding: 16, gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  cardPressed: { backgroundColor: COLORS.purpleLight },
  cardLeft: { flex: 1, paddingRight: 12 },
  cardName: { fontSize: 15, fontWeight: '500', color: COLORS.text },
  cardCount: { fontSize: 12.5, color: COLORS.textMuted, marginTop: 3 },
});