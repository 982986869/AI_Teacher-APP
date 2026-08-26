// src/screens/parent/ParentApp/TrialBookingEmbed.js
// "Book a free class" — Calendly's own booking page, shown inside the app.
//
// Why an embed rather than our own form: BookTrial.js collects everything and then
// drops it (no persistence), and its time slots are hardcoded decoration with no
// teacher behind them. Calendly brings a real calendar, real availability, a Google
// Meet link and a confirmation email for free. What it does NOT bring is the lead
// landing in our database — that needs Calendly's paid API, so for now the booking
// lives only in Calendly.
//
// Nothing here is a secret. An embed is just the public booking URL in a frame, which
// is exactly why it needs no API key and works on the free plan.
import React, { useEffect, useState } from 'react';
import { View, Modal, ActivityIndicator, Platform, StyleSheet } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { C, T } from './constants';
import { PressableScale } from './anim';

const CALENDLY_URL = 'https://calendly.com/kidsailernova/30min';
// hide_gdpr_banner drops the cookie bar, which otherwise eats the top third of a phone
// screen. utm_source lets Calendly show us which bookings came from inside the app as
// opposed to a link shared on WhatsApp.
const EMBED_URL = `${CALENDLY_URL}?hide_gdpr_banner=1&utm_source=app`;

// react-native-webview ships Android and iOS builds only — its lib/ has WebView.android.js
// and WebView.ios.js and no web entry at all, and Expo's SDK 54 docs list the package as
// Android/iOS. The deployed build IS the web one, so a WebView here would render an empty
// screen in the very place this is meant to work. Web therefore gets a plain iframe, which
// is all Calendly's own "inline embed" is underneath.
function Frame({ onReady }) {
  if (Platform.OS === 'web') {
    return React.createElement('iframe', {
      src: EMBED_URL,
      title: 'Book a free trial class',
      onLoad: onReady,
      style: { border: 'none', width: '100%', height: '100%' },
    });
  }
  // Required lazily: on web this module is never evaluated, so its missing native
  // component can't throw at import time.
  const { WebView } = require('react-native-webview');
  return <WebView source={{ uri: EMBED_URL }} onLoadEnd={onReady} style={{ flex: 1 }} />;
}

export default function TrialBookingEmbed({ visible, onClose }) {
  const [loading, setLoading] = useState(true);
  // Re-arm on each open. The component is not unmounted between visits, so without this
  // a second visit shows a blank frame with no spinner while Calendly loads again.
  useEffect(() => { if (visible) setLoading(true); }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={s.screen}>
        <View style={s.header}>
          <PressableScale style={s.back} onPress={onClose} accessibilityLabel="Go back">
            <ArrowLeft size={24} color={C.ink} />
          </PressableScale>
          <T w="bold" s={20} c={C.ink}>Book a free class</T>
        </View>

        <View style={s.body}>
          <Frame onReady={() => setLoading(false)} />
          {loading && (
            // pointerEvents="none" so the overlay never swallows a tap meant for the
            // frame underneath if onLoad is slow or never fires.
            <View style={s.loader} pointerEvents="none">
              <ActivityIndicator size="large" color={C.ink} />
              <T w="med" s={14} c={C.muted} style={{ marginTop: 12 }}>Loading available slots…</T>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg, paddingTop: Platform.OS === 'android' ? 28 : 0 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12 },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  body: { flex: 1 },
  loader: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
});
