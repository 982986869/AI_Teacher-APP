// src/components/brand/PolicyModal.js
// The privacy policy, shown IN the app rather than handed to a browser.
//
// Signup blocks on a tick-box that says "I agree to Terms & Privacy Policy", and
// until now neither half could be opened — the words were styled as links with no
// handler. Asking someone to agree to a document they cannot read is the one thing
// a consent control must not do, and Play's Data Safety review looks for exactly
// this on an app with under-18 users.
//
// A WEBVIEW over the live page, not a copy of the text. Legal copy pasted into the
// bundle goes stale the moment the site is edited, and then the app is showing a
// policy that is not the policy — worse than linking out. One source of truth,
// ailernova.in, rendered inside a sheet the student can dismiss without losing
// their half-filled signup form.
//
// Offline or site down: onError swaps in a short message with the address, so the
// student is never left staring at a blank white sheet.
import React, { useState } from 'react';
import {
  View, Text, Modal, StyleSheet, ActivityIndicator, Pressable, Linking, Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { X } from 'lucide-react-native';
import { COLORS, FONT_FAMILY, SPACING } from '../../theme/designSystem';

export default function PolicyModal({ visible, onClose, url, title = 'Privacy Policy' }) {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  // Re-arm on each open: a student who hits a dead network once should not see the
  // error state forever after the connection comes back.
  const handleShow = () => { setLoading(true); setFailed(false); };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      onShow={handleShow}
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : undefined}
    >
      <View style={s.root}>
        <View style={s.head}>
          <Text style={s.title} numberOfLines={1}>{title}</Text>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={s.close}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <X size={20} color={COLORS.textPrimary} strokeWidth={2.4} />
          </Pressable>
        </View>

        <View style={s.body}>
          {!failed && (
            <WebView
              source={{ uri: url }}
              onLoadEnd={() => setLoading(false)}
              onError={() => { setLoading(false); setFailed(true); }}
              onHttpError={() => { setLoading(false); setFailed(true); }}
              startInLoadingState={false}
              style={s.web}
            />
          )}

          {loading && !failed && (
            <View style={s.center} pointerEvents="none">
              <ActivityIndicator color={COLORS.primary} />
            </View>
          )}

          {failed && (
            <View style={s.center}>
              <Text style={s.errTitle}>Couldn&apos;t load the policy</Text>
              <Text style={s.errBody}>
                Check your connection and try again, or read it at the address below.
              </Text>
              <Pressable
                onPress={() => Linking.openURL(url).catch(() => {})}
                accessibilityRole="link"
                style={s.errLinkWrap}
              >
                <Text style={s.errLink}>{String(url).replace(/^https?:\/\//, '')}</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  head: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  title: { flex: 1, fontSize: 17, fontFamily: FONT_FAMILY.bold, color: COLORS.textPrimary },
  close: {
    width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  body: { flex: 1 },
  web: { flex: 1, backgroundColor: COLORS.background },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: SPACING.xl, gap: 8,
    backgroundColor: COLORS.background,
  },
  errTitle: { fontSize: 16, fontFamily: FONT_FAMILY.bold, color: COLORS.textPrimary },
  errBody: { fontSize: 14, lineHeight: 20, fontFamily: FONT_FAMILY.regular, color: COLORS.textSecondary, textAlign: 'center' },
  errLinkWrap: { marginTop: 6 },
  errLink: { fontSize: 14, fontFamily: FONT_FAMILY.semibold, color: COLORS.accent },
});
