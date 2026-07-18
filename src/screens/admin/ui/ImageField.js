// src/screens/admin/ui/ImageField.js
// Reusable "attach an image" control for the admin content editors (question / option diagrams).
// Picks from the photo library (expo-image-picker), uploads to the server (Supabase Storage) and
// hands back the public URL via onChange(url). Pass onChange(null) is used by the remove button.
// Renders: an "Add image" button when empty, or a thumbnail + Replace/Remove when set.
import React, { useState } from 'react';
import { View, Text, Image, Pressable, ActivityIndicator, Alert } from 'react-native';
import { ImagePlus, X, RefreshCw } from 'lucide-react-native';
import { pickAndUploadImage } from './pickAndUploadImage';
import { apiError } from './format';
import { S } from '../../../theme/studentUI';

export default function ImageField({ value, onChange, compact = false }) {
  const [busy, setBusy] = useState(false);

  const pick = async () => {
    if (busy) return;
    try {
      setBusy(true);
      const url = await pickAndUploadImage();
      if (url) onChange(url);
    } catch (e) {
      Alert.alert('Could not upload image', apiError(e));
    } finally {
      setBusy(false);
    }
  };

  const thumbH = compact ? 56 : 96;

  if (value) {
    return (
      <View style={{ marginTop: 6 }}>
        <View style={{ position: 'relative', alignSelf: 'flex-start' }}>
          <Image source={{ uri: value }} style={{ width: compact ? 110 : '100%', maxWidth: 320, height: thumbH, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: S.hair }} resizeMode="contain" />
          <Pressable onPress={() => !busy && onChange(null)} hitSlop={8} style={{ position: 'absolute', top: -8, right: -8, width: 24, height: 24, borderRadius: 12, backgroundColor: S.red, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' }}>
            <X size={13} color="#fff" strokeWidth={3} />
          </Pressable>
        </View>
        <Pressable onPress={pick} hitSlop={6} disabled={busy} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 }}>
          {busy ? <ActivityIndicator size="small" color={S.indigo} /> : <RefreshCw size={12} color={S.indigo} strokeWidth={2.6} />}
          <Text style={{ fontSize: 11.5, fontWeight: '800', color: S.indigo }}>{busy ? 'Uploading…' : 'Replace image'}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable onPress={pick} disabled={busy} hitSlop={6} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: S.indigoSoft, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 6, marginTop: 6, opacity: busy ? 0.6 : 1 }}>
      {busy ? <ActivityIndicator size="small" color={S.indigo} /> : <ImagePlus size={14} color={S.indigo} strokeWidth={2.5} />}
      <Text style={{ fontSize: 12, fontWeight: '800', color: S.indigo }}>{busy ? 'Uploading…' : 'Add image'}</Text>
    </Pressable>
  );
}
