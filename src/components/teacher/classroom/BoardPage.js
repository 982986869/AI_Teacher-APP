import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { TriangleAlert } from 'lucide-react-native';
import { LINE_COLOR, INK_DIM, FONT_HEAD, FONT_BODY, FONT_MED } from './theme';

// One line being written: characters appear at a hand-writing pace (scaled by the
// playback speed) with a blinking cursor; a paused lesson freezes the pen.
function TypeLine({ text, speed = 1, paused, style, onGrow }) {
  const [n, setN] = useState(0);
  useEffect(() => { setN(0); }, [text]);
  useEffect(() => {
    if (paused || n >= text.length) return undefined;
    const t = setTimeout(() => { setN((x) => Math.min(text.length, x + Math.max(1, Math.round(speed * 1.4)))); if (onGrow && n % 16 === 0) onGrow(); }, 30);
    return () => clearTimeout(t);
  }, [n, text, speed, paused, onGrow]);
  const [blink, setBlink] = useState(true);
  useEffect(() => { const t = setInterval(() => setBlink((b) => !b), 420); return () => clearInterval(t); }, []);
  const done = n >= text.length;
  return (
    <Text style={style} accessibilityLabel={text}>
      {text.slice(0, n)}
      {!done && <Text style={{ opacity: blink ? 1 : 0 }}>▏</Text>}
    </Text>
  );
}

function LineView({ line, typing, speed, paused, onGrow }) {
  const style = [s.line, s[line.kind] || s.pt];
  const body = typing
    ? <TypeLine text={line.kind === 'pt' ? `• ${line.text}` : line.text} speed={speed} paused={paused} style={style} onGrow={onGrow} />
    : <Text style={style}>{line.kind === 'pt' ? `• ${line.text}` : line.text}</Text>;
  if (line.kind !== 'warn') return body;
  return (
    <View style={s.warnRow}>
      <TriangleAlert size={17} color={LINE_COLOR.warn} strokeWidth={2.2} style={s.warnIcon} />
      <View style={{ flex: 1 }}>{body}</View>
    </View>
  );
}

// The notebook page: every line taught so far stays on the board; the newest one is
// written live. `doubt` swaps the page for the student's question and her answer.
export default function BoardPage({ lines, revealed, sceneKey, speed = 1, paused = false, doubt = null, children, style }) {
  const scrollRef = useRef(null);
  // Follow the pen down the page only once the writing actually runs past the visible
  // board (the bottom padding keeps the newest line clear of the caption bar).
  const box = useRef({ h: 0, ch: 0 });
  const toEnd = useRef(() => { const b = box.current; if (scrollRef.current && b.h > 0 && b.ch > b.h + 1) scrollRef.current.scrollToEnd({ animated: true }); }).current;
  const measure = { onLayout: (e) => { box.current.h = e.nativeEvent.layout.height; }, onContentSizeChange: (w, h) => { box.current.ch = h; } };
  useEffect(() => { const t = setTimeout(toEnd, 60); return () => clearTimeout(t); }, [revealed, sceneKey, doubt && doubt.a, toEnd]);

  if (doubt) {
    return (
      <ScrollView ref={scrollRef} style={style} contentContainerStyle={s.body} showsVerticalScrollIndicator={false} {...measure}>
        <Text style={[s.line, s.title]}>Your question</Text>
        <Text style={[s.line, s.pt, s.question]}>“{doubt.q}”</Text>
        {doubt.a ? <Text style={[s.line, s.answer]}>{doubt.a}</Text> : <Text style={[s.line, s.thinking]}>Thinking…</Text>}
        {children}
      </ScrollView>
    );
  }

  const shown = lines.slice(0, revealed);
  return (
    <ScrollView ref={scrollRef} style={style} contentContainerStyle={s.body} showsVerticalScrollIndicator={false} nestedScrollEnabled {...measure}>
      {shown.map((ln, i) => (
        <LineView key={`${sceneKey}-${i}`} line={ln} typing={i === shown.length - 1} speed={speed} paused={paused} onGrow={i === shown.length - 1 ? toEnd : undefined} />
      ))}
      {children}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  body: { paddingBottom: 130, gap: 8 },
  line: { fontFamily: FONT_BODY, fontSize: 17, lineHeight: 24 },
  title: { fontFamily: FONT_HEAD, fontSize: 25, lineHeight: 32, color: LINE_COLOR.title, marginBottom: 4 },
  pt: { color: LINE_COLOR.pt },
  formula: { fontFamily: FONT_MED, fontSize: 19, lineHeight: 28, color: LINE_COLOR.formula, alignSelf: 'flex-start', backgroundColor: 'rgba(29,100,168,0.07)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6, marginLeft: -10 },
  eg: { color: LINE_COLOR.eg, marginTop: 4 },
  warn: { fontFamily: FONT_MED, color: LINE_COLOR.warn },
  warnRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 4 },
  warnIcon: { marginTop: 3, marginRight: 7 },
  question: { fontFamily: FONT_MED },
  answer: { color: LINE_COLOR.answer, marginTop: 4 },
  thinking: { color: INK_DIM, fontStyle: 'italic' },
});
