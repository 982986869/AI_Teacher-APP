import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, StatusBar, Platform, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const CATEGORIES = ['All', 'Technology', 'Science', 'Arts', 'Business'];

const PROGRAMS = [
  { emoji: '💻', name: 'Coding Bootcamp',      sub: 'Python, Web Dev, Apps',        category: 'Technology', students: '2.4k', duration: '8 weeks',  level: 'Beginner' },
  { emoji: '🤖', name: 'AI & Robotics',        sub: 'Machine learning basics',      category: 'Technology', students: '1.8k', duration: '6 weeks',  level: 'Intermediate' },
  { emoji: '🎤', name: 'Public Speaking',      sub: 'Confidence & communication',   category: 'Arts',       students: '3.1k', duration: '4 weeks',  level: 'All Levels' },
  { emoji: '📊', name: 'Data Science',         sub: 'Analyse & visualise data',     category: 'Technology', students: '2.2k', duration: '10 weeks', level: 'Intermediate' },
  { emoji: '🏆', name: 'Leadership Skills',    sub: 'Lead teams & projects',        category: 'Business',   students: '1.5k', duration: '5 weeks',  level: 'All Levels' },
  { emoji: '🎨', name: 'Creative Design',      sub: 'UI/UX and visual thinking',    category: 'Arts',       students: '2.0k', duration: '6 weeks',  level: 'Beginner' },
];

const TRENDING = [
  { rank: 1, title: 'Machine Learning Basics',  views: '12k', emoji: '🤖' },
  { rank: 2, title: 'Quantum Physics 101',       views: '9.4k', emoji: '⚛️' },
  { rank: 3, title: 'Financial Literacy',        views: '8.1k', emoji: '💰' },
  { rank: 4, title: 'Creative Writing Masterclass', views: '7.3k', emoji: '✍️' },
];

const LEVEL_COLORS = { 'Beginner': '#E8E8E8', 'Intermediate': '#D8D8D8', 'All Levels': '#F0F0F0' };

const ExploreScreen = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const filtered = activeCategory === 'All' ? PROGRAMS : PROGRAMS.filter(p => p.category === activeCategory);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#fff' }} />}

      <View style={s.header}>
        <Text style={s.headerTitle}>Explore</Text>
        <View style={s.searchBtn}>
          <Text style={{ fontSize: 16 }}>🔍</Text>
          <Text style={s.searchTxt}>Search programs...</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* Hero banner */}
        <View style={s.heroBanner}>
          <View style={s.heroLeft}>
            <Text style={s.heroTag}>NEW THIS MONTH</Text>
            <Text style={s.heroTitle}>AI & Machine{'\n'}Learning Track</Text>
            <TouchableOpacity style={s.heroBtn}>
              <Text style={s.heroBtnTxt}>Explore Now →</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.heroEmoji}>🚀</Text>
        </View>

        {/* Category pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 14, gap: 8 }}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity key={cat}
              style={[s.catChip, activeCategory === cat && s.catChipActive]}
              onPress={() => setActiveCategory(cat)}>
              <Text style={[s.catChipTxt, activeCategory === cat && s.catChipTxtActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Programs grid */}
        <View style={s.programsGrid}>
          {filtered.map((prog, i) => (
            <View key={i} style={s.programCard}>
              <View style={s.programIconWrap}>
                <Text style={{ fontSize: 30 }}>{prog.emoji}</Text>
              </View>
              <Text style={s.programName}>{prog.name}</Text>
              <Text style={s.programSub}>{prog.sub}</Text>
              <View style={s.programMeta}>
                <View style={s.metaChip}><Text style={s.metaChipTxt}>⏱ {prog.duration}</Text></View>
                <View style={[s.metaChip, { backgroundColor: LEVEL_COLORS[prog.level] }]}>
                  <Text style={s.metaChipTxt}>{prog.level}</Text>
                </View>
              </View>
              <View style={s.programFooter}>
                <Text style={s.studentsCount}>👥 {prog.students} students</Text>
                <TouchableOpacity style={s.registerBtn}>
                  <Text style={s.registerTxt}>Register</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Trending */}
        <Text style={s.sectionTitle}>🔥 Trending Topics</Text>
        <View style={s.trendingCard}>
          {TRENDING.map((t, i) => (
            <TouchableOpacity key={i} style={[s.trendRow, i < TRENDING.length - 1 && s.trendRowBorder]}>
              <View style={[s.rankBadge, i === 0 && s.rankBadgeFirst]}>
                <Text style={[s.rankTxt, i === 0 && { color: '#fff' }]}>{t.rank}</Text>
              </View>
              <Text style={{ fontSize: 22 }}>{t.emoji}</Text>
              <Text style={s.trendTitle}>{t.title}</Text>
              <View style={{ flexShrink: 0 }}>
                <Text style={s.trendViews}>{t.views} views</Text>
              </View>
              <Text style={s.trendArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom CTA */}
        <View style={s.ctaCard}>
          <Text style={s.ctaTitle}>Can't find what{'\n'}you're looking for?</Text>
          <Text style={s.ctaSub}>Request a new skill program and our team will create it for you.</Text>
          <TouchableOpacity style={s.ctaBtn}>
            <Text style={s.ctaBtnTxt}>Request a Program  →</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: '#F7F7F7' },
  header:           { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1.5, borderBottomColor: '#F0F0F0', gap: 12 },
  headerTitle:      { fontSize: 22, fontWeight: '900', color: '#1C1C1E', letterSpacing: -0.5 },
  searchBtn:        { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F7F7F7', borderRadius: 14, paddingVertical: 11, paddingHorizontal: 14, borderWidth: 1.5, borderColor: '#F0F0F0' },
  searchTxt:        { fontSize: 14, color: '#C7C7CC', fontWeight: '600' },
  heroBanner:       { margin: 16, backgroundColor: '#1C1C1E', borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden' },
  heroLeft:         { flex: 1 },
  heroTag:          { fontSize: 10, fontWeight: '900', color: '#888', letterSpacing: 1.2, marginBottom: 8 },
  heroTitle:        { fontSize: 22, fontWeight: '900', color: '#fff', lineHeight: 28, letterSpacing: -0.5, marginBottom: 16 },
  heroBtn:          { backgroundColor: '#fff', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 18, alignSelf: 'flex-start' },
  heroBtnTxt:       { fontSize: 13, fontWeight: '900', color: '#1C1C1E' },
  heroEmoji:        { fontSize: 64, marginLeft: 10 },
  catChip:          { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 18, borderWidth: 1.5, borderColor: '#E8E8E8', backgroundColor: '#fff' },
  catChipActive:    { backgroundColor: '#1C1C1E', borderColor: '#1C1C1E' },
  catChipTxt:       { fontSize: 13, fontWeight: '800', color: '#8E8E93' },
  catChipTxtActive: { color: '#fff' },
  programsGrid:     { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12 },
  programCard:      { width: (width - 44) / 2, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1.5, borderColor: '#F0F0F0', padding: 14 },
  programIconWrap:  { width: 56, height: 56, backgroundColor: '#F7F7F7', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 10, borderWidth: 1.5, borderColor: '#F0F0F0' },
  programName:      { fontSize: 14, fontWeight: '900', color: '#1C1C1E', letterSpacing: -0.3, marginBottom: 4 },
  programSub:       { fontSize: 11, color: '#8E8E93', fontWeight: '600', lineHeight: 16, marginBottom: 10 },
  programMeta:      { flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
  metaChip:         { backgroundColor: '#F0F0F0', borderRadius: 7, paddingVertical: 3, paddingHorizontal: 8 },
  metaChipTxt:      { fontSize: 9, fontWeight: '800', color: '#8E8E93' },
  programFooter:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  studentsCount:    { fontSize: 10, color: '#8E8E93', fontWeight: '600' },
  registerBtn:      { backgroundColor: '#1C1C1E', borderRadius: 9, paddingVertical: 6, paddingHorizontal: 12 },
  registerTxt:      { fontSize: 11, fontWeight: '800', color: '#fff' },
  sectionTitle:     { fontSize: 17, fontWeight: '900', color: '#1C1C1E', letterSpacing: -0.3, paddingHorizontal: 16, marginTop: 16, marginBottom: 12 },
  trendingCard:     { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1.5, borderColor: '#F0F0F0', overflow: 'hidden' },
  trendRow:         { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  trendRowBorder:   { borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  rankBadge:        { width: 28, height: 28, borderRadius: 8, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center' },
  rankBadgeFirst:   { backgroundColor: '#1C1C1E' },
  rankTxt:          { fontSize: 13, fontWeight: '900', color: '#8E8E93' },
  trendTitle:       { flex: 1, fontSize: 13, fontWeight: '700', color: '#1C1C1E' },
  trendViews:       { fontSize: 11, color: '#8E8E93', fontWeight: '600' },
  trendArrow:       { fontSize: 18, color: '#C7C7CC' },
  ctaCard:          { margin: 16, backgroundColor: '#1C1C1E', borderRadius: 22, padding: 22 },
  ctaTitle:         { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: -0.5, marginBottom: 8, lineHeight: 26 },
  ctaSub:           { fontSize: 13, color: '#888', fontWeight: '600', lineHeight: 19, marginBottom: 18 },
  ctaBtn:           { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  ctaBtnTxt:        { fontSize: 14, fontWeight: '900', color: '#1C1C1E' },
});

export default ExploreScreen;