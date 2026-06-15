import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, StatusBar, Platform, Dimensions,
} from 'react-native';

const LETTERS = ['a', 'b', 'c', 'd', 'e', 'f'];
const MAX_W = Dimensions.get('window').width - 64; // card padding allowance

// Renders a base64/data-URI image at full width with its natural aspect ratio.
const AutoImage = ({ uri }) => {
  const [ratio, setRatio] = useState(1.6);
  useEffect(() => {
    let alive = true;
    Image.getSize(
      uri,
      (w, h) => { if (alive && w && h) setRatio(w / h); },
      () => {}
    );
    return () => { alive = false; };
  }, [uri]);
  return (
    <Image
      source={{ uri }}
      style={[st.img, { width: MAX_W, height: MAX_W / ratio }]}
      resizeMode="contain"
    />
  );
};

const ImageList = ({ images }) =>
  (images && images.length > 0)
    ? images.map((uri, i) => <AutoImage key={i} uri={uri} />)
    : null;

const QuestionCard = ({ item, index }) => {
  const [open, setOpen] = useState(true);
  const hasOptions = item.options && item.options.length > 0;

  return (
    <View style={st.card}>
      <View style={st.qHeader}>
        <View style={st.qPill}><Text style={st.qPillTxt}>{item.q || `Q${index + 1}`}</Text></View>
      </View>

      {!!item.text && <Text style={st.qText}>{item.text}</Text>}
      <ImageList images={item.questionImages} />

      {hasOptions && (
        <View style={st.options}>
          {item.options.map((opt, i) => {
            const correct = !!opt.correct;
            return (
              <View key={i} style={[st.option, correct && st.optionCorrect]}>
                <View style={st.optRow}>
                  <View style={[st.optBadge, correct && st.optBadgeCorrect]}>
                    <Text style={[st.optBadgeTxt, correct && st.optBadgeTxtCorrect]}>
                      {correct ? '✓' : LETTERS[i]}
                    </Text>
                  </View>
                  {!!opt.text && <Text style={[st.optText, correct && st.optTextCorrect]}>{opt.text}</Text>}
                </View>
                <ImageList images={opt.images} />
              </View>
            );
          })}
        </View>
      )}

      <TouchableOpacity style={st.solToggle} activeOpacity={0.7} onPress={() => setOpen(o => !o)}>
        <Text style={st.solToggleTxt}>{open ? 'Hide solution' : 'Show solution'}</Text>
        <Text style={st.solToggleIcon}>{open ? '−' : '+'}</Text>
      </TouchableOpacity>

      {open && (
        <View style={st.solBlock}>
          <Text style={st.solLabel}>{item.solutionLabel || 'Solution'}</Text>
          {!!item.solution && <Text style={st.solText}>{item.solution}</Text>}
          <ImageList images={item.solutionImages} />
        </View>
      )}
    </View>
  );
};

export default function ChapterEndScreen({ chapterName = 'Chapter', questions = [], onBack }) {
  return (
    <SafeAreaView style={st.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#fff' }} />}

      <View style={st.header}>
        <TouchableOpacity onPress={onBack} style={st.backRow}>
          <Text style={st.backArrow}>←</Text>
          <Text style={st.backTxt}>Back</Text>
        </TouchableOpacity>
      </View>

      <View style={st.titleWrap}>
        <Text style={st.title}>{chapterName}</Text>
        <Text style={st.sub}>Chapter-end · {questions.length} questions</Text>
      </View>

      {questions.length === 0 ? (
        <View style={st.empty}>
          <Text style={st.emptyTxt}>Solutions for this chapter are coming soon.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}>
          {questions.map((item, index) => (
            <QuestionCard key={index} item={item} index={index} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── Black & white styles ──────────────────────────────────────────────────────
const BLACK = '#1C1C1E';
const st = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: '#F7F7F7' },
  header:      { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#EFEFEF' },
  backRow:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backArrow:   { fontSize: 20, color: BLACK, fontWeight: '700' },
  backTxt:     { fontSize: 15, fontWeight: '700', color: BLACK },

  titleWrap:   { backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, borderBottomWidth: 1.5, borderBottomColor: '#EFEFEF' },
  title:       { fontSize: 21, fontWeight: '900', color: BLACK, letterSpacing: -0.4 },
  sub:         { fontSize: 13, color: '#8E8E93', fontWeight: '600', marginTop: 4 },

  empty:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTxt:    { fontSize: 14, color: '#8E8E93', fontWeight: '600', textAlign: 'center' },

  card:        { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1.5, borderColor: '#ECECEC', padding: 16 },
  qHeader:     { flexDirection: 'row', marginBottom: 10 },
  qPill:       { backgroundColor: BLACK, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10 },
  qPillTxt:    { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 0.3 },
  qText:       { fontSize: 15, color: BLACK, fontWeight: '700', lineHeight: 22, marginBottom: 10 },

  img:         { borderRadius: 8, borderWidth: 1, borderColor: '#ECECEC', backgroundColor: '#fff', marginVertical: 6, alignSelf: 'center' },

  options:     { gap: 8, marginTop: 8, marginBottom: 4 },
  option:      { borderWidth: 1.5, borderColor: '#ECECEC', borderRadius: 12, padding: 12, backgroundColor: '#fff' },
  optionCorrect: { borderColor: BLACK, backgroundColor: '#F5F5F5' },
  optRow:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  optBadge:    { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: '#D0D0D0', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  optBadgeCorrect: { backgroundColor: BLACK, borderColor: BLACK },
  optBadgeTxt: { fontSize: 13, fontWeight: '800', color: '#8E8E93' },
  optBadgeTxtCorrect: { color: '#fff' },
  optText:     { flex: 1, fontSize: 14, color: '#333', fontWeight: '600', lineHeight: 20 },
  optTextCorrect: { color: BLACK, fontWeight: '800' },

  solToggle:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingVertical: 8, paddingHorizontal: 2 },
  solToggleTxt:{ fontSize: 13, fontWeight: '800', color: BLACK, textDecorationLine: 'underline' },
  solToggleIcon:{ fontSize: 18, fontWeight: '900', color: BLACK },

  solBlock:    { backgroundColor: '#F5F5F5', borderRadius: 12, borderLeftWidth: 3, borderLeftColor: BLACK, padding: 14, marginTop: 2 },
  solLabel:    { fontSize: 12, fontWeight: '900', color: BLACK, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  solText:     { fontSize: 14, color: '#333', fontWeight: '500', lineHeight: 22 },
});