// Ncert2Screen.js
// NCERT Solutions Part-II — "Textbook Exercises" view (BLACK & WHITE theme).
// Diagnostic build: the empty state shows what was looked up, and the WebView
// reports load errors instead of silently going blank.
//
// Requires react-native-webview:  npx expo install react-native-webview
// Data import path assumes  src/screens/Ncert2Screen.js  +  src/data/...

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Platform, StatusBar, Animated, Easing, Pressable,
} from 'react-native';
import { COLORS } from '../theme/designSystem';
import PrimaryButton from '../components/brand/PrimaryButton';
import { FONT } from '../constants/fonts';
import { WebView } from 'react-native-webview';
import { getNcertSolutions } from '../api/resourcesApi';
import { API_BASE_URL } from '../constants/config';

// Dark reskin — this screen used to be its own deliberate "black & white" look;
// now on the app's shared dark palette like the rest of Resources.
const INK = COLORS.textPrimary;
const PAGE_BG = COLORS.background;
const CARD_BG = COLORS.card;
const CARD_BORDER = COLORS.border;
const TITLE_INK = COLORS.textPrimary;
const BADGE_BG = COLORS.glow;
const SEP = COLORS.textSecondary;
const CRUMB_LINK = COLORS.textSecondary;
const CRUMB_ACTIVE = COLORS.textPrimary;
const SOLUTION_BG = COLORS.surface;
const NAVBAR_BG = COLORS.background;
const ACCENT = COLORS.ink;          // the number pill — a dark chip, white numeral
// The rail, the wash and links were all ACCENT (ink) too, which is what made this
// page read grey: a 12%-black gradient over every card and a black spine down its
// edge. Highlights are the brand yellow; only link TEXT uses the darkened hue,
// since #FFC629 on white is 1.7:1 and unreadable as type.
const RAIL = COLORS.primary;        // #FFC629 — card spine, solution rail
const WASH = COLORS.glow;           // #FFF4CC — the card's corner tint
const LINK = COLORS.accent;         // #8A6A00 — yellow darkened until it passes
const HAIR = COLORS.border;
const STATUS_PAD = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 44;

// Cross-fade + slide between the section LIST and a section's CONTENT. Re-keyed on
// `viewKey`, so drilling in slides forward and backing out slides back — without a
// navigator, the two views would otherwise swap with a hard cut.
function Transition({ viewKey, back, children }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    a.setValue(0);
    Animated.timing(a, { toValue: 1, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [a, viewKey]);
  return (
    <Animated.View style={{
      flex: 1,
      opacity: a,
      transform: [{ translateX: a.interpolate({ inputRange: [0, 1], outputRange: [back ? -26 : 26, 0] }) }],
    }}>
      {children}
    </Animated.View>
  );
}

// A section row in the list: staggered entry, spring on press.
function SectionRow({ label, index, onPress }) {
  const enter = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1, duration: 400, delay: Math.min(60 + index * 55, 480),
      easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();
  }, [enter, index]);
  const to = (v) => Animated.spring(press, { toValue: v, friction: 7, tension: 190, useNativeDriver: true }).start();
  return (
    <Animated.View style={{
      opacity: enter,
      transform: [
        { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
        { scale: press },
      ],
    }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => to(0.985)}
        onPressOut={() => to(1)}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={styles.row}
      >
        <Animated.View style={[styles.badge, {
          transform: [{ scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }) }],
        }]}>
          <Text style={styles.badgeText}>{index + 1}</Text>
        </Animated.View>
        <Text style={styles.rowLabel}>{label}</Text>
        <View style={{ flex: 1 }} />
        <Text style={styles.rowArrow}>→</Text>
      </Pressable>
    </Animated.View>
  );
}

function UserGlyph() {
  return (
    <View style={styles.userGlyph}>
      <View style={styles.userHead} />
      <View style={styles.userBody} />
    </View>
  );
}

// Entrance stagger, generated rather than hand-written: the badge has to carry the
// SAME delay as the card it sits in, and `animation-delay: inherit` would resolve
// against .question-header (no delay set), firing every badge at once. Capped at
// the 10th card — past that a long chapter's tail would sit blank for seconds.
const STAGGER_CSS = (() => {
  const rows = [];
  for (let i = 1; i <= 9; i += 1) {
    const d = (0.02 + (i - 1) * 0.07).toFixed(2);
    rows.push(`  .question-card:nth-child(${i}), .question-card:nth-child(${i}) .q-number{ animation-delay:${d}s }`);
  }
  rows.push('  .question-card:nth-child(n+10), .question-card:nth-child(n+10) .q-number{ animation-delay:.65s }');
  return rows.join('\n');
})();

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
    tex: { inlineMath: [['\\\\(', '\\\\)']], displayMath: [] },
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
<script src="${API_BASE_URL}/vendor/mathjax-tex-mml-chtml.js"></script>
<style>
  *{ -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
  html, body{ margin:0; max-width:100%; overflow-x:hidden; }
  body{ padding:12px; background:${PAGE_BG};
        font-family:-apple-system,Roboto,"Segoe UI",sans-serif; color:${INK};
        overflow-wrap:break-word; word-break:break-word; }
  /* The solution content is server-authored HTML written for a white page — some
     of it carries its own inline/legacy dark text colours (e.g. style="color:#333"
     baked into old fragments). Force everything back to the dark palette's ink so
     it's never unreadable regardless of what the fragment itself specifies. */
  body, body *:not(.q-number):not(.q-number *) { color: ${INK} !important; }
  a { color: ${LINK} !important; }
  img{ max-width:100%; height:auto; border-radius:8px; background:#fff; }
  /* ── question card ──────────────────────────────────────────────────────
     The number is no longer a pill floating inside the card — it is notched
     into the top-left corner as a tab, and an accent rail runs down the
     leading edge, so a long scroll of solutions has a visible spine and you
     can tell at a glance where one question ends and the next begins. */
  .question-card{ position:relative; background:${CARD_BG};
                  border:1px solid ${CARD_BORDER}; border-radius:18px;
                  padding:22px 18px 18px 20px; margin:0 0 18px 0;
                  max-width:100%; overflow:hidden;
                  background-image:linear-gradient(135deg, ${WASH} 0%, transparent 46%); }
  .question-card::before{ content:''; position:absolute; left:0; top:0; bottom:0;
                          width:4px; background:${RAIL}; }
  .question-header{ display:flex; align-items:center; gap:10px; margin-bottom:12px; }
  .q-number{ display:inline-flex; align-items:center; justify-content:center;
             min-width:34px; height:34px; padding:0 11px; border-radius:11px;
             background:${ACCENT}; color:#fff; font-size:13px; font-weight:700;
             letter-spacing:0.2px; box-shadow:0 2px 8px rgba(17,17,17,0.16); }
  .question-text{ font-size:16.5px; line-height:1.68; font-weight:600;
                  margin-bottom:4px; max-width:100%; }

  /* ── solution ───────────────────────────────────────────────────────────
     Reads as a distinct answer surface rather than a slightly different grey:
     its own inset panel, its own rail, and the label promoted to a chip. */
  .answer-section{ margin-top:14px; max-width:100%; }
  .solution-block{ position:relative; background:${SOLUTION_BG};
                   padding:14px 14px 14px 16px; border-radius:14px;
                   margin-top:10px; border:1px solid ${HAIR}; max-width:100%;
                   font-size:15.5px; line-height:1.72; }
  .solution-block::before{ content:''; position:absolute; left:0; top:12px; bottom:12px;
                           width:3px; border-radius:2px; background:${RAIL}; }
  .label{ display:inline-block; font-size:10.5px; font-weight:700;
          letter-spacing:1.1px; text-transform:uppercase; color:${ACCENT};
          background:${BADGE_BG}; border:1px solid ${RAIL};
          padding:4px 10px; border-radius:999px; margin-bottom:2px; }

  /* ── entrance ───────────────────────────────────────────────────────────
     CSS, not Animated: React Native cannot drive anything inside a WebView.
     Cards rise as the document paints, staggered by position. Capped at the
     10th card — beyond that a chapter's tail would sit blank for seconds. */
  @keyframes cardIn{ from{ opacity:0; transform:translateY(14px); }
                     to  { opacity:1; transform:none; } }
  @keyframes badgePop{ from{ opacity:0; transform:scale(0.55); }
                       to  { opacity:1; transform:none; } }
  .question-card{ opacity:0; animation:cardIn .46s cubic-bezier(.22,.9,.3,1) forwards; }
  .q-number{ opacity:0; animation:badgePop .42s cubic-bezier(.34,1.56,.64,1) forwards; }
${STAGGER_CSS}
  /* Anyone who has asked the OS to stop animating gets a static page. */
  @media (prefers-reduced-motion: reduce){
    .question-card, .q-number{ animation:none !important; opacity:1 !important; transform:none !important; }
  }
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
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={styles.loadingTxt}>Loading {html.length} chars…</Text>
        </View>
      )}
      <WebView
        originWhitelist={['*']}
        source={{ html: buildDocument(html), baseUrl: API_BASE_URL }}
        onLoadEnd={() => setLoading(false)}
        onError={(e) => { setLoading(false); }}
        style={{ flex: 1, backgroundColor: PAGE_BG }}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        cacheEnabled={false}
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
      // A single section = no real choice → open its content straight away.
      setOpenIndex(localSections.length === 1 ? 0 : null);
      setLoading(false);
      return () => { alive = false; };
    }
    setLoading(true);
    getNcertSolutions({ part, subject: subjectName, className, chapter: chapterName })
      .then((d) => {
        if (!alive) return;
        const secs = (d && d.sections) || [];
        setSections(secs);
        // Chapter opens straight to its content when there's only one section
        // (e.g. Class 6 English/Science) — no pointless one-item list in between.
        setOpenIndex(secs.length === 1 ? 0 : null);
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
    // With a single section we auto-open its content, so "back" from that content
    // must return to the chapters list — not a pointless one-item section list.
    if (openIndex != null && sections.length > 1) setOpenIndex(null);
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
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={styles.loadingTxt}>Loading solutions…</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>{error}</Text>
          <PrimaryButton label="Retry" onPress={() => setRetry((k) => k + 1)} style={{ marginTop: 16 }} />
        </View>
      ) : openIndex == null ? (
        <Transition viewKey="list" back>
          <ScrollView style={{ flex: 1, backgroundColor: PAGE_BG }} contentContainerStyle={styles.scrollBody}>
            <Breadcrumb items={breadcrumb} />
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{chapterName}</Text>
              {sections.length === 0 ? (
                <Text style={styles.emptyInline}>No solutions available for this chapter yet.</Text>
              ) : sections.map((sec, i) => (
                <SectionRow key={sec.key} label={sec.label} index={i} onPress={() => setOpenIndex(i)} />
              ))}
            </View>
          </ScrollView>
        </Transition>
      ) : (
        <Transition viewKey={`sec-${openIndex}`}>
          <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
            <View style={styles.subBreadcrumbWrap}>
              <Breadcrumb items={breadcrumb} currentLabel={active.label} onCrumbPress={() => { if (sections.length > 1) setOpenIndex(null); else if (onBack) onBack(); }} />
            </View>
            <SectionContent
              html={active.html}
              comingSoon={hasLocal}
              meta={{ subject: subjectName, chapter: chapterName, label: active.label }}
            />
          </View>
        </Transition>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PAGE_BG },
  navbar: {
    backgroundColor: NAVBAR_BG, borderBottomWidth: 1, borderBottomColor: HAIR, paddingTop: STATUS_PAD + 8, paddingBottom: 14,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 6, zIndex: 10,
  },
  navContainer: {
    width: '100%', maxWidth: 720, alignSelf: 'center', paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  navTitle: { color: '#fff', fontFamily: FONT.semibold, fontSize: 20, marginLeft: 6, flexShrink: 1 },
  btnIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  backArrow: { color: '#fff', fontSize: 20, lineHeight: 22, marginTop: -1 },
  profileBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  userGlyph: { width: 18, height: 18, alignItems: 'center' },
  userHead: { width: 7, height: 7, borderRadius: 3.5, borderWidth: 2, borderColor: '#fff' },
  userBody: { width: 14, height: 8, borderTopLeftRadius: 7, borderTopRightRadius: 7, borderWidth: 2, borderBottomWidth: 0, borderColor: '#fff', marginTop: 1 },
  scrollBody: { width: '100%', maxWidth: 720, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 28 },
  breadcrumb: { height: 22, marginBottom: 12, flexGrow: 0, flexShrink: 0, justifyContent: 'center' },
  subBreadcrumbWrap: { backgroundColor: PAGE_BG, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: HAIR },
  crumbLink: { color: CRUMB_LINK, fontSize: 14, fontFamily: FONT.semibold },
  crumbActive: { color: CRUMB_ACTIVE, fontFamily: FONT.semibold },
  crumbSep: { color: SEP, fontSize: 14, marginHorizontal: 6 },
  card: { backgroundColor: CARD_BG, borderWidth: 1, borderColor: CARD_BORDER, borderRadius: 14, overflow: 'hidden' },
  cardTitle: { fontSize: 20, fontFamily: FONT.bold, color: TITLE_INK, padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, borderTopWidth: 1, borderTopColor: HAIR },
  badge: { width: 30, height: 30, borderRadius: 15, backgroundColor: BADGE_BG, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  badgeText: { color: ACCENT, fontFamily: FONT.bold, fontSize: 14 },
  rowLabel: { fontSize: 16, color: INK },
  rowArrow: { fontSize: 18, color: SEP },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  loadingTxt: { marginTop: 10, color: SEP, fontSize: 12 },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: PAGE_BG },
  emptyInline: { color: SEP, fontSize: 14, padding: 16, paddingTop: 0 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 26 },
  emptyText: { color: INK, fontSize: 16, fontFamily: FONT.bold, textAlign: 'center', marginBottom: 14 },
  debugBox: { backgroundColor: CARD_BG, borderWidth: 1, borderColor: CARD_BORDER, borderRadius: 10, padding: 12, width: '100%', marginBottom: 12 },
  debugLine: { color: INK, fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginBottom: 2 },
  emptyHint: { color: SEP, fontSize: 13, textAlign: 'center', lineHeight: 19 },
});