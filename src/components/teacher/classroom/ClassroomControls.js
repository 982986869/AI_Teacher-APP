import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Mic, Volume2, VolumeX, Plus, EllipsisVertical, Phone, ChevronUp, ChevronDown, Gauge } from 'lucide-react-native';
import { GLASS, GLASS_DARK, END_RED, LIVE_TEAL, FONT_SEMI, FONT_MED, FONT_BODY } from './theme';

const HIT = { top: 6, bottom: 6, left: 6, right: 6 };

function RoundBtn({ onPress, label, style, children, selected }) {
  return (
    <Pressable onPress={onPress} hitSlop={HIT} accessibilityRole="button" accessibilityLabel={label} accessibilityState={selected != null ? { selected } : undefined}
      style={({ pressed }) => [s.round, style, pressed && s.pressed]}>
      {children}
    </Pressable>
  );
}

// mic · speaker · + · ⋮ · end — the call-style row at the bottom centre.
export function CallControls({ micOn, micLabel, onMic, muted, onMute, onAsk, onMore, onEnd }) {
  return (
    <View style={s.row}>
      <RoundBtn onPress={onMic} label={micLabel} selected={micOn} style={micOn && s.micOn}>
        <Mic size={22} color="#fff" strokeWidth={2.1} />
      </RoundBtn>
      <RoundBtn onPress={onMute} label={muted ? 'Turn the teacher’s voice on' : 'Mute the teacher'} selected={!muted}>
        {muted ? <VolumeX size={22} color="#fff" strokeWidth={2.1} /> : <Volume2 size={22} color="#fff" strokeWidth={2.1} />}
      </RoundBtn>
      <RoundBtn onPress={onAsk} label="Ask by typing, or show your homework">
        <Plus size={23} color="#fff" strokeWidth={2.3} />
      </RoundBtn>
      <RoundBtn onPress={onMore} label="More options">
        <EllipsisVertical size={22} color="#fff" strokeWidth={2.4} />
      </RoundBtn>
      <RoundBtn onPress={onEnd} label="End the lesson" style={s.end}>
        <View style={s.hangup}><Phone size={21} color="#fff" strokeWidth={2.2} /></View>
      </RoundBtn>
    </View>
  );
}

export function SpeedPill({ speed, onPress }) {
  return (
    <Pressable onPress={onPress} hitSlop={HIT} accessibilityRole="button" accessibilityLabel={`Playback speed ${speed}x, tap to change`}
      style={({ pressed }) => [s.speed, pressed && s.pressed]}>
      <Gauge size={20} color="#5EEAD4" strokeWidth={2.2} />
      <Text style={s.speedTxt}>{speed}x</Text>
    </Pressable>
  );
}

export function ControlsToggle({ shown, onPress }) {
  const label = shown ? 'Hide controls' : 'Show controls';
  return (
    <Pressable onPress={onPress} hitSlop={HIT} accessibilityRole="button" accessibilityLabel={label}
      style={({ pressed }) => [s.pill, pressed && s.pressed]}>
      {shown ? <ChevronUp size={17} color="#fff" strokeWidth={2.5} /> : <ChevronDown size={17} color="#fff" strokeWidth={2.5} />}
      <Text style={s.pillTxt}>{label}</Text>
    </Pressable>
  );
}

// Top-left: what class this is and how long it has run (no avatar, by design).
export function SessionChip({ label, live, right }) {
  return (
    <View style={s.chip} accessibilityRole="header">
      <View style={[s.dot, live && s.dotLive]} />
      <Text style={s.chipTxt} numberOfLines={1}>{label}</Text>
      {right}
    </View>
  );
}

export const chipClockStyle = { color: '#D4D4D0', fontFamily: FONT_MED, fontSize: 13, fontVariant: ['tabular-nums'] };

export function CaptionBar({ children, maxWidth }) {
  return (
    <View style={[s.caption, maxWidth ? { maxWidth } : null]} accessibilityLiveRegion="polite">
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  round: { width: 50, height: 50, borderRadius: 25, backgroundColor: GLASS, alignItems: 'center', justifyContent: 'center' },
  micOn: { backgroundColor: LIVE_TEAL },
  end: { backgroundColor: END_RED },
  hangup: { transform: [{ rotate: '135deg' }] },
  pressed: { opacity: 0.75, transform: [{ scale: 0.96 }] },
  speed: { height: 50, borderRadius: 25, paddingLeft: 13, paddingRight: 16, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: GLASS },
  speedTxt: { color: '#fff', fontFamily: FONT_SEMI, fontSize: 16 },
  pill: { height: 40, borderRadius: 20, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: GLASS },
  pillTxt: { color: '#fff', fontFamily: FONT_SEMI, fontSize: 14 },
  chip: { height: 36, borderRadius: 18, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: GLASS, maxWidth: 420, flexShrink: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#C9CDD2' },
  dotLive: { backgroundColor: '#F87171' },
  chipTxt: { color: '#fff', fontFamily: FONT_SEMI, fontSize: 13, flexShrink: 1 },
  chipClock: { color: '#D4D4D0', fontFamily: FONT_MED, fontSize: 13, fontVariant: ['tabular-nums'] },
  caption: { alignSelf: 'center', backgroundColor: GLASS_DARK, borderRadius: 8, paddingHorizontal: 18, paddingVertical: 9 },
});

export const captionStyles = StyleSheet.create({
  txt: { color: '#fff', fontFamily: FONT_MED, fontSize: 16, lineHeight: 22, textAlign: 'center' },
  asked: { color: '#D4D4D0', fontFamily: FONT_MED, fontSize: 12, textAlign: 'center', marginBottom: 2 },
});
