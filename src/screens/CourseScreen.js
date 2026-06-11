import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import COLORS from '../constants/colors';
import MathsNotes from '../notes/MathsNotes';
import notesImages from '../notes/notesImages';

const CourseScreen = () => {
  const chapters = Object.keys(MathsNotes);
  const [activeChapter, setActiveChapter] = useState(chapters[0]);
  const chapter = MathsNotes[activeChapter];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Chapter selector */}
      <View style={styles.tabsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
        >
          {chapters.map((name, idx) => {
            const active = name === activeChapter;
            return (
              <TouchableOpacity
                key={name}
                onPress={() => setActiveChapter(name)}
                style={[styles.tab, active && styles.tabActive]}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {idx + 1}. {name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Chapter content */}
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.chapterTitle}>{activeChapter}</Text>
        {chapter.intro ? <Text style={styles.intro}>{chapter.intro}</Text> : null}

        {chapter.sections.map((section, sIdx) => (
          <View key={sIdx} style={styles.card}>
            {section.title ? (
              <Text style={styles.sectionTitle}>{section.title}</Text>
            ) : null}

            {section.content ? (
              <Text style={styles.bodyText}>{section.content}</Text>
            ) : null}

            {/* Bullets */}
            {section.bullets?.map((b, i) => (
              <View key={i} style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{b}</Text>
              </View>
            ))}

            {/* Images — your snippet, integrated */}
            {section.images?.map((key, i) => (
              <View key={key} style={styles.imageWrap}>
                <Image
                  source={notesImages[key]}
                  style={styles.image}
                  resizeMode="contain"
                />
                {section.imageLabels?.[i] ? (
                  <Text style={styles.caption}>{section.imageLabels[i]}</Text>
                ) : null}
              </View>
            ))}

            {/* Table */}
            {section.table ? (
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeaderRow]}>
                  {section.table.headers.map((h, i) => (
                    <Text key={i} style={[styles.tableCell, styles.tableHeaderCell]}>
                      {h}
                    </Text>
                  ))}
                </View>
                {section.table.rows.map((row, rI) => (
                  <View key={rI} style={styles.tableRow}>
                    {row.map((cell, cI) => (
                      <Text key={cI} style={styles.tableCell}>
                        {cell}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },

  tabsWrap: { borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB' },
  tabs: { paddingHorizontal: 12, paddingVertical: 10 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F4F7',
    marginRight: 8,
  },
  tabActive: { backgroundColor: COLORS.textPrimary },
  tabText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  tabTextActive: { color: COLORS.white },

  content: { padding: 16 },
  chapterTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary },
  intro: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4, marginBottom: 12 },

  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  bodyText: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 21, marginBottom: 4 },

  bulletRow: { flexDirection: 'row', marginTop: 6 },
  bulletDot: { fontSize: 14, color: COLORS.textSecondary, marginRight: 8, lineHeight: 21 },
  bulletText: { flex: 1, fontSize: 14, color: COLORS.textPrimary, lineHeight: 21 },

  imageWrap: { marginTop: 12, alignItems: 'center' },
  image: { width: '100%', height: 200 },
  caption: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 6,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  table: { marginTop: 12, borderWidth: 0.5, borderColor: '#E5E7EB', borderRadius: 8, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB' },
  tableHeaderRow: { backgroundColor: '#F2F4F7' },
  tableCell: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textPrimary,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRightWidth: 0.5,
    borderRightColor: '#E5E7EB',
  },
  tableHeaderCell: { fontWeight: '700' },
});

export default CourseScreen;