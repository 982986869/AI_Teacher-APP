// src/screens/AdminWebViewScreen.js
// Admin accounts don't get a native mobile dashboard — the full Admin Portal is the
// separate Next.js web app (admin/). This screen embeds that portal in a WebView so an
// admin manages everything from inside this app. The app's JWT is injected into the
// portal's localStorage before its JS runs, so the portal auto-authenticates (same
// {sub:userId} token + secret the portal's own /auth/login mints) — no second login.
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Platform, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { RefreshCw, LogOut, TriangleAlert } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { resolveAdminPortalUrl } from '../constants/adminPortal';

const C = { bar: '#151829', barLine: '#2A2E45', bg: '#0B0B0D', ink: '#fff', muted: '#9A9AA0', indigo: '#4F46E5' };
const TOKEN_KEY = 'ailernova_admin_token';

export default function AdminWebViewScreen() {
  const insets = useSafeAreaInsets();
  const { token, user, signOut } = useAuth();
  const url = useMemo(() => resolveAdminPortalUrl(), []);
  const webRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Seed the portal's auth token BEFORE its scripts run → boot() finds it and calls
  // /auth/me, so the admin lands straight on the dashboard.
  const injectBefore = useMemo(() => {
    if (!token) return 'true;';
    return `(function(){try{window.localStorage.setItem(${JSON.stringify(TOKEN_KEY)}, ${JSON.stringify(String(token))});}catch(e){}})(); true;`;
  }, [token]);

  const reload = useCallback(() => {
    setError(false);
    setLoading(true);
    webRef.current && webRef.current.reload();
  }, []);

  return (
    <View style={[st.wrap, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.bar} />
      <View style={st.bar}>
        <View style={{ flex: 1 }}>
          <Text style={st.title} numberOfLines={1}>Admin console</Text>
          <Text style={st.sub} numberOfLines={1}>{user?.email || 'Ailernova Admin Portal'}</Text>
        </View>
        <TouchableOpacity onPress={reload} style={st.iconBtn} accessibilityRole="button" accessibilityLabel="Reload">
          <RefreshCw size={17} color={C.muted} strokeWidth={2.4} />
        </TouchableOpacity>
        <TouchableOpacity onPress={signOut} style={st.logout} accessibilityRole="button" accessibilityLabel="Log out">
          <LogOut size={14} color="#C7C7CD" strokeWidth={2.4} />
          <Text style={st.logoutTxt}>Log out</Text>
        </TouchableOpacity>
      </View>

      <View style={st.body}>
        {error ? (
          <View style={st.center}>
            <View style={st.errIcon}><TriangleAlert size={30} color={C.indigo} strokeWidth={2} /></View>
            <Text style={st.errTitle}>Can't reach the Admin Portal</Text>
            <Text style={st.errMsg}>
              The portal at{'\n'}
              <Text style={st.url}>{url}</Text>{'\n'}
              is not responding. Make sure it's running (cd admin && npm run dev), or set
              EXPO_PUBLIC_ADMIN_URL to its hosted address.
            </Text>
            <TouchableOpacity onPress={reload} style={st.retry} accessibilityRole="button" accessibilityLabel="Try again">
              <RefreshCw size={16} color="#fff" strokeWidth={2.5} />
              <Text style={st.retryTxt}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <WebView
              ref={webRef}
              source={{ uri: url }}
              originWhitelist={['*']}
              javaScriptEnabled
              domStorageEnabled
              sharedCookiesEnabled
              thirdPartyCookiesEnabled
              injectedJavaScriptBeforeContentLoaded={injectBefore}
              onLoadEnd={() => setLoading(false)}
              onError={() => { setLoading(false); setError(true); }}
              onHttpError={(e) => {
                // Only fail on a main-document error (ignore subresource hiccups).
                const ne = e.nativeEvent || {};
                if (ne.url && ne.url.split('?')[0].replace(/\/$/, '') === url.replace(/\/$/, '') && ne.statusCode >= 500) {
                  setError(true);
                }
              }}
              style={{ flex: 1, backgroundColor: C.bg, opacity: loading ? 0 : 1 }}
            />
            {loading && (
              <View style={[st.center, StyleSheet.absoluteFill]} pointerEvents="none">
                <ActivityIndicator size="large" color={C.indigo} />
                <Text style={st.loadingTxt}>Opening Admin Portal…</Text>
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bar },
  bar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: C.bar, borderBottomWidth: 1, borderBottomColor: C.barLine,
  },
  title: { color: C.ink, fontSize: 16, fontWeight: '900', letterSpacing: -0.3 },
  sub: { color: C.muted, fontSize: 11.5, fontWeight: '600', marginTop: 1 },
  iconBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1E2236' },
  logout: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, borderColor: C.barLine },
  logoutTxt: { color: '#C7C7CD', fontSize: 12, fontWeight: '800' },

  body: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10, backgroundColor: C.bg },
  loadingTxt: { color: C.muted, fontSize: 13, fontWeight: '700', marginTop: 14 },

  errIcon: { width: 68, height: 68, borderRadius: 22, backgroundColor: '#1A1D2E', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  errTitle: { color: C.ink, fontSize: 18, fontWeight: '900' },
  errMsg: { color: C.muted, fontSize: 13, fontWeight: '600', textAlign: 'center', lineHeight: 21, maxWidth: 340 },
  url: { color: C.indigo, fontWeight: '800' },
  retry: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.indigo, paddingVertical: 13, paddingHorizontal: 26, borderRadius: 14 },
  retryTxt: { color: '#fff', fontWeight: '800', fontSize: 14.5 },
});
