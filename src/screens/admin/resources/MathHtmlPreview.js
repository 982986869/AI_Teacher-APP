// src/screens/admin/resources/MathHtmlPreview.js
// Renders a question/answer's stored HTML EXACTLY as students see it — {tex}…{/tex}
// becomes MathJax, so the admin reads clean rendered math instead of raw LaTeX source.
// Mirrors the student paper renderer (ResourcesScreen buildPaperDoc) so previews match
// 1:1. Self-sizing: the page reports its height so the card grows to fit the content.
import React, { useState } from 'react';
import { Platform } from 'react-native';
import { WebView } from 'react-native-webview';

const HEAD = `
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<script>
  function report(){ try{ var h = Math.ceil(document.body.scrollHeight);
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage(String(h)); }catch(e){} }
  window.MathJax = { startup: { ready: function () {
    window.MathJax.startup.defaultReady();
    window.MathJax.startup.promise.then(function(){ fitWideMath(); report(); setTimeout(report, 200); });
  } } };
  function fitWideMath(){ try{ var avail=document.body.clientWidth;
    var nodes=document.querySelectorAll('mjx-container');
    for(var i=0;i<nodes.length;i++){ var c=nodes[i];
      if(c.parentNode && c.parentNode.className==='math-scroll') continue;
      var w=c.scrollWidth||c.getBoundingClientRect().width;
      if(w>avail+1){ var b=document.createElement('span'); b.className='math-scroll';
        c.parentNode.insertBefore(b,c); b.appendChild(c); } } }catch(e){} }
  window.addEventListener('load', function(){ report(); setTimeout(report, 400); });
</script>
<script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
<style>
  *{ -webkit-tap-highlight-color:transparent; box-sizing:border-box; }
  html,body{ margin:0; max-width:100%; overflow-x:hidden; }
  body{ padding:2px 2px; background:transparent; color:#1C1C1E;
        font-family:-apple-system,Roboto,"Segoe UI",sans-serif; font-size:15px; line-height:1.6;
        overflow-wrap:break-word; word-break:break-word; }
  img{ max-width:100%; height:auto; border-radius:6px; }
  .math-scroll{ display:block; max-width:100%; overflow-x:auto; -webkit-overflow-scrolling:touch; }
  mjx-container{ max-width:100% !important; }
  ol,ul{ padding-left:20px; } li{ margin:3px 0; }
  hr{ border:0; border-top:1px solid #e5e5ea; }
  table{ max-width:100%; border-collapse:collapse; }
  table, th, td{ border:1px solid #e5e5ea; } th,td{ padding:4px 8px; }
  .ques_text table{ display:block; overflow-x:auto; }
  p{ margin:0 0 6px; } p:last-child{ margin-bottom:0; }
  strong,b{ font-weight:700; }
</style>
`;

const toDoc = (html) =>
  `<!DOCTYPE html><html><head>${HEAD}</head><body>` +
  String(html || '').replace(/\{tex\}/g, ' \\(').replace(/\{\/tex\}/g, '\\) ') +
  `</body></html>`;

export default function MathHtmlPreview({ html, minHeight = 24 }) {
  const [height, setHeight] = useState(minHeight);
  return (
    <WebView
      originWhitelist={['*']}
      source={{ html: toDoc(html) }}
      style={{ width: '100%', height, backgroundColor: 'transparent' }}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
      scalesPageToFit={false}
      onMessage={(e) => {
        const h = Number(e.nativeEvent.data);
        if (h && Math.abs(h - height) > 2) setHeight(Math.max(minHeight, h));
      }}
      androidLayerType={Platform.OS === 'android' ? 'software' : undefined}
    />
  );
}
