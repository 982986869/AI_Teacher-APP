// src/components/HomeworkPhotos.js
// Photos on homework, for both sides: the teacher's worksheet / question photos and the
// student's photos of their work.
//   <PhotoPicker value={urls} onChange={setUrls} />  add (camera / gallery) + remove, uploads at once
//   <PhotoRow images={urls} />                         read-only thumbnails
// Tapping any thumbnail opens it full screen.
//
// expo-image-picker is required lazily, the same way the rest of the app does: loading it
// at import time crashed Expo Go builds without the native module, and this file is pulled
// into Home for every student.
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Modal, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, ImagePlus, X, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { uploadHomeworkPhoto } from '../api/teachingApi';
import { DAY, DFONT as F } from '../theme/dayTheme';

export const MAX_PHOTOS = 5;

let IP = null;
const picker = () => { if (!IP) { try { IP = require('expo-image-picker'); } catch (_) { IP = null; } } return IP; };

const errText = (e) => e?.response?.data?.error || e?.message || 'Could not add the photo. Try again.';

export function PhotoPicker({ value = [], onChange, max = MAX_PHOTOS, label = 'Add photo' }) {
  const [busy, setBusy] = useState(0);       // photos uploading now
  const [error, setError] = useState(null);
  const [viewAt, setViewAt] = useState(-1);
  const room = max - value.length - busy;

  async function add(from) {
    setError(null);
    const P = picker();
    if (!P) { setError('Adding photos needs the installed app.'); return; }
    try {
      if (from === 'camera') {
        const perm = await P.requestCameraPermissionsAsync();
        if (!perm.granted) { setError('Allow camera access to take a photo.'); return; }
      }
      const opts = { mediaTypes: ['images'], quality: 0.6 };
      const res = from === 'camera'
        ? await P.launchCameraAsync(opts)
        : await P.launchImageLibraryAsync({ ...opts, allowsMultipleSelection: room > 1, selectionLimit: Math.max(1, room) });
      if (res.canceled || !res.assets || !res.assets.length) return;
      const assets = res.assets.slice(0, Math.max(0, room));
      setBusy((n) => n + assets.length);
      const added = [];
      for (const a of assets) {
        try { added.push(await uploadHomeworkPhoto(a)); } catch (e) { setError(errText(e)); }
        setBusy((n) => n - 1);
      }
      if (added.length) onChange([...value, ...added].slice(0, max));
    } catch (e) {
      setError(errText(e));
    }
  }

  return (
    <View>
      <View style={ph.row}>
        {value.map((u, i) => (
          <View key={u} style={ph.thumbWrap}>
            <Pressable onPress={() => setViewAt(i)} accessibilityRole="imagebutton" accessibilityLabel={`Photo ${i + 1}. Tap to see it large.`}>
              <Image source={{ uri: u }} style={ph.thumb} />
            </Pressable>
            <Pressable onPress={() => onChange(value.filter((x) => x !== u))} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Remove photo ${i + 1}`} style={ph.remove}>
              <X size={13} color="#fff" strokeWidth={3} />
            </Pressable>
          </View>
        ))}
        {Array.from({ length: busy }).map((_, i) => (
          <View key={`busy-${i}`} style={[ph.thumb, ph.busy]}><ActivityIndicator color={DAY.violet} /></View>
        ))}
      </View>
      {room > 0 && (
        <View style={ph.buttons}>
          <Pressable onPress={() => add('camera')} accessibilityRole="button" style={({ pressed }) => [ph.btn, pressed && { opacity: 0.7 }]}>
            <Camera size={16} color={DAY.ink} strokeWidth={2.2} />
            <Text style={ph.btnText}>Camera</Text>
          </Pressable>
          <Pressable onPress={() => add('gallery')} accessibilityRole="button" style={({ pressed }) => [ph.btn, pressed && { opacity: 0.7 }]}>
            <ImagePlus size={16} color={DAY.ink} strokeWidth={2.2} />
            <Text style={ph.btnText}>{value.length ? 'Add more' : label}</Text>
          </Pressable>
          <Text style={ph.count}>{value.length}/{max}</Text>
        </View>
      )}
      {!!error && <Text style={ph.error}>{error}</Text>}
      <PhotoViewer images={value} index={viewAt} onClose={() => setViewAt(-1)} />
    </View>
  );
}

export function PhotoRow({ images = [], size = 76 }) {
  const [viewAt, setViewAt] = useState(-1);
  if (!images.length) return null;
  return (
    <View>
      <View style={ph.row}>
        {images.map((u, i) => (
          <Pressable key={u} onPress={() => setViewAt(i)} accessibilityRole="imagebutton" accessibilityLabel={`Photo ${i + 1} of ${images.length}. Tap to see it large.`}>
            <Image source={{ uri: u }} style={[ph.thumb, { width: size, height: size }]} />
          </Pressable>
        ))}
      </View>
      <PhotoViewer images={images} index={viewAt} onClose={() => setViewAt(-1)} />
    </View>
  );
}

// Full screen, contained (never cropped), with previous / next for several photos.
export function PhotoViewer({ images, index, onClose }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [at, setAt] = useState(index);
  React.useEffect(() => { setAt(index); }, [index]);
  if (index < 0 || !images[at]) return null;
  return (
    <Modal visible animationType="fade" onRequestClose={onClose} statusBarTranslucent supportedOrientations={['portrait', 'landscape']}>
      <View style={[pv.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Image source={{ uri: images[at] }} style={{ width, height: height - insets.top - insets.bottom - 80 }} resizeMode="contain" accessibilityLabel={`Photo ${at + 1} of ${images.length}`} />
        <View style={pv.bar}>
          {images.length > 1 ? (
            <>
              <Pressable onPress={() => setAt((a) => Math.max(0, a - 1))} disabled={at === 0} hitSlop={10} accessibilityLabel="Previous photo" style={[pv.nav, at === 0 && { opacity: 0.3 }]}>
                <ChevronLeft size={24} color="#fff" strokeWidth={2.4} />
              </Pressable>
              <Text style={pv.count}>{at + 1} / {images.length}</Text>
              <Pressable onPress={() => setAt((a) => Math.min(images.length - 1, a + 1))} disabled={at === images.length - 1} hitSlop={10} accessibilityLabel="Next photo" style={[pv.nav, at === images.length - 1 && { opacity: 0.3 }]}>
                <ChevronRight size={24} color="#fff" strokeWidth={2.4} />
              </Pressable>
            </>
          ) : <View />}
        </View>
        <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close the photo" style={[pv.close, { top: insets.top + 10 }]}>
          <X size={22} color="#fff" strokeWidth={2.4} />
        </Pressable>
      </View>
    </Modal>
  );
}

const ph = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  thumbWrap: { position: 'relative' },
  thumb: { width: 76, height: 76, borderRadius: 14, backgroundColor: DAY.cardSoft, borderWidth: 1, borderColor: DAY.cardEdge },
  busy: { alignItems: 'center', justifyContent: 'center' },
  remove: { position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  buttons: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 38, paddingHorizontal: 14, borderRadius: 999, backgroundColor: DAY.cardSoft, borderWidth: 1, borderColor: DAY.cardEdge },
  btnText: { fontFamily: F.bold, fontSize: 13, color: DAY.ink },
  count: { fontFamily: F.semi, fontSize: 12, color: DAY.inkDim, marginLeft: 'auto' },
  error: { fontFamily: F.semi, fontSize: 13, color: DAY.red, marginTop: 8 },
});

const pv = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0D12', alignItems: 'center', justifyContent: 'center' },
  bar: { height: 80, width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24 },
  nav: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  count: { fontFamily: F.bold, fontSize: 15, color: '#fff' },
  close: { position: 'absolute', right: 14, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
});
