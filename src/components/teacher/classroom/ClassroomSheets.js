import React from 'react';
import { View, Text, TextInput, Pressable, Modal, StyleSheet, ScrollView, useWindowDimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { Camera, SendHorizontal, X } from 'lucide-react-native';
import { INK, INK_DIM, LIVE_TEAL, FONT_HEAD, FONT_SEMI, FONT_MED } from './theme';

// Both sheets rise from the bottom of the landscape board. supportedOrientations is
// required: an iOS Modal is portrait-only by default and would spin the screen back.
const ORIENTS = ['landscape', 'landscape-left', 'landscape-right', 'portrait'];

function Sheet({ visible, onClose, title, children, width }) {
  const { width: W } = useWindowDimensions();
  return (
    <Modal visible={visible} transparent animationType="slide" supportedOrientations={ORIENTS} onRequestClose={onClose}>
      <KeyboardAvoidingView style={s.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={s.scrim} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
        <View style={[s.sheet, { width: Math.min(width, W - 32) }]}>
          <View style={s.head}>
            <Text style={s.title} accessibilityRole="header">{title}</Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close" style={s.close}>
              <X size={18} color={INK_DIM} strokeWidth={2.4} />
            </Pressable>
          </View>
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// "+": type a doubt (the lesson waits) or hold homework up to the camera.
export function AskSheet({ visible, onClose, value, onChange, onSend, starters = [], onCamera, cameraOk }) {
  const canSend = !!String(value || '').trim();
  return (
    <Sheet visible={visible} onClose={onClose} title="Ask your teacher" width={560}>
      <View style={s.askRow}>
        <TextInput
          style={s.input}
          placeholder="Type your doubt — the lesson waits"
          placeholderTextColor="#8A929C"
          value={value}
          onChangeText={onChange}
          onSubmitEditing={() => canSend && onSend()}
          returnKeyType="send"
          autoFocus
          accessibilityLabel="Your question"
        />
        <Pressable onPress={onSend} disabled={!canSend} accessibilityRole="button" accessibilityLabel="Send question"
          style={({ pressed }) => [s.send, !canSend && s.sendDim, pressed && { opacity: 0.8 }]}>
          <SendHorizontal size={18} color="#fff" strokeWidth={2.4} />
        </Pressable>
      </View>
      {!value && starters.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.starters} keyboardShouldPersistTaps="handled">
          {starters.map((q) => (
            <Pressable key={q} onPress={() => onSend(q)} style={s.starter} accessibilityRole="button" accessibilityLabel={q}>
              <Text style={s.starterTxt} numberOfLines={1}>{q}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
      <Pressable onPress={onCamera} style={s.rowBtn} accessibilityRole="button"
        accessibilityLabel={cameraOk ? 'Show your homework to the camera' : 'Camera is not available in this build'}>
        <Camera size={19} color={cameraOk ? LIVE_TEAL : INK_DIM} strokeWidth={2} />
        <Text style={[s.rowTxt, !cameraOk && { color: INK_DIM }]}>Show your homework to the camera</Text>
      </Pressable>
    </Sheet>
  );
}

// "⋮": everything else the lesson offers, as a 3-column grid of tiles.
export function MoreSheet({ visible, onClose, items }) {
  return (
    <Sheet visible={visible} onClose={onClose} title="More" width={640}>
      <View style={s.grid}>
        {items.map(({ key, Icon, label, on, run, disabled }) => (
          <Pressable key={key} disabled={disabled} onPress={() => { onClose(); run(); }}
            accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !!disabled, selected: !!on }}
            style={({ pressed }) => [s.tile, on && s.tileOn, disabled && { opacity: 0.4 }, pressed && { opacity: 0.75 }]}>
            <Icon size={18} color={LIVE_TEAL} strokeWidth={2.1} />
            <Text style={s.tileTxt} numberOfLines={1}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </Sheet>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20,20,20,0.30)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 18, gap: 12 },
  head: { flexDirection: 'row', alignItems: 'center' },
  title: { flex: 1, fontFamily: FONT_HEAD, fontSize: 17, color: INK },
  close: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F2F2EF' },
  askRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: { flex: 1, height: 46, borderRadius: 23, borderWidth: 1, borderColor: '#DADAD5', paddingHorizontal: 16, fontFamily: FONT_MED, fontSize: 15, color: INK },
  send: { width: 46, height: 46, borderRadius: 23, backgroundColor: LIVE_TEAL, alignItems: 'center', justifyContent: 'center' },
  sendDim: { opacity: 0.4 },
  starters: { gap: 8 },
  starter: { height: 36, borderRadius: 18, paddingHorizontal: 14, justifyContent: 'center', backgroundColor: '#F0F7F6', borderWidth: 1, borderColor: '#CDE6E3' },
  starterTxt: { fontFamily: FONT_MED, fontSize: 13, color: '#0B5F58' },
  rowBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 48, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E7E7E3' },
  rowTxt: { fontFamily: FONT_SEMI, fontSize: 14, color: INK },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: { width: '32%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 10, height: 48, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E7E7E3', backgroundColor: '#fff' },
  tileOn: { borderColor: LIVE_TEAL, backgroundColor: '#F0F7F6' },
  tileTxt: { fontFamily: FONT_SEMI, fontSize: 14, color: INK, flexShrink: 1 },
});

