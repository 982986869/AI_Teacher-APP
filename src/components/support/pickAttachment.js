// src/components/support/pickAttachment.js
// Picking a file to attach to a support ticket — a screenshot of the error, a payment
// receipt, an invoice PDF.
//
// expo-document-picker / expo-image-picker are NATIVE modules. Loading them at import
// time crashes Expo Go ("Cannot find native module …") because this file sits in the
// graph for everyone, not just people who tap the paperclip. Same lazy-require pattern
// as src/screens/admin/ui/pickAndUploadImage.js.
import { Alert } from 'react-native';

let DocumentPicker = null;
let ImagePicker = null;
function getDocumentPicker() {
  if (DocumentPicker) return DocumentPicker;
  try { DocumentPicker = require('expo-document-picker'); } catch (e) { DocumentPicker = null; }
  return DocumentPicker;
}
function getImagePicker() {
  if (ImagePicker) return ImagePicker;
  try { ImagePicker = require('expo-image-picker'); } catch (e) { ImagePicker = null; }
  return ImagePicker;
}

// 10 MB. Above this the upload times out on a phone connection more often than it
// succeeds, and failing after a 60s wait is worse than refusing up front.
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

export function prettySize(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Returns { uri, name, mimeType, size } or null when the user cancels / is denied.
// Never throws — every failure path ends in an Alert the user can act on.
export async function pickDocument() {
  const DP = getDocumentPicker();
  if (!DP) {
    Alert.alert('Attachments unavailable', 'Attaching files needs the installed app (a dev build), not Expo Go.');
    return null;
  }
  try {
    const res = await DP.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true, multiple: false });
    if (res.canceled || !res.assets || !res.assets.length) return null;
    const a = res.assets[0];
    if (a.size && a.size > MAX_ATTACHMENT_BYTES) {
      Alert.alert('File too large', `Please attach something under ${prettySize(MAX_ATTACHMENT_BYTES)}.`);
      return null;
    }
    return { uri: a.uri, name: a.name || 'attachment', mimeType: a.mimeType, size: a.size };
  } catch (e) {
    Alert.alert('Could not open files', 'Please try again, or send it on WhatsApp.');
    return null;
  }
}

export async function pickPhoto() {
  const IP = getImagePicker();
  if (!IP) {
    Alert.alert('Photos unavailable', 'Attaching photos needs the installed app (a dev build), not Expo Go.');
    return null;
  }
  try {
    const perm = await IP.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Photo access needed', 'Allow photo access to attach a screenshot.');
      return null;
    }
    const res = await IP.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.8 });
    if (res.canceled || !res.assets || !res.assets.length) return null;
    const a = res.assets[0];
    if (a.fileSize && a.fileSize > MAX_ATTACHMENT_BYTES) {
      Alert.alert('Photo too large', `Please attach something under ${prettySize(MAX_ATTACHMENT_BYTES)}.`);
      return null;
    }
    const name = a.fileName || `screenshot-${String(a.assetId || 'image').slice(-6)}.jpg`;
    return { uri: a.uri, name, mimeType: a.mimeType || 'image/jpeg', size: a.fileSize };
  } catch (e) {
    Alert.alert('Could not open photos', 'Please try again, or send it on WhatsApp.');
    return null;
  }
}

// The paperclip offers both, because "attach" means a screenshot as often as a PDF.
export function chooseAttachment(onPicked) {
  Alert.alert('Attach', 'What would you like to attach?', [
    { text: 'Photo / screenshot', onPress: async () => { const f = await pickPhoto(); if (f) onPicked(f); } },
    { text: 'File', onPress: async () => { const f = await pickDocument(); if (f) onPicked(f); } },
    { text: 'Cancel', style: 'cancel' },
  ]);
}
