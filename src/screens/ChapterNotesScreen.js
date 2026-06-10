import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, StatusBar, Platform,
  ActivityIndicator, Image,
} from 'react-native';
import { WebView } from 'react-native-webview';

// ── Local image assets ────────────────────────────────────────────────────────
// Path from src/screens/ up to project root, then into assets/images/
const blackbodyImg = require('../../assets/blackbody_radiation.png');

// ── Build full HTML page with MathJax ────────────────────────────────────────
const buildHTML = (notes, chapterName) => {
  if (!notes) return `
    <html><body style="font-family:sans-serif;padding:20px;text-align:center;color:#888;">
      <h3>Content coming soon</h3>
      <p>Notes for this chapter are being prepared.</p>
    </body></html>`;

  const sectionsHTML = notes.sections.map(sec => {
    let html = `<div class="section">`;

    // Title row with bullet
    html += `<div class="title-row">
      <span class="bullet">•</span>
      <span class="section-title">${sec.title}</span>
    </div>`;

    // Content text
    if (sec.content) {
      html += `<p class="content">${sec.content.replace(/\n/g, '<br/>')}</p>`;
    }

    // Table
    if (sec.table) {
      html += `<table class="data-table">
        <thead><tr>${sec.table.headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${sec.table.rows.map((row, ri) =>
          `<tr class="${ri % 2 === 0 ? 'even' : 'odd'}">${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`
        ).join('')}</tbody>
      </table>`;
    }

    // Inline images — placeholder img tags, src set by injectedJavaScript
    if (sec.images) {
      let imgHtml = '<div class="img-grid">';
      sec.images.forEach((imgKey, idx) => {
        const label = sec.imageLabels ? sec.imageLabels[idx] : '';
        imgHtml += '<div class="img-card">';
        imgHtml += '<img id="img_' + imgKey + '" class="graph-img" src="" />';
        if (label) imgHtml += '<p class="img-label">' + label + '</p>';
        imgHtml += '</div>';
      });
      imgHtml += '</div>';
      html += imgHtml;
    }

    // Bullets
    if (sec.bullets) {
      html += `<ul class="bullet-list">${sec.bullets.map(b => `<li>${b}</li>`).join('')}</ul>`;
    }

    // Numbered list
    if (sec.numbered) {
      html += `<ol class="numbered-list">${sec.numbered.map(b => `<li>${b}</li>`).join('')}</ol>`;
    }

    html += `</div>`;
    return html;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0"/>
  
  <!-- MathJax for rendering formulas -->
  <script>
    window.MathJax = {
      tex: {
        inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
        displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
      },
      svg: { fontCache: 'global' },
      startup: { typeset: true }
    };
  </script>
  <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js" async></script>

  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    html, body {
      max-width: 100%;
      overflow-x: hidden;
    }
    
    body {
      font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif;
      background: #ffffff;
      color: #1a1a1a;
      font-size: 15px;
      line-height: 1.6;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .chapter-header {
      padding: 16px 16px 12px;
      border-bottom: 1px solid #e0e0e0;
    }

    .chapter-title {
      font-size: 20px;
      font-weight: 800;
      color: #1a1a1a;
      margin-bottom: 4px;
    }

    .chapter-intro {
      font-size: 13px;
      color: #888;
      font-style: italic;
    }

    .section {
      padding: 14px 16px;
      border-bottom: 1px solid #f0f0f0;
      background: #fff;
    }

    .title-row {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 6px;
    }

    .bullet {
      font-size: 18px;
      font-weight: 900;
      color: #1a1a1a;
      flex-shrink: 0;
      margin-top: -1px;
    }

    .section-title {
      font-size: 15px;
      font-weight: 700;
      color: #1a1a1a;
      line-height: 1.4;
    }

    .content {
      font-size: 14px;
      color: #333;
      line-height: 1.65;
      padding-left: 24px;
      margin-top: 4px;
      margin-bottom: 4px;
    }

    .bullet-list {
      padding-left: 36px;
      margin-top: 6px;
    }

    .bullet-list li {
      font-size: 14px;
      color: #333;
      line-height: 1.65;
      margin-bottom: 4px;
      list-style-type: circle;
    }

    .numbered-list {
      padding-left: 36px;
      margin-top: 6px;
    }

    .numbered-list li {
      font-size: 14px;
      color: #333;
      line-height: 1.65;
      margin-bottom: 4px;
    }

    /* Tables */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      margin-left: 24px;
      width: calc(100% - 24px);
      max-width: calc(100% - 24px);
      font-size: 13px;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #d0d0d0;
      table-layout: fixed;
      word-break: break-word;
    }

    .data-table th {
      background: #1a1a1a;
      color: #fff;
      padding: 8px 10px;
      text-align: left;
      font-weight: 700;
      font-size: 12px;
      word-break: break-word;
    }

    .data-table td {
      padding: 8px 10px;
      border-bottom: 1px solid #e8e8e8;
      color: #333;
      word-break: break-word;
    }

    .data-table tr.even { background: #f9f9f9; }
    .data-table tr.odd  { background: #ffffff; }

    /* MathJax override */
    mjx-container {
      font-size: 14px !important;
      max-width: 100% !important;
      overflow-x: auto !important;
    }

    .MathJax {
      max-width: 100% !important;
      overflow-x: auto !important;
    }

    .math-block {
      overflow-x: auto;
      padding: 8px 24px;
      background: #f7f7f7;
      border-left: 3px solid #1a1a1a;
      margin: 8px 0 8px 24px;
      border-radius: 4px;
      max-width: calc(100% - 24px);
    }

    /* Graph images */
    .img-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      padding-left: 24px;
      margin-top: 10px;
      margin-bottom: 6px;
    }

    .img-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      max-width: 100%;
    }

    .graph-img {
      max-width: 100%;
      width: auto;
      height: auto;
      max-height: 260px;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
      background: #fafafa;
      object-fit: contain;
    }

    .img-label {
      font-size: 12px;
      color: #555;
      text-align: center;
      margin-top: 6px;
      font-style: italic;
      max-width: 100%;
    }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="chapter-header">
    <div class="chapter-title">${chapterName}</div>
    ${notes.intro ? `<div class="chapter-intro">${notes.intro}</div>` : ''}
  </div>
  ${sectionsHTML}
  <div style="height:40px;"></div>
</body>
</html>`;
};

// ── Main Component ────────────────────────────────────────────────────────────
const ChapterNotesScreen = ({ chapterName, notes, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [injectJS, setInjectJS] = useState('true;');

  // Resolve asset URI after mount (guarantees bundle is ready)
  useEffect(() => {
    try {
      const resolved = Image.resolveAssetSource(blackbodyImg);
      if (resolved && resolved.uri) {
        const uri = resolved.uri;
        const js = `(function(){
          var el = document.getElementById('img_blackbody_radiation');
          if (el) { el.src = '${uri}'; }
        })(); true;`;
        setInjectJS(js);
      }
    } catch (e) {
      console.warn('resolveAssetSource failed:', e);
    }
  }, []);

  const html = buildHTML(notes, chapterName);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {Platform.OS === 'android' && <View style={{ height: 24, backgroundColor: '#fff' }} />}

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backRow}>
          <Text style={s.backArrow}>←</Text>
          <Text style={s.backTxt}>Back</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{chapterName}</Text>
      </View>

      {/* WebView */}
      <View style={{ flex: 1 }}>
        {loading && (
          <View style={s.loadingOverlay}>
            <ActivityIndicator size="large" color="#1C1C1E" />
            <Text style={s.loadingTxt}>Loading notes...</Text>
          </View>
        )}
        <WebView
          source={{ html }}
          style={{ flex: 1, opacity: loading ? 0 : 1 }}
          onLoadEnd={() => setLoading(false)}
          injectedJavaScript={injectJS}
          scrollEnabled
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          horizontal={false}
          originWhitelist={['*']}
          mixedContentMode="always"
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState={false}
          scalesPageToFit={false}
        />
      </View>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: '#fff' },
  header:         { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', gap: 12 },
  backRow:        { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backArrow:      { fontSize: 18, color: '#1C1C1E', fontWeight: '600' },
  backTxt:        { fontSize: 14, fontWeight: '600', color: '#1C1C1E' },
  headerTitle:    { flex: 1, fontSize: 15, fontWeight: '700', color: '#1C1C1E', letterSpacing: -0.2 },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', zIndex: 10 },
  loadingTxt:     { marginTop: 12, fontSize: 14, color: '#8E8E93', fontWeight: '600' },
});

export default ChapterNotesScreen;