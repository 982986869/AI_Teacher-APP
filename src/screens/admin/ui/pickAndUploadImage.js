// src/screens/admin/ui/pickAndUploadImage.js
// Shared "pick from library → upload → return public URL" used by ImageField (structured
// question/option image) and the paper HTML editor (insert <img> into freeform HTML).
import { Alert } from 'react-native';
import { uploadContentImage } from '../../../api/adminApi';
import { apiError } from './format';

// expo-image-picker is a NATIVE module. Loading it at import time crashes Expo Go
// ("Cannot find native module ExponentImagePicker") because the app graph pulls this
// file in even for students who never touch the admin image tools. Require it lazily so
// the native lookup happens only when an admin actually picks an image (a dev build).
let ImagePicker = null;
function getImagePicker() {
  if (ImagePicker) return ImagePicker;
  try { ImagePicker = require('expo-image-picker'); } catch (e) { ImagePicker = null; }
  return ImagePicker;
}

// Returns the uploaded image's public URL, or null if the user cancelled or was denied access.
// Throws only on a genuine upload failure (caller shows the error).
export async function pickAndUploadImage() {
  const ImagePicker = getImagePicker();
  if (!ImagePicker) {
    Alert.alert('Image picker unavailable', 'Attaching images needs the installed app (a dev build), not Expo Go.');
    return null;
  }
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Photo access needed', 'Allow photo access to attach an image.');
    return null;
  }
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.8 });
  if (res.canceled || !res.assets || !res.assets.length) return null;
  const { url } = await uploadContentImage(res.assets[0]);
  return url;
}

// Convenience wrapper that swallows errors into an Alert and returns null — for buttons that
// just want "give me a URL or nothing".
export async function pickAndUploadImageSafe() {
  try {
    return await pickAndUploadImage();
  } catch (e) {
    Alert.alert('Could not upload image', apiError(e));
    return null;
  }
}
