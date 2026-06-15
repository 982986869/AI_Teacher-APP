import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import physicsChapters from '../data/physicsChapters';

// Same template (Image 1) for EVERY chapter.
// Reached via: navigation.navigate('ExemplarSolutions', { chapter })
// Falls back to chapter 1 if opened without params.
export default function ExemplarSolutionsScreen({ route, navigation }) {
  const chapter = route?.params?.chapter ?? physicsChapters[0];

  const openChapterEnd = () => {
    // Route to wherever the actual Chapter-end solutions render:
    // navigation.navigate('ChapterEnd', { chapter });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.wrap}>
        {/* Breadcrumb */}
        <View style={styles.breadcrumb}>
          <Text style={styles.crumbLink}>Home</Text>
          <Text style={styles.sep}> / </Text>
          <Text style={styles.crumbLink}>CBSE</Text>
          <Text style={styles.sep}> / </Text>
          <Text style={styles.crumbLink}>Class 11</Text>
          <Text style={styles.sep}> / </Text>
          <Text style={styles.crumbLink}>Physics</Text>
          <Text style={styles.sep}> / </Text>
          <Text style={styles.crumbCurrent}>Exemplar Solutions</Text>
        </View>

        {/* Card — titled with the selected chapter */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{chapter.title}</Text>
          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.6}
            onPress={openChapterEnd}
          >
            <View style={styles.badge}>
              <Text style={styles.badgeText}>1</Text>
            </View>
            <Text style={styles.rowLabel}>Chapter-end</Text>
            <Text style={styles.arrow}>{'\u2192'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  wrap: { padding: 20 },
  breadcrumb: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 18,
  },
  crumbLink: { fontSize: 13, color: '#1f8a93' },
  crumbCurrent: { fontSize: 13, color: '#64748b' },
  sep: { fontSize: 13, color: '#cbd5e1' },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e9ef',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#475569',
    paddingHorizontal: 22,
    paddingVertical: 18,
  },
  divider: { height: 1, backgroundColor: '#eef1f5' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 18,
  },
  badge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  badgeText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#475569' },
  arrow: { fontSize: 18, color: '#94a3b8' },
});