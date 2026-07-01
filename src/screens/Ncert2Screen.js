// Ncert2Screen.js
// NCERT Solutions Part-II — "Textbook Exercises" view (BLACK & WHITE theme).
// Diagnostic build: the empty state shows what was looked up, and the WebView
// reports load errors instead of silently going blank.
//
// Requires react-native-webview:  npx expo install react-native-webview
// Data import path assumes  src/screens/Ncert2Screen.js  +  src/data/...

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Platform, StatusBar,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { getNcertSolutions } from '../api/resourcesApi';

const INK = '#1C1C1E';
const PAGE_BG = '#f4f4f5';
const CARD_BG = '#ffffff';
const CARD_BORDER = '#e3e3e6';
const TITLE_INK = '#1C1C1E';
const BADGE_BG = '#ededf0';
const SEP = '#9aa0a6';
const CRUMB_LINK = '#1C1C1E';
const CRUMB_ACTIVE = '#6b7280';
const SOLUTION_BG = '#f5f5f6';
const STATUS_PAD = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44;

function UserGlyph() {
  return (
    <View style={styles.userGlyph}>
      <View style={styles.userHead} />
      <View style={styles.userBody} />
    </View>
  );
}

function buildDocument(fragmentHtml) {
  return `<!DOCTYPE html><html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<script>
  // Configure MathJax BEFORE it loads. After the initial typeset finishes,
  // wrap any equation wider than the screen in our own horizontal-scroll box.
  // (MathJax injects its own CSS, so styling mjx-container directly is
  // unreliable — a wrapper element we create cannot be overridden.)
  window.MathJax = {
    tex: { inlineMath: [['{tex}', '{/tex}']], displayMath: [] },
    startup: {
      ready: function () {
        window.MathJax.startup.defaultReady();
        window.MathJax.startup.promise.then(fitWideMath);
      }
    }
  };
  function fitWideMath() {
    try {
      var avail = document.body.clientWidth; // content width inside padding
      var nodes = document.querySelectorAll('mjx-container');
      for (var i = 0; i < nodes.length; i++) {
        var c = nodes[i];
        if (c.parentNode && c.parentNode.className === 'math-scroll') continue;
        var w = c.scrollWidth || c.getBoundingClientRect().width;
        if (w > avail + 1) {
          var box = document.createElement('span');
          box.className = 'math-scroll';
          c.parentNode.insertBefore(box, c);
          box.appendChild(c);
        }
      }
    } catch (e) {}
  }
  // Re-run if MathJax re-typesets later.
  document.addEventListener('DOMContentLoaded', function () {
    if (window.MathJax && window.MathJax.startup && window.MathJax.startup.promise) {
      window.MathJax.startup.promise.then(fitWideMath);
    }
  });
</script>
<script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
<style>
  *{ -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
  html, body{ margin:0; max-width:100%; overflow-x:hidden; }
  body{ padding:12px; background:${PAGE_BG};
        font-family:-apple-system,Roboto,"Segoe UI",sans-serif; color:${INK};
        overflow-wrap:break-word; word-break:break-word; }
  img{ max-width:100%; height:auto; border-radius:8px; filter:grayscale(100%); }
  .question-card{ background:#fff; border:1px solid ${CARD_BORDER}; border-radius:16px;
                  padding:16px; margin-bottom:16px; max-width:100%; overflow:hidden; }
  .question-header{ display:flex; justify-content:space-between; margin-bottom:10px; }
  .q-number{ background:${INK}; color:#fff; padding:4px 10px; border-radius:20px;
             font-size:12px; font-weight:600; }
  .question-text{ font-size:16px; line-height:1.7; margin-bottom:10px; max-width:100%; }
  .answer-section{ margin-top:12px; max-width:100%; }
  .solution-block{ background:${SOLUTION_BG}; padding:10px 12px; border-radius:10px;
                   margin-top:8px; border:1px solid #ededed; max-width:100%; }
  .label{ font-size:12px; font-weight:600; color:#555; margin-bottom:4px; }
  /* Our own wrapper for over-wide equations: scrolls horizontally on its own,
     so the page never stretches past the screen edge. */
  .math-scroll{ display:block; max-width:100%; overflow-x:auto;
                -webkit-overflow-scrolling:touch; }
  /* Fallbacks (use !important to beat MathJax's injected stylesheet). */
  .question-text, .solution-block{ overflow-x:auto; -webkit-overflow-scrolling:touch; }
  mjx-container{ max-width:100% !important; }
  table{ display:block; max-width:100%; overflow-x:auto; border-collapse:collapse; }
</style></head>
<body>${fragmentHtml}</body></html>`;
}

function SectionContent({ html, meta, comingSoon }) {
  const [loading, setLoading] = useState(true);

  // Locally-defined section whose content isn't added yet -> friendly placeholder.
  if (!html && comingSoon) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>{meta.label} — coming soon</Text>
        <Text style={styles.emptyHint}>
          Solutions for this section are being added and will appear here shortly.
        </Text>
      </View>
    );
  }

  // No content matched -> show what was looked up so a key/import problem is obvious.
  if (!html) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>No content found for this section.</Text>
        <View style={styles.debugBox}>
          <Text style={styles.debugLine}>subject: "{String(meta.subject)}"</Text>
          <Text style={styles.debugLine}>chapter: "{String(meta.chapter)}"</Text>
          <Text style={styles.debugLine}>section: "{String(meta.label)}"</Text>
        </View>
        <Text style={styles.emptyHint}>
          If the chapter/subject above don't exactly match a key in
          ncert2Solutions.js (capitals, spaces), that's why it's blank.
        </Text>
      </View>
    );
  }

  // Content exists -> render it; report errors instead of going blank.
  return (
    <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
      {loading && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={INK} />
          <Text style={styles.loadingTxt}>Loading {html.length} chars…</Text>
        </View>
      )}
      <WebView
        originWhitelist={['*']}
        source={{ html: buildDocument(html) }}
        onLoadEnd={() => setLoading(false)}
        onError={(e) => { setLoading(false); }}
        style={{ flex: 1, backgroundColor: PAGE_BG }}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        androidLayerType={Platform.OS === 'android' ? 'hardware' : undefined}
        renderError={(name) => (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>WebView failed to render.</Text>
            <Text style={styles.emptyHint}>
              Error: {String(name)}.{'\n'}This usually means react-native-webview
              isn't installed or linked. Run:{'\n'}npx expo install react-native-webview
            </Text>
          </View>
        )}
      />
    </View>
  );
}

function Breadcrumb({ items, currentLabel, onCrumbPress }) {
  const trail = currentLabel ? [...items, currentLabel] : items;
  return (
    <View style={styles.breadcrumb}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ alignItems: 'center' }}>
        {trail.map((label, i) => {
          const isLast = i === trail.length - 1;
          return (
            <View key={`${label}-${i}`} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.crumbLink, isLast && styles.crumbActive]}
                onPress={!isLast && onCrumbPress ? () => onCrumbPress(i) : undefined}>
                {label}
              </Text>
              {!isLast && <Text style={styles.crumbSep}>/</Text>}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function Ncert2Screen({
  subjectName,
  chapterName,
  onBack,
  part = 2,
  className = 'Class 11',
  title = 'NCERT Solutions Part-II',
  breadcrumb = ['Home', 'Student Subscription', 'Resources', 'Textbook Chapters', 'Textbook Exercises'],
  // Fallback sections ([{ key, label, html }]) shown when the API returns none —
  // used for locally-defined chapter lists (e.g. Class 6 Maths) not yet in the DB.
  localSections = null,
}) {
  // Sections are DB-backed now. Same shape the old static getNcert2Sections()
  // returned ([{ key, label, html }]), so the list + WebView render unchanged.
  // When localSections are supplied (e.g. Class 6, not yet in the DB) we show them
  // immediately and let the API enrich them in the background — never blocking on it.
  const hasLocal = !!(localSections && localSections.length);
  const [sections, setSections] = useState(localSections || []);
  const [loading, setLoading] = useState(!hasLocal);
  const [error, setError] = useState(null);
  const [retry, setRetry] = useState(0);
  const [openIndex, setOpenIndex] = useState(null);
  const active = openIndex == null ? null : sections[openIndex];

  useEffect(() => {
    let alive = true;
    setError(null);
    setOpenIndex(null);
    // Locally-defined list (e.g. Class 6 Maths, not in the DB): render it straight
    // away with no network dependency. Each section's own `html` supplies content.
    if (hasLocal) {
      setSections(localSections);
      setLoading(false);
      return () => { alive = false; };
    }
    setLoading(true);
    getNcertSolutions({ part, subject: subjectName, className, chapter: chapterName })
      .then((d) => {
        if (!alive) return;
        setSections((d && d.sections) || []);
        setLoading(false);
      })
      .catch((e) => {
        if (!alive) return;
        setError(e?.response?.data?.error || e?.message || 'Could not load solutions.');
        setLoading(false);
      });
    return () => { alive = false; };
  }, [part, subjectName, chapterName, className, retry, localSections, hasLocal]);

  const handleBack = () => {
    if (openIndex != null) setOpenIndex(null);
    else if (onBack) onBack();
  };

  return (
    <View style={styles.root}>
      <View style={styles.navbar}>
        <View style={styles.navContainer}>
          <TouchableOpacity style={styles.btnIcon} onPress={handleBack} activeOpacity={0.7}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle} numberOfLines={1}>{title}</Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.profileBtn} activeOpacity={0.7}>
            <UserGlyph />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={INK} />
          <Text style={styles.loadingTxt}>Loading solutions…</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} activeOpacity={0.8} onPress={() => setRetry((k) => k + 1)}>
            <Text style={styles.retryTxt}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : openIndex == null ? (
        <ScrollView style={{ flex: 1, backgroundColor: PAGE_BG }} contentContainerStyle={styles.scrollBody}>
          <Breadcrumb items={breadcrumb} />
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{chapterName}</Text>
            {sections.length === 0 ? (
              <Text style={styles.emptyInline}>No solutions available for this chapter yet.</Text>
            ) : sections.map((sec, i) => (
              <TouchableOpacity key={sec.key} style={styles.row} activeOpacity={0.6}
                onPress={() => setOpenIndex(i)}>
                <View style={styles.badge}><Text style={styles.badgeText}>{i + 1}</Text></View>
                <Text style={styles.rowLabel}>{sec.label}</Text>
                <View style={{ flex: 1 }} />
                <Text style={styles.rowArrow}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      ) : (
        <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
          <View style={styles.subBreadcrumbWrap}>
            <Breadcrumb items={breadcrumb} currentLabel={active.label} onCrumbPress={() => setOpenIndex(null)} />
          </View>
          <SectionContent
            html={active.html}
            comingSoon={hasLocal}
            meta={{ subject: subjectName, chapter: chapterName, label: active.label }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PAGE_BG },
  navbar: {
    backgroundColor: INK, paddingTop: STATUS_PAD + 8, paddingBottom: 14,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 6, zIndex: 10,
  },
  navContainer: {
    width: '100%', maxWidth: 720, alignSelf: 'center', paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  navTitle: { color: '#fff', fontWeight: '600', fontSize: 20, marginLeft: 6, flexShrink: 1 },
  btnIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  backArrow: { color: '#fff', fontSize: 20, lineHeight: 22, marginTop: -1 },
  profileBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  userGlyph: { width: 18, height: 18, alignItems: 'center' },
  userHead: { width: 7, height: 7, borderRadius: 3.5, borderWidth: 2, borderColor: '#fff' },
  userBody: { width: 14, height: 8, borderTopLeftRadius: 7, borderTopRightRadius: 7, borderWidth: 2, borderBottomWidth: 0, borderColor: '#fff', marginTop: 1 },
  scrollBody: { width: '100%', maxWidth: 720, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 28 },
  breadcrumb: { height: 22, marginBottom: 12, flexGrow: 0, flexShrink: 0, justifyContent: 'center' },
  subBreadcrumbWrap: { backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: '#eef1f5' },
  crumbLink: { color: CRUMB_LINK, fontSize: 14, fontWeight: '600' },
  crumbActive: { color: CRUMB_ACTIVE, fontWeight: '500' },
  crumbSep: { color: SEP, fontSize: 14, marginHorizontal: 6 },
  card: { backgroundColor: CARD_BG, borderWidth: 1, borderColor: CARD_BORDER, borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: TITLE_INK, padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#eef1f5' },
  badge: { width: 30, height: 30, borderRadius: 15, backgroundColor: BADGE_BG, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  badgeText: { color: INK, fontWeight: '700', fontSize: 14 },
  rowLabel: { fontSize: 16, color: '#3b424c' },
  rowArrow: { fontSize: 18, color: '#9aa3ad' },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  loadingTxt: { marginTop: 10, color: '#888', fontSize: 12 },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: PAGE_BG },
  retryBtn: { marginTop: 16, borderWidth: 1.5, borderColor: INK, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 20 },
  retryTxt: { color: INK, fontWeight: '700', fontSize: 14 },
  emptyInline: { color: '#888', fontSize: 14, padding: 16, paddingTop: 0 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 26 },
  emptyText: { color: '#444', fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 14 },
  debugBox: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e3e3e6', borderRadius: 10, padding: 12, width: '100%', marginBottom: 12 },
  debugLine: { color: '#1C1C1E', fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginBottom: 2 },
  emptyHint: { color: '#888', fontSize: 13, textAlign: 'center', lineHeight: 19 },
});